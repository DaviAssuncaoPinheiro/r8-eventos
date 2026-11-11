/* Envio de conclusões e avarias: direto, ou para a fila quando "Simular sem sinal" está ligado. */
import { completeService, registerDamage, type NewDamageInput, type ReportInput } from '@/services'
import { notify } from '@/ui/Toast'
import { newId } from './lib'
import { useCampo, type QueueItem } from './store'

export interface LocalDamage {
  localId: string
  input: NewDamageInput
}

export type SendResult = 'enviado' | 'fila'

export async function submitDamage(teamId: string, input: NewDamageInput, label: string): Promise<SendResult> {
  const st = useCampo.getState()
  if (st.offline) {
    st.enqueue({ id: newId('q'), kind: 'damage', label, teamId, localId: newId('dl'), input })
    return 'fila'
  }
  const d = await registerDamage(input)
  st.addMyDamage(teamId, d.id)
  return 'enviado'
}

export async function submitCompletion(teamId: string, serviceId: string, report: ReportInput, damages: LocalDamage[], label: string): Promise<SendResult> {
  const st = useCampo.getState()
  if (st.offline) {
    for (const d of damages) st.enqueue({ id: newId('q'), kind: 'damage', label: `Avaria em ${label}`, teamId, localId: d.localId, input: { ...d.input, serviceId } })
    st.enqueue({ id: newId('q'), kind: 'complete', label, teamId, serviceId, report, damageLocalIds: damages.map((d) => d.localId) })
    return 'fila'
  }
  const ids: string[] = []
  for (const d of damages) {
    const saved = await registerDamage({ ...d.input, serviceId })
    ids.push(saved.id)
    st.addMyDamage(teamId, saved.id)
  }
  await completeService(serviceId, { ...report, damageIds: ids })
  return 'enviado'
}

let running = false
/** ids reais das avarias já enviadas nesta sessão, por id local (sobrevive a uma tentativa que falhou no meio) */
const realIds = new Map<string, string>()

/** Envia a fila, um item por vez e na ordem. Para no primeiro erro e mantém o resto. */
export async function syncQueue(): Promise<number> {
  if (running) return 0
  running = true
  const st = useCampo.getState()
  st.setSyncing(true)
  let sent = 0
  try {
    for (const item of [...useCampo.getState().queue] as QueueItem[]) {
      if (item.kind === 'damage') {
        const d = await registerDamage(item.input)
        realIds.set(item.localId, d.id)
        useCampo.getState().addMyDamage(item.teamId, d.id)
      } else {
        const damageIds = item.damageLocalIds.map((l) => realIds.get(l)).filter((x): x is string => !!x)
        await completeService(item.serviceId, { ...item.report, damageIds })
      }
      useCampo.getState().dequeue(item.id)
      sent++
    }
    if (sent) notify.success(sent === 1 ? '1 registro enviado' : `${sent} registros enviados`)
  } catch {
    notify.error('Não foi possível enviar a fila. Tente de novo.')
  } finally {
    useCampo.getState().setSyncing(false)
    running = false
  }
  return sent
}
