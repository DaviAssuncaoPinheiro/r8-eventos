import * as React from 'react'
import { animate, motion } from 'motion/react'
import { AVENIDAS, BAIRROS, BASE, LAKE_PATH, PARK_PATH, ZONES, type ZoneId } from '@/data/geo'
import type { JobStatus, JobType } from '@/data/mock'
import { JOB_TYPE } from '@/lib/status'
import { cn } from '@/lib/utils'
import {
  addressPoint,
  BASE_PT,
  circleRect,
  coverBox,
  fitBox,
  KM_PER_UNIT,
  placeLabels,
  smoothPath,
  type Box,
  type LabelReq,
  type Pt,
  type Rect,
} from './geometry'

/* ───────────── tipos públicos ───────────── */

export interface MapVisit {
  id: string
  /** nome curto do local (rótulo do pin) */
  label: string
  /** tipo de serviço: define o ícone e a cor do pin */
  type?: JobType
  bairro: string
  /** semente do deslocamento dentro da região (ex.: id da locação) */
  seed?: string
  status: JobStatus
  /** número da parada exibido no pin */
  order?: number
  /** texto curto no balão de seleção (ex.: "11:20 · Aleixo") */
  caption?: string
}

export interface TeamMarker {
  at: Pt
  color: string
  initials: string
  title?: string
}

export interface MapCtx {
  /** unidades do mapa por pixel de tela (use para tamanhos constantes na tela) */
  u: number
  box: Box
}

export interface CityMapProps {
  visits?: MapVisit[]
  /** ordem das paradas (ids) a partir da BASE */
  routeOrder?: string[]
  /** rota de comparação, desenhada como fantasma tracejado */
  compareOrder?: string[]
  /** 'optimized' = linha preta contínua; 'naive' = coral tracejada (como foi marcada) */
  routeVariant?: 'optimized' | 'naive'
  showRoute?: boolean
  /** troque para redesenhar a rota do zero (ex.: ao trocar de veterinário) */
  routeKey?: string
  selectedVisitId?: string | null
  onSelectVisit?: (id: string | null) => void
  /** zonas em destaque; as demais ficam esmaecidas */
  highlightZones?: ZoneId[]
  selectedZone?: ZoneId | null
  onSelectZone?: (z: ZoneId | null) => void
  /** valores por zona para mapa de calor */
  heat?: Partial<Record<ZoneId, number>>
  heatMax?: number
  heatUnit?: string
  /** 'visits' enquadra as paradas (zoom); 'city' mostra Manaus inteira */
  focus?: 'city' | 'visits'
  /** proporção largura/altura. Sem ela, o mapa preenche a altura do pai */
  aspect?: number
  compact?: boolean
  showBairros?: boolean | 'auto'
  bairroHighlight?: string[]
  showAvenueNames?: boolean
  /** posição atual do caminhão */
  teamNow?: TeamMarker | null
  /** mostra o ponto da base (padrão: sim) */
  showBase?: boolean
  /** mostra a régua de escala (padrão: sim) */
  showScale?: boolean
  /** camada extra em coordenadas do mapa */
  overlay?: (ctx: MapCtx) => React.ReactNode
  ariaLabel?: string
  className?: string
}

/* ───────────── constantes visuais ───────────── */

export const STATUS_RING: Record<JobStatus, string> = {
  concluido: 'var(--color-green)',
  'em-andamento': 'var(--color-brand)',
  'a-caminho': 'var(--color-blue)',
  agendado: 'var(--color-ink-4)',
  cancelado: 'var(--color-red)',
}

/** terra fora da cidade, terra urbana e halo de texto */
const LAND_OUT = '#eef0f3'
const LAND_CITY = '#fafbfc'
const HALO = '#ffffff'
const EASE = [0.16, 1, 0.3, 1] as const

