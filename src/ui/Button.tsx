import * as React from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'field'
/** Estado forçado, só para documentação e capturas. */
export type ForcedState = 'hover' | 'focus' | 'active'

const base =
  'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control font-semibold select-none ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-ui)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'data-[force=focus]:outline-2 data-[force=focus]:outline-offset-2 data-[force=focus]:outline-ring ' +
  'active:translate-y-px data-[force=active]:translate-y-px ' +
  'disabled:cursor-not-allowed disabled:translate-y-0 aria-busy:cursor-progress'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active data-[force=hover]:bg-accent-hover data-[force=active]:bg-accent-active ' +
    'disabled:bg-sunken disabled:text-fg-disabled',
  secondary:
    'bg-raised text-fg ring-1 ring-inset ring-edge hover:bg-hover active:bg-sunken data-[force=hover]:bg-hover data-[force=active]:bg-sunken ' +
    'disabled:bg-raised disabled:text-fg-disabled disabled:ring-hairline',
  ghost:
    'bg-transparent text-fg-2 hover:bg-hover hover:text-fg active:bg-sunken data-[force=hover]:bg-hover data-[force=hover]:text-fg data-[force=active]:bg-sunken ' +
    'disabled:bg-transparent disabled:text-fg-disabled',
  danger:
    'bg-danger-solid text-white hover:bg-danger-solid-hover active:brightness-95 data-[force=hover]:bg-danger-solid-hover data-[force=active]:brightness-95 ' +
    'disabled:bg-sunken disabled:text-fg-disabled',
}

/* altura, padding horizontal, gap, texto, tamanho do ícone */
const sizes: Record<ButtonSize, { cls: string; icon: number; square: string }> = {
  sm: { cls: 'h-8 px-3 gap-1.5 text-body', icon: 16, square: 'w-8 px-0' },
  md: { cls: 'h-10 px-4 gap-2 text-body', icon: 18, square: 'w-10 px-0' },
  lg: { cls: 'h-12 px-5 gap-2 text-body-lg font-semibold', icon: 20, square: 'w-12 px-0' },
  field: { cls: 'h-14 px-6 gap-2.5 text-body-lg font-bold', icon: 24, square: 'w-14 px-0' },
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  /** Só ícone: exige aria-label. */
  iconOnly?: boolean
  loading?: boolean
  block?: boolean
  forceState?: ForcedState
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, iconOnly, loading, block, forceState, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const s = sizes[size]
  const lead = loading ? <Loader2 size={s.icon} strokeWidth={2} className="ds-spin" aria-hidden /> : Icon ? <Icon size={s.icon} strokeWidth={2} aria-hidden /> : null
  return (
    <button
      ref={ref}
      type={type}
      data-force={forceState}
      aria-busy={loading || undefined}
      disabled={disabled}
      className={cn(base, variants[variant], s.cls, iconOnly && s.square, block && 'w-full', size === 'sm' && 'ds-touch', loading && 'pointer-events-none', className)}
      {...rest}
    >
      {lead}
      {iconOnly ? null : children}
      {!iconOnly && IconRight && !loading ? <IconRight size={s.icon} strokeWidth={2} aria-hidden /> : null}
    </button>
  )
})
