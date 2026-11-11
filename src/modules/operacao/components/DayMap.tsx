import * as React from 'react'
import { AVENIDAS } from '@/data/geo'
import { MapaDF, cn } from '@/ui'
import type { ServiceView, Team } from '@/services'
import { buildMap } from './helpers'

const LEGEND = [
  { label: 'Concluído', cls: 'bg-ok' },
  { label: 'Em andamento', cls: 'bg-accent' },
  { label: 'A caminho', cls: 'bg-info' },
  { label: 'Atrasado', cls: 'bg-danger' },
  { label: 'Agendado', cls: 'bg-inverse' },
]

export interface DayMapProps {
  services: ServiceView[]
  teams: Team[]
  /** equipe destacada: só as paradas e a rota dela ficam fortes */
  selectedTeamId?: string
  onSelectTeam: (teamId: string) => void
  className?: string
}

/** Mapa do dia: paradas numeradas por equipe, cor pelo status, rota cheia no feito e tracejada no previsto */
export function DayMap({ services, teams, selectedTeamId, onSelectTeam, className }: DayMapProps) {
  const wrap = React.useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = React.useState(1.9)
  React.useEffect(() => {
    const el = wrap.current
    if (!el) return
    const on = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) setAspect(Math.round((r.width / r.height) * 20) / 20)
    }
    on()
    const ro = new ResizeObserver(on)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const model = React.useMemo(() => buildMap(services, teams, aspect), [services, teams, aspect])
  const byId = React.useMemo(() => new Map(services.map((s) => [s.id, s])), [services])
  const team = teams.find((t) => t.id === selectedTeamId)

  // MapaDF esmaece tudo que não é o `selectedId`; aqui devolvemos a força às paradas e rotas da equipe escolhida
  const css = React.useMemo(() => {
    if (!team) return ''
    const name = team.name.replace(/["\\]/g, '')
    const rules = [`.mapa-op g.ds-pin[aria-label^="${name},"]{opacity:1}`]
    const first = 2 + AVENIDAS.length
    model.routeTeam.forEach((id, i) => {
      if (id === team.id) rules.push(`.mapa-op svg > path:nth-of-type(${first + i + 1}){opacity:1}`)
    })
    return rules.join('')
  }, [team, model.routeTeam])

  return (
    <>
      <div ref={wrap} className={cn('mapa-op relative overflow-hidden rounded-[16px]', className)}>
        {css ? <style>{css}</style> : null}
        <MapaDF
          pins={model.pins}
          routes={model.routes}
          box={model.box}
          labels={false}
          selectedId={team ? '__equipe__' : undefined}
          onSelect={(id) => {
            const s = byId.get(id)
            if (s) onSelectTeam(s.teamId)
          }}
          label={team ? `Mapa do dia com as paradas da ${team.name} em destaque` : 'Mapa do dia com as paradas das equipes'}
          className="absolute inset-0"
        />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-3 pt-3 pb-1.5 text-caption font-semibold text-fg-2">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 rounded-pill', l.cls)} />
            {l.label}
          </li>
        ))}
      </ul>
    </>
  )
}
