import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, IconButton, Segmented, TeamAvatar } from '@/components/ui'
import { DayTimeline } from '@/components/agenda/DayTimeline'
import { ScheduleDialog, type NewJobDraft } from '@/components/agenda/ScheduleDialog'
import { WeekGrid } from '@/components/agenda/WeekGrid'
import { TypeFilter } from '@/components/agenda/shared'
import { cap, dayLabel, dowOf, fillerJobs, hhmm, mondayOffset, toAJob, type AJob, type Suggestion } from '@/components/agenda/model'
import { RENTAL, TEAM, TEAMS, type JobType } from '@/data/mock'
import { day, fmt, iso } from '@/data/time'
import { JOB_TYPES } from '@/lib/status'
import { useDemo, useJobs } from '@/store'
import { cn } from '@/lib/utils'

type View = 'semana' | 'dia'

export default function Agenda() {
  const [view, setView] = React.useState<View>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'dia' : 'semana'))
  const [weekShift, setWeekShift] = React.useState(0)
  const [dayOff, setDayOff] = React.useState(0)
  const [teamId, setTeamId] = React.useState<string>('todas')
  const [types, setTypes] = React.useState<JobType[]>(JOB_TYPES)
  const [open, setOpen] = React.useState(false)
  const [initialRental, setInitialRental] = React.useState<string | null>(null)
  const [freshId, setFreshId] = React.useState<string | null>(null)
  const addJob = useDemo((s) => s.addJob)
  const jobs = useJobs()
  const [params, setParams] = useSearchParams()

  // o botão "Novo serviço" do topo chega aqui com ?novo=1 (e opcionalmente &locacao=<id>)
  React.useEffect(() => {
    if (params.get('novo')) {
      const loc = params.get('locacao')
      setInitialRental(loc && RENTAL[loc] ? loc : null)
      setOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const all = React.useMemo(() => {
    const real = jobs.map(toAJob)
    return [...real, ...fillerJobs(real)]
  }, [jobs])
  const shown = React.useMemo(() => all.filter((j) => types.includes(j.type)), [all, types])
  const teams = teamId === 'todas' ? TEAMS : TEAMS.filter((t) => t.id === teamId)

  const monday = mondayOffset(weekShift)
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => monday + i)
  const first = day(days[0])
  const last = day(days[6])
  const weekLabel =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()} a ${last.getDate()} de ${last.toLocaleDateString('pt-BR', { month: 'long' })}`
      : `${fmt.short(first)} a ${fmt.short(last)}`

  const weekCounts = React.useMemo(() => {
    const out: Partial<Record<JobType, number>> = {}
    const range = view === 'semana' ? days : [dayOff]
    for (const j of all) if (range.includes(j.off) && teams.some((t) => t.id === j.teamId)) out[j.type] = (out[j.type] ?? 0) + 1
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, view, weekShift, dayOff, teamId])

  const step = (dir: 1 | -1) => {
    if (view === 'semana') return setWeekShift((w) => w + dir)
    const o = dayOff + dir
    setDayOff(o)
    setWeekShift(Math.floor((o - mondayOffset(0)) / 7))
  }
  const goToday = () => {
    setWeekShift(0)
    setDayOff(0)
  }
  const openDay = (o: number) => {
    setDayOff(o)
    setView('dia')
  }
  const toggleType = (t: JobType) => setTypes((ts) => (ts.includes(t) ? (ts.length === 1 ? JOB_TYPES : ts.filter((x) => x !== t)) : [...ts, t]))

  const confirm = (d: NewJobDraft, s: Suggestion) => {
    const id = `n-${Date.now().toString(36)}`
    addJob({
      id,
      rentalId: d.rentalId,
      teamId: s.teamId,
      start: iso(s.off, hhmm(s.startMin)),
      durationMin: d.dur,
      type: d.type,
      note: d.note,
      status: 'agendado',
      fixedTime: false,
      units: d.units,
    })
    setOpen(false)
    if (!types.includes(d.type)) setTypes((ts) => [...ts, d.type])
    setWeekShift(Math.floor((s.off - mondayOffset(0)) / 7))
    setDayOff(s.off)
    setFreshId(id)
    window.setTimeout(() => setFreshId(null), 5000)
    toast.success(`${d.type} agendada: ${dayLabel(s.off)} às ${hhmm(s.startMin)}`, { description: `${TEAM[s.teamId].name} em ${RENTAL[d.rentalId].title}. A equipe recebe no app.` })
  }

  const title = view === 'semana' ? weekLabel : cap(fmt.long(day(dayOff)))

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 md:pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">Agenda</h1>
        <Button variant="primary" size="lg" onClick={() => { setInitialRental(null); setOpen(true) }} className="hidden sm:inline-flex">
          <Plus size={17} strokeWidth={2.2} />
          Novo serviço
        </Button>
        <Button variant="primary" size="md" onClick={() => { setInitialRental(null); setOpen(true) }} className="sm:hidden">
          <Plus size={16} strokeWidth={2.2} />
          Novo
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full bg-card px-4 text-[13.5px] font-semibold text-ink shadow-pill">
          <CalendarDays size={16} strokeWidth={2} className="shrink-0 text-ink-2" />
          <span className="truncate num">{title}</span>
        </div>
        <IconButton size={40} onClick={() => step(-1)} aria-label="Anterior">
          <ArrowLeft size={16} strokeWidth={2} />
        </IconButton>
        <IconButton size={40} onClick={() => step(1)} aria-label="Próximo">
          <ArrowRight size={16} strokeWidth={2} />
        </IconButton>
        <Button variant="outline" onClick={goToday}>
          Hoje
        </Button>
        <Segmented<View>
          value={view}
          onChange={setView}
          size="md"
          options={[
            { value: 'semana', label: 'Semana' },
            { value: 'dia', label: 'Dia' },
          ]}
        />
        <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto md:ml-auto">
          <TeamChip active={teamId === 'todas'} onClick={() => setTeamId('todas')}>
            Todas
          </TeamChip>
          {TEAMS.map((t) => (
            <TeamChip key={t.id} active={teamId === t.id} onClick={() => setTeamId(t.id)} avatar={<TeamAvatar teamId={t.id} size={28} />}>
              {t.short}
            </TeamChip>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <TypeFilter value={types} onToggle={toggleType} counts={weekCounts} />
      </div>

      {view === 'semana' ? (
        <WeekGrid days={days} teams={teams} all={shown} freshId={freshId} onOpenDay={openDay} />
      ) : (
        <>
          {dowOf(dayOff) === 7 && shown.every((j) => j.off !== dayOff) && <p className="mb-2 px-1 text-[12.5px] font-medium text-ink-3">Domingo: só plantões de evento.</p>}
          <DayTimeline off={dayOff} teams={teams} all={shown} freshId={freshId} />
        </>
      )}

      <ScheduleDialog open={open} onOpenChange={setOpen} all={all} initialRental={initialRental} onConfirm={confirm} />
    </div>
  )
}

function TeamChip({ active, onClick, avatar, children }: { active: boolean; onClick: () => void; avatar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('inline-flex h-10 shrink-0 items-center gap-2 rounded-full pr-4 text-[13px] font-semibold transition-colors', avatar ? 'pl-1.5' : 'pl-4', active ? 'bg-black text-white' : 'bg-card text-ink-2 shadow-pill hover:text-ink')}
    >
      {avatar}
      {children}
    </button>
  )
}
