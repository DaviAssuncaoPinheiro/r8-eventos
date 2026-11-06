import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Copy,
  Lock,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Plus,
  QrCode,
  SprayCan,
  Timer,
  Toilet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { AvatarStack, Badge, Button, Card, Empty, IconButton, IconCircle, Panel, RentalAvatar, SegmentBar, TeamAvatar, ViewAll } from '@/components/ui'
import { CityMap, MapStatusLegend, type MapVisit } from '@/components/map/CityMap'
import { BAIRRO, ZONE, type ZoneId } from '@/data/geo'
import {
  CURRENT_USER,
  KPIS,
  NOW,
  PRODUCT,
  RENTAL,
  TEAM,
  TEAMS,
  UNITS,
  demandOn,
  rentedOn,
  shortages,
  type Job,
  type JobStatus,
  type Rental,
} from '@/data/mock'
import { daysFromToday, fmt, onWeekday, TODAY } from '@/data/time'
import { buildLoad, equipmentMoves, loadQtyLabel, navLinks, type LoadItem } from '@/lib/fieldkit'
import { newId } from '@/lib/photos'
import { cn, firstName, lowerFirst } from '@/lib/utils'
import { JOB_STATUS, JOB_TYPE, OCC_KIND } from '@/lib/status'
import { useDemo, useJobs } from '@/store'
import { productSplits } from '@/components/equipment/model'
import { SPLIT_COLORS } from '@/components/equipment/StockOverview'

const EASE = [0.16, 1, 0.3, 1] as const

/* ───────────────────────── tempo e dados do dia ───────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0')
const minOf = (d: string | Date) => {
  const x = new Date(d)
  return x.getHours() * 60 + x.getMinutes()
}
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`
const NOW_MIN = minOf(NOW)
const durFmt = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : `${min} min`)

interface Stop {
  job: Job
  status: JobStatus
  startMin: number
}

const joinE = (xs: string[]) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1] : xs[0] ?? '')
const rentalOf = (j: Job) => RENTAL[j.rentalId]
const bairroOf = (j: Job) => BAIRRO[rentalOf(j).bairro]
const zonesOf = (stops: Stop[]): ZoneId[] => [...new Set(stops.map((s) => bairroOf(s.job).zone))]
const zonesTxt = (zs: ZoneId[]) => zs.map((z) => ZONE[z].short).join(', ')

/** Nome curto do local para pins e listas ("Jardins do Lago") */
export function shortTitle(r: Rental) {
  return r.title
    .replace(/^(Residencial|Edifício|Condomínio|Reforma|Duplicação da|Duplicação)\s+/i, '')
    .replace(/ · .*$/, '')
}

