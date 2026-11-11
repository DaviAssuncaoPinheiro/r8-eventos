import * as React from 'react'
import { useParams } from 'react-router-dom'
import { Boxes, CalendarClock, Link2Off, Plus } from 'lucide-react'
import { Badge, Banner, Button, EmptyState, Skeleton, StatusDot, cn, notify, useCountUp } from '@/ui'
import { Money } from '@/ui'
import { RENTAL_STATUS } from '@/app/status'
import { formatDate } from '@/lib/format'
import { MONTHS_LONG, monthKey, today } from '@/domain/dates'
import { getPortal, getPortalReport, useLabels, useQuery, type PortalData, type PortalRental } from '@/services'
import { PublicShell } from './components/PublicShell'
import { ReceiptsSection, receiptMonths } from './components/Receipts'
import { InvoicesSection } from './components/Invoices'
import { buildReportHtml, printReport } from './report'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const CODES_SHOWN = 12

function Hero({ data, cleaningsLabel }: { data: PortalData; cleaningsLabel: string }) {
  const units = new Set(data.activeRentals.flatMap((r) => r.units.map((u) => u.id))).size
  const cleanings = data.monthlyReport.cleanings.length
  const open = data.invoices.filter((i) => i.status === 'aberta' || i.status === 'atrasada').reduce((a, i) => a + i.value, 0)
  const nUnits = Math.round(useCountUp(units))
  const nCleanings = Math.round(useCountUp(cleanings))
  const nOpen = useCountUp(open)
  return (
    <section aria-label="Resumo" className="ds-hero ds-hero-card rounded-card p-5 sm:p-7">
      <h1 className="text-title-section sm:text-title-field">Olá, {data.client.name}</h1>
      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        <div>
          <dd className="tnum text-kpi sm:text-kpi-lg">{nUnits}</dd>
          <dt className="mt-1 text-body text-on-accent-2">Equipamentos no local</dt>
        </div>
        <div>
          <dd className="tnum text-kpi sm:text-kpi-lg">{nCleanings}</dd>
          <dt className="mt-1 text-body text-on-accent-2">{cap(cleaningsLabel)} no mês</dt>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dd className="text-kpi sm:text-kpi-lg">
            <Money value={nOpen} variant="kpi" />
          </dd>
          <dt className="mt-1 text-body text-on-accent-2">Fatura em aberto</dt>
        </div>
      </dl>
    </section>
  )
}

function RentalCard({ rental, cleaningLabel }: { rental: PortalRental; cleaningLabel: string }) {
  const [all, setAll] = React.useState(false)
  const groups = React.useMemo(() => {
    const m = new Map<string, { name: string; photo: string; codes: string[] }>()
    for (const u of rental.units) {
      const g = m.get(u.typeName) ?? { name: u.typeName, photo: u.photo, codes: [] }
      g.codes.push(u.code)
      m.set(u.typeName, g)
    }
    return [...m.values()]
  }, [rental.units])
  const st = RENTAL_STATUS[rental.status]
  return (
    <li className="flex flex-col rounded-card bg-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="min-w-0 truncate text-title-card">{rental.title}</h3>
        <StatusDot tone={st.tone}>{st.label}</StatusDot>
      </div>
      <div className="mt-4 flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.name} className="flex gap-4">
            <img src={g.photo} alt={g.name} loading="lazy" className="size-20 shrink-0 rounded-control bg-sunken object-cover sm:size-24" />
            <div className="min-w-0 flex-1">
              <p className="text-body-lg font-semibold">
                <span className="tnum mr-1.5 text-title-sub">{g.codes.length}</span>
                {g.name}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {(all ? g.codes : g.codes.slice(0, CODES_SHOWN)).map((c) => (
                  <li key={c}>
                    <Badge className="tnum">{c}</Badge>
                  </li>
                ))}
                {!all && g.codes.length > CODES_SHOWN ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setAll(true)}
                      aria-label={`Mostrar os outros ${g.codes.length - CODES_SHOWN} códigos`}
                      className="inline-flex h-6 items-center gap-1 rounded-pill bg-accent-soft px-2 text-caption font-semibold text-accent-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                    >
                      <Plus size={12} strokeWidth={2.5} aria-hidden />
                      {g.codes.length - CODES_SHOWN}
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {rental.nextCleaningAt ? (
        <p className="mt-5 inline-flex items-center gap-2 text-body font-semibold">
          <CalendarClock size={18} strokeWidth={2} aria-hidden className="text-accent-ink" />
          Próxima {cleaningLabel}: <span className="tnum">{formatDate(rental.nextCleaningAt)}</span>
        </p>
      ) : null}
    </li>
  )
}

function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-6">
      <Skeleton shape="block" className="h-52 rounded-card" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton shape="block" className="h-40 rounded-card" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton shape="block" className="h-72 rounded-card" />
      </div>
    </div>
  )
}

export default function Portal() {
  const { token = '' } = useParams()
  const l = useLabels()
  const q = useQuery(() => getPortal(token), [token])
  const data = q.data
  const [pickedMonth, setMonth] = React.useState<string | undefined>()
  const [reporting, setReporting] = React.useState(false)

  const months = React.useMemo(() => (data ? receiptMonths(data.receipts) : []), [data])
  const month = pickedMonth && months.includes(pickedMonth) ? pickedMonth : (months[0] ?? monthKey(today()))
  const monthName = MONTHS_LONG[Number(month.slice(5, 7)) - 1]

  const invalid = q.error && q.error.message.startsWith('Link do portal')

  const report = async () => {
    if (!data) return
    setReporting(true)
    try {
      const r = await getPortalReport(token, month)
      await printReport(buildReportHtml(data.company, r, l.cleaningPlural))
    } catch {
      notify.error('Não foi possível montar o relatório. Tente de novo.')
    } finally {
      setReporting(false)
    }
  }

  if (invalid) {
    return (
      <PublicShell>
        <div className="mx-auto mt-10 max-w-[480px] rounded-card bg-raised p-4 sm:mt-20">
          <EmptyState icon={Link2Off} title="Link não encontrado">
            Confira se o endereço está completo ou peça um novo link à locadora.
          </EmptyState>
        </div>
      </PublicShell>
    )
  }

  return (
    <PublicShell company={data?.company} right={data?.client.name}>
      {q.error && !data ? (
        <Banner tone="danger" title="Não foi possível carregar o portal." action={<Button variant="secondary" size="sm" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-10">
          <Hero data={data} cleaningsLabel={l.cleaningPlural} />

          <section aria-labelledby="equipamentos">
            <h2 id="equipamentos" className="text-title-section">
              Seus {l.equipmentPlural}
            </h2>
            {data.activeRentals.length ? (
              <ul className={cn('mt-4 grid list-none gap-4 p-0', data.activeRentals.length > 1 && 'md:grid-cols-2')}>
                {data.activeRentals.map((r) => (
                  <RentalCard key={r.id} rental={r} cleaningLabel={l.cleaning} />
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-card bg-raised p-2">
                <EmptyState icon={Boxes} title={`Nenhum ${l.equipment} no local agora`} />
              </div>
            )}
          </section>

          <ReceiptsSection receipts={data.receipts} month={month} onMonth={setMonth} monthName={monthName} onReport={report} reporting={reporting} />

          <InvoicesSection token={token} invoices={data.invoices} />
        </div>
      )}
    </PublicShell>
  )
}
