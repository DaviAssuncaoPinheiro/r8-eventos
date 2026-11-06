import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AVISOS, JOBS, OCCURRENCES, RENTAL, type Aviso, type AvisoStatus, type Job, type JobStatus, type JobType, type Occurrence, type OccKind, type OccStatus, type Rental, type RentalStatus, type UnitState } from './data/mock'
import { TODAY } from './data/time'

/** Foto tirada pela equipe no app (antes, depois, instalação, avaria) */
export interface JobPhoto {
  id: string
  jobId: string
  rentalId: string
  unitId?: string
  date: string
  /** data URL (comprimida) ou URL pública */
  src: string
  label: string
  moment: 'antes' | 'depois' | 'instalacao' | 'avaria'
}

/** Registro de um serviço concluído no app da equipe. Alimenta o relatório do cliente. */
export interface ServiceReport {
  jobId: string
  rentalId: string
  teamId: string
  type: JobType
  startedAt: string
  finishedAt: string
  /** unidades atendidas (patrimônio) */
  units: { id: string; ok: boolean; note?: string }[]
  /** itens conferidos em montagem e retirada */
  items?: { label: string; planned: number; done: number }[]
  checklist: { label: string; ok: boolean }[]
  /** insumos usados na limpeza */
  supplies?: { label: string; qty: string }[]
  photoIds: string[]
  occurrences: { unitId?: string; kind: OccKind; note: string }[]
  signedBy?: string
  signedRole?: string
  /** assinatura desenhada no celular (data URL) */
  signature?: string
  summary: string
  savedOffline?: boolean
}

interface DemoState {
  jobStatus: Record<string, JobStatus>
  /** serviços criados na demonstração (agenda) */
  extraJobs: Job[]
  avisos: Aviso[]
  occurrences: Occurrence[]
  unitState: Record<string, UnitState>
  routeOptimized: boolean
  offline: boolean
  photos: JobPhoto[]
  reports: Record<string, ServiceReport>
  /** carga do caminhão marcada: "teamId:itemId" */
  loadChecked: Record<string, boolean>
  /** situação da locação alterada por serviços concluídos na demonstração */
  rentalStatus: Record<string, RentalStatus>
  /** cartões de "Precisa de atenção" já resolvidos */
  resolved: Record<string, boolean>
  /** sugestão de escala da tela Regiões aplicada */
  scaleApplied: boolean
  setJobStatus: (id: string, s: JobStatus) => void
  addJob: (j: Job) => void
  setAvisoStatus: (id: string, s: AvisoStatus) => void
  addAvisos: (a: Aviso[]) => void
  addOccurrence: (o: Occurrence) => void
  setOccurrenceStatus: (id: string, s: OccStatus) => void
  setUnitState: (id: string, s: UnitState) => void
  setRouteOptimized: (v: boolean) => void
  setOffline: (v: boolean) => void
  addPhoto: (p: JobPhoto) => void
  removePhoto: (id: string) => void
  saveReport: (r: ServiceReport) => void
  toggleLoad: (key: string) => void
  setRentalStatus: (id: string, s: RentalStatus) => void
  resolve: (id: string) => void
  setScaleApplied: (v: boolean) => void
  reset: () => void
}

const initial = () => ({
  jobStatus: Object.fromEntries(JOBS.map((j) => [j.id, j.status])) as Record<string, JobStatus>,
  extraJobs: [] as Job[],
  avisos: AVISOS,
  occurrences: OCCURRENCES,
  unitState: {} as Record<string, UnitState>,
  routeOptimized: false,
  offline: false,
  photos: [] as JobPhoto[],
  reports: {} as Record<string, ServiceReport>,
  loadChecked: {} as Record<string, boolean>,
  rentalStatus: {} as Record<string, RentalStatus>,
  resolved: {} as Record<string, boolean>,
  scaleApplied: false,
})

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      ...initial(),
      setJobStatus: (id, s) => set((st) => ({ jobStatus: { ...st.jobStatus, [id]: s } })),
      addJob: (j) => set((st) => ({ extraJobs: [...st.extraJobs, j], jobStatus: { ...st.jobStatus, [j.id]: j.status } })),
      setAvisoStatus: (id, s) => set((st) => ({ avisos: st.avisos.map((a) => (a.id === id ? { ...a, status: s } : a)) })),
      addAvisos: (a) => set((st) => ({ avisos: [...a, ...st.avisos] })),
      addOccurrence: (o) => set((st) => ({ occurrences: [o, ...st.occurrences] })),
      setOccurrenceStatus: (id, s) => set((st) => ({ occurrences: st.occurrences.map((o) => (o.id === id ? { ...o, status: s } : o)) })),
      setUnitState: (id, s) => set((st) => ({ unitState: { ...st.unitState, [id]: s } })),
      setRouteOptimized: (v) => set({ routeOptimized: v }),
      setOffline: (v) => set({ offline: v }),
      addPhoto: (p) => set((st) => ({ photos: [p, ...st.photos] })),
      removePhoto: (id) => set((st) => ({ photos: st.photos.filter((x) => x.id !== id) })),
      saveReport: (r) => set((st) => ({ reports: { ...st.reports, [r.jobId]: r } })),
      toggleLoad: (key) => set((st) => ({ loadChecked: { ...st.loadChecked, [key]: !st.loadChecked[key] } })),
      setRentalStatus: (id, s) => set((st) => ({ rentalStatus: { ...st.rentalStatus, [id]: s } })),
      resolve: (id) => set((st) => ({ resolved: { ...st.resolved, [id]: true } })),
      setScaleApplied: (v) => set({ scaleApplied: v }),
      reset: () => {
        set(initial())
        for (const fn of resetListeners) fn()
      },
    }),
    // a demonstração recomeça a cada dia: as datas dos dados são relativas a hoje
    { name: `r8-eventos-demo-${TODAY.getFullYear()}-${TODAY.getMonth() + 1}-${TODAY.getDate()}` },
  ),
)

/** Outros estados (ex.: app da equipe) que também devem voltar ao início no "Reiniciar demonstração" */
const resetListeners = new Set<() => void>()
export const onDemoReset = (fn: () => void) => {
  resetListeners.add(fn)
  return () => resetListeners.delete(fn)
}

/** Locação com a situação atual (montagem concluída vira "No local", retirada concluída vira "Encerrada") */
export function useRentalStatus() {
  const over = useDemo((s) => s.rentalStatus)
  return (r: Rental): RentalStatus => over[r.id] ?? r.status
}
export const rentalStatusNow = (id: string): RentalStatus => useDemo.getState().rentalStatus[id] ?? RENTAL[id].status

/** Todos os serviços (base + criados na demonstração) com o status atual */
export function useJobs(): Job[] {
  const jobStatus = useDemo((s) => s.jobStatus)
  const extra = useDemo((s) => s.extraJobs)
  return useMemo(() => [...JOBS, ...extra].map((j) => ({ ...j, status: jobStatus[j.id] ?? j.status })), [jobStatus, extra])
}
