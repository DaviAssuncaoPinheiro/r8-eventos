import * as React from 'react'
import { Plus, Zap } from 'lucide-react'
import { PageHeader } from '@/app/PageHeader'
import type { AutomationRun } from '@/domain/types'
import {
  getAutomationLog,
  getAutomationPending,
  getAutomationSummary,
  listAutomations,
  runAutomationsNow,
  simulateNextRun,
  toggleAutomation,
  useQuery,
  useSettings,
  type AutomationSummary,
} from '@/services'
import { AiTag, Banner, Button, Dialog, EmptyState, Skeleton, cn, notify } from '@/ui'
import { RollingMoney, RollingNumber, Stagger, celebrate } from '@/ui/Motion'
import { LiveToggle, RunTimeline, type LiveStatus } from './components/Activity'
import { AutomationCard } from './components/AutomationCard'
import { AutomationDrawer } from './components/AutomationDrawer'
import { NewAutomation } from './components/NewAutomation'
import { OpeningSkeleton, openingBlocks } from './components/Opening'

const LIVE_EVERY_MS = 12000
const REVEAL_GAP_MS = 120
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Soma de uma execução ao resumo (o mesmo cálculo do serviço, para o contador rolar na hora em que o item entra). */
function addRuns(base: AutomationSummary, runs: AutomationRun[]): AutomationSummary {
  const minutes = runs.reduce((a, r) => a + r.minutesSaved, 0)
  return {
    ...base,
    runsToday: base.runsToday + runs.length,
    runsMonth: base.runsMonth + runs.length,
    moneyMonth: Math.round((base.moneyMonth + runs.reduce((a, r) => a + (r.value ?? 0), 0)) * 100) / 100,
    hoursSavedMonth: Math.round((base.hoursSavedMonth + minutes / 60) * 10) / 10,
  }
}

interface Recap {
  count: number
  seconds: number
  money: number
  hours: number
}

