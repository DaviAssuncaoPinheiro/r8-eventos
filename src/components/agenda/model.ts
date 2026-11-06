import { BAIRRO, BASE, ZONE, type ZoneId } from '@/data/geo'
import { JOB, NOW, RENTAL, RENTALS, TEAM, TEAMS, WEEK_PLAN, cleanableQty, onSite, type Job, type JobStatus, type JobType } from '@/data/mock'
import { TODAY, daysFromToday, day, fmt } from '@/data/time'
import { KM_PER_UNIT } from '@/components/map/geometry'

/** Serviço normalizado para a agenda: reais (mock + criados na demonstração) e gerados para a grade parecer viva. */
export interface AJob {
  id: string
  teamId: string
  off: number // dias a partir de hoje
  startMin: number // minutos desde 00:00
  dur: number
  rentalId: string
  bairro: string
  type: JobType
  note: string
  status: JobStatus
  fixed: boolean
  units: number
  origin: 'real' | 'gerada' | 'novo'
}

export const DAY_START = 6 * 60
export const DAY_END = 22 * 60
export const WORK_START = 7 * 60
export const WORK_END = 17 * 60
export const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes()

export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const hm = (min: number) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** offset do dia (a partir de hoje) -> segunda da semana + n */
export function mondayOffset(weekShift: number) {
  const dow = TODAY.getDay() || 7
  return -(dow - 1) + weekShift * 7
}
/** 1 = seg ... 7 = dom */
export function dowOf(off: number) {
  return day(off).getDay() || 7
}
export const dayLabel = (off: number) => `${cap(fmt.weekday(day(off)))} ${day(off).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

const SHORT: Record<string, string> = {
  jardins: 'Jardins do Lago',
  noroeste: 'Noroeste 104',
  torre36: 'Torre Rua 36',
  smart: 'Smart Taguatinga',
  escola: 'Escola 308 Sul',
  galpao: 'Galpão SIA',
  br020: 'BR-020',
  santamaria: 'Santa Maria Sul',
  festival: 'Festival Cerrado',
  casamento: 'Casamento',
  corrida: 'Corrida do Eixo',
  congresso: 'Congresso',
  'feira-gama': 'Feira do Gama',
  padroeira: 'Corrida Padroeira',
}

/** Nome curto do local para caber no cartão */
export const siteName = (rentalId: string) => SHORT[rentalId] ?? RENTAL[rentalId].title

/** Cor do texto que lê bem sobre a cor sólida do tipo de serviço */
export const typeInk = (t: JobType) => (t === 'Manutenção' ? 'var(--color-ink)' : '#ffffff')

/* ───────────── deslocamento de caminhão ───────────── */

export function kmBetween(a: string | null, b: string) {
  const pa = a ? BAIRRO[a] : null
  const pb = BAIRRO[b]
  if (a === b) return 0.8
  const ax = pa ? pa.x : BASE.x
  const ay = pa ? pa.y : BASE.y
  return Math.max(0.8, Math.hypot(pb.x - ax, pb.y - ay) * KM_PER_UNIT * 1.3)
}
/** caminhão em horário comercial: ~35 km/h de média */
export const minForKm = (km: number) => Math.round(5 + (km / 35) * 60)

/* ───────────── normalização ───────────── */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function toAJob(j: Job): AJob {
  const d = new Date(j.start)
  const r = RENTAL[j.rentalId]
  return {
    id: j.id,
    teamId: j.teamId,
    off: daysFromToday(d),
    startMin: d.getHours() * 60 + d.getMinutes(),
    dur: j.durationMin,
    rentalId: j.rentalId,
    bairro: r.bairro,
    type: j.type,
    note: j.note,
    status: j.status,
    fixed: j.fixedTime,
    units: j.units,
    origin: JOB[j.id] ? 'real' : 'novo',
  }
}

const WESLEY_NOTES = ['Vistoria das unidades e do fechamento', 'Troca de unidade com avaria', 'Reforço do fechamento metálico', 'Reposição de painéis do fechamento']

/**
 * A equipe de montagem não tem serviço todo dia no mock. Nos dias livres da escala,
 * cria manutenções nas obras da região para a semana não parecer vazia.
 */
export function fillerJobs(real: AJob[]): AJob[] {
  const out: AJob[] = []
  const first = mondayOffset(-1)
  for (let off = first; off < first + 21; off++) {
    const dow = dowOf(off)
    if (dow === 7) continue
    const team = 'wesley'
    if (real.some((v) => v.teamId === team && v.off === off)) continue
    const plan = WEEK_PLAN[team][dow] ?? []
    const sites = RENTALS.filter((r) => r.kind === 'obra' && onSite(r, off) && plan.includes(BAIRRO[r.bairro].zone))
    if (!sites.length) continue
    const h = hash(`${team}:${off}`)
    const n = 1 + (h % 2)
    for (let i = 0; i < Math.min(n, sites.length); i++) {
      const r = sites[(h + i * 3) % sites.length]
      out.push({
        id: `w-${off}-${i}`,
        teamId: team,
        off,
        startMin: i === 0 ? 8 * 60 : 13 * 60 + 30,
        dur: 60 + ((h >>> (i + 2)) % 3) * 30,
        rentalId: r.id,
        bairro: r.bairro,
        type: 'Manutenção',
        note: WESLEY_NOTES[(h >>> 5) % WESLEY_NOTES.length],
        status: off < 0 ? 'concluido' : 'agendado',
        fixed: false,
        units: 1,
        origin: 'gerada',
      })
    }
  }
  return out
}

/* ───────────── derivados por equipe × dia ───────────── */

export interface Leg {
  fromId: string | null // serviço anterior (null = base)
  toId: string
  km: number
  min: number
}

export function jobsOf(all: AJob[], teamId: string, off: number) {
  return all.filter((v) => v.teamId === teamId && v.off === off && v.status !== 'cancelado').sort((a, b) => a.startMin - b.startMin)
}

export function legsOf(list: AJob[]): Leg[] {
  return list.map((v, i) => {
    const prev = i ? list[i - 1] : null
    const km = kmBetween(prev ? prev.bairro : null, v.bairro)
    return { fromId: prev?.id ?? null, toId: v.id, km, min: minForKm(km) }
  })
}

export function zonesOfDay(list: AJob[], teamId: string, off: number): ZoneId[] {
  const counts = new Map<ZoneId, number>()
  for (const v of list) counts.set(BAIRRO[v.bairro].zone, (counts.get(BAIRRO[v.bairro].zone) ?? 0) + 1)
  const fromJobs = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([z]) => z)
  if (fromJobs.length) return fromJobs
  return [...(WEEK_PLAN[teamId][dowOf(off)] ?? [])]
}

export function loadOf(list: AJob[]) {
  const legs = legsOf(list)
  const service = list.reduce((s, v) => s + v.dur, 0)
  const travel = legs.reduce((s, l) => s + l.min, 0)
  const capacity = WORK_END - WORK_START - 60 // 10h menos 1h de almoço
  return { count: list.length, service, travel, ratio: (service + travel) / capacity }
}

/* ───────────── sugestões para novo serviço ───────────── */

export interface Suggestion {
  key: string
  teamId: string
  off: number
  startMin: number
  bairro: string
  extraKm: number
  kind: 'local' | 'regiao' | 'vizinha' | 'fora'
  title: string
  why: string
  zones: ZoneId[]
}

const NEIGHBORS: Record<ZoneId, ZoneId[]> = {
  plano: ['lagos', 'guara', 'norte'],
  lagos: ['plano', 'norte'],
  guara: ['plano', 'oeste', 'sul'],
  oeste: ['guara', 'sul'],
  sul: ['guara', 'oeste'],
  norte: ['plano', 'lagos'],
}

/** Montagem e retirada precisam do caminhão munck; limpeza precisa de caminhão de sucção. */
export function teamsFor(type: JobType) {
  if (type === 'Montagem' || type === 'Retirada') return TEAMS.filter((t) => t.id === 'wesley')
  if (type === 'Limpeza') return TEAMS.filter((t) => t.id !== 'wesley')
  return TEAMS
}

export function defaultDur(type: JobType, rentalId: string) {
  const r = RENTAL[rentalId]
  if (type === 'Limpeza') return Math.max(25, Math.min(120, cleanableQty(r) * 5))
  if (type === 'Montagem') return 120
  if (type === 'Retirada') return 90
  return 40
}

export function suggest(all: AJob[], rentalId: string, type: JobType, urgency: 'rotina' | 'semana' | 'urgente', dur: number): Suggestion[] {
  const r = RENTAL[rentalId]
  const bairro = r.bairro
  const target = BAIRRO[bairro]
  const list: (Suggestion & { score: number })[] = []
  const horizon = urgency === 'urgente' ? 2 : urgency === 'semana' ? 6 : 12
  for (let off = 0; off <= horizon; off++) {
    if (dowOf(off) === 7) continue
    for (const team of teamsFor(type)) {
      const vs = jobsOf(all, team.id, off)
      // o mesmo serviço já está marcado neste dia para esta locação
      if (all.some((v) => v.off === off && v.rentalId === rentalId && v.type === type && v.status !== 'cancelado')) continue
      const zones = zonesOfDay(vs, team.id, off)
      const plan = WEEK_PLAN[team.id][dowOf(off)] ?? []
      if (!plan.length && !vs.length) continue
      let near: AJob | null = null
      let nearKm = Infinity
      for (const v of vs) {
        const k = kmBetween(v.bairro, bairro)
        if (k < nearKm) {
          nearKm = k
          near = v
        }
      }
      const inSame = vs.some((v) => v.bairro === bairro)
      const inZone = plan.includes(target.zone) || vs.some((v) => BAIRRO[v.bairro].zone === target.zone)
      const inNeighbor = [...plan, ...zones].some((z) => NEIGHBORS[z].includes(target.zone))
      const kind: Suggestion['kind'] = inSame ? 'local' : inZone ? 'regiao' : inNeighbor ? 'vizinha' : 'fora'
      const earliest = off === 0 ? Math.ceil((NOW_MIN + 60) / 5) * 5 : WORK_START
      let slot: number | null = null
      const tryAt = (s: number) => {
        if (s < earliest || s + dur > WORK_END) return false
        if (s < 13 * 60 && s + dur > 12 * 60) return false
        return !vs.some((v) => s < v.startMin + v.dur + 15 && v.startMin < s + dur + 15)
      }
      const anchor = near ? near.startMin + near.dur + minForKm(nearKm) : 9 * 60
      const cands: number[] = []
      if (inSame) for (const sv of vs.filter((x) => x.bairro === bairro)) cands.push(Math.ceil((sv.startMin + sv.dur + 10) / 5) * 5, Math.floor((sv.startMin - dur - 10) / 5) * 5)
      const rest: number[] = []
      for (let s = WORK_START; s <= WORK_END - dur; s += 5) rest.push(s)
      rest.sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor))
      cands.push(...rest)
      for (const s of cands)
        if (tryAt(s)) {
          slot = s
          break
        }
      if (slot == null) continue
      const before = [...vs].reverse().find((v) => v.startMin + v.dur <= slot!) ?? null
      const after = vs.find((v) => v.startMin >= slot! + dur) ?? null
      const direct = before && after ? kmBetween(before.bairro, after.bairro) : 0
      const extra = Math.max(0.5, kmBetween(before?.bairro ?? null, bairro) + (after ? kmBetween(bairro, after.bairro) : kmBetween(bairro, 'sia') * 0.4) - direct)
      const extraKm = Math.round(extra * 10) / 10
      const penalty = { local: -4, regiao: 2, vizinha: 7, fora: 16 }[kind]
      const dayW = urgency === 'urgente' ? 9 : urgency === 'semana' ? 1.8 : 0.4
      const score = extraKm * 0.4 + penalty + off * dayW + (off === 0 && urgency !== 'urgente' ? 3 : 0)
      const bname = BAIRRO[bairro].name
      const zname = ZONE[target.zone].name
      let why = ''
      let title = ''
      if (kind === 'local') {
        title = `${team.name} já estará em ${bname}`
        why = `Tem serviço marcado em ${bname} neste dia. Entra na mesma saída, sem desvio.`
      } else if (kind === 'regiao') {
        title = `${team.name} cobre ${zname}`
        why = `Dia de ${zname} na escala da equipe. Mesma região dos outros serviços.`
      } else if (kind === 'vizinha') {
        title = `${team.name} passa perto de ${bname}`
        why = `Região vizinha a ${zname}. Encaixe com pouco desvio.`
      } else {
        title = `${team.name}, fora da região`
        why = `Não é dia de ${zname} para esta equipe. Pode atrasar os serviços seguintes.`
      }
      list.push({ key: `${team.id}-${off}-${slot}`, teamId: team.id, off, startMin: slot, bairro, extraKm, kind, title, why, zones, score })
    }
  }
  list.sort((a, b) => a.score - b.score)
  const top = list.slice(0, 3)
  const contrast = list.slice(3).find((x) => (x.kind === 'fora' || x.kind === 'vizinha') && !top.some((t) => t.teamId === x.teamId && t.off === x.off))
  if (contrast) top.push(contrast)
  else if (list[3]) top.push(list[3])
  return top
}

export { TEAM }
