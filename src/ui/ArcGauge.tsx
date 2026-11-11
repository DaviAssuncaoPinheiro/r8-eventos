import * as React from 'react'
import { cn } from './cn'

export interface ArcSegment {
  label: string
  value: number
  /** solid: acento; strong: acento escuro; idle: hachura (parado, sem uso). */
  tone: 'solid' | 'strong' | 'idle'
}

export interface ArcGaugeProps {
  segments: ArcSegment[]
  /** Número grande no centro ("76%"). */
  center: string
  /** Legenda curta sob o número ("do estoque rendendo"). */
  caption: string
  /** Resumo para leitor de tela. */
  label: string
  className?: string
}

const W = 320
const H = 176
const R = 124
const STROKE = 44
const CX = W / 2
const CY = 160

function point(angle: number) {
  // 180° (esquerda) até 0° (direita), sentido horário
  const rad = (Math.PI * (180 - angle)) / 180
  return [CX + R * Math.cos(rad), CY - R * Math.sin(rad)] as const
}
function arc(from: number, to: number) {
  const [x1, y1] = point(from)
  const [x2, y2] = point(to)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/** Medidor em meio arco para uma proporção só (ocupação do estoque). Legenda por conta de quem usa. */
export function ArcGauge({ segments, center, caption, label, className }: ArcGaugeProps) {
  const id = React.useId().replace(/:/g, '')
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const GAP = 0 // os trechos se sobrepõem pelas pontas arredondadas, como na referência
  let cursor = 0
  const parts = segments.map((s) => {
    const span = (s.value / total) * 180
    const from = cursor
    cursor += span
    return { ...s, from, to: Math.max(cursor - GAP, from + 0.01) }
  })
  // desenha de trás para frente: o primeiro trecho fica por cima, com a ponta redonda visível
  const order = [...parts].reverse()
  return (
    <div className={cn('relative mx-auto w-full max-w-[320px]', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block w-full overflow-visible">
        <defs>
          <pattern id={`h${id}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="9" height="9" fill="var(--sunken)" />
            <rect width="3.5" height="9" fill="var(--idle)" />
          </pattern>
        </defs>
        {order.map((p) => (
          <path
            key={p.label}
            d={arc(p.from, p.to)}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            pathLength={p.tone === 'idle' ? undefined : 1}
            className={p.tone === 'idle' ? undefined : 'ds-arc'}
            stroke={p.tone === 'idle' ? `url(#h${id})` : p.tone === 'strong' ? 'var(--accent-active)' : 'var(--accent)'}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-[52px] leading-[56px] font-semibold tracking-[-0.035em] text-fg">{center}</span>
        {caption ? <span className="text-caption font-medium text-accent-ink">{caption}</span> : null}
      </div>
    </div>
  )
}
