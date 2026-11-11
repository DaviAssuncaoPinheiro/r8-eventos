/* Locações: orçamento, confirmação (aloca equipamentos e monta a agenda), contrato, dossiê. */
import { BAIRRO } from '@/data/geo'
import { commit, getData, newIds } from '@/data/db'
import { addDays, dayOf, demoNow, demoNowISO, diffDays, daysInclusive, parseDay, today as todayFn, atTime, MONTHS_LONG } from '@/domain/dates'
import { billingCycles, createScheduler, cycleAmount, defaultBilling, planRentalServices, renumberOrders, rentalTotal, round2 } from '@/domain/planning'
import { getSegment } from '@/domain/segments'
import type { Billing, Charge, Client, ClientKind, Damage, EquipmentType, ISODate, ISODateTime, Rental, RentalItem, RentalKind, RentalStatus, Service, ServicePhoto, Unit, ZoneId, DbData } from '@/domain/types'
import { teamIdForBairro } from '@/domain/planning'
import { call, ServiceError } from './config'
import { formatMoney, holdsUnits, lookup, mapById, mkNotification, normalize } from './common'
import { autoReport, deliverUnits, nextCode, pushHistory, returnUnits } from './rules'
import { formatCNPJ, formatDate } from '@/lib/format'

/* ───────────────────────── Tipos ───────────────────────── */

export interface RentalFilter {
  status?: RentalStatus | RentalStatus[]
  kind?: RentalKind
  clientId?: string
  /** busca por código, título, cliente ou endereço */
  q?: string
  /** locações que se sobrepõem ao período */
  from?: ISODate
  to?: ISODate
  bairroId?: string
  zoneId?: ZoneId
  /** em andamento neste dia */
  activeOn?: ISODate
}

export interface RentalListItem extends Rental {
  clientName: string
  clientKind: ClientKind
  unitsTotal: number
  zoneId: ZoneId
  /** equipe da região */
  teamId: string
  nextServiceAt?: ISODateTime
  /** cobranças abertas e atrasadas da locação */
  openBalance: number
}

export interface RentalItemView extends RentalItem {
  type: EquipmentType
  units: Unit[]
}

export interface DossierEntry {
  id: string
  at: ISODateTime
  kind: 'locacao' | 'contrato' | 'servico' | 'avaria' | 'cobranca' | 'pagamento'
  title: string
  detail?: string
  refId?: string
  photos?: ServicePhoto[]
  signature?: { name: string; role: string; dataUrl?: string }
}

export interface RentalDetail {
  rental: RentalListItem
  client: Client
  items: RentalItemView[]
  services: Service[]
  damages: Damage[]
  charges: Charge[]
  dossier: DossierEntry[]
  financial: { total: number; billed: number; paid: number; open: number }
}

export interface AvailabilityQuery {
  typeId: string
  qty: number
  start: ISODate
  end: ISODate
  /** ignora esta locação (ao reconferir uma já existente) */
  excludeRentalId?: string
}

export interface AvailabilityResult {
  available: boolean
  /** equipamentos livres no período (sem os que estão em manutenção) */
  free: number
  total: number
  requested: number
  conflicts: { rentalId: string; code: string; clientName: string; qty: number; start: ISODate; end: ISODate }[]
}

export interface NewRentalInput {
  clientId: string
  title: string
  kind: RentalKind
  address: string
  bairroId: string
  start: ISODate
  end: ISODate
  items: { typeId: string; qty: number; rate?: number; billing?: Billing }[]
  cleaningsPerWeek?: number
  contact?: { name: string; role: string; phone: string }
  notes?: string
}

export interface RentalQuote {
  items: Pick<RentalItem, 'typeId' | 'qty' | 'rate' | 'billing'>[]
  days: number
  total: number
  /** valor de cada ciclo de cobrança (obra: 30 em 30 dias) */
  cycles: { from: ISODate; to: ISODate; value: number }[]
}

/* ───────────────────────── Auxiliares ───────────────────────── */

