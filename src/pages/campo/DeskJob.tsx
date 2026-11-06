// Serviço no computador: local à esquerda; andamento, contato e histórico à direita.
import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, ClipboardList, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, Card, IconCircle, RentalAvatar, TeamAvatar } from '@/components/ui'
import { TEAM, type Job } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { JOB_TYPE } from '@/lib/status'
import { useJob, useRentalHistory } from './data'
import { Btn, EASE_OUT } from './kit'
import { ContactCard, ItemsCard, JobHero, LastCard, OccAlert, scopeLabel, TodoCard, Tracker, useJobFlow } from './JobScreen'
import { ArrivalCard } from './ArrivalCard'
import { JobMenu } from './JobMenu'

/** Linha de título das subpáginas: voltar, título e ações */
export function DeskTitleRow({ onBack, backLabel, title, sub, right }: { onBack: () => void; backLabel: string; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pb-4">
      <button onClick={onBack} className="group inline-flex h-10 items-center gap-2 rounded-full bg-card pr-4 pl-3 text-[13.5px] font-semibold text-ink shadow-pill transition-colors hover:bg-surface active:scale-[.97]">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} /> {backLabel}
      </button>
      <div className="min-w-0 flex-1 pl-1">
        <div className="truncate text-[20px] leading-tight font-bold tracking-[-0.02em] text-ink">{title}</div>
        {sub && <div className="truncate text-[13px] font-medium text-ink-3">{sub}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

export function DeskJob() {
  const { id = '' } = useParams()
  const job = useJob(id)
  const nav = useNavigate()
  if (!job)
    return (
      <>
        <DeskTitleRow onBack={() => nav('/')} backLabel="Voltar" title="Serviço" />
        <Card className="p-8 text-[15px] font-medium text-ink-3">Serviço não encontrado.</Card>
      </>
    )
  return <DeskJobDetail job={job} />
}

function DeskJobDetail({ job }: { job: Job }) {
  const nav = useNavigate()
  const flow = useJobFlow(job)
  const { rental, client, team, b, zone, status, st, tp, openOcc, onPrimary, stage, primaryLabel, brandCta, PrimaryIcon, arrival, setArrival, startRecord, canArrival, arrivalStart } = flow
  const history = useRentalHistory(job, 4)

  return (
    <>
      <DeskTitleRow
        onBack={() => nav('/')}
        backLabel="Voltar"
        title={`${job.type} · ${rental.title}`}
        sub={
          <>
            <span className="num">{fmt.time(job.start)}</span> · {job.durationMin} min · {b.name} · {team.name}
          </>
        }
        right={
          <>
            <Badge tone={st.tone} dot className="h-8 px-3 text-[12.5px]">
              {st.label}
            </Badge>
            <JobMenu rentalId={rental.id} />
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]">
        {/* local */}
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="overflow-hidden p-2">
            <div className="relative h-[clamp(220px,30vh,320px)] overflow-hidden rounded-[18px]">
              <JobHero job={job} />
              {job.fixedTime && (
                <span className="absolute top-3 left-3 inline-flex h-8 items-center gap-1 rounded-full bg-black px-3 text-[12px] font-semibold text-white">
                  <Lock className="size-3" strokeWidth={2.4} /> Horário combinado
                </span>
              )}
              <span className={cn('absolute top-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/85 px-3 text-[12.5px] font-bold backdrop-blur-md', tp.text)}>
                <tp.icon className="size-3.5" strokeWidth={2.4} /> {job.type}
              </span>
            </div>
            <div className="px-4 pt-4 pb-3">
              <h2 className="text-[30px] leading-[1.05] font-bold tracking-[-0.035em] text-ink">{rental.title}</h2>
              <div className="mt-1.5 text-[14px] font-medium text-ink-3">
                {client.name} · {rental.code}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex h-10 items-center gap-2 rounded-full bg-surface pr-4 pl-1.5 text-[13.5px] font-semibold text-ink">
                  <span className="flex size-7 items-center justify-center rounded-full bg-card shadow-pill">
                    <ClipboardList className="size-3.5" strokeWidth={2} />
                  </span>
                  {scopeLabel(job)}
                </span>
                <span className="inline-flex h-10 items-center gap-2 rounded-full bg-surface pr-4 pl-1.5 text-[13.5px] font-semibold text-ink">
                  <TeamAvatar teamId={team.id} size={28} />
                  {team.name} · {team.truck}
                </span>
                <span className="inline-flex h-10 items-center gap-2 rounded-full bg-surface pr-4 pl-3.5 text-[13.5px] font-semibold text-ink">
                  <span className="size-2 rounded-full" style={{ background: zone.hex }} />
                  {zone.name}
                </span>
              </div>
            </div>
          </Card>

          <OccAlert openOcc={openOcc} className="rounded-[24px]" />
          <TodoCard job={job} flow={flow} className="rounded-[24px]" />
          <ItemsCard job={job} className="rounded-[24px]" />
        </div>

        {/* andamento, contato e histórico */}
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Andamento</h3>
              <span className="text-[13px] font-semibold text-ink-3">{status === 'concluido' ? 'Concluído' : <span className="num">{fmt.time(job.start)}</span>}</span>
            </div>
            <Tracker stage={stage} />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={primaryLabel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
                <Btn tone={brandCta ? 'brand' : 'primary'} className="h-12 w-full text-[15px]" onClick={onPrimary}>
                  <PrimaryIcon className={cn('size-[18px]', !brandCta && status !== 'concluido' && 'text-brand')} />
                  {primaryLabel}
                </Btn>
              </motion.div>
            </AnimatePresence>
            {canArrival && (
              <button onClick={() => setArrival(true)} className="group mt-2.5 flex w-full items-center gap-3 rounded-[20px] bg-black p-2 pr-2.5 text-left text-white transition-colors hover:bg-black-2">
                <RentalAvatar rental={rental} size={40} className="ring-2 ring-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold">Ver cartão de chegada</span>
                  <span className="block truncate text-[12.5px] font-medium text-white/55">Acesso, contato e o que fazer</span>
                </span>
                <span className="flex size-9 items-center justify-center rounded-full bg-brand text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight className="size-4" strokeWidth={2.2} />
                </span>
              </button>
            )}
            {status === 'concluido' && (
              <button onClick={onPrimary} className="mt-3 flex w-full items-center gap-3 rounded-[18px] bg-brand-soft px-4 py-3 text-left transition-colors hover:bg-brand/20">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand text-white">
                  <Check className="size-4" strokeWidth={2.6} />
                </span>
                <span className="flex-1 text-[14px] font-semibold text-ink">Registrado e enviado ao cliente</span>
                <ChevronRight className="size-4 text-ink-3" />
              </button>
            )}
          </Card>

          <ContactCard flow={flow} desk className="rounded-[24px]" />
          <LastCard flow={flow} className="rounded-[24px]" />

          {history.length > 0 && (
            <Card className="p-2">
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">Histórico do local</span>
                <button onClick={() => nav(`/locacoes/${rental.id}`)} className="text-[13px] font-semibold text-ink-3 hover:text-ink">
                  Ver locação
                </button>
              </div>
              {history.map(({ job: j, report }, i) => {
                const t = JOB_TYPE[j.type]
                return (
                  <div key={j.id}>
                    {i > 0 && <div className="mr-3 ml-[62px] h-px bg-line" />}
                    <button onClick={() => nav(`/relatorio/${rental.id}?s=${j.id}`)} className="flex w-full items-start gap-3 rounded-[18px] px-3 py-3 text-left hover:bg-surface">
                      <IconCircle size={38} className={cn(t.soft, t.text)}>
                        <t.icon className="size-4" strokeWidth={2} />
                      </IconCircle>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[14.5px] font-bold text-ink">
                            {j.type} · {TEAM[j.teamId].short}
                          </span>
                          <span className="shrink-0 text-[12.5px] font-medium text-ink-3">{relDays(report.finishedAt)}</span>
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug font-medium text-ink-3">{report.summary}</div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      </div>
      <ArrivalCard job={job} open={arrival} onOpenChange={setArrival} onStart={startRecord} startLabel={arrivalStart} />
    </>
  )
}
