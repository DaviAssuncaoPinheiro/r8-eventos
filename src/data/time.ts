// Datas relativas a "hoje" para o protótipo sempre parecer atual.
export const TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

/** Data a partir de hoje: day(0) = hoje, day(-30) = há 30 dias */
export function day(offset: number, hhmm = '09:00'): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(TODAY)
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d
}

export function iso(offset: number, hhmm = '09:00') {
  return day(offset, hhmm).toISOString()
}

const fmtDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtShort = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const fmtWeekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
const fmtWeekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const fmtTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const fmtLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

export const fmt = {
  date: (d: Date | string) => fmtDate.format(new Date(d)),
  short: (d: Date | string) => fmtShort.format(new Date(d)).replace('.', ''),
  weekday: (d: Date | string) => fmtWeekday.format(new Date(d)),
  weekdayShort: (d: Date | string) => fmtWeekdayShort.format(new Date(d)).replace('.', ''),
  time: (d: Date | string) => fmtTime.format(new Date(d)),
  long: (d: Date | string) => fmtLong.format(new Date(d)),
}

export function daysFromToday(d: Date | string) {
  const t = new Date(d)
  t.setHours(0, 0, 0, 0)
  return Math.round((t.getTime() - TODAY.getTime()) / 86400000)
}

/** "hoje", "amanhã", "em 12 dias", "há 3 dias" */
export function relDays(d: Date | string) {
  const n = daysFromToday(d)
  if (n === 0) return 'hoje'
  if (n === 1) return 'amanhã'
  if (n === -1) return 'ontem'
  if (n > 0) return `em ${n} dias`
  return `há ${-n} dias`
}

export function ageLabel(birth: Date | string) {
  const b = new Date(birth)
  const months = (TODAY.getFullYear() - b.getFullYear()) * 12 + (TODAY.getMonth() - b.getMonth())
  if (months < 12) return `${Math.max(months, 1)} ${months === 1 ? 'mês' : 'meses'}`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? `${y} a ${m} m` : `${y} ${y === 1 ? 'ano' : 'anos'}`
}
