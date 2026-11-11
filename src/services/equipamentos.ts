/* Equipamentos: tipos, unidades com patrimônio, estoque por tipo e calendário de disponibilidade. */
import { commit, getData } from '@/data/db'
import { addDays, atTime, diffDays, monthEnd, monthKey, monthStart, today as todayFn } from '@/domain/dates'
import { getSegment } from '@/domain/segments'
import type { Damage, EquipmentGroup, EquipmentType, ISODate, ISODateTime, Rental, Unit, UnitStatus, DbData } from '@/domain/types'
import { call, ServiceError } from './config'
import { holdsUnits, itemRevenue, lookup, mapById, normalize, overlapDays } from './common'

export interface UnitFilter {
  typeId?: string
  status?: UnitStatus | UnitStatus[]
  /** código, tipo, cliente ou obra */
  q?: string
  /** disponíveis paradas há mais de N dias */
  idleOver?: number
  group?: EquipmentGroup
  rentalId?: string
}

export interface UnitView extends Unit {
  type: EquipmentType
  /** locação atual (em campo) */
  rental?: { id: string; code: string; title: string; clientName: string; start: string; end: string }
  /** dias parada, só para disponíveis */
  idleDays?: number
  /** valor mensal de tabela */
  monthlyValue: number
}

export interface UnitHistoryEntry {
  id: string
  at: ISODateTime
  kind: 'locacao' | 'servico' | 'avaria'
  title: string
  detail?: string
  rentalId?: string
  refId?: string
}

export interface UnitDay {
  date: ISODate
  state: 'livre' | 'reservado' | 'em_campo' | 'indisponivel'
  rentalId?: string
  rentalCode?: string
  clientName?: string
}

export interface UnitDetail {
  unit: UnitView
  /** ordem cronológica (mais antigo primeiro) */
  history: UnitHistoryEntry[]
  earnings: { total: number; last30d: number; rentals: number; daysRented: number; avgPerMonth: number }
  /** 60 dias a partir de hoje */
  calendar: UnitDay[]
  damages: Damage[]
}

export interface StockRow {
  type: EquipmentType
  total: number
  inField: number
  cleaning: number
  maintenance: number
  /** disponíveis (sem locação) */
  available: number
  /** disponíveis paradas há mais de 30 dias */
  idleOver30d: number
  /** receita do mês até hoje, proporcional aos dias */
  monthRevenue: number
  /** % em campo */
  occupancyPct: number
}

export interface AvailabilityDay {
  date: ISODate
  /** equipamentos utilizáveis (fora de manutenção) */
  total: number
  reserved: number
  free: number
}

function viewOf(u: Unit, today: ISODate): UnitView {
  const data = getData()
  const t = data.types.find((x) => x.id === u.typeId)!
  const r = u.rentalId ? data.rentals.find((x) => x.id === u.rentalId) : undefined
  const c = r ? data.clients.find((x) => x.id === r.clientId) : undefined
  return {
    ...u,
    type: t,
    rental: r ? { id: r.id, code: r.code, title: r.title, clientName: c?.name ?? '', start: r.start, end: r.end } : undefined,
    idleDays: u.status === 'disponivel' && u.idleSince ? Math.max(0, diffDays(u.idleSince, today)) : undefined,
    monthlyValue: t.monthlyRate,
  }
}

export function listTypes(): Promise<EquipmentType[]> {
  return call(() => getData().types)
}

/** Equipamentos com tipo e locação atual; `idleOver` filtra parados há mais de N dias */
export function listUnits(filter: UnitFilter = {}): Promise<UnitView[]> {
  return call(() => {
    const data = getData()
    const today = todayFn()
    const sts = filter.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]) : undefined
    const q = filter.q ? normalize(filter.q) : ''
    const types = mapById(data.types)
    return data.units
      .map((u) => viewOf(u, today))
      .filter((u) => {
        if (filter.typeId && u.typeId !== filter.typeId) return false
        if (sts && !sts.includes(u.status)) return false
        if (filter.group && types.get(u.typeId)?.group !== filter.group) return false
        if (filter.rentalId && u.rentalId !== filter.rentalId) return false
        if (filter.idleOver !== undefined && !(u.status === 'disponivel' && (u.idleDays ?? 0) > filter.idleOver)) return false
        if (q && !normalize(`${u.code} ${u.type.name} ${u.rental?.title ?? ''} ${u.rental?.clientName ?? ''}`).includes(q)) return false
        return true
      })
      .sort((a, b) => a.code.localeCompare(b.code))
  })
}

