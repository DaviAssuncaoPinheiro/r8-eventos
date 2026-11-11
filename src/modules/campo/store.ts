/* Estado local do app de campo: equipe ativa, modo sem sinal, fila de envio e rascunhos do registro. */
import { create } from 'zustand'
import { useDb } from '@/data/db'
import type { NewDamageInput, ReportInput } from '@/services'

export interface DraftPhoto {
  id: string
  src: string
  label: string
  moment: 'antes' | 'depois' | 'avaria'
}

export interface DraftDamage {
  localId: string
  unitId: string
  unitCode: string
  kind: string
  value: number
  photo?: DraftPhoto
}

export interface Draft {
  step: number
  checked: Record<string, boolean>
  photos: DraftPhoto[]
  moment: 'antes' | 'depois'
  hasDamage: boolean | null
  damages: DraftDamage[]
  signName: string
  signRole: string
  signature: string | null
}

export type QueueItem =
  | { id: string; kind: 'damage'; label: string; teamId: string; localId: string; input: NewDamageInput }
  | { id: string; kind: 'complete'; label: string; teamId: string; serviceId: string; report: ReportInput; damageLocalIds: string[] }

interface Persisted {
  /** contador de ids da base quando gravou: se a base voltou ao início depois, este estado é de antes e não vale mais */
  dbSeq?: number
  teamId: string | null
  offline: boolean
  queue: QueueItem[]
  drafts: Record<string, Draft>
  myDamages: Record<string, string[]>
}

interface CampoState extends Persisted {
  syncing: boolean
  setTeam: (id: string) => void
  setOffline: (v: boolean) => void
  enqueue: (item: QueueItem) => void
  dequeue: (id: string) => void
  setSyncing: (v: boolean) => void
  patchDraft: (serviceId: string, base: () => Draft, patch: Partial<Draft>) => void
  clearDraft: (serviceId: string) => void
  addMyDamage: (teamId: string, damageId: string) => void
}

const KEY = 'r8.campo.v1'
/** Foto maior que isto (data URL) não vai para o localStorage. */
const MAX_PERSISTED_PHOTO = 90_000

function load(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(KEY)
    const p = raw ? (JSON.parse(raw) as Partial<Persisted>) : {}
    return typeof p.dbSeq === 'number' && useDb.getState().seq < p.dbSeq ? {} : p
  } catch {
    return {}
  }
}

const keepPhoto = <T extends { src: string } | undefined>(p: T): T | undefined => (p && (!p.src.startsWith('data:') || p.src.length <= MAX_PERSISTED_PHOTO) ? p : undefined)

function slimDrafts(drafts: Record<string, Draft>): Record<string, Draft> {
  const out: Record<string, Draft> = {}
  for (const [id, d] of Object.entries(drafts)) {
    out[id] = {
      ...d,
      photos: d.photos.filter((p) => keepPhoto(p)),
      damages: d.damages.map((x) => ({ ...x, photo: keepPhoto(x.photo) })),
    }
  }
  return out
}

function save(s: Persisted) {
  const attempts: Persisted[] = [
    { ...s, drafts: slimDrafts(s.drafts) },
    { ...s, drafts: slimDrafts(s.drafts), queue: [] },
  ]
  for (const a of attempts) {
    try {
      localStorage.setItem(KEY, JSON.stringify(a))
      return
    } catch {
      /* cota cheia ou armazenamento bloqueado: tenta a versão menor */
    }
  }
}

const saved = load()

export const useCampo = create<CampoState>((set) => ({
  teamId: saved.teamId ?? null,
  offline: saved.offline ?? false,
  queue: saved.queue ?? [],
  drafts: saved.drafts ?? {},
  myDamages: saved.myDamages ?? {},
  syncing: false,
  setTeam: (teamId) => set({ teamId }),
  setOffline: (offline) => set({ offline }),
  enqueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
  dequeue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
  setSyncing: (syncing) => set({ syncing }),
  patchDraft: (serviceId, base, patch) => set((s) => ({ drafts: { ...s.drafts, [serviceId]: { ...(s.drafts[serviceId] ?? base()), ...patch } } })),
  clearDraft: (serviceId) =>
    set((s) => {
      const { [serviceId]: _gone, ...rest } = s.drafts
      void _gone
      return { drafts: rest }
    }),
  addMyDamage: (teamId, damageId) => set((s) => ({ myDamages: { ...s.myDamages, [teamId]: [...(s.myDamages[teamId] ?? []), damageId] } })),
}))

const snapshot = (): Persisted => {
  const s = useCampo.getState()
  return { dbSeq: useDb.getState().seq, teamId: s.teamId, offline: s.offline, queue: s.queue, drafts: s.drafts, myDamages: s.myDamages }
}

let timer: ReturnType<typeof setTimeout> | undefined
useCampo.subscribe(() => {
  clearTimeout(timer)
  timer = setTimeout(() => save(snapshot()), 150)
})
/* saindo da página: grava já, sem esperar o intervalo */
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => save(snapshot()))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save(snapshot())
  })
}

/** Volta o campo ao início: equipe padrão, com sinal, sem fila, rascunhos nem avarias da sessão. */
export function resetCampo() {
  useCampo.setState({ teamId: null, offline: false, queue: [], drafts: {}, myDamages: {}, syncing: false })
}

/* "Restaurar dados" em qualquer lugar (faixa do escritório, aba Demonstração) troca a base inteira de uma vez */
useDb.subscribe((s, p) => {
  if (s.clients !== p.clients && s.units !== p.units && s.teams !== p.teams && s.types !== p.types) resetCampo()
})
