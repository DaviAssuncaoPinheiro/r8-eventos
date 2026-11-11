import * as React from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  getOccupancyReport,
  getRevenueByClient,
  getRevenueByEquipment,
  getTeamPerformance,
  useLabels,
  useQuery,
  type DateRange,
  type OccupancyReport,
  type RevenueByClientRow,
  type RevenueByEquipmentRow,
  type TeamPerformanceRow,
} from '@/services'
import { Badge, Banner, Button, ChartCard, Money, TrendChart, cn, useCountUp } from '@/ui'
import { formatDate, formatMoney, formatPercent } from '@/lib/format'
import { HBars } from '@/modules/clientes/components/HBars'
import { dayLabel } from '../lib'
import { Ring } from './Ring'

function BlockError({ onRetry }: { onRetry: () => void }) {
  return (
    <Banner
      tone="danger"
      title="Não foi possível carregar este relatório."
      action={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
      }
    />
  )
}

const pct1 = (n: number) => formatPercent(n / 100)

/* ───────────────────────── 1. ocupação ───────────────────────── */

function BigPct({ value }: { value: number }) {
  const n = useCountUp(value)
  return (
    <p className="tnum text-kpi-lg">
      <span className="sr-only">{pct1(value)}</span>
      <span aria-hidden>{pct1(Math.round(n * 10) / 10)}</span>
    </p>
  )
}

export function Ocupacao({ range, onData }: { range: DateRange; onData?: (d: OccupancyReport) => void }) {
  const q = useQuery(() => getOccupancyReport(range), [range.from, range.to])
  const d = q.data
  React.useEffect(() => {
    if (d) onData?.(d)
  }, [d, onData])
  if (q.error && !d) return <BlockError onRetry={() => void q.refetch()} />
  const current = d ? d.points.filter((p) => p.date <= range.to).at(-1) : undefined
  return (
    <ChartCard
      className="h-full"
      title="Ocupação"
      state={q.initialLoading ? 'loading' : d && d.points.length ? 'ready' : 'empty'}
      height={260}
      ariaLabel={d && current ? `Ocupação do estoque hoje: ${pct1(current.pct)}. Média no período: ${pct1(d.avgPct)}. Pico de ${pct1(d.peak.pct)} em ${formatDate(d.peak.date)}.` : 'Ocupação do estoque'}
      dataTable={
        d
          ? {
              caption: 'Ocupação diária do estoque',
              headers: ['Dia', 'Em campo', 'Reservado', 'Ocupação'],
              rows: d.points.map((p) => [formatDate(p.date), p.inField, p.reserved, pct1(p.pct)]),
            }
          : undefined
      }
    >
      {d && current ? (
        <>
          <BigPct value={current.pct} />
          <div className="mt-3">
            <TrendChart
              variant="area"
              data={d.points.map((p) => ({ label: dayLabel(p.date), pct: p.pct }))}
              series={[{ key: 'pct', label: 'Ocupação', color: 'var(--accent)' }]}
              valueFormat={pct1}
              axisFormat={(v) => `${v}%`}
            />
          </div>
        </>
      ) : null}
    </ChartCard>
  )
}

/* ───────────────────────── 2. receita por cliente ───────────────────────── */

