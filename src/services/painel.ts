/*
  Painel de Dinheiro. TODOS os números saem dos dados (somas reais).
  As funções `calc*` e `computeMoneyPanel` são puras (recebem o estado) e servem para teste.
*/
import { getData } from '@/data/db'
import { addDays, addMonths, dayOf, diffDays, monthKey, monthLabel, today as todayFn } from '@/domain/dates'
import { computeRecoveredMoney } from '@/domain/recovery'
import type { DbData, ISODate, Service, Team } from '@/domain/types'
import { call } from './config'
import { mapById } from './common'

export type TeamNowStatus = 'atrasada' | 'em_servico' | 'a_caminho' | 'concluida' | 'aguardando' | 'sem_servico'

export interface TeamNow {
  team: Team
  /** serviço em andamento ou a caminho agora */
  current?: Service
  done: number
  total: number
  status: TeamNowStatus
}

export interface RecommendedAction {
  id: string
  kind: 'redistribuir_rota' | 'cobrar_avarias' | 'faturar_extras' | 'cobrar_atrasados' | 'alugar_parados' | 'confirmar_orcamentos'
  title: string
  value?: number
  count: number
  cta: string
  /** módulo de destino */
  target: 'agenda' | 'avarias' | 'locacoes' | 'financeiro' | 'equipamentos'
}

