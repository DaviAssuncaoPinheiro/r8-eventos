/*
  Semente determinística da demonstração: mesma estrutura em qualquer dia, datas sempre relativas a "hoje".
  Sem Math.random e sem Date.now na geração; o único relógio é o dia passado em `today`.
*/
import { dayStr } from '@/domain/dates'
import type { DbData } from '@/domain/types'
import { buildActivity } from './seed/activity'
import { buildAutomationHistory } from './seed/automations'
import { buildClients, buildSettings, buildTeams, buildUnits, TYPES } from './seed/catalog'
import { buildRentals } from './seed/rentals'
import { createRng } from './seed/util'

export const SEED_NUMBER = 20261111

export function buildSeed(todayDate: Date = new Date()): DbData {
  const today = dayStr(todayDate)
  const rng = createRng(SEED_NUMBER)
  const types = TYPES.map((t) => ({ ...t }))
  const baseUnits = buildUnits(rng, today)
  const clients = buildClients(rng, today)
  const teams = buildTeams()
  const settings = buildSettings(rng, today)
  const { rentals, meta, unitFinal, tags } = buildRentals({ rng, today, types, units: baseUnits, clients })
  const units = baseUnits.map((u) => ({ ...u, ...unitFinal.get(u.id) }))
  const act = buildActivity({ rng, today, types, units, clients, teams, rentals, meta, tags })
  const auto = buildAutomationHistory({ today, rentals, services: act.services, charges: act.charges, units, types, clients, teams })
  return {
    settings,
    clients,
    types,
    units,
    teams,
    rentals,
    services: act.services,
    damages: act.damages,
    charges: act.charges,
    notifications: act.notifications,
    suggestions: [],
    automations: auto.automations,
    automationLog: auto.automationLog,
    seq: act.seq + 1000,
  }
}
