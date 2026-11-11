import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Download, FileWarning, PackageOpen, Plus, ReceiptText, Route, Send, Sparkles, Truck, type LucideIcon } from 'lucide-react'
import { ArcGauge, Banner, Button, Money, MapaDF, MoneyCard, PillBars, Segmented, Skeleton, Tooltip, cn, notify, type MapPin, type MapRoute } from '@/ui'
import { PageHeader } from '@/app/PageHeader'
import { SERVICE_STATUS } from '@/app/status'
import { BAIRRO, BASE } from '@/data/geo'
import { MONTHS_LONG, MONTHS_SHORT, today } from '@/domain/dates'
import { formatMoney, formatPercent } from '@/lib/format'
import {
  getDailySummary,
  getMoneyPanel,
  getReceivables,
  listServices,
  useLabels,
  useQuery,
  useSettings,
  type MoneyPanel,
  type RecommendedAction,
  type ServiceView,
} from '@/services'
import { openCopiloto } from '@/modules/copiloto'

type Periodo = '6m' | '12m'

const ACAO: Record<RecommendedAction['kind'], { icon: LucideIcon; tone: string }> = {
  redistribuir_rota: { icon: Route, tone: 'bg-danger-soft text-danger-ink' },
  cobrar_avarias: { icon: FileWarning, tone: 'bg-danger-soft text-danger-ink' },
  faturar_extras: { icon: ReceiptText, tone: 'bg-warn-soft text-warn-ink' },
  cobrar_atrasados: { icon: Send, tone: 'bg-info-soft text-info-ink' },
  alugar_parados: { icon: PackageOpen, tone: 'bg-sunken text-fg-2' },
  confirmar_orcamentos: { icon: ReceiptText, tone: 'bg-sunken text-fg-2' },
}

