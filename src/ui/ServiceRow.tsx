import * as React from 'react'
import { Hammer, Sparkles, Truck, Wrench, type LucideIcon } from 'lucide-react'
import { Badge, StatusDot, type StatusTone } from './Badge'
import { cn } from './cn'

export type ServiceType = 'limpeza' | 'entrega' | 'retirada' | 'manutencao' | 'montagem'
export type ServiceStatus = 'agendado' | 'a-caminho' | 'em-andamento' | 'atrasado' | 'concluido'

const typeIcon: Record<ServiceType, LucideIcon> = {
  limpeza: Sparkles,
  entrega: Truck,
  retirada: Truck,
  manutencao: Wrench,
  montagem: Hammer,
}

const statusInfo: Record<ServiceStatus, { tone: StatusTone; label: string }> = {
  agendado: { tone: 'info', label: 'Agendado' },
  'a-caminho': { tone: 'info', label: 'A caminho' },
  'em-andamento': { tone: 'accent', label: 'Em andamento' },
  atrasado: { tone: 'danger', label: 'Atrasado' },
  concluido: { tone: 'ok', label: 'Concluído' },
}

export interface ServiceRowProps {
  /** "07:30" */
  time: string
  /** "1 h 30" */
  duration: string
  type: ServiceType
  /** "Limpeza, 12 unidades" */
  title: string
  client: string
  address: string
  status: ServiceStatus
  /** Equipe, "Extra". */
  badges?: { label: string; tone?: StatusTone }[]
  /** escritório (agenda) ou campo (celular, texto 16, 80px). */
  variant?: 'office' | 'field'
  /** Toque ou clique abre o serviço. */
  onOpen?: () => void
  /** Só documentação. */
  forceHover?: boolean
  className?: string
}

/** Item de lista da agenda e do app de campo. Use dentro de um `<ul>`. */
export const ServiceRow = React.forwardRef<HTMLLIElement, ServiceRowProps>(function ServiceRow(
  { time, duration, type, title, client, address, status, badges, variant = 'office', onOpen, forceHover, className },
  ref,
) {
  const field = variant === 'field'
  const Icon = typeIcon[type]
  const st = statusInfo[status]
  const current = status === 'em-andamento'
  const late = status === 'atrasado'
  const done = status === 'concluido'

  const statusNode = <StatusDot tone={st.tone}>{st.label}</StatusDot>

  const inner = (
    <>
      <div className="w-14 shrink-0">
        <div className={cn('tnum font-semibold', field ? 'text-body-lg' : 'text-body', current ? 'text-accent-ink' : late ? 'text-danger-ink' : done ? 'text-fg-2' : 'text-fg')}>{time}</div>
        <div className="tnum text-caption text-fg-3">{duration}</div>
      </div>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-tip bg-sunken text-fg-2">
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate font-semibold', field ? 'text-body-lg' : 'text-body')}>
          {title}
        </div>
        <div className={cn('truncate text-fg-3', field ? 'text-body' : 'text-caption')}>
          {client} · {address}
        </div>
        <div className={cn('mt-1.5 flex-wrap items-center gap-1.5', badges?.length ? 'flex' : 'flex @md/row:hidden')}>
          {badges?.map((b) => (
            <Badge key={b.label} tone={b.tone}>
              {b.label}
            </Badge>
          ))}
          <span className="@md/row:hidden">{statusNode}</span>
        </div>
      </div>
      <div className="hidden shrink-0 @md/row:block">{statusNode}</div>
    </>
  )

  const shell = cn(
    'flex w-full items-start gap-3 px-4 py-3 text-left',
    field ? 'min-h-20' : 'min-h-[72px]',
  )

  return (
    <li
      ref={ref}
      data-force={forceHover ? 'hover' : undefined}
      className={cn(
        '@container/row border-b border-hairline transition-colors duration-150 last:border-b-0',
        current ? 'bg-accent-soft' : 'hover:bg-hover data-[force=hover]:bg-hover',
        className,
      )}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className={cn(shell, 'ds-touch cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring')}
        >
          {inner}
        </button>
      ) : (
        <div className={shell}>{inner}</div>
      )}
    </li>
  )
})
