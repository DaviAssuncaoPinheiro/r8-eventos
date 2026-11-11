import * as React from 'react'
import {
  ArrowRight,
  ChevronDown,
  CircleCheck,
  FileWarning,
  MessageSquare,
  ReceiptText,
  Route,
  Send,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { AiTag, Button, Drawer, EmptyState, Money, Skeleton, Tooltip, WhatsAppPreview, cn, notify } from '@/ui'
import {
  approveSuggestion,
  dismissSuggestion,
  getDailySummary,
  getMoneyPanel,
  listServices,
  listSuggestions,
  useMutation,
  useQuery,
  useSettings,
  type CopilotSuggestion,
  type SuggestionKind,
} from '@/services'
import { today } from '@/domain/dates'
import { useCopilotoStore, openCopiloto, closeCopiloto } from './store'

export { openCopiloto, closeCopiloto }

const KIND: Record<SuggestionKind, { icon: LucideIcon; tone: string; done: string }> = {
  cobrar_avaria: { icon: FileWarning, tone: 'bg-danger-soft text-danger-ink', done: 'Cobrança enviada' },
  faturar_extra: { icon: ReceiptText, tone: 'bg-warn-soft text-warn-ink', done: 'Extras faturados e cobrança enviada' },
  lembrar_atraso: { icon: Send, tone: 'bg-info-soft text-info-ink', done: 'Lembrete enviado' },
  redistribuir_rota: { icon: Route, tone: 'bg-accent-soft text-accent-ink', done: 'Rota redistribuída' },
  mensagem_cliente: { icon: MessageSquare, tone: 'bg-ok-soft text-ok-ink', done: 'Mensagem enviada' },
}

const topBtn =
  'ds-touch ds-touch-sq relative inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-raised text-fg-2 transition-[background-color,color] duration-150 ease-[var(--ease-ui)] hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function usePending() {
  const q = useQuery(listSuggestions, [])
  const pending = React.useMemo(() => (q.data ?? []).filter((s) => s.status === 'pendente'), [q.data])
  // as mais valiosas primeiro; o botão e a gaveta mostram só as primeiras
  const ranked = React.useMemo(() => [...pending].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)), [pending])
  return { ...q, pending: ranked }
}

const VISIBLE = 6

/** Botão redondo do topo. Só aparece com o Pacote IA ligado; o ponto mostra quantas propostas esperam. */
export function CopilotoButton() {
  const { aiEnabled } = useSettings()
  const { pending } = usePending()
  if (!aiEnabled) return null
  const shown = Math.min(pending.length, VISIBLE)
  const label = shown ? `Copiloto, ${shown} ${shown === 1 ? 'proposta' : 'propostas'}` : 'Copiloto'
  return (
    <Tooltip content="Copiloto">
      <button type="button" aria-label={label} onClick={openCopiloto} className={topBtn}>
        <Sparkles size={20} strokeWidth={2} aria-hidden />
        {shown ? <span aria-hidden className="absolute top-1.5 right-1.5 size-2.5 rounded-pill bg-accent ring-2 ring-raised" /> : null}
      </button>
    </Tooltip>
  )
}

function Big({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-kpi">{children}</p>
      <p className="mt-0.5 text-body text-fg-2">{label}</p>
    </div>
  )
}

function Summary() {
  const q = useQuery(getDailySummary, [])
  if (!q.data) {
    return (
      <div aria-busy className="grid grid-cols-2 gap-4 rounded-card bg-sunken p-5">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="col-span-2 h-12" />
      </div>
    )
  }
  const n = q.data.numbers
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-card bg-sunken p-5">
      <Big label="serviços hoje">{n.servicesToday}</Big>
      <Big label="em risco">{n.atRisk}</Big>
      <Big label="a cobrar" className="col-span-2">
        <Money value={n.toCollect} variant="kpi" />
      </Big>
    </div>
  )
}

function RouteMoves({ s, teams }: { s: CopilotSuggestion; teams: { id: string; name: string }[] }) {
  const moves = (s.payload.moves as { serviceId: string; toTeamId: string; fromTeamId?: string }[] | undefined) ?? []
  const to = teams.find((t) => t.id === moves[0]?.toTeamId)
  const from = teams.find((t) => t.id === (s.payload.fromTeamId as string | undefined))
  if (!to) return null
  return (
    <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-body font-medium text-fg-2">
      {from ? <span>{from.name}</span> : <span>Equipe atrasada</span>}
      <ArrowRight size={16} strokeWidth={2} aria-hidden />
      <span className="text-fg">{to.name}</span>
    </p>
  )
}

