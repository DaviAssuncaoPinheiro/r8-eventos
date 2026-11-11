/* Financeiro: cobranças, extras, envio, baixa, régua de cobrança, Pix e exportação. */
import { commit, getData, newIds } from '@/data/db'
import { addDays, demoNowISO, diffDays, monthKey, today as todayFn } from '@/domain/dates'
import type { Channel, Charge, ChargeKind, ChargeStatus, Client, Damage, DunningStep, ISODate, PayMethod, Rental, Service, DbData } from '@/domain/types'
import { call, ServiceError } from './config'
import { formatMoney, lookup, mkNotification, normalize } from './common'
import { nextCode } from './rules'
import { formatDate } from '@/lib/format'

export interface ChargeView extends Charge {
  clientName: string
  rentalCode?: string
  rentalTitle?: string
  /** dias de atraso (0 se não está atrasada) */
  daysOverdue: number
}

export interface ChargeFilter {
  status?: ChargeStatus | ChargeStatus[]
  clientId?: string
  rentalId?: string
  kind?: ChargeKind
  method?: PayMethod
  /** vencimento a partir de / até */
  from?: ISODate
  to?: ISODate
  /** mês de referência 'AAAA-MM': data de pagamento (pagas) ou de vencimento (demais) */
  month?: string
  q?: string
}

export interface PixPayload {
  copiaECola: string
  qrValue: string
  boletoLine: string
}

export interface ChargeDetail {
  charge: ChargeView
  client: Client
  rental?: Rental
  damages: Damage[]
  services: Service[]
  pix: PixPayload
}

export interface NewChargeInput {
  clientId: string
  rentalId?: string
  kind: ChargeKind
  description: string
  value: number
  dueAt?: ISODate
  method?: PayMethod
}

export interface Receivables {
  /** abertas e atrasadas */
  toReceive: { value: number; count: number }
  /** abertas ainda dentro do prazo */
  notDue: { value: number; count: number }
  overdue: { value: number; count: number; clients: number }
  receivedThisMonth: { value: number; count: number }
  byAging: { label: string; min: number; max: number | null; value: number; count: number }[]
}

const r2 = (n: number) => Math.round(n * 100) / 100

function view(c: Charge, data: DbData = getData(), today = todayFn()): ChargeView {
  const client = data.clients.find((x) => x.id === c.clientId)
  const r = c.rentalId ? data.rentals.find((x) => x.id === c.rentalId) : undefined
  return { ...c, clientName: client?.name ?? '', rentalCode: r?.code, rentalTitle: r?.title, daysOverdue: c.status === 'atrasada' || (c.status === 'aberta' && c.dueAt < today) ? Math.max(0, diffDays(c.dueAt, today)) : 0 }
}

/** Versão síncrona de listCharges (uso interno de outros serviços) */
export function filterChargesSync(filter: ChargeFilter, data: DbData = getData()): ChargeView[] {
  const sts = filter.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]) : undefined
  const q = filter.q ? normalize(filter.q) : ''
  return data.charges
    .filter((c) => {
      if (sts && !sts.includes(c.status)) return false
      if (filter.clientId && c.clientId !== filter.clientId) return false
      if (filter.rentalId && c.rentalId !== filter.rentalId) return false
      if (filter.kind && c.kind !== filter.kind) return false
      if (filter.method && c.method !== filter.method) return false
      if (filter.from && c.dueAt < filter.from) return false
      if (filter.to && c.dueAt > filter.to) return false
      if (filter.month) {
        const ref = c.status === 'paga' && c.paidAt ? c.paidAt : c.dueAt
        if (monthKey(ref) !== filter.month) return false
      }
      return true
    })
    .map((c) => view(c, data))
    .filter((v) => !q || normalize(`${v.code} ${v.clientName} ${v.description} ${v.rentalCode ?? ''}`).includes(q))
    .sort((a, b) => b.dueAt.localeCompare(a.dueAt) || b.code.localeCompare(a.code))
}

/** Lista de cobranças (vencimento mais recente primeiro) */
export function listCharges(filter: ChargeFilter = {}): Promise<ChargeView[]> {
  return call(() => filterChargesSync(filter))
}

/** Cobrança com cliente, locação, avarias, serviços extras e dados de Pix/boleto */
export function getCharge(id: string): Promise<ChargeDetail> {
  return call(() => {
    const data = getData()
    const c = data.charges.find((x) => x.id === id)
    if (!c) throw new ServiceError('Cobrança não encontrada.')
    const L = lookup(data)
    return {
      charge: view(c, data),
      client: L.client(c.clientId),
      rental: c.rentalId ? L.rental(c.rentalId) : undefined,
      damages: data.damages.filter((d) => d.chargeId === c.id),
      services: c.serviceIds ? data.services.filter((s) => c.serviceIds!.includes(s.id)) : [],
      pix: pixFor(c, data.settings.company.name),
    }
  })
}

