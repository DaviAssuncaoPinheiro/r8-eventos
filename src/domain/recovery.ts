/*
  Dinheiro recuperado no mês: cálculo puro (recebe o estado), usado pelo serviço de inteligência e pela semente.
  Quatro origens, todas lidas dos dados:
  - avarias cobradas: cobranças de avaria enviadas no mês;
  - extras faturados: cobranças de serviços extras enviadas no mês;
  - atrasados recuperados: cobranças pagas no mês, depois do vencimento, que receberam lembrete antes de pagar;
  - parados que voltaram: unidades paradas há mais de 30 dias que entraram numa locação iniciada no mês
    (valor = o que a unidade faturou nessa locação dentro do mês, até hoje).
*/
import type { Charge, DbData, ISODate, ISODateTime, Rental, RentalItem } from './types'
import { atTime, dayOf, diffDays, monthEnd, monthKey, monthStart, today as todayFn } from './dates'

export type RecoveredKind = 'avaria' | 'extra' | 'atraso' | 'parado'

export interface RecoveredItem {
  kind: RecoveredKind
  label: string
  value: number
  at: ISODateTime
  ref?: { type: 'charge' | 'unit'; id: string }
}

export interface RecoveredMoney {
  /** 'AAAA-MM' */
  month: string
  damagesCharged: number
  extrasBilled: number
  overdueRecovered: number
  idleReRented: number
  total: number
  /** mais recentes primeiro */
  items: RecoveredItem[]
}

/** Dias parada antes de voltar a alugar para contar como "parada que voltou" */
export const IDLE_GAP_DAYS = 30

const r2 = (n: number) => Math.round(n * 100) / 100
const HOLDS = ['em_campo', 'retirada', 'faturada']

/** Receita de uma unidade (qty 1) numa locação dentro de [from, to] (mensal = taxa/30 por dia) */
function unitRevenue(item: Pick<RentalItem, 'rate' | 'billing'>, rStart: ISODate, rEnd: ISODate, from: ISODate, to: ISODate): number {
  const s = rStart > from ? rStart : from
  const e = rEnd < to ? rEnd : to
  if (e < s) return 0
  const perDay = item.billing === 'mensal' ? item.rate / 30 : item.rate
  return r2(perDay * (diffDays(s, e) + 1))
}

/** Locações que seguram unidade (em campo, retiradas ou faturadas) */
function holding(rentals: readonly Rental[]): Rental[] {
  return rentals.filter((r) => HOLDS.includes(r.status))
}

export function idleReRentedItems(data: Pick<DbData, 'rentals' | 'units' | 'clients'>, month: string, today: ISODate = todayFn()): RecoveredItem[] {
  const from = monthStart(month)
  const to = monthEnd(month) < today ? monthEnd(month) : today
  const rentals = holding(data.rentals)
  // fim da locação anterior de cada unidade, por início
  const byUnit = new Map<string, { start: ISODate; end: ISODate }[]>()
  for (const r of rentals) for (const it of r.items) for (const id of it.unitIds) {
    const l = byUnit.get(id)
    if (l) l.push({ start: r.start, end: r.end })
    else byUnit.set(id, [{ start: r.start, end: r.end }])
  }
  const units = new Map(data.units.map((u) => [u.id, u]))
  const clients = new Map(data.clients.map((c) => [c.id, c]))
  const out: RecoveredItem[] = []
  for (const r of rentals) {
    if (r.start < from || r.start > to) continue
    for (const it of r.items) for (const id of it.unitIds) {
      const prev = (byUnit.get(id) ?? []).filter((x) => x.end < r.start).map((x) => x.end).sort().pop()
      if (!prev) continue
      const idle = diffDays(prev, r.start) - 1
      if (idle <= IDLE_GAP_DAYS) continue
      const value = unitRevenue(it, r.start, r.end, from, to)
      if (value <= 0) continue
      out.push({
        kind: 'parado',
        label: `${units.get(id)?.code ?? id} voltou a alugar depois de ${idle} dias parada (${clients.get(r.clientId)?.name ?? ''})`,
        value,
        at: atTime(r.start, 9 * 60),
        ref: { type: 'unit', id },
      })
    }
  }
  return out
}

const isSent = (c: Charge) => c.status !== 'rascunho' && c.status !== 'cancelada' && !!c.sentAt

export function computeRecoveredMoney(data: DbData, month: string = monthKey(todayFn()), today: ISODate = todayFn()): RecoveredMoney {
  const clients = new Map(data.clients.map((c) => [c.id, c.name]))
  const cname = (c: Charge) => clients.get(c.clientId) ?? ''
  const inMonth = (iso: string) => monthKey(dayOf(iso)) === month && dayOf(iso) <= today
  const items: RecoveredItem[] = []
  for (const c of data.charges) {
    if (c.kind === 'avaria' && isSent(c) && inMonth(c.sentAt!)) items.push({ kind: 'avaria', label: `Avaria cobrada de ${cname(c)} (${c.code})`, value: c.value, at: c.sentAt!, ref: { type: 'charge', id: c.id } })
    else if (c.kind === 'extra' && isSent(c) && inMonth(c.sentAt!)) items.push({ kind: 'extra', label: `Extras faturados de ${cname(c)} (${c.code})`, value: c.value, at: c.sentAt!, ref: { type: 'charge', id: c.id } })
    else if (c.kind !== 'avaria' && c.kind !== 'extra' && c.status === 'paga' && c.paidAt && inMonth(c.paidAt) && c.paidAt > c.dueAt && c.reminders.some((m) => dayOf(m.at) >= c.dueAt && dayOf(m.at) <= c.paidAt!)) {
      items.push({ kind: 'atraso', label: `${cname(c)} pagou ${c.code} depois do lembrete`, value: c.value, at: atTime(c.paidAt, 14 * 60), ref: { type: 'charge', id: c.id } })
    }
  }
  items.push(...idleReRentedItems(data, month, today))
  items.sort((a, b) => b.at.localeCompare(a.at))
  const sum = (k: RecoveredKind) => r2(items.filter((i) => i.kind === k).reduce((a, i) => a + i.value, 0))
  const damagesCharged = sum('avaria')
  const extrasBilled = sum('extra')
  const overdueRecovered = sum('atraso')
  const idleReRented = sum('parado')
  return { month, damagesCharged, extrasBilled, overdueRecovered, idleReRented, total: r2(damagesCharged + extrasBilled + overdueRecovered + idleReRented), items }
}
