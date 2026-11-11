import * as React from 'react'
import { ArrowRight, Check, CheckCheck, TrendingDown, TrendingUp } from 'lucide-react'
import { AiTag, Banner, Button, Dialog, EmptyState, RollingMoney, Skeleton, Stagger, celebrate, cn, notify } from '@/ui'
import { formatMoney } from '@/lib/format'
import { applyPriceSuggestion, getPriceSuggestions, useMutation, useQuery, useSettings, type PriceSuggestion } from '@/services'
import { TypeArt } from '@/modules/equipamentos/components/TypeArt'
import { GrowBar, InfoTip, useIn } from './shared'

const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

type Done = { from: number; to: number; gain: number; changePct: number }

function Shell({ s, children }: { s: PriceSuggestion; children: React.ReactNode }) {
  return (
    <article className="flex min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-accent-soft"><TypeArt typeId={s.type.id} className="size-full p-1" /></span>
        <h3 className="min-w-0 flex-1 text-title-card">{s.type.name}</h3>
        <InfoTip label={s.type.name} text={s.reason} />
      </div>
      {children}
    </article>
  )
}

function SuggestionCard({ s, onApply, loading }: { s: PriceSuggestion; onApply: (s: PriceSuggestion, el: HTMLElement) => void; loading: boolean }) {
  const up = s.changePct > 0
  const occ = Math.max(0, Math.min(100, s.occupancy30d))
  return (
    <Shell s={s}>
      <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="tnum text-body-lg text-fg-3 line-through decoration-1">{formatMoney(s.currentMonthly)}</span>
        <ArrowRight size={18} strokeWidth={2} className="text-fg-3" aria-hidden />
        <span className="tnum text-title-sub">{formatMoney(s.suggestedMonthly)}</span>
        <span className={cn('inline-flex h-7 items-center gap-1 rounded-pill px-2.5 text-body font-semibold', up ? 'bg-ok-soft text-ok-ink' : 'bg-warn-soft text-warn-ink')}>
          {up ? <TrendingUp size={14} strokeWidth={2} aria-hidden /> : <TrendingDown size={14} strokeWidth={2} aria-hidden />}
          {pct(s.changePct)}
        </span>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-caption font-semibold text-fg-2"><span>Ocupação em 30 dias</span><span className="tnum text-fg">{Math.round(occ)}%</span></div>
        <div className="mt-1.5 h-3 rounded-pill bg-sunken" role="img" aria-label={`Ocupação de ${Math.round(occ)}% em 30 dias`}><GrowBar pct={occ} className="bg-accent" /></div>
      </div>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
        <div>
          <p className="text-caption font-semibold text-fg-2">Ganho por mês</p>
          <p className="text-kpi text-ok-ink"><RollingMoney kpi value={s.monthlyGain} /></p>
        </div>
        <Button variant="primary" size="lg" loading={loading} onClick={(e) => onApply(s, e.currentTarget)}>Aplicar</Button>
      </div>
    </Shell>
  )
}

function DoneCard({ s, d }: { s: PriceSuggestion; d: Done }) {
  const on = useIn()
  return (
    <Shell s={s}>
      <div className="mt-5 flex items-center gap-3">
        <span className={cn('grid size-12 place-items-center rounded-pill bg-ok text-white transition-transform duration-500 ease-[var(--ease-ui)] motion-reduce:transition-none', on ? 'scale-100' : 'scale-50')}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" style={{ strokeDasharray: 24, strokeDashoffset: on ? 0 : 24, transition: 'stroke-dashoffset 500ms 150ms var(--ease-ui)' }} />
          </svg>
        </span>
        <p className="text-title-sub text-ok-ink">Preço aplicado</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="tnum text-body-lg text-fg-3 line-through decoration-1">{formatMoney(d.from)}</span>
        <ArrowRight size={18} strokeWidth={2} className="text-fg-3" aria-hidden />
        <span className="tnum text-title-sub">{formatMoney(d.to)}</span>
        {d.changePct ? <span className="inline-flex h-7 items-center rounded-pill bg-ok-soft px-2.5 text-body font-semibold text-ok-ink">{pct(d.changePct)}</span> : null}
      </div>
      {d.gain > 0 ? (
        <div className="mt-6">
          <p className="text-caption font-semibold text-fg-2">Ganho por mês</p>
          <p className="text-kpi text-ok-ink"><RollingMoney kpi value={d.gain} /></p>
        </div>
      ) : null}
    </Shell>
  )
}

