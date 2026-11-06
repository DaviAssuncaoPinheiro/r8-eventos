// Cálculos da tela de Equipamentos e da página do QR (estoque, unidades, limpezas por unidade).
import { BAIRRO, ZONE } from '@/data/geo'
import { CLIENT, NOW, simNow, PRODUCT, PRODUCTS, RENTAL, RENTALS, UNITS, demandOn, onSite, rentalsUsing, shortages, type Job, type Product, type ProductId, type Rental, type Unit, type UnitState } from '@/data/mock'
import { daysFromToday, day, fmt, onWeekday } from '@/data/time'
import { jobReport } from '@/lib/history'
import type { ServiceReport } from '@/store'

export const HORIZON = 14

/* ───────────── estoque por produto ───────────── */

export interface ProductSplit {
  product: Product
  campo: number
  reservado: number
  livre: number
  manutencao: number
  /** quanto passa do estoque no pico dos próximos dias (0 se não falta) */
  falta: number
  peak: { offset: number; need: number }
}

/** Situação efetiva da unidade (com mudanças feitas na demonstração) */
export const stateOf = (u: Unit, overrides: Record<string, UnitState>): UnitState => overrides[u.id] ?? u.state

export function productSplits(overrides: Record<string, UnitState>): ProductSplit[] {
  const demand = Array.from({ length: HORIZON }, (_, d) => demandOn(d, overrides))
  return PRODUCTS.map((p) => {
    let campo = 0
    let manutencao = 0
    if (p.prefix) {
      for (const u of UNITS) {
        if (u.productId !== p.id) continue
        const s = stateOf(u, overrides)
        if (s === 'campo') campo++
        else if (s === 'manutencao') manutencao++
      }
    } else {
      for (const r of RENTALS) {
        if ((r.status === 'ativa' || r.status === 'retirada') && onSite(r, 0)) campo += r.items.filter((i) => i.productId === p.id).reduce((a, i) => a + i.qty, 0)
      }
    }
    const base = Math.max(0, p.stock - campo - manutencao)
    let peak = { offset: 0, need: 0 }
    demand.forEach((dem, d) => {
      if (dem[p.id] > peak.need) peak = { offset: d, need: dem[p.id] }
    })
    const extra = Math.max(0, peak.need - campo - manutencao)
    const reservado = Math.min(base, extra)
    return { product: p, campo, reservado, livre: base - reservado, manutencao, falta: Math.max(0, peak.need - p.stock), peak }
  })
}

/* ───────────── disponibilidade ───────────── */

export interface DayCell {
  offset: number
  free: number
  need: number
  level: 'falta' | 'baixo' | 'ok'
}

export function availability(overrides: Record<string, UnitState> = {}): Record<ProductId, DayCell[]> {
  const days = Array.from({ length: HORIZON }, (_, d) => ({ d, dem: demandOn(d, overrides) }))
  return Object.fromEntries(
    PRODUCTS.map((p) => [
      p.id,
      days.map(({ d, dem }) => {
        const free = p.stock - dem[p.id]
        return { offset: d, free, need: dem[p.id], level: free < 0 ? 'falta' : free < p.stock * 0.1 ? 'baixo' : 'ok' } as DayCell
      }),
    ]),
  ) as Record<ProductId, DayCell[]>
}

/* ───────────── faltas ───────────── */

export interface ShortageGroup {
  productId: ProductId
  days: number[]
  deficit: number
  peakOffset: number
  /** eventos que entram no período e disputam o estoque */
  competing: { rental: Rental; qty: number }[]
}

export function shortageGroups(overrides: Record<string, UnitState> = {}): ShortageGroup[] {
  const by = new Map<ProductId, ShortageGroup>()
  for (const s of shortages(HORIZON - 1, overrides)) {
    const g = by.get(s.productId) ?? { productId: s.productId, days: [], deficit: 0, peakOffset: s.offset, competing: [] }
    g.days.push(s.offset)
    if (s.need - s.stock > g.deficit) {
      g.deficit = s.need - s.stock
      g.peakOffset = s.offset
    }
    by.set(s.productId, g)
  }
  for (const g of by.values()) {
    g.competing = rentalsUsing(g.productId, g.peakOffset)
      .filter((r) => r.status === 'montagem')
      .map((r) => ({ rental: r, qty: r.items.filter((i) => i.productId === g.productId).reduce((a, i) => a + i.qty, 0) }))
      .sort((a, b) => b.qty - a.qty)
  }
  return [...by.values()]
}

