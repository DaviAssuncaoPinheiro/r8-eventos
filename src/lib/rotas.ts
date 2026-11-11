import { BAIRROS, BASE } from '@/data/geo'

/*
  Trajetos pelas ruas, pré-calculados uma vez (OSRM sobre dados do OpenStreetMap) entre a base e cada
  região do DF e entre cada par de regiões. Ficam em src/data/rotas.json: { "a|b": [polyline, metros, segundos] },
  com a|b em ordem alfabética. Carregado sob demanda junto com o mapa: nada de consulta de rota em tempo real.
*/

export interface LatLng {
  lat: number
  lng: number
}
/** [lng, lat], a ordem que o mapa usa. */
export type Coord = [number, number]

type Leg = [polyline: string, meters: number, seconds: number]
let roads: Record<string, Leg> | null = null
let pending: Promise<Record<string, Leg>> | null = null

/** Carrega os trajetos (uma vez). As funções abaixo usam linha reta enquanto não tiver carregado. */
export function loadRoads(): Promise<Record<string, Leg>> {
  if (roads) return Promise.resolve(roads)
  pending ??= import('@/data/rotas.json').then((m) => {
    roads = (m.default ?? m) as unknown as Record<string, Leg>
    return roads
  })
  return pending
}

const NODES: { id: string; lat: number; lng: number }[] = [{ id: 'base', lat: BASE.lat, lng: BASE.lng }, ...BAIRROS.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng }))]

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Região (ou a base) mais próxima do ponto, se estiver a até 3 km. */
function nearestNode(p: LatLng): string | null {
  let best: string | null = null
  let d = 3
  for (const n of NODES) {
    const k = haversineKm(p, n)
    if (k < d) {
      d = k
      best = n.id
    }
  }
  return best
}

/** Decodifica polyline de precisão 5 para [lng, lat]. */
function decode(str: string): Coord[] {
  const out: Coord[] = []
  let i = 0
  let lat = 0
  let lng = 0
  while (i < str.length) {
    for (const which of [0, 1]) {
      let shift = 0
      let result = 0
      let byte: number
      do {
        byte = str.charCodeAt(i++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (which === 0) lat += delta
      else lng += delta
    }
    out.push([lng / 1e5, lat / 1e5])
  }
  return out
}

const decoded = new Map<string, Coord[]>()
function leg(a: string, b: string): { coords: Coord[]; meters: number; seconds: number } | null {
  if (!roads || a === b) return null
  const key = a < b ? `${a}|${b}` : `${b}|${a}`
  const hit = roads[key]
  if (!hit) return null
  let coords = decoded.get(key)
  if (!coords) {
    coords = decode(hit[0])
    decoded.set(key, coords)
  }
  return { coords: a < b ? coords : [...coords].reverse(), meters: hit[1], seconds: hit[2] }
}

/** Geometria pelas ruas passando pelos pontos, em ordem. Sem trajeto conhecido, liga em linha reta. */
export function pathGeometry(points: LatLng[]): Coord[] {
  const out: Coord[] = []
  const push = (c: Coord) => {
    const last = out[out.length - 1]
    if (!last || last[0] !== c[0] || last[1] !== c[1]) out.push(c)
  }
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (i === 0) {
      push([p.lng, p.lat])
      continue
    }
    const prev = points[i - 1]
    const a = nearestNode(prev)
    const b = nearestNode(p)
    const l = a && b ? leg(a, b) : null
    if (l) for (const c of l.coords) push(c)
    push([p.lng, p.lat])
  }
  return out
}

/** Distância pelas ruas em km (do trajeto pré-calculado; sem ele, linha reta × 1,3). */
export function roadKm(a: LatLng, b: LatLng): number {
  const na = nearestNode(a)
  const nb = nearestNode(b)
  const l = na && nb ? leg(na, nb) : null
  return l ? l.meters / 1000 : haversineKm(a, b) * 1.3
}

/** Ponto e direção (graus, 0 = norte) a uma fração t (0 a 1) do comprimento da linha. */
export function pointAlong(coords: Coord[], t: number): { lng: number; lat: number; heading: number } {
  if (!coords.length) return { lng: BASE.lng, lat: BASE.lat, heading: 0 }
  if (coords.length === 1) return { lng: coords[0][0], lat: coords[0][1], heading: 0 }
  const seg: number[] = []
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const d = Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1])
    seg.push(d)
    total += d
  }
  let target = Math.min(1, Math.max(0, t)) * total
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, target / seg[i]) : 0
      const [x0, y0] = coords[i]
      const [x1, y1] = coords[i + 1]
      return { lng: x0 + (x1 - x0) * k, lat: y0 + (y1 - y0) * k, heading: (Math.atan2(x1 - x0, y1 - y0) * 180) / Math.PI }
    }
    target -= seg[i]
  }
  const last = coords[coords.length - 1]
  return { lng: last[0], lat: last[1], heading: 0 }
}

/** Trecho da linha do início até a fração t (para a rota "se desenhar"). */
export function sliceAlong(coords: Coord[], t: number): Coord[] {
  if (t >= 1 || coords.length < 2) return coords
  const end = pointAlong(coords, t)
  const out: Coord[] = []
  let total = 0
  const seg: number[] = []
  for (let i = 1; i < coords.length; i++) {
    const d = Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1])
    seg.push(d)
    total += d
  }
  let target = Math.max(0, t) * total
  out.push(coords[0])
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i]) break
    out.push(coords[i + 1])
    target -= seg[i]
  }
  out.push([end.lng, end.lat])
  return out
}
