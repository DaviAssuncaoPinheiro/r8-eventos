import * as React from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, ClipboardList, Copy, ExternalLink, Info, Link2, MessageCircle, PenLine, Phone, Plus, ReceiptText, ShieldCheck, Users } from 'lucide-react'
import { getClient, getPortalLink, useLabels, useQuery, type ChargeView, type ClientDetail, type RentalListItem, type ServiceReceipt } from '@/services'
import { Badge, Banner, Button, Card, EmptyState, Money, PhotoGrid, Segmented, Skeleton, StatusDot, Tooltip, cn, notify, useCountUp } from '@/ui'
import { PageHeader } from '@/app/PageHeader'
import { CHARGE_STATUS, RENTAL_STATUS, SERVICE_ICON, TONE_SOFT } from '@/app/status'
import { formatDate, formatDateTime, formatPhone } from '@/lib/format'
import { Avatar } from './components/Avatar'
import { ClientDrawer } from './components/ClientDrawer'
import { LinkButton } from './components/LinkButton'
import { telLink, waLink } from './lib'

type Aba = 'locacoes' | 'pagamentos' | 'comprovantes' | 'contatos'
const ABAS: Aba[] = ['locacoes', 'pagamentos', 'comprovantes', 'contatos']

/* ───────────────────────── números ───────────────────────── */

function Num({ label, formula, value, money, danger }: { label: string; formula: string; value: number; money?: boolean; danger?: boolean }) {
  const n = useCountUp(value)
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-h-6 items-center gap-1">
        <span className="truncate text-body font-semibold text-fg-2">{label}</span>
        <Tooltip content={formula}>
          <button
            type="button"
            aria-label={`Como é calculado: ${label}`}
            className="pointer-coarse:size-11 pointer-coarse:-m-2.5 grid size-6 shrink-0 place-items-center rounded-pill text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            <Info size={16} strokeWidth={2} aria-hidden />
          </button>
        </Tooltip>
      </div>
      <div className={cn('text-kpi', danger ? 'text-danger-ink' : 'text-fg')}>
        {money ? <Money value={Math.round(n * 100) / 100} variant="kpi" className={danger ? 'text-danger-ink' : undefined} /> : <span className="tnum">{Math.round(n)}</span>}
      </div>
    </div>
  )
}

function Numbers({ d }: { d: ClientDetail }) {
  const c = d.client
  return (
    <div className="grid grid-cols-2 rounded-card bg-raised lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none">
      <div className="min-w-0 px-4 py-4 lg:px-6 lg:py-5">
        <Num money label="Total faturado" value={Math.round((c.totalPaid + c.receivable) * 100) / 100} formula="Cobranças pagas mais as que ainda estão a receber." />
      </div>
      <div className="min-w-0 border-l border-hairline px-4 py-4 lg:px-6 lg:py-5">
        <Num money label="A receber" value={c.receivable} formula="Cobranças abertas e atrasadas." />
      </div>
      <div className="min-w-0 border-t border-hairline px-4 py-4 lg:border-t-0 lg:border-l lg:px-6 lg:py-5">
        <Num money danger={c.overdue > 0} label="Atrasado" value={c.overdue} formula="Cobranças vencidas e ainda não pagas." />
      </div>
      <div className="min-w-0 border-t border-l border-hairline px-4 py-4 lg:border-t-0 lg:px-6 lg:py-5">
        <Num label="Locações ativas" value={c.activeRentals} formula="Locações com equipamentos em campo agora." />
      </div>
    </div>
  )
}

/* ───────────────────────── portal ───────────────────────── */

