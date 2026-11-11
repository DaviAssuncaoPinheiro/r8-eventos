import * as React from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion } from 'motion/react'
import { Banknote, Bell, Check, CheckCircle2, Copy, FilePlus2, Link2, Mail, QrCode, Receipt, Send, Truck } from 'lucide-react'
import { Badge, Button, Drawer, EmailPreview, Money, Segmented, Skeleton, Timeline, notify, type TimelineEvent } from '@/ui'
import { celebrate, reduced } from '@/ui/Motion'
import { CHARGE_KIND, CHARGE_STATUS } from '@/app/status'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { buildChargeMessage, getCharge, markPaid, sendCharge, sendReminder, useMutation, useQuery, useSettings } from '@/services'
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

/** Etiqueta da situação: ao trocar (rascunho, enviada, paga) a anterior sai e a nova entra com escala. */
function AnimatedStatus({ status }: { status: keyof typeof CHARGE_STATUS }) {
  const st = CHARGE_STATUS[status]
  if (reduced()) return <Badge tone={st.tone}>{st.label}</Badge>
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        className="inline-flex"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.1 } }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      >
        <Badge tone={st.tone}>{st.label}</Badge>
      </motion.span>
    </AnimatePresence>
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
  const msg = useQuery(() => (id ? buildChargeMessage(id) : Promise.resolve(undefined)), [id])
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

  /* o e-mail muda de forma de pagamento sem esperar o envio */
  const email = React.useMemo(() => {
    const m = msg.data
    if (!m) return undefined
    return { ...m, body: m.body.replace(/Pague por (Pix|boleto)/, method === 'pix' ? 'Pague por Pix' : 'Pague por boleto') }
  }, [msg.data, method])

  const events: TimelineEvent[] = []
  if (c) {
    events.push({ id: 'criada', icon: FilePlus2, title: 'Cobrança criada', meta: formatDate(c.issuedAt) })
    if (c.sentAt) events.push({ id: 'envio', icon: c.sentVia === 'portal' ? Bell : Mail, tone: 'info', title: c.sentVia === 'portal' ? 'Aviso no portal do cliente' : 'Enviada por e-mail', meta: formatDateTime(c.sentAt) })
    c.reminders.forEach((r, i) => events.push({ id: `lem${i}`, icon: r.channel === 'portal' ? Bell : Mail, tone: 'warn', title: r.channel === 'portal' ? 'Lembrete no portal' : 'Lembrete por e-mail', meta: formatDateTime(r.at) }))
    if (c.paidAt) events.push({ id: 'paga', icon: CheckCircle2, tone: 'ok', title: 'Pagamento recebido', meta: formatDate(c.paidAt) })
  }

  const doSend = async () => {
    if (!c) return
    try {
      await send.run(c.id, { via: 'email', method })
      notify.success('Cobrança enviada por e-mail')
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível enviar. Tente de novo.'))
    }
  }
  const doRemind = async () => {
    if (!c) return
    try {
      await remind.run(c.id, 'email')
      notify.success('Lembrete enviado')
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível enviar o lembrete. Tente de novo.'))
    }
  }
  const doCopyLink = async () => {
    const link = msg.data?.payLink
    if (!link) return
    const ok = await copyText(link)
    if (ok) notify.success('Link de pagamento copiado')
    else notify.error('Não foi possível copiar. Tente de novo.')
  }
  const doPay = async (origin: HTMLElement) => {
    if (!c) return
    const r = origin.getBoundingClientRect()
    try {
      await pay.run(c.id)
      celebrate({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      notify.success('Cobrança marcada como paga')
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível dar baixa. Tente de novo.'))
    }
  }

  const footer = !c ? null : c.status === 'rascunho' ? (
    <>
      <Button variant="secondary" size="lg" icon={Link2} onClick={doCopyLink} disabled={!msg.data}>
        Copiar link de pagamento
      </Button>
      <Button variant="primary" size="lg" icon={Send} loading={send.loading} onClick={doSend}>
        Enviar cobrança
      </Button>
    </>
  ) : c.status === 'aberta' || c.status === 'atrasada' ? (
    <>
      <Button variant="secondary" size="lg" icon={Send} loading={remind.loading} onClick={doRemind}>
        Enviar lembrete
      </Button>
      <Button variant="primary" size="lg" icon={Check} loading={pay.loading} onClick={(e) => void doPay(e.currentTarget)}>
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
              <AnimatedStatus status={c.status} />
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
            <motion.section
              aria-label="Comprovante"
              className="relative flex items-center gap-3 overflow-hidden rounded-card bg-ok-soft p-4 text-ok-ink"
              initial={reduced() ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-pill bg-raised">
                <Receipt size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-lg font-semibold">Pagamento recebido</p>
                <p className="text-body">{c.paidAt ? `${formatDate(c.paidAt)} por ${c.method === 'pix' ? 'Pix' : 'boleto'}` : ''}</p>
              </div>
              <motion.span
                aria-hidden
                className="shrink-0 -rotate-12 rounded-control border-2 border-current px-3 py-1 text-title-card font-extrabold uppercase tracking-wider"
                initial={reduced() ? false : { scale: 2.4, opacity: 0, rotate: -28 }}
                animate={{ scale: 1, opacity: 1, rotate: -12 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 }}
              >
                Paga
              </motion.span>
            </motion.section>
          ) : c.status === 'cancelada' ? null : (
            <>
              {/* e-mail que o cliente recebe */}
              <section aria-label="E-mail da cobrança" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-title-card">E-mail</h3>
                    <Badge tone="info">No portal do cliente</Badge>
                  </div>
                  {c.status !== 'rascunho' ? (
                    <Button variant="ghost" size="sm" icon={Link2} onClick={doCopyLink} disabled={!msg.data}>
                      Copiar link de pagamento
                    </Button>
                  ) : null}
                </div>
                {email ? (
                  <EmailPreview from={company} to={detail?.client.contacts[0]?.email ?? detail?.client.name ?? ''} subject={email.subject} body={email.body} cta={`Pagar ${formatMoney(c.value)} com ${method === 'pix' ? 'Pix' : 'boleto'}`} />
                ) : (
                  <Skeleton shape="block" className="h-56" />
                )}
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
