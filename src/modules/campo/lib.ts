import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { demoNow, today } from '@/domain/dates'
import { formatTime } from '@/lib/format'
import { listServices, listTeams, listUnits, useLabels, useQuery, type ServiceView, type UnitView } from '@/services'
import type { ServiceStatus as DomainStatus } from '@/services'
import type { ServiceStatus as RowStatus } from '@/ui/ServiceRow'
import { useCampo } from './store'

export const EXAMPLE_PHOTOS = ['/produtos/banheiro-quimico.jpg', '/produtos/tenda.jpg', '/produtos/trailer.jpg', '/produtos/balcao.jpg', '/produtos/fechamento.jpg', '/produtos/alambrado.jpg']

export const ROW_STATUS: Record<DomainStatus, RowStatus> = {
  agendado: 'agendado',
  a_caminho: 'a-caminho',
  em_andamento: 'em-andamento',
  atrasado: 'atrasado',
  concluido: 'concluido',
  cancelado: 'agendado',
}

export const newId = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

export function fmtTime(iso: string) {
  return formatTime(iso)
}

export function mapsUrl(s: Pick<ServiceView, 'address' | 'bairroName'>): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.address}, ${s.bairroName}, Brasília, DF`)}`
}

export function greeting(): string {
  const h = demoNow().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

/** Título curto de linha: "Limpeza, 12 unidades". */
export function useServiceTitle() {
  const l = useLabels()
  return (s: Pick<ServiceView, 'typeLabel' | 'unitIds'>) => `${s.typeLabel}, ${s.unitIds.length} ${s.unitIds.length === 1 ? l.unit : l.unitPlural}`
}

/** Volta uma tela; sem histórico, vai para o destino de reserva. */
export function useBack(fallback: string) {
  const navigate = useNavigate()
  return React.useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}

/**
 * Dia da equipe ativa. Serviços já concluídos na fila sem sinal aparecem como concluídos.
 * A equipe ativa padrão é a primeira com serviço em andamento hoje.
 */
export function useCampoDay() {
  const day = today()
  const teams = useQuery(listTeams, [])
  const all = useQuery(() => listServices({ date: day }), [day])
  const teamId = useCampo((s) => s.teamId)
  const queue = useCampo((s) => s.queue)
  const setTeam = useCampo((s) => s.setTeam)

  const team = React.useMemo(() => {
    const list = teams.data ?? []
    if (!list.length) return undefined
    const chosen = teamId ? list.find((t) => t.id === teamId) : undefined
    if (chosen) return chosen
    const running = (all.data ?? []).find((s) => s.status === 'em_andamento' && list.some((t) => t.id === s.teamId))
    return list.find((t) => t.id === running?.teamId) ?? list[0]
  }, [teams.data, all.data, teamId])

  const localDone = React.useMemo(() => new Set(queue.filter((q) => q.kind === 'complete').map((q) => (q as { serviceId: string }).serviceId)), [queue])

  const services = React.useMemo(
    () =>
      (all.data ?? [])
        .filter((s) => s.teamId === team?.id && s.status !== 'cancelado')
        .map((s) => (localDone.has(s.id) ? { ...s, status: 'concluido' as const } : s))
        .sort((a, b) => a.start.localeCompare(b.start) || a.order - b.order),
    [all.data, team?.id, localDone],
  )

  const open = services.filter((s) => s.status !== 'concluido')
  const done = services.filter((s) => s.status === 'concluido')
  /** em andamento e a caminho primeiro; depois a ordem da rota */
  const next = open.find((s) => s.status === 'em_andamento') ?? open.find((s) => s.status === 'a_caminho') ?? open[0]

  return {
    teams: teams.data ?? [],
    team,
    setTeam,
    services,
    open,
    done,
    next,
    loading: teams.initialLoading || all.initialLoading,
    error: teams.error ?? all.error,
    refetch: async () => {
      await Promise.all([teams.refetch(), all.refetch()])
    },
  }
}

/** Todas as unidades, para achar por código na hora (sem esperar a rede a cada letra). */
export function useUnits() {
  const q = useQuery(() => listUnits({}), [])
  const list = q.data ?? []
  const find = React.useCallback(
    (raw: string): UnitView | undefined => {
      const c = raw.trim().toUpperCase().replace(/\s+/g, '')
      if (!c) return undefined
      const exact = list.find((u) => u.code.toUpperCase() === c || u.id.toUpperCase() === c)
      if (exact) return exact
      const withDash = c.replace(/^([A-Z]+)-?(\d+)$/, (_m, p: string, n: string) => `${p}-${n.padStart(4, '0')}`)
      return list.find((u) => u.code.toUpperCase() === withDash)
    },
    [list],
  )
  return { ...q, units: list, find }
}

/** Valor sugerido para a avaria: fração da mensalidade de tabela do equipamento, pelo tipo de dano. */
export function suggestDamageValue(kind: string, kinds: string[], monthlyRate: number): number {
  const i = Math.max(0, kinds.indexOf(kind))
  const pct = [0.35, 0.22, 0.4, 0.55, 0.3, 0.18, 0.26, 0.32, 0.28, 0.9][i % 10]
  return Math.max(60, Math.round(monthlyRate * pct))
}