function PortalCard({ link, loading }: { link?: string; loading: boolean }) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      /* sem permissão da área de transferência: o link continua visível para copiar à mão */
    }
    setCopied(true)
    notify.success('Link do portal copiado')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }
  const pill =
    'ds-touch inline-flex h-11 items-center justify-center gap-2 rounded-pill px-5 text-body font-semibold transition-[transform,background-color] duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent'
  return (
    <section aria-label="Portal do cliente" className="ds-hero ds-hero-card grid items-center gap-6 rounded-card p-5 sm:p-6 @min-[900px]/frame:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-title-sub">
          <ShieldCheck size={20} strokeWidth={2} aria-hidden />
          Portal do cliente
        </h2>
        <div className="mt-4 flex min-h-12 min-w-0 items-center gap-2.5 rounded-pill bg-on-accent/20 px-4">
          <Link2 size={18} strokeWidth={2} aria-hidden className="shrink-0" />
          {loading || !link ? <Skeleton className="h-4 w-64 bg-on-accent/20" /> : <span className="tnum truncate text-body-lg font-medium">{link}</span>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={copy} disabled={!link} className={cn(pill, 'bg-on-accent text-accent-active disabled:opacity-60')}>
            {copied ? <Check size={18} strokeWidth={2} aria-hidden /> : <Copy size={18} strokeWidth={2} aria-hidden />}
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
          <a href={link} target="_blank" rel="noopener noreferrer" aria-disabled={!link} className={cn(pill, 'bg-on-accent/20 text-on-accent hover:bg-on-accent/30', !link && 'pointer-events-none opacity-60')}>
            <ExternalLink size={18} strokeWidth={2} aria-hidden />
            Abrir portal
          </a>
        </div>
      </div>
      <div className="w-fit rounded-card bg-white p-3 text-black">
        {link ? <QRCodeSVG value={link} size={128} level="M" bgColor="transparent" fgColor="currentColor" role="img" aria-label="QR code do portal do cliente" className="block" /> : <Skeleton shape="block" className="size-[128px]" />}
      </div>
    </section>
  )
}

/* ───────────────────────── abas ───────────────────────── */

function Row({ to, icon: Icon, tone, title, sub, status, value, danger }: { to: string; icon: typeof ClipboardList; tone: keyof typeof TONE_SOFT; title: string; sub: string; status: React.ReactNode; value: number; danger?: boolean }) {
  return (
    <li>
      <Link
        to={to}
        className="ds-touch group -mx-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3.5 gap-y-1 rounded-control px-3 py-3 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring sm:grid-cols-[auto_1fr_auto_auto]"
      >
        <span aria-hidden className={cn('grid size-11 shrink-0 place-items-center rounded-pill', TONE_SOFT[tone])}>
          <Icon size={20} strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-body-lg font-medium text-fg">{title}</span>
          <span className="tnum block truncate text-caption text-fg-3">{sub}</span>
        </span>
        <span className="col-start-2 row-start-2 sm:col-start-3 sm:row-start-1">{status}</span>
        <span className={cn('tnum col-start-3 row-start-1 text-right text-body-lg font-semibold sm:col-start-4', danger ? 'text-danger-ink' : 'text-fg')}>
          <Money value={value} className={danger ? 'text-danger-ink' : undefined} />
        </span>
      </Link>
    </li>
  )
}

function Locacoes({ rentals, novaLocacao }: { rentals: RentalListItem[]; novaLocacao: () => void }) {
  if (!rentals.length)
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="As locações deste cliente aparecem aqui"
          action={
            <Button variant="primary" icon={Plus} onClick={novaLocacao}>
              Nova locação
            </Button>
          }
        />
      </Card>
    )
  const sorted = [...rentals].sort((a, b) => b.start.localeCompare(a.start))
  return (
    <Card as="section" className="sm:p-6">
      <ul className="m-0 flex list-none flex-col p-0">
        {sorted.map((r) => (
          <Row
            key={r.id}
            to={`/locacoes/${r.id}`}
            icon={ClipboardList}
            tone={RENTAL_STATUS[r.status].tone}
            title={r.title}
            sub={`${formatDate(r.start)} a ${formatDate(r.end)}`}
            status={<StatusDot tone={RENTAL_STATUS[r.status].tone}>{RENTAL_STATUS[r.status].label}</StatusDot>}
            value={r.total}
          />
        ))}
      </ul>
    </Card>
  )
}

