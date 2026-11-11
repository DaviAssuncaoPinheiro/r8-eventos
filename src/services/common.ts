// Funções internas compartilhadas pelos serviços (não são parte da API das telas).
import { getData } from '@/data/db'
import { addDays, dayOf, demoNowISO, diffDays, today } from '@/domain/dates'
import type { Charge, Client, DbData, EquipmentType, ISODate, Notification, Rental, Service, Unit } from '@/domain/types'
import { ServiceError } from './config'

export { formatMoney } from '@/lib/format'

export const NOT_FOUND = (what: string) => new ServiceError(`${what} não encontrado(a).`)

export function mapById<T extends { id: string }>(list: readonly T[]): Map<string, T> {
  return new Map(list.map((x) => [x.id, x]))
}

export interface Lookup {
  data: DbData
  client: (id: string) => Client
  rental: (id: string) => Rental
  type: (id: string) => EquipmentType
  unit: (id: string) => Unit
}

export function lookup(data: DbData = getData()): Lookup {
  const clients = mapById(data.clients)
  const rentals = mapById(data.rentals)
  const types = mapById(data.types)
  const units = mapById(data.units)
  return {
    data,
    client: (id) => clients.get(id) ?? (() => { throw NOT_FOUND('Cliente') })(),
    rental: (id) => rentals.get(id) ?? (() => { throw NOT_FOUND('Locação') })(),
    type: (id) => types.get(id) ?? (() => { throw NOT_FOUND('Tipo de equipamento') })(),
    unit: (id) => units.get(id) ?? (() => { throw NOT_FOUND('Equipamento') })(),
  }
}

export function rentalUnitIds(r: Rental): string[] {
  return r.items.flatMap((i) => i.unitIds)
}

/** Dia de hoje (do navegador) */
export const todayStr = today

/** Locação ocupa estoque (tem unidades alocadas e não terminou/cancelou/virou orçamento)? */
export function holdsUnits(r: Rental): boolean {
  return r.status === 'confirmada' || r.status === 'em_campo' || r.status === 'retirada' || r.status === 'faturada'
}

/** Valor mensal de tabela de uma lista de unidades */
export function monthlyValueOf(units: readonly Unit[], types: ReadonlyMap<string, EquipmentType>): number {
  return Math.round(units.reduce((a, u) => a + (types.get(u.typeId)?.monthlyRate ?? 0), 0) * 100) / 100
}

export function mkNotification(ids: { next: (p: string) => string }, n: Omit<Notification, 'id' | 'at' | 'read'> & { at?: string }): Notification {
  return { id: ids.next('ntf'), at: n.at ?? demoNowISO(), read: false, kind: n.kind, title: n.title, text: n.text, ref: n.ref }
}

export const dayDiff = diffDays
export { addDays, dayOf }

export function serviceDay(s: Service): ISODate {
  return dayOf(s.start)
}

export function isOpenCharge(c: Charge): boolean {
  return c.status === 'aberta' || c.status === 'atrasada'
}

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Dias de sobreposição (inclusive) entre dois períodos de datas */
export function overlapDays(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate): number {
  const s = aStart > bStart ? aStart : bStart
  const e = aEnd < bEnd ? aEnd : bEnd
  return e < s ? 0 : diffDays(s, e) + 1
}

/** Receita de um item de locação no período [from, to] (proporcional aos dias; mensal = rate/30 por dia) */
export function itemRevenue(item: { qty: number; rate: number; billing: 'diaria' | 'mensal' }, rStart: ISODate, rEnd: ISODate, from: ISODate, to: ISODate): number {
  const n = overlapDays(rStart, rEnd, from, to)
  if (!n) return 0
  const perDay = item.billing === 'mensal' ? item.rate / 30 : item.rate
  return Math.round(perDay * item.qty * n * 100) / 100
}
