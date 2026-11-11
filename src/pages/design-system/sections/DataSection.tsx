import * as React from 'react'
import { Banknote, FileText, Plus, Search, Sparkles, TriangleAlert, Truck } from 'lucide-react'
import { Badge, Button, Card, Input, Money, StatusDot, type StatusTone } from '@/ui'
import { formatDate, formatMoney } from '@/lib/format'
import { BarSeriesChart, ChartCard, RatioDonut, TrendChart } from '@/ui/Chart'
import { AddPhoto, PhotoGrid, PhotoThumb, type PhotoItem } from '@/ui/Photo'
import { QrTile } from '@/ui/QrTile'
import { ServiceRow } from '@/ui/ServiceRow'
import { Table, type SortState, type TableColumn, type TableState } from '@/ui/Table'
import { Timeline, type TimelineGroup } from '@/ui/Timeline'
import { DsSection, Specimen } from '../kit'

/* ───────────────────────── dados de exemplo ───────────────────────── */

type StatusKey = 'andamento' | 'agendado' | 'atrasado' | 'concluido' | 'assinatura' | 'parado'
const STATUS: Record<StatusKey, { label: string; tone: StatusTone }> = {
  andamento: { label: 'Em andamento', tone: 'accent' },
  agendado: { label: 'Agendado', tone: 'info' },
  atrasado: { label: 'Atrasado', tone: 'danger' },
  concluido: { label: 'Concluído', tone: 'ok' },
  assinatura: { label: 'Aguardando', tone: 'warn' },
  parado: { label: 'Parado no pátio', tone: 'idle' },
}

interface Locacao {
  id: string
  client: string
  city: string
  equip: string
  start: string
  status: StatusKey
  value: number
}

