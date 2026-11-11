import type { CSSProperties } from 'react'
import { BASE, BAIRRO } from '@/data/geo'
import type { MapPin, MapRoute, StatusTone } from '@/ui'
import type { ServiceStatus, ServiceView, Team } from '@/services'

/** Serviço que ainda pode ser movido de equipe ou de posição */
export const canMove = (status: ServiceStatus) => status === 'agendado' || status === 'atrasado'

export const quantityLabel = (n: number) => `${n} ${n === 1 ? 'unidade' : 'unidades'}`

export const serviceTitle = (s: Pick<ServiceView, 'typeLabel' | 'unitIds'>) => `${s.typeLabel}, ${quantityLabel(s.unitIds.length)}`

/** Cor do avatar da equipe: fundo suave e anel na cor de visualização da equipe */
export const teamAvatarStyle = (color: string): CSSProperties => ({
  backgroundColor: `color-mix(in oklab, var(--${color}) 22%, var(--raised))`,
  boxShadow: `inset 0 0 0 2px var(--${color})`,
})

export const PIN_TONE: Record<ServiceStatus, MapPin['tone']> = {
  concluido: 'ok',
  em_andamento: 'accent',
  a_caminho: 'info',
  atrasado: 'danger',
  agendado: 'neutral',
  cancelado: 'neutral',
}

export const DOT_TONE: Record<ServiceStatus, StatusTone> = {
  concluido: 'ok',
  em_andamento: 'accent',
  a_caminho: 'info',
  atrasado: 'danger',
  agendado: 'neutral',
  cancelado: 'idle',
}

/** Serviços de uma equipe na ordem da rota */
export function routeOf(services: ServiceView[], teamId: string): ServiceView[] {
  return services.filter((s) => s.teamId === teamId).sort((a, b) => a.order - b.order || a.start.localeCompare(b.start))
}

export const visibleOf = (list: ServiceView[]) => list.filter((s) => s.status !== 'cancelado')

export interface MapModel {
  pins: MapPin[]
  routes: MapRoute[]
  /** posição de cada rota no desenho (para destacar a da equipe escolhida) */
  routeTeam: string[]
  /** ponto de cada pino, por serviço */
  box: [number, number, number, number]
}

/** Pinos numerados por equipe, rota cheia no que foi feito e tracejada no previsto */
export function buildMap(services: ServiceView[], teams: Team[], aspect: number): MapModel {
  const pins: MapPin[] = []
  const routes: MapRoute[] = []
  const routeTeam: string[] = []
  const used = new Map<string, number>()
  const pts: { x: number; y: number }[] = [BASE]

  for (const t of teams) {
    const list = visibleOf(routeOf(services, t.id))
    const path: { x: number; y: number }[] = [{ x: BASE.x, y: BASE.y }]
    let lastDone = 0
    list.forEach((s, i) => {
      const b = BAIRRO[s.bairroId]
      if (!b) return
      const n = used.get(s.bairroId) ?? 0
      used.set(s.bairroId, n + 1)
      const ang = n * 2.4
      const x = Math.round(b.x + (n ? Math.cos(ang) * 46 : 0))
      const y = Math.round(b.y + (n ? Math.sin(ang) * 46 : 0))
      path.push({ x, y })
      pts.push({ x, y })
      if (s.status === 'concluido' || s.status === 'em_andamento' || s.status === 'a_caminho') lastDone = path.length - 1
      const live = s.status === 'em_andamento' || s.status === 'a_caminho'
      pins.push({
        id: s.id,
        x,
        y,
        label: String(i + 1),
        title: `${t.name}, parada ${i + 1}, ${s.typeLabel} em ${s.bairroName}, ${s.clientName}`,
        tone: PIN_TONE[s.status],
        pulse: live,
      })
    })
    if (path.length < 2) continue
    if (lastDone > 0) {
      routes.push({ id: `${t.id}-feito`, points: path.slice(0, lastDone + 1) })
      routeTeam.push(t.id)
    }
    if (lastDone < path.length - 1) {
      routes.push({
        id: `${t.id}-previsto`,
        points: path.slice(lastDone),
        dashed: true,
      })
      routeTeam.push(t.id)
    }
  }

  // enquadra a base e as paradas, com folga, na proporção do espaço disponível
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  let w = Math.max(760, Math.max(...xs) - Math.min(...xs) + 220)
  let h = Math.max(460, Math.max(...ys) - Math.min(...ys) + 220)
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2
  if (w / h < aspect) w = h * aspect
  else h = w / aspect
  return { pins, routes, routeTeam, box: [cx - w / 2, cy - h / 2, w, h] }
}
