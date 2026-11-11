import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from './cn'
import { controlFocus, controlFrame, useField } from './Field'

/*
  Select nativo estilizado. Motivo: no celular abre o seletor do sistema (melhor com uma mão),
  funciona com teclado e leitor de tela sem código extra, e não precisa de portal.
  Para busca dentro da lista use o Combobox (cmdk), especificado no DESIGN.md.
*/
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'md' | 'lg'
  invalid?: boolean
  placeholder?: string
  forceState?: 'hover' | 'focus'
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid, placeholder, forceState, className, id, disabled, children, ...rest },
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
      className={cn(controlFrame, controlFocus, 'relative flex items-center', size === 'md' ? 'h-11' : 'h-[52px] text-body-lg', className)}
    >
      <select
        ref={ref}
        id={id ?? f?.id}
        disabled={isDisabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={f?.describedBy}
        className="h-full w-full cursor-pointer appearance-none bg-transparent pr-9 pl-3 outline-none disabled:cursor-not-allowed"
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <ChevronDown size={18} strokeWidth={2} aria-hidden className={cn('pointer-events-none absolute right-3 text-fg-3', isDisabled && 'text-fg-disabled')} />
    </div>
  )
})
