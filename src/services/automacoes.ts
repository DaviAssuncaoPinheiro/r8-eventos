/*
  Automações de verdade: o sistema trabalha sozinho em cima dos serviços existentes.
  Cada automação tem um gatilho e uma ação. As executadas daqui (`runAutomationsNow`, `simulateNextRun`) chamam
  os serviços reais: cobrar avaria, faturar extra, lembrete da régua e redistribuição de rota.
  Estatísticas ("mês") = últimos 30 dias do histórico. Tudo é derivado do histórico, nada fica fixo.
*/
import { commit, getData, newIds } from '@/data/db'
import { addDays, dayOf, demoNow, demoNowISO, diffDays, minutesOf, today as todayFn } from '@/domain/dates'
import { AUTOMATION_ACTIONS, AUTOMATION_CHANNELS, AUTOMATION_TRIGGERS, actionLabel, minutesSavedFor, triggerLabel, type CatalogItem } from '@/domain/automations'
import type { Automation, AutomationChannel, AutomationRecord, AutomationRun, Channel, DbData, ISODate } from '@/domain/types'
import { call, inner, ServiceError } from './config'
import { lookup, mkNotification } from './common'
import { chargeDamage } from './avarias'
import { billExtras, sendCharge, sendReminder } from './financeiro'
import { applyReroute, computeReroute } from './operacao'

export { AUTOMATION_ACTIONS, AUTOMATION_CHANNELS, AUTOMATION_TRIGGERS }
export type { CatalogItem }

const r2 = (n: number) => Math.round(n * 100) / 100

/* ───────────────────────── Leitura ───────────────────────── */

/** Primeiro dia da janela de "mês" (últimos 30 dias) */
const monthFrom = (today: ISODate) => addDays(today, -30)

export function withStats(rec: AutomationRecord, log: readonly AutomationRun[], today: ISODate = todayFn()): Automation {
  const mine = log.filter((r) => r.automationId === rec.id)
  const month = mine.filter((r) => dayOf(r.at) >= monthFrom(today))
  const last = mine.reduce<string | undefined>((a, r) => (!a || r.at > a ? r.at : a), undefined)
  return {
    ...rec,
    stats: { runsMonth: month.length, moneyMonth: r2(month.reduce((a, r) => a + (r.value ?? 0), 0)), minutesSavedMonth: month.reduce((a, r) => a + r.minutesSaved, 0) },
    lastRunAt: last,
  }
}

/** Automações com estatísticas dos últimos 30 dias e a última execução */
export function listAutomations(): Promise<Automation[]> {
  return call(() => {
    const data = getData()
    return data.automations.map((a) => withStats(a, data.automationLog))
  })
}

export function toggleAutomation(id: string, enabled: boolean): Promise<Automation> {
  return call(() => {
    const data = getData()
    const a = data.automations.find((x) => x.id === id)
    if (!a) throw new ServiceError('Automação não encontrada.')
    commit({ automations: data.automations.map((x) => (x.id === id ? { ...x, enabled } : x)) })
    return withStats({ ...a, enabled }, getData().automationLog)
  })
}

export interface NewAutomationInput {
  name: string
  triggerKind: string
  actionKind: string
  channel: AutomationChannel
  params?: Record<string, string | number | boolean>
}

/** Cria uma automação própria (ligada). Gatilhos e ações vêm de AUTOMATION_TRIGGERS e AUTOMATION_ACTIONS. */
export function createAutomation(input: NewAutomationInput): Promise<Automation> {
  return call(() => {
    const data = getData()
    if (!input.name.trim()) throw new ServiceError('Dê um nome para a automação.')
    if (!AUTOMATION_TRIGGERS.some((t) => t.kind === input.triggerKind)) throw new ServiceError('Escolha um gatilho.')
    if (!AUTOMATION_ACTIONS.some((t) => t.kind === input.actionKind)) throw new ServiceError('Escolha uma ação.')
    if (!AUTOMATION_CHANNELS.some((c) => c.value === input.channel)) throw new ServiceError('Escolha por onde a automação avisa.')
    const ids = newIds()
    const rec: AutomationRecord = {
      id: ids.next('aut'),
      name: input.name.trim(),
      trigger: { kind: input.triggerKind, label: triggerLabel(input.triggerKind) },
      action: { kind: input.actionKind, label: actionLabel(input.actionKind) },
      channel: input.channel,
      enabled: true,
      builtIn: false,
      params: input.params,
    }
    commit({ automations: [...data.automations, rec], seq: ids.seq() })
    return withStats(rec, getData().automationLog)
  })
}

