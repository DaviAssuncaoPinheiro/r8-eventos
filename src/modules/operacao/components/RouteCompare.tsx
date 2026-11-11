import { ArrowRight, Fuel, Timer, Route as RouteIcon } from 'lucide-react'
import { AiTag, Button, cn } from '@/ui'
import { RollingMoney, RollingNumber } from '@/ui/Motion'
import type { RouteOptimization, ServiceView, Team } from '@/services'
import { TeamAvatar } from './TeamAvatar'
import { routeOf, visibleOf } from './helpers'

const km = (n: number) => n.toFixed(1).replace('.', ',')

export interface RouteCompareProps {
  proposal: RouteOptimization
  services: ServiceView[]
  teams: Team[]
  aiEnabled: boolean
  applying: boolean
  onApply: (origin: HTMLElement) => void
  onClose: () => void
  /** no celular o painel vai numa gaveta, que já tem título e rodapé */
  bare?: boolean
}

function Pill({ n, moved, title }: { n: number; moved?: boolean; title: string }) {
  return (
    <li title={title} className={cn('grid h-7 min-w-7 place-items-center rounded-pill px-1.5 text-caption font-bold tnum', moved ? 'bg-accent text-on-accent' : 'bg-sunken text-fg-2')}>
      <span className="sr-only">{title}: </span>
      {n}
    </li>
  )
}

/** Comparação das rotas: o que a otimização economiza e, por equipe, a ordem atual contra a nova */
export function RouteCompare({ proposal, services, teams, aiEnabled, applying, onApply, onClose, bare }: RouteCompareProps) {
  const changed = proposal.teams.filter((t) => t.changed)
  const teamOf = (id: string) => teams.find((t) => t.id === id)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn('flex items-center justify-between gap-3', bare && 'hidden')}>
        <h2 className="text-title-sub">Rotas otimizadas</h2>
        {aiEnabled ? <AiTag /> : null}
      </div>

      <dl className={cn('grid grid-cols-2 gap-2', !bare && 'mt-3')}>
        <div className="rounded-control bg-accent-soft p-3">
          <dd className="text-kpi leading-none text-accent-ink">
            <RollingNumber value={proposal.kmSaved} decimals={1} />
            <span className="ml-1 text-title-card">km</span>
          </dd>
          <dt className="mt-1.5 flex items-center gap-1 text-body font-semibold text-accent-ink">
            <RouteIcon size={14} strokeWidth={2} aria-hidden />a menos
          </dt>
        </div>
        <div className="rounded-control bg-sunken p-3">
          <dd className="text-kpi leading-none">
            <RollingNumber value={proposal.minutesSaved} />
            <span className="ml-1 text-title-card text-fg-2">min</span>
          </dd>
          <dt className="mt-1.5 flex items-center gap-1 text-body font-semibold text-fg-2">
            <Timer size={14} strokeWidth={2} aria-hidden />a menos
          </dt>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 rounded-control bg-sunken p-3">
          <dt className="flex items-center gap-1 text-body font-semibold text-fg-2">
            <Fuel size={16} strokeWidth={2} aria-hidden />
            Diesel economizado
          </dt>
          <dd className="text-kpi leading-none">
            <RollingMoney kpi value={proposal.fuelSaved} />
          </dd>
        </div>
      </dl>

      <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5" aria-label="Equipes que mudam">
        {changed.map((t) => {
          const team = teamOf(t.teamId)
          const route = visibleOf(routeOf(services, t.teamId))
          const num = (id: string) => route.findIndex((s) => s.id === id) + 1
          const label = (id: string) => {
            const s = route.find((x) => x.id === id)
            return s ? `Parada ${num(id)}, ${s.bairroName}` : ''
          }
          const cur = t.current.map((s) => s.serviceId)
          const next = t.optimized.map((s) => s.serviceId)
          return (
            <li key={t.teamId} className="rounded-control bg-sunken p-3">
              <div className="flex items-center gap-2.5">
                {team ? <TeamAvatar team={team} size={32} /> : null}
                <span className="min-w-0 flex-1 truncate text-title-card">{t.teamName}</span>
                <span className="inline-flex h-6 items-center rounded-pill bg-ok-soft px-2 text-caption font-semibold text-ok-ink tnum">-{km(t.kmSaved)} km</span>
              </div>
              <div className="mt-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-11 shrink-0 text-caption font-semibold text-fg-3">Atual</span>
                  <ol className="m-0 flex min-w-0 flex-1 list-none flex-wrap gap-1 p-0" aria-label="Ordem atual">
                    {cur.map((id) => (
                      <Pill key={id} n={num(id)} title={label(id)} />
                    ))}
                  </ol>
                  <span className="shrink-0 text-caption font-semibold text-fg-2 tnum">{km(t.kmBefore)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex w-11 shrink-0 items-center gap-0.5 text-caption font-semibold text-accent-ink">
                    Nova
                    <ArrowRight size={12} strokeWidth={2.5} aria-hidden />
                  </span>
                  <ol className="m-0 flex min-w-0 flex-1 list-none flex-wrap gap-1 p-0" aria-label="Ordem nova">
                    {next.map((id, i) => (
                      <Pill key={id} n={num(id)} title={label(id)} moved={cur[i] !== id} />
                    ))}
                  </ol>
                  <span className="shrink-0 text-caption font-semibold text-fg tnum">{km(t.kmAfter)} km</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex gap-2">
        <Button variant="primary" block loading={applying} onClick={(e) => onApply(e.currentTarget)}>
          Aplicar
        </Button>
        <Button variant="secondary" disabled={applying} onClick={onClose}>
          Agora não
        </Button>
      </div>
    </div>
  )
}
