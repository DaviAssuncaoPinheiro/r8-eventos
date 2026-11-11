import type { ClientKind } from '@/services'

export const CLIENT_KINDS: ClientKind[] = ['Construtora', 'Produtora de eventos', 'Órgão público', 'Cerimonial', 'Igreja', 'Condomínio', 'Indústria']

export const digits = (s: string) => s.replace(/\D/g, '')

/** Máscara de CNPJ enquanto digita: 00.000.000/0000-00 */
export function maskCNPJ(input: string): string {
  const d = digits(input).slice(0, 14)
  let out = d.slice(0, 2)
  if (d.length > 2) out += `.${d.slice(2, 5)}`
  if (d.length > 5) out += `.${d.slice(5, 8)}`
  if (d.length > 8) out += `/${d.slice(8, 12)}`
  if (d.length > 12) out += `-${d.slice(12)}`
  return out
}

/** Máscara de telefone enquanto digita: (61) 99999-0000 ou (61) 3333-0000 */
export function maskPhone(input: string): string {
  let d = digits(input)
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  d = d.slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const cnpjOk = (v: string) => digits(v).length === 14
export const phoneOk = (v: string) => [10, 11].includes(digits(v).length)
export const emailOk = (v: string) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/** Número internacional para os links de WhatsApp e ligação */
export function intlPhone(phone: string): string {
  const d = digits(phone)
  return d.startsWith('55') && d.length > 11 ? d : `55${d}`
}
export const waLink = (phone: string) => `https://wa.me/${intlPhone(phone)}`
export const telLink = (phone: string) => `tel:+${intlPhone(phone)}`

export function initialsOf(name: string): string {
  const parts = name
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((p) => p && !['de', 'da', 'do', 'das', 'dos', 'e'].includes(p.toLowerCase()))
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Cor suave do avatar, estável por cliente (tokens de visualização misturados ao cartão) */
const AVATAR = [
  'bg-[color-mix(in_oklab,var(--viz-1)_18%,var(--raised))]',
  'bg-[color-mix(in_oklab,var(--viz-2)_20%,var(--raised))]',
  'bg-[color-mix(in_oklab,var(--viz-3)_20%,var(--raised))]',
  'bg-[color-mix(in_oklab,var(--viz-4)_16%,var(--raised))]',
  'bg-[color-mix(in_oklab,var(--viz-5)_20%,var(--raised))]',
  'bg-[color-mix(in_oklab,var(--viz-6)_18%,var(--raised))]',
]
export function avatarTone(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return AVATAR[h % AVATAR.length]
}
