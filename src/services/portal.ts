/* Portal do cliente (link público por token): limpezas com foto e assinatura, locações, faturas e relatório do mês. */
import { commit, getData, newIds } from '@/data/db'
import { dayOf, monthKey, today as todayFn } from '@/domain/dates'
import type { Charge, Client, ISODateTime, ServicePhoto, Unit } from '@/domain/types'
import { call, ServiceError } from './config'
import { formatMoney, mkNotification } from './common'
import { filterChargesSync, pixFor, type ChargeView, type PixPayload } from './financeiro'
import { listRentalsSync, type RentalListItem } from './locacoes'
import { receiptsOf, type ServiceReceipt } from './clientes'
import { computeMonthlyClientReport, type MonthlyClientReport } from './relatorios'

export interface PortalRental extends RentalListItem {
  units: (Pick<Unit, 'id' | 'code' | 'status'> & { typeName: string; photo: string })[]
  /** próxima limpeza agendada desta locação */
  nextCleaningAt?: ISODateTime
}

export interface PortalCleaning extends ServiceReceipt {
  startedAt: ISODateTime
  finishedAt: ISODateTime
}

export interface PortalInvoice extends ChargeView {
  /** só nas abertas */
  pix?: PixPayload
}

export interface PortalData {
  company: { name: string; logoDataUrl?: string; brandHex: string; phone: string; email: string }
  client: Pick<Client, 'id' | 'name' | 'kind' | 'cnpj' | 'address' | 'contacts' | 'portalToken'>
  /** locações em campo agora, com os equipamentos */
  activeRentals: PortalRental[]
  /** limpezas concluídas (mais recentes primeiro), cada uma com data, fotos, assinatura e checklist */
  cleanings: PortalCleaning[]
  /** comprovantes de TODOS os serviços concluídos (entrega, limpeza, retirada...) */
  receipts: ServiceReceipt[]
  invoices: PortalInvoice[]
  monthlyReport: MonthlyClientReport
}

function clientByToken(token: string): Client {
  const c = getData().clients.find((x) => x.portalToken === token)
  if (!c) throw new ServiceError('Link do portal inválido ou expirado.')
  return c
}

export function computePortal(token: string, month?: string): PortalData {
  const data = getData()
  const c = clientByToken(token)
  const co = data.settings.company
  const types = new Map(data.types.map((t) => [t.id, t]))
  const rentals = listRentalsSync({ clientId: c.id, status: 'em_campo' }, data)
  const receipts = receiptsOf(c.id, 400)
  const invoices: PortalInvoice[] = filterChargesSync({ clientId: c.id }, data)
    .filter((x) => x.status !== 'rascunho' && x.status !== 'cancelada')
    .map((x) => (x.status === 'aberta' || x.status === 'atrasada' ? { ...x, pix: pixFor(x, co.name) } : x))
  return {
    company: { name: co.name, logoDataUrl: data.settings.logoDataUrl, brandHex: data.settings.brandHex, phone: co.phone, email: co.email },
    client: { id: c.id, name: c.name, kind: c.kind, cnpj: c.cnpj, address: c.address, contacts: c.contacts, portalToken: c.portalToken },
    activeRentals: rentals.map((r) => ({
      ...r,
      nextCleaningAt: data.services
        .filter((s) => s.rentalId === r.id && s.type === 'limpeza' && s.status !== 'concluido' && s.status !== 'cancelado' && dayOf(s.start) >= todayFn())
        .map((s) => s.start)
        .sort()[0],
      units: r.items
        .flatMap((i) => i.unitIds)
        .map((id) => data.units.find((u) => u.id === id)!)
        .filter(Boolean)
        .map((u) => ({ id: u.id, code: u.code, status: u.status, typeName: types.get(u.typeId)?.short ?? '', photo: types.get(u.typeId)?.photo ?? '' })),
    })),
    cleanings: receipts
      .filter((r) => r.type === 'limpeza')
      .map((r) => {
        const s = data.services.find((x) => x.id === r.serviceId)!
        return { ...r, startedAt: s.report!.startedAt, finishedAt: s.report!.finishedAt }
      }),
    receipts,
    invoices,
    monthlyReport: computeMonthlyClientReport(data, c.id, month ?? monthKey(todayFn())),
  }
}

/** Tudo que o portal mostra para o cliente do token. `month` ('AAAA-MM') escolhe o relatório mensal (padrão: mês atual). */
export function getPortal(token: string, month?: string): Promise<PortalData> {
  return call(() => computePortal(token, month))
}

