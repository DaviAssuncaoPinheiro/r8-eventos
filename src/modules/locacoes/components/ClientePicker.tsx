import * as React from 'react'
import { Building2, Search, X } from 'lucide-react'
import { Button, cn, Input } from '@/ui'
import type { ClientView } from '@/services'

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Campo de cliente com busca: digita, escolhe na lista; depois de escolhido mostra o cliente com "Trocar". */
export function ClientePicker({ clients, value, onChange, invalid, inputId }: { clients: ClientView[]; value: string; onChange: (id: string) => void; invalid?: boolean; inputId: string }) {
  const [q, setQ] = React.useState('')
  const [active, setActive] = React.useState(0)
  const selected = clients.find((c) => c.id === value)
  const results = React.useMemo(() => {
    const nq = norm(q.trim())
    return clients.filter((c) => !nq || norm(`${c.name} ${c.kind}`).includes(nq)).slice(0, 6)
  }, [clients, q])
  React.useEffect(() => setActive(0), [q])

  if (selected) {
    return (
      <div className="flex min-h-11 items-center gap-3 rounded-control bg-sunken px-3 py-2">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent-ink">
          <Building2 size={16} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span id={inputId} className="block truncate text-body font-semibold">
            {selected.name}
          </span>
          <span className="block truncate text-caption text-fg-3">{selected.kind}</span>
        </span>
        <Button size="sm" variant="ghost" icon={X} onClick={() => (onChange(''), setQ(''))}>
          Trocar
        </Button>
      </div>
    )
  }

  const pick = (c: ClientView) => {
    onChange(c.id)
    setQ('')
  }
  return (
    <div>
      <Input
        id={inputId}
        role="combobox"
        aria-expanded="true"
        aria-controls={`${inputId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={results[active] ? `${inputId}-o${active}` : undefined}
        autoComplete="off"
        placeholder="Buscar cliente pelo nome"
        prefix={<Search size={16} strokeWidth={2} aria-hidden />}
        value={q}
        invalid={invalid}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(results.length - 1, a + 1)))
          else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)))
          else if (e.key === 'Enter' && results[active]) (e.preventDefault(), pick(results[active]))
        }}
      />
      <ul id={`${inputId}-list`} role="listbox" aria-label="Clientes" className="mt-2 flex flex-col gap-0.5 rounded-control bg-sunken p-1">
        {results.length === 0 ? <li className="px-3 py-3 text-body text-fg-3">Nenhum cliente com esse nome</li> : null}
        {results.map((c, i) => (
          <li key={c.id} id={`${inputId}-o${i}`} role="option" aria-selected={i === active}>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => pick(c)}
              onMouseEnter={() => setActive(i)}
              className={cn('ds-touch flex w-full items-center justify-between gap-3 rounded-tip px-3 py-2 text-left transition-colors duration-150', i === active ? 'bg-raised' : 'hover:bg-raised')}
            >
              <span className="min-w-0 truncate text-body font-semibold">{c.name}</span>
              <span className="shrink-0 text-caption text-fg-3">{c.kind}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
