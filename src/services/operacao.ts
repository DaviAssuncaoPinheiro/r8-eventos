/* Operação: agenda das equipes, rotas, execução de serviços e relatórios. */
import { BAIRRO, BASE } from '@/data/geo'
import { commit, getData, newIds } from '@/data/db'
import { addMinutes, atTime, dayOf, demoNow, demoNowISO, minutesOf, today as todayFn } from '@/domain/dates'
import { renumberOrders, serviceDuration, teamIdForBairro, travelMinutes } from '@/domain/planning'
import { getSegment } from '@/domain/segments'
import { SYS_ROTAS } from '@/domain/automations'
import type { AutomationRun, Client, DbData, Damage, ISODate, ISODateTime, Rental, Service, ServicePhoto, ServiceReport, ServiceStatus, ServiceType, Team, Unit, ZoneId } from '@/domain/types'
import { call, ServiceError } from './config'
import { lookup, mapById, mkNotification } from './common'
import { autoReport, patchUnits, pushHistory, returnUnits, deliverUnits } from './rules'
import { formatDate } from '@/lib/format'

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

/* ───────────────────────── Rotas: quilômetros e otimização ───────────────────────── */

/** Fator de via sobre a distância em linha reta (haversine) */
export const ROAD_FACTOR = 1.3
/** Velocidade média urbana, km/h */
export const AVG_SPEED_KMH = 35
/** Consumo do caminhão, km por litro, e preço do diesel, R$ por litro */
export const KM_PER_LITER = 3.2
export const DIESEL_PRICE = 6.19

type LatLng = { lat: number; lng: number }

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Quilômetros de via entre dois pontos */
export const roadKm = (a: LatLng, b: LatLng) => haversineKm(a, b) * ROAD_FACTOR

const k1 = (n: number) => Math.round(n * 10) / 10

export interface RouteStop {
  serviceId: string
  rentalTitle: string
  clientName: string
  type: ServiceType
  bairroName: string
  lat: number
  lng: number
  status: ServiceStatus
  start: ISODateTime
  durationMin: number
  /** já começou (em andamento ou a caminho): fica onde está na rota */
  fixed: boolean
  /** km de via desde a parada anterior (ou desde onde a equipe está) */
  legKm: number
}

export interface TeamRouteDistance {
  teamId: string
  teamName: string
  teamColor: string
  /** paradas ainda não concluídas, na ordem atual (as em andamento ou a caminho primeiro) */
  stops: RouteStop[]
  /** km de via que faltam: de onde a equipe está (a base, ou a parada em curso), pelas paradas e de volta à base */
  km: number
}

export interface RouteDistances {
  date: ISODate
  totalKm: number
  teams: TeamRouteDistance[]
}

export interface TeamRouteOptimization {
  teamId: string
  teamName: string
  teamColor: string
  /** ordem atual das paradas ainda não concluídas */
  current: RouteStop[]
  /** ordem otimizada (iguais se já está boa) */
  optimized: RouteStop[]
  kmBefore: number
  kmAfter: number
  kmSaved: number
  changed: boolean
}

export interface RouteOptimization {
  date: ISODate
  kmBefore: number
  kmAfter: number
  kmSaved: number
  /** tempo de estrada poupado (35 km/h de média urbana), em minutos */
  minutesSaved: number
  /** diesel poupado em R$ (3,2 km/L e R$ 6,19 o litro) */
  fuelSaved: number
  teams: TeamRouteOptimization[]
}

interface TeamPlan {
  team: Team
  start: LatLng
  fixed: Service[]
  pending: Service[]
}

const FIXED_ACTIVE: ServiceStatus[] = ['em_andamento', 'a_caminho']

function loc(data: DbData, s: Service): LatLng & { bairroName: string } {
  const r = data.rentals.find((x) => x.id === s.rentalId)!
  const b = BAIRRO[r.bairroId]
  return { lat: b.lat, lng: b.lng, bairroName: b.name }
}