function Pagamentos({ charges }: { charges: ChargeView[] }) {
  if (!charges.length)
    return (
      <Card>
        <EmptyState icon={ReceiptText} title="As cobranças deste cliente aparecem aqui" />
      </Card>
    )
  const sorted = [...charges].sort((a, b) => b.dueAt.localeCompare(a.dueAt))
  return (
    <Card as="section" className="sm:p-6">
      <ul className="m-0 flex list-none flex-col p-0">
        {sorted.map((c) => (
          <Row
            key={c.id}
            to={`/financeiro/cobranca/${c.id}`}
            icon={ReceiptText}
            tone={CHARGE_STATUS[c.status].tone}
            title={c.description}
            sub={c.status === 'paga' && c.paidAt ? `${c.code} · paga em ${formatDate(c.paidAt)}` : `${c.code} · vence em ${formatDate(c.dueAt)}`}
            status={<StatusDot tone={CHARGE_STATUS[c.status].tone}>{CHARGE_STATUS[c.status].label}</StatusDot>}
            value={c.value}
            danger={c.status === 'atrasada'}
          />
        ))}
      </ul>
    </Card>
  )
}

function ReceiptCard({ r }: { r: ServiceReceipt }) {
  const Icon = SERVICE_ICON[r.type]
  return (
    <li className="min-w-0 rounded-card bg-raised p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-ok-soft text-ok-ink">
          <Icon size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-lg font-semibold">{r.typeLabel}</p>
          <p className="tnum truncate text-caption text-fg-3">{formatDateTime(r.at)}</p>
        </div>
        <Link
          to={`/locacoes/${r.rentalId}`}
          className="tnum shrink-0 rounded-pill px-2 text-caption font-semibold text-accent-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {r.rentalCode}
        </Link>
      </div>
      {r.photos.length ? (
        <PhotoGrid
          className="mt-4"
          size={64}
          photos={r.photos.map((p) => ({ id: p.id, src: p.src, alt: `${p.label}, ${r.typeLabel} de ${formatDate(r.at)}` }))}
        />
      ) : (
        <p className="mt-4 text-body text-fg-3">Sem fotos neste serviço</p>
      )}
      <p className="mt-4 flex items-center gap-2 text-body">
        {r.signature ? (
          <>
            <Check size={16} strokeWidth={2} aria-hidden className="shrink-0 text-ok-ink" />
            <span className="min-w-0 truncate">
              <span className="font-semibold">{r.signature.name}</span>
              <span className="text-fg-3">, {r.signature.role}</span>
            </span>
          </>
        ) : (
          <span className="text-fg-3">Sem assinatura</span>
        )}
      </p>
    </li>
  )
}

function Comprovantes({ receipts }: { receipts: ServiceReceipt[] }) {
  const [shown, setShown] = React.useState(8)
  if (!receipts.length)
    return (
      <Card>
        <EmptyState icon={PenLine} title="Os comprovantes dos serviços concluídos aparecem aqui" />
      </Card>
    )
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 @min-[900px]/frame:grid-cols-2">
        {receipts.slice(0, shown).map((r) => (
          <ReceiptCard key={r.serviceId} r={r} />
        ))}
      </ul>
      {shown < receipts.length ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => setShown((n) => n + 8)}>
            Ver mais comprovantes
          </Button>
        </div>
      ) : null}
    </>
  )
}

