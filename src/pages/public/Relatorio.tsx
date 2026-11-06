// Relatório da locação para o cliente: página pública (link enviado por WhatsApp), sem o painel.
import * as React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertTriangle, Check, ChevronDown, Clock, Download, FileSearch, Link2, MapPin, MessageCircle, PenLine, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { ProductThumb, TeamAvatar } from '@/components/ui'
import { BAIRRO } from '@/data/geo'
import { CLIENT, COMPANY, NOW, PRODUCT, RENTAL, TEAM, cleanableQty, qtyLabel, unitsOf, type Job, type Rental } from '@/data/mock'
import { daysFromToday, fmt, relDays } from '@/data/time'
import { demoPhotosFor, jobReport, onTime, stamp } from '@/lib/history'
import { JOB_TYPE, OCC_KIND } from '@/lib/status'
import { useDemo, useJobs, type JobPhoto, type ServiceReport } from '@/store'

const EASE = [0.16, 1, 0.3, 1] as const
const ddmm = (d: string | Date) => fmt.date(d).slice(0, 5)
const companyDigits = '55' + COMPANY.whatsapp.replace(/\D/g, '')
const contactFirst = (name: string) => name.replace(/^(Eng\.|Pe\.|Pr\.|Dra?\.|Sr\.|Sra\.|Mestre|Seu|Dona)\s+/i, '').split(' ')[0]