function plansFor(data: DbData, date: ISODate): TeamPlan[] {
  return data.teams.map((team) => {
    const list = data.services.filter((s) => s.teamId === team.id && dayOf(s.start) === date && s.status !== 'cancelado' && s.status !== 'concluido').sort((a, b) => a.order - b.order || a.start.localeCompare(b.start))
    const fixed = list.filter((s) => FIXED_ACTIVE.includes(s.status))
    const pending = list.filter((s) => !FIXED_ACTIVE.includes(s.status))
    const last = fixed[fixed.length - 1]
    return { team, start: last ? loc(data, last) : BASE, fixed, pending }
  })
}

const tourKm = (start: LatLng, pts: LatLng[]): number => {
  let km = 0
  let prev = start
  for (const p of pts) {
    km += roadKm(prev, p)
    prev = p
  }
  return km + roadKm(prev, BASE)
}

/** Vizinho mais próximo a partir de `start`, depois 2-opt (inverte trechos enquanto encurta o percurso, que volta à base) */
function bestOrder(start: LatLng, pts: LatLng[]): number[] {
  const n = pts.length
  const length = (ord: number[]) => tourKm(start, ord.map((i) => pts[i]))
  const twoOpt = (ord: number[]): number[] => {
    let cur = ord
    let best = length(cur)
    for (let improved = true; improved; ) {
      improved = false
      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          const cand = [...cur.slice(0, i), ...cur.slice(i, j + 1).reverse(), ...cur.slice(j + 1)]
          const len = length(cand)
          if (len < best - 1e-9) {
            cur = cand
            best = len
            improved = true
          }
        }
      }
    }
    return cur
  }
  // vizinho mais próximo
  const left = new Set(Array.from({ length: n }, (_, i) => i))
  const nn: number[] = []
  let at = start
  while (left.size) {
    let pick = -1
    let d = Infinity
    for (const i of [...left].sort((a, b) => a - b)) {
      const x = roadKm(at, pts[i])
      if (x < d - 1e-9) {
        d = x
        pick = i
      }
    }
    nn.push(pick)
    left.delete(pick)
    at = pts[pick]
  }
  const identity = Array.from({ length: n }, (_, i) => i)
  const cands = [twoOpt(nn), twoOpt(identity)]
  return cands.reduce((a, b) => (length(b) < length(a) - 1e-9 ? b : a))
}

function stopOf(data: DbData, s: Service, from: LatLng): RouteStop {
  const r = data.rentals.find((x) => x.id === s.rentalId)!
  const l = loc(data, s)
  return {
    serviceId: s.id,
    rentalTitle: r.title,
    clientName: data.clients.find((c) => c.id === s.clientId)?.name ?? '',
    type: s.type,
    bairroName: l.bairroName,
    lat: l.lat,
    lng: l.lng,
    status: s.status,
    start: s.start,
    durationMin: s.durationMin,
    fixed: FIXED_ACTIVE.includes(s.status),
    legKm: k1(roadKm(from, l)),
  }
}

function stopsWithLegs(data: DbData, fixed: Service[], pending: Service[], start: LatLng): RouteStop[] {
  const out: RouteStop[] = []
  let prev: LatLng = start
  fixed.forEach((s, i) => {
    out.push(stopOf(data, s, i === 0 ? start : prev))
    prev = loc(data, s)
  })
  for (const s of pending) {
    out.push(stopOf(data, s, prev))
    prev = loc(data, s)
  }
  return out
}

/** Quilômetros de via que faltam por equipe no dia (da posição da equipe, pelas paradas, e de volta à base) */
export function computeRouteDistances(data: DbData, date: ISODate): RouteDistances {
  const teams = plansFor(data, date).map<TeamRouteDistance>((p) => {
    const stops = stopsWithLegs(data, p.fixed, p.pending, p.start)
    const km = tourKm(p.start, p.pending.map((s) => loc(data, s)))
    return { teamId: p.team.id, teamName: p.team.name, teamColor: p.team.color, stops, km: k1(km) }
  })
  return { date, totalKm: k1(teams.reduce((a, t) => a + t.km, 0)), teams }
}

