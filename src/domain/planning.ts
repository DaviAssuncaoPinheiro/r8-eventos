/*
  Regras de planejamento compartilhadas pela semente e pelos serviços:
  equipe por região, tempo de deslocamento, agenda automática de uma locação,
  ciclos de cobrança e total da locação.
*/
import { BAIRRO } from '@/data/geo'
import type { Billing, EquipmentType, ISODate, Rental, RentalItem, RentalKind, Service, Unit, ZoneId } from './types'
import { addDays, atTime, diffDays, daysInclusive, minutesOf, dayOf, weekday } from './dates'

/* ───────────────────────── Equipes por região ───────────────────────── */

export const ZONE_TEAM: Record<ZoneId, string> = {
  plano: 'eq-1',
  lagos: 'eq-2',
  guara: 'eq-3',
  oeste: 'eq-4',
  sul: 'eq-5',
  norte: 'eq-6',
}

export function teamIdForBairro(bairroId: string): string {
  const b = BAIRRO[bairroId as keyof typeof BAIRRO]
  return b ? ZONE_TEAM[b.zone] : 'eq-1'
}

/** Minutos de deslocamento entre dois bairros (mapa estilizado: 1000 px ~ 60 km, 38 km/h médios) */
export function travelMinutes(a: string, b: string): number {
  const A = BAIRRO[a as keyof typeof BAIRRO]
  const B = BAIRRO[b as keyof typeof BAIRRO]
  if (!A || !B) return 20
  const px = Math.hypot(A.x - B.x, A.y - B.y)
  return Math.max(8, Math.round(((px * 0.06) / 38) * 60))
}

/* ───────────────────────── Duração dos serviços ───────────────────────── */

export function serviceDuration(type: Service['type'], units: number): number {
  switch (type) {
    case 'limpeza':
      return Math.min(120, 20 + 7 * Math.max(1, units))
    case 'entrega':
    case 'montagem':
      return Math.min(180, 40 + 4 * Math.max(1, units))
    case 'retirada':
      return Math.min(150, 35 + 3 * Math.max(1, units))
    default:
      return 45
  }
}

/* ───────────────────────── Agenda: encaixe de serviços ───────────────────────── */

export const WORK_START = 7 * 60 + 30
export const WORK_END = 18 * 60 + 30

export interface Scheduler {
  /** Reserva o próximo horário livre da equipe no dia (ou nos seguintes, se lotar). Devolve dia e minuto de início. */
  place(teamId: string, day: ISODate, durationMin: number, opts?: { earliest?: number; bairroId?: string }): { day: ISODate; startMin: number }
}

export function createScheduler(existing: readonly Service[] = [], rentalBairro?: (rentalId: string) => string | undefined, notBefore?: { day: ISODate; min: number }): Scheduler {
  const last = new Map<string, { end: number; bairro?: string }>()
  const key = (t: string, d: string) => `${t}|${d}`
  for (const s of existing) {
    if (s.status === 'cancelado') continue
    const d = dayOf(s.start)
    const k = key(s.teamId, d)
    const end = minutesOf(s.start) + s.durationMin
    const cur = last.get(k)
    if (!cur || end > cur.end) last.set(k, { end, bairro: rentalBairro?.(s.rentalId) })
  }
  return {
    place(teamId, day, durationMin, opts = {}) {
      let d = day
      for (let guard = 0; guard < 30; guard++) {
        const k = key(teamId, d)
        const cur = last.get(k)
        const travel = cur ? (cur.bairro && opts.bairroId ? travelMinutes(cur.bairro, opts.bairroId) : 15) : 0
        const floor = notBefore && notBefore.day === d ? notBefore.min : 0
        const start = Math.max(opts.earliest ?? WORK_START, floor, cur ? cur.end + travel : WORK_START)
        const rounded = Math.ceil(start / 5) * 5
        if (rounded + durationMin <= WORK_END || guard === 29) {
          last.set(k, { end: rounded + durationMin, bairro: opts.bairroId })
          return { day: d, startMin: rounded }
        }
        d = addDays(d, 1)
      }
      return { day, startMin: WORK_START }
    },
  }
}

/** Renumera `order` (1..n) por equipe e dia, pela hora de início */
export function renumberOrders(services: Service[]): Service[] {
  const groups = new Map<string, Service[]>()
  for (const s of services) {
    const k = `${s.teamId}|${dayOf(s.start)}`
    const g = groups.get(k)
    if (g) g.push(s)
    else groups.set(k, [s])
  }
  const order = new Map<string, number>()
  for (const g of groups.values()) {
    g.sort((a, b) => a.start.localeCompare(b.start))
    g.forEach((s, i) => order.set(s.id, i + 1))
  }
  return services.map((s) => (order.get(s.id) === s.order ? s : { ...s, order: order.get(s.id) ?? s.order }))
}

/* ───────────────────────── Agenda automática da locação ───────────────────────── */

export interface PlanCtx {
  units: ReadonlyMap<string, Unit>
  types: ReadonlyMap<string, EquipmentType>
  scheduler: Scheduler
  /** fim do período em que gerar limpezas recorrentes */
  horizon: ISODate
  /** não gerar limpezas antes desta data (histórico truncado) */
  fromDay?: ISODate
  newId: (prefix: string) => string
}