export interface MoneyPanel {
  /** valor mensal de tabela dos equipamentos em campo hoje; deltaPct em % contra 7 dias atrás */
  rentedToday: { value: number; units: number; totalUnits: number; deltaPct: number }
  /** valor mensal de tabela dos equipamentos disponíveis parados */
  idle: { monthlyValue: number; units: number; over30d: number }
  uncollectedDamages: { value: number; count: number; oldestDate?: ISODate }
  unbilledExtras: { value: number; count: number; rentals: number }
  /** abertas + atrasadas */
  receivable: { value: number; count: number }
  overdue: { value: number; count: number; clients: number }
  /** últimos 12 meses (o último é o mês atual, parcial), por data de pagamento */
  revenueByMonth: { month: string; label: string; value: number }[]
  occupancy: { inField: number; cleaning: number; maintenance: number; idle: number; total: number; pct: number }
  teamsNow: TeamNow[]
  actions: RecommendedAction[]
  /** dinheiro que o sistema recuperou no mês atual (ver getRecoveredMoney) */
  recovered: { month: string; total: number }
  /** execuções das automações hoje */
  automations: { runsToday: number }
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** Ids das unidades em campo em um dia (hoje: só locações em campo; antes de hoje: pelas datas das locações) */
export function fieldUnitIdsOn(data: DbData, day: ISODate, today: ISODate = todayFn()): string[] {
  const out: string[] = []
  for (const r of data.rentals) {
    const on = day >= today ? r.status === 'em_campo' : (r.status === 'em_campo' || r.status === 'retirada' || r.status === 'faturada') && r.start <= day && day <= r.end
    if (on) for (const it of r.items) out.push(...it.unitIds)
  }
  return out
}

export function calcRentedToday(data: DbData, today: ISODate = todayFn()) {
  const types = mapById(data.types)
  const units = mapById(data.units)
  const value = (ids: string[]) => r2(ids.reduce((a, id) => a + (types.get(units.get(id)!.typeId)?.monthlyRate ?? 0), 0))
  const nowIds = fieldUnitIdsOn(data, today, today)
  const before = value(fieldUnitIdsOn(data, addDays(today, -7), today))
  const v = value(nowIds)
  const deltaPct = before > 0 ? Math.round(((v - before) / before) * 1000) / 10 : 0
  return { value: v, units: nowIds.length, totalUnits: data.units.length, deltaPct }
}

export function calcIdle(data: DbData, today: ISODate = todayFn()) {
  const types = mapById(data.types)
  const idle = data.units.filter((u) => u.status === 'disponivel')
  return {
    monthlyValue: r2(idle.reduce((a, u) => a + (types.get(u.typeId)?.monthlyRate ?? 0), 0)),
    units: idle.length,
    over30d: idle.filter((u) => u.idleSince && diffDays(u.idleSince, today) > 30).length,
  }
}

export function calcUncollectedDamages(data: DbData) {
  const list = data.damages.filter((d) => d.status === 'registrada' && !d.chargeId)
  const oldest = list.map((d) => d.date).sort()[0]
  return { value: r2(list.reduce((a, d) => a + d.value, 0)), count: list.length, oldestDate: oldest }
}

export function calcUnbilledExtras(data: DbData) {
  const list = data.services.filter((s) => s.extra && s.status === 'concluido' && !s.extraBilled)
  return { value: r2(list.reduce((a, s) => a + (s.extraValue ?? 0), 0)), count: list.length, rentals: new Set(list.map((s) => s.rentalId)).size }
}

export function calcReceivable(data: DbData) {
  const list = data.charges.filter((c) => c.status === 'aberta' || c.status === 'atrasada')
  return { value: r2(list.reduce((a, c) => a + c.value, 0)), count: list.length }
}

export function calcOverdue(data: DbData) {
  const list = data.charges.filter((c) => c.status === 'atrasada')
  return { value: r2(list.reduce((a, c) => a + c.value, 0)), count: list.length, clients: new Set(list.map((c) => c.clientId)).size }
}

export function calcRevenueByMonth(data: DbData, today: ISODate = todayFn()) {
  const cur = monthKey(today)
  const out: { month: string; label: string; value: number }[] = []
  for (let i = -11; i <= 0; i++) {
    const key = addMonths(cur, i)
    const value = r2(data.charges.filter((c) => c.status === 'paga' && c.paidAt && monthKey(c.paidAt) === key).reduce((a, c) => a + c.value, 0))
    out.push({ month: key, label: monthLabel(key), value })
  }
  return out
}

export function calcOccupancy(data: DbData) {
  const count = (s: string) => data.units.filter((u) => u.status === s).length
  const total = data.units.length
  const inField = count('em_campo')
  return { inField, cleaning: count('limpeza'), maintenance: count('manutencao'), idle: count('disponivel'), total, pct: total ? Math.round((inField / total) * 1000) / 10 : 0 }
}

export function calcTeamsNow(data: DbData, today: ISODate = todayFn()): TeamNow[] {
  return data.teams.map((team) => {
    const list = data.services.filter((s) => s.teamId === team.id && dayOf(s.start) === today && s.status !== 'cancelado').sort((a, b) => a.start.localeCompare(b.start))
    const current = list.find((s) => s.status === 'em_andamento') ?? list.find((s) => s.status === 'a_caminho')
    const done = list.filter((s) => s.status === 'concluido').length
    let status: TeamNowStatus
    if (!list.length) status = 'sem_servico'
    else if (list.some((s) => s.status === 'atrasado')) status = 'atrasada'
    else if (current?.status === 'em_andamento') status = 'em_servico'
    else if (current?.status === 'a_caminho') status = 'a_caminho'
    else if (done === list.length) status = 'concluida'
    else status = 'aguardando'
    return { team, current, done, total: list.length, status }
  })
}

export function buildActions(data: DbData, panel: Pick<MoneyPanel, 'uncollectedDamages' | 'unbilledExtras' | 'overdue' | 'idle'>, today: ISODate = todayFn()): RecommendedAction[] {
  const out: RecommendedAction[] = []
  const late = data.services.filter((s) => dayOf(s.start) === today && s.status === 'atrasado')
  if (late.length) out.push({ id: 'act-rota', kind: 'redistribuir_rota', title: 'Redistribuir rota', count: late.length, cta: 'Ver rotas', target: 'agenda' })
  const money: RecommendedAction[] = []
  if (panel.uncollectedDamages.count) money.push({ id: 'act-avarias', kind: 'cobrar_avarias', title: 'Cobrar avarias', value: panel.uncollectedDamages.value, count: panel.uncollectedDamages.count, cta: 'Cobrar', target: 'avarias' })
  if (panel.unbilledExtras.count) money.push({ id: 'act-extras', kind: 'faturar_extras', title: 'Faturar extras', value: panel.unbilledExtras.value, count: panel.unbilledExtras.count, cta: 'Faturar', target: 'financeiro' })
  if (panel.overdue.count) money.push({ id: 'act-atrasados', kind: 'cobrar_atrasados', title: 'Cobrar atrasados', value: panel.overdue.value, count: panel.overdue.count, cta: 'Cobrar', target: 'financeiro' })
  if (panel.idle.over30d) {
    const types = mapById(data.types)
    const v = r2(data.units.filter((u) => u.status === 'disponivel' && u.idleSince && diffDays(u.idleSince, today) > 30).reduce((a, u) => a + (types.get(u.typeId)?.monthlyRate ?? 0), 0))
    money.push({ id: 'act-parados', kind: 'alugar_parados', title: 'Alugar parados', value: v, count: panel.idle.over30d, cta: 'Ver equipamentos', target: 'equipamentos' })
  }
  const orc = data.rentals.filter((r) => r.status === 'orcamento')
  if (orc.length) money.push({ id: 'act-orcamentos', kind: 'confirmar_orcamentos', title: 'Fechar orçamentos', value: r2(orc.reduce((a, r) => a + r.total, 0)), count: orc.length, cta: 'Ver orçamentos', target: 'locacoes' })
  money.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  return [...out, ...money]
}

export function computeMoneyPanel(data: DbData, today: ISODate = todayFn()): MoneyPanel {
  const uncollectedDamages = calcUncollectedDamages(data)
  const unbilledExtras = calcUnbilledExtras(data)
  const overdue = calcOverdue(data)
  const idle = calcIdle(data, today)
  return {
    rentedToday: calcRentedToday(data, today),
    idle,
    uncollectedDamages,
    unbilledExtras,
    receivable: calcReceivable(data),
    overdue,
    revenueByMonth: calcRevenueByMonth(data, today),
    occupancy: calcOccupancy(data),
    teamsNow: calcTeamsNow(data, today),
    actions: buildActions(data, { uncollectedDamages, unbilledExtras, overdue, idle }, today),
    recovered: { month: monthKey(today), total: computeRecoveredMoney(data, monthKey(today), today).total },
    automations: { runsToday: data.automationLog.filter((r) => dayOf(r.at) === today).length },
  }
}

/** Painel de Dinheiro (tela inicial) */
export function getMoneyPanel(): Promise<MoneyPanel> {
  return call(() => computeMoneyPanel(getData()))
}