const LOCACOES: Locacao[] = [
  { id: 'LOC-2041', client: 'Construtora Planalto', city: 'Asa Norte', equip: 'BQ-0142', start: '2026-11-03', status: 'andamento', value: 3184.5 },
  { id: 'LOC-2042', client: 'Produtora Cerrado Vivo', city: 'Parque da Cidade', equip: 'TND-0008', start: '2026-11-08', status: 'agendado', value: 7420 },
  { id: 'LOC-2043', client: 'Administração Regional do Guará', city: 'Guará II', equip: 'PCD-0017', start: '2026-10-27', status: 'atrasado', value: 1860.9 },
  { id: 'LOC-2044', client: 'Cia. de Obras Esplanada', city: 'Esplanada dos Ministérios', equip: 'BQ-0151', start: '2026-10-14', status: 'concluido', value: 12480 },
  { id: 'LOC-2045', client: 'Residencial Vila Verde', city: 'Sobradinho', equip: 'PIA-0031', start: '2026-11-05', status: 'andamento', value: 940.25 },
  { id: 'LOC-2046', client: 'Festival Raízes do Planalto', city: 'Estádio Nacional', equip: 'TRL-0003', start: '2026-11-15', status: 'assinatura', value: 18650 },
  { id: 'LOC-2047', client: 'Associação Comercial de Taguatinga', city: 'Taguatinga Centro', equip: 'ALA-0112', start: '2026-10-30', status: 'concluido', value: 2310.4 },
  { id: 'LOC-2048', client: 'Escola Classe 07 de Sobradinho', city: 'Sobradinho', equip: 'BQ-0167', start: '2026-11-10', status: 'agendado', value: 1275 },
  { id: 'LOC-2049', client: 'Buffet Aurora', city: 'Lago Sul', equip: 'BAL-0006', start: '2026-11-09', status: 'andamento', value: 1590.8 },
  { id: 'LOC-2050', client: 'Condomínio Residencial Lago Norte', city: 'Lago Norte', equip: 'BQ-0173', start: '2026-10-21', status: 'atrasado', value: 4236.15 },
  { id: 'LOC-2051', client: 'Igreja Batista Central', city: 'Asa Sul', equip: 'TND-0011', start: '2026-11-12', status: 'agendado', value: 3960 },
  { id: 'LOC-2052', client: 'Construtora Planalto', city: 'Ceilândia', equip: 'BQ-0144', start: '2026-09-29', status: 'concluido', value: 8742.3 },
  { id: 'LOC-2053', client: 'Eventos Capital', city: 'Setor de Clubes Sul', equip: 'FEC-0021', start: '2026-11-01', status: 'parado', value: 0 },
  { id: 'LOC-2054', client: 'Produtora Cerrado Vivo', city: 'Eixo Monumental', equip: 'PCD-0021', start: '2026-11-06', status: 'andamento', value: 2680.5 },
  { id: 'LOC-2055', client: 'Colégio Planalto Central', city: 'Taguatinga Sul', equip: 'BQ-0182', start: '2026-10-19', status: 'concluido', value: 1740 },
  { id: 'LOC-2056', client: 'Sindicato dos Metalúrgicos', city: 'Gama', equip: 'TND-0014', start: '2026-11-14', status: 'assinatura', value: 5120.75 },
  { id: 'LOC-2057', client: 'Administração Regional do Guará', city: 'Guará I', equip: 'BQ-0149', start: '2026-11-02', status: 'andamento', value: 2095 },
  { id: 'LOC-2058', client: 'Cia. de Obras Esplanada', city: 'Noroeste', equip: 'PIA-0034', start: '2026-10-08', status: 'atrasado', value: 6310.6 },
  { id: 'LOC-2059', client: 'Clube Unidade de Vizinhança', city: 'Asa Norte', equip: 'ALA-0118', start: '2026-11-11', status: 'agendado', value: 1385.9 },
  { id: 'LOC-2060', client: 'Feira do Produtor Rural', city: 'Núcleo Bandeirante', equip: 'BAL-0009', start: '2026-10-25', status: 'concluido', value: 960 },
  { id: 'LOC-2061', client: 'Residencial Vila Verde', city: 'Sobradinho', equip: 'BQ-0190', start: '2026-11-04', status: 'andamento', value: 1830.35 },
  { id: 'LOC-2062', client: 'Festival Raízes do Planalto', city: 'Estádio Nacional', equip: 'BQ-0201', start: '2026-11-15', status: 'assinatura', value: 14920 },
  { id: 'LOC-2063', client: 'Prefeitura Comunitária do Varjão', city: 'Varjão', equip: 'FEC-0024', start: '2026-10-17', status: 'parado', value: 0 },
  { id: 'LOC-2064', client: 'Buffet Aurora', city: 'Lago Sul', equip: 'TRL-0005', start: '2026-11-07', status: 'concluido', value: 4480 },
  { id: 'LOC-2065', client: 'Eventos Capital', city: 'Asa Sul', equip: 'PCD-0026', start: '2026-11-13', status: 'agendado', value: 1120.45 },
  { id: 'LOC-2066', client: 'Associação Comercial de Taguatinga', city: 'Taguatinga Norte', equip: 'BQ-0210', start: '2026-10-12', status: 'concluido', value: 3015 },
]

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

function sortRows(rows: Locacao[], sort: SortState | null): Locacao[] {
  if (!sort) return rows
  const dir = sort.dir === 'asc' ? 1 : -1
  const get = (r: Locacao): string | number => {
    switch (sort.key) {
      case 'client':
        return r.client
      case 'equip':
        return r.equip
      case 'start':
        return r.start
      case 'status':
        return STATUS[r.status].label
      default:
        return r.value
    }
  }
  return [...rows].sort((a, b) => {
    const x = get(a)
    const y = get(b)
    return (typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y))) * dir
  })
}

function makeColumns(opts: { secondary: boolean }): TableColumn<Locacao>[] {
  return [
    {
      key: 'client',
      header: 'Cliente',
      sortable: true,
      minWidth: 200,
      mobile: 'title',
      render: (r) => r.client,
      secondary: opts.secondary ? (r) => `${r.id} · ${r.city}` : undefined,
      titleText: (r) => r.client,
    },
    { key: 'equip', header: 'Equipamento', sortable: true, width: 140, render: (r) => <span className="tnum font-semibold">{r.equip}</span> },
    { key: 'start', header: 'Início', sortable: true, width: 120, render: (r) => <span className="tnum">{formatDate(r.start)}</span> },
    {
      key: 'status',
      header: 'Situação',
      sortable: true,
      width: 200,
      mobile: 'status',
      render: (r) => <StatusDot tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusDot>,
    },
    { key: 'value', header: 'Valor', sortable: true, align: 'right', width: 140, mobile: 'value', render: (r) => <Money variant="cell" value={r.value} /> },
  ]
}

