/* Operação: agenda das equipes, rotas, execução de serviços e relatórios. */
import { BAIRRO } from '@/data/geo'
import { commit, getData, newIds } from '@/data/db'
import { addMinutes, atTime, dayOf, demoNow, demoNowISO, minutesOf, today as todayFn } from '@/domain/dates'
import { renumberOrders, serviceDuration, teamIdForBairro, travelMinutes } from '@/domain/planning'
import { getSegment } from '@/domain/segments'
import type { Client, DbData, Damage, ISODate, ISODateTime, Rental, Service, ServicePhoto, ServiceReport, ServiceStatus, ServiceType, Team, Unit, ZoneId } from '@/domain/types'
import { call, ServiceError } from './config'
import { lookup, mapById, mkNotification } from './common'
import { autoReport, patchUnits, pushHistory, returnUnits, deliverUnits } from './rules'

/* ───────────────────────── Tipos ───────────────────────── */

/** Serviço com os dados de locação, cliente e equipe já juntos (é o que a agenda desenha) */
export interface ServiceView extends Service {
  rentalCode: string
  rentalTitle: string
  rentalKind: Rental['kind']
  clientName: string
  address: string
  bairroId: string
  bairroName: string
  zoneId: ZoneId
  teamName: string
  teamColor: string
  unitCodes: string[]
  contact: Rental['contact']
  /** nome do tipo de serviço no pacote de segmento ativo ('Limpeza', 'Higienização'...) */
  typeLabel: string
  /** hora final prevista */
  end: ISODateTime
}

export interface ServiceDetail extends ServiceView {
  rental: Rental
  client: Client
  team: Team
  units: Unit[]
  damages: Damage[]
  /** itens do checklist do pacote de segmento para este tipo de serviço */
  checklistTemplate: string[]
}

export interface ServiceFilter {
  /** um dia (AAAA-MM-DD ou Date) */
  date?: ISODate | Date
  /** ou um período */
  from?: ISODate
  to?: ISODate
  teamId?: string
  rentalId?: string
  clientId?: string
  status?: ServiceStatus | ServiceStatus[]
  type?: ServiceType
  extra?: boolean
}

export interface ReportInput {
  checklist: { label: string; ok: boolean }[]
  photos?: (Omit<ServicePhoto, 'id'> & { id?: string })[]
  signature?: { name: string; role: string; dataUrl?: string }
  notes?: string
  damageIds?: string[]
  startedAt?: ISODateTime
  finishedAt?: ISODateTime
}

export interface NewServiceInput {
  rentalId: string
  type: ServiceType
  teamId?: string
  /** dia e hora de início */
  start: ISODateTime
  durationMin?: number
  unitIds?: string[]
  extra?: boolean
  extraValue?: number
  note?: string
}

export interface RerouteSuggestion {
  id: string
  serviceId: string
  fromTeamId: string
  toTeamId: string
  /** posição (1 = primeiro) na rota da equipe que recebe */
  newOrder: number
  reason: string
  /** minutos que o cliente deixa de esperar, estimados */
  savedMinutes: number
  rentalTitle: string
  clientName: string
}

const dayArg = (d: ISODate | Date) => (typeof d === 'string' ? d.slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)

export function toServiceView(s: Service, data: DbData): ServiceView {
  const L = lookup(data)
  const r = L.rental(s.rentalId)
  const b = BAIRRO[r.bairroId]
  const team = data.teams.find((t) => t.id === s.teamId)
  const units = mapById(data.units)
  const labels = getSegment(data.settings.segmentId).labels
  return {
    ...s,
    rentalCode: r.code,
    rentalTitle: r.title,
    rentalKind: r.kind,
    clientName: L.client(s.clientId).name,
    address: r.address,
    bairroId: r.bairroId,
    bairroName: b?.name ?? '',
    zoneId: (b?.zone ?? 'plano') as ZoneId,
    teamName: team?.name ?? '',
    teamColor: team?.color ?? 'viz-1',
    unitCodes: s.unitIds.map((id) => units.get(id)?.code ?? '').filter(Boolean),
    contact: r.contact,
    typeLabel: labels.serviceTypes[s.type],
    end: addMinutes(s.start, s.durationMin),
  }
}

