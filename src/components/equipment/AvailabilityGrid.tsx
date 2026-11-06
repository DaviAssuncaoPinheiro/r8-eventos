import * as React from 'react'
import { useDemo } from '@/store'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { Badge, ProductThumb, Segmented } from '@/components/ui'
import { CLIENT, PRODUCT, PRODUCTS, UNITS, qtyLabel, rentalsUsing, type ProductGroup, type ProductId } from '@/data/mock'
import { daysFromToday } from '@/data/time'
import { RENTAL_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'
import { HORIZON, availability, dayLabel, dayNum, dayShort } from './model'

const EASE = [0.16, 1, 0.3, 1] as const

export interface CellSel {
  productId: ProductId
  offset: number
}

const CELL: Record<'falta' | 'baixo' | 'ok', string> = {
  falta: 'bg-red-soft text-red',
  baixo: 'bg-yellow-soft text-yellow-ink',
  ok: 'bg-surface text-ink',
}

export function AvailabilityGrid({ sel, onSel }: { sel: CellSel; onSel: (s: CellSel) => void }) {
  const [group, setGroup] = React.useState<ProductGroup | 'todos'>('todos')
  const overrides = useDemo((s) => s.unitState)
  const grid = React.useMemo(() => availability(overrides), [overrides])
  const products = PRODUCTS.filter((p) => group === 'todos' || p.group === group)
  const days = Array.from({ length: HORIZON }, (_, d) => d)

  return (
    <div className="rounded-[28px] bg-card p-2 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Disponibilidade</h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-ink-3">Quanto sobra livre em cada dia, já descontando obras, eventos e manutenção</p>
        </div>
        <Segmented<ProductGroup | 'todos'>
          value={group}
          onChange={setGroup}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'Banheiros', label: 'Banheiros' },
            { value: 'Estruturas', label: 'Estruturas' },
          ]}
        />
      </div>

      <div className="scroll-thin overflow-x-auto pb-1">
        <table className="w-full min-w-[920px] border-separate border-spacing-[3px] text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[190px] bg-card px-2 text-[12.5px] font-semibold text-ink-3">Produto</th>
              {days.map((d) => (
                <th key={d} className="p-0 text-center">
                  <span
                    className={cn(
                      'flex h-11 flex-col items-center justify-center rounded-[14px] leading-tight',
                      d === 0 ? 'bg-black text-white' : sel.offset === d ? 'bg-muted-2 text-ink' : 'text-ink-3',
                    )}
                  >
                    <span className="text-[11.5px] font-semibold">{d === 0 ? 'Hoje' : dayShort(d)}</span>
                    <span className={cn('num text-[12px] font-bold', d === 0 ? 'text-white/70' : 'text-ink-2')}>{dayNum(d)}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <th className="sticky left-0 z-10 bg-card px-2 py-0 font-normal">
                  <span className="flex items-center gap-2.5">
                    <ProductThumb productId={p.id} size={30} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">{p.short}</span>
                      <span className="num block text-[11.5px] font-medium text-ink-3">de {p.stock.toLocaleString('pt-BR')}</span>
                    </span>
                  </span>
                </th>
                {grid[p.id].map((c) => {
                  const on = sel.productId === p.id && sel.offset === c.offset
                  return (
                    <td key={c.offset} className="p-0">
                      <button
                        onClick={() => onSel({ productId: p.id, offset: c.offset })}
                        aria-label={`${p.short}, ${dayLabel(c.offset)}: ${c.free} livres`}
                        aria-pressed={on}
                        className={cn(
                          'num flex h-10 w-full min-w-[50px] items-center justify-center rounded-[12px] text-[13px] font-bold transition-[box-shadow,transform] duration-150 active:scale-[.95]',
                          CELL[c.level],
                          on ? 'ring-2 ring-black' : 'hover:ring-1 hover:ring-line-2',
                        )}
                      >
                        {c.free < 0 ? `−${Math.abs(c.free)}` : c.free.toLocaleString('pt-BR')}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pt-2 pb-1 text-[12px] font-semibold text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[4px] bg-red-soft ring-1 ring-red/30" /> Falta</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[4px] bg-yellow-soft ring-1 ring-yellow/50" /> Menos de 10% livre</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[4px] bg-surface ring-1 ring-line-2" /> Folga</span>
      </div>

      <DayDetail sel={sel} />
    </div>
  )
}

function DayDetail({ sel }: { sel: CellSel }) {
  const nav = useNavigate()
  const p = PRODUCT[sel.productId]
  const rentals = rentalsUsing(sel.productId, sel.offset)
  const overrides = useDemo((s) => s.unitState)
  const maint = UNITS.filter((u) => u.productId === sel.productId && (overrides[u.id] ?? u.state) === 'manutencao').length
  const need = rentals.reduce((a, r) => a + r.items.filter((i) => i.productId === sel.productId).reduce((x, i) => x + i.qty, 0), 0) + maint
  const free = p.stock - need

  return (
    <div className="mt-2 rounded-[22px] bg-surface p-2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${sel.productId}-${sel.offset}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2 pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <ProductThumb productId={p.id} size={40} />
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold text-ink">
                  {p.short}, {dayLabel(sel.offset).toLowerCase()}
                </div>
                <div className="text-[12.5px] font-medium text-ink-3">
                  <span className="num">{need.toLocaleString('pt-BR')}</span> comprometidos de <span className="num">{p.stock.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
            {free < 0 ? <Badge tone="late">Faltam {-free}</Badge> : <Badge tone={free < p.stock * 0.1 ? 'warn' : 'ok'}>{qtyLabel(p.id, free)} {free === 1 ? 'livre' : 'livres'}</Badge>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rentals.map((r) => {
              const qty = r.items.filter((i) => i.productId === sel.productId).reduce((a, i) => a + i.qty, 0)
              const st = RENTAL_STATUS[r.status]
              const d0 = daysFromToday(r.start)
              const d1 = daysFromToday(r.end)
              return (
                <button key={r.id} onClick={() => nav(`/locacoes/${r.id}`)} className="group flex min-w-0 items-center gap-3 rounded-[18px] bg-card px-3.5 py-3 text-left shadow-card transition-shadow hover:shadow-lift">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-ink">{r.title}</span>
                    <span className="block truncate text-[12px] font-medium text-ink-3">
                      {CLIENT[r.clientId].name} · {r.kind === 'obra' ? `obra até ${dayNum(d1)}` : d0 === d1 ? dayLabel(d0) : `${dayNum(d0)} a ${dayNum(d1)}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="num text-[14px] font-bold text-ink">{qty.toLocaleString('pt-BR')}</span>
                    {r.status === 'montagem' && <span className="text-[11px] font-semibold text-brand">{st.label}</span>}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </button>
              )
            })}
            {maint > 0 && (
              <div className="flex min-w-0 items-center gap-3 rounded-[18px] bg-card/60 px-3.5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold text-ink">Manutenção</span>
                  <span className="block truncate text-[12px] font-medium text-ink-3">Oficina da base</span>
                </span>
                <span className="num text-[14px] font-bold text-ink">{maint}</span>
              </div>
            )}
            {!rentals.length && !maint && <div className="px-3 py-4 text-[13px] font-medium text-ink-3">Nenhuma reserva neste dia. Tudo livre na base.</div>}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
