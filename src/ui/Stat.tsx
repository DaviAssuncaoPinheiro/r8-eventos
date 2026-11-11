import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'
import { cn } from './cn'
import { Money } from './Money'
import { Tooltip } from './Tooltip'
import { formatPercent } from '@/lib/format'

export interface StatProps {
  label: string
  /** Número em reais (usa Money) ou texto pronto ("12 unidades"). */
  value: number | string | null
  money?: boolean
  /** Variação em fração: 0.124 = +12,4%. */
  delta?: number
  /** Para métricas de perda (avaria, atraso), subir é ruim. */
  deltaInverted?: boolean
  deltaLabel?: string
  /** Texto do "como é calculado". */
  formula?: React.ReactNode
  size?: 'md' | 'lg'
  /** Sobre o cartão destaque (fundo da marca). */
  onAccent?: boolean
  className?: string
  /** Abre o tooltip da fórmula (documentação). */
  formulaOpen?: boolean
}

export function Stat({ label, value, money, delta, deltaInverted, deltaLabel, formula, size = 'md', onAccent, className, formulaOpen }: StatProps) {
  const good = delta === undefined ? undefined : deltaInverted ? delta < 0 : delta >= 0
  const Arrow = delta !== undefined && delta < 0 ? ArrowDownRight : ArrowUpRight
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex min-h-6 items-center gap-1">
        <span className={cn('truncate text-body font-semibold', onAccent ? 'text-on-accent-2' : 'text-fg-2')}>{label}</span>
        {formula ? (
          <Tooltip content={formula} open={formulaOpen}>
            <button
              type="button"
              aria-label={`Como é calculado: ${label}`}
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-pill transition-[background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                'pointer-coarse:size-11 pointer-coarse:-m-2.5',
                onAccent ? 'text-on-accent-2 hover:bg-white/15 hover:text-on-accent' : 'text-fg-3 hover:bg-hover hover:text-fg',
              )}
            >
              <Info size={16} strokeWidth={2} aria-hidden />
            </button>
          </Tooltip>
        ) : null}
      </div>
      {value === null ? (
        <div className={cn('flex items-center text-body-lg', size === 'lg' ? 'h-11' : 'h-[34px]', onAccent ? 'text-on-accent-2' : 'text-fg-3')}>Sem dados no período</div>
      ) : (
      <div className={cn(size === 'lg' ? 'text-kpi-lg' : 'text-kpi', onAccent ? 'text-on-accent' : 'text-fg')}>
        {typeof value === 'number' ? money ? <Money value={value} variant="kpi" toneNegative={!onAccent} /> : <span className="tnum">{value.toLocaleString('pt-BR')}</span> : <span className="tnum">{value}</span>}
      </div>
      )}
      {delta !== undefined ? (
        <div className={cn('flex flex-wrap items-center gap-x-1.5 text-caption', onAccent ? 'text-on-accent-2' : 'text-fg-3')}>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold tnum',
              onAccent ? 'text-on-accent' : good ? 'text-ok-ink' : 'text-danger-ink',
            )}
          >
            <Arrow size={14} strokeWidth={2.25} aria-hidden />
            {formatPercent(delta, { sign: true })}
          </span>
          {deltaLabel ? <span>{deltaLabel}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
