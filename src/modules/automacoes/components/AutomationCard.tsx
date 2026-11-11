import * as React from 'react'
import { motion } from 'motion/react'
import { Repeat2 } from 'lucide-react'
import { AUTOMATION_CHANNELS, type Automation } from '@/services'
import { Badge, Switch, cn } from '@/ui'
import { RollingMoney, RollingNumber, reduced } from '@/ui/Motion'
import { Flow } from './Flow'

export const channelLabel = (c: string) => AUTOMATION_CHANNELS.find((x) => x.value === c)?.label ?? c

export function AutomationCard({ a, pulse, isNew, busy, onOpen, onToggle }: { a: Automation; pulse?: boolean; isNew?: boolean; busy?: boolean; onOpen: () => void; onToggle: (enabled: boolean) => void }) {
  const body = (
    <section
      aria-label={a.name}
      onClick={onOpen}
      className={cn(
        'group/auto relative flex h-full cursor-pointer flex-col rounded-card bg-raised p-5 transition-[transform,box-shadow] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5',
        pulse && 'scale-[1.025] ring-2 ring-accent',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('min-w-0 transition-opacity duration-300', !a.enabled && 'opacity-60')}>
          <Badge tone="neutral">{channelLabel(a.channel)}</Badge>
        </div>
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch label={<span className="sr-only">{a.enabled ? 'Desligar' : 'Ligar'} {a.name}</span>} checked={a.enabled} disabled={busy} onCheckedChange={onToggle} className="min-h-0 py-0" />
        </div>
      </div>
      <div className={cn('mt-3 flex flex-1 flex-col transition-opacity duration-300', !a.enabled && 'opacity-55')}>
        <h3 className="text-title-card">
          <button type="button" onClick={(e) => (e.stopPropagation(), onOpen())} className="rounded-[6px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {a.name}
          </button>
        </h3>
        <Flow className="mt-5" triggerKind={a.trigger.kind} triggerLabel={a.trigger.label} actionKind={a.action.kind} actionLabel={a.action.label} active={a.enabled} />
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-body">
          <span className="inline-flex items-center gap-1.5 font-semibold tnum text-fg" title="Execuções nos últimos 30 dias">
            <Repeat2 size={16} strokeWidth={2} aria-hidden className="text-fg-3" />
            <RollingNumber value={a.stats.runsMonth} />
            <span className="text-caption font-medium text-fg-3">em 30 dias</span>
          </span>
          {a.stats.moneyMonth > 0 ? (
            <span className="font-semibold tnum text-ok-ink" title="Valor recuperado nos últimos 30 dias">
              <RollingMoney value={a.stats.moneyMonth} />
            </span>
          ) : null}
        </div>
      </div>
    </section>
  )
  if (!isNew || reduced()) return body
  return (
    <motion.div className="h-full" initial={{ opacity: 0, scale: 0.9, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 22 }}>
      {body}
    </motion.div>
  )
}
