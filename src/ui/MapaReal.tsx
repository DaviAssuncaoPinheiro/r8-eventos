import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Map as MlMap, Marker as MlMarker, GeoJSONSource, StyleSpecification } from 'maplibre-gl'
import { BAIRROS, BASE } from '@/data/geo'
import { cn } from './cn'
import { loadRoads, pathGeometry, pointAlong, sliceAlong, type Coord } from '@/lib/rotas'
import { MapaDF, type MapPin as FlatPin, type MapRoute as FlatRoute } from './MapaDF'

/*
  Mapa de verdade (MapLibre + OpenFreeMap, sem chave). Só os pinos, os caminhões e as rotas levam cor.
  - A biblioteca é carregada sob demanda: não pesa na primeira tela.
  - Rotas seguem as ruas por trajetos pré-calculados (src/lib/rotas.ts); sem trajeto conhecido, ligam em linha reta.
  - Se o navegador não tiver WebGL ou o servidor de mapas não responder, cai no mapa estilizado (MapaDF).
*/

export type MapTone = 'accent' | 'ok' | 'info' | 'danger' | 'neutral'

export interface RealPin {
  id: string
  lat: number
  lng: number
  /** Iniciais da equipe ou número da parada. */
  label: string
  /** Texto completo para leitor de tela e dica nativa. */
  title: string
  tone?: MapTone
  /** Anel que pulsa: em andamento ou a caminho. */
  pulse?: boolean
  /** Agrupa pinos e rotas para o destaque (`selectedGroup`). Padrão: o próprio id. */
  group?: string
}

export interface RealRoute {
  id: string
  /** Paradas em ordem. A linha segue as ruas entre elas. */
  points: { lat: number; lng: number }[]
  /** Tracejada: trecho previsto. Cheia: trecho feito. */
  dashed?: boolean
  group?: string
}

export interface RealTruck {
  id: string
  lat: number
  lng: number
  /** Direção em graus (0 = norte). */
  heading?: number
  label: string
  title: string
  tone?: MapTone
  group?: string
  /** Em vez de lat/lng: anda sobre a rota `routeId`, na fração `progress` (0 a 1) do trajeto pelas ruas. */
  routeId?: string
  progress?: number
}

export interface MapaRealProps {
  pins?: RealPin[]
  routes?: RealRoute[]
  /** Caminhões: a posição desliza suavemente quando muda. */
  trucks?: RealTruck[]
  /** Mostra a base da locadora. */
  showBase?: boolean
  /** Grupo em destaque; o resto fica esmaecido. */
  selectedGroup?: string
  onSelect?: (id: string) => void
  /** Enquadra sempre que os pontos mudam (padrão) ou só na primeira vez. */
  refit?: 'always' | 'once'
  /** Controles de zoom. */
  controls?: boolean
  className?: string
  /** Resumo para leitor de tela. */
  label: string
}

const STYLE_URL = { light: 'https://tiles.openfreemap.org/styles/positron', dark: 'https://tiles.openfreemap.org/styles/dark' }
const BRASILIA: [number, number] = [-47.93, -15.8]

/*
  O estilo é baixado e limpo antes de ir para o mapa: saem as plaquinhas de rodovia (poluem e disparam
  avisos de expressão no console) e as texturas que o estilo referencia sem fornecer a imagem.
*/
const styleCache = new Map<string, StyleSpecification>()
async function loadStyle(theme: 'light' | 'dark'): Promise<StyleSpecification> {
  const hit = styleCache.get(theme)
  if (hit) return hit
  const res = await fetch(STYLE_URL[theme])
  if (!res.ok) throw new Error(`estilo do mapa: ${res.status}`)
  const style = (await res.json()) as StyleSpecification
  style.layers = style.layers.filter((l) => {
    if (/shield/.test(l.id)) return false
    const paint = (l as { paint?: Record<string, unknown> }).paint
    if (paint && ('fill-pattern' in paint || 'line-pattern' in paint)) return false
    return true
  })
  styleCache.set(theme, style)
  return style
}

