import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { getAutomationLog, removeAutomation, useMutation, useQuery, type Automation } from '@/services'
import { Badge, Button, Drawer, EmptyState, Skeleton, notify } from '@/ui'
import { RollingMoney, RollingNumber } from '@/ui/Motion'
import { RunTimeline } from './Activity'
import { channelLabel } from './AutomationCard'
import { Flow } from './Flow'

/** Gaveta de uma automação: o fluxo, os números dela e só o histórico dela. */
export function AutomationDrawer({ auto, onClose }: { auto: Automation | null; onClose: () => void }) {
  const id = auto?.id
  const logQ = useQuery(() => (id ? getAutomationLog({ automationId: id, limit: 40 }) : Promise.resolve([])), [id])
  const del = useMutation(removeAutomation)
  const [confirm, setConfirm] = React.useState(false)
  React.useEffect(() => setConfirm(false), [id])

  const remove = async () => {
    if (!auto) return
    try {
      await del.run(auto.id)
      notify.success('Automação excluída')
      onClose()
    } catch {
      notify.error('Não foi possível excluir. Tente de novo.')
    }
  }

  return (
    <Drawer
      open={!!auto}
      onOpenChange={(o) => !o && onClose()}
      title={auto?.name ?? 'Automação'}
      footer={
        auto && !auto.builtIn ? (
          confirm ? (
            <>
              <Button variant="danger" icon={Trash2} loading={del.loading} onClick={remove}>
                Confirmar exclusão
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="secondary" icon={Trash2} onClick={() => setConfirm(true)}>
              Excluir
            </Button>
          )
        ) : undefined
      }
    >
      {auto ? (
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{channelLabel(auto.channel)}</Badge>
            <Badge tone={auto.enabled ? 'ok' : 'idle'}>{auto.enabled ? 'Ligada' : 'Desligada'}</Badge>
          </div>
          <Flow className="mt-5" size={64} triggerKind={auto.trigger.kind} triggerLabel={auto.trigger.label} actionKind={auto.action.kind} actionLabel={auto.action.label} active={auto.enabled} />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-card bg-sunken p-4">
              <span className="block text-kpi">
                <RollingNumber value={auto.stats.runsMonth} />
              </span>
              <span className="text-caption text-fg-3">execuções em 30 dias</span>
            </div>
            <div className="rounded-card bg-sunken p-4">
              <span className="block text-kpi">
                <RollingMoney kpi value={auto.stats.moneyMonth} />
              </span>
              <span className="text-caption text-fg-3">recuperado em 30 dias</span>
            </div>
          </div>
          <h3 className="mt-6 mb-2 text-title-card">Histórico</h3>
          {!logQ.data ? (
            <div aria-busy="true" className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 rounded-pill" />
              ))}
            </div>
          ) : logQ.data.length ? (
            <RunTimeline runs={logQ.data} autos={[auto]} />
          ) : (
            <EmptyState title="Ainda sem execuções">{auto.enabled ? 'A primeira aparece aqui assim que houver algo para fazer.' : 'Ligue a automação para ela começar a trabalhar.'}</EmptyState>
          )}
        </div>
      ) : null}
    </Drawer>
  )
}
