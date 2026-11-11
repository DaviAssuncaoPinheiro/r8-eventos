import * as React from 'react'
import { Button } from '@/ui'
import { DsSection, Specimen } from '../kit'

const SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
const RADII = [
  { name: 'rounded-check', px: '5px', use: 'Caixa de seleção' },
  { name: 'rounded-tip', px: '10px', use: 'Tooltip, miniatura' },
  { name: 'rounded-control', px: '12px', use: 'Campo, select' },
  { name: 'rounded-card', px: '22px', use: 'Cartão, menu, diálogo' },
  { name: 'rounded-panel', px: '28px', use: 'Painéis da casca' },
  { name: 'rounded-pill', px: '999px', use: 'Botão, busca, segmentado, badge' },
]

export function SpaceSection() {
  return (
    <DsSection id="espacamento" title="Espaçamento" intro="Base 4px. Entre cartões 16px, padding de cartão 20px (24px a partir de 640).">
      <ul className="flex flex-col gap-2 rounded-card bg-raised p-5">
        {SPACE.map((s) => (
          <li key={s} className="grid grid-cols-[56px_1fr] items-center gap-4">
            <span className="tnum text-body text-fg-2">{s}px</span>
            <span className="block h-3 rounded-[3px] bg-accent" style={{ width: s * 3 }} />
          </li>
        ))}
      </ul>
    </DsSection>
  )
}

export function RadiusSection() {
  return (
    <DsSection id="raios" title="Raios" intro="Cartão 22, painel 28, campo 12. Botão, busca e segmentado são pílula.">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {RADII.map((r) => (
          <li key={r.name} className="flex flex-col gap-2">
            <span className="block h-16 bg-raised shadow-[inset_0_0_0_1.5px_var(--strong)]" style={{ borderRadius: r.px }} />
            <span className="text-body font-semibold">{r.name}</span>
            <span className="text-caption text-fg-3">
              <span className="tnum">{r.px}</span> · {r.use}
            </span>
          </li>
        ))}
      </ul>
    </DsSection>
  )
}

export function ElevationSection() {
  return (
    <DsSection
      id="elevacao"
      title="Elevação"
      intro="Declarada uma vez: tom de superfície para o que fica na página; sombra (claro) ou contorno de 1px (escuro) só para o que flutua. Nunca borda e sombra juntas."
    >
      <div className="grid grid-cols-1 gap-4 rounded-card bg-app p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex h-28 flex-col justify-end rounded-panel bg-panel p-4">
          <span className="text-body font-semibold">Painel</span>
          <span className="text-caption text-fg-3">bg-panel sobre bg-app</span>
        </div>
        <div className="flex h-28 flex-col justify-end rounded-card bg-raised p-4">
          <span className="text-body font-semibold">Cartão</span>
          <span className="text-caption text-fg-3">bg-raised, sem sombra</span>
        </div>
        <div className="flex h-28 flex-col justify-end rounded-card bg-overlay p-4 shadow-overlay">
          <span className="text-body font-semibold">Flutuante</span>
          <span className="text-caption text-fg-3">shadow-overlay: menu, diálogo</span>
        </div>
        <div className="flex h-28 flex-col justify-end rounded-card bg-overlay p-4 shadow-drag">
          <span className="text-body font-semibold">Arrastando</span>
          <span className="text-caption text-fg-3">shadow-drag: item em arraste</span>
        </div>
      </div>
    </DsSection>
  )
}

const MOTION = [
  { name: 'dur-fast', ms: 150, use: 'Hover, cor, foco, switch' },
  { name: 'dur-base', ms: 200, use: 'Menu, tooltip, troca de aba' },
  { name: 'dur-slow', ms: 250, use: 'Gaveta, diálogo, toast' },
  { name: 'número, barras', ms: 600, use: 'Entra uma vez ao montar' },
  { name: 'arco, rota', ms: 900, use: 'Traço desenhado uma vez' },
]

export function MotionSection() {
  const [on, setOn] = React.useState(false)
  return (
    <DsSection
      id="movimento"
      title="Movimento"
      intro="Estado, resposta e entrada de dado, uma vez. Curva ease-ui. Com movimento reduzido, troca instantânea."
    >
      <div className="flex flex-col gap-3 rounded-card bg-raised p-5">
        {MOTION.map((m) => (
          <div key={m.name} className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-4">
            <div>
              <div className="text-body font-semibold">
                {m.name} <span className="tnum font-medium text-fg-3">{m.ms}ms</span>
              </div>
              <div className="text-caption text-fg-3">{m.use}</div>
            </div>
            <div className="relative h-8 rounded-control bg-sunken">
              <span
                className="absolute top-1 left-1 size-6 rounded-[6px] bg-accent"
                style={{
                  transform: on ? 'translateX(calc(min(240px, 40vw)))' : 'none',
                  transition: `transform ${m.ms}ms var(--ease-ui)`,
                }}
              />
            </div>
          </div>
        ))}
        <div>
          <Button size="sm" onClick={() => setOn((v) => !v)}>
            Testar movimento
          </Button>
        </div>
      </div>
    </DsSection>
  )
}
