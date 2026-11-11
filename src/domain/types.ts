/*
  Tipos do domínio. Tudo que as telas recebem dos serviços (src/services) tem estes formatos.

  Datas:
  - ISODate     'AAAA-MM-DD' (dia local, sem hora). Ex.: início e fim de locação, vencimento, avaria.
  - ISODateTime ISO 8601 completo. Ex.: início de serviço, envio de cobrança, histórico.
  Ambas aceitas por formatDate/formatDateTime de src/lib/format.ts.
*/
import type { ZoneId } from '@/data/geo'

export type { ZoneId }

export type ISODate = string
export type ISODateTime = string

/* ───────────────────────── Configurações ───────────────────────── */

export type UserRole = 'dono' | 'escritorio' | 'campo'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  initials: string
}

export interface Company {
  name: string
  legalName: string
  cnpj: string
  phone: string
  email: string
  address: string
  city: string
}

/** 'email' = envio de e-mails de cobrança e avisos ao cliente */
export type IntegrationKey = 'email' | 'pix' | 'boleto' | 'nfse' | 'contaAzul'

export interface Integration {
  connected: boolean
  account?: string
  connectedAt?: ISODateTime
}

/** Passo da régua de cobrança. dayOffset: dias em relação ao vencimento (-3 = 3 dias antes, 5 = 5 dias depois). */
export interface DunningStep {
  id: string
  dayOffset: number
  channel: Channel
  enabled: boolean
  template: string
}

export type SegmentId = 'eventos' | 'estruturas' | 'hospitalar' | 'maquinas'

export interface Settings {
  company: Company
  brandHex: string
  logoDataUrl?: string
  segmentId: SegmentId
  aiEnabled: boolean
  users: User[]
  integrations: Record<IntegrationKey, Integration>
  dunning: DunningStep[]
  currentUserId: string
}

/* ───────────────────────── Cadastros ───────────────────────── */

export type ClientKind =
  | 'Construtora'
  | 'Produtora de eventos'
  | 'Órgão público'
  | 'Cerimonial'
  | 'Igreja'
  | 'Condomínio'
  | 'Indústria'

export interface Contact {
  name: string
  role: string
  phone: string
  email: string
}

export interface Client {
  id: string
  name: string
  kind: ClientKind
  cnpj: string
  since: ISODate
  address: string
  bairroId: string
  contacts: Contact[]
  /** token público do portal do cliente (/portal/:token) */
  portalToken: string
}

export type EquipmentGroup = 'Banheiros' | 'Estruturas'

export interface EquipmentType {
  id: string
  name: string
  short: string
  group: EquipmentGroup
  /** prefixo do código de patrimônio: BQ, PCD, PIA, TRL, TND, ALA, FEC, BAL */
  prefix: string
  /** caminho em /public (nunca data URL) */
  photo: string
  dailyRate: number
  monthlyRate: number
  /** recebe limpeza (higienização, revisão... conforme o segmento) */
  cleanable: boolean
  /** custo de aquisição por unidade (R$) */
  purchasePrice: number
  /** vida útil estimada, em meses */
  usefulLifeMonths: number
  /** último ajuste de preço aplicado pela sugestão de preços (guarda o preço anterior) */
  priceChange?: { at: ISODate; fromMonthly: number; fromDaily: number }
}

export type UnitStatus = 'disponivel' | 'em_campo' | 'limpeza' | 'manutencao'

export interface Unit {
  id: string
  /** código de patrimônio, ex.: 'BQ-0142' (é o que está no QR da porta) */
  code: string
  typeId: string
  status: UnitStatus
  /** locação em que está em campo (só quando status = em_campo) */
  rentalId?: string
  /** desde quando está parada, sem locação (só quando disponível) */
  idleSince?: ISODate
  acquiredAt: ISODate
  notes?: string
  /** valores dos campos extras da ficha (ver SegmentPack.equipmentFields), por chave */
  fields: Record<string, string | number>
}

