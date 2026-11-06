// Página aberta pelo QR colado na porta da unidade (/u/:unitId). Pública, celular primeiro.
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CalendarClock, Check, CircleHelp, DoorClosed, Droplets, Hammer, MessageCircle, ScrollText, SprayCan, Toilet, TriangleAlert, Warehouse, type LucideIcon } from 'lucide-react'
import { LogoMark } from '@/components/AppShell'
import { Button, IconCircle, ProductThumb, TeamAvatar } from '@/components/ui'
import { ago, cleaningsOf, clientOf, nextCleaningOf, nextPickupOf, stateOf } from '@/components/equipment/model'
import { BAIRRO } from '@/data/geo'
import { COMPANY, PRODUCT, RENTAL, TEAM, UNIT, simNow, type OccKind } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { OCC_KIND } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo, useJobs } from '@/store'

const EASE = [0.25, 1, 0.5, 1] as const
const rise = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.04 + i * 0.05, duration: 0.35, ease: EASE },
})

const OCC_ICON: Record<OccKind, LucideIcon> = {
  'sem-papel': ScrollText,
  sujo: SprayCan,
  cheio: Toilet,
  porta: DoorClosed,
  vazamento: Droplets,
  avaria: Hammer,
  outro: CircleHelp,
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const when = (d: string) => `${cap(relDays(d))}, ${fmt.time(d)}`
const waLink = (text: string) => `https://wa.me/55${COMPANY.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

function Header() {
  return (
    <motion.header {...rise(0)} className="flex items-center gap-2.5 pb-4">
      <LogoMark size={40} />
      <div className="min-w-0 leading-tight">
        <div className="text-[15px] font-bold tracking-[-0.01em] text-ink">{COMPANY.name}</div>
        <div className="text-[12.5px] font-medium text-ink-3">{COMPANY.city}</div>
      </div>
    </motion.header>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-4 pb-10 sm:pt-10">{children}</div>
    </div>
  )
}

function Message({ unitId, title, text, icon: Icon }: { unitId?: string; title: string; text: string; icon: LucideIcon }) {
  return (
    <Shell>
      <Header />
      <motion.div {...rise(1)} className="rounded-[28px] bg-card px-6 py-10 text-center shadow-card">
        <IconCircle size={56} className="mx-auto">
          <Icon className="size-6" strokeWidth={1.9} />
        </IconCircle>
        <h1 className="mt-4 text-[24px] leading-tight font-bold tracking-[-0.03em] text-ink">{title}</h1>
        <p className="mx-auto mt-2 max-w-[300px] text-[14px] font-medium text-ink-3">{text}</p>
        <a href={waLink(unitId ? `Olá! Escaneei o QR da unidade ${unitId}.` : 'Olá! Escaneei um QR da R8.')} target="_blank" rel="noreferrer" className="mt-6 inline-block">
          <Button variant="primary" size="lg">
            <MessageCircle className="size-4" strokeWidth={2} /> Falar com a R8
          </Button>
        </a>
      </motion.div>
    </Shell>
  )
}

export default function Unidade() {
  const { unitId = '' } = useParams()
  const id = unitId.toUpperCase()
  const u = UNIT[id]
  const overrides = useDemo((s) => s.unitState)

  React.useEffect(() => {
    const prev = document.title
    document.title = `${id} · ${COMPANY.name}`
    return () => {
      document.title = prev
    }
  }, [id])

  if (!u) return <Message title="Unidade não encontrada" text="Confira o número na etiqueta da porta ou fale com a R8 pelo WhatsApp." icon={CircleHelp} />
  const state = stateOf(u, overrides)
  if (state !== 'campo' || !u.rentalId)
    return (
      <Message
        unitId={id}
        title={`${id} está na base da R8`}
        text={state === 'manutencao' ? 'Esta unidade está em manutenção na nossa oficina.' : 'Esta unidade não está alugada no momento.'}
        icon={Warehouse}
      />
    )
  return <UnitView unitId={id} />
}

function UnitView({ unitId }: { unitId: string }) {
  const u = UNIT[unitId]
  const p = PRODUCT[u.productId]
  const r = RENTAL[u.rentalId!]
  const client = clientOf(r)
  const jobs = useJobs()
  const reports = useDemo((s) => s.reports)
  const occurrences = useDemo((s) => s.occurrences)
  const addOccurrence = useDemo((s) => s.addOccurrence)

  const rentalJobs = React.useMemo(() => jobs.filter((j) => j.rentalId === r.id), [jobs, r.id])
  const last = cleaningsOf(r.id, rentalJobs, reports, 1)[0]
  const next = nextCleaningOf(r.id, rentalJobs)
  const pickup = r.status === 'retirada' ? nextPickupOf(r.id, rentalJobs) : undefined
  const open = occurrences.filter((o) => o.unitId === unitId && o.status === 'aberta')

  const [step, setStep] = React.useState<'view' | 'form' | 'sent'>('view')
  const [kind, setKind] = React.useState<OccKind | null>(null)
  const [note, setNote] = React.useState('')
  const [protocol, setProtocol] = React.useState('')

  const send = () => {
    if (!kind) return
    const n = String(Date.now()).slice(-5)
    addOccurrence({ id: `qr-${Date.now().toString(36)}`, unitId, rentalId: r.id, kind, note: note.trim() || undefined, at: simNow().toISOString(), source: 'qr', status: 'aberta' })
    setProtocol(n)
    setStep('sent')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Shell>
      <Header />

      {/* cartão da unidade */}
      <motion.article {...rise(1)} className="relative overflow-hidden rounded-[28px] bg-black p-5 text-white shadow-float">
        <span aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-brand/[.10]" />
        <span aria-hidden className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-brand/[.18]" />
        <div className="relative flex items-center gap-4">
          <span className="shrink-0 rounded-full bg-brand p-[3px]">
            <ProductThumb productId={p.id} size={72} className="ring-[3px] ring-black" />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-white/55">{p.short}</div>
            <h1 className="num text-[36px] leading-none font-bold tracking-[-0.03em]">{unitId}</h1>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div className="col-span-2 min-w-0">
            <div className="text-[12px] font-medium text-white/50">Local</div>
            <div className="mt-0.5 text-[15px] leading-snug font-semibold">{r.title}</div>
            <div className="mt-0.5 text-[13px] font-medium text-white/60">
              {r.address}, {BAIRRO[r.bairro].name}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/50">Cliente</div>
            <div className="mt-0.5 truncate text-[14px] font-semibold">{client.name}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/50">Limpeza</div>
            <div className="mt-0.5 truncate text-[14px] font-semibold">{r.cleanPerWeek ? `${r.cleanPerWeek}x por semana` : 'Durante o evento'}</div>
          </div>
        </div>
      </motion.article>

      <AnimatePresence mode="wait" initial={false}>
        {step === 'view' && (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-3 space-y-3">
            {/* limpezas */}
            <motion.section {...rise(2)} className="rounded-[24px] bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <IconCircle size={44} tone="green">
                  <Check className="size-5" strokeWidth={2.4} />
                </IconCircle>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-ink-3">Última limpeza</div>
                  <div className="text-[19px] leading-tight font-bold tracking-[-0.02em] text-ink">{last ? when(last.report.finishedAt) : 'Ainda sem registro'}</div>
                </div>
              </div>
              {last && (
                <div className="mt-3 flex items-center gap-2.5 rounded-[16px] bg-surface px-3 py-2.5">
                  <TeamAvatar teamId={last.job.teamId} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-2">{TEAM[last.job.teamId].name}</span>
                </div>
              )}
              <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
                <IconCircle size={36}>
                  <CalendarClock className="size-4" strokeWidth={2} />
                </IconCircle>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-ink-3">{pickup ? 'Retirada prevista' : 'Próxima limpeza'}</div>
                  <div className="text-[15px] font-bold text-ink">
                    {pickup ? when(pickup.start) : next ? (next.status === 'em-andamento' ? 'Acontecendo agora' : when(next.start)) : r.cleanPerWeek ? `${r.cleanPerWeek} vezes por semana` : 'Durante o evento'}
                  </div>
                </div>
              </div>
            </motion.section>

            {open.length > 0 && (
              <motion.section {...rise(3)} className="rounded-[24px] bg-yellow-soft p-4">
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-yellow-ink">
                  <TriangleAlert className="size-4" strokeWidth={2.2} /> Já recebemos um aviso
                </div>
                <ul className="mt-1.5 space-y-1">
                  {open.map((o) => (
                    <li key={o.id} className="text-[13.5px] font-medium text-ink-2">
                      {OCC_KIND[o.kind].label}, {ago(o.at)}. A equipe já está sabendo.
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}

            {/* ações */}
            <motion.div {...rise(4)} className="space-y-2 pt-1">
              <Button variant="brand" size="lg" className="h-14 w-full text-[16px]" onClick={() => setStep('form')}>
                <TriangleAlert className="size-[18px]" strokeWidth={2.2} /> Reportar problema
              </Button>
              <a href={waLink(`Olá! Estou na unidade ${unitId} em ${r.title}.`)} target="_blank" rel="noreferrer" className="block">
                <Button variant="outline" size="lg" className="h-14 w-full text-[15px]">
                  <MessageCircle className="size-[18px]" strokeWidth={2} /> Falar com a R8 no WhatsApp
                </Button>
              </a>
            </motion.div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.section key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="mt-3 rounded-[28px] bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('view')} aria-label="Voltar" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink active:scale-95">
                <ArrowLeft className="size-[18px]" strokeWidth={2} />
              </button>
              <div className="min-w-0">
                <h2 className="text-[20px] leading-tight font-bold tracking-[-0.02em] text-ink">Qual é o problema?</h2>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de problema">
              {(Object.keys(OCC_KIND) as OccKind[]).map((k) => {
                const Icon = OCC_ICON[k]
                const on = kind === k
                return (
                  <button
                    key={k}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setKind(k)}
                    className={cn(
                      'flex min-h-[64px] items-center gap-2.5 rounded-[18px] px-3 text-left text-[13.5px] leading-snug font-semibold transition-[background,color,transform] duration-150 active:scale-[.97]',
                      on ? 'bg-black text-white' : 'bg-muted text-ink hover:bg-muted-2',
                      k === 'outro' && 'col-span-2',
                    )}
                  >
                    <Icon className={cn('size-5 shrink-0', on ? 'text-brand' : 'text-ink-2')} strokeWidth={2} />
                    {OCC_KIND[k].label}
                  </button>
                )
              })}
            </div>
            <label className="mt-4 block">
              <span className="text-[13px] font-semibold text-ink-2">Quer explicar melhor? (opcional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="Ex.: a porta não fecha por dentro"
                className="mt-1.5 w-full resize-none rounded-[18px] bg-muted px-4 py-3 text-[16px] leading-[1.5] font-medium text-ink outline-none placeholder:text-ink-4 focus:bg-card focus:ring-2 focus:ring-black"
              />
            </label>
            <Button variant="primary" size="lg" className="mt-3 h-14 w-full text-[16px]" disabled={!kind} onClick={send}>
              Enviar aviso
            </Button>
            <p className="mt-2 text-center text-[12px] font-medium text-ink-3">Não pedimos seu nome nem telefone.</p>
          </motion.section>
        )}

        {step === 'sent' && (
          <motion.section key="sent" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: EASE }} className="mt-3 rounded-[28px] bg-card px-6 py-9 text-center shadow-card">
            <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }} className="mx-auto flex size-16 items-center justify-center rounded-full bg-green text-white">
              <Check className="size-8" strokeWidth={2.6} />
            </motion.span>
            <h2 className="mt-4 text-[24px] leading-tight font-bold tracking-[-0.03em] text-ink">A equipe da R8 foi avisada</h2>
            <p className="mx-auto mt-2 max-w-[300px] text-[14px] font-medium text-ink-3">
              {kind ? OCC_KIND[kind].label : 'Problema'} na unidade {unitId}. O responsável pela limpeza deste local recebeu o aviso agora.
            </p>
            <div className="mx-auto mt-5 inline-flex h-9 items-center rounded-full bg-muted px-4 text-[13px] font-semibold text-ink-2">
              Protocolo <span className="num ml-1.5 text-ink">#{protocol}</span>
            </div>
            <div className="mt-6 space-y-2">
              <a href={waLink(`Olá! Abri o aviso #${protocol} da unidade ${unitId} em ${r.title}.`)} target="_blank" rel="noreferrer" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  <MessageCircle className="size-4" strokeWidth={2} /> Acompanhar pelo WhatsApp
                </Button>
              </a>
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => {
                  setKind(null)
                  setNote('')
                  setStep('view')
                }}
              >
                Voltar
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

    </Shell>
  )
}