export default function Automacoes() {
  const { aiEnabled } = useSettings()
  const autosQ = useQuery(listAutomations, [])
  const sumQ = useQuery(getAutomationSummary, [])
  const logQ = useQuery(() => getAutomationLog({ limit: 60 }), [])
  const pendQ = useQuery(getAutomationPending, [])

  const autos = autosQ.data
  const log = logQ.data
  const pending = pendQ.data?.total ?? 0

  /* "ao vivo", pausar e "tudo em dia" */
  const [live, setLive] = React.useState(true)
  const [caughtUp, setCaughtUp] = React.useState(false)
  const status: LiveStatus = caughtUp ? 'uptodate' : live ? 'live' : 'paused'

  /* o que a atividade já mostra; execuções novas ficam guardadas até entrarem uma a uma */
  const [shown, setShown] = React.useState<Set<string> | null>(null)
  const [fresh, setFresh] = React.useState<Set<string>>(new Set())
  const [batch, setBatch] = React.useState<{ base: AutomationSummary; runs: AutomationRun[] } | null>(null)
  const [pulseId, setPulseId] = React.useState<string>()
  const [newId, setNewId] = React.useState<string>()
  const [running, setRunning] = React.useState(false)
  const [recap, setRecap] = React.useState<Recap | null>(null)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [togglingId, setTogglingId] = React.useState<string>()

  const gate = React.useRef(false)
  const busy = React.useRef(false)
  const alive = React.useRef(true)
  const logRef = React.useRef(log)
  const sumRef = React.useRef(sumQ.data)
  const runBtn = React.useRef<HTMLButtonElement>(null)
  logRef.current = log
  sumRef.current = sumQ.data
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const markFresh = React.useCallback((ids: string[]) => {
    setFresh((p) => new Set([...p, ...ids]))
    window.setTimeout(() => setFresh((p) => new Set([...p].filter((x) => !ids.includes(x)))), 2600)
  }, [])

  React.useEffect(() => {
    if (!log) return
    if (shown === null) return setShown(new Set(log.map((r) => r.id)))
    if (gate.current) return
    const add = log.filter((r) => !shown.has(r.id)).map((r) => r.id)
    if (!add.length) return
    setShown(new Set([...shown, ...add]))
    if (add.length <= 8) markFresh(add)
  }, [log, shown, markFresh])

  React.useEffect(() => {
    if (caughtUp && pending > 0) setCaughtUp(false)
  }, [caughtUp, pending])

  const waitFor = async (ok: () => boolean) => {
    for (let i = 0; i < 60 && !ok(); i++) await sleep(50)
  }

  /** Faz as execuções entrarem uma a uma na atividade; os contadores rolam a cada uma. */
  const reveal = async (runs: AutomationRun[], gap: number) => {
    await waitFor(() => runs.every((r) => logRef.current?.some((x) => x.id === r.id)))
    for (const r of runs) {
      if (gap) await sleep(gap)
      if (!alive.current) return
      setShown((p) => new Set([...(p ?? []), r.id]))
      markFresh([r.id])
      setBatch((b) => (b ? { ...b, runs: [...b.runs, r] } : b))
      setPulseId(r.automationId)
      window.setTimeout(() => setPulseId((p) => (p === r.automationId ? undefined : p)), 1300)
    }
  }

  const beginBatch = () => {
    busy.current = true
    gate.current = true
    if (sumRef.current) setBatch({ base: sumRef.current, runs: [] })
  }
  const endBatch = async (expected: number) => {
    const base = batch?.base ?? sumRef.current
    if (base) await waitFor(() => (sumRef.current?.runsMonth ?? 0) >= base.runsMonth + expected)
    await sleep(500)
    gate.current = false
    busy.current = false
    if (alive.current) setBatch(null)
  }

  const tick = async () => {
    if (busy.current || document.visibilityState !== 'visible') return
    const base = sumRef.current
    busy.current = true
    gate.current = true
    if (base) setBatch({ base, runs: [] })
    let produced = 0
    try {
      const run = await simulateNextRun()
      if (!run) {
        setCaughtUp(true)
      } else {
        produced = 1
        await reveal([run], 0)
        notify.success(run.text)
      }
    } catch {
      /* uma falha na consulta ao vivo não interrompe a tela; tenta no próximo ciclo */
    } finally {
      if (base) await waitFor(() => (sumRef.current?.runsMonth ?? 0) >= base.runsMonth + produced)
      await sleep(400)
      gate.current = false
      busy.current = false
      if (alive.current) setBatch(null)
    }
  }
  const tickRef = React.useRef(tick)
  tickRef.current = tick
  React.useEffect(() => {
    if (!live || caughtUp) return
    const id = window.setInterval(() => void tickRef.current(), LIVE_EVERY_MS)
    return () => window.clearInterval(id)
  }, [live, caughtUp])

  const runNow = async () => {
    if (busy.current) return
    setRunning(true)
    beginBatch()
    const t0 = performance.now()
    let produced = 0
    try {
      const runs = await runAutomationsNow()
      produced = runs.length
      if (!runs.length) {
        notify.info('Nada pendente')
        return
      }
      await reveal(runs, REVEAL_GAP_MS)
      const money = runs.reduce((a, r) => a + (r.value ?? 0), 0)
      setRecap({ count: runs.length, seconds: Math.max(1, Math.round((performance.now() - t0) / 1000)), money, hours: Math.round((runs.reduce((a, r) => a + r.minutesSaved, 0) / 60) * 10) / 10 })
      if (money > 0) celebrate(runBtn.current ?? undefined)
    } catch {
      notify.error('Não foi possível rodar as automações. Tente de novo.')
    } finally {
      setRunning(false)
      await endBatch(produced)
    }
  }

  const toggle = async (id: string, enabled: boolean) => {
    setTogglingId(id)
    try {
      await toggleAutomation(id, enabled)
      notify.success(enabled ? 'Automação ligada' : 'Automação desligada')
    } catch {
      notify.error('Não foi possível alterar. Tente de novo.')
    } finally {
      setTogglingId(undefined)
    }
  }

  const onLiveToggle = () => {
    if (caughtUp) return setCaughtUp(false)
    setLive((v) => !v)
  }

  const summary = batch ? addRuns(batch.base, batch.runs) : sumQ.data
  const visibleLog = React.useMemo(() => (log && shown ? log.filter((r) => shown.has(r.id)) : []), [log, shown])
  const opened = autos?.find((a) => a.id === openId) ?? null

  const runLabel = (
    <>
      Rodar agora
      {pending > 0 ? <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-pill bg-on-accent px-2 text-caption font-semibold text-accent-active tnum">{pending}</span> : null}
    </>
  )

  const header = (
    <PageHeader
      title="Automações"
      actions={
        <>
          <Button ref={runBtn} variant="primary" size="lg" icon={Zap} loading={running} onClick={runNow} className="max-sm:hidden">
            {runLabel}
          </Button>
          <Button variant="secondary" size="lg" icon={Plus} onClick={() => setCreating(true)}>
            Nova automação
          </Button>
        </>
      }
    />
  )

  const failed = (autosQ.error && !autos) || (sumQ.error && !sumQ.data) || (logQ.error && !log)
  if (failed) {
    return (
      <>
        {header}
        <Banner
          tone="danger"
          title="Não foi possível carregar as automações."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void autosQ.refetch()
                void sumQ.refetch()
                void logQ.refetch()
              }}
            >
              Tentar de novo
            </Button>
          }
        />
      </>
    )
  }

  const loading = !autos || !summary || !log || !shown

  return (
    <div className="max-sm:pb-24">
      {header}

      {loading ? (
        <>
          <OpeningSkeleton />
          <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:col-span-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[250px] rounded-card bg-raised p-5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-4 h-5 w-2/3" />
                  <Skeleton shape="block" className="mt-6 h-[76px]" />
                </div>
              ))}
            </div>
            <div className="h-[520px] rounded-card bg-raised p-5 @min-[1180px]/frame:col-span-4">
              <Skeleton className="h-5 w-32" />
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="mt-4 h-11 rounded-pill" />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-4 @min-[1180px]/frame:grid-cols-4">{openingBlocks(summary, status)}</Stagger>

          <div className="mt-4 grid grid-cols-1 items-start gap-4 @min-[1180px]/frame:grid-cols-12">
            <Stagger delay={0.15} className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:col-span-8">
              {autos.map((a) => (
                <AutomationCard key={a.id} a={a} pulse={pulseId === a.id} isNew={newId === a.id} busy={togglingId === a.id} onOpen={() => setOpenId(a.id)} onToggle={(en) => void toggle(a.id, en)} />
              ))}
            </Stagger>

            <section aria-label="Atividade" className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:sticky @min-[1180px]/frame:top-4 @min-[1180px]/frame:col-span-4">
              <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-title-sub">
                  Atividade
                  {aiEnabled ? <AiTag /> : null}
                </h2>
                <LiveToggle status={status} onToggle={onLiveToggle} />
              </div>
              {visibleLog.length ? (
                <div className="-mx-2 max-h-[560px] overflow-y-auto overscroll-contain px-0 max-sm:max-h-[480px]" tabIndex={0} aria-label="Execuções, mais recentes primeiro">
                  <RunTimeline runs={visibleLog} autos={autos} fresh={fresh} />
                </div>
              ) : (
                <EmptyState icon={Zap} title="As execuções aparecem aqui" action={<Button variant="primary" size="sm" onClick={runNow} loading={running}>Rodar agora</Button>} />
              )}
            </section>
          </div>
        </>
      )}

      {/* celular: botão fixo no rodapé */}
      <div className="fixed inset-x-4 bottom-4 z-30 sm:hidden">
        <Button variant="primary" size="lg" block icon={Zap} loading={running} onClick={runNow} className="shadow-overlay">
          {runLabel}
        </Button>
      </div>

      <AutomationDrawer auto={opened} onClose={() => setOpenId(null)} />
      <NewAutomation open={creating} onOpenChange={setCreating} onCreated={(id) => setNewId(id)} />

      <Dialog
        open={!!recap}
        onOpenChange={(o) => !o && setRecap(null)}
        size="sm"
        title="Feito"
        footer={
          <Button variant="primary" onClick={() => setRecap(null)}>
            Fechar
          </Button>
        }
      >
        {recap ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-title-sub">
              {plural(recap.count, 'ação', 'ações')} em {plural(recap.seconds, 'segundo', 'segundos')}
            </p>
            {recap.money > 0 ? (
              <span className={cn('text-kpi-lg text-ok-ink')}>
                <RollingMoney value={recap.money} />
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-pill bg-sunken px-3 py-1 text-body font-semibold text-fg-2 tnum">
              <RollingNumber value={recap.hours} decimals={1} suffix=" h" className="inline-flex" />
              <span className="font-medium"> poupadas</span>
            </span>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
