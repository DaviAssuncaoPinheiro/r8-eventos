import * as React from 'react'
import { RotateCcw, WifiOff } from 'lucide-react'
import { Badge, Button, Switch, notify } from '@/ui'
import { getFailureRate, setFailureRate } from '@/services'
import { ResetDialog } from './ResetDialog'

export default function Demonstracao() {
  const [fail, setFail] = React.useState(() => getFailureRate() > 0)
  const [confirm, setConfirm] = React.useState(false)

  /* a falha simulada só vale enquanto esta aba está aberta */
  React.useEffect(() => () => setFailureRate(0), [])

  const onFail = (v: boolean) => {
    setFail(v)
    setFailureRate(v ? 0.35 : 0)
    notify.info(v ? 'Falhas simuladas ligadas' : 'Falhas simuladas desligadas')
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

      <ResetDialog open={confirm} onOpenChange={setConfirm} />
    </div>
  )
}
