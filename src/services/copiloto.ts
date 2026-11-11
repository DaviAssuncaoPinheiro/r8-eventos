/* Copiloto: resumo do dia e sugestões geradas dos dados (avarias, extras, atrasos, rota). Aprovar executa a ação. */
import { commit, getData, newIds } from '@/data/db'
import { dayOf, demoNow, demoNowISO, diffDays, today as todayFn } from '@/domain/dates'
import type { CopilotSuggestion, DbData, SuggestionKind } from '@/domain/types'
import { call, inner, ServiceError } from './config'
import { formatMoney, lookup, mapById } from './common'
import { computeReroute } from './operacao'
import { moveService } from './operacao'
import { chargeDamage } from './avarias'
import { billExtras, sendCharge, sendReminder } from './financeiro'
import { calcIdle, calcOverdue, calcUncollectedDamages, calcUnbilledExtras } from './painel'
import { formatDate } from '@/lib/format'

export interface DailySummary {
  generatedAt: string
  /** frases prontas, com números reais */
  lines: { id: string; tone: 'info' | 'alerta' | 'dinheiro'; text: string }[]
  numbers: { servicesToday: number; done: number; inProgress: number; late: number; atRisk: number; toCollect: number }
}

const firstName = (full: string) => full.split(' ')[0]

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export function computeSummary(data: DbData, today = todayFn(), now = demoNow()): DailySummary {
  const todays = data.services.filter((s) => dayOf(s.start) === today && s.status !== 'cancelado')
  const done = todays.filter((s) => s.status === 'concluido').length
  const inProg = todays.filter((s) => s.status === 'em_andamento' || s.status === 'a_caminho').length
  const late = todays.filter((s) => s.status === 'atrasado')
  const lateTeams = new Set(late.map((s) => s.teamId))
  const atRisk = late.length + todays.filter((s) => s.status === 'agendado' && lateTeams.has(s.teamId)).length
  const dmg = calcUncollectedDamages(data)
  const ext = calcUnbilledExtras(data)
  const od = calcOverdue(data)
  const idle = calcIdle(data, today)
  const toCollect = Math.round((dmg.value + ext.value + od.value) * 100) / 100
  const lines: DailySummary['lines'] = []
  lines.push({ id: 'dia', tone: 'info', text: `Hoje são ${plural(todays.length, 'serviço', 'serviços')}: ${plural(done, 'concluído', 'concluídos')}, ${inProg} em andamento e ${todays.length - done - inProg} por fazer.` })
  if (late.length) {
    const names = [...lateTeams].map((id) => data.teams.find((t) => t.id === id)?.short ?? '').join(' e ')
    lines.push({ id: 'risco', tone: 'alerta', text: `${plural(late.length, 'serviço está atrasado', 'serviços estão atrasados')} (equipe ${names}) e ${plural(atRisk, 'serviço corre', 'serviços correm')} risco de atrasar. Dá para redistribuir a rota.` })
  } else lines.push({ id: 'risco', tone: 'info', text: 'Nenhum serviço atrasado até agora.' })
  const parts: string[] = []
  if (dmg.count) parts.push(`${formatMoney(dmg.value)} em ${plural(dmg.count, 'avaria sem cobrança', 'avarias sem cobrança')}`)
  if (ext.count) parts.push(`${formatMoney(ext.value)} em ${plural(ext.count, 'serviço extra sem fatura', 'serviços extras sem fatura')}`)
  if (od.count) parts.push(`${formatMoney(od.value)} em atraso (${plural(od.clients, 'cliente', 'clientes')})`)
  if (parts.length) lines.push({ id: 'cobrar', tone: 'dinheiro', text: `A cobrar: ${parts.join('; ')}. Total ${formatMoney(toCollect)}.` })
  if (idle.over30d) lines.push({ id: 'parados', tone: 'dinheiro', text: `${plural(idle.units, 'equipamento disponível', 'equipamentos disponíveis')}, ${idle.over30d} parados há mais de 30 dias (${formatMoney(idle.monthlyValue)} por mês de tabela).` })
  void now
  return { generatedAt: demoNowISO(), lines, numbers: { servicesToday: todays.length, done, inProgress: inProg, late: late.length, atRisk, toCollect } }
}

