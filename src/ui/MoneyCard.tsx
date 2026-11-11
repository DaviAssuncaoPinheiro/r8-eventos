import * as React from 'react'
import { ArrowUpRight, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from './cn'
import { Money } from './Money'
import { Tooltip } from './Tooltip'

export interface MoneyCardProps {
  title: string
  /** Valor em reais. Use `display` para número que não é dinheiro. */
  value?: number
  display?: React.ReactNode
  /** Bloco preenchido com a marca. Um por tela. */
  hero?: boolean
  /** Etiqueta ao lado da nota: variação ("+12,4%", com seta) ou contagem ("7 avarias", sem seta). `good` decide a cor. */
  delta?: { label: string; dir?: 'up' | 'down'; good: boolean }
  /** Linha de apoio abaixo do número. */
  note?: React.ReactNode
  /** Como o número é calculado. Abre em tooltip no (i). */
  formula?: string
  /** Leva à lista que compõe o número. Mostra o botão redondo com seta. */
  onOpen?: () => void
  openLabel?: string
  /** Tamanho do número: lg 44px (padrão), md 32px. */
  size?: 'md' | 'lg'
  className?: string
}

/**
 * Cartão de indicador em dinheiro: título, seta redonda que abre a lista, número grande e linha de apoio.
 * O cartão inteiro não é clicável; quem abre é o botão da seta (alvo claro, foco visível).
 */
export function MoneyCard({ title, value, display, hero, delta, note, formula, onOpen, openLabel, size = 'lg', className }: MoneyCardProps) {
  const DeltaIcon = delta?.dir === 'down' ? TrendingDown : delta?.dir === 'up' ? TrendingUp : null
  return (
    <section
      data-variant={hero ? 'highlight' : 'default'}
      className={cn('group/card @container relative flex min-w-0 flex-col rounded-card p-5 sm:p-6', hero ? 'ds-hero' : 'bg-raised text-fg', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 pt-2 text-[15px] leading-5 font-medium @min-[260px]:text-body-lg">{title}</h3>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={openLabel ?? `Ver ${title.toLowerCase()}`}
            className={cn(
              'ds-touch ds-touch-sq inline-flex size-10 shrink-0 items-center justify-center rounded-pill transition-[background-color,color,transform] duration-150 ease-[var(--ease-ui)]',
              'hover:-translate-y-px active:translate-y-0',
              hero ? 'bg-on-accent text-accent-active hover:bg-on-accent/90' : 'text-fg ring-[1.5px] ring-fg ring-inset hover:bg-fg hover:text-raised',
            )}
          >
            <ArrowUpRight size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      {/* o número acompanha a largura do cartão: 44px no cartão largo, nunca abaixo de 30px */}
      <div className={cn('mt-3', size === 'lg' ? 'text-kpi-lg text-[clamp(30px,17.5cqw,44px)]' : 'text-kpi')}>
        {display ?? <Money value={value ?? 0} variant="kpi" toneNegative={false} />}
      </div>

      {delta || note || formula ? (
        <div className={cn('mt-3 flex items-center gap-x-2 text-caption', hero ? 'text-on-accent-2' : 'text-fg-2')}>
          {delta ? (
            <span
              className={cn(
                'inline-flex h-[22px] shrink-0 items-center gap-1 rounded-[7px] px-1.5 font-semibold whitespace-nowrap',
                hero ? 'bg-on-accent/15 text-on-accent' : delta.good ? 'bg-ok-soft text-ok-ink' : 'bg-danger-soft text-danger-ink',
              )}
            >
              {DeltaIcon ? <DeltaIcon size={14} strokeWidth={2} aria-hidden /> : null}
              {delta.label}
            </span>
          ) : null}
          {note ? <span className="min-w-0 flex-1">{note}</span> : <span className="flex-1" />}
          {formula ? (
            <Tooltip content={formula}>
              <button
                type="button"
                aria-label={`Como é calculado: ${title}`}
                className={cn(
                  'ds-hit relative inline-flex size-5 shrink-0 items-center justify-center rounded-pill transition-colors duration-150',
                  hero ? 'text-on-accent-2 hover:text-on-accent' : 'text-fg-3 hover:text-fg',
                )}
              >
                <Info size={16} strokeWidth={2} aria-hidden />
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
