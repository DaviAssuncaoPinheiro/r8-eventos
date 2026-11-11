import { Check } from 'lucide-react'
import { RENTAL_FLOW, RENTAL_STATUS } from '@/app/status'
import { cn } from '@/ui'
import type { RentalStatus } from '@/services'

/** Etapas em pílulas: atual preenchida com a marca, anteriores com check, próximas vazias. */
export function TrilhaEtapas({ status }: { status: RentalStatus }) {
  const idx = RENTAL_FLOW.indexOf(status)
  const cancelled = status === 'cancelada'
  return (
    <ol aria-label="Etapas da locação" className="flex flex-wrap items-center gap-2">
      {RENTAL_FLOW.map((s, i) => {
        const state = cancelled ? 'todo' : i < idx ? 'done' : i === idx ? 'current' : 'todo'
        return (
          <li key={s} aria-current={state === 'current' ? 'step' : undefined} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-pill px-4 text-body font-semibold whitespace-nowrap transition-colors duration-150 ease-[var(--ease-ui)]',
                state === 'current' && 'bg-accent text-on-accent',
                state === 'done' && 'bg-accent-soft text-accent-ink',
                state === 'todo' && 'text-fg-2 ring-1 ring-edge ring-inset',
                cancelled && 'opacity-60',
              )}
            >
              {state === 'done' ? <Check size={16} strokeWidth={2} aria-hidden /> : null}
              {RENTAL_STATUS[s].label}
              {state === 'done' ? <span className="sr-only"> (concluída)</span> : null}
            </span>
            {i < RENTAL_FLOW.length - 1 ? <span aria-hidden className={cn('hidden h-px w-4 sm:block', i < idx && !cancelled ? 'bg-accent' : 'bg-hairline')} /> : null}
          </li>
        )
      })}
    </ol>
  )
}
