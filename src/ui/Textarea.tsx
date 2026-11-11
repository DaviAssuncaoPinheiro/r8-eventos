import * as React from 'react'
import { cn } from './cn'
import { controlFocus, controlFrame, useField } from './Field'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
  forceState?: 'hover' | 'focus'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, forceState, className, id, disabled, rows = 4, ...rest },
  ref,
) {
  const f = useField()
  const isInvalid = invalid ?? f?.invalid ?? false
  const isDisabled = disabled ?? f?.disabled ?? false
  return (
    <div data-invalid={isInvalid} data-disabled={isDisabled} data-force={forceState} className={cn(controlFrame, controlFocus, 'flex', className)}>
      <textarea
        ref={ref}
        id={id ?? f?.id}
        rows={rows}
        disabled={isDisabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={f?.describedBy}
        className="min-h-[88px] w-full resize-y bg-transparent px-3 py-2.5 outline-none placeholder:text-fg-3 disabled:cursor-not-allowed"
        {...rest}
      />
    </div>
  )
})
