/* Relatórios: ocupação, receita por cliente e por equipamento, desempenho das equipes e relatório mensal do cliente. */
import { getData } from '@/data/db'
import { dayOf, eachDay, monthEnd, monthLabelLong, monthKey, monthStart, today as todayFn } from '@/domain/dates'
import { getSegment } from '@/domain/segments'
import type { Client, ClientKind, DbData, Damage, EquipmentType, ISODate, ServiceType, Team } from '@/domain/types'
import { call } from './config'
import { holdsUnits, itemRevenue, lookup, mapById, overlapDays } from './common'
import { receiptsOf, type ServiceReceipt } from './clientes'
import { filterChargesSync, type ChargeView } from './financeiro'

export interface DateRange {
  from: ISODate
  to: ISODate
}

const r2 = (n: number) => Math.round(n * 100) / 100

/* ───────────────────────── Ocupação ───────────────────────── */

export interface OccupancyReport {
  points: { date: ISODate; inField: number; reserved: number; total: number; pct: number }[]
  avgPct: number
  peak: { date: ISODate; pct: number }
  byType: { type: EquipmentType; avgPct: number; avgUnits: number; total: number }[]
}

export function computeOccupancy(data: DbData, range: DateRange, today: ISODate = todayFn()): OccupancyReport {
  const total = data.units.length
  const unitType = new Map(data.units.map((u) => [u.id, u.typeId]))
  const typeTotals = new Map<string, number>()
  for (const u of data.units) typeTotals.set(u.typeId, (typeTotals.get(u.typeId) ?? 0) + 1)
  const days = eachDay(range.from, range.to)
  const sumByType = new Map<string, number>()
  const points = days.map((date) => {
    let inField = 0
    let reserved = 0
    for (const r of data.rentals) {
      if (!holdsUnits(r)) continue
      let state: 'field' | 'reserved' | null = null
      if (date < today) {
        if (r.status !== 'confirmada' && r.start <= date && date <= r.end) state = 'field'
      } else if (r.status === 'em_campo') {
        if (r.start <= date && date <= (r.end < today ? today : r.end)) state = 'field'
      } else if (r.status === 'confirmada' && r.start <= date && date <= r.end) state = 'reserved'
      if (!state) continue
      for (const it of r.items)
        for (const id of it.unitIds) {
          if (state === 'field') inField++
          else reserved++
          sumByType.set(unitType.get(id)!, (sumByType.get(unitType.get(id)!) ?? 0) + 1)
        }
    }
    return { date, inField, reserved, total, pct: total ? Math.round(((inField + reserved) / total) * 1000) / 10 : 0 }
  })
  const n = Math.max(1, points.length)
  const avgPct = Math.round((points.reduce((a, p) => a + p.pct, 0) / n) * 10) / 10
  const peakP = points.reduce((a, p) => (p.pct > a.pct ? p : a), points[0] ?? { date: range.from, pct: 0 })
  return {
    points,
    avgPct,
    peak: { date: peakP.date, pct: peakP.pct },
    byType: data.types.map((type) => {
      const avgUnits = (sumByType.get(type.id) ?? 0) / n
      const tot = typeTotals.get(type.id) ?? 0
      return { type, avgPct: tot ? Math.round((avgUnits / tot) * 1000) / 10 : 0, avgUnits: Math.round(avgUnits * 10) / 10, total: tot }
    }),
  }
}

/** Ocupação diária no período (em campo + reservado) e média por tipo */
export function getOccupancyReport(range: DateRange): Promise<OccupancyReport> {
  return call(() => computeOccupancy(getData(), range))
}

/* ───────────────────────── Receita ───────────────────────── */

export interface RevenueByClientRow {
  client: Client
  kind: ClientKind
  value: number
  charges: number
  sharePct: number
}

