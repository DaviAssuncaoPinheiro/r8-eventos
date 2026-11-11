/* Busca global: clientes, locações e equipamentos. */
import { getData } from '@/data/db'
import { call } from './config'
import { normalize } from './common'
import type { ClientView } from './clientes'
import { listRentalsSync, type RentalListItem } from './locacoes'
import type { UnitView } from './equipamentos'

export interface SearchResult {
  clients: Pick<ClientView, 'id' | 'name' | 'kind' | 'cnpj'>[]
  rentals: RentalListItem[]
  units: (Pick<UnitView, 'id' | 'code' | 'status' | 'typeId'> & { typeName: string; rentalCode?: string })[]
}

/** Busca por nome de cliente, CNPJ, código/título de locação ou código de equipamento (até 6 de cada) */
export function search(q: string): Promise<SearchResult> {
  return call(() => {
    const data = getData()
    const n = normalize(q.trim())
    if (!n) return { clients: [], rentals: [], units: [] }
    const clients = data.clients.filter((c) => normalize(`${c.name} ${c.cnpj} ${c.contacts.map((x) => x.name).join(' ')}`).includes(n)).slice(0, 6).map((c) => ({ id: c.id, name: c.name, kind: c.kind, cnpj: c.cnpj }))
    const rentals = listRentalsSync({ q }, data).slice(0, 6)
    const types = new Map(data.types.map((t) => [t.id, t]))
    const rentalOf = new Map(data.rentals.map((r) => [r.id, r]))
    const units = data.units
      .filter((u) => normalize(`${u.code} ${types.get(u.typeId)?.name ?? ''}`).includes(n))
      .slice(0, 6)
      .map((u) => ({ id: u.id, code: u.code, status: u.status, typeId: u.typeId, typeName: types.get(u.typeId)?.name ?? '', rentalCode: u.rentalId ? rentalOf.get(u.rentalId)?.code : undefined }))
    return { clients, rentals, units }
  })
}

