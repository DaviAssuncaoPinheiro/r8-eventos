import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Download, FileWarning, Info, PackageOpen, PiggyBank, Plus, ReceiptText, Route, Send, Sparkles, Truck, Zap, type LucideIcon } from 'lucide-react'
import { ArcGauge, Banner, Button, Money, MoneyCard, PillBars, Segmented, Skeleton, Tooltip, cn, notify } from '@/ui'
import { MapaReal, type RealRoute } from '@/ui/MapaReal'
import { RollingMoney, RollingNumber, Stagger, Tilt } from '@/ui/Motion'
import { fleetTrucks, teamOfTruck, useFleet } from '@/modules/operacao/fleet'
import { PageHeader } from '@/app/PageHeader'
import { MONTHS_LONG, MONTHS_SHORT, today } from '@/domain/dates'
import { formatMoney, formatPercent } from '@/lib/format'
import {
  getDailySummary,
  getMoneyPanel,
  getReceivables,
  listTeams,
  useLabels,
  useQuery,
  useSettings,
  type MoneyPanel,
  type RecommendedAction,
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

/** Botão (i) discreto com o "como é calculado" de um indicador. */
function InfoTip({ label, text }: { label: string; text: string }) {
  return (
    <Tooltip content={text} toggleOnClick>
      <button type="button" aria-label={`Como é calculado: ${label}`} className="ds-hit inline-flex size-6 shrink-0 items-center justify-center rounded-pill text-fg-3 transition-colors duration-150 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <Info size={16} strokeWidth={2} aria-hidden />
      </button>
    </Tooltip>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

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
  const teamsQ = useQuery(listTeams, [])
  const panel = panelQ.data
  // caminhões ao vivo: a posição é recalculada a cada 3 s e o mapa desliza entre elas
  const fleet = useFleet(3000)
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

  const map = React.useMemo(() => {
    const idle = new Set((panel?.teamsNow ?? []).filter((t) => t.status === 'sem_servico').map((t) => t.team.id))
    const live = fleet.filter((f) => !idle.has(f.teamId))
    const routes: RealRoute[] = live.filter((f) => f.status === 'em_rota').map((f) => ({ id: f.teamId, group: f.teamId, dashed: true, points: [f.from, f.to] }))
    return { trucks: fleetTrucks(live, (id) => teamsQ.data?.find((t) => t.id === id)), routes }
  }, [fleet, panel, teamsQ.data])

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
  if (!panel || !rec || !revenue || !teamsQ.data) {
    return (
      <>
        {header}
        <PainelSkeleton />
      </>
    )
  }

  const { rentedToday, idle, uncollectedDamages, unbilledExtras, receivable, occupancy } = panel
  const deltaTag =
    rentedToday.deltaPct === 0
      ? { label: '0%' }
      : { label: formatPercent(rentedToday.deltaPct / 100, { sign: true }), dir: rentedToday.deltaPct > 0 ? ('up' as const) : ('down' as const) }
  const agingTotal = aging.reduce((a, f) => a + f.value, 0)
  const maint = occupancy.maintenance
  const cleaningLabel = maint ? `${cap(l.cleaning)} e manutenção` : cap(l.cleaning)
  const gaugeLimpeza = occupancy.cleaning + maint

  return (
    <>
      {header}

      {/* 1. os quatro números */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
        <Tilt className="h-full min-w-0">
        <MoneyCard
          hero
          className="h-full"
          title="Alugado hoje"
          value={rentedToday.value}
          tag={deltaTag}
          formula={`${rentedToday.units} de ${rentedToday.totalUnits} ${l.unitPlural} em campo hoje × valor mensal de tabela de cada uma.`}
          onOpen={() => navigate('/equipamentos?status=em_campo')}
        />
        </Tilt>
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
      </Stagger>

      {/* 2. receita, cobrança e o que fazer hoje */}
      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-title-sub">
              Receita
              <InfoTip label="Receita" text="Soma do que foi pago em cada mês, pela data do pagamento. O mês corrente conta até hoje; a variação compara o último mês fechado com o anterior." />
            </h2>
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
          <h2 className="flex items-center gap-1.5 text-title-sub">
            A receber
            <InfoTip label="A receber" text={`${plural(receivable.count, 'fatura aberta', 'faturas abertas')}, em dia ou atrasadas, que ainda não foram pagas. Atrasados é a parte delas já vencida.`} />
          </h2>
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

          <ul className="mt-5 flex flex-col gap-3">
            {aging.filter((f) => f.value > 0).map((f) => (
              <li key={f.label} className="flex items-center justify-between gap-3 text-body">
                <span className="flex items-center gap-2 font-medium text-fg-2">
                  <span aria-hidden className={cn('size-2.5 rounded-pill', f.cls)} />
                  {f.label}
                </span>
                <span className={cn('tnum font-semibold', f.cls === 'bg-danger' ? 'text-danger-ink' : 'text-fg')}>{formatMoney(f.value)}</span>
              </li>
            ))}
          </ul>

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

      {/* 3. operação, estoque, sistema trabalhando e Copiloto */}
      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <section className={cn('flex min-w-0 flex-col rounded-card bg-raised p-2', aiEnabled ? '@min-[1180px]/frame:col-span-5' : '@min-[1180px]/frame:col-span-7')}>
          <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3 sm:px-4 sm:pt-4">
            <h2 className="text-title-sub">Na rua agora</h2>
            <Button variant="secondary" size="sm" icon={Truck} onClick={() => navigate('/operacao')}>
              Operação
            </Button>
          </div>
          <div className="relative h-[300px] flex-1 overflow-hidden rounded-[16px] @min-[1180px]/frame:h-auto @min-[1180px]/frame:min-h-[300px]">
            <MapaReal
              trucks={map.trucks}
              routes={map.routes}
              refit="once"
              onSelect={(id) => {
                const t = teamOfTruck(id)
                if (t) navigate(`/operacao?equipe=${t}`)
              }}
              label={`Mapa de Brasília com ${plural(map.trucks.length, 'equipe', 'equipes')} na rua`}
            />
          </div>
        </section>

        <div className={cn('flex min-w-0 flex-col gap-4', aiEnabled ? '@min-[1180px]/frame:col-span-4' : '@min-[1180px]/frame:col-span-5')}>
          <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6">
            <h2 className="flex items-center gap-1.5 text-title-sub">
              Ocupação do estoque
              <InfoTip label="Ocupação do estoque" text={`${occupancy.inField} de ${occupancy.total} ${l.unitPlural} em campo hoje. Limpeza, manutenção e parados ficam fora da conta.`} />
            </h2>
            <div className="mt-4 flex items-center gap-5">
              <ArcGauge
                className="max-w-[196px] shrink-0 [&>div>span:first-child]:text-[32px] [&>div>span:first-child]:leading-[36px]"
                center={`${Math.round(occupancy.pct)}%`}
                caption=""
                label={`Ocupação do estoque: ${Math.round(occupancy.pct)}%. ${occupancy.inField} em campo, ${gaugeLimpeza} em ${cleaningLabel.toLowerCase()}, ${occupancy.idle} parados.`}
                segments={[
                  { label: 'Em campo', value: occupancy.inField, tone: 'solid' },
                  { label: cleaningLabel, value: gaugeLimpeza, tone: 'strong' },
                  { label: 'Parados', value: occupancy.idle, tone: 'idle' },
                ]}
              />
              <ul className="flex min-w-0 flex-1 flex-col gap-2.5 text-caption text-fg-2">
                <li className="flex items-center gap-2">
                  <span aria-hidden className="size-3 shrink-0 rounded-pill bg-accent" />
                  <span className="min-w-0 flex-1 leading-4">Em campo</span>
                  <span className="font-semibold text-fg tnum">{occupancy.inField}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="size-3 shrink-0 rounded-pill bg-accent-active" />
                  <span className="min-w-0 flex-1 leading-4">{cleaningLabel}</span>
                  <span className="font-semibold text-fg tnum">{gaugeLimpeza}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="ds-hatch size-3 shrink-0 rounded-pill bg-sunken ring-1 ring-idle ring-inset" />
                  <span className="min-w-0 flex-1 leading-4">Parados</span>
                  <span className="font-semibold text-fg tnum">{occupancy.idle}</span>
                </li>
              </ul>
            </div>
          </section>

          <section aria-label="Sistema trabalhando" className="flex min-w-0 flex-1 flex-col justify-center gap-1 rounded-card bg-raised p-3 sm:p-4">
            <button
              type="button"
              onClick={() => navigate('/inteligencia/caixa')}
              className="group flex items-center gap-3.5 rounded-control p-2 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-ok-soft text-ok-ink">
                <PiggyBank size={22} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-fg-2">Recuperado no mês</span>
                <span className="block text-kpi">
                  <RollingMoney kpi value={panel.recovered.total} />
                </span>
              </span>
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-pill text-fg ring-1 ring-edge transition-colors duration-150 ring-inset group-hover:bg-fg group-hover:text-raised group-hover:ring-fg">
                <ArrowUpRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover:rotate-45" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/automacoes')}
              className="group flex items-center gap-3.5 rounded-control p-2 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent-ink">
                <Zap size={22} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-fg-2">Feito sozinho hoje</span>
                <span className="block text-kpi">
                  <RollingNumber value={panel.automations.runsToday} />
                </span>
              </span>
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-pill text-fg ring-1 ring-edge transition-colors duration-150 ring-inset group-hover:bg-fg group-hover:text-raised group-hover:ring-fg">
                <ArrowUpRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover:rotate-45" />
              </span>
            </button>
          </section>
        </div>

        {aiEnabled ? <CopilotCardDark /> : null}
      </div>
    </>
  )
}
