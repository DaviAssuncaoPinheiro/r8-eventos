// Dados derivados das locações: linha da lista e modelo da ficha.
import * as React from 'react'
import { BAIRRO, type ZoneId } from '@/data/geo'
import { CLIENT, NOW, PRODUCT, RENTALS, cleanableQty, zoneOfRental, type Client, type Job, type Occurrence, type Rental } from '@/data/mock'
import { daysFromToday } from '@/data/time'
import { demoPhotosFor, jobReport, onTime } from '@/lib/history'
import { useDemo, useJobs, type ServiceReport } from '@/store'

export const firstWord = (s: string) => s.replace(/^(Eng\.|Pe\.|Pr\.|Mestre|Sr\.|Sra\.)\s+/, '').split(' ')[0]

/** Telefone para link do WhatsApp: (61) 99812-3306 → 5561998123306 */
export const waNumber = (phone: string) => `55${phone.replace(/\D/g, '')}`

export const reportUrl = (rentalId: string) => `${window.location.origin}/relatorio/${rentalId}`

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const t = document.createElement('textarea')
    t.value = text
    t.style.position = 'fixed'
    t.style.opacity = '0'
    document.body.appendChild(t)
    t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  }
}

const isOpen = (j: Job) => j.status === 'agendado' || j.status === 'a-caminho' || j.status === 'em-andamento'

/** Próximo serviço da locação (inclui o que está em andamento agora) */
export function nextJobOf(jobs: Job[]) {
  return jobs
    .filter((j) => isOpen(j) && (j.status !== 'agendado' || +new Date(j.start) >= +NOW - 30 * 60000))
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0]
}

export function lastDoneOf(jobs: Job[], type?: Job['type']) {
  return jobs
    .filter((j) => j.status === 'concluido' && (!type || j.type === type))
    .sort((a, b) => +new Date(b.start) - +new Date(a.start))[0]
}

/** Alerta de prazo: fim do contrato ou retirada chegando */
export function endAlert(r: Rental): { label: string; tone: 'late' | 'warn' } | null {
  if (r.status === 'encerrada') return null
  const n = daysFromToday(r.end)
  if (r.status === 'retirada') return { label: n <= 0 ? 'Retirada hoje' : `Retirada em ${n}d`, tone: 'late' }
  if (r.kind === 'obra' && n <= 7) return { label: n <= 0 ? 'Contrato vence hoje' : `Contrato vence em ${n}d`, tone: 'warn' }
  return null
}

export const STATUS_RANK: Record<Rental['status'], number> = { retirada: 0, montagem: 1, ativa: 2, encerrada: 3 }

export interface RentalRow {
  rental: Rental
  client: Client
  zone: ZoneId
  bairroName: string
  next: Job | undefined
  last: Job | undefined
  openOcc: number
  alert: ReturnType<typeof endAlert>
}

export function useRentalRows(): RentalRow[] {
  const jobs = useJobs()
  const occurrences = useDemo((s) => s.occurrences)
  const over = useDemo((s) => s.rentalStatus)
  return React.useMemo(
    () =>
      RENTALS.map((base) => {
        const r = over[base.id] ? { ...base, status: over[base.id] } : base
        const js = jobs.filter((j) => j.rentalId === r.id)
        return {
          rental: r,
          client: CLIENT[r.clientId],
          zone: zoneOfRental(r),
          bairroName: BAIRRO[r.bairro].name,
          next: nextJobOf(js),
          last: lastDoneOf(js),
          openOcc: occurrences.filter((o) => o.rentalId === r.id && o.status === 'aberta').length,
          alert: endAlert(r),
        }
      }),
    [jobs, occurrences, over],
  )
}

/* ───────────── Ficha ───────────── */

export interface HistoryItem {
  job: Job
  report: ServiceReport | null
  /** registrado agora no app (store) */
  isNew: boolean
}

export interface PhotoItem {
  id: string
  src: string
  label: string
  date: string
  jobId: string
  isNew: boolean
}

export interface Compliance {
  due: number
  done: number
  onTimePct: number
  avgMin: number
  occResolved: number
  occTotal: number
  /** 0 a 100 */
  score: number
}

export interface RentalModel {
  jobs: Job[]
  history: HistoryItem[]
  live: Job | undefined
  next: Job | undefined
  upcoming: Job[]
  lastCleaning: HistoryItem | undefined
  compliance: Compliance
  photos: PhotoItem[]
  occurrences: Occurrence[]
}