const ACAO_ROTA: Record<RecommendedAction['kind'], string> = {
  redistribuir_rota: '/operacao',
  cobrar_avarias: '/avarias?status=registrada',
  faturar_extras: '/avarias?aba=extras',
  cobrar_atrasados: '/financeiro?status=atrasada',
  alugar_parados: '/equipamentos?status=disponivel',
  confirmar_orcamentos: '/locacoes?status=orcamento',
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Pino de cada equipe: no serviço em andamento ou a caminho; senão no atrasado, no próximo ou no último concluído */
function buildMap(panel: MoneyPanel, services: ServiceView[]) {
  const pins: MapPin[] = []
  const routes: MapRoute[] = []
  const used = new Map<string, number>()
  for (const t of panel.teamsNow) {
    if (t.status === 'sem_servico') continue
    const mine = services.filter((s) => s.teamId === t.team.id && s.status !== 'cancelado')
    const target =
      mine.find((s) => s.id === t.current?.id) ??
      mine.find((s) => s.status === 'atrasado') ??
      mine.find((s) => s.status === 'agendado') ??
      [...mine].reverse().find((s) => s.status === 'concluido')
    const b = target && BAIRRO[target.bairroId]
    if (!target || !b) continue
    const n = used.get(b.id) ?? 0
    used.set(b.id, n + 1)
    const x = b.x + n * 16
    const y = b.y + n * 12
    const tone = t.status === 'atrasada' ? 'danger' : t.status === 'em_servico' ? 'accent' : t.status === 'a_caminho' ? 'info' : t.status === 'concluida' ? 'ok' : 'neutral'
    pins.push({
      id: t.team.id,
      x,
      y,
      label: t.team.initials,
      title: `${t.team.name}: ${target.typeLabel.toLowerCase()} ${SERVICE_STATUS[target.status].label.toLowerCase()} em ${b.name}`,
      tone,
      pulse: t.status === 'em_servico' || t.status === 'a_caminho',
    })
    if (t.status === 'em_servico' || t.status === 'a_caminho') {
      const dx = x - BASE.x
      const dy = y - BASE.y
      const bend = 0.12
      routes.push({
        id: t.team.id,
        dashed: t.status === 'a_caminho',
        points: [
          { x: BASE.x, y: BASE.y },
          { x: BASE.x + dx * 0.33 - dy * bend, y: BASE.y + dy * 0.33 + dx * bend },
          { x: BASE.x + dx * 0.66 - dy * bend * 0.6, y: BASE.y + dy * 0.66 + dx * bend * 0.6 },
          { x, y },
        ],
      })
    }
  }
  return { pins, routes }
}

/** Recorte do mapa que enquadra a base e todos os pinos, na proporção do cartão */
function fitBox(pins: MapPin[], ratio: number): [number, number, number, number] {
  const xs = [BASE.x, ...pins.map((p) => p.x)]
  const ys = [BASE.y, ...pins.map((p) => p.y)]
  const pad = 90
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  let w = Math.max(maxX - minX, (maxY - minY) * ratio, 420)
  const h = w / ratio
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  w = Math.min(w, 940)
  return [Math.max(20, cx - w / 2), Math.max(20, cy - h / 2), w, h]
}

function csvEscape(v: string | number) {
  const s = String(v)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const num = (n: number) => n.toFixed(2).replace('.', ',')

function exportCsv(panel: MoneyPanel, overdueByAge: { label: string; value: number }[]) {
  const rows: (string | number)[][] = [
    ['Indicador', 'Valor', 'Quantidade'],
    ['Alugado hoje', num(panel.rentedToday.value), panel.rentedToday.units],
    ['Parado no depósito (por mês)', num(panel.idle.monthlyValue), panel.idle.units],
    ['Avarias não cobradas', num(panel.uncollectedDamages.value), panel.uncollectedDamages.count],
    ['Extras não faturados', num(panel.unbilledExtras.value), panel.unbilledExtras.count],
    ['A receber', num(panel.receivable.value), panel.receivable.count],
    ['Atrasados', num(panel.overdue.value), panel.overdue.count],
    ['Ocupação do estoque (%)', num(panel.occupancy.pct), panel.occupancy.total],
    ...overdueByAge.map((f) => [`A receber: ${f.label}`, num(f.value), ''] as (string | number)[]),
    [],
    ['Mês', 'Receita', ''],
    ...panel.revenueByMonth.map((m) => [m.month, num(m.value), ''] as (string | number)[]),
  ]
  const text = '﻿' + rows.map((r) => r.map(csvEscape).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `painel-${today()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function PainelSkeleton() {
  const sec = 'min-w-0 rounded-card bg-raised p-5 sm:p-6'
  return (
    <div aria-busy="true" aria-label="Carregando o painel">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(sec, 'flex h-[168px] flex-col justify-between')}>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <div className={cn(sec, 'h-[320px] @min-[1180px]/frame:col-span-4')}>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-6 h-9 w-40" />
          <Skeleton shape="block" className="mt-6 h-[150px]" />
        </div>
        <div className={cn(sec, 'h-[320px] @min-[1180px]/frame:col-span-3')}>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-6 h-9 w-40" />
          <Skeleton className="mt-8 h-3.5 rounded-pill" />
        </div>
        <div className={cn(sec, 'h-[320px] @min-[1180px]/frame:col-span-5')}>
          <Skeleton className="h-5 w-32" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="mt-4 h-11 rounded-pill" />
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <div className={cn(sec, 'h-[340px] @min-[1180px]/frame:col-span-5')}>
          <Skeleton shape="block" className="h-full" />
        </div>
        <div className={cn(sec, 'h-[340px] @min-[1180px]/frame:col-span-4')}>
          <Skeleton className="h-5 w-40" />
          <Skeleton shape="block" className="mt-6 h-[140px]" />
        </div>
        <div className={cn(sec, 'h-[340px] @min-[1180px]/frame:col-span-3')}>
          <Skeleton shape="block" className="h-full" />
        </div>
      </div>
    </div>
  )
}

function CopilotCardDark() {
  const q = useQuery(getDailySummary, [])
  const n = q.data?.numbers
  return (
    <section aria-label="Copiloto" className="ds-copilot relative flex min-w-0 flex-col overflow-hidden rounded-card p-5 sm:p-6 @min-[1180px]/frame:col-span-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-title-sub">
          <Sparkles size={18} strokeWidth={2} aria-hidden />
          Copiloto
        </h2>
        <span className="rounded-pill bg-white/15 px-2.5 py-1 text-caption font-semibold">Pacote IA</span>
      </div>
      <ul className="mt-5 flex flex-col gap-3" aria-busy={!n || undefined}>
        {n ? (
          <>
            <li>
              <span className="block text-kpi">{n.servicesToday}</span>
              <span className="text-body text-white/75">{n.atRisk ? `serviços hoje, ${n.atRisk} em risco` : 'serviços hoje'}</span>
            </li>
            <li>
              <span className="block text-kpi">{formatMoney(n.toCollect)}</span>
              <span className="text-body text-white/75">prontos para cobrar</span>
            </li>
          </>
        ) : (
          <>
            <li>
              <Skeleton className="h-9 w-16 bg-white/15" />
            </li>
            <li>
              <Skeleton className="h-9 w-40 bg-white/15" />
            </li>
          </>
        )}
      </ul>
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={openCopiloto}
          className="inline-flex h-11 items-center justify-center rounded-pill bg-white px-5 text-body font-semibold text-black transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ver propostas
        </button>
      </div>
    </section>
  )
}

export default function Painel() {
  const navigate = useNavigate()
  const l = useLabels()
  const { aiEnabled } = useSettings()
  const [periodo, setPeriodo] = React.useState<Periodo>('6m')
  const panelQ = useQuery(getMoneyPanel, [])
  const recQ = useQuery(getReceivables, [])
  const svcQ = useQuery(() => listServices({ date: today() }), [])
  const panel = panelQ.data
  // proporção do cartão do mapa, para o recorte enquadrar todos os pinos
  const [mapRatio, setMapRatio] = React.useState(1.7)
  const mapRef = React.useRef<HTMLDivElement | null>(null)
  const mapNode = React.useCallback((el: HTMLDivElement | null) => {
    mapRef.current = el
  }, [])
  const rec = recQ.data

  const aging = React.useMemo(() => {
    if (!rec) return []
    const by = rec.byAging
    const sum = (from: number, to: number) => by.slice(from, to).reduce((a, b) => a + b.value, 0)
    return [
      { label: 'Em dia', value: by[0]?.value ?? 0, cls: 'bg-accent' },
      { label: 'Até 15 dias', value: by[1]?.value ?? 0, cls: 'bg-warn' },
      { label: 'Mais de 15 dias', value: sum(2, by.length), cls: 'bg-danger' },
    ]
  }, [rec])

  const map = React.useMemo(() => (panel ? buildMap(panel, svcQ.data ?? []) : { pins: [], routes: [] }), [panel, svcQ.data])

  const revenue = React.useMemo(() => {
    if (!panel) return undefined
    const all = panel.revenueByMonth
    const last = all.length - 1
    const bars = all.map((m, i) => {
      const mi = Number(m.month.slice(5, 7)) - 1
      return {
        label: cap(MONTHS_SHORT[mi]),
        fullLabel: i === last ? `${cap(MONTHS_LONG[mi])}, até hoje` : cap(MONTHS_LONG[mi]),
        value: m.value,
        // o mês corrente ainda está aberto: o destaque fica no último mês fechado
        tone: i === last - 1 ? ('strong' as const) : i === last - 2 ? ('solid' as const) : undefined,
      }
    })
    const cur = all[last - 1]?.value ?? 0
    const prev = all[last - 2]?.value ?? 0
    return { bars, cur, delta: prev > 0 ? (cur - prev) / prev : undefined }
  }, [panel])

  // as quatro que recuperam dinheiro primeiro; rota e orçamentos só completam a lista
  const actions = React.useMemo(() => {
    const all = panel?.actions ?? []
    const core: RecommendedAction['kind'][] = ['cobrar_avarias', 'faturar_extras', 'cobrar_atrasados', 'alugar_parados']
    return [...all.filter((a) => core.includes(a.kind)), ...all.filter((a) => !core.includes(a.kind))].slice(0, 4)
  }, [panel])
  const actionTitle = (a: RecommendedAction) => {
    switch (a.kind) {
      case 'redistribuir_rota':
        return `Redistribuir ${plural(a.count, 'serviço atrasado', 'serviços atrasados')}`
      case 'cobrar_avarias':
        return `Cobrar ${a.count} ${a.count === 1 ? l.damage : l.damagePlural}`
      case 'faturar_extras':
        return `Faturar ${plural(a.count, 'extra', 'extras')}`
      case 'cobrar_atrasados':
        return `Cobrar ${plural(a.count, 'fatura atrasada', 'faturas atrasadas')}`
      case 'alugar_parados':
        return `Alugar ${a.count} ${a.count === 1 ? l.unit : l.unitPlural} parados`
      case 'confirmar_orcamentos':
        return `Fechar ${plural(a.count, 'orçamento', 'orçamentos')}`
    }
  }

  const ready = Boolean(panel && rec && revenue)
  React.useEffect(() => {
    const el = mapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      if (r.width && r.height) setMapRatio(Math.round((r.width / r.height) * 20) / 20)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ready])

  const header = (
    <PageHeader
      title="Painel de dinheiro"
      actions={
        <>
          <Button variant="primary" size="lg" icon={Plus} onClick={() => navigate('/locacoes/nova')}>
            Nova locação
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={Download}
            disabled={!panel || !rec}
            onClick={() => {
              if (!panel || !rec) return
              try {
                exportCsv(panel, aging)
                notify.success('Indicadores exportados')
              } catch {
                notify.error('Não foi possível exportar. Tente de novo.')
              }
            }}
          >
            Exportar
          </Button>
        </>
      }
    />
  )

  if (panelQ.error && !panel) {
    return (
      <>
        {header}
        <Banner tone="danger" title="Não foi possível carregar o painel." action={<Button size="sm" variant="secondary" onClick={() => void panelQ.refetch()}>Tentar de novo</Button>} />
      </>
    )
  }
  if (!panel || !rec || !revenue) {
    return (
      <>
        {header}
        <PainelSkeleton />
      </>
    )
  }

  const { rentedToday, idle, uncollectedDamages, unbilledExtras, receivable, overdue, occupancy } = panel
  const deltaTag =
    rentedToday.deltaPct === 0
      ? { label: '0%' }
      : { label: formatPercent(rentedToday.deltaPct / 100, { sign: true }), dir: rentedToday.deltaPct > 0 ? ('up' as const) : ('down' as const) }
  const agingTotal = aging.reduce((a, f) => a + f.value, 0)
  const maint = occupancy.maintenance
  const cleaningLabel = maint ? 'Limpeza e manutenção' : cap(l.cleaning)
  const gaugeLimpeza = occupancy.cleaning + maint

  return (
    <>
      {header}

      {/* 1. os quatro números */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
        <MoneyCard
          hero
          title="Alugado hoje"
          value={rentedToday.value}
          tag={deltaTag}
          formula={`${rentedToday.units} de ${rentedToday.totalUnits} ${l.unitPlural} em campo hoje × valor mensal de tabela de cada uma.`}
          onOpen={() => navigate('/equipamentos?status=em_campo')}
        />
        <MoneyCard
          title="Parado no depósito"
          value={idle.monthlyValue}
          formula={`${idle.units} ${idle.units === 1 ? l.unit : l.unitPlural} sem locação × valor mensal de tabela de cada uma. É o que deixa de render por mês.`}
          onOpen={() => navigate('/equipamentos?status=disponivel')}
        />
        <MoneyCard
          title="Avarias não cobradas"
          value={uncollectedDamages.value}
          formula={`${uncollectedDamages.count} ${uncollectedDamages.count === 1 ? `${l.damage} registrada` : `${l.damagePlural} registradas`} em campo que ainda não ${uncollectedDamages.count === 1 ? 'virou cobrança' : 'viraram cobrança'}.`}
          onOpen={() => navigate('/avarias?status=registrada')}
        />
        <MoneyCard
          title="Extras não faturados"
          value={unbilledExtras.value}
          formula={`${plural(unbilledExtras.count, 'serviço fora do contrato feito', 'serviços fora do contrato feitos')} em ${plural(unbilledExtras.rentals, 'locação', 'locações')} e ainda fora de fatura.`}
          onOpen={() => navigate('/avarias?aba=extras')}
        />
      </div>

      {/* 2. receita, cobrança e o que fazer hoje */}
      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-title-sub">Receita</h2>
            <Segmented<Periodo>
              label="Período"
              size="sm"
              value={periodo}
              onChange={setPeriodo}
              options={[
                { value: '6m', label: '6 meses' },
                { value: '12m', label: '12 meses' },
              ]}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="text-kpi">
              <Money value={revenue.cur} variant="kpi" />
            </p>
            {revenue.delta !== undefined ? (
              <span className={cn('mb-1 inline-flex h-6 items-center rounded-pill px-2 text-caption font-semibold', revenue.delta >= 0 ? 'bg-ok-soft text-ok-ink' : 'bg-danger-soft text-danger-ink')}>
                {formatPercent(revenue.delta, { sign: true })}
              </span>
            ) : null}
          </div>
          <PillBars key={periodo} className="mt-1" height={150} defaultActive={(periodo === '6m' ? 6 : revenue.bars.length) - 2} data={periodo === '6m' ? revenue.bars.slice(-6) : revenue.bars} format={(v) => formatMoney(v)} label="Receita por mês" />
        </section>

        <section className="flex min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-3">
          <h2 className="text-title-sub">A receber</h2>
          <p className="mt-2 text-kpi">
            <Money value={receivable.value} variant="kpi" />
          </p>

          <div
            className="mt-5 flex h-3.5 gap-1"
            role="img"
            aria-label={`A receber por idade: ${aging.map((f) => `${formatMoney(f.value)} ${f.label.toLowerCase()}`).join(', ')}`}
          >
            {agingTotal > 0 ? (
              aging
                .filter((f) => f.value > 0)
                .map((f) => (
                  <Tooltip key={f.label} content={`${f.label}: ${formatMoney(f.value)}`}>
                    <span tabIndex={0} className={cn('min-w-3 rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', f.cls)} style={{ flexGrow: f.value }} />
                  </Tooltip>
                ))
            ) : (
              <span className="flex-1 rounded-pill bg-sunken" />
            )}
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2 text-body font-medium text-fg-2">
              <span aria-hidden className="size-2.5 rounded-pill bg-danger" />
              Atrasados
            </span>
            <span className="text-title-sub text-danger-ink">{formatMoney(overdue.value)}</span>
          </div>

          <div className="mt-auto pt-6">
            <Button variant="primary" size="lg" block icon={Send} onClick={() => navigate('/financeiro?status=atrasada')}>
              Cobrar atrasados
            </Button>
          </div>
        </section>

        <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-5">
          <h2 className="text-title-sub">Para fazer hoje</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {actions.map((a) => {
              const k = ACAO[a.kind]
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => navigate(ACAO_ROTA[a.kind])}
                    className="group -mx-2 flex w-[calc(100%+16px)] items-center gap-3.5 rounded-control px-2 py-2.5 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span aria-hidden className={cn('grid size-11 shrink-0 place-items-center rounded-pill', k.tone)}>
                      <k.icon size={20} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1 text-body-lg font-medium text-fg">{actionTitle(a)}</span>
                    {a.value !== undefined ? <span className="shrink-0 text-body-lg font-semibold text-fg">{formatMoney(a.value)}</span> : null}
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-pill text-fg ring-1 ring-edge transition-colors duration-150 ring-inset group-hover:bg-fg group-hover:text-raised group-hover:ring-fg"
                    >
                      <ArrowUpRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover:rotate-45" />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* 3. operação, estoque e Copiloto */}
      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <section className={cn('flex min-w-0 flex-col rounded-card bg-raised p-2', aiEnabled ? '@min-[1180px]/frame:col-span-5' : '@min-[1180px]/frame:col-span-7')}>
          <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3 sm:px-4 sm:pt-4">
            <h2 className="text-title-sub">Na rua agora</h2>
            <Button variant="secondary" size="sm" icon={Truck} onClick={() => navigate('/operacao')}>
              Operação
            </Button>
          </div>
          <div ref={mapNode} className="relative min-h-[260px] flex-1 overflow-hidden rounded-[16px]">
            <MapaDF
              pins={map.pins}
              routes={map.routes}
              labels={false}
              box={map.pins.length ? fitBox(map.pins, mapRatio) : [130, 40, 800, 560]}
              label={`Mapa do Distrito Federal com ${plural(map.pins.length, 'equipe', 'equipes')}`}
              onSelect={(id) => navigate(`/operacao?equipe=${id}`)}
              className="absolute inset-0"
            />
          </div>
        </section>

        <section className={cn('min-w-0 rounded-card bg-raised p-5 sm:p-6', aiEnabled ? '@min-[1180px]/frame:col-span-4' : '@min-[1180px]/frame:col-span-5')}>
          <h2 className="text-title-sub">Ocupação do estoque</h2>
          <ArcGauge
            className="mt-5"
            center={`${Math.round(occupancy.pct)}%`}
            caption=""
            label={`Ocupação do estoque: ${Math.round(occupancy.pct)}%. ${occupancy.inField} em campo, ${gaugeLimpeza} em ${cleaningLabel.toLowerCase()}, ${occupancy.idle} parados.`}
            segments={[
              { label: 'Em campo', value: occupancy.inField, tone: 'solid' },
              { label: cleaningLabel, value: gaugeLimpeza, tone: 'strong' },
              { label: 'Parados', value: occupancy.idle, tone: 'idle' },
            ]}
          />
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-caption text-fg-2">
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-pill bg-accent" />
              Em campo <span className="font-semibold text-fg">{occupancy.inField}</span>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-pill bg-accent-active" />
              {cleaningLabel} <span className="font-semibold text-fg">{gaugeLimpeza}</span>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="ds-hatch size-3 rounded-pill bg-sunken ring-1 ring-idle ring-inset" />
              Parados <span className="font-semibold text-fg">{occupancy.idle}</span>
            </li>
          </ul>
        </section>

        {aiEnabled ? <CopilotCardDark /> : null}
      </div>
    </>
  )
}