function SuggestionCard({ s, teams, fromTeam, onDone }: { s: CopilotSuggestion; teams: { id: string; name: string }[]; fromTeam?: string; onDone: (s: CopilotSuggestion) => void }) {
  const { company } = useSettings()
  const [open, setOpen] = React.useState(false)
  const approve = useMutation(approveSuggestion)
  const dismiss = useMutation(dismissSuggestion)
  const k = KIND[s.kind]
  const busy = approve.loading || dismiss.loading
  const hasMsg = Boolean(s.draftMessage)

  const doApprove = async () => {
    try {
      await approve.run(s.id)
      onDone(s)
    } catch {
      notify.error('Não foi possível aprovar. Tente de novo.')
    }
  }
  const doDismiss = async () => {
    try {
      await dismiss.run(s.id)
    } catch {
      notify.error('Não foi possível dispensar. Tente de novo.')
    }
  }

  const enriched = fromTeam ? { ...s, payload: { ...s.payload, fromTeamId: fromTeam } } : s

  return (
    <li className="rounded-card bg-sunken p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-pill', k.tone)}>
          <k.icon size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-body-lg font-medium text-fg">{s.title}</p>
            {s.value ? <Money value={s.value} className="shrink-0 text-body-lg font-semibold text-fg" /> : null}
          </div>
          {s.kind === 'redistribuir_rota' ? <RouteMoves s={enriched} teams={teams} /> : null}
        </div>
      </div>

      {hasMsg && open ? <WhatsAppPreview className="mt-3" from={company.name} message={s.draftMessage ?? ''} /> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" loading={approve.loading} disabled={busy} onClick={doApprove}>
          {hasMsg && open ? 'Aprovar e enviar' : 'Aprovar'}
        </Button>
        <Button size="sm" variant="ghost" loading={dismiss.loading} disabled={busy} onClick={doDismiss}>
          Dispensar
        </Button>
        {hasMsg ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Ocultar mensagem' : 'Ver mensagem'}
            onClick={() => setOpen((o) => !o)}
            className="ds-touch ds-touch-sq ml-auto inline-flex size-9 items-center justify-center rounded-pill text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronDown size={18} strokeWidth={2} aria-hidden className={cn('transition-transform duration-200 ease-[var(--ease-ui)]', open && 'rotate-180')} />
          </button>
        ) : null}
      </div>
    </li>
  )
}

interface Confirmed {
  id: string
  text: string
}

function Body() {
  const { pending, initialLoading, error, refetch } = usePending()
  const panel = useQuery(getMoneyPanel, [])
  const [confirmed, setConfirmed] = React.useState<Confirmed[]>([])
  const [all, setAll] = React.useState(false)
  const list = all ? pending : pending.slice(0, VISIBLE)
  const teams = React.useMemo(() => (panel.data?.teamsNow ?? []).map((t) => ({ id: t.team.id, name: t.team.name })), [panel.data])

  const services = useQuery(() => listServices({ date: today() }), [])
  // equipe de origem de cada proposta de rota: a equipe a que o serviço pertence hoje
  const fromTeamOf = React.useCallback(
    (s: CopilotSuggestion) => {
      const sid = (s.payload.moves as { serviceId: string }[] | undefined)?.[0]?.serviceId
      return sid ? services.data?.find((x) => x.id === sid)?.teamId : undefined
    },
    [services.data],
  )

  const onDone = (s: CopilotSuggestion) => {
    const text = `${KIND[s.kind].done}`
    setConfirmed((c) => [{ id: s.id, text }, ...c])
    window.setTimeout(() => setConfirmed((c) => c.filter((x) => x.id !== s.id)), 3200)
    notify.success(text)
  }

  return (
    <div className="flex flex-col gap-5">
      <Summary />
      {error && !pending.length ? (
        <div className="rounded-card bg-danger-soft p-4 text-body" role="alert">
          <p className="font-semibold text-danger-ink">Não foi possível carregar as propostas.</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => void refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : initialLoading ? (
        <ul aria-busy className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton shape="block" className="h-28 rounded-card" />
            </li>
          ))}
        </ul>
      ) : (
        <ul aria-label="Propostas" className="flex flex-col gap-3">
          {confirmed.map((c) => (
            <li key={`ok-${c.id}`} role="status" className="flex items-center gap-3 rounded-card bg-ok-soft p-4 text-ok-ink">
              <CircleCheck size={20} strokeWidth={2} aria-hidden />
              <span className="text-body-lg font-semibold">{c.text}</span>
            </li>
          ))}
          {list.map((s) => (
            <SuggestionCard key={s.id} s={s} teams={teams} fromTeam={fromTeamOf(s)} onDone={onDone} />
          ))}
          {!all && pending.length > VISIBLE ? (
            <li className="flex justify-center">
              <Button variant="ghost" onClick={() => setAll(true)}>
                Ver mais ({pending.length - VISIBLE})
              </Button>
            </li>
          ) : null}
          {!pending.length && !confirmed.length ? (
            <li className="rounded-card bg-sunken">
              <EmptyState icon={Sparkles} title="Nada pendente agora" />
            </li>
          ) : null}
        </ul>
      )}
    </div>
  )
}

/** Gaveta do Copiloto. Monte uma vez na casca: `<Copiloto />`. */
export function CopilotoDrawer() {
  const { aiEnabled } = useSettings()
  const open = useCopilotoStore((s) => s.open)
  const setOpen = useCopilotoStore((s) => s.setOpen)
  React.useEffect(() => {
    if (!aiEnabled && open) setOpen(false)
  }, [aiEnabled, open, setOpen])
  if (!aiEnabled) return null
  return (
    <Drawer open={open} onOpenChange={setOpen} title="Copiloto" description={<AiTag />}>
      <Body />
    </Drawer>
  )
}

/** Componente único para a casca: renderiza a gaveta (o botão `CopilotoButton` vai no topo). */
export function Copiloto() {
  return <CopilotoDrawer />
}

export default Copiloto
