import * as React from 'react'
import { AVENIDAS, BAIRROS, BASE, LAKE_PATH, PARK_PATH, VIEWBOX, ZONES } from '@/data/geo'
import { cn } from './cn'

export interface MapPin {
  id: string
  /** Coordenadas no mapa estilizado (viewBox 1000 x 680), as mesmas de `BAIRROS`. */
  x: number
  y: number
  /** Iniciais da equipe ou número da parada. */
  label: string
  /** Nome completo para leitor de tela e tooltip nativo. */
  title: string
  tone?: 'accent' | 'ok' | 'info' | 'danger' | 'neutral'
  /** Anel que pulsa: equipe em deslocamento ou serviço em andamento. */
  pulse?: boolean
}

export interface MapRoute {
  id: string
  points: { x: number; y: number }[]
  /** Linha cheia (feito) ou tracejada (previsto). */
  dashed?: boolean
}

export interface MapaDFProps {
  pins?: MapPin[]
  routes?: MapRoute[]
  selectedId?: string
  onSelect?: (id: string) => void
  /** Recorte do mapa: [x, y, largura, altura] no viewBox. Padrão: enquadra o DF inteiro. */
  box?: [number, number, number, number]
  /** Tamanho base de traços e pinos, em unidades do viewBox. Padrão: 1% da largura do recorte. */
  unit?: number
  /** Mostra os nomes das regiões. */
  labels?: boolean
  className?: string
  /** Resumo para leitor de tela. */
  label: string
}

const pinTone: Record<NonNullable<MapPin['tone']>, { fill: string; text: string }> = {
  accent: { fill: 'var(--accent)', text: 'var(--on-accent)' },
  ok: { fill: 'var(--ok)', text: '#ffffff' },
  info: { fill: 'var(--info)', text: '#ffffff' },
  danger: { fill: 'var(--danger-solid)', text: '#ffffff' },
  neutral: { fill: 'var(--inverse)', text: 'var(--on-inverse)' },
}

function smooth(points: { x: number; y: number }[]) {
  if (points.length < 2) return ''
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const mx = (p0.x + p1.x) / 2
    d += ` Q${p0.x},${p0.y} ${mx},${(p0.y + p1.y) / 2} T${p1.x},${p1.y}`
  }
  return d
}

/**
 * Mapa estilizado do Distrito Federal em tons neutros; só rotas e pinos levam cor.
 * Não é cartografia: serve para ver onde cada equipe e cada parada estão, de relance.
 */
export function MapaDF({ pins = [], routes = [], selectedId, onSelect, box, unit, labels = true, className, label }: MapaDFProps) {
  const [x, y, w, h] = box ?? [60, 40, VIEWBOX.w - 80, VIEWBOX.h - 60]
  // tamanho dos pinos em unidades do viewBox, proporcional ao recorte
  const u = unit ?? w / 100
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      role="group"
      aria-label={label}
      className={cn('block size-full rounded-[inherit] bg-[var(--map-land)]', className)}
    >
      {/* regiões: um tom só, separadas por linha da cor do fundo */}
      {ZONES.map((z) => (
        <polygon key={z.id} points={z.polygon.map((p) => p.join(',')).join(' ')} fill="var(--map-land)" stroke="var(--sunken)" strokeWidth={u * 0.5} strokeLinejoin="round" />
      ))}
      <path d={PARK_PATH} fill="var(--map-park)" />
      <path d={LAKE_PATH} fill="var(--map-water)" />
      {AVENIDAS.map((a) => (
        <path key={a.name} d={a.d} fill="none" stroke="var(--map-road)" strokeWidth={u * 0.7} strokeLinecap="round" />
      ))}

      {labels
        ? BAIRROS.filter((b) => ['asa-norte', 'lago-sul', 'taguatinga', 'ceilandia', 'sobradinho', 'gama', 'guara', 'paranoa', 'planaltina', 'samambaia'].includes(b.id)).map((b) => (
            <text key={b.id} x={b.x} y={b.y + u * 5.2} textAnchor="middle" fontSize={u * 2.5} fontWeight={500} fill="var(--fg-3)" aria-hidden>
              {b.name}
            </text>
          ))
        : null}

      {/* base da locadora */}
      <g aria-hidden transform={`translate(${BASE.x} ${BASE.y})`}>
        <rect x={-u * 1.8} y={-u * 1.8} width={u * 3.6} height={u * 3.6} rx={u * 0.9} fill="var(--fg)" />
        <rect x={-u * 0.7} y={-u * 0.7} width={u * 1.4} height={u * 1.4} rx={u * 0.3} fill="var(--raised)" />
      </g>

      {routes.map((r) => (
        <path
          key={r.id}
          d={smooth(r.points)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={u * 0.9}
          strokeLinecap="round"
          strokeDasharray={r.dashed ? `${u * 1.6} ${u * 1.8}` : undefined}
          opacity={selectedId && selectedId !== r.id ? 0.25 : 1}
          className="ds-route"
          pathLength={r.dashed ? undefined : 1}
        />
      ))}

      {pins.map((p) => {
        const t = pinTone[p.tone ?? 'neutral']
        const dim = selectedId && selectedId !== p.id
        const r = u * 3.1
        return (
          <g
            key={p.id}
            transform={`translate(${p.x} ${p.y})`}
            opacity={dim ? 0.35 : 1}
            role={onSelect ? 'button' : 'img'}
            aria-label={p.title}
            tabIndex={onSelect ? 0 : undefined}
            onClick={onSelect ? () => onSelect(p.id) : undefined}
            onKeyDown={
              onSelect
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(p.id)
                    }
                  }
                : undefined
            }
            className={cn('ds-pin outline-none', onSelect && 'cursor-pointer')}
          >
            <title>{p.title}</title>
            {p.pulse ? <circle r={r} fill={t.fill} className="ds-pulse" /> : null}
            <circle r={r + u * 0.7} fill="var(--raised)" />
            <circle r={r} fill={t.fill} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={u * 2.5} fontWeight={700} fill={t.text} aria-hidden>
              {p.label}
            </text>
            <circle r={r + u * 1.5} fill="none" stroke="var(--ring)" strokeWidth={u * 0.5} className="ds-pin-focus" />
          </g>
        )
      })}
    </svg>
  )
}
