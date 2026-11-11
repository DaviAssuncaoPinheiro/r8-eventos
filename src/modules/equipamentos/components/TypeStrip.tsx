import { Money, Skeleton, cn } from '@/ui'
import type { StockRow } from '@/services'
import { TypeThumb } from './TypeThumb'

/** Barra de ocupação em segmentos: em campo, limpeza, manutenção, parado. Soma sempre o total do tipo. */
export function OccupancyBar({ row, className }: { row: StockRow; className?: string }) {
  const parts = [
    { key: 'campo', n: row.inField, cls: 'bg-accent' },
    { key: 'limpeza', n: row.cleaning, cls: 'bg-accent-active' },
    { key: 'manut', n: row.maintenance, cls: 'bg-warn' },
    { key: 'parado', n: row.available, cls: 'ds-hatch bg-sunken ring-1 ring-idle ring-inset' },
  ].filter((p) => p.n > 0)
  return (
    <div
      role="img"
      aria-label={`${row.type.name}: ${row.inField} em campo, ${row.cleaning} em limpeza, ${row.maintenance} em manutenção, ${row.available} parados, de ${row.total}`}
      className={cn('flex h-3 gap-0.5', className)}
    >
      {parts.map((p) => (
        <span key={p.key} className={cn('min-w-1.5 rounded-pill', p.cls)} style={{ flexGrow: p.n }} />
      ))}
    </div>
  )
}

export function TypeStrip({ rows, loading, selected, onSelect }: { rows?: StockRow[]; loading: boolean; selected?: string; onSelect: (typeId: string | undefined) => void }) {
  return (
    <div aria-busy={loading || undefined} className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
      {loading || !rows
        ? Array.from({ length: 6 }, (_, i) => (
            <div key={i} aria-hidden className="w-[236px] shrink-0 rounded-card bg-raised p-2">
              <Skeleton shape="block" className="aspect-[4/3] h-auto rounded-[16px]" />
              <div className="p-3">
                <Skeleton className="w-3/4" />
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-4 w-1/2" />
              </div>
            </div>
          ))
        : rows.map((r) => {
            const on = selected === r.type.id
            return (
              <button
                key={r.type.id}
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? undefined : r.type.id)}
                className={cn(
                  'group w-[236px] shrink-0 snap-start rounded-card bg-raised p-2 text-left transition-[box-shadow,transform] duration-200 ease-[var(--ease-ui)]',
                  'hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  on ? 'ring-2 ring-accent ring-inset' : 'ring-1 ring-transparent ring-inset',
                )}
              >
                <TypeThumb src={r.type.photo} alt={r.type.name} typeId={r.type.id} tag={r.type.short} className="aspect-[4/3] w-full rounded-[16px]" />
                <span className="block px-3 pt-3 pb-2">
                  <span className="block truncate text-title-card">{r.type.name}</span>
                  <OccupancyBar row={r} className="mt-3" />
                  <span className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="tnum text-title-sub">
                      {r.inField}
                      <span className="text-fg-3"> / {r.total}</span>
                    </span>
                    <Money value={r.monthRevenue} className="text-body font-semibold text-fg-2" />
                  </span>
                </span>
              </button>
            )
          })}
    </div>
  )
}
