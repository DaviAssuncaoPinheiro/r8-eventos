import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check, ChevronDown, Clock, PenLine, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, Chip, TeamAvatar } from '@/components/ui'
import { TEAM, type Job, type JobType } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { onTime } from '@/lib/history'
import { JOB_TYPE, OCC_KIND } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { HistoryItem } from './model'

type Filter = 'todos' | 'limpeza' | 'mov' | 'manut'
const FILTERS: { value: Filter; label: string; match: (t: JobType) => boolean }[] = [
  { value: 'todos', label: 'Tudo', match: () => true },
  { value: 'limpeza', label: 'Limpezas', match: (t) => t === 'Limpeza' },
  { value: 'mov', label: 'Montagem e retirada', match: (t) => t === 'Montagem' || t === 'Retirada' },
  { value: 'manut', label: 'Manutenção', match: (t) => t === 'Manutenção' },
]

const minutes = (a: string, b: string) => Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 60000))

function TypeBadge({ type, ring = 'ring-card' }: { type: JobType; ring?: string }) {
  const t = JOB_TYPE[type]
  return (
    <span className={cn('absolute -right-1 -bottom-1 inline-flex size-[18px] items-center justify-center rounded-full text-white ring-2', ring)} style={{ background: t.color }}>
      <t.icon className="size-2.5" strokeWidth={2.4} />
    </span>
  )
}

function LiveEntry({ job }: { job: Job }) {
  const nav = useNavigate()
  const live = job.status === 'em-andamento'
  return (
    <li className="-mx-3 mb-1 flex gap-3 rounded-[20px] bg-black px-3 py-3.5 text-white">
      <span className="relative mt-0.5 block size-[38px] shrink-0">
        <TeamAvatar teamId={job.teamId} size={38} />
        <TypeBadge type={job.type} ring="ring-black" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-[14px] leading-snug font-bold">{job.type}</h4>
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-brand px-2.5 text-[11.5px] font-semibold text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                {live ? 'Em andamento' : 'A caminho'}
              </span>
            </div>
            <div className="text-[12.5px] font-medium text-white/60">
              {TEAM[job.teamId].name} · {job.note}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="num text-[12.5px] font-semibold">{live ? `Desde ${fmt.time(job.start)}` : `Previsto ${fmt.time(job.start)}`}</div>
            <div className="text-[11.5px] font-medium text-white/50">hoje</div>
          </div>
        </div>
        <Button variant="brand" size="sm" onClick={() => nav(`/campo/servico/${job.id}`)} className="mt-3">
          Ver no app da equipe <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
        </Button>
      </div>
    </li>
  )
}

