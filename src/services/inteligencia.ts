/*
  Inteligência: previsão de caixa, lucro por equipamento, preço sugerido, previsão de demanda,
  dinheiro recuperado e a calculadora de perdas da venda. TUDO sai dos dados (somas reais); as premissas estão
  nas constantes e nos comentários de cada regra.
  As funções `calc*` são puras (recebem o estado) e servem para teste.
*/
import { commit, getData, newIds } from '@/data/db'
import { addDays, diffDays, demoNowISO, monthKey, today as todayFn } from '@/domain/dates'
import { billingCycles, cycleAmount } from '@/domain/planning'
import { computeRecoveredMoney, type RecoveredMoney } from '@/domain/recovery'
import { SYS_PRECO } from '@/domain/automations'
import type { AutomationRun, DbData, EquipmentType, ISODate } from '@/domain/types'
import { formatDate, formatMoney } from '@/lib/format'
import { call, ServiceError } from './config'
import { itemRevenue, overlapDays } from './common'

export type { RecoveredMoney } from '@/domain/recovery'

const r2 = (n: number) => Math.round(n * 100) / 100
const r1 = (n: number) => Math.round(n * 10) / 10
const HOLD = ['em_campo', 'retirada', 'faturada']

type TypeInfo = Pick<EquipmentType, 'id' | 'name' | 'short' | 'photo' | 'group'>
const typeInfo = (t: EquipmentType): TypeInfo => ({ id: t.id, name: t.name, short: t.short, photo: t.photo, group: t.group })

/* ═════════════════════════ Uso dos equipamentos (base de vários cálculos) ═════════════════════════ */

interface TypeUsage {
  type: EquipmentType
  units: number
  /** ocupação dos últimos 30 dias: unidades-dia alugadas / (unidades x 30), em % */
  utilization30: number
  /** unidades em campo na média dos últimos 30 dias */
  avgUnitsRented: number
  revenue6m: number
  idleUnits: number
  idleDaysAvg: number
  /** dias dos últimos 90 em que 90% ou mais da frota estava alugada */
  tightDays90: number
}

function calcUsage(data: DbData, today: ISODate): TypeUsage[] {
  const from30 = addDays(today, -29)
  const from90 = addDays(today, -89)
  const from180 = addDays(today, -179)
  const rentals = data.rentals.filter((r) => HOLD.includes(r.status))
  return data.types.map((t) => {
    const units = data.units.filter((u) => u.typeId === t.id)
    let unitDays30 = 0
    let revenue = 0
    const daily = new Array<number>(90).fill(0)
    for (const r of rentals) {
      for (const it of r.items) {
        if (it.typeId !== t.id) continue
        unitDays30 += overlapDays(r.start, r.end, from30, today) * it.unitIds.length
        revenue += itemRevenue(it, r.start, r.end, from180, today)
        const s = r.start > from90 ? r.start : from90
        const e = r.end < today ? r.end : today
        for (let d = s; d <= e; d = addDays(d, 1)) daily[diffDays(from90, d)] += it.unitIds.length
      }
    }
    const idle = units.filter((u) => u.status === 'disponivel')
    const idleDays = idle.map((u) => (u.idleSince ? Math.max(0, diffDays(u.idleSince, today)) : 0))
    return {
      type: t,
      units: units.length,
      utilization30: units.length ? r1((unitDays30 / (units.length * 30)) * 100) : 0,
      avgUnitsRented: units.length ? unitDays30 / 30 : 0,
      revenue6m: r2(revenue),
      idleUnits: idle.length,
      idleDaysAvg: idle.length ? Math.round(idleDays.reduce((a, b) => a + b, 0) / idle.length) : 0,
      tightDays90: daily.filter((c) => units.length > 0 && c >= 0.9 * units.length).length,
    }
  })
}

/* ═════════════════════════ Previsão de demanda ═════════════════════════ */

/** Peso dos orçamentos na demanda prevista (40%) */
export const QUOTE_WEIGHT = 0.4

export interface DemandDay {
  date: ISODate
  /** locações confirmadas e em campo (unidades) */
  committed: number
  /** orçamentos ponderados em 40% */
  quotes: number
  /** committed + quotes */
  demand: number
}

