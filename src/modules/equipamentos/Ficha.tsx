import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowUpRight, Boxes, ChevronDown, ClipboardList, Wrench } from 'lucide-react'
import { Badge, Banner, Button, Card, EmptyState, Menu, Money, QrTile, Skeleton, Tooltip, notify, type MenuEntry } from '@/ui'
import { PageHeader } from '@/app/PageHeader'
import { DAMAGE_STATUS, UNIT_STATUS } from '@/app/status'
import { addDays, diffDays, today } from '@/domain/dates'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { getUnit, listRentals, listServices, setUnitStatus, useMutation, useQuery, useSegment, type UnitStatus } from '@/services'
import { DayStrip } from './components/DayStrip'
import { HISTORY_ICON, History, type HistoryItem } from './components/History'
import { TypeThumb } from './components/TypeThumb'
import { addChange, readChanges } from './components/statusLog'
import { IDLE_LIMIT } from './components/UnitCard'
import { unitUrl, useLabelPrinter } from './components/useLabelPrinter'

const SETTABLE: UnitStatus[] = ['disponivel', 'limpeza', 'manutencao']
const MENU_LABEL: Record<UnitStatus, string> = { disponivel: 'Disponível', em_campo: 'Em campo', limpeza: 'Em limpeza', manutencao: 'Manutenção' }

