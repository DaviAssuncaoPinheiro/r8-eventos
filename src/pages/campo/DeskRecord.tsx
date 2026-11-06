// Registro do serviço no computador: etapas em pílulas no topo, conteúdo em duas colunas e ações no rodapé.
import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, CloudCheck, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RentalAvatar } from '@/components/ui'
import { type Job } from '@/data/mock'
import { useDemo } from '@/store'
import { useCampo, type Draft } from './campoStore'
import { useJob } from './data'
import { EASE_OUT } from './kit'
import { Elapsed, useRecordFlow } from './RecordScreen'

export function DeskRecord() {
  const { id = '' } = useParams()
  const job = useJob(id)
  const draft = useCampo((s) => s.drafts[id])
  const nav = useNavigate()
  React.useLayoutEffect(() => {
    if (job && !draft) useCampo.getState().ensureDraft(job)
  }, [job, draft])
  if (!job)
    return (
      <div className="rounded-[24px] bg-card p-8 text-[15px] font-medium text-ink-3 shadow-card">
        Serviço não encontrado.{' '}
        <button className="font-semibold text-ink underline" onClick={() => nav('/')}>
          Voltar
        </button>
      </div>
    )
  if (!draft) return null
  return <DeskRecordBody job={job} draft={draft} />
}

function DeskRecordBody({ job, draft }: { job: Job; draft: Draft }) {
  const offline = useDemo((s) => s.offline)
  const { go, rental, patch, steps, step, dir, saving, setStep, finish, StepComp, last, eyebrow } = useRecordFlow(job, draft)

  const changeStep = (n: number) => {
    setStep(n)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-[calc(100dvh-124px)] flex-col rounded-[28px] bg-muted p-2 ring-1 ring-white/80">
      {/* local e etapas */}
      <div className="rounded-[22px] bg-card p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3 px-1 pb-3">
          <button
            onClick={() => go(`/servico/${job.id}`, { dir: -1 })}
            aria-label="Voltar ao serviço"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink transition-colors hover:bg-muted-2 active:scale-95"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={2} />
          </button>
          <RentalAvatar rental={rental} size={40} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[16px] font-bold text-ink">
              {rental.title} <span className="font-semibold text-ink-3">· {job.type}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" /> Em andamento há <Elapsed job={job} />
            </div>
          </div>
          <span className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold', offline ? 'bg-black text-white' : 'bg-surface text-ink')}>
            {offline ? <CloudOff className="size-4 text-brand" strokeWidth={2.2} /> : <CloudCheck className="size-4 text-green" strokeWidth={2.2} />}
            {offline ? 'Salvo no computador' : 'Salvo'}
          </span>
        </div>
        <nav className="grid grid-cols-5 gap-1.5" aria-label="Etapas">
          {steps.map((s, i) => {
            const on = i === step
            const done = i < step
            return (
              <button
                key={s}
                onClick={() => changeStep(i)}
                aria-current={on ? 'step' : undefined}
                className={cn(
                  'flex h-11 min-w-0 items-center gap-2 rounded-full pr-3 pl-1.5 text-[13.5px] font-semibold transition-[background,color,transform] duration-200 active:scale-[.98]',
                  on ? 'bg-black text-white' : done ? 'bg-brand-soft text-ink hover:bg-brand/20' : 'bg-surface text-ink-3 hover:text-ink',
                )}
              >
                <span className={cn('num flex size-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold', on || done ? 'bg-brand text-white' : 'bg-card text-ink-3 shadow-pill')}>
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="truncate">{s}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* conteúdo da etapa */}
      <div className="flex-1 px-3 pt-6 pb-4">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -16 : 16, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            <StepComp job={job} rental={rental} draft={draft} patch={patch} layout="desktop" eyebrow={eyebrow} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ações */}
      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-[22px] bg-card px-4 py-3 shadow-float">
        <div className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink-3">
          Etapa <span className="num text-ink">{step + 1}</span> de {steps.length} · <span className="text-ink">{steps[step]}</span>
        </div>
        {step > 0 && (
          <button onClick={() => changeStep(step - 1)} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-muted pr-4 pl-3 text-[14px] font-semibold text-ink transition-[background,transform] hover:bg-muted-2 active:scale-[.97]">
            <ChevronLeft className="size-[18px]" strokeWidth={2.2} /> Voltar
          </button>
        )}
        {last ? (
          <button
            onClick={finish}
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-[14px] font-semibold text-white transition-[background,transform] hover:bg-black-2 active:scale-[.97] disabled:opacity-70"
          >
            {saving ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex size-[18px] rounded-full border-2 border-white/30 border-t-brand" />
            ) : (
              <Check className="size-[18px] text-brand" strokeWidth={2.6} />
            )}
            {saving ? 'Salvando' : 'Finalizar e enviar relatório'}
          </button>
        ) : (
          <button onClick={() => changeStep(step + 1)} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-black pr-3 pl-5 text-[14px] font-semibold text-white transition-[background,transform] hover:bg-black-2 active:scale-[.97]">
            Próximo: {steps[step + 1]} <ChevronRight className="size-[18px]" strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  )
}