/** Frases prontas para o topo do Painel: serviços de hoje, em risco e a cobrar */
export function getDailySummary(): Promise<DailySummary> {
  return call(() => computeSummary(getData()))
}

/* ───────────────────────── Sugestões ───────────────────────── */

function whatsDamage(clientName: string, contact: string, items: string[], total: number) {
  return `Olá, ${contact}! Aqui é da ${getData().settings.company.name}. Na retirada encontramos ${items.length === 1 ? 'uma avaria' : items.length + ' avarias'} nos equipamentos da locação, registrada${items.length === 1 ? '' : 's'} com foto: ${items.join('; ')}. O valor de reparo é ${formatMoney(total)}. Posso enviar a cobrança por Pix? As fotos ficam no portal do cliente.`.replace(clientName, clientName)
}

function generate(data: DbData, today = todayFn()): CopilotSuggestion[] {
  const L = lookup(data)
  const out: CopilotSuggestion[] = []
  // 1) avarias sem cobrança, por cliente
  const dmgBy = new Map<string, typeof data.damages>()
  for (const d of data.damages.filter((x) => x.status === 'registrada' && !x.chargeId)) dmgBy.set(d.clientId, [...(dmgBy.get(d.clientId) ?? []), d])
  for (const [clientId, ds] of dmgBy) {
    const c = L.client(clientId)
    const value = Math.round(ds.reduce((a, d) => a + d.value, 0) * 100) / 100
    const items = ds.map((d) => `${d.kind} (${L.unit(d.unitId).code})`)
    out.push({
      id: `sug-avaria-${clientId}`,
      kind: 'cobrar_avaria',
      title: `Cobrar ${ds.length === 1 ? 'a avaria' : `${ds.length} avarias`} de ${c.name}`,
      value,
      detail: `${items.join(', ')}. Registrada${ds.length === 1 ? '' : 's'} há ${Math.max(...ds.map((d) => diffDays(d.date, today)))} dias, sem cobrança.`,
      draftMessage: whatsDamage(c.name, firstName(c.contacts[0]?.name ?? c.name), items, value),
      payload: { clientId, damageIds: ds.map((d) => d.id) },
      status: 'pendente',
    })
  }
  // 2) extras concluídos sem fatura, por locação
  const exBy = new Map<string, typeof data.services>()
  for (const s of data.services.filter((x) => x.extra && x.status === 'concluido' && !x.extraBilled)) exBy.set(s.rentalId, [...(exBy.get(s.rentalId) ?? []), s])
  for (const [rentalId, ss] of exBy) {
    const r = L.rental(rentalId)
    const c = L.client(r.clientId)
    const value = Math.round(ss.reduce((a, s) => a + (s.extraValue ?? 0), 0) * 100) / 100
    out.push({
      id: `sug-extra-${rentalId}`,
      kind: 'faturar_extra',
      title: `Faturar ${ss.length === 1 ? '1 serviço extra' : `${ss.length} serviços extras`} de ${r.title}`,
      value,
      detail: `${c.name}. ${ss.map((s) => s.note ?? 'Serviço extra').join('; ')}.`,
      draftMessage: `Olá, ${firstName(c.contacts[0]?.name ?? c.name)}! Aqui é da ${data.settings.company.name}. Fizemos ${ss.length === 1 ? 'um serviço extra' : ss.length + ' serviços extras'} em ${r.title}, fora do contrato, no total de ${formatMoney(value)}. Vou enviar a cobrança por Pix.`,
      payload: { rentalId, serviceIds: ss.map((s) => s.id) },
      status: 'pendente',
    })
  }
  // 3) atrasados, por cliente
  const odBy = new Map<string, typeof data.charges>()
  for (const ch of data.charges.filter((x) => x.status === 'atrasada')) odBy.set(ch.clientId, [...(odBy.get(ch.clientId) ?? []), ch])
  for (const [clientId, cs] of odBy) {
    const c = L.client(clientId)
    const value = Math.round(cs.reduce((a, x) => a + x.value, 0) * 100) / 100
    const oldest = cs.map((x) => x.dueAt).sort()[0]
    out.push({
      id: `sug-atraso-${clientId}`,
      kind: 'lembrar_atraso',
      title: `Lembrar ${c.name} do pagamento em atraso`,
      value,
      detail: `${cs.length === 1 ? '1 cobrança vencida' : cs.length + ' cobranças vencidas'}, a mais antiga em ${formatDate(oldest)} (${diffDays(oldest, today)} dias).`,
      draftMessage: `Olá, ${firstName(c.contacts[0]?.name ?? c.name)}! Aqui é da ${data.settings.company.name}. Não encontramos o pagamento de ${cs.map((x) => `${x.code} (${formatMoney(x.value)}, venceu em ${formatDate(x.dueAt)})`).join(', ')}. Se já pagou, envie o comprovante por aqui. Se precisar de ajuda para regularizar, é só falar.`,
      payload: { clientId, chargeIds: cs.map((x) => x.id) },
      status: 'pendente',
    })
  }
  // 4) rota a redistribuir e 5) aviso ao cliente do serviço atrasado
  const teams = mapById(data.teams)
  for (const rr of computeReroute(data, today)) {
    out.push({
      id: `sug-rota-${rr.serviceId}`,
      kind: 'redistribuir_rota',
      title: `Passar ${rr.rentalTitle} para a ${teams.get(rr.toTeamId)!.name}`,
      detail: `${rr.reason} Economiza cerca de ${rr.savedMinutes} min de espera.`,
      payload: { moves: [{ serviceId: rr.serviceId, toTeamId: rr.toTeamId, newOrder: rr.newOrder }] },
      status: 'pendente',
    })
  }
  for (const s of data.services.filter((x) => dayOf(x.start) === today && x.status === 'atrasado')) {
    const r = L.rental(s.rentalId)
    const c = L.client(s.clientId)
    out.push({
      id: `sug-msg-${s.id}`,
      kind: 'mensagem_cliente',
      title: `Avisar ${c.name} sobre o atraso`,
      detail: `O serviço em ${r.title} estava previsto para ${new Date(s.start).toTimeString().slice(0, 5)}.`,
      draftMessage: `Olá, ${firstName(r.contact.name)}! Aqui é da ${data.settings.company.name}. Nossa equipe está um pouco atrasada e deve chegar em ${r.title} em até 40 minutos. Pedimos desculpas pelo transtorno.`,
      payload: { serviceId: s.id, clientId: c.id },
      status: 'pendente',
    })
  }
  return out
}

