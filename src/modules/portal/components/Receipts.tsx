import * as React from 'react'
import { ChevronDown, FileDown, ImageOff, ShieldCheck } from 'lucide-react'
import { Badge, Button, EmptyState, PhotoThumb, PhotoViewer, Segmented, cn, type PhotoItem } from '@/ui'
import { SERVICE_ICON } from '@/app/status'
import { formatDate, formatTime } from '@/lib/format'
import { dayOf, monthKey, monthLabel } from '@/domain/dates'
import type { ServiceReceipt } from '@/services'

const PAGE = 6

/** Meses que têm comprovante, do mais novo ao mais antigo (no máximo 6) */
export function receiptMonths(receipts: ServiceReceipt[]): string[] {
  return [...new Set(receipts.map((r) => monthKey(dayOf(r.at))))].sort().reverse().slice(0, 6)
}

function Receipt({ r, onPhoto }: { r: ServiceReceipt; onPhoto: (photos: PhotoItem[], i: number) => void }) {
  const [open, setOpen] = React.useState(false)
  const Icon = SERVICE_ICON[r.type]
  const items: PhotoItem[] = r.photos.map((p) => ({ id: p.id, src: p.src, alt: `${p.label}, ${r.typeLabel} em ${formatDate(r.at)}` }))
  const done = r.checklist.filter((c) => c.ok).length
  return (
    <li className="relative pl-12 sm:pl-14">
      <span aria-hidden className="absolute top-0 bottom-[-16px] left-[19px] w-px bg-edge sm:left-[21px]" />
      <span aria-hidden className="absolute top-3 left-0 grid size-10 place-items-center rounded-pill bg-accent-soft text-accent-ink ring-4 ring-[var(--app)] sm:size-11">
        <Icon size={20} strokeWidth={2} />
      </span>
      <article className="rounded-card bg-raised p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="text-title-card">{r.typeLabel}</h3>
            <p className="mt-0.5 truncate text-body text-fg-2">{r.rentalTitle}</p>
          </div>
          <div className="text-right">
            <p className="tnum text-body font-semibold">{formatDate(r.at)}</p>
            <p className="tnum text-caption text-fg-2">{formatTime(r.at)}</p>
          </div>
        </div>

        {r.unitCodes.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {r.unitCodes.map((c) => (
              <li key={c}>
                <Badge className="tnum">{c}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {items.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {items.map((p, i) => (
              <li key={p.id}>
                <PhotoThumb src={p.src} alt={p.alt} size={96} onClick={() => onPhoto(items, i)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-body text-fg-3">
            <ImageOff size={18} strokeWidth={2} aria-hidden />
            Sem fotos neste serviço
          </p>
        )}

        {r.signature ? (
          <div className="mt-4 flex items-center gap-3 rounded-control bg-sunken p-3">
            {r.signature.dataUrl ? (
              <span className="grid h-14 w-28 shrink-0 place-items-center rounded-tip bg-white p-1">
                <img src={r.signature.dataUrl} alt={`Assinatura de ${r.signature.name}`} className="max-h-full max-w-full object-contain" />
              </span>
            ) : (
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-ok-soft text-ok-ink">
                <ShieldCheck size={20} strokeWidth={2} />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-body font-semibold">{r.signature.name}</p>
              <p className="truncate text-caption text-fg-2">{r.signature.role}</p>
            </div>
          </div>
        ) : null}

        {r.checklist.length ? (
          <div className="mt-3">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="ds-touch -mx-2 inline-flex h-11 items-center gap-1.5 rounded-pill px-3 text-body font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              Ver itens conferidos
              <ChevronDown size={18} strokeWidth={2} aria-hidden className={cn('transition-transform duration-200 ease-[var(--ease-ui)]', open && 'rotate-180')} />
            </button>
            {open ? (
              <ul className="mt-1 flex flex-col gap-1.5">
                {r.checklist.map((c) => (
                  <li key={c.label} className="flex items-start gap-2.5 text-body">
                    <span aria-hidden className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill text-caption font-bold', c.ok ? 'bg-ok-soft text-ok-ink' : 'bg-danger-soft text-danger-ink')}>
                      {c.ok ? '✓' : '✕'}
                    </span>
                    <span className="min-w-0">
                      <span className="sr-only">{c.ok ? 'Conferido: ' : 'Não conferido: '}</span>
                      {c.label}
                    </span>
                  </li>
                ))}
                <li className="sr-only">
                  {done} de {r.checklist.length} itens conferidos
                </li>
              </ul>
            ) : null}
          </div>
        ) : null}
      </article>
    </li>
  )
}

export function ReceiptsSection({
  receipts,
  month,
  onMonth,
  monthName,
  onReport,
  reporting,
}: {
  receipts: ServiceReceipt[]
  month: string
  onMonth: (m: string) => void
  /** "novembro" */
  monthName: string
  onReport: () => void
  reporting: boolean
}) {
  const months = React.useMemo(() => receiptMonths(receipts), [receipts])
  const [limit, setLimit] = React.useState(PAGE)
  const [viewer, setViewer] = React.useState<{ photos: PhotoItem[]; index: number } | null>(null)
  React.useEffect(() => setLimit(PAGE), [month])
  const shown = React.useMemo(() => receipts.filter((r) => monthKey(dayOf(r.at)) === month), [receipts, month])

  return (
    <section aria-labelledby="comprovantes">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id="comprovantes" className="text-title-section">
          Comprovantes de serviço
        </h2>
        <Button variant="secondary" size="md" icon={FileDown} loading={reporting} onClick={onReport}>
          Baixar relatório de {monthName}
        </Button>
      </div>

      {months.length > 1 ? (
        <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <Segmented<string> label="Mês" value={month} onChange={onMonth} options={months.map((m) => ({ value: m, label: monthLabel(m) }))} />
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div className="mt-4 rounded-card bg-raised p-2">
          <EmptyState icon={ShieldCheck} title="Nenhum serviço concluído neste mês" />
        </div>
      ) : (
        <ol className="mt-5 flex list-none flex-col gap-4 p-0">
          {shown.slice(0, limit).map((r) => (
            <Receipt key={r.serviceId} r={r} onPhoto={(photos, index) => setViewer({ photos, index })} />
          ))}
        </ol>
      )}

      {shown.length > limit ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
            Ver mais serviços
          </Button>
        </div>
      ) : null}

      {viewer ? (
        <PhotoViewer
          photos={viewer.photos}
          index={viewer.index}
          open
          onIndexChange={(i) => setViewer((v) => (v ? { ...v, index: i } : v))}
          onOpenChange={(o) => {
            if (!o) setViewer(null)
          }}
        />
      ) : null}
    </section>
  )
}