export function ReceitaClientes({ range, onData }: { range: DateRange; onData?: (d: { rows: RevenueByClientRow[]; total: number }) => void }) {
  const q = useQuery(() => getRevenueByClient(range), [range.from, range.to])
  const d = q.data
  React.useEffect(() => {
    if (d) onData?.(d)
  }, [d, onData])
  if (q.error && !d) return <BlockError onRetry={() => void q.refetch()} />
  const top = d?.rows.slice(0, 8) ?? []
  const rest = d ? d.rows.slice(8) : []
  const restValue = Math.round(rest.reduce((a, r) => a + r.value, 0) * 100) / 100
  return (
    <ChartCard
      className="h-full"
      title="Receita por cliente"
      state={q.initialLoading ? 'loading' : d && d.rows.length ? 'ready' : 'empty'}
      emptyText="Nenhuma cobrança recebida neste período"
      height={300}
      ariaLabel={d ? `Receita recebida no período: ${formatMoney(d.total)}. Maior cliente: ${d.rows[0]?.client.name ?? 'nenhum'}.` : 'Receita por cliente'}
      dataTable={
        d
          ? {
              caption: 'Receita recebida por cliente',
              headers: ['Cliente', 'Tipo', 'Cobranças', 'Receita', 'Parte'],
              rows: d.rows.map((r) => [r.client.name, r.kind, r.charges, formatMoney(r.value), pct1(r.sharePct)]),
            }
          : undefined
      }
    >
      {d ? (
        <>
          <p className="text-kpi">
            <Money value={d.total} variant="kpi" />
          </p>
          <HBars
            className="mt-4"
            labelWidth={150}
            label="Receita dos oito maiores clientes"
            rows={[
              ...top.map((r) => ({ key: r.client.id, label: r.client.name, value: r.value, valueLabel: formatMoney(r.value), href: `/clientes/${r.client.id}` })),
              ...(rest.length ? [{ key: 'outros', label: 'Outros', value: restValue, valueLabel: formatMoney(restValue), tone: 'soft' as const }] : []),
            ]}
          />
        </>
      ) : null}
    </ChartCard>
  )
}

/* ───────────────────────── 3. rendimento por equipamento ───────────────────────── */