const STATE_COLUMNS: TableColumn<Locacao>[] = [
  { key: 'client', header: 'Cliente', minWidth: 200, mobile: 'title', render: (r) => r.client },
  { key: 'status', header: 'Situação', width: 180, mobile: 'status', render: (r) => <StatusDot tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusDot> },
  { key: 'value', header: 'Valor', align: 'right', width: 130, mobile: 'value', render: (r) => <Money variant="cell" value={r.value} /> },
]

const PAGE_SIZE = 10

/* ───────────────────────── tabela interativa ───────────────────────── */

function InteractiveTable() {
  const [query, setQuery] = React.useState('')
  const [onlyLate, setOnlyLate] = React.useState(false)
  const [sort, setSort] = React.useState<SortState | null>({ key: 'start', dir: 'desc' })
  const [page, setPage] = React.useState(1)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [message, setMessage] = React.useState('')
  const columns = React.useMemo(() => makeColumns({ secondary: true }), [])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return LOCACOES.filter((r) => (!onlyLate || r.status === 'atrasado') && (!q || `${r.client} ${r.equip} ${r.id}`.toLocaleLowerCase('pt-BR').includes(q)))
  }, [query, onlyLate])
  const sorted = React.useMemo(() => sortRows(filtered, sort), [filtered, sort])
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageRows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const pageTotal = pageRows.reduce((s, r) => s + r.value, 0)
  const filtering = query.trim() !== '' || onlyLate

  const clear = () => {
    setQuery('')
    setOnlyLate(false)
    setPage(1)
  }

  return (
    <div>
      <Table
        label="Locações"
        title="Locações"
        countLabel={`${filtered.length} locações`}
        columns={columns}
        rows={pageRows}
        getRowId={(r) => r.id}
        getRowLabel={(r) => `${r.client}, ${r.id}`}
        state={filtered.length === 0 ? (filtering ? 'noResults' : 'empty') : 'ready'}
        noResultsTitle="Nenhuma locação com esses filtros"
        onClearFilters={clear}
        sort={sort}
        onSortChange={(s) => (setSort(s), setPage(1))}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(r) => setMessage(`Abrindo ${r.id}, ${r.client}.`)}
        onRowActions={(r) => setMessage(`Ações da locação ${r.id} abertas.`)}
        pagination={{ page: current, pageSize: PAGE_SIZE, total: sorted.length, onPageChange: setPage }}
        unit="locações"
        totals={{ label: 'Total da página', cells: { value: <Money variant="cell" value={pageTotal} /> } }}
        toolbar={
          <>
            <Input
              aria-label="Buscar locação"
              placeholder="Buscar cliente ou equipamento"
              prefix={<Search size={16} strokeWidth={2} aria-hidden />}
              value={query}
              onChange={(e) => (setQuery(e.target.value), setPage(1))}
              className="w-full sm:w-[280px]"
            />
            <Button size="sm" aria-pressed={onlyLate} onClick={() => (setOnlyLate((v) => !v), setPage(1))} className={onlyLate ? 'bg-accent-soft text-accent-ink' : undefined}>
              Só atrasadas
            </Button>
          </>
        }
        actions={
          <>
            {selected.size > 0 ? <Badge tone="accent">{selected.size} selecionadas</Badge> : null}
            <Button variant="primary" icon={Plus}>
              Nova locação
            </Button>
          </>
        }
      />
      <p className="mt-2 min-h-4 text-caption text-fg-3" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}

/* ───────────────────────── seção ───────────────────────── */

const MESES = [
  { key: '2025-12', label: 'Dez', value: 30480 },
  { key: '2026-01', label: 'Jan', value: 28915 },
  { key: '2026-02', label: 'Fev', value: 33260 },
  { key: '2026-03', label: 'Mar', value: 34870 },
  { key: '2026-04', label: 'Abr', value: 37405 },
  { key: '2026-05', label: 'Mai', value: 38120 },
  { key: '2026-06', label: 'Jun', value: 36240 },
  { key: '2026-07', label: 'Jul', value: 39815 },
  { key: '2026-08', label: 'Ago', value: 35470 },
  { key: '2026-09', label: 'Set', value: 41120 },
  { key: '2026-10', label: 'Out', value: 42986.4 },
  { key: '2026-11', label: 'Nov', value: 48312.9 },
]

