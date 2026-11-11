/* Avarias: registro em campo, cobrança ao cliente e dispensa. */
import { commit, getData, newIds } from '@/data/db'
import { addDays, diffDays, today as todayFn } from '@/domain/dates'
import type { Charge, Damage, DamageStatus, ISODate, ServicePhoto, DbData } from '@/domain/types'
import { call, ServiceError } from './config'
import { formatMoney, lookup, mkNotification, normalize } from './common'
import { nextCode } from './rules'
import { getSegment } from '@/domain/segments'

export interface DamageView extends Damage {
  unitCode: string
  typeName: string
  typePhoto: string
  clientName: string
  rentalCode: string
  rentalTitle: string
  /** dias desde o registro */
  ageDays: number
  charge?: { id: string; code: string; status: Charge['status']; value: number }
}

export interface DamageFilter {
  status?: DamageStatus | DamageStatus[]
  clientId?: string
  rentalId?: string
  unitId?: string
  /** só as registradas e ainda sem cobrança (o dinheiro que está na mesa) */
  uncharged?: boolean
  q?: string
}

export interface NewDamageInput {
  unitId: string
  /** padrão: a locação em que o equipamento está */
  rentalId?: string
  serviceId?: string
  kind: string
  description?: string
  value: number
  photos?: (Omit<ServicePhoto, 'id'> & { id?: string })[]
  date?: ISODate
}

function toView(d: Damage, data: DbData = getData(), today = todayFn()): DamageView {
  const L = lookup(data)
  const u = L.unit(d.unitId)
  const t = L.type(u.typeId)
  const r = L.rental(d.rentalId)
  const c = d.chargeId ? data.charges.find((x) => x.id === d.chargeId) : undefined
  return {
    ...d,
    unitCode: u.code,
    typeName: t.name,
    typePhoto: t.photo,
    clientName: L.client(d.clientId).name,
    rentalCode: r.code,
    rentalTitle: r.title,
    ageDays: Math.max(0, diffDays(d.date, today)),
    charge: c ? { id: c.id, code: c.code, status: c.status, value: c.value } : undefined,
  }
}

/** Lista de avarias (mais recentes primeiro) com equipamento, cliente, locação e cobrança ligada */
export function listDamages(filter: DamageFilter = {}): Promise<DamageView[]> {
  return call(() => {
    const data = getData()
    const sts = filter.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]) : undefined
    const q = filter.q ? normalize(filter.q) : ''
    return data.damages
      .filter((d) => {
        if (sts && !sts.includes(d.status)) return false
        if (filter.clientId && d.clientId !== filter.clientId) return false
        if (filter.rentalId && d.rentalId !== filter.rentalId) return false
        if (filter.unitId && d.unitId !== filter.unitId) return false
        if (filter.uncharged && !(d.status === 'registrada' && !d.chargeId)) return false
        return true
      })
      .map((d) => toView(d, data))
      .filter((v) => !q || normalize(`${v.kind} ${v.unitCode} ${v.clientName} ${v.rentalCode} ${v.rentalTitle}`).includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  })
}

export function getDamage(id: string): Promise<DamageView> {
  return call(() => {
    const d = getData().damages.find((x) => x.id === id)
    if (!d) throw new ServiceError('Avaria não encontrada.')
    return toView(d)
  })
}

/** Registra uma avaria (cliente e locação saem do equipamento; fotos entram no relatório do serviço, se informado) */
export function registerDamage(input: NewDamageInput): Promise<Damage> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const u = L.unit(input.unitId)
    if (!(input.value > 0)) throw new ServiceError('Informe o valor da avaria.')
    // avaria registrada num serviço é da locação desse serviço (a entrega ainda não concluída não liga a unidade à locação)
    let rentalId = input.rentalId ?? (input.serviceId ? data.services.find((s) => s.id === input.serviceId)?.rentalId : undefined) ?? u.rentalId
    if (!rentalId) {
      const last = data.rentals.filter((r) => (r.status === 'em_campo' || r.status === 'retirada' || r.status === 'faturada') && r.items.some((i) => i.unitIds.includes(u.id))).sort((a, b) => b.end.localeCompare(a.end))[0]
      rentalId = last?.id
    }
    if (!rentalId) throw new ServiceError('Este equipamento não está em nenhuma locação. Informe a locação.')
    const r = L.rental(rentalId)
    const ids = newIds()
    const photos: ServicePhoto[] = (input.photos ?? []).map((p) => ({ ...p, id: p.id ?? ids.next('ph'), moment: 'avaria' as const }))
    const d: Damage = {
      id: ids.next('dmg'),
      unitId: u.id,
      rentalId,
      clientId: r.clientId,
      serviceId: input.serviceId,
      date: input.date ?? todayFn(),
      kind: input.kind,
      description: input.description?.trim() || input.kind,
      photos,
      value: Math.round(input.value * 100) / 100,
      status: 'registrada',
    }
    const note = mkNotification(ids, { kind: 'avaria', title: `${getSegment(data.settings.segmentId).labels.damage.replace(/^./, (c) => c.toUpperCase())} registrada`, text: `${d.kind} em ${u.code} (${L.client(r.clientId).name}), ${formatMoney(d.value)}.`, ref: { type: 'damage', id: d.id } })
    commit({
      damages: [...data.damages, d],
      services: input.serviceId
        ? data.services.map((s) => (s.id === input.serviceId && s.report ? { ...s, report: { ...s.report, damageIds: [...s.report.damageIds, d.id], photos: [...s.report.photos, ...photos] } } : s))
        : data.services,
      notifications: [note, ...data.notifications],
      seq: ids.seq(),
    })
    return d
  })
}

