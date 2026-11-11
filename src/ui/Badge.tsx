import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

export type StatusTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'info' | 'idle'

const soft: Record<StatusTone, string> = {
  neutral: 'bg-sunken text-fg-2',
  accent: 'bg-accent-soft text-accent-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-info-soft text-info-ink',
  idle: 'bg-sunken text-fg-2',
}

const dot: Record<StatusTone, string> = {
  neutral: 'bg-fg-3',
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  idle: 'bg-transparent ring-[1.5px] ring-inset ring-idle',
}

/** Etiqueta curta em pílula: 24px de altura, 12px peso 600. Para contagem, tipo, situação de cobrança. */
export function Badge({ tone = 'neutral', icon: Icon, className, children }: { tone?: StatusTone; icon?: LucideIcon; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-pill px-2 text-caption font-semibold whitespace-nowrap', soft[tone], className)}>
      {Icon ? <Icon size={14} strokeWidth={2} aria-hidden /> : null}
      {children}
    </span>
  )
}

/** Situação em tabela e lista: ponto 8px + rótulo. A cor nunca vem sozinha: o rótulo é obrigatório. */
export function StatusDot({ tone = 'neutral', className, children }: { tone?: StatusTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-body whitespace-nowrap text-fg', className)}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-pill', dot[tone])} />
      {children}
    </span>
  )
}
