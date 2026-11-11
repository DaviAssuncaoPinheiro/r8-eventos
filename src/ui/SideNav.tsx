import * as React from 'react'
import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react'
import { cn } from './cn'
import { Badge } from './Badge'
import { Button } from './Button'
import { Tooltip } from './Tooltip'

/** Iniciais de um nome: "Paula Ramos" vira "PR". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const SideNavContext = React.createContext<{ collapsed: boolean }>({ collapsed: false })

/** Fornece o estado recolhido a itens soltos (documentação, testes). Dentro de um `SideNav` não é necessário. */
export function SideNavScope({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  const v = React.useMemo(() => ({ collapsed }), [collapsed])
  return <SideNavContext.Provider value={v}>{children}</SideNavContext.Provider>
}

/* ───────── Item ───────── */

/** Props que o item entrega a `render`. Espalhe todas no elemento (ex.: NavLink). */
export interface SideNavItemRenderProps {
  className: string
  children: React.ReactNode
  onClick: React.MouseEventHandler<HTMLElement>
  'aria-current'?: 'page'
  'data-active': boolean
  'data-force'?: 'hover' | 'focus'
}

export interface SideNavItemProps {
  icon: LucideIcon
  label: string
  /** Contador à direita (neutro; acento quando ativo). Recolhido, vai para o tooltip. */
  count?: number
  active?: boolean
  /** Sem permissão. Mantém o foco e o tooltip, bloqueia a navegação. */
  disabled?: boolean
  /** Frase do tooltip do item desabilitado: "Peça acesso ao administrador." */
  disabledReason?: string
  /** Vira `<a href>` quando não há `render`. Sem href, vira `<button>`. */
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  /**
   * Para usar com o roteador, sem depender de outra biblioteca:
   * `render={(p) => <NavLink to="/locacoes" {...p} />}`.
   * Passe `active` por conta própria; o item já marca `aria-current="page"`.
   */
  render?: (props: SideNavItemRenderProps) => React.ReactElement
  /** Estado forçado, só para documentação. */
  forceState?: 'hover' | 'focus'
  /** Mantém o tooltip aberto, só para documentação. */
  forceTooltip?: boolean
  className?: string
}

const itemBase =
  'ds-touch relative flex h-11 w-full shrink-0 cursor-pointer items-center rounded-control text-left text-[15px] leading-5 font-medium text-fg-2 no-underline select-none ' +
  'transition-[background-color,color,padding] duration-150 ease-[var(--ease-ui)] ' +
  'hover:bg-hover hover:text-fg data-[force=hover]:bg-hover data-[force=hover]:text-fg ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'data-[force=focus]:outline-2 data-[force=focus]:outline-offset-2 data-[force=focus]:outline-ring ' +
  'data-[active=true]:bg-raised data-[active=true]:font-semibold data-[active=true]:text-fg data-[active=true]:hover:bg-raised ' +
  'aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled aria-disabled:hover:bg-transparent aria-disabled:hover:text-fg-disabled'

export function SideNavItem({
  icon: Icon,
  label,
  count,
  active = false,
  disabled = false,
  disabledReason,
  href,
  onClick,
  render,
  forceState,
  forceTooltip,
  className,
}: SideNavItemProps) {
  const { collapsed } = React.useContext(SideNavContext)

  const content = (
    <>
      {active && !disabled ? <span aria-hidden className="absolute top-1/2 -left-3 h-7 w-1 -translate-y-1/2 rounded-r-pill bg-accent" /> : null}
      <Icon size={20} strokeWidth={2} aria-hidden className={cn('shrink-0', active && !disabled && 'text-accent-ink')} />
      <span className={cn('ml-3 min-w-0 flex-1 truncate transition-opacity duration-150 ease-[var(--ease-ui)]', collapsed && 'opacity-0')}>{label}</span>
      {count !== undefined ? (
        <span className={cn('ml-2 shrink-0 transition-opacity duration-150 ease-[var(--ease-ui)]', collapsed && 'opacity-0')}>
          <Badge tone={active && !disabled ? 'accent' : 'neutral'} className="tnum">
            {count}
          </Badge>
        </span>
      ) : null}
    </>
  )

  const cls = cn(itemBase, collapsed ? 'px-[14px]' : 'px-3', className)
  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  let el: React.ReactElement
  if (disabled) {
    el = (
      <button type="button" aria-disabled="true" data-active={false} data-force={forceState} className={cls} onClick={handleClick}>
        {content}
      </button>
    )
  } else {
    const props: SideNavItemRenderProps = {
      className: cls,
      children: content,
      onClick: handleClick,
      'aria-current': active ? 'page' : undefined,
      'data-active': active,
      'data-force': forceState,
    }
    if (render) el = render(props)
    else if (href !== undefined) {
      const { children, onClick: oc, ...rest } = props
      el = (
        <a href={href} onClick={oc} {...rest}>
          {children}
        </a>
      )
    } else {
      const { children, onClick: oc, ...rest } = props
      el = (
        <button type="button" onClick={oc} {...rest}>
          {children}
        </button>
      )
    }
  }

  let tip: string | null = null
  if (disabled) tip = collapsed ? [label, disabledReason].filter(Boolean).join('. ') : (disabledReason ?? null)
  else if (collapsed) tip = count !== undefined ? `${label}, ${count}` : label

  if (!tip) return el
  return (
    <Tooltip content={tip} side="right" open={forceTooltip ? true : undefined}>
      {el}
    </Tooltip>
  )
}

/* ───────── Grupo ───────── */

/** Rótulo de grupo (12 acima, 4 abaixo). Recolhida, o rótulo vira um filete. Sem `label`, o grupo só agrupa. */
export function SideNavGroup({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  const { collapsed } = React.useContext(SideNavContext)
  const id = React.useId()
  return (
    <div role="group" aria-labelledby={label ? id : undefined} className={cn('flex flex-col gap-0.5 [&:not(:first-child)]:mt-1', className)}>
      {label ? (
        collapsed ? (
          <div aria-hidden className="mx-3 mt-3 mb-2 h-px bg-hairline" />
        ) : (
          <div id={id} className="px-3 pt-4 pb-1.5 text-caption font-medium tracking-[0.08em] text-fg-3 uppercase">
            {label}
          </div>
        )
      ) : null}
      {label && collapsed ? <span id={id} className="sr-only">{label}</span> : null}
      {children}
    </div>
  )
}

/* ───────── Contêiner ───────── */

export interface SideNavProps {
  /** Aberta 248 (padrão) ou recolhida 72. Controlado. */
  collapsed?: boolean
  /** Sem esta função, o botão de recolher não aparece. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Marca da locadora: quadrado de 32 com logo (ou iniciais) na cor `accent` + nome. */
  brand: { name: string; initials?: string; logoSrc?: string }
  /** Itens fixos no rodapé, acima do usuário (Configurações, Ajuda). */
  footer?: React.ReactNode
  /** Usuário no rodapé; vira botão se houver `onUserClick`. */
  user?: { name: string; role: string }
  onUserClick?: () => void
  children: React.ReactNode
  className?: string
}

export function SideNav({ collapsed = false, onCollapsedChange, brand, footer, user, onUserClick, children, className }: SideNavProps) {
  const ctx = React.useMemo(() => ({ collapsed }), [collapsed])
  const toggleLabel = collapsed ? 'Expandir menu' : 'Recolher menu'
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <SideNavContext.Provider value={ctx}>
      <nav
        aria-label="Navegação principal"
        data-collapsed={collapsed}
        style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
        className={cn(
          'flex h-full shrink-0 flex-col overflow-hidden rounded-panel bg-panel text-fg transition-[width] duration-200 ease-[var(--ease-ui)]',
          className,
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center px-5">
          <span
            aria-hidden
            className="ds-hero grid size-9 shrink-0 place-items-center overflow-hidden rounded-control text-body font-bold"
          >
            {brand.logoSrc ? <img src={brand.logoSrc} alt="" className="size-full object-cover" /> : (brand.initials ?? initialsOf(brand.name))}
          </span>
          <span className={cn('ml-3 min-w-0 flex-1 truncate text-title-sub transition-opacity duration-150 ease-[var(--ease-ui)]', collapsed && 'opacity-0')}>
            {brand.name}
          </span>
          {onCollapsedChange && !collapsed ? (
            <Tooltip content={toggleLabel} side="right">
              <Button variant="ghost" size="sm" iconOnly icon={ToggleIcon} aria-label={toggleLabel} aria-expanded onClick={() => onCollapsedChange(true)} className="-mr-2 shrink-0" />
            </Tooltip>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pt-1 pb-2">{children}</div>

        <div className="flex shrink-0 flex-col gap-0.5 px-3 pt-2 pb-3">
          {footer}
          {onCollapsedChange && collapsed ? (
            <Tooltip content={toggleLabel} side="right">
              <button
                type="button"
                aria-expanded={false}
                aria-label={toggleLabel}
                onClick={() => onCollapsedChange(false)}
                className={cn(itemBase, 'px-[14px]')}
              >
                <ToggleIcon size={20} strokeWidth={2} aria-hidden className="shrink-0" />
              </button>
            </Tooltip>
          ) : null}
          {user ? <UserRow user={user} collapsed={collapsed} onClick={onUserClick} /> : null}
        </div>
      </nav>
    </SideNavContext.Provider>
  )
}

function UserRow({ user, collapsed, onClick }: { user: { name: string; role: string }; collapsed: boolean; onClick?: () => void }) {
  const body = (
    <>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-pill bg-accent-soft text-caption font-bold text-accent-ink">
        {initialsOf(user.name)}
      </span>
      <span className={cn('ml-3 min-w-0 flex-1 transition-opacity duration-150 ease-[var(--ease-ui)]', collapsed && 'opacity-0')}>
        <span className="block truncate text-body font-semibold text-fg">{user.name}</span>
        <span className="block truncate text-caption text-fg-3">{user.role}</span>
      </span>
    </>
  )
  const cls =
    'flex h-12 w-full shrink-0 items-center overflow-hidden rounded-control pl-2 text-left transition-colors duration-150 ease-[var(--ease-ui)] ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
  const el = onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, 'hover:bg-hover')}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
  return collapsed ? (
    <Tooltip content={`${user.name}, ${user.role}`} side="right">
      {el}
    </Tooltip>
  ) : (
    el
  )
}
