import * as React from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { ArrowUpFromLine, Inbox, LayoutGrid, List, Send, Settings2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Chip, Empty, IconCircle, PageHeader, Segmented } from '@/components/ui'
import { KPIS } from '@/data/mock'
import { ZONES, type ZoneId } from '@/data/geo'
import { daysFromToday } from '@/data/time'
import { AVISO_KIND } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { enrich, GROUP_DOT, GROUPS, type AvisoKind, type GroupKey, type Item } from '@/components/avisos/data'
import { Panel as Drawer, useIsDesktop } from '@/components/avisos/Panel'
import { BoardCard, ListRow } from '@/components/avisos/AvisoItem'
import { AvisoDetail } from '@/components/avisos/AvisoDetail'
import { INITIAL_RULES, RulesPanel } from '@/components/avisos/RulesPanel'

const KINDS = Object.keys(AVISO_KIND) as AvisoKind[]
const EASE = [0.16, 1, 0.3, 1] as const

export default function Avisos() {
  const avisos = useDemo((s) => s.avisos)
  const setStatus = useDemo((s) => s.setAvisoStatus)
  const desktop = useIsDesktop()
  const [view, setView] = React.useState<'quadro' | 'lista'>('quadro')
  const effective = desktop ? view : 'lista'
  const [kind, setKind] = React.useState<AvisoKind | 'todos'>('todos')
  const [zone, setZone] = React.useState<ZoneId | 'todas'>('todas')
  const [selId, setSelId] = React.useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const [rules, setRules] = React.useState(INITIAL_RULES)
  const [hour, setHour] = React.useState('09:00')
  const [email, setEmail] = React.useState(true)
  const [custom, setCustom] = React.useState<Record<string, string>>({})
  const [flash, setFlash] = React.useState<Set<string>>(new Set())
  const [sending, setSending] = React.useState(false)

  const all = React.useMemo(() => enrich(avisos), [avisos])
  const items = React.useMemo(() => all.filter((i) => (kind === 'todos' || i.a.kind === kind) && (zone === 'todas' || i.zone === zone)), [all, kind, zone])
  const byGroup = React.useMemo(() => {
    const m: Record<GroupKey, Item[]> = { 'sem-resposta': [], enviar: [], enviados: [], confirmados: [] }
    items.forEach((i) => m[i.group].push(i))
    return m
  }, [items])
  const selected = all.find((i) => i.a.id === selId) ?? null

  // relatórios de limpeza saem sozinhos quando a equipe finaliza; o lote cobre o resto
  const batch = all.filter((i) => (i.a.status === 'programado' && i.a.kind !== 'limpeza' && daysFromToday(i.a.sendDate) <= 10) || i.a.status === 'sem-resposta')

  const sendBatch = () => {
    if (sending) return
    if (!batch.length) {
      toast('Nenhuma mensagem pendente', { description: 'Tudo já foi enviado.' })
      return
    }
    setSending(true)
    const ids = batch.map((i) => i.a.id)
    ids.forEach((id, n) => {
      window.setTimeout(() => {
        setStatus(id, 'enviado')
        setFlash((f) => new Set(f).add(id))
        window.setTimeout(
          () =>
            setFlash((f) => {
              const x = new Set(f)
              x.delete(id)
              return x
            }),
          1100,
        )
        if (n === ids.length - 1) {
          setSending(false)
          toast.success(`${ids.length} mensagens enviadas`, { description: 'Entregues pelo WhatsApp Business.' })
        }
      }, 260 * n)
    })
  }

  const montagens = all.filter((i) => i.a.kind === 'montagem')
  const montOk = montagens.filter((i) => i.a.status === 'confirmado').length
  const pendentes = all.filter((i) => (i.a.kind === 'retirada' || i.a.kind === 'renovacao') && (i.a.status === 'sem-resposta' || i.a.status === 'lido'))
  const filtersActive = kind !== 'todos' || zone !== 'todas'

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-2 pb-28 md:px-6 md:pt-4 md:pb-8">
      <PageHeader
        title="Avisos"
        description="Mensagens de WhatsApp para os clientes das locações"
        actions={
          <>
            <Button variant="outline" size="lg" className="h-11 px-5 text-[14px]" onClick={() => setRulesOpen(true)}>
              <Settings2 size={16} strokeWidth={1.9} /> Regras
            </Button>
            <Button variant="primary" size="lg" className="h-11 px-5 text-[14px]" onClick={sendBatch} disabled={sending}>
              <Send size={16} strokeWidth={1.9} /> Enviar lote{batch.length > 0 && ` (${batch.length})`}
            </Button>
          </>
        }
      />

      {/* indicadores */}
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="flex flex-col rounded-[28px] bg-black p-5 text-white sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[13.5px] font-medium text-white/60">Relatórios abertos pelos clientes</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="num text-[52px] leading-none font-bold tracking-[-0.04em]">{Math.round(KPIS.reportsOpened * 100)}</span>
                <span className="text-[22px] font-bold text-white/70">%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-medium text-white/60">Resposta ao QR</div>
              <div className="num mt-2 text-[26px] leading-none font-bold tracking-[-0.02em]">{KPIS.avgResponseH.toLocaleString('pt-BR')} h</div>
              <div className="num mt-1 text-[12px] font-medium text-white/45">antes {KPIS.avgResponseHPrev.toLocaleString('pt-BR')} h</div>
            </div>
          </div>
          <div className="mt-auto pt-5">
            <div className="h-2 overflow-hidden rounded-full bg-white/12">
              <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${KPIS.reportsOpened * 100}%` }} transition={{ duration: 1, ease: EASE }} />
            </div>
            <div className="mt-2.5 flex justify-between text-[12.5px] font-medium text-white/55">
              <span>Links de limpeza enviados no mês</span>
              <span className="num">{KPIS.cleaningsMonth} enviados</span>
            </div>
          </div>
        </motion.section>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
          onClick={() => setKind(kind === 'montagem' ? 'todos' : 'montagem')}
          className={cn('flex flex-col rounded-[28px] bg-card p-5 text-left shadow-card transition-shadow hover:shadow-lift sm:p-6', kind === 'montagem' && 'ring-2 ring-black')}
        >
          <IconCircle tone="blue" size={40}>
            <Truck size={18} strokeWidth={1.9} />
          </IconCircle>
          <div className="mt-auto pt-6 text-[13.5px] font-medium text-ink-3">Montagens confirmadas</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="num text-[34px] leading-none font-bold tracking-[-0.03em] text-ink">{montOk}</span>
            <span className="num text-[16px] font-semibold text-ink-3">de {montagens.length}</span>
          </div>
          <div className="mt-2 text-[12.5px] font-medium text-ink-3">Hoje e amanhã, com horário e acesso combinados</div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
          onClick={() => setKind(kind === 'retirada' ? 'todos' : 'retirada')}
          className={cn('flex flex-col rounded-[28px] bg-card p-5 text-left shadow-card transition-shadow hover:shadow-lift sm:p-6', kind === 'retirada' && 'ring-2 ring-black')}
        >
          <IconCircle tone={pendentes.length ? 'red' : 'green'} size={40}>
            <ArrowUpFromLine size={18} strokeWidth={1.9} />
          </IconCircle>
          <div className="mt-auto pt-6 text-[13.5px] font-medium text-ink-3">Retiradas e renovações sem resposta</div>
          <div className="num mt-1 text-[34px] leading-none font-bold tracking-[-0.03em] text-ink">{pendentes.length}</div>
          <div className="mt-2 text-[12.5px] font-medium text-ink-3">{pendentes.length ? 'Vale uma ligação antes de mandar o caminhão' : 'Tudo respondido'}</div>
        </motion.button>
      </div>

      {/* filtros */}
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="no-scrollbar -mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
            <Chip active={kind === 'todos'} onClick={() => setKind('todos')} className="shrink-0">
              Todos <span className="num opacity-60">{all.length}</span>
            </Chip>
            {KINDS.map((k) => (
              <Chip key={k} active={kind === k} onClick={() => setKind(kind === k ? 'todos' : k)} className="shrink-0">
                {AVISO_KIND[k].label}
                <span className="num opacity-60">{all.filter((i) => i.a.kind === k).length}</span>
              </Chip>
            ))}
          </div>
          <Segmented
            className="hidden shrink-0 lg:inline-flex"
            size="md"
            value={view}
            onChange={setView}
            options={[
              {
                value: 'quadro',
                label: (
                  <>
                    <LayoutGrid size={14} strokeWidth={1.9} /> Quadro
                  </>
                ),
              },
              {
                value: 'lista',
                label: (
                  <>
                    <List size={14} strokeWidth={1.9} /> Lista
                  </>
                ),
              },
            ]}
          />
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
          {ZONES.map((z) => (
            <Chip key={z.id} active={zone === z.id} onClick={() => setZone(zone === z.id ? 'todas' : z.id)} color={z.hex} className="shrink-0">
              {z.short}
            </Chip>
          ))}
          {filtersActive && (
            <button
              onClick={() => {
                setKind('todos')
                setZone('todas')
              }}
              className="ml-1 h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold text-ink-2 hover:bg-muted hover:text-ink"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <LayoutGroup>
        {items.length === 0 ? (
          <Card className="mt-5">
            <Empty icon={<Inbox size={24} strokeWidth={1.8} />} title="Nenhum aviso">
              Tente outro filtro.
            </Empty>
          </Card>
        ) : effective === 'quadro' ? (
          <div className="mt-4 grid grid-cols-2 items-start gap-3 xl:grid-cols-4">
            {GROUPS.map((g) => (
              <div key={g.key} className="min-w-0 rounded-[28px] bg-muted p-2">
                <div className="flex items-center gap-2 px-3 pt-2.5 pb-3">
                  <span className={cn('size-2.5 shrink-0 rounded-full', GROUP_DOT[g.key])} />
                  <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{g.title}</h3>
                  <span className="num inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-card px-2 text-[12px] font-bold text-ink shadow-pill">{byGroup[g.key].length}</span>
                </div>
                <div className="scroll-thin flex max-h-[680px] flex-col gap-2 overflow-y-auto pb-0.5">
                  {byGroup[g.key].map((it) => (
                    <BoardCard key={it.a.id} it={it} selected={selId === it.a.id} flash={flash.has(it.a.id)} onOpen={() => setSelId(it.a.id)} />
                  ))}
                  {byGroup[g.key].length === 0 && <div className="rounded-[20px] px-3 py-8 text-center text-[12.5px] text-ink-3">Nada por aqui</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {GROUPS.filter((g) => byGroup[g.key].length > 0).map((g) => (
              <section key={g.key}>
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span className={cn('size-2.5 rounded-full', GROUP_DOT[g.key])} />
                  <h3 className="text-[16px] font-bold text-ink">{g.title}</h3>
                  <span className="num text-[13px] font-semibold text-ink-3">{byGroup[g.key].length}</span>
                </div>
                <Card className="divide-y divide-line overflow-hidden">
                  {byGroup[g.key].map((it) => (
                    <ListRow key={it.a.id} it={it} selected={selId === it.a.id} flash={flash.has(it.a.id)} onOpen={() => setSelId(it.a.id)} />
                  ))}
                </Card>
              </section>
            ))}
          </div>
        )}
      </LayoutGroup>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelId(null)} title={selected ? `Aviso de ${selected.rental.title}` : 'Aviso'}>
        {selected && (
          <AvisoDetail
            item={selected}
            custom={custom[selected.a.id]}
            onCustom={(id, v) =>
              setCustom((c) => {
                const n = { ...c }
                if (v === undefined) delete n[id]
                else n[id] = v
                return n
              })
            }
            onClose={() => setSelId(null)}
          />
        )}
      </Drawer>
      <Drawer open={rulesOpen} onOpenChange={setRulesOpen} title="Regras" width="w-[520px]">
        <RulesPanel rules={rules} setRules={setRules} hour={hour} setHour={setHour} email={email} setEmail={setEmail} onClose={() => setRulesOpen(false)} />
      </Drawer>
    </div>
  )
}
