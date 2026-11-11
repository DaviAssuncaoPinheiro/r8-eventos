import * as React from 'react'
import { Check } from 'lucide-react'
import { Button } from './Button'
import { cn } from './cn'

export interface StepperStep {
  id: string
  label: string
  /** Passo com problema: círculo danger-soft com "!". */
  error?: boolean
}

export interface StepperProps {
  steps: StepperStep[]
  /** Índice (a partir de 0) do passo atual. */
  current: number
  /** Chamado ao clicar num passo já concluído (variante escritório). */
  onStepClick?: (index: number) => void
  /** office: barra horizontal com passos. field: "Passo 2 de 5" + barra de progresso. */
  variant?: 'office' | 'field'
  /** Título grande da variante field. Padrão: rótulo do passo atual. */
  title?: string
  className?: string
}

function Circle({ state, n }: { state: 'done' | 'current' | 'todo' | 'error'; n: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-pill text-caption font-semibold tnum transition-colors duration-150 ease-[var(--ease-ui)]',
        state === 'todo' && 'bg-sunken text-fg-2',
        state === 'current' && 'bg-accent text-on-accent',
        state === 'done' && 'bg-accent-soft text-accent-ink',
        state === 'error' && 'bg-danger-soft text-danger-ink',
      )}
    >
      {state === 'done' ? <Check size={14} strokeWidth={2} /> : state === 'error' ? '!' : n}
    </span>
  )
}

/** Passo a passo de wizard. Escritório: barra com passos clicáveis quando concluídos. Campo: contador e progresso. */
export function Stepper({ steps, current, onStepClick, variant = 'office', title, className }: StepperProps) {
  const total = steps.length

  if (variant === 'field') {
    const step = steps[current]
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <p className="text-caption font-semibold text-fg-3 tnum">
          Passo {current + 1} de {total}
        </p>
        <h2 className="text-title-field text-fg">{title ?? step?.label}</h2>
        <div
          role="progressbar"
          aria-label="Progresso"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={current + 1}
          aria-valuetext={`Passo ${current + 1} de ${total}`}
          className="mt-1 h-1 w-full overflow-hidden rounded-pill bg-sunken"
        >
          <div className="h-full rounded-pill bg-accent transition-[width] duration-[250ms] ease-[var(--ease-ui)]" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>
      </div>
    )
  }

  return (
    <nav aria-label="Etapas" className={className}>
      <ol className="flex items-center">
        {steps.map((s, i) => {
          const isCurrent = i === current
          const isDone = i < current
          const state = s.error ? 'error' : isCurrent ? 'current' : isDone ? 'done' : 'todo'
          const status = s.error ? ', com erro' : isDone ? ', concluído' : ''
          const label = (
            <>
              <Circle state={state} n={i + 1} />
              <span className={cn('text-body whitespace-nowrap', isCurrent ? 'font-semibold text-fg' : 'text-fg-2', !isCurrent && 'max-sm:sr-only')}>
                {s.label}
                <span className="sr-only">{status}</span>
              </span>
            </>
          )
          return (
            <li key={s.id} className={cn('flex items-center', i < total - 1 && 'flex-1')} aria-current={isCurrent ? 'step' : undefined}>
              {isDone && onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i)}
                  aria-label={`Voltar ao passo ${i + 1}, ${s.label}${status}`}
                  className="ds-hit -mx-1 flex items-center gap-2 rounded-control px-1 py-1 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {label}
                </button>
              ) : (
                <span className="flex items-center gap-2">{label}</span>
              )}
              {i < total - 1 ? <span aria-hidden className={cn('mx-3 h-px min-w-3 flex-1 transition-colors duration-200 ease-[var(--ease-ui)]', isDone ? 'bg-accent' : 'bg-hairline')} /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export interface StepperFooterProps {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  /** Sem passo anterior: "Voltar" fica desabilitado. */
  backDisabled?: boolean
  nextDisabled?: boolean
  nextLoading?: boolean
  /** field: botões grandes de 56px do app da equipe de rua. */
  size?: 'md' | 'field'
  className?: string
}

/** Rodapé do wizard: "Voltar" fantasma à esquerda, "Continuar" primário à direita. */
export function StepperFooter({ onBack, onNext, backLabel = 'Voltar', nextLabel = 'Continuar', backDisabled, nextDisabled, nextLoading, size = 'md', className }: StepperFooterProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <Button variant="ghost" size={size} onClick={onBack} disabled={backDisabled}>
        {backLabel}
      </Button>
      <Button variant="primary" size={size} onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
        {nextLabel}
      </Button>
    </div>
  )
}
