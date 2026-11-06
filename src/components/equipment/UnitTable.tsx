import * as React from 'react'
import { ChevronRight, QrCode, Search, SearchX, X } from 'lucide-react'
import { Badge, Chip, Empty, ProductThumb, Segmented } from '@/components/ui'
import { relDays } from '@/data/time'
import { cn } from '@/lib/utils'
import { STATE_LABEL, type UnitRow } from './model'
import type { UnitState } from '@/data/mock'

type Kind = 'todos' | 'bq' | 'bq-pne' | 'bq-luxo' | 'trailer'
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const PAGE = 24

function StateDot({ state }: { state: UnitState }) {
  const s = STATE_LABEL[state]
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold whitespace-nowrap text-ink">
      
      {s.label}
    </span>
  )
}

function lastLabel(r: UnitRow) {
  if (!r.last) return null
  const d = r.last.report.finishedAt
  const rel = relDays(d)
  return `${rel === 'hoje' ? 'Hoje' : rel === 'ontem' ? 'Ontem' : rel.charAt(0).toUpperCase() + rel.slice(1)}, ${new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function UnitTable({ rows, onOpen }: { rows: UnitRow[]; onOpen: (id: string) => void }) {
  const [q, setQ] = React.useState('')
  const [kind, setKind] = React.useState<Kind>('todos')
  const [state, setState] = React.useState<UnitState | 'todas'>('todas')
  const [limit, setLimit] = React.useState(PAGE)

  const filtered = React.useMemo(() => {
    const t = norm(q.trim())
    return rows.filter(
      (r) =>
        (kind === 'todos' || (kind === 'trailer' ? r.product.id.startsWith('trailer') : r.product.id === kind)) &&
        (state === 'todas' || r.state === state) &&
        (!t || norm(`${r.unit.id} ${r.unit.id.replace('-', '')} ${r.product.short} ${r.place} ${r.region ?? ''}`).includes(t)),
    )
  }, [rows, q, kind, state])

  React.useEffect(() => setLimit(PAGE), [q, kind, state])

  const count = (s: UnitState) => rows.filter((r) => r.state === s).length
  const shown = filtered.slice(0, limit)

  return (
    <div className="rounded-[28px] bg-card p-2 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Patrimônio</h2>
        </div>
        <span className="num inline-flex h-8 items-center rounded-full bg-muted px-3 text-[12.5px] font-bold text-ink-2">{rows.length} unidades</span>
      </div>

      <div className="space-y-2.5 px-1 pb-3">
        <div className="relative">
          <Search size={18} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número (BQ-012), produto ou local"
            className="h-12 w-full rounded-full bg-muted pr-12 pl-11 text-[14.5px] font-medium text-ink outline-none placeholder:text-ink-3 focus:bg-card focus:ring-2 focus:ring-black"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Limpar busca" className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-ink-2 shadow-pill">
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="no-scrollbar -mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1">
            {(
              [
                ['todas', 'Todas'],
                ['campo', 'Em campo'],
                ['base', 'Na base'],
                ['manutencao', 'Manutenção'],
              ] as [UnitState | 'todas', string][]
            ).map(([k, l]) => (
              <Chip key={k} active={state === k} onClick={() => setState(k)} className="shrink-0">
                {l}
                {k !== 'todas' && <span className="num ml-1 opacity-60">{count(k)}</span>}
              </Chip>
            ))}
          </div>
          <Segmented<Kind>
            value={kind}
            onChange={setKind}
            className="max-w-full overflow-x-auto"
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'bq', label: 'Standard' },
              { value: 'bq-pne', label: 'PNE' },
              { value: 'bq-luxo', label: 'Com pia' },
              { value: 'trailer', label: 'Trailers' },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<SearchX size={22} strokeWidth={1.8} />} title="Nenhuma unidade encontrada">
          Confira o número na etiqueta ou limpe os filtros.
        </Empty>
      ) : (
        <>
          {/* tabela no computador */}
          <table className="hidden w-full border-collapse text-left lg:table">
            <thead>
              <tr className="text-[12.5px] font-semibold text-ink-3">
                <th className="h-10 px-3 pl-4">Unidade</th>
                <th className="px-3">Produto</th>
                <th className="px-3">Situação</th>
                <th className="px-3">Local</th>
                <th className="px-3">Última limpeza</th>
                <th className="px-3">Avisos</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.unit.id} onClick={() => onOpen(r.unit.id)} className="group cursor-pointer border-t border-line transition-colors hover:bg-surface">
                  <td className="h-14 px-3 pl-4">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-ink-2">
                        <QrCode className="size-[15px]" strokeWidth={2} />
                      </span>
                      <span className="num text-[14px] font-bold text-ink">{r.unit.id}</span>
                    </span>
                  </td>
                  <td className="px-3">
                    <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-2">
                      <ProductThumb productId={r.product.id} size={26} />
                      {r.product.short}
                    </span>
                  </td>
                  <td className="px-3">
                    <StateDot state={r.state} />
                  </td>
                  <td className="max-w-[260px] px-3">
                    <div className="truncate text-[13.5px] font-semibold text-ink">{r.place}</div>
                    {(r.region || (r.state === 'manutencao' && r.unit.note)) && <div className="truncate text-[12px] font-medium text-ink-3">{r.region ?? r.unit.note}</div>}
                  </td>
                  <td className="px-3 text-[13px] font-medium whitespace-nowrap text-ink-2">{lastLabel(r) ?? <span className="text-ink-4">Sem registro</span>}</td>
                  <td className="px-3">{r.openOcc > 0 ? <Badge tone="late" dot>{r.openOcc} {r.openOcc === 1 ? 'aberto' : 'abertos'}</Badge> : <span className="text-[13px] text-ink-4">Nenhum</span>}</td>
                  <td className="pr-3">
                    <ChevronRight className="size-4 text-ink-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* cartões no celular */}
          <ul className="flex flex-col gap-2 lg:hidden">
            {shown.map((r) => (
              <li key={r.unit.id}>
                <button onClick={() => onOpen(r.unit.id)} className="flex w-full items-center gap-3 rounded-[20px] bg-surface px-3.5 py-3 text-left active:scale-[.99]">
                  <ProductThumb productId={r.product.id} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="num text-[14.5px] font-bold text-ink">{r.unit.id}</span>
                      
                    </span>
                    <span className="block truncate text-[12.5px] font-medium text-ink-3">{r.place}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <StateDot state={r.state} />
                    {lastLabel(r) && <span className="text-[11.5px] font-medium text-ink-3">{lastLabel(r)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className={cn('flex items-center justify-between gap-3 px-3 pt-3 pb-2 text-[12.5px] font-medium text-ink-3')}>
            <span className="num">
              {shown.length} de {filtered.length}
            </span>
            {filtered.length > limit && (
              <button onClick={() => setLimit((n) => n + PAGE * 2)} className="inline-flex h-8 items-center rounded-full bg-muted px-3.5 text-[12.5px] font-semibold text-ink hover:bg-muted-2">
                Ver mais
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