function busyUnitIds(rentals: readonly Rental[], typeId: string, start: ISODate, end: ISODate, exclude: string | undefined, today: ISODate) {
  const ids = new Set<string>()
  const conflicts: AvailabilityResult['conflicts'] = []
  const clients = mapById(getData().clients)
  for (const r of rentals) {
    if (r.id === exclude || !holdsUnits(r)) continue
    const rEnd = r.status === 'em_campo' && r.end < today ? today : r.end
    if (r.start > end || rEnd < start) continue
    let n = 0
    for (const it of r.items) if (it.typeId === typeId) for (const id of it.unitIds) { ids.add(id); n++ }
    if (n) conflicts.push({ rentalId: r.id, code: r.code, clientName: clients.get(r.clientId)?.name ?? '', qty: n, start: r.start, end: r.end })
  }
  conflicts.sort((a, b) => a.start.localeCompare(b.start))
  return { ids, conflicts }
}

export function computeAvailability(q: AvailabilityQuery, data: DbData = getData(), today = todayFn()): AvailabilityResult {
  const units = data.units.filter((u) => u.typeId === q.typeId)
  const usable = units.filter((u) => u.status !== 'manutencao')
  const { ids, conflicts } = busyUnitIds(data.rentals, q.typeId, q.start, q.end, q.excludeRentalId, today)
  const free = usable.filter((u) => !ids.has(u.id)).length
  return { available: free >= q.qty, free, total: units.length, requested: q.qty, conflicts }
}

function quoteOf(data: DbData = getData(), input: Pick<NewRentalInput, 'kind' | 'start' | 'end' | 'items'>): RentalQuote {
  const types = mapById(data.types)
  const bill = defaultBilling(input.kind, input.start, input.end)
  const items = input.items.map((i) => {
    const t = types.get(i.typeId)
    if (!t) throw new ServiceError('Tipo de equipamento inválido.')
    const billing = i.billing ?? bill
    return { typeId: i.typeId, qty: i.qty, billing, rate: i.rate ?? (billing === 'mensal' ? t.monthlyRate : t.dailyRate) }
  })
  const cycles = billingCycles(input.kind, input.start, input.end).map((c) => ({ from: c.from, to: c.to, value: cycleAmount(items, c.days) }))
  return { items, days: daysInclusive(input.start, input.end), total: rentalTotal(input.kind, input.start, input.end, items), cycles }
}

function toListItem(r: Rental, data: DbData = getData(), now = demoNowISO()): RentalListItem {
  const client = data.clients.find((c) => c.id === r.clientId)
  const zone = (BAIRRO[r.bairroId]?.zone ?? 'plano') as ZoneId
  const next = data.services.filter((s) => s.rentalId === r.id && (s.status === 'agendado' || s.status === 'atrasado' || s.status === 'a_caminho') && s.start >= now.slice(0, 10)).sort((a, b) => a.start.localeCompare(b.start))[0]
  const open = data.charges.filter((c) => c.rentalId === r.id && (c.status === 'aberta' || c.status === 'atrasada')).reduce((a, c) => a + c.value, 0)
  return {
    ...r,
    clientName: client?.name ?? '',
    clientKind: client?.kind ?? 'Construtora',
    unitsTotal: r.items.reduce((a, i) => a + i.qty, 0),
    zoneId: zone,
    teamId: teamIdForBairro(r.bairroId),
    nextServiceAt: next?.start,
    openBalance: round2(open),
  }
}

