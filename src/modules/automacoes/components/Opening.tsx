import * as React from 'react'
import { motion } from 'motion/react'
import { Check, Info } from 'lucide-react'
import type { AutomationSummary } from '@/services'
import { MoneyCard, Skeleton, Tooltip, cn } from '@/ui'
import { RollingNumber, reduced } from '@/ui/Motion'
import { LiveDot, type LiveStatus } from './Activity'

function InfoTip({ label, text, className }: { label: string; text: string; className?: string }) {
  return (
    <Tooltip content={text} toggleOnClick>
      <button type="button" aria-label={`Como é calculado: ${label}`} className={cn('ds-hit inline-flex size-6 shrink-0 items-center justify-center rounded-pill transition-opacity duration-150 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}>
        <Info size={16} strokeWidth={2} aria-hidden />
      </button>
    </Tooltip>
  )
}

function Ring({ value, total }: { value: number; total: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  const pct = total ? value / total : 0
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden className="shrink-0 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" className="stroke-sunken" />
      <motion.circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        className="stroke-accent"
        strokeDasharray={c}
        initial={{ strokeDashoffset: reduced() ? c * (1 - pct) : c }}
        animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

const card = 'min-w-0 rounded-card'

/** Os quatro indicadores de abertura. Cada filho direto entra em cascata (o pai usa Stagger). */
export function openingBlocks(s: AutomationSummary, status: LiveStatus) {
  return [
    <section key="hero" aria-label="Feito sozinho hoje" className={cn(card, 'ds-hero ds-hero-card @container relative col-span-2 flex flex-col p-5 sm:p-6 @min-[1180px]/frame:col-span-1')}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 pt-2 text-[15px] leading-5 font-medium @min-[250px]:text-body-lg">Feito sozinho hoje</h2>
        <InfoTip label="Feito sozinho hoje" text="Execuções feitas hoje pelas automações ligadas, sem ninguém clicar." className="text-on-accent opacity-80" />
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <span className="text-kpi-lg text-[clamp(44px,18cqw,64px)] leading-none">
          <RollingNumber value={s.runsToday} />
        </span>
        <span className="inline-flex h-7 shrink-0 items-center gap-2 rounded-pill bg-on-accent px-3 text-caption font-semibold whitespace-nowrap text-accent-active">
          {status === 'uptodate' ? <Check size={14} strokeWidth={3} aria-hidden /> : status === 'live' ? <LiveDot className="text-accent" /> : null}
          {status === 'live' ? 'Ao vivo' : status === 'paused' ? 'Pausado' : 'Tudo em dia'}
        </span>
      </div>
    </section>,
    <MoneyCard key="money" title="Dinheiro recuperado" value={s.moneyMonth} formula="Soma do valor das cobranças e extras que as automações geraram nos últimos 30 dias." />,
    <MoneyCard key="hours" title="Horas poupadas" display={<RollingNumber value={s.hoursSavedMonth} decimals={1} suffix=" h" />} formula="Tempo de trabalho manual que cada execução evita (por exemplo, 14 minutos para gerar e enviar uma cobrança de avaria), somado nos últimos 30 dias." />,
    <section key="active" aria-label="Ativas" className={cn(card, 'group/card @container relative col-span-2 flex flex-col bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-1')}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="pt-2 text-[15px] leading-5 font-medium @min-[250px]:text-body-lg">Ativas</h2>
        <InfoTip label="Ativas" text="Automações ligadas, entre todas as que existem. Desligue uma no cartão dela." className="text-fg-3" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-kpi-lg text-[clamp(30px,17.5cqw,44px)] whitespace-nowrap">
          <RollingNumber value={s.activeCount} className="inline-flex" />
          <span className="text-fg-3"> de {s.totalCount}</span>
        </span>
        <Ring value={s.activeCount} total={s.totalCount} />
      </div>
    </section>,
  ]
}

export function OpeningSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando indicadores" className="grid grid-cols-2 gap-4 @min-[1180px]/frame:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn(card, 'flex h-[168px] flex-col justify-between bg-raised p-5 sm:p-6', i % 3 === 0 && 'col-span-2 @min-[1180px]/frame:col-span-1')}>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ))}
    </div>
  )
}
