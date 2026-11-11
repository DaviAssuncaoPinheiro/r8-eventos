import * as React from 'react'
import { Download, FileText, Send } from 'lucide-react'
import { addMonths, monthKey, monthLabelLong, today } from '@/domain/dates'
import { getMonthlyClientReport, getPortalLink, getSettings, listClients, useLabels, useQuery, type MonthlyClientReport } from '@/services'
import { Banner, Button, Drawer, EmptyState, Field, Select, Skeleton, WhatsAppPreview, notify } from '@/ui'
import { formatMoney } from '@/lib/format'
import { capitalize } from '../lib'
import { Documento } from './Documento'
import { brandColors, buildReportHtml, printHtml } from '../print'

function monthOptions() {
  const cur = monthKey(today())
  return Array.from({ length: 12 }, (_, i) => {
    const k = addMonths(cur, -i)
    return { value: k, label: capitalize(monthLabelLong(k)) }
  })
}

export function whatsAppText(report: MonthlyClientReport, companyName: string, contactName: string, cleaningPlural: string, link: string) {
  const t = report.totals
  const first = contactName.split(' ')[0]
  return [
    `Olá, ${first}! Aqui é da ${companyName}.`,
    '',
    `*Relatório de ${report.label}* da ${report.client.name}:`,
    `• ${t.servicesDone} serviços feitos, ${report.cleanings.length} de ${cleaningPlural}`,
    `• ${t.photos} fotos e ${t.signed} assinaturas`,
    `• Faturado no mês: ${formatMoney(t.invoiced)}`,
    '',
    `Veja tudo, com as fotos, no seu portal: ${link}`,
  ].join('\n')
}

function SendDrawer({ open, onOpenChange, report }: { open: boolean; onOpenChange: (o: boolean) => void; report: MonthlyClientReport }) {
  const l = useLabels()
  const settings = useQuery(() => getSettings(), [])
  const link = useQuery(() => getPortalLink(report.client.id), [report.client.id])
  const contacts = report.client.contacts
  const [idx, setIdx] = React.useState(0)
  const [sending, setSending] = React.useState(false)
  const contact = contacts[idx] ?? contacts[0]
  const companyName = settings.data?.company.name ?? ''
  const ready = !!settings.data && !!link.data
  const message = contact && ready ? whatsAppText(report, companyName, contact.name, l.cleaningPlural, link.data!) : ''

  const send = async () => {
    if (!contact) return
    setSending(true)
    try {
      // envio simulado: a demonstração não chama o WhatsApp de verdade
      await new Promise((res) => window.setTimeout(res, 700))
      notify.success(`Relatório enviado para ${contact.name}`)
      onOpenChange(false)
    } catch {
      notify.error('Não foi possível enviar o relatório. Tente de novo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Enviar por WhatsApp"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="primary" icon={Send} loading={sending} disabled={!contact || !ready} onClick={send}>
            Enviar por WhatsApp
          </Button>
        </>
      }
    >
      {!contact ? (
        <Banner tone="warn" title="Este cliente ainda não tem contato.">
          Cadastre um na ficha do cliente.
        </Banner>
      ) : (
        <div className="flex flex-col gap-5">
          <Field label="Enviar para">
            <Select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
              {contacts.map((c, i) => (
                <option key={`${c.name}-${i}`} value={i}>
                  {c.name}
                  {c.role ? `, ${c.role}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          {ready ? <WhatsAppPreview from={companyName} message={message} /> : <Skeleton shape="block" className="h-56" />}
        </div>
      )}
    </Drawer>
  )
}

/** Escolha de cliente e mês, prévia do documento e as duas saídas: PDF e WhatsApp. */
export function Mensal({ onReport }: { onReport?: (r: MonthlyClientReport | undefined) => void }) {
  const l = useLabels()
  const clients = useQuery(() => listClients(), [])
  const settings = useQuery(() => getSettings(), [])
  const months = React.useMemo(monthOptions, [])
  const [clientId, setClientId] = React.useState('')
  const [month, setMonth] = React.useState(months[0].value)
  const [sendOpen, setSendOpen] = React.useState(false)
  const [printing, setPrinting] = React.useState(false)

  const sorted = React.useMemo(() => [...(clients.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [clients.data])
  React.useEffect(() => {
    if (clientId || !sorted.length) return
    setClientId((sorted.find((c) => c.portalToken === 'construtora-aurora') ?? sorted[0]).id)
  }, [sorted, clientId])

  const rep = useQuery(() => (clientId ? getMonthlyClientReport(clientId, month) : Promise.resolve(undefined)), [clientId, month])
  const report = clientId ? rep.data : undefined
  React.useEffect(() => onReport?.(report && report.client.id === clientId ? report : undefined), [report, clientId, onReport])

  const pdf = async () => {
    if (!report || !settings.data) return
    setPrinting(true)
    try {
      const html = buildReportHtml({ report, settings: settings.data, labels: l, colors: brandColors(settings.data), origin: window.location.origin })
      await printHtml(html)
      notify.success('Documento pronto. Escolha "Salvar como PDF" na impressão.')
    } catch {
      notify.error('Não foi possível montar o documento. Tente de novo.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <section aria-label="Relatório mensal do cliente" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <h2 className="text-title-section">Relatório mensal do cliente</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="lg" icon={Download} loading={printing} disabled={!report || !settings.data} onClick={pdf}>
            Baixar PDF
          </Button>
          <Button variant="primary" size="lg" icon={Send} disabled={!report} onClick={() => setSendOpen(true)}>
            Enviar por WhatsApp
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:max-w-[720px]">
        <Field label="Cliente">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={!sorted.length} placeholder="Escolha o cliente">
            {sorted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mês">
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4 rounded-card bg-sunken p-3 sm:p-8">
        {rep.error && !report ? (
          <Banner
            tone="danger"
            title="Não foi possível montar o relatório."
            action={
              <Button variant="secondary" size="sm" onClick={() => void rep.refetch()}>
                Tentar de novo
              </Button>
            }
          />
        ) : !clientId || rep.initialLoading || !settings.data || (clientId && !report) ? (
          <div aria-busy="true" className="mx-auto max-w-[860px] rounded-card bg-raised p-6">
            <Skeleton shape="block" className="h-32" />
            <div className="mt-6 grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} shape="block" className="h-14" />
              ))}
            </div>
            <Skeleton shape="block" className="mt-6 h-48" />
          </div>
        ) : report ? (
          <Documento report={report} settings={settings.data} labels={l} />
        ) : (
          <EmptyState icon={FileText} title="Escolha um cliente para ver o relatório do mês" />
        )}
      </div>

      {report ? <SendDrawer open={sendOpen} onOpenChange={setSendOpen} report={report} /> : null}
    </section>
  )
}
