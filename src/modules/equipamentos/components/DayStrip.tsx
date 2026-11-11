import { Tooltip, cn } from '@/ui'
import { formatDate } from '@/lib/format'
import type { UnitDay } from '@/services'

const STATE: Record<UnitDay['state'], { label: string; cls: string }> = {
  em_campo: { label: 'Alugado, em campo', cls: 'bg-accent text-on-accent' },
  reservado: { label: 'Reservado', cls: 'bg-accent/35 text-fg' },
  livre: { label: 'Livre', cls: 'bg-sunken text-fg-2' },
  indisponivel: { label: 'Manutenção ou limpeza', cls: 'bg-warn text-fg' },
}

/** 60 dias em células coloridas por situação; a locação aparece no tooltip. */
export function DayStrip({ days }: { days: UnitDay[] }) {
  return (
    <div>
      <ul className="m-0 grid list-none grid-cols-[repeat(10,1fr)] gap-1.5 p-0 @min-[700px]/frame:grid-cols-[repeat(20,1fr)] @min-[1180px]/frame:grid-cols-[repeat(30,1fr)]">
        {days.map((d) => {
          const s = STATE[d.state]
          const who = d.rentalCode ? ` · ${d.rentalCode}${d.clientName ? `, ${d.clientName}` : ''}` : ''
          const text = `${formatDate(d.date)}: ${s.label}${who}`
          return (
            <li key={d.date}>
              <Tooltip content={text}>
                <span
                  tabIndex={d.state === 'livre' ? undefined : 0}
                  role="img"
                  aria-label={text}
                  className={cn('tnum grid h-9 place-items-center rounded-tip text-caption focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', s.cls)}
                >
                  {Number(d.date.slice(8, 10))}
                </span>
              </Tooltip>
            </li>
          )
        })}
      </ul>
      <ul aria-hidden className="m-0 mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-caption text-fg-2">
        {(Object.keys(STATE) as UnitDay['state'][]).map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className={cn('size-3 rounded-tip', STATE[k].cls.split(' ')[0])} />
            {STATE[k].label}
          </li>
        ))}
      </ul>
    </div>
  )
}
