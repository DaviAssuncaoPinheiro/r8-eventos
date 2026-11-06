import { motion } from 'motion/react'
import { Check, ChevronRight } from 'lucide-react'
import { Badge, RentalAvatar, TeamAvatar } from '@/components/ui'
import { TEAM } from '@/data/mock'
import { AVISO_KIND, AVISO_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'
import { daysFromToday } from '@/data/time'
import { dm, zoneHex, zoneName, type Item } from './data'

const spring = { type: 'spring' as const, bounce: 0.1, duration: 0.5 }

function Zone({ it }: { it: Item }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
      <span className="size-1.5 rounded-full" style={{ background: zoneHex(it.zone) }} />
      {zoneName(it.zone)}
    </span>
  )
}

/** Situação do vencimento em linguagem de locação */
function dueLabel(it: Item): { label: string; tone: 'neutral' | 'warn' | 'late' } {
  const n = daysFromToday(it.a.dueDate)
  if (it.a.kind === 'limpeza') return { label: 'Hoje', tone: 'neutral' }
  if (it.a.kind === 'ocorrencia') return { label: it.a.status === 'confirmado' ? 'Respondida' : 'Responder hoje', tone: it.a.status === 'confirmado' ? 'neutral' : 'warn' }
  const pre = it.a.kind === 'renovacao' ? 'Vence ' : ''
  if (n < 0) return { label: `Passou há ${-n}d`, tone: 'late' }
  if (n === 0) return { label: `${pre}hoje`.replace(/^h/, 'H'), tone: 'warn' }
  if (n === 1) return { label: `${pre}amanhã`.replace(/^a/, 'A'), tone: 'warn' }
  if (n <= 7) return { label: `${pre || 'Em '}${pre ? 'em ' : ''}${n} dias`, tone: it.a.status === 'sem-resposta' ? 'late' : 'warn' }
  return { label: `${pre || 'Em '}${pre ? 'em ' : ''}${dm(it.a.dueDate)}`, tone: 'neutral' }
}

function TeamOf({ it, size }: { it: Item; size: number }) {
  const tid = it.job?.teamId ?? it.rental.teamId
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] whitespace-nowrap text-ink-2">
      <TeamAvatar teamId={tid} size={size} />
      <span className="truncate">{TEAM[tid].short}</span>
    </span>
  )
}

/** Cartão do quadro */
export function BoardCard({ it, selected, flash, onOpen }: { it: Item; selected: boolean; flash: boolean; onOpen: () => void }) {
  const st = AVISO_STATUS[it.a.status]
  const due = dueLabel(it)
  return (
    <motion.button
      layout
      layoutId={`av-${it.a.id}`}
      transition={spring}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className={cn('group relative w-full rounded-[20px] bg-card p-3.5 text-left shadow-card transition-shadow hover:shadow-lift', selected && 'ring-2 ring-black', flash && 'ring-2 ring-green')}
    >
      <div className="flex items-center gap-2.5">
        <RentalAvatar rental={it.rental} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] leading-tight font-bold text-ink">{it.rental.title}</span>
            {it.isNew && <Badge tone="brand" className="h-[18px] px-1.5 text-[10.5px]">Novo</Badge>}
          </div>
          <div className="truncate text-[12px] text-ink-3">{it.client.name}</div>
        </div>
      </div>
      <div className="mt-3 text-[13.5px] leading-snug font-semibold text-ink">{it.a.title}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-3">
        <span>{AVISO_KIND[it.a.kind].label}</span>
        <span aria-hidden>·</span>
        <Zone it={it} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone={due.tone}>{due.label}</Badge>
        {it.a.status === 'programado' && it.a.kind !== 'limpeza' && <Badge tone="neutral" className="num">Envio {dm(it.a.sendDate)}</Badge>}
        {it.a.status === 'programado' && it.a.kind === 'limpeza' && <Badge tone="neutral">Ao concluir</Badge>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <TeamOf it={it} size={22} />
        <Badge tone={st.tone} dot>
          {st.label}
        </Badge>
      </div>
      {flash && (
        <span className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-green text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </motion.button>
  )
}

/** Linha da lista (computador em colunas, celular empilhada) */
export function ListRow({ it, selected, flash, onOpen }: { it: Item; selected: boolean; flash: boolean; onOpen: () => void }) {
  const st = AVISO_STATUS[it.a.status]
  const due = dueLabel(it)
  return (
    <motion.button
      layout
      layoutId={`row-${it.a.id}`}
      transition={spring}
      onClick={onOpen}
      className={cn(
        'group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-surface lg:grid-cols-[minmax(210px,1.2fr)_minmax(0,1.4fr)_120px_minmax(0,0.8fr)_132px_16px] lg:gap-x-4',
        selected && 'bg-surface',
        flash && 'bg-green-soft',
      )}
    >
      <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
        <RentalAvatar rental={it.rental} size={42} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] leading-tight font-bold text-ink">{it.rental.title}</span>
            {it.isNew && <Badge tone="brand" className="h-[18px] px-1.5 text-[10.5px]">Novo</Badge>}
          </div>
          <div className="truncate text-[12px] text-ink-3">{it.client.name}</div>
        </div>
      </div>
      <div className="order-last col-span-3 min-w-0 lg:order-none lg:col-span-1">
        <div className="truncate text-[13.5px] font-semibold text-ink">{it.a.title}</div>
        <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
          <span>{AVISO_KIND[it.a.kind].label}</span>
          <span aria-hidden>·</span>
          <Zone it={it} />
        </div>
      </div>
      <div className="justify-self-end lg:justify-self-start">
        <Badge tone={due.tone}>{due.label}</Badge>
      </div>
      <div className="hidden lg:flex">
        <TeamOf it={it} size={24} />
      </div>
      <div className="order-last col-span-3 flex items-center justify-between lg:order-none lg:col-span-1 lg:justify-start">
        <span className="lg:hidden">
          <TeamOf it={it} size={22} />
        </span>
        <Badge tone={st.tone} dot>
          {st.label}
        </Badge>
      </div>
      <ChevronRight size={16} strokeWidth={1.9} className="hidden text-ink-4 transition-transform group-hover:translate-x-0.5 lg:block" />
    </motion.button>
  )
}