const DIAS = [
  ['29/10', 34, 18],
  ['30/10', 38, 22],
  ['31/10', 12, 7],
  ['01/11', 9, 5],
  ['02/11', 41, 25],
  ['03/11', 44, 27],
  ['04/11', 37, 21],
  ['05/11', 36, 19],
  ['06/11', 40, 24],
  ['07/11', 13, 6],
  ['08/11', 8, 4],
  ['09/11', 43, 26],
  ['10/11', 46, 29],
  ['11/11', 39, 23],
] as const

const CATEGORIAS = [
  { key: 'bq', label: 'Banheiro', value: 21480 },
  { key: 'tnd', label: 'Tenda', value: 12960 },
  { key: 'trl', label: 'Trailer', value: 9240 },
  { key: 'ala', label: 'Grade', value: 4632.9 },
  { key: 'par', label: 'Parado', value: 3980, idle: true },
]

const FOTOS: PhotoItem[] = [
  { id: 'f1', src: '/produtos/banheiro-quimico.jpg', alt: 'Porta da BQ-0142 após a limpeza' },
  { id: 'f2', src: '/produtos/tenda.jpg', alt: 'Tenda TND-0008 montada no Parque da Cidade' },
  { id: 'f3', src: '/produtos/trailer.jpg', alt: 'Trailer TRL-0003 no pátio, antes da retirada' },
  { id: 'f4', src: '/produtos/alambrado.jpg', alt: 'Alambrado ALA-0112 instalado na obra' },
  { id: 'f5', src: '/produtos/fechamento.jpg', alt: 'Fechamento FEC-0021 com avaria no painel' },
  { id: 'f6', src: '/produtos/balcao.jpg', alt: 'Balcão BAL-0006 entregue ao buffet' },
]

const TIMELINE: TimelineGroup[] = [
  {
    label: 'Hoje',
    events: [
      {
        id: 'e1',
        icon: TriangleAlert,
        tone: 'danger',
        title: 'Avaria registrada na BQ-0142',
        meta: '11/11/2026 às 14:32 · Marcos Vieira',
        photo: { src: '/produtos/banheiro-quimico.jpg', alt: 'Porta da BQ-0142 com a trava quebrada' },
        amount: 420,
      },
      { id: 'e2', icon: Banknote, tone: 'ok', title: 'Pagamento recebido', meta: '11/11/2026 às 10:05 · Cobrança 0318', amount: 3184.5 },
    ],
  },
  {
    label: 'Ontem',
    events: [
      { id: 'e3', icon: Sparkles, title: 'Limpeza concluída, 12 unidades', meta: '10/11/2026 às 09:48 · Equipe 2', photo: { src: '/produtos/fechamento.jpg', alt: 'Área de banheiros após a limpeza' } },
      { id: 'e4', icon: Truck, tone: 'info', title: 'Entrega, 6 unidades', meta: '10/11/2026 às 07:30 · Equipe 1' },
    ],
  },
  { label: '03/11/2026', events: [{ id: 'e5', icon: FileText, title: 'Contrato assinado', meta: '03/11/2026 às 16:12 · Ana Beatriz Souza' }] },
]

