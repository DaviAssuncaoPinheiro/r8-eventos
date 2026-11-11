import { Link } from 'react-router-dom'
import { cn, StatusDot } from '@/ui'
import { UNIT_STATUS } from '@/app/status'
import type { UnitView } from '@/services'
import { TypeThumb } from './TypeThumb'

export const IDLE_LIMIT = 30

/** Cartão compacto da unidade: código, miniatura, situação e uma única informação conforme a situação. */
export function UnitCard({ unit }: { unit: UnitView }) {
  const st = UNIT_STATUS[unit.status]
  const idleLong = unit.status === 'disponivel' && (unit.idleDays ?? 0) > IDLE_LIMIT
  return (
    <Link
      to={`/equipamentos/${unit.code}`}
      className={cn(
        'group flex h-full min-h-[88px] min-w-0 items-center gap-3 rounded-card bg-raised p-3 transition-[transform,background-color] duration-200 ease-[var(--ease-ui)]',
        'hover:-translate-y-0.5 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <TypeThumb src={unit.type.photo} alt={unit.type.name} className="size-14 rounded-control" />
      <span className="min-w-0 flex-1">
        <span className="tnum block truncate text-title-card">{unit.code}</span>
        <StatusDot tone={st.tone} className="mt-0.5 text-caption">
          {st.label}
        </StatusDot>
        {unit.status === 'em_campo' && unit.rental ? (
          <span className="mt-1 block truncate text-body text-fg-2" title={`${unit.rental.code} · ${unit.rental.title}`}>
            {unit.rental.clientName}
          </span>
        ) : null}
        {idleLong ? <span className="mt-1 block truncate text-body font-semibold text-danger-ink">parado há {unit.idleDays} dias</span> : null}
      </span>
    </Link>
  )
}