/** Receita recebida (cobranças pagas no período) por cliente, maior primeiro */
export function getRevenueByClient(range: DateRange): Promise<{ rows: RevenueByClientRow[]; total: number }> {
  return call(() => {
    const data = getData()
    const clients = mapById(data.clients)
    const by = new Map<string, { value: number; n: number }>()
    for (const c of data.charges) {
      if (c.status !== 'paga' || !c.paidAt || c.paidAt < range.from || c.paidAt > range.to) continue
      const cur = by.get(c.clientId) ?? { value: 0, n: 0 }
      by.set(c.clientId, { value: cur.value + c.value, n: cur.n + 1 })
    }
    const total = r2([...by.values()].reduce((a, x) => a + x.value, 0))
    const rows = [...by.entries()]
      .map(([id, x]) => ({ client: clients.get(id)!, kind: clients.get(id)!.kind, value: r2(x.value), charges: x.n, sharePct: total ? Math.round((x.value / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.value - a.value)
    return { rows, total }
  })
}

export interface RevenueByEquipmentRow {
  type: EquipmentType
  value: number
  /** equipamento x dia alugados no período */
  unitDays: number
  sharePct: number
}

/** Receita por tipo de equipamento no período (valor das locações proporcional aos dias) */
export function getRevenueByEquipment(range: DateRange): Promise<{ rows: RevenueByEquipmentRow[]; total: number }> {
  return call(() => {
    const data = getData()
    const acc = new Map<string, { value: number; days: number }>()
    for (const r of data.rentals) {
      if (r.status === 'orcamento' || r.status === 'cancelada') continue
      for (const it of r.items) {
        const v = itemRevenue(it, r.start, r.end, range.from, range.to)
        if (!v) continue
        const cur = acc.get(it.typeId) ?? { value: 0, days: 0 }
        acc.set(it.typeId, { value: cur.value + v, days: cur.days + overlapDays(r.start, r.end, range.from, range.to) * it.qty })
      }
    }
    const total = r2([...acc.values()].reduce((a, x) => a + x.value, 0))
    const rows = data.types
      .map((type) => {
        const x = acc.get(type.id) ?? { value: 0, days: 0 }
        return { type, value: r2(x.value), unitDays: x.days, sharePct: total ? Math.round((x.value / total) * 1000) / 10 : 0 }
      })
      .sort((a, b) => b.value - a.value)
    return { rows, total }
  })
}

/* ───────────────────────── Equipes ───────────────────────── */

export interface TeamPerformanceRow {
  team: Team
  scheduled: number
  completed: number
  /** % de serviços concluídos que começaram até 15 min depois do horário */
  onTimePct: number
  avgDurationMin: number
  late: number
  byType: { type: ServiceType; count: number }[]
  photos: number
}

export function getTeamPerformance(range: DateRange): Promise<TeamPerformanceRow[]> {
  return call(() => {
    const data = getData()
    return data.teams.map((team) => {
      const list = data.services.filter((s) => s.teamId === team.id && s.status !== 'cancelado' && dayOf(s.start) >= range.from && dayOf(s.start) <= range.to)
      const done = list.filter((s) => s.status === 'concluido' && s.report)
      const onTime = done.filter((s) => new Date(s.report!.startedAt).getTime() - new Date(s.start).getTime() <= 15 * 60000).length
      const dur = done.reduce((a, s) => a + (new Date(s.report!.finishedAt).getTime() - new Date(s.report!.startedAt).getTime()) / 60000, 0)
      const types = new Map<ServiceType, number>()
      for (const s of done) types.set(s.type, (types.get(s.type) ?? 0) + 1)
      return {
        team,
        scheduled: list.length,
        completed: done.length,
        onTimePct: done.length ? Math.round((onTime / done.length) * 1000) / 10 : 0,
        avgDurationMin: done.length ? Math.round(dur / done.length) : 0,
        late: list.filter((s) => s.status === 'atrasado').length,
        byType: [...types.entries()].map(([type, count]) => ({ type, count })),
        photos: done.reduce((a, s) => a + s.report!.photos.length, 0),
      }
    })
  })
}

/* ───────────────────────── Relatório mensal do cliente ───────────────────────── */

export interface MonthlyClientReport {
  client: Client
  month: string
  label: string
  rentals: { id: string; code: string; title: string; start: ISODate; end: ISODate; units: number }[]
  /** serviços concluídos no mês por tipo (rótulo do segmento ativo) */
  servicesByType: { type: ServiceType; label: string; count: number }[]
  /** limpezas do mês com fotos e assinatura */
  cleanings: ServiceReceipt[]
  damages: Damage[]
  invoices: ChargeView[]
  totals: { servicesDone: number; photos: number; signed: number; extrasValue: number; invoiced: number; paid: number; open: number }
}

export function computeMonthlyClientReport(data: DbData, clientId: string, month: string): MonthlyClientReport {
  const L = lookup(data)
  const client = L.client(clientId)
  const labels = getSegment(data.settings.segmentId).labels
  const from = monthStart(month)
  const to = monthEnd(month)
  const rentals = data.rentals
    .filter((r) => r.clientId === clientId && r.status !== 'orcamento' && r.status !== 'cancelada' && r.start <= to && r.end >= from)
    .map((r) => ({ id: r.id, code: r.code, title: r.title, start: r.start, end: r.end, units: r.items.reduce((a, i) => a + i.qty, 0) }))
  const receipts = receiptsOf(clientId, 1000).filter((x) => monthKey(dayOf(x.at)) === month)
  const types = new Map<ServiceType, number>()
  for (const x of receipts) types.set(x.type, (types.get(x.type) ?? 0) + 1)
  const invoices = filterChargesSync({ clientId }, data).filter((c) => c.status !== 'rascunho' && c.status !== 'cancelada' && c.issuedAt >= from && c.issuedAt <= to)
  const extras = data.services.filter((s) => s.clientId === clientId && s.extra && s.status === 'concluido' && s.report && monthKey(dayOf(s.report.finishedAt)) === month)
  return {
    client,
    month,
    label: monthLabelLong(month),
    rentals,
    servicesByType: [...types.entries()].map(([type, count]) => ({ type, label: labels.serviceTypes[type], count })),
    cleanings: receipts.filter((x) => x.type === 'limpeza'),
    damages: data.damages.filter((d) => d.clientId === clientId && d.date >= from && d.date <= to),
    invoices,
    totals: {
      servicesDone: receipts.length,
      photos: receipts.reduce((a, x) => a + x.photos.length, 0),
      signed: receipts.filter((x) => x.signature).length,
      extrasValue: r2(extras.reduce((a, s) => a + (s.extraValue ?? 0), 0)),
      invoiced: r2(invoices.reduce((a, c) => a + c.value, 0)),
      paid: r2(invoices.filter((c) => c.status === 'paga').reduce((a, c) => a + c.value, 0)),
      open: r2(invoices.filter((c) => c.status === 'aberta' || c.status === 'atrasada').reduce((a, c) => a + c.value, 0)),
    },
  }
}

/** Relatório do mês ('AAAA-MM') para um cliente: serviços por tipo, limpezas com foto, avarias e faturas */
export function getMonthlyClientReport(clientId: string, month: string): Promise<MonthlyClientReport> {
  return call(() => computeMonthlyClientReport(getData(), clientId, month))
}

