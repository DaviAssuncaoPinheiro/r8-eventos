import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudUpload, Link2, RefreshCw } from 'lucide-react'
import { Badge, Button, notify } from '@/ui'
import { formatDateTime } from '@/lib/format'
import { useSettings } from '@/services'

const KEY = 'r8.contaazul.sync'
const readSync = () => {
  try {
    return localStorage.getItem(KEY) ?? undefined
  } catch {
    return undefined
  }
}

/** Integração com o Conta Azul: estado, última sincronização e "Sincronizar agora" (simulado). */
export function ContaAzul({ paidThisMonth }: { paidThisMonth: number }) {
  const navigate = useNavigate()
  const conta = useSettings().integrations.contaAzul
  const [syncing, setSyncing] = React.useState(false)
  const [last, setLast] = React.useState<string | undefined>(readSync)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const sync = () => {
    setSyncing(true)
    timer.current = window.setTimeout(() => {
      const now = new Date().toISOString()
      try {
        localStorage.setItem(KEY, now)
      } catch {
        /* sem armazenamento: a hora fica só nesta tela */
      }
      setLast(now)
      setSyncing(false)
      notify.success(`${paidThisMonth} ${paidThisMonth === 1 ? 'lançamento enviado' : 'lançamentos enviados'} ao Conta Azul`)
    }, 1500)
  }

  const shown = last ?? conta.connectedAt

  return (
    <section aria-label="Conta Azul" className="flex min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title-sub">Conta Azul</h2>
        <Badge tone={conta.connected ? 'ok' : 'neutral'}>{conta.connected ? 'Conectado' : 'Desconectado'}</Badge>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-pill bg-info-soft text-info-ink">
          <CloudUpload size={22} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          {conta.connected ? (
            <>
              <p className="truncate text-body font-semibold">{conta.account ?? 'Conta da empresa'}</p>
              <p className="text-caption text-fg-3">{shown ? `Última sincronização ${formatDateTime(shown)}` : 'Ainda não sincronizado'}</p>
            </>
          ) : (
            <p className="text-body font-semibold">Sem conexão</p>
          )}
        </div>
      </div>
      <div className="mt-auto pt-5">
        {conta.connected ? (
          <Button variant="secondary" size="md" icon={RefreshCw} loading={syncing} onClick={sync} block>
            {syncing ? 'Sincronizando' : 'Sincronizar agora'}
          </Button>
        ) : (
          <Button variant="secondary" size="md" icon={Link2} onClick={() => navigate('/configuracoes/integracoes')} block>
            Conectar
          </Button>
        )}
      </div>
    </section>
  )
}
