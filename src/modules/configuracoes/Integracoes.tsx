import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Barcode, FileText, Loader2, MessageCircle, Zap, Landmark, type LucideIcon } from 'lucide-react'
import { cn, notify, type StatusTone } from '@/ui'
import { TONE_SOFT } from '@/app/status'
import { formatDate } from '@/lib/format'
import { setIntegration, useSettings, type IntegrationKey } from '@/services'

const ITEMS: { key: IntegrationKey; name: string; icon: LucideIcon; tone: StatusTone }[] = [
  { key: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, tone: 'ok' },
  { key: 'pix', name: 'Pix', icon: Zap, tone: 'accent' },
  { key: 'boleto', name: 'Boleto', icon: Barcode, tone: 'neutral' },
  { key: 'nfse', name: 'NFS-e', icon: FileText, tone: 'info' },
  { key: 'contaAzul', name: 'Conta Azul', icon: Landmark, tone: 'info' },
]

export default function Integracoes() {
  const s = useSettings()
  const [pending, setPending] = React.useState<Set<IntegrationKey>>(new Set())

  const toggle = async (key: IntegrationKey, name: string, on: boolean) => {
    setPending((p) => new Set(p).add(key))
    try {
      if (on) await new Promise((r) => setTimeout(r, 1200))
      await setIntegration(key, on)
      notify.success(on ? `${name} conectado` : `${name} desconectado`)
    } catch {
      notify.error(`Não foi possível ${on ? 'conectar' : 'desconectar'} ${name}. Tente de novo.`)
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(key)
        return n
      })
    }
  }

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
      {ITEMS.map((it) => {
        const st = s.integrations[it.key]
        const busy = pending.has(it.key)
        const connected = st?.connected ?? false
        const id = `int-${it.key}`
        return (
          <li key={it.key} className="flex flex-col rounded-card bg-raised p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span aria-hidden className={cn('grid size-14 place-items-center rounded-pill', TONE_SOFT[it.tone])}>
                <it.icon size={26} strokeWidth={2} />
              </span>
              <div className="flex items-center gap-3">
                <label htmlFor={id} className="text-body font-semibold text-fg-2">
                  {busy ? 'Conectando…' : connected ? 'Conectado' : 'Desconectado'}
                  <span className="sr-only"> ({it.name})</span>
                </label>
                {busy ? <Loader2 size={18} strokeWidth={2} aria-hidden className="ds-spin text-fg-3" /> : null}
                <SwitchPrimitive.Root
                  id={id}
                  checked={connected || (busy && !connected)}
                  disabled={busy}
                  onCheckedChange={(v) => void toggle(it.key, it.name, v)}
                  className="ds-hit relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-pill bg-strong p-0.5 transition-colors duration-150 ease-[var(--ease-ui)] hover:bg-fg-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-progress data-[state=checked]:bg-accent data-[state=checked]:hover:bg-accent-hover"
                >
                  <SwitchPrimitive.Thumb className="block size-4 rounded-pill bg-white transition-transform duration-150 ease-[var(--ease-ui)] data-[state=checked]:translate-x-4" />
                </SwitchPrimitive.Root>
              </div>
            </div>
            <h2 className="mt-4 text-title-sub">{it.name}</h2>
            <div className="mt-1 min-h-[28px]">
              {connected && !busy ? (
                <p className="truncate text-body text-fg-2">
                  {st.account}
                  {st.connectedAt ? <span className="tnum"> · desde {formatDate(st.connectedAt)}</span> : null}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
