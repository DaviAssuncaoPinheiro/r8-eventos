import { ZONE, type ZoneId } from '@/data/geo'
import type { JobType } from '@/data/mock'
import { JOB_TYPE, JOB_TYPES } from '@/lib/status'
import { cn } from '@/lib/utils'

export const zoneTint = (id: ZoneId, pct = 16) => `color-mix(in srgb, ${ZONE[id].hex} ${pct}%, var(--color-card))`

export function ZoneChip({ id, size = 'sm', className }: { id: ZoneId; size?: 'xs' | 'sm'; className?: string }) {
  const z = ZONE[id]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap text-ink', size === 'xs' ? 'h-5 px-2 text-[10.5px]' : 'h-6 px-2.5 text-[11.5px]', className)}
      style={{ background: zoneTint(id, 20) }}
    >
      <span className="size-1.5 rounded-full" style={{ background: z.hex }} />
      {z.short}
    </span>
  )
}

/** Chips de tipo de serviço: legenda e filtro ao mesmo tempo */
export function TypeFilter({ value, onToggle, counts, className }: { value: JobType[]; onToggle: (t: JobType) => void; counts?: Partial<Record<JobType, number>>; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex items-center gap-1.5 overflow-x-auto', className)}>
      {JOB_TYPES.map((t) => {
        const on = value.includes(t)
        const Icon = JOB_TYPE[t].icon
        return (
          <button
            key={t}
            onClick={() => onToggle(t)}
            aria-pressed={on}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors',
              on ? 'bg-card text-ink shadow-pill' : 'bg-muted text-ink-4 line-through decoration-ink-4/60',
            )}
          >
            <span className="flex size-4 items-center justify-center rounded-full" style={{ background: on ? JOB_TYPE[t].color : 'var(--color-ink-4)' }}>
              <Icon className="size-2.5 text-white" strokeWidth={2.6} />
            </span>
            {t}
            {counts?.[t] != null && <span className="num text-ink-3">{counts[t]}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function CapacityBar({ ratio, className }: { ratio: number; className?: string }) {
  const color = ratio > 1 ? 'var(--color-red)' : ratio > 0.85 ? 'var(--color-yellow)' : 'var(--color-blue)'
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.min(100, ratio * 100)}%`, background: color }} />
    </div>
  )
}

/** Selo branco dentro da barra, igual ao "• Aprovado" da referência */
export function InnerBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-white px-2 text-[10px] leading-none font-bold whitespace-nowrap text-ink shadow-[0_1px_2px_rgba(17,18,20,.12)]">• {children}</span>
}