function rentalsWithUnit(rentals: readonly Rental[], unitId: string) {
  return rentals.filter((r) => holdsUnits(r) && r.items.some((i) => i.unitIds.includes(unitId)))
}

/** Ficha completa: histórico, rendimento acumulado e calendário de 60 dias. Aceita id ou código ('BQ-0142'). */
export function getUnit(idOrCode: string): Promise<UnitDetail> {
  return call(() => {
    const data = getData()
    const key = idOrCode.trim().toLowerCase()
    const u = data.units.find((x) => x.id.toLowerCase() === key || x.code.toLowerCase() === key)
    if (!u) throw new ServiceError('Equipamento não encontrado.')
    const L = lookup(data)
    const today = todayFn()
    const labels = getSegment(data.settings.segmentId).labels
    const rentals = rentalsWithUnit(data.rentals, u.id).sort((a, b) => a.start.localeCompare(b.start))
    // histórico
    const history: UnitHistoryEntry[] = []
    for (const r of rentals) {
      history.push({ id: `${r.id}-in`, at: atTime(r.start, 9 * 60), kind: 'locacao', title: `Saiu para ${r.title}`, detail: `${r.code} · ${L.client(r.clientId).name}`, rentalId: r.id })
      if (r.status === 'retirada' || r.status === 'faturada') history.push({ id: `${r.id}-out`, at: atTime(r.end, 11 * 60), kind: 'locacao', title: 'Voltou à base', detail: r.code, rentalId: r.id })
    }
    for (const s of data.services.filter((x) => x.unitIds.includes(u.id) && x.status === 'concluido')) {
      history.push({ id: s.id, at: s.report?.finishedAt ?? s.start, kind: 'servico', title: `${labels.serviceTypes[s.type]}${s.extra ? ' extra' : ''}`, detail: L.rental(s.rentalId).code, rentalId: s.rentalId, refId: s.id })
    }
    const damages = data.damages.filter((d) => d.unitId === u.id)
    for (const d of damages) history.push({ id: d.id, at: atTime(d.date, 12 * 60), kind: 'avaria', title: `${d.kind}`, detail: `${d.status}`, rentalId: d.rentalId, refId: d.id })
    history.sort((a, b) => a.at.localeCompare(b.at))
    // rendimento acumulado (receita por unidade = valor do item / quantidade)
    const from30 = addDays(today, -29)
    let total = 0
    let last30 = 0
    let days = 0
    for (const r of rentals) {
      for (const it of r.items.filter((i) => i.unitIds.includes(u.id))) {
        const rEnd = r.status === 'em_campo' && r.end > today ? today : r.end
        if (r.status === 'confirmada') continue
        total += itemRevenue({ ...it, qty: 1 }, r.start, rEnd, r.start, rEnd)
        last30 += itemRevenue({ ...it, qty: 1 }, r.start, rEnd, from30, today)
        days += overlapDays(r.start, rEnd, r.start, rEnd)
      }
    }
    const months = Math.max(1, diffDays(u.acquiredAt > addDays(today, -190) ? u.acquiredAt : addDays(today, -190), today) / 30)
    // calendário de 60 dias
    const calendar: UnitDay[] = []
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i)
      const r = rentals.find((x) => x.status !== 'retirada' && x.status !== 'faturada' && x.start <= date && date <= x.end)
      let state: UnitDay['state'] = 'livre'
      if (r) state = r.status === 'em_campo' ? 'em_campo' : 'reservado'
      else if ((u.status === 'manutencao' && i < 4) || (u.status === 'limpeza' && i === 0)) state = 'indisponivel'
      calendar.push({ date, state, rentalId: r?.id, rentalCode: r?.code, clientName: r ? L.client(r.clientId).name : undefined })
    }
    return {
      unit: viewOf(u, today),
      history,
      earnings: { total: Math.round(total * 100) / 100, last30d: Math.round(last30 * 100) / 100, rentals: rentals.filter((r) => r.status !== 'confirmada').length, daysRented: days, avgPerMonth: Math.round((total / months) * 100) / 100 },
      calendar,
      damages,
    }
  })
}

