import { ArrowUpFromLine, SprayCan, Truck, Wrench, type LucideIcon } from 'lucide-react'
import type { Tone } from '@/components/ui'
import type { AvisoKind, AvisoStatus, JobStatus, JobType, OccKind, RentalStatus } from '@/data/mock'
import { daysFromToday } from '@/data/time'

export const JOB_STATUS: Record<JobStatus, { label: string; tone: Tone }> = {
  concluido: { label: 'Concluído', tone: 'ok' },
  'em-andamento': { label: 'Em andamento', tone: 'brand' },
  'a-caminho': { label: 'A caminho', tone: 'info' },
  agendado: { label: 'Agendado', tone: 'neutral' },
  cancelado: { label: 'Cancelado', tone: 'late' },
}

/** Cor sólida (barras, pontos, cartões da agenda), fundo suave e ícone de cada tipo de serviço */
export const JOB_TYPE: Record<JobType, { color: string; soft: string; text: string; icon: LucideIcon; verb: string }> = {
  Montagem: { color: 'var(--color-s-montagem)', soft: 'bg-blue-soft', text: 'text-blue', icon: Truck, verb: 'Montar' },
  Limpeza: { color: 'var(--color-s-limpeza)', soft: 'bg-teal-soft', text: 'text-teal', icon: SprayCan, verb: 'Limpar' },
  Retirada: { color: 'var(--color-s-retirada)', soft: 'bg-violet-soft', text: 'text-violet', icon: ArrowUpFromLine, verb: 'Retirar' },
  Manutenção: { color: 'var(--color-s-manutencao)', soft: 'bg-yellow-soft', text: 'text-yellow-ink', icon: Wrench, verb: 'Consertar' },
}
export const JOB_TYPES = Object.keys(JOB_TYPE) as JobType[]

export const RENTAL_STATUS: Record<RentalStatus, { label: string; tone: Tone }> = {
  montagem: { label: 'Montagem agendada', tone: 'info' },
  ativa: { label: 'No local', tone: 'ok' },
  retirada: { label: 'Retirada pendente', tone: 'warn' },
  encerrada: { label: 'Encerrada', tone: 'neutral' },
}

export const AVISO_STATUS: Record<AvisoStatus, { label: string; tone: Tone }> = {
  programado: { label: 'Programado', tone: 'neutral' },
  enviado: { label: 'Enviado', tone: 'info' },
  lido: { label: 'Lido', tone: 'violet' },
  confirmado: { label: 'Confirmado', tone: 'ok' },
  'sem-resposta': { label: 'Sem resposta', tone: 'late' },
}

export const AVISO_KIND: Record<AvisoKind, { label: string }> = {
  limpeza: { label: 'Limpeza' },
  montagem: { label: 'Montagem' },
  retirada: { label: 'Retirada' },
  renovacao: { label: 'Renovação' },
  ocorrencia: { label: 'Ocorrência' },
}

export const OCC_KIND: Record<OccKind, { label: string; short: string }> = {
  'sem-papel': { label: 'Sem papel higiênico', short: 'Sem papel' },
  sujo: { label: 'Banheiro sujo', short: 'Sujo' },
  cheio: { label: 'Tanque cheio', short: 'Tanque cheio' },
  porta: { label: 'Porta ou trava com defeito', short: 'Porta' },
  vazamento: { label: 'Vazamento', short: 'Vazamento' },
  avaria: { label: 'Avaria ou vandalismo', short: 'Avaria' },
  outro: { label: 'Outro problema', short: 'Outro' },
}

/** Situação de um vencimento: atrasado / vence em até 7 dias / em dia */
export function dueState(date: string | Date): { label: string; tone: Tone; key: 'late' | 'soon' | 'ok' } {
  const n = daysFromToday(date)
  if (n < 0) return { label: `Venceu há ${-n}d`, tone: 'late', key: 'late' }
  if (n === 0) return { label: 'Vence hoje', tone: 'warn', key: 'soon' }
  if (n <= 7) return { label: `Vence em ${n}d`, tone: 'warn', key: 'soon' }
  return { label: 'Em dia', tone: 'ok', key: 'ok' }
}
