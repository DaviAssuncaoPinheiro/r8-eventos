import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from './cn'

export interface SwitchProps extends Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, 'children'> {
  label: React.ReactNode
  description?: React.ReactNode
  forceState?: 'hover' | 'focus'
}

/* trilho 36×20, botão 16px; desligado usa --strong (3:1 com o fundo), ligado usa --accent */
export function Switch({ label, description, forceState, className, id, disabled, ...rest }: SwitchProps) {
  const auto = React.useId()
  const sid = id ?? `sw${auto.replace(/:/g, '')}`
  return (
    <div className={cn('flex min-h-8 items-start justify-between gap-4 py-1.5 ds-touch', className)}>
      <label htmlFor={sid} className={cn('cursor-pointer select-none', disabled && 'cursor-not-allowed text-fg-disabled')}>
        <span className="block text-body text-fg">{label}</span>
        {description ? <span className="block text-caption text-fg-3">{description}</span> : null}
      </label>
      <SwitchPrimitive.Root
        id={sid}
        disabled={disabled}
        data-force={forceState}
        className={cn(
          'relative mt-px inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-pill bg-strong p-0.5 transition-colors duration-150 ease-[var(--ease-ui)]',
          'hover:bg-fg-3 data-[force=hover]:bg-fg-3 data-[state=checked]:bg-accent data-[state=checked]:hover:bg-accent-hover',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[force=focus]:outline-2 data-[force=focus]:outline-offset-2 data-[force=focus]:outline-ring',
          'disabled:cursor-not-allowed disabled:bg-sunken disabled:shadow-[inset_0_0_0_1px_var(--edge)] disabled:data-[state=checked]:bg-fg-disabled disabled:data-[state=checked]:shadow-none',
        )}
        {...rest}
      >
        <SwitchPrimitive.Thumb className="block size-4 rounded-pill bg-white transition-transform data-[disabled]:bg-fg-disabled data-[disabled]:data-[state=checked]:bg-raised duration-150 ease-[var(--ease-ui)] data-[state=checked]:translate-x-4" />
      </SwitchPrimitive.Root>
    </div>
  )
}