/* ───────────────────────── Consultas ───────────────────────── */

/** Serviços de um dia (ou período), por equipe se quiser, ordenados por equipe e rota */
export function listServices(filter: ServiceFilter = {}): Promise<ServiceView[]> {
  return call(() => {
    const data = getData()
    const sts = filter.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]) : undefined
    const from = filter.date ? dayArg(filter.date) : filter.from
    const to = filter.date ? dayArg(filter.date) : filter.to
    return data.services
      .filter((s) => {
        const d = dayOf(s.start)
        if (from && d < from) return false
        if (to && d > to) return false
        if (filter.teamId && s.teamId !== filter.teamId) return false
        if (filter.rentalId && s.rentalId !== filter.rentalId) return false
        if (filter.clientId && s.clientId !== filter.clientId) return false
        if (sts && !sts.includes(s.status)) return false
        if (filter.type && s.type !== filter.type) return false
        if (filter.extra !== undefined && s.extra !== filter.extra) return false
        return true
      })
      .sort((a, b) => a.start.localeCompare(b.start) || a.order - b.order)
      .map((s) => toServiceView(s, data))
  })
}

/** Serviço completo: locação, cliente, equipe, equipamentos, avarias e checklist do segmento */
export function getService(id: string): Promise<ServiceDetail> {
  return call(() => {
    const data = getData()
    const s = data.services.find((x) => x.id === id)
    if (!s) throw new ServiceError('Serviço não encontrado.')
    const L = lookup(data)
    const view = toServiceView(s, data)
    const units = mapById(data.units)
    return {
      ...view,
      rental: L.rental(s.rentalId),
      client: L.client(s.clientId),
      team: data.teams.find((t) => t.id === s.teamId)!,
      units: s.unitIds.map((u) => units.get(u)!).filter(Boolean),
      damages: data.damages.filter((d) => d.serviceId === id || s.report?.damageIds.includes(d.id)),
      checklistTemplate: getSegment(data.settings.segmentId).checklists[s.type],
    }
  })
}

/** Equipes (caminhões) */
export function listTeams(): Promise<Team[]> {
  return call(() => getData().teams)
}

/* ───────────────────────── Rota: mover e reorganizar ───────────────────────── */

const FIXED: ServiceStatus[] = ['concluido', 'em_andamento', 'a_caminho', 'cancelado']

/** Refaz horários e status dos serviços ainda não iniciados de uma equipe em um dia, mantendo a ordem da lista */
function reflowRoute(list: Service[], day: ISODate, data: DbData, now: Date): Service[] {
  const rentals = mapById(data.rentals)
  const isToday = day === todayFn()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  let cursor = 0
  let prevBairro: string | undefined
  return list.map((s, i) => {
    const bairro = rentals.get(s.rentalId)?.bairroId
    if (FIXED.includes(s.status)) {
      if (s.status !== 'cancelado') {
        cursor = Math.max(cursor, minutesOf(s.start) + s.durationMin)
        prevBairro = bairro
      }
      return { ...s, order: i + 1 }
    }
    const travel = prevBairro && bairro ? travelMinutes(prevBairro, bairro) : 0
    const original = minutesOf(s.start)
    const earliest = isToday && (s.status === 'atrasado' || original < nowMin) ? Math.ceil((nowMin + 10) / 5) * 5 : original
    const start = Math.max(earliest, cursor ? cursor + travel : 0)
    cursor = start + s.durationMin
    prevBairro = bairro
    const status: ServiceStatus = isToday && start < nowMin ? 'atrasado' : 'agendado'
    return { ...s, start: atTime(day, start), status, order: i + 1 }
  })
}

