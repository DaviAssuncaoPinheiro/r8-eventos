import { Hammer, Sparkles, Truck, Undo2, Wrench, type LucideIcon } from 'lucide-react'
import type { ChargeKind, ChargeStatus, DamageStatus, RentalStatus, ServiceStatus, ServiceType, UnitStatus } from '@/domain/types'
import type { StatusTone } from '@/ui'
import { useLabels } from '@/services'

/*
  Rótulo e cor de cada situação, em um lugar só. Toda tela usa estes mapas com <StatusDot> ou <Badge>,
  para "Atrasada" ter sempre a mesma cor e o mesmo nome no sistema inteiro.
*/

export const RENTAL_STATUS: Record<RentalStatus, { label: string; tone: StatusTone }> = {
  orcamento: { label: 'Orçamento', tone: 'neutral' },
  confirmada: { label: 'Confirmada', tone: 'info' },
  em_campo: { label: 'Em campo', tone: 'accent' },
  retirada: { label: 'Retirada', tone: 'warn' },
  faturada: { label: 'Faturada', tone: 'ok' },
  cancelada: { label: 'Cancelada', tone: 'idle' },
}
/** Ordem do fluxo, para a trilha de etapas. */
export const RENTAL_FLOW: RentalStatus[] = ['orcamento', 'confirmada', 'em_campo', 'retirada', 'faturada']

export const SERVICE_STATUS: Record<ServiceStatus, { label: string; tone: StatusTone }> = {
  agendado: { label: 'Agendado', tone: 'neutral' },
  a_caminho: { label: 'A caminho', tone: 'info' },
  em_andamento: { label: 'Em andamento', tone: 'accent' },
  concluido: { label: 'Concluído', tone: 'ok' },
  atrasado: { label: 'Atrasado', tone: 'danger' },
  cancelado: { label: 'Cancelado', tone: 'idle' },
}

/** Ícone de cada tipo de serviço. O nome vem do pacote de segmento (`useLabels().serviceTypes`). */
export const SERVICE_ICON: Record<ServiceType, LucideIcon> = {
  entrega: Truck,
  limpeza: Sparkles,
  retirada: Undo2,
  manutencao: Wrench,
  montagem: Hammer,
}

export const UNIT_STATUS: Record<UnitStatus, { label: string; tone: StatusTone }> = {
  disponivel: { label: 'Parado', tone: 'idle' },
  em_campo: { label: 'Em campo', tone: 'accent' },
  limpeza: { label: 'Em limpeza', tone: 'info' },
  manutencao: { label: 'Manutenção', tone: 'warn' },
}

/** UNIT_STATUS com o nome da limpeza do pacote de segmento ativo ("Em higienização", "Em revisão"...). */
export function useUnitStatus(): Record<UnitStatus, { label: string; tone: StatusTone }> {
  const cleaning = useLabels().cleaning
  return { ...UNIT_STATUS, limpeza: { ...UNIT_STATUS.limpeza, label: `Em ${cleaning}` } }
}

export const CHARGE_STATUS: Record<ChargeStatus, { label: string; tone: StatusTone }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  aberta: { label: 'Aberta', tone: 'info' },
  paga: { label: 'Paga', tone: 'ok' },
  atrasada: { label: 'Atrasada', tone: 'danger' },
  cancelada: { label: 'Cancelada', tone: 'idle' },
}

export const CHARGE_KIND: Record<ChargeKind, string> = {
  mensalidade: 'Mensalidade',
  locacao: 'Locação',
  avaria: 'Avaria',
  extra: 'Serviço extra',
}

export const DAMAGE_STATUS: Record<DamageStatus, { label: string; tone: StatusTone }> = {
  registrada: { label: 'Sem cobrança', tone: 'danger' },
  cobrada: { label: 'Cobrada', tone: 'info' },
  paga: { label: 'Paga', tone: 'ok' },
  dispensada: { label: 'Dispensada', tone: 'idle' },
}

/** Mapa de tom para classes de fundo suave + tinta (círculos de ícone, avatares). */
export const TONE_SOFT: Record<StatusTone, string> = {
  neutral: 'bg-sunken text-fg-2',
  accent: 'bg-accent-soft text-accent-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-info-soft text-info-ink',
  idle: 'bg-sunken text-fg-2',
}
