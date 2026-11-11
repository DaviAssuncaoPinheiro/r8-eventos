import * as React from 'react'
import { motion } from 'motion/react'
import { ChevronRight, Plus, type LucideIcon } from 'lucide-react'
import { AUTOMATION_ACTIONS, AUTOMATION_TRIGGERS } from '@/services'
import { cn } from '@/ui'
import { reduced } from '@/ui/Motion'
import { iconFor } from './icons'

export const triggerIcon = (kind?: string) => iconFor(AUTOMATION_TRIGGERS.find((t) => t.kind === kind)?.icon)
export const actionIcon = (kind?: string) => iconFor(AUTOMATION_ACTIONS.find((a) => a.kind === kind)?.icon)

function Node({ icon: Icon, label, tone, size, empty }: { icon: LucideIcon; label: string; tone: 'trigger' | 'action'; size: number; empty?: boolean }) {
  return (
    <div className="flex w-[40%] min-w-0 flex-col items-center gap-2 text-center">
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className={cn(
          'grid shrink-0 place-items-center rounded-pill transition-colors duration-300 ease-[var(--ease-ui)]',
          empty ? 'border-2 border-dashed border-strong text-fg-3' : tone === 'trigger' ? 'bg-accent-soft text-accent-ink' : 'ds-hero text-on-accent',
        )}
      >
        <Icon size={size * 0.43} strokeWidth={2} aria-hidden />
      </span>
      <span className={cn('line-clamp-3 text-caption leading-4 font-medium', empty ? 'text-fg-3' : 'text-fg-2')}>{label}</span>
    </div>
  )
}

/**
 * Fluxo gatilho, seta, ação. Ligado: um pontinho percorre a linha em laço lento (para com "reduzir movimento").
 * Desligado: linha tracejada e tudo esmaecido.
 */
export function Flow({ triggerKind, triggerLabel, actionKind, actionLabel, active = true, size = 56, className }: { triggerKind?: string; triggerLabel?: string; actionKind?: string; actionLabel?: string; active?: boolean; size?: number; className?: string }) {
  const still = reduced()
  return (
    <div role="img" aria-label={`${triggerLabel ?? 'Escolha o gatilho'}, depois ${actionLabel ?? 'escolha a ação'}`} className={cn('flex items-start justify-between gap-1', className)}>
      <Node icon={triggerKind ? triggerIcon(triggerKind) : Plus} label={triggerLabel ?? 'Quando'} tone="trigger" size={size} empty={!triggerKind} />
      <div aria-hidden className="relative min-w-6 flex-1" style={{ marginTop: size / 2 - 1 }}>
        <div className={cn('h-0 w-full border-t-2 transition-colors duration-300', active ? 'border-accent/35' : 'border-dashed border-strong')} />
        <ChevronRight size={18} strokeWidth={2.5} className={cn('absolute -top-[10px] -right-1.5', active ? 'text-accent' : 'text-strong')} />
        {active && !still ? (
          <motion.span
            className="absolute -top-[5px] size-2.5 rounded-pill bg-accent"
            initial={{ left: '0%', opacity: 0 }}
            animate={{ left: ['0%', '88%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.9, times: [0, 0.15, 0.85, 1] }}
          />
        ) : null}
      </div>
      <Node icon={actionKind ? actionIcon(actionKind) : Plus} label={actionLabel ?? 'Fazer'} tone="action" size={size} empty={!actionKind} />
    </div>
  )
}
