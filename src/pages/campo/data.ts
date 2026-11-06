// Ajudantes do app da equipe: serviço, locação, relógio simulado e textos curtos.
import { BAIRRO, ZONE } from '@/data/geo'
import { CLIENT, NOW, PRODUCT, RENTAL, TEAM, unitsOf, type Job, type Rental } from '@/data/mock'
import { day, daysFromToday, fmt } from '@/data/time'
import { jobReport } from '@/lib/history'
import { useDemo, useJobs, type ServiceReport } from '@/store'

/* Relógio simulado: começa às 10:40 de hoje e anda com o tempo real */
const LOADED_AT = Date.now()
export const simNow = () => new Date(+NOW + (Date.now() - LOADED_AT))
export const minutesSince = (iso: string, now?: Date) => Math.max(0, Math.round((+(now ?? simNow()) - +new Date(iso)) / 60000))

export const isToday = (d: string) => daysFromToday(d) === 0

/** Serviço com o status atual (base + criados na demonstração) */
export function useJob(id: string): Job | undefined {
  const jobs = useJobs()
  return jobs.find((j) => j.id === id)
}

export const rentalOf = (j: Job) => RENTAL[j.rentalId]
export const clientOf = (j: Job) => CLIENT[RENTAL[j.rentalId].clientId]
export const teamOf = (j: Job) => TEAM[j.teamId]
export const bairroOf = (r: Rental) => BAIRRO[r.bairro]
export const zoneOf = (r: Rental) => ZONE[BAIRRO[r.bairro].zone]

/** "Eng. Paulo Mendes" → "Paulo Mendes"; "Mestre Raimundo" → "Raimundo" */
export const plainName = (s: string) => s.replace(/^(Eng\.|Pe\.|Pr\.|Sr\.|Sra\.|Dr\.|Dra\.|Mestre)\s+/, '')
export const contactFirst = (r: Rental) => plainName(r.contact.name).split(' ')[0]
export const phoneDigits = (p: string) => '55' + p.replace(/\D/g, '')

/** Foto do primeiro produto da locação (capa do serviço) */
export const coverPhoto = (j: Job) => PRODUCT[(j.products?.[0] ?? RENTAL[j.rentalId].items[0].productId)].photo

/** Unidades com patrimônio que recebem limpeza */
export const cleanUnits = (r: Rental) => unitsOf(r.id).filter((u) => PRODUCT[u.productId].cleanable)

/** "04 de dez" */
export function dateShort(d: Date | string) {
  const x = new Date(d)
  const base = fmt.short(x)
  return x.getFullYear() !== day(0).getFullYear() ? `${base} de ${x.getFullYear()}` : base
}
export const ddmm = (d: Date | string) => fmt.date(d).slice(0, 5)
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Limpeza concluída", "Montagem concluída", "Manutenção concluída" */
export const doneTitle = (j: Job) => `${j.type} concluída`

/** Rótulo da primeira etapa por tipo */
export const firstStepLabel = (j: Job) => (j.type === 'Montagem' || j.type === 'Retirada' ? 'Conferência' : 'Unidades')

/** Último serviço de limpeza concluído da locação antes deste */
export function useLastCleaning(job: Job): { job: Job; report: ServiceReport } | null {
  const jobs = useJobs()
  const reports = useDemo((s) => s.reports)
  const prev = jobs
    .filter((j) => j.rentalId === job.rentalId && j.id !== job.id && j.type === 'Limpeza' && j.status === 'concluido' && +new Date(j.start) < +simNow())
    .sort((a, b) => +new Date(b.start) - +new Date(a.start))[0]
  if (!prev) return null
  const report = jobReport(prev, reports[prev.id])
  return report ? { job: prev, report } : null
}

/** Histórico recente da locação (serviços concluídos) */
export function useRentalHistory(job: Job, limit = 4) {
  const jobs = useJobs()
  const reports = useDemo((s) => s.reports)
  return jobs
    .filter((j) => j.rentalId === job.rentalId && j.id !== job.id && j.status === 'concluido')
    .sort((a, b) => +new Date(b.start) - +new Date(a.start))
    .slice(0, limit)
    .map((j) => ({ job: j, report: jobReport(j, reports[j.id])! }))
}

/** Próximo serviço da equipe hoje, depois deste */
export function useNextJob(job: Job) {
  const jobs = useJobs()
  return jobs
    .filter((j) => j.teamId === job.teamId && j.id !== job.id && isToday(j.start) && j.status !== 'concluido' && j.status !== 'cancelado')
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .find((j) => +new Date(j.start) >= +new Date(job.start)) ?? null
}

/** O que a equipe faz neste serviço (lista do cartão de chegada) */
export function jobTodo(job: Job, openOcc: { unitId: string; label: string }[]): string[] {
  const r = RENTAL[job.rentalId]
  const out: string[] = []
  if (job.type === 'Limpeza') {
    out.push(`Sucção e lavagem de ${job.units} ${job.units === 1 ? 'unidade' : 'unidades'}`)
    out.push('Repor papel e produto químico')
    if (/pne/i.test(job.note)) out.push('Conferir a PNE')
  } else if (job.type === 'Montagem' || job.type === 'Retirada') {
    const items = job.products ? r.items.filter((i) => job.products!.includes(i.productId)) : r.items
    for (const i of items) out.push(`${job.type === 'Montagem' ? 'Montar' : 'Recolher'} ${i.qty} ${i.qty === 1 ? PRODUCT[i.productId].unit[0] : PRODUCT[i.productId].unit[1]}`)
    out.push(job.type === 'Montagem' ? 'Responsável confere e assina' : 'Registrar avarias com foto')
  } else {
    out.push(job.note)
    out.push('Testar antes de liberar')
  }
  for (const o of openOcc) out.push(`Resolver ${o.unitId}: ${o.label.toLowerCase()}`)
  return out
}