export function buildDossier(rentalId: string, data: DbData = getData()): DossierEntry[] {
  const L = lookup(data)
  const r = L.rental(rentalId)
  const labels = getSegment(data.settings.segmentId).labels
  const out: DossierEntry[] = []
  r.history.forEach((h, i) => out.push({ id: `${r.id}-h${i}`, at: h.at, kind: /[Cc]ontrato/.test(h.text) ? 'contrato' : 'locacao', title: h.text }))
  for (const s of data.services.filter((x) => x.rentalId === r.id && x.status === 'concluido')) {
    const rep = s.report
    const units = s.unitIds.map((id) => data.units.find((u) => u.id === id)?.code).filter(Boolean)
    out.push({
      id: s.id,
      at: rep?.finishedAt ?? s.start,
      kind: 'servico',
      title: serviceDoneTitle(labels.serviceTypes[s.type], s.extra),
      detail: `${units.length ? units.slice(0, 4).join(', ') + (units.length > 4 ? ` e mais ${units.length - 4}` : '') : ''}${rep?.notes ? ` · ${rep.notes}` : ''}`.replace(/^ · /, ''),
      refId: s.id,
      photos: rep?.photos,
      signature: rep?.signature,
    })
  }
  for (const d of data.damages.filter((x) => x.rentalId === r.id)) {
    out.push({ id: d.id, at: atTime(d.date, 12 * 60), kind: 'avaria', title: `${capital(labels.damage)} registrada: ${d.kind}`, detail: `${data.units.find((u) => u.id === d.unitId)?.code ?? ''} · ${formatMoney(d.value)}`, refId: d.id, photos: d.photos })
  }
  for (const c of data.charges.filter((x) => x.rentalId === r.id)) {
    out.push({ id: c.id, at: c.sentAt ?? atTime(c.issuedAt, 9 * 60), kind: 'cobranca', title: `Cobrança ${c.code} emitida`, detail: `${formatMoney(c.value)} · vence em ${formatDate(c.dueAt)}`, refId: c.id })
    if (c.paidAt) out.push({ id: `${c.id}-pago`, at: atTime(c.paidAt, 16 * 60), kind: 'pagamento', title: `Pagamento de ${c.code} recebido`, detail: formatMoney(c.value), refId: c.id })
  }
  return out.sort((a, b) => a.at.localeCompare(b.at))
}

function serviceDoneTitle(label: string, extra: boolean): string {
  const masculine = /^Recolhimento/.test(label)
  return `${label}${extra ? ' extra' : ''} ${masculine ? 'concluído' : 'concluída'}`
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* ───────────────────────── Consultas ───────────────────────── */

/** Versão síncrona de listRentals (uso interno de outros serviços) */
export function listRentalsSync(filter: RentalFilter = {}, data: DbData = getData()): RentalListItem[] {
  const q = filter.q ? normalize(filter.q) : ''
  const statuses = filter.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]) : undefined
  const clients = mapById(data.clients)
  return data.rentals
    .filter((r) => {
      if (statuses && !statuses.includes(r.status)) return false
      if (filter.kind && r.kind !== filter.kind) return false
      if (filter.clientId && r.clientId !== filter.clientId) return false
      if (filter.bairroId && r.bairroId !== filter.bairroId) return false
      if (filter.zoneId && BAIRRO[r.bairroId]?.zone !== filter.zoneId) return false
      if (filter.from && r.end < filter.from) return false
      if (filter.to && r.start > filter.to) return false
      if (filter.activeOn && !(r.start <= filter.activeOn && filter.activeOn <= r.end)) return false
      if (q && !normalize(`${r.code} ${r.title} ${clients.get(r.clientId)?.name ?? ''} ${r.address}`).includes(q)) return false
      return true
    })
    .sort((a, b) => b.start.localeCompare(a.start) || b.code.localeCompare(a.code))
    .map((r) => toListItem(r, data))
}

/** Lista de locações (mais recentes primeiro) com cliente, total de equipamentos e saldo aberto */
export function listRentals(filter: RentalFilter = {}): Promise<RentalListItem[]> {
  return call(() => listRentalsSync(filter))
}

/** Locação completa: cliente, equipamentos, serviços, avarias, cobranças e dossiê cronológico */
export function getRental(id: string): Promise<RentalDetail> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const r = L.rental(id)
    const charges = data.charges.filter((c) => c.rentalId === id).sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))
    const live = charges.filter((c) => c.status !== 'cancelada' && c.status !== 'rascunho')
    const unitMap = mapById(data.units)
    return {
      rental: toListItem(r, data),
      client: L.client(r.clientId),
      items: r.items.map((it) => ({ ...it, type: L.type(it.typeId), units: it.unitIds.map((u) => unitMap.get(u)!).filter(Boolean) })),
      services: data.services.filter((s) => s.rentalId === id).sort((a, b) => a.start.localeCompare(b.start)),
      damages: data.damages.filter((d) => d.rentalId === id),
      charges,
      dossier: buildDossier(id, data),
      financial: {
        total: r.total,
        billed: round2(live.reduce((a, c) => a + c.value, 0)),
        paid: round2(live.filter((c) => c.status === 'paga').reduce((a, c) => a + c.value, 0)),
        open: round2(live.filter((c) => c.status === 'aberta' || c.status === 'atrasada').reduce((a, c) => a + c.value, 0)),
      },
    }
  })
}

