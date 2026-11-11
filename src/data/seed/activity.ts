// Atividade da semente: serviços (com relatórios), avarias, cobranças e avisos.
import { addDays, atTime, dayOf, diffDays, minutesOf, monthKey, monthStart, addMonths } from '@/domain/dates'
import { idleReRentedItems } from '@/domain/recovery'
import { SEGMENTS } from '@/domain/segments'
import { billingCycles, createScheduler, cycleAmount, planRentalServices, renumberOrders, serviceDuration, teamIdForBairro } from '@/domain/planning'
import type { Charge, Client, Damage, EquipmentType, ISODate, Notification, PayMethod, Rental, Service, ServicePhoto, ServiceReport, Team, Unit } from '@/domain/types'
import { DAMAGE_DESCRIPTIONS } from './names'
import type { Meta } from './rentals'
import { createRng, oddMoney, round2, signatureDataUrl, type Rng } from './util'

export interface ActivityEnv {
  rng: Rng
  today: ISODate
  types: EquipmentType[]
  units: Unit[]
  clients: Client[]
  teams: Team[]
  rentals: Rental[]
  meta: Map<string, Meta>
  tags: Map<string, string>
}

export interface Activity {
  services: Service[]
  damages: Damage[]
  charges: Charge[]
  notifications: Notification[]
  seq: number
}

const NOTES = ['Cliente pediu reforço no papel higiênico na próxima visita.', 'Acesso liberado pelo vigia, sem espera.', 'Chuva no local. Serviço feito com cobertura.', 'Uso intenso no fim de semana. Lavagem reforçada.', 'Responsável pediu para avisar por e-mail antes de chegar.', 'Local com lama na entrada. Caminhão estacionou na rua.']

