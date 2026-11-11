import * as React from 'react'
import { BadgeDollarSign, CalendarClock, Hammer, ReceiptText, Sparkles, Undo2, type LucideIcon } from 'lucide-react'
import { Banner, Button, EmptyState, RollingMoney, Segmented, Skeleton, Stagger, cn, formatAxisMoney } from '@/ui'
import { addMonths, monthKey, today } from '@/domain/dates'
import { formatMoney } from '@/lib/format'
import { getCashForecast, getRecoveredMoney, useQuery, type CashWeek } from '@/services'
import type { RecoveredItem, RecoveredKind, RecoveredMoney } from '@/domain/recovery'
import { GrowBar, InfoTip, monthName, useIn } from './shared'

const WEEKS = 12
const PLOT = 248

function niceMax(v: number): number {
  if (!(v > 0)) return 1000
  const raw = v / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((x) => x >= raw) ?? pow * 10
  return step * 4
}

/* ───────── gráfico de 12 semanas ───────── */

function WeekChart({ weeks }: { weeks: CashWeek[] }) {
  const on = useIn()
  const [focus, setFocus] = React.useState(0)
  const max = niceMax(Math.max(...weeks.map((w) => w.expected + w.recurring), 1))
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i)
  const w = weeks[focus]
  const edge = focus <= 2 ? 'left' : focus >= weeks.length - 3 ? 'right' : 'mid'
  const x = ((focus + 0.5) / weeks.length) * 100
  return (
    <div className="min-w-0">
      <div className="relative h-[84px]" aria-hidden>
        <div
          className={cn('absolute top-0 w-max rounded-tip bg-inverse px-3 py-2 text-caption text-on-inverse transition-[left] duration-200 ease-[var(--ease-ui)] motion-reduce:transition-none', edge === 'mid' && '-translate-x-1/2')}
          style={edge === 'left' ? { left: 44 } : edge === 'right' ? { right: 0 } : { left: `calc(44px + (100% - 44px) * ${x / 100})` }}
        >
          <p className="font-semibold">Semana de {w.label}</p>
          <p className="mt-1 flex items-center gap-2"><span className="size-2.5 rounded-pill bg-accent" />Cobranças emitidas <b className="tnum ml-auto pl-3">{formatMoney(w.expected)}</b></p>
          <p className="mt-0.5 flex items-center gap-2"><span className="size-2.5 rounded-pill bg-[var(--bar-soft)]" />Recorrente previsto <b className="tnum ml-auto pl-3">{formatMoney(w.recurring)}</b></p>
        </div>
      </div>
      <div className="flex">
        <div className="relative w-11 shrink-0" style={{ height: PLOT }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 -translate-y-1/2 text-caption text-fg-3 tnum" style={{ bottom: (t / max) * PLOT }}>
              {formatAxisMoney(t).replace('R$ ', '')}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {ticks.map((t) => (
            <span key={t} aria-hidden className="absolute inset-x-0 border-t border-hairline" style={{ bottom: (t / max) * PLOT }} />
          ))}
          <ul aria-label="Caixa previsto por semana" className="relative flex gap-1 sm:gap-2" style={{ height: PLOT + 30 }}>
            {weeks.map((wk, i) => {
              const total = wk.expected + wk.recurring
              const hE = on ? Math.round((wk.expected / max) * PLOT) : 0
              const hR = on ? Math.round((wk.recurring / max) * PLOT) : 0
              const seg = (h: number, v: number) => (v > 0 ? Math.max(h, 8) : 0)
              return (
                <li key={wk.weekStart} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onMouseEnter={() => setFocus(i)}
                    onFocus={() => setFocus(i)}
                    onClick={() => setFocus(i)}
                    aria-label={`Semana de ${wk.label}${i === 0 ? ' (atual)' : ''}: ${formatMoney(total)}, sendo ${formatMoney(wk.expected)} em cobranças emitidas e ${formatMoney(wk.recurring)} de recorrente previsto`}
                    className="group relative flex h-full w-full flex-col items-center justify-end rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span aria-hidden className={cn('absolute inset-x-0 top-0 rounded-pill transition-colors duration-150', i === focus ? 'bg-hover' : 'bg-transparent')} style={{ bottom: 22 }} />
                    <span aria-hidden className="relative flex w-full max-w-[34px] flex-col-reverse items-stretch gap-0.5" style={{ marginBottom: 22 }}>
                      <span className="block rounded-pill bg-accent transition-[height] duration-[800ms] ease-[var(--ease-ui)] motion-reduce:transition-none" style={{ height: seg(hE, wk.expected), transitionDelay: `${i * 45}ms` }} />
                      <span className="block rounded-pill bg-[var(--bar-soft)] transition-[height] duration-[800ms] ease-[var(--ease-ui)] motion-reduce:transition-none" style={{ height: seg(hR, wk.recurring), transitionDelay: `${i * 45 + 60}ms` }} />
                    </span>
                    <span aria-hidden className={cn('absolute bottom-0 flex h-[22px] items-center text-caption', i === 0 ? 'font-semibold text-accent-ink' : i === focus ? 'font-semibold text-fg' : 'text-fg-3')}>
                      {i === 0 ? 'Hoje' : wk.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-body font-medium text-fg-2">
      <span aria-hidden className={cn('size-3 rounded-pill', color)} />
      {label}
    </span>
  )
}

function CashBlock() {
  const q = useQuery(() => getCashForecast(WEEKS), [])
  const [days, setDays] = React.useState<'d30' | 'd60' | 'd90'>('d30')
  if (q.error && !q.data) return <Banner tone="danger" title="Não foi possível carregar o caixa previsto." action={<Button size="sm" variant="secondary" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
  if (!q.data) {
    return (
      <div aria-busy="true" aria-label="Carregando o caixa previsto" className="grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
        <div className="h-[430px] rounded-card bg-raised p-6 @min-[1180px]/frame:col-span-8"><Skeleton shape="block" className="h-full" /></div>
        <div className="h-[430px] rounded-card bg-raised p-6 @min-[1180px]/frame:col-span-4"><Skeleton className="h-10 w-40" /><Skeleton className="mt-8 h-12 w-3/4" /><Skeleton className="mt-8 h-12 w-3/4" /></div>
      </div>
    )
  }
  const t = q.data.totals[days]
  return (
    <div className="grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
      <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-title-sub">
            Caixa das próximas 12 semanas
            <InfoTip label="Caixa das próximas 12 semanas" text="Por semana: cobranças em aberto que vencem nela (as já vencidas entram na primeira) e mensalidades de locações longas ainda não emitidas, com vencimento 15 dias depois da emissão." />
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Legend color="bg-accent" label="Cobranças emitidas" />
            <Legend color="bg-[var(--bar-soft)]" label="Recorrente previsto" />
          </div>
        </div>
        <div className="mt-4"><WeekChart weeks={q.data.weeks} /></div>
      </section>

      <section className="flex min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-sub">Previsão</h2>
          <Segmented<'d30' | 'd60' | 'd90'> label="Período da previsão" size="sm" value={days} onChange={setDays} options={[{ value: 'd30', label: '30 dias' }, { value: 'd60', label: '60 dias' }, { value: 'd90', label: '90 dias' }]} />
        </div>
        <dl className="mt-6 flex flex-1 flex-col justify-between gap-6">
          <div>
            <dt className="flex items-center gap-2 text-body-lg text-fg-2"><span aria-hidden className="size-3 rounded-pill bg-fg" />Total a entrar</dt>
            <dd className="mt-1 text-kpi-lg"><RollingMoney kpi value={t.total} /></dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-body-lg text-fg-2"><span aria-hidden className="size-3 rounded-pill bg-accent" />Cobranças emitidas</dt>
            <dd className="mt-1 text-kpi"><RollingMoney kpi value={t.expected} /></dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-body-lg text-fg-2"><span aria-hidden className="size-3 rounded-pill bg-[var(--bar-soft)]" />Recorrente previsto</dt>
            <dd className="mt-1 text-kpi"><RollingMoney kpi value={t.recurring} /></dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

/* ───────── o que o sistema recuperou ───────── */

const KIND: Record<RecoveredKind, { icon: LucideIcon; chip: string; bar: string; label: string }> = {
  avaria: { icon: Hammer, chip: 'bg-accent-soft text-accent-ink', bar: 'bg-accent', label: 'Avarias cobradas' },
  extra: { icon: ReceiptText, chip: 'bg-warn-soft text-warn-ink', bar: 'bg-warn', label: 'Extras faturados' },
  atraso: { icon: CalendarClock, chip: 'bg-ok-soft text-ok-ink', bar: 'bg-ok', label: 'Atrasados recuperados' },
  parado: { icon: Undo2, chip: 'bg-info-soft text-info-ink', bar: 'bg-info', label: 'Parados realugados' },
}

function parts(r: RecoveredMoney): { kind: RecoveredKind; value: number }[] {
  return [
    { kind: 'avaria', value: r.damagesCharged },
    { kind: 'extra', value: r.extrasBilled },
    { kind: 'atraso', value: r.overdueRecovered },
    { kind: 'parado', value: r.idleReRented },
  ]
}

function RecoveredBlock() {
  const cur = monthKey(today())
  const prev = addMonths(cur, -1)
  const [month, setMonth] = React.useState(cur)
  const q = useQuery(() => getRecoveredMoney(month), [month])
  const r = q.data
  const items: RecoveredItem[] = r?.items.slice(0, 5) ?? []
  return (
    <section className="mt-4 min-w-0 rounded-card bg-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-title-sub">
          <Sparkles size={20} strokeWidth={2} className="text-ok-ink" aria-hidden />
          O sistema recuperou
          <InfoTip label="O sistema recuperou" text="Avarias e extras que viraram cobrança no mês, atrasados que pagaram depois do lembrete e equipamentos parados há mais de 30 dias que voltaram a alugar." />
        </h2>
        <Segmented<string> label="Mês" size="sm" value={month} onChange={setMonth} options={[{ value: cur, label: monthName(cur) }, { value: prev, label: monthName(prev) }]} />
      </div>
      {q.error && !r ? (
        <Banner className="mt-4" tone="danger" title="Não foi possível carregar o recuperado." action={<Button size="sm" variant="secondary" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : !r ? (
        <div aria-busy="true" className="mt-6"><Skeleton className="h-12 w-60" /><Skeleton className="mt-6 h-5 rounded-pill" /></div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-8 @min-[1180px]/frame:grid-cols-2">
          <div className="min-w-0">
            <p className="text-kpi-lg text-ok-ink"><RollingMoney kpi value={r.total} /></p>
            <div className="mt-6 flex h-4 gap-1" role="img" aria-label={`Recuperado em ${monthName(month)}: ${parts(r).map((p) => `${KIND[p.kind].label} ${formatMoney(p.value)}`).join(', ')}`}>
              {r.total > 0 ? (
                parts(r).filter((p) => p.value > 0).map((p, i) => <span key={`${month}-${p.kind}`} className="min-w-3" style={{ flexGrow: p.value, flexBasis: 0 }}><GrowBar pct={100} delay={i * 90} className={KIND[p.kind].bar} /></span>)
              ) : (
                <span className="flex-1 rounded-pill bg-sunken" />
              )}
            </div>
            <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {parts(r).map((p) => (
                <li key={p.kind} className="flex items-center justify-between gap-3 text-body">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-fg-2"><span aria-hidden className={cn('size-3 shrink-0 rounded-pill', KIND[p.kind].bar)} /><span className="truncate">{KIND[p.kind].label}</span></span>
                  <span className="tnum font-semibold">{formatMoney(p.value)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            {items.length === 0 ? (
              <EmptyState icon={BadgeDollarSign} title="Nada recuperado neste mês ainda" />
            ) : (
              <ul className="flex flex-col gap-1">
                {items.map((it, i) => {
                  const k = KIND[it.kind]
                  return (
                    <li key={`${it.kind}-${it.ref?.id ?? i}-${it.at}`} className="flex items-center gap-3 py-1.5">
                      <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-pill', k.chip)}><k.icon size={18} strokeWidth={2} /></span>
                      <span className="min-w-0 flex-1 truncate text-body-lg font-medium" title={it.label}>{it.label}</span>
                      <span className="tnum shrink-0 text-body-lg font-semibold text-ok-ink">{formatMoney(it.value)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default function Caixa() {
  return (
    <Stagger gap={0.07}>
      <CashBlock />
      <RecoveredBlock />
    </Stagger>
  )
}

