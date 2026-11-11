import { Download, FileSignature, FileText } from 'lucide-react'
import { Button, EmptyState, Skeleton } from '@/ui'
import { formatDateTime } from '@/lib/format'
import type { Contract } from '@/services'

/** Contrato com aparência de documento; mostra a assinatura quando assinado. */
export function ContratoPapel({ text, contract, loading, onSign, onDownload, downloading, onAction, actionLabel, canSign }: { text?: string; contract?: Contract; loading: boolean; onSign: () => void; onDownload: () => void; downloading: boolean; onAction?: () => void; actionLabel?: string; canSign: boolean }) {
  return (
    <section aria-label="Contrato">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title-sub">Contrato</h2>
        {contract ? (
          <div className="flex flex-wrap items-center gap-2">
            {!contract.signedAt && canSign ? (
              <Button variant="primary" icon={FileSignature} onClick={onSign}>
                Assinar contrato
              </Button>
            ) : null}
            <Button variant="secondary" icon={Download} loading={downloading} onClick={onDownload} disabled={!text}>
              Baixar PDF
            </Button>
          </div>
        ) : null}
      </div>
      {!contract ? (
        <div className="rounded-card bg-raised">
          <EmptyState icon={FileText} title="O contrato aparece aqui" action={onAction ? <Button variant="primary" onClick={onAction}>{actionLabel}</Button> : undefined} />
        </div>
      ) : (
        <article className="mx-auto max-w-[820px] rounded-card bg-raised px-6 py-8 ring-1 ring-edge ring-inset sm:px-12 sm:py-12" aria-busy={loading}>
          {loading || !text ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="mx-auto h-5 w-2/3" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className={i % 3 === 2 ? 'w-4/5' : undefined} />
              ))}
            </div>
          ) : (
            <div className="text-body leading-7 text-fg">
              {text.split('\n').map((line, i) =>
                i === 0 ? (
                  <h3 key={i} className="mb-6 text-center text-title-sub tracking-wide">
                    {line}
                  </h3>
                ) : /^CLÁUSULA/.test(line) ? (
                  <h4 key={i} className="mt-6 mb-1 text-body font-semibold">
                    {line}
                  </h4>
                ) : line === '' ? null : (
                  <p key={i} className={line.startsWith('  - ') ? 'pl-4' : undefined}>
                    {line}
                  </p>
                ),
              )}
            </div>
          )}
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div className="border-t border-strong pt-2 text-caption text-fg-2">Locadora</div>
            <div className="border-t border-strong pt-2">
              {contract.signedAt ? (
                <div>
                  {contract.signatureDataUrl ? <img src={contract.signatureDataUrl} alt={`Assinatura de ${contract.signedBy}`} className="mb-1 h-16 rounded-tip bg-white px-2 object-contain" /> : null}
                  <p className="text-body font-semibold">{contract.signedBy}</p>
                  <p className="text-caption text-fg-2 tnum">Assinado em {formatDateTime(contract.signedAt)}</p>
                </div>
              ) : (
                <p className="text-caption text-fg-2">Locatária</p>
              )}
            </div>
          </div>
        </article>
      )}
    </section>
  )
}