/** rampa sequencial de uma cor só (azul claro → azul sólido) */
const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [0xf1, 0xf5, 0xff]],
  [0.3, [0xd4, 0xe1, 0xff]],
  [0.6, [0x93, 0xb5, 0xfc]],
  [0.85, [0x5a, 0x8d, 0xfb]],
  [1, [0x2f, 0x69, 0xe8]],
]
export function heatColor(t: number) {
  const v = Math.min(1, Math.max(0, t))
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [p1, c1] = HEAT_STOPS[i]
    const [p0, c0] = HEAT_STOPS[i - 1]
    if (v <= p1) {
      const k = (v - p0) / (p1 - p0)
      const c = c0.map((x, j) => Math.round(x + (c1[j] - x) * k))
      return `rgb(${c[0]},${c[1]},${c[2]})`
    }
  }
  return 'rgb(47,105,232)'
}
export const heatIsDark = (t: number) => t > 0.66

/** Polígono com cantos arredondados (zonas com contorno macio) */
function roundedPoly(pts: [number, number][], r: number) {
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]]
    const v2 = [p2[0] - p1[0], p2[1] - p1[1]]
    const l1 = Math.hypot(v1[0], v1[1])
    const l2 = Math.hypot(v2[0], v2[1])
    const rr = Math.min(r, l1 / 2.4, l2 / 2.4)
    const a = [p1[0] + (v1[0] / l1) * rr, p1[1] + (v1[1] / l1) * rr]
    const b = [p1[0] + (v2[0] / l2) * rr, p1[1] + (v2[1] / l2) * rr]
    d += `${i === 0 ? 'M' : 'L'}${a[0].toFixed(1)},${a[1].toFixed(1)} Q${p1[0]},${p1[1]} ${b[0].toFixed(1)},${b[1].toFixed(1)} `
  }
  return d + 'Z'
}
const ZONE_D = Object.fromEntries(ZONES.map((z) => [z.id, roundedPoly(z.polygon, 16)])) as Record<ZoneId, string>
const CITY_D = ZONES.map((z) => roundedPoly(z.polygon, 4)).join(' ')

