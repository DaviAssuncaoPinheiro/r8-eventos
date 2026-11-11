import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ClipboardList, KanbanSquare, List, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/app/PageHeader'
import { RENTAL_FLOW, RENTAL_STATUS } from '@/app/status'
import { Banner, Button, Card, EmptyState, Input, Money, Segmented, Select, Skeleton, StatusDot, Table, type TableColumn } from '@/ui'
import { listRentals, listTypes, useQuery, type RentalListItem, type RentalStatus } from '@/services'
import { formatDate } from '@/lib/format'
import { cleanTitle } from './util'
import { FunilTrilha } from './components/FunilTrilha'
import { CartaoLocacao } from './components/CartaoLocacao'

type Visao = 'quadro' | 'lista'
const STATUSES = new Set<string>([...RENTAL_FLOW, 'cancelada'])
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export default function Lista() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const rawStatus = params.get('status') ?? ''
  const status = STATUSES.has(rawStatus) ? (rawStatus as RentalStatus) : undefined
  const visao: Visao = status === 'cancelada' ? 'lista' : params.get('visao') === 'lista' ? 'lista' : 'quadro'
  const [q, setQ] = React.useState('')
  const [page, setPage] = React.useState(1)

  const rentals = useQuery(() => listRentals(), [])
  const types = useQuery(() => listTypes(), [])
  const typeMap = React.useMemo(() => new Map((types.data ?? []).map((t) => [t.id, t])), [types.data])

  const setStatus = (s?: RentalStatus) => {
    const next = new URLSearchParams(params)
    if (s) next.set('status', s)
    else next.delete('status')
    setParams(next, { replace: true })
    setPage(1)
  }
  const setVisao = (v: Visao) => {
    const next = new URLSearchParams(params)
    if (v === 'lista') next.set('visao', 'lista')
    else next.delete('visao')
    setParams(next, { replace: true })
  }

  const all = rentals.data ?? []
  const filtered = React.useMemo(() => {
    const nq = norm(q.trim())
    return all.filter((r) => (!status || r.status === status) && (!nq || norm(`${r.code} ${r.title} ${r.clientName}`).includes(nq)))
  }, [all, status, q])

  const goNew = () => navigate('/locacoes/nova')
  const open = (r: RentalListItem) => navigate(`/locacoes/${r.id}`)
  const funnelCounts = all.filter((r) => r.status !== 'cancelada')

  const columns: TableColumn<RentalListItem>[] = [
    { key: 'code', header: 'Código', width: 110, render: (r) => <span className="tnum font-semibold">{r.code}</span>, mobile: 'secondary' },
    { key: 'title', header: 'Locação', minWidth: 240, render: (r) => <span className="font-semibold">{cleanTitle(r.title)}</span>, secondary: (r) => r.clientName, mobile: 'title' },
    { key: 'period', header: 'Período', width: 250, render: (r) => <span className="tnum whitespace-nowrap">{formatDate(r.start)} a {formatDate(r.end)}</span> },
    { key: 'status', header: 'Situação', width: 150, render: (r) => <StatusDot tone={RENTAL_STATUS[r.status].tone}>{RENTAL_STATUS[r.status].label}</StatusDot>, mobile: 'status' },
    { key: 'total', header: 'Valor', align: 'right', width: 140, render: (r) => <Money value={r.total} variant="cell" className="font-semibold" />, mobile: 'value' },
  ]

  const newButton = (
    <Button variant="primary" size="lg" icon={Plus} onClick={goNew}>
      Nova locação
    </Button>
  )

  let tableState: 'ready' | 'loading' | 'empty' | 'error' | 'noResults' = 'ready'
  if (rentals.error && !rentals.data) tableState = 'error'
  else if (rentals.initialLoading) tableState = 'loading'
  else if (all.length === 0) tableState = 'empty'
  else if (filtered.length === 0) tableState = 'noResults'

  return (
    <>
      <PageHeader
        title="Locações"
        actions={
          <>
            <Segmented<Visao>
              label="Visão"
              value={visao}
              onChange={setVisao}
              options={[
                { value: 'quadro', label: 'Quadro', icon: KanbanSquare, disabled: status === 'cancelada' },
                { value: 'lista', label: 'Lista', icon: List },
              ]}
            />
            {newButton}
          </>
        }
      />

      {rentals.error && !rentals.data ? (
        <Banner tone="danger" title="Não foi possível carregar as locações." action={<Button size="sm" onClick={() => void rentals.refetch()}>Tentar de novo</Button>} />
      ) : rentals.initialLoading ? (
        <div aria-busy="true" className="grid gap-1 rounded-card bg-raised p-3 sm:grid-cols-5">
          {RENTAL_FLOW.map((s) => (
            <div key={s} className="flex flex-col gap-3 p-4">
              <Skeleton className="w-24" />
              <Skeleton className="h-10 w-14" />
              <Skeleton className="h-2 rounded-pill" />
              <Skeleton className="w-28" />
            </div>
          ))}
        </div>
      ) : (
        <FunilTrilha rentals={funnelCounts} status={status} onSelect={setStatus} />
      )}

      <div className="mt-4">
        {visao === 'quadro' ? (
          <Quadro rentals={filtered} all={funnelCounts} status={status} types={typeMap} loading={rentals.initialLoading || (!rentals.data && !rentals.error)} empty={!rentals.initialLoading && all.length === 0} onOpen={open} onNew={goNew} />
        ) : (
          <Table<RentalListItem>
            label="Locações"
            columns={columns}
            rows={filtered.slice((page - 1) * 10, page * 10)}
            getRowId={(r) => r.id}
            getRowLabel={(r) => r.code}
            state={tableState}
            onRowClick={open}
            onRetry={() => void rentals.refetch()}
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Buscar locação"
                  placeholder="Buscar por código, título ou cliente"
                  prefix={<Search size={16} strokeWidth={2} aria-hidden />}
                  value={q}
                  onChange={(e) => (setQ(e.target.value), setPage(1))}
                  className="w-full sm:w-[320px]"
                />
                <Select aria-label="Filtrar por situação" value={status ?? ''} onChange={(e) => setStatus((e.target.value || undefined) as RentalStatus | undefined)} className="w-full sm:w-[190px]">
                  <option value="">Todas as situações</option>
                  {[...RENTAL_FLOW, 'cancelada' as const].map((s) => (
                    <option key={s} value={s}>
                      {RENTAL_STATUS[s].label}
                    </option>
                  ))}
                </Select>
              </div>
            }
            emptyState={<EmptyState icon={ClipboardList} title="As locações aparecem aqui" action={newButton} />}
            noResultsTitle="Nenhuma locação com esses filtros"
            onClearFilters={() => (setQ(''), setStatus(undefined))}
            pagination={filtered.length > 10 ? { page, pageSize: 10, total: filtered.length, onPageChange: setPage } : undefined}
            unit="locações"
          />
        )}
      </div>
    </>
  )
}

