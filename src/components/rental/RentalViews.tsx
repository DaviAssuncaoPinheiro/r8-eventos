import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, TriangleAlert } from 'lucide-react'
import { ZONE } from '@/data/geo'
import { Badge, RentalAvatar, TeamAvatar } from '@/components/ui'
import { fmt, relDays } from '@/data/time'
import { itemsLabel, type Job } from '@/data/mock'
import { JOB_TYPE, RENTAL_STATUS } from '@/lib/status'
import { brl, cn } from '@/lib/utils'
import type { RentalRow } from './model'

export type SortKey = 'local' | 'cliente' | 'regiao' | 'periodo' | 'proximo' | 'valor' | 'situacao'
export interface Sort {
  key: SortKey
  dir: 1 | -1
}

const COLS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'local', label: 'Locação' },
  { key: 'cliente', label: 'Cliente e região' },
  { key: 'periodo', label: 'Período' },
  { key: 'proximo', label: 'Próximo serviço' },
  { key: 'valor', label: 'Valor', align: 'right' },
  { key: 'situacao', label: 'Situação' },
]

const DOT: Record<RentalRow['rental']['status'], string> = {
  ativa: 'var(--color-green)',
  montagem: 'var(--color-blue)',
  retirada: 'var(--color-yellow)',
  encerrada: 'var(--color-ink-4)',
}

const yy = (d: string) => new Date(d).getFullYear()
const numDate = (d: string) => fmt.date(d).replace(/\/(\d{2})(\d{2})$/, '/$2')
/** "02 de nov a 06 de nov"; atravessando o ano: "09/06/26 a 04/06/27" */
export const period = (r: RentalRow['rental']) =>
  yy(r.start) === yy(r.end) && yy(r.start) === new Date().getFullYear() ? `${fmt.short(r.start)} a ${fmt.short(r.end)}` : `${numDate(r.start)} a ${numDate(r.end)}`
export const valueLabel = (r: RentalRow['rental']) => (r.kind === 'obra' ? `${brl(r.value)}/mês` : brl(r.value))

function Status({ r }: { r: RentalRow }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold whitespace-nowrap text-ink">
      <span className="size-2 rounded-full" style={{ background: DOT[r.rental.status] }} />
      {RENTAL_STATUS[r.rental.status].label}
    </span>
  )
}

/** Alerta curto: ocorrência aberta ou prazo chegando */
function Alerts({ r, className }: { r: RentalRow; className?: string }) {
  if (!r.openOcc && !r.alert) return null
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      {r.openOcc > 0 && (
        <Badge tone="late">
          <TriangleAlert className="-ml-0.5 size-3" strokeWidth={2.4} />
          {r.openOcc} {r.openOcc === 1 ? 'ocorrência' : 'ocorrências'}
        </Badge>
      )}
      {r.alert && <Badge tone={r.alert.tone}>{r.alert.label}</Badge>}
    </span>
  )
}

function NextJob({ job }: { job?: Job }) {
  if (!job) return <span className="text-[13px] font-medium text-ink-4">Nada agendado</span>
  const t = JOB_TYPE[job.type]
  const live = job.status === 'em-andamento'
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-[13px] whitespace-nowrap">
      <span className="size-2 shrink-0 rounded-full" style={{ background: live ? 'var(--color-brand)' : t.color }} />
      <span className="font-semibold text-ink">{job.type}</span>
      <span className={cn('num font-medium', live ? 'text-brand' : 'text-ink-3')}>{live ? 'agora' : `${relDays(job.start)}, ${fmt.time(job.start)}`}</span>
    </span>
  )
}

