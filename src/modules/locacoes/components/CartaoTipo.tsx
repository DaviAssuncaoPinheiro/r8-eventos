import { AlertTriangle, Minus, Plus } from 'lucide-react'
import { Button, Money, cn } from '@/ui'
import type { AvailabilityResult, EquipmentType } from '@/services'
import { TypeArtTile } from '@/modules/equipamentos/components/TypeArt'

/** Cartão de tipo de equipamento do passo "Itens": foto, preço, quantidade e aviso de disponibilidade. */
export function CartaoTipo({ type, rate, per, qty, avail, checking, onQty }: { type: EquipmentType; rate: number; per: string; qty: number; avail?: AvailabilityResult; checking: boolean; onQty: (n: number) => void }) {
  const short = qty > 0 && avail && avail.free < qty
  const free = avail?.free ?? 0
  return (
    <li className={cn('flex flex-col gap-3 rounded-card p-4 transition-[background-color,box-shadow] duration-150 ease-[var(--ease-ui)]', short ? 'bg-danger-soft ring-2 ring-danger ring-inset' : qty > 0 ? 'bg-accent-soft' : 'bg-sunken')}>
      <div className="flex items-center gap-3">
        <TypeArtTile typeId={type.id} prefix={type.prefix} className="size-16 rounded-control" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold">{type.name}</p>
          <p className="text-body text-fg-2">
            <Money value={rate} /> <span className="text-fg-3">por {per}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div role="group" aria-label={`Quantidade de ${type.short}`} className="inline-flex items-center gap-1 rounded-pill bg-raised p-1">
          <Button variant="ghost" size="sm" iconOnly icon={Minus} aria-label={`Diminuir ${type.short}`} disabled={qty === 0} onClick={() => onQty(Math.max(0, qty - 1))} />
          <input
            aria-label={`Quantidade de ${type.short}`}
            inputMode="numeric"
            value={qty}
            onChange={(e) => onQty(Math.max(0, Math.min(999, Number(e.target.value.replace(/\D/g, '')) || 0)))}
            className="tnum h-9 w-12 rounded-control bg-transparent text-center text-body-lg font-semibold outline-none focus-visible:outline-2 focus-visible:outline-ring"
          />
          <Button variant="ghost" size="sm" iconOnly icon={Plus} aria-label={`Aumentar ${type.short}`} onClick={() => onQty(qty + 1)} />
        </div>
        {!short ? (
          <span className={cn('text-caption font-semibold', checking ? 'text-fg-3' : 'text-fg-2')} aria-live="polite">
            {avail ? `${free} ${free === 1 ? 'livre' : 'livres'}` : 'Conferindo'}
          </span>
        ) : null}
      </div>
      {short ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-body font-semibold text-danger-ink">
            <AlertTriangle size={16} strokeWidth={2} aria-hidden />
            {free === 0 ? 'Nenhum livre neste período' : `Só ${free} ${free === 1 ? 'livre' : 'livres'} neste período`}
          </p>
          <Button size="sm" variant="secondary" onClick={() => onQty(free)}>
            {free === 0 ? 'Zerar' : `Usar ${free}`}
          </Button>
        </div>
      ) : null}
    </li>
  )
}
