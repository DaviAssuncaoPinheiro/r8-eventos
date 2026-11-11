import * as React from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Banknote, Check, CheckCircle2, Copy, FilePlus2, Mail, MessageCircle, QrCode, Receipt, Send, Truck } from 'lucide-react'
import { Badge, Button, Drawer, Money, Segmented, Skeleton, Timeline, WhatsAppPreview, notify, type TimelineEvent } from '@/ui'
import { CHARGE_KIND, CHARGE_STATUS } from '@/app/status'
import { formatDate, formatDateTime } from '@/lib/format'
import { buildWhatsAppMessage, getCharge, markPaid, sendCharge, sendReminder, useMutation, useQuery, useSettings } from '@/services'
import type { PayMethod } from '@/services'
import { copyText, dueLabel, errMessage } from '../lib'

/** "Pix copia e cola" ou "Linha digitável" com botão de copiar. */
function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async () => {
    const ok = await copyText(value)
    if (!ok) return notify.error('Não foi possível copiar. Selecione o código e copie à mão.')
    setCopied(true)
    notify.success(`${label} copiado`)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2 rounded-control bg-sunken p-2 pl-3">
      <p className="tnum min-w-0 flex-1 truncate text-body text-fg" title={value}>
        {value}
      </p>
      <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={copy} aria-label={`Copiar ${label.toLowerCase()}`}>
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  )
}

/**
 * Gaveta da cobrança, usada no Financeiro e em Avarias.
 * Passe o id para abrir e `null` para fechar; `onClose` é chamado ao fechar.
 */