export interface DemandTypeForecast {
  type: TypeInfo
  /** unidades disponíveis para alugar (fora as em manutenção) */
  stock: number
  daily: DemandDay[]
  /** dias em que a demanda prevista passa do estoque */
  stockoutDays: number
  /** dia de maior demanda */
  peakDay: ISODate
  peakDemand: number
  /** unidades que faltam no pico (0 se o estoque dá) */
  missingUnits: number
}

export interface DemandForecast {
  from: ISODate
  days: ISODate[]
  types: DemandTypeForecast[]
}

export function calcDemandForecast(data: DbData, days: number, today: ISODate = todayFn()): DemandForecast {
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i))
  const types = data.types.map<DemandTypeForecast>((t) => {
    const stock = data.units.filter((u) => u.typeId === t.id && u.status !== 'manutencao').length
    const daily = dates.map<DemandDay>((date) => {
      let committed = 0
      let quotes = 0
      for (const r of data.rentals) {
        if (r.start > date || r.end < date) continue
        const q = r.items.filter((it) => it.typeId === t.id).reduce((a, it) => a + it.qty, 0)
        if (r.status === 'confirmada' || r.status === 'em_campo') committed += q
        else if (r.status === 'orcamento') quotes += q * QUOTE_WEIGHT
      }
      return { date, committed, quotes: r2(quotes), demand: r2(committed + quotes) }
    })
    const peak = daily.reduce((best, d) => (d.demand > best.demand ? d : best), daily[0])
    return {
      type: typeInfo(t),
      stock,
      daily,
      stockoutDays: daily.filter((d) => d.demand > stock).length,
      peakDay: peak.date,
      peakDemand: peak.demand,
      missingUnits: Math.max(0, Math.ceil(peak.demand - stock)),
    }
  })
  return { from: today, days: dates, types }
}

/** Demanda prevista por tipo e por dia contra o estoque (confirmadas e em campo + orçamentos a 40%) */
export function getDemandForecast(days = 30): Promise<DemandForecast> {
  return call(() => calcDemandForecast(getData(), days))
}

/* ═════════════════════════ Preço sugerido ═════════════════════════ */

export interface PriceSuggestion {
  type: TypeInfo
  currentMonthly: number
  currentDaily: number
  /** ocupação dos últimos 30 dias, em % */
  occupancy30d: number
  suggestedMonthly: number
  suggestedDaily: number
  /** variação sugerida em % (0 = manter) */
  changePct: number
  /** ganho (ou perda evitada) estimado por mês com o preço novo, em R$ */
  monthlyGain: number
  reason: string
  /** preço já ajustado nos últimos 30 dias: não há nova sugestão */
  applied?: { at: ISODate; fromMonthly: number }
}

/*
  Regra de preço pela ocupação dos últimos 30 dias:
    85% ou mais  -> +12%      72% a 85%  -> +8%      45% a 72%  -> mantém
    30% a 45%    -> -6%       15% a 30%  -> -10%     abaixo de 15% -> -15%
  Ganho mensal estimado (premissas):
    sobe o preço em p: perde metade de p em unidades alugadas (elasticidade 0,5);
    baixa o preço em p: ganha unidades paradas = menor entre 50% das paradas e (frota x 1,2 x p).
*/
export function priceTier(occupancyPct: number): number {
  if (occupancyPct >= 85) return 12
  if (occupancyPct >= 72) return 8
  if (occupancyPct >= 45) return 0
  if (occupancyPct >= 30) return -6
  if (occupancyPct >= 15) return -10
  return -15
}