/** Arrastar e soltar: move o serviço para a equipe e posição (1 = primeiro) e refaz os horários das duas rotas */
export function moveService(id: string, to: { teamId: string; order: number }): Promise<ServiceView> {
  return call(() => {
    const data = getData()
    const s = data.services.find((x) => x.id === id)
    if (!s) throw new ServiceError('Serviço não encontrado.')
    if (FIXED.includes(s.status)) throw new ServiceError('Este serviço já começou ou foi concluído e não pode ser movido.')
    if (!data.teams.some((t) => t.id === to.teamId)) throw new ServiceError('Equipe não encontrada.')
    const day = dayOf(s.start)
    const now = demoNow()
    const route = (team: string) => data.services.filter((x) => x.teamId === team && dayOf(x.start) === day && x.id !== id).sort((a, b) => a.order - b.order || a.start.localeCompare(b.start))
    const target = route(to.teamId)
    const lastFixed = target.reduce((acc, x, i) => (FIXED.includes(x.status) && x.status !== 'cancelado' ? i : acc), -1)
    const idx = Math.max(lastFixed + 1, Math.min(target.length, Math.max(0, Math.round(to.order) - 1)))
    const moved: Service = { ...s, teamId: to.teamId }
    target.splice(idx, 0, moved)
    const updated = new Map<string, Service>()
    for (const x of reflowRoute(target, day, data, now)) updated.set(x.id, x)
    if (s.teamId !== to.teamId) for (const x of reflowRoute(route(s.teamId), day, data, now)) updated.set(x.id, x)
    commit({ services: data.services.map((x) => updated.get(x.id) ?? x) })
    return toServiceView(updated.get(id)!, getData())
  })
}

/** Sugestões para redistribuir a rota quando há serviço atrasado hoje (aplicar com moveService) */
export function computeReroute(data: DbData, today: ISODate = todayFn(), now: Date = demoNow()): RerouteSuggestion[] {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const todays = data.services.filter((s) => dayOf(s.start) === today && s.status !== 'cancelado')
  const rentals = mapById(data.rentals)
  const clients = mapById(data.clients)
  const late = todays.filter((s) => s.status === 'atrasado').sort((a, b) => a.start.localeCompare(b.start))
  if (!late.length) return []
  const lateTeams = new Set(late.map((s) => s.teamId))
  const pending = (team: string) => todays.filter((s) => s.teamId === team && (s.status === 'agendado' || s.status === 'atrasado'))
  const load = new Map<string, number>(data.teams.map((t) => [t.id, pending(t.id).reduce((a, s) => a + s.durationMin, 0)]))
  /** minutos até a equipe ficar livre: o que falta do serviço em curso */
  const freeIn = (team: string) => {
    const cur = todays.find((s) => s.teamId === team && (s.status === 'em_andamento' || s.status === 'a_caminho'))
    return cur ? Math.max(0, minutesOf(cur.start) + cur.durationMin - nowMin) : 0
  }
  const zoneBairro = (t: Team) => Object.values(BAIRRO).find((b) => b.zone === t.zoneId)?.id
  const out: RerouteSuggestion[] = []
  for (const s of late) {
    const r = rentals.get(s.rentalId)!
    const donorQueue = pending(s.teamId).filter((x) => x.start < s.start).reduce((a, x) => a + x.durationMin, 0)
    const donorWait = nowMin - minutesOf(s.start) + freeIn(s.teamId) + donorQueue
    const receivers = data.teams
      .filter((t) => t.id !== s.teamId && !lateTeams.has(t.id))
      .map((t) => {
        const home = zoneBairro(t)
        const travel = home ? travelMinutes(home, r.bairroId) : 20
        const wait = freeIn(t.id) + travel + (load.get(t.id) ?? 0) * 0.25
        return { t, wait, travel }
      })
      .sort((a, b) => a.wait - b.wait)
    const best = receivers[0]
    if (!best) continue
    const saved = Math.round(donorWait + (load.get(s.teamId) ?? 0) * 0.1 - best.wait)
    if (saved < 10) continue
    const route = todays.filter((x) => x.teamId === best.t.id).sort((a, b) => a.order - b.order)
    const lastFixedIdx = route.reduce((acc, x, i) => (FIXED.includes(x.status) ? i : acc), -1)
    out.push({
      id: `rr-${s.id}`,
      serviceId: s.id,
      fromTeamId: s.teamId,
      toTeamId: best.t.id,
      newOrder: lastFixedIdx + 2,
      reason: `${data.teams.find((t) => t.id === s.teamId)!.name} está ${nowMin - minutesOf(s.start)} min atrasada. ${best.t.name} está mais perto e com a rota mais leve.`,
      savedMinutes: saved,
      rentalTitle: r.title,
      clientName: clients.get(s.clientId)?.name ?? '',
    })
    load.set(best.t.id, (load.get(best.t.id) ?? 0) + s.durationMin)
    load.set(s.teamId, Math.max(0, (load.get(s.teamId) ?? 0) - s.durationMin))
  }
  return out
}

