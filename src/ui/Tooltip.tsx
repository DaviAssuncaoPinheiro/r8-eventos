import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from './cn'

export const TooltipProvider = TooltipPrimitive.Provider

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Abre sem interação (documentação e capturas). */
  open?: boolean
  className?: string
}

/* fundo --inverse, texto 12/16 peso 500, raio 8, padding 8×10, largura máx. 260, atraso 300ms */
export function Tooltip({ content, children, side = 'top', open, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={300} open={open}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'z-[90] max-w-[260px] rounded-tip bg-inverse px-2.5 py-2 text-caption text-on-inverse',
            'data-[state=delayed-open]:animate-[ds-tip-in_150ms_var(--ease-ui)]',
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-inverse" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/** Conteúdo com título e linhas de valor, como no gráfico: "03/11/2026 · Limpeza 12". */
export function TooltipBody({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="min-w-36">
      <div className="mb-1 font-semibold">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 text-on-inverse-2">
          <span className="inline-flex items-center gap-1.5">
            {r.color ? <span aria-hidden className="h-2.5 w-[3px] rounded-pill" style={{ background: r.color }} /> : null}
            {r.label}
          </span>
          <span className="tnum font-semibold text-on-inverse">{r.value}</span>
        </div>
      ))}
    </div>
  )
}
