import { cn } from '@/ui'

export interface PillOption<T extends string> {
  value: T
  label: string
  count?: number
}

/** Filtro em pílulas com contagem. Mesmo desenho do Segmented, mas cada opção mostra quantos itens tem. */
export function FilterPills<T extends string>({ options, value, onChange, label, className }: { options: PillOption<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'ds-touch inline-flex h-9 items-center gap-2 rounded-pill px-4 text-body font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-ui)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              on ? 'bg-fg text-raised' : 'bg-sunken text-fg-2 hover:bg-hover hover:text-fg',
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span className={cn('tnum inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-caption font-semibold', on ? 'bg-raised/20 text-raised' : 'bg-raised text-fg-2')}>{o.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