/** Inverte um path "M x,y C ... C ..." para o texto das avenidas não ficar de cabeça para baixo */
function reversePath(d: string) {
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  const pts: Pt[] = []
  for (let i = 0; i < n.length; i += 2) pts.push({ x: n[i], y: n[i + 1] })
  if (pts.length < 4) return d
  const rev = [...pts].reverse()
  let out = `M${rev[0].x},${rev[0].y}`
  for (let i = 1; i < rev.length; i += 3) out += ` C${rev[i].x},${rev[i].y} ${rev[i + 1].x},${rev[i + 1].y} ${rev[i + 2].x},${rev[i + 2].y}`
  return out
}
const AVENUE_TEXT_PATHS = AVENIDAS.map((a) => {
  const n = (a.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  return n[n.length - 2] < n[0] ? reversePath(a.d) : a.d
})

/** contorno externo do DF: união das regiões */
const DF_OUTLINE = ZONES.map((z) => roundedPoly(z.polygon, 4)).join(' ')

/* ───────────── hooks ───────────── */

function useSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

const sameBox = (a: Box, b: Box) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5

function useAnimatedBox(target: Box, ready: boolean) {
  const [box, setBox] = React.useState(target)
  const cur = React.useRef(target)
  const settled = React.useRef(false)
  React.useEffect(() => {
    if (!ready) return
    if (!settled.current) {
      settled.current = true
      cur.current = target
      setBox(target)
      return
    }
    const from = cur.current
    if (sameBox(from, target)) return
    const c = animate(0, 1, {
      duration: 0.75,
      ease: EASE,
      onUpdate: (t) => {
        const b = { x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t, w: from.w + (target.w - from.w) * t, h: from.h + (target.h - from.h) * t }
        cur.current = b
        setBox(b)
      },
    })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.x, target.y, target.w, target.h, ready])
  return box
}

/* ───────────── componente ───────────── */

export function CityMap(props: CityMapProps) {
  const [probeRef, probe] = useSize<HTMLDivElement>()
  const narrow = probe.w > 0 && probe.w < 520
  return (
    <div ref={probeRef} className={cn('w-full', !props.aspect && 'h-full')}>
      <CityMapInner {...props} compact={props.compact ?? narrow} />
    </div>
  )
}

function CityMapInner({
  visits = [],
  routeOrder,
  compareOrder,
  routeVariant = 'optimized',
  showRoute = true,
  routeKey = 'route',
  selectedVisitId,
  onSelectVisit,
  highlightZones,
  selectedZone,
  onSelectZone,
  heat,
  heatMax,
  heatUnit = 'visitas',
  focus = 'city',
  aspect,
  compact,
  showBairros = 'auto',
  bairroHighlight,
  showAvenueNames,
  teamNow,
  showBase = true,
  showScale = true,
  overlay,
  ariaLabel = 'Mapa do Distrito Federal',
  className,
}: CityMapProps) {
  const uid = React.useId().replace(/:/g, '')
  const [wrapRef, size] = useSize<HTMLDivElement>()
  const [hoverZone, setHoverZone] = React.useState<ZoneId | null>(null)
  const [hoverVisit, setHoverVisit] = React.useState<string | null>(null)

  const ready = size.w > 0 && size.h > 0
  const ratio = ready ? size.w / size.h : aspect ?? 1000 / 680

  const points = React.useMemo(() => {
    const m: Record<string, Pt> = {}
    for (const v of visits) m[v.id] = addressPoint(v.bairro, v.seed ?? v.id)
    return m
  }, [visits])

  const target = React.useMemo(() => {
    if (focus === 'visits' && visits.length) {
      const pts = showBase ? [BASE_PT, ...Object.values(points)] : Object.values(points)
      if (teamNow) pts.push(teamNow.at)
      return fitBox(pts, ratio, { pad: compact ? 52 : 64, minW: compact ? 340 : 400 })
    }
    return coverBox(ratio)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, points, ratio, compact, showBase])

  const box = useAnimatedBox(target, ready)
  const u = ready ? box.w / size.w : 1.4 // unidades por px
  const px = (n: number) => n * u

  const pinR = px(compact ? 12 : 15)
  const autoBairros = showBairros === 'auto' ? size.w >= 520 && !compact : showBairros
  const avenueNames = showAvenueNames ?? (!compact && size.w >= 640)
  const highlighted = highlightZones && highlightZones.length ? new Set(highlightZones) : null
  const max = heatMax ?? (heat ? Math.max(1, ...Object.values(heat).map((n) => n ?? 0)) : 1)

  /* rótulos: zonas → pins → bairros */
  const zoneFont = px(compact ? 10.5 : 11.5)
  const pinRects = visits.map((v) => circleRect(points[v.id], pinR + px(5)))
  const baseRect = showBase ? circleRect(BASE_PT, px(11)) : circleRect({ x: -9999, y: -9999 }, 0)
  const teamRect = teamNow ? circleRect(teamNow.at, px(13)) : null
  const hitsAny = (r: Rect, list: Rect[]) => list.some((t) => r.x0 < t.x1 && r.x1 > t.x0 && r.y0 < t.y1 && r.y1 > t.y0)
  // rótulo da zona desvia de pins (tenta o lugar original, depois acima/abaixo)
  const zoneLabelPos: Record<string, Pt> = {}
  const zoneLabelRects: Rect[] = ZONES.map((z) => {
    const w = Math.max((compact ? z.short : z.name).length * zoneFont * 0.6, heat ? px(78) : 0)
    const extra = heat ? px(overlay ? 54 : 30) : 0
    const at = (dy: number): Rect => ({ x0: z.label[0] - w / 2, y0: z.label[1] + dy - zoneFont, x1: z.label[0] + w / 2, y1: z.label[1] + dy + zoneFont * 0.4 + extra })
    const obst = [...pinRects, baseRect, ...(teamRect ? [teamRect] : [])]
    let dy = 0
    for (const c of [0, -px(26), px(26), -px(52), px(52)]) {
      if (!hitsAny(at(c), obst)) {
        dy = c
        break
      }
    }
    zoneLabelPos[z.id] = { x: z.label[0], y: z.label[1] + dy }
    return at(dy)
  })

  const pinFont = px(compact ? 10.5 : 11.5)
  const pinLabels = React.useMemo(() => {
    const reqs: LabelReq[] = visits
      .filter((v) => v.id !== selectedVisitId)
      .map((v) => ({ id: v.id, x: points[v.id].x, y: points[v.id].y, text: v.label, size: pinFont, gap: pinR + px(5), sides: ['r', 'l', 'b', 't'], charW: 0.6 }))
    return placeLabels(reqs, [...pinRects, baseRect, ...(teamRect ? [teamRect] : [])], box)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, points, selectedVisitId, u, box.x, box.y])

  const bairroFont = px(compact ? 9 : 10)
  const visitBairros = new Set(visits.map((v) => v.bairro))
  const bairroLabels = React.useMemo(() => {
    if (!autoBairros && !bairroHighlight?.length) return []
    const hl = new Set(bairroHighlight ?? [])
    const list = BAIRROS.filter((b) => !visitBairros.has(b.id)).filter((b) => autoBairros || hl.has(b.id))
    list.sort((a, b) => Number(hl.has(b.id)) - Number(hl.has(a.id)))
    const reqs: LabelReq[] = list.map((b) => ({ id: b.id, x: b.x, y: b.y, text: b.name, size: bairroFont, gap: px(5), sides: ['r', 'l', 'b', 't'] }))
    const obstacles = [...zoneLabelRects, ...pinRects, baseRect, ...pinLabels.map((p) => p.rect)]
    return placeLabels(reqs, obstacles, box)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBairros, bairroHighlight, visits, u, box.x, box.y, pinLabels, heat])

  /* rota */
  const routePts = (order?: string[]) => (order ? [BASE_PT, ...order.filter((id) => points[id]).map((id) => points[id])] : [])
  const routeD = routeOrder && routeOrder.length ? smoothPath(routePts(routeOrder)) : ''
  const compareD = compareOrder && compareOrder.length ? smoothPath(routePts(compareOrder)) : ''
  const naive = routeVariant === 'naive'

  const selected = visits.find((v) => v.id === selectedVisitId)
  const fitsX = (cx: number, halfW: number) => cx - halfW >= box.x && cx + halfW <= box.x + box.w
  const scaleUnits = 2 / KM_PER_UNIT
  const dimZone = (id: ZoneId) => Boolean((highlighted && !highlighted.has(id)) || (selectedZone && selectedZone !== id && !heat))

  const zoneLabelsEl = (
    <g pointerEvents="none">
      {ZONES.map((z) => {
        const dim = dimZone(z.id)
        const hv = heat?.[z.id]
        const t = hv != null ? hv / max : 0
        const dark = heat && heatIsDark(t)
        const pos = zoneLabelPos[z.id]
        return (
          <g key={z.id} opacity={dim ? 0.45 : 1}>
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              fontSize={zoneFont}
              fontWeight={600}
              fill={dark ? 'rgba(255,255,255,.85)' : heat ? 'var(--color-ink-2)' : 'var(--color-ink-3)'}
              stroke={heat ? 'none' : HALO}
              strokeWidth={px(3)}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {compact ? z.short : z.name}
            </text>
            {heat && hv != null && (
              <text x={pos.x} y={pos.y + px(compact ? 20 : 26)} textAnchor="middle" fill={dark ? '#fff' : 'var(--color-ink)'}>
                <tspan fontSize={px(compact ? 17 : 22)} fontWeight={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {hv}
                </tspan>
                {!compact && (
                  <tspan dx={px(4)} fontSize={px(10)} fontWeight={600} opacity={0.7}>
                    {heatUnit}
                  </tspan>
                )}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )

  return (
    <div ref={wrapRef} className={cn('relative w-full overflow-hidden', !aspect && 'h-full', className)} style={aspect ? { aspectRatio: String(aspect) } : undefined}>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 block size-full select-none"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <defs>
          <filter id={`shadow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx={0} dy={px(1.5)} stdDeviation={px(2.2)} floodColor="#111214" floodOpacity={0.2} />
          </filter>
          <clipPath id={`pin-${uid}`} clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
          </clipPath>
          <mask id={`draw-${uid}`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={1100} height={780}>
            {routeD && (
              <motion.path
                key={routeKey + routeVariant}
                d={routeD}
                fill="none"
                stroke="#fff"
                strokeWidth={px(14)}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: EASE }}
              />
            )}
          </mask>
          {AVENUE_TEXT_PATHS.map((d, i) => (
            <path key={i} id={`av-${uid}-${i}`} d={d} />
          ))}
        </defs>

        {/* terra */}
        <rect x={-50} y={-50} width={1100} height={780} fill={LAND_OUT} onClick={() => { onSelectZone?.(null); onSelectVisit?.(null) }} />
        <path d={DF_OUTLINE} fill="#fff" pointerEvents="none" />
        <path d={CITY_D} fill={LAND_CITY} pointerEvents="none" />

        {/* zonas */}
        <g>
          {ZONES.map((z) => {
            const isSel = selectedZone === z.id
            const isHover = hoverZone === z.id
            const dim = dimZone(z.id)
            const hv = heat?.[z.id]
            const t = hv != null ? hv / max : 0
            const fill = heat ? heatColor(t) : z.hex
            const fillOpacity = heat ? 1 : isSel ? 0.22 : dim ? 0.04 : isHover ? 0.2 : highlighted ? 0.15 : 0.11
            return (
              <motion.path
                key={z.id}
                d={ZONE_D[z.id]}
                initial={false}
                animate={{ fill, fillOpacity }}
                transition={{ duration: 0.45, ease: EASE }}
                onMouseEnter={() => onSelectZone && setHoverZone(z.id)}
                onMouseLeave={() => setHoverZone(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectZone?.(selectedZone === z.id ? null : z.id)
                }}
                style={{ cursor: onSelectZone ? 'pointer' : 'default' }}
              />
            )
          })}
        </g>

        {/* Parque Nacional */}
        <g pointerEvents="none">
          <path d={PARK_PATH} fill="var(--color-park)" />
          {!compact && fitsX(420, px(40)) && (
            <text x={420} y={252} textAnchor="middle" fontSize={px(9.5)} fontWeight={600} fill="var(--color-green)" opacity={0.85}>
              Parque Nacional
            </text>
          )}
        </g>

        {/* avenidas */}
        <g fill="none" strokeLinecap="round" pointerEvents="none">
          {AVENIDAS.map((a) => (
            <path key={a.name + 'c'} d={a.d} stroke={heat ? 'rgba(255,255,255,.45)' : '#e6e8ec'} strokeWidth={px(4.2)} />
          ))}
          {AVENIDAS.map((a) => (
            <path key={a.name} d={a.d} stroke="#fff" strokeWidth={px(2.6)} opacity={heat ? 0.55 : 1} />
          ))}
        </g>

        {/* divisa entre zonas: fio branco, e contorno da zona ativa */}
        <g fill="none" pointerEvents="none" strokeLinejoin="round">
          {ZONES.map((z) => (
            <path key={z.id} d={ZONE_D[z.id]} stroke="#fff" strokeWidth={px(heat ? 3 : 2.5)} />
          ))}
          {ZONES.filter((z) => selectedZone === z.id || (hoverZone === z.id && onSelectZone)).map((z) => (
            <path key={z.id + 's'} d={ZONE_D[z.id]} stroke={heat ? 'var(--color-ink)' : z.hex} strokeWidth={px(selectedZone === z.id ? 2 : 1.4)} opacity={selectedZone === z.id ? 0.9 : 0.5} />
          ))}
        </g>

        {/* Lago Paranoá */}
        <g pointerEvents="none">
          <path d={LAKE_PATH} fill="var(--color-river)" />
          <path d={LAKE_PATH} fill="none" stroke="var(--color-river-2)" strokeWidth={px(1)} />
          {!compact && (
            <text x={690} y={356} transform="rotate(82 690 356)" textAnchor="middle" fontSize={px(10.5)} fontWeight={600} fill="#7f95b3">
              Lago Paranoá
            </text>
          )}
        </g>

        {/* nomes de avenidas */}
        {avenueNames && !heat && (
          <g pointerEvents="none" fontSize={px(8.5)} fontWeight={500} fill="var(--color-ink-4)">
            {AVENIDAS.map((a, i) => (
              <text key={a.name} dy={-px(4)} stroke={HALO} strokeWidth={px(2.5)} paintOrder="stroke" strokeLinejoin="round">
                <textPath href={`#av-${uid}-${i}`} startOffset="50%" textAnchor="middle">
                  {a.name}
                </textPath>
              </text>
            ))}
          </g>
        )}

        {/* bairros */}
        <g pointerEvents="none">
          {BAIRROS.filter((b) => !visitBairros.has(b.id)).map((b) => {
            const hl = bairroHighlight?.includes(b.id)
            const dim = dimZone(b.zone)
            return <circle key={b.id} cx={b.x} cy={b.y} r={px(hl ? 2.6 : 2)} fill={heat ? 'var(--color-ink-2)' : hl ? 'var(--color-ink-2)' : 'var(--color-ink-4)'} opacity={dim ? 0.3 : heat ? 0.4 : 1} />
          })}
          {bairroLabels.map((l) => {
            const b = BAIRROS.find((x) => x.id === l.id)!
            const hl = bairroHighlight?.includes(b.id)
            const dim = dimZone(b.zone)
            return (
              <text
                key={l.id}
                x={l.x}
                y={l.y}
                textAnchor={l.anchor}
                fontSize={bairroFont}
                fontWeight={hl ? 600 : 500}
                fill={hl ? 'var(--color-ink-2)' : 'var(--color-ink-3)'}
                opacity={dim ? 0.4 : 1}
                stroke={heat ? 'rgba(255,255,255,.7)' : HALO}
                strokeWidth={px(2.6)}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {b.name}
              </text>
            )
          })}
        </g>

        {focus !== 'visits' && zoneLabelsEl}

        {/* rota de comparação (como foi marcada), apagada */}
        {showRoute && compareD && (
          <motion.path
            key={routeKey + '-ghost'}
            d={compareD}
            fill="none"
            stroke="var(--color-coral)"
            strokeWidth={px(1.8)}
            strokeDasharray={`${px(5)} ${px(5)}`}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            pointerEvents="none"
          />
        )}
        {/* rota: preta contínua (otimizada) ou coral tracejada (como foi marcada) */}
        {showRoute && routeD && (
          <g pointerEvents="none" key={routeKey + routeVariant} mask={`url(#draw-${uid})`}>
            <path d={routeD} fill="none" stroke="#fff" strokeWidth={px(naive ? 6 : 7.5)} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
            <path
              d={routeD}
              fill="none"
              stroke={naive ? 'var(--color-coral)' : 'var(--color-black)'}
              strokeWidth={px(naive ? 2.6 : 3.2)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={naive ? `${px(7)} ${px(6)}` : undefined}
              opacity={naive ? 1 : 0.88}
            />
          </g>
        )}

        {focus === 'visits' && zoneLabelsEl}

        {/* base */}
        {showBase && (visits.length > 0 || focus === 'visits') && (
          <g transform={`translate(${BASE.x} ${BASE.y})`} pointerEvents="none">
            <circle r={px(11)} fill="var(--color-black)" stroke="#fff" strokeWidth={px(2.5)} filter={`url(#shadow-${uid})`} />
            <path
              d={`M${-px(4.4)},${px(0.4)} L0,${-px(3.8)} L${px(4.4)},${px(0.4)} M${-px(3)},${-px(0.8)} L${-px(3)},${px(4.2)} L${px(3)},${px(4.2)} L${px(3)},${-px(0.8)}`}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={px(1.5)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text y={px(25)} textAnchor="middle" fontSize={px(10)} fontWeight={700} fill="var(--color-ink-2)" stroke={HALO} strokeWidth={px(3)} paintOrder="stroke" strokeLinejoin="round">
              Base
            </text>
          </g>
        )}

        {/* rótulos dos pins */}
        <g pointerEvents="none">
          {pinLabels.map((l) => {
            const v = visits.find((x) => x.id === l.id)!
            const done = v.status === 'concluido'
            return (
              <text
                key={l.id}
                x={l.x}
                y={l.y}
                textAnchor={l.anchor}
                fontSize={pinFont}
                fontWeight={700}
                fill={done ? 'var(--color-ink-3)' : 'var(--color-ink)'}
                stroke={HALO}
                strokeWidth={px(3.2)}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {v.label}
              </text>
            )
          })}
        </g>

        {/* pins */}
        <g>
          {visits.map((v) => {
            const p = points[v.id]
            const tp = v.type ? JOB_TYPE[v.type] : null
            const Icon = tp?.icon
            const isSel = v.id === selectedVisitId
            const isHover = v.id === hoverVisit
            const done = v.status === 'concluido'
            const live = v.status === 'em-andamento'
            const onWay = v.status === 'a-caminho'
            const r = pinR
            const label = v.order != null ? String(v.order) : ''
            const pillW = px(label.length > 1 ? 19 : 15)
            return (
              <g
                key={v.id}
                transform={`translate(${p.x} ${p.y})`}
                role={onSelectVisit ? 'button' : undefined}
                tabIndex={onSelectVisit ? 0 : undefined}
                aria-label={`${v.label}${v.caption ? ', ' + v.caption : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectVisit?.(isSel ? null : v.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectVisit?.(isSel ? null : v.id)
                  }
                }}
                onMouseEnter={() => setHoverVisit(v.id)}
                onMouseLeave={() => setHoverVisit(null)}
                style={{ cursor: onSelectVisit ? 'pointer' : 'default', outline: 'none' }}
              >
                {live && (
                  <motion.circle
                    r={r + px(4)}
                    fill="var(--color-brand)"
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.9, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  />
                )}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isSel ? 1.16 : isHover ? 1.07 : 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  {isSel && <circle r={r + px(7)} fill="var(--color-black)" opacity={0.1} />}
                  {live && <circle r={r + px(4.5)} fill="var(--color-brand)" />}
                  {onWay && <circle r={r + px(4)} fill="var(--color-blue)" />}
                  <circle r={r + px(2)} fill="#fff" filter={live || onWay ? undefined : `url(#shadow-${uid})`} />
                  <circle r={r - px(0.5)} fill={tp?.color ?? 'var(--color-ink-3)'} opacity={done ? 0.16 : 0.18} />
                  {Icon ? (
                    <Icon x={-r * 0.56} y={-r * 0.56} width={r * 1.12} height={r * 1.12} color={tp!.color} strokeWidth={2.2} opacity={done ? 0.6 : 1} />
                  ) : (
                    <text y={px(compact ? 4 : 4.6)} textAnchor="middle" fontSize={px(compact ? 11 : 13)} fontWeight={700} fill="var(--color-ink-2)" opacity={done ? 0.6 : 1}>
                      {v.label[0]}
                    </text>
                  )}
                  {label && (
                    <g transform={`translate(${r * 0.82} ${-r * 0.82})`}>
                      <rect x={-pillW / 2} y={-px(7.5)} width={pillW} height={px(15)} rx={px(7.5)} fill={done ? 'var(--color-ink-3)' : 'var(--color-black)'} stroke="#fff" strokeWidth={px(1.6)} />
                      <text y={px(3.3)} textAnchor="middle" fontSize={px(9)} fontWeight={700} fill={live ? 'var(--color-brand)' : '#fff'} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {label}
                      </text>
                    </g>
                  )}
                </motion.g>
              </g>
            )
          })}
        </g>

        {/* caminhão agora */}
        {teamNow && (
          <motion.g initial={false} animate={{ x: teamNow.at.x, y: teamNow.at.y }} transition={{ duration: 0.8, ease: EASE }} pointerEvents="none">
            <motion.circle
              r={px(11)}
              fill="var(--color-brand)"
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
            <circle r={px(13)} fill="var(--color-brand)" opacity={0.45} />
            <circle r={px(10)} fill="var(--color-black)" stroke="#fff" strokeWidth={px(2.2)} filter={`url(#shadow-${uid})`} />
            <text y={px(3.2)} textAnchor="middle" fontSize={px(8.5)} fontWeight={800} fill="var(--color-brand)">
              {teamNow.initials}
            </text>
            <title>{teamNow.title ?? 'Caminhão agora'}</title>
          </motion.g>
        )}

        {overlay?.({ u, box })}

        {/* balão da parada selecionada */}
        {selected && (() => {
          const p = points[selected.id]
          const title = selected.label
          const cap = selected.caption ?? ''
          const fs = px(12.5)
          const cs = px(11)
          const w = Math.max(title.length * fs * 0.62, cap.length * cs * 0.56) + px(26)
          const h = px(cap ? 44 : 30)
          const above = p.y - pinR * 1.2 - h - px(12) > box.y
          const y = above ? -pinR * 1.2 - px(12) - h : pinR * 1.2 + px(12)
          let x = -w / 2
          if (p.x + x < box.x + px(6)) x = box.x + px(6) - p.x
          if (p.x + x + w > box.x + box.w - px(6)) x = box.x + box.w - px(6) - w - p.x
          return (
            <motion.g key={selected.id} transform={`translate(${p.x} ${p.y})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} pointerEvents="none">
              <rect x={x} y={y} width={w} height={h} rx={px(12)} fill="var(--color-black)" filter={`url(#shadow-${uid})`} />
              <text x={x + px(13)} y={y + px(19)} fontSize={fs} fontWeight={700} fill="#fff">
                {title}
              </text>
              {cap && (
                <text x={x + px(13)} y={y + px(34)} fontSize={cs} fontWeight={500} fill="rgba(255,255,255,.6)">
                  {cap}
                </text>
              )}
            </motion.g>
          )
        })()}

        {/* escala */}
        {showScale && !compact && (
          <g transform={`translate(${box.x + box.w - px(18) - scaleUnits - px(30)} ${box.y + box.h - px(18)})`} pointerEvents="none">
            <line x1={0} x2={scaleUnits} y1={0} y2={0} stroke="var(--color-ink-3)" strokeWidth={px(1.4)} strokeLinecap="round" />
            <line x1={0} x2={0} y1={-px(4)} y2={0} stroke="var(--color-ink-3)" strokeWidth={px(1.4)} strokeLinecap="round" />
            <line x1={scaleUnits} x2={scaleUnits} y1={-px(4)} y2={0} stroke="var(--color-ink-3)" strokeWidth={px(1.4)} strokeLinecap="round" />
            <text x={scaleUnits + px(6)} y={px(3.5)} fontSize={px(10)} fontWeight={600} fill="var(--color-ink-3)">
              2 km
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

/** Legenda de status das paradas */
export function MapStatusLegend({ className }: { className?: string }) {
  const items: [JobStatus, string][] = [
    ['concluido', 'Concluído'],
    ['em-andamento', 'Em andamento'],
    ['a-caminho', 'A caminho'],
    ['agendado', 'Agendado'],
  ]
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-ink-2', className)}>
      {items.map(([s, l]) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: STATUS_RING[s] }} />
          {l}
        </span>
      ))}
    </div>
  )
}
