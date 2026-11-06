// Tela final · resumo do serviço concluído
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Camera, Check, CheckCheck, ClipboardCheck, Clock, CloudOff, House, MessageCircle, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TeamAvatar } from '@/components/ui'
import { RENTAL, type Job } from '@/data/mock'
import { fmt } from '@/data/time'
import { jobReport } from '@/lib/history'
import { JOB_TYPE, OCC_KIND } from '@/lib/status'
import { useDemo, type ServiceReport } from '@/store'
import { contactFirst, doneTitle, useJob, useNextJob } from './data'
import { clientMessage } from './finalize'
import { Btn, EASE_OUT, Pressable, RoundBtn, Screen } from './kit'
import { useGo } from './nav'
import { ReportCard, useReportPhotos } from './ReportCard'

export function AnimatedCheck({ className }: { className?: string }) {
  return (
    <div className={cn('relative mx-auto size-[104px]', className)}>
      <motion.span className="absolute inset-0 rounded-full bg-brand" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.45, 1.3], opacity: [0, 0.6, 0] }} transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.35 }} />
      <svg viewBox="0 0 104 104" className="relative size-full">
        <motion.circle cx="52" cy="52" r="50" fill="var(--color-brand)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }} style={{ transformOrigin: '52px 52px' }} />
        <motion.path d="M32 53 L 46 67 L 73 39" fill="none" stroke="#fff" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.35 }} />
      </svg>
    </div>
  )
}

/** Registro do serviço: o salvo pelo app ou o histórico */
export function useDoneReport(id: string) {
  const job = useJob(id)
  const stored = useDemo((s) => s.reports[id])
  const rep = job ? jobReport(job, stored) : null
  return { job, rep }
}

export const durationOf = (rep: ServiceReport) => Math.max(1, Math.round((+new Date(rep.finishedAt) - +new Date(rep.startedAt)) / 60000))

/** Faixa de envio do relatório ao cliente */
export function SendStatus({ pending, first, className }: { pending: boolean; first: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-[24px] px-4 py-3.5', pending ? 'bg-black text-white' : 'bg-green-soft', className)}>
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', pending ? 'bg-white/10 text-brand' : 'bg-green text-white')}>
        {pending ? <CloudOff className="size-[18px]" /> : <MessageCircle className="size-[18px]" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('text-[15px] font-bold', pending ? 'text-white' : 'text-ink')}>{pending ? 'Relatório na fila' : `Relatório enviado para ${first}`}</div>
        <div className={cn('text-[13px] font-medium', pending ? 'text-white/55' : 'text-ink-2')}>{pending ? 'Sai quando o sinal voltar' : 'Fotos, checklist e assinatura'}</div>
      </div>
      {!pending && <Check className="size-5 text-green" strokeWidth={2.6} />}
    </div>
  )
}

export function StatCards({ job, rep, className, delay = 0.7 }: { job: Job; rep: ServiceReport; className?: string; delay?: number }) {
  const photos = useReportPhotos(job, rep)
  const okChecks = rep.checklist.filter((c) => c.ok).length
  const okUnits = rep.units.filter((u) => u.ok).length
  const itemsDone = rep.items?.reduce((a, i) => a + i.done, 0) ?? 0
  const itemsPlanned = rep.items?.reduce((a, i) => a + i.planned, 0) ?? 0
  const stats = [
    { icon: Clock, label: 'Duração', value: `${durationOf(rep)} min`, sub: `${fmt.time(rep.startedAt)} às ${fmt.time(rep.finishedAt)}` },
    rep.items
      ? { icon: ClipboardCheck, label: 'Conferência', value: itemsDone.toLocaleString('pt-BR'), sub: itemsDone === itemsPlanned ? 'Tudo confere' : `de ${itemsPlanned.toLocaleString('pt-BR')} previstos` }
      : { icon: ClipboardCheck, label: job.type === 'Manutenção' ? 'Unidade' : 'Unidades', value: rep.units.length ? `${okUnits}/${rep.units.length}` : String(job.units), sub: job.type === 'Limpeza' ? 'higienizadas' : 'atendidas' },
    { icon: CheckCheck, label: 'Checklist', value: `${okChecks}/${rep.checklist.length}`, sub: okChecks === rep.checklist.length ? 'Completo' : 'Com pendência' },
    { icon: Camera, label: 'Fotos', value: String(photos.length), sub: rep.occurrences.length ? `${rep.occurrences.length} ${rep.occurrences.length === 1 ? 'ocorrência' : 'ocorrências'}` : 'Sem ocorrências' },
  ]
  return (
    <div className={cn('grid grid-cols-2 gap-2.5', className)}>
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + i * 0.06, duration: 0.3, ease: EASE_OUT }} className="min-w-0 rounded-[24px] bg-card p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-ink">
              <s.icon className="size-4" strokeWidth={2} />
            </span>
            <span className="text-[13px] font-semibold text-ink-3">{s.label}</span>
          </div>
          <div className="num mt-3 text-[26px] leading-none font-bold tracking-[-0.03em] text-ink">{s.value}</div>
          <div className="mt-1 truncate text-[12.5px] font-medium text-ink-3">{s.sub}</div>
        </motion.div>
      ))}
    </div>
  )
}

