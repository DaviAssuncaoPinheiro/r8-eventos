import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

export interface EmptyStateProps {
  /** Ícone 24 em círculo 48. Omitido na variante "busca". */
  icon?: LucideIcon
  /** Diz o que vai aparecer aqui: "As avarias registradas pela equipe aparecem aqui". */
  title: string
  /** Próximo passo, em uma frase. */
  children?: React.ReactNode
  /** Botão que resolve o vazio. */
  action?: React.ReactNode
  /** "busca": sem círculo de ícone, para lista filtrada sem resultado. */
  variant?: 'default' | 'search'
  className?: string
}

/** Estado vazio: fica dentro do contêiner que estaria cheio (cartão, tabela, gráfico), nunca solto na página. */
export function EmptyState({ icon: Icon, title, children, action, variant = 'default', className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      {variant === 'default' && Icon ? (
        <span aria-hidden className="mb-4 flex size-12 items-center justify-center rounded-pill bg-sunken text-fg-3">
          <Icon size={24} strokeWidth={2} />
        </span>
      ) : null}
      <p className="max-w-[360px] text-title-card text-fg">{title}</p>
      {children ? <p className="mt-1.5 max-w-[360px] text-body text-fg-2">{children}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  )
}
