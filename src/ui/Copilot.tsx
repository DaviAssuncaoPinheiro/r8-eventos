import * as React from 'react'
import { CircleCheck, Sparkles } from 'lucide-react'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card, CardHeader } from './Card'
import { Skeleton } from './Skeleton'
import { cn } from './cn'

/** Etiqueta "Pacote IA": ao lado de recursos que dependem do pacote. Sem gradiente, sem brilho. */
export function AiTag({ className }: { className?: string }) {
  return (
    <Badge tone="accent" icon={Sparkles} className={className}>
      Pacote IA
    </Badge>
  )
}

/** Número em destaque dentro do texto da sugestão (peso 600, algarismos tabulares). */
export function CopilotValue({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold tnum whitespace-nowrap">{children}</strong>
}

export type CopilotStatus = 'idle' | 'loading' | 'done'

export interface CopilotCardProps {
  status?: CopilotStatus
  /** Sugestão em uma ou duas frases. Use CopilotValue no número que importa. */
  suggestion: React.ReactNode
  /** Fonte da conclusão: "Com base em 3 retiradas". */
  source?: string
  /** Verbo + objeto: "Gerar cobrança". */
  approveLabel: string
  onApprove?: () => void
  dismissLabel?: string
  onDismiss?: () => void
  /** Estado concluído: o que aconteceu, em uma frase ("Cobrança enviada para a Construtora Planalto"). */
  doneMessage?: string
  /** Detalhe curto sob a frase concluída. */
  doneDetail?: string
  /** Ação do estado concluído (ex.: "Desfazer"). */
  doneAction?: { label: string; onClick: () => void }
  className?: string
}

/**
 * Cartão do Copiloto, no trilho direito ou no fim de uma seção. Sugere uma ação e mostra de onde veio a conclusão.
 * Não é chat: sem avatar, sem campo de texto.
 */
export function CopilotCard({
  status = 'idle',
  suggestion,
  source,
  approveLabel,
  onApprove,
  dismissLabel = 'Dispensar',
  onDismiss,
  doneMessage,
  doneDetail,
  doneAction,
  className,
}: CopilotCardProps) {
  return (
    <Card as="section" aria-label="Copiloto" aria-busy={status === 'loading' || undefined} className={cn('flex flex-col', className)}>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} strokeWidth={2} aria-hidden className="text-accent-ink" />
            Copiloto
          </span>
        }
        action={<AiTag />}
      />

      {status === 'loading' ? (
        <div className="flex flex-col gap-2.5" role="status">
          <span className="sr-only">Analisando as retiradas</span>
          <Skeleton className="w-full" />
          <Skeleton className="w-11/12" />
          <Skeleton className="w-3/5" />
        </div>
      ) : status === 'done' ? (
        <div className="flex flex-col gap-3" role="status">
          <div className="flex items-start gap-2.5">
            <CircleCheck size={18} strokeWidth={2} aria-hidden className="mt-0.5 shrink-0 text-ok-ink" />
            <div className="min-w-0">
              <p className="text-body font-semibold text-fg">{doneMessage}</p>
              {doneDetail ? <p className="mt-0.5 text-caption text-fg-3">{doneDetail}</p> : null}
            </div>
          </div>
          {doneAction ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={doneAction.onClick}>
                {doneAction.label}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <p className="text-body text-fg">{suggestion}</p>
          {source ? <p className="mt-2 text-caption text-fg-3">{source}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={onApprove}>
              {approveLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              {dismissLabel}
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
