import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Job, Rental } from '@/data/mock'
import type { Draft } from './campoStore'

/** mobile: uma coluna em tela de celular; desktop: largura de computador, em duas colunas */
export type StepLayout = 'mobile' | 'desktop'

export interface StepProps {
  job: Job
  rental: Rental
  draft: Draft
  patch: (p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void
  layout?: StepLayout
  /** "Etapa 2 de 5" */
  eyebrow: string
}

const StepLayoutCtx = React.createContext<StepLayout>('mobile')
export const useStepLayout = () => React.useContext(StepLayoutCtx)
export const useIsDesk = () => React.useContext(StepLayoutCtx) === 'desktop'

/**
 * Estrutura de cada etapa. No celular empilha intro, esquerda e direita.
 * No computador põe esquerda e direita lado a lado. `extra` recebe sheets e afins.
 */
export function StepFrame({ layout = 'mobile', intro, left, right, extra }: { layout?: StepLayout; intro: React.ReactNode; left: React.ReactNode; right?: React.ReactNode; extra?: React.ReactNode }) {
  if (layout === 'desktop') {
    return (
      <StepLayoutCtx.Provider value="desktop">
        {intro}
        <div className={cn('grid items-start gap-4', right ? 'grid-cols-2' : 'grid-cols-1')}>
          <div className="flex min-w-0 flex-col gap-4">{left}</div>
          {right && <div className="flex min-w-0 flex-col gap-4">{right}</div>}
        </div>
        {extra}
      </StepLayoutCtx.Provider>
    )
  }
  return (
    <div className="pb-2">
      {intro}
      {left}
      {right}
      {extra}
    </div>
  )
}

/* Blocos reutilizados pelas etapas */

export function Block({ title, hint, children, className, bodyClassName, action }: { title?: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; action?: React.ReactNode }) {
  const desk = useIsDesk()
  return (
    <section className={cn(desk ? 'rounded-[24px]' : 'mx-4 mt-3 rounded-[28px]', 'bg-card shadow-card transition-shadow', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h3>}
            {hint && <div className="mt-0.5 text-[13px] font-medium text-ink-3">{hint}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('px-5 pt-3 pb-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function StepIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  const desk = useIsDesk()
  if (desk)
    return (
      <div className="flex items-baseline gap-3 px-1 pb-4">
        <h2 className="text-[24px] leading-tight font-bold tracking-[-0.03em] text-ink">{title}</h2>
        {children && <p className="truncate text-[14px] font-medium text-ink-3">{children}</p>}
      </div>
    )
  return (
    <div className="px-5 pt-3 pb-1">
      <div className="text-[13px] font-semibold text-ink-3">{eyebrow}</div>
      <h2 className="mt-0.5 text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink">{title}</h2>
      {children && <p className="mt-1 text-[14px] leading-snug font-medium text-ink-3">{children}</p>}
    </div>
  )
}

/** Campo de texto grande em fundo cinza */
export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea
    ref={ref}
    className={cn('w-full resize-none rounded-[20px] bg-muted px-4 py-3.5 text-[16px] leading-[1.5] font-medium text-ink outline-none placeholder:text-ink-4 focus:bg-card focus:ring-2 focus:ring-black', className)}
    {...p}
  />
))
TextArea.displayName = 'TextArea'

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input
    ref={ref}
    className={cn('h-12 w-full rounded-full bg-muted px-5 text-[16px] font-medium text-ink outline-none placeholder:text-ink-4 focus:bg-card focus:ring-2 focus:ring-black', className)}
    {...p}
  />
))
TextInput.displayName = 'TextInput'

/** Linha marcável com círculo à esquerda (checklist, unidades) */
export function CheckRow({ on, onClick, title, sub, aside, className }: { on: boolean; onClick: () => void; title: React.ReactNode; sub?: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cn('flex w-full items-center gap-3 rounded-[18px] px-2.5 py-3 text-left transition-colors hover:bg-surface active:bg-muted [-webkit-tap-highlight-color:transparent]', className)}
    >
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150', on ? 'bg-black text-brand' : 'bg-card ring-[1.5px] ring-line-2 ring-inset')}>
        {on && (
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[15px] font-semibold transition-colors', on ? 'text-ink' : 'text-ink')}>{title}</span>
        {sub && <span className="mt-0.5 block truncate text-[12.5px] font-medium text-ink-3">{sub}</span>}
      </span>
      {aside}
    </button>
  )
}
