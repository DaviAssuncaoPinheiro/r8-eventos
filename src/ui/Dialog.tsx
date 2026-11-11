import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from './cn'

/* ───────── utilitários compartilhados por Dialog, Drawer e Menu ───────── */

/** true quando a media query casa. Começa pelo valor real do navegador (sem piscar). */
export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches)
  const [match, setMatch] = React.useState(get)
  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/*
  Keyframes das sobreposições. Radix só espera a saída se houver animação (não transição),
  por isso ficam aqui, injetados uma vez. Tokens de duração e curva vêm de tokens.css.
  Entrada: 250ms (diálogo, gaveta) ou 200ms (menu); saída com 70% da duração.
  prefers-reduced-motion é zerado pela regra global de src/index.css.
*/
const OVERLAY_CSS = `
@keyframes ds-fade-in { from { opacity: 0 } }
@keyframes ds-fade-out { to { opacity: 0 } }
@keyframes ds-dialog-in { from { opacity: 0; transform: scale(0.98) } }
@keyframes ds-dialog-out { to { opacity: 0; transform: scale(0.98) } }
@keyframes ds-sheet-in { from { transform: translateY(100%) } }
@keyframes ds-sheet-out { to { transform: translateY(100%) } }
@keyframes ds-side-in { from { transform: translateX(calc(100% + 12px)) } }
@keyframes ds-side-out { to { transform: translateX(calc(100% + 12px)) } }
@keyframes ds-menu-in { from { opacity: 0; transform: translateY(var(--ds-menu-y, 4px)) } }
@keyframes ds-menu-out { to { opacity: 0 } }

.ds-scrim[data-state='open'] { animation: ds-fade-in var(--dur-slow) var(--ease-ui) }
.ds-scrim[data-state='closed'] { animation: ds-fade-out 175ms var(--ease-ui) forwards }

.ds-dialog[data-state='open'] { animation: ds-sheet-in var(--dur-slow) var(--ease-ui) }
.ds-dialog[data-state='closed'] { animation: ds-sheet-out 175ms var(--ease-ui) forwards }
@media (min-width: 640px) {
  .ds-dialog[data-state='open'] { animation: ds-dialog-in var(--dur-slow) var(--ease-ui) }
  .ds-dialog[data-state='closed'] { animation: ds-dialog-out 175ms var(--ease-ui) forwards }
}

.ds-drawer-side[data-state='open'] { animation: ds-side-in var(--dur-slow) var(--ease-ui) }
.ds-drawer-side[data-state='closed'] { animation: ds-side-out 175ms var(--ease-ui) forwards }

.ds-vaul[data-vaul-drawer], .ds-vaul-scrim[data-vaul-overlay] {
  transition-duration: var(--dur-slow) !important;
  transition-timing-function: var(--ease-ui) !important;
}

.ds-menu[data-state='open'] { animation: ds-menu-in var(--dur-base) var(--ease-ui) }
.ds-menu[data-state='closed'] { animation: ds-menu-out 140ms var(--ease-ui) forwards }
.ds-menu[data-side='top'] { --ds-menu-y: 4px }
.ds-menu[data-side='bottom'] { --ds-menu-y: -4px }
`

let injected = false
export function ensureOverlayStyles() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const el = document.createElement('style')
  el.setAttribute('data-ds-overlay', '')
  el.textContent = OVERLAY_CSS
  document.head.appendChild(el)
}
ensureOverlayStyles()

/* ───────── Diálogo ───────── */

export type DialogSize = 'sm' | 'md' | 'lg'

const widths: Record<DialogSize, string> = {
  sm: 'sm:w-[480px]',
  md: 'sm:w-[640px]',
  lg: 'sm:w-[800px]',
}

const staticWidths: Record<DialogSize, string> = { sm: 'max-w-[480px]', md: 'max-w-[640px]', lg: 'max-w-[800px]' }

type PartTag = React.ElementType

interface PartsProps {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  footer: React.ReactNode
  Title: PartTag
  Description: PartTag
  close: React.ReactNode
}

/* Cabeçalho, corpo com rolagem e rodapé: iguais no diálogo real e na versão estática. */
function DialogParts({ title, description, children, footer, Title, Description, close }: PartsProps) {
  return (
    <>
      <span aria-hidden className="mx-auto mt-2 block h-1 w-9 shrink-0 rounded-pill bg-strong sm:hidden" />
      <div className="relative shrink-0 px-6 pt-6 sm:pt-6">
        <Title className="pr-10 text-title-section text-fg">{title}</Title>
        {description ? <Description className="mt-1.5 text-body text-fg-2">{description}</Description> : null}
        <div className="absolute top-2 right-4 sm:top-4">{close}</div>
      </div>
      {children ? <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div> : <div className="h-6 shrink-0" />}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-hairline px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))] max-sm:[&>button]:flex-1">{footer}</div>
    </>
  )
}

