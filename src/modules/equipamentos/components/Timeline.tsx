import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Banner, Button, Dialog, Field, Input, Segmented, Select, Skeleton, StatusDot, cn } from '@/ui'
import { reduced } from '@/ui/Motion'
import { RENTAL_STATUS, useUnitStatus } from '@/app/status'
import { addDays, diffDays, eachDay, today as todayFn, weekday } from '@/domain/dates'
import { formatDate } from '@/lib/format'
import { getTimeline, useQuery, type TimelineBlock, type TimelineType, type TimelineUnit } from '@/services'
import { TypeArtTile } from './TypeArt'

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const SPANS = [14, 21, 30] as const
const UNIT_STEP = 12
const STRIP_H = 44
const UNIT_ROW_H = 38
const EASE = [0.16, 1, 0.3, 1] as const
const startOf = () => addDays(todayFn(), -2)

/** Cor da barra de locação pela situação, só com tokens. Orçamento é contorno tracejado. */
const BAR: Record<string, string> = {
  confirmada: 'bg-info-soft text-info-ink ring-1 ring-inset ring-info/50',
  em_campo: 'bg-accent text-on-accent',
  retirada: 'bg-warn-soft text-warn-ink ring-1 ring-inset ring-warn/50',
  faturada: 'bg-ok-soft text-ok-ink ring-1 ring-inset ring-ok/50',
}

interface Sel {
  typeId: string
  a: number
  b: number
  dragging: boolean
}