function Quadro({ rentals, all, status, types, loading, empty, onOpen, onNew }: { rentals: RentalListItem[]; all: RentalListItem[]; status?: RentalStatus; types: Map<string, import('@/services').EquipmentType>; loading: boolean; empty: boolean; onOpen: (r: RentalListItem) => void; onNew: () => void }) {
  if (loading) {
    return (
      <div aria-busy="true" className="grid gap-3 sm:grid-cols-5">
        {RENTAL_FLOW.map((s) => (
          <div key={s} className="flex flex-col gap-3">
            <Skeleton className="w-24" />
            <Skeleton className="h-[116px] rounded-card" />
            <Skeleton className="h-[116px] rounded-card" />
          </div>
        ))}
      </div>
    )
  }
  if (empty) {
    return (
      <Card>
        <EmptyState icon={ClipboardList} title="As locações aparecem aqui" action={<Button variant="primary" icon={Plus} onClick={onNew}>Nova locação</Button>} />
      </Card>
    )
  }
  const stages = status && status !== 'cancelada' ? [status] : RENTAL_FLOW
  return (
    <div className="snap-x overflow-x-auto pb-2" tabIndex={-1}>
      <div className={stages.length === 1 ? 'grid grid-cols-1' : 'grid min-w-max grid-flow-col auto-cols-[min(300px,86vw)] gap-3 sm:auto-cols-[minmax(272px,1fr)] @min-[1180px]/frame:min-w-0'}>
        {stages.map((s) => {
          const list = rentals.filter((r) => r.status === s)
          return (
            <section key={s} aria-label={RENTAL_STATUS[s].label} className="min-w-0 snap-start rounded-card bg-sunken p-2">
              <header className="flex items-center justify-between px-2 pt-1 pb-3">
                <StatusDot tone={RENTAL_STATUS[s].tone} className="font-semibold">
                  {RENTAL_STATUS[s].label}
                </StatusDot>
                <span className="tnum text-caption font-semibold text-fg-2">{list.length}</span>
              </header>
              {list.length ? (
                <ul className={stages.length === 1 ? 'grid gap-2 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-3' : 'flex flex-col gap-2'}>
                  {list.map((r) => (
                    <CartaoLocacao key={r.id} rental={r} types={types} onOpen={() => onOpen(r)} />
                  ))}
                </ul>
              ) : (
                <p className="rounded-card px-3 py-6 text-center text-body text-fg-3">Nenhuma locação</p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
