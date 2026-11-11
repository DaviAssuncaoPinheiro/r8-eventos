/* Registro local das mudanças de situação feitas pela tela (a base não guarda esse histórico). */
import type { UnitStatus } from '@/services'

export interface StatusChange {
  unitId: string
  at: string
  from: UnitStatus
  to: UnitStatus
}
const KEY = 'r8.equipamentos.mudancas'

export function readChanges(unitId: string): StatusChange[] {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '[]') as StatusChange[]
    return all.filter((c) => c.unitId === unitId)
  } catch {
    return []
  }
}

export function addChange(c: StatusChange) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '[]') as StatusChange[]
    localStorage.setItem(KEY, JSON.stringify([...all, c].slice(-200)))
  } catch {
    /* sem armazenamento: a mudança vale, só não entra no histórico */
  }
}
