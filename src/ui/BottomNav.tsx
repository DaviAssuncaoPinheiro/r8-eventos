import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

export interface BottomNavItemRenderProps {
  className: string
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLElement>
  'aria-current'?: 'page'
}

export interface BottomNavItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  /** Pendências sobre o ícone (pílula 18, perigo). Some quando zero ou ausente. */
  count?: number
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  /** Mesmo contrato do SideNavItem: `render={(p) => <NavLink to="/hoje" {...p} />}`. */
  render?: (props: BottomNavItemRenderProps) => React.ReactElement
  /** Estado forçado, só para documentação. */
  forceFocus?: boolean
  className?: string
}

const itemCls =
  'group flex h-16 min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-caption font-semibold no-underline select-none ' +
  'transition-colors duration-150 ease-[var(--ease-ui)] ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ' +
  'data-[force=focus]:outline-2 data-[force=focus]:-outline-offset-2 data-[force=focus]:outline-ring'

export function BottomNavItem({ icon: Icon, label, active = false, count, href, onClick, render, forceFocus, className }: BottomNavItemProps) {
  const content = (
    <>
      <span
        className={cn(
          'relative grid h-7 w-14 place-items-center rounded-pill transition-colors duration-150 ease-[var(--ease-ui)]',
          active ? 'bg-accent-soft' : 'group-hover:bg-hover group-active:bg-sunken',
        )}
      >
        <Icon size={24} strokeWidth={2} aria-hidden />
        {count ? (
          <span
            aria-hidden
            className="tnum absolute -top-1 right-1 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-danger-solid px-1 text-caption leading-none font-semibold text-white"
          >
            {count}
          </span>
        ) : null}
      </span>
      <span className="max-w-full truncate leading-4">{label}</span>
      {count ? <span className="sr-only">{`, ${count} pendentes`}</span> : null}
    </>
  )
  const props = {
    className: cn(itemCls, active ? 'text-accent-ink' : 'text-fg-2', className),
    children: content,
    onClick,
    'aria-current': active ? ('page' as const) : undefined,
    'data-force': forceFocus ? 'focus' : undefined,
  }
  if (render) return render(props as BottomNavItemRenderProps)
  if (href !== undefined) {
    const { children, ...rest } = props
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
  const { children, ...rest } = props
  return (
    <button type="button" {...rest}>
      {children}
    </button>
  )
}

export interface BottomNavProps {
  children: React.ReactNode
  /** Cola na base da janela (z 40). Por padrão ocupa o fluxo do contêiner, para quadros de demonstração. */
  fixed?: boolean
  className?: string
}

/** 64 px + área segura, `bg-panel`, filete superior. Use 3 ou 4 `BottomNavItem`. */
export function BottomNav({ children, fixed = false, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação do app"
      className={cn(
        'flex w-full shrink-0 border-t border-hairline bg-panel pb-[env(safe-area-inset-bottom)]',
        fixed && 'fixed inset-x-0 bottom-0 z-40',
        className,
      )}
    >
      {children}
    </nav>
  )
}
