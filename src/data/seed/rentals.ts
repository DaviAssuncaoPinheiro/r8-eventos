// Locações da semente: 120 locações, alocação de unidades sem conflito de datas e estado final das unidades.
import { BAIRRO, BAIRROS } from '@/data/geo'
import { addDays, atTime, diffDays } from '@/domain/dates'
import { defaultBilling, rentalTotal, round2 } from '@/domain/planning'
import type { Client, EquipmentType, HistoryEntry, ISODate, Rental, RentalItem, RentalKind, RentalStatus, Unit } from '@/domain/types'
import { eventTitle, obraTitle, personName, ROLES_BY_KIND, streetFor } from './names'
import { phone, signatureDataUrl, type Rng } from './util'
import { UNIT_PLAN } from './catalog'

export type Cat = RentalStatus

export interface Meta {
  cat: Cat
  /** quantos dias para trás gerar limpezas com relatório */
  denseDays: number
  tag?: string
}

interface Spec {
  cat: Cat
  kind: RentalKind
  clientId: string
  bairroId: string
  start: number
  end: number
  qty: Record<string, number>
  cpw?: number
  tag?: string
  denseDays?: number
  title?: string
  contact?: { name: string; role: string; phone: string }
  unsigned?: boolean
  pools?: Record<string, { lim?: number; man?: number; disp?: number }>
  createdAgo?: number
  cancelNote?: string
  notes?: string
}

export interface BuiltRentals {
  rentals: Rental[]
  meta: Map<string, Meta>
  /** estado final das unidades (status, rentalId, idleSince, notes) */
  unitFinal: Map<string, Partial<Unit>>
  /** unidades do grupo "manutenção", por tipo, na ordem em que foram usadas */
  tags: Map<string, string>
}

const MAINT_NOTES: Record<string, string[]> = {
  bq: ['Troca de tanque', 'Porta empenada e trinco solto', 'Pintura e troca de adesivos'],
  pcd: ['Barra de apoio solta'],
  tnd5: ['Costura da lona para reparar'],
  ala: ['Grades empenadas para desempenar'],
  fec: ['Painel com solda para refazer'],
}

