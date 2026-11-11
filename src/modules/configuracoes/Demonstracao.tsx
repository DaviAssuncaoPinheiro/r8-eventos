import * as React from 'react'
import { RotateCcw, WifiOff } from 'lucide-react'
import { Badge, Button, Dialog, Switch, notify } from '@/ui'
import { getFailureRate, resetDemo, setFailureRate, useMutation } from '@/services'

export default function Demonstracao() {
  const [fail, setFail] = React.useState(() => getFailureRate() > 0)
  const [confirm, setConfirm] = React.useState(false)
  const reset = useMutation(resetDemo)

  /* a falha simulada só vale enquanto esta aba está aberta */
  React.useEffect(() => () => setFailureRate(0), [])

  const onFail = (v: boolean) => {
    setFail(v)
    setFailureRate(v ? 0.35 : 0)
    notify.info(v ? 'Falhas simuladas ligadas' : 'Falhas simuladas desligadas')
  }

  const doReset = async () => {
    try {
      await reset.run()
      setConfirm(false)
      notify.success('Dados de demonstração restaurados')
    } catch {
      notify.error('Não foi possível restaurar. Tente de novo.')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <section className="flex flex-col rounded-card bg-raised p-5 sm:p-6">
        <span aria-hidden className="grid size-14 place-items-center rounded-pill bg-accent-soft text-accent-ink">
          <RotateCcw size={26} strokeWidth={2} />
        </span>
        <h2 className="mt-4 text-title-sub">Restaurar dados de demonstração</h2>
        <div className="mt-auto pt-6">
          <Button variant="secondary" size="lg" icon={RotateCcw} onClick={() => setConfirm(true)}>
            Restaurar dados
          </Button>
        </div>
      </section>

      <section className="flex flex-col rounded-card bg-raised p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden className="grid size-14 place-items-center rounded-pill bg-warn-soft text-warn-ink">
            <WifiOff size={26} strokeWidth={2} />
          </span>
          {fail ? <Badge tone="warn">35% das ações falham</Badge> : null}
        </div>
        <h2 className="mt-4 text-title-sub">Tratamento de erro</h2>
        <div className="mt-auto pt-6">
          <Switch label="Simular falha de conexão" checked={fail} onCheckedChange={onFail} />
        </div>
      </section>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        destructive
        title="Restaurar os dados de demonstração?"
        description="Locações, cobranças, avisos e configurações voltam ao estado inicial."
        confirmLabel="Restaurar dados"
        confirmLoading={reset.loading}
        onConfirm={() => void doReset()}
      />
    </div>
  )
}
