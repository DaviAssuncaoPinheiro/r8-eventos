import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const kg = (n: number) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
export const pct = (n: number) => `${Math.round(n * 100)}%`
export const firstName = (s: string) => s.replace(/^(Dra?\.|Seu|Dona|Sr\.|Sra\.)\s+/, '').split(' ')[0]

/** Interpola modelo de mensagem: "Olá, {contato}" */
export function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
}

/** "Porta que não trava" → "porta que não trava"; "PNE com vazamento" fica igual */
export const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s)

/** "1 banheiro", "2 banheiros" */
export const plural = (n: number, one: string, many: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`
