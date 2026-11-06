import * as React from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CalendarClock, Check, CheckCheck, ExternalLink, MapPin, Printer, Warehouse, Wrench, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { LogoMark } from '@/components/AppShell'
import { Badge, Button, IconCircle, ProductThumb, TeamAvatar } from '@/components/ui'
import { BAIRRO } from '@/data/geo'
import { COMPANY, PRODUCT, RENTAL, TEAM, UNIT, type Job } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { onTime, stamp } from '@/lib/history'
import { JOB_STATUS, OCC_KIND } from '@/lib/status'
import { useDemo, useJobs } from '@/store'
import { ago, cleaningsOf, clientOf, nextCleaningOf, nextPickupOf, qrUrl, stateOf, STATE_LABEL } from './model'

const EASE = [0.16, 1, 0.3, 1] as const

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Etiqueta para imprimir e colar na porta */
function PrintLabel({ unitId }: { unitId: string }) {
  const u = UNIT[unitId]
  return createPortal(
    <div id="r8-etiqueta" aria-hidden>
      <style>{`
        #r8-etiqueta { display: none; }
        @media print {
          @page { size: 90mm 120mm; margin: 0; }
          body * { visibility: hidden !important; }
          #r8-etiqueta, #r8-etiqueta * { visibility: visible !important; }
          #r8-etiqueta { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; background: #fff; }
        }
      `}</style>
      <div style={{ width: '82mm', padding: '6mm', borderRadius: '6mm', border: '0.6mm solid #111214', fontFamily: 'var(--font-sans)', color: '#111214', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5mm' }}>
          <LogoMark size={34} />
          <span style={{ fontSize: '15pt', fontWeight: 800, letterSpacing: '-0.02em' }}>{COMPANY.name}</span>
        </div>
        <div style={{ marginTop: '4mm', fontSize: '11pt', fontWeight: 600 }}>Algum problema com este banheiro?</div>
        <div style={{ fontSize: '9.5pt', fontWeight: 500, color: '#4a4e57' }}>Aponte a câmera do celular e avise a equipe</div>
        <div style={{ margin: '4mm auto 0', width: '52mm' }}>
          <QRCodeSVG value={qrUrl(unitId)} size={196} level="M" style={{ width: '52mm', height: '52mm' }} />
        </div>
        <div style={{ marginTop: '3mm', fontSize: '24pt', fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{unitId}</div>
        <div style={{ fontSize: '9.5pt', fontWeight: 600, color: '#4a4e57' }}>
          {PRODUCT[u.productId].short} · WhatsApp {COMPANY.whatsapp}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function UnitDrawer({ unitId, onClose }: { unitId: string | null; onClose: () => void }) {
  const open = !!unitId && !!UNIT[unitId]
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] print:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-surface shadow-float outline-none sm:inset-y-3 sm:right-3 sm:rounded-[28px] print:hidden"
              >
                <Body unitId={unitId!} onClose={onClose} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
      {open && <PrintLabel unitId={unitId!} />}
    </Dialog.Root>
  )
}

function Body({ unitId, onClose }: { unitId: string; onClose: () => void }) {
  const nav = useNavigate()
  const u = UNIT[unitId]
  const p = PRODUCT[u.productId]
  const overrides = useDemo((s) => s.unitState)
  const setUnitState = useDemo((s) => s.setUnitState)
  const reports = useDemo((s) => s.reports)
  const occurrences = useDemo((s) => s.occurrences)
  const setOccurrenceStatus = useDemo((s) => s.setOccurrenceStatus)
  const allJobs = useJobs()
  const state = stateOf(u, overrides)
  const rental = state === 'campo' && u.rentalId ? RENTAL[u.rentalId] : undefined

  const jobs: Job[] = React.useMemo(() => (rental ? allJobs.filter((j) => j.rentalId === rental.id) : []), [rental, allJobs])

  const cleans = rental ? cleaningsOf(rental.id, jobs, reports, 4) : []
  const next = rental ? nextCleaningOf(rental.id, jobs) : undefined
  const pickup = rental?.status === 'retirada' ? nextPickupOf(rental.id, jobs) : undefined
  const occ = occurrences.filter((o) => o.unitId === unitId).sort((a, b) => +new Date(b.at) - +new Date(a.at))
  const url = qrUrl(unitId)
  const st = STATE_LABEL[state]

  const print = () => {
    toast('Abrindo a impressão da etiqueta')
    window.setTimeout(() => window.print(), 150)
  }

  return (
    <>
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <ProductThumb productId={p.id} size={52} rounded="xl" />
        <div className="min-w-0 flex-1">
          <Dialog.Title className="num text-[24px] leading-tight font-bold tracking-[-0.03em] text-ink">{unitId}</Dialog.Title>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink-3">
            {p.name}
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink-2">
              <span className="size-2 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
          </div>
        </div>
        <Dialog.Close className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill hover:bg-muted" aria-label="Fechar">
          <X className="size-[18px]" strokeWidth={2} />
        </Dialog.Close>
      </div>

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {/* local */}
        {rental ? (
          <Section title="Onde está" aside={<Badge tone="ok">Em campo</Badge>}>
            <button
              onClick={() => {
                onClose()
                nav(`/locacoes/${rental.id}`)
              }}
              className="group flex w-full items-center gap-3 rounded-[16px] bg-surface p-3 text-left transition-colors hover:bg-muted"
            >
              <IconCircle size={38} tone="white" className="shadow-none">
                <MapPin className="size-4" strokeWidth={2} />
              </IconCircle>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-ink">{rental.title}</span>
                <span className="block truncate text-[12.5px] font-medium text-ink-3">
                  {clientOf(rental).name} · {rental.address}, {BAIRRO[rental.bairro].name}
                </span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[16px] bg-surface p-3">
                <div className="text-[12px] font-semibold text-ink-3">Última limpeza</div>
                <div className="mt-0.5 text-[13.5px] font-bold text-ink">{cleans[0] ? `${cap(relDays(cleans[0].report.finishedAt))}, ${fmt.time(cleans[0].report.finishedAt)}` : 'Sem registro'}</div>
              </div>
              <div className="rounded-[16px] bg-surface p-3">
                <div className="text-[12px] font-semibold text-ink-3">{pickup ? 'Retirada' : 'Próxima limpeza'}</div>
                <div className="mt-0.5 text-[13.5px] font-bold text-ink">
                  {pickup ? `${cap(relDays(pickup.start))}, ${fmt.time(pickup.start)}` : next ? (next.status === 'em-andamento' ? 'Em andamento agora' : `${cap(relDays(next.start))}, ${fmt.time(next.start)}`) : 'Sem data'}
                </div>
              </div>
            </div>
          </Section>
        ) : (
          <Section title="Onde está">
            <div className="flex items-center gap-3 rounded-[16px] bg-surface p-3">
              <IconCircle size={38} tone={state === 'manutencao' ? 'yellow' : 'white'} className="shadow-none">
                {state === 'manutencao' ? <Wrench className="size-4" strokeWidth={2} /> : <Warehouse className="size-4" strokeWidth={2} />}
              </IconCircle>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-ink">{state === 'manutencao' ? 'Oficina da base' : 'Base R8 · SIA'}</span>
                <span className="block text-[12.5px] font-medium text-ink-3">{state === 'manutencao' ? u.note ?? 'Em revisão' : 'Pronta para a próxima locação'}</span>
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {state === 'manutencao' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setUnitState(unitId, 'base')
                    toast.success(`${unitId} liberada`, { description: 'Volta para o estoque livre da base.' })
                  }}
                >
                  <Check className="size-3.5" strokeWidth={2.4} /> Liberar para uso
                </Button>
              ) : (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    setUnitState(unitId, 'manutencao')
                    toast(`${unitId} enviada para manutenção`)
                  }}
                >
                  <Wrench className="size-3.5" strokeWidth={2} /> Enviar para manutenção
                </Button>
              )}
            </div>
          </Section>
        )}

        {/* limpezas */}
        {rental && p.cleanable && (
          <Section title="Últimas limpezas" aside={<span className="text-[12.5px] font-medium text-ink-3">{rental.cleanPerWeek ? `${rental.cleanPerWeek}x por semana` : 'Durante o evento'}</span>}>
            {cleans.length ? (
              <ol className="flex flex-col">
                {cleans.map(({ job, report }) => {
                  const unitLine = report.units.find((x) => x.id === unitId)
                  const late = !onTime(job, report)
                  return (
                    <li key={job.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
                      <TeamAvatar teamId={job.teamId} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-ink">{stamp(report.finishedAt)}</span>
                        <span className="block truncate text-[12px] font-medium text-ink-3">
                          {TEAM[job.teamId].name}
                          {unitLine?.note ? ` · ${unitLine.note}` : ''}
                        </span>
                      </span>
                      {late ? <Badge tone="warn">Atrasou</Badge> : <Badge tone="ok">No horário</Badge>}
                    </li>
                  )
                })}
              </ol>
            ) : (
              <div className="text-[13px] font-medium text-ink-3">Nenhuma limpeza registrada ainda.</div>
            )}
            {next && (
              <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-surface px-3 py-2.5 text-[12.5px] font-semibold text-ink-2">
                <CalendarClock className="size-4 text-ink-3" strokeWidth={2} />
                Próxima: {stamp(next.start)}
                <Badge tone={JOB_STATUS[next.status].tone} className="ml-auto">
                  {JOB_STATUS[next.status].label}
                </Badge>
              </div>
            )}
          </Section>
        )}

        {/* ocorrências */}
        <Section title="Avisos e ocorrências" aside={occ.some((o) => o.status === 'aberta') ? <Badge tone="late">{occ.filter((o) => o.status === 'aberta').length} aberto</Badge> : undefined}>
          {occ.length ? (
            <ul className="flex flex-col gap-2">
              {occ.map((o) => (
                <li key={o.id} className={o.status === 'aberta' ? 'rounded-[16px] bg-red-soft p-3' : 'rounded-[16px] bg-surface p-3'}>
                  <div className="flex items-center gap-2">
                    <span className={o.status === 'aberta' ? 'text-[13.5px] font-bold text-red' : 'text-[13.5px] font-bold text-ink-2'}>{OCC_KIND[o.kind].label}</span>
                    <span className="ml-auto text-[12px] font-medium text-ink-3">{ago(o.at)}</span>
                  </div>
                  {o.note && <p className="mt-1 text-[13px] leading-snug font-medium text-ink-2">{o.note}</p>}
                  <div className="mt-2 flex items-center gap-2 text-[12px] font-medium text-ink-3">
                    {o.source === 'qr' ? 'Pelo QR da porta' : `Registrado pela ${o.reporter ?? 'equipe'}`}
                    {o.status === 'aberta' ? (
                      <button
                        onClick={() => {
                          setOccurrenceStatus(o.id, 'resolvida')
                          toast.success('Ocorrência resolvida')
                        }}
                        className="ml-auto inline-flex h-7 items-center gap-1 rounded-full bg-card px-2.5 text-[12px] font-bold text-ink shadow-pill"
                      >
                        <Check className="size-3" strokeWidth={2.6} /> Resolver
                      </button>
                    ) : (
                      <span className="ml-auto inline-flex items-center gap-1 font-semibold text-green">
                        <CheckCheck className="size-3.5" strokeWidth={2.2} /> Resolvida
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[13px] font-medium text-ink-3">Nenhum aviso para esta unidade.</div>
          )}
        </Section>

        {/* QR */}
        <Section title="QR na porta">
          <div className="flex items-center gap-4">
            <div className="shrink-0 rounded-[18px] bg-white p-2.5 ring-1 ring-line">
              <QRCodeSVG value={url} size={108} level="M" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] leading-snug font-medium text-ink-2">Quem usa o banheiro aponta a câmera, vê a última limpeza e avisa se faltar papel ou algo quebrar.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={print}>
                  <Printer className="size-3.5" strokeWidth={2} /> Imprimir etiqueta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose()
                    nav(`/u/${unitId}`)
                  }}
                >
                  <ExternalLink className="size-3.5" strokeWidth={2} /> Abrir página do QR
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
