import * as React from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { cn } from './cn'

export type BannerTone = 'info' | 'warn' | 'danger' | 'ok'

const tones: Record<BannerTone, { box: string; ink: string; icon: LucideIcon }> = {
  info: { box: 'bg-info-soft', ink: 'text-info-ink', icon: Info },
  warn: { box: 'bg-warn-soft', ink: 'text-warn-ink', icon: TriangleAlert },
  danger: { box: 'bg-danger-soft', ink: 'text-danger-ink', icon: CircleAlert },
  ok: { box: 'bg-ok-soft', ink: 'text-ok-ink', icon: CircleCheck },
}

export interface BannerProps {
  tone?: BannerTone
  title: string
  children?: React.ReactNode
  /** Botão secundário sm à direita. */
  action?: React.ReactNode
  /** Quando informado, mostra o botão de fechar. */
  onClose?: () => void
  className?: string
}

/** Faixa de aviso em linha, no topo do conteúdo. Não flutua e não tem borda lateral. */
export function Banner({ tone = 'info', title, children, action, onClose, className }: BannerProps) {
  const t = tones[tone]
  const Icon = t.icon
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-card px-4 py-3', t.box, className)}>
      <Icon size={18} strokeWidth={2} aria-hidden className={cn('mt-px shrink-0', t.ink)} />
      <div className="min-w-0 flex-1 text-body">
        <span className={cn('font-semibold', t.ink)}>{title}</span>
        {children ? <span className="text-fg"> {children}</span> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className={cn(
            'ds-touch -my-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-control transition-colors duration-150',
            'hover:bg-raised/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            t.ink,
          )}
        >
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
