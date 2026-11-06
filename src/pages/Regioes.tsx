import * as React from 'react'
import { useDemo } from '@/store'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, CalendarDays, Check, Clock, Lightbulb, Plus, Undo2 } from 'lucide-react'
import { Button, Card, IconCircle, Panel, RentalAvatar, Segmented, SegmentBar, TeamAvatar, Tip, ViewAll } from '@/components/ui'
import { CityMap, heatColor, heatIsDark, type MapCtx } from '@/components/map/CityMap'
import { travelMinutesFromBase } from '@/components/map/geometry'
import { BAIRROS, ZONE, ZONES, type ZoneId } from '@/data/geo'
import { CLIENT, HEATMAP, RENTALS, TEAM, TEAMS, WEEK_PLAN, cleanableQty, onSite, weekPlan, zoneOfRental } from '@/data/mock'
import { TODAY } from '@/data/time'
import { RENTAL_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

const DAYS = [
  { d: 1, short: 'Seg', plural: 'segundas', long: 'segunda' },
  { d: 2, short: 'Ter', plural: 'terças', long: 'terça' },
  { d: 3, short: 'Qua', plural: 'quartas', long: 'quarta' },
  { d: 4, short: 'Qui', plural: 'quintas', long: 'quinta' },
  { d: 5, short: 'Sex', plural: 'sextas', long: 'sexta' },
  { d: 6, short: 'Sáb', plural: 'sábados', long: 'sábado' },
]

type Plan = Record<string, Record<number, ZoneId[]>>

const clonePlan = (p: Plan): Plan => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([d, z]) => [d, [...z]]))]))
const coverage = (plan: Plan, z: ZoneId, d: number) => TEAMS.filter((v) => plan[v.id]?.[d]?.includes(z)).map((v) => v.id)
const offSchedule = (plan: Plan, z: ZoneId) => DAYS.reduce((a, { d }) => a + (coverage(plan, z, d).length ? 0 : HEATMAP[z][d - 1]), 0)
const joinE = (xs: string[]) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1] : xs[0] ?? '')

const HEAT_MAX = Math.max(...Object.values(HEATMAP).flat())

/* sugestão: cobrir os Lagos nos dias em que a Equipe Fábio já está no Plano Piloto (Ponte JK) */
const SUGGEST = (() => {
  const team = 'fabio'
  const target: ZoneId = 'lagos'
  const anchor: ZoneId = 'plano'
  const days = DAYS.filter(({ d }) => !coverage(WEEK_PLAN, target, d).length && WEEK_PLAN[team][d]?.includes(anchor) && HEATMAP[target][d - 1] > 0).map((x) => x.d)
  const covered = DAYS.filter(({ d }) => coverage(WEEK_PLAN, target, d).length).map((x) => x.d)
  return { team, target, anchor, days, covered }
})()

/** Locações em andamento na região (no local, montagem ou retirada) */
const rentalsByZone = (z: ZoneId) => RENTALS.filter((r) => r.status !== 'encerrada' && zoneOfRental(r) === z)
/** Banheiros no local hoje na região */
const toiletsInField = (z: ZoneId) => RENTALS.filter((r) => zoneOfRental(r) === z && (r.status === 'ativa' || r.status === 'retirada') && onSite(r, 0)).reduce((a, r) => a + cleanableQty(r), 0)

