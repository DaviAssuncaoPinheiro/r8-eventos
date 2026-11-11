import * as React from 'react'
import { cn } from './cn'

export type CardVariant = 'default' | 'sunken' | 'highlight'

const variants: Record<CardVariant, string> = {
  default: 'bg-raised text-fg',
  sunken: 'bg-sunken text-fg',
  /* um por tela: preenchido com a marca, leve degradê de 160° só no fundo */
  /* o anel de foco vira on-accent aqui dentro: a tinta do acento some sobre o próprio acento */
  highlight: 'text-on-accent bg-accent bg-[linear-gradient(160deg,var(--accent)_0%,var(--accent-hover)_100%)] [--ring:var(--on-accent)]',
}

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant
  as?: 'div' | 'section' | 'article'
  /** Padding: md = 20px (desktop), sm = 16px (celular, listas densas), none = 0 (tabela encostada). */
  padding?: 'none' | 'sm' | 'md'
}

export function Card({ variant = 'default', as: Tag = 'section', padding = 'md', className, ...rest }: CardProps) {
  return (
    <Tag
      data-variant={variant}
      className={cn('group/card relative min-w-0 rounded-card', variants[variant], padding === 'md' && 'p-4 sm:p-5', padding === 'sm' && 'p-4', className)}
      {...rest}
    />
  )
}

/** Cabeçalho: título 16/22 peso 650 à esquerda, ação à direita, 16px até o conteúdo. */
export function CardHeader({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex min-h-8 items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-title-card">{title}</h3>
        {description ? <p className="mt-0.5 text-caption text-fg-3 group-data-[variant=highlight]/card:text-on-accent-2">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}
