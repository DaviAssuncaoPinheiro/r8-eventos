/*
  Catálogo das automações: gatilhos, ações e as 9 automações de fábrica.
  Mora no domínio para a semente e os serviços usarem o mesmo texto. O serviço (src/services/automacoes.ts) reexporta.
*/
import type { AutomationChannel, AutomationRecord } from './types'

export interface CatalogItem {
  kind: string
  label: string
  /** nome sugerido de ícone do lucide-react */
  icon: string
}

export const AUTOMATION_TRIGGERS: CatalogItem[] = [
  { kind: 'avaria_registrada', label: 'Avaria registrada', icon: 'TriangleAlert' },
  { kind: 'extra_concluido', label: 'Serviço extra concluído', icon: 'Wrench' },
  { kind: 'cobranca_vencida', label: 'Cobrança vencida', icon: 'CalendarClock' },
  { kind: 'cobranca_a_vencer', label: 'Cobrança vence em 3 dias', icon: 'Clock' },
  { kind: 'pagamento_recebido', label: 'Pagamento recebido', icon: 'BadgeCheck' },
  { kind: 'locacao_confirmada', label: 'Locação confirmada', icon: 'FileCheck' },
  { kind: 'orcamento_sem_resposta', label: 'Orçamento sem resposta há 3 dias', icon: 'MailQuestion' },
  { kind: 'contrato_vence', label: 'Contrato vence em 15 dias', icon: 'FileClock' },
  { kind: 'unidade_parada', label: 'Unidade parada há 30 dias', icon: 'Archive' },
  { kind: 'equipe_atrasada', label: 'Equipe atrasada mais de 20 min', icon: 'Truck' },
  { kind: 'servico_concluido', label: 'Serviço concluído', icon: 'CircleCheck' },
  { kind: 'fim_do_mes', label: 'Fim do mês', icon: 'CalendarCheck' },
  { kind: 'equipamento_locacoes', label: 'Equipamento com 20 locações', icon: 'Gauge' },
]

export const AUTOMATION_ACTIONS: CatalogItem[] = [
  { kind: 'cobrar_avaria', label: 'Gerar a cobrança e enviar por e-mail', icon: 'ReceiptText' },
  { kind: 'incluir_na_fatura', label: 'Faturar o extra e enviar ao cliente', icon: 'FilePlus' },
  { kind: 'enviar_lembrete', label: 'Lembrete conforme a régua de cobrança', icon: 'BellRing' },
  { kind: 'agendar_servicos', label: 'Agendar entrega, limpezas e retirada', icon: 'CalendarPlus' },
  { kind: 'propor_renovacao', label: 'Propor renovação pelo portal', icon: 'RefreshCw' },
  { kind: 'marcar_oportunidade', label: 'Marcar como oportunidade e sugerir preço promocional', icon: 'Tag' },
  { kind: 'redistribuir_rota', label: 'Redistribuir a rota e avisar a equipe no app', icon: 'Route' },
  { kind: 'publicar_relatorio', label: 'Gerar e publicar o relatório no portal', icon: 'FileChartColumn' },
  { kind: 'abrir_manutencao', label: 'Abrir manutenção preventiva', icon: 'Wrench' },
  { kind: 'avisar_cliente', label: 'Avisar o cliente por e-mail', icon: 'Mail' },
  { kind: 'avisar_equipe', label: 'Avisar a equipe no app', icon: 'Smartphone' },
  { kind: 'agradecer', label: 'Enviar agradecimento ao cliente', icon: 'Heart' },
]

export const AUTOMATION_CHANNELS: { value: AutomationChannel; label: string }[] = [
  { value: 'email', label: 'E-mail' },
  { value: 'portal', label: 'Portal do cliente' },
  { value: 'app', label: 'App da equipe de rua' },
  { value: 'sistema', label: 'Dentro do sistema' },
]

/** Minutos de trabalho manual que cada execução poupa, por ação (premissa da demonstração) */
export const MINUTES_SAVED: Record<string, number> = {
  cobrar_avaria: 14,
  incluir_na_fatura: 9,
  enviar_lembrete: 4,
  agendar_servicos: 22,
  propor_renovacao: 25,
  marcar_oportunidade: 6,
  redistribuir_rota: 18,
  publicar_relatorio: 8,
  abrir_manutencao: 15,
  avisar_cliente: 3,
  avisar_equipe: 2,
  agradecer: 3,
}

export const minutesSavedFor = (actionKind: string): number => MINUTES_SAVED[actionKind] ?? 5

export const triggerLabel = (kind: string): string => AUTOMATION_TRIGGERS.find((t) => t.kind === kind)?.label ?? kind
export const actionLabel = (kind: string): string => AUTOMATION_ACTIONS.find((a) => a.kind === kind)?.label ?? kind

/** Ids fixos das de fábrica (a semente, os executores e os testes usam estes) */
export const AUTO = {
  avaria: 'aut-avaria',
  extra: 'aut-extra',
  atraso: 'aut-atraso',
  agenda: 'aut-agenda',
  renovacao: 'aut-renovacao',
  parado: 'aut-parado',
  rota: 'aut-rota',
  relatorio: 'aut-relatorio',
  manutencao: 'aut-manutencao',
} as const

/** Ações aplicadas pelo sistema (não são uma das automações da lista, mas entram no histórico) */
export const SYS_PRECO = { id: 'sys-preco', name: 'Preço sugerido aplicado' }
export const SYS_ROTAS = { id: 'sys-rotas', name: 'Rotas otimizadas' }

const def = (id: string, name: string, trig: string, act: string, channel: AutomationChannel, enabled: boolean, params?: AutomationRecord['params']): AutomationRecord => ({
  id,
  name,
  trigger: { kind: trig, label: triggerLabel(trig) },
  action: { kind: act, label: actionLabel(act) },
  channel,
  enabled,
  builtIn: true,
  params,
})

/** As 9 automações de fábrica (8 ligadas, a de manutenção preventiva desligada) */
export function builtInAutomations(): AutomationRecord[] {
  return [
    def(AUTO.avaria, 'Cobrar avaria registrada', 'avaria_registrada', 'cobrar_avaria', 'email', true),
    def(AUTO.extra, 'Faturar serviço extra', 'extra_concluido', 'incluir_na_fatura', 'email', true),
    def(AUTO.atraso, 'Cobrar atrasados pela régua', 'cobranca_vencida', 'enviar_lembrete', 'email', true),
    def(AUTO.agenda, 'Agendar locação confirmada', 'locacao_confirmada', 'agendar_servicos', 'sistema', true),
    def(AUTO.renovacao, 'Propor renovação do contrato', 'contrato_vence', 'propor_renovacao', 'portal', true, { daysBefore: 15 }),
    def(AUTO.parado, 'Dar destino a unidade parada', 'unidade_parada', 'marcar_oportunidade', 'sistema', true, { days: 30, promoPct: 10 }),
    def(AUTO.rota, 'Redistribuir rota atrasada', 'equipe_atrasada', 'redistribuir_rota', 'app', true, { minutes: 20 }),
    def(AUTO.relatorio, 'Publicar relatório do mês', 'fim_do_mes', 'publicar_relatorio', 'portal', true),
    def(AUTO.manutencao, 'Manutenção preventiva', 'equipamento_locacoes', 'abrir_manutencao', 'sistema', false, { rentals: 20 }),
  ]
}