const ORDER: Record<SuggestionKind, number> = { redistribuir_rota: 0, mensagem_cliente: 1, cobrar_avaria: 2, faturar_extra: 3, lembrar_atraso: 4 }

/** Sugestões pendentes (maior valor primeiro; rota urgente antes) e as últimas já resolvidas */
export function listSuggestions(): Promise<CopilotSuggestion[]> {
  return call(() => {
    const data = getData()
    const resolved = new Set(data.suggestions.map((s) => s.id))
    const pending = generate(data).filter((s) => !resolved.has(s.id))
    pending.sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || (b.value ?? 0) - (a.value ?? 0))
    return [...pending, ...[...data.suggestions].reverse().slice(0, 10)]
  })
}

function findPending(id: string): CopilotSuggestion {
  const data = getData()
  const s = generate(data).find((x) => x.id === id)
  if (!s) throw new ServiceError('Essa sugestão não está mais disponível.')
  if (data.suggestions.some((x) => x.id === id)) throw new ServiceError('Essa sugestão já foi tratada.')
  return s
}

/** Executa a ação da sugestão pelos outros serviços (cobrar avaria, faturar extra, lembrete, mover rota, avisar cliente) */
export function approveSuggestion(id: string): Promise<CopilotSuggestion> {
  return call(async () => {
    const s = findPending(id)
    await inner(async () => {
      const p = s.payload as Record<string, any>
      if (s.kind === 'cobrar_avaria') {
        const charges = await chargeDamage(p.damageIds as string[])
        for (const c of charges) await sendCharge(c.id, { via: 'whatsapp', method: 'pix' })
      } else if (s.kind === 'faturar_extra') {
        const c = await billExtras(p.rentalId as string)
        await sendCharge(c.id, { via: 'whatsapp', method: c.method })
      } else if (s.kind === 'lembrar_atraso') {
        for (const cid of p.chargeIds as string[]) await sendReminder(cid, 'whatsapp')
      } else if (s.kind === 'redistribuir_rota') {
        for (const m of p.moves as { serviceId: string; toTeamId: string; newOrder: number }[]) await moveService(m.serviceId, { teamId: m.toTeamId, order: m.newOrder })
      } else if (s.kind === 'mensagem_cliente') {
        const data = getData()
        const ids = newIds()
        commit({ notifications: [{ id: ids.next('ntf'), kind: 'copiloto', title: 'Mensagem enviada ao cliente', text: s.draftMessage ?? '', at: demoNowISO(), read: true }, ...data.notifications], seq: ids.seq() })
      }
    })
    const done: CopilotSuggestion = { ...s, status: 'aprovada' }
    const data = getData()
    commit({ suggestions: [...data.suggestions, done] })
    return done
  })
}

