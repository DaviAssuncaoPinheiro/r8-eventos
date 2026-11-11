/* Clientes: carteira, ficha com histórico e comprovantes de serviço. */
import { BAIRRO } from '@/data/geo'
import { commit, getData, newIds } from '@/data/db'
import { today as todayFn } from '@/domain/dates'
import { getSegment } from '@/domain/segments'
import type { Client, ClientKind, Contact, ISODate, ServicePhoto, ServiceType, ZoneId } from '@/domain/types'
import { call, ServiceError } from './config'
import { lookup, mapById, normalize } from './common'
import { filterChargesSync, type ChargeView } from './financeiro'
import { listRentalsSync, type RentalListItem } from './locacoes'

export interface ClientView extends Client {
  zoneId: ZoneId
  /** locações em campo agora */
  activeRentals: number
  /** abertas + atrasadas */
  receivable: number
  overdue: number
  /** total já pago */
  totalPaid: number
  lastRentalStart?: ISODate
}

export interface ClientFilter {
  q?: string
  kind?: ClientKind
  withOverdue?: boolean
  withActiveRentals?: boolean
}

/** Comprovante de um serviço concluído: data, fotos, assinatura e checklist */
export interface ServiceReceipt {
  serviceId: string
  at: string
  type: ServiceType
  typeLabel: string
  extra: boolean
  rentalId: string
  rentalCode: string
  rentalTitle: string
  teamName: string
  unitCodes: string[]
  photos: ServicePhoto[]
  signature?: { name: string; role: string; dataUrl?: string }
  checklist: { label: string; ok: boolean }[]
  notes?: string
}

export interface ClientDetail {
  client: ClientView
  rentals: RentalListItem[]
  charges: ChargeView[]
  /** comprovantes dos serviços concluídos, mais recentes primeiro (até 150) */
  receipts: ServiceReceipt[]
  contacts: Contact[]
}

export interface NewClientInput {
  name: string
  kind: ClientKind
  cnpj: string
  address: string
  bairroId: string
  contacts: Contact[]
}

function viewOf(c: Client): ClientView {
  const data = getData()
  const rentals = data.rentals.filter((r) => r.clientId === c.id)
  const charges = data.charges.filter((x) => x.clientId === c.id)
  const sum = (f: (x: (typeof charges)[number]) => boolean) => Math.round(charges.filter(f).reduce((a, x) => a + x.value, 0) * 100) / 100
  const starts = rentals.filter((r) => r.status !== 'orcamento' && r.status !== 'cancelada').map((r) => r.start).sort()
  return {
    ...c,
    zoneId: (BAIRRO[c.bairroId]?.zone ?? 'plano') as ZoneId,
    activeRentals: rentals.filter((r) => r.status === 'em_campo').length,
    receivable: sum((x) => x.status === 'aberta' || x.status === 'atrasada'),
    overdue: sum((x) => x.status === 'atrasada'),
    totalPaid: sum((x) => x.status === 'paga'),
    lastRentalStart: starts[starts.length - 1],
  }
}

export function receiptsOf(clientId: string, limit = 150): ServiceReceipt[] {
  const data = getData()
  const L = lookup(data)
  const labels = getSegment(data.settings.segmentId).labels
  const units = mapById(data.units)
  const teams = mapById(data.teams)
  return data.services
    .filter((s) => s.clientId === clientId && s.status === 'concluido' && s.report)
    .sort((a, b) => (b.report!.finishedAt).localeCompare(a.report!.finishedAt))
    .slice(0, limit)
    .map((s) => {
      const r = L.rental(s.rentalId)
      return {
        serviceId: s.id,
        at: s.report!.finishedAt,
        type: s.type,
        typeLabel: labels.serviceTypes[s.type],
        extra: s.extra,
        rentalId: r.id,
        rentalCode: r.code,
        rentalTitle: r.title,
        teamName: teams.get(s.teamId)?.name ?? '',
        unitCodes: s.unitIds.map((u) => units.get(u)?.code ?? '').filter(Boolean),
        photos: s.report!.photos,
        signature: s.report!.signature,
        checklist: s.report!.checklist,
        notes: s.report!.notes,
      }
    })
}

/** Carteira de clientes com locações ativas, a receber e atrasado */
export function listClients(filter: ClientFilter = {}): Promise<ClientView[]> {
  return call(() => {
    const q = filter.q ? normalize(filter.q) : ''
    return getData()
      .clients.map(viewOf)
      .filter((c) => {
        if (filter.kind && c.kind !== filter.kind) return false
        if (filter.withOverdue && c.overdue <= 0) return false
        if (filter.withActiveRentals && c.activeRentals <= 0) return false
        if (q && !normalize(`${c.name} ${c.cnpj} ${c.contacts.map((x) => x.name).join(' ')}`).includes(q)) return false
        return true
      })
      .sort((a, b) => b.activeRentals - a.activeRentals || b.receivable - a.receivable || a.name.localeCompare(b.name))
  })
}

/** Ficha do cliente: locações, cobranças, comprovantes de serviço e contatos */
export function getClient(id: string): Promise<ClientDetail> {
  return call(() => {
    const data = getData()
    const c = lookup(data).client(id)
    return {
      client: viewOf(c),
      rentals: listRentalsSync({ clientId: id }),
      charges: filterChargesSync({ clientId: id }),
      receipts: receiptsOf(id),
      contacts: c.contacts,
    }
  })
}

export function createClient(input: NewClientInput): Promise<Client> {
  return call(() => {
    const data = getData()
    if (!input.name.trim()) throw new ServiceError('Informe o nome do cliente.')
    const ids = newIds()
    const slug = normalize(input.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const c: Client = {
      id: ids.next('cli'),
      name: input.name.trim(),
      kind: input.kind,
      cnpj: input.cnpj,
      since: todayFn(),
      address: input.address,
      bairroId: input.bairroId,
      contacts: input.contacts,
      portalToken: `${slug}-${(ids.seq() * 7919).toString(36)}`,
    }
    commit({ clients: [...data.clients, c], seq: ids.seq() })
    return c
  })
}

export function updateClient(id: string, patch: Partial<Omit<Client, 'id' | 'portalToken' | 'since'>>): Promise<Client> {
  return call(() => {
    const data = getData()
    const c = lookup(data).client(id)
    if (patch.name !== undefined && !patch.name.trim()) throw new ServiceError('O nome não pode ficar vazio.')
    const upd: Client = { ...c, ...patch }
    commit({ clients: data.clients.map((x) => (x.id === id ? upd : x)) })
    return upd
  })
}

