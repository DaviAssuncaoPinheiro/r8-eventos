import * as React from 'react'
import { Toaster, toast as sonner } from 'sonner'
import { CircleAlert, CircleCheck, Info, type LucideIcon } from 'lucide-react'
import { cn } from './cn'
import { useMediaQuery } from './Dialog'

export type ToastTone = 'success' | 'error' | 'info'

/*
  Ícones de estado em tom claro porque o fundo do toast é escuro no tema claro.
  Valores da spec 6.10: claro usa --ok/--danger do escuro (#3db876, #ef5f5a);
  no tema escuro o toast é claro e usa --ok/--danger do tema claro (#1b7f48, #cf2f37).
*/
const icons: Record<ToastTone, { Icon: LucideIcon; cls: string }> = {
  success: { Icon: CircleCheck, cls: 'text-[#3db876] [:root[data-theme=dark]_&]:text-[#1b7f48]' },
  error: { Icon: CircleAlert, cls: 'text-[#ef5f5a] [:root[data-theme=dark]_&]:text-[#cf2f37]' },
  info: { Icon: Info, cls: 'text-on-inverse-2' },
}

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastCardProps {
  tone?: ToastTone
  message: string
  description?: string
  action?: ToastAction
  className?: string
}

/** Aparência do toast: usada pelo sonner (via notify) e também em linha, para documentação. */
export function ToastCard({ tone = 'info', message, description, action, className }: ToastCardProps) {
  const { Icon, cls } = icons[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'ds-root flex w-[360px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-card bg-inverse px-4 py-3 text-on-inverse shadow-overlay',
        className,
      )}
    >
      <Icon size={16} strokeWidth={2} aria-hidden className={cn('mt-0.5 shrink-0', cls)} />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-on-inverse">{message}</p>
        {description ? <p className="mt-0.5 text-caption text-on-inverse-2">{description}</p> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="ds-touch shrink-0 self-center rounded-tip px-1 text-body font-semibold text-on-inverse transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-inverse"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

export interface NotifyOptions {
  description?: string
  /** Ação à direita, como "Desfazer". Com ação o toast dura 8 s; sem ação, 5 s. */
  action?: ToastAction
  duration?: number
  id?: string | number
  /** Só aparece no AppToaster com o mesmo `id`. Sem valor, aparece no AppToaster sem `id`. */
  toasterId?: string
}

function show(tone: ToastTone, message: string, opts: NotifyOptions = {}) {
  const { description, action, duration, id, toasterId } = opts
  return sonner.custom(
    (tid) => (
      <ToastCard
        tone={tone}
        message={message}
        description={description}
        action={
          action
            ? {
                label: action.label,
                onClick: () => {
                  action.onClick()
                  sonner.dismiss(tid)
                },
              }
            : undefined
        }
      />
    ),
    { id, toasterId, duration: duration ?? (action ? 8000 : 5000) },
  )
}

/** Avisos curtos de uma frase: "Cobrança gerada para a Construtora Planalto". */
export const notify = {
  success: (message: string, opts?: NotifyOptions) => show('success', message, opts),
  error: (message: string, opts?: NotifyOptions) => show('error', message, opts),
  info: (message: string, opts?: NotifyOptions) => show('info', message, opts),
  dismiss: (id?: string | number) => sonner.dismiss(id),
}

/**
 * Contêiner dos toasts, já com os tokens do design system.
 * Topo central no escritório (a partir de 640px), inferior acima da navegação no celular. z-index 80.
 * Renderize um só por tela. `id` faz este contêiner mostrar apenas toasts com o mesmo `toasterId`.
 */
export function AppToaster({ id, top }: { id?: string; /** sempre no topo (app da equipe de rua: a ação principal fica embaixo) */ top?: boolean }) {
  const wide = useMediaQuery('(min-width: 640px)')
  return (
    <Toaster
      id={id}
      position={wide || top ? 'top-center' : 'bottom-center'}
      offset={16}
      mobileOffset={{ top: top ? 'calc(var(--demo-strip-h, 0px) + 12px)' : 16, left: 16, right: 16, bottom: 80 }}
      gap={8}
      visibleToasts={3}
      toastOptions={{ unstyled: true }}
      containerAriaLabel="Notificações"
      style={{ zIndex: 80, '--width': '360px' } as React.CSSProperties}
    />
  )
}
