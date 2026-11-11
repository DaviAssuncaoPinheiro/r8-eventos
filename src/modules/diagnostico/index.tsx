import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Hammer, PackageOpen, ReceiptText, Truck, Wallet, type LucideIcon } from 'lucide-react'
import { Button, RollingMoney, RollingNumber, Stagger, TooltipProvider, cn } from '@/ui'
import { AppToaster } from '@/ui/Toast'
import { useBrandSync } from '@/app/AppLayout'
import { useSettings } from '@/services'
import { diagnoseLosses, diagnosisDefaults, type DiagnosisInput, type DiagnosisItem } from '@/services/inteligencia'
import { formatMoney } from '@/lib/format'

/* ───────── controles ───────── */

const toText = (v: number) => String(v).replace('.', ',')
function parse(t: string): number | null {
  let s = t.trim().replace(/\s/g, '')
  if (!s) return null
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '')
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function NumBox({ id, label, value, onChange, min, max, prefix, suffix, wide }: { id: string; label: string; value: number; onChange: (n: number) => void; min: number; max: number; prefix?: string; suffix?: string; wide?: boolean }) {
  const [text, setText] = React.useState(toText(value))
  const focus = React.useRef(false)
  React.useEffect(() => {
    if (!focus.current) setText(toText(value))
  }, [value])
  return (
    <div className={cn('flex h-11 shrink-0 items-center gap-1.5 rounded-control border border-strong bg-raised px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring', wide ? 'w-40' : 'w-32')}>
      {prefix ? <span className="text-fg-3">{prefix}</span> : null}
      <input
        id={id}
        aria-label={label}
        inputMode="decimal"
        value={text}
        onFocus={(e) => {
          focus.current = true
          e.currentTarget.select()
        }}
        onChange={(e) => {
          setText(e.target.value)
          const n = parse(e.target.value)
          if (n !== null) onChange(Math.max(min, n))
        }}
        onBlur={() => {
          focus.current = false
          const n = parse(text)
          const v = Math.max(min, n ?? min)
          onChange(v)
          setText(toText(v))
        }}
        className="tnum h-full min-w-0 flex-1 bg-transparent text-right text-body-lg font-semibold outline-none"
      />
      {suffix ? <span className="text-fg-3">{suffix}</span> : null}
    </div>
  )
}

const THUMB =
  '[&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-raised [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:active:scale-110 ' +
  '[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-raised'

