import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SearchX, X } from 'lucide-react'
import { RentalCards, RentalTable, type Sort, type SortKey } from '@/components/rental/RentalViews'
import { STATUS_RANK, useRentalRows, type RentalRow } from '@/components/rental/model'
import { Button, Chip, Empty, Segmented } from '@/components/ui'
import { ZONES, type ZoneId } from '@/data/geo'
import { NOW, type RentalStatus } from '@/data/mock'
import { RENTAL_STATUS } from '@/lib/status'
import { brl } from '@/lib/utils'

type Kind = 'todas' | 'obra' | 'evento'
type Sit = 'todas' | RentalStatus

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const nextTime = (r: RentalRow) => (r.next ? +new Date(r.next.start) : Number.MAX_SAFE_INTEGER)

const cmp: Record<SortKey, (a: RentalRow, b: RentalRow) => number> = {
  local: (a, b) => a.rental.title.localeCompare(b.rental.title, 'pt-BR'),
  cliente: (a, b) => a.client.name.localeCompare(b.client.name, 'pt-BR') || a.bairroName.localeCompare(b.bairroName, 'pt-BR'),
  regiao: (a, b) => a.bairroName.localeCompare(b.bairroName, 'pt-BR'),
  periodo: (a, b) => +new Date(a.rental.start) - +new Date(b.rental.start),
  proximo: (a, b) => nextTime(a) - nextTime(b),
  valor: (a, b) => b.rental.value - a.rental.value,
  situacao: (a, b) => STATUS_RANK[a.rental.status] - STATUS_RANK[b.rental.status] || b.openOcc - a.openOcc,
}

const SITS: Sit[] = ['todas', 'ativa', 'montagem', 'retirada', 'encerrada']

export default function Locacoes() {
  const nav = useNavigate()
  const rows = useRentalRows()

  const [q, setQ] = React.useState('')
  const [kind, setKind] = React.useState<Kind>('todas')
  const [sit, setSit] = React.useState<Sit>('todas')
  const [zone, setZone] = React.useState<ZoneId | 'todas'>('todas')
  const [sort, setSort] = React.useState<Sort>({ key: 'situacao', dir: 1 })

  const filtered = React.useMemo(() => {
    const t = norm(q.trim())
    const out = rows.filter(
      (r) =>
        (kind === 'todas' || r.rental.kind === kind) &&
        (sit === 'todas' || r.rental.status === sit) &&
        (zone === 'todas' || r.zone === zone) &&
        (!t || norm(`${r.rental.title} ${r.client.name} ${r.bairroName} ${r.rental.code} ${r.rental.address} ${r.rental.contact.name}`).includes(t)),
    )
    return out.sort((a, b) => cmp[sort.key](a, b) * sort.dir || nextTime(a) - nextTime(b) || a.rental.title.localeCompare(b.rental.title, 'pt-BR'))
  }, [rows, q, kind, sit, zone, sort])

  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }))

  const count = (s: Sit) => rows.filter((r) => (kind === 'todas' || r.rental.kind === kind) && (s === 'todas' || r.rental.status === s)).length
  const filtering = q || kind !== 'todas' || sit !== 'todas' || zone !== 'todas'
  const clear = () => {
    setQ('')
    setKind('todas')
    setSit('todas')
    setZone('todas')
  }

  const active = rows.filter((r) => r.rental.status !== 'encerrada')
  const monthly = active.filter((r) => r.rental.kind === 'obra').reduce((a, r) => a + r.rental.value, 0)
  const events = active.filter((r) => r.rental.kind === 'evento' && +new Date(r.rental.end) >= +NOW - 86400000).length
  const attention = active.filter((r) => r.openOcc || r.alert).length

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 md:pb-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">Locações</h1>
        <span className="num inline-flex h-8 items-center rounded-full bg-card px-3 text-[13px] font-bold text-ink-2 shadow-pill">{rows.length}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="primary" onClick={() => nav('/agenda?novo=1')}>
            <Plus className="size-4" strokeWidth={2.2} /> Novo serviço
          </Button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search size={19} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por local, cliente, região ou código"
            className="h-14 w-full rounded-full bg-card pr-12 pl-12 text-[15px] font-medium text-ink shadow-pill outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-black"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Limpar busca" className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-ink-2 hover:bg-muted-2">
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<Kind>
            value={kind}
            onChange={setKind}
            size="md"
            options={[
              { value: 'todas', label: 'Todas' },
              { value: 'obra', label: 'Obras' },
              { value: 'evento', label: 'Eventos' },
            ]}
          />
          <div className="no-scrollbar -mx-4 flex min-w-0 items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
            {SITS.filter((k) => k === 'todas' || count(k) > 0 || sit === k).map((k) => (
              <Chip key={k} active={sit === k} onClick={() => setSit(k)} className="shrink-0">
                {k === 'todas' ? 'Todas as situações' : RENTAL_STATUS[k].label}
                {k !== 'todas' && <span className="num ml-1.5 opacity-70">{count(k)}</span>}
              </Chip>
            ))}
          </div>
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={zone === 'todas'} onClick={() => setZone('todas')} className="shrink-0">
            Todas as regiões
          </Chip>
          {ZONES.map((z) => (
            <Chip key={z.id} active={zone === z.id} onClick={() => setZone(zone === z.id ? 'todas' : z.id)} color={z.hex} className="shrink-0">
              {z.short}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between px-1 text-[12.5px] font-medium text-ink-3">
        <span className="num">{filtering ? `${filtered.length} de ${rows.length}` : ''}</span>
        {filtering && (
          <button onClick={clear} className="font-semibold text-ink-2 underline-offset-2 hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[28px] bg-card shadow-card">
          <Empty icon={<SearchX size={24} strokeWidth={1.7} />} title="Nenhuma locação encontrada">
            Revise a busca ou limpe os filtros.
          </Empty>
        </div>
      ) : (
        <>
          <RentalTable rows={filtered} sort={sort} onSort={onSort} />
          <RentalCards rows={filtered} />
        </>
      )}
    </div>
  )
}
