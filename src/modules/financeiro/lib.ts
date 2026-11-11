import { ServiceError } from '@/services'
import type { ChargeView } from '@/services'
import { formatDate } from '@/lib/format'

/** Mensagem do serviço quando existe; senão a frase padrão da tela. */
export function errMessage(e: unknown, fallback: string) {
  return e instanceof ServiceError && e.message ? e.message : fallback
}

/** "há 12 dias" para atrasada; data do vencimento nos demais casos. */
export function dueLabel(c: Pick<ChargeView, 'status' | 'daysOverdue' | 'dueAt'>) {
  if (c.status === 'atrasada' && c.daysOverdue > 0) return c.daysOverdue === 1 ? 'há 1 dia' : `há ${c.daysOverdue} dias`
  return formatDate(c.dueAt)
}

/** Copia para a área de transferência. Devolve false se o navegador negar. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
