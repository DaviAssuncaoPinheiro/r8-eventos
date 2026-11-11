import * as React from 'react'
import { cn } from '@/ui'

/** Anel de proporção (0 a 100). O traço cresce uma vez ao montar. */
export function Ring({ pct, size = 52, tone = 'ok', label }: { pct: number; size?: number; tone?: 'ok' | 'warn' | 'danger'; label: string }) {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const stroke = 6
  const r = (size - stroke) / 2
  const value = Math.min(Math.max(pct, 0), 100) / 100
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-sunken" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={on ? 1 - value : 1}
        className={cn('transition-[stroke-dashoffset] duration-[900ms] ease-[var(--ease-ui)]', tone === 'ok' && 'stroke-ok', tone === 'warn' && 'stroke-warn', tone === 'danger' && 'stroke-danger')}
      />
    </svg>
  )
}