/** Linha do tempo cronológica da locação (serviços com fotos e assinatura, avarias, cobranças, contrato) */
export function getDossier(rentalId: string): Promise<DossierEntry[]> {
  return call(() => buildDossier(rentalId))
}

/** Há equipamentos livres do tipo no período? Também lista as locações que disputam o estoque. */
export function checkAvailability(q: AvailabilityQuery): Promise<AvailabilityResult> {
  return call(() => computeAvailability(q))
}

/** Preço e ciclos de cobrança de um orçamento, sem salvar nada */
export function quoteRental(input: Pick<NewRentalInput, 'kind' | 'start' | 'end' | 'items'>): Promise<RentalQuote> {
  return call(() => quoteOf(getData(), input))
}

/* ───────────────────────── Mutações ───────────────────────── */

/** Cria um orçamento (status `orcamento`, sem equipamentos alocados) */
export function createRental(input: NewRentalInput): Promise<Rental> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const client = L.client(input.clientId)
    if (!input.items.length || input.items.some((i) => i.qty < 1)) throw new ServiceError('Informe ao menos um equipamento com quantidade.')
    if (input.end < input.start) throw new ServiceError('A data final não pode ser antes da inicial.')
    const q = quoteOf(data, input)
    const ids = newIds()
    const nowIso = demoNowISO()
    const user = data.settings.users.find((u) => u.id === data.settings.currentUserId)?.name ?? 'Equipe'
    const cleanable = input.items.some((i) => L.type(i.typeId).cleanable)
    const days = q.days
    const rental: Rental = {
      id: '',
      code: nextCode(data.rentals, 'LOC', 2000),
      clientId: client.id,
      title: input.title,
      kind: input.kind,
      address: input.address,
      bairroId: input.bairroId,
      start: input.start,
      end: input.end,
      status: 'orcamento',
      items: q.items.map((i) => ({ ...i, unitIds: [] })),
      cleaningsPerWeek: input.cleaningsPerWeek ?? (cleanable ? (input.kind === 'obra' ? 2 : days >= 2 ? 7 : 0) : 0),
      total: q.total,
      contact: input.contact ?? (client.contacts[0] ? { name: client.contacts[0].name, role: client.contacts[0].role, phone: client.contacts[0].phone } : { name: client.name, role: 'Responsável', phone: '' }),
      notes: input.notes,
      createdAt: nowIso,
      history: [{ at: nowIso, text: `Orçamento criado por ${user}` }],
    }
    rental.id = rental.code.toLowerCase()
    commit({ rentals: [...data.rentals, rental], seq: ids.seq() })
    return rental
  })
}

