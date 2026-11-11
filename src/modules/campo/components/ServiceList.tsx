import { useNavigate } from 'react-router-dom'
import type { ServiceView } from '@/services'
import { ServiceRow } from '@/ui/ServiceRow'
import { fmtDuration, fmtTime, ROW_STATUS, useServiceTitle } from '../lib'

/** Lista de serviços em cartão, com a linha do app da equipe de rua (80 px, texto 16). */
export function ServiceList({ services, label }: { services: ServiceView[]; label: string }) {
  const navigate = useNavigate()
  const title = useServiceTitle()
  return (
    <ul aria-label={label} className="overflow-hidden rounded-card bg-raised">
      {services.map((s) => (
        <ServiceRow
          key={s.id}
          variant="field"
          time={fmtTime(s.start)}
          duration={fmtDuration(s.durationMin)}
          type={s.type}
          title={title(s)}
          client={s.clientName}
          address={s.address}
          status={ROW_STATUS[s.status]}
          badges={s.extra ? [{ label: 'Extra', tone: 'warn' }] : undefined}
          onOpen={() => navigate(`/campo/servico/${s.id}`)}
        />
      ))}
    </ul>
  )
}

export function ListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <span aria-hidden className="ds-skeleton block h-48 w-full rounded-card" />
      <span aria-hidden className="ds-skeleton block h-24 w-full rounded-card" />
      <span aria-hidden className="ds-skeleton block h-60 w-full rounded-card" />
    </div>
  )
}
