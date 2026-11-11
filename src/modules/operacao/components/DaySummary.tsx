import { Pause, Play } from 'lucide-react'
import { Button, Tooltip, cn, useCountUp } from '@/ui'
import type { ServiceView } from '@/services'

function Big({ value, className }: { value: number; className?: string }) {
  const v = useCountUp(value)
  return <span className={cn('tnum', className)}>{Math.round(v)}</span>
}

export interface DaySummaryProps {
  services: ServiceView[]
  live?: { paused: boolean; onToggle: () => void }
}

/** Números do dia e barra de progresso em segmentos, um por serviço */
export function DaySummary({ services, live }: DaySummaryProps) {
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
    <section aria-label="Resumo do dia" className="flex h-full min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="text-title-sub">Resumo do dia</h2>
        {live ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-7 items-center gap-2 rounded-pill bg-sunken px-3 text-caption font-semibold text-fg-2" role="status">
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

      <div className="mt-8 flex items-end gap-3">
        <p className="flex items-baseline gap-1 text-fg">
          <Big value={done} className="text-kpi-lg" />
          <span className="tnum text-title-section text-fg-3">/{total}</span>
        </p>
        <p className="pb-1.5 text-body-lg font-semibold">Concluídos</p>
      </div>

      <div className="mt-6 flex gap-1.5" role="img" aria-label={`${done} de ${total} serviços concluídos`}>
        {segs.length === 0 ? <span className="ds-hatch h-4 flex-1 rounded-pill bg-sunken" /> : null}
        {segs.map((s) => (
          <span
            key={s.id}
            className={cn(
              'h-4 min-w-0 flex-1 rounded-pill transition-colors duration-300 ease-[var(--ease-ui)]',
              s.status === 'concluido' && 'bg-accent',
              (s.status === 'em_andamento' || s.status === 'a_caminho') && 'bg-accent-soft ring-2 ring-accent ring-inset',
              s.status === 'atrasado' && 'bg-danger',
              s.status === 'agendado' && 'ds-hatch bg-sunken',
            )}
          />
        ))}
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-3 pt-6">
        <div className="rounded-control bg-sunken px-4 py-5">
          <dd className="text-kpi-lg">
            <Big value={going} />
          </dd>
          <dt className="mt-1 text-body font-semibold text-fg-2">Em andamento</dt>
        </div>
        <div className={cn('rounded-control px-4 py-5', late > 0 ? 'bg-danger-soft' : 'bg-sunken')}>
          <dd className={cn('text-kpi-lg', late > 0 && 'text-danger-ink')}>
            <Big value={late} />
          </dd>
          <dt className={cn('mt-1 text-body font-semibold', late > 0 ? 'text-danger-ink' : 'text-fg-2')}>Atrasados</dt>
        </div>
      </dl>
    </section>
  )
}
