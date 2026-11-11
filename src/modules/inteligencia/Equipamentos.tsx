import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Area, Bar, CartesianGrid, ComposedChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { CircleCheck, PackagePlus, Tag, TrendingDown, TrendingUp, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Banner, Button, RollingMoney, Skeleton, Stagger, Tooltip, cn, reduced } from '@/ui'
import { formatMoney } from '@/lib/format'
import { getAssetProfitability, getDemandForecast, useQuery, type AssetProfit, type AssetVerdict, type DemandTypeForecast, type UnitProfit } from '@/services'
import { TypeArt } from '@/modules/equipamentos/components/TypeArt'
import { GrowBar, InfoTip, Ring, ddmm } from './shared'

const VERDICT: Record<AssetVerdict, { label: string; icon: LucideIcon; cls: string }> = {
  comprar_mais: { label: 'Comprar mais', icon: PackagePlus, cls: 'bg-ok text-white' },
  manter: { label: 'Manter', icon: CircleCheck, cls: 'bg-sunken text-fg-2' },
  subir_preco: { label: 'Subir preço', icon: TrendingUp, cls: 'bg-accent text-on-accent' },
  baixar_preco: { label: 'Baixar preço', icon: TrendingDown, cls: 'bg-warn-soft text-warn-ink' },
  vender: { label: 'Vender', icon: Tag, cls: 'bg-danger-solid text-white' },
}
const RING: Record<AssetVerdict, string> = { comprar_mais: 'stroke-ok', manter: 'stroke-idle', subir_preco: 'stroke-accent', baixar_preco: 'stroke-warn', vender: 'stroke-danger' }

const num1 = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

const PAYBACK_SCALE = 48

function TypeCard({ a, selected, onSelect, index }: { a: AssetProfit; selected: boolean; onSelect: () => void; index: number }) {
  const v = VERDICT[a.verdict]
  // barra proporcional aos meses para se pagar (escala de 4 anos): quanto mais curta, mais rápido o tipo devolve o investimento
  const paybackPct = a.paybackMonths > 0 ? Math.max(6, (Math.min(a.paybackMonths, PAYBACK_SCALE) / PAYBACK_SCALE) * 100) : 0
  const impactTone = a.verdict === 'baixar_preco' || a.verdict === 'subir_preco' || a.verdict === 'comprar_mais' ? 'text-ok-ink' : 'text-fg'
  return (
    <div className={cn('relative flex min-w-0 flex-col rounded-card bg-raised p-5 transition-shadow duration-200 ease-[var(--ease-ui)] sm:p-6', selected && 'ring-2 ring-accent ring-inset')}>
      <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`Ver a previsão de ${a.type.name}`} className="absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
      <div className="pointer-events-none relative overflow-hidden rounded-[16px] bg-accent-soft">
        <TypeArt typeId={a.type.id} className="h-[104px] w-full p-2" />
        <span className="absolute top-2.5 right-2.5 rounded-pill bg-raised p-0.5">
          <Ring pct={a.utilizationPct} size={48} stroke={6} tone={RING[a.verdict]} delay={index * 60} label={`Ocupação de ${Math.round(a.utilizationPct)}%`}>
            <span className="tnum text-caption font-semibold">{Math.round(a.utilizationPct)}%</span>
          </Ring>
        </span>
      </div>
      <h3 className="pointer-events-none relative mt-4 line-clamp-2 text-title-card">{a.type.name}</h3>
      <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Tooltip content={a.reason} toggleOnClick>
          <button type="button" aria-label={`${v.label}: ${a.reason}`} className={cn('relative z-10 inline-flex h-11 items-center gap-2 rounded-pill px-4 text-body-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', v.cls)}>
            <v.icon size={18} strokeWidth={2} aria-hidden />
            {v.label}
          </button>
        </Tooltip>
        <p className={cn('pointer-events-none text-kpi', impactTone)}>
          {a.impactMonthly > 0 ? (
            <>
              <RollingMoney kpi value={a.impactMonthly} />
              <span className="ml-1 text-body font-semibold text-fg-3">/mês</span>
            </>
          ) : (
            <span className="text-body-lg font-semibold text-fg-3">No ponto</span>
          )}
        </p>
      </div>
      <div className="pointer-events-none relative mt-auto pt-5">
        <div className="flex items-center justify-between gap-2 text-caption font-semibold">
          <span className="text-fg-2">{a.paybackMonths > 0 ? 'Se paga em' : 'Sem receita ainda'}</span>
          {a.paybackMonths > 0 ? <span className="tnum text-fg">{num1(a.paybackMonths)} {a.paybackMonths === 1 ? 'mês' : 'meses'}</span> : null}
        </div>
        <div className="mt-1.5 h-3 rounded-pill bg-sunken" role="img" aria-label={a.paybackMonths > 0 ? `Se paga em ${num1(a.paybackMonths)} meses` : 'Sem receita'}>
          <GrowBar pct={paybackPct} delay={index * 60} className="bg-accent" />
        </div>
      </div>
    </div>
  )
}

