import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Compass, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_JOB } from '@/data/mock'

const STEPS = [
  { to: '/', title: 'O dia de hoje', text: 'Equipes no mapa, serviços do dia e a carga de cada caminhão. Avisos que chegam pelo QR da porta aparecem em Precisa de atenção.' },
  { to: '/agenda', title: 'Agenda das equipes', text: 'Montagens, limpezas e retiradas por caminhão. As limpezas das obras entram sozinhas, conforme o contrato.' },
  { to: `/campo/servico/${DEMO_JOB}`, title: 'Limpeza no Jardins do Lago', text: 'É o que a equipe usa no celular: unidades, checklist, fotos e assinatura do responsável. Ao finalizar, o cliente recebe o relatório.' },
  { to: '/locacoes/jardins', title: 'Ficha da locação', text: 'Tudo que a equipe registrou aparece aqui: limpezas, fotos, ocorrências e o link do relatório do cliente.' },
  { to: '/equipamentos', title: 'Equipamentos', text: 'Estoque por data e patrimônio com QR na porta. O sistema avisa antes de faltar banheiro.' },
  { to: '/avisos', title: 'Avisos ao cliente', text: 'Relatórios de limpeza, confirmação de montagem, retirada e renovação, tudo pelo WhatsApp.' },
]

export function DemoGuide() {
  const [open, setOpen] = React.useState(() => {
    try { return localStorage.getItem('r8-guide-closed') !== '1' && window.innerWidth >= 1024 } catch { return window.innerWidth >= 1024 }
  })
  const loc = useLocation()
  const nav = useNavigate()
  const current = STEPS.findIndex((s) => (s.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(s.to)))
  const close = () => {
    setOpen(false)
    try { localStorage.setItem('r8-guide-closed', '1') } catch {}
  }
  if (typeof window !== 'undefined' && window.innerWidth < 1280) return null

  const step = STEPS[Math.max(0, current)]
  const idx = Math.max(0, current)
  const next = STEPS[idx + 1]

  return (
    <div className={cn('fixed right-4 bottom-24 z-40 lg:right-6', loc.pathname.startsWith('/campo') ? 'lg:bottom-28' : 'lg:bottom-6')}>
      <AnimatePresence mode="wait">
        {open && current >= 0 ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="w-[min(300px,calc(100vw-2rem))] rounded-[22px] bg-black p-4 text-white shadow-float"
          >
            <div className="mb-2 flex items-center gap-2">
              <Compass className="size-3.5 text-white/50" />
              <span className="text-[12px] font-semibold text-white/50">Roteiro da demonstração · {idx + 1} de {STEPS.length}</span>
              <div className="ml-auto flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <button key={s.to} aria-label={s.title} onClick={() => nav(s.to)} className={cn('h-1.5 rounded-full transition-all', i === idx ? 'w-4 bg-brand' : i < idx ? 'w-1.5 bg-white/60' : 'w-1.5 bg-white/20')} />
                ))}
                <button onClick={close} aria-label="Fechar guia" className="ml-1.5 rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"><X className="size-3.5" /></button>
              </div>
            </div>
            <div className="text-[14px] font-semibold">{step.title}</div>
            <p className="mt-1 text-[12.5px] leading-snug text-white/65">{step.text}</p>
            <div className="mt-3 flex items-center justify-end gap-2">
              {next ? (
                <button onClick={() => nav(next.to)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[12.5px] font-bold text-white hover:bg-brand-2">
                  Próximo: {next.title} <ArrowRight className="size-3.5" />
                </button>
              ) : (
                <button onClick={close} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[12.5px] font-bold text-white hover:bg-brand-2">
                  <Check className="size-3.5" /> Concluir
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full bg-black px-4 text-[13px] font-semibold text-white shadow-float hover:bg-black-2"
          >
            <Compass className="size-4" /> Roteiro da demonstração
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
