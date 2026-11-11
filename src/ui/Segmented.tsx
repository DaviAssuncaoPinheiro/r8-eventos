import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  disabled?: boolean
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Nome acessível do grupo, ex.: "Período". */
  label: string
  size?: 'sm' | 'md'
  block?: boolean
  className?: string
}

/* trilho --sunken, opção ativa --raised com contorno 1px --edge. Setas movem a seleção. */
export function Segmented<T extends string>({ options, value, onChange, label, size = 'md', block, className }: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const enabled = options.filter((o) => !o.disabled)
  const move = (dir: 1 | -1) => {
    const i = enabled.findIndex((o) => o.value === value)
    const next = enabled[(i + dir + enabled.length) % enabled.length]
    onChange(next.value)
    refs.current[options.indexOf(next)]?.focus()
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex items-center gap-0.5 rounded-control bg-sunken p-1', size === 'md' ? 'h-10' : 'h-8', block && 'flex w-full', className)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), move(1))
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), move(-1))
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-full items-center justify-center gap-1.5 rounded-[7px] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-ui)]',
              size === 'md' ? 'px-3 text-body' : 'px-2.5 text-caption',
              block && 'flex-1',
              on ? 'bg-raised text-fg shadow-[0_0_0_1px_var(--edge)]' : 'text-fg-2 hover:bg-hover hover:text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
              'disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent',
            )}
          >
            {Icon ? <Icon size={16} strokeWidth={2} aria-hidden /> : null}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
