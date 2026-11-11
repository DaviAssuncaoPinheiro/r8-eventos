import * as React from 'react'
import { BadgeCheck, ClipboardList, Download, FileSignature, ImageIcon, ListChecks, PenLine, ReceiptText, ShieldCheck, TriangleAlert, Wallet, type LucideIcon } from 'lucide-react'
import { SERVICE_ICON } from '@/app/status'
import { Button, EmptyState, PhotoThumb, PhotoViewer, cn, useCountUp, type PhotoItem } from '@/ui'
import { formatDate, formatTime } from '@/lib/format'
import type { DossierEntry, RentalDetail } from '@/services'
import { dossierCounts } from '../documentos'

const KIND_ICON: Record<DossierEntry['kind'], { icon: LucideIcon; tone: string }> = {
  locacao: { icon: ClipboardList, tone: 'bg-sunken text-fg-2' },
  contrato: { icon: FileSignature, tone: 'bg-info-soft text-info-ink' },
  servico: { icon: ClipboardList, tone: 'bg-accent-soft text-accent-ink' },
  avaria: { icon: TriangleAlert, tone: 'bg-danger-soft text-danger-ink' },
  cobranca: { icon: ReceiptText, tone: 'bg-warn-soft text-warn-ink' },
  pagamento: { icon: Wallet, tone: 'bg-ok-soft text-ok-ink' },
}

function Counter({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  const shown = Math.round(useCountUp(value))
  return (
    <div className="flex items-center gap-3 rounded-card bg-accent-soft px-4 py-3">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-pill bg-raised text-accent-ink">
        <Icon size={20} strokeWidth={2} />
      </span>
      <div>
        <p className="text-kpi tnum text-accent-ink" aria-label={`${value} ${label}`}>{shown}</p>
        <p className="text-body font-semibold text-fg-2">{label}</p>
      </div>
    </div>
  )
}

const PAGE = 8

/** Dossiê de prova: contadores, linha do tempo com fotos e assinaturas, e o botão que gera o documento. */
export function Dossie({ detail, onDownload, downloading }: { detail: RentalDetail; onDownload: () => void; downloading: boolean }) {
  const counts = dossierCounts(detail)
  const events = React.useMemo(() => [...detail.dossier].reverse(), [detail.dossier])
  const [limit, setLimit] = React.useState(PAGE)
  const [viewer, setViewer] = React.useState<{ photos: PhotoItem[]; index: number } | null>(null)
  const svcType = React.useMemo(() => new Map(detail.services.map((s) => [s.id, s.type])), [detail.services])
  const shown = events.slice(0, limit)

  const groups: { label: string; items: DossierEntry[] }[] = []
  for (const e of shown) {
    const label = formatDate(e.at)
    const g = groups[groups.length - 1]
    if (g && g.label === label) g.items.push(e)
    else groups.push({ label, items: [e] })
  }

  return (
    <section aria-label="Dossiê de prova" className="rounded-card bg-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-12 place-items-center rounded-pill bg-accent text-on-accent">
            <ShieldCheck size={24} strokeWidth={2} />
          </span>
          <h2 className="text-title-sub">Dossiê de prova</h2>
        </div>
        <Button variant="primary" size="lg" icon={Download} loading={downloading} onClick={onDownload}>
          Baixar dossiê
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Counter icon={ImageIcon} label="Fotos" value={counts.photos} />
        <Counter icon={PenLine} label="Assinaturas" value={counts.signatures} />
        <Counter icon={ListChecks} label="Checklists" value={counts.checklists} />
      </div>

      <div className="mt-6">
        {events.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="Os registros desta locação aparecem aqui" className="py-8" />
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <section key={g.label} aria-label={g.label}>
                <h3 className="mb-3 text-caption font-semibold text-fg-3 tnum">{g.label}</h3>
                <ol className="m-0 list-none p-0">
                  {g.items.map((e, i) => {
                    const k = e.kind === 'servico' ? { icon: SERVICE_ICON[svcType.get(e.id) ?? 'limpeza'], tone: KIND_ICON.servico.tone } : KIND_ICON[e.kind]
                    const Icon = k.icon
                    const last = i === g.items.length - 1
                    const photos: PhotoItem[] = (e.photos ?? []).map((p) => ({ id: p.id, src: p.src, alt: `${p.label}, ${e.title}` }))
                    return (
                      <li key={e.id} className={cn('relative pl-12', !last && 'pb-5')}>
                        {!last ? <span aria-hidden className="absolute top-9 bottom-0 left-[17px] w-px bg-hairline" /> : null}
                        <span aria-hidden className={cn('absolute top-0 left-0 grid size-9 place-items-center rounded-pill', k.tone)}>
                          <Icon size={18} strokeWidth={2} />
                        </span>
                        <div className="min-h-9">
                          <p className="text-body font-semibold">{e.title}</p>
                          <p className="text-caption text-fg-3">
                            <span className="tnum">{formatTime(e.at)}</span>
                            {e.detail ? ` · ${e.detail}` : ''}
                          </p>
                          {photos.length || e.signature ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {photos.slice(0, 6).map((p, pi) => (
                                <PhotoThumb key={p.id} src={p.src} alt={p.alt} onClick={() => setViewer({ photos, index: pi })} />
                              ))}
                              {photos.length > 6 ? (
                                <button type="button" onClick={() => setViewer({ photos, index: 6 })} className="grid size-16 place-items-center rounded-tip bg-sunken text-body font-semibold text-fg-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                                  +{photos.length - 6}
                                </button>
                              ) : null}
                              {e.signature ? (
                                <span className="flex h-16 items-center gap-2 rounded-tip bg-sunken px-3">
                                  {e.signature.dataUrl ? <img src={e.signature.dataUrl} alt={`Assinatura de ${e.signature.name}`} className="h-10 max-w-28 rounded-tip bg-white object-contain px-1" /> : <PenLine size={18} strokeWidth={2} aria-hidden className="text-fg-2" />}
                                  <span className="text-caption font-semibold text-fg-2">{e.signature.name}</span>
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ))}
            {events.length > limit ? (
              <Button variant="secondary" className="self-start" onClick={() => setLimit((l) => l + PAGE)}>
                Mostrar mais registros
              </Button>
            ) : null}
          </div>
        )}
      </div>
      {viewer ? <PhotoViewer open photos={viewer.photos} index={viewer.index} onIndexChange={(i) => setViewer({ ...viewer, index: i })} onOpenChange={(o) => !o && setViewer(null)} /> : null}
    </section>
  )
}
