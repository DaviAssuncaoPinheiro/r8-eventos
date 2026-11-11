import * as React from 'react'
import { CheckCheck } from 'lucide-react'
import { cn } from './cn'

export interface WhatsAppPreviewProps {
  /** Nome que aparece no topo da conversa (a locadora). */
  from: string
  /** Texto da mensagem. Quebras de linha são mantidas; *negrito* no padrão do WhatsApp vira negrito. */
  message: string
  /** Hora exibida no balão ("10:42"). */
  time?: string
  /** Anexo acima do texto (foto, código Pix). */
  attachment?: React.ReactNode
  className?: string
}

function rich(text: string) {
  return text.split(/(\*[^*\n]+\*)/g).map((part, i) => (part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <strong key={i}>{part.slice(1, -1)}</strong> : <React.Fragment key={i}>{part}</React.Fragment>))
}

/**
 * Pré-visualização de mensagem de WhatsApp: um balão sobre o fundo da conversa.
 * As cores são as do aplicativo e ficam fixas nos dois temas, para parecer a tela que o cliente vê.
 */
export function WhatsAppPreview({ from, message, time = '10:42', attachment, className }: WhatsAppPreviewProps) {
  return (
    <div className={cn('overflow-hidden rounded-card bg-[#efe7dc] text-[#111b21]', className)} role="group" aria-label={`Mensagem de WhatsApp de ${from}`}>
      <div className="flex items-center gap-2.5 bg-[#075e54] px-4 py-2.5 text-white">
        <span aria-hidden className="grid size-8 place-items-center rounded-pill bg-white/20 text-caption font-semibold">
          {from.slice(0, 2).toUpperCase()}
        </span>
        <span className="truncate text-body font-semibold">{from}</span>
      </div>
      <div className="px-3 py-4">
        <div className="ml-auto max-w-[92%] rounded-[12px] rounded-tr-[4px] bg-[#d9fdd3] px-3 pt-2 pb-1.5 text-body leading-[21px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
          {attachment ? <div className="mb-2 overflow-hidden rounded-[8px]">{attachment}</div> : null}
          <p className="break-words whitespace-pre-wrap">{rich(message)}</p>
          <p className="mt-0.5 flex items-center justify-end gap-1 text-caption text-[#54656f]">
            {time}
            <CheckCheck size={15} strokeWidth={2} aria-hidden className="text-[#027eb5]" />
          </p>
        </div>
      </div>
    </div>
  )
}
