// Automações da semente: as 9 de fábrica e ~120 execuções dos últimos 30 dias, todas apoiadas em registros que existem
// (cobranças, lembretes, locações, unidades e serviços citados estão no estado). Sem sorteio: tudo sai dos dados.
import { addDays, addMonths, atTime, dayOf, diffDays, monthEnd, monthKey, monthLabelLong } from '@/domain/dates'
import { AUTO, builtInAutomations, minutesSavedFor } from '@/domain/automations'
import type { AutomationRecord, AutomationRun, Charge, Client, EquipmentType, ISODate, ISODateTime, Rental, Service, Team, Unit } from '@/domain/types'
import { formatMoney } from '@/lib/format'

export interface AutomationSeedEnv {
  today: ISODate
  rentals: Rental[]
  services: Service[]
  charges: Charge[]
  units: Unit[]
  types: EquipmentType[]
  clients: Client[]
  teams: Team[]
}

interface Draft {
  auto: string
  at: ISODateTime
  text: string
  value?: number
  ref?: AutomationRun['ref']
}

/** Janela (dias antes do vencimento) em que a régua preventiva já rodou e deixou lembrete gravado na cobrança */
const PREVENTIVE_DAYS = 18
const MAX_DELAY_RUNS = 16
const MAX_REPORT_RUNS = 24

