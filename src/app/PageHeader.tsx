import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/ui'

/**
 * Cabeçalho de toda tela do escritório: título grande à esquerda e ações em pílula à direita.
 * Sem subtítulo de apoio (regra do produto). `back` mostra a seta de voltar; `meta` aceita
 * uma etiqueta de situação ao lado do título, nunca frase.
 */
export function PageHeader({ title, actions, back, meta, className }: { title: React.ReactNode; actions?: React.ReactNode; back?: string | true; meta?: React.ReactNode; className?: string }) {
  const navigate = useNavigate()
  return (
    <div className={cn('mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {back ? (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => (back === true ? navigate(-1) : navigate(back))}
            className="ds-touch ds-touch-sq grid size-11 shrink-0 place-items-center rounded-pill bg-raised text-fg transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft size={20} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        <h1 className="min-w-0 truncate text-title-page">{title}</h1>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  )
}