const toneVar: Record<MapTone, { bg: string; fg: string }> = {
  accent: { bg: 'var(--accent)', fg: 'var(--on-accent)' },
  ok: { bg: 'var(--ok)', fg: '#ffffff' },
  info: { bg: 'var(--info)', fg: '#ffffff' },
  danger: { bg: 'var(--danger-solid)', fg: '#ffffff' },
  neutral: { bg: 'var(--inverse)', fg: 'var(--on-inverse)' },
}

const themeNow = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
const cssColor = (name: string, fallback: string) => {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const c = getComputedStyle(probe).color
  probe.remove()
  return c || fallback
}
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const routeKey = (pts: { lat: number; lng: number }[]) => pts.map((p) => `${p.lng.toFixed(4)},${p.lat.toFixed(4)}`).join(';')

/* ───────── reserva: mapa estilizado, com os pontos no bairro mais próximo ───────── */

function nearestXY(lat: number, lng: number) {
  let best = BAIRROS[0]
  let d = Infinity
  for (const b of BAIRROS) {
    const k = (b.lat - lat) ** 2 + (b.lng - lng) ** 2
    if (k < d) {
      d = k
      best = b
    }
  }
  // desloca na mesma proporção em que o ponto se afasta do centro do bairro (1 grau ~ 1500 unidades do desenho)
  return { x: best.x + (lng - best.lng) * 1500, y: best.y - (lat - best.lat) * 1500 }
}

function Fallback({ pins, routes, trucks, selectedGroup, onSelect, label, className }: MapaRealProps) {
  const flatPins: FlatPin[] = [
    ...(pins ?? []).map((p) => ({ id: p.id, ...nearestXY(p.lat, p.lng), label: p.label, title: p.title, tone: p.tone, pulse: p.pulse })),
    ...(trucks ?? []).map((t) => ({ id: t.id, ...nearestXY(t.lat, t.lng), label: t.label, title: t.title, tone: t.tone, pulse: true })),
  ]
  const flatRoutes: FlatRoute[] = (routes ?? []).map((r) => ({ id: r.id, points: r.points.map((p) => nearestXY(p.lat, p.lng)), dashed: r.dashed }))
  const sel = selectedGroup ? flatPins.find((p) => p.id === selectedGroup)?.id : undefined
  return <MapaDF pins={flatPins} routes={flatRoutes} selectedId={sel} onSelect={onSelect} labels={false} label={label} className={className} />
}

/* ───────── elementos dos marcadores ───────── */

function pinEl(p: RealPin, onSelect?: (id: string) => void) {
  const t = toneVar[p.tone ?? 'neutral']
  const el = document.createElement(onSelect ? 'button' : 'div')
  el.className = 'ds-mappin'
  if (onSelect) {
    ;(el as HTMLButtonElement).type = 'button'
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      onSelect(p.id)
    })
  }
  el.setAttribute('aria-label', p.title)
  el.title = p.title
  el.style.setProperty('--pin-bg', t.bg)
  el.style.setProperty('--pin-fg', t.fg)
  if (p.pulse) el.dataset.pulse = 'true'
  el.textContent = p.label
  return el
}

function truckEl(t: RealTruck, onSelect?: (id: string) => void) {
  const tone = toneVar[t.tone ?? 'accent']
  const el = document.createElement(onSelect ? 'button' : 'div')
  el.className = 'ds-maptruck'
  if (onSelect) {
    ;(el as HTMLButtonElement).type = 'button'
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      onSelect(t.id)
    })
  }
  el.setAttribute('aria-label', t.title)
  el.title = t.title
  el.style.setProperty('--pin-bg', tone.bg)
  el.style.setProperty('--pin-fg', tone.fg)
  el.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>' +
    `<span>${t.label}</span>`
  return el
}

