import type { CSSProperties } from 'react'
import { BASE, BAIRRO } from '@/data/geo'
import type { StatusTone } from '@/ui'
import type { MapTone, RealPin, RealRoute } from '@/ui/MapaReal'
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

export const PIN_TONE: Record<ServiceStatus, MapTone> = {
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

export interface RealMapModel {
  pins: RealPin[]
  /** rota de cada equipe: trecho feito (cheio) e trecho previsto (tracejado) */
  routes: RealRoute[]
}

/** Desloca em leque as paradas que dividem o mesmo bairro, para não empilharem no mapa */
function fan(used: Map<string, number>, bairroId: string) {
  const b = BAIRRO[bairroId]
  const n = used.get(bairroId) ?? 0
  used.set(bairroId, n + 1)
  if (!n) return { lat: b.lat, lng: b.lng }
  const ang = n * 2.4
  const r = 0.0022 + 0.0004 * n
  return { lat: b.lat + Math.sin(ang) * r, lng: b.lng + Math.cos(ang) * r }
}

/** Serviço que ainda pode ser reordenado pela otimização (não começou) */
const isPending = (s: ServiceView) => s.status === 'agendado' || s.status === 'atrasado'

/**
 * Pinos numerados por equipe (cor pelo status) e rotas saindo da base: cheia no que foi feito, tracejada no previsto.
 * `order` troca a sequência das paradas que ainda não começaram (prévia da otimização); a numeração dos pinos não muda.
 */
export function buildRealMap(services: ServiceView[], teams: Team[], order?: Map<string, string[]>, opts: { group?: (teamId: string) => string } = {}): RealMapModel {
  const pins: RealPin[] = []
  const routes: RealRoute[] = []
  const used = new Map<string, number>()
  const where = new Map<string, { lat: number; lng: number }>()
  const base = { lat: BASE.lat, lng: BASE.lng }
  const group = opts.group ?? ((id: string) => id)

  for (const t of teams) {
    const list = visibleOf(routeOf(services, t.id))
    list.forEach((s, i) => {
      if (!BAIRRO[s.bairroId]) return
      const at = fan(used, s.bairroId)
      where.set(s.id, at)
      pins.push({
        id: s.id,
        ...at,
        label: String(i + 1),
        title: `${t.name}, parada ${i + 1}, ${s.typeLabel} em ${s.bairroName}, ${s.clientName}`,
        tone: PIN_TONE[s.status],
        pulse: s.status === 'em_andamento' || s.status === 'a_caminho',
        group: t.id,
      })
    })
    let seq = list
    const ids = order?.get(t.id)
    if (ids) {
      const byId = new Map(list.map((s) => [s.id, s]))
      const keep = list.filter((s) => !isPending(s))
      seq = [...keep, ...ids.map((id) => byId.get(id)).filter((s): s is ServiceView => !!s)]
    }
    const path = [base, ...seq.map((s) => where.get(s.id)).filter((p): p is { lat: number; lng: number } => !!p)]
    if (path.length < 2) continue
    let lastDone = 0
    seq.forEach((s, i) => {
      if (where.has(s.id) && (s.status === 'concluido' || s.status === 'em_andamento' || s.status === 'a_caminho')) lastDone = i + 1
    })
    if (lastDone > 0)
      routes.push({
        id: `${t.id}-feito`,
        points: path.slice(0, lastDone + 1),
        group: group(t.id),
      })
    if (lastDone < path.length - 1)
      routes.push({
        id: `${t.id}-previsto`,
        points: path.slice(lastDone),
        dashed: true,
        group: group(t.id),
      })
  }
  return { pins, routes }
}