/** Núcleo da confirmação: aloca equipamentos (parados há mais tempo primeiro), gera contrato e agenda. */
function confirmCore(id: string) {
  const data = getData()
  const L = lookup(data)
  const r = L.rental(id)
  if (r.status !== 'orcamento') throw new ServiceError('Só orçamentos podem ser confirmados.')
  const today = todayFn()
  const taken = new Set<string>()
  const items: RentalItem[] = r.items.map((it) => {
    const t = L.type(it.typeId)
    const { ids: busy } = busyUnitIds(data.rentals, it.typeId, r.start, r.end, r.id, today)
    const cands = data.units
      .filter((u) => u.typeId === it.typeId && u.status !== 'manutencao' && !busy.has(u.id) && !taken.has(u.id))
      .sort((a, b) => Number(b.status === 'disponivel') - Number(a.status === 'disponivel') || (a.idleSince ?? '9999').localeCompare(b.idleSince ?? '9999') || a.code.localeCompare(b.code))
    if (cands.length < it.qty) throw new ServiceError(`Sem disponibilidade de ${t.short} no período: faltam ${it.qty - cands.length}.`)
    const chosen = cands.slice(0, it.qty).map((u) => u.id)
    chosen.forEach((u) => taken.add(u))
    return { ...it, unitIds: chosen }
  })
  const nowIso = demoNowISO()
  const ids = newIds()
  let rental: Rental = { ...r, items, status: 'confirmada', contract: { generatedAt: nowIso } }
  rental = pushHistory(rental, 'Orçamento aprovado pelo cliente. Locação confirmada.')
  rental = pushHistory(rental, 'Contrato gerado')
  // agenda: entrega, limpezas recorrentes e retirada
  const typesMap = mapById(data.types)
  const plan: Rental = { ...rental, start: rental.start < today ? today : rental.start, end: rental.end < today ? today : rental.end }
  const sched = createScheduler(data.services, (rid) => data.rentals.find((x) => x.id === rid)?.bairroId, { day: today, min: 11 * 60 })
  const horizon = addDays(plan.start, 182) < plan.end ? addDays(plan.start, 182) : plan.end
  const created = planRentalServices(plan, { units: mapById(data.units), types: typesMap, scheduler: sched, horizon, newId: ids.next })
  const services = renumberOrders([...data.services, ...created])
  const client = L.client(r.clientId)
  const note = mkNotification(ids, { kind: 'locacao', title: 'Locação confirmada', text: `${rental.code} · ${rental.title} (${client.name}) confirmada. ${created.length} serviços agendados.`, ref: { type: 'rental', id: r.id } })
  commit({
    rentals: data.rentals.map((x) => (x.id === id ? rental : x)),
    services,
    notifications: [note, ...data.notifications],
    seq: ids.seq(),
  })
  return rental
}

/**
 * Confirma o orçamento: aloca equipamentos, gera contrato e cria a agenda
 * (entrega/montagem, limpezas recorrentes, retirada). Rejeita se faltar estoque.
 */
export function confirmRental(id: string): Promise<Rental> {
  return call(() => confirmCore(id))
}

/** Registra a assinatura do contrato (nome e, opcionalmente, o desenho da assinatura em data URL pequena) */
export function signContract(id: string, input: { name: string; signatureDataUrl?: string }): Promise<Rental> {
  return call(() => {
    const data = getData()
    const r = lookup(data).rental(id)
    if (!r.contract) throw new ServiceError('Esta locação ainda não tem contrato. Confirme o orçamento primeiro.')
    if (r.contract.signedAt) throw new ServiceError('O contrato já foi assinado.')
    if (!input.name.trim()) throw new ServiceError('Informe o nome de quem assina.')
    const nowIso = demoNowISO()
    let rental: Rental = { ...r, contract: { ...r.contract, signedAt: nowIso, signedBy: input.name.trim(), signatureDataUrl: input.signatureDataUrl } }
    rental = pushHistory(rental, `Contrato assinado por ${input.name.trim()}`, nowIso)
    const ids = newIds()
    const note = mkNotification(ids, { kind: 'locacao', title: 'Contrato assinado', text: `${input.name.trim()} assinou o contrato de ${rental.title}.`, ref: { type: 'rental', id } })
    commit({ rentals: data.rentals.map((x) => (x.id === id ? rental : x)), notifications: [note, ...data.notifications], seq: ids.seq() })
    return rental
  })
}

/**
 * Avança a locação um passo: orçamento -> confirmada -> em campo -> retirada -> faturada.
 * Em campo: marca a entrega como feita. Retirada: equipamentos voltam (limpeza ou disponível).
 * Faturada: emite cobrança do que ainda não foi faturado.
 */