/** Cria uma cobrança avulsa em `rascunho` */
export function createCharge(input: NewChargeInput): Promise<Charge> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const client = L.client(input.clientId)
    if (!(input.value > 0)) throw new ServiceError('Informe o valor da cobrança.')
    if (!input.description.trim()) throw new ServiceError('Informe a descrição da cobrança.')
    if (input.rentalId) L.rental(input.rentalId)
    const ids = newIds()
    const today = todayFn()
    const c: Charge = {
      id: ids.next('chg'),
      code: nextCode(data.charges, 'COB', 5000),
      clientId: client.id,
      rentalId: input.rentalId,
      kind: input.kind,
      description: input.description.trim(),
      value: r2(input.value),
      issuedAt: today,
      dueAt: input.dueAt ?? addDays(today, 10),
      status: 'rascunho',
      method: input.method ?? (client.kind === 'Construtora' ? 'boleto' : 'pix'),
      reminders: [],
    }
    commit({ charges: [...data.charges, c], seq: ids.seq() })
    return c
  })
}

/** Fatura os serviços extras concluídos e ainda não faturados da locação (cria cobrança `extra` em rascunho) */
export function billExtras(rentalId: string): Promise<Charge> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const r = L.rental(rentalId)
    const pend = data.services.filter((s) => s.rentalId === rentalId && s.extra && s.status === 'concluido' && !s.extraBilled)
    if (!pend.length) throw new ServiceError('Esta locação não tem serviços extras por faturar.')
    const ids = newIds()
    const today = todayFn()
    const c: Charge = {
      id: ids.next('chg'),
      code: nextCode(data.charges, 'COB', 5000),
      clientId: r.clientId,
      rentalId,
      kind: 'extra',
      description: `Serviços extras (${pend.length}) · ${r.code}`,
      value: r2(pend.reduce((a, s) => a + (s.extraValue ?? 0), 0)),
      issuedAt: today,
      dueAt: addDays(today, 10),
      status: 'rascunho',
      method: L.client(r.clientId).kind === 'Construtora' ? 'boleto' : 'pix',
      reminders: [],
      serviceIds: pend.map((s) => s.id),
    }
    const set = new Set(pend.map((s) => s.id))
    commit({
      charges: [...data.charges, c],
      services: data.services.map((s) => (set.has(s.id) ? { ...s, extraBilled: true, extraChargeId: c.id } : s)),
      seq: ids.seq(),
    })
    return c
  })
}

/** Envia a cobrança ao cliente (WhatsApp ou e-mail): rascunho vira `aberta` e ganha `sentAt` */
export function sendCharge(id: string, opts: { via: Channel; method: PayMethod }): Promise<Charge> {
  return call(() => {
    const data = getData()
    const c = data.charges.find((x) => x.id === id)
    if (!c) throw new ServiceError('Cobrança não encontrada.')
    if (c.status === 'paga' || c.status === 'cancelada') throw new ServiceError('Esta cobrança já foi paga ou cancelada.')
    const today = todayFn()
    const upd: Charge = { ...c, status: c.dueAt < today ? 'atrasada' : 'aberta', method: opts.method, sentVia: opts.via, sentAt: demoNowISO() }
    commit({ charges: data.charges.map((x) => (x.id === id ? upd : x)) })
    return upd
  })
}

/** Dá baixa: cobrança `paga` hoje; avarias ligadas viram `paga` */
export function markPaid(id: string): Promise<Charge> {
  return call(() => {
    const data = getData()
    const c = data.charges.find((x) => x.id === id)
    if (!c) throw new ServiceError('Cobrança não encontrada.')
    if (c.status === 'paga') throw new ServiceError('Esta cobrança já está paga.')
    if (c.status === 'cancelada') throw new ServiceError('Esta cobrança foi cancelada.')
    const ids = newIds()
    const upd: Charge = { ...c, status: 'paga', paidAt: todayFn() }
    const client = data.clients.find((x) => x.id === c.clientId)
    const note = mkNotification(ids, { kind: 'pagamento', title: 'Pagamento recebido', text: `${client?.name ?? 'Cliente'} pagou ${c.code} (${formatMoney(c.value)}).`, ref: { type: 'charge', id } })
    commit({
      charges: data.charges.map((x) => (x.id === id ? upd : x)),
      damages: data.damages.map((d) => (d.chargeId === id ? { ...d, status: 'paga' as const } : d)),
      notifications: [note, ...data.notifications],
      seq: ids.seq(),
    })
    return upd
  })
}

