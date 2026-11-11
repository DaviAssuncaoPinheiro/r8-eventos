import * as React from 'react'
import { ArrowUpRight, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from './cn'
import { Money } from './Money'
import { Tooltip } from './Tooltip'
import { useCountUp } from './useCountUp'

export interface MoneyCardProps {
  title: string
  /** Valor em reais. Use `display` para número que não é dinheiro. */
  value?: number
  display?: React.ReactNode
  /** Bloco preenchido com a marca. Um por tela. */
  hero?: boolean
  /** Uma etiqueta curta, no máximo: variação ("+8,2%", com seta) ou contagem. Sem frase de apoio. */
  tag?: { label: string; dir?: 'up' | 'down'; good?: boolean }
  /** Como o número é calculado. Abre em tooltip no (i) ao lado do título. */
  formula?: string
  /** Leva à lista que compõe o número. Mostra o botão redondo com seta. */
  onOpen?: () => void
  openLabel?: string
  /** Tamanho do número: lg 44 px (padrão), xl 56 px (destaque largo), md 32 px. */
  size?: 'md' | 'lg' | 'xl'
  /** Desenho abaixo do número (minigráfico, barra de proporção). Nunca texto corrido. */
  children?: React.ReactNode
  className?: string
}

const sizes = {
  md: 'text-kpi',
  lg: 'text-kpi-lg text-[clamp(30px,17.5cqw,44px)]',
  xl: 'text-kpi-lg text-[clamp(36px,15cqw,56px)] leading-[1.05]',
}

/**
 * Cartão de indicador em dinheiro: título, número grande e a seta que abre a lista. Nada mais.
 * O número sobe de zero ao aparecer. No destaque, um foco de luz acompanha o ponteiro.
 */
export function MoneyCard({ title, value, display, hero, tag, formula, onOpen, openLabel, size = 'lg', children, className }: MoneyCardProps) {
  const shown = useCountUp(value ?? 0)
  const TagIcon = tag?.dir === 'down' ? TrendingDown : tag?.dir === 'up' ? TrendingUp : null
  const onMove = hero
    ? (e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
    : undefined
  return (
    <section
      data-variant={hero ? 'highlight' : 'default'}
      onPointerMove={onMove}
      className={cn('group/card @container relative flex min-w-0 flex-col rounded-card p-5 sm:p-6', hero ? 'ds-hero ds-hero-card' : 'bg-raised text-fg', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 pt-2 text-[15px] leading-5 font-medium @min-[250px]:text-body-lg">{title}</h3>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={openLabel ?? `Ver ${title.toLowerCase()}`}
            className={cn(
              'ds-touch ds-touch-sq group/arrow inline-flex size-10 shrink-0 items-center justify-center rounded-pill transition-[background-color,color] duration-150 ease-[var(--ease-ui)]',
              hero ? 'bg-on-accent text-accent-active' : 'text-fg ring-[1.5px] ring-fg ring-inset hover:bg-fg hover:text-raised',
            )}
          >
            <ArrowUpRight size={20} strokeWidth={2} aria-hidden className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover/arrow:rotate-45" />
          </button>
        ) : null}
      </div>

      {/* a etiqueta fica acima do número, para os números de todos os cartões da linha alinharem pela base */}
      <div className="mt-auto flex flex-col items-start gap-2 pt-5">
        {tag ? (
          <span
            className={cn(
              'inline-flex h-6 shrink-0 items-center gap-1 rounded-pill px-2 text-caption font-semibold whitespace-nowrap',
              hero ? 'bg-on-accent text-accent-active' : tag.good === false ? 'bg-danger-soft text-danger-ink' : tag.good ? 'bg-ok-soft text-ok-ink' : 'bg-sunken text-fg-2',
            )}
          >
            {TagIcon ? <TagIcon size={14} strokeWidth={2} aria-hidden /> : null}
            {tag.label}
          </span>
        ) : null}
        <div className={sizes[size]}>{display ?? <Money value={shown} variant="kpi" toneNegative={false} />}</div>
      </div>
      {formula ? (
        <Tooltip content={formula}>
          <button
            type="button"
            aria-label={`Como é calculado: ${title}`}
            className={cn(
              'ds-hit absolute right-5 bottom-5 inline-flex size-6 items-center justify-center rounded-pill opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 focus-visible:opacity-100 sm:right-6 sm:bottom-6 [@media(hover:none)]:opacity-60',
              hero ? 'text-on-accent' : 'text-fg-3 hover:text-fg',
            )}
          >
            <Info size={16} strokeWidth={2} aria-hidden />
          </button>
        </Tooltip>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}