/** Mapa real de Brasília com pinos, caminhões e rotas pelas ruas. */
export function MapaReal(props: MapaRealProps) {
  const { pins = [], routes = [], trucks = [], showBase = true, selectedGroup, onSelect, refit = 'always', controls = true, className, label } = props
  const box = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<MlMap | null>(null)
  const libRef = React.useRef<typeof import('maplibre-gl') | null>(null)
  const pinMarkers = React.useRef(new Map<string, { m: MlMarker; group: string }>())
  const truckMarkers = React.useRef(new Map<string, { m: MlMarker; group: string; raf?: number }>())
  const baseMarker = React.useRef<MlMarker | null>(null)
  const fitted = React.useRef(false)
  const [state, setState] = React.useState<'loading' | 'ready' | 'failed'>('loading')
  const [styleTick, setStyleTick] = React.useState(0)
  // trajetos pelas ruas chegam depois (carga sob demanda): quando chegam, rotas e caminhões se reposicionam
  const [roadsTick, setRoadsTick] = React.useState(0)
  React.useEffect(() => {
    let alive = true
    loadRoads().then(
      () => alive && setRoadsTick((n) => n + 1),
      () => undefined,
    )
    return () => {
      alive = false
    }
  }, [])
  const onSelectRef = React.useRef(onSelect)
  onSelectRef.current = onSelect

  // 1. cria o mapa uma vez
  React.useEffect(() => {
    let dead = false
    const el = box.current
    if (!el) return
    const giveUp = window.setTimeout(() => !dead && mapRef.current == null && setState('failed'), 9000)
    ;(async () => {
      try {
        const [lib, style] = await Promise.all([import('maplibre-gl'), loadStyle(themeNow()), import('maplibre-gl/dist/maplibre-gl.css')])
        if (dead) return
        libRef.current = lib
        const map = new lib.Map({
          container: el,
          style,
          center: BRASILIA,
          zoom: 10.2,
          attributionControl: { compact: true },
          scrollZoom: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          cooperativeGestures: false,
          fadeDuration: reducedMotion() ? 0 : 200,
        })
        map.touchZoomRotate.disableRotation()
        mapRef.current = map
        let ok = false
        map.on('load', () => {
          ok = true
          window.clearTimeout(giveUp)
          if (!dead) setState('ready')
        })
        map.on('styledata', () => !dead && setStyleTick((n) => n + 1))
        map.on('error', (e) => {
          // falha ao carregar o estilo antes da primeira pintura: usa o mapa de reserva
          if (!ok && /style|Failed to fetch|NetworkError|404|403/i.test(String(e?.error?.message ?? ''))) {
            window.clearTimeout(giveUp)
            if (!dead) setState('failed')
          }
        })
      } catch {
        window.clearTimeout(giveUp)
        if (!dead) setState('failed')
      }
    })()
    return () => {
      dead = true
      window.clearTimeout(giveUp)
      for (const t of truckMarkers.current.values()) if (t.raf) cancelAnimationFrame(t.raf)
      pinMarkers.current.clear()
      truckMarkers.current.clear()
      baseMarker.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // 2. acompanha o tema (claro/escuro) e a troca de cor da marca
  React.useEffect(() => {
    const map = mapRef.current
    if (!map || state !== 'ready') return
    let current = themeNow()
    const obs = new MutationObserver(() => {
      const next = themeNow()
      if (next !== current) {
        current = next
        loadStyle(next).then(
          (st) => mapRef.current === map && map.setStyle(st),
          () => undefined,
        )
      } else {
        setStyleTick((n) => n + 1) // marca mudou: repinta as rotas
      }
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-brand', 'style'] })
    return () => obs.disconnect()
  }, [state])

  // 3. redimensiona junto com o contêiner
  React.useEffect(() => {
    const el = box.current
    if (!el || state !== 'ready') return
    const ro = new ResizeObserver(() => mapRef.current?.resize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [state])

  // 4. pinos e base
  const pinsKey = pins.map((p) => `${p.id}:${p.lat}:${p.lng}:${p.label}:${p.tone}:${p.pulse ? 1 : 0}:${p.group ?? ''}`).join('|')
  React.useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!map || !lib || state !== 'ready') return
    const seen = new Set<string>()
    for (const p of pins) {
      seen.add(p.id)
      pinMarkers.current.get(p.id)?.m.remove()
      const m = new lib.Marker({ element: pinEl(p, onSelectRef.current ? (id) => onSelectRef.current?.(id) : undefined), anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map)
      pinMarkers.current.set(p.id, { m, group: p.group ?? p.id })
    }
    for (const [id, v] of pinMarkers.current) {
      if (!seen.has(id)) {
        v.m.remove()
        pinMarkers.current.delete(id)
      }
    }
    if (showBase && !baseMarker.current) {
      const el = document.createElement('div')
      el.className = 'ds-mapbase'
      el.title = BASE.name
      el.setAttribute('aria-label', 'Base da locadora')
      baseMarker.current = new lib.Marker({ element: el, anchor: 'center' }).setLngLat([BASE.lng, BASE.lat]).addTo(map)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinsKey, state, showBase])

  // 5. caminhões: criam uma vez e deslizam até a nova posição
  const placed = trucks.map((t) => {
    const g = t.routeId ? pathGeometry(routes.find((r) => r.id === t.routeId)?.points ?? []) : null
    if (g && g.length > 1 && t.progress !== undefined) {
      const p = pointAlong(g, t.progress)
      return { ...t, lat: p.lat, lng: p.lng }
    }
    return t
  })
  const trucksKey = placed.map((t) => `${t.id}:${t.lat.toFixed(5)}:${t.lng.toFixed(5)}:${t.tone}:${t.label}`).join('|') + `#${roadsTick}`
  React.useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!map || !lib || state !== 'ready') return
    const seen = new Set<string>()
    for (const t of placed) {
      seen.add(t.id)
      const cur = truckMarkers.current.get(t.id)
      if (!cur) {
        const m = new lib.Marker({ element: truckEl(t, onSelectRef.current ? (id) => onSelectRef.current?.(id) : undefined), anchor: 'center' }).setLngLat([t.lng, t.lat]).addTo(map)
        truckMarkers.current.set(t.id, { m, group: t.group ?? t.id })
        continue
      }
      if (cur.raf) cancelAnimationFrame(cur.raf)
      const from = cur.m.getLngLat()
      const to = { lng: t.lng, lat: t.lat }
      if (reducedMotion() || (Math.abs(from.lng - to.lng) < 1e-6 && Math.abs(from.lat - to.lat) < 1e-6)) {
        cur.m.setLngLat([to.lng, to.lat])
        continue
      }
      const start = performance.now()
      const dur = 1800
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / dur)
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        cur.m.setLngLat([from.lng + (to.lng - from.lng) * e, from.lat + (to.lat - from.lat) * e])
        if (k < 1) cur.raf = requestAnimationFrame(step)
      }
      cur.raf = requestAnimationFrame(step)
    }
    for (const [id, v] of truckMarkers.current) {
      if (!seen.has(id)) {
        if (v.raf) cancelAnimationFrame(v.raf)
        v.m.remove()
        truckMarkers.current.delete(id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trucksKey, state])

  // 6. rotas pelas ruas (camadas refeitas a cada troca de estilo, porque setStyle apaga as camadas)
  const routesKey = routes.map((r) => `${r.id}:${r.dashed ? 1 : 0}:${r.group ?? ''}:${routeKey(r.points)}`).join('|')
  const geoms = React.useRef(new Map<string, Coord[]>())
  const drawn = React.useRef('')
  React.useEffect(() => {
    const map = mapRef.current
    if (!map || state !== 'ready' || !map.isStyleLoaded()) return
    const accent = cssColor('--accent', '#d54200')
    const casing = themeNow() === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)'
    geoms.current = new Map(routes.map((r) => [r.id, pathGeometry(r.points)]))
    const collection = (k: number) => ({
      type: 'FeatureCollection' as const,
      features: routes.map((r) => ({
        type: 'Feature' as const,
        properties: { id: r.id, dashed: !!r.dashed, group: r.group ?? r.id },
        geometry: { type: 'LineString' as const, coordinates: sliceAlong(geoms.current.get(r.id) ?? [], k) },
      })),
    })
    // a linha "se desenha" só quando o conjunto de rotas muda; troca de tema ou de destaque repinta direto
    const animate = !reducedMotion() && routes.length > 0 && drawn.current !== `${routesKey}#${roadsTick}`
    drawn.current = `${routesKey}#${roadsTick}`
    const src = map.getSource('rotas') as GeoJSONSource | undefined
    if (src) src.setData(collection(animate ? 0.001 : 1))
    else map.addSource('rotas', { type: 'geojson', data: collection(animate ? 0.001 : 1) })
    const dim = (base: number): unknown => (selectedGroup ? ['case', ['==', ['get', 'group'], selectedGroup], base, base * 0.18] : base)
    const add = (id: string, def: Record<string, unknown>) => {
      if (map.getLayer(id)) map.removeLayer(id)
      map.addLayer(def as never)
    }
    add('rotas-borda', { id: 'rotas-borda', type: 'line', source: 'rotas', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': casing, 'line-width': 7, 'line-opacity': dim(0.9) } })
    add('rotas-feito', { id: 'rotas-feito', type: 'line', source: 'rotas', filter: ['!', ['get', 'dashed']], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': accent, 'line-width': 4, 'line-opacity': dim(1) } })
    add('rotas-previsto', { id: 'rotas-previsto', type: 'line', source: 'rotas', filter: ['get', 'dashed'], layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: { 'line-color': accent, 'line-width': 4, 'line-opacity': dim(1), 'line-dasharray': [1.4, 1.2] } })
    if (!animate) return
    let raf = 0
    const start = performance.now()
    const grow = (now: number) => {
      const k = Math.min(1, (now - start) / 1200)
      const e = 1 - Math.pow(1 - k, 3)
      ;(map.getSource('rotas') as GeoJSONSource | undefined)?.setData(collection(Math.max(0.001, e)))
      if (k < 1) raf = requestAnimationFrame(grow)
    }
    raf = requestAnimationFrame(grow)
    return () => {
      cancelAnimationFrame(raf)
      ;(map.getSource('rotas') as GeoJSONSource | undefined)?.setData(collection(1))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesKey, state, styleTick, selectedGroup, roadsTick])

  // 7. destaque do grupo nos marcadores
  React.useEffect(() => {
    for (const v of [...pinMarkers.current.values(), ...truckMarkers.current.values()]) {
      // o MapLibre controla a opacidade do marcador por estilo em linha; por isso vai pela API dele
      v.m.setOpacity(selectedGroup && v.group !== selectedGroup ? '0.28' : '1')
    }
  }, [selectedGroup, pinsKey, trucksKey, state])

  // 8. enquadra os pontos
  const fitKey = [...pins, ...placed].map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('|')
  React.useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!map || !lib || state !== 'ready') return
    if (refit === 'once' && fitted.current) return
    const pts: [number, number][] = [...pins.map((p) => [p.lng, p.lat] as [number, number]), ...placed.map((t) => [t.lng, t.lat] as [number, number])]
    if (showBase) pts.push([BASE.lng, BASE.lat])
    if (!pts.length) return
    const b = new lib.LngLatBounds(pts[0], pts[0])
    for (const p of pts) b.extend(p)
    fitted.current = true
    map.fitBounds(b, { padding: 56, maxZoom: 13.5, duration: reducedMotion() ? 0 : 700 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, state, refit, showBase])

  if (state === 'failed') return <Fallback {...props} />

  return (
    <div role="group" aria-label={label} className={cn('ds-mapreal relative size-full overflow-hidden rounded-[inherit] bg-[var(--map-land)]', className)}>
      {/* o MapLibre põe position: relative no contêiner; por isso ele ocupa o pai por altura e largura, não por inset */}
      <div ref={box} className="size-full" />
      {state === 'loading' ? <div aria-hidden className="ds-skeleton absolute inset-0" /> : null}
      {controls && state === 'ready' ? (
        <div className="absolute top-3 right-3 flex flex-col overflow-hidden rounded-control bg-raised shadow-overlay">
          <button type="button" aria-label="Aproximar o mapa" onClick={() => mapRef.current?.zoomIn()} className="ds-touch-sq grid size-9 place-items-center text-fg transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
            <Plus size={18} strokeWidth={2} aria-hidden />
          </button>
          <span aria-hidden className="h-px bg-hairline" />
          <button type="button" aria-label="Afastar o mapa" onClick={() => mapRef.current?.zoomOut()} className="ds-touch-sq grid size-9 place-items-center text-fg transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
            <Minus size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  )
}
