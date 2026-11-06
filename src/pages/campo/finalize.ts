// Grava o serviço concluído no store global: relatório, status, ocorrências e aviso ao cliente.
import { PRODUCT, RENTAL, TEAM, TEMPLATES, COMPANY, type AvisoKind, type Job } from '@/data/mock'
import { fmt } from '@/data/time'
import { CHECKLISTS } from '@/lib/history'
import { jobItems } from '@/lib/fieldkit'
import { newId } from '@/lib/photos'
import { fill } from '@/lib/utils'
import { useDemo, type ServiceReport } from '@/store'
import { queueIfOffline, useCampo, type Draft } from './campoStore'
import { cleanUnits, contactFirst, simNow } from './data'

const AVISO_OF: Record<Job['type'], AvisoKind> = { Limpeza: 'limpeza', Montagem: 'montagem', Retirada: 'retirada', Manutenção: 'ocorrencia' }

/** Link público do relatório do cliente */
export function reportLink(rentalId: string, jobId?: string) {
  const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''
  return `${base}#/relatorio/${rentalId}${jobId ? `?s=${jobId}` : ''}`
}

/** "8 banheiros", "1 unidade" */
function unitsTxt(n: number) {
  return `${n} ${n === 1 ? 'unidade' : 'unidades'}`
}

export function buildSummary(job: Job, d: Draft, unitsDone: number) {
  const team = TEAM[job.teamId]
  const occ = d.occurrences.length
  const resolved = Object.values(d.resolved).filter(Boolean).length
  const extra = [occ ? `${occ} ${occ === 1 ? 'ocorrência registrada' : 'ocorrências registradas'}` : '', resolved ? `${resolved} ${resolved === 1 ? 'aviso resolvido' : 'avisos resolvidos'}` : ''].filter(Boolean)
  const tail = extra.length ? ` ${extra.join(', ').replace(/^./, (c) => c.toUpperCase())}.` : ''
  if (job.type === 'Limpeza') return `${unitsTxt(unitsDone)} ${unitsDone === 1 ? 'higienizada' : 'higienizadas'} e abastecidas pela ${team.name}.${tail}${d.notes ? ` ${d.notes.trim()}` : ''}`
  if (job.type === 'Manutenção') return `Manutenção feita: ${job.note.toLowerCase()}.${tail}${d.notes ? ` ${d.notes.trim()}` : ''}`
  const items = jobItems(job)
    .map((i) => `${(d.items[i.productId] ?? 0).toLocaleString('pt-BR')} ${PRODUCT[i.productId].short.toLowerCase()}`)
    .join(', ')
  return `${job.type} concluída: ${items}.${tail}${d.notes ? ` ${d.notes.trim()}` : ''}`
}

/** Mensagem de WhatsApp que o cliente recebe */
export function clientMessage(job: Job, rep: ServiceReport) {
  const r = RENTAL[job.rentalId]
  const link = reportLink(r.id, job.id)
  if (job.type === 'Limpeza')
    return fill(TEMPLATES.limpeza, {
      contato: contactFirst(r),
      empresa: COMPANY.name,
      local: r.title,
      hora: fmt.time(rep.finishedAt),
      unidades: `${rep.units.filter((u) => u.ok).length} banheiros`,
      link,
    })
  const what = job.type === 'Manutenção' ? 'A manutenção' : `A ${job.type.toLowerCase()}`
  return `Olá, ${contactFirst(r)}! Aqui é a ${COMPANY.name}.\n${what} em *${r.title}* foi concluída às ${fmt.time(rep.finishedAt)}.\nRelatório com fotos e assinatura: ${link}`
}

export function commitJob(job: Job, d: Draft): ServiceReport {
  const demo = useDemo.getState()
  const r = RENTAL[job.rentalId]
  const now = simNow()
  const started = useCampo.getState().startedAt[job.id] ?? job.start
  const units = cleanUnits(r)
  const maint = job.type === 'Manutenção'
  const unitRows =
    job.type === 'Limpeza'
      ? units.map((u) => ({ id: u.id, ok: !!d.units[u.id], note: d.units[u.id] ? undefined : 'Não atendida' }))
      : maint
        ? units.filter((u) => d.units[u.id]).map((u) => ({ id: u.id, ok: true }))
        : []
  const unitsDone = unitRows.filter((u) => u.ok).length
  const savedOffline = queueIfOffline()

  const report: ServiceReport = {
    jobId: job.id,
    rentalId: r.id,
    teamId: job.teamId,
    type: job.type,
    startedAt: new Date(started).toISOString(),
    finishedAt: now.toISOString(),
    units: unitRows,
    items: job.type === 'Montagem' || job.type === 'Retirada' ? jobItems(job).map((i) => ({ label: PRODUCT[i.productId].short, planned: i.qty, done: d.items[i.productId] ?? 0 })) : undefined,
    checklist: CHECKLISTS[job.type].map((label) => ({ label, ok: !!d.checklist[label] })),
    supplies: d.supplies.length ? d.supplies.map((s) => ({ label: s.label, qty: `${s.qty} ${s.qty === 1 ? s.unit[0] : s.unit[1]}` })) : undefined,
    photoIds: demo.photos.filter((p) => p.jobId === job.id).map((p) => p.id),
    occurrences: d.occurrences.map((o) => ({ unitId: o.unitId, kind: o.kind, note: o.note })),
    signedBy: d.signer.trim() || undefined,
    signedRole: d.role.trim() || undefined,
    signature: d.signature,
    summary: buildSummary(job, d, job.type === 'Limpeza' ? unitsDone : job.units),
    savedOffline,
  }

  demo.saveReport(report)
  demo.setJobStatus(job.id, 'concluido')

  // ocorrências novas (só as ligadas a uma unidade com patrimônio)
  for (const o of d.occurrences) {
    if (!o.unitId) continue
    demo.addOccurrence({ id: newId('occ'), unitId: o.unitId, rentalId: r.id, kind: o.kind, note: o.note, at: now.toISOString(), source: 'equipe', status: 'aberta', reporter: TEAM[job.teamId].name })
  }
  // avisos abertos resolvidos neste serviço
  for (const [id, on] of Object.entries(d.resolved)) if (on) demo.setOccurrenceStatus(id, 'resolvida')

  // aviso ao cliente: usa o programado do dia ou cria um novo
  const kind = AVISO_OF[job.type]
  const existing = demo.avisos.find((a) => a.rentalId === r.id && a.kind === kind && (a.status === 'programado' || a.status === 'sem-resposta') && Math.abs(+new Date(a.dueDate) - +now) < 2 * 86400000)
  if (existing) demo.setAvisoStatus(existing.id, savedOffline ? 'programado' : 'enviado')
  else
    demo.addAvisos([
      {
        id: newId('av'),
        rentalId: r.id,
        kind,
        title: `Relatório da ${job.type.toLowerCase()} de hoje`,
        dueDate: now.toISOString(),
        sendDate: now.toISOString(),
        status: savedOffline ? 'programado' : 'enviado',
        origin: 'Enviado ao concluir o serviço',
      },
    ])

  return report
}