export function suggestReroute(): Promise<RerouteSuggestion[]> {
  return call(() => computeReroute(getData()))
}

/** Aplica uma sugestão de rota (usa moveService) */
export function applyReroute(s: Pick<RerouteSuggestion, 'serviceId' | 'toTeamId' | 'newOrder'>): Promise<ServiceView> {
  return moveService(s.serviceId, { teamId: s.toTeamId, order: s.newOrder })
}

/* ───────────────────────── Execução ───────────────────────── */

/** Muda o status (atalho da agenda). `concluido` sem relatório gera um relatório mínimo. */
export function setServiceStatus(id: string, status: ServiceStatus): Promise<ServiceView> {
  return call(() => {
    const data = getData()
    const s = data.services.find((x) => x.id === id)
    if (!s) throw new ServiceError('Serviço não encontrado.')
    if (status === 'concluido') return finish(data, s, undefined)
    const upd: Service = { ...s, status, startedAt: status === 'em_andamento' ? s.startedAt ?? demoNowISO() : s.startedAt }
    commit({ services: data.services.map((x) => (x.id === id ? upd : x)) })
    return toServiceView(upd, getData())
  })
}

/** Equipe começou o serviço */
export function startService(id: string): Promise<ServiceView> {
  return call(() => {
    const data = getData()
    const s = data.services.find((x) => x.id === id)
    if (!s) throw new ServiceError('Serviço não encontrado.')
    if (s.status === 'concluido' || s.status === 'cancelado') throw new ServiceError('Este serviço já foi encerrado.')
    const upd: Service = { ...s, status: 'em_andamento', startedAt: demoNowISO() }
    commit({ services: data.services.map((x) => (x.id === id ? upd : x)) })
    return toServiceView(upd, getData())
  })
}

function maxIso(a: string, b: string) {
  return a > b ? a : b
}