export default function Precos() {
  const { aiEnabled } = useSettings()
  const q = useQuery(getPriceSuggestions, [])
  const apply = useMutation(applyPriceSuggestion)
  const [done, setDone] = React.useState<Record<string, Done>>({})
  const [busy, setBusy] = React.useState<string | null>(null)
  const [all, setAll] = React.useState(false)
  const [allBusy, setAllBusy] = React.useState(false)
  const allBtn = React.useRef<HTMLButtonElement>(null)

  const list = q.data ?? []
  const cards = list.filter((s) => s.changePct !== 0 || s.applied || done[s.type.id])
  const pending = list.filter((s) => s.changePct !== 0 && !s.applied && !done[s.type.id])
  const sum = pending.reduce((a, s) => a + s.monthlyGain, 0)
  const rec = (s: PriceSuggestion): Done => ({ from: s.currentMonthly, to: s.suggestedMonthly, gain: s.monthlyGain, changePct: s.changePct })

  const one = async (s: PriceSuggestion, el: HTMLElement) => {
    setBusy(s.type.id)
    try {
      await apply.run(s.type.id)
      setDone((d) => ({ ...d, [s.type.id]: rec(s) }))
      celebrate(el)
      notify.success(`Preço de ${s.type.short} aplicado`)
    } catch {
      notify.error('Não foi possível aplicar o preço. Tente de novo.')
    } finally {
      setBusy(null)
    }
  }

  const applyAll = async () => {
    setAllBusy(true)
    const batch = pending
    let ok = 0
    for (const s of batch) {
      try {
        await applyPriceSuggestion(s.type.id)
        setDone((d) => ({ ...d, [s.type.id]: rec(s) }))
        ok++
      } catch {
        /* segue para o próximo */
      }
    }
    setAllBusy(false)
    setAll(false)
    if (ok === batch.length) {
      celebrate(allBtn.current)
      notify.success(`${ok} preços aplicados`)
    } else notify.error(`Foram aplicados ${ok} de ${batch.length} preços. Tente de novo.`)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-title-section">Preços sugeridos {aiEnabled ? <AiTag /> : null}</h2>
        <Button ref={allBtn} variant="primary" size="lg" icon={CheckCheck} disabled={pending.length === 0 || !q.data} onClick={() => setAll(true)}>
          Aplicar todas
        </Button>
      </div>
      {q.error && !q.data ? (
        <Banner tone="danger" title="Não foi possível carregar as sugestões de preço." action={<Button size="sm" variant="secondary" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : !q.data ? (
        <div aria-busy="true" aria-label="Carregando preços" className="grid grid-cols-1 gap-4 @min-[760px]/frame:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[300px] rounded-card bg-raised p-6"><Skeleton className="h-14 w-2/3" /><Skeleton className="mt-6 h-8 w-3/4" /><Skeleton className="mt-6 h-3 rounded-pill" /></div>)}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-card bg-raised p-6"><EmptyState icon={Check} title="Todos os preços estão no ponto" /></div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 @min-[760px]/frame:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
          {cards.map((s) => {
            const d = done[s.type.id] ?? (s.applied ? { from: s.applied.fromMonthly, to: s.currentMonthly, gain: 0, changePct: Math.round((s.currentMonthly / s.applied.fromMonthly - 1) * 1000) / 10 } : undefined)
            const card = d ? <DoneCard key={s.type.id} s={s} d={d} /> : <SuggestionCard key={s.type.id} s={s} onApply={one} loading={busy === s.type.id} />
            return card
          })}
        </Stagger>
      )}
      <Dialog open={all} onOpenChange={(o) => !allBusy && setAll(o)} size="sm" title="Aplicar todas as sugestões" description={`${pending.length} ${pending.length === 1 ? 'preço muda' : 'preços mudam'} e entram em novos orçamentos.`} confirmLabel="Aplicar todas" confirmLoading={allBusy} onConfirm={() => void applyAll()}>
        <p className="text-body text-fg-2">Ganho possível por mês</p>
        <p className="text-kpi text-ok-ink"><RollingMoney kpi value={sum} /></p>
      </Dialog>
    </>
  )
}
