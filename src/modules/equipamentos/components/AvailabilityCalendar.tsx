import { Banner, Button, Skeleton, Tooltip, cn } from '@/ui'
import { weekday } from '@/domain/dates'
import { formatDate } from '@/lib/format'
import { getAvailabilityCalendar, useQuery, type EquipmentType } from '@/services'
import { TypeThumb } from './TypeThumb'

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Intensidade pela fração livre: quanto mais livre, mais forte o laranja. Sem estoque: vermelho. */
function tone(free: number, total: number) {
  if (free <= 0) return 'bg-danger-soft text-danger-ink'
  const r = total ? free / total : 0
  if (r >= 0.75) return 'bg-accent text-on-accent'
  if (r >= 0.5) return 'bg-accent/65 text-fg'
  if (r >= 0.25) return 'bg-accent/40 text-fg'
  return 'bg-accent/20 text-fg'
}

export function AvailabilityCalendar({ type }: { type: EquipmentType }) {
  const q = useQuery(() => getAvailabilityCalendar(type.id), [type.id])
  const days = q.data
  const lead = days?.length ? weekday(days[0].date) : 0
  return (
    <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6" aria-label={`Disponibilidade de ${type.name} nos próximos 30 dias`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TypeThumb src={type.photo} alt="" className="size-11 rounded-control" />
          <h2 className="min-w-0 truncate text-title-sub">{type.name}</h2>
        </div>
        <div aria-hidden className="flex items-center gap-1.5 text-caption text-fg-3">
          Livres
          {['bg-accent/20', 'bg-accent/40', 'bg-accent/65', 'bg-accent'].map((c) => (
            <span key={c} className={cn('size-4 rounded-tip', c)} />
          ))}
          <span className="ml-2 size-4 rounded-tip bg-danger-soft ring-1 ring-danger ring-inset" />
          Sem estoque
        </div>
      </div>

      {q.error && !days ? (
        <Banner tone="danger" title="Não foi possível carregar a disponibilidade." className="mt-4" action={<Button size="sm" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : (
        <div aria-busy={q.initialLoading || undefined} className="mt-5">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-hidden>
            {WEEK.map((w) => (
              <span key={w} className="text-center text-caption font-semibold text-fg-3">
                {w}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
            {!days
              ? Array.from({ length: 35 }, (_, i) => <Skeleton key={i} shape="block" className="h-12 sm:h-14" />)
              : [
                  ...Array.from({ length: lead }, (_, i) => <span key={`b${i}`} aria-hidden />),
                  ...days.map((d) => {
                    const dd = Number(d.date.slice(8, 10))
                    const text = `${WEEK[weekday(d.date)]}, ${formatDate(d.date)}: ${d.free} livres de ${d.total}${d.reserved ? `, ${d.reserved} reservados` : ''}`
                    return (
                      <Tooltip key={d.date} content={`${formatDate(d.date)}: ${d.free} de ${d.total} livres`}>
                        <span
                          tabIndex={0}
                          role="img"
                          aria-label={text}
                          className={cn(
                            'flex h-14 min-w-0 flex-col justify-between rounded-control p-1.5 sm:h-16 sm:p-2',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                            tone(d.free, d.total),
                          )}
                        >
                          <span className="text-caption leading-none opacity-80">{dd}</span>
                          <span className="tnum text-title-card leading-none">{d.free}</span>
                        </span>
                      </Tooltip>
                    )
                  }),
                ]}
          </div>
        </div>
      )}
    </section>
  )
}
