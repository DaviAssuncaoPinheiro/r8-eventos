import { formatDate } from '@/lib/format'
import type { RentalStatus } from '@/services'

/** "12/11 a 20/12" */
export function periodTag(start: string, end: string): string {
  return `${formatDate(start).slice(0, 5)} a ${formatDate(end).slice(0, 5)}`
}

export function durationLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const STAGE_TONE_BAR: Record<RentalStatus, string> = {
  orcamento: 'bg-fg-3',
  confirmada: 'bg-info',
  em_campo: 'bg-accent',
  retirada: 'bg-warn',
  faturada: 'bg-ok',
  cancelada: 'bg-idle',
}

export const NEXT_STAGE: Partial<Record<RentalStatus, RentalStatus>> = {
  orcamento: 'confirmada',
  confirmada: 'em_campo',
  em_campo: 'retirada',
  retirada: 'faturada',
}

/** Escapa texto para o HTML dos documentos de impressão */
export function esc(s: string | undefined | null): string {
  return (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

/** Tira palavra repetida em sequência ("Residencial Residencial das Palmas" vira "Residencial das Palmas") */
export function cleanTitle(t: string): string {
  return t.replace(/\b([\p{L}\d]+)(\s+)\1\b/giu, '$1')
}

/** Tipo que dá a cara da locação: o mais característico entre os itens (estrutura antes de banheiro). */
const PRIORITY = ['trailer', 'tnd10', 'tnd5', 'bal', 'ala', 'fec', 'pia', 'pcd', 'bq']
export function mainTypeId(items: { typeId: string }[]): string | undefined {
  const ids = items.map((i) => i.typeId)
  return PRIORITY.find((p) => ids.includes(p)) ?? ids[0]
}
