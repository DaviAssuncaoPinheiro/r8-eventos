import * as React from 'react'
import { CircleAlert } from 'lucide-react'
import { cn } from './cn'

type FieldCtx = { id: string; describedBy?: string; invalid: boolean; disabled: boolean; required: boolean }
const Ctx = React.createContext<FieldCtx | null>(null)

/** Lido por Input, Textarea e Select para ligar rótulo, ajuda e erro automaticamente. */
export function useField() {
  return React.useContext(Ctx)
}

export interface FieldProps {
  label: string
  /** Mostra "opcional" ao lado do rótulo. Campos obrigatórios não levam asterisco. */
  optional?: boolean
  help?: React.ReactNode
  error?: React.ReactNode
  disabled?: boolean
  required?: boolean
  id?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, optional, help, error, disabled = false, required = false, id: idProp, className, children }: FieldProps) {
  const auto = React.useId()
  const id = idProp ?? `f${auto.replace(/:/g, '')}`
  const helpId = help ? `${id}-help` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [errId, helpId].filter(Boolean).join(' ') || undefined
  return (
    <Ctx.Provider value={{ id, describedBy, invalid: !!error, disabled, required }}>
      <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        <label htmlFor={id} className={cn('flex items-baseline gap-1.5 text-body font-semibold text-fg', disabled && 'text-fg-disabled')}>
          {label}
          {optional ? <span className="text-caption text-fg-3">opcional</span> : null}
        </label>
        {children}
        {error ? (
          <p id={errId} className="flex items-start gap-1.5 text-caption font-semibold text-danger-ink">
            <CircleAlert size={14} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
        {help ? (
          <p id={helpId} className="text-caption text-fg-3">
            {help}
          </p>
        ) : null}
      </div>
    </Ctx.Provider>
  )
}

/* classes compartilhadas por Input, Textarea e Select */
export const controlFrame =
  'w-full rounded-control border border-strong bg-raised text-body text-fg transition-[border-color,box-shadow] duration-150 ease-[var(--ease-ui)] ' +
  'hover:border-fg-3 data-[force=hover]:border-fg-3 ' +
  'data-[invalid=true]:border-danger data-[invalid=true]:hover:border-danger ' +
  'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-hairline data-[disabled=true]:bg-sunken data-[disabled=true]:text-fg-disabled'

/** Foco do controle: contorno de 2px na cor do anel, colado na borda. */
export const controlFocus =
  'focus-within:border-ring focus-within:shadow-[0_0_0_1px_var(--ring)] data-[force=focus]:border-ring data-[force=focus]:shadow-[0_0_0_1px_var(--ring)] ' +
  'data-[invalid=true]:focus-within:border-danger data-[invalid=true]:focus-within:shadow-[0_0_0_1px_var(--danger)]'
