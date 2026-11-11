import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/app/PageHeader'
import { BAIRROS } from '@/data/geo'
import { addDays, daysInclusive, today } from '@/domain/dates'
import { defaultBilling } from '@/domain/planning'
import { Banner, Button, Field, Input, Money, Segmented, Select, Skeleton, Stepper, StepperFooter, notify } from '@/ui'
import { checkAvailability, createRental, listClients, listTypes, quoteRental, useLabels, useMutation, useQuery, type AvailabilityResult, type RentalKind } from '@/services'
import { formatDate, formatPhone } from '@/lib/format'
import { ClientePicker } from './components/ClientePicker'
import { CartaoTipo } from './components/CartaoTipo'
import { capital, cleanTitle, periodTag } from './util'

interface Form {
  clientId: string
  kind: RentalKind
  title: string
  address: string
  bairroId: string
  start: string
  end: string
  contactName: string
  contactRole: string
  contactPhone: string
}

const STEPS = [
  { id: 'cliente', label: 'Cliente e período' },
  { id: 'itens', label: 'Itens' },
  { id: 'resumo', label: 'Resumo' },
]

const BAIRROS_ORD = [...BAIRROS].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

export default function Nova() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const labels = useLabels()
  const t0 = today()
  const [step, setStep] = React.useState(0)
  const [form, setForm] = React.useState<Form>({ clientId: params.get('cliente') ?? '', kind: 'obra', title: '', address: '', bairroId: '', start: t0, end: addDays(t0, 6), contactName: '', contactRole: '', contactPhone: '' })
  const [qtys, setQtys] = React.useState<Record<string, number>>({})
  const [cleanings, setCleanings] = React.useState<string>('1')
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => (e[k] ? { ...e, [k]: '' } : e))
  }

  const clients = useQuery(() => listClients(), [])
  const types = useQuery(() => listTypes(), [])
  const client = clients.data?.find((c) => c.id === form.clientId)

  // cliente escolhido preenche o contato, se ainda estiver vazio
  const prefilled = React.useRef('')
  React.useEffect(() => {
    if (!client || prefilled.current === client.id) return
    prefilled.current = client.id
    setErrors((e) => ({ ...e, clientId: '', address: '', bairroId: '', contactName: '', contactPhone: '' }))
    const c = client.contacts[0]
    setForm((f) => ({
      ...f,
      contactName: f.contactName || c?.name || '',
      contactRole: f.contactRole || c?.role || '',
      contactPhone: f.contactPhone || c?.phone || '',
      address: f.address || client.address || '',
      bairroId: f.bairroId || client.bairroId || '',
    }))
  }, [client])

  const selected = Object.entries(qtys).filter(([, n]) => n > 0)
  const itemsKey = selected.map(([id, n]) => `${id}:${n}`).join(',')
  const periodOk = !!form.start && !!form.end && form.end >= form.start

  // disponibilidade de cada tipo no período (qty mínima 1 para mostrar quantos estão livres)
  const availKey = `${step}|${form.start}|${form.end}|${itemsKey}|${(types.data ?? []).length}`
  const avail = useQuery(async () => {
    if (step !== 1 || !periodOk || !types.data) return {} as Record<string, AvailabilityResult>
    const res = await Promise.all(types.data.map((t) => checkAvailability({ typeId: t.id, qty: Math.max(1, qtys[t.id] ?? 0), start: form.start, end: form.end })))
    return Object.fromEntries(types.data.map((t, i) => [t.id, res[i]])) as Record<string, AvailabilityResult>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availKey])

  const quote = useQuery(async () => {
    if (step < 1 || !periodOk || selected.length === 0) return null
    return quoteRental({ kind: form.kind, start: form.start, end: form.end, items: selected.map(([typeId, qty]) => ({ typeId, qty })) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.kind, form.start, form.end, itemsKey])

  const create = useMutation(createRental)

  const days = periodOk ? daysInclusive(form.start, form.end) : 0
  const billing = defaultBilling(form.kind, form.start, form.end)
  const per = billing === 'mensal' ? 'mês' : 'dia'

  const validate1 = () => {
    const e: Record<string, string> = {}
    if (!form.clientId) e.clientId = 'Escolha o cliente.'
    if (form.title.trim().length < 3) e.title = 'Dê um título à locação.'
    if (form.address.trim().length < 5) e.address = 'Informe o endereço de entrega.'
    if (!form.bairroId) e.bairroId = 'Escolha o bairro.'
    if (!form.start) e.start = 'Informe o início.'
    else if (form.start < t0) e.start = 'O início não pode ser antes de hoje.'
    if (!form.end) e.end = 'Informe o fim.'
    else if (form.start && form.end < form.start) e.end = 'O fim não pode ser antes do início.'
    if (form.contactName.trim().length < 2) e.contactName = 'Informe quem recebe no local.'
    if (form.contactPhone.replace(/\D/g, '').length < 10) e.contactPhone = 'Telefone incompleto. Confira o DDD e o número.'
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const shortages = selected.filter(([id, n]) => (avail.data?.[id]?.free ?? Infinity) < n)
  const validate2 = () => {
    const e: Record<string, string> = {}
    if (selected.length === 0) e.items = `Escolha ao menos um ${labels.equipment}.`
    else if (shortages.length) e.items = 'Tem item acima do que está livre. Use a quantidade sugerida.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step === 0 && validate1()) setStep(1)
    else if (step === 1 && validate2()) setStep(2)
  }
  const back = () => {
    setErrors({})
    if (step === 0) navigate('/locacoes')
    else setStep(step - 1)
  }

  const submit = async () => {
    try {
      const r = await create.run({
        clientId: form.clientId,
        title: form.title.trim(),
        kind: form.kind,
        address: form.address.trim(),
        bairroId: form.bairroId,
        start: form.start,
        end: form.end,
        items: selected.map(([typeId, qty]) => ({ typeId, qty })),
        cleaningsPerWeek: Number(cleanings),
        contact: { name: form.contactName.trim(), role: form.contactRole.trim() || 'Responsável', phone: form.contactPhone.trim() },
      })
      notify.success('Orçamento criado')
      navigate(`/locacoes/${r.id}`)
    } catch {
      notify.error('Não foi possível criar o orçamento. Tente de novo.')
    }
  }

  const cleanable = selected.some(([id]) => types.data?.find((t) => t.id === id)?.cleanable)
  const typeMap = new Map((types.data ?? []).map((t) => [t.id, t]))

  return (
    <>
      <PageHeader title="Nova locação" back="/locacoes" />
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
        <div className="rounded-card bg-raised p-4 sm:px-6 sm:py-5">
          <Stepper steps={STEPS} current={step} onStepClick={(i) => (setErrors({}), setStep(i))} />
        </div>

        {clients.error ? <Banner tone="danger" title="Não foi possível carregar os clientes." action={<Button size="sm" onClick={() => void clients.refetch()}>Tentar de novo</Button>} /> : null}

        {step === 0 ? (
          <section aria-label="Cliente e período" className="rounded-card bg-raised p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Cliente" error={errors.clientId} className="sm:col-span-2" id="loc-cliente">
                {clients.initialLoading ? <Skeleton className="h-11 rounded-control" /> : <ClientePicker inputId="loc-cliente" clients={clients.data ?? []} value={form.clientId} onChange={(id) => set('clientId', id)} invalid={!!errors.clientId} />}
              </Field>
              <div className="flex flex-col gap-1.5">
                <span id="kind-l" className="text-body font-semibold">Tipo</span>
                <Segmented<RentalKind> label="Tipo de locação" value={form.kind} onChange={(v) => set('kind', v)} block options={[{ value: 'obra', label: 'Obra' }, { value: 'evento', label: 'Evento' }]} />
              </div>
              <Field label="Título" error={errors.title}>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={form.kind === 'obra' ? 'Residencial Aurora, etapa 2' : 'Feira de Negócios do DF'} maxLength={80} />
              </Field>
              <Field label="Endereço" error={errors.address}>
                <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Rua, quadra ou setor, número" />
              </Field>
              <Field label="Bairro" error={errors.bairroId}>
                <Select value={form.bairroId} onChange={(e) => set('bairroId', e.target.value)} placeholder="Escolha o bairro">
                  {BAIRROS_ORD.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Início" error={errors.start}>
                <Input type="date" value={form.start} min={t0} onChange={(e) => set('start', e.target.value)} />
              </Field>
              <Field label="Fim" error={errors.end}>
                <Input type="date" value={form.end} min={form.start || t0} onChange={(e) => set('end', e.target.value)} />
              </Field>
              <Field label="Contato no local" error={errors.contactName}>
                <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Nome de quem recebe" />
              </Field>
              <Field label="Telefone" error={errors.contactPhone}>
                <Input inputMode="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} onBlur={() => set('contactPhone', formatPhone(form.contactPhone))} placeholder="(61) 99999-0000" />
              </Field>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section aria-label="Itens" className="rounded-card bg-raised p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-title-sub">{capital(labels.equipmentPlural)}</h2>
              <span className="tnum text-body font-semibold text-fg-2">{periodTag(form.start, form.end)}</span>
            </div>
            {types.initialLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[148px] rounded-card" />
                ))}
              </div>
            ) : types.error ? (
              <Banner tone="danger" title="Não foi possível carregar o catálogo." action={<Button size="sm" onClick={() => void types.refetch()}>Tentar de novo</Button>} />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {(types.data ?? []).map((t) => (
                  <CartaoTipo key={t.id} type={t} per={per} rate={billing === 'mensal' ? t.monthlyRate : t.dailyRate} qty={qtys[t.id] ?? 0} avail={avail.data?.[t.id]} checking={avail.loading} onQty={(n) => (setQtys((q) => ({ ...q, [t.id]: n })), setErrors({}))} />
                ))}
              </ul>
            )}
            {errors.items ? (
              <p role="alert" className="mt-3 text-caption font-semibold text-danger-ink">
                {errors.items}
              </p>
            ) : null}
            {cleanable ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
                <span className="text-body font-semibold">{capital(labels.cleaningPlural)} por semana</span>
                <Segmented<string> label={`${capital(labels.cleaningPlural)} por semana`} value={cleanings} onChange={setCleanings} options={['0', '1', '2', '3'].map((v) => ({ value: v, label: v }))} />
              </div>
            ) : null}
            {quote.data ? (
              <div className="mt-5 flex items-center justify-between rounded-control bg-sunken px-4 py-3">
                <span className="text-body font-semibold text-fg-2">Total estimado</span>
                <Money value={quote.data.total} className="text-title-sub" />
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 2 ? (
          <>
            <section aria-label="Total do orçamento" className="ds-hero ds-hero-card group/card rounded-card p-6 sm:p-8" data-variant="highlight">
              <p className="text-body-lg font-medium">Total do orçamento</p>
              <p className="mt-2 text-kpi-lg text-[clamp(36px,9vw,56px)]">{quote.data ? <Money value={quote.data.total} variant="kpi" /> : <Skeleton className="h-12 w-64 bg-on-accent/20" />}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-7 items-center rounded-pill bg-accent-active px-3 text-caption font-semibold tnum">{periodTag(form.start, form.end)}</span>
                <span className="inline-flex h-7 items-center rounded-pill bg-accent-active px-3 text-caption font-semibold tnum">{days} {days === 1 ? 'dia' : 'dias'}</span>
              </div>
            </section>
            <section aria-label="Resumo" className="rounded-card bg-raised p-5 sm:p-6">
              <h2 className="text-title-sub">{cleanTitle(form.title)}</h2>
              <p className="mt-1 text-body text-fg-2">
                {client?.name} · {form.address}, {BAIRROS.find((b) => b.id === form.bairroId)?.name}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {selected.map(([id, n]) => {
                  const t = typeMap.get(id)
                  const rate = quote.data?.items.find((i) => i.typeId === id)?.rate
                  return (
                    <li key={id} className="flex items-center gap-3 rounded-control bg-sunken p-2 pr-4">
                      <span className="size-12 shrink-0 overflow-hidden rounded-control bg-raised">{t ? <img src={t.photo} alt="" className="size-full object-cover" /> : null}</span>
                      <span className="min-w-0 flex-1 truncate text-body font-semibold">
                        <span className="tnum">{n}</span> × {t?.name}
                      </span>
                      {rate != null ? (
                        <span className="shrink-0 text-body text-fg-2">
                          <Money value={rate} /> /{per}
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-body">
                <div className="flex gap-2">
                  <dt className="text-fg-3">Período</dt>
                  <dd className="tnum font-semibold">
                    {formatDate(form.start)} a {formatDate(form.end)}
                  </dd>
                </div>
                {cleanable ? (
                  <div className="flex gap-2">
                    <dt className="text-fg-3">{capital(labels.cleaningPlural)}</dt>
                    <dd className="font-semibold">{cleanings} por semana</dd>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <dt className="text-fg-3">Contato</dt>
                  <dd className="font-semibold">{form.contactName}</dd>
                </div>
              </dl>
            </section>
          </>
        ) : null}

        <StepperFooter
          onBack={back}
          onNext={step === 2 ? () => void submit() : next}
          nextLabel={step === 2 ? 'Criar orçamento' : 'Continuar'}
          nextLoading={create.loading}
          nextDisabled={step === 1 && avail.loading && selected.length > 0}
        />
      </div>
    </>
  )
}