export function getRouteDistances(date: ISODate | Date = todayFn()): Promise<RouteDistances> {
  return call(() => computeRouteDistances(getData(), dayArg(date)))
}

/** Proposta de rotas otimizadas (não grava). Só reordena o que ainda não começou, saindo de onde a equipe está. */
export function computeRouteOptimization(data: DbData, date: ISODate): RouteOptimization {
  let before = 0
  let after = 0
  const teams = plansFor(data, date).map<TeamRouteOptimization & { _opt: Service[] }>((p) => {
    const pts = p.pending.map((s) => loc(data, s))
    const kmBefore = tourKm(p.start, pts)
    let order = p.pending.map((_, i) => i)
    let kmAfter = kmBefore
    if (p.pending.length > 1) {
      const cand = bestOrder(p.start, pts)
      const km = tourKm(p.start, cand.map((i) => pts[i]))
      if (km < kmBefore - 0.05) {
        order = cand
        kmAfter = km
      }
    }
    const opt = order.map((i) => p.pending[i])
    before += kmBefore
    after += kmAfter
    return {
      teamId: p.team.id,
      teamName: p.team.name,
      teamColor: p.team.color,
      current: stopsWithLegs(data, p.fixed, p.pending, p.start),
      optimized: stopsWithLegs(data, p.fixed, opt, p.start),
      kmBefore: k1(kmBefore),
      kmAfter: k1(kmAfter),
      kmSaved: k1(kmBefore - kmAfter),
      changed: order.some((v, i) => v !== i),
      _opt: opt,
    }
  })
  const saved = before - after
  return {
    date,
    kmBefore: k1(before),
    kmAfter: k1(after),
    kmSaved: k1(saved),
    minutesSaved: Math.round((saved / AVG_SPEED_KMH) * 60),
    fuelSaved: Math.round((saved / KM_PER_LITER) * DIESEL_PRICE * 100) / 100,
    teams: teams.map(({ _opt, ...t }) => t),
  }
}

export function optimizeRoutes(date: ISODate | Date = todayFn()): Promise<RouteOptimization> {
  return call(() => computeRouteOptimization(getData(), dayArg(date)))
}

/**
 * Grava a ordem otimizada (e recalcula os horários com a mesma regra de moveService: as paradas que ainda não começaram
 * seguem em fila a partir do primeiro horário livre, com o deslocamento entre elas) e registra no histórico de automações.
 */
