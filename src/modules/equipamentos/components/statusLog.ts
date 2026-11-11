/* Registro local das mudanças de situação feitas pela tela (a base não guarda esse histórico). */
import { diffDays, today } from '@/domain/dates'
import type { UnitStatus } from '@/services'

export interface StatusChange {
  unitId: string
  at: string
  from: UnitStatus
  to: UnitStatus
}
const KEY = 'r8.equipamentos.mudancas'

function readAll(): StatusChange[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as StatusChange[]
  } catch {
    return []
  }
}

/*
  "Restaurar dados" não passa por aqui, então um registro só vale se bate com a unidade como ela está agora:
  o último destino é a situação atual e, se está parada, os dias parados batem com a data da mudança.
  Se não bater, a demonstração foi restaurada: os registros da unidade são apagados.
*/
export function readChanges(unit: { id: string; status: UnitStatus; idleDays?: number }): StatusChange[] {
  const all = readAll()
  const mine = all.filter((c) => c.unitId === unit.id).sort((a, b) => a.at.localeCompare(b.at))
  if (!mine.length) return []
  const last = mine[mine.length - 1]
  const idleOk = unit.status !== 'disponivel' || Math.abs((unit.idleDays ?? 0) - diffDays(last.at.slice(0, 10), today())) <= 1
  if (last.to !== unit.status || !idleOk) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all.filter((c) => c.unitId !== unit.id)))
    } catch {
      /* sem armazenamento */
    }
    return []
  }
  let start = mine.length - 1
  while (start > 0 && mine[start - 1].to === mine[start].from) start--
  return mine.slice(start)
}

export function addChange(c: StatusChange) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '[]') as StatusChange[]
    localStorage.setItem(KEY, JSON.stringify([...all, c].slice(-200)))
  } catch {
    /* sem armazenamento: a mudança vale, só não entra no histórico */
  }
}
