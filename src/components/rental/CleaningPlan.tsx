import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, CalendarCheck, Check, Clock, Info, SprayCan } from 'lucide-react'
import { Badge, Card, CountUp, IconCircle, Panel, Ring, Segmented, TeamAvatar, Tip } from '@/components/ui'
import { NOW, TEAM, cleanableQty, type Job, type Rental } from '@/data/mock'
import { day, daysFromToday, fmt, relDays, TODAY } from '@/data/time'
import { onTime } from '@/lib/history'
import { JOB_TYPE } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { RentalModel } from './model'

const freqLabel = (r: Rental) => {
  if (r.kind === 'evento') return 'Plantão de limpeza durante o evento'
  if (r.cleanPerWeek >= 3) return `${r.cleanPerWeek} limpezas por semana`
  if (r.cleanPerWeek === 2) return '2 limpezas por semana'
  if (r.cleanPerWeek === 1) return '1 limpeza por semana'
  return 'Sem limpeza recorrente'
}

/* ───────────── Faixa de dias (2 semanas) ───────────── */

function DayStrip({ jobs }: { jobs: Job[] }) {
  const nav = useNavigate()
  const mondayOffset = -((TODAY.getDay() + 6) % 7)
  const days: number[] = []
  for (let i = 0; i < 14; i++) {
    const d = mondayOffset + i
    if (day(d).getDay() === 0) continue
    days.push(d)
  }
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
      {days.map((d, i) => {
        const date = day(d)
        const js = jobs.filter((j) => daysFromToday(j.start) === d && j.status !== 'cancelado')
        const isToday = d === 0
        const past = d < 0
        const j = js[0]
        const live = js.find((x) => x.status === 'em-andamento' || x.status === 'a-caminho')
        const done = j && js.every((x) => x.status === 'concluido')
        const t = j ? JOB_TYPE[j.type] : null
        const Icon = t?.icon
        return (
          <motion.button
            key={d}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.25 }}
            disabled={!j}
            onClick={() => j && nav(`/campo/servico/${(live ?? j).id}`)}
            title={js.map((x) => `${x.type} às ${fmt.time(x.start)}`).join(', ') || 'Sem serviço'}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1.5 rounded-[16px] px-1 pt-2 pb-2.5 transition-[box-shadow,background]',
              isToday ? 'bg-black text-white' : j ? 'bg-card shadow-card hover:shadow-lift' : 'hatch text-ink-3',
            )}
          >
            <span className={cn('text-[11.5px] font-semibold capitalize', isToday ? 'text-white/60' : 'text-ink-3')}>{fmt.weekdayShort(date)}</span>
            <span className={cn('num text-[15px] leading-none font-bold', isToday ? 'text-white' : past && !j ? 'text-ink-4' : 'text-ink')}>{date.getDate()}</span>
            <span className="relative flex h-6 items-center justify-center">
              {js.length > 1 && (
                <span className={cn('num absolute -top-1 -right-3 rounded-full px-1 text-[9.5px] leading-[14px] font-bold', isToday ? 'bg-white text-ink' : 'bg-black text-white')}>{js.length}</span>
              )}
              {live ? (
                <span className="relative flex size-6 items-center justify-center rounded-full bg-brand text-white">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-50" />
                  {Icon && <Icon className="relative size-3" strokeWidth={2.4} />}
                </span>
              ) : j && done ? (
                <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ background: t!.color }}>
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              ) : j ? (
                <span className="flex size-6 items-center justify-center rounded-full" style={{ color: t!.color, boxShadow: `inset 0 0 0 2px ${t!.color}` }}>
                  {Icon && <Icon className="size-3" strokeWidth={2.4} />}
                </span>
              ) : (
                <span className="size-1.5 rounded-full bg-ink-4/50" />
              )}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* ───────────── Plano de limpeza ───────────── */

function Tile({ icon, tone, title, value, sub, action }: { icon: React.ReactNode; tone: 'teal' | 'brand-soft' | 'muted' | 'blue'; title: string; value: React.ReactNode; sub: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-[20px] bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <IconCircle tone={tone} size={40}>
          {icon}
        </IconCircle>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-ink-3">{title}</div>
          <div className="mt-0.5 text-[15px] leading-tight font-bold tracking-[-0.01em] text-ink">{value}</div>
        </div>
        {action}
      </div>
      <div className="mt-3 text-[12.5px] leading-snug font-medium text-ink-3">{sub}</div>
    </div>
  )
}