export interface Team {
  id: string
  name: string
  short: string
  initials: string
  members: string[]
  truck: string
  plate: string
  /** 'viz-1' a 'viz-6' (tokens de cor de visualização) */
  color: string
  phone: string
  /** região atendida */
  zoneId: ZoneId
  focus: string
}

/* ───────────────────────── Locações ───────────────────────── */

export type RentalKind = 'obra' | 'evento'
export type RentalStatus = 'orcamento' | 'confirmada' | 'em_campo' | 'retirada' | 'faturada' | 'cancelada'
export type Billing = 'diaria' | 'mensal'

export interface RentalItem {
  typeId: string
  qty: number
  /** unidades alocadas (vazio em orçamento) */
  unitIds: string[]
  /** valor unitário negociado (por dia ou por mês, conforme billing) */
  rate: number
  billing: Billing
}

export interface Contract {
  generatedAt: ISODateTime
  signedAt?: ISODateTime
  signedBy?: string
  /** assinatura desenhada (data URL pequena) */
  signatureDataUrl?: string
}

export interface HistoryEntry {
  at: ISODateTime
  text: string
}

export interface Rental {
  id: string
  /** 'LOC-2046' */
  code: string
  clientId: string
  title: string
  kind: RentalKind
  address: string
  bairroId: string
  start: ISODate
  end: ISODate
  status: RentalStatus
  items: RentalItem[]
  cleaningsPerWeek: number
  /** valor total previsto de todo o período */
  total: number
  contract?: Contract
  contact: { name: string; role: string; phone: string }
  notes?: string
  createdAt: ISODateTime
  history: HistoryEntry[]
}

/* ───────────────────────── Operação ───────────────────────── */

export type ServiceType = 'entrega' | 'limpeza' | 'retirada' | 'manutencao' | 'montagem'
export type ServiceStatus = 'agendado' | 'a_caminho' | 'em_andamento' | 'concluido' | 'atrasado' | 'cancelado'
export type PhotoMoment = 'antes' | 'depois' | 'entrega' | 'avaria'

export interface ServicePhoto {
  id: string
  /** caminho em /public (ex.: '/produtos/tenda.jpg') */
  src: string
  label: string
  moment: PhotoMoment
}

export interface ServiceReport {
  startedAt: ISODateTime
  finishedAt: ISODateTime
  checklist: { label: string; ok: boolean }[]
  photos: ServicePhoto[]
  signature?: { name: string; role: string; dataUrl?: string }
  notes?: string
  damageIds: string[]
}

export interface Service {
  id: string
  rentalId: string
  clientId: string
  teamId: string
  type: ServiceType
  start: ISODateTime
  durationMin: number
  /** posição na rota da equipe no dia (1 = primeiro) */
  order: number
  status: ServiceStatus
  unitIds: string[]
  /** serviço fora do contrato, cobrado à parte */
  extra: boolean
  extraValue?: number
  extraBilled?: boolean
  /** cobrança que faturou este extra */
  extraChargeId?: string
  /** descrição curta (principalmente dos extras e da manutenção) */
  note?: string
  startedAt?: ISODateTime
  report?: ServiceReport
}

/* ───────────────────────── Avarias e financeiro ───────────────────────── */

export type DamageStatus = 'registrada' | 'cobrada' | 'paga' | 'dispensada'

export interface Damage {
  id: string
  unitId: string
  rentalId: string
  clientId: string
  serviceId?: string
  date: ISODate
  kind: string
  description: string
  photos: ServicePhoto[]
  value: number
  status: DamageStatus
  chargeId?: string
}

export type ChargeKind = 'mensalidade' | 'locacao' | 'avaria' | 'extra'
export type ChargeStatus = 'rascunho' | 'aberta' | 'paga' | 'atrasada' | 'cancelada'
export type PayMethod = 'pix' | 'boleto'
/** Canal de envio ao cliente: e-mail ou mensagem no portal do cliente */
export type Channel = 'email' | 'portal'

