import * as React from 'react'
import { History, type LucideIcon } from 'lucide-react'
import { cn } from './cn'
import { EmptyState } from './EmptyState'
import { Money } from './Money'
import { PhotoThumb } from './Photo'
import { Skeleton } from './Skeleton'

export type TimelineTone = 'neutral' | 'danger' | 'ok' | 'warn' | 'info'

const circle: Record<TimelineTone, string> = {
  neutral: 'bg-sunken text-fg-2',
  danger: 'bg-danger-soft text-danger-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  info: 'bg-info-soft text-info-ink',
}

export interface TimelineEvent {
  id: string
  icon: LucideIcon
  /** danger para avaria, ok para pagamento. */
  tone?: TimelineTone
  /** "Avaria registrada na BQ-0142" */
  title: string
  /** "03/11/2026 às 14:32 · Marcos Vieira" */
  meta: string
  photo?: { src: string; alt: string }
  amount?: number
}

export interface TimelineGroup {
  /** "Hoje", "Ontem", "03/11/2026" */
  label: string
  events: TimelineEvent[]
}

export interface TimelineProps {
  groups: TimelineGroup[]
  loading?: boolean
  /** Toque na foto de um evento. */
  onPhotoOpen?: (event: TimelineEvent) => void
  className?: string
}

/** Linha do tempo do dossiê, agrupada por dia, para o trilho direito ou a ficha. */
export function Timeline({ groups, loading, onPhotoOpen, className }: TimelineProps) {
  if (loading) {
    return (
      <div role="status" aria-busy="true" aria-label="Carregando registros" className={cn('flex flex-col gap-4', className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden className="flex gap-3">
            <Skeleton shape="circle" className="size-7" />
            <div className="flex-1">
              <Skeleton className="w-4/5" />
              <Skeleton className="mt-2 h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (groups.every((g) => g.events.length === 0)) {
    return <EmptyState icon={History} title="Nenhum registro para este cliente ainda" className={cn('py-8', className)} />
  }
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {groups
        .filter((g) => g.events.length > 0)
        .map((g) => (
          <section key={g.label} aria-label={g.label}>
            <h4 className="mb-3 text-caption font-semibold text-fg-3">{g.label}</h4>
            <ol className="m-0 list-none p-0">
              {g.events.map((e, i) => {
                const Icon = e.icon
                const last = i === g.events.length - 1
                return (
                  <li key={e.id} className={cn('relative pl-10', !last && 'pb-4')}>
                    {/* linha vertical ligando os círculos: centro a 14px da esquerda */}
                    {!last ? <span aria-hidden className="absolute top-7 bottom-0 left-[14px] w-px bg-hairline" /> : null}
                    <span aria-hidden className={cn('absolute top-0 left-0 grid size-7 place-items-center rounded-pill', circle[e.tone ?? 'neutral'])}>
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <div className="min-h-7">
                      <p className="text-body font-semibold">{e.title}</p>
                      <p className="text-caption text-fg-3">{e.meta}</p>
                      {e.photo || e.amount != null ? (
                        <div className="mt-2 flex items-center gap-3">
                          {e.photo ? <PhotoThumb src={e.photo.src} alt={e.photo.alt} size={64} onClick={onPhotoOpen ? () => onPhotoOpen(e) : undefined} /> : null}
                          {e.amount != null ? <Money value={e.amount} className="text-body font-semibold" /> : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
    </div>
  )
}