export default function Ficha() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const seg = useSegment()
  const q = useQuery(() => getUnit(code), [code])
  const rentals = useQuery(() => listRentals({}), [])
  const services = useQuery(() => listServices({}), [])
  const mut = useMutation((id: string, status: UnitStatus) => setUnitStatus(id, status))
  const printer = useLabelPrinter()
  const [logTick, setLogTick] = React.useState(0)

  const detail = q.data
  const unit = detail?.unit

  const history = React.useMemo<HistoryItem[]>(() => {
    if (!detail || !unit) return []
    const rmap = new Map((rentals.data ?? []).map((r) => [r.id, r]))
    const smap = new Map((services.data ?? []).map((s) => [s.id, s]))
    const dmap = new Map(detail.damages.map((d) => [d.id, d]))
    const out: HistoryItem[] = []
    for (const h of detail.history) {
      const r = h.rentalId ? rmap.get(h.rentalId) : undefined
      const base = { id: h.id, at: h.at, rentalId: h.rentalId, rentalCode: r?.code, clientId: r?.clientId, clientName: r?.clientName }
      if (h.kind === 'locacao') out.push({ ...base, icon: h.title.startsWith('Voltou') ? HISTORY_ICON.retorno : HISTORY_ICON.locacao, tone: h.title.startsWith('Voltou') ? 'ok' : 'neutral', title: h.title })
      else if (h.kind === 'servico') {
        const p = smap.get(h.refId ?? '')?.report?.photos[0]
        out.push({ ...base, icon: HISTORY_ICON.servico, tone: 'info', title: h.title, photo: p ? { src: p.src, alt: `${h.title}: ${p.label}` } : undefined })
      } else {
        const d = dmap.get(h.refId ?? '')
        const p = d?.photos[0]
        out.push({
          ...base,
          icon: HISTORY_ICON.avaria,
          tone: 'danger',
          title: `${seg.labels.damage.charAt(0).toUpperCase()}${seg.labels.damage.slice(1)}: ${h.title}`,
          meta: d ? DAMAGE_STATUS[d.status].label : undefined,
          amount: d?.value,
          photo: p ? { src: p.src, alt: `${h.title}: ${p.label}` } : undefined,
        })
      }
    }
    for (const c of readChanges(unit)) {
      out.push({ id: `chg-${c.at}`, at: c.at, icon: HISTORY_ICON.situacao, tone: 'warn', title: `Situação: ${MENU_LABEL[c.from]} para ${MENU_LABEL[c.to]}` })
    }
    return out.sort((a, b) => b.at.localeCompare(a.at))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, unit, rentals.data, services.data, seg, logTick])

  if (q.error && !detail) {
    const missing = /não encontrado/i.test(q.error.message)
    return (
      <>
        <PageHeader title={code} back="/equipamentos" />
        {missing ? (
          <div className="rounded-card bg-raised p-6">
            <EmptyState icon={Boxes} title="Esta unidade não está no estoque" action={<Button variant="primary" onClick={() => navigate('/equipamentos')}>Ver o estoque</Button>} />
          </div>
        ) : (
          <Banner tone="danger" title="Não foi possível carregar a unidade." action={<Button size="sm" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
        )}
      </>
    )
  }

  if (!detail || !unit) {
    return (
      <div aria-busy="true">
        <PageHeader title={code} back="/equipamentos" />
        <div className="grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
          <Skeleton shape="block" className="h-96 rounded-card @min-[1180px]/frame:col-span-5" />
          <Skeleton shape="block" className="h-96 rounded-card @min-[1180px]/frame:col-span-7" />
          <Skeleton shape="block" className="h-48 rounded-card @min-[1180px]/frame:col-span-12" />
        </div>
      </div>
    )
  }

  const st = UNIT_STATUS[unit.status]
  const e = detail.earnings
  const clientIdOf = (rid?: string) => rentals.data?.find((r) => r.id === rid)?.clientId
  // período de referência da proporção: desde a aquisição, no máximo 190 dias
  const since = unit.acquiredAt > addDays(today(), -190) ? unit.acquiredAt : addDays(today(), -190)
  const span = Math.max(e.daysRented, diffDays(since, today()), 1)
  const daysRented = Math.min(e.daysRented, span)
  const daysIdle = span - daysRented
  const idleLong = unit.status === 'disponivel' && (unit.idleDays ?? 0) > IDLE_LIMIT

  const change = async (to: UnitStatus) => {
    const from = unit.status
    try {
      await mut.run(unit.id, to)
      await q.refetch()
      addChange({ unitId: unit.id, at: new Date().toISOString(), from, to })
      setLogTick((n) => n + 1)
      notify.success(`${unit.code} agora está em ${MENU_LABEL[to].toLowerCase()}`)
    } catch {
      notify.error('Não foi possível mudar a situação. Tente de novo.')
    }
  }
  const menuItems: MenuEntry[] = SETTABLE.map((s) => ({ label: MENU_LABEL[s], disabled: s === unit.status, onSelect: () => void change(s) }))
  const inField = unit.status === 'em_campo'
  // campos de banheiro (tanque, fabricante, lote) não fazem sentido em estrutura como tenda e alambrado
  const sanitary = unit.type.cleanable
  const fields = seg.equipmentFields.filter((f) => unit.fields[f.key] !== undefined && unit.fields[f.key] !== '' && (seg.id !== 'eventos' || sanitary || !['capacidadeL', 'fabricante', 'lote'].includes(f.key)))

  return (
    <>
      <PageHeader
        title={unit.code}
        back="/equipamentos"
        meta={<Badge tone={st.tone}>{st.label}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        {/* foto e QR */}
        <Card padding="none" className="p-2 @min-[1180px]/frame:col-span-5">
          <TypeThumb src={unit.type.photo} alt={unit.type.name} typeId={unit.type.id} tag={unit.type.short} className="aspect-[16/10] w-full rounded-[16px]" />
          <div className="p-4 sm:p-5">
            <h2 className="mb-4 text-title-sub">{unit.type.name}</h2>
            <QrTile
              value={unitUrl(unit.code)}
              code={unit.code}
              name={unit.type.name}
              size={140}
              onPrint={() => printer.print([unit])}
              onCopied={() => notify.success('Link copiado')}
            />
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-4 @min-[1180px]/frame:col-span-7">
        {/* rendimento */}
        <Card className="flex flex-1 flex-col">
          <h2 className="text-title-sub">Rendimento</h2>
          <p className="mt-2 text-kpi-lg">
            <Money value={e.total} variant="kpi" />
          </p>
          <dl className="m-0 mt-5 grid grid-cols-3 gap-3">
            {[
              { k: 'Últimos 30 dias', v: <Money value={e.last30d} className="text-title-sub" /> },
              { k: 'Média por mês', v: <Money value={e.avgPerMonth} className="text-title-sub" /> },
              { k: 'Locações', v: <span className="tnum text-title-sub">{formatNumber(e.rentals)}</span> },
            ].map((s) => (
              <div key={s.k} className="min-w-0">
                <dt className="text-caption text-fg-3">{s.k}</dt>
                <dd className="m-0 mt-0.5 truncate">{s.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <div
              role="img"
              aria-label={`${daysRented} dias alugada e ${daysIdle} dias parada`}
              className="flex h-4 gap-1"
            >
              <span className="rounded-pill bg-accent" style={{ flexGrow: daysRented, minWidth: daysRented ? 6 : 0 }} />
              <span className="ds-hatch rounded-pill bg-sunken ring-1 ring-idle ring-inset" style={{ flexGrow: daysIdle, minWidth: daysIdle ? 6 : 0 }} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-body">
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-pill bg-accent" />
                <span className="tnum font-semibold">{daysRented}</span> alugada
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="ds-hatch size-2.5 rounded-pill bg-sunken ring-1 ring-idle ring-inset" />
                <span className="tnum font-semibold">{daysIdle}</span> parada
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
            <div className="flex items-center gap-3">
              <span className="text-body-lg font-semibold">{st.label}</span>
              {idleLong ? <span className="text-body font-semibold text-danger-ink">parada há {unit.idleDays} dias</span> : null}
            </div>
            {inField ? (
              <Tooltip content="Em campo: a situação muda quando a locação for retirada">
                <span>
                  <Button variant="secondary" size="lg" iconRight={ChevronDown} disabled>
                    Mudar situação
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Menu
                align="end"
                items={menuItems}
                trigger={
                  <Button variant="secondary" size="lg" iconRight={ChevronDown} icon={Wrench} loading={mut.loading}>
                    Mudar situação
                  </Button>
                }
              />
            )}
          </div>
        </Card>

        {/* locação atual */}
        {inField && unit.rental ? (
          <Card>
            <h2 className="text-title-sub">Locação atual</h2>
            <Link
              to={`/locacoes/${unit.rental.id}`}
              className="group mt-3 flex items-center gap-3.5 rounded-control p-2 -mx-2 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent-ink">
                <ClipboardList size={20} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-lg font-semibold">{unit.rental.title}</span>
                <span className="block truncate text-body text-fg-2">
                  {unit.rental.code} · {formatDate(unit.rental.start)} a {formatDate(unit.rental.end)}
                </span>
              </span>
              <ArrowUpRight size={18} strokeWidth={2} aria-hidden className="shrink-0 transition-transform duration-200 ease-[var(--ease-ui)] group-hover:rotate-45" />
            </Link>
            {clientIdOf(unit.rental.id) ? (
              <Link
                to={`/clientes/${clientIdOf(unit.rental.id)}`}
                className="mt-1 inline-flex items-center gap-2 rounded-tip text-body font-semibold text-accent-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {unit.rental.clientName}
              </Link>
            ) : (
              <span className="mt-1 block text-body font-semibold">{unit.rental.clientName}</span>
            )}
          </Card>
        ) : null}

        {/* campos do pacote de segmento */}
        {fields.length ? (
          <Card>
            <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {fields.map((f) => (
                <div key={f.key} className="min-w-0">
                  <dt className="text-caption text-fg-3">{f.label}</dt>
                  <dd className="m-0 mt-0.5 truncate text-body font-semibold">
                    <span className="tnum">{f.kind === 'date' ? formatDate(String(unit.fields[f.key])) : unit.fields[f.key]}</span>
                    {f.unit ? ` ${f.unit}` : ''}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : null}

        </div>

        {/* 60 dias */}
        <Card className="@min-[1180px]/frame:col-span-12">
          <h2 className="mb-4 text-title-sub">Próximos 60 dias</h2>
          <DayStrip days={detail.calendar} />
        </Card>

        {/* histórico */}
        <Card className="@min-[1180px]/frame:col-span-12">
          <h2 className="mb-5 text-title-sub">Histórico</h2>
          <History items={history} dateTime={formatDateTime} />
        </Card>
      </div>
      {printer.sheet}
    </>
  )
}
