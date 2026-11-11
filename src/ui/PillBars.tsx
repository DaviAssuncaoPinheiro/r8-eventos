import * as React from 'react'
import { cn } from './cn'

export interface PillBar {
  label: string
  /** Rótulo completo para leitor de tela e tooltip ("Novembro"). */
  fullLabel?: string
  value: number
  /** soft: períodos anteriores; solid: destaque; strong: o maior ou o atual; idle: sem movimento (hachura). */
  tone?: 'soft' | 'solid' | 'strong' | 'idle'
}

export interface PillBarsProps {
  data: PillBar[]
  /** Formata o valor da barra em foco ("R$ 48.312,90"). */
  format: (v: number) => string
  /** Índice da barra que começa em destaque (padrão: a última). */
  defaultActive?: number
  /** Altura da área das barras em px. */
  height?: number
  /** Resumo para leitor de tela. */
  label: string
  className?: string
}

const tones: Record<NonNullable<PillBar['tone']>, string> = {
  soft: 'bg-[var(--bar-soft)]',
  solid: 'bg-accent',
  strong: 'bg-accent-active',
  idle: 'ds-hatch bg-sunken ring-1 ring-inset ring-edge',
}

/**
 * Barras em pílula: poucas categorias (até 8), leitura de relance.
 * A barra em foco (mouse, toque ou teclado) mostra o valor completo numa etiqueta acima dela.
 */
export function PillBars({ data, format, defaultActive, height = 184, label, className }: PillBarsProps) {
  const [active, setActive] = React.useState(defaultActive ?? data.length - 1)
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className={cn('min-w-0', className)}>
      <ul aria-label={label} className="flex items-end gap-2 sm:gap-3" style={{ height: height + 34 }}>
        {data.map((d, i) => {
          const h = Math.max(Math.round((d.value / max) * height), 44)
          const on = i === active
          return (
            <li key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <span
                aria-hidden
                className={cn(
                  'relative z-10 mb-1.5 h-[26px] rounded-tip px-2 text-caption leading-[26px] font-semibold whitespace-nowrap transition-opacity duration-150',
                  // nas pontas a etiqueta alinha pela borda da barra, para não sair do cartão
                  i === 0 && data.length > 3 && 'self-start',
                  i === data.length - 1 && data.length > 3 && 'self-end',
                  on ? 'bg-inverse text-on-inverse opacity-100' : 'opacity-0',
                )}
              >
                {format(d.value)}
              </span>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-label={`${d.fullLabel ?? d.label}: ${format(d.value)}`}
                aria-pressed={on}
                style={{ height: h, animationDelay: `${i * 40}ms` }}
                className={cn(
                  'ds-grow-y w-full max-w-[64px] rounded-pill transition-[height,filter] duration-250 ease-[var(--ease-ui)]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  tones[d.tone ?? 'soft'],
                  on && d.tone !== 'idle' && 'brightness-95',
                )}
              />
            </li>
          )
        })}
      </ul>
      <div aria-hidden className="mt-2 flex gap-2 sm:gap-3">
        {data.map((d, i) => (
          <span key={d.label} className={cn('min-w-0 flex-1 truncate text-center text-caption', i === active ? 'font-semibold text-fg' : 'text-fg-3')}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
