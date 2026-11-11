import * as React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Badge, Menu, Money, cn, type MenuEntry } from '@/ui'
import { TypeArtTile } from '@/modules/equipamentos/components/TypeArt'
import type { EquipmentType, RentalListItem } from '@/services'
import { cleanTitle, mainTypeId, periodTag } from '../util'

/** Cartão da locação no quadro: ilustração do equipamento mais característico, título, cliente, período e valor. Arrasta para a etapa seguinte; o menu faz o mesmo por teclado. */
export function CartaoLocacao({
  rental,
  types,
  onOpen,
  menu,
  drag,
}: {
  rental: RentalListItem
  types: Map<string, EquipmentType>
  onOpen: () => void
  menu?: MenuEntry[]
  /** Arrastar com o mouse. Sem isto o cartão só abre. */
  drag?: { onStart: () => void; onMove: (x: number, y: number) => void; onEnd: (x: number, y: number, moved: boolean) => void }
}) {
  const main = types.get(mainTypeId(rental.items) ?? '')
  const canDrag = !!drag
  const st = React.useRef<{ x0: number; y0: number; active: boolean; sc: Element | null; sl0: number } | null>(null)
  const swallow = React.useRef(false)
  const [off, setOff] = React.useState<{ x: number; y: number } | null>(null)
  const down = (e: React.PointerEvent) => {
    if (!drag || e.button !== 0 || e.pointerType === 'touch') return
    const sc = (e.currentTarget as HTMLElement).closest('[data-board]')
    st.current = { x0: e.clientX, y0: e.clientY, active: false, sc, sl0: sc?.scrollLeft ?? 0 }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    const s = st.current
    if (!s || !drag) return
    const dx = e.clientX - s.x0 + ((s.sc?.scrollLeft ?? 0) - s.sl0)
    const dy = e.clientY - s.y0
    if (!s.active && Math.hypot(dx, dy) > 6) {
      s.active = true
      drag.onStart()
    }
    if (s.active) {
      setOff({ x: dx, y: dy })
      drag.onMove(e.clientX, e.clientY)
    }
  }
  const up = (e: React.PointerEvent, cancelled = false) => {
    const s = st.current
    st.current = null
    if (!s || !drag) return
    if (s.active) {
      swallow.current = true
      setOff(null)
      drag.onEnd(e.clientX, e.clientY, !cancelled)
    }
  }
  return (
    <li
      className={cn('group/card relative touch-pan-y transition-[opacity] duration-150', off && 'z-50 cursor-grabbing')}
      style={off ? { transform: `translate(${off.x}px, ${off.y}px) rotate(1.5deg) scale(1.02)`, transition: 'none', filter: 'drop-shadow(0 12px 24px color-mix(in oklab, var(--fg) 22%, transparent))' } : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={(e) => up(e, true)}
      onClickCapture={(e) => {
        if (swallow.current) {
          swallow.current = false
          e.stopPropagation()
          e.preventDefault()
        }
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir ${rental.code}, ${cleanTitle(rental.title)}`}
        className={cn(
          'flex w-full flex-col gap-3 rounded-card bg-raised p-3.5 text-left @min-[240px]/col:p-4 transition-[background-color,transform] duration-150 ease-[var(--ease-ui)] hover:bg-hover active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          canDrag && 'cursor-grab',
        )}
      >
        <span className="flex items-center gap-3 pr-8">
          <TypeArtTile typeId={main?.id} prefix={main?.prefix} className="size-12 rounded-control @min-[240px]/col:size-14" />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-body font-semibold break-words text-fg">{cleanTitle(rental.title)}</span>
            <span className="block truncate text-body text-fg-2">{rental.clientName}</span>
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Badge className="tnum">{periodTag(rental.start, rental.end)}</Badge>
          <Money value={rental.total} className="text-body-lg font-semibold text-fg" />
        </span>
      </button>
      {menu ? (
        <div className="absolute top-2 right-2" onPointerDown={(e) => e.stopPropagation()}>
          <Menu
            align="end"
            items={menu}
            trigger={
              <button
                type="button"
                aria-label={`Ações de ${rental.code}`}
                className="ds-touch ds-touch-sq grid size-9 place-items-center rounded-pill text-fg-3 transition-colors duration-150 hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <MoreHorizontal size={18} strokeWidth={2} aria-hidden />
              </button>
            }
          />
        </div>
      ) : null}
    </li>
  )
}