export function buildActivity(env: ActivityEnv): Activity {
  const { rng, today, types, units, clients, teams, rentals, meta, tags } = env
  const D = (n: number) => addDays(today, n)
  const typeById = new Map(types.map((t) => [t.id, t]))
  const unitById = new Map(units.map((u) => [u.id, u]))
  const clientById = new Map(clients.map((c) => [c.id, c]))
  const rentalById = new Map(rentals.map((r) => [r.id, r]))
  let seq = 0
  const uid = (p: string) => `${p}-${String(++seq).padStart(4, '0')}`
  const checklists = SEGMENTS.eventos.checklists

  /* ───────── relatórios ───────── */
  const photoFor = (r: Rental, unitIds: string[], moment: ServicePhoto['moment'], label: string, n = 0): ServicePhoto => {
    const u = unitById.get(unitIds[n % Math.max(1, unitIds.length)])
    const t = u ? typeById.get(u.typeId) : typeById.get(r.items[0].typeId)
    return { id: uid('ph'), src: t!.photo, label: u ? `${label} · ${u.code}` : label, moment }
  }
  const makeReport = (s: Service, startDelay?: number, R: Rng = rng): ServiceReport => {
    const r = rentalById.get(s.rentalId)!
    const delay = startDelay ?? (R.chance(0.14) ? R.int(12, 35) : R.int(0, 8))
    const startedAt = new Date(new Date(s.start).getTime() + delay * 60000)
    const finishedAt = new Date(startedAt.getTime() + Math.round(s.durationMin * R.float(0.85, 1.15)) * 60000)
    const checklist = checklists[s.type].map((label) => ({ label, ok: true }))
    if (s.type === 'limpeza' && R.chance(0.05)) checklist[3].ok = false
    const photos: ServicePhoto[] = []
    if (s.type === 'limpeza' || s.type === 'manutencao') {
      photos.push(photoFor(r, s.unitIds, 'antes', s.type === 'limpeza' ? 'Antes' : 'Antes do reparo', 0))
      photos.push(photoFor(r, s.unitIds, 'depois', s.type === 'limpeza' ? 'Depois' : 'Depois do reparo', 0))
      if (R.chance(0.4)) photos.push(photoFor(r, s.unitIds, 'depois', 'Depois', 1))
    } else if (s.type === 'retirada') {
      photos.push(photoFor(r, s.unitIds, 'antes', 'Estado na retirada', 0))
      photos.push(photoFor(r, s.unitIds, 'depois', 'Carregado no caminhão', 1))
    } else {
      const seen = new Set<string>()
      for (const it of r.items) {
        const t = typeById.get(it.typeId)!
        if (seen.has(t.photo) || photos.length >= 3) continue
        if ((s.type === 'entrega') !== (t.group === 'Banheiros')) continue
        seen.add(t.photo)
        photos.push({ id: uid('ph'), src: t.photo, label: `${s.type === 'entrega' ? 'Entrega' : 'Montagem'} · ${t.short}`, moment: 'entrega' })
      }
      if (!photos.length) photos.push(photoFor(r, s.unitIds, 'entrega', 'Entrega', 0))
    }
    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      checklist,
      photos,
      signature: { name: r.contact.name, role: r.contact.role, dataUrl: signatureDataUrl(`${r.contact.name}${dayOf(s.start)}`) },
      notes: R.chance(0.12) ? R.pick(NOTES) : undefined,
      damageIds: [],
    }
  }

  /* ───────── serviços planejados por locação ───────── */
  const sched = createScheduler([], (id) => rentalById.get(id)?.bairroId)
  const unitIdx = new Map(units.map((u) => [u.id, u]))
  const planned: Service[] = []
  const withServices = rentals.filter((r) => ['em_campo', 'retirada', 'faturada', 'confirmada'].includes(r.status)).sort((a, b) => a.start.localeCompare(b.start))
  for (const r of withServices) {
    const m = meta.get(r.id)!
    const faturadaSparse = r.status === 'faturada' && !m.tag
    const list = planRentalServices(r, {
      units: unitIdx,
      types: typeById,
      scheduler: sched,
      horizon: r.status === 'em_campo' || r.status === 'confirmada' ? D(14) : r.end,
      fromDay: faturadaSparse || r.status === 'confirmada' ? undefined : D(-Math.min(m.denseDays, 16 + (m.tag ? 100 : 0))),
      newId: uid,
    })
    if (faturadaSparse) {
      const cleans = list.filter((s) => s.type === 'limpeza')
      const keep = new Set<string>()
      if (cleans.length <= 2) cleans.forEach((c) => keep.add(c.id))
      else for (const k of [0.3, 0.7]) keep.add(cleans[Math.floor(cleans.length * k)].id)
      planned.push(...list.filter((s) => s.type !== 'limpeza' || keep.has(s.id)))
    } else planned.push(...list)
  }
  // o dia de hoje é montado à mão (14 serviços); sai a limpeza automática de hoje
  let services = planned.filter((s) => !(s.type === 'limpeza' && dayOf(s.start) === today))

  /* ───────── hoje: 14 serviços, "agora" = 10:40 ───────── */
  const hhmm = (h: number, m = 0) => h * 60 + m
  const emCampo = rentals.filter((r) => r.status === 'em_campo')
  const cleanableIds = (r: Rental) => r.items.filter((i) => typeById.get(i.typeId)!.cleanable).flatMap((i) => i.unitIds)
  const cleaners = emCampo.filter((r) => cleanableIds(r).length > 0 && r.cleaningsPerWeek > 0)
  const usedToday = new Set<string>()
  const pickFor = (team: string, preferTag?: string): Rental => {
    const tagId = preferTag ? tags.get(preferTag) : undefined
    if (tagId && !usedToday.has(tagId)) return rentalById.get(tagId)!
    const zoneTeam = (r: Rental) => teamIdForBairro(r.bairroId)
    const c = cleaners.find((r) => zoneTeam(r) === team && !usedToday.has(r.id)) ?? cleaners.find((r) => !usedToday.has(r.id))!
    return c
  }
  const addToday = (teamId: string, r: Rental, type: Service['type'], startMin: number, status: Service['status'], opts: { units?: string[]; note?: string; progress?: number } = {}) => {
    usedToday.add(r.id)
    const ids = opts.units ?? (type === 'manutencao' ? [r.items.flatMap((i) => i.unitIds)[0]] : cleanableIds(r))
    const s: Service = {
      id: uid('svc'),
      rentalId: r.id,
      clientId: r.clientId,
      teamId,
      type,
      start: atTime(today, startMin),
      durationMin: type === 'manutencao' ? 50 : serviceDuration(type, ids.length),
      order: 0,
      status,
      unitIds: ids,
      extra: false,
      note: opts.note,
    }
    services.push(s)
    return s
  }
  addToday('eq-1', pickFor('eq-1'), 'limpeza', hhmm(7, 40), 'concluido')
  addToday('eq-1', pickFor('eq-1'), 'limpeza', hhmm(10, 0), 'em_andamento')
  addToday('eq-2', pickFor('eq-2', 'aurora-2'), 'limpeza', hhmm(8, 0), 'concluido')
  addToday('eq-2', pickFor('eq-2'), 'limpeza', hhmm(10, 30), 'a_caminho')
  addToday('eq-3', pickFor('eq-3'), 'limpeza', hhmm(9, 15), 'atrasado')
  addToday('eq-3', pickFor('eq-3'), 'limpeza', hhmm(12, 30), 'agendado')
  addToday('eq-4', pickFor('eq-4', 'aurora-1'), 'limpeza', hhmm(7, 45), 'concluido')
  addToday('eq-4', pickFor('eq-4'), 'manutencao', hhmm(9, 30), 'atrasado', { note: 'Trinco da porta travado, cliente pediu troca' })
  addToday('eq-4', pickFor('eq-4'), 'limpeza', hhmm(13, 30), 'agendado')
  addToday('eq-5', pickFor('eq-5'), 'limpeza', hhmm(8, 30), 'concluido')
  addToday('eq-6', pickFor('eq-6'), 'limpeza', hhmm(11, 30), 'agendado')
  // encaixes de última hora: serviços de bairros espalhados na mesma equipe, na ordem em que o cliente pediu.
  // É daí que a otimização de rotas (optimizeRoutes) tira quilômetros.
  const pickIn = (bairro: string): Rental | undefined => cleaners.find((r) => r.bairroId === bairro && !usedToday.has(r.id))
  const lateFit: [string, string, number][] = [
    ['eq-4', 'ceilandia', hhmm(11, 5)],
    ['eq-4', 'vicente-pires', hhmm(12, 20)],
    ['eq-3', 'setor-clubes', hhmm(11, 10)],
    ['eq-3', 'guara', hhmm(13, 40)],
  ]
  for (const [team, bairro, at] of lateFit) {
    const r = pickIn(bairro)
    if (r) addToday(team, r, 'limpeza', at, 'agendado')
  }
  // entregas e retiradas de hoje que vêm das locações
  const setTodayService = (pred: (s: Service) => boolean, startMin: number, status: Service['status'], team?: string) => {
    const s = services.find((x) => dayOf(x.start) === today && pred(x))
    if (!s) return
    s.start = atTime(today, startMin)
    s.status = status
    if (team) s.teamId = team
  }
  const rentalByTag = (t: string) => rentalById.get(tags.get(t)!)!
  setTodayService((s) => s.type === 'entrega' && s.rentalId === rentalByTag('entrega-hoje').id, hhmm(13, 0), 'agendado')
  const retToday = withServices.filter((r) => r.end === today)
  for (const r of retToday) {
    if (r.status === 'retirada') setTodayService((s) => s.type === 'retirada' && s.rentalId === r.id, hhmm(7, 30), 'concluido')
    else setTodayService((s) => s.type === 'retirada' && s.rentalId === r.id, hhmm(15, 0), 'agendado')
  }

  /* ───────── status e relatórios ───────── */
  services = services.map((s) => {
    const day = dayOf(s.start)
    if (day < today) return { ...s, status: 'concluido' as const, startedAt: undefined, report: makeReport(s) }
    if (day > today) return { ...s, status: 'agendado' as const }
    if (s.status === 'concluido') return { ...s, report: makeReport(s, 0) }
    if (s.status === 'em_andamento') {
      const startedAt = atTime(today, minutesOf(s.start) + 5)
      return { ...s, startedAt }
    }
    return s
  })

  /* ───────── extras: concluídos, uns faturados, 5 por faturar em 3 locações ───────── */
  const extraRentals = emCampo.filter((r) => !meta.get(r.id)?.tag && cleanableIds(r).length >= 1 && r.kind === 'obra')
  const pickExtra = (i: number) => extraRentals[(i * 5 + 2) % extraRentals.length]
  const addExtra = (r: Rental, daysAgo: number, type: 'limpeza' | 'manutencao', billed: boolean, note: string, R: Rng = rng): Service => {
    const ids = type === 'limpeza' ? cleanableIds(r).slice(0, 3) : [r.items.flatMap((i) => i.unitIds)[0]]
    const dur = type === 'limpeza' ? serviceDuration('limpeza', ids.length) : 50
    const team = teamIdForBairro(r.bairroId)
    const slot = sched.place(team, D(-daysAgo), dur, { earliest: 13 * 60, bairroId: r.bairroId })
    const unit = type === 'limpeza' ? round2((R.int(60, 90) + R.pick([0.5, 0.9, 0.0])) * ids.length) : round2(R.int(120, 185) + 0.4)
    const s: Service = {
      id: uid('svc'),
      rentalId: r.id,
      clientId: r.clientId,
      teamId: team,
      type,
      start: atTime(slot.day, slot.startMin),
      durationMin: dur,
      order: 0,
      status: 'concluido',
      unitIds: ids,
      extra: true,
      extraValue: unit,
      extraBilled: billed,
      note,
    }
    s.report = makeReport(s, undefined, R)
    services.push(s)
    return s
  }
  const rA = pickExtra(0)
  const rB = pickExtra(1)
  const rC = pickExtra(2)
  addExtra(rA, 2, 'limpeza', false, 'Limpeza extra pedida pelo cliente após concretagem')
  addExtra(rA, 6, 'limpeza', false, 'Limpeza extra antes de vistoria')
  addExtra(rB, 1, 'limpeza', false, 'Limpeza extra depois de evento na obra')
  addExtra(rB, 4, 'manutencao', false, 'Troca de unidade com defeito, fora do contrato')
  addExtra(rC, 9, 'limpeza', false, 'Limpeza extra no fim de semana')
  // extras antigos, já faturados (cobrança criada adiante)
  const billedExtras: Service[] = [
    addExtra(pickExtra(3), 52, 'limpeza', true, 'Limpeza extra pedida pelo cliente'),
    addExtra(pickExtra(3), 47, 'limpeza', true, 'Limpeza extra pedida pelo cliente'),
    addExtra(pickExtra(4), 33, 'manutencao', true, 'Troca de unidade com defeito, fora do contrato'),
    addExtra(pickExtra(5), 21, 'limpeza', true, 'Limpeza extra para vistoria'),
  ]
  // extras faturados no mês anterior e neste mês (dinheiro que o sistema recupera). Sorteio próprio: não mexe na semente das demais regras.
  const rng2 = createRng(0x2b7e1516)
  const curKey = monthKey(today)
  const prevKey = addMonths(curKey, -1)
  const dayIn = (key: string, dd: number) => `${key}-${String(dd).padStart(2, '0')}`
  const recExtras: { services: Service[]; issue: ISODate; paid: ISODate; month: 'prev' | 'cur' }[] = []
  const addRecExtra = (month: 'prev' | 'cur', date: ISODate, type: 'limpeza' | 'manutencao', note: string, issue: ISODate, paid: ISODate) => {
    if (date >= today || issue > today) return
    const r = extraRentals.find((x, i) => x.start <= date && x.end >= date && i >= 3) ?? extraRentals.find((x) => x.start <= date && x.end >= date)
    if (!r) return
    const svc = addExtra(r, diffDays(date, today), type, true, note, rng2)
    if (dayOf(svc.start) >= today) return
    recExtras.push({ services: [svc], issue, paid: paid > addDays(today, -1) ? addDays(today, -1) : paid, month })
  }
  addRecExtra('prev', dayIn(prevKey, 6), 'limpeza', 'Limpeza extra pedida pelo cliente', dayIn(prevKey, 9), dayIn(prevKey, 17))
  addRecExtra('prev', dayIn(prevKey, 17), 'manutencao', 'Troca de unidade com defeito, fora do contrato', dayIn(prevKey, 20), dayIn(prevKey, 27))
  {
    const d = monthStart(curKey) > addDays(today, -6) ? monthStart(curKey) : addDays(today, -6)
    const issue = addDays(d, 2) > today ? today : addDays(d, 2)
    addRecExtra('cur', d, 'limpeza', 'Limpeza extra para vistoria', issue, addDays(issue, 3))
  }
  services = renumberOrders(services).sort((a, b) => a.start.localeCompare(b.start))

  /* ───────── avarias ───────── */
  const damages: Damage[] = []
  const svcByRentalDay = (rentalId: string, day: ISODate, type?: Service['type']) => services.find((s) => s.rentalId === rentalId && dayOf(s.start) === day && s.status === 'concluido' && (!type || s.type === type))
  const addDamage = (o: { unitId: string; rentalId: string; date: ISODate; kind: string; value: number; status: Damage['status']; serviceType?: Service['type'] }, R: Rng = rng): Damage => {
    const r = rentalById.get(o.rentalId)!
    const u = unitById.get(o.unitId)!
    const t = typeById.get(u.typeId)!
    const svc = svcByRentalDay(o.rentalId, o.date, o.serviceType) ?? svcByRentalDay(o.rentalId, o.date)
    const d: Damage = {
      id: uid('dmg'),
      unitId: o.unitId,
      rentalId: o.rentalId,
      clientId: r.clientId,
      serviceId: svc?.id,
      date: o.date,
      kind: o.kind,
      description: DAMAGE_DESCRIPTIONS[o.kind] ?? o.kind,
      photos: [
        { id: uid('ph'), src: t.photo, label: `${o.kind} · ${u.code}`, moment: 'avaria' },
        ...(R.chance(0.5) ? [{ id: uid('ph'), src: t.photo, label: `Detalhe · ${u.code}`, moment: 'avaria' as const }] : []),
      ],
      value: o.value,
      status: o.status,
    }
    if (svc?.report) {
      svc.report.damageIds.push(d.id)
      svc.report.photos.push(d.photos[0])
    }
    damages.push(d)
    return d
  }
  // 3 avarias de 3 dias atrás, do mesmo cliente, achadas na retirada
  const horizonte = rentalById.get(tags.get('horizonte')!)!
  const hzUnits = horizonte.items.find((i) => i.typeId === 'bq')!.unitIds
  addDamage({ unitId: hzUnits[0], rentalId: horizonte.id, date: D(-3), kind: 'Porta quebrada', value: 438.6, status: 'registrada', serviceType: 'retirada' })
  addDamage({ unitId: hzUnits[1], rentalId: horizonte.id, date: D(-3), kind: 'Tanque danificado', value: 612.3, status: 'registrada', serviceType: 'retirada' })
  addDamage({ unitId: hzUnits[2], rentalId: horizonte.id, date: D(-3), kind: 'Pichação', value: 148.9, status: 'registrada', serviceType: 'retirada' })
  // 4 avarias em locações em campo, achadas em limpezas
  const fieldPick = (type: string, i: number): { r: Rental; unitId: string } => {
    const cand = emCampo.filter((r) => r.items.some((it) => it.typeId === type) && !meta.get(r.id)?.tag)
    const r = cand[(i * 3 + 1) % cand.length]
    return { r, unitId: r.items.find((it) => it.typeId === type)!.unitIds[0] }
  }
  const lastClean = (r: Rental, maxAgo: number, minAgo: number): ISODate => {
    const s = services.filter((x) => x.rentalId === r.id && x.type === 'limpeza' && !x.extra && x.status === 'concluido' && diffDays(dayOf(x.start), today) <= maxAgo && diffDays(dayOf(x.start), today) >= minAgo)
    return s.length ? dayOf(s[0].start) : D(-minAgo)
  }
  const f1 = fieldPick('bq', 0)
  addDamage({ unitId: f1.unitId, rentalId: f1.r.id, date: lastClean(f1.r, 2, 1), kind: 'Pichação', value: 186.4, status: 'registrada', serviceType: 'limpeza' })
  const f2 = fieldPick('bq', 1)
  addDamage({ unitId: f2.unitId, rentalId: f2.r.id, date: lastClean(f2.r, 4, 2), kind: 'Trinco ou fechadura', value: 92.4, status: 'registrada', serviceType: 'limpeza' })
  const f3 = fieldPick('tnd10', 0)
  addDamage({ unitId: f3.unitId, rentalId: f3.r.id, date: D(-1), kind: 'Lona rasgada', value: 1386.4, status: 'registrada' })
  const f4 = fieldPick('bq', 2)
  addDamage({ unitId: f4.unitId, rentalId: f4.r.id, date: lastClean(f4.r, 11, 8), kind: 'Mictório trincado', value: 268.5, status: 'registrada', serviceType: 'limpeza' })
  // histórico: cobradas, pagas e dispensadas
  const hist = (type: string, i: number, ago: number, kind: string, value: number, status: Damage['status'], R: Rng = rng) => {
    const pool = rentals.filter((r) => (r.status === 'faturada' || r.status === 'em_campo') && r.items.some((it) => it.typeId === type && it.unitIds.length) && diffDays(r.start, D(-ago)) >= 0 && diffDays(D(-ago), r.end) >= 0)
    const r = pool[(i * 2) % Math.max(1, pool.length)] ?? rentals.find((x) => x.items.some((it) => it.typeId === type && it.unitIds.length) && x.status === 'faturada')!
    const date = D(-ago) >= r.start && D(-ago) <= r.end ? D(-ago) : r.end
    return addDamage({ unitId: r.items.find((it) => it.typeId === type && it.unitIds.length)!.unitIds[0], rentalId: r.id, date, kind, value, status }, R)
  }
  const dCob1 = hist('bq', 0, 14, 'Mictório trincado', 301.7, 'cobrada')
  const dCob2 = hist('pcd', 0, 21, 'Trinco ou fechadura', 164.9, 'cobrada')
  const dCob3 = hist('bq', 3, 30, 'Porta quebrada', 389.4, 'cobrada')
  const dPag = [hist('bq', 4, 48, 'Tanque danificado', 702.8, 'paga'), hist('tnd5', 0, 66, 'Lona rasgada', 1184.6, 'paga'), hist('bq', 6, 84, 'Pichação', 133.9, 'paga'), hist('ala', 0, 105, 'Grade empenada', 241.5, 'paga')]
  hist('bq', 8, 25, 'Teto trincado', 214.8, 'dispensada')
  hist('fec', 0, 70, 'Estrutura amassada', 317.4, 'dispensada')

  /* ───────── cobranças ───────── */
  const charges: Charge[] = []
  const MET: PayMethod[] = ['pix', 'boleto']
  const newCharge = (o: Partial<Charge> & Pick<Charge, 'clientId' | 'kind' | 'description' | 'value' | 'issuedAt' | 'dueAt' | 'status'>, R: Rng = rng): Charge => {
    const c: Charge = {
      id: uid('chg'),
      code: '',
      method: o.method ?? (clientById.get(o.clientId)!.kind === 'Construtora' ? (R.chance(0.55) ? 'boleto' : 'pix') : R.pick(MET)),
      reminders: [],
      ...o,
    }
    if (c.status !== 'rascunho') {
      c.sentAt = atTime(c.issuedAt, 9 * 60 + R.int(0, 120))
      c.sentVia = R.chance(0.7) ? 'email' : 'portal'
    }
    charges.push(c)
    return c
  }
  for (const r of rentals) {
    if (!['em_campo', 'retirada', 'faturada', 'confirmada'].includes(r.status)) continue
    let cycles = billingCycles(r.kind, r.start, r.end)
    if (r.status === 'retirada' && cycles.length > 1) cycles = cycles.slice(0, -1) // a última sai no fechamento
    cycles.forEach((c, idx) => {
      const created = dayOf(r.createdAt)
      let issue = r.kind === 'obra' ? addDays(c.from, -2) : addDays(c.from, -3)
      if (r.status === 'confirmada') issue = idx === 0 ? D(-1) : issue
      if (issue <= created) issue = addDays(created, 1)
      if (issue > today) return
      // evento: fatura na entrega e vence 10 dias após o fim; obra: vencimento em 15 dias
      const due = r.kind === 'obra' ? addDays(issue, 15) : r.status === 'confirmada' ? (addDays(c.from, -1) > issue ? addDays(c.from, -1) : addDays(issue, 5)) : addDays(c.to, 10)
      const value = cycleAmount(r.items, c.days)
      let status: Charge['status'] = 'aberta'
      let paidAt: ISODate | undefined
      if (due < today) {
        const p = addDays(due, rng.int(-5, 6))
        paidAt = p >= today ? addDays(today, -1) : p < issue ? addDays(issue, 1) : p
        status = 'paga'
      } else if (diffDays(issue, today) >= 4 && rng.chance(0.2)) {
        paidAt = addDays(issue, rng.int(1, 3))
        status = 'paga'
      }
      newCharge({
        clientId: r.clientId,
        rentalId: r.id,
        kind: r.kind === 'obra' ? 'mensalidade' : 'locacao',
        description: r.kind === 'obra' ? `Mensalidade ${idx + 1} de ${cycles.length + (r.status === 'retirada' ? 1 : 0)} · ${r.title}` : `Locação · ${r.title}`,
        value,
        issuedAt: issue,
        dueAt: due,
        paidAt,
        status,
      })
    })
  }
  // avarias com cobrança
  const damageCharge = (d: Damage, status: Charge['status'], paid?: ISODate, R: Rng = rng, issueAt?: ISODate) => {
    const r = rentalById.get(d.rentalId)!
    // cobrança em aberto foi enviada há poucos dias e ainda está no prazo; rascunho nasce hoje
    const issue = issueAt ?? (status === 'aberta' ? D(-R.int(2, 5)) : status === 'rascunho' ? today : addDays(d.date, 2))
    const c = newCharge({
      clientId: d.clientId,
      rentalId: d.rentalId,
      kind: 'avaria',
      description: `Avaria: ${d.kind} · ${unitById.get(d.unitId)!.code} · ${r.code}`,
      value: d.value,
      issuedAt: issue,
      dueAt: addDays(issue, 10),
      paidAt: paid,
      status,
      method: 'pix',
      damageId: d.id,
    }, R)
    d.chargeId = c.id
    return c
  }
  damageCharge(dCob1, 'aberta')
  damageCharge(dCob2, 'rascunho')
  damageCharge(dCob3, 'aberta')
  dPag.forEach((d, i) => damageCharge(d, 'paga', addDays(d.date, 8 + i)))
  // extras já faturados
  const extraChargeOf = new Map<string, string>()
  const billedGroups: Service[][] = [[billedExtras[0], billedExtras[1]], [billedExtras[2]], [billedExtras[3]]]
  for (const g of billedGroups) {
    const r = rentalById.get(g[0].rentalId)!
    const day = addDays(dayOf(g[g.length - 1].start), 3)
    const c = newCharge({
      clientId: r.clientId,
      rentalId: r.id,
      kind: 'extra',
      description: `Serviços extras · ${r.code}`,
      value: round2(g.reduce((a, s) => a + (s.extraValue ?? 0), 0)),
      issuedAt: day,
      dueAt: addDays(day, 10),
      paidAt: addDays(day, 7),
      status: 'paga',
      serviceIds: g.map((s) => s.id),
    })
    for (const s of g) extraChargeOf.set(s.id, c.id)
  }
  // extras faturados do histórico recente (mês anterior e atual)
  for (const g of recExtras) {
    const r = rentalById.get(g.services[0].rentalId)!
    const c = newCharge({
      clientId: r.clientId,
      rentalId: r.id,
      kind: 'extra',
      description: `Serviços extras · ${r.code}`,
      value: round2(g.services.reduce((a, s) => a + (s.extraValue ?? 0), 0)),
      issuedAt: g.issue,
      dueAt: addDays(g.issue, 10),
      paidAt: g.paid < g.issue ? g.issue : g.paid,
      status: 'paga',
      serviceIds: g.services.map((s) => s.id),
    }, rng2)
    for (const s of g.services) extraChargeOf.set(s.id, c.id)
  }
  const dueByCharge = (c: Charge) => c.dueAt

  // 6 atrasadas de 4 clientes
  const overdueCands = charges.filter((c) => c.status === 'paga' && (c.kind === 'mensalidade' || c.kind === 'locacao') && c.dueAt <= D(-5) && c.dueAt >= D(-46))
  const byClient = new Map<string, Charge[]>()
  for (const c of overdueCands) byClient.set(c.clientId, [...(byClient.get(c.clientId) ?? []), c])
  const pickClients = [...byClient.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
  const withTwo = pickClients.filter(([, l]) => l.length >= 2).slice(0, 2)
  const withOne = pickClients.filter(([id]) => !withTwo.some(([x]) => x === id)).slice(0, 2)
  const chosen: Charge[] = [...withTwo.flatMap(([, l]) => l.sort((a, b) => dueByCharge(a).localeCompare(dueByCharge(b))).slice(0, 2)), ...withOne.map(([, l]) => l[0])]
  chosen.forEach((c, i) => {
    c.status = 'atrasada'
    c.paidAt = undefined
    const n = 1 + (i % 3)
    for (let k = 0; k < n; k++) {
      const at = addDays(c.dueAt, 3 + k * 5)
      if (at < today) c.reminders.push({ at: atTime(at, 10 * 60 + 5 * k), channel: k % 2 ? 'portal' : 'email' })
    }
  })

  // o cliente do portal tem uma única fatura aberta (a mais recente); as outras já foram pagas
  const aurOpen = charges.filter((c) => c.clientId === 'cli-001' && c.status === 'aberta' && !c.damageId).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  for (const c of aurOpen.slice(0, -1)) {
    c.status = 'paga'
    c.paidAt = c.issuedAt < D(-1) ? addDays(c.issuedAt, rng.int(1, 3)) : D(-1)
    if (c.paidAt > D(-1)) c.paidAt = D(-1)
  }

  /* ───────── dinheiro recuperado: avarias e atrasados do mês anterior e do atual ───────── */
  // O total do mês anterior fica na casa de R$ 7,4 mil: o que vem das unidades paradas que voltaram a alugar sai das locações,
  // e as avarias cobradas absorvem a diferença (valores quebrados). Sorteio próprio (rng2).
  {
    const TARGET_PREV = 7418.4
    const sumValues = (l: { value: number }[]) => round2(l.reduce((a, x) => a + x.value, 0))
    const idlePrev = sumValues(idleReRentedItems({ rentals, units, clients }, prevKey, today))
    const extrasPrev = round2(recExtras.filter((g) => g.month === 'prev').reduce((a, g) => a + g.services.reduce((b, x) => b + (x.extraValue ?? 0), 0), 0))
    const rest = Math.max(2400, round2(TARGET_PREV - idlePrev - extrasPrev))
    // atrasados que pagaram depois de um lembrete: escolhe, entre as cobranças pagas com atraso, as que chegam mais perto de 30% do restante
    const lateCands = (key: string) =>
      charges
        .filter((c) => c.status === 'paga' && (c.kind === 'mensalidade' || c.kind === 'locacao') && c.paidAt && c.paidAt > c.dueAt && c.paidAt <= today && monthKey(c.paidAt) === key && c.value >= 150 && c.value <= 2600 && !c.reminders.length)
        .sort((a, b) => a.paidAt!.localeCompare(b.paidAt!) || a.code.localeCompare(b.code))
        .slice(0, 12)
    const remind = (c: Charge, i: number) => {
      const day = addDays(c.dueAt, 1) > addDays(c.paidAt!, -1) ? addDays(c.dueAt, 1) : addDays(c.paidAt!, -1)
      c.reminders.push({ at: atTime(day, 9 * 60 + 10 + 5 * i), channel: i % 2 ? 'portal' : 'email' })
    }
    const prevC = lateCands(prevKey)
    let best: Charge[] = []
    let bestGap = Infinity
    const want = rest * 0.3
    for (let a = 0; a < prevC.length; a++) for (let b = a + 1; b < prevC.length; b++) for (let c = b; c < prevC.length; c++) {
      const pick = c === b ? [prevC[a], prevC[b]] : [prevC[a], prevC[b], prevC[c]]
      const gap = Math.abs(sumValues(pick) - want)
      if (gap < bestGap) {
        bestGap = gap
        best = pick
      }
    }
    best.forEach(remind)
    const overduePrev = sumValues(best)
    for (const c of lateCands(curKey).slice(0, 2)) remind(c, 1)
    // avarias cobradas (e pagas) no mês anterior: três, com o valor que falta para fechar o total
    const dmgTotal = Math.max(900, round2(rest - overduePrev))
    const v1 = oddMoney(dmgTotal * 0.46, rng2)
    const v2 = oddMoney(dmgTotal * 0.31, rng2)
    const values = [v1, v2, round2(dmgTotal - v1 - v2)]
    const kinds: [string, string[]][] = [
      ['Porta quebrada', ['bq', 'pcd']],
      ['Tanque danificado', ['bq']],
      ['Grade empenada', ['ala', 'fec']],
    ]
    const target = (types: string[], date: ISODate, k: number): { r: Rental; unitId: string } | undefined => {
      const cands = rentals
        .filter((r) => ['faturada', 'em_campo', 'retirada'].includes(r.status) && r.start <= date && r.end >= date && r.items.some((it) => types.includes(it.typeId) && it.unitIds.length))
        .sort((a, b) => a.code.localeCompare(b.code))
      if (!cands.length) return undefined
      const r = cands[(k * 3 + 1) % cands.length]
      const it = r.items.find((x) => types.includes(x.typeId) && x.unitIds.length)!
      return { r, unitId: it.unitIds[k % it.unitIds.length] }
    }
    const addRec = (kindIdx: number, date: ISODate, value: number, issue: ISODate, paid: ISODate, k: number) => {
      const [kind, tys] = kinds[kindIdx]
      const t = target(tys, date, k)
      if (!t || issue > today) return
      const d = addDamage({ unitId: t.unitId, rentalId: t.r.id, date, kind, value, status: 'paga' }, rng2)
      damageCharge(d, 'paga', paid > addDays(today, -1) ? addDays(today, -1) : paid < issue ? issue : paid, rng2, issue)
    }
    addRec(0, dayIn(prevKey, 5), values[0], dayIn(prevKey, 7), dayIn(prevKey, 13), 0)
    addRec(1, dayIn(prevKey, 12), values[1], dayIn(prevKey, 14), dayIn(prevKey, 21), 1)
    addRec(2, dayIn(prevKey, 19), values[2], dayIn(prevKey, 22), dayIn(prevKey, 27), 2)
    // neste mês: uma avaria cobrada e paga
    const cd = monthStart(curKey) > addDays(today, -6) ? monthStart(curKey) : addDays(today, -6)
    const ci = addDays(cd, 2) > today ? today : addDays(cd, 2)
    addRec(1, cd, oddMoney(520 + rng2.int(0, 220), rng2), ci, addDays(ci, 3), 4)
  }

  // ajusta para ~30 abertas
  const openCount = () => charges.filter((c) => c.status === 'aberta').length
  const TARGET_OPEN = 30
  if (openCount() > TARGET_OPEN) {
    const closable = charges.filter((c) => c.status === 'aberta' && !c.damageId && c.kind !== 'extra').sort((a, b) => a.value - b.value)
    for (const c of closable) {
      if (openCount() <= TARGET_OPEN) break
      c.status = 'paga'
      c.paidAt = addDays(today, -rng.int(1, 3))
      if (c.paidAt < c.issuedAt) c.paidAt = c.issuedAt
    }
  } else if (openCount() < TARGET_OPEN) {
    // pagas antecipadamente (vencimento ainda no futuro) voltam a abertas, das menores para as maiores
    const reopen = charges.filter((c) => c.status === 'paga' && c.clientId !== 'cli-001' && !c.damageId && c.kind !== 'extra' && c.dueAt >= today && c.paidAt).sort((a, b) => a.value - b.value)
    for (const c of reopen) {
      if (openCount() >= TARGET_OPEN) break
      c.status = 'aberta'
      c.paidAt = undefined
    }
  }

  // receita mensal crescente: o que falta para a curva vira cobranças de locações antigas (sem locação ligada)
  const curve: Record<number, number> = { [-11]: 27640, [-10]: 29120, [-9]: 30980, [-8]: 32610, [-7]: 34380, [-6]: 36240, [-5]: 38710, [-4]: 41120, [-3]: 43460, [-2]: 45890, [-1]: 48060 }
  const thisMonth = monthKey(today)
  const natural = (key: string) => round2(charges.filter((c) => c.status === 'paga' && c.paidAt && monthKey(c.paidAt) === key).reduce((a, c) => a + c.value, 0))
  let prev = 0
  const legacyNames = ['Locação de banheiros químicos', 'Locação de estruturas', 'Locação mensal de banheiros', 'Locação de tendas e alambrado', 'Locação de banheiros e fechamento']
  for (let m = -11; m <= -1; m++) {
    const key = addMonths(thisMonth, m)
    const nat = natural(key)
    let want = Math.max(curve[m], nat + 2200)
    if (want < prev + 600) want = prev + 600
    prev = want
    let remaining = round2(want - nat)
    const pieces = Math.max(2, Math.ceil(remaining / 3200))
    for (let i = 0; i < pieces; i++) {
      const last = i === pieces - 1
      const share = last ? remaining : oddMoney((remaining / (pieces - i)) * rng.float(0.7, 1.3), rng)
      remaining = round2(remaining - share)
      const dayN = rng.int(2, 27)
      const paid = `${key}-${String(dayN).padStart(2, '0')}`
      const client = rng.pick(clients)
      newCharge({
        clientId: client.id,
        kind: 'locacao',
        description: `${rng.pick(legacyNames)} · contrato encerrado`,
        value: share,
        issuedAt: addDays(paid, -rng.int(14, 22)),
        dueAt: addDays(paid, -rng.int(0, 4)),
        paidAt: paid,
        status: 'paga',
      })
    }
  }
  void monthStart

  // códigos em ordem de emissão
  charges.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt) || a.id.localeCompare(b.id))
  charges.forEach((c, i) => (c.code = `COB-${5001 + i}`))

  /* ───────── avisos ───────── */
  const hoursAgo = (h: number) => new Date(atTime(today, 10 * 60 + 40)).getTime() - h * 3600000
  const ago = (h: number) => new Date(hoursAgo(h)).toISOString()
  const todaySvc = services.filter((s) => dayOf(s.start) === today)
  const late = todaySvc.find((s) => s.status === 'atrasado' && s.type === 'limpeza')!
  const done = todaySvc.find((s) => s.status === 'concluido' && s.type === 'limpeza')!
  const lateR = rentalById.get(late.rentalId)!
  const doneR = rentalById.get(done.rentalId)!
  const teamName = (id: string) => teams.find((t) => t.id === id)!.name
  const lastPaid = [...charges].filter((c) => c.status === 'paga' && c.paidAt).sort((a, b) => b.paidAt!.localeCompare(a.paidAt!))[0]
  const anyOverdue = charges.find((c) => c.status === 'atrasada')!
  const regd = damages.filter((d) => d.status === 'registrada')
  const unsigned = rentals.find((r) => r.status === 'confirmada' && !r.contract?.signedAt)!
  const orc = rentals.find((r) => r.status === 'orcamento')!
  const notifications: Notification[] = [
    { id: uid('ntf'), kind: 'atraso', title: 'Serviço atrasado', text: `${teamName(late.teamId)} ainda não chegou em ${lateR.title}. Previsto para 09:15.`, at: ago(1.2), read: false, ref: { type: 'service', id: late.id } },
    { id: uid('ntf'), kind: 'servico', title: 'Limpeza concluída', text: `${teamName(done.teamId)} finalizou a limpeza em ${doneR.title}, com fotos e assinatura.`, at: ago(2.1), read: false, ref: { type: 'service', id: done.id } },
    { id: uid('ntf'), kind: 'pagamento', title: 'Pagamento recebido', text: `${clientById.get(lastPaid.clientId)!.name} pagou ${lastPaid.code}.`, at: ago(5), read: false, ref: { type: 'charge', id: lastPaid.id } },
    { id: uid('ntf'), kind: 'avaria', title: 'Avaria registrada', text: `${regd[0].kind} na unidade ${unitById.get(regd[0].unitId)!.code}, achada na retirada.`, at: new Date(atTime(D(-3), 11 * 60 + 20)).toISOString(), read: false, ref: { type: 'damage', id: regd[0].id } },
    { id: uid('ntf'), kind: 'atraso', title: 'Cobrança vencida', text: `${clientById.get(anyOverdue.clientId)!.name} está com ${anyOverdue.code} em atraso.`, at: ago(20), read: false, ref: { type: 'charge', id: anyOverdue.id } },
    { id: uid('ntf'), kind: 'locacao', title: 'Contrato aguardando assinatura', text: `${unsigned.title} começa em ${diffDays(today, unsigned.start)} dias e o contrato ainda não foi assinado.`, at: ago(26), read: false, ref: { type: 'rental', id: unsigned.id } },
    { id: uid('ntf'), kind: 'copiloto', title: 'Sugestão do copiloto', text: 'Há avarias sem cobrança e extras por faturar. Veja o que o copiloto separou.', at: ago(30), read: true },
    { id: uid('ntf'), kind: 'portal', title: 'Cliente abriu o portal', text: 'Construtora Aurora consultou os relatórios de limpeza.', at: ago(36), read: true, ref: { type: 'client', id: 'cli-001' } },
    { id: uid('ntf'), kind: 'locacao', title: 'Orçamento sem resposta', text: `${orc.title} está sem retorno do cliente.`, at: ago(44), read: true, ref: { type: 'rental', id: orc.id } },
    { id: uid('ntf'), kind: 'servico', title: 'Retirada concluída', text: 'Equipamentos de uma obra voltaram para a base e seguem para higienização.', at: ago(50), read: true },
    { id: uid('ntf'), kind: 'pagamento', title: 'Pagamento recebido', text: `Pagamento de ${charges.filter((c) => c.status === 'paga')[3].code} confirmado por Pix.`, at: ago(60), read: true },
  ]

  const finalServices = services.map((s) => (extraChargeOf.has(s.id) ? { ...s, extraChargeId: extraChargeOf.get(s.id) } : s))
  return { services: finalServices, damages, charges, notifications, seq }
}
