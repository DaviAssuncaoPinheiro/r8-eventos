// Regras de transição de estado compartilhadas entre serviços (unidades, locações, relatórios).
import { demoNowISO, addMinutes } from '@/domain/dates'
import { getSegment } from '@/domain/segments'
import type { DbData, EquipmentType, HistoryEntry, ISODate, Rental, Service, ServiceReport, Unit } from '@/domain/types'

export function patchUnits(units: Unit[], ids: Iterable<string>, f: (u: Unit) => Unit): Unit[] {
  const set = new Set(ids)
  if (!set.size) return units
  return units.map((u) => (set.has(u.id) ? f(u) : u))
}

/** Equipamentos chegaram ao cliente */
export function deliverUnits(units: Unit[], ids: Iterable<string>, rentalId: string): Unit[] {
  return patchUnits(units, ids, (u) => {
    const { idleSince: _i, ...rest } = u
    void _i
    return { ...rest, status: 'em_campo', rentalId }
  })
}

/** Equipamentos voltaram: os que recebem limpeza vão para higienização; os demais ficam disponíveis */
export function returnUnits(units: Unit[], ids: Iterable<string>, types: ReadonlyMap<string, EquipmentType>, today: ISODate): Unit[] {
  return patchUnits(units, ids, (u) => {
    const { rentalId: _r, ...rest } = u
    void _r
    if (types.get(u.typeId)?.cleanable) return { ...rest, status: 'limpeza', idleSince: undefined, notes: 'Chegou da retirada, aguardando higienização' }
    return { ...rest, status: 'disponivel', idleSince: today, notes: undefined }
  })
}

export function pushHistory(r: Rental, text: string, at: string = demoNowISO()): Rental {
  const h: HistoryEntry[] = [...r.history, { at, text }]
  return { ...r, history: h }
}

/** Relatório mínimo (quando o serviço é concluído por atalho, sem o app da equipe) */
export function autoReport(s: Service, rental: Rental, data: DbData): ServiceReport {
  const labels = getSegment(data.settings.segmentId).checklists[s.type]
  const startedAt = s.startedAt ?? s.start
  return {
    startedAt,
    finishedAt: addMinutes(startedAt, s.durationMin),
    checklist: labels.map((label) => ({ label, ok: true })),
    photos: [],
    signature: { name: rental.contact.name, role: rental.contact.role },
    damageIds: [],
  }
}

export function nextCode(list: readonly { code: string }[], prefix: string, first: number): string {
  let max = first - 1
  for (const x of list) {
    const n = Number(x.code.replace(/\D/g, ''))
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${prefix}-${max + 1}`
}

export function activeServiceStatuses(s: Service): boolean {
  return s.status !== 'concluido' && s.status !== 'cancelado'
}
