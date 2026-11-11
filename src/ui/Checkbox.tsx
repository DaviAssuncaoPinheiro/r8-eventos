import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from './cn'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode
  description?: React.ReactNode
  indeterminate?: boolean
  invalid?: boolean
  forceState?: 'hover' | 'focus'
}

/* caixa 18px; linha clicável com altura mínima 32px (44px em tela de toque) */
export const boxBase =
  'peer relative m-0 grid size-[18px] shrink-0 cursor-pointer appearance-none place-items-center border-[1.5px] border-strong bg-raised ' +
  'transition-[background-color,border-color] duration-150 ease-[var(--ease-ui)] ' +
  'hover:border-fg-2 data-[force=hover]:border-fg-2 ' +
  'checked:border-accent checked:bg-accent checked:hover:border-accent-hover checked:hover:bg-accent-hover ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[force=focus]:outline-2 data-[force=focus]:outline-offset-2 data-[force=focus]:outline-ring ' +
  'aria-invalid:border-danger ' +
  'disabled:cursor-not-allowed disabled:border-edge disabled:bg-sunken disabled:checked:bg-fg-disabled disabled:checked:border-fg-disabled'

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, indeterminate, invalid, forceState, className, id, disabled, ...rest },
  ref,
) {
  const auto = React.useId()
  const inputId = id ?? `cb${auto.replace(/:/g, '')}`
  const inner = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => inner.current as HTMLInputElement)
  React.useEffect(() => {
    if (inner.current) inner.current.indeterminate = !!indeterminate
  }, [indeterminate])
  const Mark = indeterminate ? Minus : Check
  return (
    <div className={cn('flex min-h-8 items-start gap-2.5 py-1.5 ds-touch', className)}>
      <span className="relative mt-px grid size-[18px] place-items-center">
        <input
          ref={inner}
          id={inputId}
          type="checkbox"
          data-force={forceState}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(boxBase, 'rounded-check', indeterminate && 'border-accent bg-accent')}
          {...rest}
        />
        <Mark
          size={14}
          strokeWidth={3}
          aria-hidden
          className={cn('pointer-events-none absolute text-on-accent opacity-0 peer-checked:opacity-100', indeterminate && 'opacity-100')}
        />
      </span>
      <label htmlFor={inputId} className={cn('cursor-pointer select-none', disabled && 'cursor-not-allowed text-fg-disabled')}>
        <span className="block text-body text-fg">{label}</span>
        {description ? <span className="block text-caption text-fg-3">{description}</span> : null}
      </label>
    </div>
  )
})
