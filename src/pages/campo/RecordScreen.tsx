// Registro do serviço em 5 etapas (mesma estrutura para montagem, limpeza, retirada e manutenção)
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, CloudCheck, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Job } from '@/data/mock'
import { useDemo } from '@/store'
import { notify, useCampo, type Draft } from './campoStore'
import { contactFirst, firstStepLabel, minutesSince, rentalOf, useJob } from './data'
import { commitJob } from './finalize'
import { Btn, ConnectivityBanner, EASE_IOS, Pressable, Screen } from './kit'
import { useGo } from './nav'
import type { StepProps } from './stepKit'
import { StepUnidades } from './StepUnidades'
import { StepChecklist } from './StepChecklist'
import { StepFotos } from './StepFotos'
import { StepOcorrencias } from './StepOcorrencias'
import { StepAssinatura } from './StepAssinatura'

export const STEP_COMPONENTS: React.ComponentType<StepProps>[] = [StepUnidades, StepChecklist, StepFotos, StepOcorrencias, StepAssinatura]

export const stepsOf = (job: Job) => [firstStepLabel(job), 'Checklist', 'Fotos', 'Ocorrências', 'Assinatura']

export default function RecordScreen() {
  const { id = '' } = useParams()
  const job = useJob(id)
  const draft = useCampo((s) => s.drafts[id])
  React.useLayoutEffect(() => {
    if (job && !draft) useCampo.getState().ensureDraft(job)
  }, [job, draft])
  if (!job || !draft) return <div className="absolute inset-0 bg-surface" />
  return <Record job={job} draft={draft} />
}

export function Elapsed({ job }: { job: Job }) {
  const started = useCampo((s) => s.startedAt[job.id])
  const [, tick] = React.useState(0)
  React.useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 20000)
    return () => window.clearInterval(t)
  }, [])
  return <span className="num">{minutesSince(started ?? job.start)} min</span>
}

/** Etapa atual, navegação entre etapas e finalização (mesmo fluxo no celular e no computador). */
export function useRecordFlow(job: Job, draft: Draft) {
  const go = useGo()
  const rental = rentalOf(job)
  const patchStore = useCampo((s) => s.patch)
  const patch = React.useCallback((p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => patchStore(job.id, p), [patchStore, job.id])
  const steps = stepsOf(job)
  const step = Math.min(draft.step, steps.length - 1)
  const [dir, setDir] = React.useState(1)
  const [saving, setSaving] = React.useState(false)

  const setStep = (n: number) => {
    if (n < 0 || n >= steps.length || n === step) return
    setDir(n > step ? 1 : -1)
    patch({ step: n })
  }

  const finish = () => {
    if (saving) return
    setSaving(true)
    const rep = commitJob(job, draft)
    const first = contactFirst(rental)
    window.setTimeout(() => {
      notify(
        rep.savedOffline
          ? { kind: 'offline', title: 'Salvo no aparelho', body: `O relatório para ${first} sai quando o sinal voltar.` }
          : { kind: 'whatsapp', title: `Relatório enviado para ${first}`, body: `${job.type} em ${rental.title}, com fotos e assinatura.` },
      )
      go(`/servico/${job.id}/concluido`, { dir: 1, replace: true })
    }, 650)
  }

  const StepComp = STEP_COMPONENTS[step]
  const last = step === steps.length - 1
  const eyebrow = `Etapa ${step + 1} de ${steps.length}`
  return { go, rental, patch, steps, step, dir, saving, setStep, finish, StepComp, last, eyebrow }
}

function Record({ job, draft }: { job: Job; draft: Draft }) {
  const offline = useDemo((s) => s.offline)
  const { go, rental, patch, steps, step, dir, saving, setStep, finish, StepComp, last, eyebrow } = useRecordFlow(job, draft)

  return (
    <Screen
      title={
        <div className="leading-tight">
          <div className="truncate text-[16px] font-bold">{rental.title}</div>
          <div className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-ink-3">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" /> {job.type} · <Elapsed job={job} />
          </div>
        </div>
      }
      back={{ label: 'Voltar ao serviço', onClick: () => go(`/servico/${job.id}`, { dir: -1 }) }}
      right={
        <span className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold', offline ? 'bg-black text-white' : 'bg-card text-ink shadow-pill')}>
          {offline ? <CloudOff className="size-4 text-brand" strokeWidth={2.2} /> : <CloudCheck className="size-4 text-green" strokeWidth={2.2} />}
          {offline ? 'No aparelho' : 'Salvo'}
        </span>
      }
      below={
        <>
          <ConnectivityBanner />
          <Stepper steps={steps} step={step} onStep={setStep} />
        </>
      }
      scrollKey={step}
      contentProps={{ style: { touchAction: 'pan-y' } }}
      footer={
        last ? (
          <Btn tone="primary" className="h-[58px] w-full text-[16.5px]" onClick={finish} disabled={saving}>
            {saving ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex size-5 rounded-full border-2 border-white/30 border-t-brand" />
            ) : (
              <Check className="size-5 text-brand" strokeWidth={2.6} />
            )}
            {saving ? 'Salvando' : 'Finalizar e enviar relatório'}
          </Btn>
        ) : (
          <div className="flex gap-2.5">
            {step > 0 && (
              <Pressable scale={0.92} onClick={() => setStep(step - 1)} aria-label="Etapa anterior" className="flex size-[58px] shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill">
                <ChevronLeft className="size-5" strokeWidth={2.2} />
              </Pressable>
            )}
            <Btn tone="primary" className="h-[58px] flex-1 text-[16.5px]" onClick={() => setStep(step + 1)}>
              Próximo: {steps[step + 1]} <ChevronRight className="size-5" />
            </Btn>
          </div>
        )
      }
    >
      <motion.div
        onPanEnd={(e, info) => {
          const target = e.target as HTMLElement | null
          if (target?.closest?.('[data-noswipe], input, textarea, canvas')) return
          if (Math.abs(info.offset.x) < 70 || Math.abs(info.offset.x) < Math.abs(info.offset.y) * 1.6) return
          setStep(info.offset.x < 0 ? step + 1 : step - 1)
        }}
        className="relative min-h-full"
      >
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? '-40%' : '40%', opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.34, ease: EASE_IOS }}
          >
            <StepComp job={job} rental={rental} draft={draft} patch={patch} eyebrow={eyebrow} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Screen>
  )
}

function Stepper({ steps, step, onStep }: { steps: string[]; step: number; onStep: (n: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 pt-1 pb-3">
      {steps.map((s, i) => {
        const on = i === step
        const done = i < step
        return (
          <motion.button
            key={s}
            layout
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            onClick={() => onStep(i)}
            aria-label={s}
            className={cn(
              'flex h-10 shrink-0 items-center justify-center rounded-full text-[13.5px] font-bold [-webkit-tap-highlight-color:transparent]',
              on ? 'gap-2 bg-black pr-3.5 pl-1.5 text-white' : done ? 'w-9 bg-brand text-white' : 'w-9 bg-card text-ink-3 shadow-pill',
            )}
          >
            {on ? (
              <>
                <span className="num flex size-7 items-center justify-center rounded-full bg-brand text-[12.5px] text-white">{i + 1}</span>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  {s}
                </motion.span>
              </>
            ) : done ? (
              <Check className="size-4" strokeWidth={3} />
            ) : (
              <span className="num">{i + 1}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