export function applyOptimizedRoutes(date: ISODate | Date = todayFn()): Promise<RouteOptimization> {
  return call(() => {
    const data = getData()
    const day = dayArg(date)
    const proposal = computeRouteOptimization(data, day)
    const changed = proposal.teams.filter((t) => t.changed)
    if (!changed.length) return proposal
    const now = demoNow()
    const updated = new Map<string, Service>()
    for (const t of changed) {
      const all = data.services.filter((s) => s.teamId === t.teamId && dayOf(s.start) === day).sort((a, b) => a.order - b.order || a.start.localeCompare(b.start))
      const byId = new Map(all.map((s) => [s.id, s]))
      const keep = all.filter((s) => s.status === 'concluido' || FIXED_ACTIVE.includes(s.status))
      const pend = t.optimized.filter((s) => !s.fixed).map((s) => byId.get(s.serviceId)!)
      const first = pend.reduce((m, s) => (s.start < m ? s.start : m), pend[0].start)
      // todas as paradas livres partem do primeiro horário livre: a regra de reflow encadeia uma depois da outra
      const queued = pend.map((s) => ({ ...s, start: atTime(day, minutesOf(first)), status: 'agendado' as ServiceStatus }))
      for (const x of reflowRoute([...keep, ...queued], day, data, now)) updated.set(x.id, x)
    }
    const ids = newIds()
    const run: AutomationRun = {
      id: ids.next('run'),
      automationId: SYS_ROTAS.id,
      automationName: SYS_ROTAS.name,
      at: demoNowISO(),
      text: `Rotas de ${formatDate(day)} reordenadas em ${changed.length} ${changed.length === 1 ? 'equipe' : 'equipes'}: ${proposal.kmSaved.toString().replace('.', ',')} km a menos`,
      value: proposal.fuelSaved,
      minutesSaved: proposal.minutesSaved,
    }
    const note = mkNotification(ids, { kind: 'servico', title: 'Rotas otimizadas', text: `${changed.map((t) => t.teamName).join(', ')}: ${proposal.kmSaved.toString().replace('.', ',')} km e ${proposal.minutesSaved} min a menos na estrada.` })
    commit({ services: data.services.map((s) => updated.get(s.id) ?? s), automationLog: [...data.automationLog, run], notifications: [note, ...data.notifications], seq: ids.seq() })
    return computeRouteOptimization(getData(), day)
  })
}

/* ───────────────────────── Frota: posição simulada dos caminhões ───────────────────────── */

export type FleetStatus = 'na_base' | 'em_rota' | 'no_local'

export interface FleetPosition {
  teamId: string
  teamName: string
  teamColor: string
  lat: number
  lng: number
  /** direção em graus (0 = norte, sentido horário) */
  heading: number
  status: FleetStatus
  fromLabel: string
  toLabel: string
  /** 0 a 1 do trecho em curso (1 quando está no local, 0 na base) */
  progress: number
  /** minutos para chegar (em rota), para sair (no local) ou 0 (na base) */
  etaMinutes: number
}

/** Cada segundo real vale este tanto de segundos no relógio da demonstração (os caminhões andam em tempo de demo) */
export const FLEET_TIME_SCALE = 15
const LOADED_AT = Date.now()

const bearing = (a: LatLng, b: LatLng) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat))
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng))
  return Math.round((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360)
}
const lerp = (a: LatLng, b: LatLng, t: number): LatLng => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })

/** Relógio simulado: "agora" da demonstração (10:40) mais o tempo real decorrido desde a carga, na escala FLEET_TIME_SCALE */
export function fleetClock(): Date {
  return new Date(demoNow().getTime() + (Date.now() - LOADED_AT) * FLEET_TIME_SCALE)
}

/**
 * Posição de cada caminhão em `at` (padrão: relógio simulado). Versão síncrona, boa para animar a cada quadro.
 * Cada equipe percorre os serviços de hoje na ordem da rota: sai da base, anda até a parada (velocidade de
 * deslocamento = distância pela via a 35 km/h), fica o tempo do serviço, segue para a próxima e volta para a base.
 * Serviço que ainda não começou e já passou do horário (atrasado, a caminho) chega pouco depois de "agora".
 */