export default function DataSection() {
  const [periodo, setPeriodo] = React.useState('6')
  const [dias, setDias] = React.useState('14')
  const [fotos, setFotos] = React.useState<PhotoItem[]>(FOTOS)

  const meses = periodo === '6' ? MESES.slice(-6) : MESES
  const serie = dias === '7' ? DIAS.slice(-7) : DIAS
  const trendData = serie.map(([label, limpeza, entrega]) => ({ label, limpeza, entrega }))

  const addFotos = (files: File[]) => {
    setFotos((cur) => [...cur, ...files.map((f, i) => ({ id: `n${Date.now()}${i}`, src: URL.createObjectURL(f), alt: `Foto nova de ${f.name}` }))])
  }

  const stateRows = LOCACOES.slice(0, 3)

  return (
    <DsSection
      id="dados"
      title="Dados"
      intro="Tabela, linha de serviço, gráficos, linha do tempo, foto e QR."
    >
      <Specimen
        title="Tabela de locações"
        note="Ordene, marque, pagine e busque."
      >
        <InteractiveTable />
      </Specimen>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Specimen title="Densidade compacta" note="40px por linha, para listas longas.">
          <Table label="Locações, lista compacta" density="compact" columns={makeColumns({ secondary: false }).filter((c) => c.key !== 'start')} rows={LOCACOES.slice(0, 12)} getRowId={(r) => r.id} title="Lista longa" countLabel="12 de 128 locações" maxBodyHeight={360} />
        </Specimen>
        <Specimen title="Lista de linhas no celular" note="Abaixo de 768px a tabela vira lista.">
          <div className="max-w-[390px]">
            <Table
              label="Locações, lista"
              layout="list"
              selectable
              selected={new Set([LOCACOES[1].id])}
              onSelectedChange={() => {}}
              columns={makeColumns({ secondary: true })}
              rows={LOCACOES.slice(0, 5)}
              getRowId={(r) => r.id}
              getRowLabel={(r) => r.client}
              onRowClick={() => {}}
              totals={{ label: 'Total', cells: { value: <Money variant="cell" value={LOCACOES.slice(0, 5).reduce((s, r) => s + r.value, 0)} /> } }}
            />
          </div>
        </Specimen>
      </div>

      <Specimen title="Estados da tabela" note="Carregando, vazio, erro e sem resultado.">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {(
            [
              ['loading', 'Carregando'],
              ['empty', 'Vazio'],
              ['error', 'Erro'],
              ['noResults', 'Sem resultado'],
            ] as [TableState, string][]
          ).map(([state, name]) => (
            <div key={state} className="min-w-0">
              <p className="mb-2 text-caption text-fg-3">{name}</p>
              <Table
                label={`Locações, ${name.toLowerCase()}`}
                title="Locações"
                columns={STATE_COLUMNS}
                rows={state === 'loading' ? [] : stateRows}
                getRowId={(r) => r.id}
                state={state}
                emptyTitle="As locações aparecem aqui"
                emptyText="Crie a primeira locação para acompanhar entregas, limpezas e cobranças."
                emptyAction={
                  <Button variant="primary" icon={Plus}>
                    Nova locação
                  </Button>
                }
                errorText="Confira a conexão e tente de novo."
                onRetry={() => {}}
                onClearFilters={() => {}}
                noResultsTitle="Nenhuma locação com esses filtros"
              />
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen title="Linha de serviço" note="Agenda do escritório, um item por situação.">
        <Card padding="none" className="max-w-3xl overflow-hidden">
          <ul className="m-0 list-none p-0">
            <ServiceRow time="07:30" duration="1 h 30" type="limpeza" title="Limpeza, 12 unidades" client="Construtora Planalto" address="SQN 308, Asa Norte" status="concluido" badges={[{ label: 'Equipe 2' }]} onOpen={() => {}} />
            <ServiceRow time="09:00" duration="2 h" type="entrega" title="Entrega, 6 unidades" client="Produtora Cerrado Vivo" address="Parque da Cidade, estacionamento 10" status="em-andamento" badges={[{ label: 'Equipe 1' }]} onOpen={() => {}} />
            <ServiceRow
              time="10:30"
              duration="45 min"
              type="limpeza"
              title="Limpeza, 8 unidades"
              client="Administração Regional do Guará"
              address="QE 25, Guará II"
              status="atrasado"
              badges={[{ label: 'Equipe 3' }, { label: 'Extra', tone: 'warn' }]}
              onOpen={() => {}}
            />
            <ServiceRow time="13:00" duration="1 h" type="retirada" title="Retirada, 4 unidades" client="Residencial Vila Verde" address="Quadra 5, Sobradinho" status="a-caminho" badges={[{ label: 'Equipe 1' }]} onOpen={() => {}} />
            <ServiceRow time="14:30" duration="1 h 30" type="manutencao" title="Manutenção, 2 unidades" client="Cia. de Obras Esplanada" address="Pátio R8, SIA Trecho 3" status="agendado" badges={[{ label: 'Oficina' }]} onOpen={() => {}} forceHover />
            <ServiceRow time="16:00" duration="3 h" type="montagem" title="Montagem, 1 tenda 6 x 6 m" client="Igreja Batista Central" address="EQS 706/707, Asa Sul" status="agendado" onOpen={() => {}} />
          </ul>
        </Card>
        <p className="mt-6 mb-2 text-caption text-fg-3">App da equipe de rua: linha de 80px, texto 16.</p>
        <Card padding="none" className="max-w-[390px] overflow-hidden">
          <ul className="m-0 list-none p-0">
            <ServiceRow variant="field" time="09:00" duration="2 h" type="entrega" title="Entrega, 6 unidades" client="Produtora Cerrado Vivo" address="Parque da Cidade" status="em-andamento" onOpen={() => {}} />
            <ServiceRow variant="field" time="10:30" duration="45 min" type="limpeza" title="Limpeza, 8 unidades" client="Administração Regional do Guará" address="QE 25, Guará II" status="atrasado" badges={[{ label: 'Extra', tone: 'warn' }]} onOpen={() => {}} />
            <ServiceRow variant="field" time="13:00" duration="1 h" type="retirada" title="Retirada, 4 unidades" client="Residencial Vila Verde" address="Sobradinho" status="agendado" onOpen={() => {}} />
          </ul>
        </Card>
      </Specimen>

      <Specimen title="Gráficos" note="Série única na marca, período atual cheio. Para poucos meses, veja as barras em pílula.">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Faturamento por mês"
            summary={<Money value={48312.9} />}
            period={{
              label: 'Período do faturamento',
              options: [
                { value: '6', label: '6 meses' },
                { value: '12', label: '12 meses' },
              ],
              value: periodo,
              onChange: setPeriodo,
            }}
            ariaLabel="Faturamento de novembro: R$ 48.312,90, 12,4% acima de outubro"
            dataTable={{ caption: 'Faturamento por mês', headers: ['Mês', 'Faturamento'], rows: meses.map((m) => [m.label, formatMoney(m.value)]) }}
          >
            <BarSeriesChart data={meses} valueFormat={formatMoney} seriesLabel="Faturamento" />
          </ChartCard>
          <ChartCard
            title="Serviços por dia"
            summary={<span className="tnum">{trendData.reduce((s, d) => s + d.limpeza + d.entrega, 0)} serviços</span>}
            period={{
              label: 'Período dos serviços',
              options: [
                { value: '7', label: '7 dias' },
                { value: '14', label: '14 dias' },
              ],
              value: dias,
              onChange: setDias,
            }}
            ariaLabel="Serviços por dia nos últimos 14 dias: pico de 75 em 10/11, queda aos domingos"
            dataTable={{ caption: 'Serviços por dia', headers: ['Dia', 'Limpeza', 'Entrega e retirada'], rows: trendData.map((d) => [d.label, d.limpeza, d.entrega]) }}
          >
            <TrendChart
              variant="area"
              data={trendData}
              valueFormat={(v) => `${v} serviços`}
              series={[
                { key: 'limpeza', label: 'Limpeza', color: 'var(--viz-1)' },
                { key: 'entrega', label: 'Entrega e retirada', color: 'var(--viz-2)' },
              ]}
            />
          </ChartCard>
          <ChartCard
            title="Faturamento por categoria"
            summary={<Money value={48312.9} />}
            ariaLabel="Faturamento de novembro por categoria: banheiros R$ 21.480,00, tendas R$ 12.960,00, trailers R$ 9.240,00, alambrados R$ 4.632,90. Parado no pátio: R$ 3.980,00"
            dataTable={{ caption: 'Faturamento por categoria', headers: ['Categoria', 'Valor'], rows: CATEGORIAS.map((c) => [c.idle ? 'Parado no pátio' : c.label, formatMoney(c.value)]) }}
          >
            <BarSeriesChart
              data={CATEGORIAS}
              currentKey="bq"
              valueFormat={formatMoney}
              seriesLabel="Faturado"
              idleLabel="Parado no pátio"
              legend={[
                { key: 'fat', label: 'Faturado', color: 'var(--accent)' },
                { key: 'par', label: 'Parado, sem uso', hatch: true },
              ]}
            />
          </ChartCard>
          <ChartCard
            title="Ocupação da frota"
            height={200}
            ariaLabel="Ocupação da frota: 72%, 144 de 200 unidades em locação"
            dataTable={{ caption: 'Ocupação da frota', headers: ['Situação', 'Unidades'], rows: [['Em locação', 144], ['Livres', 56]] }}
          >
            <RatioDonut
              value={0.72}
              label="Em locação"
              restLabel="Livres"
              details={
                <dl className="m-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="size-2 rounded-[2px] bg-accent" />
                    <dt className="text-fg-2">Em locação</dt>
                    <dd className="tnum m-0 ml-auto font-semibold text-fg">144</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="size-2 rounded-[2px] bg-sunken ring-1 ring-edge ring-inset" />
                    <dt className="text-fg-2">Livres</dt>
                    <dd className="tnum m-0 ml-auto font-semibold text-fg">56</dd>
                  </div>
                  <div className="flex items-center gap-2 border-t border-strong pt-2">
                    <dt className="font-semibold text-fg">Frota</dt>
                    <dd className="tnum m-0 ml-auto font-semibold text-fg">200</dd>
                  </div>
                </dl>
              }
            />
          </ChartCard>
          <ChartCard title="Receita por semana" state="loading" ariaLabel="Carregando" height={240}>
            {null}
          </ChartCard>
          <ChartCard title="Receita por semana" state="empty" emptyText="Sem locações neste período" ariaLabel="Sem dados" height={240}>
            {null}
          </ChartCard>
        </div>
        <div className="mt-4 max-w-2xl">
          <ChartCard title="Avarias por semana" summary={<span className="tnum">17 avarias</span>} ariaLabel="Avarias por semana: 2, 3, 1, 4, 2, 5" height={200} dataTable={{ caption: 'Avarias por semana', headers: ['Semana', 'Avarias'], rows: [['S1', 2], ['S2', 3], ['S3', 1], ['S4', 4], ['S5', 2], ['S6', 5]] }}>
            <TrendChart variant="line" data={['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((label, i) => ({ label, avarias: [2, 3, 1, 4, 2, 5][i] }))} valueFormat={(v) => `${v} avarias`} axisFormat={(v) => String(v)} series={[{ key: 'avarias', label: 'Avarias', color: 'var(--accent)' }]} />
          </ChartCard>
        </div>
      </Specimen>

      <Specimen title="Linha do tempo do dossiê" note="Agrupada por dia. Cabe no trilho de 336px.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="min-w-0">
            <Timeline groups={TIMELINE} />
          </Card>
          <Card className="min-w-0">
            <p className="mb-4 text-caption text-fg-3">Carregando</p>
            <Timeline groups={[]} loading />
          </Card>
          <Card className="min-w-0">
            <p className="mb-4 text-caption text-fg-3">Vazio</p>
            <Timeline groups={[]} />
          </Card>
        </div>
      </Specimen>

      <Specimen title="Foto" note="64px na lista, 96px na grade do campo.">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col items-start gap-2">
              <PhotoThumb src="/produtos/banheiro-quimico.jpg" alt="Porta da BQ-0142 após a limpeza" size={64} />
              <span className="text-caption text-fg-3">Pronta, 64</span>
            </div>
            <div className="flex flex-col items-start gap-2">
              <PhotoThumb src="/produtos/tenda.jpg" alt="Tenda em carregamento" size={64} state="loading" />
              <span className="text-caption text-fg-3">Carregando</span>
            </div>
            <div className="flex flex-col items-start gap-2">
              <PhotoThumb src="/produtos/inexistente.jpg" alt="Foto que não abriu" size={64} state="error" />
              <span className="text-caption text-fg-3">Erro</span>
            </div>
            <div className="flex flex-col items-start gap-2">
              <PhotoThumb src="/produtos/trailer.jpg" alt="Trailer TRL-0003 no pátio" size={96} />
              <span className="text-caption text-fg-3">Pronta, 96</span>
            </div>
            <div className="flex flex-col items-start gap-2">
              <AddPhoto onFiles={addFotos} />
              <span className="text-caption text-fg-3">Adicionar</span>
            </div>
            <div className="flex flex-col items-start gap-2">
              <AddPhoto loading />
              <span className="text-caption text-fg-3">Enviando</span>
            </div>
          </div>
          <div>
            <p className="mb-2 text-caption text-fg-3">Grade do campo ({fotos.length} fotos)</p>
            <Card className="max-w-[390px]">
              <PhotoGrid photos={fotos}>
                <AddPhoto onFiles={addFotos} />
              </PhotoGrid>
            </Card>
          </div>
        </div>
      </Specimen>

      <Specimen title="QR do equipamento" note="Preto sobre branco nos dois temas. 160px na tela, 3 cm na impressão.">
        <div className="flex flex-wrap items-start gap-8">
          <QrTile value="https://app.r8.example/equipamentos/BQ-0142" code="BQ-0142" name="Banheiro químico standard" />
          <QrTile value="https://app.r8.example/equipamentos/PCD-0017" code="PCD-0017" name="Banheiro químico PCD" />
        </div>
      </Specimen>
    </DsSection>
  )
}
