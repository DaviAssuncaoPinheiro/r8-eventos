// Menu ⋯ do serviço: simular área sem sinal e abrir a locação.
import * as Popover from '@radix-ui/react-popover'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, FileText, MoreHorizontal, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { Pressable, Toggle, usePhone } from './kit'

export function JobMenu({ rentalId, className }: { rentalId: string; className?: string }) {
  const { root, desktop } = usePhone()
  const offline = useDemo((s) => s.offline)
  const setOffline = useDemo((s) => s.setOffline)
  const nav = useNavigate()
  const links = [
    { icon: Building2, label: 'Abrir locação', to: `/locacoes/${rentalId}` },
    { icon: FileText, label: 'Relatório do cliente', to: `/relatorio/${rentalId}` },
  ]
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Pressable
          scale={0.9}
          aria-label="Mais opções"
          className={cn('relative flex shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill transition-colors hover:bg-surface', desktop ? 'size-10' : 'size-11', className)}
        >
          <MoreHorizontal className="size-[19px]" strokeWidth={2} />
          {offline && <span className="absolute top-1 right-1 size-2.5 rounded-full bg-black ring-2 ring-card" />}
        </Pressable>
      </Popover.Trigger>
      <Popover.Portal container={root ?? undefined}>
        <Popover.Content align="end" sideOffset={8} className="z-[100] w-[268px] rounded-[24px] bg-card p-2 shadow-float outline-none">
          <label className="flex h-14 cursor-pointer items-center gap-3 rounded-[18px] px-2.5 hover:bg-surface">
            <span className={cn('flex size-9 items-center justify-center rounded-full', offline ? 'bg-black text-brand' : 'bg-muted text-ink')}>
              <WifiOff className="size-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-ink">Sem sinal</span>
              <span className="block text-[12px] font-medium text-ink-3">{offline ? 'Salvando no aparelho' : 'Simular área sem internet'}</span>
            </span>
            <Toggle checked={offline} onChange={setOffline} label="Sem sinal" />
          </label>
          <div className="mx-2.5 h-px bg-line" />
          {links.map((l) => (
            <button key={l.to} onClick={() => nav(l.to)} className="flex h-14 w-full items-center gap-3 rounded-[18px] px-2.5 text-left hover:bg-surface">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-ink">
                <l.icon className="size-4" strokeWidth={2} />
              </span>
              <span className="flex-1 text-[14px] font-bold text-ink">{l.label}</span>
              <ChevronRight className="size-4 text-ink-4" />
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
