import * as React from 'react'
import { cn } from '@/ui'

/** Muda a cada troca de tema ou marca, para as seções relerem as variáveis do CSS. */
export const DsVersion = React.createContext(0)

export function readVar(name: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Resolve uma variável (inclusive var() encadeado) para hex. */
export function readHex(name: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const rgb = getComputedStyle(probe).color
  probe.remove()
  const m = rgb.match(/[\d.]+/g)
  if (!m) return rgb
  const [r, g, b, a] = m.map(Number)
  const hex = '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  return a !== undefined && a < 1 ? `${hex} · ${Math.round(a * 100)}%` : hex
}

export function DsSection({ id, title, intro, children }: { id: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 border-t border-hairline pt-10 pb-4 first:border-t-0 first:pt-2">
      <h2 id={`${id}-t`} className="text-title-section">
        {title}
      </h2>
      {intro ? <p className="mt-1.5 max-w-[68ch] text-body text-fg-2">{intro}</p> : null}
      <div className="mt-6 flex flex-col gap-8">{children}</div>
    </section>
  )
}

/** Um bloco de exemplo dentro da seção: subtítulo + conteúdo. */
export function Specimen({ title, note, children, className }: { title: string; note?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <h3 className="text-title-card">{title}</h3>
      {note ? <p className="mt-0.5 max-w-[68ch] text-caption text-fg-3">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  )
}

/** Rótulo pequeno de estado sob um exemplo ("Hover", "Foco"). */
export function StateCell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col items-start gap-2', className)}>
      {children}
      <span className="text-caption text-fg-3">{label}</span>
    </div>
  )
}

export function StubNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-edge p-5 text-body text-fg-2">
      {children}
    </div>
  )
}
