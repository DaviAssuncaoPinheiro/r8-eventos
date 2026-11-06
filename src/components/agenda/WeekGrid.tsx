import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { TeamAvatar, Tip } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { CLIENT, RENTAL, type Team } from '@/data/mock'
import { day, fmt } from '@/data/time'
import { JOB_TYPE } from '@/lib/status'
import { cn } from '@/lib/utils'
import { NOW_MIN, cap, hhmm, hm, jobsOf, loadOf, siteName, typeInk, zonesOfDay, type AJob } from './model'
import { CapacityBar, InnerBadge, zoneTint } from './shared'

export function jobBadge(v: AJob) {
  if (v.status === 'concluido') return 'Concluído'
  if (v.status === 'em-andamento') return 'Agora'
  if (v.status === 'a-caminho') return 'A caminho'
  if (v.origin === 'novo') return 'Novo'
  if (v.fixed) return 'Fixo'
  return null
}

export function JobTip({ v, canOpen }: { v: AJob; canOpen?: boolean }) {
  const r = RENTAL[v.rentalId]
  return (
    <div className="space-y-0.5">
      <div className="font-semibold">
        {r.title} · {CLIENT[r.clientId].name}
      </div>
      <div className="opacity-80">
        {hhmm(v.startMin)} às {hhmm(v.startMin + v.dur)} · {v.type}
      </div>
      <div className="opacity-80">{v.note}</div>
      <div className="opacity-80">
        {BAIRRO[v.bairro].name} · {ZONE[BAIRRO[v.bairro].zone].short}
      </div>
      {canOpen && <div className="font-semibold">Clique para abrir no app da equipe</div>}
    </div>
  )
}