/** Registra um lembrete enviado (WhatsApp por padrão) */
export function sendReminder(id: string, channel: Channel = 'whatsapp'): Promise<Charge> {
  return call(() => {
    const data = getData()
    const c = data.charges.find((x) => x.id === id)
    if (!c) throw new ServiceError('Cobrança não encontrada.')
    if (c.status !== 'aberta' && c.status !== 'atrasada') throw new ServiceError('Só cobranças abertas ou atrasadas recebem lembrete.')
    const upd: Charge = { ...c, reminders: [...c.reminders, { at: demoNowISO(), channel }] }
    commit({ charges: data.charges.map((x) => (x.id === id ? upd : x)) })
    return upd
  })
}

export function cancelCharge(id: string): Promise<Charge> {
  return call(() => {
    const data = getData()
    const c = data.charges.find((x) => x.id === id)
    if (!c) throw new ServiceError('Cobrança não encontrada.')
    if (c.status === 'paga') throw new ServiceError('Cobrança paga não pode ser cancelada.')
    const upd: Charge = { ...c, status: 'cancelada' }
    commit({
      charges: data.charges.map((x) => (x.id === id ? upd : x)),
      damages: data.damages.map((d) => (d.chargeId === id ? { ...d, status: 'registrada' as const, chargeId: undefined } : d)),
      services: data.services.map((s) => (s.extraChargeId === id ? { ...s, extraBilled: false, extraChargeId: undefined } : s)),
    })
    return upd
  })
}

/** A receber, recebido no mês, atrasado e por faixa de atraso */
export function getReceivables(): Promise<Receivables> {
  return call(() => computeReceivables(getData()))
}

export function computeReceivables(data: DbData = getData(), today: ISODate = todayFn()): Receivables {
  const open = data.charges.filter((c) => c.status === 'aberta' || c.status === 'atrasada')
  const sum = (l: Charge[]) => r2(l.reduce((a, c) => a + c.value, 0))
  const overdue = open.filter((c) => c.status === 'atrasada')
  const notDue = open.filter((c) => c.status === 'aberta')
  const paid = data.charges.filter((c) => c.status === 'paga' && c.paidAt && monthKey(c.paidAt) === monthKey(today))
  const buckets: { label: string; min: number; max: number | null }[] = [
    { label: 'A vencer', min: -9999, max: 0 },
    { label: '1 a 15 dias', min: 1, max: 15 },
    { label: '16 a 30 dias', min: 16, max: 30 },
    { label: '31 a 60 dias', min: 31, max: 60 },
    { label: 'Mais de 60 dias', min: 61, max: null },
  ]
  return {
    toReceive: { value: sum(open), count: open.length },
    notDue: { value: sum(notDue), count: notDue.length },
    overdue: { value: sum(overdue), count: overdue.length, clients: new Set(overdue.map((c) => c.clientId)).size },
    receivedThisMonth: { value: sum(paid), count: paid.length },
    byAging: buckets.map((b) => {
      const l = open.filter((c) => {
        const d = diffDays(c.dueAt, today)
        return d >= b.min && (b.max === null || d <= b.max)
      })
      return { ...b, value: sum(l), count: l.length }
    }),
  }
}

/** Passos da régua de cobrança */
export function getDunning(): Promise<DunningStep[]> {
  return call(() => getData().settings.dunning)
}

export function saveDunning(steps: DunningStep[]): Promise<DunningStep[]> {
  return call(() => {
    const data = getData()
    if (steps.some((s) => !s.template.trim())) throw new ServiceError('Todo passo precisa de uma mensagem.')
    const ids = newIds()
    const clean = steps.map((s) => ({ ...s, id: s.id || ids.next('dun') })).sort((a, b) => a.dayOffset - b.dayOffset)
    commit({ settings: { ...data.settings, dunning: clean }, seq: ids.seq() })
    return clean
  })
}

