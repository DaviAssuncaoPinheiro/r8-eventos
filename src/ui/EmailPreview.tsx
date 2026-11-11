import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from './cn'

export interface EmailPreviewProps {
  /** Nome de quem envia (a locadora). */
  from: string
  /** E-mail ou nome do destinatário. */
  to: string
  subject: string
  /** Corpo. Quebras de linha são mantidas. */
  body: string
  /** Rótulo do botão de pagamento, ex.: "Pagar R$ 420,00 com Pix". Sem rótulo, não mostra botão. */
  cta?: string
  /** Anexo acima do corpo (foto da avaria). */
  attachment?: React.ReactNode
  className?: string
}

/** Pré-visualização do e-mail que o cliente recebe: remetente, assunto, corpo e o botão de pagar. */
export function EmailPreview({ from, to, subject, body, cta, attachment, className }: EmailPreviewProps) {
  return (
    <div role="group" aria-label={`E-mail para ${to}`} className={cn('overflow-hidden rounded-card bg-sunken', className)}>
      <div className="flex items-center gap-3 px-4 pt-4">
        <span aria-hidden className="ds-hero grid size-9 shrink-0 place-items-center rounded-pill text-caption font-bold">
          {from.slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-fg">{from}</span>
          <span className="block truncate text-caption text-fg-3">para {to}</span>
        </span>
      </div>
      <div className="p-4">
        <div className="rounded-control bg-raised p-4">
          <p className="text-body-lg font-semibold text-fg">{subject}</p>
          {attachment ? <div className="mt-3 overflow-hidden rounded-control">{attachment}</div> : null}
          <p className="mt-2 text-body leading-[22px] break-words whitespace-pre-wrap text-fg-2">{body}</p>
          {cta ? (
            <span className="ds-hero mt-4 inline-flex h-11 items-center gap-2 rounded-pill px-5 text-body font-semibold">
              {cta}
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