/**
 * Cria cobrança em `rascunho` para a avaria e liga as duas. Com vários ids de um mesmo cliente, junta tudo numa cobrança só
 * (de clientes diferentes, uma por cliente). Com um id devolve a cobrança; com lista devolve a lista.
 */
export function chargeDamage(id: string): Promise<Charge>
export function chargeDamage(ids: string[]): Promise<Charge[]>
export function chargeDamage(arg: string | string[]): Promise<Charge | Charge[]> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const ids = Array.isArray(arg) ? arg : [arg]
    const list = ids.map((id) => {
      const d = data.damages.find((x) => x.id === id)
      if (!d) throw new ServiceError('Avaria não encontrada.')
      if (d.status !== 'registrada' || d.chargeId) throw new ServiceError('Esta avaria já foi cobrada ou dispensada.')
      return d
    })
    const gen = newIds()
    const today = todayFn()
    const byClient = new Map<string, Damage[]>()
    for (const d of list) byClient.set(d.clientId, [...(byClient.get(d.clientId) ?? []), d])
    const charges: Charge[] = []
    const link = new Map<string, string>()
    let all = data.charges
    for (const [clientId, ds] of byClient) {
      const client = L.client(clientId)
      const value = Math.round(ds.reduce((a, d) => a + d.value, 0) * 100) / 100
      const first = ds[0]
      const code = nextCode(all, 'COB', 5000)
      const rental = L.rental(first.rentalId)
      const c: Charge = {
        id: gen.next('chg'),
        code,
        clientId,
        rentalId: ds.every((d) => d.rentalId === first.rentalId) ? first.rentalId : undefined,
        kind: 'avaria',
        description: ds.length === 1 ? `Avaria: ${first.kind} · ${L.unit(first.unitId).code} · ${rental.code}` : `Avarias (${ds.length}): ${ds.map((d) => `${d.kind} ${L.unit(d.unitId).code}`).join(', ')}`,
        value,
        issuedAt: today,
        dueAt: addDays(today, 10),
        status: 'rascunho',
        method: 'pix',
        reminders: [],
        damageId: first.id,
      }
      void client
      all = [...all, c]
      charges.push(c)
      ds.forEach((d) => link.set(d.id, c.id))
    }
    commit({
      charges: all,
      damages: data.damages.map((d) => (link.has(d.id) ? { ...d, status: 'cobrada' as const, chargeId: link.get(d.id) } : d)),
      seq: gen.seq(),
    })
    return Array.isArray(arg) ? charges : charges[0]
  })
}

/** Dispensa a avaria (não será cobrada). Se havia rascunho de cobrança, ele é cancelado. */
export function dismissDamage(id: string): Promise<Damage> {
  return call(() => {
    const data = getData()
    const d = data.damages.find((x) => x.id === id)
    if (!d) throw new ServiceError('Avaria não encontrada.')
    if (d.status === 'paga' || d.status === 'dispensada') throw new ServiceError('Esta avaria já está encerrada.')
    const c = d.chargeId ? data.charges.find((x) => x.id === d.chargeId) : undefined
    if (c && (c.status === 'aberta' || c.status === 'atrasada')) throw new ServiceError('A cobrança já foi enviada. Cancele a cobrança antes de dispensar.')
    const upd: Damage = { ...d, status: 'dispensada' }
    commit({
      damages: data.damages.map((x) => (x.id === id ? upd : x)),
      charges: c && c.status === 'rascunho' ? data.charges.map((x) => (x.id === c.id ? { ...x, status: 'cancelada' as const } : x)) : data.charges,
    })
    return upd
  })
}

