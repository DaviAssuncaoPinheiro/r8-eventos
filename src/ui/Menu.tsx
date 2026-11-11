import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'
import { ensureOverlayStyles } from './Dialog'

ensureOverlayStyles()

export type MenuEntry =
  | {
      type?: 'item'
      label: string
      icon?: LucideIcon
      /** Texto do atalho, à direita: "Ctrl E". */
      shortcut?: string
      disabled?: boolean
      /** Ação destrutiva: tinta danger. Coloque sempre por último, depois de um divisor. */
      danger?: boolean
      onSelect?: () => void
    }
  | { type: 'separator' }

const panel = 'min-w-[200px] rounded-card bg-overlay p-1 text-fg shadow-overlay'
const itemBase =
  'flex h-9 ds-touch w-full cursor-default items-center gap-2.5 rounded-control px-3 text-body outline-none select-none ' +
  'transition-colors duration-150 ease-[var(--ease-ui)]'

function ItemContent({ entry }: { entry: Extract<MenuEntry, { label: string }> }) {
  const Icon = entry.icon
  return (
    <>
      {Icon ? <Icon size={16} strokeWidth={2} aria-hidden className={cn('shrink-0', entry.danger ? 'text-danger-ink' : 'text-fg-2', entry.disabled && 'text-fg-disabled')} /> : null}
      <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
      {entry.shortcut ? <span className={cn('ml-4 shrink-0 text-caption text-fg-3', entry.disabled && 'text-fg-disabled')}>{entry.shortcut}</span> : null}
    </>
  )
}

const tone = (e: Extract<MenuEntry, { label: string }>) =>
  e.danger ? 'text-danger-ink' : 'text-fg'

export interface MenuProps {
  /** Elemento que abre o menu (botão). */
  trigger: React.ReactElement
  items: MenuEntry[]
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom' | 'left' | 'right'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/**
 * Menu de ações (Radix DropdownMenu): setas navegam, Enter ou Espaço escolhem, Esc fecha e devolve o foco.
 * Escapa do contêiner por portal. Ação de perigo vai por último, depois de um divisor.
 */
export function Menu({ trigger, items, align = 'start', side = 'bottom', open, onOpenChange, className }: MenuProps) {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} side={side} sideOffset={6} collisionPadding={12} className={cn('ds-menu ds-root z-50', panel, className)}>
          {items.map((entry, i) =>
            entry.type === 'separator' ? (
              <DropdownMenu.Separator key={`s${i}`} className="mx-0 my-1 h-px bg-hairline" />
            ) : (
              <DropdownMenu.Item
                key={entry.label}
                disabled={entry.disabled}
                onSelect={entry.onSelect}
                className={cn(itemBase, tone(entry), 'data-[highlighted]:bg-hover data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled')}
              >
                <ItemContent entry={entry} />
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** Painel do menu em linha, sem portal, para documentação e capturas. `highlighted` marca o item com foco de teclado. */
export function MenuStatic({ items, highlighted, className }: { items: MenuEntry[]; highlighted?: number; className?: string }) {
  return (
    <div role="group" aria-label="Menu (exemplo)" className={cn('inline-block', panel, className)}>
      {items.map((entry, i) =>
        entry.type === 'separator' ? (
          <div key={`s${i}`} className="my-1 h-px bg-hairline" />
        ) : (
          <div key={entry.label} aria-disabled={entry.disabled || undefined} className={cn(itemBase, tone(entry), entry.disabled && 'text-fg-disabled', highlighted === i && 'bg-hover')}>
            <ItemContent entry={entry} />
          </div>
        ),
      )}
    </div>
  )
}