function greeting() {
  const h = NOW.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const scrollTop = () => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
const openJob = (nav: ReturnType<typeof useNavigate>, j: Job) => nav(`/campo/servico/${j.id}`)

/* ───────────────────────── página ───────────────────────── */

export default function Hoje() {
  const nav = useNavigate()
  const jobs = useJobs()

  const [teamId, setTeamId] = React.useState('fabio')
  const [sel, setSel] = React.useState<string | null>(null)

  const byTeam = React.useMemo(() => {
    const today = jobs.filter((j) => daysFromToday(j.start) === 0)
    const out: Record<string, Stop[]> = {}
    for (const t of TEAMS) {
      out[t.id] = today
        .filter((x) => x.teamId === t.id && x.status !== 'cancelado')
        .map((x) => ({ job: x, status: x.status, startMin: minOf(x.start) }))
        .sort((a, b) => a.startMin - b.startMin)
    }
    return out
  }, [jobs])

  const pickTeam = (id: string, jobId?: string | null) => {
    setTeamId(id)
    setSel(jobId ?? null)
  }

  const dateTxt = fmt.long(TODAY).replace(/^./, (c) => c.toUpperCase())
  const all = TEAMS.flatMap((t) => byTeam[t.id])

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 lg:pb-8">
      {/* saudação */}
      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">
            {greeting()}, {firstName(CURRENT_USER.name)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[14px] font-semibold text-ink-2 sm:inline">{dateTxt}</span>
          <Button variant="primary" className="md:hidden" onClick={() => nav('/agenda?novo=1')}>
            <Plus className="size-4" strokeWidth={2.2} /> Novo serviço
          </Button>
          <IconButton aria-label="Abrir agenda" onClick={() => nav('/agenda')}>
            <CalendarDays className="size-[18px]" strokeWidth={1.9} />
          </IconButton>
        </div>
      </div>


      {/* mapa + serviços de hoje */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:h-[680px] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <MapCard stops={byTeam[teamId]} byTeam={byTeam} teamId={teamId} onTeam={(id) => pickTeam(id)} sel={sel} onSel={setSel} />
        <JobsPanel stops={byTeam[teamId]} teamId={teamId} selected={sel} onHover={setSel} onAll={() => nav('/agenda')} />
      </div>

      {/* carga do caminhão + próximos + estoque */}
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <TruckLoad teamId={teamId} stops={byTeam[teamId]} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-1">
          <NextJobs
            byTeam={byTeam}
            onPick={(t, id) => {
              pickTeam(t, id)
              scrollTop()
            }}
            onAll={() => nav('/agenda')}
          />
          <StockCard />
        </div>
      </div>

      {/* equipes */}
      <div className="mt-4">
        <Teams
          byTeam={byTeam}
          activeTeam={teamId}
          onPick={(id) => {
            pickTeam(id)
            scrollTop()
          }}
        />
      </div>

      <Attention byTeam={byTeam} />
    </div>
  )
}

/* ───────────────────────── indicadores (ref. logip) ───────────────────────── */

function Metric({ icon: Icon, label, value, unit, delta, deltaTone = 'up', last }: { icon: LucideIcon; label: string; value: React.ReactNode; unit?: React.ReactNode; delta?: React.ReactNode; deltaTone?: 'up' | 'down' | 'warn'; last?: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3.5 px-4 py-4 sm:px-5', !last && 'lg:border-r lg:border-line')}>
      <IconCircle size={44}>
        <Icon className="size-[18px]" strokeWidth={1.9} />
      </IconCircle>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-ink-2">{label}</div>
        <div className="mt-0.5 flex min-w-0 items-baseline gap-1.5">
          <span className="num text-[24px] leading-none font-bold tracking-[-0.03em] text-ink">{value}</span>
          {unit && <span className="truncate text-[13px] font-semibold text-ink-3">{unit}</span>}
          {delta && (
            <span className={cn('num truncate text-[12px] font-semibold', deltaTone === 'up' ? 'text-green' : deltaTone === 'warn' ? 'text-brand-2' : 'text-red')}>{delta}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function Metrics({ stops }: { stops: Stop[] }) {
  const occurrences = useDemo((s) => s.occurrences)
  const unitState = useDemo((s) => s.unitState)
  const done = stops.filter((s) => s.status === 'concluido').length
  const inField = UNITS.filter((u) => (unitState[u.id] ?? u.state) === 'campo').length
  const tomorrow = rentedOn(1)
  const toiletsTomorrow = tomorrow.bq + tomorrow['bq-pne'] + tomorrow['bq-luxo']
  const open = occurrences.filter((o) => o.status === 'aberta')
  const qr = open.filter((o) => o.source === 'qr').length
  const growth = Math.round((KPIS.cleaningsMonth / KPIS.cleaningsMonthPrev - 1) * 100)
  return (
    <Card className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
      <Metric icon={ClipboardCheck} label="Serviços concluídos" value={done} unit={`de ${stops.length}`} delta={`${Math.round((done / Math.max(1, stops.length)) * 100)}% do dia`} />
      <Metric icon={Toilet} label="Banheiros em campo" value={inField} delta={`${toiletsTomorrow} amanhã`} deltaTone="warn" />
      <Metric icon={SprayCan} label="Limpezas no mês" value={KPIS.cleaningsMonth} delta={`▲ ${growth}%`} />
      <Metric icon={QrCode} label="Ocorrências abertas" value={open.length} delta={qr ? `${qr} pelo QR` : undefined} deltaTone="down" last />
    </Card>
  )
}

/* ───────────────────────── abas de equipe ───────────────────────── */

function TeamTabs({ teamId, onTeam, byTeam }: { teamId: string; onTeam: (id: string) => void; byTeam: Record<string, Stop[]> }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Equipe">
      {TEAMS.map((t) => {
        const active = t.id === teamId
        const stops = byTeam[t.id]
        const live = stops.some((s) => s.status === 'em-andamento')
        const done = stops.filter((s) => s.status === 'concluido').length
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onTeam(t.id)}
            className={cn(
              'flex h-11 shrink-0 items-center gap-2 rounded-full pr-4 pl-1.5 text-[13.5px] font-semibold transition-colors active:scale-[.97]',
              active ? 'bg-black text-white' : 'bg-muted text-ink-2 hover:bg-muted-2 hover:text-ink',
            )}
          >
            <span className="relative">
              <TeamAvatar teamId={t.id} size={32} className={cn(active && 'ring-2 ring-white/20')} />
              {live && <span className={cn('absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-brand ring-2', active ? 'ring-black' : 'ring-muted')} />}
            </span>
            {t.name}
            <span className={cn('num text-[12px] font-bold', active ? 'text-brand' : 'text-ink-3')}>
              {done}/{stops.length}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ───────────────────────── mapa ───────────────────────── */

function MapCard({ stops, byTeam, teamId, onTeam, sel, onSel }: { stops: Stop[]; byTeam: Record<string, Stop[]>; teamId: string; onTeam: (id: string) => void; sel: string | null; onSel: (id: string | null) => void }) {
  const team = TEAM[teamId]
  const zones = zonesOf(stops)
  // um pin por local: vale o serviço mais relevante agora (em andamento, a caminho, próximo, feito)
  const visits = React.useMemo(() => {
    const rank: Record<JobStatus, number> = { 'em-andamento': 0, 'a-caminho': 1, agendado: 2, concluido: 3, cancelado: 4 }
    const best = new Map<string, Stop>()
    for (const s of stops) {
      const cur = best.get(s.job.rentalId)
      if (!cur || rank[s.status] < rank[cur.status]) best.set(s.job.rentalId, s)
    }
    return [...best.values()].map<MapVisit>((s) => ({
      id: s.job.id,
      label: shortTitle(rentalOf(s.job)),
      type: s.job.type,
      bairro: rentalOf(s.job).bairro,
      seed: s.job.rentalId,
      status: s.status,
      caption: `${hhmm(s.startMin)}, ${s.job.type.toLowerCase()}`,
    }))
  }, [stops])
  const pinOf = (jobId: string | null) => {
    if (!jobId) return null
    const rid = stops.find((s) => s.job.id === jobId)?.job.rentalId
    return visits.find((v) => v.seed === rid)?.id ?? jobId
  }

  return (
    <Card className="flex min-h-0 min-w-0 flex-col p-2">
      <div className="px-1 pt-1 pb-2">
        <TeamTabs teamId={teamId} onTeam={onTeam} byTeam={byTeam} />
      </div>

      <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] bg-surface sm:aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1">
        <CityMap
          visits={visits}
          focus="visits"
          showRoute={false}
          showScale={false}
          highlightZones={zones}
          selectedVisitId={pinOf(sel)}
          onSelectVisit={onSel}
          ariaLabel={`Serviços de hoje da ${team.name}`}
        />

        <span className="pointer-events-none absolute right-3 bottom-3 inline-flex h-8 items-center gap-2 rounded-full bg-black pr-3.5 pl-3 text-[12.5px] font-semibold text-white shadow-pill sm:top-3 sm:bottom-auto">
          Agora <span className="num">{hhmm(NOW_MIN)}</span>
        </span>

        <div className="absolute bottom-3 left-3 hidden h-9 items-center rounded-full bg-card/95 px-4 shadow-pill backdrop-blur-sm md:flex">
          <MapStatusLegend />
        </div>
      </div>
    </Card>
  )
}

/* ───────────────────────── serviços de hoje ───────────────────────── */

function JobsPanel({ stops, teamId, selected, onHover, onAll }: { stops: Stop[]; teamId: string; selected: string | null; onHover: (id: string) => void; onAll: () => void }) {
  const nav = useNavigate()
  const team = TEAM[teamId]
  const listRef = React.useRef<HTMLDivElement>(null)

  const groups = React.useMemo(() => {
    const m = new Map<ZoneId, Stop[]>()
    for (const s of stops) {
      const z = bairroOf(s.job).zone
      if (!m.has(z)) m.set(z, [])
      m.get(z)!.push(s)
    }
    return [...m.entries()]
  }, [stops])

  React.useEffect(() => {
    if (!selected) return
    const box = listRef.current
    const el = box?.querySelector<HTMLElement>(`[data-stop="${selected}"]`)
    if (!el || !box || box.scrollHeight <= box.clientHeight + 4) return
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTo({ top: top - 48, behavior: 'smooth' })
  }, [selected])

  return (
    <Panel className="flex min-h-0 min-w-0 flex-col bg-muted">
      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Serviços de hoje</h2>
        </div>
        <ViewAll onClick={onAll} />
      </div>

      <div ref={listRef} className="scroll-thin relative flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={teamId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="flex flex-col gap-4">
            {groups.map(([z, ss]) => (
              <section key={z}>
                <div className="flex items-center gap-2 px-2 pb-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: ZONE[z].hex }} />
                  <span className="shrink-0 text-[13.5px] font-bold whitespace-nowrap text-ink">{ZONE[z].name}</span>
                </div>
                <ol className="flex flex-col gap-2">
                  {ss.map((s, i) => (
                    <JobCard key={s.job.id} s={s} i={i} selected={selected === s.job.id} onHover={() => onHover(s.job.id)} onOpen={() => openJob(nav, s.job)} />
                  ))}
                </ol>
              </section>
            ))}
            {!groups.length && <Empty title="Sem serviços hoje" />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  )
}

function NavPill({ href, icon: Icon, label, dark }: { href: string; icon: LucideIcon; label: string; dark?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir no ${label}`}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-[background,transform] duration-150 active:scale-[.97]',
        dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-muted text-ink hover:bg-muted-2',
      )}
    >
      <Icon className={cn('size-3.5', dark ? 'text-white/70' : 'text-ink-2')} strokeWidth={2} />
      {label}
    </a>
  )
}

function TypeIcon({ job, size = 40, live, done }: { job: Job; size?: number; live?: boolean; done?: boolean }) {
  const t = JOB_TYPE[job.type]
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', live ? 'bg-white/10' : t.soft, done && 'opacity-60')}
      style={{ width: size, height: size }}
    >
      <t.icon className={cn(live ? 'text-brand' : t.text)} style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={2.1} />
    </span>
  )
}

function JobCard({ s, i, selected, onHover, onOpen }: { s: Stop; i: number; selected: boolean; onHover: () => void; onOpen: () => void }) {
  const j = s.job
  const r = rentalOf(j)
  const st = JOB_STATUS[s.status]
  const live = s.status === 'em-andamento'
  const done = s.status === 'concluido'
  const links = navLinks(j)
  const elapsed = Math.max(0, Math.min(j.durationMin, NOW_MIN - s.startMin))
  const what = j.type === 'Limpeza' ? `${j.units} ${j.units === 1 ? 'unidade' : 'unidades'}` : j.type === 'Manutenção' ? j.note : `${j.units} itens`

  return (
    <motion.li
      data-stop={j.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.03, ease: EASE }}
      onMouseEnter={onHover}
      className={cn(
        'rounded-[20px] p-3 transition-[box-shadow] duration-150',
        live ? 'bg-black text-white' : 'bg-card shadow-card hover:shadow-lift',
        selected && (live ? 'ring-2 ring-brand' : 'ring-2 ring-black'),
      )}
    >
      <button onClick={onOpen} className="grid w-full grid-cols-[44px_40px_minmax(0,1fr)_auto] items-center gap-x-3 text-left" aria-label={`Abrir ${j.type.toLowerCase()} em ${r.title}`}>
        <div className="leading-tight">
          <div className={cn('num text-[14px] font-bold', done ? 'text-ink-3' : live ? 'text-white' : 'text-ink')}>{hhmm(s.startMin)}</div>
          {j.fixedTime && <Lock className={cn('mt-1 size-3', live ? 'text-white/50' : 'text-ink-4')} strokeWidth={2.4} aria-label="Horário combinado" />}
        </div>
        <TypeIcon job={j} live={live} done={done} />
        <div className={cn('min-w-0', done && 'opacity-70')}>
          <div className="truncate text-[14px] font-bold">{shortTitle(r)}</div>
          <div className={cn('truncate text-[12.5px] font-medium', live ? 'text-white/60' : 'text-ink-3')}>
            {j.type}, {what}
          </div>
        </div>
        <div className="flex justify-end">
          {s.status === 'agendado' ? null : (
            <Badge tone={st.tone} dot={live}>
              {done ? <Check className="-mx-0.5 size-3" strokeWidth={3} /> : null}
              {done ? 'Feito' : st.label}
            </Badge>
          )}
        </div>
      </button>

      {live && (
        <div className="mt-3 flex items-center gap-2.5">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <motion.span className="block h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${(elapsed / j.durationMin) * 100}%` }} transition={{ duration: 1, ease: EASE }} />
          </span>
          <span className="num shrink-0 text-[11.5px] font-semibold text-white/60">
            {durFmt(elapsed)} de {durFmt(j.durationMin)}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <NavPill href={links.waze} icon={Navigation} label="Waze" dark={live} />
        <NavPill href={links.maps} icon={MapPin} label="Maps" dark={live} />
        {!live && (
          <Button variant={done ? 'ghost' : 'subtle'} size="sm" onClick={onOpen} className="ml-auto">
            {done ? 'Ver registro' : 'Abrir serviço'}
            <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
          </Button>
        )}
      </div>
      {live && (
        <Button variant="brand" size="md" onClick={onOpen} className="mt-2 w-full">
          Acompanhar registro <ArrowRight className="size-4" strokeWidth={2.2} />
        </Button>
      )}
    </motion.li>
  )
}

/* ───────────────────────── carga do caminhão ───────────────────────── */

const LOAD_GROUPS: { id: LoadItem['group']; icon: LucideIcon; tone: 'blue' | 'teal' | 'yellow' }[] = [
  { id: 'Equipamentos', icon: Package, tone: 'blue' },
  { id: 'Insumos de limpeza', icon: SprayCan, tone: 'teal' },
  { id: 'Ferramentas e peças', icon: Wrench, tone: 'yellow' },
]

function TruckLoad({ teamId, stops }: { teamId: string; stops: Stop[] }) {
  const loadChecked = useDemo((s) => s.loadChecked)
  const toggleLoad = useDemo((s) => s.toggleLoad)
  const team = TEAM[teamId]

  const pending = stops.filter((s) => s.status !== 'concluido')
  const items = React.useMemo(() => buildLoad(pending.map((s) => s.job)), [pending])
  const moves = React.useMemo(() => equipmentMoves(stops.map((s) => s.job)), [stops])
  const key = (it: LoadItem) => `${teamId}:${it.id}`
  const done = items.filter((it) => loadChecked[key(it)]).length
  const groups = LOAD_GROUPS.map((g) => ({ ...g, items: items.filter((i) => i.group === g.id) })).filter((g) => g.items.length)
  const ready = items.length > 0 && done === items.length
  const out = moves.filter((m) => m.dir === 'sai').reduce((a, m) => a + m.qty, 0)
  const back = moves.filter((m) => m.dir === 'volta').reduce((a, m) => a + m.qty, 0)

  const copy = async () => {
    const lines = [`Carga do ${team.truck} (${team.plate})`]
    for (const g of groups) {
      lines.push('', g.id)
      for (const it of g.items) lines.push(`${loadChecked[key(it)] ? '[x]' : '[ ]'} ${it.label}, ${loadQtyLabel(it)} (${joinE(it.forSites)})`)
    }
    try {
      if (!navigator.clipboard) throw new Error('sem clipboard')
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('Lista copiada', { description: 'Cole no grupo da equipe no WhatsApp.' })
    } catch {
      toast.error('Não foi possível copiar a lista')
    }
  }

  return (
    <Panel id="carga" className="scroll-mt-4 bg-muted">
      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Carga do caminhão</h2>
        </div>
        <Button variant="outline" size="sm" onClick={copy} disabled={!items.length}>
          <Copy className="size-3.5" strokeWidth={2} /> Copiar lista
        </Button>
      </div>

      {items.length ? (
        <>
          <div className="rounded-[20px] bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13.5px] font-bold text-ink">
                <span className="num">{done}</span> de <span className="num">{items.length}</span> itens no caminhão
              </span>
              <div className="flex items-center gap-2">
                {out > 0 && (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-soft px-2.5 text-[12px] font-semibold text-blue">
                    <ArrowUpFromLine className="size-3.5" strokeWidth={2.2} /> <span className="num">{out}</span> saem da base
                  </span>
                )}
                {back > 0 && (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-violet-soft px-2.5 text-[12px] font-semibold text-violet">
                    <ArrowDownToLine className="size-3.5" strokeWidth={2.2} /> <span className="num">{back}</span> voltam
                  </span>
                )}
                {ready ? (
                  <Badge tone="ok">
                    <Check className="-mx-0.5 size-3" strokeWidth={3} /> Carga pronta
                  </Badge>
                ) : (
                  null
                )}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div className={cn('h-full rounded-full', ready ? 'bg-green' : 'bg-black')} initial={false} animate={{ width: `${(done / items.length) * 100}%` }} transition={{ duration: 0.45, ease: EASE }} />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[minmax(0,1fr)] items-start gap-2 md:grid-cols-2">
            {groups.map((g) => {
              const gDone = g.items.filter((it) => loadChecked[key(it)]).length
              return (
                <div key={g.id} className="rounded-[20px] bg-card p-2 shadow-card">
                  <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2">
                    <IconCircle size={30} tone={g.tone}>
                      <g.icon className="size-3.5" strokeWidth={2.1} />
                    </IconCircle>
                    <span className="text-[14px] font-bold text-ink">{g.id}</span>
                    <span className="num ml-auto text-[12px] font-semibold text-ink-3">
                      {gDone}/{g.items.length}
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {g.items.map((it) => {
                      const on = !!loadChecked[key(it)]
                      return (
                        <li key={it.id} className="border-t border-line first:border-t-0">
                          <button
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleLoad(key(it))}
                            className="flex w-full items-center gap-3 rounded-[14px] px-2 py-2.5 text-left transition-colors hover:bg-surface"
                          >
                            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-150', on ? 'bg-black text-brand' : 'bg-card ring-[1.5px] ring-line-2 ring-inset')}>
                              <AnimatePresence initial={false}>
                                {on && (
                                  <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.18 }}>
                                    <Check className="size-3.5" strokeWidth={3} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn('block truncate text-[13.5px] font-semibold transition-colors', on ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>{it.label}</span>
                            </span>
                            <span className={cn('num inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12px] font-semibold', on ? 'bg-muted text-ink-3' : 'bg-muted text-ink')}>{loadQtyLabel(it)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <Card>
          <Empty icon={<ClipboardList className="size-5" strokeWidth={2} />} title="Nada para carregar">
            Os serviços de hoje desta equipe já foram concluídos.
          </Empty>
        </Card>
      )}
    </Panel>
  )
}

/* ───────────────────────── próximos serviços (ref. Future Events) ───────────────────────── */

function SectionHead({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function InfoPill({ icon: Icon, children, className }: { icon: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold', className)}>
      <Icon className="size-3.5 shrink-0 opacity-70" strokeWidth={2} />
      <span className="num truncate">{children}</span>
    </span>
  )
}

function NextJobs({ byTeam, onPick, onAll }: { byTeam: Record<string, Stop[]>; onPick: (teamId: string, jobId: string) => void; onAll: () => void }) {
  const upcoming = TEAMS.flatMap((t) => byTeam[t.id])
    .filter((s) => s.status === 'agendado' && s.startMin > NOW_MIN)
    .sort((a, b) => a.startMin - b.startMin)
    .slice(0, 3)

  return (
    <Panel className="flex flex-col bg-muted">
      <SectionHead title="Próximos serviços" action={<ViewAll onClick={onAll} />} />
      <div className="flex flex-col gap-2">
        {upcoming.map((s, i) => {
          const j = s.job
          const r = rentalOf(j)
          const hot = i === 0
          return (
            <motion.button
              key={j.id}
              layout
              onClick={() => onPick(j.teamId, j.id)}
              className={cn('rounded-[20px] p-4 text-left transition-[box-shadow,transform] duration-150 active:scale-[.99]', hot ? 'bg-yellow' : 'bg-card shadow-card hover:shadow-lift')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold text-ink">
                    {shortTitle(r)}, {j.type.toLowerCase()}
                  </div>
                </div>
                {hot && (
                  <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-card px-2.5 text-[11.5px] font-semibold text-ink">
                    
                    em {durFmt(s.startMin - NOW_MIN)}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex min-w-0 flex-1 gap-1.5">
                  <InfoPill icon={Clock} className={hot ? 'bg-white/55 text-ink' : 'bg-muted text-ink-2'}>
                    {hhmm(s.startMin)} às {hhmm(s.startMin + j.durationMin)}
                  </InfoPill>
                  <InfoPill icon={MapPin} className={cn('max-sm:hidden', hot ? 'bg-white/55 text-ink' : 'bg-muted text-ink-2')}>
                    {bairroOf(j).name}
                  </InfoPill>
                </div>
                <AvatarStack size={32}>
                  <TeamAvatar teamId={j.teamId} size={32} />
                </AvatarStack>
              </div>
            </motion.button>
          )
        })}
        {!upcoming.length && (
          <Card>
            <Empty title="Sem mais serviços hoje" />
          </Card>
        )}
      </div>
    </Panel>
  )
}

/* ───────────────────────── estoque de hoje ───────────────────────── */

function StockCard() {
  const nav = useNavigate()
  const unitState = useDemo((s) => s.unitState)
  const p = PRODUCT.bq
  // mesma conta da tela Equipamentos: reservado olha o pico dos próximos 14 dias
  const split = React.useMemo(() => productSplits(unitState).find((x) => x.product.id === 'bq')!, [unitState])
  const { campo: field, reservado: reserved, manutencao: maint, livre: free } = split
  const short = React.useMemo(() => shortages(14, unitState).filter((s) => s.productId === 'bq'), [unitState])
  const worst = short.reduce((a, s) => Math.max(a, s.need - s.stock), 0)
  const first = short[0]
  const last = short[short.length - 1]

  return (
    <Panel className="flex flex-col bg-muted">
      <SectionHead title="Estoque" sub="Banheiro químico standard" action={<ViewAll onClick={() => nav('/equipamentos')}>Equipamentos</ViewAll>} />
      <div className="rounded-[20px] bg-card p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="num text-[30px] leading-none font-bold tracking-[-0.03em] text-ink">{free}</span>
            <span className="text-[13px] font-semibold text-ink-3">livres para novas reservas</span>
          </div>
          <span className="num text-[12.5px] font-semibold text-ink-3">de {p.stock}</span>
        </div>
        <SegmentBar
          className="mt-3"
          parts={[
            { value: field, color: SPLIT_COLORS.campo },
            { value: reserved, color: SPLIT_COLORS.reservado },
            { value: free, color: SPLIT_COLORS.livre },
            { value: maint, color: SPLIT_COLORS.manutencao },
          ]}
        />
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px] font-semibold text-ink-2">
          {[
            ['bg-black', 'Em campo', field],
            ['bg-brand', 'Reservado', reserved],
            ['bg-yellow', 'Manutenção', maint],
            ['bg-green', 'Livre', free],
          ].map(([c, l, n]) => (
            <span key={l as string} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', c as string)} />
              {l}
              <span className="num ml-auto text-ink">{n}</span>
            </span>
          ))}
        </div>
      </div>
      {first && (
        <button onClick={() => nav('/equipamentos')} className="mt-2 flex items-start gap-3 rounded-[20px] bg-red-soft p-4 text-left transition-transform active:scale-[.99]">
          <IconCircle size={30} tone="white" className="shadow-none">
            <AlertTriangle className="size-3.5 text-red" strokeWidth={2.2} />
          </IconCircle>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] leading-snug font-bold text-ink">
              Faltam <span className="num">{worst}</span> banheiros {first.offset === last.offset ? `em ${ddmm(first.offset)}` : `de ${ddmm(first.offset)} a ${ddmm(last.offset)}`}
            </span>
          </span>
          <ArrowRight className="mt-1 size-4 shrink-0 text-red" strokeWidth={2.2} />
        </button>
      )}
    </Panel>
  )
}

const ddmm = (offset: number) => fmt.date(dayDate(offset)).slice(0, 5)

const dayDate = (offset: number) => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + offset)
  return d
}

/* ───────────────────────── equipes em campo (ref. Onboarding) ───────────────────────── */

/** Serviço que o botão "App da equipe" abre: o atual da equipe escolhida, o próximo ou o último */
function appJob(byTeam: Record<string, Stop[]>, teamId: string) {
  const stops = byTeam[teamId]
  const pick = stops.find((s) => s.status === 'em-andamento') ?? stops.find((s) => s.status === 'a-caminho') ?? stops.find((s) => s.status === 'agendado') ?? stops[stops.length - 1]
  return pick?.job
}

/** Primeiro horário livre da equipe depois de agora (fora do almoço e sem encostar em outro serviço) */
function freeSlot(stops: Stop[], dur: number) {
  const busy = stops.map((s) => [s.startMin - 10, s.startMin + s.job.durationMin + 10] as const)
  for (let t = Math.ceil((NOW_MIN + 30) / 10) * 10; t < 18 * 60; t += 10) {
    if (t < 13 * 60 + 30 && t + dur > 12 * 60) continue
    if (busy.some(([a, b]) => t < b && t + dur > a)) continue
    return t
  }
  return 17 * 60
}

function teamState(stops: Stop[]) {
  const cur = stops.find((s) => s.status === 'em-andamento')
  if (cur) return { dot: 'bg-brand', txt: `Em ${shortTitle(rentalOf(cur.job))}` }
  const way = stops.find((s) => s.status === 'a-caminho')
  if (way) return { dot: 'bg-blue', txt: `Indo para ${shortTitle(rentalOf(way.job))}` }
  const next = stops.find((s) => s.status === 'agendado')
  if (next) return { dot: 'bg-ink-4', txt: `Próximo às ${hhmm(next.startMin)}` }
  return { dot: 'bg-green', txt: 'Dia encerrado' }
}

function Teams({ byTeam, activeTeam, onPick }: { byTeam: Record<string, Stop[]>; activeTeam: string; onPick: (teamId: string) => void }) {
  const nav = useNavigate()
  return (
    <Panel className="flex flex-col bg-muted">
      <SectionHead title="Equipes em campo" action={<ViewAll onClick={() => { const j = appJob(byTeam, activeTeam); if (j) openJob(nav, j) }}>App da equipe</ViewAll>} />
      <div className="grid grid-cols-3 gap-2">
        {TEAMS.map((t) => {
          const stops = byTeam[t.id]
          const state = teamState(stops)
          const done = stops.filter((s) => s.status === 'concluido').length
          const active = t.id === activeTeam
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center rounded-[20px] bg-card px-2 pt-5 pb-4 text-center shadow-card transition-[box-shadow,transform] duration-150 hover:shadow-lift active:scale-[.98]',
                active && 'ring-2 ring-black',
              )}
            >
              <span className="relative">
                <TeamAvatar teamId={t.id} size={56} />
                <span className={cn('absolute right-0 bottom-0 size-3.5 rounded-full ring-[3px] ring-card', state.dot)} />
              </span>
              <span className="mt-3 w-full truncate text-[13.5px] font-bold text-ink">{t.name}</span>
              <span className="mt-3 inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 text-[11.5px] font-semibold text-ink-2">
                <ClipboardCheck className="size-3.5 shrink-0 text-ink-3" strokeWidth={2} />
                <span className="num">
                  {done}/{stops.length}
                </span>
                <span className="max-[460px]:hidden">serviços</span>
              </span>
              <span className="mt-2 w-full truncate text-[11.5px] font-semibold text-ink-2">{state.txt}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

/* ───────────────────────── precisa de atenção (ref. cartão Alert) ───────────────────────── */

type AttnTone = 'red' | 'yellow' | 'blue' | 'brand'
type AttnItem = {
  id: string
  tone: AttnTone
  kind: string
  icon: LucideIcon
  rental?: Rental
  title: React.ReactNode
  sub: React.ReactNode
  action: { label: string; done: string; run: () => void; nav?: boolean }
}

const ATTN_TONE: Record<AttnTone, { bg: string; fg: string }> = {
  red: { bg: 'bg-red-soft', fg: 'text-red' },
  yellow: { bg: 'bg-yellow-soft', fg: 'text-yellow-ink' },
  blue: { bg: 'bg-blue-soft', fg: 'text-blue' },
  brand: { bg: 'bg-brand-soft', fg: 'text-brand-ink' },
}

function Attention({ byTeam }: { byTeam: Record<string, Stop[]> }) {
  const nav = useNavigate()
  const occurrences = useDemo((s) => s.occurrences)
  const avisos = useDemo((s) => s.avisos)
  const setAvisoStatus = useDemo((s) => s.setAvisoStatus)
  const addJob = useDemo((s) => s.addJob)
  const resolved = useDemo((s) => s.resolved)
  const resolve = useDemo((s) => s.resolve)
  const addAvisos = useDemo((s) => s.addAvisos)

  const stops = TEAMS.flatMap((t) => byTeam[t.id])
  const items: AttnItem[] = []

  // avisos do QR e da equipe
  for (const o of occurrences.filter((x) => x.status === 'aberta')) {
    const r = RENTAL[o.rentalId]
    const cleaning = o.kind === 'sem-papel' || o.kind === 'sujo' || o.kind === 'cheio'
    const scheduled = stops.find(
      (s) => s.job.rentalId === o.rentalId && s.status !== 'concluido' && (s.job.note.includes(o.unitId) || s.job.type === 'Manutenção' || (cleaning && s.job.type === 'Limpeza')),
    )
    const team = TEAM[r.teamId]
    const id = `occ-${o.id}`
    const when = daysFromToday(o.at) === 0 ? `hoje às ${fmt.time(o.at)}` : `${daysFromToday(o.at) === -1 ? 'ontem' : fmt.short(o.at)} às ${fmt.time(o.at)}`
    items.push({
      id,
      tone: o.source === 'qr' ? 'brand' : 'yellow',
      kind: o.source === 'qr' ? 'Aviso pelo QR' : 'Registro da equipe',
      icon: o.source === 'qr' ? QrCode : Wrench,
      rental: r,
      title: (
        <>
          {o.unitId}: {OCC_KIND[o.kind].label.toLowerCase()}
        </>
      ),
      sub: (
        <>
          {shortTitle(r)}, {when}.{' '}
          {scheduled
            ? scheduled.status === 'em-andamento'
              ? `A ${TEAM[scheduled.job.teamId].name} está no local agora.`
              : `Na rota da ${TEAM[scheduled.job.teamId].name} às ${hhmm(scheduled.startMin)}.`
            : 'Ainda sem equipe.'}
        </>
      ),
      action: scheduled
        ? {
            label: 'Avisar o cliente',
            done: 'Cliente avisado',
            run: () => {
              resolve(id)
              toast.success(`${r.contact.name} foi avisado pelo WhatsApp`, {
                description: scheduled.status === 'em-andamento' ? `A ${TEAM[scheduled.job.teamId].name} já está no local.` : `A ${TEAM[scheduled.job.teamId].name} passa às ${hhmm(scheduled.startMin)}.`,
              })
            },
          }
        : {
            label: 'Encaixar na rota',
            done: 'Na rota',
            run: () => {
              const slot = freeSlot(byTeam[team.id], 20)
              const d = new Date(TODAY)
              d.setHours(Math.floor(slot / 60), slot % 60, 0, 0)
              addJob({
                id: newId('s'),
                rentalId: o.rentalId,
                teamId: team.id,
                start: d.toISOString(),
                durationMin: 20,
                type: cleaning ? 'Limpeza' : 'Manutenção',
                note: `${OCC_KIND[o.kind].label} na ${o.unitId}`,
                status: 'agendado',
                fixedTime: false,
                units: 1,
              })
              addAvisos([
                {
                  id: newId('av'),
                  rentalId: r.id,
                  kind: 'ocorrencia',
                  title: `${OCC_KIND[o.kind].short} na ${o.unitId}`,
                  dueDate: d.toISOString(),
                  sendDate: NOW.toISOString(),
                  status: 'enviado',
                  origin: 'Aviso pelo QR da unidade',
                },
              ])
              toast.success(`Encaixado na rota da ${team.name} às ${hhmm(slot)}`, { description: `${r.contact.name} recebeu o aviso pelo WhatsApp.` })
            },
          },
    })
  }

  // atrasos
  for (const s of stops) {
    if (s.status !== 'agendado' && s.status !== 'a-caminho') continue
    const late = NOW_MIN - s.startMin
    if (late < 15) continue
    const r = rentalOf(s.job)
    const id = `late-${s.job.id}`
    items.push({
      id,
      tone: 'red',
      kind: 'Atraso',
      icon: Timer,
      rental: r,
      title: (
        <>
          {TEAM[s.job.teamId].name} chega {late + 10} min depois em {shortTitle(r)}
        </>
      ),
      sub: (
        <>
          {s.job.type} marcada para {hhmm(s.startMin)}, chegada prevista {hhmm(NOW_MIN + 10)}
        </>
      ),
      action: {
        label: 'Avisar o cliente',
        done: 'Cliente avisado',
        run: () => {
          resolve(id)
          toast.success(`${r.contact.name} foi avisado do atraso`, { description: 'Mensagem enviada pelo WhatsApp.' })
        },
      },
    })
  }

  // falta de estoque
  const short = shortages(14)
  if (short.length) {
    const byProduct = new Map<string, typeof short>()
    for (const s of short) byProduct.set(s.productId, [...(byProduct.get(s.productId) ?? []), s])
    for (const [pid, list] of byProduct) {
      const p = PRODUCT[pid as keyof typeof PRODUCT]
      const worst = list.reduce((a, s) => Math.max(a, s.need - s.stock), 0)
      items.push({
        id: `stock-${pid}`,
        tone: 'red',
        kind: 'Falta de estoque',
        icon: Boxes,
        title: (
          <>
            Faltam {worst} {worst === 1 ? p.unit[0] : p.unit[1]} de {ddmm(list[0].offset)} a {ddmm(list[list.length - 1].offset)}
          </>
        ),
        sub: 'Reservas confirmadas passam do estoque. Veja quem disputa as unidades.',
        action: { label: 'Ver equipamentos', done: '', nav: true, run: () => nav('/equipamentos') },
      })
    }
  }

  // avisos sem resposta
  for (const a of avisos.filter((x) => x.status === 'sem-resposta')) {
    const r = RENTAL[a.rentalId]
    const id = `av-${a.id}`
    items.push({
      id,
      tone: 'yellow',
      kind: 'Sem resposta',
      icon: MessageCircle,
      rental: r,
      title: (
        <>
          {shortTitle(r)}: {lowerFirst(a.title)}
        </>
      ),
      sub: (
        <>
          Enviado para {r.contact.name}, {daysFromToday(a.sendDate) >= 0 ? `hoje às ${fmt.time(a.sendDate)}` : daysFromToday(a.sendDate) === -1 ? 'ontem' : `há ${-daysFromToday(a.sendDate)} dias`}
        </>
      ),
      action: {
        label: 'Reenviar',
        done: 'Reenviado',
        run: () => {
          resolve(id)
          setAvisoStatus(a.id, 'enviado')
          toast.success(`Aviso reenviado para ${r.contact.name}`, { description: 'A resposta aparece em Avisos.' })
        },
      },
    })
  }

  const open = items.filter((i) => !resolved[i.id]).length
  const [all, setAll] = React.useState(false)
  const shown = all ? items : items.slice(0, 8)

  return (
    <Card id="atencao" className="mt-4 scroll-mt-4 p-2">
      <SectionHead
        title="Precisa de atenção"
        sub={open ? 'Resolva antes dos próximos serviços' : 'Tudo resolvido por hoje'}
        action={open ? <Badge tone="dark">{open} {open === 1 ? 'aberto' : 'abertos'}</Badge> : <Badge tone="ok">Em dia</Badge>}
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((it, i) => {
          const done = resolved[it.id]
          const t = done ? { bg: 'bg-green-soft', fg: 'text-green' } : ATTN_TONE[it.tone]
          return (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03, ease: EASE }}
              className={cn('flex flex-col rounded-[20px] p-4 transition-colors duration-300 sm:min-h-[164px]', t.bg)}
            >
              <div className="flex items-center gap-2">
                <IconCircle size={30} tone="white" className="shadow-none">
                  {done ? <CheckCheck className={cn('size-3.5', t.fg)} strokeWidth={2.2} /> : <it.icon className={cn('size-3.5', t.fg)} strokeWidth={2.2} />}
                </IconCircle>
                <span className={cn('text-[13px] font-bold', t.fg)}>{done ? it.action.done : it.kind}</span>
                {it.rental && <RentalAvatar rental={it.rental} size={30} className={cn('ml-auto', done && 'opacity-50')} />}
              </div>
              <div className={cn('mt-3 text-[14px] leading-snug font-semibold text-ink', done && 'text-ink-3 line-through decoration-ink-4')}>{it.title}</div>
              <div className="mt-1 text-[12.5px] leading-snug font-medium text-ink-2">{it.sub}</div>
              {!done && (
                <button onClick={it.action.run} className={cn('group mt-auto inline-flex items-center gap-1 self-start pt-3 text-[13px] font-bold', t.fg)}>
                  {it.action.label}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
      {items.length > 8 && (
        <div className="flex justify-center pt-3 pb-1">
          <Button variant="subtle" size="sm" onClick={() => setAll((x) => !x)}>
            {all ? 'Mostrar menos' : `Ver mais ${items.length - 8}`}
          </Button>
        </div>
      )}
    </Card>
  )
}
