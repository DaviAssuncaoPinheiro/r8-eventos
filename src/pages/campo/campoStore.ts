// Estado local do app da equipe (rascunho do registro, notificações do celular, fila offline).
// Não persiste: o que precisa refletir no restante do sistema vai para o store global (src/store.ts).
import { create } from 'zustand'
import { PRODUCT, RENTAL, type Job, type OccKind } from '@/data/mock'
import { CHECKLISTS } from '@/lib/history'
import { jobItems } from '@/lib/fieldkit'
import { useDemo } from '@/store'
import { cleanUnits, plainName } from './data'

export interface DraftOcc {
  id: string
  unitId?: string
  kind: OccKind
  note: string
  photoId?: string
}

export interface DraftSupply {
  id: string
  label: string
  qty: number
  unit: [string, string]
  step: number
}

export interface Draft {
  step: number
  /** unidades marcadas como feitas (limpeza e manutenção) */
  units: Record<string, boolean>
  /** conferência de itens (montagem e retirada): productId → quantidade */
  items: Record<string, number>
  checklist: Record<string, boolean>
  supplies: DraftSupply[]
  notes: string
  occurrences: DraftOcc[]
  /** ocorrências abertas resolvidas neste serviço */
  resolved: Record<string, boolean>
  signer: string
  role: string
  signature?: string
}

export type NoticeKind = 'whatsapp' | 'app' | 'sync' | 'offline'
export interface Notice {
  id: number
  kind: NoticeKind
  title: string
  body: string
}

export function makeDraft(job: Job): Draft {
  const r = RENTAL[job.rentalId]
  const n = job.type === 'Limpeza' ? cleanUnits(r).length || job.units : job.units
  const items: Record<string, number> = {}
  for (const it of jobItems(job)) items[it.productId] = 0
  return {
    step: 0,
    units: {},
    items,
    checklist: {},
    supplies:
      job.type === 'Limpeza'
        ? [
            { id: 'papel', label: 'Papel higiênico', qty: n * 2, unit: ['rolo', 'rolos'], step: 1 },
            { id: 'quimico', label: 'Produto químico', qty: Math.ceil(n * 0.5), unit: ['litro', 'litros'], step: 1 },
            { id: 'desinfetante', label: 'Desinfetante', qty: Math.max(1, Math.round(n / 6)), unit: ['galão', 'galões'], step: 1 },
          ]
        : [],
    notes: '',
    occurrences: [],
    resolved: {},
    signer: r.id === 'jardins' ? 'Valdir Souza' : plainName(r.contact.name),
    role: r.id === 'jardins' ? 'Mestre de obras' : r.contact.role,
  }
}

/** Itens do checklist marcados */
export const checklistDone = (job: Job, d: Draft) => CHECKLISTS[job.type].filter((l) => d.checklist[l]).length

/** Itens da conferência que batem com o previsto */
export const itemsOk = (job: Job, d: Draft) => jobItems(job).filter((i) => (d.items[i.productId] ?? 0) === i.qty).length

export const itemLabel = (productId: string, qty: number) => {
  const p = PRODUCT[productId as keyof typeof PRODUCT]
  return `${qty.toLocaleString('pt-BR')} ${qty === 1 ? p.unit[0] : p.unit[1]}`
}

let noticeSeq = 0

interface CampoState {
  drafts: Record<string, Draft>
  arrived: Record<string, boolean>
  startedAt: Record<string, string>
  notices: Notice[]
  pending: number
  syncing: boolean
  ensureDraft: (j: Job) => void
  patch: (jobId: string, p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void
  setArrived: (jobId: string) => void
  setStarted: (jobId: string, iso: string) => void
  notify: (n: Omit<Notice, 'id'>) => void
  dismiss: (id: number) => void
  setPending: (n: number | ((p: number) => number)) => void
  setSyncing: (v: boolean) => void
}

export const useCampo = create<CampoState>()((set) => ({
  drafts: {},
  arrived: {},
  startedAt: {},
  notices: [],
  pending: 0,
  syncing: false,
  ensureDraft: (j) => set((s) => (s.drafts[j.id] ? s : { drafts: { ...s.drafts, [j.id]: makeDraft(j) } })),
  patch: (id, p) =>
    set((s) => {
      const cur = s.drafts[id]
      if (!cur) return s
      const next = typeof p === 'function' ? p(cur) : p
      return { drafts: { ...s.drafts, [id]: { ...cur, ...next } } }
    }),
  setArrived: (id) => set((s) => ({ arrived: { ...s.arrived, [id]: true } })),
  setStarted: (id, iso) => set((s) => ({ startedAt: { ...s.startedAt, [id]: iso } })),
  notify: (n) => set((s) => ({ notices: [...s.notices.slice(-2), { ...n, id: ++noticeSeq }] })),
  dismiss: (id) => set((s) => ({ notices: s.notices.filter((x) => x.id !== id) })),
  setPending: (n) => set((s) => ({ pending: typeof n === 'function' ? n(s.pending) : n })),
  setSyncing: (v) => set({ syncing: v }),
}))

export const notify = (n: Omit<Notice, 'id'>) => useCampo.getState().notify(n)

/** Registra uma ação; sem sinal, ela entra na fila de envio. */
export function queueIfOffline() {
  if (useDemo.getState().offline) {
    useCampo.getState().setPending((p) => p + 1)
    return true
  }
  return false
}