/** Muda o status à mão (ex.: mandar para manutenção, liberar depois da limpeza). Em campo só pela entrega da locação. */
export function setUnitStatus(id: string, status: UnitStatus, note?: string): Promise<UnitView> {
  return call(() => {
    const data = getData()
    const u = data.units.find((x) => x.id === id)
    if (!u) throw new ServiceError('Equipamento não encontrado.')
    if (status === 'em_campo' && !u.rentalId) throw new ServiceError('Para colocar em campo, conclua a entrega de uma locação.')
    if (u.status === 'em_campo' && status !== 'em_campo') throw new ServiceError('Este equipamento está em campo. Conclua a retirada da locação antes.')
    const today = todayFn()
    const next: Unit = { ...u, status, notes: status === 'manutencao' ? note ?? u.notes : note ?? (status === 'disponivel' ? undefined : u.notes) }
    if (status === 'disponivel') next.idleSince = today
    else delete next.idleSince
    if (status !== 'em_campo') delete next.rentalId
    commit({ units: data.units.map((x) => (x.id === id ? next : x)) })
    return viewOf(next, today)
  })
}

export function computeStock(data: DbData = getData(), today: ISODate = todayFn()): StockRow[] {
  const mStart = monthStart(monthKey(today))
  const mEnd = monthEnd(monthKey(today))
  const to = mEnd < today ? mEnd : today
  return data.types.map((type) => {
    const us = data.units.filter((u) => u.typeId === type.id)
    let rev = 0
    for (const r of data.rentals) {
      if (r.status === 'orcamento' || r.status === 'cancelada' || r.status === 'confirmada') continue
      for (const it of r.items) if (it.typeId === type.id) rev += itemRevenue(it, r.start, r.end, mStart, to)
    }
    const inField = us.filter((u) => u.status === 'em_campo').length
    return {
      type,
      total: us.length,
      inField,
      cleaning: us.filter((u) => u.status === 'limpeza').length,
      maintenance: us.filter((u) => u.status === 'manutencao').length,
      available: us.filter((u) => u.status === 'disponivel').length,
      idleOver30d: us.filter((u) => u.status === 'disponivel' && u.idleSince && diffDays(u.idleSince, today) > 30).length,
      monthRevenue: Math.round(rev * 100) / 100,
      occupancyPct: us.length ? Math.round((inField / us.length) * 1000) / 10 : 0,
    }
  })
}

/** Resumo por tipo: total, em campo, limpeza, manutenção, disponíveis/parados e receita do mês */
export function getStockSummary(): Promise<StockRow[]> {
  return call(() => computeStock())
}

/** Disponibilidade dia a dia de um tipo (para a grade de calendário) */
export function getAvailabilityCalendar(typeId: string, from: ISODate = todayFn(), days = 30): Promise<AvailabilityDay[]> {
  return call(() => {
    const data = getData()
    lookup(data).type(typeId)
    const usable = data.units.filter((u) => u.typeId === typeId && u.status !== 'manutencao').length
    const rentals = data.rentals.filter((r) => holdsUnits(r) && r.items.some((i) => i.typeId === typeId))
    const out: AvailabilityDay[] = []
    for (let i = 0; i < days; i++) {
      const date = addDays(from, i)
      let reserved = 0
      for (const r of rentals) if (r.start <= date && date <= (r.status === 'em_campo' && r.end < todayFn() ? todayFn() : r.end)) reserved += r.items.filter((it) => it.typeId === typeId).reduce((a, it) => a + it.unitIds.length, 0)
      out.push({ date, total: usable, reserved, free: Math.max(0, usable - reserved) })
    }
    return out
  })
}