export function ChargeDrawer({ chargeId, onClose }: { chargeId: string | null; onClose: () => void }) {
  const last = React.useRef<string | null>(chargeId)
  if (chargeId) last.current = chargeId
  const id = chargeId ?? last.current
  const company = useSettings().company.name

  const q = useQuery(() => (id ? getCharge(id) : Promise.resolve(undefined)), [id])
  const msg = useQuery(() => (id ? buildWhatsAppMessage(id) : Promise.resolve('')), [id])
  const detail = q.data && q.data.charge.id === id ? q.data : undefined

  const [method, setMethod] = React.useState<PayMethod>('pix')
  React.useEffect(() => {
    if (detail) setMethod(detail.charge.method)
    // só quando troca de cobrança
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.charge.id])

  const send = useMutation(sendCharge)
  const remind = useMutation(sendReminder)
  const pay = useMutation(markPaid)

  const c = detail?.charge
  const pix = detail?.pix

  /* a mensagem muda de forma de pagamento sem esperar o envio */
  const message = React.useMemo(() => {
    const base = msg.data ?? ''
    if (!pix) return base
    const i = base.lastIndexOf('\n\n')
    if (i < 0) return base
    const tail = method === 'pix' ? `Pix copia e cola:\n${pix.copiaECola}` : `Linha digitável do boleto:\n${pix.boletoLine}`
    return `${base.slice(0, i)}\n\n${tail}`
  }, [msg.data, pix, method])

  const events: TimelineEvent[] = []
  if (c) {
    events.push({ id: 'criada', icon: FilePlus2, title: 'Cobrança criada', meta: formatDate(c.issuedAt) })
    if (c.sentAt) events.push({ id: 'envio', icon: c.sentVia === 'email' ? Mail : MessageCircle, tone: 'info', title: c.sentVia === 'email' ? 'Enviada por e-mail' : 'Enviada por WhatsApp', meta: formatDateTime(c.sentAt) })
    c.reminders.forEach((r, i) => events.push({ id: `lem${i}`, icon: r.channel === 'email' ? Mail : MessageCircle, tone: 'warn', title: r.channel === 'email' ? 'Lembrete por e-mail' : 'Lembrete por WhatsApp', meta: formatDateTime(r.at) }))
    if (c.paidAt) events.push({ id: 'paga', icon: CheckCircle2, tone: 'ok', title: 'Pagamento recebido', meta: formatDate(c.paidAt) })
  }

  const doSend = async () => {
    if (!c) return
    try {
      await send.run(c.id, { via: 'whatsapp', method })
      notify.success('Cobrança enviada por WhatsApp')
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível enviar. Tente de novo.'))
    }
  }
  const doRemind = async () => {
    if (!c) return
    try {
      await remind.run(c.id, 'whatsapp')
      notify.success('Lembrete enviado')
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível enviar o lembrete. Tente de novo.'))
    }
  }
  const doPay = async () => {
    if (!c) return
    try {
      await pay.run(c.id)
      notify.success('Cobrança marcada como paga')
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível dar baixa. Tente de novo.'))
    }
  }

  const footer = !c ? null : c.status === 'rascunho' ? (
    <Button variant="primary" size="lg" icon={Send} loading={send.loading} onClick={doSend} className="max-sm:w-full">
      Enviar por WhatsApp
    </Button>
  ) : c.status === 'aberta' || c.status === 'atrasada' ? (
    <>
      <Button variant="secondary" size="lg" icon={Send} loading={remind.loading} onClick={doRemind}>
        Enviar lembrete
      </Button>
      <Button variant="primary" size="lg" icon={Check} loading={pay.loading} onClick={doPay}>
        Marcar como paga
      </Button>
    </>
  ) : null

  const damage = detail?.damages[0]
  const damagePhoto = damage?.photos[0]

  return (
    <Drawer open={chargeId !== null} onOpenChange={(o) => !o && onClose()} title={c ? c.code : 'Cobrança'} footer={footer}>
      {q.error && !detail ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-card bg-danger-soft p-4">
          <p className="text-body font-semibold text-danger-ink">Não foi possível abrir a cobrança.</p>
          <Button variant="secondary" size="sm" onClick={() => void q.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : !c || !pix ? (
        <div role="status" aria-busy="true" aria-label="Carregando cobrança" className="flex flex-col gap-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton shape="block" className="h-40" />
          <Skeleton shape="block" className="h-56" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* valor, cliente, vencimento e situação */}
          <section aria-label="Resumo da cobrança">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-kpi">
                <Money value={c.value} variant="kpi" />
              </p>
              <Badge tone={CHARGE_STATUS[c.status].tone}>{CHARGE_STATUS[c.status].label}</Badge>
            </div>
            <p className="mt-2 text-body-lg font-semibold">
              <Link to={`/clientes/${c.clientId}`} className="rounded-tip hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {c.clientName}
              </Link>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-body">
              <Badge tone="neutral">{CHARGE_KIND[c.kind]}</Badge>
              <span className="text-fg-2">
                Vence <span className={c.status === 'atrasada' ? 'font-semibold text-danger-ink' : 'font-semibold text-fg'}>{c.status === 'atrasada' ? `${formatDate(c.dueAt)}, ${dueLabel(c)}` : formatDate(c.dueAt)}</span>
              </span>
              {c.rentalCode ? (
                <Link to={`/locacoes/${c.rentalId}`} className="rounded-tip font-semibold text-accent-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  {c.rentalCode}
                </Link>
              ) : null}
            </div>
          </section>

          {/* origem: avaria com foto e link da unidade */}
          {damage ? (
            <section aria-label="Avaria de origem" className="flex items-center gap-3 rounded-card bg-sunken p-3">
              {damagePhoto ? <img src={damagePhoto.src} alt={damagePhoto.label} className="size-16 shrink-0 rounded-tip object-cover" /> : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold">{damage.kind}</p>
                <Link to={`/equipamentos/${damage.unitId}`} className="text-body font-semibold text-accent-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  Ver unidade
                </Link>
              </div>
              <Money value={damage.value} className="text-body font-semibold" />
            </section>
          ) : detail?.services.length ? (
            <section aria-label="Serviços extras" className="flex items-center gap-3 rounded-card bg-sunken p-3">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-warn-soft text-warn-ink">
                <Truck size={20} strokeWidth={2} />
              </span>
              <p className="min-w-0 flex-1 text-body font-semibold">{detail.services.length === 1 ? '1 serviço extra' : `${detail.services.length} serviços extras`}</p>
            </section>
          ) : null}

          {c.status === 'paga' ? (
            <section aria-label="Comprovante" className="flex items-center gap-3 rounded-card bg-ok-soft p-4 text-ok-ink">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-raised">
                <Receipt size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-body-lg font-semibold">Pagamento recebido</p>
                <p className="text-body">{c.paidAt ? `${formatDate(c.paidAt)} por ${c.method === 'pix' ? 'Pix' : 'boleto'}` : ''}</p>
              </div>
            </section>
          ) : c.status === 'cancelada' ? null : (
            <>
              {/* mensagem que o cliente recebe */}
              <section aria-label="Mensagem de WhatsApp" className="flex flex-col gap-3">
                <h3 className="text-title-card">Mensagem</h3>
                <WhatsAppPreview from={company} message={message} />
              </section>

              {/* forma de pagamento */}
              <section aria-label="Forma de pagamento" className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-title-card">Pagamento</h3>
                  <Segmented<PayMethod>
                    label="Forma de pagamento"
                    size="sm"
                    value={method}
                    onChange={setMethod}
                    options={[
                      { value: 'pix', label: 'Pix', icon: QrCode },
                      { value: 'boleto', label: 'Boleto', icon: Banknote },
                    ]}
                  />
                </div>
                {method === 'pix' ? (
                  <>
                    <div className="grid place-items-center rounded-card bg-sunken p-5">
                      <div className="rounded-card bg-white p-3 text-black">
                        <QRCodeSVG value={pix.qrValue} size={168} level="M" bgColor="transparent" fgColor="currentColor" role="img" aria-label={`QR code Pix da cobrança ${c.code}`} className="block" />
                      </div>
                    </div>
                    <CopyLine label="Pix copia e cola" value={pix.copiaECola} />
                  </>
                ) : (
                  <CopyLine label="Linha digitável" value={pix.boletoLine} />
                )}
              </section>
            </>
          )}

          <section aria-label="Histórico" className="flex flex-col gap-3">
            <Timeline groups={[{ label: 'Histórico', events }]} />
          </section>
        </div>
      )}
    </Drawer>
  )
}
