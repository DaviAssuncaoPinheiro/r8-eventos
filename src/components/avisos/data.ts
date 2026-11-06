import { BAIRRO, ZONE, type ZoneId } from '@/data/geo'
import { AVISOS, CLIENT, COMPANY, JOBS, RENTAL, TEAM, TEMPLATES, cleanableQty, zoneOfRental, type Aviso, type AvisoKind, type Client, type Job, type Occurrence, type Rental } from '@/data/mock'
import { daysFromToday, fmt } from '@/data/time'
import { OCC_KIND, dueState } from '@/lib/status'
import { fill } from '@/lib/utils'

const SEED_IDS = new Set(AVISOS.map((a) => a.id))

export type GroupKey = 'sem-resposta' | 'enviar' | 'enviados' | 'confirmados'

export const GROUPS: { key: GroupKey; title: string }[] = [
  { key: 'sem-resposta', title: 'Sem resposta' },
  { key: 'enviar', title: 'Para enviar' },
  { key: 'enviados', title: 'Enviados' },
  { key: 'confirmados', title: 'Confirmados' },
]

export const GROUP_DOT: Record<GroupKey, string> = { 'sem-resposta': 'bg-red', enviar: 'bg-ink-4', enviados: 'bg-blue', confirmados: 'bg-green' }

export interface Item {
  a: Aviso
  rental: Rental
  client: Client
  zone: ZoneId
  due: ReturnType<typeof dueState>
  group: GroupKey
  isNew: boolean
  /** serviço ligado ao aviso (limpeza do dia, montagem, retirada) */
  job?: Job
}

export function groupOf(a: Aviso): GroupKey {
  if (a.status === 'confirmado') return 'confirmados'
  if (a.status === 'sem-resposta') return 'sem-resposta'
  if (a.status === 'programado') return 'enviar'
  return 'enviados'
}

const JOB_KIND: Partial<Record<AvisoKind, Job['type']>> = { limpeza: 'Limpeza', montagem: 'Montagem', retirada: 'Retirada', ocorrencia: 'Manutenção' }

/** Serviço da locação mais próximo do vencimento do aviso, do tipo certo */
export function jobOf(a: Aviso): Job | undefined {
  const type = JOB_KIND[a.kind]
  if (!type) return undefined
  const due = daysFromToday(a.dueDate)
  const list = JOBS.filter((j) => j.rentalId === a.rentalId && j.type === type)
  return list.sort((x, y) => Math.abs(daysFromToday(x.start) - due) - Math.abs(daysFromToday(y.start) - due))[0]
}

export function enrich(list: Aviso[]): Item[] {
  return list
    .filter((a) => RENTAL[a.rentalId])
    .map((a) => {
      const rental = RENTAL[a.rentalId]
      return {
        a,
        rental,
        client: CLIENT[rental.clientId],
        zone: zoneOfRental(rental),
        due: dueState(a.dueDate),
        group: groupOf(a),
        isNew: !SEED_IDS.has(a.id),
        job: jobOf(a),
      }
    })
    .sort((x, y) => Number(y.isNew) - Number(x.isNew) || +new Date(x.a.dueDate) - +new Date(y.a.dueDate))
}

export const dm = (d: Date | string) => {
  const x = new Date(d)
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`
}

/** "Eng. Paulo Mendes" → "Paulo" */
export const contactFirst = (name: string) => name.replace(/^(Eng\.|Pe\.|Pr\.|Dra?\.|Sr\.|Sra\.|Mestre|Seu|Dona)\s+/i, '').split(' ')[0]

export const reportLink = (rentalId: string) => `${window.location.origin}${window.location.pathname}#/relatorio/${rentalId}`

export const VARIABLES = ['contato', 'empresa', 'local', 'data', 'hora', 'unidades', 'link', 'equipe', 'caminhao', 'unidade', 'problema'] as const

export function varsOf(it: Item, occurrences: Occurrence[] = []): Record<string, string> {
  const r = it.rental
  const j = it.job
  const team = TEAM[j?.teamId ?? r.teamId]
  const n = it.a.kind === 'limpeza' ? cleanableQty(r) : j?.units ?? cleanableQty(r)
  const end = j ? new Date(new Date(j.start).getTime() + j.durationMin * 60000) : null
  const hora = j ? fmt.time(it.a.kind === 'limpeza' ? end! : j.start) : '08:00'
  const occ = occurrences.find((o) => o.rentalId === r.id && o.status === 'aberta') ?? occurrences.find((o) => o.rentalId === r.id)
  const date = new Date(it.a.dueDate)
  return {
    contato: contactFirst(r.contact.name),
    empresa: COMPANY.name,
    local: r.title,
    data: `${dm(date)} (${fmt.weekday(date)})`,
    hora,
    unidades: `${n} ${n === 1 ? 'banheiro' : 'banheiros'}`,
    link: reportLink(r.id),
    equipe: team.short,
    caminhao: `${team.truck}, placa ${team.plate}`,
    unidade: occ?.unitId ?? 'BQ',
    problema: occ ? OCC_KIND[occ.kind].label.toLowerCase() : 'problema informado',
  }
}

export const baseTemplate = (it: Item): string => TEMPLATES[it.a.kind]

export const buildMessage = (it: Item, occurrences: Occurrence[], tpl?: string) => fill(tpl ?? baseTemplate(it), varsOf(it, occurrences))

/** Respostas rápidas que o cliente vê embaixo da mensagem */
export const QUICK: Record<AvisoKind, string[]> = {
  limpeza: ['Ver relatório'],
  montagem: ['Confirmar', 'Mudar horário'],
  retirada: ['Pode retirar', 'Quero renovar'],
  renovacao: ['Renovar', 'Encerrar contrato'],
  ocorrencia: ['Obrigado'],
}

export const zoneName = (z: ZoneId) => ZONE[z].short
export const zoneHex = (z: ZoneId) => ZONE[z].hex
export const placeOf = (r: Rental) => BAIRRO[r.bairro].name
export type { AvisoKind }