export function calcPriceSuggestions(data: DbData, today: ISODate = todayFn()): PriceSuggestion[] {
  return calcUsage(data, today).map((u) => {
    const t = u.type
    const base: PriceSuggestion = {
      type: typeInfo(t),
      currentMonthly: t.monthlyRate,
      currentDaily: t.dailyRate,
      occupancy30d: u.utilization30,
      suggestedMonthly: t.monthlyRate,
      suggestedDaily: t.dailyRate,
      changePct: 0,
      monthlyGain: 0,
      reason: `Ocupação de ${Math.round(u.utilization30)}% em 30 dias: o preço está no ponto.`,
    }
    if (t.priceChange && diffDays(t.priceChange.at, today) <= 30) {
      return { ...base, reason: `Preço ajustado em ${formatDate(t.priceChange.at)}, de ${formatMoney(t.priceChange.fromMonthly)} para ${formatMoney(t.monthlyRate)} por mês.`, applied: { at: t.priceChange.at, fromMonthly: t.priceChange.fromMonthly } }
    }
    const p = priceTier(u.utilization30) / 100
    if (p === 0) return base
    const suggestedMonthly = Math.round(t.monthlyRate * (1 + p)) - 0.1
    const suggestedDaily = Math.round(t.dailyRate * (1 + p) * 10) / 10
    const occUnits = u.avgUnitsRented
    let gain: number
    if (p > 0) gain = suggestedMonthly * occUnits * (1 - 0.5 * p) - t.monthlyRate * occUnits
    else {
      const extra = Math.min(u.idleUnits * 0.5, u.units * 1.2 * -p)
      gain = suggestedMonthly * (occUnits + extra) - t.monthlyRate * occUnits
    }
    const changePct = r1((suggestedMonthly / t.monthlyRate - 1) * 100)
    const monthlyGain = Math.max(0, r2(gain))
    const reason =
      p > 0
        ? `Ocupação de ${Math.round(u.utilization30)}% em 30 dias. Com ${Math.abs(changePct).toString().replace('.', ',')}% a mais por mês, ganho estimado de ${formatMoney(monthlyGain)}.`
        : `Ocupação de ${Math.round(u.utilization30)}% e ${u.idleUnits} ${u.idleUnits === 1 ? 'unidade parada' : 'unidades paradas'}. Com ${Math.abs(changePct).toString().replace('.', ',')}% a menos, o estoque gira e entram ${formatMoney(monthlyGain)} por mês.`
    return { ...base, suggestedMonthly: r2(suggestedMonthly), suggestedDaily, changePct, monthlyGain, reason }
  })
}

/** Preço sugerido por tipo de equipamento, com ocupação, variação e ganho mensal estimado */
export function getPriceSuggestions(): Promise<PriceSuggestion[]> {
  return call(() => calcPriceSuggestions(getData()))
}

/** Grava o preço sugerido no tipo (vale para novos orçamentos, via quoteRental) e registra no histórico de automações */
export function applyPriceSuggestion(typeId: string): Promise<PriceSuggestion> {
  return call(() => {
    const data = getData()
    const t = data.types.find((x) => x.id === typeId)
    if (!t) throw new ServiceError('Tipo de equipamento não encontrado.')
    const s = calcPriceSuggestions(data).find((x) => x.type.id === typeId)!
    if (s.changePct === 0) throw new ServiceError('Não há sugestão de preço para este equipamento agora.')
    const ids = newIds()
    const today = todayFn()
    const upd: EquipmentType = { ...t, monthlyRate: s.suggestedMonthly, dailyRate: s.suggestedDaily, priceChange: { at: today, fromMonthly: t.monthlyRate, fromDaily: t.dailyRate } }
    const run: AutomationRun = {
      id: ids.next('run'),
      automationId: SYS_PRECO.id,
      automationName: SYS_PRECO.name,
      at: demoNowISO(),
      text: `${t.short}: mensal de ${formatMoney(t.monthlyRate)} para ${formatMoney(s.suggestedMonthly)} (${s.changePct > 0 ? '+' : ''}${s.changePct.toString().replace('.', ',')}%)`,
      value: s.monthlyGain,
      minutesSaved: 10,
      ref: { type: 'type', id: t.id },
    }
    commit({ types: data.types.map((x) => (x.id === typeId ? upd : x)), automationLog: [...data.automationLog, run], seq: ids.seq() })
    return calcPriceSuggestions(getData()).find((x) => x.type.id === typeId)!
  })
}

/* ═════════════════════════ Lucro por equipamento ═════════════════════════ */

export type AssetVerdict = 'comprar_mais' | 'manter' | 'subir_preco' | 'baixar_preco' | 'vender'

