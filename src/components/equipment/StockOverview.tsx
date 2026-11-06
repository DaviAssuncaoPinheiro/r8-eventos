import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeftRight, ArrowRight, CheckCheck, PackagePlus, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Card, IconCircle, ProductThumb, SegmentBar } from '@/components/ui'
import { PRODUCT, qtyLabel, type ProductGroup } from '@/data/mock'
import { daysFromToday } from '@/data/time'
import { cn } from '@/lib/utils'
import { dayLabel, rangeLabel, type ProductSplit, type ShortageGroup } from './model'

const EASE = [0.16, 1, 0.3, 1] as const

/* ───────────── alerta de falta ───────────── */

export function ShortageAlert({ groups, onShowDay }: { groups: ShortageGroup[]; onShowDay: (productId: ShortageGroup['productId'], offset: number) => void }) {
  const nav = useNavigate()
  const [done, setDone] = React.useState<Record<string, 'sub' | 'rem'>>({})
  if (!groups.length)
    return (
      <Card className="flex items-center gap-3 p-4">
        <IconCircle tone="green" size={40}>
          <CheckCheck className="size-[18px]" strokeWidth={2.2} />
        </IconCircle>
        <div>
          <div className="text-[14.5px] font-bold text-ink">Estoque cobre as reservas dos próximos 14 dias</div>
          <div className="text-[13px] font-medium text-ink-3">Nenhum produto passa do estoque.</div>
        </div>
      </Card>
    )

  return (
    <div className="grid gap-3">
      {groups.map((g) => {
        const p = PRODUCT[g.productId]
        const state = done[g.productId]
        const unitName = g.deficit === 1 ? p.unit[0] : p.unit[1]
        return (
          <motion.div
            key={g.productId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className={cn('rounded-[24px] p-2 transition-colors duration-300', state ? 'bg-green-soft' : 'bg-red-soft')}
          >
            <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <IconCircle tone="white" size={44} className="shadow-none">
                  {state ? <CheckCheck className="size-5 text-green" strokeWidth={2.2} /> : <TriangleAlert className="size-5 text-red" strokeWidth={2.2} />}
                </IconCircle>
                <div className="min-w-0">
                  <div className={cn('text-[13px] font-bold', state ? 'text-green' : 'text-red')}>
                    {state === 'sub' ? 'Sublocação pedida' : state === 'rem' ? 'Remanejamento em análise' : 'Falta de estoque'}
                  </div>
                  <h2 className="mt-0.5 text-[19px] leading-snug font-bold tracking-[-0.02em] text-ink">
                    Faltam <span className="num">{g.deficit}</span> {unitName} {rangeLabel(g.days)}
                  </h2>
                  <p className="mt-1 text-[13px] leading-snug font-medium text-ink-2">
                    Estoque de <span className="num">{p.stock}</span>. No pico, {dayLabel(g.peakOffset).toLowerCase()}, as reservas somam{' '}
                    <span className="num">{p.stock + g.deficit}</span> com as obras em andamento e a manutenção.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  disabled={!!state}
                  onClick={() => {
                    setDone((d) => ({ ...d, [g.productId]: 'sub' }))
                    toast.success(`Pedido de sublocação de ${qtyLabel(g.productId, g.deficit)}`, { description: 'Pedido enviado ao fornecedor parceiro. A resposta chega pelo WhatsApp.' })
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-4 text-[13.5px] font-semibold text-white transition-[background,transform] hover:bg-black-2 active:scale-[.97] disabled:opacity-40"
                >
                  <PackagePlus className="size-4" strokeWidth={2} /> Sublocar {g.deficit}
                </button>
                <button
                  disabled={!!state}
                  onClick={() => {
                    setDone((d) => ({ ...d, [g.productId]: 'rem' }))
                    toast.success('Remanejamento sugerido', { description: `Recolher ${g.deficit} unidades de obras com folga e devolver na segunda.` })
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-[13.5px] font-semibold text-ink shadow-pill transition-[background,transform] hover:bg-surface active:scale-[.97] disabled:opacity-40"
                >
                  <ArrowLeftRight className="size-4" strokeWidth={2} /> Remanejar
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {g.competing.map(({ rental, qty }) => (
                <button
                  key={rental.id}
                  onClick={() => nav(`/locacoes/${rental.id}`)}
                  className="group flex min-w-0 items-center gap-3 rounded-[18px] bg-card px-3.5 py-3 text-left shadow-card transition-shadow hover:shadow-lift"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-ink">{rental.title}</span>
                    <span className="block truncate text-[12px] font-medium text-ink-3">{rangeLabel(dayRange(rental.start, rental.end))}</span>
                  </span>
                  <span className="num inline-flex h-7 shrink-0 items-center rounded-full bg-muted px-2.5 text-[12px] font-bold text-ink">{qty}</span>
                </button>
              ))}
              <button
                onClick={() => onShowDay(g.productId, g.peakOffset)}
                className="group flex items-center justify-center gap-1.5 rounded-[18px] bg-white/55 px-3.5 py-3 text-[13px] font-bold text-ink transition-colors hover:bg-white/80"
              >
                Ver o dia na grade <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function dayRange(start: string, end: string) {
  const a = daysFromToday(start)
  const b = daysFromToday(end)
  return Array.from({ length: b - a + 1 }, (_, i) => a + i)
}

/* ───────────── cartões de produto ───────────── */

export const SPLIT_COLORS = {
  campo: 'var(--color-black)',
  reservado: 'var(--color-brand)',
  livre: 'var(--color-green)',
  manutencao: 'var(--color-yellow)',
}

function Legend() {
  const items: [keyof typeof SPLIT_COLORS, string][] = [
    ['campo', 'Em campo'],
    ['reservado', 'Reservado'],
    ['livre', 'Livre na base'],
    ['manutencao', 'Manutenção'],
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-ink-2">
      {items.map(([k, l]) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: SPLIT_COLORS[k] }} />
          {l}
        </span>
      ))}
    </div>
  )
}

export function ProductCards({ splits, group, onPick }: { splits: ProductSplit[]; group: ProductGroup; onPick: (id: ProductSplit['product']['id']) => void }) {
  const list = splits.filter((s) => s.product.group === group)
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <Legend />
        <span className="text-[12.5px] font-medium text-ink-3">Reservado: o que já tem data marcada nos próximos 14 dias</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((s, i) => {
          const p = s.product
          const pct = Math.round(((s.campo + s.reservado) / p.stock) * 100)
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.04, ease: EASE }}
              onClick={() => onPick(p.id)}
              className="group flex min-w-0 flex-col rounded-[24px] bg-card p-2 text-left shadow-card transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center gap-3 p-2">
                <ProductThumb productId={p.id} size={56} rounded="xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-ink">{p.short}</div>
                  <div className="truncate text-[12.5px] font-medium text-ink-3">{p.note}</div>
                </div>
                {s.falta > 0 ? (
                  <Badge tone="late">Faltam {s.falta}</Badge>
                ) : pct >= 90 ? (
                  <Badge tone="warn">{pct}% ocupado</Badge>
                ) : null}
              </div>
              <div className="mt-1 rounded-[18px] bg-surface p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-ink-3">Livres agora</span>
                  <span className="text-[12.5px] font-semibold text-ink-3">
                    Estoque <span className="num text-ink">{p.stock.toLocaleString('pt-BR')}</span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className={cn('num text-[30px] leading-none font-bold tracking-[-0.03em]', s.livre === 0 ? 'text-red' : 'text-ink')}>{s.livre.toLocaleString('pt-BR')}</span>
                  <span className="text-[13px] font-semibold text-ink-3">{s.livre === 1 ? p.unit[0] : p.unit[1]}</span>
                </div>
                <SegmentBar
                  className="mt-3"
                  parts={[
                    { value: s.campo, color: SPLIT_COLORS.campo },
                    { value: s.reservado, color: SPLIT_COLORS.reservado },
                    { value: s.livre, color: SPLIT_COLORS.livre },
                    { value: s.manutencao, color: SPLIT_COLORS.manutencao },
                  ]}
                />
                <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                  {(
                    [
                      ['Campo', s.campo],
                      ['Reserv.', s.reservado],
                      ['Livre', s.livre],
                      ['Manut.', s.manutencao],
                    ] as [string, number][]
                  ).map(([l, n]) => (
                    <div key={l} className="min-w-0">
                      <div className="num text-[14px] font-bold text-ink">{n.toLocaleString('pt-BR')}</div>
                      <div className="truncate text-[11.5px] font-medium text-ink-3">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