export function advanceRental(id: string): Promise<Rental> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const r = L.rental(id)
    const today = todayFn()
    if (r.status === 'orcamento') return confirmCore(id)
    const ids = newIds()
    if (r.status === 'confirmada') {
      const delivery = data.services.filter((s) => s.rentalId === id && (s.type === 'entrega' || s.type === 'montagem') && s.status !== 'concluido' && s.status !== 'cancelado')
      const services = data.services.map((s) => (delivery.some((d) => d.id === s.id) ? { ...s, status: 'concluido' as const, report: autoReport(s, r, data) } : s))
      const rental = pushHistory({ ...r, status: 'em_campo' }, 'Equipamentos entregues no local e conferidos')
      commit({ rentals: data.rentals.map((x) => (x.id === id ? rental : x)), services, units: deliverUnits(data.units, r.items.flatMap((i) => i.unitIds), id), seq: ids.seq() })
      return rental
    }
    if (r.status === 'em_campo') {
      const unitIds = r.items.flatMap((i) => i.unitIds)
      const services = data.services.map((s) => {
        if (s.rentalId !== id || s.status === 'concluido' || s.status === 'cancelado') return s
        if (s.type === 'retirada') return { ...s, status: 'concluido' as const, report: autoReport(s, r, data) }
        return { ...s, status: 'cancelado' as const }
      })
      const rental = pushHistory({ ...r, status: 'retirada' }, 'Retirada concluída. Equipamentos de volta à base')
      commit({ rentals: data.rentals.map((x) => (x.id === id ? rental : x)), services, units: returnUnits(data.units, unitIds, mapById(data.types), today), seq: ids.seq() })
      return rental
    }
    if (r.status === 'retirada') {
      const billed = data.charges.filter((c) => c.rentalId === id && c.status !== 'cancelada').reduce((a, c) => a + c.value, 0)
      const remaining = round2(r.total - billed)
      const client = L.client(r.clientId)
      const charges = [...data.charges]
      if (remaining > 0.5) {
        const c: Charge = {
          id: ids.next('chg'),
          code: nextCode(data.charges, 'COB', 5000),
          clientId: r.clientId,
          rentalId: id,
          kind: r.kind === 'obra' ? 'mensalidade' : 'locacao',
          description: `Fechamento da locação · ${r.title}`,
          value: remaining,
          issuedAt: today,
          dueAt: addDays(today, 10),
          status: 'aberta',
          method: client.kind === 'Construtora' ? 'boleto' : 'pix',
          sentAt: demoNowISO(),
          sentVia: 'email',
          reminders: [],
        }
        charges.push(c)
      }
      const rental = pushHistory({ ...r, status: 'faturada' }, 'Locação encerrada e faturada')
      commit({ rentals: data.rentals.map((x) => (x.id === id ? rental : x)), charges, seq: ids.seq() })
      return rental
    }
    throw new ServiceError(r.status === 'cancelada' ? 'Locação cancelada não pode avançar.' : 'A locação já está encerrada.')
  })
}

/** Cancela orçamento ou locação confirmada: libera equipamentos, cancela serviços e cobranças abertas */
export function cancelRental(id: string, reason?: string): Promise<Rental> {
  return call(() => {
    const data = getData()
    const r = lookup(data).rental(id)
    if (r.status === 'em_campo' || r.status === 'retirada' || r.status === 'faturada') throw new ServiceError('Esta locação já foi entregue. Faça a retirada em vez de cancelar.')
    if (r.status === 'cancelada') throw new ServiceError('A locação já está cancelada.')
    const rental = pushHistory({ ...r, status: 'cancelada', items: r.items.map((i) => ({ ...i, unitIds: [] })) }, `Locação cancelada${reason ? `. ${reason}` : ''}`)
    commit({
      rentals: data.rentals.map((x) => (x.id === id ? rental : x)),
      services: data.services.map((s) => (s.rentalId === id && s.status !== 'concluido' ? { ...s, status: 'cancelado' as const } : s)),
      charges: data.charges.map((c) => (c.rentalId === id && (c.status === 'aberta' || c.status === 'rascunho') ? { ...c, status: 'cancelada' as const } : c)),
    })
    return rental
  })
}

