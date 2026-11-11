import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

/** Elemento da moldura do app: gavetas abrem dentro dele (e não na janela do computador). */
export const FrameContext = React.createContext<HTMLElement | null>(null)

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

/** Gaveta inferior do app da equipe de rua. */
export function Sheet({ open, onOpenChange, title, children, footer }: SheetProps) {
  const container = React.useContext(FrameContext)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container ?? undefined}>
        <Dialog.Overlay className="absolute inset-0 z-50 bg-scrim data-[state=open]:animate-[ds-fade-in_250ms_var(--ease-ui)] data-[state=closed]:animate-[ds-fade-out_175ms_var(--ease-ui)_forwards]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="absolute inset-x-0 bottom-0 z-50 flex max-h-[88%] flex-col rounded-t-panel bg-overlay text-fg shadow-overlay outline-none data-[state=open]:animate-[ds-sheet-in_250ms_var(--ease-ui)] data-[state=closed]:animate-[ds-sheet-out_175ms_var(--ease-ui)_forwards]"
        >
          <span aria-hidden className="mx-auto mt-2 block h-1 w-9 shrink-0 rounded-pill bg-strong" />
          <div className="flex shrink-0 items-center justify-between gap-2 pt-2 pr-3 pl-5">
            <Dialog.Title className="min-w-0 truncate text-title-sub">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Fechar"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-control text-fg-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X size={24} strokeWidth={2} aria-hidden />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-4">{children}</div>
          {footer ? <div className="flex shrink-0 flex-col gap-2 border-t border-hairline px-5 pt-3 pb-4">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
