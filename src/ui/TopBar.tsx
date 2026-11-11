import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from 'lucide-react'
import { cn } from './cn'
import { Badge } from './Badge'
import { Input } from './Input'
import { Tooltip } from './Tooltip'
import { initialsOf } from './SideNav'

export type UserMenuAction = 'profile' | 'settings' | 'logout'

export interface TopBarProps {
  /** Título da tela, à esquerda. */
  title: string
  /** Botões da tela (ex.: mostrar o trilho direito), antes do sino. */
  actions?: React.ReactNode
  /** Avisos não lidos; maior que zero acende o ponto no sino. */
  unreadCount?: number
  onBellClick?: () => void
  user: { name: string; role: string }
  /** Item escolhido no menu do usuário (Perfil, Configurações, Sair). */
  onUserAction?: (action: UserMenuAction) => void
  placeholder?: string
  /** Chamado ao clicar no botão de busca compacto ou ao usar Ctrl K quando o campo está oculto. */
  onSearchClick?: () => void
  /** Botão de menu (abaixo de 1024) que abre a lateral em gaveta. */
  onMenuClick?: () => void
  /** Força a busca compacta (só ícone). Sem isso, ela encolhe sozinha quando o OfficeFrame tem menos de 1280 px. */
  compact?: boolean
  /** Liga Ctrl K / Cmd K. Desligue em exemplos repetidos na mesma página. */
  shortcut?: boolean
  className?: string
}

const iconBtn =
  'ds-touch ds-touch-sq relative inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-raised text-fg-2 ' +
  'transition-[background-color,color] duration-150 ease-[var(--ease-ui)] hover:bg-hover hover:text-fg active:bg-sunken ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function TopBar({
  title,
  actions,
  unreadCount = 0,
  onBellClick,
  user,
  onUserAction,
  placeholder = 'Buscar cliente, locação ou código',
  onSearchClick,
  onMenuClick,
  compact = false,
  shortcut = true,
  className,
}: TopBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const el = inputRef.current
        if (el && el.offsetParent !== null) el.focus()
        else onSearchClick?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut, onSearchClick])

  const bellLabel = unreadCount > 0 ? `Avisos, ${unreadCount} não lidos` : 'Avisos'

  return (
    <header className={cn('flex h-[72px] shrink-0 items-center gap-4 rounded-panel bg-panel px-5 text-fg', className)}>
      {onMenuClick ? (
        <Tooltip content="Abrir menu">
          <button type="button" aria-label="Abrir menu" onClick={onMenuClick} className={cn(iconBtn, 'size-11 @min-[1024px]/frame:hidden')}>
            <Menu size={20} strokeWidth={2} aria-hidden />
          </button>
        </Tooltip>
      ) : null}

      <p className="min-w-0 flex-1 basis-0 truncate text-title-sub">{title}</p>

      <div role="search" className="min-w-0 flex-[0_1_360px]">
        <div className={cn(compact ? 'hidden' : '@max-[1279px]/frame:hidden')}>
          <Input
            ref={inputRef}
            type="search"
            aria-label="Buscar"
            placeholder={placeholder}
            prefix={<Search size={16} strokeWidth={2} aria-hidden />}
            suffix={<Badge>Ctrl K</Badge>}
            className="w-full rounded-pill bg-raised px-4 ring-hairline"
          />
        </div>
        <div className={cn('justify-center', compact ? 'flex' : 'hidden @max-[1279px]/frame:flex')}>
          <Tooltip content="Buscar (Ctrl K)">
            <button type="button" aria-label="Buscar" onClick={onSearchClick} className={iconBtn}>
              <Search size={20} strokeWidth={2} aria-hidden />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex min-w-max flex-1 basis-0 items-center justify-end gap-2">
        {actions}
        <Tooltip content={bellLabel}>
          <button type="button" aria-label={bellLabel} onClick={onBellClick} className={iconBtn}>
            <Bell size={20} strokeWidth={2} aria-hidden />
            {unreadCount > 0 ? <span aria-hidden className="absolute top-2.5 right-3 size-2 rounded-pill bg-danger ring-2 ring-raised" /> : null}
          </button>
        </Tooltip>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="ml-1 flex h-12 shrink-0 items-center gap-3 rounded-pill pr-3 pl-1 text-left transition-colors duration-150 ease-[var(--ease-ui)] hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-hover"
            >
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-pill bg-accent-soft text-body font-semibold text-accent-ink">
                {initialsOf(user.name)}
              </span>
              <span className="min-w-0">
                <span className="block max-w-[140px] truncate text-body font-semibold text-fg">{user.name}</span>
                <span className="block max-w-[140px] truncate text-caption text-fg-3">{user.role}</span>
              </span>
              <ChevronDown size={16} strokeWidth={2} aria-hidden className="shrink-0 text-fg-3" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              collisionPadding={12}
              className="z-50 min-w-[200px] rounded-card bg-overlay p-1 text-fg shadow-overlay data-[state=open]:animate-[ds-tip-in_200ms_var(--ease-ui)]"
            >
              {(
                [
                  ['profile', 'Perfil', User],
                  ['settings', 'Configurações', Settings],
                  ['logout', 'Sair', LogOut],
                ] as const
              ).map(([key, label, Icon]) => (
                <DropdownMenu.Item
                  key={key}
                  onSelect={() => onUserAction?.(key)}
                  className="flex h-9 cursor-pointer items-center gap-2.5 rounded-tip px-3 text-body outline-none select-none data-[highlighted]:bg-hover"
                >
                  <Icon size={16} strokeWidth={2} aria-hidden className="text-fg-2" />
                  {label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