/** Texto do contrato de locação, pronto para exibir ou imprimir */
export function generateContractText(id: string): Promise<string> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const r = L.rental(id)
    const c = L.client(r.clientId)
    const co = data.settings.company
    const labels = getSegment(data.settings.segmentId).labels
    const days = daysInclusive(r.start, r.end)
    const date = parseDay(r.contract?.generatedAt ? dayOf(r.contract.generatedAt) : todayFn())
    const itemsText = r.items
      .map((i) => {
        const t = L.type(i.typeId)
        return `  - ${i.qty} x ${t.name}, ${formatMoney(i.rate)} por ${i.billing === 'mensal' ? 'mês' : 'dia'} (${i.billing === 'mensal' ? 'cobrança mensal' : 'cobrança por diária'})`
      })
      .join('\n')
    return [
      'CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS',
      '',
      `Contrato nº ${r.code}`,
      '',
      `LOCADORA: ${co.legalName}, CNPJ ${co.cnpj}, com sede em ${co.address}, ${co.city}, telefone ${co.phone}.`,
      `LOCATÁRIA: ${c.name}, CNPJ ${formatCNPJ(c.cnpj)}, com endereço em ${c.address}. Responsável: ${r.contact.name} (${r.contact.role}), telefone ${r.contact.phone}.`,
      '',
      'CLÁUSULA 1. DO OBJETO',
      `A locadora entrega em locação à locatária os ${labels.equipmentPlural} abaixo, para uso em "${r.title}", no endereço ${r.address}.`,
      itemsText,
      '',
      'CLÁUSULA 2. DO PRAZO',
      `A locação começa em ${formatDate(r.start)} e termina em ${formatDate(r.end)} (${days} ${days === 1 ? 'dia' : 'dias'}). A retirada dos ${labels.equipmentPlural} será feita pela locadora na data final, salvo prorrogação combinada por escrito.`,
      '',
      'CLÁUSULA 3. DO VALOR E DO PAGAMENTO',
      `O valor total previsto é de ${formatMoney(r.total)}. ${r.kind === 'obra' ? 'A cobrança é mensal, emitida a cada 30 dias de locação.' : 'A cobrança é única, emitida na entrega.'} O pagamento é feito por Pix ou boleto, nos prazos informados em cada cobrança. O atraso gera atualização e aviso pela régua de cobrança da locadora.`,
      '',
      `CLÁUSULA 4. DA ${labels.cleaning.toUpperCase()}`,
      r.cleaningsPerWeek > 0 ? `A locadora realiza ${r.cleaningsPerWeek === 7 ? 'uma ' + labels.cleaning + ' por dia' : r.cleaningsPerWeek + (r.cleaningsPerWeek === 1 ? ' ' + labels.cleaning + ' por semana' : ' ' + labels.cleaningPlural + ' por semana')}, com relatório, fotos e assinatura do responsável no local, disponíveis no portal do cliente.` : `Este contrato não inclui ${labels.cleaningPlural} periódicas. ${capital(labels.cleaningPlural)} extras podem ser pedidas e são cobradas à parte.`,
      '',
      `CLÁUSULA 5. DA GUARDA E DAS ${labels.damagePlural.toUpperCase()}`,
      `A locatária responde pela guarda dos ${labels.equipmentPlural} enquanto estiverem no local. ${capital(labels.damagePlural)} e extravios constatados na retirada, ou durante a locação, serão registrados com foto e cobrados pelo valor de reparo ou reposição.`,
      '',
      'CLÁUSULA 6. DO CANCELAMENTO',
      'O cancelamento antes da entrega não gera multa. Após a entrega, a locação segue até a retirada.',
      '',
      'CLÁUSULA 7. DO FORO',
      `Fica eleito o foro de ${co.city.split('·')[0].trim()} para resolver questões deste contrato.`,
      '',
      `${co.city.split('·')[0].trim()}, ${date.getDate()} de ${MONTHS_LONG[date.getMonth()]} de ${date.getFullYear()}.`,
      '',
      r.contract?.signedAt ? `Assinado por ${r.contract.signedBy} em ${formatDate(r.contract.signedAt)}.` : 'Aguardando assinatura da locatária.',
    ].join('\n')
  })
}

void diffDays
void demoNow

/** Gera o contrato de uma locação confirmada que ainda não tem um (sem assinatura) */
export function generateContract(id: string): Promise<Rental> {
  return call(() => {
    const data = getData()
    const r = lookup(data).rental(id)
    if (r.status === 'orcamento' || r.status === 'cancelada') throw new ServiceError('Confirme o orçamento antes de gerar o contrato.')
    if (r.contract) return r
    const rental = pushHistory({ ...r, contract: { generatedAt: demoNowISO() } }, 'Contrato gerado')
    commit({ rentals: data.rentals.map((x) => (x.id === id ? rental : x)) })
    return rental
  })
}