export function RentalTable({ rows, sort, onSort }: { rows: RentalRow[]; sort: Sort; onSort: (k: SortKey) => void }) {
  const nav = useNavigate()
  return (
    <div className="hidden rounded-[28px] bg-card p-3 shadow-card xl:block">
      <table className="w-full table-auto border-collapse text-left">
        <thead>
          <tr>
            {COLS.map((c) => {
              const active = sort.key === c.key
              return (
                <th key={c.key} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cn('h-10 px-3 first:pl-4', c.align === 'right' && 'text-right')}>
                  <button onClick={() => onSort(c.key)} className={cn('inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-3 transition-colors hover:text-ink', active && 'text-ink')}>
                    {c.label}
                    {active ? sort.dir === 1 ? <ArrowUp size={12} strokeWidth={2.2} /> : <ArrowDown size={12} strokeWidth={2.2} /> : <ChevronsUpDown size={12} strokeWidth={1.8} className="opacity-40" />}
                  </button>
                </th>
              )
            })}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr
              key={r.rental.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              tabIndex={0}
              onClick={() => nav(`/locacoes/${r.rental.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && nav(`/locacoes/${r.rental.id}`)}
              className="group cursor-pointer border-t border-line/60 transition-colors hover:bg-surface focus-visible:bg-surface"
            >
              <td className="h-[72px] py-2 pr-3 pl-4">
                <div className="flex items-center gap-3">
                  <RentalAvatar rental={r.rental} size={42} />
                  <div className="min-w-0 leading-tight">
                    <div className="max-w-[300px] truncate text-[14.5px] font-bold text-ink">{r.rental.title}</div>
                    <div className="mt-1 flex max-w-[300px] items-center gap-2">
                      <span className="min-w-0 truncate text-[12px] text-ink-3">
                        {r.rental.kind === 'obra' ? 'Obra' : 'Evento'} · {itemsLabel(r.rental.items, 2)}
                      </span>
                      <Alerts r={r} className="shrink-0 flex-nowrap" />
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 leading-tight">
                <div className="max-w-[190px] truncate text-[13px] font-medium text-ink">{r.client.name}</div>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap text-ink-3">
                  <span className="size-1.5 rounded-full" style={{ background: ZONE[r.zone].hex }} />
                  {r.bairroName}
                </span>
              </td>
              <td className="num px-3 text-[13px] font-medium whitespace-nowrap text-ink-2">{period(r.rental)}</td>
              <td className="px-3">
                <NextJob job={r.next} />
              </td>
              <td className="num px-3 text-right text-[13px] font-semibold whitespace-nowrap text-ink">{valueLabel(r.rental)}</td>
              <td className="px-3">
                <Status r={r} />
              </td>
              <td className="pr-2">
                <span className="flex size-8 items-center justify-center rounded-full text-ink-3 transition-colors group-hover:bg-card group-hover:text-ink group-hover:shadow-pill">
                  <ChevronRight size={16} strokeWidth={2} />
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RentalCards({ rows }: { rows: RentalRow[] }) {
  const nav = useNavigate()
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 xl:hidden">
      {rows.map((r, i) => (
        <motion.li key={r.rental.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <button onClick={() => nav(`/locacoes/${r.rental.id}`)} className="flex min-h-[76px] w-full items-start gap-3 rounded-[22px] bg-card p-3 text-left shadow-card transition-colors hover:bg-surface active:scale-[.99]">
            <RentalAvatar rental={r.rental} size={50} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15.5px] leading-tight font-bold text-ink">{r.rental.title}</div>
              <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
                {r.client.name} · {r.bairroName}
              </div>
              <div className="mt-0.5 truncate text-[12px] text-ink-3">{itemsLabel(r.rental.items, 2)}</div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Status r={r} />
                <span className="num text-[11.5px] font-semibold text-ink-2">{valueLabel(r.rental)}</span>
                {r.next && (
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink-3">
                    <TeamAvatar teamId={r.next.teamId} size={16} />
                    {r.next.status === 'em-andamento' ? `${r.next.type} agora` : `${r.next.type} ${relDays(r.next.start)}`}
                  </span>
                )}
              </div>
              <Alerts r={r} className="mt-2" />
            </div>
            <ChevronRight size={18} strokeWidth={2} className="mt-3 shrink-0 text-ink-4" />
          </button>
        </motion.li>
      ))}
    </ul>
  )
}
