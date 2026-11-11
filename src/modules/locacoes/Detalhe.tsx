import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Ban, Check, ChevronRight, FastForward, FileSignature, FileText, MoreHorizontal, ReceiptText, Truck, UserRound } from 'lucide-react'
import { PageHeader } from '@/app/PageHeader'
import { RENTAL_STATUS, SERVICE_ICON } from '@/app/status'
import { Badge, Banner, Button, Dialog, EmptyState, Field, Input, Menu, MoneyCard, ServiceRow, SignaturePad, Skeleton, notify, type MenuEntry } from '@/ui'
import { advanceRental, cancelRental, confirmRental, generateContract, generateContractText, getRental, getSettings, signContract, useLabels, useMutation, useQuery, type RentalDetail, type Service } from '@/services'
import { formatDate, formatTime } from '@/lib/format'
import { TrilhaEtapas } from './components/TrilhaEtapas'
import { Dossie } from './components/Dossie'
import { ContratoPapel } from './components/ContratoPapel'
import { printContract, printDossier } from './documentos'
import { NEXT_STAGE, cleanTitle, durationLabel } from './util'

const SVC_STATUS = { agendado: 'agendado', a_caminho: 'a-caminho', em_andamento: 'em-andamento', concluido: 'concluido', atrasado: 'atrasado' } as const

export default function Detalhe() {
  const { id = '' } = useParams()
  const q = useQuery(() => getRental(id), [id])

  if (q.error && !q.data) {
    return (
      <>
        <PageHeader title="Locação" back="/locacoes" />
        <Banner tone="danger" title="Não foi possível abrir esta locação." action={<Button size="sm" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      </>
    )
  }
  if (!q.data) {
    return (
      <div aria-busy="true">
        <PageHeader title="Locação" back="/locacoes" />
        <Skeleton className="h-[76px] rounded-card" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[148px] rounded-card" />
          ))}
        </div>
        <Skeleton className="mt-4 h-72 rounded-card" />
      </div>
    )
  }
  return <Conteudo detail={q.data} />
}

