import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { ArcGauge, MoneyCard, RollingNumber, Skeleton, Stagger } from '@/ui'
import type { StockRow } from '@/services'

/** Três indicadores que abrem o estoque: o que rende agora, o que está parado e a ocupação. Cada um leva ao filtro. */
export function Indicadores({ rows, loading, onRendendo, onParado, onOcupacao }: { rows?: StockRow[]; loading: boolean; onRendendo: () => void; onParado: () => void; onOcupacao: () => void }) {
  const t = React.useMemo(() => {
    const r = rows ?? []
    const sum = (f: (x: StockRow) => number) => r.reduce((a, x) => a + f(x), 0)
    const total = sum((x) => x.total)
    const inField = sum((x) => x.inField)
    return {
      total,
      inField,
      cleaning: sum((x) => x.cleaning),
      idle: sum((x) => x.available),
      earning: Math.round(sum((x) => x.inField * x.type.monthlyRate) * 100) / 100,
      idleValue: Math.round(sum((x) => x.available * x.type.monthlyRate) * 100) / 100,
      idleLong: sum((x) => x.idleOver30d),
      pct: total ? Math.round((inField / total) * 100) : 0,
    }
  }, [rows])

  if (loading || !rows) {
    return (
      <div aria-busy="true" className="mb-4 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} shape="block" className="h-[188px] rounded-card" />
        ))}
      </div>
    )
  }
  return (
    <Stagger className="mb-4 grid gap-4 md:grid-cols-3">
      <MoneyCard hero title="Rendendo agora" value={t.earning} onOpen={onRendendo} openLabel="Ver equipamentos em campo" formula="Valor mensal de tabela dos equipamentos que estão em campo hoje." className="min-h-[188px]" />
      <MoneyCard
        title="Parado"
        value={t.idleValue}
        tag={t.idleLong ? { label: `${t.idleLong} unidades há mais de 30 dias`, good: false } : undefined}
        onOpen={onParado}
        openLabel="Ver equipamentos parados"
        formula="Valor mensal de tabela dos equipamentos disponíveis, sem locação."
        className="min-h-[188px]"
      />
      <section className="@container group/card relative flex min-h-[188px] min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 pt-2 text-body-lg font-medium">Ocupação</h2>
          <button
            type="button"
            onClick={onOcupacao}
            aria-label="Ver a linha do tempo de ocupação"
            className="ds-touch ds-touch-sq group/arrow inline-flex size-10 shrink-0 items-center justify-center rounded-pill text-fg ring-[1.5px] ring-fg transition-[background-color,color] duration-150 ease-[var(--ease-ui)] ring-inset hover:bg-fg hover:text-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowUpRight size={20} strokeWidth={2} aria-hidden className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover/arrow:rotate-45" />
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <ArcGauge
            className="mx-0 max-w-[210px] flex-1"
            center={`${t.pct}%`}
            caption=""
            label={`Ocupação: ${t.pct}%. ${t.inField} em campo de ${t.total}.`}
            segments={[
              { label: 'Em campo', value: t.inField, tone: 'solid' },
              { label: 'Limpeza', value: t.cleaning, tone: 'strong' },
              { label: 'Parados', value: t.idle, tone: 'idle' },
            ]}
          />
          <span className="tnum pb-1 text-title-sub whitespace-nowrap">
            <RollingNumber value={t.inField} />
            <span className="text-fg-3">/{t.total}</span>
          </span>
        </div>
      </section>
    </Stagger>
  )
}
