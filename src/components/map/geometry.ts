import { BAIRRO, BAIRROS, BASE, VIEWBOX, type ZoneId } from '@/data/geo'

export type Pt = { x: number; y: number }
export type Box = { x: number; y: number; w: number; h: number }

export const FULL_BOX: Box = { x: 0, y: 0, w: VIEWBOX.w, h: VIEWBOX.h }

/** FNV-1a: hash determinístico para posicionar endereços dentro do bairro */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Ponto de um endereço: centro da região com um pequeno deslocamento estável por local */
export function addressPoint(bairroId: string, seed?: string): Pt {
  const b = BAIRRO[bairroId]
  if (!b) return { x: BASE.x, y: BASE.y }
  if (!seed) return { x: b.x, y: b.y }
  const h = hash(seed)
  const a = ((h % 360) * Math.PI) / 180
  const r = 3 + ((h >>> 9) % 6)
  return { x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r }
}

export const BASE_PT: Pt = { x: BASE.x, y: BASE.y }

const f = (n: number) => n.toFixed(1)

/** Catmull-Rom → Bézier cúbica. Mesmo nº de pontos ⇒ mesma estrutura de comandos (permite morph). */
export function smoothPath(pts: Pt[], k = 0.9) {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${f(pts[0].x)},${f(pts[0].y)}`
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * k, y: p1.y + ((p2.y - p0.y) / 6) * k }
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * k, y: p2.y - ((p3.y - p1.y) / 6) * k }
    d += ` C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)}`
  }
  return d
}

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export function legLengths(pts: Pt[]) {
  const out: number[] = []
  for (let i = 1; i < pts.length; i++) out.push(dist(pts[i - 1], pts[i]))
  return out
}

export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/** Enquadra pontos numa caixa com a proporção do contêiner, presa aos limites do mapa */
export function fitBox(pts: Pt[], aspect: number, { pad = 60, minW = 380 } = {}): Box {
  if (!pts.length) return coverBox(aspect)
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const x0 = Math.min(...xs) - pad
  const x1 = Math.max(...xs) + pad
  const y0 = Math.min(...ys) - pad
  const y1 = Math.max(...ys) + pad
  let w = Math.max(x1 - x0, minW)
  let h = y1 - y0
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  if (w / h < aspect) w = h * aspect
  else h = w / aspect
  if (w > VIEWBOX.w) {
    w = VIEWBOX.w
    h = w / aspect
  }
  if (h > VIEWBOX.h) {
    h = VIEWBOX.h
    w = h * aspect
  }
  return { x: clamp(cx - w / 2, 0, VIEWBOX.w - w), y: clamp(cy - h / 2, 0, VIEWBOX.h - h), w, h }
}

/** Mapa inteiro, recortado (cover) na proporção do contêiner */
export function coverBox(aspect: number): Box {
  const full = VIEWBOX.w / VIEWBOX.h
  if (Math.abs(aspect - full) < 0.01) return FULL_BOX
  if (aspect > full) {
    const h = VIEWBOX.w / aspect
    return { x: 0, y: (VIEWBOX.h - h) * 0.4, w: VIEWBOX.w, h }
  }
  const w = VIEWBOX.h * aspect
  return { x: (VIEWBOX.w - w) / 2, y: 0, w, h: VIEWBOX.h }
}

/** Escala do protótipo: 1 unidade do mapa ≈ 70 m (Ceilândia a Planaltina dá ~60 km) */
export const KM_PER_UNIT = 0.07

/** Centro médio dos bairros de uma zona */
export function zoneCentroid(z: ZoneId): Pt {
  const bs = BAIRROS.filter((b) => b.zone === z)
  return { x: bs.reduce((a, b) => a + b.x, 0) / bs.length, y: bs.reduce((a, b) => a + b.y, 0) / bs.length }
}

/** Tempo médio de caminhão da base no SIA até a região (horário comercial) */
export function travelMinutesFromBase(z: ZoneId) {
  const km = dist(BASE_PT, zoneCentroid(z)) * KM_PER_UNIT * 1.3 // fator de sinuosidade das vias
  return Math.round(8 + km * 1.6)
}

/* ───────────── rótulos sem sobreposição ───────────── */

export type Rect = { x0: number; y0: number; x1: number; y1: number }
const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

export interface LabelReq {
  id: string
  x: number
  y: number
  text: string
  size: number // altura da fonte em unidades
  gap: number // distância do ponto
  sides?: ('r' | 'l' | 't' | 'b')[]
  charW?: number
}
export interface Placed {
  id: string
  x: number
  y: number
  anchor: 'start' | 'end' | 'middle'
  rect: Rect
}

/** Posicionamento guloso: tenta direita, esquerda, cima, baixo; esconde se não couber */
export function placeLabels(reqs: LabelReq[], obstacles: Rect[], bounds?: Box): Placed[] {
  const taken = [...obstacles]
  const out: Placed[] = []
  for (const r of reqs) {
    const w = r.text.length * r.size * (r.charW ?? 0.56)
    const h = r.size * 1.05
    const cands: Record<string, Placed> = {
      r: { id: r.id, x: r.x + r.gap, y: r.y + h * 0.34, anchor: 'start', rect: { x0: r.x + r.gap, y0: r.y - h / 2, x1: r.x + r.gap + w, y1: r.y + h / 2 } },
      l: { id: r.id, x: r.x - r.gap, y: r.y + h * 0.34, anchor: 'end', rect: { x0: r.x - r.gap - w, y0: r.y - h / 2, x1: r.x - r.gap, y1: r.y + h / 2 } },
      b: { id: r.id, x: r.x, y: r.y + r.gap + h * 0.8, anchor: 'middle', rect: { x0: r.x - w / 2, y0: r.y + r.gap, x1: r.x + w / 2, y1: r.y + r.gap + h } },
      t: { id: r.id, x: r.x, y: r.y - r.gap - h * 0.2, anchor: 'middle', rect: { x0: r.x - w / 2, y0: r.y - r.gap - h, x1: r.x + w / 2, y1: r.y - r.gap } },
    }
    for (const s of r.sides ?? ['r', 'l', 'b', 't']) {
      const c = cands[s]
      const inside = !bounds || (c.rect.x0 >= bounds.x + 2 && c.rect.x1 <= bounds.x + bounds.w - 2 && c.rect.y0 >= bounds.y + 2 && c.rect.y1 <= bounds.y + bounds.h - 2)
      if (inside && !taken.some((t) => overlaps(t, c.rect))) {
        taken.push({ x0: c.rect.x0 - r.size * 0.25, y0: c.rect.y0 - r.size * 0.15, x1: c.rect.x1 + r.size * 0.25, y1: c.rect.y1 + r.size * 0.15 })
        out.push(c)
        break
      }
    }
  }
  return out
}

export const circleRect = (p: Pt, r: number): Rect => ({ x0: p.x - r, y0: p.y - r, x1: p.x + r, y1: p.y + r })