function Control({ id, label, value, onChange, min, max, step, prefix, suffix, wide }: { id: string; label: string; value: number; onChange: (n: number) => void; min: number; max: number; step: number; prefix?: string; suffix?: string; wide?: boolean }) {
  const p = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-r`} className="min-w-0 text-body-lg font-semibold">{label}</label>
        <NumBox id={id} label={`${label}, valor`} value={value} onChange={onChange} min={min} max={max} prefix={prefix} suffix={suffix} wide={wide} />
      </div>
      <input
        id={`${id}-r`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('mt-1 block h-11 w-full cursor-pointer appearance-none rounded-pill bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', THUMB)}
        style={{ backgroundImage: `linear-gradient(to right, var(--accent) ${p}%, var(--sunken) ${p}%)`, backgroundSize: '100% 12px', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
      />
    </div>
  )
}

function Group({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6">
      <h2 className="flex items-center gap-3 text-title-sub">
        <span aria-hidden className="grid size-10 place-items-center rounded-pill bg-accent-soft text-accent-ink"><Icon size={20} strokeWidth={2} /></span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  )
}

/* ───────── resultado ───────── */

const CAUSE: Record<DiagnosisItem['key'], { label: string; bar: string }> = {
  parado: { label: 'Equipamento parado', bar: 'bg-accent' },
  avarias: { label: 'Avarias sem cobrança', bar: 'bg-danger' },
  extras: { label: 'Extras sem fatura', bar: 'bg-warn' },
  atraso: { label: 'Atraso no pagamento', bar: 'bg-info' },
}

function Causes({ items }: { items: DiagnosisItem[] }) {
  const sorted = [...items].sort((a, b) => b.monthly - a.monthly)
  const max = Math.max(sorted[0]?.monthly ?? 0, 1)
  return (
    <ul className="flex flex-col gap-4" aria-label="De onde vem a perda">
      {sorted.map((c) => (
        <li key={c.key}>
          <div className="flex items-baseline justify-between gap-3 text-body-lg">
            <span className="font-semibold">{CAUSE[c.key].label}</span>
            <span className="tnum font-semibold">{formatMoney(c.monthly)}</span>
          </div>
          <div className="mt-1.5 h-4 rounded-pill bg-sunken">
            <div className={cn('h-full rounded-pill transition-[width] duration-200 ease-out motion-reduce:transition-none', CAUSE[c.key].bar)} style={{ width: c.monthly > 0 ? `max(12px, ${(c.monthly / max) * 100}%)` : '0%' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Diagnostico() {
  return (
    <TooltipProvider>
      <div className="ds-root min-h-dvh bg-app">
        <Page />
        <AppToaster />
      </div>
    </TooltipProvider>
  )
}

function Page() {
  useBrandSync()
  const navigate = useNavigate()
  const { company, logoDataUrl } = useSettings()
  const [inp, setInp] = React.useState<DiagnosisInput>(() => diagnosisDefaults())
  const [adv, setAdv] = React.useState(false)
  const d = React.useMemo(() => diagnoseLosses(inp), [inp])
  const set = (k: keyof DiagnosisInput) => (n: number) => setInp((p) => ({ ...p, [k]: n }))
  const go = () => navigate('/')

  return (
    <>
      <header className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="" className="size-11 rounded-pill object-cover" />
          ) : (
            <span aria-hidden className="ds-hero grid size-11 shrink-0 place-items-center rounded-pill"><Truck size={22} strokeWidth={2} /></span>
          )}
          <span className="truncate text-title-sub">{company.name}</span>
        </div>
        <Link to="/" className="ds-touch inline-flex h-11 shrink-0 items-center rounded-pill bg-raised px-5 text-body font-semibold ring-1 ring-edge transition-colors duration-150 ring-inset hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Abrir o sistema
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 px-4 pb-28 sm:px-6 lg:grid-cols-12 lg:items-start lg:pb-10">
        <h1 className="sr-only">Calculadora de perdas</h1>

        {/* resultado: primeiro no celular, fixo ao rolar no desktop */}
        <Stagger className="order-first flex min-w-0 flex-col gap-4 lg:sticky lg:top-4 lg:order-last lg:col-span-6" delay={0.05}>
          <section className="ds-hero ds-hero-card rounded-card p-6 sm:p-8" aria-live="polite">
            <h2 className="text-body-lg font-medium">Você perde por mês</h2>
            <p className="mt-2 text-[clamp(44px,9vw,76px)] leading-none font-semibold tracking-[-0.03em]"><RollingMoney value={d.monthlyLoss} /></p>
            <p className="mt-4 inline-flex items-baseline gap-2 rounded-pill bg-on-accent px-4 py-1.5 text-accent-active">
              <span className="text-title-sub"><RollingMoney value={d.yearlyLoss} /></span>
              <span className="text-body font-semibold">por ano</span>
            </p>
          </section>

          <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6">
            <Causes items={d.breakdown} />
          </section>

          <section className="min-w-0 rounded-card bg-ok-soft p-5 text-ok-ink sm:p-6">
            <h2 className="text-body-lg font-semibold">O sistema recupera por mês</h2>
            <p className="mt-1 text-kpi-lg"><RollingMoney kpi value={d.recoverableMonthly} /></p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-body font-semibold">Se paga em</p>
                <p className="text-kpi">
                  {d.paybackMonths === null ? <span>Sem retorno</span> : <><RollingNumber value={d.paybackMonths} decimals={1} /><span className="ml-1.5 text-body-lg font-semibold">{d.paybackMonths === 1 ? 'mês' : 'meses'}</span></>}
                </p>
              </div>
              <div>
                <p className="text-body font-semibold">Retorno no 1º ano</p>
                <p className="text-kpi"><RollingNumber value={d.roiFirstYear} suffix="%" /></p>
              </div>
            </div>
          </section>

          <Button variant="primary" size="field" block iconRight={ArrowRight} onClick={go}>
            Ver o sistema funcionando
          </Button>
        </Stagger>

        {/* controles */}
        <Stagger className="flex min-w-0 flex-col gap-4 lg:col-span-6">
          <Group icon={PackageOpen} title="Equipamentos">
            <Control id="units" label="Quantidade de equipamentos" value={inp.units} onChange={set('units')} min={10} max={1000} step={5} />
            <Control id="rate" label="Aluguel médio por mês" value={inp.avgMonthlyRate} onChange={set('avgMonthlyRate')} min={50} max={3000} step={10} prefix="R$" wide />
            <Control id="idle" label="Estoque parado" value={inp.idlePct} onChange={set('idlePct')} min={0} max={60} step={1} suffix="%" />
          </Group>
          <Group icon={Hammer} title="Avarias">
            <Control id="dmg" label="Avarias por mês" value={inp.damagesPerMonth} onChange={set('damagesPerMonth')} min={0} max={100} step={1} />
            <Control id="dmgp" label="Ficam sem cobrar" value={inp.damagesUnchargedPct} onChange={set('damagesUnchargedPct')} min={0} max={100} step={1} suffix="%" />
          </Group>
          <Group icon={ReceiptText} title="Serviços extras">
            <Control id="ext" label="Extras por mês" value={inp.extrasPerMonth} onChange={set('extrasPerMonth')} min={0} max={200} step={1} />
            <Control id="extp" label="Saem sem faturar" value={inp.extrasUnbilledPct} onChange={set('extrasUnbilledPct')} min={0} max={100} step={1} suffix="%" />
          </Group>
          <Group icon={Wallet} title="Faturamento">
            <Control id="bill" label="Faturamento por mês" value={inp.monthlyBilling} onChange={set('monthlyBilling')} min={5000} max={500000} step={1000} prefix="R$" wide />
            <Control id="over" label="Quanto atrasa" value={inp.overduePct} onChange={set('overduePct')} min={0} max={40} step={1} suffix="%" />
          </Group>

          <div className="flex flex-col gap-3 rounded-card bg-raised p-5 sm:p-6">
            <button type="button" aria-expanded={adv} onClick={() => setAdv((v) => !v)} className="ds-touch -m-1 flex items-center justify-between gap-3 rounded-control p-1 text-left text-body-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              Ajustar valores
              <ChevronDown size={20} strokeWidth={2} aria-hidden className={cn('transition-transform duration-200 motion-reduce:transition-none', adv && 'rotate-180')} />
            </button>
            {adv ? (
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between gap-3"><label htmlFor="av" className="text-body font-semibold">Valor médio de uma avaria</label><NumBox id="av" label="Valor médio de uma avaria" value={inp.avgDamageValue} onChange={set('avgDamageValue')} min={0} max={0} prefix="R$" wide /></div>
                <div className="flex items-center justify-between gap-3"><label htmlFor="ve" className="text-body font-semibold">Valor médio de um extra</label><NumBox id="ve" label="Valor médio de um extra" value={inp.avgExtraValue} onChange={set('avgExtraValue')} min={0} max={0} prefix="R$" wide /></div>
              </div>
            ) : null}
          </div>

          <section className="rounded-card bg-raised p-5 sm:p-6" aria-label="Investimento">
            <h2 className="text-body-lg font-semibold">Investimento</h2>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3"><label htmlFor="setup" className="text-body font-semibold">Implantação</label><NumBox id="setup" label="Implantação" value={inp.setupFee} onChange={set('setupFee')} min={0} max={0} prefix="R$" wide /></div>
              <div className="flex items-center justify-between gap-3"><label htmlFor="mens" className="text-body font-semibold">Mensalidade</label><NumBox id="mens" label="Mensalidade" value={inp.monthlyFee} onChange={set('monthlyFee')} min={0} max={0} prefix="R$" wide /></div>
            </div>
          </section>
        </Stagger>
      </main>

      {/* celular: a perda fica à vista enquanto os controles são mexidos */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-inverse px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] text-on-inverse lg:hidden" aria-hidden>
        <span className="text-body font-semibold">Você perde por mês</span>
        <span className="text-title-sub"><RollingMoney value={d.monthlyLoss} /></span>
      </div>
    </>
  )
}
