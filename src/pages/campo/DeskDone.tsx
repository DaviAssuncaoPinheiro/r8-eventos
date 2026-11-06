// Serviço concluído no computador: resumo em grade de cartões e relatório do cliente.
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Card } from '@/components/ui'
import { RENTAL } from '@/data/mock'
import { useDemo } from '@/store'
import { contactFirst, doneTitle } from './data'
import { EASE_OUT } from './kit'
import { useGo } from './nav'
import { ReportCard } from './ReportCard'
import { AnimatedCheck, durationOf, NextJobCard, SendStatus, SignOffCard, StatCards, useDoneReport } from './DoneScreen'
import { DeskTitleRow } from './DeskJob'

export function DeskDone() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const go = useGo()
  const { job, rep } = useDoneReport(id)
  const offline = useDemo((s) => s.offline)

  if (!job || !rep)
    return (
      <>
        <DeskTitleRow onBack={() => nav('/')} backLabel="Voltar" title="Serviço" />
        <Card className="p-8 text-[15px] font-medium text-ink-3">Este serviço ainda não foi registrado.</Card>
      </>
    )

  const r = RENTAL[job.rentalId]
  const pending = !!rep.savedOffline && offline

  return (
    <>
      <DeskTitleRow onBack={() => nav('/')} backLabel="Painel" title="Resumo do serviço" sub={`${r.title} · ${job.type}`} />

      <Card className="flex flex-wrap items-center gap-5 p-5">
        <AnimatedCheck className="mx-0 size-[72px] shrink-0" />
        <div className="min-w-0 flex-1">
          <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35, ease: EASE_OUT }} className="text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink">
            {doneTitle(job)}
          </motion.h2>
          <p className="mt-0.5 text-[14px] font-medium text-ink-3">
            {r.title} · {durationOf(rep)} min
          </p>
        </div>
        <SendStatus pending={pending} first={contactFirst(r)} className="w-full lg:w-[360px]" />
      </Card>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT }} className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <StatCards job={job} rep={rep} className="gap-3 xl:grid-cols-4" delay={0.3} />
          <SignOffCard rep={rep} />
          <NextJobCard job={job} onOpen={(nid) => go(`/servico/${nid}`, { dir: 1 })} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <ReportCard job={job} rep={rep} delay={0.35} />
        </div>
      </motion.div>
    </>
  )
}