/* ───────────── datas ───────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const dayShort = (offset: number) => cap(fmt.weekdayShort(day(offset)))
export const dayNum = (offset: number) => fmt.date(day(offset)).slice(0, 5)
export const dayLabel = (offset: number) => (offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : `${dayShort(offset)}, ${dayNum(offset)}`)

/** "de sáb a seg" / "amanhã" */
export function rangeLabel(days: number[]) {
  const a = Math.min(...days)
  const b = Math.max(...days)
  const name = (d: number) => (d === 0 ? 'hoje' : d === 1 ? 'amanhã' : fmt.weekdayShort(day(d)))
  if (a === b) return a <= 1 ? name(a) : onWeekday(day(a))
  return `de ${name(a)} a ${name(b)}`
}

/* ───────────── limpezas por locação ───────────── */

export interface CleanInfo {
  job: Job
  report: ServiceReport
}

/** Limpezas concluídas da locação, da mais recente para a mais antiga */
export function cleaningsOf(rentalId: string, jobs: Job[], reports: Record<string, ServiceReport>, limit = 5): CleanInfo[] {
  const out: CleanInfo[] = []
  const list = jobs
    .filter((j) => j.rentalId === rentalId && j.type === 'Limpeza' && j.status === 'concluido' && daysFromToday(j.start) <= 0)
    .sort((a, b) => +new Date(b.start) - +new Date(a.start))
  for (const j of list) {
    const report = jobReport(j, reports[j.id])
    if (report) out.push({ job: j, report })
    if (out.length >= limit) break
  }
  return out
}

/** Próxima limpeza da locação (inclui a que está em andamento) */
export function nextCleaningOf(rentalId: string, jobs: Job[]) {
  return jobs
    .filter((j) => j.rentalId === rentalId && j.type === 'Limpeza' && (j.status === 'agendado' || j.status === 'a-caminho' || j.status === 'em-andamento') && daysFromToday(j.start) >= 0)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0]
}

/** Próxima retirada agendada da locação */
export function nextPickupOf(rentalId: string, jobs: Job[]) {
  return jobs
    .filter((j) => j.rentalId === rentalId && j.type === 'Retirada' && j.status !== 'concluido' && j.status !== 'cancelado')
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0]
}

/* ───────────── linhas do patrimônio ───────────── */

export interface UnitRow {
  unit: Unit
  product: Product
  state: UnitState
  rental?: Rental
  place: string
  region?: string
  last?: CleanInfo
  openOcc: number
}

export function unitRows(jobs: Job[], reports: Record<string, ServiceReport>, overrides: Record<string, UnitState>, openByUnit: Record<string, number>): UnitRow[] {
  const lastByRental = new Map<string, CleanInfo | undefined>()
  return UNITS.map((u) => {
    const rental = u.rentalId ? RENTAL[u.rentalId] : undefined
    if (rental && !lastByRental.has(rental.id)) lastByRental.set(rental.id, cleaningsOf(rental.id, jobs, reports, 1)[0])
    const state = stateOf(u, overrides)
    return {
      unit: u,
      product: PRODUCT[u.productId],
      state,
      rental: state === 'campo' ? rental : undefined,
      place: state === 'campo' && rental ? rental.title : state === 'manutencao' ? 'Oficina da base' : 'Base R8 · SIA',
      region: state === 'campo' && rental ? ZONE[BAIRRO[rental.bairro].zone].short : undefined,
      last: state === 'campo' && rental ? lastByRental.get(rental.id) : undefined,
      openOcc: openByUnit[u.id] ?? 0,
    }
  })
}

export const STATE_LABEL: Record<UnitState, { label: string; dot: string }> = {
  campo: { label: 'Em campo', dot: 'var(--color-green)' },
  base: { label: 'Na base', dot: 'var(--color-ink-4)' },
  manutencao: { label: 'Manutenção', dot: 'var(--color-yellow)' },
}

export const clientOf = (r: Rental) => CLIENT[r.clientId]

/** Link público da página do QR */
export const qrUrl = (unitId: string) => `${window.location.origin}${window.location.pathname}#/u/${unitId}`

/** "há 2 h", "há 3 dias" */
export function ago(iso: string) {
  const ref = simNow().getTime()
  const min = Math.max(1, Math.round((ref - new Date(iso).getTime()) / 60000))
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}