export function buildRentals(env: { rng: Rng; today: ISODate; types: EquipmentType[]; units: Unit[]; clients: Client[] }): BuiltRentals {
  const { rng, today, types, units, clients } = env
  const D = (n: number) => addDays(today, n)
  const typeById = new Map(types.map((t) => [t.id, t]))
  const clientById = new Map(clients.map((c) => [c.id, c]))
  const byName = (n: string) => clients.find((c) => c.name === n)!.id
  const ofKind = (...k: Client['kind'][]) => clients.filter((c) => k.includes(c.kind) && c.id !== 'cli-001')
  const bairroIn = (zone: string) => rng.pick(BAIRROS.filter((b) => b.zone === zone && b.id !== 'mane-garrincha')).id

  const obraClients = [...ofKind('Construtora'), ...ofKind('Construtora'), ...ofKind('Indústria', 'Condomínio', 'Órgão público')]
  const eventClients = [...ofKind('Produtora de eventos'), ...ofKind('Cerimonial'), ...ofKind('Igreja'), ...ofKind('Órgão público'), ...ofKind('Condomínio')]
  const discOf = (id: string) => [1, 0.98, 0.96, 0.95, 0.97, 1][Number(id.slice(-3)) % 6]

  const specs: Spec[] = []
  const zoneCycle = ['oeste', 'guara', 'plano', 'lagos', 'sul', 'norte']
  let zi = 0
  const nextZoneBairro = () => bairroIn(zi++ < 24 ? zoneCycle[zi % 6] : rng.weighted(['plano', 'lagos', 'guara', 'oeste', 'sul', 'norte'], [4, 2, 4, 7, 3, 3]))

  /* ───────── em campo: 7 eventos fixos + 29 obras ───────── */
  const ev = (end: number, dur: number, bairro: string, qty: Record<string, number>, kinds: Client['kind'][], extra: Partial<Spec> = {}) =>
    specs.push({ cat: 'em_campo', kind: 'evento', clientId: rng.pick(ofKind(...kinds)).id, bairroId: bairro, start: end - dur + 1, end, qty, cpw: dur >= 2 && Object.keys(qty).some((k) => typeById.get(k)!.cleanable) ? 7 : 0, ...extra })
  ev(0, 4, 'lago-sul', { bq: 2, tnd5: 2 }, ['Cerimonial'])
  ev(2, 4, 'mane-garrincha', { bq: 4, pcd: 1, trailer: 2, ala: 3, tnd10: 2, bal: 2 }, ['Produtora de eventos'])
  ev(1, 3, 'ceilandia', { bq: 2, pcd: 1, tnd10: 1, trailer: 1 }, ['Igreja', 'Órgão público'])
  ev(4, 6, 'aguas-claras', { bq: 1, trailer: 1, tnd5: 1, bal: 1, ala: 2, tnd10: 1 }, ['Produtora de eventos', 'Condomínio'])
  ev(3, 6, 'sobradinho', { bq: 1, tnd10: 1, pia: 1 }, ['Órgão público', 'Igreja'])
  ev(4, 7, 'gama', { bq: 1, tnd5: 1, ala: 2, pia: 1 }, ['Órgão público'])
  ev(5, 8, 'planaltina', { bq: 1, tnd5: 1, tnd10: 1, bal: 2 }, ['Órgão público', 'Produtora de eventos'])

  // Cliente de demonstração do portal
  specs.push({ cat: 'em_campo', kind: 'obra', clientId: 'cli-001', bairroId: 'aguas-claras', start: -88, end: 64, qty: { bq: 4, pcd: 1, fec: 1 }, cpw: 3, tag: 'aurora-1', denseDays: 90, title: 'Residencial Vista Verde, torres A e B', contact: { name: 'Roberta Quintela', role: 'Engenheira residente', phone: '(61) 99731-4402' } })
  specs.push({ cat: 'em_campo', kind: 'obra', clientId: 'cli-001', bairroId: 'jardim-botanico', start: -41, end: 80, qty: { bq: 2, pia: 1 }, cpw: 2, tag: 'aurora-2', denseDays: 60, title: 'Casas do Jardim Botânico, etapa 2', contact: { name: 'Valdir Souza', role: 'Mestre de obras', phone: '(61) 98455-0921' } })

  // obra em campo já começou: começo no passado e pelo menos ~3 semanas de duração
  const obraStart = (end: number) => {
    const st = -rng.int(4, 165)
    return end - st < 22 ? Math.min(-2, end - 22 - rng.int(0, 40)) : st
  }
  const obraEnds = [1, 3, 6, 14, 21, 28, 33, 40, 47, 52, 58, 66, 73, 81, 88, 95, 104, 112, 120, 128, 137, 146, 155, 29, 63, 77, 91]
  const obras: Spec[] = obraEnds.map((end, i) => {
    const bairro = nextZoneBairro()
    const flags = new Set<string>()
    if (rng.chance(0.8)) flags.add('bq')
    if (rng.chance(0.25)) flags.add('pcd')
    if (rng.chance(0.3)) flags.add('pia')
    if (rng.chance(0.55)) flags.add('fec')
    if (rng.chance(0.28)) flags.add('ala')
    if (!flags.size) flags.add('bq')
    return {
      cat: 'em_campo' as Cat,
      kind: 'obra' as RentalKind,
      clientId: obraClients[(i * 7 + 3) % obraClients.length].id,
      bairroId: bairro,
      start: obraStart(end),
      end,
      qty: Object.fromEntries([...flags].map((f) => [f, 0])),
    }
  })
  // reparte o restante do estoque "em campo" de cada tipo entre as obras que usam o tipo
  const emTotals: Record<string, number> = Object.fromEntries(Object.entries(UNIT_PLAN).map(([k, v]) => [k, v.em]))
  for (const t of types) {
    const fixed = specs.reduce((a, s) => a + (s.qty[t.id] ?? 0), 0)
    let rest = emTotals[t.id] - fixed
    const eligible = obras.filter((o) => t.id in o.qty)
    const pool = eligible.length ? eligible : obras
    let guard = 0
    while (rest > 0 && guard++ < 1000) {
      const o = rng.weighted(pool, pool.map((p) => (t.id === 'bq' ? 1 + (p.qty[t.id] ?? 0) * 0.15 : 1)))
      o.qty[t.id] = (o.qty[t.id] ?? 0) + 1
      rest--
    }
  }
  // toda obra precisa de pelo menos um item; zera o que sobrou em zero
  for (const o of obras) {
    for (const k of Object.keys(o.qty)) if (!o.qty[k]) delete o.qty[k]
    if (!Object.keys(o.qty).length) {
      const donor = obras.find((x) => (x.qty.bq ?? 0) >= 2)!
      donor.qty.bq--
      o.qty.bq = 1
    }
  }
  for (const o of obras) {
    const cleanable = Object.keys(o.qty).some((k) => typeById.get(k)!.cleanable)
    o.cpw = cleanable ? rng.pick([1, 2, 2, 3, 3]) : 0
    specs.push(o)
  }
  specs.find((s) => s.end === 1 && s.kind === 'obra')!.notes = 'Retirada marcada para amanhã cedo.'

  /* ───────── em retirada: equipamento já recolhido, falta fechar ───────── */
  const retir = (end: number, kind: RentalKind, dur: number, bairro: string, clientId: string, pools: NonNullable<Spec['pools']>, extra: Partial<Spec> = {}) =>
    specs.push({ cat: 'retirada', kind, clientId, bairroId: bairro, start: end - dur + 1, end, qty: {}, pools, cpw: kind === 'obra' ? 2 : 0, ...extra })
  retir(0, 'obra', 64, 'guara', rng.pick(obraClients).id, { bq: { lim: 2 }, pcd: { lim: 1 } })
  retir(-1, 'evento', 4, 'lago-norte', rng.pick(ofKind('Produtora de eventos')).id, { bq: { lim: 1 }, trailer: { lim: 1 }, tnd5: { man: 1 }, tnd10: { disp: 1 } })
  retir(-3, 'obra', 56, 'taguatinga', byName('Horizonte Edificações'), { bq: { man: 3 }, fec: { disp: 2 } }, { tag: 'horizonte' })
  retir(-5, 'obra', 27, 'ceilandia', rng.pick(obraClients).id, { bq: { lim: 1 }, pcd: { man: 1 }, ala: { man: 1 }, fec: { man: 1 } })
  retir(-8, 'obra', 38, 'samambaia', rng.pick(obraClients).id, { bq: { lim: 1 }, pia: { lim: 1 }, ala: { disp: 2 } })

  /* ───────── confirmadas: começam nos próximos dias ───────── */
  const conf = (start: number, kind: RentalKind, dur: number, bairro: string, qty: Record<string, number>, extra: Partial<Spec> = {}) =>
    specs.push({
      cat: 'confirmada',
      kind,
      clientId: rng.pick(kind === 'obra' ? obraClients : eventClients).id,
      bairroId: bairro,
      start,
      end: start + dur - 1,
      qty,
      cpw: kind === 'obra' ? 2 : dur >= 2 && Object.keys(qty).some((k) => typeById.get(k)!.cleanable) ? 7 : 0,
      ...extra,
    })
  conf(0, 'obra', 76, 'gama', { bq: 3, pia: 1 }, { tag: 'entrega-hoje' })
  conf(1, 'evento', 2, 'lago-norte', { bq: 6, tnd10: 1, bal: 1 })
  conf(2, 'obra', 90, 'taguatinga', { bq: 2, fec: 1 }, { unsigned: true })
  conf(3, 'evento', 3, 'asa-sul', { bq: 4, pcd: 1, ala: 2, tnd5: 2 })
  conf(5, 'obra', 120, 'riacho-fundo', { bq: 2, pcd: 1 }, { unsigned: true })
  conf(6, 'evento', 2, 'planaltina', { bq: 5, tnd5: 1, bal: 1 })
  conf(9, 'obra', 60, 'sobradinho', { bq: 1, ala: 1 })
  conf(13, 'evento', 3, 'esplanada', { bq: 8, pcd: 1, trailer: 1, ala: 2 })

  /* ───────── orçamentos ───────── */
  const orc = (start: number, kind: RentalKind, dur: number, bairro: string, qty: Record<string, number>, extra: Partial<Spec> = {}) =>
    specs.push({ cat: 'orcamento', kind, clientId: rng.pick(kind === 'obra' ? obraClients : eventClients).id, bairroId: bairro, start, end: start + dur - 1, qty, cpw: kind === 'obra' ? 2 : dur >= 2 ? 7 : 0, createdAgo: rng.int(0, 6), ...extra })
  orc(5, 'evento', 2, 'mane-garrincha', { bq: 12, pcd: 1, trailer: 1, tnd10: 2 })
  orc(8, 'obra', 100, 'aguas-claras', { bq: 3, fec: 2 })
  orc(12, 'obra', 150, 'jardim-botanico', { bq: 3, pia: 1 }, { clientId: 'cli-001', tag: 'aurora-orc', contact: { name: 'Roberta Quintela', role: 'Engenheira residente', phone: '(61) 99731-4402' } })
  orc(19, 'evento', 1, 'lago-sul', { bq: 3, tnd10: 1, bal: 1 })
  orc(27, 'obra', 45, 'ceilandia', { bq: 2, pcd: 1 })
  orc(42, 'evento', 3, 'paranoa', { bq: 6, ala: 3, tnd5: 2 })

  /* ───────── canceladas ───────── */
  const canc = (start: number, kind: RentalKind, dur: number, bairro: string, qty: Record<string, number>, note: string) =>
    specs.push({ cat: 'cancelada', kind, clientId: rng.pick(kind === 'obra' ? obraClients : eventClients).id, bairroId: bairro, start, end: start + dur - 1, qty, cpw: 0, cancelNote: note })
  canc(-35, 'obra', 60, 'vicente-pires', { bq: 2 }, 'Cliente adiou a obra por falta de licença.')
  canc(-12, 'evento', 2, 'park-way', { bq: 4, tnd5: 1 }, 'Evento cancelado por chuva forte na previsão.')
  canc(9, 'evento', 3, 'samambaia', { bq: 6, ala: 2 }, 'Cliente fechou com outra locadora, preço menor.')
  canc(20, 'obra', 90, 'recanto', { bq: 2, fec: 1 }, 'Obra suspensa pela construtora.')

  /* ───────── faturadas: obras e eventos encerrados nos últimos 6 meses ───────── */
  const NFAT = 120 - specs.length
  for (let i = 0; i < NFAT; i++) {
    const kind: RentalKind = i % 3 === 2 ? 'evento' : 'obra'
    const q: Record<string, number> = {}
    let start: number
    let end: number
    if (kind === 'obra') {
      end = -Math.round(8 + 160 * Math.pow(rng.next(), 1.5))
      const dur = rng.int(24, 140)
      start = Math.max(-186, end - dur + 1)
      if (rng.chance(0.9)) q.bq = rng.pick([2, 3, 3, 4, 5, 6, 8])
      if (rng.chance(0.25)) q.pcd = rng.pick([1, 2])
      if (rng.chance(0.3)) q.pia = rng.pick([1, 2])
      if (rng.chance(0.5)) q.fec = rng.pick([1, 2, 3])
      if (rng.chance(0.3)) q.ala = rng.pick([1, 2, 3])
    } else {
      end = -Math.round(6 + 164 * Math.pow(rng.next(), 1.5))
      start = end - rng.int(0, 3)
      q.bq = rng.int(4, 12)
      if (rng.chance(0.4)) q.pcd = rng.int(1, 2)
      if (rng.chance(0.35)) q.pia = rng.int(1, 2)
      if (rng.chance(0.4)) q.tnd5 = rng.int(1, 3)
      if (rng.chance(0.2)) q.tnd10 = rng.int(1, 2)
      if (rng.chance(0.1)) q.trailer = 1
      if (rng.chance(0.25)) q.bal = rng.int(1, 3)
      if (rng.chance(0.4)) q.ala = rng.int(1, 3)
    }
    if (!Object.keys(q).length) q.bq = 2
    const cleanable = Object.keys(q).some((k) => typeById.get(k)!.cleanable)
    specs.push({
      cat: 'faturada',
      kind,
      clientId: rng.pick(kind === 'obra' ? obraClients : eventClients).id,
      bairroId: rng.weighted(BAIRROS.map((b) => b.id), BAIRROS.map((b) => ({ plano: 4, lagos: 2, guara: 4, oeste: 7, sul: 3, norte: 3 })[b.zone])),
      start,
      end,
      qty: q,
      cpw: cleanable ? (kind === 'obra' ? rng.pick([1, 2, 2, 3]) : end - start >= 1 ? 7 : 0) : 0,
    })
  }
  // A faturada de demonstração do portal
  specs.push({ cat: 'faturada', kind: 'obra', clientId: 'cli-001', bairroId: 'noroeste', start: -128, end: -22, qty: { bq: 3, fec: 1 }, cpw: 2, tag: 'aurora-3', denseDays: 140, title: 'Edifício Noroeste 104, fundação e estrutura', contact: { name: 'Roberta Quintela', role: 'Engenheira residente', phone: '(61) 99731-4402' } })
  specs.splice(specs.findIndex((s) => s.cat === 'faturada' && !s.tag), 1)

  /* ───────── alocação de unidades ───────── */
  const unitsOfType = new Map<string, Unit[]>()
  for (const u of units) {
    const l = unitsOfType.get(u.typeId)
    if (l) l.push(u)
    else unitsOfType.set(u.typeId, [u])
  }
  type Pool = { em: Unit[]; lim: Unit[]; man: Unit[]; disp: Unit[] }
  const pool: Record<string, Pool> = {}
  const dormant = new Set<string>()
  for (const t of types) {
    const p = UNIT_PLAN[t.id]
    const sh = rng.shuffle(unitsOfType.get(t.id)!)
    const em = sh.slice(0, p.em)
    const lim = sh.slice(p.em, p.em + p.lim)
    const man = sh.slice(p.em + p.lim, p.em + p.lim + p.man)
    const disp = sh.slice(p.em + p.lim + p.man)
    const nDorm = Math.floor(disp.length * 0.5)
    // dormentes ficam no fim da lista; quem precisa de disponível usa o começo
    for (const u of disp.slice(disp.length - nDorm)) dormant.add(u.id)
    pool[t.id] = { em, lim, man, disp }
  }
  const busy = new Map<string, [ISODate, ISODate][]>()
  const isFree = (id: string, s: ISODate, e: ISODate) => !(busy.get(id) ?? []).some(([a, b]) => a <= e && b >= s)
  const mark = (id: string, s: ISODate, e: ISODate) => {
    const l = busy.get(id)
    if (l) l.push([s, e])
    else busy.set(id, [[s, e]])
  }
  const limIds = new Set<string>()
  const manIds = new Set<string>()
  for (const t of types) {
    for (const u of pool[t.id].lim) limIds.add(u.id)
    for (const u of pool[t.id].man) manIds.add(u.id)
  }
  const limMan = new Set<string>([...limIds, ...manIds])
  const emSet = new Set<string>()
  for (const t of types) for (const u of pool[t.id].em) emSet.add(u.id)

  const allocFixed = (typeId: string, grp: keyof Pool, n: number, s: ISODate, e: ISODate): string[] => {
    const ids = pool[typeId][grp].splice(0, n).map((u) => u.id)
    for (const id of ids) mark(id, s, e)
    return ids
  }
  const allocGeneral = (typeId: string, qty: number, s: ISODate, e: ISODate, future: boolean): string[] => {
    const recentWindow = !future && e > D(-35)
    const all = rng.shuffle(unitsOfType.get(typeId)!)
    const cands = all.filter((u) => {
      if (!isFree(u.id, s, e)) return false
      if (dormant.has(u.id) && e > D(-35)) return false
      if (limMan.has(u.id) && e > D(-60)) return false
      if (emSet.has(u.id) && future && s <= D(0)) return false
      return true
    })
    if (recentWindow || future) cands.sort((a, b) => Number(dormant.has(a.id)) - Number(dormant.has(b.id)) || Number(emSet.has(a.id)) - Number(emSet.has(b.id)))
    const ids = cands.slice(0, qty).map((u) => u.id)
    for (const id of ids) mark(id, s, e)
    return ids
  }

  const alloc = new Map<Spec, Record<string, string[]>>()
  for (const sp of specs.filter((s) => s.cat === 'em_campo')) {
    const r: Record<string, string[]> = {}
    for (const [tid, q] of Object.entries(sp.qty)) r[tid] = allocFixed(tid, 'em', q, D(sp.start), D(sp.end))
    alloc.set(sp, r)
  }
  for (const sp of specs.filter((s) => s.cat === 'retirada')) {
    const r: Record<string, string[]> = {}
    for (const [tid, g] of Object.entries(sp.pools!)) {
      const ids: string[] = []
      for (const grp of ['lim', 'man', 'disp'] as const) if (g[grp]) ids.push(...allocFixed(tid, grp, g[grp]!, D(sp.start), D(sp.end)))
      r[tid] = ids
      sp.qty[tid] = ids.length
    }
    alloc.set(sp, r)
  }
  for (const sp of specs.filter((s) => s.cat === 'confirmada')) {
    const r: Record<string, string[]> = {}
    for (const [tid, q] of Object.entries(sp.qty)) {
      const ids = allocGeneral(tid, q, D(sp.start), D(sp.end), true)
      if (ids.length) r[tid] = ids
    }
    alloc.set(sp, r)
  }
  for (const sp of specs.filter((s) => s.cat === 'faturada').sort((a, b) => a.start - b.start)) {
    const r: Record<string, string[]> = {}
    for (const [tid, q] of Object.entries(sp.qty)) {
      const ids = allocGeneral(tid, q, D(sp.start), D(sp.end), false)
      if (ids.length) r[tid] = ids
    }
    // sem unidade livre no período (estoque cheio): encurta a locação e recua no tempo até caber
    for (let guard = 0; !Object.keys(r).length && guard < 8; guard++) {
      if (guard === 0) sp.start = Math.max(sp.start, sp.end - 13)
      else {
        sp.start -= 20
        sp.end -= 20
      }
      for (const tid of ['bq', 'fec', 'ala', 'pia', 'pcd', 'tnd5', 'bal']) {
        const ids = allocGeneral(tid, 1, D(sp.start), D(sp.end), false)
        if (ids.length) {
          r[tid] = ids
          break
        }
      }
    }
    alloc.set(sp, r)
  }

  /* ───────── monta as locações ───────── */
  const rentals: Rental[] = []
  const meta = new Map<string, Meta>()
  const created = new Map<Spec, number>() // dias antes de hoje (offset negativo) em que foi criada
  const tags = new Map<string, string>()
  const built: { spec: Spec; r: Rental }[] = []

  for (const sp of specs) {
    const client = clientById.get(sp.clientId)!
    const bairro = BAIRRO[sp.bairroId]
    const unitMap = alloc.get(sp) ?? {}
    const start = D(sp.start)
    const end = D(sp.end)
    const bill = sp.kind === 'obra' ? defaultBilling('obra', start, end) : 'diaria'
    const disc = discOf(client.id)
    const noUnits = sp.cat === 'orcamento' || sp.cat === 'cancelada'
    const entries: [string, number][] = noUnits ? Object.entries(sp.qty) : Object.entries(unitMap).map(([t, ids]) => [t, ids.length])
    const items: RentalItem[] = entries
      .filter(([, q]) => q > 0)
      .map(([typeId, qty]) => {
        const t = typeById.get(typeId)!
        const rate = round2((bill === 'mensal' ? t.monthlyRate : t.dailyRate) * (sp.kind === 'evento' ? Math.max(disc, 0.92) : disc))
        return { typeId, qty, unitIds: noUnits ? [] : unitMap[typeId], rate, billing: bill }
      })
    const order = types.map((t) => t.id)
    items.sort((a, b) => order.indexOf(a.typeId) - order.indexOf(b.typeId))
    const title = sp.title ?? (sp.kind === 'obra' ? obraTitle(rng, bairro.name) : eventTitle(rng, client.kind))
    const contact = sp.contact ?? { name: personName(rng), role: rng.pick(ROLES_BY_KIND[client.kind]), phone: phone(rng) }
    const lead = sp.kind === 'obra' ? rng.int(2, 12) : rng.int(6, 40)
    const createdDay = sp.cat === 'orcamento' ? D(-(sp.createdAgo ?? 1)) : addDays(start, -lead)
    const createdAt = atTime(createdDay, 9 * 60 + rng.int(0, 480))
    const total = rentalTotal(sp.kind, start, end, items)
    const r: Rental = {
      id: '',
      code: '',
      clientId: client.id,
      title,
      kind: sp.kind,
      address: sp.kind === 'evento' && sp.bairroId === 'mane-garrincha' ? 'Estacionamento do Estádio Nacional, portão F' : streetFor(sp.bairroId, rng),
      bairroId: sp.bairroId,
      start,
      end,
      status: sp.cat,
      items,
      cleaningsPerWeek: sp.cpw ?? 0,
      total,
      contact,
      notes: sp.notes ?? (rng.chance(0.18) ? rng.pick(['Caminhão entra pelo portão dos fundos.', 'Falar com o vigia antes de entrar.', 'Banheiros no térreo, ao lado do almoxarifado.', 'Ponto de energia 220 V ao lado da entrada.', 'Limpeza combinada antes do almoço da equipe.']) : undefined),
      createdAt,
      history: [],
    }
    built.push({ spec: sp, r })
    created.set(sp, 0)
  }

  // códigos em ordem de criação
  built.sort((a, b) => a.r.createdAt.localeCompare(b.r.createdAt))
  built.forEach(({ r }, i) => {
    r.code = `LOC-${2001 + i}`
    r.id = `loc-${2001 + i}`
  })

  const who = 'Paula Ramos'
  for (const { spec: sp, r } of built) {
    const h: HistoryEntry[] = [{ at: r.createdAt, text: `Orçamento criado por ${who}` }]
    const confirmDay = addDays(dayOfISO(r.createdAt), rng.int(1, 3))
    const confirmAt = atTime(confirmDay > addDays(r.start, -1) ? addDays(r.start, -1) : confirmDay, 15 * 60 + rng.int(0, 90))
    if (sp.cat !== 'orcamento' && sp.cat !== 'cancelada') {
      h.push({ at: confirmAt, text: 'Orçamento aprovado pelo cliente. Locação confirmada.' })
      const signedAt = atTime(dayOfISO(confirmAt), 17 * 60 + rng.int(0, 120))
      r.contract = { generatedAt: confirmAt }
      h.push({ at: confirmAt, text: 'Contrato gerado e enviado por WhatsApp' })
      if (!sp.unsigned) {
        r.contract = { generatedAt: confirmAt, signedAt, signedBy: r.contact.name, signatureDataUrl: signatureDataUrl(r.contact.name) }
        h.push({ at: signedAt, text: `Contrato assinado por ${r.contact.name}` })
      }
    }
    if (sp.cat === 'em_campo' || sp.cat === 'retirada' || sp.cat === 'faturada') {
      h.push({ at: atTime(r.start, 9 * 60 + 30), text: 'Equipamentos entregues no local e conferidos' })
    }
    if (sp.cat === 'retirada' || sp.cat === 'faturada') h.push({ at: atTime(r.end, 11 * 60), text: 'Retirada concluída. Equipamentos de volta à base' })
    if (sp.cat === 'faturada') h.push({ at: atTime(addDays(r.end, 2), 10 * 60), text: 'Locação encerrada e faturada' })
    if (sp.cat === 'cancelada') h.push({ at: atTime(addDays(dayOfISO(r.createdAt), 2), 11 * 60), text: `Locação cancelada. ${sp.cancelNote}` })
    r.history = h.sort((a, b) => a.at.localeCompare(b.at))
    rentals.push(r)
    meta.set(r.id, { cat: sp.cat, denseDays: sp.denseDays ?? 28, tag: sp.tag })
    if (sp.tag) tags.set(sp.tag, r.id)
  }
  rentals.sort((a, b) => a.code.localeCompare(b.code))

  /* ───────── estado final das unidades ───────── */
  const unitFinal = new Map<string, Partial<Unit>>()
  const rentalOfEm = new Map<string, string>()
  for (const { spec: sp, r } of built) if (sp.cat === 'em_campo') for (const it of r.items) for (const id of it.unitIds) rentalOfEm.set(id, r.id)
  const maintCount: Record<string, number> = {}
  for (const u of units) {
    if (rentalOfEm.has(u.id)) {
      unitFinal.set(u.id, { status: 'em_campo', rentalId: rentalOfEm.get(u.id) })
    } else if (limMan.has(u.id)) {
      if (manIds.has(u.id)) {
        const n = (maintCount[u.typeId] = (maintCount[u.typeId] ?? 0) + 1)
        unitFinal.set(u.id, { status: 'manutencao', notes: (MAINT_NOTES[u.typeId] ?? ['Revisão geral'])[(n - 1) % (MAINT_NOTES[u.typeId]?.length ?? 1)] })
      } else {
        unitFinal.set(u.id, { status: 'limpeza', notes: 'Chegou da retirada, aguardando higienização' })
      }
    } else {
      const past = (busy.get(u.id) ?? []).filter(([s, e]) => s <= today && e <= today).map(([, e]) => e)
      const last = past.length ? past.sort().slice(-1)[0] : undefined
      const base = u.acquiredAt > D(-185) ? u.acquiredAt : D(-(185 + rng.int(0, 90)))
      unitFinal.set(u.id, { status: 'disponivel', idleSince: last ?? base })
    }
  }
  return { rentals, meta, unitFinal, tags }
}

function dayOfISO(iso: string): ISODate {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