/** Remove uma automação própria. As de fábrica só podem ser desligadas. */
export function removeAutomation(id: string): Promise<void> {
  return call(() => {
    const data = getData()
    const a = data.automations.find((x) => x.id === id)
    if (!a) throw new ServiceError('Automação não encontrada.')
    if (a.builtIn) throw new ServiceError('As automações de fábrica não podem ser removidas. Desligue a que não quiser.')
    commit({ automations: data.automations.filter((x) => x.id !== id) })
  })
}

/** Execuções mais recentes primeiro */
export function getAutomationLog(opts: { limit?: number; automationId?: string } = {}): Promise<AutomationRun[]> {
  return call(() => {
    const { limit = 40, automationId } = opts
    return getData()
      .automationLog.filter((r) => !automationId || r.automationId === automationId)
      .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))
      .slice(0, limit)
  })
}

export interface AutomationSummary {
  runsToday: number
  /** execuções nos últimos 30 dias */
  runsMonth: number
  /** dinheiro atribuído às execuções dos últimos 30 dias */
  moneyMonth: number
  /** horas de trabalho manual poupadas nos últimos 30 dias */
  hoursSavedMonth: number
  activeCount: number
  totalCount: number
}

export function calcAutomationSummary(data: DbData, today: ISODate = todayFn()): AutomationSummary {
  const month = data.automationLog.filter((r) => dayOf(r.at) >= monthFrom(today))
  return {
    runsToday: data.automationLog.filter((r) => dayOf(r.at) === today).length,
    runsMonth: month.length,
    moneyMonth: r2(month.reduce((a, r) => a + (r.value ?? 0), 0)),
    hoursSavedMonth: Math.round((month.reduce((a, r) => a + r.minutesSaved, 0) / 60) * 10) / 10,
    activeCount: data.automations.filter((a) => a.enabled).length,
    totalCount: data.automations.length,
  }
}

export function getAutomationSummary(): Promise<AutomationSummary> {
  return call(() => calcAutomationSummary(getData()))
}

/* ───────────────────────── Pendências reais ───────────────────────── */

type Work =
  | { kind: 'avaria'; since: ISODate; damageIds: string[]; clientId: string }
  | { kind: 'extra'; since: ISODate; rentalId: string }
  | { kind: 'atraso'; since: ISODate; chargeId: string }
  | { kind: 'rota'; since: ISODate; serviceId: string; toTeamId: string; newOrder: number; lateMin: number }

/** Primeira automação ligada com este gatilho e esta ação */
function owner(data: DbData, trigger: string, action: string): AutomationRecord | undefined {
  return data.automations.find((a) => a.enabled && a.trigger.kind === trigger && a.action.kind === action)
}

/** Canal da régua para um lembrete: o passo ligado mais próximo dos dias de atraso (e-mail ou portal) */
function channelFor(data: DbData, daysLate: number): Channel {
  const steps = data.settings.dunning.filter((s) => s.enabled && s.dayOffset <= Math.max(0, daysLate)).sort((a, b) => b.dayOffset - a.dayOffset)
  return steps[0]?.channel === 'portal' ? 'portal' : 'email'
}

