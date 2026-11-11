import * as React from 'react'
import { cn } from '@/ui'
import type { ServiceView, Team } from '@/services'
import { TeamAvatar } from './TeamAvatar'
import { ServiceCard } from './ServiceCard'
import { visibleOf } from './helpers'

export interface TeamColumnProps {
  team: Team
  teams: Team[]
  /** todos os serviços da equipe no dia, na ordem da rota (inclui cancelados, que não aparecem) */
  route: ServiceView[]
  selected: boolean
  dragId: string | null
  /** onde o cartão arrastado vai cair */
  dropIndex: number | null
  className?: string
  /**
   * lane: faixa horizontal com a equipe à esquerda e os serviços em fila (escritório)
   * list: só a lista vertical de serviços (celular, onde as pílulas já mostram a equipe)
   */
  layout?: 'lane' | 'list'
  onSelect: (teamId: string) => void
  onOpen: (id: string) => void
  onMoveTo: (id: string, teamId: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOver: (teamId: string, index: number) => void
  onDragLeave: (teamId: string) => void
  onDrop: (teamId: string, index: number) => void
}

/** Agenda de uma equipe: quem é, quanto do dia já foi e os serviços em ordem de rota */
export function TeamColumn({
  team,
  teams,
  route,
  selected,
  dragId,
  dropIndex,
  className,
  layout = 'lane',
  onSelect,
  onOpen,
  onMoveTo,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: TeamColumnProps) {
  const list = visibleOf(route)
  const done = list.filter((s) => s.status === 'concluido').length
  const ref = React.useRef<HTMLUListElement>(null)
  const over = dropIndex !== null
  const lane = layout === 'lane'

  /** posição de soltura: quantos cartões (sem o arrastado) ficam antes do ponteiro */
  const indexAt = (x: number, y: number) => {
    const els = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-card-id]') ?? []).filter((el) => el.dataset.cardId !== dragId)
    let i = 0
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (lane ? x > r.left + r.width / 2 : y > r.top + r.height / 2) i++
    }
    return i
  }

  const slot = <li key="slot" aria-hidden className={cn('shrink-0 rounded-pill bg-accent', lane ? 'w-1.5 self-stretch' : 'h-1.5')} />
  const rows: React.ReactNode[] = []
  let k = 0
  for (const s of list) {
    // o cartão arrastado fica na posição de origem, apagado, até soltar
    const isDragged = s.id === dragId
    if (!isDragged) {
      if (over && dropIndex === k) rows.push(slot)
      k++
    }
    rows.push(
      <ServiceCard
        key={s.id}
        service={s}
        teams={teams}
        dragging={isDragged}
        className={lane ? 'w-[248px] shrink-0' : undefined}
        onOpen={onOpen}
        onMoveTo={onMoveTo}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />,
    )
  }
  if (over && dropIndex >= k) rows.push(slot)

  return (
    <section
      aria-label={team.name}
      data-team-id={team.id}
      onClick={() => onSelect(team.id)}
      onDragOver={(e) => {
        if (!dragId) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        const i = indexAt(e.clientX, e.clientY)
        if (dropIndex !== i) onDragOver(team.id, i)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onDragLeave(team.id)
      }}
      onDrop={(e) => {
        if (!dragId) return
        e.preventDefault()
        onDrop(team.id, indexAt(e.clientX, e.clientY))
      }}
      className={cn(
        'min-w-0 rounded-card bg-raised p-3 transition-[box-shadow,background-color] duration-150 ease-[var(--ease-ui)]',
        lane ? 'flex items-stretch gap-3' : 'flex flex-col',
        selected && !over && 'ring-2 ring-accent ring-inset',
        over && 'bg-accent-soft ring-2 ring-accent ring-inset',
        className,
      )}
    >
      {lane ? (
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${team.name}, ${done} de ${list.length} concluídos. Destacar no mapa`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(team.id)
          }}
          className="flex w-[190px] shrink-0 flex-col justify-between gap-3 rounded-control p-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex items-center gap-3">
            <TeamAvatar team={team} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-title-card">{team.name}</span>
              <span className="mt-0.5 inline-flex rounded-tip bg-sunken px-1.5 text-caption font-semibold text-fg-2 tnum">{team.plate}</span>
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className="tnum text-kpi leading-none">
              {done}
              <span className="text-title-sub text-fg-3">/{list.length}</span>
            </span>
            <span aria-hidden className="flex min-w-0 flex-1 gap-1">
              {list.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    'h-2 min-w-0 flex-1 rounded-pill',
                    s.status === 'concluido' && 'bg-accent',
                    (s.status === 'em_andamento' || s.status === 'a_caminho') && 'bg-accent-soft ring-1 ring-accent ring-inset',
                    s.status === 'atrasado' && 'bg-danger',
                    s.status === 'agendado' && 'ds-hatch bg-sunken',
                  )}
                />
              ))}
            </span>
          </span>
        </button>
      ) : null}
      <ul ref={ref} className={cn('m-0 min-w-0 flex-1 list-none gap-2 p-0', lane ? 'flex items-stretch overflow-x-auto' : 'flex min-h-[72px] flex-col')}>
        {rows}
        {list.length === 0 && !over ? <li aria-hidden className="ds-hatch min-h-[72px] flex-1 rounded-control bg-sunken" /> : null}
      </ul>
    </section>
  )
}
