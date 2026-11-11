import * as React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/ui'

export interface HBarRow {
  key: string
  label: string
  value: number
  /** texto do valor (já formatado) */
  valueLabel: string
  href?: string
  tone?: 'strong' | 'solid' | 'soft' | 'idle'
}

const TONE = {
  strong: 'bg-accent-active',
  solid: 'bg-accent',
  soft: 'bg-[var(--bar-soft)]',
  idle: 'ds-hatch bg-sunken ring-1 ring-inset ring-idle',
}

/** Barras horizontais em pílula: nome, barra proporcional ao maior valor e valor. Crescem uma vez ao montar. */
export function HBars({ rows, label, className, labelWidth = 168 }: { rows: HBarRow[]; label: string; className?: string; labelWidth?: number }) {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <ul aria-label={label} className={cn('m-0 flex list-none flex-col gap-1.5 p-0', className)}>
      {rows.map((r, i) => {
        const pct = Math.max((r.value / max) * 100, 3)
        const inner = (
          <>
            <span className="min-w-0 truncate text-body-lg font-medium text-fg">{r.label}</span>
            <span aria-hidden className="relative block h-7 min-w-0 rounded-pill sm:h-8">
              <span
                className={cn('absolute inset-y-0 left-0 block rounded-pill transition-[width] duration-[700ms] ease-[var(--ease-ui)]', TONE[r.tone ?? (i === 0 ? 'strong' : 'soft')])}
                style={{ width: on ? `${pct}%` : '0%', transitionDelay: `${i * 50}ms` }}
              />
            </span>
            <span className="tnum text-right text-body-lg font-semibold whitespace-nowrap text-fg">{r.valueLabel}</span>
          </>
        )
        const cls = 'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-control px-2 py-1.5 sm:grid-cols-[var(--lw)_1fr_auto] [&>span:nth-child(2)]:col-span-2 sm:[&>span:nth-child(2)]:col-span-1 [&>span:nth-child(2)]:row-start-2 sm:[&>span:nth-child(2)]:row-start-auto'
        return (
          <li key={r.key} style={{ '--lw': `${labelWidth}px` } as React.CSSProperties}>
            {r.href ? (
              <Link to={r.href} className={cn(cls, 'ds-touch -mx-2 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring')}>
                {inner}
              </Link>
            ) : (
              <div className={cn(cls, '-mx-2')}>{inner}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