/** Assinatura e ocorrências */
export function SignOffCard({ rep, className }: { rep: ServiceReport; className?: string }) {
  return (
    <div className={cn('rounded-[24px] bg-card p-4 shadow-card', className)}>
      <div className="text-[13px] font-semibold text-ink-3">Assinatura</div>
      {rep.signature ? (
        <div className="mt-2 rounded-[18px] bg-surface p-2">
          <img src={rep.signature} alt={`Assinatura de ${rep.signedBy ?? 'responsável'}`} className="h-[84px] w-full object-contain" />
        </div>
      ) : (
        <div className="mt-2 rounded-[18px] bg-surface px-3.5 py-3 text-[13.5px] font-medium text-ink-3">Conferido no local, sem assinatura desenhada.</div>
      )}
      <div className="mt-2 text-[14.5px] font-bold text-ink">{rep.signedBy ?? 'Responsável no local'}</div>
      {rep.signedRole && <div className="text-[12.5px] font-medium text-ink-3">{rep.signedRole}</div>}
      {rep.occurrences.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
          {rep.occurrences.map((o, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <TriangleAlert className="size-3.5 shrink-0 text-red" strokeWidth={2.4} />
              <span className="truncate">
                {o.unitId && <span className="num">{o.unitId} · </span>}
                {OCC_KIND[o.kind].label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Prévia da mensagem enviada ao cliente */
export function WhatsAppPreview({ job, rep, className }: { job: Job; rep: ServiceReport; className?: string }) {
  const r = RENTAL[job.rentalId]
  const text = clientMessage(job, rep)
  const parts = text.split(/(\*[^*]+\*)/g)
  return (
    <div className={cn('rounded-[24px] bg-[#e9e3da] p-3', className)}>
      <div className="flex items-center gap-2 px-1 pb-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">{contactFirst(r)[0]}</span>
        <span className="text-[13px] font-bold text-ink">{r.contact.name}</span>
        <span className="ml-auto text-[11.5px] font-semibold text-ink-3">WhatsApp</span>
      </div>
      <div className="ml-auto max-w-[92%] rounded-[16px] rounded-tr-[4px] bg-[#d9fdd3] px-3 py-2 text-[13px] leading-snug font-medium whitespace-pre-line text-ink shadow-[0_1px_0_rgba(0,0,0,.06)]">
        {parts.map((p, i) => (p.startsWith('*') ? <b key={i}>{p.slice(1, -1)}</b> : <span key={i} className="break-words">{p}</span>))}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10.5px] font-semibold text-ink-3">
          <span className="num">{fmt.time(rep.finishedAt)}</span>
          <CheckCheck className="size-3.5 text-blue" strokeWidth={2.4} />
        </div>
      </div>
    </div>
  )
}

/** Próximo serviço da equipe hoje */
export function NextJobCard({ job, className, onOpen }: { job: Job; className?: string; onOpen: (id: string) => void }) {
  const next = useNextJob(job)
  if (!next) return null
  const r = RENTAL[next.rentalId]
  const tp = JOB_TYPE[next.type]
  return (
    <Pressable scale={0.985} onClick={() => onOpen(next.id)} className={cn('flex w-full items-center gap-3 rounded-[24px] bg-card p-3 pr-3.5 text-left shadow-card', className)}>
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', tp.soft, tp.text)}>
        <tp.icon className="size-5" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold text-ink-3">
          Próximo serviço · <span className="num">{fmt.time(next.start)}</span>
        </span>
        <span className="block truncate text-[15px] font-bold text-ink">{r.title}</span>
        <span className="block truncate text-[12.5px] font-medium text-ink-3">{next.type}, {next.note.toLowerCase()}</span>
      </span>
      <TeamAvatar teamId={next.teamId} size={30} />
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <ArrowRight className="size-4 text-brand" strokeWidth={2.4} />
      </span>
    </Pressable>
  )
}

export default function DoneScreen() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const go = useGo()
  const { job, rep } = useDoneReport(id)
  const offline = useDemo((s) => s.offline)

  if (!job || !rep) {
    return (
      <Screen title="Serviço" back={{ label: 'Voltar', onClick: () => nav('/') }}>
        <p className="p-6 text-[15px] font-medium text-ink-3">Este serviço ainda não foi registrado.</p>
      </Screen>
    )
  }
  const r = RENTAL[job.rentalId]
  const pending = !!rep.savedOffline && offline

  return (
    <Screen
      title=""
      right={
        <RoundBtn label="Fechar" onClick={() => nav('/')}>
          <X className="size-[18px]" strokeWidth={2.2} />
        </RoundBtn>
      }
      footer={
        <Btn className="h-[58px] w-full text-[16.5px]" onClick={() => nav('/')}>
          <House className="size-[18px] text-brand" /> Voltar ao painel
        </Btn>
      }
    >
      <div className="px-5 text-center">
        <AnimatedCheck />
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4, ease: EASE_OUT }} className="mt-5 text-[30px] leading-tight font-bold tracking-[-0.035em] text-ink">
          {doneTitle(job)}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-1 text-[14.5px] font-medium text-ink-3">
          {r.title} · {durationOf(rep)} min
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.45, ease: EASE_OUT }}>
        <SendStatus pending={pending} first={contactFirst(r)} className="mx-4 mt-6" />
        <NextJobCard job={job} className="mx-4 mt-2.5" onOpen={(nid) => go(`/servico/${nid}`, { dir: 1 })} />
        <ReportCard job={job} rep={rep} className="mx-4 mt-2.5" />
        <StatCards job={job} rep={rep} className="mx-4 mt-2.5" />
        <WhatsAppPreview job={job} rep={rep} className="mx-4 mt-2.5" />
        <SignOffCard rep={rep} className="mx-4 mt-2.5" />
      </motion.div>
    </Screen>
  )
}