export function Rendimento({ range, onData }: { range: DateRange; onData?: (d: { rows: RevenueByEquipmentRow[]; perUnit: Record<string, number>; total: number }) => void }) {
  const l = useLabels()
  const q = useQuery(() => getRevenueByEquipment(range), [range.from, range.to])
  const occ = useQuery(() => getOccupancyReport(range), [range.from, range.to])
  const d = q.data
  const occByType = React.useMemo(() => new Map((occ.data?.byType ?? []).map((t) => [t.type.id, t])), [occ.data])
  const perUnit = React.useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of d?.rows ?? []) {
      const tot = occByType.get(r.type.id)?.total ?? 0
      m[r.type.id] = tot ? Math.round((r.value / tot) * 100) / 100 : 0
    }
    return m
  }, [d, occByType])
  React.useEffect(() => {
    if (d) onData?.({ rows: d.rows, perUnit, total: d.total })
  }, [d, perUnit, onData])
  if (q.error && !d) return <BlockError onRetry={() => void q.refetch()} />
  const rows = d?.rows ?? []
  const top = rows[0]?.value ? rows[0].type.id : undefined
  // o que mais fica parado: menor ocupação média entre os tipos com estoque
  const idle = [...(occ.data?.byType ?? [])].filter((t) => t.total > 0).sort((a, b) => a.avgPct - b.avgPct)[0]?.type.id
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <ChartCard
      className="h-full"
      title={`Rendimento por ${l.equipment}`}
      state={q.initialLoading || occ.initialLoading ? 'loading' : rows.length ? 'ready' : 'empty'}
      height={360}
      ariaLabel={d ? `Receita por tipo de ${l.equipment} no período: ${formatMoney(d.total)}. Mais rende: ${rows[0]?.type.name ?? 'nenhum'}.` : 'Rendimento por equipamento'}
      dataTable={{
        caption: `Receita por tipo de ${l.equipment}`,
        headers: ['Tipo', 'Receita', `Por ${l.unit}`, `${capitalizeFirst(l.unit)}s x dia`, 'Parte'],
        rows: rows.map((r) => [r.type.name, formatMoney(r.value), formatMoney(perUnit[r.type.id] ?? 0), r.unitDays, pct1(r.sharePct)]),
      }}
    >
      <ul aria-label={`Receita por tipo de ${l.equipment}`} className="m-0 flex list-none flex-col gap-1 p-0">
        {rows.map((r) => {
          const isTop = r.type.id === top
          const isIdle = r.type.id === idle && r.type.id !== top
          return (
            <li key={r.type.id} className={cn('grid grid-cols-[auto_1fr_auto] items-center gap-x-3.5 gap-y-2 rounded-control p-2', isTop && 'bg-accent-soft')}>
              <img src={r.type.photo} alt="" loading="lazy" className="size-12 rounded-control bg-sunken object-cover" />
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-body-lg font-semibold">{r.type.name}</span>
                  {isTop ? (
                    <Badge tone="ok" icon={CheckCircle2}>
                      Mais rende
                    </Badge>
                  ) : null}
                  {isIdle ? (
                    <Badge tone="idle" icon={AlertTriangle}>
                      Mais parado
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="text-right">
                <p className="tnum text-body-lg font-semibold whitespace-nowrap">{formatMoney(r.value)}</p>
                <p className="tnum text-caption whitespace-nowrap text-fg-3">{formatMoney(perUnit[r.type.id] ?? 0)} por {l.unit}</p>
              </div>
              <span aria-hidden className="col-span-3 -mt-0.5 block h-2.5 rounded-pill">
                <span
                  className={cn('block h-full rounded-pill', isIdle ? 'ds-hatch bg-sunken ring-1 ring-idle ring-inset' : isTop ? 'bg-accent-active' : 'bg-[var(--bar-soft)]')}
                  style={{ width: `${Math.max((r.value / max) * 100, 2)}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>
    </ChartCard>
  )
}

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* ───────────────────────── 4. desempenho por equipe ───────────────────────── */

export function Equipes({ range, onData }: { range: DateRange; onData?: (d: TeamPerformanceRow[]) => void }) {
  const q = useQuery(() => getTeamPerformance(range), [range.from, range.to])
  const d = q.data
  React.useEffect(() => {
    if (d) onData?.(d)
  }, [d, onData])
  if (q.error && !d) return <BlockError onRetry={() => void q.refetch()} />
  const rows = [...(d ?? [])].sort((a, b) => b.completed - a.completed)
  return (
    <ChartCard
      className="h-full"
      title="Desempenho por equipe"
      state={q.initialLoading ? 'loading' : rows.some((r) => r.scheduled > 0) ? 'ready' : 'empty'}
      emptyText="Nenhum serviço de equipe neste período"
      height={360}
      ariaLabel={`Desempenho de ${rows.length} equipes no período`}
      dataTable={{
        caption: 'Desempenho por equipe',
        headers: ['Equipe', 'Agendados', 'Concluídos', 'Pontualidade', 'Duração média (min)', 'Atrasos', 'Fotos'],
        rows: rows.map((r) => [r.team.name, r.scheduled, r.completed, pct1(r.onTimePct), r.avgDurationMin, r.late, r.photos]),
      }}
    >
      <ul aria-label="Desempenho por equipe" className="m-0 flex list-none flex-col gap-1 p-0">
        {rows.map((r) => {
          const tone = r.onTimePct >= 90 ? 'ok' : r.onTimePct >= 75 ? 'warn' : 'danger'
          return (
            <li key={r.team.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3.5 gap-y-1 rounded-control p-2">
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-pill text-body font-semibold text-fg"
                style={{ background: `color-mix(in oklab, var(--${r.team.color}) 22%, var(--raised))` }}
              >
                {r.team.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-body-lg font-semibold">{r.team.name}</p>
                <p className="tnum text-caption text-fg-3">
                  <span className="font-semibold text-fg">{r.completed}</span> serviços feitos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Ring pct={r.onTimePct} tone={tone} label={`Pontualidade da ${r.team.name}: ${pct1(r.onTimePct)}`} />
                <div className="w-14 text-left">
                  <p className="tnum text-body-lg leading-5 font-semibold">{pct1(r.onTimePct)}</p>
                  <p className="text-caption text-fg-3">pontual</p>
                </div>
              </div>
              <div className="w-14 text-right">
                <p className={cn('tnum text-body-lg leading-5 font-semibold', r.late > 0 ? 'text-danger-ink' : 'text-fg')}>{r.late}</p>
                <p className="text-caption text-fg-3">atrasos</p>
              </div>
            </li>
          )
        })}
      </ul>
    </ChartCard>
  )
}