export function CleaningPlan({ rental, model }: { rental: Rental; model: RentalModel }) {
  const nav = useNavigate()
  const [view, setView] = React.useState<'dias' | 'lista'>('dias')
  const cleanings = model.jobs.filter((j) => j.type === 'Limpeza')
  const nextClean = cleanings.find((j) => (j.status === 'agendado' || j.status === 'a-caminho' || j.status === 'em-andamento') && +new Date(j.start) >= +NOW - 2 * 3600000)
  const last = model.lastCleaning
  const monthDone = model.history.filter((h) => h.job.type === 'Limpeza' && daysFromToday(h.job.start) >= -30).length
  const units = cleanableQty(rental)
  const lastOnTime = last?.report ? onTime(last.job, last.report) : true

  return (
    <Panel className="bg-muted">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{rental.kind === 'evento' ? 'Agenda do evento' : 'Plano de limpeza'}</h2>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-3">
            {freqLabel(rental)} · {units} {units === 1 ? 'unidade' : 'unidades'} · {TEAM[rental.teamId].name}
          </p>
        </div>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'dias', label: 'Duas semanas' },
            { value: 'lista', label: 'Próximos' },
          ]}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Tile
          icon={<SprayCan className="size-[18px]" strokeWidth={1.9} />}
          tone={nextClean?.status === 'em-andamento' ? 'brand-soft' : 'teal'}
          title={nextClean?.status === 'em-andamento' ? 'Limpeza agora' : 'Próxima limpeza'}
          value={nextClean ? (nextClean.status === 'em-andamento' ? `Desde ${fmt.time(nextClean.start)}` : `${relDays(nextClean.start).replace(/^./, (c) => c.toUpperCase())}, ${fmt.time(nextClean.start)}`) : 'Sem data'}
          sub={nextClean ? `${TEAM[nextClean.teamId].name}${nextClean.fixedTime ? ', horário combinado' : ''}` : rental.status === 'encerrada' ? 'Locação encerrada' : 'Nenhuma limpeza agendada'}
          action={
            nextClean && (
              <button
                onClick={() => nav(`/campo/servico/${nextClean.id}`)}
                aria-label="Abrir no app da equipe"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-ink transition-colors hover:bg-muted-2"
              >
                <ArrowUpRight className="size-4" strokeWidth={2} />
              </button>
            )
          }
        />
        <Tile
          icon={<CalendarCheck className="size-[18px]" strokeWidth={1.9} />}
          tone="muted"
          title="Última limpeza"
          value={last?.report ? `${fmt.weekdayShort(last.report.finishedAt)}, ${fmt.short(last.report.finishedAt)} às ${fmt.time(last.report.finishedAt)}` : 'Nenhuma ainda'}
          sub={
            last?.report ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <TeamAvatar teamId={last.job.teamId} size={18} /> {TEAM[last.job.teamId].short}
                <span className={lastOnTime ? 'text-green' : 'text-yellow-ink'}>· {lastOnTime ? 'no horário' : 'com atraso'}</span>
              </span>
            ) : (
              'Ainda sem registro'
            )
          }
        />
        <Tile
          icon={<Clock className="size-[18px]" strokeWidth={1.9} />}
          tone="blue"
          title="Nos últimos 30 dias"
          value={`${monthDone} ${monthDone === 1 ? 'limpeza' : 'limpezas'}`}
          sub={model.compliance.avgMin ? `Média de ${model.compliance.avgMin} min por limpeza` : 'Sem registros no período'}
        />
      </div>

      <div className="mt-2 rounded-[20px] bg-card p-3 shadow-card">
        {view === 'dias' ? (
          <>
            <DayStrip jobs={model.jobs} />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[12px] font-semibold text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-teal" /> Feita
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full ring-2 ring-teal ring-inset" /> Agendada
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand" /> Agora
              </span>
              <span className="ml-auto">Toque no dia para abrir o serviço</span>
            </div>
          </>
        ) : model.upcoming.length ? (
          <ul>
            {model.upcoming.map((j, i) => {
              const t = JOB_TYPE[j.type]
              return (
                <li key={j.id} className={cn('flex items-center gap-3 px-1 py-2.5', i > 0 && 'border-t border-line')}>
                  <IconCircle size={34} className={t.soft}>
                    <t.icon className={cn('size-4', t.text)} strokeWidth={2} />
                  </IconCircle>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold text-ink">
                      {j.type} <span className="font-medium text-ink-3">· {j.note}</span>
                    </div>
                    <div className="num text-[12px] font-medium text-ink-3 capitalize">
                      {fmt.weekday(j.start)}, {fmt.short(j.start)} às {fmt.time(j.start)}
                    </div>
                  </div>
                  {j.fixedTime && <Badge tone="neutral">Combinado</Badge>}
                  <TeamAvatar teamId={j.teamId} size={26} />
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="py-6 text-center text-[13px] font-medium text-ink-3">Nenhum serviço agendado.</div>
        )}
      </div>
    </Panel>
  )
}

/* ───────────── Índice de cumprimento ───────────── */

const scoreTone = (n: number) => (n >= 90 ? { tone: 'ok' as const, label: 'Ótimo', color: 'var(--color-green)' } : n >= 75 ? { tone: 'warn' as const, label: 'Atenção', color: 'var(--color-yellow)' } : { tone: 'late' as const, label: 'Abaixo', color: 'var(--color-red)' })

export function ComplianceIndex({ model, className }: { model: RentalModel; className?: string }) {
  const c = model.compliance
  const empty = c.due === 0 && !model.history.some((h) => h.job.type === 'Limpeza')
  const s = empty ? { tone: 'neutral' as const, label: 'Sem histórico', color: 'var(--color-ink-4)' } : scoreTone(c.score)
  const rows = [
    { id: 'feitas', label: 'Feitas', detail: c.due ? `${c.done} de ${c.due} previstas` : 'Nada previsto no período', ok: c.done >= c.due },
    { id: 'horario', label: 'No horário', detail: `${c.onTimePct}% até 15 min do horário`, ok: c.onTimePct >= 85 },
    { id: 'tempo', label: 'Tempo médio', detail: c.avgMin ? `${c.avgMin} min por limpeza` : 'Sem registros', ok: true },
    { id: 'ocorr', label: 'Ocorrências', detail: c.occTotal ? `${c.occResolved} de ${c.occTotal} resolvidas` : 'Nenhuma no período', ok: c.occResolved >= c.occTotal },
  ]
  const okCount = rows.filter((r) => r.ok).length
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Cumprimento</h3>
        <Tip content="Últimas 4 semanas: limpezas feitas, pontualidade e ocorrências resolvidas.">
          <button className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-muted hover:text-ink" aria-label="O que entra na conta">
            <Info className="size-4" strokeWidth={1.9} />
          </button>
        </Tip>
      </div>

      <div className="flex items-center gap-4 px-5 pt-3">
        <Ring value={empty ? 0 : c.score / 100} size={76} stroke={8} color={s.color} track="var(--color-muted)">
          {empty ? <span className="text-[22px] font-bold text-ink-4">0</span> : <CountUp to={c.score} className="text-[22px] font-bold tracking-[-0.03em] text-ink" />}
        </Ring>
        <div className="min-w-0">
          <Badge tone={s.tone} dot>
            {s.label}
          </Badge>
          <div className="mt-2 text-[12.5px] font-medium text-ink-3">
            {empty ? 'A conta começa na primeira limpeza' : `${okCount} de ${rows.length} itens em dia`}
          </div>
        </div>
      </div>

      <ul className="mt-3 px-5 pb-4">
        {rows.map((r, i) => (
          <li key={r.id} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
            <span className={cn('size-2 shrink-0 rounded-full', r.ok ? 'bg-green' : 'bg-yellow')} />
            <span className="w-[92px] shrink-0 text-[13px] font-semibold text-ink">{r.label}</span>
            <span className={cn('min-w-0 flex-1 truncate text-right text-[12.5px] font-medium', r.ok ? 'text-ink-3' : 'text-yellow-ink')}>{r.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