export interface AssetProfit {
  type: TypeInfo
  units: number
  /** receita das locações nos últimos 6 meses (somente o que já passou, até hoje) */
  revenue6m: number
  /** receita média por unidade por mês (revenue6m / unidades / 6) */
  revenuePerUnit: number
  /** ocupação dos últimos 30 dias, em % */
  utilizationPct: number
  idleUnits: number
  /** média de dias parado das unidades disponíveis */
  idleDaysAvg: number
  /** custo de aquisição de toda a frota do tipo (preço x unidades) */
  purchaseTotal: number
  /** meses para uma unidade se pagar com a receita média por unidade (preço de compra / receita mensal por unidade) */
  paybackMonths: number
  /** retorno anual sobre o custo: receita mensal por unidade x 12 / preço de compra, em % */
  roiPct: number
  verdict: AssetVerdict
  /** frase curta com os números que levaram ao veredito */
  reason: string
  /** efeito estimado por mês em R$ (ver a regra de cada veredito em `verdictFor`) */
  impactMonthly: number
  /** unidades a comprar (comprar_mais) ou a vender (vender); 0 nos demais */
  suggestedUnits: number
  /** dias dos últimos 90 com 90% ou mais da frota alugada */
  tightDays90: number
}

export interface UnitProfit {
  unit: { id: string; code: string; typeId: string; typeName: string; photo: string; status: string }
  revenue6m: number
  /** dias parada agora (0 se não está disponível) */
  idleDays: number
}

export interface AssetProfitability {
  types: AssetProfit[]
  /** as 5 unidades que mais renderam nos últimos 6 meses */
  topUnits: UnitProfit[]
  /** as 5 que menos renderam (empate: a parada há mais tempo) */
  worstUnits: UnitProfit[]
}

/*
  Regra do veredito (ocupação = últimos 30 dias; "apertado" = dia com 90% ou mais da frota alugada, nos últimos 90):
    vender        ocupação < 25% e parado em média há mais de 60 dias
    comprar_mais  ocupação >= 70% e (estoque apertado em 10 dias ou mais, ou falta estoque na previsão de 30 dias)
    subir_preco   ocupação >= 72% (e não é caso de comprar)
    baixar_preco  ocupação < 45% (e não é caso de vender)
    manter        os demais
  Efeito mensal: comprar_mais = unidades a comprar x receita mensal por unidade (maior entre as faltas do pico
  e 5% da frota); subir/baixar = ganho estimado do preço sugerido; vender = 1,5% ao mês do custo das unidades
  paradas (capital, espaço e manutenção que deixam de ser gastos).
*/
export const HOLDING_COST_PCT_MONTH = 1.5

function verdictFor(u: TypeUsage, forecast: DemandTypeForecast, price: PriceSuggestion): { verdict: AssetVerdict; reason: string; impactMonthly: number; suggestedUnits: number; revenuePerUnit: number } {
  const t = u.type
  const revenuePerUnit = u.units ? r2(u.revenue6m / u.units / 6) : 0
  const util = Math.round(u.utilization30)
  const payback = revenuePerUnit > 0 ? r1(t.purchasePrice / revenuePerUnit) : 0
  if (u.utilization30 < 25 && u.idleDaysAvg > 60) {
    const n = u.idleUnits
    return {
      verdict: 'vender',
      reason: `${n} de ${u.units} ${n === 1 ? 'parado' : 'parados'}, em média há ${u.idleDaysAvg} dias, e ocupação de ${util}%. Payback de ${payback.toString().replace('.', ',')} meses.`,
      impactMonthly: r2(n * t.purchasePrice * (HOLDING_COST_PCT_MONTH / 100)),
      suggestedUnits: n,
      revenuePerUnit,
    }
  }
  if (u.utilization30 >= 70 && (u.tightDays90 >= 10 || forecast.stockoutDays > 0)) {
    const n = Math.max(forecast.missingUnits, Math.ceil(u.units * 0.05), 1)
    const falta = forecast.stockoutDays > 0 ? ` Faltam ${forecast.missingUnits} unidades no pico previsto.` : ''
    return {
      verdict: 'comprar_mais',
      reason: `Ocupação de ${util}% e frota quase toda alugada em ${u.tightDays90} dos últimos 90 dias.${falta}`,
      impactMonthly: r2(n * revenuePerUnit),
      suggestedUnits: n,
      revenuePerUnit,
    }
  }
  if (u.utilization30 >= 72) {
    return { verdict: 'subir_preco', reason: `Ocupação de ${util}% em 30 dias: tem demanda para cobrar mais.`, impactMonthly: price.monthlyGain, suggestedUnits: 0, revenuePerUnit }
  }
  if (u.utilization30 < 45) {
    return { verdict: 'baixar_preco', reason: `Ocupação de ${util}% em 30 dias, abaixo de 45%. ${u.idleUnits} ${u.idleUnits === 1 ? 'parado' : 'parados'}.`, impactMonthly: price.monthlyGain, suggestedUnits: 0, revenuePerUnit }
  }
  return { verdict: 'manter', reason: `Ocupação de ${util}% e payback de ${payback.toString().replace('.', ',')} meses, dentro do esperado.`, impactMonthly: 0, suggestedUnits: 0, revenuePerUnit }
}

