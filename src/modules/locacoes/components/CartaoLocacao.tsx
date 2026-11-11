import { Money, Badge } from '@/ui'
import type { EquipmentType, RentalListItem } from '@/services'
import { cleanTitle, mainTypeId, periodTag } from '../util'

/** Cartão da locação no quadro: foto do equipamento mais característico, título, cliente, período e valor. */
export function CartaoLocacao({ rental, types, onOpen }: { rental: RentalListItem; types: Map<string, EquipmentType>; onOpen: () => void }) {
  const main = types.get(mainTypeId(rental.items) ?? '')
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir ${rental.code}, ${cleanTitle(rental.title)}`}
        className="flex w-full flex-col gap-3 rounded-card bg-raised p-4 text-left transition-[background-color,transform] duration-150 ease-[var(--ease-ui)] hover:bg-hover active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-center gap-3">
          <span className="size-14 shrink-0 overflow-hidden rounded-control bg-sunken">
            {main ? <img src={main.photo} alt="" loading="lazy" draggable={false} className="size-full object-cover" /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold text-fg">{cleanTitle(rental.title)}</span>
            <span className="block truncate text-body text-fg-2">{rental.clientName}</span>
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Badge className="tnum">{periodTag(rental.start, rental.end)}</Badge>
          <Money value={rental.total} className="text-body-lg font-semibold text-fg" />
        </span>
      </button>
    </li>
  )
}