/** O que está esperando as automações ligadas (mais antigo primeiro, dentro de cada tipo) */
export function pendingWork(data: DbData, today: ISODate = todayFn(), now: Date = demoNow()): Work[] {
  const out: Work[] = []
  if (owner(data, 'avaria_registrada', 'cobrar_avaria')) {
    const by = new Map<string, typeof data.damages>()
    for (const d of data.damages.filter((x) => x.status === 'registrada' && !x.chargeId).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) by.set(d.clientId, [...(by.get(d.clientId) ?? []), d])
    for (const [clientId, ds] of by) out.push({ kind: 'avaria', since: ds[0].date, damageIds: ds.map((d) => d.id), clientId })
  }
  if (owner(data, 'extra_concluido', 'incluir_na_fatura')) {
    const by = new Map<string, ISODate>()
    for (const s of data.services.filter((x) => x.extra && x.status === 'concluido' && !x.extraBilled)) {
      const d = dayOf(s.start)
      const cur = by.get(s.rentalId)
      if (!cur || d < cur) by.set(s.rentalId, d)
    }
    for (const [rentalId, since] of by) out.push({ kind: 'extra', since, rentalId })
  }
  if (owner(data, 'cobranca_vencida', 'enviar_lembrete')) {
    for (const c of data.charges.filter((x) => x.status === 'atrasada' && !x.reminders.some((m) => dayOf(m.at) === today)).sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.code.localeCompare(b.code))) out.push({ kind: 'atraso', since: c.dueAt, chargeId: c.id })
  }
  const rota = owner(data, 'equipe_atrasada', 'redistribuir_rota')
  if (rota) {
    const minutes = Number(rota.params?.minutes ?? 20)
    const nowMin = now.getHours() * 60 + now.getMinutes()
    for (const s of computeReroute(data, today, now)) {
      const svc = data.services.find((x) => x.id === s.serviceId)!
      const lateMin = nowMin - minutesOf(svc.start)
      if (lateMin > minutes) out.push({ kind: 'rota', since: dayOf(svc.start), serviceId: s.serviceId, toTeamId: s.toTeamId, newOrder: s.newOrder, lateMin })
    }
  }
  return out
}

export interface AutomationPending {
  avarias: number
  extras: number
  atrasadas: number
  rotas: number
  total: number
}

/** Quantas pendências as automações ligadas têm agora (para mostrar "N ações esperando") */
export function getAutomationPending(): Promise<AutomationPending> {
  return call(() => {
    const w = pendingWork(getData())
    const n = (k: Work['kind']) => w.filter((x) => x.kind === k).length
    return { avarias: n('avaria'), extras: n('extra'), atrasadas: n('atraso'), rotas: n('rota'), total: w.length }
  })
}

/* ───────────────────────── Execução ───────────────────────── */

interface Outcome {
  run: Omit<AutomationRun, 'id' | 'at'>
  note?: { title: string; text: string; kind: 'servico' | 'copiloto'; ref?: AutomationRun['ref'] }
}