export function calcAssetProfitability(data: DbData, today: ISODate = todayFn()): AssetProfitability {
  const usage = calcUsage(data, today)
  const forecast = calcDemandForecast(data, 30, today)
  const prices = calcPriceSuggestions(data, today)
  const types = usage.map<AssetProfit>((u) => {
    const v = verdictFor(u, forecast.types.find((f) => f.type.id === u.type.id)!, prices.find((p) => p.type.id === u.type.id)!)
    const price = u.type.purchasePrice
    return {
      type: typeInfo(u.type),
      units: u.units,
      revenue6m: u.revenue6m,
      revenuePerUnit: v.revenuePerUnit,
      utilizationPct: u.utilization30,
      idleUnits: u.idleUnits,
      idleDaysAvg: u.idleDaysAvg,
      purchaseTotal: r2(price * u.units),
      paybackMonths: v.revenuePerUnit > 0 ? r1(price / v.revenuePerUnit) : 0,
      roiPct: price > 0 ? r1(((v.revenuePerUnit * 12) / price) * 100) : 0,
      verdict: v.verdict,
      reason: v.reason,
      impactMonthly: v.impactMonthly,
      suggestedUnits: v.suggestedUnits,
      tightDays90: u.tightDays90,
    }
  })
  // receita por unidade nos últimos 6 meses
  const from180 = addDays(today, -179)
  const perUnit = new Map<string, number>()
  for (const r of data.rentals) {
    if (!HOLD.includes(r.status)) continue
    for (const it of r.items) {
      const v = itemRevenue({ qty: 1, rate: it.rate, billing: it.billing }, r.start, r.end, from180, today)
      for (const id of it.unitIds) perUnit.set(id, r2((perUnit.get(id) ?? 0) + v))
    }
  }
  const tmap = new Map(data.types.map((t) => [t.id, t]))
  const rows = data.units.map<UnitProfit>((u) => {
    const t = tmap.get(u.typeId)!
    return {
      unit: { id: u.id, code: u.code, typeId: u.typeId, typeName: t.short, photo: t.photo, status: u.status },
      revenue6m: perUnit.get(u.id) ?? 0,
      idleDays: u.status === 'disponivel' && u.idleSince ? Math.max(0, diffDays(u.idleSince, today)) : 0,
    }
  })
  const old = (id: string) => diffDays(data.units.find((u) => u.id === id)!.acquiredAt, today) >= 120
  const topUnits = [...rows].sort((a, b) => b.revenue6m - a.revenue6m || a.unit.code.localeCompare(b.unit.code)).slice(0, 5)
  const worstUnits = rows
    .filter((r) => old(r.unit.id))
    .sort((a, b) => a.revenue6m - b.revenue6m || b.idleDays - a.idleDays || a.unit.code.localeCompare(b.unit.code))
    .slice(0, 5)
  return { types, topUnits, worstUnits }
}

/** Lucro por tipo de equipamento (receita, ocupação, payback, ROI, veredito) e as 5 melhores e piores unidades */
export function getAssetProfitability(): Promise<AssetProfitability> {
  return call(() => calcAssetProfitability(getData()))
}

/* ═════════════════════════ Previsão de caixa ═════════════════════════ */

export interface CashWeek {
  weekStart: ISODate
  /** 'dd/mm' do início da semana */
  label: string
  /** cobranças em aberto que vencem na semana (as já vencidas entram na primeira) */
  expected: number
  /** mensalidades futuras das locações em campo e confirmadas, ainda não emitidas (emissão 2 dias antes do ciclo, vence em 15) */
  recurring: number
}

