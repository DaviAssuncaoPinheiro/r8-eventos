/*
  Formatos do produto (pt-BR).
  Dinheiro: R$ 12.480,00 (sempre com centavos). Data: dd/mm/aaaa.
  Telefone: (61) 99999-0000. CNPJ: 00.000.000/0000-00. CPF: 000.000.000-00.
*/

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NUM = new Intl.NumberFormat('pt-BR')
const PCT = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

/** 12480 -> "R$ 12.480,00". Espaço normal entre "R$" e o número (Intl usa NBSP). */
export function formatMoney(value: number, opts: { sign?: boolean } = {}): string {
  const s = BRL.format(Math.abs(value)).replace(/ /g, ' ')
  if (value < 0) return `-${s}`
  if (opts.sign && value > 0) return `+${s}`
  return s
}

/** Só o número, sem "R$": "12.480,00". Útil quando o prefixo é desenhado à parte. */
export function formatMoneyValue(value: number): string {
  return formatMoney(value).replace(/^([+-]?)R\$ /, '$1')
}

/** "R$ 12.480,00" | "12480,5" | "12.480" -> 12480.5 */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/[^\d,.-]/g, '')
  if (!clean) return null
  const normalized = clean.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function formatNumber(value: number): string {
  return NUM.format(value)
}

/** 0.124 -> "12,4%" */
export function formatPercent(ratio: number, opts: { sign?: boolean } = {}): string {
  const s = `${PCT.format(Math.abs(ratio) * 100)}%`
  if (ratio < 0) return `-${s}`
  if (opts.sign && ratio > 0) return `+${s}`
  return s
}

const pad = (n: number) => String(n).padStart(2, '0')

function toDate(d: Date | string | number): Date {
  if (d instanceof Date) return d
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day)
  }
  return new Date(d)
}

/** -> "dd/mm/aaaa" */
export function formatDate(d: Date | string | number): string {
  const x = toDate(d)
  if (Number.isNaN(x.getTime())) return ''
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`
}

/** -> "dd/mm/aaaa às hh:mm" */
export function formatDateTime(d: Date | string | number): string {
  const x = toDate(d)
  if (Number.isNaN(x.getTime())) return ''
  return `${formatDate(x)} às ${pad(x.getHours())}:${pad(x.getMinutes())}`
}

/** -> "hh:mm" */
export function formatTime(d: Date | string | number): string {
  const x = toDate(d)
  if (Number.isNaN(x.getTime())) return ''
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`
}

const digits = (s: string) => s.replace(/\D/g, '')

/** "61999990000" -> "(61) 99999-0000"; fixo "6133330000" -> "(61) 3333-0000" */
export function formatPhone(input: string): string {
  let d = digits(input)
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return input
}

/** "00000000000000" -> "00.000.000/0000-00" */
export function formatCNPJ(input: string): string {
  const d = digits(input)
  if (d.length !== 14) return input
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** "00000000000" -> "000.000.000-00" */
export function formatCPF(input: string): string {
  const d = digits(input)
  if (d.length !== 11) return input
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
