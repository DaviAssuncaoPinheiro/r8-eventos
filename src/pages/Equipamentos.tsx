import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Boxes, QrCode, Toilet, Warehouse, Wrench, type LucideIcon } from 'lucide-react'
import { Button, IconCircle, Segmented } from '@/components/ui'
import { AvailabilityGrid, type CellSel } from '@/components/equipment/AvailabilityGrid'
import { ProductCards, ShortageAlert } from '@/components/equipment/StockOverview'
import { UnitDrawer } from '@/components/equipment/UnitDrawer'
import { UnitTable } from '@/components/equipment/UnitTable'
import { HORIZON, productSplits, shortageGroups, unitRows } from '@/components/equipment/model'
import { DEMO_UNIT, PRODUCT, UNIT, demandOn, type ProductGroup } from '@/data/mock'
import { useDemo, useJobs } from '@/store'

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

function Metric({ icon: Icon, label, value, sub, subTone }: { icon: LucideIcon; label: string; value: React.ReactNode; sub?: React.ReactNode; subTone?: 'red' | 'green' | 'muted' }) {
  return (
    <div className="flex min-w-0 items-center gap-3.5 px-5 py-4">
      <IconCircle size={44}>
        <Icon className="size-[18px]" strokeWidth={1.9} />
      </IconCircle>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-ink-2">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="num text-[24px] leading-tight font-bold tracking-[-0.02em] text-ink">{value}</span>
          {sub && <span className={subTone === 'red' ? 'text-[12px] font-semibold text-red' : subTone === 'green' ? 'text-[12px] font-semibold text-green' : 'text-[12px] font-semibold text-ink-3'}>{sub}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Equipamentos() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const jobs = useJobs()
  const reports = useDemo((s) => s.reports)
  const overrides = useDemo((s) => s.unitState)
  const occurrences = useDemo((s) => s.occurrences)

  const splits = React.useMemo(() => productSplits(overrides), [overrides])
  const groups = React.useMemo(() => shortageGroups(overrides), [overrides])
  const openByUnit = React.useMemo(() => {
    const m: Record<string, number> = {}
    for (const o of occurrences) if (o.status === 'aberta') m[o.unitId] = (m[o.unitId] ?? 0) + 1
    return m
  }, [occurrences])
  const rows = React.useMemo(() => {
    const list = unitRows(jobs, reports, overrides, openByUnit)
    return list.sort((a, b) => b.openOcc - a.openOcc)
  }, [jobs, reports, overrides, openByUnit])

  const [group, setGroup] = React.useState<ProductGroup>('Banheiros')
  const [sel, setSel] = React.useState<CellSel>(() => (groups[0] ? { productId: groups[0].productId, offset: groups[0].peakOffset } : { productId: 'bq', offset: 0 }))

  const unitId = sp.get('u')
  const openUnit = (id: string) => {
    const next = new URLSearchParams(sp)
    next.set('u', id)
    setSp(next, { replace: true })
  }
  const closeUnit = () => {
    const next = new URLSearchParams(sp)
    next.delete('u')
    setSp(next, { replace: true })
  }

  const toilets = splits.filter((s) => s.product.cleanable)
  const sum = (k: 'campo' | 'livre' | 'manutencao' | 'reservado') => toilets.reduce((a, s) => a + s[k], 0)
  const stock = toilets.reduce((a, s) => a + s.product.stock, 0)
  // pico do banheiro químico standard, o produto que mais gira
  const occupancy = React.useMemo(() => {
    let peak = 0
    for (let d = 0; d < HORIZON; d++) peak = Math.max(peak, demandOn(d).bq)
    return Math.round((peak / PRODUCT.bq.stock) * 100)
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 lg:pb-8">
      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">Equipamentos</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => nav(`/u/${DEMO_UNIT}`)}>
            <QrCode className="size-4" strokeWidth={2} /> Ver página do QR
          </Button>
          <Button variant="primary" onClick={() => scrollToId('patrimonio')}>
            <Boxes className="size-4" strokeWidth={2} /> Patrimônio
          </Button>
        </div>
      </div>

      <ShortageAlert
        groups={groups}
        onShowDay={(productId, offset) => {
          setSel({ productId, offset })
          scrollToId('disponibilidade')
        }}
      />

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <h2 className="text-[19px] font-bold tracking-[-0.02em] text-ink">Estoque por produto</h2>
          <Segmented<ProductGroup>
            value={group}
            onChange={setGroup}
            size="md"
            options={[
              { value: 'Banheiros', label: 'Banheiros' },
              { value: 'Estruturas', label: 'Estruturas' },
            ]}
          />
        </div>
        <ProductCards
          splits={splits}
          group={group}
          onPick={(productId) => {
            const s = splits.find((x) => x.product.id === productId)
            setSel({ productId, offset: s?.peak.offset ?? 0 })
            scrollToId('disponibilidade')
          }}
        />
      </section>

      <section id="disponibilidade" className="mt-6 scroll-mt-4">
        <AvailabilityGrid sel={sel} onSel={setSel} />
      </section>

      <section id="patrimonio" className="mt-6 scroll-mt-4">
        <UnitTable rows={rows} onOpen={openUnit} />
      </section>

      <UnitDrawer unitId={unitId && UNIT[unitId] ? unitId : null} onClose={closeUnit} />
    </div>
  )
}
