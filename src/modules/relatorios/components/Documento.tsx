import * as React from 'react'
import { Check } from 'lucide-react'
import type { MonthlyClientReport, SegmentLabels, Settings } from '@/services'
import { Button, cn } from '@/ui'
import { CHARGE_STATUS } from '@/app/status'
import { formatDate, formatDateTime, formatMoney, formatPhone } from '@/lib/format'
import { capitalize } from '../lib'

const COLLAPSED = 6

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="tnum text-kpi leading-none font-semibold whitespace-nowrap">{value}</p>
      <p className="mt-2 text-body font-semibold text-black/60">{label}</p>
    </div>
  )
}

/** Prévia do relatório mensal: o mesmo conteúdo do PDF, em papel branco nos dois temas. */
export function Documento({ report, settings, labels }: { report: MonthlyClientReport; settings: Settings; labels: SegmentLabels }) {
  const [all, setAll] = React.useState(false)
  const t = report.totals
  const company = settings.company
  const shown = all ? report.cleanings : report.cleanings.slice(0, COLLAPSED)
  return (
    <article aria-label={`Relatório de ${report.label} de ${report.client.name}`} className="mx-auto w-full max-w-[860px] overflow-hidden rounded-card bg-white text-black">
      <header className="ds-hero ds-hero-card px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="" className="size-11 rounded-control bg-white object-contain p-1" />
            ) : (
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-on-accent/20 text-body font-semibold">
                {company.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="truncate text-title-sub">{company.name}</span>
          </div>
          <p className="text-body-lg font-semibold">{capitalize(report.label)}</p>
        </div>
        <h3 className="mt-8 text-title-section sm:text-title-page">{report.client.name}</h3>
        <p className="tnum mt-1 text-body text-on-accent-2">{report.client.cnpj}</p>
      </header>

      <div className="px-6 py-8 sm:px-10">
        <section aria-label="Resumo do mês" className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
          <Big value={String(t.servicesDone)} label="Serviços feitos" />
          <Big value={String(t.photos)} label="Fotos" />
          <Big value={String(t.signed)} label="Assinaturas" />
          <Big value={formatMoney(t.invoiced)} label="Faturado" />
        </section>

        {report.servicesByType.length ? (
          <ul className="m-0 mt-6 flex list-none flex-wrap gap-2 p-0">
            {report.servicesByType.map((s) => (
              <li key={s.type} className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-black/[0.06] px-3 text-caption font-semibold">
                {s.label}
                <span className="tnum">{s.count}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <section className="mt-10">
          <h4 className="text-title-sub">{capitalize(labels.cleaningPlural)}</h4>
          {report.cleanings.length ? (
            <>
              <ul className="m-0 mt-3 flex list-none flex-col p-0">
                {shown.map((c) => (
                  <li key={c.serviceId} className="border-t border-black/10 py-4 first:border-t-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="tnum text-body-lg font-semibold">{formatDateTime(c.at)}</p>
                      <p className="tnum text-body text-black/60">
                        {c.unitCodes.length ? c.unitCodes.slice(0, 4).join(', ') + (c.unitCodes.length > 4 ? ` e mais ${c.unitCodes.length - 4}` : '') : c.rentalCode}
                      </p>
                    </div>
                    {c.photos.length ? (
                      <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                        {c.photos.slice(0, 4).map((p) => (
                          <li key={p.id}>
                            <img src={p.src} alt={`${p.label}, ${formatDate(c.at)}`} loading="lazy" className="size-16 rounded-control bg-black/[0.06] object-cover" />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-3 flex items-center gap-1.5 text-body text-black/70">
                      {c.signature ? (
                        <>
                          <Check size={16} strokeWidth={2} aria-hidden className="shrink-0" />
                          <span>
                            Assinado por <span className="font-semibold text-black">{c.signature.name}</span>, {c.signature.role}
                          </span>
                        </>
                      ) : (
                        <span>Sem assinatura</span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
              {report.cleanings.length > COLLAPSED ? (
                <div className="mt-2">
                  <Button variant="secondary" size="sm" onClick={() => setAll((v) => !v)} className="bg-white text-black">
                    {all ? 'Mostrar menos' : `Mostrar todas (${report.cleanings.length})`}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-body text-black/60">Nenhum serviço de {labels.cleaning} neste mês.</p>
          )}
        </section>

        <section className="mt-10">
          <h4 className="text-title-sub">Valores</h4>
          {report.invoices.length ? (
            <ul className="m-0 mt-3 flex list-none flex-col p-0">
              {report.invoices.map((c) => (
                <li key={c.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-t border-black/10 py-3 first:border-t-0">
                  <p className="min-w-0 truncate text-body-lg font-medium">{c.description}</p>
                  <p className="tnum text-body-lg font-semibold whitespace-nowrap">{formatMoney(c.value)}</p>
                  <p className="tnum text-caption text-black/60">
                    {c.code} · vence em {formatDate(c.dueAt)}
                  </p>
                  <p className="text-caption font-semibold text-black/70">{CHARGE_STATUS[c.status].label}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-body text-black/60">Nenhuma cobrança emitida neste mês.</p>
          )}
          <dl className="m-0 mt-4 grid grid-cols-3 gap-4 border-t-2 border-black pt-4">
            {[
              ['Faturado', t.invoiced],
              ['Pago', t.paid],
              ['Em aberto', t.open],
            ].map(([k, v]) => (
              <div key={k as string} className="min-w-0">
                <dt className="text-caption font-semibold text-black/60">{k}</dt>
                <dd className="tnum m-0 text-title-sub whitespace-nowrap">{formatMoney(v as number)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className={cn('mt-10 border-t border-black/10 pt-4 text-caption text-black/60')}>
          <p>
            {company.legalName} · {company.cnpj}
          </p>
          <p className="tnum">
            {formatPhone(company.phone)} · {company.email}
          </p>
        </footer>
      </div>
    </article>
  )
}
