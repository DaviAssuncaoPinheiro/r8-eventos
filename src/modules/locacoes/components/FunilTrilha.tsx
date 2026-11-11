import { ChevronRight } from 'lucide-react'
import { RENTAL_FLOW, RENTAL_STATUS } from '@/app/status'
import { Money, cn, useCountUp } from '@/ui'
import type { RentalListItem, RentalStatus } from '@/services'
import { STAGE_TONE_BAR } from '../util'

function Stage({ stage, count, value, max, active, onClick, last }: { stage: RentalStatus; count: number; value: number; max: number; active: boolean; onClick: () => void; last: boolean }) {
  const shown = Math.round(useCountUp(count))
  const pct = max > 0 ? Math.max(count / max, count > 0 ? 0.08 : 0) : 0
  return (
    <li className={cn('relative min-w-0', last && '@max-[899px]/funil:col-span-2')}>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={`${RENTAL_STATUS[stage].label}: ${count} ${count === 1 ? 'locação' : 'locações'}, ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. ${active ? 'Remover filtro' : 'Filtrar'}`}
        className={cn(
          'group flex h-full w-full flex-col gap-2.5 rounded-card p-3 @min-[900px]/funil:gap-3 @min-[900px]/funil:p-4 text-left transition-colors duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          active ? 'bg-accent-soft' : 'hover:bg-hover',
        )}
      >
        <span className="flex items-center gap-2 text-body font-semibold text-fg">
          <span aria-hidden className={cn('size-2.5 rounded-pill', STAGE_TONE_BAR[stage])} />
          {RENTAL_STATUS[stage].label}
        </span>
        <span className={cn('text-kpi tnum @min-[900px]/funil:text-kpi-lg', active ? 'text-accent-ink' : 'text-fg')}>{shown}</span>
        <span aria-hidden className="h-2 w-full overflow-hidden rounded-pill bg-sunken">
          <span className={cn('block h-full rounded-pill', STAGE_TONE_BAR[stage])} style={{ width: `${pct * 100}%` }} />
        </span>
        <Money value={value} className="text-body-lg font-semibold text-fg" />
      </button>
      {!last ? <ChevronRight aria-hidden size={18} strokeWidth={2} className="absolute top-1/2 -right-2.5 z-[1] hidden -translate-y-1/2 rounded-pill bg-raised text-fg-3 @min-[900px]/funil:block" /> : null}
    </li>
  )
}

/** Funil das cinco etapas: contagem, valor somado e filtro por clique. */
export function FunilTrilha({ rentals, status, onSelect }: { rentals: RentalListItem[]; status?: RentalStatus; onSelect: (s?: RentalStatus) => void }) {
  const rows = RENTAL_FLOW.map((s) => {
    const list = rentals.filter((r) => r.status === s)
    return { stage: s, count: list.length, value: list.reduce((a, r) => a + r.total, 0) }
  })
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <section aria-label="Funil de locações" className="@container/funil rounded-card bg-raised p-2 sm:p-3">
      <ol className="grid grid-cols-2 gap-1 @min-[900px]/funil:grid-cols-5">
        {rows.map((r, i) => (
          <Stage key={r.stage} {...r} max={max} active={status === r.stage} onClick={() => onSelect(status === r.stage ? undefined : r.stage)} last={i === rows.length - 1} />
        ))}
      </ol>
    </section>
  )
}
