import * as React from 'react'
import * as RD from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { Boxes, ClipboardList, Search, Users, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { search, type SearchResult } from '@/services'
import { NAV_ITEMS } from './nav'

const group = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-3'
const item =
  'flex h-11 cursor-pointer items-center gap-3 rounded-control px-3 text-body text-fg outline-none select-none data-[selected=true]:bg-hover'

function Row({ icon: Icon, title, hint, onSelect, value }: { icon: LucideIcon; title: string; hint?: string; onSelect: () => void; value: string }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className={item}>
      <Icon size={18} strokeWidth={2} aria-hidden className="shrink-0 text-fg-3" />
      <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
      {hint ? <span className="shrink-0 text-caption text-fg-3">{hint}</span> : null}
    </Command.Item>
  )
}

/** Busca global (Ctrl K): clientes, locações, equipamentos e atalhos para as telas. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const [q, setQ] = React.useState('')
  const [res, setRes] = React.useState<SearchResult | null>(null)

  React.useEffect(() => {
    if (!open) setQ('')
  }, [open])
  React.useEffect(() => {
    if (!q.trim()) {
      setRes(null)
      return
    }
    let alive = true
    const t = window.setTimeout(() => {
      search(q).then((r) => alive && setRes(r), () => alive && setRes(null))
    }, 120)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [q])

  const go = (to: string) => () => {
    onOpenChange(false)
    navigate(to)
  }
  const empty = res && !res.clients.length && !res.rentals.length && !res.units.length

  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-[70] bg-scrim data-[state=open]:animate-[ds-fade-in_200ms_var(--ease-ui)]" />
        <RD.Content
          aria-describedby={undefined}
          className="ds-root fixed top-[12vh] left-1/2 z-[71] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-card bg-overlay text-fg shadow-overlay outline-none data-[state=open]:animate-[ds-menu-in_200ms_var(--ease-ui)]"
        >
          <RD.Title className="sr-only">Buscar</RD.Title>
          <Command shouldFilter={false} label="Buscar">
            <div className="flex h-14 items-center gap-3 border-b border-hairline px-5">
              <Search size={20} strokeWidth={2} aria-hidden className="shrink-0 text-fg-3" />
              <Command.Input value={q} onValueChange={setQ} placeholder="Cliente, locação ou código do equipamento" className="h-full min-w-0 flex-1 bg-transparent text-body-lg outline-none placeholder:text-fg-3" />
            </div>
            <Command.List className="max-h-[52vh] overflow-y-auto p-2">
              {empty ? <p className="px-3 py-8 text-center text-body text-fg-2">Nada encontrado para "{q}"</p> : null}
              {res?.clients.length ? (
                <Command.Group heading="Clientes" className={group}>
                  {res.clients.map((c) => (
                    <Row key={c.id} value={`c-${c.id}`} icon={Users} title={c.name} hint={c.kind} onSelect={go(`/clientes/${c.id}`)} />
                  ))}
                </Command.Group>
              ) : null}
              {res?.rentals.length ? (
                <Command.Group heading="Locações" className={group}>
                  {res.rentals.map((r) => (
                    <Row key={r.id} value={`r-${r.id}`} icon={ClipboardList} title={r.title} hint={r.code} onSelect={go(`/locacoes/${r.id}`)} />
                  ))}
                </Command.Group>
              ) : null}
              {res?.units.length ? (
                <Command.Group heading="Equipamentos" className={group}>
                  {res.units.map((u) => (
                    <Row key={u.id} value={`u-${u.id}`} icon={Boxes} title={`${u.code} · ${u.typeName}`} hint={u.rentalCode} onSelect={go(`/equipamentos/${u.code}`)} />
                  ))}
                </Command.Group>
              ) : null}
              {!q.trim() ? (
                <Command.Group heading="Ir para" className={group}>
                  {NAV_ITEMS.map((n) => (
                    <Row key={n.to} value={`n-${n.to}`} icon={n.icon} title={n.label} onSelect={go(n.to)} />
                  ))}
                </Command.Group>
              ) : null}
            </Command.List>
          </Command>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}