/** Relatório mensal do portal para outro mês */
export function getPortalReport(token: string, month: string): Promise<MonthlyClientReport> {
  return call(() => computeMonthlyClientReport(getData(), clientByToken(token).id, month))
}

/** O cliente paga a fatura pelo portal (marca como paga; avarias ligadas viram pagas) */
export function payInvoice(token: string, chargeId: string): Promise<Charge> {
  return call(() => {
    const data = getData()
    const c = clientByToken(token)
    const ch = data.charges.find((x) => x.id === chargeId && x.clientId === c.id)
    if (!ch) throw new ServiceError('Fatura não encontrada.')
    if (ch.status === 'paga') throw new ServiceError('Esta fatura já está paga.')
    if (ch.status !== 'aberta' && ch.status !== 'atrasada') throw new ServiceError('Esta fatura não está disponível para pagamento.')
    const ids = newIds()
    const upd: Charge = { ...ch, status: 'paga', paidAt: todayFn() }
    const note = mkNotification(ids, { kind: 'pagamento', title: 'Pagamento recebido pelo portal', text: `${c.name} pagou ${ch.code} (${formatMoney(ch.value)}) pelo portal.`, ref: { type: 'charge', id: ch.id } })
    commit({
      charges: data.charges.map((x) => (x.id === chargeId ? upd : x)),
      damages: data.damages.map((d) => (d.chargeId === chargeId ? { ...d, status: 'paga' as const } : d)),
      notifications: [note, ...data.notifications],
      seq: ids.seq(),
    })
    return upd
  })
}

/** Endereço do portal do cliente (/portal/:token) */
export function getPortalLink(clientId: string): Promise<string> {
  return call(() => {
    const c = getData().clients.find((x) => x.id === clientId)
    if (!c) throw new ServiceError('Cliente não encontrado.')
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
    return `${origin}/portal/${c.portalToken}`
  })
}


/* ───────────── Página pública do QR da unidade (/u/:code) ───────────── */

export interface UnitPage {
  company: PortalData['company']
  unit: Pick<Unit, 'id' | 'code' | 'status'> & { typeName: string; photo: string }
  /** última limpeza concluída desta unidade, com as fotos */
  lastCleaning?: { at: ISODateTime; photos: ServicePhoto[] }
}

/** Dados da página que abre ao ler o QR colado no equipamento. Aceita código ('BQ-0142') ou id. */
export function getUnitPage(idOrCode: string): Promise<UnitPage> {
  return call(() => {
    const data = getData()
    const key = idOrCode.trim().toLowerCase()
    const u = data.units.find((x) => x.code.toLowerCase() === key || x.id.toLowerCase() === key)
    if (!u) throw new ServiceError('Equipamento não encontrado.')
    const type = data.types.find((t) => t.id === u.typeId)
    const co = data.settings.company
    const last = data.services
      .filter((s) => s.type === 'limpeza' && s.status === 'concluido' && s.report && s.unitIds.includes(u.id))
      .sort((a, b) => b.report!.finishedAt.localeCompare(a.report!.finishedAt))[0]
    return {
      company: { name: co.name, logoDataUrl: data.settings.logoDataUrl, brandHex: data.settings.brandHex, phone: co.phone, email: co.email },
      unit: { id: u.id, code: u.code, status: u.status, typeName: type?.name ?? '', photo: type?.photo ?? '' },
      lastCleaning: last ? { at: last.report!.finishedAt, photos: last.report!.photos } : undefined,
    }
  })
}

export type ProblemKind = 'papel' | 'limpeza' | 'porta' | 'outro'

const PROBLEM_LABEL: Record<ProblemKind, string> = {
  papel: 'Falta papel',
  limpeza: 'Precisa de limpeza',
  porta: 'Problema na porta ou trava',
  outro: 'Outro problema',
}

/** Aviso de quem leu o QR: vira uma notificação do tipo `portal` no sino do escritório */
export function reportProblem(code: string, kind: ProblemKind, note?: string): Promise<void> {
  return call(() => {
    const data = getData()
    const key = code.trim().toLowerCase()
    const u = data.units.find((x) => x.code.toLowerCase() === key || x.id.toLowerCase() === key)
    if (!u) throw new ServiceError('Equipamento não encontrado.')
    const ids = newIds()
    const text = `${PROBLEM_LABEL[kind]} em ${u.code}.${note?.trim() ? ` Observação: ${note.trim()}` : ''}`
    const n = mkNotification(ids, { kind: 'portal', title: `Aviso pelo QR de ${u.code}`, text, ref: { type: 'unit', id: u.id } })
    commit({ notifications: [n, ...data.notifications], seq: ids.seq() })
  })
}
