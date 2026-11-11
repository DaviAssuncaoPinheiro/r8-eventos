import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { MessageCircle, Route, Sparkles, Sunrise, Wallet, type LucideIcon } from 'lucide-react'
import { AiTag, cn, notify } from '@/ui'
import { TONE_SOFT } from '@/app/status'
import { setAiEnabled, useMutation, useSettings } from '@/services'

const POWERS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Sunrise, title: 'Resumo do dia', text: 'O que fazer hoje, em uma tela' },
  { icon: Wallet, title: 'Cobranças prontas', text: 'Você só aprova e envia' },
  { icon: MessageCircle, title: 'Mensagens de WhatsApp', text: 'Textos prontos para cada cliente' },
  { icon: Route, title: 'Rotas', text: 'Sugere a melhor ordem das equipes' },
]

export default function IA() {
  const s = useSettings()
  const toggle = useMutation(setAiEnabled)
  const on = s.aiEnabled

  const change = async (v: boolean) => {
    try {
      await toggle.run(v)
      notify.success(v ? 'Copiloto ligado' : 'Copiloto desligado')
    } catch {
      notify.error('Não foi possível alterar o Copiloto. Tente de novo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Copiloto" className="ds-copilot relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-card p-6 sm:p-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Sparkles size={28} strokeWidth={2} aria-hidden />
            <h2 className="text-title-section sm:text-title-field">Copiloto</h2>
            <AiTag />
          </div>
          <p className="tnum mt-4 text-kpi sm:text-kpi-lg" aria-live="polite">
            {on ? 'Ligado' : 'Desligado'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="copiloto-switch" className="text-body-lg font-semibold">
            Copiloto <span className="sr-only">{on ? 'ligado' : 'desligado'}</span>
          </label>
          <SwitchPrimitive.Root
            id="copiloto-switch"
            checked={on}
            disabled={toggle.loading}
            onCheckedChange={(v) => void change(v)}
            className="ds-hit relative inline-flex h-10 w-[72px] shrink-0 cursor-pointer items-center rounded-pill bg-white/25 p-1 transition-colors duration-150 ease-[var(--ease-ui)] hover:bg-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-progress data-[state=checked]:bg-white data-[state=checked]:hover:bg-white"
          >
            <SwitchPrimitive.Thumb className="block size-8 rounded-pill bg-white transition-transform duration-200 ease-[var(--ease-ui)] data-[state=checked]:translate-x-8 data-[state=checked]:bg-accent" />
          </SwitchPrimitive.Root>
        </div>
      </section>

      <ul className={cn('m-0 grid list-none grid-cols-1 gap-4 p-0 transition-opacity duration-200 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4', !on && 'opacity-50')}>
        {POWERS.map((p) => (
          <li key={p.title} className="flex flex-col rounded-card bg-raised p-5">
            <span aria-hidden className={cn('grid size-12 place-items-center rounded-pill', TONE_SOFT.accent)}>
              <p.icon size={22} strokeWidth={2} />
            </span>
            <h3 className="mt-4 text-title-card">{p.title}</h3>
            <p className="mt-1 text-body text-fg-2">{p.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