function openWa(text: string) {
  window.open(`https://wa.me/${companyDigits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}

const PRINT_CSS = `
@media print {
  @page { margin: 12mm; }
  html, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`

function Reveal({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.05 + i * 0.05 }} className={cn('print:break-inside-avoid', className)}>
      {children}
    </motion.div>
  )
}

function Section({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[26px] bg-card p-5 shadow-card sm:p-6 print:shadow-none print:ring-1 print:ring-line', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

/* Página */

export default function Relatorio() {
  const { rentalId = '' } = useParams()
  const rental = RENTAL[rentalId]

  React.useEffect(() => {
    const t = document.title
    document.title = rental ? `Relatório · ${rental.title} · ${COMPANY.name}` : `Relatório · ${COMPANY.name}`
    return () => {
      document.title = t
    }
  }, [rental])

  return (
    <div className="min-h-dvh bg-surface text-ink print:bg-white">
      <style>{PRINT_CSS}</style>
      <div className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-16 sm:px-6 sm:pt-8 print:max-w-none print:p-0">
        <TopBar />
        {rental ? <ReportBody rental={rental} /> : <NotFound />}
        <footer className="mt-10 flex flex-col items-center gap-2 text-center">
          <LogoMark size={28} />
          <div className="text-[12.5px] font-medium text-ink-3">
            {COMPANY.name} · Locação de banheiros e estruturas · {COMPANY.city}
          </div>
          <div className="num text-[12px] font-medium text-ink-4">
            WhatsApp {COMPANY.whatsapp} · {COMPANY.site}
          </div>
        </footer>
      </div>
    </div>
  )
}

function TopBar() {
  const copy = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {})
    toast('Link copiado')
  }
  return (
    <header className="flex items-center gap-3 pb-5">
      <LogoMark size={40} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[16px] font-bold tracking-[-0.02em]">{COMPANY.name}</div>
        <div className="text-[12.5px] font-medium text-ink-3">{COMPANY.city}</div>
      </div>
      <button onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-[13.5px] font-semibold text-ink shadow-pill transition-colors hover:bg-surface active:scale-[.97] print:hidden">
        <Link2 className="size-4" strokeWidth={2.2} /> Copiar link
      </button>
    </header>
  )
}

function NotFound() {
  return (
    <Reveal>
      <section className="flex flex-col items-center rounded-[30px] bg-card px-6 py-14 text-center shadow-card">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-ink">
          <FileSearch className="size-7" strokeWidth={1.9} />
        </span>
        <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-[-0.03em]">Relatório não encontrado</h1>
        <p className="mt-2 max-w-sm text-[14.5px] font-medium text-ink-3">Confira o link que você recebeu no WhatsApp ou fale com a {COMPANY.name}.</p>
        <button
          onClick={() => openWa('Olá! Não consegui abrir o relatório da locação.')}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-black px-6 text-[15px] font-semibold text-white transition-colors hover:bg-black-2 active:scale-[.97]"
        >
          <MessageCircle className="size-[18px] text-brand" strokeWidth={2.2} /> Falar com a {COMPANY.short}
        </button>
      </section>
    </Reveal>
  )
}

interface Entry {
  job: Job
  rep: ServiceReport
}

function ReportBody({ rental }: { rental: Rental }) {
  const [sp] = useSearchParams()
  const focusId = sp.get('s')
  const allJobs = useJobs()
  const reports = useDemo((s) => s.reports)
  const photos = useDemo((s) => s.photos)
  const occurrences = useDemo((s) => s.occurrences)
  const client = CLIENT[rental.clientId]

  const jobs = React.useMemo(() => allJobs.filter((j) => j.rentalId === rental.id), [allJobs, rental.id])
  const entries = React.useMemo<Entry[]>(
    () =>
      jobs
        .map((job) => ({ job, rep: jobReport(job, reports[job.id]) }))
        .filter((e): e is Entry => !!e.rep)
        .sort((a, b) => +new Date(b.rep.finishedAt) - +new Date(a.rep.finishedAt)),
    [jobs, reports],
  )
  const live = jobs.find((j) => j.status === 'em-andamento' && !reports[j.id])
  const team = TEAM[live?.teamId ?? rental.teamId]
  const upcoming = jobs.filter((j) => (j.status === 'agendado' || j.status === 'a-caminho') && +new Date(j.start) > +NOW - 3600000).sort((a, b) => +new Date(a.start) - +new Date(b.start))
  const nextClean = upcoming.find((j) => j.type === 'Limpeza') ?? upcoming[0]

  const cleanings = entries.filter((e) => e.job.type === 'Limpeza')
  const onTimeN = cleanings.filter((e) => onTime(e.job, e.rep)).length
  const unitsServed = cleanings.reduce((a, e) => a + (e.rep.units.length || e.job.units), 0)
  const rentalOcc = occurrences.filter((o) => o.rentalId === rental.id)
  const teamOcc = entries.reduce((a, e) => a + e.rep.occurrences.length, 0)
  const occTotal = rentalOcc.length + teamOcc
  const occResolved = rentalOcc.filter((o) => o.status === 'resolvida').length + teamOcc

  const firstDate = entries.length ? entries[entries.length - 1].rep.finishedAt : rental.start
  const ended = rental.status === 'encerrada' || daysFromToday(rental.end) < 0
  const periodTxt = `${ddmm(firstDate)} a ${ended ? ddmm(rental.end) : 'hoje'}`
  const isEvent = rental.kind === 'evento'
  const toilets = cleanableQty(rental)

  const summary = (() => {
    if (!entries.length && live) return `A equipe ${team.short} começou a ${live.type.toLowerCase()} hoje às ${fmt.time(live.start)}. Este relatório vai mostrando cada serviço assim que a equipe finaliza.`
    if (!entries.length) return `A montagem em ${rental.title} está marcada para ${fmt.weekday(rental.start)}, ${ddmm(rental.start)}. Este relatório vai mostrando cada serviço assim que a equipe finaliza.`
    const parts: string[] = []
    if (cleanings.length) {
      const where = toilets ? ` nos ${toilets} ${toilets === 1 ? 'banheiro' : 'banheiros'}` : ''
      const time = onTimeN === cleanings.length ? (cleanings.length === 1 ? 'no horário combinado' : 'todas no horário combinado') : `${onTimeN} no horário combinado`
      parts.push(`De ${periodTxt} foram ${cleanings.length} ${cleanings.length === 1 ? 'limpeza' : 'limpezas'}${where}, ${time}.`)
    }
    else parts.push(`De ${periodTxt} foram ${entries.length} ${entries.length === 1 ? 'serviço' : 'serviços'} no local.`)
    if (live) parts.push(`A equipe ${team.short} está fazendo a limpeza agora.`)
    else if (nextClean) parts.push(`A próxima ${nextClean.type === 'Limpeza' ? 'limpeza' : nextClean.type.toLowerCase()} está prevista para ${fmt.weekday(nextClean.start)}, ${ddmm(nextClean.start)}.`)
    return parts.join(' ')
  })()

  const [showAll, setShowAll] = React.useState(false)
  const focusIdx = focusId ? entries.findIndex((e) => e.job.id === focusId) : -1
  const limit = Math.max(6, focusIdx + 1)
  const shown = showAll ? entries : entries.slice(0, limit)

  React.useEffect(() => {
    if (!focusId) {
      window.scrollTo({ top: 0 })
      return
    }
    const t = window.setTimeout(() => document.getElementById(`svc-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
    return () => window.clearTimeout(t)
  }, [focusId])

  const metrics = [
    { label: isEvent ? 'Serviços feitos' : 'Limpezas feitas', value: String(isEvent ? entries.length : cleanings.length) },
    { label: 'No horário', value: cleanings.length ? `${Math.round((onTimeN / cleanings.length) * 100)}%` : 'Sem limpezas' },
    { label: 'Unidades atendidas', value: unitsServed.toLocaleString('pt-BR') },
    { label: 'Ocorrências resolvidas', value: occTotal ? `${occResolved} de ${occTotal}` : 'Nenhuma' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* topo */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[32px] bg-black p-5 text-white sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_90%_0%,rgba(238,106,28,.22),transparent_60%)]" />
          <div className="relative">
            <div className="text-[14px] font-medium text-white/60">
              {isEvent ? 'Relatório do evento' : 'Relatório de limpezas'} · {rental.code}
            </div>
            <h1 className="mt-1 text-[34px] leading-[1.05] font-bold tracking-[-0.04em] sm:text-[42px]">{rental.title}</h1>
            <div className="mt-2 text-[14px] font-medium text-white/60">{client.name}</div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-[16px] bg-white/10 px-3 py-1.5 text-[12.5px] leading-snug font-semibold">
                <MapPin className="size-3.5 shrink-0 text-brand" strokeWidth={2.2} />
                {rental.address}, {BAIRRO[rental.bairro].name}
              </span>
              <span className="num inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12.5px] font-semibold">
                <Clock className="size-3.5 text-brand" strokeWidth={2.2} />
                {periodTxt}
              </span>
            </div>
          </div>
          <div className="relative mt-5 flex items-center gap-3 rounded-[22px] bg-white/[0.08] p-3">
            <TeamAvatar teamId={team.id} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{team.name}</div>
              <div className="truncate text-[12.5px] font-medium text-white/55">
                {team.truck} · placa {team.plate}
              </div>
            </div>
            {live ? (
              <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3 text-[12.5px] font-bold text-white">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                No local agora
              </span>
            ) : (
              <span className="hidden h-8 shrink-0 items-center rounded-full bg-white/10 px-3 text-[12.5px] font-semibold text-white/80 min-[420px]:inline-flex">Responsável</span>
            )}
          </div>
        </section>
      </Reveal>

      {/* resumo */}
      <Reveal i={1}>
        <section className="rounded-[26px] bg-brand-soft p-5 sm:p-6">
          <div className="text-[13.5px] font-semibold text-brand-ink">Olá, {contactFirst(rental.contact.name)}</div>
          <p className="mt-1.5 text-[18px] leading-[1.5] font-semibold tracking-[-0.01em] text-ink sm:text-[19px]">{summary}</p>
        </section>
      </Reveal>

      {/* números do período */}
      <Reveal i={2} className={cn('grid grid-cols-2 gap-3', !entries.length && 'hidden')}>
        {metrics.map((m) => (
          <section key={m.label} className="rounded-[24px] bg-card p-4 shadow-card sm:p-5 print:shadow-none print:ring-1 print:ring-line">
            <div className="text-[13px] font-semibold text-ink-3">{m.label}</div>
            <div className="num mt-1.5 text-[30px] leading-none font-bold tracking-[-0.03em] text-ink sm:text-[34px]">{m.value}</div>
          </section>
        ))}
      </Reveal>

      {/* em andamento */}
      {live && (
        <Reveal i={3}>
          <section className="flex items-center gap-3.5 rounded-[26px] bg-card p-4 shadow-card sm:p-5 print:hidden">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-25" />
              {React.createElement(JOB_TYPE[live.type].icon, { className: 'relative size-[18px]', strokeWidth: 2 })}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-ink">{live.type} em andamento</div>
              <div className="text-[13px] font-medium text-ink-3">
                Começou às <span className="num">{fmt.time(live.start)}</span>. O registro aparece aqui quando a equipe finalizar.
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* serviços */}
      <Reveal i={4}>
        <Section title={isEvent ? 'Serviços no evento' : 'Limpezas e serviços'} aside={<span className="num text-[13px] font-semibold text-ink-3">{entries.length} no período</span>}>
          {entries.length ? (
            <ol className="flex flex-col gap-2">
              {shown.map((e, i) => (
                <ServiceCard key={e.job.id} entry={e} photos={photos} defaultOpen={focusId ? e.job.id === focusId : i === 0} focused={e.job.id === focusId} />
              ))}
            </ol>
          ) : (
            <div className="rounded-[20px] bg-surface px-4 py-8 text-center text-[14px] font-medium text-ink-3">Nenhum serviço finalizado ainda.</div>
          )}
          {entries.length > shown.length && (
            <button onClick={() => setShowAll(true)} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-muted text-[14px] font-semibold text-ink transition-colors hover:bg-muted-2 print:hidden">
              Mostrar mais {entries.length - shown.length}
            </button>
          )}
        </Section>
      </Reveal>

      {/* equipamentos no local */}
      <Reveal i={5}>
        <Section title={ended ? 'Equipamentos locados' : 'No local'} aside={<span className="text-[13px] font-semibold text-ink-3">{rental.items.length} {rental.items.length === 1 ? 'item' : 'itens'}</span>}>
          <ItemsList rental={rental} />
        </Section>
      </Reveal>

      {/* próximos serviços */}
      {upcoming.length > 0 && (
        <Reveal i={6}>
          <Section title="Próximos serviços">
            <div className="flex flex-col gap-2">
              {upcoming.slice(0, 3).map((j) => {
                const x = new Date(j.start)
                const T = JOB_TYPE[j.type]
                return (
                  <div key={j.id} className="flex items-center gap-3.5 rounded-[20px] bg-surface p-3">
                    <span className="flex size-[52px] shrink-0 flex-col items-center justify-center rounded-[16px] bg-card leading-none shadow-pill">
                      <span className="num text-[19px] font-bold">{x.getDate()}</span>
                      <span className="mt-0.5 text-[11px] font-semibold text-ink-3">{fmt.short(x).split(' ').pop()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-ink">{j.type}</div>
                      <div className="text-[13px] font-medium text-ink-3">
                        {fmt.weekday(x)}, {relDays(x)}, por volta das <span className="num">{fmt.time(x)}</span>
                      </div>
                    </div>
                    <span className={cn('hidden size-9 shrink-0 items-center justify-center rounded-full min-[400px]:flex', T.soft, T.text)}>
                      <T.icon className="size-4" strokeWidth={2} />
                    </span>
                  </div>
                )
              })}
            </div>
          </Section>
        </Reveal>
      )}

      {/* contato */}
      <Reveal i={7}>
        <section className="relative overflow-hidden rounded-[30px] bg-black p-5 text-white sm:p-6 print:hidden">
          <div className="flex items-center gap-3">
            <LogoMark size={44} tone="brand" />
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold">Precisa de algo no local?</div>
              <div className="num text-[13.5px] font-medium text-white/60">WhatsApp {COMPANY.whatsapp}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => openWa(`Olá! Sou da locação ${rental.title} (${rental.code}).`)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 text-[15px] font-semibold transition-colors hover:bg-white/15 active:scale-[.98]"
            >
              <MessageCircle className="size-[18px]" strokeWidth={2.2} /> Falar com a {COMPANY.short}
            </button>
            <button onClick={() => window.print()} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-2 active:scale-[.98]">
              <Download className="size-[18px]" strokeWidth={2.2} /> Baixar PDF
            </button>
          </div>
        </section>
      </Reveal>
    </div>
  )
}

/* Itens e patrimônios */

function ItemsList({ rental }: { rental: Rental }) {
  const [open, setOpen] = React.useState(false)
  const units = unitsOf(rental.id)
  return (
    <>
      <div className="flex flex-col divide-y divide-line">
        {rental.items.map((it) => {
          const p = PRODUCT[it.productId]
          return (
            <div key={it.productId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <ProductThumb productId={it.productId} size={44} rounded="xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-bold text-ink">{p.name}</div>
                <div className="truncate text-[12.5px] font-medium text-ink-3">{p.cleanable ? 'Com limpeza periódica' : 'Estrutura'}</div>
              </div>
              <span className="num shrink-0 text-[14px] font-bold text-ink">{qtyLabel(it.productId, it.qty)}</span>
            </div>
          )
        })}
      </div>
      {units.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-[13.5px] font-semibold text-ink-2 print:hidden">
            Números de patrimônio
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} strokeWidth={2.2} />
          </button>
          <div className={cn('mt-3 flex-wrap gap-1.5', open ? 'flex' : 'hidden print:flex')}>
            {units.map((u) => (
              <Link key={u.id} to={`/u/${u.id}`} className="num inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-[12px] font-semibold text-ink-2 transition-colors hover:bg-muted-2">
                {u.id}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] font-medium text-ink-3">Cada unidade tem um QR na porta. Quem estiver no local pode avisar a {COMPANY.short} por ali.</p>
        </div>
      )}
    </>
  )
}

/* Cartão de um serviço */

function ServiceCard({ entry, photos, defaultOpen, focused }: { entry: Entry; photos: JobPhoto[]; defaultOpen: boolean; focused: boolean }) {
  const { job, rep } = entry
  const [open, setOpen] = React.useState(defaultOpen)
  React.useEffect(() => {
    if (focused) setOpen(true)
  }, [focused])
  const T = JOB_TYPE[job.type]
  const team = TEAM[rep.teamId]
  const late = Math.round((+new Date(rep.startedAt) - +new Date(job.start)) / 60000)
  const ok = onTime(job, rep)
  const dur = Math.max(1, Math.round((+new Date(rep.finishedAt) - +new Date(rep.startedAt)) / 60000))
  const pics = rep.photoIds.length
    ? photos.filter((p) => rep.photoIds.includes(p.id)).map((p) => ({ src: p.src, label: p.label }))
    : photos.filter((p) => p.jobId === job.id).length
      ? photos.filter((p) => p.jobId === job.id).map((p) => ({ src: p.src, label: p.label }))
      : demoPhotosFor(job)
  const issues = rep.units.filter((u) => !u.ok)

  const details = (
    <div className="px-3 pb-4 sm:px-4">
      <div className="flex items-center gap-2.5 rounded-[16px] bg-card px-3 py-2.5">
        <TeamAvatar teamId={team.id} size={30} />
        <div className="min-w-0 flex-1 text-[13px] leading-tight">
          <div className="truncate font-bold text-ink">{team.name}</div>
          <div className="truncate font-medium text-ink-3">{team.members.join(' e ')}</div>
        </div>
        <span className="num inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 text-[12px] font-semibold text-ink-2">
          <Timer className="size-3.5" strokeWidth={2.2} /> {dur} min
        </span>
      </div>

      <p className="mt-3 text-[14px] leading-snug font-medium text-ink-2">{rep.summary}</p>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {rep.checklist.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
            <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full', c.ok ? 'bg-green-soft text-green' : 'bg-yellow-soft text-yellow-ink')}>
              {c.ok ? <Check className="size-3" strokeWidth={3} /> : <AlertTriangle className="size-3" strokeWidth={2.4} />}
            </span>
            {c.label}
          </div>
        ))}
      </div>

      {rep.items && rep.items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {rep.items.map((it) => (
            <span key={it.label} className={cn('num inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-semibold', it.done === it.planned ? 'bg-card text-ink-2' : 'bg-yellow-soft text-yellow-ink')}>
              {it.done} de {it.planned} · {it.label}
            </span>
          ))}
        </div>
      )}

      {rep.supplies && rep.supplies.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[12px] font-semibold text-ink-3">Insumos repostos</div>
          <div className="flex flex-wrap gap-1.5">
            {rep.supplies.map((s) => (
              <span key={s.label} className="num inline-flex h-7 items-center rounded-full bg-card px-2.5 text-[12px] font-semibold text-ink-2">
                {s.label}: {s.qty}
              </span>
            ))}
          </div>
        </div>
      )}

      {rep.units.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[12px] font-semibold text-ink-3">
            {rep.units.length} {rep.units.length === 1 ? 'unidade' : 'unidades'}
            {issues.length ? `, ${issues.length} com observação` : ''}
          </div>
          <div className="flex flex-wrap gap-1">
            {rep.units.map((u) => (
              <span key={u.id} title={u.note} className={cn('num inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold', u.ok ? 'bg-green-soft text-[#1e8a50]' : 'bg-yellow-soft text-yellow-ink')}>
                {u.ok ? <Check className="size-3" strokeWidth={3} /> : <AlertTriangle className="size-3" strokeWidth={2.4} />}
                {u.id}
              </span>
            ))}
          </div>
        </div>
      )}

      {rep.occurrences.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {rep.occurrences.map((o, k) => (
            <div key={k} className="rounded-[14px] bg-yellow-soft px-3 py-2 text-[13px] font-semibold text-yellow-ink">
              {OCC_KIND[o.kind].label}
              {o.unitId ? ` · ${o.unitId}` : ''}
              {o.note && <span className="block font-medium">{o.note}</span>}
            </div>
          ))}
        </div>
      )}

      {pics.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {pics.slice(0, 6).map((p, k) => (
            <figure key={k} className="relative aspect-square overflow-hidden rounded-[16px] bg-muted">
              <img src={p.src} alt={p.label} loading="lazy" className="size-full object-cover" />
              <figcaption className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-ink backdrop-blur-md">{p.label}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {rep.signedBy && (
        <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-card px-3 py-2.5">
          {rep.signature ? (
            <img src={rep.signature} alt={`Assinatura de ${rep.signedBy}`} className="h-10 w-24 shrink-0 object-contain" />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink-2">
              <PenLine className="size-4" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0 flex-1 text-[13px] leading-tight">
            <div className="truncate font-bold text-ink">Conferido por {rep.signedBy}</div>
            <div className="truncate font-medium text-ink-3">
              {rep.signedRole ? `${rep.signedRole}, ` : ''}às <span className="num">{fmt.time(rep.finishedAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <li id={`svc-${job.id}`} className={cn('scroll-mt-4 overflow-hidden rounded-[22px] bg-surface transition-shadow print:break-inside-avoid', focused && 'ring-2 ring-brand')}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left sm:px-4">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', T.soft, T.text)}>
          <T.icon className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-bold text-ink">{job.type}</span>
            {focused && <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-brand px-2 text-[11px] font-bold text-white">Este serviço</span>}
          </div>
          <div className="num truncate text-[13px] font-medium text-ink-3 first-letter:uppercase">{stamp(rep.finishedAt)}</div>
        </div>
        <span className={cn('num hidden h-7 shrink-0 items-center rounded-full px-2.5 text-[12px] font-semibold min-[400px]:inline-flex', ok ? 'bg-green-soft text-[#1e8a50]' : 'bg-yellow-soft text-yellow-ink')}>{ok ? 'No horário' : `Atraso de ${late} min`}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-ink-3 transition-transform print:hidden', open && 'rotate-180')} strokeWidth={2.2} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden print:hidden">
            {details}
          </motion.div>
        )}
      </AnimatePresence>
      {/* na impressão todos os serviços saem abertos */}
      <div className="hidden print:block">{details}</div>
    </li>
  )
}