const csvCell = (v: string | number) => {
  const s = String(v)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const brNumber = (n: number) => n.toFixed(2).replace('.', ',')

/** CSV (separador ponto e vírgula, decimal com vírgula) das cobranças do filtro */
export function exportCsv(filter: ChargeFilter = {}): Promise<string> {
  return call(() => {
    const rows = filterChargesSync(filter)
    const head = ['Código', 'Cliente', 'Locação', 'Tipo', 'Descrição', 'Valor', 'Emissão', 'Vencimento', 'Pagamento', 'Situação', 'Forma']
    const lines = [head.join(';')]
    for (const c of rows) {
      lines.push([c.code, c.clientName, c.rentalCode ?? '', c.kind, c.description, brNumber(c.value), formatDate(c.issuedAt), formatDate(c.dueAt), c.paidAt ? formatDate(c.paidAt) : '', c.status, c.method].map(csvCell).join(';'))
    }
    return lines.join('\n')
  })
}

/** Texto pronto de WhatsApp para a cobrança (muda o tom se estiver atrasada) */
export function buildWhatsAppMessage(chargeId: string): Promise<string> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const c = data.charges.find((x) => x.id === chargeId)
    if (!c) throw new ServiceError('Cobrança não encontrada.')
    const client = L.client(c.clientId)
    const first = (client.contacts[0]?.name ?? client.name).split(' ')[0]
    const co = data.settings.company.name
    const pix = pixFor(c, co)
    const pay = c.method === 'pix' ? `Pix copia e cola:\n${pix.copiaECola}` : `Linha digitável do boleto:\n${pix.boletoLine}`
    const today = todayFn()
    if (c.status === 'atrasada' || (c.status === 'aberta' && c.dueAt < today)) {
      return `Olá, ${first}! Aqui é da ${co}. Não encontramos o pagamento da cobrança ${c.code}, de ${formatMoney(c.value)}, que venceu em ${formatDate(c.dueAt)} (${c.description}). Se já pagou, é só enviar o comprovante por aqui. Se precisar de ajuda para regularizar, estamos à disposição.\n\n${pay}`
    }
    if (c.kind === 'avaria') {
      return `Olá, ${first}! Aqui é da ${co}. Encontramos uma avaria em equipamento da locação, registrada com foto: ${c.description}. O valor de reparo é ${formatMoney(c.value)}, com vencimento em ${formatDate(c.dueAt)}. As fotos estão no portal do cliente.\n\n${pay}`
    }
    return `Olá, ${first}! Aqui é da ${co}. Segue a cobrança ${c.code}: ${c.description}. Valor ${formatMoney(c.value)}, vencimento em ${formatDate(c.dueAt)}.\n\n${pay}`
  })
}

/* ───────────────────────── Pix e boleto fictícios (formato plausível) ───────────────────────── */

function crc16(s: string): string {
  let crc = 0xffff
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function digitsFrom(seed: string, n: number): string {
  let h = 2166136261
  let out = ''
  for (let i = 0; out.length < n; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i
    h = Math.imul(h, 16777619)
    out += String((h >>> 0) % 10)
  }
  return out.slice(0, n)
}

const tlv = (id: string, v: string) => `${id}${String(v.length).padStart(2, '0')}${v}`

export function pixFor(c: Pick<Charge, 'code' | 'value' | 'dueAt'>, company: string): PixPayload {
  const key = `${digitsFrom(c.code, 8)}-${digitsFrom(c.code + 'a', 4)}-4${digitsFrom(c.code + 'b', 3)}-a${digitsFrom(c.code + 'c', 3)}-${digitsFrom(c.code + 'd', 12)}`
  const merchant = tlv('00', 'br.gov.bcb.pix') + tlv('01', key)
  const name = company.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().slice(0, 25)
  const body = tlv('00', '01') + tlv('26', merchant) + tlv('52', '0000') + tlv('53', '986') + tlv('54', c.value.toFixed(2)) + tlv('58', 'BR') + tlv('59', name) + tlv('60', 'BRASILIA') + tlv('62', tlv('05', c.code.replace('-', ''))) + '6304'
  const copia = body + crc16(body)
  const factor = String(1000 + (diffDays('1997-10-07', c.dueAt) % 9000)).padStart(4, '0')
  const amount = String(Math.round(c.value * 100)).padStart(10, '0')
  const f1 = `7569${digitsFrom(c.code + 'f1', 6)}`
  const f2 = digitsFrom(c.code + 'f2', 11)
  const f3 = digitsFrom(c.code + 'f3', 11)
  const k = digitsFrom(c.code + 'k', 1)
  const boleto = `${f1.slice(0, 5)}.${f1.slice(5)} ${f2.slice(0, 5)}.${f2.slice(5)} ${f3.slice(0, 5)}.${f3.slice(5)} ${k} ${factor}${amount}`
  return { copiaECola: copia, qrValue: copia, boletoLine: boleto }
}

