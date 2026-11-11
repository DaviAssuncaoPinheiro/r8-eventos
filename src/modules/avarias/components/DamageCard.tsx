import * as React from 'react'
import { Link2, MoreHorizontal, Receipt } from 'lucide-react'
import { Button, Menu, StatusDot, cn, type MenuEntry } from '@/ui'
import { CHARGE_STATUS, DAMAGE_STATUS } from '@/app/status'
import { formatMoney } from '@/lib/format'
import type { DamageView } from '@/services'

/** Cartão de avaria: foto 4:3, valor em destaque, código da unidade, tipo, cliente e situação. */
export function DamageCard({
  damage: d,
  busy,
  onCharge,
  onOpenPhoto,
  onOpenCharge,
  onDismiss,
  onOpenUnit,
  onOpenRental,
}: {
  damage: DamageView
  busy: boolean
  onCharge: () => void
  onOpenPhoto: (e: React.MouseEvent<HTMLButtonElement>) => void
  onOpenCharge: () => void
  onDismiss: () => void
  onOpenUnit: () => void
  onOpenRental: () => void
}) {
  const st = DAMAGE_STATUS[d.status]
  const photo = d.photos[0]?.src ?? d.typePhoto
  const sentCharge = d.charge && d.charge.status !== 'rascunho' && d.charge.status !== 'cancelada'
  const items: MenuEntry[] = [
    { label: 'Ver unidade', onSelect: onOpenUnit },
    { label: 'Ver locação', onSelect: onOpenRental },
    ...(d.charge ? [{ label: 'Ver cobrança', icon: Receipt, onSelect: onOpenCharge } as MenuEntry] : []),
    ...(d.status === 'registrada' || (d.status === 'cobrada' && !sentCharge) ? ([{ type: 'separator' }, { label: 'Dispensar', danger: true, onSelect: onDismiss }] as MenuEntry[]) : []),
  ]
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-card bg-raised">
      <div className="relative aspect-[4/3] bg-sunken">
        <button
          type="button"
          onClick={onOpenPhoto}
          aria-label={`Ampliar foto: ${d.kind}, ${d.unitCode}`}
          className="group absolute inset-0 block cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <img src={photo} alt="" loading="lazy" draggable={false} className="size-full object-cover transition-transform duration-250 ease-[var(--ease-ui)] group-hover:scale-[1.03]" />
        </button>
        <span className="tnum pointer-events-none absolute top-3 left-3 inline-flex h-7 items-center rounded-pill bg-raised px-3 text-caption font-bold text-fg">{d.unitCode}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-kpi">{formatMoney(d.value)}</p>
          <Menu
            align="end"
            items={items}
            trigger={<Button variant="ghost" size="sm" iconOnly icon={MoreHorizontal} aria-label={`Mais ações da avaria ${d.unitCode}`} className="-mt-1 -mr-2" />}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-body-lg font-semibold" title={d.kind}>
            {d.kind}
          </p>
          <p className="truncate text-body text-fg-2" title={d.clientName}>
            {d.clientName}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1">
          <StatusDot tone={st.tone}>{st.label}</StatusDot>
          {d.status === 'registrada' ? (
            <Button variant="primary" size="md" loading={busy} onClick={onCharge}>
              Cobrar
            </Button>
          ) : d.charge ? (
            <Button variant="secondary" size="md" icon={Link2} onClick={onOpenCharge} aria-label={`Ver cobrança ${d.charge.code}`}>
              <span className={cn(d.charge.status === 'atrasada' && 'text-danger-ink')}>{d.charge.code}</span>
              <span className="sr-only">{CHARGE_STATUS[d.charge.status].label}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}