export function JobBlock({ v, onOpen, fresh, past }: { v: AJob; onOpen: () => void; fresh?: boolean; past?: boolean }) {
  const navigate = useNavigate()
  const badge = jobBadge(v)
  const canOpen = v.origin !== 'gerada'
  const t = JOB_TYPE[v.type]
  return (
    <Tip side="top" content={<JobTip v={v} canOpen={canOpen} />}>
      <motion.button
        layout="position"
        initial={fresh ? { opacity: 0, scale: 0.92, y: -6 } : false}
        animate={{ opacity: past ? 0.62 : 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={canOpen ? () => navigate(`/campo/servico/${v.id}`) : onOpen}
        className={cn('flex w-full flex-col gap-1 rounded-[14px] px-2.5 py-2 text-left transition-[filter,box-shadow] hover:brightness-95', fresh && 'ring-2 ring-black ring-offset-2 ring-offset-card')}
        style={{ background: t.color, color: typeInk(v.type) }}
      >
        <span className="flex items-center gap-1.5 text-[12.5px] leading-tight font-bold">
          <span className="truncate">{siteName(v.rentalId)}</span>
          <span className="ml-auto shrink-0 text-[11px] font-semibold opacity-85 num">{hhmm(v.startMin)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium opacity-85">{BAIRRO[v.bairro].name}</span>
          {badge && <InnerBadge>{badge}</InnerBadge>}
        </span>
      </motion.button>
    </Tip>
  )
}

const COL_MIN = 146

export function WeekGrid({ days, teams, all, freshId, onOpenDay }: { days: number[]; teams: Team[]; all: AJob[]; freshId: string | null; onOpenDay: (off: number) => void }) {
  const template = `var(--wk-left) repeat(${days.length}, minmax(${COL_MIN}px,1fr))`
  const todayIdx = days.indexOf(0)
  return (
    <div className="no-scrollbar overflow-x-auto rounded-[28px] bg-surface p-2">
      <div className="relative [--wk-left:112px] lg:[--wk-left:132px]" style={{ minWidth: `calc(var(--wk-left) + ${days.length * (COL_MIN + 6)}px)` }}>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: template }}>
          {/* cabeçalho */}
          <div className="sticky left-0 z-20 flex items-end rounded-[16px] bg-surface px-3 pb-1 text-[12.5px] font-semibold text-ink-3">Equipe</div>
          {days.map((off) => {
            const d = day(off)
            const today = off === 0
            const dayJobs = teams.flatMap((t) => jobsOf(all, t.id, off))
            const idle = dayJobs.length === 0 && teams.every((t) => zonesOfDay([], t.id, off).length === 0)
            return (
              <button
                key={off}
                onClick={() => onOpenDay(off)}
                className={cn(
                  'flex h-11 flex-col items-center justify-center rounded-[14px] leading-tight transition-colors',
                  today ? 'bg-blue text-white shadow-pill' : idle ? 'bg-muted-2 text-ink-3' : 'bg-card text-ink-2 shadow-pill hover:text-ink',
                )}
              >
                <span className="text-[12.5px] font-semibold">
                  {cap(fmt.weekdayShort(d))} <span className="num font-bold">{d.getDate()}</span>
                </span>
                {dayJobs.length > 0 && (
                  <span className={cn('num text-[10.5px] font-semibold', today ? 'text-white/75' : 'text-ink-3')}>
                    {dayJobs.length} {dayJobs.length === 1 ? 'serviço' : 'serviços'} · {hm(dayJobs.reduce((a, j) => a + j.dur, 0))}
                  </span>
                )}
              </button>
            )
          })}

          {teams.map((team) => (
            <Row key={team.id} team={team} days={days} all={all} freshId={freshId} onOpenDay={onOpenDay} />
          ))}
        </div>

        {/* linha de agora */}
        {todayIdx >= 0 && (
          <div className="pointer-events-none absolute inset-y-0 z-[6] grid gap-1.5" style={{ gridTemplateColumns: template, left: 0, right: 0 }}>
            <div style={{ gridColumn: todayIdx + 2 }} className="flex justify-center pt-12">
              <div className="h-full border-l-2 border-dashed border-blue" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ team, days, all, freshId, onOpenDay }: { team: Team; days: number[]; all: AJob[]; freshId: string | null; onOpenDay: (off: number) => void }) {
  return (
    <>
      <div className="sticky left-0 z-20 flex flex-col gap-2 self-stretch rounded-[18px] bg-card p-3 shadow-card">
        <TeamAvatar teamId={team.id} size={36} />
        <div className="leading-tight">
          <div className="text-[13.5px] font-bold text-ink">{team.name}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-3">{team.truck.split(' · ')[1] ?? team.truck}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-ink-4 num">{team.plate}</div>
        </div>
      </div>
      {days.map((off) => {
        const list = jobsOf(all, team.id, off)
        const zones = zonesOfDay(list, team.id, off)
        const load = loadOf(list)
        const today = off === 0
        const past = off < 0
        if (!list.length && !zones.length) {
          return (
            <div key={off} className="hatch flex min-h-[132px] items-center justify-center rounded-[18px]">
              <span className="rounded-full bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-ink-3">Sem escala</span>
            </div>
          )
        }
        return (
          <div key={off} className="flex min-h-[132px] flex-col rounded-[18px] bg-card p-1.5 shadow-card">
            <div className="flex flex-wrap gap-1 px-0.5 pb-1.5">
              {zones.map((z) => (
                <span key={z} className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10.5px] font-bold text-ink" style={{ background: zoneTint(z, 22) }}>
                  <span className="size-1.5 rounded-full" style={{ background: ZONE[z].hex }} />
                  {ZONE[z].short}
                </span>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {list.length === 0 && <div className="m-auto py-3 text-center text-[11.5px] font-medium text-ink-4">Livre</div>}
              {list.map((v) => (
                <JobBlock key={v.id} v={v} fresh={v.id === freshId} past={past || (today && v.startMin + v.dur < NOW_MIN)} onOpen={() => onOpenDay(off)} />
              ))}
            </div>
            {list.length > 0 && (
              <div className="px-1 pt-2 pb-0.5">
                <div className="mb-1.5 flex items-baseline justify-between gap-1 text-[10.5px] font-medium text-ink-3 num">
                  <span className="font-bold text-ink-2">
                    {load.count} {load.count === 1 ? 'serviço' : 'serviços'}
                  </span>
                  <span>{hm(load.service)}</span>
                </div>
                <CapacityBar ratio={load.ratio} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