export interface CashTotal {
  days: number
  expected: number
  recurring: number
  /** expected + recurring */
  total: number
}

export interface CashForecast {
  weeks: CashWeek[]
  totals: { d30: CashTotal; d60: CashTotal; d90: CashTotal }
}

interface CashEvent {
  /** dia em que o dinheiro deve entrar (as vencidas contam em hoje) */
  day: ISODate
  value: number
  kind: 'expected' | 'recurring'
  clientId: string
}

function cashEvents(data: DbData, today: ISODate): CashEvent[] {
  const out: CashEvent[] = []
  for (const c of data.charges) {
    if (c.status === 'aberta' || c.status === 'atrasada') out.push({ day: c.dueAt < today ? today : c.dueAt, value: c.value, kind: 'expected', clientId: c.clientId })
  }
  for (const r of data.rentals) {
    if ((r.status !== 'em_campo' && r.status !== 'confirmada') || r.kind !== 'obra') continue
    for (const cy of billingCycles(r.kind, r.start, r.end)) {
      const issue = addDays(cy.from, -2)
      if (issue <= today) continue
      out.push({ day: addDays(issue, 15), value: cycleAmount(r.items, cy.days), kind: 'recurring', clientId: r.clientId })
    }
  }
  return out
}

export function calcCashForecast(data: DbData, weeks: number, today: ISODate = todayFn()): CashForecast {
  const events = cashEvents(data, today)
  const sum = (es: CashEvent[], k?: CashEvent['kind']) => r2(es.filter((e) => !k || e.kind === k).reduce((a, e) => a + e.value, 0))
  const rows: CashWeek[] = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(today, i * 7)
    const end = addDays(start, 6)
    const es = events.filter((e) => e.day >= start && e.day <= end)
    return {
      weekStart: start,
      label: `${start.slice(8, 10)}/${start.slice(5, 7)}`,
      expected: sum(es, 'expected'),
      recurring: sum(es, 'recurring'),
    }
  })
  const tot = (days: number): CashTotal => {
    const es = events.filter((e) => e.day <= addDays(today, days - 1))
    const expected = sum(es, 'expected')
    const recurring = sum(es, 'recurring')
    return { days, expected, recurring, total: r2(expected + recurring) }
  }
  return { weeks: rows, totals: { d30: tot(30), d60: tot(60), d90: tot(90) } }
}

/** Caixa previsto por semana (esperado e mensalidades futuras) e totais de 30, 60 e 90 dias */
export function getCashForecast(weeks = 12): Promise<CashForecast> {
  return call(() => calcCashForecast(getData(), weeks))
}

/* ═════════════════════════ Dinheiro recuperado e resumo ═════════════════════════ */

/** O que o sistema recuperou no mês ('AAAA-MM', padrão o mês atual): avarias cobradas, extras faturados, atrasados e parados */
export function getRecoveredMoney(month?: string): Promise<RecoveredMoney> {
  return call(() => computeRecoveredMoney(getData(), month ?? monthKey(todayFn()), todayFn()))
}

export interface IntelligenceSummary {
  /** caixa previsto para os próximos 30 dias (esperado + mensalidades futuras) */
  cashForecast30: number
  /** dinheiro recuperado no mês atual */
  recoveredMonth: number
  /** ganho mensal possível se todos os preços sugeridos forem aplicados */
  priceGainMonthly: number
  /** tipo com a maior falta de estoque no pico dos próximos 30 dias (null se o estoque dá conta) */
  stockout: { typeId: string; typeName: string; missingUnits: number; peakDay: ISODate } | null
}

export function calcIntelligenceSummary(data: DbData, today: ISODate = todayFn()): IntelligenceSummary {
  const worst = calcDemandForecast(data, 30, today).types.filter((t) => t.missingUnits > 0).sort((a, b) => b.missingUnits - a.missingUnits || b.stockoutDays - a.stockoutDays)[0]
  return {
    cashForecast30: calcCashForecast(data, 1, today).totals.d30.total,
    recoveredMonth: computeRecoveredMoney(data, monthKey(today), today).total,
    priceGainMonthly: r2(calcPriceSuggestions(data, today).reduce((a, s) => a + s.monthlyGain, 0)),
    stockout: worst ? { typeId: worst.type.id, typeName: worst.type.name, missingUnits: worst.missingUnits, peakDay: worst.peakDay } : null,
  }
}

