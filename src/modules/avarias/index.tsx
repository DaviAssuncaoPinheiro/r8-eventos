/* Módulo "Avarias e cobranças": cartões de avaria com foto, cobrança em um clique e extras por faturar. */
import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Info, Plus, ReceiptText, TriangleAlert } from 'lucide-react'
import { Banner, Button, Dialog, EmptyState, Money, MoneyCard, PhotoViewer, Segmented, Skeleton, Tooltip, cn, notify, useCountUp } from '@/ui'
import { PageHeader } from '@/app/PageHeader'
import { DAMAGE_STATUS, SERVICE_ICON } from '@/app/status'
import { today, monthKey } from '@/domain/dates'
import { formatMoney } from '@/lib/format'
import { billExtras, chargeDamage, dismissDamage, listCharges, listDamages, listServices, useMutation, useQuery } from '@/services'
import type { DamageStatus, DamageView, ServiceView } from '@/services'
import { ChargeDrawer } from '@/modules/financeiro/components/ChargeDrawer'
import { FilterPills } from '@/modules/financeiro/components/FilterPills'
import { errMessage } from '@/modules/financeiro/lib'
import { DamageCard } from './components/DamageCard'
import { RegisterDamageDrawer } from './components/RegisterDamageDrawer'

type Tab = 'avarias' | 'extras'
type StatusParam = DamageStatus | 'todas'
const STATUSES: DamageStatus[] = ['registrada', 'cobrada', 'paga', 'dispensada']
const STATUS_LABEL: Record<DamageStatus, string> = { registrada: DAMAGE_STATUS.registrada.label, cobrada: 'Cobradas', paga: 'Pagas', dispensada: 'Dispensadas' }

const r2 = (n: number) => Math.round(n * 100) / 100

interface ExtraGroup {
  rentalId: string
  rentalCode: string
  clientName: string
  services: ServiceView[]
  total: number
}

