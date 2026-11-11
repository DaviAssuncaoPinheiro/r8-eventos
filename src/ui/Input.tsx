import * as React from 'react'
import { cn } from './cn'
import { controlFocus, controlFrame, useField } from './Field'
import type { ForcedState } from './Button'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Texto ou ícone antes do valor, ex.: "R$". */
  prefix?: React.ReactNode
  /** Texto ou ícone depois do valor, ex.: "un." ou "%". */
  suffix?: React.ReactNode
  size?: 'md' | 'lg'
  invalid?: boolean
  forceState?: Exclude<ForcedState, 'active'>
  /** Alinha o valor à direita (dinheiro, quantidade). */
  numeric?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefix, suffix, size = 'md', invalid, forceState, numeric, className, id, disabled, required, ...rest },
  ref,
) {
  const f = useField()
  const isInvalid = invalid ?? f?.invalid ?? false
  const isDisabled = disabled ?? f?.disabled ?? false
  return (
    <div
      data-invalid={isInvalid}
      data-disabled={isDisabled}
      data-force={forceState}
      className={cn(controlFrame, controlFocus, 'flex items-center gap-2 px-3', size === 'md' ? 'h-10 ds-touch' : 'h-12 text-body-lg', className)}
    >
      {prefix ? <span className={cn('shrink-0 text-fg-3', isDisabled && 'text-fg-disabled')}>{prefix}</span> : null}
      <input
        ref={ref}
        id={id ?? f?.id}
        disabled={isDisabled}
        required={required ?? f?.required}
        aria-invalid={isInvalid || undefined}
        aria-describedby={f?.describedBy}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3 disabled:cursor-not-allowed',
          numeric && 'tnum text-right',
        )}
        {...rest}
      />
      {suffix ? <span className={cn('shrink-0 text-fg-3', isDisabled && 'text-fg-disabled')}>{suffix}</span> : null}
    </div>
  )
})
