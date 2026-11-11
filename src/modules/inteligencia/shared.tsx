import * as React from 'react'
import { Info } from 'lucide-react'
import { Tooltip, cn, reduced } from '@/ui'
import { MONTHS_LONG } from '@/domain/dates'

/** Verdadeiro um instante depois de montar (ou já de início com "reduzir movimento"): dispara a entrada de barras e anéis. */
export function useIn(delay = 0): boolean {
  const [on, setOn] = React.useState(() => reduced())
  React.useEffect(() => {
    if (reduced()) {
      setOn(true)
      return
    }
    const id = window.setTimeout(() => setOn(true), delay + 40)
    return () => window.clearTimeout(id)
  }, [delay])
  return on
}

/** Botão (i) com o "como é calculado". */
export function InfoTip({ label, text, className }: { label: string; text: string; className?: string }) {
  return (
    <Tooltip content={text} toggleOnClick>
      <button
        type="button"
        aria-label={`Como é calculado: ${label}`}
        className={cn('ds-hit inline-flex size-6 shrink-0 items-center justify-center rounded-pill text-fg-3 transition-colors duration-150 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
      >
        <Info size={16} strokeWidth={2} aria-hidden />
      </button>
    </Tooltip>
  )
}

/** Anel de progresso (0 a 100). `tone` é uma classe de cor de traço (stroke-accent, stroke-danger…). */
export function Ring({ pct, size = 56, stroke = 7, tone = 'stroke-accent', children, label, delay = 0 }: { pct: number; size?: number; stroke?: number; tone?: string; children?: React.ReactNode; label?: string; delay?: number }) {
  const on = useIn(delay)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, pct))
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-sunken" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={cn(tone, 'transition-[stroke-dashoffset] duration-[900ms] ease-[var(--ease-ui)] motion-reduce:transition-none')}
          strokeDasharray={c}
          strokeDashoffset={on ? c * (1 - p / 100) : c}
        />
      </svg>
      {children ? <span className="absolute inset-0 grid place-items-center">{children}</span> : null}
    </span>
  )
}

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((p) => p.length > 2 || /^[A-ZÀ-Ý]/.test(p))
  const a = parts[0]?.[0] ?? name[0] ?? '?'
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? '')
  return (a + b).toUpperCase()
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const monthName = (key: string) => cap(MONTHS_LONG[Number(key.slice(5, 7)) - 1] ?? key)
export const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Pílula que cresce da esquerda ao montar. */
export function GrowBar({ pct, className, delay = 0, style }: { pct: number; className?: string; delay?: number; style?: React.CSSProperties }) {
  const on = useIn(delay)
  return <span className={cn('block h-full rounded-pill transition-[width] duration-[800ms] ease-[var(--ease-ui)] motion-reduce:transition-none', className)} style={{ ...style, width: on ? `${Math.max(0, Math.min(100, pct))}%` : '0%' }} />
}
