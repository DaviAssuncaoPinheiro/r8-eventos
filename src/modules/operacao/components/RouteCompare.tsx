import { ArrowRight, Fuel, Route as RouteIcon, Timer } from 'lucide-react'
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
    <li title={title} className={cn('grid h-6 min-w-6 place-items-center rounded-pill px-1.5 text-caption font-bold tnum', moved ? 'bg-accent text-on-accent' : 'bg-raised text-fg-2 ring-1 ring-edge ring-inset')}>
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

      <dl className={cn('grid grid-cols-3 gap-1.5', !bare && 'mt-2.5')}>
        <div className="min-w-0 rounded-control bg-accent-soft p-2">
          <dd className="text-[26px] leading-[30px] font-semibold tracking-[-0.02em] text-accent-ink">
            <RollingNumber value={proposal.kmSaved} decimals={1} />
          </dd>
          <dt className="mt-1 flex items-center gap-1 text-caption font-semibold text-accent-ink">
            <RouteIcon size={13} strokeWidth={2} aria-hidden />
            km a menos
          </dt>
        </div>
        <div className="min-w-0 rounded-control bg-sunken p-2">
          <dd className="text-[26px] leading-[30px] font-semibold tracking-[-0.02em]">
            <RollingNumber value={proposal.minutesSaved} />
          </dd>
          <dt className="mt-1 flex items-center gap-1 text-caption font-semibold text-fg-2">
            <Timer size={13} strokeWidth={2} aria-hidden />
            min a menos
          </dt>
        </div>
        <div className="min-w-0 rounded-control bg-sunken p-2">
          <dd className="text-[26px] leading-[30px] font-semibold tracking-[-0.02em]">
            <RollingMoney kpi value={proposal.fuelSaved} />
          </dd>
          <dt className="mt-1 flex items-center gap-1 text-caption font-semibold text-fg-2">
            <Fuel size={13} strokeWidth={2} aria-hidden />
            de diesel
          </dt>
        </div>
      </dl>

      <ul className="mt-2.5 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5 pb-3 [mask-image:linear-gradient(to_bottom,black_calc(100%-24px),transparent)]" aria-label="Equipes que mudam">
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
            <li key={t.teamId} className="shrink-0 rounded-control bg-sunken p-2.5">
              <div className="flex items-center gap-2.5">
                {team ? <TeamAvatar team={team} size={32} /> : null}
                <span className="min-w-0 flex-1 truncate text-title-card">{t.teamName}</span>
                <span className="inline-flex h-6 items-center rounded-pill bg-ok-soft px-2 text-caption font-semibold text-ok-ink tnum">-{km(t.kmSaved)} km</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
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

      <div className="mt-2 flex gap-2">
        <Button variant="primary" className="flex-1" loading={applying} onClick={(e) => onApply(e.currentTarget)}>
          Aplicar
        </Button>
        <Button variant="secondary" disabled={applying} onClick={onClose}>
          Agora não
        </Button>
      </div>
    </div>
  )
}
