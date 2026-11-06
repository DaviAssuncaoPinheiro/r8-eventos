import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { TeamAvatar, Tip } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { RENTAL, type Team } from '@/data/mock'
import { JOB_TYPE } from '@/lib/status'
import { cn } from '@/lib/utils'
import { DAY_END, DAY_START, NOW_MIN, hhmm, hm, jobsOf, loadOf, typeInk, zonesOfDay, type AJob } from './model'
import { CapacityBar, InnerBadge, zoneTint } from './shared'
import { JobTip, jobBadge } from './WeekGrid'

const HPX = 64
const y = (min: number) => ((min - DAY_START) / 60) * HPX
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i)
const GUTTER = 52

export function DayTimeline({ off, teams, all, freshId }: { off: number; teams: Team[]; all: AJob[]; freshId: string | null }) {
  const total = y(DAY_END)
  const template = `${GUTTER}px repeat(${teams.length}, minmax(240px,1fr))`
  return (
    <div className="no-scrollbar overflow-x-auto rounded-[28px] bg-surface p-2">
      <div className="relative" style={{ minWidth: GUTTER + teams.length * 248 }}>
        <div className="grid gap-2" style={{ gridTemplateColumns: template }}>
          <div />
          {teams.map((team) => {
            const list = jobsOf(all, team.id, off)
            const zones = zonesOfDay(list, team.id, off)
            const load = loadOf(list)
            return (
              <div key={team.id} className="rounded-[20px] bg-card p-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <TeamAvatar teamId={team.id} size={34} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[13.5px] font-bold text-ink">{team.name}</div>
                    <div className="text-[11.5px] text-ink-3 num">
                      {load.count} {load.count === 1 ? 'serviço' : 'serviços'} · {hm(load.service)} · {team.plate}
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {zones.length ? (
                    zones.map((z) => (
                      <span key={z} className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10.5px] font-bold text-ink" style={{ background: zoneTint(z, 22) }}>
                        <span className="size-1.5 rounded-full" style={{ background: ZONE[z].hex }} />
                        {ZONE[z].short}
                      </span>
                    ))
                  ) : (
                    <span className="hatch inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold text-ink-3">Sem escala</span>
                  )}
                </div>
                <CapacityBar ratio={load.ratio} className="mt-2.5" />
              </div>
            )
          })}

          {/* horas */}
          <div className="relative" style={{ height: total }}>
            {HOURS.slice(0, -1).map((h) => (
              <div key={h} className="absolute right-1 -translate-y-1/2 text-[11px] font-semibold text-ink-3 num" style={{ top: y(h * 60) + (h === DAY_START / 60 ? 8 : 0) }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
            {off === 0 && (
              <span className="absolute right-0 z-10 -translate-y-1/2 rounded-full bg-blue px-1.5 py-0.5 text-[10.5px] font-bold text-white num" style={{ top: y(NOW_MIN) }}>
                {hhmm(NOW_MIN)}
              </span>
            )}
          </div>

          {teams.map((team) => (
            <Column key={team.id} off={off} teamId={team.id} all={all} freshId={freshId} total={total} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Column({ off, teamId, all, freshId, total }: { off: number; teamId: string; all: AJob[]; freshId: string | null; total: number }) {
  const list = jobsOf(all, teamId, off)
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-card shadow-card" style={{ height: total }}>
      {HOURS.map((h) => (
        <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: y(h * 60) }} />
      ))}
      {/* almoço */}
      <div className="hatch absolute inset-x-2 flex items-center justify-center rounded-[12px]" style={{ top: y(12 * 60) + 2, height: y(13 * 60) - y(12 * 60) - 4 }}>
        <span className="rounded-full bg-card/90 px-2.5 py-0.5 text-[11px] font-semibold text-ink-3">Almoço</span>
      </div>

      {list.map((v) => (
        <TimeBlock key={v.id} v={v} fresh={v.id === freshId} past={off < 0 || (off === 0 && v.startMin + v.dur <= NOW_MIN)} />
      ))}

      {off === 0 && <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-blue" style={{ top: y(NOW_MIN) }} />}
    </div>
  )
}

function TimeBlock({ v, fresh, past }: { v: AJob; fresh: boolean; past: boolean }) {
  const navigate = useNavigate()
  const t = JOB_TYPE[v.type]
  const h = Math.max((v.dur / 60) * HPX - 2, 24)
  const roomy = h >= 66
  const badge = jobBadge(v)
  const canOpen = v.origin !== 'gerada'
  return (
    <Tip side="top" content={<JobTip v={v} canOpen={canOpen} />}>
      <motion.div
        initial={fresh ? { opacity: 0, scale: 0.94, y: -8 } : { opacity: 0, y: 4 }}
        animate={{ opacity: past ? 0.62 : 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={canOpen ? () => navigate(`/campo/servico/${v.id}`) : undefined}
        className={cn('absolute inset-x-2 z-[5] overflow-hidden rounded-[14px] px-3 py-1.5', canOpen && 'cursor-pointer hover:brightness-95', fresh && 'ring-2 ring-black ring-offset-2 ring-offset-card')}
        style={{ top: y(v.startMin) + 1, height: h, background: t.color, color: typeInk(v.type) }}
      >
        <div className="flex items-center gap-1.5">
          <t.icon className="size-3.5 shrink-0 opacity-85" strokeWidth={2.4} />
          <span className="truncate text-[13px] font-bold">{RENTAL[v.rentalId].title}</span>
          {badge && (
            <span className="ml-auto">
              <InnerBadge>{badge}</InnerBadge>
            </span>
          )}
        </div>
        {h >= 40 && (
          <div className="mt-0.5 truncate text-[11px] font-medium opacity-85 num">
            {hhmm(v.startMin)} às {hhmm(v.startMin + v.dur)} · {BAIRRO[v.bairro].name}
          </div>
        )}
        {roomy && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="rounded-full bg-white/25 px-2 py-px text-[10.5px] font-bold">{v.type}</span>
            <span className="truncate text-[11px] opacity-85">{v.note}</span>
          </div>
        )}
      </motion.div>
    </Tip>
  )
}