/** Conclui o serviço com relatório e propaga: unidades, status da locação, histórico e aviso. */
function finish(data: DbData, s: Service, input: ReportInput | undefined): ServiceView {
  if (s.status === 'cancelado') throw new ServiceError('Serviço cancelado não pode ser concluído.')
  const L = lookup(data)
  const rental = L.rental(s.rentalId)
  const ids = newIds()
  const startedAt = input?.startedAt ?? s.startedAt ?? s.start
  const report: ServiceReport = input
    ? {
        startedAt,
        finishedAt: input.finishedAt ?? (s.startedAt ? maxIso(demoNowISO(), addMinutes(startedAt, 10)) : addMinutes(startedAt, s.durationMin)),
        checklist: input.checklist,
        photos: (input.photos ?? []).map((p) => ({ ...p, id: p.id ?? ids.next('ph') })),
        signature: input.signature,
        notes: input.notes,
        damageIds: input.damageIds ?? [],
      }
    : autoReport(s, rental, data)
  const done: Service = { ...s, status: 'concluido', startedAt, report }
  let services = data.services.map((x) => (x.id === s.id ? done : x))
  let units = data.units
  let rentalNext: Rental = rental
  const today = todayFn()
  const types = mapById(data.types)
  const team = data.teams.find((t) => t.id === s.teamId)?.name ?? 'Equipe'
  if (s.type === 'entrega' || s.type === 'montagem') {
    units = deliverUnits(units, s.unitIds, rental.id)
    if (rental.status === 'confirmada') rentalNext = pushHistory({ ...rental, status: 'em_campo' }, `Entrega concluída por ${team}`)
    else rentalNext = pushHistory(rental, `${s.type === 'montagem' ? 'Montagem' : 'Entrega'} concluída por ${team}`)
  } else if (s.type === 'retirada') {
    units = returnUnits(units, s.unitIds, types, today)
    if (rental.status === 'em_campo') {
      rentalNext = pushHistory({ ...rental, status: 'retirada' }, `Retirada concluída por ${team}. Equipamentos de volta à base`)
      services = services.map((x) => (x.rentalId === rental.id && x.id !== s.id && (x.status === 'agendado' || x.status === 'atrasado') ? { ...x, status: 'cancelado' as const } : x))
    } else rentalNext = pushHistory(rental, `Retirada concluída por ${team}`)
  } else if (s.type === 'limpeza') {
    units = patchUnits(units, s.unitIds, (u) => (u.status === 'limpeza' ? { ...u, status: 'disponivel', idleSince: today, notes: undefined } : u))
  } else if (s.type === 'manutencao') {
    units = patchUnits(units, s.unitIds, (u) => (u.status === 'manutencao' ? { ...u, status: 'disponivel', idleSince: today, notes: undefined } : u))
  }
  const labels = getSegment(data.settings.segmentId).labels
  const note = mkNotification(ids, { kind: 'servico', title: `${labels.serviceTypes[s.type]} concluída`.replace('Recolhimento concluída', 'Recolhimento concluído'), text: `${team} finalizou ${rental.title}${report.photos.length ? `, com ${report.photos.length} fotos` : ''}${report.signature ? ' e assinatura' : ''}.`, ref: { type: 'service', id: s.id } })
  commit({
    services: renumberOrders(services),
    units,
    rentals: rentalNext === rental ? data.rentals : data.rentals.map((x) => (x.id === rental.id ? rentalNext : x)),
    notifications: [note, ...data.notifications],
    seq: ids.seq(),
  })
  return toServiceView(done, getData())
}

/**
 * Conclui o serviço com relatório (checklist, fotos, assinatura, observações).
 * Entrega concluída: locação vira `em_campo` e as unidades ficam em campo.
 * Retirada concluída: locação vira `retirada` e as unidades vão para limpeza (ou ficam disponíveis).
 */
export function completeService(id: string, report: ReportInput): Promise<ServiceView> {
  return call(() => {
    const data = getData()
    const s = data.services.find((x) => x.id === id)
    if (!s) throw new ServiceError('Serviço não encontrado.')
    if (s.status === 'concluido') throw new ServiceError('Este serviço já foi concluído.')
    return finish(data, s, report)
  })
}

/** Cria um serviço avulso (agenda) ou extra cobrado à parte */
export function createService(input: NewServiceInput): Promise<ServiceView> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const r = L.rental(input.rentalId)
    const ids = newIds()
    const unitIds = input.unitIds ?? r.items.filter((i) => L.type(i.typeId).cleanable || input.type !== 'limpeza').flatMap((i) => i.unitIds)
    const dur = input.durationMin ?? (input.type === 'manutencao' ? 50 : serviceDuration(input.type, unitIds.length))
    const s: Service = {
      id: ids.next('svc'),
      rentalId: r.id,
      clientId: r.clientId,
      teamId: input.teamId ?? teamIdForBairro(r.bairroId),
      type: input.type,
      start: input.start,
      durationMin: dur,
      order: 0,
      status: 'agendado',
      unitIds,
      extra: input.extra ?? false,
      extraValue: input.extra ? input.extraValue ?? Math.round(unitIds.length * 74.9 * 100) / 100 : undefined,
      extraBilled: input.extra ? false : undefined,
      note: input.note,
    }
    const services = renumberOrders([...data.services, s])
    commit({ services, seq: ids.seq() })
    return toServiceView(services.find((x) => x.id === s.id)!, getData())
  })
}

/** Cancela um serviço que ainda não aconteceu */
export function cancelService(id: string): Promise<ServiceView> {
  return setServiceStatus(id, 'cancelado')
}