/** Os quatro números de abertura da tela de inteligência */
export function getIntelligenceSummary(): Promise<IntelligenceSummary> {
  return call(() => calcIntelligenceSummary(getData()))
}

/* ═════════════════════════ Calculadora de perdas (venda) ═════════════════════════ */

export interface DiagnosisInput {
  units: number
  /** mensalidade média de tabela por equipamento (R$) */
  avgMonthlyRate: number
  /** % da frota parada */
  idlePct: number
  damagesPerMonth: number
  avgDamageValue: number
  /** % das avarias que ninguém cobra */
  damagesUnchargedPct: number
  extrasPerMonth: number
  avgExtraValue: number
  /** % dos serviços extras que ficam sem fatura */
  extrasUnbilledPct: number
  /** faturamento mensal (R$) */
  monthlyBilling: number
  /** % do faturamento que fica vencido */
  overduePct: number
  setupFee: number
  monthlyFee: number
}

export interface DiagnosisItem {
  key: 'parado' | 'avarias' | 'extras' | 'atraso'
  label: string
  /** R$ por mês */
  monthly: number
}

export interface Diagnosis {
  breakdown: DiagnosisItem[]
  monthlyLoss: number
  yearlyLoss: number
  /** parcela da perda que o sistema recupera por mês (ver RECOVERY_RATE) */
  recoverableMonthly: number
  /** meses para a implantação se pagar com o que o sistema recupera, já descontada a mensalidade (null se nunca) */
  paybackMonths: number | null
  /** retorno do primeiro ano sobre o que se paga (implantação + 12 mensalidades), em % */
  roiFirstYear: number
}

/** Premissas: parcela de cada perda que o sistema recupera */
export const RECOVERY_RATE = { parado: 0.3, avarias: 0.7, extras: 0.7, atraso: 0.5 } as const

/**
 * Calculadora de venda (função pura).
 * parado = frota x mensalidade média x % parado; avarias = avarias/mês x valor x % sem cobrança;
 * extras = extras/mês x valor x % sem fatura; atraso = faturamento x % vencido (dinheiro preso por mês).
 */
export function diagnoseLosses(input: DiagnosisInput): Diagnosis {
  const breakdown: DiagnosisItem[] = [
    { key: 'parado', label: 'Equipamentos parados', monthly: r2(input.units * input.avgMonthlyRate * (input.idlePct / 100)) },
    { key: 'avarias', label: 'Avarias sem cobrança', monthly: r2(input.damagesPerMonth * input.avgDamageValue * (input.damagesUnchargedPct / 100)) },
    { key: 'extras', label: 'Extras sem fatura', monthly: r2(input.extrasPerMonth * input.avgExtraValue * (input.extrasUnbilledPct / 100)) },
    { key: 'atraso', label: 'Atraso no pagamento', monthly: r2(input.monthlyBilling * (input.overduePct / 100)) },
  ]
  const monthlyLoss = r2(breakdown.reduce((a, b) => a + b.monthly, 0))
  const recoverableMonthly = r2(breakdown.reduce((a, b) => a + b.monthly * RECOVERY_RATE[b.key], 0))
  const net = recoverableMonthly - input.monthlyFee
  const cost12 = input.setupFee + input.monthlyFee * 12
  return {
    breakdown,
    monthlyLoss,
    yearlyLoss: r2(monthlyLoss * 12),
    recoverableMonthly,
    paybackMonths: net > 0 ? r1(input.setupFee / net) : null,
    roiFirstYear: cost12 > 0 ? r1(((recoverableMonthly * 12 - cost12) / cost12) * 100) : 0,
  }
}

/** Valores típicos de uma locadora de 180 equipamentos (ponto de partida da calculadora) */
export function diagnosisDefaults(): DiagnosisInput {
  return {
    units: 180,
    avgMonthlyRate: 616.4,
    idlePct: 14,
    damagesPerMonth: 9,
    avgDamageValue: 384.5,
    damagesUnchargedPct: 55,
    extrasPerMonth: 14,
    avgExtraValue: 142.8,
    extrasUnbilledPct: 40,
    monthlyBilling: 58000,
    overduePct: 9,
    setupFee: 5000,
    monthlyFee: 497,
  }
}
