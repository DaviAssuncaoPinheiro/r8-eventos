import { Pause, Play, Route } from 'lucide-react'
import { Button, Tooltip, cn } from '@/ui'
import { RollingNumber } from '@/ui/Motion'
import type { ServiceView } from '@/services'

export interface DaySummaryProps {
  services: ServiceView[]
  /** km de via que faltam no dia (todas as equipes) */
  totalKm?: number
  live?: { paused: boolean; onToggle: () => void }
  className?: string
}

/** Resumo do dia em cartão flutuante sobre o mapa: concluídos, em andamento, atrasados e a barra em segmentos */
export function DaySummary({ services, totalKm, live, className }: DaySummaryProps) {
  const total = services.length
  const done = services.filter((s) => s.status === 'concluido').length
  const going = services.filter((s) => s.status === 'em_andamento' || s.status === 'a_caminho').length
  const late = services.filter((s) => s.status === 'atrasado').length
  // concluídos primeiro, depois em curso, atrasados e o que falta
  const order = {
    concluido: 0,
    em_andamento: 1,
    a_caminho: 1,
    atrasado: 2,
    agendado: 3,
    cancelado: 4,
  } as const
  const segs = [...services].sort((a, b) => order[a.status] - order[b.status])
  return (
    <section aria-label="Resumo do dia" className={cn('rounded-card bg-raised p-3 shadow-overlay sm:p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-baseline gap-1 leading-none text-fg">
          <RollingNumber value={done} className="tnum text-kpi" />
          <span className="tnum text-title-sub text-fg-3">/{total}</span>
          <span className="ml-1.5 text-body font-semibold">Concluídos</span>
        </p>
        {live ? (
          <div className="-mt-1 -mr-1 flex shrink-0 items-center gap-0.5">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-sunken px-2.5 text-caption font-semibold text-fg-2" role="status">
              <span aria-hidden className="relative flex size-2">
                {live.paused ? null : <span className="absolute inset-0 animate-ping rounded-pill bg-ok opacity-60" />}
                <span className={cn('relative size-2 rounded-pill', live.paused ? 'bg-fg-3' : 'bg-ok')} />
              </span>
              {live.paused ? 'Pausado' : 'Ao vivo'}
            </span>
            <Tooltip content={live.paused ? 'Retomar atualização ao vivo' : 'Pausar atualização ao vivo'}>
              <Button variant="ghost" size="sm" iconOnly icon={live.paused ? Play : Pause} aria-label={live.paused ? 'Retomar ao vivo' : 'Pausar ao vivo'} onClick={live.onToggle} />
            </Tooltip>
          </div>
        ) : null}
      </div>

      <div className="mt-3 hidden gap-1 sm:flex" role="img" aria-label={`${done} de ${total} serviços concluídos`}>
        {segs.length === 0 ? <span className="ds-hatch h-2.5 flex-1 rounded-pill bg-sunken" /> : null}
        {segs.map((s) => (
          <span
            key={s.id}
            className={cn(
              'h-2.5 min-w-0 flex-1 rounded-pill transition-colors duration-300 ease-[var(--ease-ui)]',
              s.status === 'concluido' && 'bg-accent',
              (s.status === 'em_andamento' || s.status === 'a_caminho') && 'bg-accent-soft ring-2 ring-accent ring-inset',
              s.status === 'atrasado' && 'bg-danger',
              s.status === 'agendado' && 'ds-hatch bg-sunken',
            )}
          />
        ))}
      </div>

      <dl className="mt-2 flex flex-wrap sm:mt-3 items-center gap-x-4 gap-y-1.5 text-body">
        <div className="flex items-baseline gap-1.5">
          <dd className="tnum text-title-card">
            <RollingNumber value={going} />
          </dd>
          <dt className="font-medium text-fg-2">em andamento</dt>
        </div>
        <div className={cn('flex items-baseline gap-1.5', late > 0 && 'text-danger-ink')}>
          <dd className="tnum text-title-card">
            <RollingNumber value={late} />
          </dd>
          <dt className={cn('font-medium', late > 0 ? 'text-danger-ink' : 'text-fg-2')}>{late === 1 ? 'atrasado' : 'atrasados'}</dt>
        </div>
        {totalKm !== undefined ? (
          <Tooltip content="Quilômetros de via que faltam hoje, somando as equipes, com a volta à base.">
            <div tabIndex={0} className="flex items-center gap-1 rounded-pill text-fg-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <Route size={14} strokeWidth={2} aria-hidden />
              <dd className="tnum font-semibold">
                <RollingNumber value={totalKm} decimals={1} />
              </dd>
              <dt className="font-medium">km</dt>
            </div>
          </Tooltip>
        ) : null}
      </dl>
    </section>
  )
}