export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Elemento que abre o diálogo. O foco volta para ele ao fechar. */
  trigger?: React.ReactElement
  size?: DialogSize
  title: string
  description?: React.ReactNode
  /** Corpo. Rola por dentro quando passa de 100dvh - 64px. */
  children?: React.ReactNode
  /** Variante destrutiva: confirmar vira perigo e o foco inicial vai para "Cancelar". */
  destructive?: boolean
  /** Rótulo do botão primário: verbo + objeto ("Gerar cobrança", "Excluir avaria"). */
  confirmLabel?: string
  onConfirm?: () => void
  confirmLoading?: boolean
  cancelLabel?: string
  /** Substitui os botões padrão do rodapé. */
  footer?: React.ReactNode
  className?: string
}

/**
 * Diálogo modal (Radix). Use só quando a tarefa exige interrupção ou foco protegido.
 * Abaixo de 640px vira gaveta inferior. Foco inicial: primeiro campo (ou "Cancelar" no destrutivo);
 * Esc fecha; o foco volta ao gatilho.
 */
export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  size = 'md',
  title,
  description,
  children,
  destructive,
  confirmLabel = 'Confirmar',
  onConfirm,
  confirmLoading,
  cancelLabel = 'Cancelar',
  footer,
  className,
}: DialogProps) {
  const onOpenAutoFocus = (e: Event) => {
    const root = e.currentTarget as HTMLElement | null
    if (!root) return
    e.preventDefault()
    const cancel = root.querySelector<HTMLElement>('[data-dialog-cancel]')
    const field = destructive ? null : root.querySelector<HTMLElement>('[data-dialog-body] :is(input, textarea, select):not([disabled])')
    const target = field ?? cancel ?? root.querySelector<HTMLElement>('[data-dialog-confirm]') ?? root
    target.focus()
  }

  return (
    <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ds-scrim ds-root fixed inset-0 z-[70] bg-scrim" />
        <DialogPrimitive.Content
          onOpenAutoFocus={onOpenAutoFocus}
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'ds-dialog ds-root fixed z-[70] flex flex-col bg-overlay text-fg shadow-overlay outline-none',
            /* celular: gaveta inferior */
            'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-panel',
            /* escritório: caixa centralizada */
            'sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[calc(100dvh-64px)] sm:max-w-[calc(100vw-32px)] sm:rounded-card',
            widths[size],
            className,
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <DialogParts
              title={title}
              description={description}
              Title={DialogPrimitive.Title}
              Description={DialogPrimitive.Description}
              close={
                <DialogPrimitive.Close asChild>
                  <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Fechar" />
                </DialogPrimitive.Close>
              }
              footer={
                footer ?? (
                  <>
                    <DialogPrimitive.Close asChild>
                      <Button data-dialog-cancel>{cancelLabel}</Button>
                    </DialogPrimitive.Close>
                    <Button data-dialog-confirm variant={destructive ? 'danger' : 'primary'} loading={confirmLoading} onClick={onConfirm}>
                      {confirmLabel}
                    </Button>
                  </>
                )
              }
            >
              {children ? <div data-dialog-body>{children}</div> : null}
            </DialogParts>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export interface DialogStaticProps extends Pick<DialogProps, 'size' | 'title' | 'description' | 'children' | 'destructive' | 'confirmLabel' | 'cancelLabel' | 'className'> {}

/**
 * Caixa do diálogo em linha, sem portal nem scrim, para documentação e capturas de tela.
 * Mesma anatomia e medidas do Dialog; os botões não fazem nada.
 */
export function DialogStatic({ size = 'md', title, description, children, destructive, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', className }: DialogStaticProps) {
  return (
    <div role="group" aria-label={`${title} (exemplo)`} className={cn('flex w-full flex-col rounded-card bg-overlay text-fg shadow-overlay', staticWidths[size], className)}>
      <DialogParts
        title={title}
        description={description}
        Title="h4"
        Description="p"
        close={<Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Fechar" tabIndex={-1} />}
        footer={
          <>
            <Button tabIndex={-1}>{cancelLabel}</Button>
            <Button tabIndex={-1} variant={destructive ? 'danger' : 'primary'}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        {children}
      </DialogParts>
    </div>
  )
}
