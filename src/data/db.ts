/*
  Estado em memória da demonstração (zustand) + persistência em localStorage.

  - As TELAS nunca leem este store: usam src/services. Única exceção: useSettings/useLabels (marca, pacote e IA).
  - `version` sobe a cada mutação; useQuery refaz a busca quando ele muda.
  - Se `seededOn` for de outro dia ao carregar, todas as datas do estado são deslocadas pela diferença de dias,
    então a demonstração continua "viva" sem perder as ações feitas.
*/
import { create } from 'zustand'
import { dayStr, diffDays, shiftAllDates } from '@/domain/dates'
import type { DbData } from '@/domain/types'
import { buildSeed } from './seed'

export const STORAGE_KEY = 'locadora.db.v1'
const SCHEMA = 1

export interface DbState extends DbData {
  /** contador que sobe a cada mutação */
  version: number
  /** dia (AAAA-MM-DD) em que as datas do estado foram ajustadas pela última vez */
  seededOn: string
}

const DATA_KEYS: (keyof DbData)[] = ['settings', 'clients', 'types', 'units', 'teams', 'rentals', 'services', 'damages', 'charges', 'notifications', 'suggestions', 'seq']

function pickData(s: DbData): DbData {
  const out = {} as Record<string, unknown>
  for (const k of DATA_KEYS) out[k] = s[k]
  return out as unknown as DbData
}

function readStorage(): { state: DbState } | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { schema?: number; state?: DbState }
    if (parsed.schema !== SCHEMA || !parsed.state || !Array.isArray(parsed.state.rentals) || !parsed.state.seededOn) return null
    return { state: parsed.state }
  } catch {
    return null
  }
}

let persistFailed = false

function writeStorage(state: DbState) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: SCHEMA, state }))
    persistFailed = false
  } catch {
    // cota estourada ou armazenamento bloqueado: segue só em memória
    persistFailed = true
  }
}

/** true se a última gravação no localStorage falhou (a demonstração segue em memória) */
export function isPersistFailed(): boolean {
  return persistFailed
}

function freshState(): DbState {
  return { ...buildSeed(new Date()), version: 1, seededOn: dayStr(new Date()) }
}

function initialState(): DbState {
  const stored = readStorage()
  if (!stored) {
    const s = freshState()
    writeStorage(s)
    return s
  }
  const todayStr = dayStr(new Date())
  const st = stored.state
  if (st.seededOn === todayStr) return st
  const delta = diffDays(st.seededOn, todayStr)
  const shifted = { ...shiftAllDates(pickData(st), delta), version: st.version + 1, seededOn: todayStr } as DbState
  writeStorage(shifted)
  return shifted
}

export const useDb = create<DbState>(() => initialState())

/** Estado atual (só para uso dos serviços) */
export function getData(): DbState {
  return useDb.getState()
}

/** Aplica um patch, sobe a versão e persiste. Os serviços chamam isto uma vez por mutação (atômico). */
export function commit(patch: Partial<DbData>): void {
  useDb.setState((s) => ({ ...patch, version: s.version + 1 }))
  writeStorage(useDb.getState())
}

/** Gerador de ids: `const ids = newIds(); ids.next('svc'); commit({ ..., seq: ids.seq() })` */
export function newIds() {
  let n = getData().seq
  return {
    next: (prefix: string) => `${prefix}-${String(++n).padStart(4, '0')}`,
    seq: () => n,
  }
}

/** Volta ao estado da semente (dados de hoje) */
export function resetDemo(): void {
  const s = freshState()
  useDb.setState({ ...s, version: useDb.getState().version + 1 }, true)
  writeStorage(useDb.getState())
  // estados auxiliares que os módulos guardam por conta própria também voltam ao início;
  // tema, tour e a cor em cache ficam (a cor é reaplicada pelas configurações restauradas)
  try {
    const keep = new Set(['r8.theme', 'r8.tour.v1', 'r8.brand'])
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith('r8.') && !keep.has(k)) localStorage.removeItem(k)
    }
  } catch {
    /* armazenamento indisponível: nada a limpar */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:reset'))
}

/** Cópia do estado completo, para depuração */
export function exportState(): DbState {
  return JSON.parse(JSON.stringify(getData())) as DbState
}

/** Estado da semente do dia, sem tocar no store (testes) */
export function seedSnapshot(): DbState {
  return freshState()
}
