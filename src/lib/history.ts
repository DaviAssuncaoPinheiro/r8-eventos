// Checklists por tipo de serviço e histórico de serviços concluídos.
// Serviços concluídos antes da demonstração ganham um registro sintético e estável,
// para a ficha da locação, o relatório do cliente e a página do QR mostrarem os mesmos dados.
import { PRODUCT, RENTAL, TEAM, unitsOf, type Job, type JobType, type OccKind } from '@/data/mock'
import { fmt } from '@/data/time'
import type { ServiceReport } from '@/store'
import { jobItems } from './fieldkit'

export const CHECKLISTS: Record<JobType, string[]> = {
  Limpeza: ['Sucção do tanque', 'Lavagem interna com desinfetante', 'Reposição de produto químico', 'Reposição de papel higiênico', 'Porta e trava funcionando', 'Área ao redor limpa'],
  Montagem: ['Unidades niveladas e travadas', 'Carga inicial de produto químico', 'Papel higiênico abastecido', 'Sinalização masculino, feminino e PNE', 'Estruturas fixadas e conferidas', 'Responsável conferiu a entrega'],
  Retirada: ['Unidades esgotadas antes do transporte', 'Itens conferidos com o contrato', 'Avarias registradas com foto', 'Local entregue limpo'],
  Manutenção: ['Defeito identificado', 'Peça trocada ou ajustada', 'Teste de funcionamento', 'Unidade liberada para uso'],
}

/** Insumos padrão por unidade limpa */
export function suppliesFor(units: number) {
  return [
    { label: 'Papel higiênico', qty: `${units * 2} rolos` },
    { label: 'Produto químico', qty: `${Math.ceil(units * 0.5)} litros` },
    { label: 'Desinfetante', qty: `${Math.max(1, Math.round(units / 6))} galão${Math.round(units / 6) > 1 ? 'ões' : ''}` },
  ]
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const SIGNERS: Record<string, string> = {
  jardins: 'Valdir Souza',
  noroeste: 'Larissa Prado',
  torre36: 'Carla Nogueira',
  smart: 'Raimundo Alves',
  escola: 'Ronaldo Teixeira',
  galpao: 'Ronaldo Teixeira',
  br020: 'Tiago Brandão',
  santamaria: 'Bruno Takahashi',
}

const OCC_SAMPLES: { kind: OccKind; note: string }[] = [
  { kind: 'sem-papel', note: 'Suporte de papel vazio antes da limpeza. Reposto.' },
  { kind: 'avaria', note: 'Mictório trincado. Unidade segue em uso, troca agendada.' },
  { kind: 'sujo', note: 'Uso intenso no fim de semana. Lavagem reforçada.' },
]

/** Fotos ilustrativas para registros antigos (recortes das fotos da R8) */
export function demoPhotosFor(job: Job): { src: string; label: string }[] {
  if (job.type === 'Limpeza') return [{ src: PRODUCT.bq.photo, label: 'Depois da limpeza' }]
  if (job.type === 'Manutenção') return [{ src: PRODUCT.bq.photo, label: 'Unidade liberada' }]
  const seen = new Set<string>()
  const out: { src: string; label: string }[] = []
  for (const it of jobItems(job)) {
    const p = PRODUCT[it.productId]
    if (seen.has(p.photo)) continue
    seen.add(p.photo)
    out.push({ src: p.photo, label: job.type === 'Montagem' ? `${p.short} instalado` : `${p.short} recolhido` })
  }
  return out.slice(0, 3)
}

/** Registro sintético e estável de um serviço concluído antes da demonstração */
export function syntheticReport(job: Job): ServiceReport {
  const r = RENTAL[job.rentalId]
  const h = hash(job.id)
  const start = new Date(job.start)
  const lateMin = h % 5 === 0 ? 20 + (h % 15) : h % 11
  const startedAt = new Date(start.getTime() + lateMin * 60000)
  const finishedAt = new Date(startedAt.getTime() + Math.round(job.durationMin * (0.85 + ((h >>> 4) % 25) / 100)) * 60000)
  const allUnits = unitsOf(r.id).filter((u) => PRODUCT[u.productId].cleanable)
  const units = job.type === 'Limpeza' || job.type === 'Manutenção' ? (job.type === 'Manutenção' ? allUnits.slice(h % Math.max(1, allUnits.length), (h % Math.max(1, allUnits.length)) + 1) : allUnits) : []
  const occ = job.type === 'Limpeza' && h % 6 === 0 && units.length ? [{ ...OCC_SAMPLES[h % OCC_SAMPLES.length], unitId: units[(h >>> 3) % units.length].id }] : []
  const checklist = CHECKLISTS[job.type].map((label) => ({ label, ok: true }))
  const items = job.type === 'Montagem' || job.type === 'Retirada' ? jobItems(job).map((i) => ({ label: PRODUCT[i.productId].short, planned: i.qty, done: i.qty })) : undefined
  const team = TEAM[job.teamId]
  const n = job.type === 'Limpeza' ? units.length || job.units : job.units
  const summary =
    job.type === 'Limpeza'
      ? `${n} ${n === 1 ? 'unidade higienizada' : 'unidades higienizadas'} e abastecidas pela ${team.name}.${occ.length ? ' 1 ocorrência registrada.' : ''}`
      : job.type === 'Montagem'
        ? `Montagem concluída: ${items?.map((i) => `${i.done} ${i.label.toLowerCase()}`).join(', ')}.`
        : job.type === 'Retirada'
          ? `Retirada concluída: ${items?.map((i) => `${i.done} ${i.label.toLowerCase()}`).join(', ')}.`
          : `Manutenção feita: ${job.note.toLowerCase()}.`
  return {
    jobId: job.id,
    rentalId: r.id,
    teamId: job.teamId,
    type: job.type,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    units: units.map((u) => ({ id: u.id, ok: !occ.some((o) => o.unitId === u.id && o.kind === 'avaria') })),
    items,
    checklist,
    supplies: job.type === 'Limpeza' ? suppliesFor(n) : undefined,
    photoIds: [],
    occurrences: occ,
    signedBy: SIGNERS[r.id] ?? r.contact.name.replace(/^(Eng\.|Pe\.|Pr\.)\s+/, ''),
    signedRole: SIGNERS[r.id] === 'Valdir Souza' ? 'Mestre de obras' : r.contact.role,
    summary,
  }
}

/** Registro do serviço: o salvo pelo app da equipe ou, se concluído antes, o sintético */
export function jobReport(job: Job, stored?: ServiceReport): ServiceReport | null {
  if (stored) return stored
  if (job.status !== 'concluido') return null
  return syntheticReport(job)
}

/** O serviço começou no horário? (tolerância de 15 min) */
export function onTime(job: Job, rep: ServiceReport) {
  return new Date(rep.startedAt).getTime() - new Date(job.start).getTime() <= 15 * 60000
}

/** "sex, 06/11 às 10:12" */
export const stamp = (d: string | Date) => `${fmt.weekdayShort(d)}, ${fmt.date(d).slice(0, 5)} às ${fmt.time(d)}`