function Entry({ item, index }: { item: HistoryItem; index: number }) {
  const [open, setOpen] = React.useState(item.isNew)
  const { job, report } = item
  const t = JOB_TYPE[job.type]
  if (!report) return null
  const timely = onTime(job, report)
  const delay = Math.round((+new Date(report.startedAt) - +new Date(job.start)) / 60000)
  const failed = report.checklist.filter((c) => !c.ok)
  const count = job.type === 'Limpeza' ? report.units.length || job.units : job.units
  const unitWord = job.type === 'Limpeza' || job.type === 'Manutenção' ? (count === 1 ? 'unidade' : 'unidades') : count === 1 ? 'item' : 'itens'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.28, delay: Math.min(index, 6) * 0.03, ease: [0.25, 1, 0.5, 1] }}
      className={cn('relative flex gap-3 rounded-[20px] py-3.5', item.isNew && '-mx-3 bg-brand-soft px-3')}
    >
      <span className="relative mt-0.5 block size-[38px] shrink-0">
        <TeamAvatar teamId={job.teamId} size={38} />
        <TypeBadge type={job.type} ring={item.isNew ? 'ring-brand-soft' : 'ring-card'} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-[14px] leading-snug font-bold text-ink">
                {job.type} <span className="num font-semibold text-ink-3">· {count} {unitWord}</span>
              </h4>
              {item.isNew && <Badge tone="brand">Novo</Badge>}
              {!timely && <Badge tone="warn">Começou {delay} min depois</Badge>}
              {report.occurrences.length > 0 && (
                <Badge tone="late">
                  {report.occurrences.length} {report.occurrences.length === 1 ? 'ocorrência' : 'ocorrências'}
                </Badge>
              )}
            </div>
            <div className="text-[12.5px] font-medium text-ink-3">
              por <span className={t.text}>{TEAM[job.teamId].name}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="num text-[12.5px] font-semibold text-ink-2">
              {fmt.short(report.finishedAt)}, {fmt.time(report.startedAt)} às {fmt.time(report.finishedAt)}
            </div>
            <div className="text-[11.5px] font-medium text-ink-4">{relDays(report.finishedAt)}</div>
          </div>
        </div>

        <div className="mt-2.5 max-w-[620px] rounded-[16px] rounded-tl-[6px] bg-blue-soft px-3.5 py-2.5 text-[13px] leading-relaxed font-medium text-ink-2">{report.summary}</div>

        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-2 hover:text-ink">
          {open ? 'Esconder detalhes' : 'Ver checklist e assinatura'}
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} strokeWidth={2.2} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <div className="mt-2.5 grid gap-2 md:grid-cols-2">
                <div className="rounded-[16px] bg-surface p-3">
                  <div className="mb-1.5 text-[12px] font-semibold text-ink-3">Checklist</div>
                  <ul className="flex flex-col gap-1">
                    {report.checklist.map((c) => (
                      <li key={c.label} className="flex items-center gap-2 text-[12.5px] font-medium text-ink-2">
                        <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-full', c.ok ? 'bg-green text-white' : 'bg-red text-white')}>
                          <Check className="size-2.5" strokeWidth={3.4} />
                        </span>
                        {c.label}
                      </li>
                    ))}
                  </ul>
                  {failed.length > 0 && <div className="mt-1.5 text-[12px] font-semibold text-red">{failed.length} item com pendência</div>}
                </div>
                <div className="flex flex-col gap-2">
                  {report.items && (
                    <div className="rounded-[16px] bg-surface p-3">
                      <div className="mb-1.5 text-[12px] font-semibold text-ink-3">Conferência</div>
                      {report.items.map((it) => (
                        <div key={it.label} className="num flex items-center justify-between text-[12.5px] font-medium text-ink-2">
                          <span>{it.label}</span>
                          <span className={cn('font-semibold', it.done < it.planned ? 'text-red' : 'text-ink')}>
                            {it.done} de {it.planned}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {report.supplies && (
                    <div className="rounded-[16px] bg-surface p-3">
                      <div className="mb-1.5 text-[12px] font-semibold text-ink-3">Insumos</div>
                      {report.supplies.map((s) => (
                        <div key={s.label} className="num flex items-center justify-between text-[12.5px] font-medium text-ink-2">
                          <span>{s.label}</span>
                          <span className="font-semibold text-ink">{s.qty}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 rounded-[16px] bg-surface p-3">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill">
                      <PenLine className="size-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 text-[12.5px] leading-snug font-medium">
                      {report.signedBy ? (
                        <>
                          <div className="text-ink-3">Assinado no local por</div>
                          <div className="truncate font-semibold text-ink">
                            {report.signedBy}
                            {report.signedRole ? `, ${report.signedRole.toLowerCase()}` : ''}
                          </div>
                        </>
                      ) : (
                        <div className="text-ink-3">Sem assinatura do responsável</div>
                      )}
                    </div>
                    {report.signature && <img src={report.signature} alt="Assinatura" className="ml-auto h-9 w-auto rounded-md bg-card px-1" />}
                  </div>
                </div>
              </div>
              {report.occurrences.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {report.occurrences.map((o, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-[16px] bg-red-soft px-3 py-2.5 text-[12.5px] leading-snug font-medium text-ink-2">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-red" strokeWidth={2.2} />
                      <span>
                        <span className="font-semibold text-red">
                          {OCC_KIND[o.kind].short}
                          {o.unitId ? ` · ${o.unitId}` : ''}
                        </span>{' '}
                        {o.note}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  )
}

const PAGE = 6

export function ServiceTimeline({ items, live, title }: { items: HistoryItem[]; live?: Job; title: string }) {
  const [filter, setFilter] = React.useState<Filter>('todos')
  const [all, setAll] = React.useState(false)
  const f = FILTERS.find((x) => x.value === filter)!
  const shown = items.filter((i) => f.match(i.job.type))
  const visible = all ? shown : shown.slice(0, PAGE)
  const counts = Object.fromEntries(FILTERS.map((x) => [x.value, items.filter((i) => x.match(i.job.type)).length])) as Record<Filter, number>
  const fresh = items.filter((i) => i.isNew).length
  const showLive = live && f.match(live.type)

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Histórico de serviços</h3>
          <div className="mt-0.5 text-[12.5px] font-medium text-ink-3">
            {items.length} registros{fresh ? ` · ${fresh} novo${fresh > 1 ? 's' : ''} hoje` : ''}
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-[12px] font-semibold text-ink-3 sm:inline-flex">
          <Clock className="size-3.5" strokeWidth={2} /> Horário real registrado no app
        </span>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4 pb-1">
        {FILTERS.filter((x) => x.value === 'todos' || counts[x.value] > 0).map((x) => (
          <Chip key={x.value} active={filter === x.value} onClick={() => setFilter(x.value)} className="shrink-0">
            {x.label}
            <span className={cn('num text-[11.5px]', filter === x.value ? 'text-white/60' : 'text-ink-4')}>{counts[x.value]}</span>
          </Chip>
        ))}
      </div>

      <div className="px-5 pt-3 pb-3">
        {showLive && (
          <ul>
            <LiveEntry job={live} />
          </ul>
        )}
        {shown.length === 0 && !showLive ? (
          <div className="py-10 text-center text-[13px] font-medium text-ink-3">Nenhum serviço deste tipo em {title}.</div>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {visible.map((it, i) => (
                <Entry key={it.job.id} item={it} index={i} />
              ))}
            </AnimatePresence>
          </ul>
        )}
        {shown.length > PAGE && (
          <div className="flex justify-center pt-2 pb-2">
            <Button variant="subtle" size="sm" onClick={() => setAll((v) => !v)}>
              {all ? 'Mostrar menos' : `Ver mais ${shown.length - PAGE}`}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
