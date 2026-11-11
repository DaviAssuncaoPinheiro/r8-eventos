import * as React from 'react'
import { cn } from './cn'
import { boxBase } from './Checkbox'

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode
  description?: React.ReactNode
  forceState?: 'hover' | 'focus'
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, forceState, className, id, disabled, ...rest },
  ref,
) {
  const auto = React.useId()
  const inputId = id ?? `rd${auto.replace(/:/g, '')}`
  return (
    <div className={cn('flex min-h-8 items-start gap-2.5 py-1.5 ds-touch', className)}>
      <span className="relative mt-px grid size-[18px] place-items-center">
        <input ref={ref} id={inputId} type="radio" data-force={forceState} disabled={disabled} className={cn(boxBase, 'rounded-pill')} {...rest} />
        <span aria-hidden className="pointer-events-none absolute size-2 rounded-pill bg-on-accent opacity-0 peer-checked:opacity-100" />
      </span>
      <label htmlFor={inputId} className={cn('cursor-pointer select-none', disabled && 'cursor-not-allowed text-fg-disabled')}>
        <span className="block text-body text-fg">{label}</span>
        {description ? <span className="block text-caption text-fg-3">{description}</span> : null}
      </label>
    </div>
  )
})

/** Agrupa rádios com legenda acessível. */
export function RadioGroup({ legend, children, className }: { legend: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={cn('m-0 min-w-0 border-0 p-0', className)}>
      <legend className="mb-1 p-0 text-body font-semibold text-fg">{legend}</legend>
      {children}
    </fieldset>
  )
}
