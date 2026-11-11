import * as React from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Calculator, CircleCheck, PackageX, RotateCcw, Tag, Wallet, type LucideIcon } from 'lucide-react'
import { Banner, Button, RollingMoney, RollingNumber, Skeleton, Stagger, cn } from '@/ui'
import { PageHeader } from '@/app/PageHeader'
import { getIntelligenceSummary, useQuery } from '@/services'
import { InfoTip, ddmm } from './shared'
import Caixa from './Caixa'
import Equipamentos from './Equipamentos'
import Precos from './Precos'

type Tone = 'hero' | 'neutral' | 'ok' | 'warn'

const CHIP: Record<Tone, string> = {
  hero: 'bg-on-accent text-accent-active',
  neutral: 'bg-accent-soft text-accent-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
}
const NUM: Record<Tone, string> = { hero: '', neutral: 'text-fg', ok: 'text-ok-ink', warn: 'text-warn-ink' }

function Kpi({ title, icon: Icon, tone, formula, onOpen, tags, children }: { title: string; icon: LucideIcon; tone: Tone; formula: string; onOpen: () => void; tags?: string[]; children: React.ReactNode }) {
  const hero = tone === 'hero'
  const onMove = hero
    ? (e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
    : undefined
  return (
    <section onPointerMove={onMove} className={cn('@container relative flex min-w-0 flex-col rounded-card p-5 sm:p-6', hero ? 'ds-hero ds-hero-card' : 'bg-raised text-fg')}>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden className={cn('grid size-11 shrink-0 place-items-center rounded-pill', CHIP[tone])}>
          <Icon size={22} strokeWidth={2} />
        </span>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Ver ${title.toLowerCase()}`}
          className={cn(
            'ds-touch ds-touch-sq group/arrow inline-flex size-10 shrink-0 items-center justify-center rounded-pill transition-[background-color,color] duration-150 ease-[var(--ease-ui)]',
            hero ? 'bg-on-accent text-accent-active' : 'text-fg ring-[1.5px] ring-fg ring-inset hover:bg-fg hover:text-raised',
          )}
        >
          <ArrowUpRight size={20} strokeWidth={2} aria-hidden className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover/arrow:rotate-45" />
        </button>
      </div>
      <h2 className="mt-4 flex items-center gap-1 text-[15px] leading-5 font-medium @min-[250px]:text-body-lg">
        {title}
        <InfoTip label={title} text={formula} className={hero ? 'text-on-accent hover:text-on-accent' : undefined} />
      </h2>
      {tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className={cn('inline-flex h-6 max-w-full items-center truncate rounded-pill px-2 text-caption font-semibold', CHIP[tone])}>
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <div className={cn('mt-auto pt-3 text-kpi-lg text-[clamp(30px,17.5cqw,44px)]', NUM[tone])}>{children}</div>
    </section>
  )
}

const TABS = [
  { to: 'caixa', label: 'Caixa' },
  { to: 'equipamentos', label: 'Equipamentos' },
  { to: 'precos', label: 'Preços' },
]

export default function Inteligencia() {
  const navigate = useNavigate()
  const q = useQuery(getIntelligenceSummary, [])
  const s = q.data

  const header = (
    <PageHeader
      title="Inteligência"
      actions={
        <Button variant="secondary" size="lg" icon={Calculator} onClick={() => window.open('/diagnostico', '_blank', 'noopener')}>
          Calculadora de perdas
        </Button>
      }
    />
  )

  return (
    <>
      {header}
      {q.error && !s ? (
        <Banner tone="danger" title="Não foi possível carregar os indicadores." action={<Button size="sm" variant="secondary" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : !s ? (
        <div aria-busy="true" aria-label="Carregando os indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex h-[200px] flex-col justify-between rounded-card bg-raised p-5 sm:p-6">
              <Skeleton shape="circle" className="size-11" />
              <Skeleton className="h-10 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
          <Kpi title="Caixa previsto em 30 dias" icon={Wallet} tone="hero" onOpen={() => navigate('/inteligencia/caixa')} formula="Cobranças em aberto que vencem nos próximos 30 dias (as vencidas contam hoje) mais as mensalidades das locações longas que ainda serão emitidas.">
            <RollingMoney kpi value={s.cashForecast30} />
          </Kpi>
          <Kpi title="Recuperado no mês" icon={RotateCcw} tone="ok" onOpen={() => navigate('/inteligencia/caixa')} formula="Avarias cobradas, extras faturados, atrasados que pagaram depois do lembrete e equipamentos parados que voltaram a alugar neste mês.">
            <RollingMoney kpi value={s.recoveredMonth} />
          </Kpi>
          <Kpi title="Ganho possível com preços" icon={Tag} tone="neutral" onOpen={() => navigate('/inteligencia/precos')} formula="Soma do ganho mensal estimado se todos os preços sugeridos forem aplicados. Considera a ocupação dos últimos 30 dias e a queda de procura quando o preço sobe.">
            <RollingMoney kpi value={s.priceGainMonthly} />
            <span className="ml-1 text-body-lg font-semibold text-fg-3">/mês</span>
          </Kpi>
          {s.stockout ? (
            <Kpi
              title="Vai faltar estoque"
              icon={PackageX}
              tone="warn"
              tags={[`${s.stockout.typeName}, ${ddmm(s.stockout.peakDay)}`]}
              onOpen={() => navigate(`/inteligencia/equipamentos?tipo=${s.stockout!.typeId}`)}
              formula={`Maior falta de unidades no pico dos próximos 30 dias: ${s.stockout.typeName}. Soma locações confirmadas, em campo e 40% dos orçamentos, contra as unidades disponíveis.`}
            >
              <RollingNumber value={s.stockout.missingUnits} />
              <span className="ml-1 text-body-lg font-semibold text-fg-3">{s.stockout.missingUnits === 1 ? 'unidade' : 'unidades'}</span>
            </Kpi>
          ) : (
            <Kpi title="Estoque dá conta" icon={CircleCheck} tone="ok" onOpen={() => navigate('/inteligencia/equipamentos')} formula="Nos próximos 30 dias a demanda prevista não passa das unidades disponíveis em nenhum tipo de equipamento.">
              <span className="text-kpi-lg">Sem faltas</span>
            </Kpi>
          )}
        </Stagger>
      )}

      <nav aria-label="Seções da inteligência" className="mt-6 max-w-full overflow-x-auto">
        <ul className="inline-flex gap-1 rounded-pill bg-sunken p-1">
          {TABS.map((t) => (
            <li key={t.to}>
              <NavLink
                to={`/inteligencia/${t.to}`}
                className={({ isActive }) =>
                  cn(
                    'ds-touch inline-flex h-11 items-center rounded-pill px-5 text-body-lg font-semibold whitespace-nowrap transition-[background-color,color] duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    isActive ? 'bg-raised text-fg ring-1 ring-edge ring-inset' : 'text-fg-2 hover:text-fg',
                  )
                }
              >
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4">
        <Routes>
          <Route index element={<Navigate to="caixa" replace />} />
          <Route path="caixa" element={<Caixa />} />
          <Route path="equipamentos" element={<Equipamentos />} />
          <Route path="precos" element={<Precos />} />
          <Route path="*" element={<Navigate to="/inteligencia/caixa" replace />} />
        </Routes>
      </div>
    </>
  )
}