export function dismissSuggestion(id: string): Promise<CopilotSuggestion> {
  return call(() => {
    const s = findPending(id)
    const done: CopilotSuggestion = { ...s, status: 'dispensada' }
    commit({ suggestions: [...getData().suggestions, done] })
    return done
  })
}

/**
 * Texto de mensagem pronto. refId depende do tipo: cobrar_avaria = id da avaria, faturar_extra = id da locação,
 * lembrar_atraso = id da cobrança, redistribuir_rota e mensagem_cliente = id do serviço.
 */
export function draftMessage(kind: SuggestionKind, refId: string): Promise<string> {
  return call(() => {
    const data = getData()
    const L = lookup(data)
    const co = data.settings.company.name
    if (kind === 'cobrar_avaria') {
      const d = data.damages.find((x) => x.id === refId)
      if (!d) throw new ServiceError('Avaria não encontrada.')
      const c = L.client(d.clientId)
      return whatsDamage(c.name, firstName(c.contacts[0]?.name ?? c.name), [`${d.kind} (${L.unit(d.unitId).code})`], d.value)
    }
    if (kind === 'faturar_extra') {
      const r = L.rental(refId)
      const c = L.client(r.clientId)
      const ss = data.services.filter((s) => s.rentalId === refId && s.extra && s.status === 'concluido' && !s.extraBilled)
      const v = ss.reduce((a, s) => a + (s.extraValue ?? 0), 0)
      return `Olá, ${firstName(c.contacts[0]?.name ?? c.name)}! Aqui é da ${co}. Fizemos ${ss.length} ${ss.length === 1 ? 'serviço extra' : 'serviços extras'} em ${r.title}, fora do contrato, no total de ${formatMoney(Math.round(v * 100) / 100)}. Vou enviar a cobrança por Pix.`
    }
    if (kind === 'lembrar_atraso') {
      const ch = data.charges.find((x) => x.id === refId)
      if (!ch) throw new ServiceError('Cobrança não encontrada.')
      const c = L.client(ch.clientId)
      return `Olá, ${firstName(c.contacts[0]?.name ?? c.name)}! Aqui é da ${co}. Não encontramos o pagamento de ${ch.code} (${formatMoney(ch.value)}, venceu em ${formatDate(ch.dueAt)}). Se já pagou, envie o comprovante por aqui. Se precisar de ajuda para regularizar, é só falar.`
    }
    const s = data.services.find((x) => x.id === refId)
    if (!s) throw new ServiceError('Serviço não encontrado.')
    const r = L.rental(s.rentalId)
    if (kind === 'redistribuir_rota') return `Equipe, a ${data.teams.find((t) => t.id === s.teamId)?.name ?? 'equipe'} está atrasada. Vamos passar ${r.title} (${r.address}) para outra equipe mais perto. Confirmem no app quando chegarem.`
    return `Olá, ${firstName(r.contact.name)}! Aqui é da ${co}. Nossa equipe está um pouco atrasada e deve chegar em ${r.title} em até 40 minutos. Pedimos desculpas pelo transtorno.`
  })
}
