import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const kg = (n: number) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
export const pct = (n: number) => `${Math.round(n * 100)}%`
export const firstName = (s: string) => s.replace(/^(Dra?\.|Seu|Dona|Sr\.|Sra\.)\s+/, '').split(' ')[0]

/** Interpola modelo de mensagem: "Olá, {tutor}" */
export function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
}
