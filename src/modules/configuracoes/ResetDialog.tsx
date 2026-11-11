import { Dialog, notify } from '@/ui'
import { resetDemo, useMutation } from '@/services'

/** Confirmação única de "Restaurar dados": o mesmo texto na aba Demonstração e na faixa do app da equipe de rua. */
export function ResetDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void }) {
  const reset = useMutation(resetDemo)
  const run = async () => {
    try {
      await reset.run()
      onOpenChange(false)
      onDone?.()
      notify.success('Dados de demonstração restaurados')
    } catch {
      notify.error('Não foi possível restaurar. Tente de novo.')
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      destructive
      title="Restaurar os dados de demonstração?"
      description="Locações, cobranças, avisos e configurações voltam ao estado inicial."
      confirmLabel="Restaurar dados"
      confirmLoading={reset.loading}
      onConfirm={() => void run()}
    />
  )
}
