import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/ui'

/** Link com a aparência do Button secundário sm (para wa.me, tel: e abrir em nova aba). */
export function LinkButton({ icon: Icon, children, className, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { icon?: LucideIcon }) {
  return (
    <a
      {...rest}
      className={cn(
        'ds-touch inline-flex h-9 items-center justify-center gap-1.5 rounded-pill bg-raised px-4 text-body font-semibold whitespace-nowrap text-fg ring-1 ring-edge transition-colors duration-150 ring-inset',
        'hover:bg-hover active:translate-y-px active:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      {Icon ? <Icon size={16} strokeWidth={2} aria-hidden /> : null}
      {children}
    </a>
  )
}
