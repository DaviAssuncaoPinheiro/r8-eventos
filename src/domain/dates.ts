/*
  Datas do domínio. Dia = 'AAAA-MM-DD' (local). Nada aqui usa fuso fixo: o "hoje" é o do navegador.
  "Agora" da demonstração é sempre 10:40 de hoje (demoNow), para a agenda ficar coerente.
*/
import type { ISODate, ISODateTime } from './types'

const p2 = (n: number) => String(n).padStart(2, '0')

export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** Date local -> 'AAAA-MM-DD' */
export function dayStr(d: Date): ISODate {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}

/** 'AAAA-MM-DD' -> Date à meia-noite local */
export function parseDay(s: ISODate): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): ISODate {
  return dayStr(new Date())
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseDay(s)
  d.setDate(d.getDate() + n)
  return dayStr(d)
}

/** Dias entre a e b (b - a), por calendário */
export function diffDays(a: ISODate, b: ISODate): number {
  const [ay, am, ad] = a.slice(0, 10).split('-').map(Number)
  const [by, bm, bd] = b.slice(0, 10).split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}

/** Dias corridos contando início e fim (1 a 1 = 1 dia) */
export function daysInclusive(start: ISODate, end: ISODate): number {
  return Math.max(1, diffDays(start, end) + 1)
}

/** Dia + minutos desde 00:00 (ou 'HH:MM') -> ISO completo em horário local */
export function atTime(day: ISODate, time: string | number): ISODateTime {
  const mins = typeof time === 'number' ? time : Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
  const d = parseDay(day)
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  return d.toISOString()
}

/** Dia local de um ISO (aceita data pura) */
export function dayOf(iso: string): ISODate {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return dayStr(new Date(iso))
}

/** Minutos desde 00:00 (horário local) */
export function minutesOf(iso: ISODateTime): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function addMinutes(iso: ISODateTime, mins: number): ISODateTime {
  return new Date(new Date(iso).getTime() + mins * 60000).toISOString()
}

/** "Agora" da demonstração: 10:40 de hoje */
export function demoNow(): Date {
  const d = new Date()
  d.setHours(10, 40, 0, 0)
  return d
}

export function demoNowISO(): ISODateTime {
  return demoNow().toISOString()
}

export function monthKey(day: string): string {
  return day.slice(0, 7)
}

export function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`
}

/** 'AAAA-MM' -> 'nov/26' */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}`
}

/** 'AAAA-MM' -> 'novembro de 2026' */
export function monthLabelLong(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS_LONG[m - 1]} de ${y}`
}

export function monthStart(key: string): ISODate {
  return `${key}-01`
}

export function monthEnd(key: string): ISODate {
  const [y, m] = key.split('-').map(Number)
  return dayStr(new Date(y, m, 0))
}

export function inRange(day: string, from?: string, to?: string): boolean {
  const d = day.slice(0, 10)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

/** Dia da semana (0 = domingo) */
export function weekday(day: ISODate): number {
  return parseDay(day).getDay()
}

/** Dias de from a to, inclusive */
export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  const n = diffDays(from, to)
  for (let i = 0; i <= n; i++) out.push(addDays(from, i))
  return out
}

/** Soma dias a uma data/hora ISO completa preservando a hora local */
export function shiftISO(iso: string, days: number): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return addDays(iso, days)
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/

/** Desloca TODAS as datas ISO de um objeto qualquer (usado na virada do dia). Devolve cópia. */
export function shiftAllDates<T>(value: T, days: number): T {
  if (days === 0) return value
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return ISO_RE.test(v) ? shiftISO(v, days) : v
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = walk(x)
      return out
    }
    return v
  }
  return walk(value) as T
}