function unitIdsOf(r: Rental, ctx: PlanCtx, group: 'Banheiros' | 'Estruturas' | 'cleanable') {
  const ids: string[] = []
  for (const it of r.items) {
    const t = ctx.types.get(it.typeId)
    if (!t) continue
    const ok = group === 'cleanable' ? t.cleanable : t.group === group
    if (ok) ids.push(...it.unitIds)
  }
  return ids
}

function qtyOf(r: Rental, ctx: PlanCtx, group: 'Banheiros' | 'Estruturas' | 'cleanable') {
  let q = 0
  for (const it of r.items) {
    const t = ctx.types.get(it.typeId)
    if (!t) continue
    const ok = group === 'cleanable' ? t.cleanable : t.group === group
    if (ok) q += it.qty
  }
  return q
}

/**
 * Serviços previstos de uma locação: entrega (banheiros), montagem (estruturas),
 * limpezas recorrentes (só equipamentos que recebem limpeza) e retirada.
 * Todos saem como 'agendado'; quem chama ajusta status e relatórios.
 */
export function planRentalServices(r: Rental, ctx: PlanCtx): Service[] {
  const out: Service[] = []
  const team = teamIdForBairro(r.bairroId)
  const mk = (type: Service['type'], day: ISODate, unitIds: string[], qty: number, earliest?: number): Service => {
    const dur = serviceDuration(type, qty)
    const slot = ctx.scheduler.place(team, day, dur, { earliest, bairroId: r.bairroId })
    return {
      id: ctx.newId('svc'),
      rentalId: r.id,
      clientId: r.clientId,
      teamId: team,
      type,
      start: atTime(slot.day, slot.startMin),
      durationMin: dur,
      order: 0,
      status: 'agendado',
      unitIds,
      extra: false,
    }
  }

  const bathQty = qtyOf(r, ctx, 'Banheiros')
  const structQty = qtyOf(r, ctx, 'Estruturas')
  if (bathQty > 0) out.push(mk('entrega', r.start, unitIdsOf(r, ctx, 'Banheiros'), bathQty))
  if (structQty > 0) out.push(mk('montagem', r.start, unitIdsOf(r, ctx, 'Estruturas'), structQty))

  // limpezas recorrentes
  const cleanQty = qtyOf(r, ctx, 'cleanable')
  if (r.cleaningsPerWeek > 0 && cleanQty > 0) {
    const interval = 7 / r.cleaningsPerWeek
    const cleanIds = unitIdsOf(r, ctx, 'cleanable')
    const limit = diffDays(r.start, r.end) > 0 ? addDays(r.end, -1) : r.end
    const lastDay = limit < ctx.horizon ? limit : ctx.horizon
    let prev = ''
    for (let k = 1; k < 400; k++) {
      let day = addDays(r.start, Math.max(1, Math.round(k * interval)))
      if (weekday(day) === 0 && r.kind === 'obra') day = addDays(day, 1)
      if (day > lastDay) break
      if (day === prev) continue
      prev = day
      if (ctx.fromDay && day < ctx.fromDay) continue
      out.push(mk('limpeza', day, cleanIds, cleanQty, r.kind === 'evento' ? 9 * 60 : undefined))
    }
  }

  const allIds = r.items.flatMap((i) => i.unitIds)
  const allQty = r.items.reduce((a, i) => a + i.qty, 0)
  out.push(mk('retirada', r.end, allIds, allQty, r.kind === 'evento' ? 13 * 60 : undefined))
  return out
}

/* ───────────────────────── Preços e ciclos de cobrança ───────────────────────── */

export const round2 = (n: number) => Math.round(n * 100) / 100

export function defaultBilling(kind: RentalKind, start: ISODate, end: ISODate): Billing {
  // obra a partir de 20 dias e evento a partir de 10 dias usam a tabela mensal (rateada pelos dias)
  return daysInclusive(start, end) >= (kind === 'obra' ? 20 : 10) ? 'mensal' : 'diaria'
}

export interface BillingCycle {
  from: ISODate
  to: ISODate
  days: number
}

/** Obra: ciclos de 30 dias. Evento: um ciclo só, do início ao fim. */
export function billingCycles(kind: RentalKind, start: ISODate, end: ISODate): BillingCycle[] {
  const total = daysInclusive(start, end)
  if (kind === 'evento') return [{ from: start, to: end, days: total }]
  const out: BillingCycle[] = []
  for (let off = 0; off < total; off += 30) {
    const days = Math.min(30, total - off)
    out.push({ from: addDays(start, off), to: addDays(start, off + days - 1), days })
  }
  return out
}

export function cycleAmount(items: readonly Pick<RentalItem, 'qty' | 'rate' | 'billing'>[], days: number): number {
  let v = 0
  for (const it of items) v += it.billing === 'mensal' ? (it.rate * it.qty * days) / 30 : it.rate * it.qty * days
  return round2(v)
}

/** Total previsto de todo o período (soma dos ciclos de cobrança) */
export function rentalTotal(kind: RentalKind, start: ISODate, end: ISODate, items: readonly Pick<RentalItem, 'qty' | 'rate' | 'billing'>[]): number {
  return round2(billingCycles(kind, start, end).reduce((a, c) => a + cycleAmount(items, c.days), 0))
}