export function computeFleetPositions(at: Date = fleetClock(), data: DbData = getData()): FleetPosition[] {
  const t = at.getTime()
  const anchor = demoNow().getTime()
  const today = dayOf(demoNowISO())
  const min = 60000
  return data.teams.map<FleetPosition>((team) => {
    const base = { teamId: team.id, teamName: team.name, teamColor: team.color }
    const list = data.services.filter((s) => s.teamId === team.id && dayOf(s.start) === today && s.status !== 'cancelado').sort((a, b) => a.order - b.order || a.start.localeCompare(b.start))
    if (!list.length) return { ...base, lat: BASE.lat, lng: BASE.lng, heading: 0, status: 'na_base', fromLabel: BASE.name, toLabel: BASE.name, progress: 0, etaMinutes: 0 }
    type Leg = { from: LatLng; fromLabel: string; to: LatLng; toLabel: string; depart: number; arrive: number; leave: number }
    const legs: Leg[] = []
    let prev: LatLng = BASE
    let prevLabel = BASE.name
    let prevLeave = 0
    list.forEach((s, i) => {
      const l = loc(data, s)
      const r = data.rentals.find((x) => x.id === s.rentalId)!
      const travel = (roadKm(prev, l) / AVG_SPEED_KMH) * 60 * min
      const planned = new Date(s.start).getTime()
      let arrive: number
      let leave: number
      if (s.status === 'concluido' && s.report) {
        arrive = new Date(s.report.startedAt).getTime()
        leave = new Date(s.report.finishedAt).getTime()
      } else if (s.status === 'em_andamento') {
        arrive = s.startedAt ? new Date(s.startedAt).getTime() : planned
        leave = Math.max(arrive + s.durationMin * min, anchor + 5 * min)
      } else {
        arrive = i === 0 ? planned : Math.max(planned, prevLeave + travel)
        // ainda não começou e o horário já passou: chega logo depois de "agora"
        if (s.status !== 'concluido' && arrive < anchor) arrive = anchor + Math.max(4 * min, travel * 0.5)
        leave = arrive + s.durationMin * min
      }
      // sai no último momento que ainda chega na hora (nunca antes de terminar o serviço anterior)
      const depart = i === 0 ? arrive - travel : Math.max(prevLeave, arrive - travel)
      legs.push({ from: prev, fromLabel: prevLabel, to: l, toLabel: r.title, depart, arrive, leave })
      prev = l
      prevLabel = r.title
      prevLeave = leave
    })
    // volta para a base depois do último serviço
    const homeTravel = (roadKm(prev, BASE) / AVG_SPEED_KMH) * 60 * min
    const home: Leg = { from: prev, fromLabel: prevLabel, to: BASE, toLabel: BASE.name, depart: prevLeave, arrive: prevLeave + homeTravel, leave: Infinity }
    const all = [...legs, home]
    const first = all[0]
    if (t < first.depart) return { ...base, lat: BASE.lat, lng: BASE.lng, heading: bearing(BASE, first.to), status: 'na_base', fromLabel: BASE.name, toLabel: first.toLabel, progress: 0, etaMinutes: 0 }
    for (const [i, g] of all.entries()) {
      if (t >= g.depart && t < g.arrive) {
        const p = (t - g.depart) / Math.max(1, g.arrive - g.depart)
        const pos = lerp(g.from, g.to, p)
        return { ...base, lat: pos.lat, lng: pos.lng, heading: bearing(g.from, g.to), status: 'em_rota', fromLabel: g.fromLabel, toLabel: g.toLabel, progress: Math.round(p * 1000) / 1000, etaMinutes: Math.max(0, Math.ceil((g.arrive - t) / min)) }
      }
      // no local: do serviço até a hora de sair para o próximo (ou para a base)
      const nextDepart = all[i + 1]?.depart ?? Infinity
      if (g !== home && t >= g.arrive && t < nextDepart) {
        return { ...base, lat: g.to.lat, lng: g.to.lng, heading: bearing(g.from, g.to), status: 'no_local', fromLabel: g.toLabel, toLabel: g.toLabel, progress: 1, etaMinutes: Math.max(0, Math.ceil((Math.max(g.leave, t) - t) / min)) }
      }
    }
    // já voltou à base
    return { ...base, lat: BASE.lat, lng: BASE.lng, heading: bearing(home.from, BASE), status: 'na_base', fromLabel: BASE.name, toLabel: BASE.name, progress: 0, etaMinutes: 0 }
  })
}

/** Posição simulada de cada caminhão agora (anda enquanto a tela está aberta: ver FLEET_TIME_SCALE) */
export function getFleetPositions(): Promise<FleetPosition[]> {
  return call(() => computeFleetPositions())
}
