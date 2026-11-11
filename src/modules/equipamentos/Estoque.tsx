import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Boxes, LayoutGrid, List, Printer, Search, X } from 'lucide-react'
import { Banner, Button, EmptyState, Input, Money, Segmented, Skeleton, StatusDot, Table, cn, type TableColumn } from '@/ui'
import { PageHeader } from '@/app/PageHeader'
import { UNIT_STATUS } from '@/app/status'
import { getStockSummary, listUnits, useLabels, useQuery, type UnitStatus, type UnitView } from '@/services'
import { AvailabilityCalendar } from './components/AvailabilityCalendar'
import { TypeStrip } from './components/TypeStrip'
import { IDLE_LIMIT, UnitCard } from './components/UnitCard'
import { TypeThumb } from './components/TypeThumb'
import { useLabelPrinter } from './components/useLabelPrinter'

const PAGE = 24
const STATUSES: UnitStatus[] = ['em_campo', 'disponivel', 'limpeza', 'manutencao']
const isStatus = (v: string | null): v is UnitStatus => !!v && (STATUSES as string[]).includes(v)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type Aba = 'unidades' | 'disponibilidade'
type Visao = 'grade' | 'lista'

export default function Estoque() {
  const l = useLabels()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = isStatus(params.get('status')) ? (params.get('status') as UnitStatus) : undefined
  const tipo = params.get('tipo') ?? undefined
  const aba: Aba = params.get('aba') === 'disponibilidade' ? 'disponibilidade' : 'unidades'
  const [visao, setVisao] = React.useState<Visao>('grade')
  const [busca, setBusca] = React.useState('')
  const [shown, setShown] = React.useState(PAGE)
  const printer = useLabelPrinter()

  const setParam = (k: string, v?: string) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p)
        if (v) n.set(k, v)
        else n.delete(k)
        return n
      },
      { replace: true },
    )

  const stock = useQuery(() => getStockSummary(), [])
  const all = useQuery(() => listUnits({ typeId: tipo }), [tipo])

  // a base de contagem respeita tipo e busca; a situação filtra por cima
  const base = React.useMemo(() => {
    const q = norm(busca.trim())
    const list = all.data ?? []
    return q ? list.filter((u) => norm(`${u.code} ${u.type.name} ${u.rental?.clientName ?? ''}`).includes(q)) : list
  }, [all.data, busca])
  const counts = React.useMemo(() => {
    const c: Record<'todos' | UnitStatus, number> = { todos: base.length, em_campo: 0, disponivel: 0, limpeza: 0, manutencao: 0 }
    for (const u of base) c[u.status]++
    return c
  }, [base])
  const rows = React.useMemo(() => (status ? base.filter((u) => u.status === status) : base), [base, status])

  React.useEffect(() => setShown(PAGE), [status, tipo, busca, visao])

  const visible = rows.slice(0, shown)
  const typeForCalendar = stock.data?.find((r) => r.type.id === tipo)?.type ?? stock.data?.[0]?.type
  const pills: { key: 'todos' | UnitStatus; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'em_campo', label: UNIT_STATUS.em_campo.label },
    { key: 'disponivel', label: UNIT_STATUS.disponivel.label },
    { key: 'limpeza', label: UNIT_STATUS.limpeza.label },
    { key: 'manutencao', label: UNIT_STATUS.manutencao.label },
  ]

  const columns: TableColumn<UnitView>[] = [
    {
      key: 'code',
      header: 'Código',
      mobile: 'title',
      width: 150,
      render: (u) => (
        <span className="flex items-center gap-3">
          <TypeThumb src={u.type.photo} alt="" typeId={u.type.id} className="size-8 rounded-tip" />
          <span className="tnum font-semibold">{u.code}</span>
        </span>
      ),
    },
    { key: 'type', header: 'Tipo', minWidth: 200, mobile: 'secondary', render: (u) => u.type.name },
    { key: 'status', header: 'Situação', mobile: 'status', render: (u) => <StatusDot tone={UNIT_STATUS[u.status].tone}>{UNIT_STATUS[u.status].label}</StatusDot> },
    { key: 'who', header: 'Cliente', minWidth: 200, mobile: 'value', render: (u) => u.rental?.clientName ?? '' },
    {
      key: 'idle',
      header: 'Parado',
      align: 'right',
      render: (u) => (u.idleDays !== undefined ? <span className={cn('tnum', u.idleDays > IDLE_LIMIT && 'font-semibold text-danger-ink')}>{u.idleDays} dias</span> : ''),
    },
    { key: 'value', header: 'Valor mensal', align: 'right', render: (u) => <Money value={u.monthlyValue} variant="cell" /> },
  ]

  const loadingUnits = all.initialLoading

  return (
    <>
      <PageHeader
        title={cap(l.equipmentPlural)}
        actions={
          <Button variant="primary" size="lg" icon={Printer} disabled={rows.length === 0} loading={printer.printing} onClick={() => printer.print(rows)}>
            Imprimir etiquetas QR
          </Button>
        }
      />

      {stock.error && !stock.data ? (
        <Banner tone="danger" title="Não foi possível carregar o estoque." action={<Button size="sm" onClick={() => void stock.refetch()}>Tentar de novo</Button>} />
      ) : (
        <TypeStrip rows={stock.data} loading={stock.initialLoading} selected={tipo} onSelect={(id) => setParam('tipo', id)} />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<Aba>
          label="Seção"
          value={aba}
          onChange={(v) => setParam('aba', v === 'unidades' ? undefined : v)}
          options={[
            { value: 'unidades', label: cap(l.unitPlural) },
            { value: 'disponibilidade', label: 'Disponibilidade' },
          ]}
        />
        {aba === 'unidades' ? (
          <Segmented<Visao>
            label="Visão"
            value={visao}
            onChange={setVisao}
            options={[
              { value: 'grade', label: 'Grade', icon: LayoutGrid },
              { value: 'lista', label: 'Lista', icon: List },
            ]}
          />
        ) : null}
      </div>

      {aba === 'disponibilidade' ? (
        <div className="mt-4">{typeForCalendar ? <AvailabilityCalendar type={typeForCalendar} /> : <Skeleton shape="block" className="h-72 rounded-card" />}</div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div role="group" aria-label="Situação" className="flex flex-wrap gap-2">
              {pills.map((p) => {
                const on = (status ?? 'todos') === p.key
                return (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setParam('status', p.key === 'todos' ? undefined : p.key)}
                    className={cn(
                      'ds-touch inline-flex h-11 items-center gap-2 rounded-pill px-4 text-body font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      on ? 'bg-fg text-raised' : 'bg-raised text-fg hover:bg-hover',
                    )}
                  >
                    {p.label}
                    <span className={cn('tnum text-caption', on ? 'text-raised/70' : 'text-fg-3')}>{counts[p.key]}</span>
                  </button>
                )
              })}
            </div>
            <div className="ml-auto flex w-full items-center gap-2 sm:w-72">
              <div className="min-w-0 flex-1">
                <Input
                  aria-label="Buscar por código"
                  placeholder="Buscar por código"
                  prefix={<Search size={18} strokeWidth={2} aria-hidden />}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="bg-raised"
                />
              </div>
              {tipo ? (
                <Button variant="secondary" size="md" iconOnly icon={X} aria-label="Limpar filtro de tipo" onClick={() => setParam('tipo')} />
              ) : null}
            </div>
          </div>

          <div className="mt-4" aria-busy={loadingUnits || undefined}>
            {all.error && !all.data ? (
              <Banner tone="danger" title="Não foi possível carregar as unidades." action={<Button size="sm" onClick={() => void all.refetch()}>Tentar de novo</Button>} />
            ) : loadingUnits ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} aria-hidden className="flex items-center gap-3 rounded-card bg-raised p-3">
                    <Skeleton shape="block" className="size-14" />
                    <div className="flex-1">
                      <Skeleton className="w-1/2" />
                      <Skeleton className="mt-2 h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-card bg-raised p-6">
                <EmptyState
                  icon={Boxes}
                  variant={busca || status || tipo ? 'search' : 'default'}
                  title={busca || status || tipo ? 'Nenhuma unidade com esses filtros' : `As unidades de ${l.equipmentPlural} aparecem aqui`}
                  action={
                    busca || status || tipo ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setBusca('')
                          setParams({}, { replace: true })
                        }}
                      >
                        Limpar filtros
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : visao === 'grade' ? (
              <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
                {visible.map((u) => (
                  <li key={u.id} className="min-w-0">
                    <UnitCard unit={u} />
                  </li>
                ))}
              </ul>
            ) : (
              <Table<UnitView>
                label={`Lista de ${l.unitPlural}`}
                columns={columns}
                rows={visible}
                getRowId={(u) => u.id}
                getRowLabel={(u) => u.code}
                onRowClick={(u) => navigate(`/equipamentos/${u.code}`)}
                density="compact"
              />
            )}

            {!loadingUnits && rows.length > shown ? (
              <div className="mt-5 flex justify-center">
                <Button variant="secondary" size="lg" onClick={() => setShown((n) => n + PAGE)}>
                  Mostrar mais ({rows.length - shown})
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
      {printer.sheet}
    </>
  )
}