function Conteudo({ detail }: { detail: RentalDetail }) {
  const navigate = useNavigate()
  const labels = useLabels()
  const { rental, client, financial } = detail
  const id = rental.id
  const status = rental.status
  const signed = !!rental.contract?.signedAt
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [signOpen, setSignOpen] = React.useState(false)
  const [printing, setPrinting] = React.useState<'dossie' | 'contrato' | null>(null)

  const confirm = useMutation(confirmRental)
  const advance = useMutation(advanceRental)
  const gen = useMutation(generateContract)
  const cancel = useMutation(cancelRental)
  const busy = confirm.loading || advance.loading || gen.loading

  const text = useQuery(() => (rental.contract ? generateContractText(id) : Promise.resolve('')), [id, rental.contract?.generatedAt, rental.contract?.signedAt])

  const run = async <A extends unknown[]>(m: { run: (...a: A) => Promise<unknown> }, ok: string, fail: string, ...a: A) => {
    try {
      await m.run(...a)
      notify.success(ok)
    } catch (e) {
      notify.error(e instanceof Error && e.message ? e.message : fail)
    }
  }

  const advanceLabel = { confirmada: 'Colocar em campo', em_campo: 'Registrar retirada', retirada: 'Faturar locação' } as const
  const advanceDone = { confirmada: 'Locação em campo', em_campo: 'Retirada registrada', retirada: 'Locação faturada' } as const

  let primary: { label: string; icon: typeof Check; onClick: () => void } | null = null
  let advanceIsPrimary = false
  if (status === 'orcamento') primary = { label: 'Confirmar locação', icon: Check, onClick: () => void run(confirm, 'Locação confirmada', 'Não foi possível confirmar. Tente de novo.', id) }
  else if (status === 'confirmada' && !rental.contract) primary = { label: 'Gerar contrato', icon: FileText, onClick: () => void run(gen, 'Contrato gerado', 'Não foi possível gerar o contrato.', id) }
  else if (status === 'confirmada' && !signed) primary = { label: 'Assinar contrato', icon: FileSignature, onClick: () => setSignOpen(true) }
  else if (status === 'confirmada' || status === 'em_campo' || status === 'retirada') {
    advanceIsPrimary = true
    primary = { label: advanceLabel[status], icon: status === 'confirmada' ? Truck : FastForward, onClick: () => void run(advance, advanceDone[status], 'Não foi possível avançar a etapa.', id) }
  }

  const menu: MenuEntry[] = []
  if (!advanceIsPrimary && NEXT_STAGE[status] && status !== 'orcamento') menu.push({ label: 'Avançar etapa', icon: FastForward, onSelect: () => void run(advance, 'Etapa avançada', 'Não foi possível avançar a etapa.', id) })
  if (status === 'orcamento' || status === 'confirmada') {
    if (menu.length) menu.push({ type: 'separator' })
    menu.push({ label: 'Cancelar locação', icon: Ban, danger: true, onSelect: () => setCancelOpen(true) })
  }

  const doCancel = async () => {
    try {
      await cancel.run(id)
      setCancelOpen(false)
      notify.success('Locação cancelada')
    } catch (e) {
      notify.error(e instanceof Error && e.message ? e.message : 'Não foi possível cancelar. Tente de novo.')
    }
  }

  const download = async (kind: 'dossie' | 'contrato') => {
    setPrinting(kind)
    try {
      const settings = await getSettings()
      if (kind === 'dossie') await printDossier(detail, settings.company)
      else await printContract(text.data ?? '', detail, settings.company)
    } catch {
      notify.error('Não foi possível gerar o documento. Tente de novo.')
    } finally {
      setPrinting(null)
    }
  }

  const damagesTotal = detail.damages.reduce((a, d) => a + d.value, 0)
  const st = RENTAL_STATUS[status]

  return (
    <>
      <PageHeader
        back="/locacoes"
        title={cleanTitle(rental.title)}
        meta={<Badge tone={st.tone}>{st.label}</Badge>}
        actions={
          <>
            <Button variant="secondary" icon={UserRound} onClick={() => navigate(`/clientes/${client.id}`)}>
              Cliente
            </Button>
            <Button variant="secondary" icon={ReceiptText} onClick={() => navigate(`/financeiro?q=${encodeURIComponent(rental.code)}`)}>
              Cobranças
            </Button>
            {menu.length ? <Menu align="end" items={menu} trigger={<Button variant="secondary" iconOnly icon={MoreHorizontal} aria-label="Mais ações" />} /> : null}
          </>
        }
      />

      {status === 'cancelada' ? <Banner className="mb-4" tone="warn" title="Locação cancelada." /> : null}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-raised p-4 sm:p-5">
        <TrilhaEtapas status={status} />
        {primary ? (
          <Button variant="primary" size="lg" icon={primary.icon} loading={busy} onClick={primary.onClick} className="max-sm:w-full">
            {primary.label}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
        <MoneyCard hero title="Valor total" value={financial.total} />
        <MoneyCard title="A receber" value={financial.open} onOpen={() => navigate(`/financeiro?q=${encodeURIComponent(rental.code)}`)} formula="Cobranças abertas e atrasadas desta locação." />
        <MoneyCard title="Pago" value={financial.paid} formula="Cobranças desta locação já pagas." />
        <MoneyCard title={`${labels.damagePlural.charAt(0).toUpperCase()}${labels.damagePlural.slice(1)}`} value={damagesTotal} onOpen={detail.damages.length ? () => navigate('/avarias') : undefined} formula={`Soma das ${labels.damagePlural} registradas nesta locação.`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <ItensUnidades detail={detail} className="@min-[1180px]/frame:col-span-7" />
        <Servicos detail={detail} className="@min-[1180px]/frame:col-span-5" />
      </div>

      <div className="mt-4">
        <Dossie detail={detail} downloading={printing === 'dossie'} onDownload={() => void download('dossie')} />
      </div>

      <div className="mt-6">
        <ContratoPapel
          contract={rental.contract}
          text={text.data}
          loading={text.initialLoading}
          canSign={status !== 'cancelada'}
          onSign={() => setSignOpen(true)}
          downloading={printing === 'contrato'}
          onDownload={() => void download('contrato')}
          onAction={status === 'orcamento' ? () => void run(confirm, 'Locação confirmada', 'Não foi possível confirmar. Tente de novo.', id) : status === 'confirmada' ? () => void run(gen, 'Contrato gerado', 'Não foi possível gerar o contrato.', id) : undefined}
          actionLabel={status === 'orcamento' ? 'Confirmar locação' : 'Gerar contrato'}
        />
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen} destructive title="Cancelar esta locação?" description={`${rental.code} · ${cleanTitle(rental.title)}`} confirmLabel="Cancelar locação" cancelLabel="Manter locação" onConfirm={() => void doCancel()} confirmLoading={cancel.loading} />
      {signOpen ? <AssinarDialog detail={detail} onClose={() => setSignOpen(false)} /> : null}
    </>
  )
}

function AssinarDialog({ detail, onClose }: { detail: RentalDetail; onClose: () => void }) {
  const [name, setName] = React.useState(detail.rental.contact.name)
  const [sig, setSig] = React.useState<string | null>(null)
  const [err, setErr] = React.useState<{ name?: string; sig?: string }>({})
  const m = useMutation(signContract)
  const submit = async () => {
    const e: typeof err = {}
    if (name.trim().length < 3) e.name = 'Informe o nome completo de quem assina.'
    if (!sig) e.sig = 'Desenhe a assinatura no quadro.'
    setErr(e)
    if (e.name || e.sig) return
    try {
      await m.run(detail.rental.id, { name: name.trim(), signatureDataUrl: sig ?? undefined })
      notify.success('Contrato assinado')
      onClose()
    } catch (x) {
      notify.error(x instanceof Error && x.message ? x.message : 'Não foi possível assinar. Tente de novo.')
    }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="Assinar contrato" confirmLabel="Assinar contrato" onConfirm={() => void submit()} confirmLoading={m.loading}>
      <div className="flex flex-col gap-4">
        <Field label="Nome de quem assina" error={err.name}>
          <Input value={name} onChange={(e) => (setName(e.target.value), setErr((x) => ({ ...x, name: undefined })))} autoComplete="off" />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-body font-semibold">Assinatura</span>
          <SignaturePad onChange={(d) => (setSig(d), setErr((x) => ({ ...x, sig: undefined })))} height={180} />
          {err.sig ? (
            <p role="alert" className="text-caption font-semibold text-danger-ink">
              {err.sig}
            </p>
          ) : null}
        </div>
      </div>
    </Dialog>
  )
}

function ItensUnidades({ detail, className }: { detail: RentalDetail; className?: string }) {
  const labels = useLabels()
  const [open, setOpen] = React.useState<Set<string>>(new Set())
  return (
    <section aria-label="Itens e unidades" className={`min-w-0 rounded-card bg-raised p-5 sm:p-6 ${className ?? ''}`}>
      <h2 className="text-title-sub">Itens e unidades</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {detail.items.map((it) => {
          const expanded = open.has(it.typeId)
          const units = expanded ? it.units : it.units.slice(0, 10)
          return (
            <li key={it.typeId} className="rounded-control bg-sunken p-3">
              <div className="flex items-center gap-3">
                <span className="size-14 shrink-0 overflow-hidden rounded-control bg-raised">
                  <img src={it.type.photo} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
                </span>
                <p className="min-w-0 flex-1 truncate text-body font-semibold">{it.type.name}</p>
                <span className="tnum text-kpi leading-none">{it.qty}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {it.units.length === 0 ? <Badge tone="idle">Sem {labels.unitPlural} alocadas</Badge> : null}
                {units.map((u) => (
                  <Link key={u.id} to={`/equipamentos/${u.code}`} className="inline-flex h-7 items-center gap-0.5 rounded-pill bg-raised px-3 text-caption font-semibold text-fg tnum ring-1 ring-edge ring-inset transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    {u.code}
                  </Link>
                ))}
                {it.units.length > 10 ? (
                  <button type="button" onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(it.typeId)) n.delete(it.typeId); else n.add(it.typeId); return n })} className="inline-flex h-7 items-center gap-0.5 rounded-pill px-3 text-caption font-semibold text-accent-ink hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    {expanded ? 'Mostrar menos' : `Ver mais ${it.units.length - 10}`}
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Servicos({ detail, className }: { detail: RentalDetail; className?: string }) {
  const navigate = useNavigate()
  const labels = useLabels()
  const [more, setMore] = React.useState<{ next: boolean; done: boolean }>({ next: false, done: false })
  const live = detail.services.filter((s) => s.status !== 'cancelado')
  const next = live.filter((s) => s.status !== 'concluido')
  const done = live.filter((s) => s.status === 'concluido').reverse()
  const bairro = detail.rental.address

  const rows = (list: Service[], key: 'next' | 'done') => {
    const shown = more[key] ? list : list.slice(0, 4)
    return (
      <>
        <ul className="overflow-hidden rounded-control bg-sunken">
          {shown.map((s) => {
            const n = s.unitIds.length
            const title = `${labels.serviceTypes[s.type]}${s.extra ? ' extra' : ''}${n ? `, ${n} ${n === 1 ? labels.unit : labels.unitPlural}` : ''}`
            return (
              <ServiceRow
                key={s.id}
                time={formatTime(s.start)}
                duration={durationLabel(s.durationMin)}
                type={s.type}
                title={title}
                client={formatDate(s.start)}
                address={bairro}
                status={SVC_STATUS[s.status as keyof typeof SVC_STATUS] ?? 'agendado'}
                badges={s.extra ? [{ label: 'Extra', tone: 'warn' }] : undefined}
                onOpen={() => navigate(`/operacao?data=${s.start.slice(0, 10)}&equipe=${s.teamId}`)}
              />
            )
          })}
        </ul>
        {list.length > 4 ? (
          <Button variant="ghost" size="sm" iconRight={ChevronRight} className="mt-2" onClick={() => setMore((m) => ({ ...m, [key]: !m[key] }))}>
            {more[key] ? 'Mostrar menos' : `Ver todos (${list.length})`}
          </Button>
        ) : null}
      </>
    )
  }

  return (
    <section aria-label="Serviços" className={`min-w-0 rounded-card bg-raised p-5 sm:p-6 ${className ?? ''}`}>
      <h2 className="text-title-sub">Serviços</h2>
      {live.length === 0 ? (
        <EmptyState icon={SERVICE_ICON.entrega} title="Os serviços desta locação aparecem aqui" className="py-8" />
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {next.length ? (
            <div>
              <h3 className="mb-2 text-caption font-semibold text-fg-3">Próximos</h3>
              {rows(next, 'next')}
            </div>
          ) : null}
          {done.length ? (
            <div>
              <h3 className="mb-2 text-caption font-semibold text-fg-3">Feitos</h3>
              {rows(done, 'done')}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
