import * as React from 'react'
import { CircleCheck, type LucideIcon } from 'lucide-react'
import { cn } from './cn'

export interface FieldActionTileProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  /** Curto, uma linha: "Cheguei", "Iniciar limpeza". */
  label: string
  /** Etapa concluída: ícone vira CircleCheck `ok` e aparece "Feito". */
  done?: boolean
  /** Estado forçado, só para documentação. */
  forceState?: 'hover' | 'active' | 'focus'
}

/** Ação de etapa do app da equipe de rua: 96 px de altura, ícone 24 em cima, rótulo 16/600 embaixo. Use dentro de `FieldActionGrid`. */
export const FieldActionTile = React.forwardRef<HTMLButtonElement, FieldActionTileProps>(function FieldActionTile(
  { icon: Icon, label, done = false, forceState, disabled, className, type = 'button', ...rest },
  ref,
) {
  const Lead = done ? CircleCheck : Icon
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      data-force={forceState}
      data-done={done || undefined}
      className={cn(
        'flex h-24 w-full min-w-0 flex-col items-start justify-between rounded-card bg-raised p-4 text-left text-fg select-none ' +
          'transition-[background-color,color,transform] duration-150 ease-[var(--ease-ui)] ' +
          'hover:bg-hover active:translate-y-px active:bg-sunken ' +
          'data-[force=hover]:bg-hover data-[force=active]:translate-y-px data-[force=active]:bg-sunken ' +
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
          'data-[force=focus]:outline-2 data-[force=focus]:outline-offset-2 data-[force=focus]:outline-ring ' +
          'disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-raised disabled:text-fg-disabled',
        className,
      )}
      {...rest}
    >
      <Lead size={24} strokeWidth={2} aria-hidden className={cn('shrink-0', disabled ? 'text-fg-disabled' : done ? 'text-ok' : 'text-accent-ink')} />
      <span className="block w-full min-w-0">
        <span className="block truncate text-body-lg leading-5 font-semibold">{label}</span>
        {done ? <span className="block text-caption font-medium text-ok-ink">Feito</span> : null}
      </span>
    </button>
  )
})

/** Grade de 2 colunas com gap 12 para os `FieldActionTile`. */
export function FieldActionGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3', className)}>{children}</div>
}

/**
 * Rodapé da ação principal: `bg-app`, padding 12/16 e área segura. Coloque dentro do prop `actionBar`
 * do FieldFrame com um `Button size="field" block variant="primary"`. Uma ação principal por tela.
 */
export function FieldActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex shrink-0 flex-col gap-2 bg-app px-4 pt-3 pb-3', className)}>{children}</div>
}
