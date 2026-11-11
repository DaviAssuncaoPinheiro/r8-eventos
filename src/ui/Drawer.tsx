import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Drawer as Vaul } from 'vaul'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from './cn'
import { ensureOverlayStyles, useMediaQuery } from './Dialog'

ensureOverlayStyles()

export type DrawerSide = 'right' | 'bottom'

export interface DrawerProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Elemento que abre a gaveta. O foco volta para ele ao fechar. */
  trigger?: React.ReactElement
  /**
   * Lado. Sem valor: lateral direita a partir de 640px, inferior (vaul, arrasta para fechar) abaixo disso.
   * Informe para forçar um dos dois (documentação).
   */
  side?: DrawerSide
  /** Largura da lateral: 480 (detalhe) ou 640 (formulário longo). */
  width?: 480 | 640
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  /** Rodapé fixo com as ações. */
  footer?: React.ReactNode
  className?: string
}

const sideWidth = { 480: 'w-[480px]', 640: 'w-[640px]' } as const

/**
 * Gaveta. Lateral direita no escritório (Radix Dialog, 100dvh - 24px, a 12px da borda)
 * e inferior no celular (vaul: puxador, altura máx. 90dvh, área segura, arrastar para baixo fecha).
 */
export function Drawer({ open, defaultOpen, onOpenChange, trigger, side, width = 480, title, description, children, footer, className }: DrawerProps) {
  const wide = useMediaQuery('(min-width: 640px)')
  const mode: DrawerSide = side ?? (wide ? 'right' : 'bottom')

  if (mode === 'bottom') {
    return (
      <Vaul.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        {trigger ? <Vaul.Trigger asChild>{trigger}</Vaul.Trigger> : null}
        <Vaul.Portal>
          <Vaul.Overlay className="ds-vaul-scrim ds-root fixed inset-0 z-[60] bg-scrim" />
          <Vaul.Content
            {...(description ? {} : { 'aria-describedby': undefined })}
            className={cn(
              'ds-vaul ds-root fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-h-[90dvh] max-w-[640px] flex-col rounded-t-panel bg-overlay text-fg shadow-overlay outline-none',
              className,
            )}
          >
            <span aria-hidden className="mx-auto mt-2 block h-1 w-9 shrink-0 rounded-pill bg-strong" />
            <div className="shrink-0 px-6 pt-4 pb-2">
              <Vaul.Title className="text-title-sub text-fg">{title}</Vaul.Title>
              {description ? <Vaul.Description className="mt-1 text-body text-fg-2">{description}</Vaul.Description> : null}
            </div>
            {children ? <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div> : null}
            {footer ? <div className="flex shrink-0 flex-col gap-2 border-t border-hairline px-6 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div> : <div className="h-[max(16px,env(safe-area-inset-bottom))]" />}
          </Vaul.Content>
        </Vaul.Portal>
      </Vaul.Root>
    )
  }

  return (
    <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ds-scrim ds-root fixed inset-0 z-[60] bg-scrim" />
        <DialogPrimitive.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'ds-drawer-side ds-root fixed top-3 right-3 bottom-3 z-[60] flex max-w-[calc(100vw-24px)] flex-col rounded-panel bg-overlay text-fg shadow-overlay outline-none',
            sideWidth[width],
            className,
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 pr-3 pl-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-title-sub text-fg">{title}</DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" iconOnly icon={X} aria-label="Fechar" />
            </DialogPrimitive.Close>
          </div>
          {description ? <DialogPrimitive.Description className="-mt-2 shrink-0 px-6 pb-3 text-body text-fg-2">{description}</DialogPrimitive.Description> : null}
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-hairline p-6">{children}</div>
          {footer ? <div className="flex shrink-0 items-center justify-end gap-2 border-t border-hairline px-6 py-4">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