export function Timeline({ initialType }: { initialType?: string }) {
  const navigate = useNavigate()
  const UNIT_STATUS = useUnitStatus()
  const [days, setDays] = React.useState<(typeof SPANS)[number]>(21)
  const [from, setFrom] = React.useState(startOf)
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(initialType ? [initialType] : []))
  const [limit, setLimit] = React.useState<Record<string, number>>({})
  const [sel, setSel] = React.useState<Sel | null>(null)
  const [hover, setHover] = React.useState<{ typeId: string; idx: number } | null>(null)
  const [dialog, setDialog] = React.useState<{ typeId?: string } | null>(null)
  const q = useQuery(() => getTimeline(from, days), [from, days])
  const t0 = todayFn()

  // largura útil do bloco: define a largura do dia (cabem os dias visíveis; se não couber, rola)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [viewW, setViewW] = React.useState(1000)
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewW(el.clientWidth))
    ro.observe(el)
    setViewW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const narrow = viewW < 640
  const leftW = narrow ? 76 : 276
  const dayW = Math.max(narrow ? 36 : 34, Math.floor((viewW - leftW) / days))
  const gridW = dayW * days
  const dates = React.useMemo(() => eachDay(from, addDays(from, days - 1)), [from, days])
  const todayIdx = diffDays(from, t0)
  const todayVisible = todayIdx >= 0 && todayIdx < days

  const data = q.data
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  React.useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSel(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel])

  const months = React.useMemo(() => {
    const out: { label: string; from: number; n: number }[] = []
    dates.forEach((d, i) => {
      const m = Number(d.slice(5, 7)) - 1
      const last = out[out.length - 1]
      if (last && last.label === MONTH[m]) last.n++
      else out.push({ label: MONTH[m], from: i, n: 1 })
    })
    return out
  }, [dates])

  const rangeLabel = `${formatDate(from).slice(0, 5)} a ${formatDate(addDays(from, days - 1)).slice(0, 5)}`

  return (
    <section aria-label="Linha do tempo de disponibilidade" className="min-w-0 rounded-card bg-raised p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <Segmented<string> label="Dias visíveis" size="sm" value={String(days)} onChange={(v) => setDays(Number(v) as (typeof SPANS)[number])} options={SPANS.map((n) => ({ value: String(n), label: `${n} dias` }))} />
        <div className="ml-auto flex items-center gap-1.5">
          <span className="tnum mr-1 hidden text-body font-semibold text-fg-2 sm:inline">{rangeLabel}</span>
          <Button variant="secondary" size="sm" iconOnly icon={ChevronLeft} aria-label="Dias anteriores" onClick={() => setFrom((f) => addDays(f, -7))} />
          <Button variant="secondary" size="sm" onClick={() => setFrom(startOf())}>
            Hoje
          </Button>
          <Button variant="secondary" size="sm" iconOnly icon={ChevronRight} aria-label="Próximos dias" onClick={() => setFrom((f) => addDays(f, 7))} />
          <Button variant="primary" size="sm" icon={CalendarPlus} className="sm:hidden" onClick={() => setDialog({})}>
            Novo período
          </Button>
        </div>
      </div>

      {q.error && !data ? (
        <Banner tone="danger" title="Não foi possível carregar a linha do tempo." action={<Button size="sm" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : (
        <div ref={scrollRef} className="relative max-h-[min(720px,calc(100dvh-210px))] min-h-[320px] overflow-auto overscroll-x-contain rounded-[16px] bg-raised ring-1 ring-hairline ring-inset" aria-busy={q.initialLoading || undefined}>
          {!data ? (
            <div className="flex flex-col gap-2 p-3" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} shape="block" className="h-16 rounded-[16px]" />
              ))}
            </div>
          ) : (
            <div className="relative" style={{ width: leftW + gridW }}>
              {/* cabeçalho de dias, fixo no topo */}
              <div className="sticky top-0 z-30 bg-raised">
                <div className="flex h-7 border-b border-hairline">
                  <div className="sticky left-0 z-10 shrink-0 bg-raised" style={{ width: leftW }} />
                  <div className="relative" style={{ width: gridW }}>
                    {months.map((m) => (
                      <span key={m.label + m.from} className="absolute top-0 flex h-7 items-center pl-2 text-caption font-semibold text-fg-3 capitalize" style={{ left: m.from * dayW, width: m.n * dayW }}>
                        <span className="sticky left-[calc(var(--lw)+8px)] truncate" style={{ ['--lw' as string]: `${leftW}px` }}>
                          {m.n >= 3 ? m.label : ''}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex border-b border-hairline">
                  <div className="sticky left-0 z-10 shrink-0 bg-raised" style={{ width: leftW }} />
                  {dates.map((d) => {
                    const wd = weekday(d)
                    const isToday = d === t0
                    const weekend = wd === 0 || wd === 6
                    return (
                      <div key={d} className={cn('flex h-12 shrink-0 flex-col items-center justify-center gap-0.5', weekend && 'bg-sunken/60')} style={{ width: dayW }} aria-current={isToday ? 'date' : undefined}>
                        <span className={cn('text-caption leading-none', isToday ? 'font-semibold text-accent-ink' : 'text-fg-3')}>{WEEK[wd]}</span>
                        <span className={cn('tnum grid h-6 min-w-6 place-items-center rounded-pill px-1 text-body leading-none font-semibold', isToday ? 'bg-accent text-on-accent' : 'text-fg')}>{Number(d.slice(8, 10))}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* corpo */}
              <div className="relative">
                {/* fins de semana */}
                <div aria-hidden className="pointer-events-none absolute inset-y-0 z-0" style={{ left: leftW, width: gridW }}>
                  {dates.map((d, i) => {
                    const wd = weekday(d)
                    return wd === 0 || wd === 6 ? <span key={d} className="absolute inset-y-0 bg-sunken/60" style={{ left: i * dayW, width: dayW }} /> : null
                  })}
                </div>
                {/* linha de hoje */}
                {todayVisible ? (
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 z-[6]" style={{ left: leftW + todayIdx * dayW + dayW / 2 - 1, width: 2 }}>
                    <motion.span className="block size-full rounded-pill bg-accent" animate={reduced() ? undefined : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
                  </div>
                ) : null}

                {data.types.map((t, ti) => (
                  <TypeBlock
                    key={t.type.id}
                    t={t}
                    index={ti}
                    count={data.types.length}
                    from={from}
                    dayW={dayW}
                    gridW={gridW}
                    leftW={leftW}
                    narrow={narrow}
                    viewW={viewW}
                    expanded={open.has(t.type.id)}
                    limit={limit[t.type.id] ?? UNIT_STEP}
                    onMore={() => setLimit((l) => ({ ...l, [t.type.id]: (l[t.type.id] ?? UNIT_STEP) + UNIT_STEP }))}
                    onToggle={() => toggle(t.type.id)}
                    sel={sel?.typeId === t.type.id ? sel : null}
                    setSel={setSel}
                    hover={hover?.typeId === t.type.id ? hover.idx : null}
                    setHover={(idx) => setHover(idx === null ? null : { typeId: t.type.id, idx })}
                    onNew={() => setDialog({ typeId: t.type.id })}
                    onCreate={(a, b) => navigate(`/locacoes/nova?tipo=${t.type.id}&inicio=${dates[Math.min(a, b)]}&fim=${dates[Math.max(a, b)]}`)}
                    unitLabel={(u) => UNIT_STATUS[u.status].label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data ? <Legend /> : null}

      <PeriodDialog
        open={dialog !== null}
        typeId={dialog?.typeId}
        types={data?.types ?? []}
        onClose={() => setDialog(null)}
        onSubmit={(typeId, a, b) => {
          setDialog(null)
          navigate(`/locacoes/nova?tipo=${typeId}&inicio=${a}&fim=${b}`)
        }}
      />
    </section>
  )
}

function Legend() {
  const items = [
    { tone: 'accent' as const, label: RENTAL_STATUS.em_campo.label },
    { tone: 'info' as const, label: RENTAL_STATUS.confirmada.label },
    { tone: 'warn' as const, label: RENTAL_STATUS.retirada.label },
    { tone: 'ok' as const, label: RENTAL_STATUS.faturada.label },
  ]
  return (
    <div aria-hidden className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-caption text-fg-2">
      {items.map((i) => (
        <StatusDot key={i.label} tone={i.tone} className="text-caption text-fg-2">
          {i.label}
        </StatusDot>
      ))}
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-5 rounded-pill border border-dashed border-accent bg-accent-soft" />
        Orçamento
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="ds-hatch h-2.5 w-5 rounded-pill bg-warn-soft ring-1 ring-warn/50 ring-inset" />
        Indisponível
      </span>
    </div>
  )
}

/* ───────── linha do tipo + unidades ───────── */

interface BlockProps {
  t: TimelineType
  index: number
  count: number
  from: string
  dayW: number
  gridW: number
  leftW: number
  narrow: boolean
  viewW: number
  expanded: boolean
  limit: number
  onMore: () => void
  onToggle: () => void
  sel: Sel | null
  setSel: (s: Sel | null | ((p: Sel | null) => Sel | null)) => void
  hover: number | null
  setHover: (idx: number | null) => void
  onNew: () => void
  onCreate: (a: number, b: number) => void
  unitLabel: (u: TimelineUnit) => string
}

function lanes(items: { start: string; end: string }[], from: string): number[] {
  const ends: number[] = []
  return items.map((it) => {
    const s = diffDays(from, it.start)
    const e = diffDays(from, it.end)
    let lane = ends.findIndex((x) => x < s)
    if (lane < 0) lane = ends.length
    ends[lane] = e
    return lane
  })
}

function TypeBlock(p: BlockProps) {
  const { t, from, dayW, gridW, leftW, narrow, expanded } = p
  const inField = t.units.filter((u) => u.status === 'em_campo').length
  const quoteLanes = React.useMemo(() => lanes(t.quotes, from), [t.quotes, from])
  const nLanes = Math.min(3, quoteLanes.length ? Math.max(...quoteLanes) + 1 : 0)
  const rowH = STRIP_H + 22 + (nLanes ? nLanes * 13 + 2 : 0)
  const stripRef = React.useRef<HTMLDivElement>(null)
  const idxAt = (clientX: number) => {
    const r = stripRef.current!.getBoundingClientRect()
    return Math.max(0, Math.min(t.days.length - 1, Math.floor((clientX - r.left) / dayW)))
  }
  const minFree = (a: number, b: number) => Math.min(...t.days.slice(Math.min(a, b), Math.max(a, b) + 1).map((d) => d.free))
  const above = p.index >= p.count - 2

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.pointerType === 'touch') return
    const i = idxAt(e.clientX)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    p.setSel({ typeId: t.type.id, a: i, b: i, dragging: true })
  }
  const onMove = (e: React.PointerEvent) => {
    const i = idxAt(e.clientX)
    if (p.sel?.dragging) p.setSel((s) => (s ? { ...s, b: i } : s))
    else p.setHover(i)
  }
  const onUp = () => p.setSel((s) => (s ? { ...s, dragging: false } : s))

  const visibleUnits = t.units.slice(0, p.limit)
  const hoverDay = p.hover !== null ? t.days[p.hover] : null
  const minLabelW = 64

  return (
    <div className={cn('relative border-b border-hairline last:border-b-0', p.sel ? 'z-[8]' : 'z-[1]')}>
      {/* linha do tipo */}
      <div className="flex" style={{ height: rowH }}>
        <div className={cn('sticky left-0 z-10 flex shrink-0 items-center bg-raised', narrow ? 'justify-center' : 'gap-1 pr-2 pl-2')} style={{ width: leftW }}>
          <button
            type="button"
            onClick={p.onToggle}
            aria-expanded={expanded}
            aria-label={`${t.type.name}, ${inField} em campo de ${t.total}. ${expanded ? 'Recolher' : 'Expandir'} unidades`}
            className={cn('flex min-w-0 items-center rounded-control text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', narrow ? 'flex-col gap-1 p-1' : 'flex-1 gap-2.5 p-1.5')}
          >
            <TypeArtTile typeId={t.type.id} prefix={t.type.prefix} className={cn('rounded-[14px]', narrow ? 'size-10' : 'size-12')} />
            <span className={cn('min-w-0', narrow ? 'text-center' : 'flex-1')}>
              {narrow ? null : <span className="block truncate text-body font-semibold text-fg">{t.type.short}</span>}
              <span className="tnum block text-body font-semibold text-fg">
                {inField}
                <span className="text-fg-3">/{t.total}</span>
              </span>
            </span>
            {narrow ? null : <ChevronDown aria-hidden size={18} strokeWidth={2} className={cn('shrink-0 text-fg-3 transition-transform duration-200 ease-[var(--ease-ui)]', expanded && 'rotate-180')} />}
          </button>
          {narrow ? null : <Button variant="ghost" size="sm" iconOnly icon={CalendarPlus} aria-label={`Novo período de ${t.type.name}`} onClick={p.onNew} />}
        </div>

        {/* faixa de ocupação por dia: arraste para escolher um período */}
        <div className="relative shrink-0" style={{ width: gridW }}>
          <div
            ref={stripRef}
            role="group"
            aria-label={`Ocupação de ${t.type.name} por dia. Arraste para escolher um período`}
            className="absolute inset-x-0 top-[22px] cursor-crosshair select-none"
            style={{ height: STRIP_H }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={() => p.setHover(null)}
          >
            {t.days.map((d, i) => {
              const ratio = t.usable ? d.booked / t.usable : 0
              const none = d.free <= 0
              const h = d.booked ? Math.max(5, Math.round(ratio * STRIP_H)) : 0
              return (
                <span key={d.date} className="absolute bottom-0 block" style={{ left: i * dayW + 2, width: dayW - 4, height: STRIP_H }}>
                  <span aria-hidden className={cn('absolute inset-0 rounded-[8px]', none ? 'bg-danger-soft' : 'bg-sunken')} />
                  <motion.span
                    aria-hidden
                    className={cn('absolute inset-x-0 bottom-0 block rounded-[8px] transition-[height,opacity] duration-300 ease-[var(--ease-ui)]', none ? 'bg-danger' : 'bg-accent')}
                    style={{ height: h, opacity: none ? 1 : 0.35 + 0.65 * ratio, transformOrigin: 'bottom' }}
                    initial={reduced() ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, ease: EASE, delay: p.index * 0.05 + i * 0.012 }}
                  />
                </span>
              )
            })}
            {p.sel ? (
              <span aria-hidden className="pointer-events-none absolute inset-y-[-2px] rounded-[10px] bg-accent/20 ring-2 ring-accent ring-inset" style={{ left: Math.min(p.sel.a, p.sel.b) * dayW, width: (Math.abs(p.sel.b - p.sel.a) + 1) * dayW }} />
            ) : null}
          </div>

          {/* etiqueta ao passar o mouse */}
          {hoverDay && !p.sel ? (
            <span
              aria-hidden
              className="tnum pointer-events-none absolute z-20 -translate-x-1/2 rounded-pill bg-inverse px-2.5 py-1 text-caption font-semibold whitespace-nowrap text-on-inverse"
              style={{ top: 1, left: Math.max(minLabelW / 2, Math.min(gridW - minLabelW / 2, (p.hover! + 0.5) * dayW)) }}
            >
              {hoverDay.free} de {t.usable} livres
            </span>
          ) : null}
          {p.sel ? (
            <span
              aria-hidden
              className="tnum pointer-events-none absolute z-20 rounded-pill bg-accent px-2.5 py-1 text-caption font-semibold whitespace-nowrap text-on-accent"
              style={{ top: 0, left: Math.max(0, Math.min(gridW - 128, Math.min(p.sel.a, p.sel.b) * dayW)) }}
            >
              {formatDate(addDays(from, Math.min(p.sel.a, p.sel.b))).slice(0, 5)} a {formatDate(addDays(from, Math.max(p.sel.a, p.sel.b))).slice(0, 5)}
            </span>
          ) : null}

          {/* orçamentos do tipo: ainda não têm unidade, ficam em contorno tracejado */}
          {t.quotes.map((qt, i) => {
            const lane = quoteLanes[i]
            if (lane > 2) return null
            const s = Math.max(0, diffDays(from, qt.start))
            const e = Math.min(t.days.length - 1, diffDays(from, qt.end))
            return (
              <Link
                key={qt.rentalId}
                to={`/locacoes/${qt.rentalId}`}
                title={`${qt.code} · ${qt.clientName} · orçamento de ${qt.qty} ${t.type.short.toLowerCase()}`}
                aria-label={`Orçamento ${qt.code}, ${qt.clientName}, ${qt.qty} ${t.type.short}`}
                className="absolute z-[3] block rounded-pill border-[1.5px] border-dashed border-accent bg-accent-soft transition-colors duration-150 hover:bg-accent/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                style={{ left: s * dayW + 2, width: Math.max(8, (e - s + 1) * dayW - 4), height: 11, top: 22 + STRIP_H + 4 + lane * 13 }}
              />
            )
          })}

          {/* balão do período escolhido */}
          {p.sel && !p.sel.dragging ? (
            <div
              role="dialog"
              aria-label="Período escolhido"
              className={cn('absolute z-40 flex items-center gap-3 rounded-[16px] bg-overlay p-2 pl-4 text-fg shadow-overlay ring-1 ring-hairline', above ? 'bottom-[calc(100%-40px)]' : 'top-[calc(100%-6px)]')}
              style={{ left: Math.max(4, Math.min(gridW - 312, (Math.min(p.sel.a, p.sel.b) + 0.5) * dayW)) }}
            >
              <span className="text-body font-semibold whitespace-nowrap">
                <span className="tnum">{minFree(p.sel.a, p.sel.b)}</span> {minFree(p.sel.a, p.sel.b) === 1 ? 'livre' : 'livres'} no período
              </span>
              <Button variant="primary" size="sm" onClick={() => p.onCreate(p.sel!.a, p.sel!.b)}>
                Criar orçamento
              </Button>
              <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Fechar" onClick={() => p.setSel(null)} />
            </div>
          ) : null}
        </div>
      </div>

      {/* unidades */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="units"
            initial={reduced() ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced() ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced() ? 0 : 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-hairline">
              {visibleUnits.map((u, i) => (
                <UnitRow key={u.id} u={u} from={from} dayW={dayW} gridW={gridW} leftW={leftW} narrow={narrow} delay={i * 0.03} label={p.unitLabel(u)} typeId={t.type.id} prefix={t.type.prefix} days={t.days.length} />
              ))}
              {t.units.length > p.limit ? (
                <div className="sticky left-0 flex items-center justify-center py-3" style={{ width: p.viewW }}>
                  <Button variant="secondary" size="sm" onClick={p.onMore}>
                    Mostrar mais ({t.units.length - p.limit})
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function UnitRow({ u, from, dayW, gridW, leftW, narrow, delay, label, typeId, prefix, days }: { u: TimelineUnit; from: string; dayW: number; gridW: number; leftW: number; narrow: boolean; delay: number; label: string; typeId: string; prefix: string; days: number }) {
  const idleLong = u.status === 'disponivel' && (u.idleDays ?? 0) > 30
  // realce do vazio longo: do início da parada até a próxima locação (ou o fim da janela)
  let idleSpan: { s: number; e: number } | null = null
  if (idleLong && u.idleSince) {
    const s = Math.max(0, diffDays(from, u.idleSince))
    const next = u.blocks.find((b) => b.start > (u.idleSince as string))
    const e = Math.min(days - 1, next ? diffDays(from, next.start) - 1 : days - 1)
    if (e >= s) idleSpan = { s, e }
  }
  return (
    <div className="flex border-b border-hairline/70 last:border-b-0" style={{ height: UNIT_ROW_H }}>
      <div className={cn('sticky left-0 z-10 flex shrink-0 items-center bg-raised', narrow ? 'justify-center px-1' : 'gap-2 pr-2 pl-5')} style={{ width: leftW }}>
        <Link to={`/equipamentos/${u.code}`} title={`${u.code} · ${label}`} className="flex min-w-0 items-center gap-2 rounded-tip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {narrow ? null : <TypeArtTile typeId={typeId} prefix={prefix} className="size-7 rounded-[8px]" />}
          <span className="tnum truncate text-caption font-semibold text-fg hover:underline">{u.code}</span>
        </Link>
        {narrow ? null : <span className="ml-auto truncate text-caption text-fg-3">{label}</span>}
      </div>
      <div className="relative shrink-0" style={{ width: gridW }}>
        {idleSpan ? (
          <span aria-label={`Parada há ${u.idleDays} dias`} className="absolute top-1.5 flex h-6 items-center overflow-hidden rounded-pill bg-danger-soft/70 px-3 text-caption font-semibold whitespace-nowrap text-danger-ink" style={{ left: idleSpan.s * dayW + 2, width: (idleSpan.e - idleSpan.s + 1) * dayW - 4 }}>
            {(idleSpan.e - idleSpan.s + 1) * dayW > 130 ? `parada há ${u.idleDays} dias` : ''}
          </span>
        ) : null}
        {u.blocked.map((b) => {
          const s = diffDays(from, b.start)
          const e = diffDays(from, b.end)
          if (e < 0 || s > days - 1) return null
          const cs = Math.max(0, s)
          const ce = Math.min(days - 1, e)
          return <span key={b.kind} role="img" aria-label={b.kind === 'manutencao' ? 'Em manutenção' : 'Em limpeza'} title={b.kind === 'manutencao' ? 'Em manutenção' : 'Em limpeza'} className="ds-hatch absolute top-1.5 h-6 rounded-pill bg-warn-soft ring-1 ring-warn/50 ring-inset" style={{ left: cs * dayW + 2, width: (ce - cs + 1) * dayW - 4 }} />
        })}
        {u.blocks.map((b, i) => (
          <Bar key={b.rentalId} b={b} from={from} dayW={dayW} days={days} delay={delay + i * 0.05} />
        ))}
      </div>
    </div>
  )
}

function Bar({ b, from, dayW, days, delay }: { b: TimelineBlock; from: string; dayW: number; days: number; delay: number }) {
  const s = diffDays(from, b.start)
  const e = diffDays(from, b.end)
  if (e < 0 || s > days - 1) return null
  const cs = Math.max(0, s)
  const ce = Math.min(days - 1, e)
  const w = (ce - cs + 1) * dayW - 4
  const cutL = s < 0
  const cutR = e > days - 1
  const st = RENTAL_STATUS[b.status]
  return (
    <motion.span
      className="absolute top-1.5 block"
      style={{ left: cs * dayW + 2, width: w, height: 24, transformOrigin: 'left' }}
      initial={reduced() ? false : { scaleX: 0, opacity: 0.4 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <Link
        to={`/locacoes/${b.rentalId}`}
        title={`${b.code} · ${b.clientName} · ${formatDate(b.start)} a ${formatDate(b.end)} · ${st.label}`}
        aria-label={`${b.code}, ${b.clientName}, ${formatDate(b.start)} a ${formatDate(b.end)}, ${st.label}`}
        className={cn(
          'flex size-full items-center overflow-hidden px-3 text-caption font-semibold whitespace-nowrap transition-[filter,transform] duration-150 ease-[var(--ease-ui)] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          BAR[b.status] ?? 'bg-sunken text-fg',
          cutL ? 'rounded-l-[4px]' : 'rounded-l-pill',
          cutR ? 'rounded-r-[4px]' : 'rounded-r-pill',
        )}
      >
        <span className="truncate">{w > 70 ? b.clientName : ''}</span>
      </Link>
    </motion.span>
  )
}

/* ───────── novo período por teclado ───────── */

function PeriodDialog({ open, typeId, types, onClose, onSubmit }: { open: boolean; typeId?: string; types: TimelineType[]; onClose: () => void; onSubmit: (typeId: string, start: string, end: string) => void }) {
  const t0 = todayFn()
  const [type, setType] = React.useState('')
  const [start, setStart] = React.useState(t0)
  const [end, setEnd] = React.useState(addDays(t0, 4))
  const [err, setErr] = React.useState('')
  React.useEffect(() => {
    if (open) {
      setType(typeId ?? types[0]?.type.id ?? '')
      setErr('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, typeId])
  const submit = () => {
    if (!type) return setErr('Escolha o tipo.')
    if (!start || !end) return setErr('Informe início e fim.')
    if (end < start) return setErr('O fim não pode ser antes do início.')
    onSubmit(type, start, end)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title="Novo período"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit}>
            Criar orçamento
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" className="sm:col-span-2">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((t) => (
              <option key={t.type.id} value={t.type.id}>
                {t.type.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Início">
          <Input type="date" value={start} min={t0} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Fim" error={err}>
          <Input type="date" value={end} min={start || t0} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  )
}
