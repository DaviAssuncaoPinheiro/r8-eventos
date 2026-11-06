import * as React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { QrCode, TriangleAlert } from 'lucide-react'
import { Card, ProductThumb } from '@/components/ui'
import { PRODUCT, qtyLabel, unitsOf, type Occurrence, type Rental } from '@/data/mock'
import { brl, cn } from '@/lib/utils'

const SHOW = 10

function UnitChips({ ids, openUnits }: { ids: string[]; openUnits: Set<string> }) {
  const [all, setAll] = React.useState(false)
  const shown = all ? ids : ids.slice(0, SHOW)
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {shown.map((id) => {
        const bad = openUnits.has(id)
        return (
          <Link
            key={id}
            to={`/u/${id}`}
            target="_blank"
            title={bad ? `${id}: ocorrência aberta. Abrir página do QR` : `Abrir página do QR de ${id}`}
            className={cn(
              'num inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold transition-colors',
              bad ? 'bg-red-soft text-red hover:bg-[#fbd7d8]' : 'bg-muted text-ink-2 hover:bg-muted-2 hover:text-ink',
            )}
          >
            {bad ? <TriangleAlert className="size-3" strokeWidth={2.4} /> : <QrCode className="size-3 text-ink-3" strokeWidth={2.2} />}
            {id}
          </Link>
        )
      })}
      {ids.length > SHOW && (
        <button onClick={() => setAll((v) => !v)} className="inline-flex h-7 items-center rounded-full bg-card px-2.5 text-[12px] font-semibold text-ink shadow-pill hover:bg-surface">
          {all ? 'Mostrar menos' : `+${ids.length - SHOW}`}
        </button>
      )}
    </div>
  )
}

export function ItemsCard({ rental, occurrences }: { rental: Rental; occurrences: Occurrence[] }) {
  const units = unitsOf(rental.id)
  const openUnits = new Set(occurrences.filter((o) => o.status === 'aberta').map((o) => o.unitId))
  const onSite = rental.status === 'ativa' || rental.status === 'retirada'
  const daily = rental.kind === 'evento'

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Itens da locação</h3>
        </div>
      </div>
      <ul className="px-5 pt-2 pb-4">
        {rental.items.map((it, i) => {
          const p = PRODUCT[it.productId]
          const ids = units.filter((u) => u.productId === it.productId).map((u) => u.id)
          const price = daily ? p.priceDay : p.priceMonth ?? p.priceDay * 30
          return (
            <motion.li
              key={it.productId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className={cn('py-3.5', i > 0 && 'border-t border-line')}
            >
              <div className="flex items-center gap-3">
                <ProductThumb productId={it.productId} size={48} rounded="xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-ink">{p.name}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="num text-[15px] font-bold text-ink">{qtyLabel(it.productId, it.qty)}</div>
                </div>
              </div>
              {ids.length > 0 && <UnitChips ids={ids} openUnits={openUnits} />}
            </motion.li>
          )
        })}
      </ul>
    </Card>
  )
}
