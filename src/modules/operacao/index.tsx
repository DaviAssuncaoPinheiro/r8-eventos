/* Operação do dia: mapa, resumo, agenda por equipe com arrastar e soltar, gaveta do serviço e ao vivo simulado. */
import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarX2, Plus, Route } from 'lucide-react'
import { PageHeader } from '@/app/PageHeader'
import { AiTag, Banner, Button, Drawer, EmptyState, Skeleton, cn, notify } from '@/ui'
import { useMediaQuery } from '@/ui/Dialog'
import { Stagger, celebrate } from '@/ui/Motion'
import { dayOf, today as todayFn } from '@/domain/dates'
import {
  applyOptimizedRoutes,
  applyReroute,
  getRouteDistances,
  listServices,
  listTeams,
  moveService,
  optimizeRoutes,
  setServiceStatus,
  suggestReroute,
  useMutation,
  useQuery,
  useSettings,
  type RouteOptimization,
} from '@/services'
import { MapaDoDia } from './components/MapaDoDia'
import { RouteCompare } from './components/RouteCompare'
import { useFleet } from './fleet'
import { DayPicker } from './components/DayPicker'
import { DaySummary } from './components/DaySummary'
import { NewServiceDrawer } from './components/NewServiceDrawer'
import { ServiceDrawer } from './components/ServiceDrawer'
import { TeamAvatar } from './components/TeamAvatar'
import { TeamColumn } from './components/TeamColumn'
import { routeOf, visibleOf } from './components/helpers'
import { useLiveSim, type LiveStep } from './components/useLiveSim'

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const km = (n: number) => n.toFixed(1).replace('.', ',')

