import * as React from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { ChartColumn, Table2 } from 'lucide-react'
import { formatPercent } from '@/lib/format'
import { Button } from './Button'
import { Card } from './Card'
import { cn } from './cn'
import { Segmented, type SegmentedOption } from './Segmented'
import { Skeleton } from './Skeleton'
import { TooltipBody } from './Tooltip'

/* Todas as cores vêm de variáveis CSS (var(--accent), var(--viz-1)…): trocar tema ou marca repinta sem recarregar. */

/* ───────────────────────── utilitários ───────────────────────── */

const ChartHeight = React.createContext(240)

/** "R$ 12 mil" no eixo; o tooltip mostra o valor completo. */
export function formatAxisMoney(v: number): string {
  if (v === 0) return 'R$ 0'
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return `R$ ${v.toLocaleString('pt-BR')}`
}

/** Marcas redondas (1, 2, 2,5 ou 5 vezes uma potência de 10), de 0 até acima do maior valor: 4 a 6 linhas de grade. */
function niceTicks(max: number): number[] {
  if (!(max > 0)) return [0, 1]
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((st) => st >= raw) ?? pow * 10
  const out: number[] = []
  for (let v = 0; v < max + step * 0.999; v += step) out.push(Math.round(v * 1000) / 1000)
  return out
}

function useReducedMotion(): boolean {
  const subscribe = React.useCallback((cb: () => void) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }, [])
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

const axisTick = { fill: 'var(--viz-axis)', fontSize: 12 } as const
const slug = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '')

/** Tooltip no padrão do TooltipBody, com o mesmo visual do Tooltip do sistema. */
function TipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-tip bg-inverse px-2.5 py-2 text-caption text-on-inverse">
      <TooltipBody title={title} rows={rows} />
    </div>
  )
}

const tipProps = {
  isAnimationActive: false,
  wrapperStyle: { zIndex: 90, outline: 'none' },
} as const

/* ───────────────────────── legenda ───────────────────────── */

export interface LegendItem {
  key: string
  label: string
  /** var(--viz-1) etc. */
  color?: string
  /** Marca hachurada: "parado / sem uso / pendente". */
  hatch?: boolean
}

