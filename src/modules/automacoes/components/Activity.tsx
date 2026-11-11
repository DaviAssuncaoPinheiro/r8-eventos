import * as React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Pause, Play, Route, Tag } from 'lucide-react'
import { addDays, dayOf, today } from '@/domain/dates'
import { formatDate, formatMoney, formatTime } from '@/lib/format'
import type { AutomationRun } from '@/domain/types'
import type { Automation } from '@/services'
import { cn } from '@/ui'
import { reduced } from '@/ui/Motion'
import { actionIcon } from './Flow'

export type LiveStatus = 'live' | 'paused' | 'uptodate'

const REF_ROUTE: Record<NonNullable<AutomationRun['ref']>['type'], (id: string) => string> = {
  rental: (id) => `/locacoes/${id}`,
  charge: (id) => `/financeiro/cobranca/${id}`,
  unit: (id) => `/equipamentos/${id}`,
  client: (id) => `/clientes/${id}`,
  service: () => '/operacao',
  damage: () => '/avarias',
  type: (id) => `/equipamentos?tipo=${id}`,
}

/** Ponto que pulsa (o "ao vivo"). Único laço da tela além do pontinho do fluxo. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('relative inline-flex size-2.5', className)}>
      <span className="absolute inset-0 animate-ping rounded-pill bg-current opacity-60" />
      <span className="relative size-2.5 rounded-pill bg-current" />
    </span>
  )
}

export function RunItem({ run, auto, fresh }: { run: AutomationRun; auto?: Automation; fresh?: boolean }) {
  const Icon = run.automationId === 'sys-preco' ? Tag : run.automationId === 'sys-rotas' ? Route : actionIcon(auto?.action.kind)
  const to = run.ref ? REF_ROUTE[run.ref.type]?.(run.ref.id) : undefined
  const inner = (
    <div className={cn('flex items-start gap-3 rounded-[16px] px-2 py-2.5 transition-colors duration-[1800ms] ease-out', fresh ? 'bg-accent-soft' : 'bg-transparent')}>
      <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent-ink">
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-body text-fg">{run.text}</p>
        <div className="mt-0.5 flex items-center gap-2 text-caption text-fg-3">
          <time dateTime={run.at} className="tnum">
            {formatTime(run.at)}
          </time>
          {run.value ? <span className="font-semibold tnum text-ok-ink">{formatMoney(run.value)}</span> : null}
        </div>
      </div>
      {to ? (
        <Link to={to} aria-label={`Abrir: ${run.text}`} className="ds-touch ds-touch-sq grid size-9 shrink-0 place-items-center rounded-pill text-fg-3 transition-colors duration-150 hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <ArrowUpRight size={18} strokeWidth={2} aria-hidden />
        </Link>
      ) : null}
    </div>
  )
  if (reduced()) return <li>{inner}</li>
  return (
    <motion.li layout="position" initial={fresh ? { opacity: 0, y: -22, scale: 0.97 } : false} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
      {inner}
    </motion.li>
  )
}

function dayLabel(iso: string): string {
  const d = dayOf(iso)
  const t = today()
  return d === t ? 'Hoje' : d === addDays(t, -1) ? 'Ontem' : formatDate(d)
}

/** Linha do tempo agrupada por dia (Hoje, Ontem, data). */
export function RunTimeline({ runs, autos, fresh }: { runs: AutomationRun[]; autos: Automation[]; fresh?: Set<string> }) {
  const groups: { label: string; items: AutomationRun[] }[] = []
  for (const r of runs) {
    const label = dayLabel(r.at)
    const g = groups[groups.length - 1]
    if (g && g.label === label) g.items.push(r)
    else groups.push({ label, items: [r] })
  }
  return (
    <div>
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label} className="mb-2">
          <h3 className="sticky top-0 z-[1] bg-raised px-2 py-1.5 text-caption font-semibold text-fg-3">{g.label}</h3>
          <ul>
            {g.items.map((r) => (
              <RunItem key={r.id} run={r} auto={autos.find((a) => a.id === r.automationId)} fresh={fresh?.has(r.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Botão do "ao vivo": mostra a situação e pausa ou retoma a consulta. */
export function LiveToggle({ status, onToggle }: { status: LiveStatus; onToggle: () => void }) {
  const Icon = status === 'live' ? Pause : Play
  const label = status === 'live' ? 'Pausar atualização ao vivo' : status === 'paused' ? 'Retomar atualização ao vivo' : 'Verificar de novo'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={status === 'live'}
      onClick={onToggle}
      className={cn(
        'ds-touch inline-flex h-9 items-center gap-2 rounded-pill px-3 text-caption font-semibold transition-colors duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        status === 'live' ? 'bg-accent-soft text-accent-ink hover:bg-hover' : status === 'uptodate' ? 'bg-ok-soft text-ok-ink hover:bg-hover' : 'bg-sunken text-fg-2 hover:bg-hover',
      )}
    >
      {status === 'live' ? <LiveDot /> : null}
      <StatusText status={status} />
      {status !== 'uptodate' ? <Icon size={14} strokeWidth={2.5} aria-hidden /> : null}
    </button>
  )
}

export function StatusText({ status }: { status: LiveStatus }) {
  return <span>{status === 'live' ? 'Ao vivo' : status === 'paused' ? 'Pausado' : 'Tudo em dia'}</span>
}