export interface Charge {
  id: string
  /** 'COB-5021' */
  code: string
  clientId: string
  rentalId?: string
  kind: ChargeKind
  description: string
  value: number
  issuedAt: ISODate
  dueAt: ISODate
  paidAt?: ISODate
  status: ChargeStatus
  method: PayMethod
  sentAt?: ISODateTime
  sentVia?: Channel
  reminders: { at: ISODateTime; channel: Channel }[]
  damageId?: string
  serviceIds?: string[]
}

/* ───────────────────────── Avisos e copiloto ───────────────────────── */

export type NotificationKind = 'servico' | 'atraso' | 'avaria' | 'pagamento' | 'locacao' | 'copiloto' | 'portal'

export interface Notification {
  id: string
  kind: NotificationKind
  title: string
  text: string
  at: ISODateTime
  read: boolean
  /** entidade relacionada, para a tela abrir o detalhe */
  ref?: { type: 'rental' | 'service' | 'charge' | 'damage' | 'client' | 'unit'; id: string }
}

export type SuggestionKind = 'cobrar_avaria' | 'faturar_extra' | 'lembrar_atraso' | 'redistribuir_rota' | 'mensagem_cliente'
export type SuggestionStatus = 'pendente' | 'aprovada' | 'dispensada'

export interface CopilotSuggestion {
  id: string
  kind: SuggestionKind
  title: string
  /** valor em jogo, quando houver */
  value?: number
  detail: string
  draftMessage?: string
  /** ids que a ação usa: { damageIds }, { rentalId }, { chargeIds }, { moves }, { serviceId, clientId } */
  payload: Record<string, unknown>
  status: SuggestionStatus
}

/* ───────────────────────── Automações ───────────────────────── */

export type AutomationChannel = Channel | 'app' | 'sistema'

export interface AutomationStats {
  /** execuções, dinheiro e tempo poupado nos últimos 30 dias (derivado do histórico) */
  runsMonth: number
  moneyMonth: number
  minutesSavedMonth: number
}

/** Automação como fica gravada no banco (as estatísticas são derivadas do histórico) */
export interface AutomationRecord {
  id: string
  /** nome curto, ex.: 'Cobrar avaria registrada' */
  name: string
  trigger: { kind: string; label: string }
  action: { kind: string; label: string }
  channel: AutomationChannel
  enabled: boolean
  /** de fábrica (não pode ser removida) */
  builtIn: boolean
  params?: Record<string, string | number | boolean>
}

export interface Automation extends AutomationRecord {
  stats: AutomationStats
  lastRunAt?: ISODateTime
}

export interface AutomationRun {
  id: string
  /** id da automação; 'sys-preco' e 'sys-rotas' são ações aplicadas pelo sistema (preço sugerido, rota otimizada) */
  automationId: string
  automationName: string
  at: ISODateTime
  /** frase curta com o nome do cliente ou o código */
  text: string
  /** dinheiro envolvido, quando houver */
  value?: number
  minutesSaved: number
  ref?: { type: 'rental' | 'service' | 'charge' | 'damage' | 'client' | 'unit' | 'type'; id: string }
}

/* ───────────────────────── Estado completo ───────────────────────── */

export interface DbData {
  settings: Settings
  clients: Client[]
  types: EquipmentType[]
  units: Unit[]
  teams: Team[]
  rentals: Rental[]
  services: Service[]
  damages: Damage[]
  charges: Charge[]
  notifications: Notification[]
  /** sugestões já resolvidas (aprovadas ou dispensadas); as pendentes são geradas dos dados */
  suggestions: CopilotSuggestion[]
  automations: AutomationRecord[]
  /** histórico de execuções das automações (mais antigas primeiro) */
  automationLog: AutomationRun[]
  /** contador de ids */
  seq: number
}