/** Acima do gráfico, à esquerda. Com `onToggle`, clicar isola a série. */
export function ChartLegend({ items, active, onToggle, className }: { items: LegendItem[]; active?: string | null; onToggle?: (key: string) => void; className?: string }) {
  return (
    <ul className={cn('m-0 mb-3 flex list-none flex-wrap items-center gap-x-1 gap-y-1 p-0', className)} aria-label="Legenda">
      {items.map((it) => {
        const dim = active != null && active !== it.key
        const mark = (
          <span
            aria-hidden
            className={cn('size-2 shrink-0 rounded-[2px]', it.hatch && 'ds-hatch bg-sunken ring-1 ring-idle ring-inset')}
            style={it.hatch ? undefined : { background: it.color }}
          />
        )
        const inner = (
          <>
            {mark}
            {it.label}
          </>
        )
        return (
          <li key={it.key}>
            {onToggle ? (
              <button
                type="button"
                aria-pressed={active === it.key}
                onClick={() => onToggle(it.key)}
                className={cn(
                  'ds-touch inline-flex h-7 items-center gap-2 rounded-tip px-2 text-caption text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg',
                  'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
                  dim && 'opacity-60',
                )}
              >
                {inner}
              </button>
            ) : (
              <span className="inline-flex h-7 items-center gap-2 px-2 text-caption text-fg-2">{inner}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/* ───────────────────────── barras ───────────────────────── */

export interface BarDatum {
  key: string
  label: string
  value: number
  /** "Parado / sem uso / pendente": barra hachurada com contorno idle. */
  idle?: boolean
}

export interface BarSeriesChartProps {
  data: BarDatum[]
  /** Chave da barra do período atual (cheia). As outras ficam a 40%. Padrão: a última que não é idle. */
  currentKey?: string
  /** Valor completo, para o tooltip. */
  valueFormat: (v: number) => string
  /** Valor abreviado, para o eixo. */
  axisFormat?: (v: number) => string
  seriesLabel?: string
  idleLabel?: string
  /** Legenda acima do gráfico. */
  legend?: LegendItem[]
}

export function BarSeriesChart({ data, currentKey, valueFormat, axisFormat = formatAxisMoney, seriesLabel = 'Valor', idleLabel = 'Parado', legend }: BarSeriesChartProps) {
  const height = React.useContext(ChartHeight)
  const reduced = useReducedMotion()
  const pid = `hatch-${slug(React.useId())}`
  const current = currentKey ?? [...data].reverse().find((d) => !d.idle)?.key
  const hasIdle = data.some((d) => d.idle)
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)))
  return (
    <div>
      {legend ? <ChartLegend items={legend} /> : null}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap={8}>
            {hasIdle ? (
              <defs>
                <pattern id={pid} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                  <rect width="6" height="6" fill="var(--sunken)" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="var(--hatch)" strokeWidth="1.5" />
                </pattern>
              </defs>
            ) : null}
            <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} interval={0} minTickGap={0} tickMargin={8} />
            <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={axisFormat} ticks={ticks} width={64} domain={[0, ticks[ticks.length - 1]]} />
            <RTooltip
              {...tipProps}
              cursor={{ fill: 'var(--hover)', fillOpacity: 0.6 }}
              content={(p: TooltipContentProps) => {
                const d = p.payload?.[0]?.payload as BarDatum | undefined
                if (!p.active || !d) return null
                return <TipBox title={d.label} rows={[{ label: d.idle ? idleLabel : seriesLabel, value: valueFormat(d.value), color: d.idle ? 'var(--idle)' : 'var(--accent)' }]} />
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={!reduced} animationDuration={250}>
              {data.map((d) => (
                <Cell
                  key={d.key}
                  fill={d.idle ? `url(#${pid})` : 'var(--accent)'}
                  fillOpacity={d.idle || d.key === current ? 1 : 0.4}
                  stroke={d.idle ? 'var(--idle)' : 'none'}
                  strokeWidth={d.idle ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ───────────────────────── linha e área ───────────────────────── */

export interface TrendSeries {
  key: string
  label: string
  /** var(--viz-1), var(--viz-2)… ou var(--accent) para série única. */
  color: string
}

export interface TrendChartProps {
  /** Cada ponto tem `label` (eixo e título do tooltip) e um número por chave de série. */
  data: ({ label: string } & Record<string, string | number>)[]
  series: TrendSeries[]
  variant?: 'line' | 'area'
  valueFormat: (v: number) => string
  axisFormat?: (v: number) => string
}

export function TrendChart({ data, series, variant = 'line', valueFormat, axisFormat = (v) => v.toLocaleString('pt-BR') }: TrendChartProps) {
  const height = React.useContext(ChartHeight)
  const reduced = useReducedMotion()
  const [isolated, setIsolated] = React.useState<string | null>(null)
  const toggle = (k: string) => setIsolated((cur) => (cur === k ? null : k))
  const Chart = variant === 'area' ? AreaChart : LineChart
  const shown = series.filter((s) => isolated == null || isolated === s.key)
  const ticks = niceTicks(Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key])))))
  return (
    <div>
      {series.length > 1 ? <ChartLegend items={series.map((s) => ({ key: s.key, label: s.label, color: s.color }))} active={isolated} onToggle={toggle} /> : null}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} tickMargin={8} minTickGap={16} />
            <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={axisFormat} ticks={ticks} width={44} domain={[0, ticks[ticks.length - 1]]} />
            <RTooltip
              {...tipProps}
              cursor={{ stroke: 'var(--strong)', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={(p: TooltipContentProps) => {
                if (!p.active || !p.payload?.length) return null
                return <TipBox title={String(p.label)} rows={p.payload.map((r) => ({ label: series.find((s) => s.key === r.dataKey)?.label ?? String(r.name), value: valueFormat(Number(r.value)), color: series.find((s) => s.key === r.dataKey)?.color }))} />
              }}
            />
            {shown.map((s) =>
              variant === 'area' ? (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={s.color}
                  fillOpacity={0.12}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color, stroke: 'var(--raised)', strokeWidth: 2 }}
                  isAnimationActive={!reduced}
                  animationDuration={250}
                />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color, stroke: 'var(--raised)', strokeWidth: 2 }}
                  isAnimationActive={!reduced}
                  animationDuration={250}
                />
              ),
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ───────────────────────── rosca ───────────────────────── */

export interface RatioDonutProps {
  /** Proporção de 0 a 1. */
  value: number
  /** Nome da parte destacada: "Em locação". */
  label: string
  /** Nome do resto: "Livre". */
  restLabel?: string
  /** Texto ao lado da rosca. */
  details?: React.ReactNode
  size?: number
}

/** Só para uma proporção (ocupação da frota). Espessura 12, trilho sunken, número no centro. */
export function RatioDonut({ value, label, restLabel = 'Restante', details, size = 160 }: RatioDonutProps) {
  const reduced = useReducedMotion()
  const height = React.useContext(ChartHeight)
  const data = [
    { name: label, value, fill: 'var(--accent)' },
    { name: restLabel, value: Math.max(0, 1 - value), fill: 'var(--sunken)' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4" style={{ minHeight: height }}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <RTooltip
            {...tipProps}
            content={(p: TooltipContentProps) => {
              const d = p.payload?.[0]?.payload as { name: string; value: number; fill: string } | undefined
              if (!p.active || !d) return null
              return <TipBox title={d.name} rows={[{ label: 'Proporção', value: formatPercent(d.value), color: d.name === label ? 'var(--accent)' : 'var(--idle)' }]} />
            }}
          />
          <Pie data={data} dataKey="value" startAngle={90} endAngle={-270} innerRadius={size / 2 - 12} outerRadius={size / 2} stroke="none" isAnimationActive={!reduced} animationDuration={250}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="tnum text-kpi">{formatPercent(value)}</span>
        </div>
      </div>
      {details ? <div className="min-w-0 flex-1 text-body text-fg-2">{details}</div> : null}
    </div>
  )
}

/* ───────────────────────── cartão ───────────────────────── */

export interface ChartDataTable {
  caption: string
  headers: string[]
  /** A primeira coluna é o rótulo; as demais são números e alinham à direita. */
  rows: (string | number)[][]
}

export interface ChartCardProps {
  title: string
  /** Valor-resumo à direita do título (use Money). */
  summary?: React.ReactNode
  period?: { options: SegmentedOption<string>[]; value: string; onChange: (v: string) => void; label?: string }
  /** Resumo em frase, lido por leitores de tela: "Faturamento de outubro: R$ 48.312,90, 12,4% acima de setembro". */
  ariaLabel: string
  state?: 'ready' | 'loading' | 'empty'
  emptyText?: string
  /** Altura da área do gráfico: 240 no escritório, 200 no campo. */
  height?: number
  /** Tabela equivalente, aberta pelo botão "Ver dados". */
  dataTable?: ChartDataTable
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, summary, period, ariaLabel, state = 'ready', emptyText = 'Sem dados neste período', height = 240, dataTable, children, className }: ChartCardProps) {
  const [showData, setShowData] = React.useState(false)
  const ready = state === 'ready'
  return (
    <Card className={className} aria-busy={state === 'loading' || undefined}>
      <div className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-title-card">{title}</h3>
        <div className="flex flex-wrap items-center gap-3">
          {summary ? <div className="text-title-card tnum">{summary}</div> : null}
          {period ? <Segmented size="sm" label={period.label ?? 'Período'} options={period.options} value={period.value} onChange={period.onChange} /> : null}
          {dataTable && ready ? (
            <Button variant="ghost" size="sm" icon={showData ? ChartColumn : Table2} aria-pressed={showData} onClick={() => setShowData((v) => !v)}>
              {showData ? 'Ver gráfico' : 'Ver dados'}
            </Button>
          ) : null}
        </div>
      </div>
      {state === 'loading' ? (
        <div style={{ height }}>
          <Skeleton shape="block" className="h-full" />
        </div>
      ) : null}
      {state === 'empty' ? (
        <div className="grid place-items-center rounded-control bg-sunken px-4 text-center text-body text-fg-3" style={{ height }}>
          {emptyText}
        </div>
      ) : null}
      {ready && showData && dataTable ? (
        <div className="overflow-x-auto" style={{ maxHeight: height + 40 }}>
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{dataTable.caption}</caption>
            <thead>
              <tr className="h-9 border-b border-hairline">
                {dataTable.headers.map((h, i) => (
                  <th key={h} scope="col" className={cn('sticky top-0 bg-raised px-3 text-caption font-semibold whitespace-nowrap text-fg-3 first:pl-0 last:pr-0', i > 0 && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataTable.rows.map((r) => (
                <tr key={String(r[0])} className="h-10 border-b border-hairline last:border-b-0">
                  {r.map((c, i) => (
                    <td key={i} className={cn('px-3 text-body first:pl-0 last:pr-0', i > 0 ? 'tnum text-right' : 'text-fg')}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {ready && !showData ? (
        <ChartHeight.Provider value={height}>
          <div role="img" aria-label={ariaLabel}>
            {children}
          </div>
        </ChartHeight.Provider>
      ) : null}
    </Card>
  )
}
