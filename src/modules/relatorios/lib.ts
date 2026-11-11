import { addMonths, monthKey, monthStart, today } from '@/domain/dates'
import type { DateRange } from '@/services'

export type Periodo = 'mes' | '3m' | '6m'

export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'mes', label: 'Este mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
]

/** Do dia 1 do primeiro mês até hoje */
export function rangeOf(p: Periodo): DateRange {
  const to = today()
  const back = p === 'mes' ? 0 : p === '3m' ? -2 : -5
  return { from: monthStart(addMonths(monthKey(to), back)), to }
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "2026-11-05" -> "05/11" */
export const dayLabel = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

const num = (n: number) => n.toFixed(2).replace('.', ',')

/** Baixa um CSV (separador ";" e decimal com vírgula, como o Excel em português espera) */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : num(v)) : v
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const text = [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