/* ───────── previsão de demanda ───────── */

interface Datum {
  date: string
  label: string
  demand: number
  committed: number
  quotes: number
  stock: number
  over: [number, number] | null
  band: number | null
}

function DemandChart({ f }: { f: DemandTypeForecast }) {
  const top = Math.max(f.stock, f.peakDemand, 1)
  const ymax = Math.ceil(top * 1.2)
  const data: Datum[] = f.daily.map((d) => ({
    date: d.date,
    label: ddmm(d.date),
    demand: d.demand,
    committed: d.committed,
    quotes: d.quotes,
    stock: f.stock,
    over: d.demand > f.stock ? [f.stock, d.demand] : null,
    band: d.demand > f.stock ? ymax : null,
  }))
  const tip = ({ active, payload }: TooltipContentProps) => {
    const d = active ? (payload?.[0]?.payload as Datum | undefined) : undefined
    if (!d) return null
    const miss = Math.ceil(d.demand - d.stock)
    return (
      <div className="rounded-tip bg-inverse px-2.5 py-2 text-caption text-on-inverse">
        <p className="font-semibold">{d.label}</p>
        <p className="mt-1">Demanda <b className="tnum">{num1(d.demand)}</b></p>
        <p>Estoque <b className="tnum">{d.stock}</b></p>
        {miss > 0 ? <p className="font-semibold text-danger-ink">Faltam {miss}</p> : null}
      </div>
    )
  }
  return (
    <div className="h-[280px] w-full" role="img" aria-label={`Demanda prevista de ${f.type.name} nos próximos 30 dias contra o estoque de ${f.stock} unidades. ${f.stockoutDays} dias com falta.`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }} barCategoryGap={0}>
          <defs>
            <linearGradient id="dem-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
          <XAxis dataKey="label" tick={{ fill: 'var(--viz-axis)', fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
          <YAxis domain={[0, ymax]} allowDecimals={false} tick={{ fill: 'var(--viz-axis)', fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
          <RTooltip content={tip} isAnimationActive={false} cursor={{ stroke: 'var(--fg-3)', strokeDasharray: '3 3' }} wrapperStyle={{ zIndex: 90, outline: 'none' }} />
          <Bar dataKey="band" fill="var(--danger)" fillOpacity={0.12} isAnimationActive={false} legendType="none" />
          <Area type="monotone" dataKey="demand" stroke="var(--accent)" strokeWidth={3} fill="url(#dem-fill)" isAnimationActive={!reduced()} animationDuration={900} dot={false} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="over" stroke="none" fill="var(--danger)" fillOpacity={0.85} isAnimationActive={false} activeDot={false} />
          <ReferenceLine y={f.stock} stroke="var(--fg-2)" strokeDasharray="6 4" strokeWidth={2} label={{ value: `Estoque ${f.stock}`, position: 'insideTopLeft', fill: 'var(--fg-2)', fontSize: 12, fontWeight: 600 }} />
          {f.missingUnits > 0 ? <ReferenceDot x={ddmm(f.peakDay)} y={f.peakDemand} r={6} fill="var(--danger)" stroke="var(--raised)" strokeWidth={2} /> : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ───────── unidades ───────── */

function UnitList({ title, rows, tone, formula }: { title: string; rows: UnitProfit[]; tone: string; formula: string }) {
  const max = Math.max(...rows.map((r) => r.revenue6m), 1)
  return (
    <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6">
      <h2 className="flex items-center gap-1.5 text-title-sub">
        {title}
        <InfoTip label={title} text={formula} />
      </h2>
      <ul className="mt-3 flex flex-col">
        {rows.map((r, i) => (
          <li key={r.unit.id}>
            <Link to={`/equipamentos/${r.unit.code}`} className="group -mx-2 flex items-center gap-3 rounded-control px-2 py-2.5 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <span aria-hidden className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-accent-soft"><TypeArt typeId={r.unit.typeId} className="size-full p-0.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-body-lg font-semibold">{r.unit.code}</span>
                  <span className="tnum shrink-0 text-body-lg font-semibold">{formatMoney(r.revenue6m)}</span>
                </span>
                <span className="mt-1.5 flex items-center gap-3">
                  <span aria-hidden className="h-2.5 flex-1 rounded-pill bg-sunken"><GrowBar pct={(r.revenue6m / max) * 100} delay={i * 70} className={tone} /></span>
                  {r.idleDays > 0 ? <span className="shrink-0 rounded-pill bg-warn-soft px-2 text-caption font-semibold text-warn-ink">{r.idleDays} dias parada</span> : null}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Equipamentos() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const prof = useQuery(getAssetProfitability, [])
  const dem = useQuery(() => getDemandForecast(30), [])
  const panel = React.useRef<HTMLElement>(null)

  const types = prof.data?.types ?? []
  const asked = params.get('tipo')
  const fallback = dem.data?.types.find((t) => t.stockoutDays > 0)?.type.id ?? types[0]?.type.id
  const selectedId = asked && types.some((t) => t.type.id === asked) ? asked : fallback
  const forecast = dem.data?.types.find((t) => t.type.id === selectedId)
  const selected = types.find((t) => t.type.id === selectedId)

  const select = (id: string) => {
    setParams({ tipo: id }, { replace: true })
    window.setTimeout(() => {
      const el = panel.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.top > window.innerHeight * 0.55 || r.bottom < 0) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' })
    }, 30)
  }
  // chegada pelo indicador "Vai faltar estoque": leva o painel da previsão à vista
  const arrived = React.useRef(false)
  React.useEffect(() => {
    if (arrived.current || !asked || !forecast) return
    arrived.current = true
    window.setTimeout(() => panel.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }), 500)
  }, [asked, forecast])

  if ((prof.error && !prof.data) || (dem.error && !dem.data)) {
    return <Banner tone="danger" title="Não foi possível carregar os equipamentos." action={<Button size="sm" variant="secondary" onClick={() => { void prof.refetch(); void dem.refetch() }}>Tentar de novo</Button>} />
  }
  if (!prof.data || !dem.data) {
    return (
      <div aria-busy="true" aria-label="Carregando equipamentos" className="grid grid-cols-1 gap-4 @min-[760px]/frame:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-[340px] rounded-card bg-raised p-6"><Skeleton shape="block" className="h-[104px]" /><Skeleton className="mt-5 h-6 w-2/3" /><Skeleton className="mt-4 h-10 rounded-pill" /></div>)}
      </div>
    )
  }

  const { topUnits, worstUnits } = prof.data
  return (
    <>
      <Stagger gap={0.05} className="grid grid-cols-1 gap-4 @min-[760px]/frame:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
        {types.map((a, i) => (
          <TypeCard key={a.type.id} a={a} index={i} selected={a.type.id === selectedId} onSelect={() => select(a.type.id)} />
        ))}
      </Stagger>

      {forecast && selected ? (
        <section ref={panel} className="mt-4 min-w-0 scroll-mt-4 rounded-card bg-raised p-5 sm:p-6" aria-label={`Previsão de demanda de ${selected.type.name}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span aria-hidden className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-accent-soft"><TypeArt typeId={selected.type.id} className="size-full p-0.5" /></span>
              <h2 className="flex items-center gap-1.5 text-title-sub">
                Previsão de 30 dias: {selected.type.name}
                <InfoTip label="Previsão de demanda" text="Por dia: unidades de locações confirmadas e em campo mais 40% das unidades dos orçamentos, contra as unidades disponíveis (fora as em manutenção)." />
              </h2>
              {forecast.missingUnits > 0 ? (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-danger-solid px-3 text-body font-semibold text-white">
                  <TriangleAlert size={16} strokeWidth={2} aria-hidden />
                  faltam {forecast.missingUnits} em {ddmm(forecast.peakDay)}
                </span>
              ) : (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-ok-soft px-3 text-body font-semibold text-ok-ink">
                  <CircleCheck size={16} strokeWidth={2} aria-hidden />
                  estoque dá conta
                </span>
              )}
            </div>
            <Button variant="secondary" size="md" onClick={() => navigate(`/equipamentos?visao=linha&tipo=${selected.type.id}`)}>
              Ver na linha do tempo
            </Button>
          </div>
          <div className="mt-4"><DemandChart f={forecast} /></div>
        </section>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-2">
        <UnitList title="Unidades que mais renderam" rows={topUnits} tone="bg-ok" formula="Receita de cada unidade nos últimos 6 meses, só do que já passou até hoje." />
        <UnitList title="Unidades que menos renderam" rows={worstUnits} tone="bg-warn" formula="Menor receita nos últimos 6 meses entre as unidades com mais de 120 dias de casa. Em empate, a parada há mais tempo." />
      </div>
    </>
  )
}
