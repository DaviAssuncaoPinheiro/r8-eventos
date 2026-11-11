import * as React from 'react'
import { ArrowRight, X } from 'lucide-react'
import { Button, cn } from '@/ui'
import { MapaReal } from '@/ui/MapaReal'
import type { FleetPosition, RouteOptimization, ServiceView, Team } from '@/services'
import { TeamAvatar } from './TeamAvatar'
import { buildRealMap, routeOf, visibleOf } from './helpers'
import { clockIn, fleetTrucks, teamOfTruck } from '../fleet'

const LEGEND = [
  { label: 'Concluído', cls: 'bg-ok' },
  { label: 'Em andamento', cls: 'bg-accent' },
  { label: 'A caminho', cls: 'bg-info' },
  { label: 'Atrasado', cls: 'bg-danger' },
  { label: 'Agendado', cls: 'bg-inverse' },
]

export interface MapaDoDiaProps {
  /** dia dos serviços mostrados: muda o mapa inteiro (reenquadra) */
  mapKey: string
  services: ServiceView[]
  teams: Team[]
  fleet: FleetPosition[]
  selectedTeamId?: string
  /** prévia da otimização: rota nova por cima da antiga */
  proposal?: RouteOptimization
  onSelectTeam: (teamId: string) => void
  onOpenService: (serviceId: string) => void
  /** cartão do resumo, no canto superior esquerdo */
  summary: React.ReactNode
  /** painel de comparação (escritório): flutua à direita */
  panel?: React.ReactNode
  className?: string
}

/** Mapa real do dia: paradas por equipe, rotas, caminhões andando e cartões flutuantes */
export function MapaDoDia({ mapKey, services, teams, fleet, selectedTeamId, proposal, onSelectTeam, onOpenService, summary, panel, className }: MapaDoDiaProps) {
  const [focus, setFocus] = React.useState<string | undefined>()
  React.useEffect(() => {
    if (focus && focus !== selectedTeamId) setFocus(undefined)
  }, [focus, selectedTeamId])

  const preview = Boolean(proposal)
  const model = React.useMemo(() => {
    const now = buildRealMap(services, teams)
    if (!proposal) return now
    const order = new Map(proposal.teams.filter((t) => t.changed).map((t) => [t.teamId, t.optimized.filter((s) => !s.fixed).map((s) => s.serviceId)]))
    const next = buildRealMap(services, teams, order)
    const old = now.routes.filter((r) => order.has(r.id.replace(/-(feito|previsto)$/, ''))).map((r) => ({ ...r, id: `antiga-${r.id}`, group: 'antiga' }))
    return {
      pins: next.pins.map((p) => ({ ...p, group: 'nova' })),
      // rota antiga primeiro (fica por baixo e esmaecida), a nova desenha-se por cima
      routes: [...old, ...next.routes.map((r) => ({ ...r, group: 'nova' }))],
    }
  }, [services, teams, proposal])

  const trucks = React.useMemo(() => {
    const list = fleetTrucks(fleet, (id) => teams.find((t) => t.id === id))
    return preview ? list.map((t) => ({ ...t, group: 'nova' })) : list
  }, [fleet, teams, preview])

  const focusFleet = focus ? fleet.find((f) => f.teamId === focus) : undefined
  const focusTeam = focus ? teams.find((t) => t.id === focus) : undefined
  const stops = focus ? visibleOf(routeOf(services, focus)).length : 0

  const onSelect = (id: string) => {
    const t = teamOfTruck(id)
    if (t) {
      setFocus(t)
      onSelectTeam(t)
    } else onOpenService(id)
  }

  return (
    <div className={cn('relative size-full overflow-hidden rounded-[16px]', className)}>
      <MapaReal
        key={mapKey}
        pins={model.pins}
        routes={model.routes}
        trucks={trucks}
        selectedGroup={preview ? 'nova' : selectedTeamId}
        refit="once"
        onSelect={onSelect}
        label={selectedTeamId ? `Mapa do dia com as paradas da ${teams.find((t) => t.id === selectedTeamId)?.name} em destaque` : 'Mapa do dia com as paradas e os caminhões das equipes'}
      />

      <div className="pointer-events-none absolute inset-0 p-2 sm:p-3">
        <div className="pointer-events-auto absolute top-2 left-2 w-[min(272px,calc(100%-64px))] sm:top-3 sm:left-3 sm:w-[288px]">{summary}</div>

        <ul className="pointer-events-auto absolute bottom-2 left-2 hidden items-center gap-x-3.5 rounded-pill bg-raised px-3.5 py-2 text-caption font-semibold text-fg-2 shadow-overlay sm:bottom-3 sm:left-3 sm:flex">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span aria-hidden className={cn('size-2.5 rounded-pill', l.cls)} />
              {l.label}
            </li>
          ))}
        </ul>

        {panel ? (
          <div className="pointer-events-auto absolute top-3 right-14 bottom-3 flex w-[392px] max-w-[calc(100%-24px)] flex-col rounded-card bg-raised p-4 shadow-overlay">{panel}</div>
        ) : focusFleet && focusTeam ? (
          <div role="status" className="pointer-events-auto absolute right-2 bottom-9 w-[min(264px,calc(100%-16px))] rounded-card bg-raised p-3 shadow-overlay sm:right-3 sm:bottom-10">
            <div className="flex items-center gap-2.5">
              <TeamAvatar team={focusTeam} size={32} />
              <span className="min-w-0 flex-1 truncate text-title-card">{focusTeam.name}</span>
              <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Fechar" onClick={() => setFocus(undefined)} />
            </div>
            {focusFleet.status === 'em_rota' ? (
              <>
                <p className="mt-2 flex items-center gap-1.5 text-body font-medium">
                  <span className="min-w-0 truncate">{focusFleet.fromLabel}</span>
                  <ArrowRight size={14} strokeWidth={2} aria-hidden className="shrink-0 text-fg-3" />
                  <span className="min-w-0 truncate">{focusFleet.toLabel}</span>
                </p>
                <p className="mt-1 text-body font-semibold text-accent-ink">Chega às {clockIn(focusFleet.etaMinutes)}</p>
              </>
            ) : focusFleet.status === 'no_local' ? (
              <>
                <p className="mt-2 truncate text-body font-medium">{focusFleet.toLabel}</p>
                <p className="mt-1 text-body font-semibold text-ok-ink">Sai às {clockIn(focusFleet.etaMinutes)}</p>
              </>
            ) : (
              <p className="mt-2 text-body font-medium">{stops > 0 ? `Na base, ${stops} ${stops === 1 ? 'parada' : 'paradas'} hoje` : 'Na base, sem serviço hoje'}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