export function buildAutomationHistory(env: AutomationSeedEnv): { automations: AutomationRecord[]; automationLog: AutomationRun[] } {
  const { today, rentals, services, charges, units, types, clients, teams } = env
  const D = (n: number) => addDays(today, n)
  const nowIso = atTime(today, 10 * 60 + 40)
  const nowMs = new Date(nowIso).getTime()
  const from = D(-30)
  const cname = new Map(clients.map((c) => [c.id, c.name]))
  const typeById = new Map(types.map((t) => [t.id, t]))
  const teamName = new Map(teams.map((t) => [t.id, t.name]))
  const automations = builtInAutomations()
  const drafts: Draft[] = []
  const inWindow = (iso: string) => dayOf(iso) >= from && new Date(iso).getTime() <= nowMs

  /* ── régua de cobrança: lembretes de verdade gravados nas cobranças ── */
  const regua = charges.filter((c) => (c.kind === 'mensalidade' || c.kind === 'locacao') && c.status !== 'rascunho' && c.status !== 'cancelada')
  regua.forEach((c, i) => {
    if (c.status !== 'aberta' && c.status !== 'paga') return
    const pre = addDays(c.dueAt, -3)
    const early = !!c.paidAt && c.paidAt < pre
    if (!early && pre >= D(-PREVENTIVE_DAYS) && pre <= today && pre >= c.issuedAt) c.reminders.push({ at: atTime(pre, 9 * 60 + (i % 20) * 3), channel: 'email' })
    if (c.status === 'aberta' && c.dueAt === today) c.reminders.push({ at: atTime(today, 8 * 60 + 30 + (i % 5)), channel: 'email' })
  })
  // hoje a régua já passou por quatro das seis atrasadas; as outras duas ficam para a automação rodar
  charges
    .filter((c) => c.status === 'atrasada')
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.code.localeCompare(b.code))
    .slice(0, 4)
    .forEach((c, i) => c.reminders.push({ at: atTime(today, 8 * 60 + 15 + 10 * i), channel: i === 1 ? 'portal' : 'email' }))
  for (const c of charges) c.reminders.sort((a, b) => a.at.localeCompare(b.at))

  for (const c of charges) {
    const client = cname.get(c.clientId) ?? ''
    for (const r of c.reminders) {
      if (!inWindow(r.at)) continue
      const day = dayOf(r.at)
      const rel = day < c.dueAt ? `vence em ${diffDays(day, c.dueAt)} dias` : day === c.dueAt ? 'vence hoje' : `venceu há ${diffDays(c.dueAt, day)} dias`
      const text = r.channel === 'portal' ? `Aviso no portal de ${client}: ${c.code} ${rel}` : `Lembrete por e-mail para ${client}: ${c.code} ${rel}`
      const recovered = day > c.dueAt && c.status === 'paga' && !!c.paidAt && c.paidAt >= day
      drafts.push({ auto: AUTO.atraso, at: r.at, text, value: recovered ? c.value : undefined, ref: { type: 'charge', id: c.id } })
    }
    /* avarias cobradas e extras faturados e enviados */
    if (c.sentAt && inWindow(c.sentAt) && c.status !== 'rascunho' && c.status !== 'cancelada') {
      if (c.kind === 'avaria') drafts.push({ auto: AUTO.avaria, at: c.sentAt, text: `Avaria cobrada de ${client}: ${c.code} enviada por ${c.sentVia === 'portal' ? 'aviso no portal' : 'e-mail'}`, value: c.value, ref: { type: 'charge', id: c.id } })
      else if (c.kind === 'extra') drafts.push({ auto: AUTO.extra, at: c.sentAt, text: `Extras de ${client} faturados: ${c.code}`, value: c.value, ref: { type: 'charge', id: c.id } })
    }
  }

  /* ── locação confirmada: agenda montada (entrega, limpezas, retirada) ── */
  for (const r of rentals) {
    if (r.status === 'orcamento' || r.status === 'cancelada') continue
    const h = r.history.find((x) => x.text.startsWith('Orçamento aprovado'))
    if (!h) continue
    const ms = Math.min(new Date(h.at).getTime() + 60000, nowMs - 3 * 60000)
    const at = new Date(ms).toISOString()
    if (!inWindow(at)) continue
    const n = services.filter((s) => s.rentalId === r.id && s.type === 'limpeza' && s.status !== 'cancelado').length
    const parts = n ? `entrega, ${n} ${n === 1 ? 'limpeza' : 'limpezas'} e retirada` : 'entrega e retirada'
    drafts.push({ auto: AUTO.agenda, at, text: `Agenda de ${r.code} montada para ${cname.get(r.clientId)}: ${parts}`, ref: { type: 'rental', id: r.id } })
    r.history.push({ at, text: 'Agenda gerada automaticamente: entrega, limpezas e retirada' })
    r.history.sort((a, b) => a.at.localeCompare(b.at))
  }

  /* ── contrato vence em 15 dias: renovação proposta pelo portal ── */
  for (const r of rentals) {
    if (r.kind !== 'obra' || !['em_campo', 'retirada', 'faturada'].includes(r.status)) continue
    const run = addDays(r.end, -15)
    if (run < from || run > today) continue
    const at = atTime(run, 8 * 60 + 15)
    if (new Date(at).getTime() > nowMs) continue
    drafts.push({ auto: AUTO.renovacao, at, text: `Renovação de ${r.code} proposta no portal de ${cname.get(r.clientId)}: o contrato vence em 15 dias`, ref: { type: 'rental', id: r.id } })
    r.history.push({ at, text: 'Proposta de renovação enviada pelo portal do cliente' })
    r.history.sort((a, b) => a.at.localeCompare(b.at))
  }

  /* ── unidade parada há 30 dias: oportunidade com preço promocional ── */
  units
    .filter((u) => u.status === 'disponivel' && u.idleSince)
    .sort((a, b) => a.idleSince!.localeCompare(b.idleSince!) || a.code.localeCompare(b.code))
    .forEach((u, i) => {
      const run = addDays(u.idleSince!, 30)
      if (run < from || run > today) return
      const at = atTime(run, 6 * 60 + 45 + i)
      if (new Date(at).getTime() > nowMs) return
      const promo = Math.floor((typeById.get(u.typeId)?.monthlyRate ?? 0) * 0.9) + 0.9
      drafts.push({ auto: AUTO.parado, at, text: `${u.code} parada há 30 dias: marcada como oportunidade, preço promocional ${formatMoney(promo)} por mês`, ref: { type: 'unit', id: u.id } })
    })

  /* ── equipe atrasada mais de 20 min: rota reorganizada e equipe avisada ── */
  const rentalById = new Map(rentals.map((r) => [r.id, r]))
  services
    .filter((s) => s.status === 'concluido' && s.report && dayOf(s.start) >= from && dayOf(s.start) <= today)
    .map((s) => ({ s, delay: Math.round((new Date(s.report!.startedAt).getTime() - new Date(s.start).getTime()) / 60000) }))
    .filter((x) => x.delay > 20 && new Date(x.s.start).getTime() + 21 * 60000 <= nowMs)
    .sort((a, b) => b.s.start.localeCompare(a.s.start) || a.s.id.localeCompare(b.s.id))
    .slice(0, MAX_DELAY_RUNS)
    .forEach(({ s, delay }) => {
      const at = new Date(new Date(s.start).getTime() + 21 * 60000).toISOString()
      drafts.push({ auto: AUTO.rota, at, text: `${teamName.get(s.teamId) ?? 'Equipe'} atrasou ${delay} min em ${rentalById.get(s.rentalId)?.title ?? 'serviço'}: paradas seguintes reordenadas e equipe avisada no app`, ref: { type: 'service', id: s.id } })
    })

  /* ── fim do mês: relatório do mês anterior publicado no portal de cada cliente ── */
  const prev = addMonths(monthKey(today), -1)
  const prevEnd = monthEnd(prev)
  if (prevEnd >= D(-35)) {
    const perClient = new Map<string, number>()
    for (const s of services) if (s.status === 'concluido' && s.report && monthKey(dayOf(s.start)) === prev) perClient.set(s.clientId, (perClient.get(s.clientId) ?? 0) + 1)
    ;[...perClient.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_REPORT_RUNS)
      .forEach(([clientId], i) => {
        drafts.push({ auto: AUTO.relatorio, at: atTime(prevEnd, 18 * 60 + 5 + i), text: `Relatório de ${monthLabelLong(prev)} publicado no portal de ${cname.get(clientId)}`, ref: { type: 'client', id: clientId } })
      })
  }

  drafts.sort((a, b) => a.at.localeCompare(b.at) || a.text.localeCompare(b.text))
  const actionOf = new Map(automations.map((a) => [a.id, a]))
  const automationLog: AutomationRun[] = drafts.map((d, i) => ({
    id: `run-${String(i + 1).padStart(4, '0')}`,
    automationId: d.auto,
    automationName: actionOf.get(d.auto)!.name,
    at: d.at,
    text: d.text,
    value: d.value,
    minutesSaved: minutesSavedFor(actionOf.get(d.auto)!.action.kind),
    ref: d.ref,
  }))
  return { automations, automationLog }
}