export function useRentalModel(rental: Rental | undefined): RentalModel | null {
  const all = useJobs()
  const reports = useDemo((s) => s.reports)
  const storePhotos = useDemo((s) => s.photos)
  const occ = useDemo((s) => s.occurrences)

  return React.useMemo(() => {
    if (!rental) return null
    const jobs = all.filter((j) => j.rentalId === rental.id).sort((a, b) => +new Date(a.start) - +new Date(b.start))
    const history: HistoryItem[] = jobs
      .filter((j) => j.status === 'concluido')
      .map((j) => ({ job: j, report: jobReport(j, reports[j.id]), isNew: !!reports[j.id] }))
      .sort((a, b) => +new Date(b.report?.finishedAt ?? b.job.start) - +new Date(a.report?.finishedAt ?? a.job.start))
    const live = jobs.find((j) => j.status === 'em-andamento' || j.status === 'a-caminho')
    const next = nextJobOf(jobs)
    const upcoming = jobs.filter((j) => j.status === 'agendado' && +new Date(j.start) >= +NOW - 30 * 60000).slice(0, 6)

    // cumprimento nas últimas 4 semanas
    const from = +NOW - 28 * 86400000
    const window = jobs.filter((j) => j.type === 'Limpeza' && +new Date(j.start) >= from && +new Date(j.start) <= +NOW && j.status !== 'cancelado' && j.status !== 'em-andamento' && j.status !== 'a-caminho')
    const doneItems = history.filter((h) => h.job.type === 'Limpeza' && +new Date(h.job.start) >= from)
    const timed = doneItems.filter((h) => h.report && onTime(h.job, h.report)).length
    const durations = doneItems.filter((h) => h.report).map((h) => (+new Date(h.report!.finishedAt) - +new Date(h.report!.startedAt)) / 60000)
    const occs = occ.filter((o) => o.rentalId === rental.id)
    const reportOcc = history.flatMap((h) => h.report?.occurrences ?? [])
    const occTotal = occs.length + reportOcc.length
    const occResolved = occs.filter((o) => o.status === 'resolvida').length + reportOcc.length
    const due = window.length
    const done = window.filter((j) => j.status === 'concluido').length
    const onTimePct = doneItems.length ? Math.round((timed / doneItems.length) * 100) : 100
    const donePct = due ? (done / due) * 100 : 100
    const occPct = occTotal ? (occResolved / occTotal) * 100 : 100
    const score = Math.round(donePct * 0.5 + onTimePct * 0.3 + occPct * 0.2)
    const compliance: Compliance = {
      due,
      done,
      onTimePct,
      avgMin: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      occResolved,
      occTotal,
      score,
    }

    // fotos: as tiradas no app e, dos registros antigos, uma por imagem (a mais recente)
    const seen = new Set<string>()
    const demo: PhotoItem[] = []
    for (const h of history.filter((x) => !x.isNew)) {
      demoPhotosFor(h.job).forEach((p, i) => {
        if (seen.has(p.src)) return
        seen.add(p.src)
        demo.push({ id: `demo-${h.job.id}-${i}`, src: p.src, label: p.label, date: h.report?.finishedAt ?? h.job.start, jobId: h.job.id, isNew: false })
      })
    }
    // obras antigas não têm a montagem no histórico: mostra a instalação dos itens
    const mount = jobs.find((j) => j.type === 'Montagem')
    for (const it of rental.items) {
      const pr = PRODUCT[it.productId]
      if (seen.has(pr.photo) || rental.status === 'montagem') continue
      seen.add(pr.photo)
      demo.push({ id: `demo-inst-${it.productId}`, src: pr.photo, label: `Instalação: ${pr.short}`, date: mount?.start ?? rental.start, jobId: mount?.id ?? '', isNew: false })
    }
    const photos: PhotoItem[] = [
      ...storePhotos
        .filter((p) => p.rentalId === rental.id)
        .map((p) => ({ id: p.id, src: p.src, label: p.label, date: p.date, jobId: p.jobId, isNew: true })),
      ...demo,
    ]

    return {
      jobs,
      history,
      live,
      next,
      upcoming,
      lastCleaning: history.find((h) => h.job.type === 'Limpeza'),
      compliance,
      photos,
      occurrences: occs.sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    }
  }, [rental, all, reports, storePhotos, occ])
}

export const unitsLabel = (r: Rental) => {
  const n = cleanableQty(r)
  return `${n} ${n === 1 ? 'unidade' : 'unidades'}`
}