export default function Regioes() {
  const nav = useNavigate()
  const dow = TODAY.getDay()
  const [day, setDay] = React.useState<number>(dow === 0 ? 1 : dow)
  const [zone, setZone] = React.useState<ZoneId | null>('lagos')
  const applied = useDemo((s) => s.scaleApplied)
  const setApplied = useDemo((s) => s.setScaleApplied)
  const plan = React.useMemo<Plan>(() => weekPlan(applied), [applied])
  const tableRef = React.useRef<HTMLDivElement>(null)

  const heat = Object.fromEntries(ZONES.map((z) => [z.id, HEATMAP[z.id][day - 1]])) as Record<ZoneId, number>
  const dayInfo = DAYS[day - 1]

  const apply = () => {
    setApplied(true)
    setZone(SUGGEST.target)
    toast.success('Escala atualizada', {
      description: `${TEAM[SUGGEST.team].name} cobre Plano Piloto e Lagos às ${joinE(SUGGEST.days.map((d) => DAYS[d - 1].plural))}.`,
    })
  }
  const undo = () => {
    setApplied(false)
    toast('Escala restaurada')
  }

  const overlay = ({ u }: MapCtx) => (
    <g pointerEvents="none">
      {ZONES.map((z) => {
        const vets = coverage(plan, z.id, day)
        const [lx, y0] = z.label
        // perto da borda de baixo, as equipes ficam ao lado do número
        const low = y0 + 60 * u > 680
        const x = low ? lx + 96 * u : lx
        const y = low ? y0 + 18 * u : y0 + 48 * u
        if (!vets.length) {
          if (!heat[z.id]) return null
          const w = 74 * u
          return (
            <g key={z.id} transform={`translate(${x} ${y})`}>
              <rect x={-w / 2} y={-10 * u} width={w} height={20 * u} rx={10 * u} fill="#fff" />
              <circle cx={-w / 2 + 11 * u} r={3 * u} fill="var(--color-coral)" />
              <text x={5 * u} y={3.6 * u} textAnchor="middle" fontSize={10 * u} fontWeight={700} fill="var(--color-coral)">
                Sem escala
              </text>
            </g>
          )
        }
        return (
          <g key={z.id} transform={`translate(${x - ((vets.length - 1) * 16 * u) / 2} ${y})`}>
            {vets.map((id, i) => (
              <g key={id} transform={`translate(${i * 16 * u} 0)`}>
                <circle r={10.5 * u} fill={TEAM[id].color} stroke="#fff" strokeWidth={2.2 * u} />
                <text y={3.2 * u} textAnchor="middle" fontSize={8 * u} fontWeight={800} fill="#fff">
                  {TEAM[id].initials}
                </text>
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 md:pb-8">
      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">Regiões</h1>
        </div>
        <Button variant="outline" onClick={() => nav('/agenda')} className="self-start sm:self-auto">
          <CalendarDays className="size-4" strokeWidth={2} /> Agenda das equipes
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
        <Card className="p-2">
          <div className="flex flex-col gap-3 px-2 pt-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Mapa de calor</h2>
            </div>
            <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
              <Segmented value={String(day)} onChange={(v) => setDay(Number(v))} options={DAYS.map((x) => ({ value: String(x.d), label: x.short }))} />
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-surface">
            <CityMap
              aspect={1000 / 680}
              heat={heat}
              heatMax={HEAT_MAX}
              selectedZone={zone}
              onSelectZone={setZone}
              bairroHighlight={zone ? BAIRROS.filter((b) => b.zone === zone).map((b) => b.id) : undefined}
              showBairros={false}
              overlay={overlay}
              heatUnit="serviços"
              ariaLabel={`Mapa de calor dos serviços às ${dayInfo.plural}`}
            />
          </div>
          <div className="flex flex-col gap-3 px-2 pt-3 pb-1.5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="num text-[12px] font-semibold text-ink-3">0</span>
              <span className="h-2 w-32 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map((t) => heatColor(t)).join(',')})` }} />
              <span className="num text-[12px] font-semibold text-ink-3">{HEAT_MAX} serviços</span>
            </div>
          </div>
        </Card>
        <CoverageTable tableRef={tableRef} plan={plan} day={day} onDay={setDay} zone={zone} onZone={setZone} />
        </div>

        <div className="flex flex-col gap-4">
          <Insight applied={applied} onApply={apply} onUndo={undo} onShow={() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
          <ZonePanel zone={zone} onZone={setZone} plan={plan} day={day} />
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── sugestão ───────────────────────── */

function WeekDots({ covered, added, dark }: { covered: number[]; added: number[]; dark?: boolean }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {DAYS.map(({ d, short }) => {
        const isAdded = added.includes(d)
        const on = covered.includes(d)
        return (
          <span
            key={d}
            className={cn(
              'flex h-10 flex-col items-center justify-center rounded-[14px] text-[11.5px] font-semibold leading-none',
              dark
                ? isAdded
                  ? 'bg-brand text-white'
                  : on
                    ? 'bg-white/12 text-white'
                    : 'bg-white/5 text-white/35'
                : isAdded
                  ? 'bg-card text-ink shadow-pill'
                  : on
                    ? 'bg-black text-white'
                    : 'bg-white/35 text-brand-ink/60',
            )}
          >
            {short}
            <span className="mt-1 flex h-3 items-center">
              {isAdded ? <Plus className="size-3" strokeWidth={2.6} /> : on ? <Check className="size-3" strokeWidth={2.6} /> : <span className="size-1 rounded-full bg-current opacity-60" />}
            </span>
          </span>
        )
      })}
    </div>
  )
}

function Insight({ applied, onApply, onUndo, onShow }: { applied: boolean; onApply: () => void; onUndo: () => void; onShow: () => void }) {
  const team = TEAM[SUGGEST.team]
  const plurals = joinE(SUGGEST.days.map((d) => DAYS[d - 1].plural))
  const zoneName = ZONE[SUGGEST.target].name
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!applied ? (
        <motion.div key="s" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-[24px] bg-brand-soft p-5">
          <div className="flex items-center gap-2.5">
            <IconCircle size={34} tone="black">
              <Lightbulb className="size-4 text-brand" strokeWidth={2} />
            </IconCircle>
            <span className="text-[13px] font-bold text-brand-ink">Sugestão para a escala</span>
          </div>
          <h2 className="mt-3.5 text-[19px] leading-snug font-bold tracking-[-0.02em] text-ink">
            {zoneName} sem equipe às {plurals}
          </h2>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={onApply} className="flex-1">
              Aplicar à escala <ArrowRight className="size-4" />
            </Button>
            <Button variant="ghost" onClick={onShow} className="bg-white/45 text-ink hover:bg-white/70">
              Ver escala
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div key="a" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-[24px] bg-black p-5 text-white">
          <div className="flex items-center gap-2.5">
            <IconCircle size={34} tone="brand">
              <Check className="size-4" strokeWidth={2.4} />
            </IconCircle>
            <span className="text-[15px] font-bold">Escala atualizada</span>
            <button onClick={onUndo} className="ml-auto inline-flex h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-[12.5px] font-semibold text-white/80 hover:bg-white/15 hover:text-white">
              <Undo2 className="size-3.5" /> Desfazer
            </button>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed font-medium text-white/65">
            A {team.name} cobre Plano Piloto e Lagos às {plurals}.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────────────────── zonas ───────────────────────── */

function ZonePanel({ zone, onZone, plan, day }: { zone: ZoneId | null; onZone: (z: ZoneId | null) => void; plan: Plan; day: number }) {
  return (
    <Panel className="bg-muted">
      <div className="px-3 pt-3 pb-3">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Regiões</h2>
      </div>
      <ul className="grid grid-cols-1 items-start gap-2 md:grid-cols-2 lg:grid-cols-1">
        {ZONES.map((z) => {
          const sel = zone === z.id
          const rentals = rentalsByZone(z.id)
          const toilets = toiletsInField(z.id)
          const visits = HEATMAP[z.id].reduce((a, b) => a + b, 0)
          const days = DAYS.filter(({ d }) => coverage(plan, z.id, d).length)
          const off = offSchedule(plan, z.id)
          return (
            <li key={z.id} className={cn('rounded-[20px] bg-card shadow-card transition-shadow', sel && 'md:col-span-2 lg:col-span-1', sel ? 'ring-2 ring-black' : 'hover:shadow-lift')}>
              <button onClick={() => onZone(sel ? null : z.id)} className="block w-full p-4 text-left">
                <span className="flex items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: z.hex }} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">{z.name}</span>
                  <span className="num text-[14px] font-bold text-ink">{visits}</span>
                  <span className="text-[12px] font-medium text-ink-3">serviços</span>
                </span>
                <SegmentBar className="mt-3" parts={DAYS.map(({ d }) => ({ value: HEATMAP[z.id][d - 1], color: coverage(plan, z.id, d).length ? z.hex : 'var(--color-coral-soft)' }))} />
                <span className="mt-2.5 flex items-center gap-2 text-[12px] font-medium text-ink-3">
                  <Clock className="size-3.5 shrink-0" strokeWidth={2} />
                  <span className="num">{travelMinutesFromBase(z.id)} min da base</span>
                  <span className="text-ink-4">·</span>
                  <span className="num">{toilets} banheiros hoje</span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {sel && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    <ZoneDetail z={z.id} plan={plan} day={day} />
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function ZoneDetail({ z, plan, day }: { z: ZoneId; plan: Plan; day: number }) {
  const rentals = rentalsByZone(z)
  const bairros = BAIRROS.filter((b) => b.zone === z).map((b) => ({ ...b, n: rentals.filter((r) => r.bairro === b.id).length }))
  return (
    <div className="border-t border-line px-4 pt-3.5 pb-4">
      <div className="text-[12.5px] font-bold text-ink">Quem atende</div>
      <div className="mt-2 grid grid-cols-6 gap-1">
        {DAYS.map(({ d, short }) => {
          const teams = coverage(plan, z, d)
          const demand = HEATMAP[z][d - 1]
          const gap = !teams.length && demand > 0
          return (
            <Tip key={d} content={teams.length ? `${short}: ${teams.map((v) => TEAM[v].name).join(', ')}, ${demand} serviços em 8 semanas` : gap ? `${short}: nenhuma equipe escalada, ${demand} serviços em 8 semanas` : `${short}: sem demanda`}>
              <div className={cn('flex h-[54px] flex-col items-center justify-between rounded-[12px] py-1.5', gap ? 'bg-coral-soft' : 'bg-surface', d === day && 'ring-2 ring-black')}>
                <span className={cn('text-[11px] font-semibold', d === day ? 'text-ink' : 'text-ink-3')}>{short}</span>
                {teams.length ? (
                  <span className="hidden -space-x-1.5 md:flex">
                    {teams.map((v) => (
                      <TeamAvatar key={v} teamId={v} size={20} className="ring-2 ring-surface" />
                    ))}
                  </span>
                ) : (
                  <span className={cn('num text-[12px] font-bold', gap ? 'text-coral' : 'text-ink-4')}>{gap ? `+${demand}` : '0'}</span>
                )}
              </div>
            </Tip>
          )
        })}
      </div>

      <div className="mt-4 text-[12.5px] font-bold text-ink">Locais</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {bairros.map((b) => (
          <span key={b.id} className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold', b.n ? 'bg-muted text-ink' : 'bg-surface text-ink-3')}>
            {b.name}
            {b.n > 0 && <span className="num text-ink-3">{b.n}</span>}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-ink">Locações</span>
        {rentals.length > 5 && (
          <Link to="/locacoes" className="text-[12px] font-semibold text-ink-3 hover:text-ink">
            Ver todas
          </Link>
        )}
      </div>
      {rentals.length ? (
        <ul className="mt-1 flex flex-col">
          {rentals.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link to={`/locacoes/${r.id}`} className="group -mx-2 flex items-center gap-2.5 rounded-[12px] px-2 py-1.5 hover:bg-surface">
                <RentalAvatar rental={r} size={28} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-semibold text-ink">{r.title}</span>
                  <span className="block truncate text-[11.5px] font-medium text-ink-3">
                    {CLIENT[r.clientId].name} · {RENTAL_STATUS[r.status].label}
                  </span>
                </span>
                <ArrowRight className="size-3.5 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-1 text-[12.5px] font-medium text-ink-3">Nenhuma locação em andamento nesta região.</div>
      )}
    </div>
  )
}

/* ───────────────────────── escala da semana ───────────────────────── */

function CoverageTable({
  tableRef,
  plan,
  day,
  onDay,
  zone,
  onZone,
}: {
  tableRef: React.RefObject<HTMLDivElement>
  plan: Plan
  day: number
  onDay: (d: number) => void
  zone: ZoneId | null
  onZone: (z: ZoneId | null) => void
}) {
  const nav = useNavigate()
  const totalOff = ZONES.reduce((a, z) => a + offSchedule(plan, z.id), 0)
  return (
    <div ref={tableRef} className="scroll-mt-4">
      <Card className="p-2">
        <div className="flex items-center justify-between gap-3 px-2 pt-2 pb-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Escala da semana</h2>
          </div>
          <ViewAll onClick={() => nav('/agenda')}>Agenda</ViewAll>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[500px] border-separate border-spacing-1 text-[12.5px] md:min-w-[640px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-[112px] bg-card px-2 text-left text-[12px] font-semibold text-ink-3 md:w-[190px] md:px-3">Região</th>
                {DAYS.map(({ d, short }) => (
                  <th key={d} className="font-normal">
                    <button onClick={() => onDay(d)} className={cn('h-8 w-full rounded-full text-[12px] font-semibold transition-colors', d === day ? 'bg-black text-white' : 'text-ink-3 hover:bg-muted hover:text-ink')}>
                      {short}
                    </button>
                  </th>
                ))}
                <th className="w-[56px] px-1 text-right md:w-[96px] md:px-3 text-[12px] font-semibold text-ink-3">Fora</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map((z) => {
                const off = offSchedule(plan, z.id)
                const sel = zone === z.id
                return (
                  <tr key={z.id} onClick={() => onZone(sel ? null : z.id)} className="group cursor-pointer">
                    <td className={cn('sticky left-0 z-10 rounded-[12px] px-2 transition-colors md:px-3', sel ? 'bg-muted' : 'bg-card group-hover:bg-surface')}>
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: z.hex }} />
                        <span className="text-[12px] leading-tight font-semibold text-ink md:text-[12.5px]">{z.name}</span>
                      </span>
                    </td>
                    {DAYS.map(({ d }) => {
                      const n = HEATMAP[z.id][d - 1]
                      const vets = coverage(plan, z.id, d)
                      const gap = !vets.length && n > 0
                      const t = n / HEAT_MAX
                      return (
                        <td key={d}>
                          <motion.div
                            layout
                            className={cn('flex h-11 items-center justify-center gap-1 rounded-[12px] px-1 md:justify-between md:px-2.5', gap && 'border-[1.5px] border-dashed border-coral/60', d === day && !gap && 'ring-2 ring-black/80 ring-inset')}
                            style={{ background: gap ? 'var(--color-coral-soft)' : heatColor(t) }}
                          >
                            <span className={cn('num text-[14px] font-bold', gap ? 'text-coral' : heatIsDark(t) ? 'text-white' : 'text-ink')}>{n}</span>
                            <span className="hidden -space-x-1.5 md:flex">
                              <AnimatePresence initial={false}>
                                {vets.map((v) => (
                                  <motion.span key={v} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                                    <TeamAvatar teamId={v} size={20} className="ring-2 ring-white" />
                                  </motion.span>
                                ))}
                              </AnimatePresence>
                            </span>
                          </motion.div>
                        </td>
                      )
                    })}
                    <td className="px-1 text-right md:px-3">
                      <span className={cn('num text-[14px] font-bold', off ? 'text-coral' : 'text-ink-4')}>{off}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 pt-2 pb-2 text-[12px] font-medium text-ink-3">
          <span className="inline-flex items-center gap-2">
            <span className="size-3.5 rounded-[5px] border-[1.5px] border-dashed border-coral/60 bg-coral-soft" /> Sem equipe escalada
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 0.5, 1].map((t) => heatColor(t)).join(',')})` }} /> Serviços em 8 semanas
          </span>
        </div>
      </Card>
    </div>
  )
}
