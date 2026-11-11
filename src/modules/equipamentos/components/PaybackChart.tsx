import * as React from 'react'
import { addMonths, monthLabel } from '@/domain/dates'
import { formatMoney } from '@/lib/format'
import type { UnitPayback } from '@/services'
import { cn } from '@/ui'

const W = 520
const H = 168
const PAD = { l: 8, r: 16, t: 34, b: 28 }
const MAX_PROJ = 36

/** Receita acumulada da unidade contra o custo de aquisição: linha cheia até hoje, tracejada até se pagar. */
export function PaybackChart({ data }: { data: UnitPayback }) {
  const id = React.useId().replace(/:/g, '')
  const m = data.months
  const paid = data.total >= data.purchasePrice
  const proj = paid ? 0 : Math.min(MAX_PROJ, data.remainingMonths)
  const span = Math.max(1, m.length - 1 + proj)
  const top = Math.max(data.purchasePrice, data.total, data.total + data.perMonth * proj) * 1.14 || 1
  const x = (i: number) => PAD.l + (i / span) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b)
  const pts = m.map((p, i) => [x(i), y(p.cumulative)] as const)
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
  const lastI = m.length - 1
  const [lx, ly] = pts[lastI] ?? [PAD.l, y(0)]
  const endX = x(lastI + proj)
  const endY = y(Math.min(top, data.total + data.perMonth * proj))
  const area = `${line} L${lx.toFixed(1)} ${(H - PAD.b).toFixed(1)} L${pts[0]?.[0].toFixed(1) ?? PAD.l} ${(H - PAD.b).toFixed(1)} Z`
  const costY = y(data.purchasePrice)
  const nowKey = m[lastI]?.key
  const endKey = nowKey ? addMonths(nowKey, proj) : undefined
  const over = !paid && data.remainingMonths > MAX_PROJ
  const chip = paid
    ? { text: `Se pagou em ${data.paidInMonths ?? m.length} ${(data.paidInMonths ?? m.length) === 1 ? 'mês' : 'meses'}`, cls: 'bg-ok-soft text-ok-ink' }
    : over
      ? { text: 'Mais de 3 anos para se pagar', cls: 'bg-warn-soft text-warn-ink' }
      : { text: `Se paga em ${data.remainingMonths} ${data.remainingMonths === 1 ? 'mês' : 'meses'}`, cls: 'bg-accent-soft text-accent-ink' }
  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Receita acumulada de ${formatMoney(data.total)} contra o custo de ${formatMoney(data.purchasePrice)}. ${chip.text}.`} className="block w-full overflow-visible">
        <defs>
          <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* custo de aquisição */}
        <line x1={PAD.l} x2={W - PAD.r} y1={costY} y2={costY} stroke="var(--fg)" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
        <g transform={`translate(${PAD.l} ${costY - 9})`}>
          <text fontSize="12" fontWeight="600" fill="var(--fg-2)" className="tnum">
            Custo {formatMoney(data.purchasePrice)}
          </text>
        </g>
        {m.length > 1 ? <path d={area} fill={`url(#g${id})`} /> : null}
        {proj > 0 ? <line x1={lx} y1={ly} x2={endX} y2={endY} stroke="var(--accent)" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round" /> : null}
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="ds-route" />
        {/* hoje */}
        <circle cx={lx} cy={ly} r="9" fill="var(--accent)" opacity="0.18" className="ds-pulse" />
        <circle cx={lx} cy={ly} r="5.5" fill="var(--raised)" stroke="var(--accent)" strokeWidth="3" />
        {proj > 0 && !over ? <circle cx={endX} cy={endY} r="6" fill="var(--accent)" stroke="var(--raised)" strokeWidth="2" /> : null}
        {/* meses */}
        {nowKey ? (
          <>
            <text x={pts[0][0]} y={H - 6} fontSize="12" fill="var(--fg-3)" textAnchor="start">
              {monthLabel(m[0].key)}
            </text>
            {m.length > 2 ? (
              <text x={lx} y={H - 6} fontSize="12" fill="var(--fg-3)" textAnchor={proj ? 'middle' : 'end'}>
                {monthLabel(nowKey)}
              </text>
            ) : null}
            {proj > 0 && endKey ? (
              <text x={endX} y={H - 6} fontSize="12" fontWeight="600" fill="var(--fg-2)" textAnchor="end">
                {monthLabel(endKey)}
              </text>
            ) : null}
          </>
        ) : null}
      </svg>
      <span className={cn('mt-1 inline-flex h-7 items-center rounded-pill px-3 text-body font-semibold', chip.cls)}>{chip.text}</span>
    </div>
  )
}