function ExtraCard({ g, busy, onBill }: { g: ExtraGroup; busy: boolean; onBill: () => void }) {
  const types = [...new Set(g.services.map((s) => s.type))]
  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-card bg-raised p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-title-card" title={g.clientName}>
            {g.clientName}
          </p>
          <p className="tnum text-caption text-fg-3">{g.rentalCode}</p>
        </div>
        <ul className="flex shrink-0 -space-x-2" aria-label="Tipos de serviço">
          {types.slice(0, 4).map((t) => {
            const Icon = SERVICE_ICON[t]
            const label = g.services.find((s) => s.type === t)?.typeLabel ?? t
            return (
              <li key={t}>
                <Tooltip content={label}>
                  <span tabIndex={0} role="img" aria-label={label} className="grid size-10 place-items-center rounded-pill bg-warn-soft text-warn-ink ring-2 ring-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    <Icon size={18} strokeWidth={2} aria-hidden />
                  </span>
                </Tooltip>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="text-kpi">{formatMoney(g.total)}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-body font-semibold text-fg-2">{g.services.length === 1 ? '1 serviço' : `${g.services.length} serviços`}</span>
        <Button variant="primary" size="md" icon={ReceiptText} loading={busy} onClick={onBill}>
          Faturar
        </Button>
      </div>
    </li>
  )
}

function SideNumber({ title, value, formula, tone }: { title: string; value: number; formula: string; tone?: 'ok' }) {
  const shown = useCountUp(value)
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <h3 className="text-body-lg font-medium">{title}</h3>
        <Tooltip content={formula}>
          <button type="button" aria-label={`Como é calculado: ${title}`} className="ds-hit inline-flex size-6 items-center justify-center rounded-pill text-fg-3 transition-colors duration-150 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Info size={16} strokeWidth={2} aria-hidden />
          </button>
        </Tooltip>
      </div>
      <div className={cn('text-kpi', tone === 'ok' && value > 0 && 'text-ok-ink')}>
        <Money value={shown} variant="kpi" toneNegative={false} />
      </div>
    </div>
  )
}

/** Os dois números secundários num cartão só. */
function SideNumbers({ awaiting, paid, className }: { awaiting: number; paid: number; className?: string }) {
  return (
    <section aria-label="Cobranças de avarias" className={cn('flex min-w-0 flex-col justify-center gap-6 rounded-card bg-raised p-5 sm:p-6', className)}>
      <SideNumber title="Aguardando pagamento" value={awaiting} formula="Avarias cobradas, com a cobrança ainda sem pagamento." />
      <div className="h-px bg-hairline" aria-hidden />
      <SideNumber title="Pagas no mês" value={paid} formula="Cobranças de avaria pagas neste mês." tone="ok" />
    </section>
  )
}

function CardsSkeleton({ n = 6 }: { n?: number }) {
  return (
    <ul role="status" aria-busy="true" aria-label="Carregando" className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1000px]/frame:grid-cols-3 @min-[1280px]/frame:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-card bg-raised">
          <Skeleton shape="block" className="aspect-[16/9] h-auto rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="w-3/4" />
            <Skeleton className="h-11 rounded-pill" shape="block" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Avarias() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('aba') === 'extras' ? 'extras' : 'avarias'
  const raw = params.get('status')
  const status: StatusParam = STATUSES.includes(raw as DamageStatus) ? (raw as DamageStatus) : 'todas'

  const [chargeId, setChargeId] = React.useState<string | null>(null)
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [allOpen, setAllOpen] = React.useState(false)
  const [dismissing, setDismissing] = React.useState<DamageView | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [viewer, setViewer] = React.useState<{ photos: { id: string; src: string; alt: string }[]; index: number } | null>(null)
  const viewerBack = React.useRef<HTMLElement | null>(null)

  const damages = useQuery(() => listDamages(), [])
  const paidMonth = useQuery(() => listCharges({ kind: 'avaria', status: 'paga', month: monthKey(today()) }), [])
  const services = useQuery(() => listServices({ extra: true }), [])

  const chargeAll = useMutation((ids: string[]) => chargeDamage(ids))
  const dismiss = useMutation(dismissDamage)

  const setParam = (p: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(p)) {
      if (v === null) next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const list = damages.data ?? []
  const uncharged = list.filter((d) => d.status === 'registrada' && !d.charge)
  const unchargedTotal = r2(uncharged.reduce((a, d) => a + d.value, 0))
  const awaiting = r2(list.filter((d) => d.status === 'cobrada').reduce((a, d) => a + d.value, 0))
  const paidTotal = r2((paidMonth.data ?? []).reduce((a, c) => a + c.value, 0))
  const clientsUncharged = new Set(uncharged.map((d) => d.clientId)).size
  const visible = status === 'todas' ? list : list.filter((d) => d.status === status)
  const count = (s: StatusParam) => (s === 'todas' ? list.length : list.filter((d) => d.status === s).length)

  const groups: ExtraGroup[] = React.useMemo(() => {
    const m = new Map<string, ExtraGroup>()
    for (const s of services.data ?? []) {
      if (s.status !== 'concluido' || s.extraBilled) continue
      const g = m.get(s.rentalId) ?? { rentalId: s.rentalId, rentalCode: s.rentalCode, clientName: s.clientName, services: [], total: 0 }
      g.services.push(s)
      g.total = r2(g.total + (s.extraValue ?? 0))
      m.set(s.rentalId, g)
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [services.data])
  const extrasTotal = r2(groups.reduce((a, g) => a + g.total, 0))
  const extrasCount = groups.reduce((a, g) => a + g.services.length, 0)

  const charge = async (d: DamageView) => {
    setBusy(d.id)
    try {
      const c = await chargeDamage(d.id)
      notify.success(`Cobrança ${c.code} criada`)
      setChargeId(c.id)
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível criar a cobrança. Tente de novo.'))
    } finally {
      setBusy(null)
    }
  }

  const doChargeAll = async () => {
    try {
      const cs = await chargeAll.run(uncharged.map((d) => d.id))
      setAllOpen(false)
      notify.success(cs.length === 1 ? `Cobrança ${cs[0].code} criada` : `${cs.length} cobranças criadas, uma por cliente`)
      if (cs.length === 1) setChargeId(cs[0].id)
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível cobrar as avarias. Tente de novo.'))
    }
  }

  const doDismiss = async () => {
    if (!dismissing) return
    try {
      await dismiss.run(dismissing.id)
      notify.success('Avaria dispensada')
      setDismissing(null)
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível dispensar. Tente de novo.'))
    }
  }

  const bill = async (g: ExtraGroup) => {
    setBusy(g.rentalId)
    try {
      const c = await billExtras(g.rentalId)
      notify.success(`Extras faturados na cobrança ${c.code}`)
      setChargeId(c.id)
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível faturar. Tente de novo.'))
    } finally {
      setBusy(null)
    }
  }

  const openPhoto = (d: DamageView, e: React.MouseEvent<HTMLButtonElement>) => {
    viewerBack.current = e.currentTarget
    const ph = d.photos.length ? d.photos.map((p) => ({ id: p.id, src: p.src, alt: `${d.kind}, ${d.unitCode}` })) : [{ id: d.id, src: d.typePhoto, alt: `${d.kind}, ${d.unitCode}` }]
    setViewer({ photos: ph, index: 0 })
  }

  const loadError = tab === 'avarias' ? damages.error && !damages.data : services.error && !services.data

  return (
    <>
      <PageHeader
        title="Avarias e cobranças"
        actions={
          <Button variant="primary" size="lg" icon={Plus} onClick={() => setRegisterOpen(true)}>
            Registrar avaria
          </Button>
        }
      />

      <Segmented<Tab>
        label="Seção"
        value={tab}
        onChange={(v) => setParam({ aba: v === 'extras' ? 'extras' : null, status: null })}
        options={[
          { value: 'avarias', label: 'Avarias' },
          { value: 'extras', label: 'Extras' },
        ]}
      />

      {loadError ? (
        <Banner
          tone="danger"
          title="Não foi possível carregar esta lista."
          className="mt-4"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void damages.refetch()
                void services.refetch()
              }}
            >
              Tentar de novo
            </Button>
          }
        />
      ) : null}

      {tab === 'avarias' ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-12">
            {damages.initialLoading ? (
              <>
                {[0, 1].map((i) => (
                  <div key={i} role="status" aria-busy="true" aria-label="Carregando indicador" className={cn('flex h-[196px] flex-col justify-between rounded-card bg-raised p-6', i === 0 ? 'sm:col-span-2 @min-[1180px]/frame:col-span-8' : 'sm:col-span-2 @min-[1180px]/frame:col-span-4')}>
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-2/3" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <MoneyCard
                  hero
                  size="xl"
                  title="Sem cobrança"
                  value={unchargedTotal}
                  tag={{ label: uncharged.length === 1 ? '1 avaria' : `${uncharged.length} avarias` }}
                  formula="Avarias registradas em campo que ainda não viraram cobrança."
                  className="sm:col-span-2 @min-[1180px]/frame:col-span-8"
                >
                  <button
                    type="button"
                    disabled={uncharged.length === 0}
                    onClick={() => setAllOpen(true)}
                    className="inline-flex h-11 items-center justify-center rounded-pill bg-on-accent px-6 text-body font-semibold text-accent-active transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    Cobrar todas
                  </button>
                </MoneyCard>
                <SideNumbers awaiting={awaiting} paid={paidTotal} className="sm:col-span-2 @min-[1180px]/frame:col-span-4" />
              </>
            )}
          </div>

          <FilterPills<StatusParam>
            className="mt-6"
            label="Situação"
            value={status}
            onChange={(v) => setParam({ status: v === 'todas' ? null : v })}
            options={[{ value: 'todas', label: 'Todas', count: damages.data ? count('todas') : undefined }, ...STATUSES.map((s) => ({ value: s as StatusParam, label: STATUS_LABEL[s], count: damages.data ? count(s) : undefined }))]}
          />

          <div className="mt-4">
            {damages.initialLoading ? (
              <CardsSkeleton />
            ) : visible.length === 0 ? (
              <div className="rounded-card bg-raised">
                <EmptyState
                  icon={TriangleAlert}
                  title={list.length === 0 ? 'As avarias registradas em campo aparecem aqui' : 'Nenhuma avaria com este filtro'}
                  action={
                    list.length === 0 ? (
                      <Button variant="primary" icon={Plus} onClick={() => setRegisterOpen(true)}>
                        Registrar avaria
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => setParam({ status: null })}>
                        Ver todas
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <ul aria-label="Avarias" className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1000px]/frame:grid-cols-3 @min-[1280px]/frame:grid-cols-4">
                {visible.map((d) => (
                  <DamageCard
                    key={d.id}
                    damage={d}
                    busy={busy === d.id}
                    onCharge={() => void charge(d)}
                    onOpenPhoto={(e) => openPhoto(d, e)}
                    onOpenCharge={() => d.charge && setChargeId(d.charge.id)}
                    onDismiss={() => setDismissing(d)}
                    onOpenUnit={() => navigate(`/equipamentos/${d.unitCode}`)}
                    onOpenRental={() => navigate(`/locacoes/${d.rentalId}`)}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
            {services.initialLoading ? (
              <div role="status" aria-busy="true" aria-label="Carregando indicador" className="flex h-[196px] flex-col justify-between rounded-card bg-raised p-6 @min-[1180px]/frame:col-span-6">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            ) : (
              <MoneyCard hero size="xl" title="Extras não faturados" value={extrasTotal} tag={{ label: extrasCount === 1 ? '1 serviço' : `${extrasCount} serviços` }} formula="Serviços extras concluídos que ainda não entraram em cobrança." className="@min-[1180px]/frame:col-span-6" />
            )}
          </div>
          <div className="mt-6">
            {services.initialLoading ? (
              <CardsSkeleton n={3} />
            ) : groups.length === 0 ? (
              <div className="rounded-card bg-raised">
                <EmptyState icon={Check} title="Nenhum extra para faturar" />
              </div>
            ) : (
              <ul aria-label="Extras por locação" className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1000px]/frame:grid-cols-3 @min-[1280px]/frame:grid-cols-4">
                {groups.map((g) => (
                  <ExtraCard key={g.rentalId} g={g} busy={busy === g.rentalId} onBill={() => void bill(g)} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <Dialog
        open={allOpen}
        onOpenChange={setAllOpen}
        size="sm"
        title="Cobrar todas as avarias"
        confirmLabel="Cobrar todas"
        onConfirm={() => void doChargeAll()}
        confirmLoading={chargeAll.loading}
      >
        <p className="text-kpi">{formatMoney(unchargedTotal)}</p>
        <p className="mt-2 text-body-lg">
          {uncharged.length === 1 ? '1 avaria' : `${uncharged.length} avarias`}, {clientsUncharged === 1 ? 'uma cobrança' : `${clientsUncharged} cobranças, uma por cliente`}.
        </p>
      </Dialog>

      <Dialog
        open={dismissing !== null}
        onOpenChange={(o) => !o && setDismissing(null)}
        size="sm"
        destructive
        title="Dispensar avaria"
        confirmLabel="Dispensar"
        onConfirm={() => void doDismiss()}
        confirmLoading={dismiss.loading}
      >
        <p className="text-body-lg">{dismissing ? `${dismissing.kind} em ${dismissing.unitCode}, ${formatMoney(dismissing.value)}. Ela deixa de contar como dinheiro a cobrar.` : ''}</p>
      </Dialog>

      <RegisterDamageDrawer
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => {
          setRegisterOpen(false)
          setParam({ aba: null, status: null })
        }}
      />

      <ChargeDrawer chargeId={chargeId} onClose={() => setChargeId(null)} />

      {viewer ? (
        <PhotoViewer
          photos={viewer.photos}
          index={viewer.index}
          open
          onIndexChange={(i) => setViewer((v) => (v ? { ...v, index: i } : v))}
          onOpenChange={(o) => !o && setViewer(null)}
          returnFocusRef={viewerBack}
        />
      ) : null}
    </>
  )
}