function Contatos({ d, editar }: { d: ClientDetail; editar: () => void }) {
  if (!d.contacts.length)
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="Os contatos deste cliente aparecem aqui"
          action={
            <Button variant="primary" icon={Plus} onClick={editar}>
              Adicionar contato
            </Button>
          }
        />
      </Card>
    )
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 @min-[700px]/frame:grid-cols-2 @min-[1100px]/frame:grid-cols-3">
      {d.contacts.map((c, i) => (
        <li key={`${c.name}-${i}`} className="flex min-w-0 flex-col gap-4 rounded-card bg-raised p-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar name={c.name} size={56} />
            <div className="min-w-0">
              <p className="truncate text-title-card">{c.name}</p>
              {c.role ? <p className="truncate text-body text-fg-2">{c.role}</p> : null}
            </div>
          </div>
          <p className="tnum text-body-lg font-semibold">{formatPhone(c.phone)}</p>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" icon={MessageCircle} aria-label={`WhatsApp para ${c.name}`}>
              WhatsApp
            </LinkButton>
            <LinkButton href={telLink(c.phone)} icon={Phone} aria-label={`Ligar para ${c.name}`}>
              Ligar
            </LinkButton>
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ───────────────────────── tela ───────────────────────── */

export default function Ficha() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  useLabels()
  const q = useQuery(() => getClient(id), [id])
  const portal = useQuery(() => getPortalLink(id), [id])
  const [editando, setEditando] = React.useState(false)
  const aba: Aba = ABAS.includes(sp.get('aba') as Aba) ? (sp.get('aba') as Aba) : 'locacoes'
  const d = q.data
  const novaLocacao = () => navigate(`/locacoes/nova?cliente=${id}`)

  if (q.error && !d)
    return (
      <>
        <PageHeader title="Cliente" back="/clientes" />
        <Banner
          tone="danger"
          title="Não foi possível abrir este cliente."
          action={
            <Button variant="secondary" size="sm" onClick={() => void q.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      </>
    )

  if (!d)
    return (
      <div aria-busy="true">
        <PageHeader title={<Skeleton className="h-8 w-64" />} back="/clientes" />
        <Skeleton shape="block" className="h-[104px] rounded-card" />
        <Skeleton shape="block" className="mt-4 h-[200px] rounded-card" />
        <Skeleton shape="block" className="mt-4 h-11 w-96 rounded-pill" />
        <Skeleton shape="block" className="mt-4 h-[300px] rounded-card" />
      </div>
    )

  return (
    <>
      <PageHeader
        title={d.client.name}
        back="/clientes"
        meta={<Badge tone="neutral">{d.client.kind}</Badge>}
        actions={
          <>
            <Button variant="primary" size="lg" icon={Plus} onClick={novaLocacao}>
              Nova locação
            </Button>
            <Button variant="secondary" size="lg" icon={PenLine} onClick={() => setEditando(true)}>
              Editar
            </Button>
          </>
        }
      />

      <Numbers d={d} />
      <div className="mt-4">
        <PortalCard link={portal.data} loading={portal.initialLoading} />
      </div>

      <div className="mt-6 overflow-x-auto pb-1">
        <Segmented<Aba>
          label="Seções do cliente"
          value={aba}
          onChange={(v) => setSp({ aba: v }, { replace: true })}
          options={[
            { value: 'locacoes', label: 'Locações' },
            { value: 'pagamentos', label: 'Pagamentos' },
            { value: 'comprovantes', label: 'Comprovantes' },
            { value: 'contatos', label: 'Contatos' },
          ]}
        />
      </div>

      <div className="mt-4">
        {aba === 'locacoes' ? <Locacoes rentals={d.rentals} novaLocacao={novaLocacao} /> : null}
        {aba === 'pagamentos' ? <Pagamentos charges={d.charges} /> : null}
        {aba === 'comprovantes' ? <Comprovantes receipts={d.receipts} /> : null}
        {aba === 'contatos' ? <Contatos d={d} editar={() => setEditando(true)} /> : null}
      </div>

      <ClientDrawer open={editando} onOpenChange={setEditando} client={d.client} />
    </>
  )
}