export default function Operacao() {
  const [params, setParams] = useSearchParams()
  const wide = useMediaQuery('(min-width: 768px)')
  const settings = useSettings()
  const today = todayFn()
  const dataParam = params.get('data')
  const day = dataParam && DAY_RE.test(dataParam) ? dataParam : today
  const isToday = day === today
  const equipeParam = params.get('equipe') ?? undefined

  const q = useQuery(() => listServices({ date: day }), [day])
  const teamsQ = useQuery(listTeams, [])
  const reroute = useQuery(suggestReroute, [])
  const distQ = useQuery(() => getRouteDistances(day), [day])
  const services = q.data
  const teams = teamsQ.data

  const move = useMutation(moveService)
  const apply = useMutation(applyReroute)
  const setStatus = useMutation(setServiceStatus)
  const optimize = useMutation(optimizeRoutes)
  const applyRoutes = useMutation(applyOptimizedRoutes)

  const [openId, setOpenId] = React.useState<string | null>(null)
  const [newOpen, setNewOpen] = React.useState(false)
  const [paused, setPaused] = React.useState(false)
  const [proposal, setProposal] = React.useState<RouteOptimization | undefined>()
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [over, setOver] = React.useState<{
    teamId: string
    index: number
  } | null>(null)

  const setQuery = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }

  const selectedTeamId = equipeParam && teams?.some((t) => t.id === equipeParam) ? equipeParam : wide ? undefined : teams?.[0]?.id
  const selectTeam = (id: string) => setQuery({ equipe: wide && id === selectedTeamId ? undefined : id })
  const changeDay = (d: string) => setQuery({ data: d === today ? undefined : d })

  const live = (services ?? []).filter((s) => s.status !== 'cancelado')
  // caminhões só andam hoje; o relógio da demo anda mais rápido que o real
  const fleet = useFleet(2000, isToday, services)
  // o mapa reenquadra quando muda o dia dos serviços mostrados (os dados do dia anterior ficam até os novos chegarem)
  const mapKey = services?.[0] ? dayOf(services[0].start) : day

  React.useEffect(() => setProposal(undefined), [day])

  /* ───────── mover ───────── */
  const doMove = async (id: string, teamId: string, order: number) => {
    const s = services?.find((x) => x.id === id)
    const team = teams?.find((t) => t.id === teamId)
    if (!s || !team || !services) return
    const prevOrder = routeOf(services, s.teamId).findIndex((x) => x.id === id) + 1
    if (teamId === s.teamId && order === prevOrder) return
    const prevTeam = s.teamId
    try {
      await move.run(id, { teamId, order })
      notify.success(`Serviço movido para a ${team.name}`, {
        action: {
          label: 'Desfazer',
          onClick: () => {
            moveService(id, { teamId: prevTeam, order: prevOrder }).then(
              () => notify.success('Movimento desfeito'),
              () => notify.error('Não foi possível desfazer. Tente de novo.'),
            )
          },
        },
      })
    } catch {
      notify.error('Não foi possível mover o serviço. Tente de novo.')
    }
  }

  const moveToTeam = (id: string, teamId: string) => {
    if (!services) return
    void doMove(id, teamId, routeOf(services, teamId).filter((x) => x.id !== id).length + 1)
  }

  const drop = (teamId: string, index: number) => {
    const id = dragId
    setDragId(null)
    setOver(null)
    if (!id || !services) return
    const full = routeOf(services, teamId).filter((x) => x.id !== id)
    const vis = visibleOf(full)
    const order = index < vis.length ? full.indexOf(vis[index]) + 1 : full.length + 1
    void doMove(id, teamId, order)
  }

  /* ───────── ao vivo ───────── */
  const advance = async (step: LiveStep) => {
    try {
      await setStatus.run(step.service.id, step.to)
      notify.info(step.to === 'a_caminho' ? `${step.team.name} a caminho de ${step.service.clientName}` : `${step.team.name} iniciou o serviço em ${step.service.clientName}`)
    } catch {
      /* simulação: uma falha só pula este passo */
    }
  }
  useLiveSim({
    enabled: isToday && !paused && !proposal,
    services,
    teams,
    advance,
  })

  /* ───────── sugestão de rota ───────── */
  const sug = isToday ? reroute.data?.[0] : undefined
  const sugFrom = sug && teams?.find((t) => t.id === sug.fromTeamId)
  const sugTo = sug && teams?.find((t) => t.id === sug.toTeamId)

  /* ───────── otimizar rotas ───────── */
  const runOptimize = async () => {
    try {
      const p = await optimize.run(day)
      if (p.kmSaved <= 0 || !p.teams.some((t) => t.changed)) notify.info('Rotas já estão no melhor caminho')
      else setProposal(p)
    } catch {
      notify.error('Não foi possível otimizar as rotas. Tente de novo.')
    }
  }
  const runApply = async (origin: HTMLElement) => {
    const p = proposal
    if (!p) return
    try {
      await applyRoutes.run(day)
      celebrate(origin)
      notify.success(`${km(p.kmSaved)} km a menos ${isToday ? 'hoje' : 'neste dia'}`)
      setProposal(undefined)
    } catch {
      notify.error('Não foi possível aplicar as rotas. Tente de novo.')
    }
  }

  const header = (
    <PageHeader
      title="Operação do dia"
      actions={
        <>
          <DayPicker day={day} today={today} onChange={changeDay} />
          <Button variant="secondary" icon={Plus} onClick={() => setNewOpen(true)}>
            Novo serviço
          </Button>
          <Button variant="primary" icon={Route} loading={optimize.loading} onClick={() => void runOptimize()}>
            Otimizar rotas
            {settings.aiEnabled ? <AiTag className="ml-1 hidden sm:inline-flex" /> : null}
          </Button>
        </>
      }
    />
  )

  const drawers = (
    <>
      <ServiceDrawer serviceId={openId} onClose={() => setOpenId(null)} />
      <NewServiceDrawer open={newOpen} onOpenChange={setNewOpen} day={day} defaultTeamId={selectedTeamId} />
    </>
  )

  if (q.error && !services) {
    return (
      <>
        {header}
        <Banner
          tone="danger"
          title="Não foi possível carregar a operação."
          action={
            <Button size="sm" onClick={() => void q.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      </>
    )
  }

  if (!services || !teams) {
    return (
      <div aria-busy="true">
        {header}
        <div className="rounded-card bg-raised p-2">
          <Skeleton shape="block" className="h-[300px] rounded-[16px] sm:h-[460px]" />
        </div>
        <div className="mt-6 flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} shape="block" className="h-72 w-[264px] shrink-0 rounded-card" />
          ))}
        </div>
      </div>
    )
  }

  const selTeam = teams.find((t) => t.id === selectedTeamId)
  const summary = <DaySummary services={live} totalKm={distQ.data?.totalKm} live={isToday ? { paused, onToggle: () => setPaused((p) => !p) } : undefined} />
  const compare = proposal ? (
    <RouteCompare
      proposal={proposal}
      services={services}
      teams={teams}
      aiEnabled={settings.aiEnabled}
      applying={applyRoutes.loading}
      onApply={(el) => void runApply(el)}
      onClose={() => setProposal(undefined)}
      bare={!wide}
    />
  ) : null

  return (
    <>
      {header}

      {settings.aiEnabled && sug && sugFrom && sugTo ? (
        <Banner
          tone="warn"
          title={`${sugFrom.name} atrasada.`}
          className="mb-3"
          action={
            <div className="flex items-center gap-2">
              <AiTag />
              <Button
                size="sm"
                variant="primary"
                icon={Route}
                loading={apply.loading}
                onClick={async () => {
                  try {
                    await apply.run(sug)
                    notify.success(`${sug.clientName} passou para a ${sugTo.name}`)
                  } catch {
                    notify.error('Não foi possível aplicar a sugestão. Tente de novo.')
                  }
                }}
              >
                Aplicar
              </Button>
            </div>
          }
        >
          {sug.clientName} para a {sugTo.name}: {sug.savedMinutes} min a menos.
        </Banner>
      ) : null}

      <Stagger className="flex flex-col">
        <section aria-label="Mapa do dia" className="min-w-0 rounded-card bg-raised p-2">
          <div className="h-[300px] sm:h-[460px]">
            <MapaDoDia
              mapKey={mapKey}
              services={services}
              teams={teams}
              fleet={isToday ? fleet : []}
              selectedTeamId={selectedTeamId}
              proposal={proposal}
              onSelectTeam={(id) => setQuery({ equipe: id })}
              onOpenService={setOpenId}
              summary={summary}
              panel={wide ? compare : undefined}
            />
          </div>
        </section>

        {wide ? (
          <section aria-label="Agenda por equipe" className="mt-6">
            <h2 className="mb-3 text-title-sub">Agenda por equipe</h2>
            {live.length === 0 ? (
              <div className="rounded-card bg-raised">
                <EmptyState
                  icon={CalendarX2}
                  title="Nenhum serviço neste dia"
                  action={
                    <Button variant="primary" icon={Plus} onClick={() => setNewOpen(true)}>
                      Novo serviço
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {teams.map((t) => (
                  <TeamColumn
                    key={t.id}
                    team={t}
                    teams={teams}
                    route={routeOf(services, t.id)}
                    selected={selectedTeamId === t.id}
                    dragId={dragId}
                    dropIndex={over?.teamId === t.id ? over.index : null}
                    onSelect={selectTeam}
                    onOpen={setOpenId}
                    onMoveTo={moveToTeam}
                    onDragStart={setDragId}
                    onDragEnd={() => {
                      setDragId(null)
                      setOver(null)
                    }}
                    onDragOver={(teamId, index) => setOver({ teamId, index })}
                    onDragLeave={(teamId) => setOver((o) => (o?.teamId === teamId ? null : o))}
                    onDrop={drop}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section aria-label="Agenda da equipe" className="mt-4">
            <div role="group" aria-label="Equipe" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {teams.map((t) => {
                const list = visibleOf(routeOf(services, t.id))
                const done = list.filter((s) => s.status === 'concluido').length
                const on = selectedTeamId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => selectTeam(t.id)}
                    className={cn(
                      'ds-touch flex h-11 shrink-0 items-center gap-2 rounded-pill py-1 pr-4 pl-1 text-body font-semibold transition-colors duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      on ? 'bg-inverse text-on-inverse' : 'bg-raised text-fg ring-1 ring-inset ring-edge',
                    )}
                  >
                    <TeamAvatar team={t} size={32} />
                    {t.short}
                    <span className={cn('tnum', on ? 'text-on-inverse-2' : 'text-fg-2')}>
                      {done}/{list.length}
                    </span>
                  </button>
                )
              })}
            </div>
            {selTeam ? (
              <TeamColumn
                team={selTeam}
                teams={teams}
                route={routeOf(services, selTeam.id)}
                selected={false}
                layout="list"
                dragId={null}
                dropIndex={null}
                onSelect={() => undefined}
                onOpen={setOpenId}
                onMoveTo={moveToTeam}
                onDragStart={() => undefined}
                onDragEnd={() => undefined}
                onDragOver={() => undefined}
                onDragLeave={() => undefined}
                onDrop={() => undefined}
              />
            ) : null}
          </section>
        )}
      </Stagger>

      {wide ? null : (
        <Drawer open={Boolean(proposal)} onOpenChange={(o) => !o && setProposal(undefined)} title="Rotas otimizadas">
          {compare}
        </Drawer>
      )}

      {drawers}
    </>
  )
}
