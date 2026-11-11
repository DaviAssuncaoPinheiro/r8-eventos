import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/ui'

/** Link com a cara de botão de da equipe de rua (56 px): para ligar e abrir rota. */
export function LinkButton({ icon: Icon, className, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { icon?: LucideIcon }) {
  return (
    <a
      className={cn(
        'inline-flex h-14 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-pill bg-raised px-5 text-body-lg font-semibold text-fg ring-1 ring-edge ring-inset no-underline',
        'transition-[background-color,transform] duration-150 ease-[var(--ease-ui)] hover:bg-hover active:translate-y-px active:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={22} strokeWidth={2} aria-hidden /> : null}
      <span className="truncate">{children}</span>
    </a>
  )
}