async function execute(w: Work): Promise<Outcome> {
  const data0 = getData()
  const L = lookup(data0)
  if (w.kind === 'avaria') {
    const a = owner(data0, 'avaria_registrada', 'cobrar_avaria')!
    const charges = await chargeDamage(w.damageIds)
    const c = charges[0]
    const sent = await sendCharge(c.id, { via: 'email', method: 'pix' })
    const n = w.damageIds.length
    return { run: { automationId: a.id, automationName: a.name, text: `${n > 1 ? `${n} avarias cobradas` : 'Avaria cobrada'} de ${L.client(w.clientId).name}: ${sent.code} enviada por e-mail`, value: sent.value, minutesSaved: minutesSavedFor(a.action.kind) + 3 * (n - 1), ref: { type: 'charge', id: sent.id } } }
  }
  if (w.kind === 'extra') {
    const a = owner(data0, 'extra_concluido', 'incluir_na_fatura')!
    const c = await billExtras(w.rentalId)
    const sent = await sendCharge(c.id, { via: 'email', method: c.method })
    return { run: { automationId: a.id, automationName: a.name, text: `Extras de ${L.client(sent.clientId).name} faturados: ${sent.code} enviada por e-mail`, value: sent.value, minutesSaved: minutesSavedFor(a.action.kind), ref: { type: 'charge', id: sent.id } } }
  }
  if (w.kind === 'atraso') {
    const a = owner(data0, 'cobranca_vencida', 'enviar_lembrete')!
    const c0 = data0.charges.find((x) => x.id === w.chargeId)!
    const late = Math.max(0, diffDays(c0.dueAt, todayFn()))
    const channel = channelFor(data0, late)
    const c = await sendReminder(c0.id, channel)
    const client = L.client(c.clientId).name
    return { run: { automationId: a.id, automationName: a.name, text: `${channel === 'portal' ? 'Aviso no portal de' : 'Lembrete por e-mail para'} ${client}: ${c.code} venceu há ${late} dias`, minutesSaved: minutesSavedFor(a.action.kind), ref: { type: 'charge', id: c.id } } }
  }
  const a = owner(data0, 'equipe_atrasada', 'redistribuir_rota')!
  const svc = data0.services.find((x) => x.id === w.serviceId)!
  const from = data0.teams.find((t) => t.id === svc.teamId)?.name ?? 'Equipe'
  const to = data0.teams.find((t) => t.id === w.toTeamId)?.name ?? 'outra equipe'
  const r = L.rental(svc.rentalId)
  await applyReroute({ serviceId: w.serviceId, toTeamId: w.toTeamId, newOrder: w.newOrder })
  return {
    run: { automationId: a.id, automationName: a.name, text: `${from} atrasada ${w.lateMin} min: ${r.title} passou para ${to} e a equipe foi avisada no app`, minutesSaved: minutesSavedFor(a.action.kind), ref: { type: 'service', id: svc.id } },
    note: { title: 'Rota redistribuída', text: `${r.title} passou de ${from} para ${to}. Avise a equipe no app.`, kind: 'servico', ref: { type: 'service', id: svc.id } },
  }
}

/** Grava as execuções no histórico, em horários crescentes (cada uma 20 s depois da anterior) */
function record(outcomes: Outcome[]): AutomationRun[] {
  const data = getData()
  const ids = newIds()
  let t = Math.max(demoNow().getTime(), ...data.automationLog.map((r) => new Date(r.at).getTime()))
  const runs: AutomationRun[] = outcomes.map((o) => {
    t += 20000
    return { ...o.run, id: ids.next('run'), at: new Date(t).toISOString() }
  })
  const notes = outcomes.filter((o) => o.note).map((o) => mkNotification(ids, { kind: o.note!.kind, title: o.note!.title, text: o.note!.text, ref: o.note!.ref as never }))
  commit({ automationLog: [...data.automationLog, ...runs], notifications: [...notes, ...data.notifications], seq: ids.seq() })
  return runs
}

/**
 * Executa de verdade tudo o que está pendente para as automações LIGADAS: cobra avarias registradas (e envia),
 * fatura extras, manda o lembrete das atrasadas ainda sem lembrete hoje e redistribui a rota se há equipe atrasada.
 * Cada execução vai para o histórico. Rodar de novo em seguida não repete o que já foi feito.
 */
export function runAutomationsNow(): Promise<AutomationRun[]> {
  return call(async () => {
    const outcomes: Outcome[] = []
    await inner(async () => {
      const first = pendingWork(getData()).filter((w) => w.kind !== 'rota')
      for (const w of first) outcomes.push(await execute(w))
      // rota: cada movimento muda a agenda, então a próxima sugestão é recalculada
      for (let guard = 0; guard < 12; guard++) {
        const next = pendingWork(getData()).find((w) => w.kind === 'rota')
        if (!next) break
        outcomes.push(await execute(next))
      }
    })
    return outcomes.length ? record(outcomes) : []
  })
}

/** Para o "ao vivo": executa UMA pendência real (a mais antiga), grava no histórico e devolve a execução, ou `null` se não há nada */
export function simulateNextRun(): Promise<AutomationRun | null> {
  return call(async () => {
    const work = pendingWork(getData()).sort((a, b) => a.since.localeCompare(b.since))
    const w = work[0]
    if (!w) return null
    let outcome: Outcome | undefined
    await inner(async () => {
      outcome = await execute(w)
    })
    return record([outcome!])[0]
  })
}

