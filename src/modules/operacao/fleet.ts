/* Caminhões ao vivo: posições simuladas (relógio da demo a 15x) levadas para o mapa, andando pelas ruas. */
import * as React from 'react'
import { computeFleetPositions, fleetClock, type FleetPosition } from '@/services'
import { formatTime } from '@/lib/format'
import { loadRoads, pathGeometry, pointAlong } from '@/lib/rotas'
import type { RealTruck } from '@/ui/MapaReal'

export const truckId = (teamId: string) => `truck:${teamId}`
export const teamOfTruck = (id: string) => (id.startsWith('truck:') ? id.slice(6) : undefined)

/** Posição de cada equipe, recalculada a cada `everyMs` (e quando `refreshKey` muda). Sem animação por quadro: o mapa desliza entre as posições. */
export function useFleet(everyMs: number, enabled = true, refreshKey?: unknown): FleetPosition[] {
  const [fleet, setFleet] = React.useState<FleetPosition[]>(() => computeFleetPositions())
  React.useEffect(() => {
    setFleet(computeFleetPositions())
    // os trajetos pelas ruas chegam depois; ao chegar, o caminhão passa a andar sobre eles
    let alive = true
    loadRoads().then(
      () => alive && setFleet(computeFleetPositions()),
      () => undefined,
    )
    if (!enabled) return () => void (alive = false)
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setFleet(computeFleetPositions())
    }, everyMs)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [everyMs, enabled, refreshKey])
  return fleet
}

/** Caminhões do mapa: em rota, sobre as ruas do trecho; no local ou na base, no ponto (em leque quando dividem o mesmo ponto). */
export function fleetTrucks(fleet: FleetPosition[], team: (id: string) => { initials: string; name: string } | undefined): RealTruck[] {
  const used = new Map<string, number>()
  return fleet.map((f) => {
    const t = team(f.teamId)
    let { lat, lng } = f
    if (f.status === 'em_rota') {
      const g = pathGeometry([f.from, f.to])
      if (g.length > 1) {
        const p = pointAlong(g, f.progress)
        lat = p.lat
        lng = p.lng
      }
    } else {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
      const n = used.get(key) ?? 0
      used.set(key, n + 1)
      if (n) {
        const ang = n * 2.4
        const r = 0.0028 + 0.0004 * n
        lat += Math.sin(ang) * r
        lng += Math.cos(ang) * r
      }
    }
    const name = t?.name ?? f.teamName
    const where = f.status === 'em_rota' ? `a caminho de ${f.toLabel}` : f.status === 'no_local' ? `em ${f.toLabel}` : 'na base'
    return {
      id: truckId(f.teamId),
      lat,
      lng,
      heading: f.heading,
      label: t?.initials ?? f.teamName.slice(0, 2).toUpperCase(),
      title: `Caminhão da ${name}, ${where}`,
      tone: f.status === 'em_rota' ? 'accent' : 'neutral',
      group: f.teamId,
    }
  })
}

/** "11:42" no relógio da demo, daqui a `min` minutos */
export function clockIn(min: number): string {
  return formatTime(new Date(fleetClock().getTime() + min * 60000))
}
