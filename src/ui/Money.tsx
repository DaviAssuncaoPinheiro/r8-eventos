import { cn } from './cn'
import { formatMoney } from '@/lib/format'

export interface MoneyProps {
  value: number
  /** inline: texto corrido; cell: célula de tabela (alinha à direita); kpi: número grande com "R$" e centavos menores. */
  variant?: 'inline' | 'cell' | 'kpi'
  /** Mostra "+" em valores positivos (variação, extra). */
  sign?: boolean
  /** Negativo em --danger-ink. Padrão: true. */
  toneNegative?: boolean
  className?: string
}

/** Dinheiro sempre "R$ 12.480,00", com algarismos tabulares e sem quebra de linha. */
export function Money({ value, variant = 'inline', sign, toneNegative = true, className }: MoneyProps) {
  const full = formatMoney(value, { sign })
  const neg = value < 0 && toneNegative
  if (variant === 'kpi') {
    const m = /^([+-]?)R\$ (.+),(\d{2})$/.exec(full)
    const [, s, int, cents] = m ?? ['', '', full, '']
    return (
      <span className={cn('inline-flex items-baseline whitespace-nowrap', neg && 'text-danger-ink', className)}>
        <span className="sr-only">{full}</span>
        {/* prefixo e centavos a 80%; no cartão destaque ficam inteiros (o acento já reduz o contraste) */}
        <span aria-hidden className="mr-1 text-[0.5em] font-semibold opacity-80 group-data-[variant=highlight]/card:opacity-100 in-[.ds-hero]:opacity-100">
          {s}R$
        </span>
        <span aria-hidden>{int}</span>
        <span aria-hidden className="text-[0.6em] font-semibold opacity-80 group-data-[variant=highlight]/card:opacity-100 in-[.ds-hero]:opacity-100">
          ,{cents}
        </span>
      </span>
    )
  }
  return <span className={cn('tnum whitespace-nowrap', variant === 'cell' && 'block text-right', neg && 'text-danger-ink', className)}>{full}</span>
}
