import * as React from 'react'
import { Check, ChevronDown, Copy, CircleCheck, QrCode, ReceiptText } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Badge, Button, Drawer, EmptyState, Money, cn, notify } from '@/ui'
import { formatDate } from '@/lib/format'
import { payInvoice, useMutation, type PortalInvoice } from '@/services'

const isOpen = (i: PortalInvoice) => i.status === 'aberta' || i.status === 'atrasada'

function CopyBox({ label, value, toast }: { label: string; value: string; toast: string }) {
  const [done, setDone] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* sem permissão da área de transferência: o código segue visível para copiar à mão */
    }
    setDone(true)
    notify.success(toast)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 2000)
  }
  return (
    <div className="rounded-control bg-sunken p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body font-semibold">{label}</p>
        <Button variant="secondary" size="sm" icon={done ? Check : Copy} onClick={copy}>
          {done ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <p className="tnum mt-2 text-caption break-all text-fg-2 select-all">{value}</p>
    </div>
  )
}

/** Gaveta do Pix: QR, copia e cola, boleto e "Já paguei" */
function PayDrawer({ token, invoice, onClose }: { token: string; invoice: PortalInvoice | null; onClose: () => void }) {
  const pay = useMutation(payInvoice)
  const [paid, setPaid] = React.useState(false)
  React.useEffect(() => setPaid(false), [invoice?.id])
  const closeRef = React.useRef(onClose)
  closeRef.current = onClose
  React.useEffect(() => {
    if (!paid) return
    const t = window.setTimeout(() => closeRef.current(), 2400)
    return () => window.clearTimeout(t)
  }, [paid])

  const confirm = async () => {
    if (!invoice) return
    try {
      await pay.run(token, invoice.id)
      setPaid(true)
      notify.success('Pagamento registrado. Obrigado!')
    } catch {
      notify.error('Não foi possível confirmar o pagamento. Tente de novo.')
    }
  }

  return (
    <Drawer
      side="bottom"
      open={!!invoice}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={paid ? 'Fatura paga' : 'Pagar com Pix'}
      footer={
        paid ? (
          <Button variant="secondary" size="lg" block onClick={onClose}>
            Fechar
          </Button>
        ) : (
          <Button variant="primary" size="lg" block icon={Check} loading={pay.loading} onClick={confirm}>
            Já paguei
          </Button>
        )
      }
    >
      {invoice ? (
        paid ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center" role="status">
            <span className="grid size-24 place-items-center rounded-pill bg-ok-soft text-ok-ink">
              <svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path pathLength={1} className="ds-route" d="M12 25l8 8 16-18" />
              </svg>
            </span>
            <p className="text-kpi">
              <Money value={invoice.value} variant="kpi" />
            </p>
            <p className="text-body-lg font-semibold">{invoice.code} paga</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-card bg-white p-3 text-black">
                <QRCodeSVG value={invoice.pix?.qrValue ?? invoice.code} size={196} level="M" bgColor="transparent" fgColor="currentColor" role="img" aria-label={`QR code do Pix da fatura ${invoice.code}`} className="block" />
              </div>
              <p className="text-title-sub">
                <Money value={invoice.value} variant="inline" />
              </p>
            </div>
            {invoice.pix ? (
              <>
                <CopyBox label="Pix copia e cola" value={invoice.pix.copiaECola} toast="Código Pix copiado" />
                <CopyBox label="Boleto" value={invoice.pix.boletoLine} toast="Linha do boleto copiada" />
              </>
            ) : null}
          </div>
        )
      ) : null}
    </Drawer>
  )
}

export function InvoicesSection({ token, invoices }: { token: string; invoices: PortalInvoice[] }) {
  const open = invoices.filter(isOpen).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const paid = invoices.filter((i) => i.status === 'paga').sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
  const [paying, setPaying] = React.useState<PortalInvoice | null>(null)
  const [showPaid, setShowPaid] = React.useState(false)

  return (
    <section aria-labelledby="faturas">
      <h2 id="faturas" className="text-title-section">
        Faturas
      </h2>

      {open.length === 0 ? (
        <div className="mt-4 rounded-card bg-raised p-2">
          <EmptyState icon={CircleCheck} title="Nenhuma fatura em aberto" />
        </div>
      ) : (
        <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
          {open.map((i) => (
            <li key={i.id} className="flex flex-col rounded-card bg-raised p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="tnum text-body font-semibold text-fg-2">{i.code}</p>
                {i.status === 'atrasada' ? <Badge tone="danger">Atrasada há {i.daysOverdue} {i.daysOverdue === 1 ? 'dia' : 'dias'}</Badge> : <Badge tone="info">Aberta</Badge>}
              </div>
              <p className="mt-3 text-kpi">
                <Money value={i.value} variant="kpi" />
              </p>
              <p className="mt-2 truncate text-body text-fg-2">{i.description}</p>
              <p className="tnum mt-1 text-body font-semibold">Vence em {formatDate(i.dueAt)}</p>
              <div className="mt-auto pt-5">
                <Button variant="primary" size="lg" block icon={QrCode} onClick={() => setPaying(i)}>
                  Pagar com Pix
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {paid.length ? (
        <div className="mt-4">
          <button
            type="button"
            aria-expanded={showPaid}
            onClick={() => setShowPaid((v) => !v)}
            className="ds-touch inline-flex h-11 items-center gap-2 rounded-pill bg-raised px-5 text-body font-semibold transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ReceiptText size={18} strokeWidth={2} aria-hidden />
            Faturas pagas ({paid.length})
            <ChevronDown size={18} strokeWidth={2} aria-hidden className={cn('transition-transform duration-200 ease-[var(--ease-ui)]', showPaid && 'rotate-180')} />
          </button>
          {showPaid ? (
            <ul className="mt-3 flex list-none flex-col rounded-card bg-raised p-2">
              {paid.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-3 py-3">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-pill bg-ok-soft text-ok-ink">
                    <Check size={18} strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold">{i.description}</span>
                    <span className="tnum block text-caption text-fg-2">
                      {i.code} · paga em {i.paidAt ? formatDate(i.paidAt) : ''}
                    </span>
                  </span>
                  <Money value={i.value} className="text-body font-semibold" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <PayDrawer token={token} invoice={paying} onClose={() => setPaying(null)} />
    </section>
  )
}
