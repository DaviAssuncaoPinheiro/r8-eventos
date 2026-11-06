// Tela do serviço (chegada): local, o que fazer, contato e andamento
import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check, ChevronRight, ClipboardList, Clock, FileText, KeyRound, Lock, Map as MapIcon, MapPin, MessageCircle, Navigation, Phone, PlayCircle, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductThumb, RentalAvatar, TeamAvatar } from '@/components/ui'
import { CLIENT, PRODUCT, TEAM, type Job } from '@/data/mock'
import { daysFromToday, fmt, relDays } from '@/data/time'
import { JOB_STATUS, JOB_TYPE, OCC_KIND } from '@/lib/status'
import { jobItems, navLinks } from '@/lib/fieldkit'
import { jobReport, stamp } from '@/lib/history'
import { useDemo } from '@/store'
import { notify, queueIfOffline, useCampo } from './campoStore'
import { bairroOf, cleanUnits, contactFirst, coverPhoto, dateShort, isToday, rentalOf, simNow, useJob, useLastCleaning, zoneOf } from './data'
import { Btn, ConnectivityBanner, EASE_OUT, Pressable, RoundBtn, SafeImg, Screen } from './kit'
import { useGo } from './nav'
import { ArrivalCard } from './ArrivalCard'
import { JobMenu } from './JobMenu'

export default function JobScreen() {
  const { id = '' } = useParams()
  const job = useJob(id)
  const nav = useNavigate()
  if (!job)
    return (
      <Screen title="Serviço" back={{ label: 'Voltar', onClick: () => nav('/') }}>
        <p className="p-6 text-[15px] font-medium text-ink-3">Serviço não encontrado.</p>
      </Screen>
    )
  return <JobDetail job={job} />
}

/** Foto grande do equipamento do serviço */
export function JobHero({ job }: { job: Job }) {
  return (
    <div className="absolute inset-0 bg-muted">
      <SafeImg src={coverPhoto(job)} alt={PRODUCT[job.products?.[0] ?? rentalOf(job).items[0].productId].short} className="size-full object-cover" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  )
}

/** "9 unidades", "316 peças" */
export function scopeLabel(job: Job) {
  if (job.type === 'Limpeza' || job.type === 'Manutenção') return `${job.units} ${job.units === 1 ? 'unidade' : 'unidades'}`
  return `${job.units.toLocaleString('pt-BR')} ${job.units === 1 ? 'item' : 'itens'}`
}

/** Estado e ações do serviço (mesmo fluxo no celular e no computador). */
export function useJobFlow(job: Job) {
  const go = useGo()
  const rental = rentalOf(job)
  const client = CLIENT[rental.clientId]
  const team = TEAM[job.teamId]
  const b = bairroOf(rental)
  const zone = zoneOf(rental)
  const status = job.status
  const st = JOB_STATUS[status]
  const tp = JOB_TYPE[job.type]
  const setJobStatus = useDemo((s) => s.setJobStatus)
  const occurrences = useDemo((s) => s.occurrences)
  const stored = useDemo((s) => s.reports[job.id])
  const arrived = useCampo((s) => !!s.arrived[job.id])
  const report = jobReport(job, stored)
  const last = useLastCleaning(job)
  const openOcc = occurrences.filter((o) => o.rentalId === rental.id && o.status === 'aberta')
  const links = navLinks(job)
  const [arrival, setArrival] = React.useState(false)
  const first = contactFirst(rental)

  const action = (label: string, body: string) => notify({ kind: 'app', title: label, body })

  /** Abre o registro; se ainda não começou, marca o início */
  const startRecord = () => {
    setArrival(false)
    if (useDemo.getState().jobStatus[job.id] !== 'em-andamento') {
      setJobStatus(job.id, 'em-andamento')
      useCampo.getState().setStarted(job.id, simNow().toISOString())
    }
    useCampo.getState().ensureDraft(job)
    window.setTimeout(() => go(`/servico/${job.id}/registro`, { dir: 1 }), arrival ? 220 : 0)
  }
  const canArrival = status === 'em-andamento' || (status === 'a-caminho' && arrived)
  const arrivalStart = status === 'em-andamento' ? 'Continuar registro' : 'Começar registro'

  const future = daysFromToday(job.start) > 0
  const past = daysFromToday(job.start) < 0
  const onPrimary = () => {
    if ((future || past) && status === 'agendado') {
      notify({ kind: 'app', title: future ? `Serviço de ${dateShort(job.start)}` : 'Serviço de outro dia', body: future ? 'O registro abre no dia do serviço.' : 'Esse serviço ficou para trás. Reagende pela agenda.' })
      return
    }
    if (status === 'agendado' || status === 'cancelado') {
      setJobStatus(job.id, 'a-caminho')
      const offline = queueIfOffline()
      notify(
        offline
          ? { kind: 'offline', title: 'Mensagem na fila', body: `Sem sinal. O aviso para ${first} sai quando reconectar.` }
          : { kind: 'whatsapp', title: `Aviso enviado para ${first}`, body: `${team.name} a caminho de ${rental.title}.` },
      )
    } else if (status === 'a-caminho' && !arrived) {
      useCampo.getState().setArrived(job.id)
      setArrival(true)
    } else if (status === 'a-caminho' || status === 'em-andamento') {
      startRecord()
    } else if (status === 'concluido') {
      go(`/servico/${job.id}/concluido`, { dir: 1 })
    }
  }

  const stage = status === 'concluido' ? 3 : status === 'em-andamento' ? 2 : status === 'a-caminho' ? (arrived ? 1 : 0) : -1
  const primaryLabel =
    (future || past) && status === 'agendado'
      ? future
        ? `Agendado para ${dateShort(job.start)}`
        : 'Serviço não feito'
      : status === 'agendado' || status === 'cancelado'
      ? 'Estou a caminho'
      : status === 'a-caminho'
        ? arrived
          ? 'Começar registro'
          : 'Cheguei'
        : status === 'em-andamento'
          ? 'Continuar registro'
          : 'Ver resumo'
  const brandCta = (status === 'a-caminho' && arrived) || status === 'em-andamento'
  const PrimaryIcon = status === 'concluido' ? Check : status === 'agendado' ? Navigation : status === 'a-caminho' && !arrived ? MapPin : PlayCircle
  const contacts = [
    { icon: Phone, label: 'Ligar', onClick: () => action(`Ligando para ${first}`, rental.contact.phone) },
    { icon: MessageCircle, label: 'WhatsApp', onClick: () => notify({ kind: 'whatsapp', title: 'Abrindo conversa', body: `${rental.contact.name}, ${rental.contact.phone}` }) },
  ]
  const navApps = [
    { label: 'Waze', href: links.waze, icon: Navigation },
    { label: 'Maps', href: links.maps, icon: MapIcon },
  ]

  return { go, rental, client, team, b, zone, status, st, tp, report, last, openOcc, first, onPrimary, stage, primaryLabel, brandCta, PrimaryIcon, contacts, navApps, arrival, setArrival, startRecord, canArrival, arrivalStart }
}

type Flow = ReturnType<typeof useJobFlow>

function JobDetail({ job }: { job: Job }) {
  const nav = useNavigate()
  const flow = useJobFlow(job)
  const { rental, client, team, b, zone, status, st, tp, openOcc, onPrimary, stage, primaryLabel, brandCta, PrimaryIcon, arrival, setArrival, startRecord, canArrival, arrivalStart } = flow

  return (
    <Screen
      title="Serviço"
      back={{ label: 'Voltar', onClick: () => nav('/') }}
      right={<JobMenu rentalId={rental.id} />}
      below={<ConnectivityBanner />}
      footer={
        <div>
          <Tracker stage={stage} />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={primaryLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
              <Btn tone={brandCta ? 'brand' : 'primary'} className="h-[58px] w-full text-[16.5px]" onClick={onPrimary}>
                <PrimaryIcon className={cn('size-[18px]', !brandCta && status !== 'concluido' && 'text-brand')} />
                {primaryLabel}
              </Btn>
            </motion.div>
          </AnimatePresence>
        </div>
      }
    >
      {/* foto com rótulo translúcido */}
      <div className="relative mx-4 h-[248px] overflow-hidden rounded-[32px]">
        <JobHero job={job} />
        <span className="absolute top-3 left-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/80 px-3 text-[12.5px] font-bold text-ink backdrop-blur-md">
          <span className={cn('size-2 rounded-full', status === 'em-andamento' ? 'bg-brand' : status === 'concluido' ? 'bg-green' : status === 'a-caminho' ? 'bg-blue' : 'bg-ink-4')} />
          {st.label}
        </span>
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-[22px] bg-white/78 px-3 py-2.5 backdrop-blur-xl">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tp.soft, tp.text)}>
            <tp.icon className="size-[18px]" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-ink">{job.type}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2">
              <Clock className="size-3.5" strokeWidth={2.2} />
              {!isToday(job.start) && <>{dateShort(job.start)} · </>}
              <span className="num">{fmt.time(job.start)}</span> · {job.durationMin} min
            </div>
          </div>
          {job.fixedTime && (
            <span className="inline-flex h-8 items-center gap-1 rounded-full bg-black px-3 text-[12px] font-semibold text-white">
              <Lock className="size-3" strokeWidth={2.4} /> Combinado
            </span>
          )}
        </div>
      </div>

      {/* nome e chips */}
      <div className="px-5 pt-5">
        <h1 className="text-[30px] leading-[1.05] font-bold tracking-[-0.035em] text-ink">{rental.title}</h1>
        <div className="mt-1.5 text-[14.5px] font-medium text-ink-3">{client.name}</div>
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
          <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-card pr-4 pl-1.5 text-[14px] font-semibold text-ink shadow-pill">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="size-4" strokeWidth={2} />
            </span>
            {scopeLabel(job)}
          </span>
          <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-card pr-4 pl-1.5 text-[14px] font-semibold text-ink shadow-pill">
            <TeamAvatar teamId={team.id} size={32} />
            {team.name}
          </span>
          <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-card pr-4 pl-3.5 text-[14px] font-semibold text-ink shadow-pill">
            <span className="size-2.5 rounded-full" style={{ background: zone.hex }} />
            {b.name}
          </span>
        </div>
      </div>

      {canArrival && (
        <Pressable scale={0.985} onClick={() => setArrival(true)} className="mx-4 mt-5 flex w-[calc(100%-2rem)] items-center gap-3 rounded-[26px] bg-black p-2.5 pr-3 text-left text-white">
          <RentalAvatar rental={rental} size={48} className="ring-2 ring-brand" />
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-bold">Ver cartão de chegada</span>
            <span className="block truncate text-[12.5px] font-medium text-white/55">Acesso, contato e o que fazer</span>
          </span>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <ArrowUpRight className="size-[18px]" strokeWidth={2.2} />
          </span>
        </Pressable>
      )}

      <OccAlert openOcc={openOcc} className={cn('mx-4', canArrival ? 'mt-3' : 'mt-5')} />
      <TodoCard job={job} flow={flow} className="mx-4 mt-3" />
      <LastCard flow={flow} className="mx-4 mt-3" />
      <ItemsCard job={job} className="mx-4 mt-3" />
      <ContactCard flow={flow} className="mx-4 mt-3" />

      {status === 'concluido' && (
        <Pressable onClick={onPrimary} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-[24px] bg-brand-soft px-4 py-3.5 text-left">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand text-white">
            <Check className="size-4" strokeWidth={2.6} />
          </span>
          <span className="flex-1 text-[14.5px] font-semibold text-ink">Registrado e enviado ao cliente</span>
          <ChevronRight className="size-4 text-ink-3" />
        </Pressable>
      )}
      <ArrivalCard job={job} open={arrival} onOpenChange={setArrival} onStart={startRecord} startLabel={arrivalStart} />
    </Screen>
  )
}

/* ───────────── cartões reaproveitados no computador ───────────── */

export function OccAlert({ openOcc, className }: { openOcc: Flow['openOcc']; className?: string }) {
  if (!openOcc.length) return null
  return (
    <div className={cn('rounded-[28px] bg-red-soft p-5', className)}>
      <div className="flex items-center gap-2 text-[13.5px] font-bold text-red">
        <span className="flex size-6 items-center justify-center rounded-full bg-red text-white">
          <TriangleAlert className="size-3.5" strokeWidth={2.4} />
        </span>
        {openOcc.length === 1 ? 'Aviso aberto neste local' : `${openOcc.length} avisos abertos neste local`}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {openOcc.map((o) => (
          <div key={o.id} className="flex items-center gap-2.5 rounded-[18px] bg-card/75 py-2 pr-3.5 pl-2">
            <span className="num inline-flex h-8 shrink-0 items-center rounded-full bg-card px-2.5 text-[12.5px] font-bold text-ink shadow-pill">{o.unitId}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold text-ink">{OCC_KIND[o.kind].label}</div>
              <div className="truncate text-[12px] font-medium text-ink-2">
                {o.source === 'qr' ? 'Pelo QR da porta' : 'Registro da equipe'}, {relDays(o.at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TodoCard({ job, flow, className }: { job: Job; flow: Flow; className?: string }) {
  return (
    <div className={cn('rounded-[28px] bg-card p-5 shadow-card', className)}>
      <div className="text-[13px] font-semibold text-ink-3">O que fazer</div>
      <div className="mt-1 text-[16.5px] leading-snug font-bold tracking-[-0.01em] text-ink">{job.note}</div>
      {flow.rental.access && (
        <div className="mt-3.5 flex items-start gap-2.5 rounded-[18px] bg-yellow-soft px-3.5 py-3 text-[14px] font-semibold text-yellow-ink">
          <KeyRound className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          <span>{flow.rental.access}</span>
        </div>
      )}
    </div>
  )
}

export function LastCard({ flow, className }: { flow: Flow; className?: string }) {
  const last = flow.last
  if (!last) return null
  const n = last.report.units.filter((u) => u.ok).length || last.job.units
  return (
    <div className={cn('rounded-[28px] bg-blue-soft p-5', className)}>
      <div className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
        <span className="flex size-6 items-center justify-center rounded-full bg-black text-white">
          <FileText className="size-3.5" strokeWidth={2.2} />
        </span>
        Última limpeza
      </div>
      <div className="mt-2.5 text-[16px] font-bold text-ink">{stamp(last.report.finishedAt)}</div>
      <div className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug font-medium text-ink-2">{last.report.summary}</div>
      <div className="mt-3 text-[13px] font-bold text-blue">
        {relDays(last.report.finishedAt)} · {TEAM[last.job.teamId].name} · {n} {n === 1 ? 'unidade' : 'unidades'}
      </div>
    </div>
  )
}

export function ItemsCard({ job, className }: { job: Job; className?: string }) {
  const rental = rentalOf(job)
  const items = jobItems(job)
  const units = job.type === 'Limpeza' || job.type === 'Manutenção' ? cleanUnits(rental) : []
  const [all, setAll] = React.useState(false)
  const shown = all ? units : units.slice(0, 11)
  return (
    <div className={cn('rounded-[28px] bg-card p-2 shadow-card', className)}>
      <div className="flex items-baseline justify-between px-3 pt-3 pb-1">
        <h3 className="text-[16px] font-bold tracking-[-0.02em] text-ink">{job.type === 'Montagem' ? 'Vai para o local' : job.type === 'Retirada' ? 'Volta para a base' : 'No local'}</h3>
        <span className="text-[12.5px] font-semibold text-ink-3">{rental.code}</span>
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={it.productId} className={cn('flex items-center gap-3 px-3 py-2.5', i > 0 && 'border-t border-line')}>
            <ProductThumb productId={it.productId} size={40} rounded="xl" />
            <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink">{PRODUCT[it.productId].short}</span>
            <span className="num text-[14.5px] font-bold text-ink">{it.qty.toLocaleString('pt-BR')}</span>
          </li>
        ))}
      </ul>
      {units.length > 0 && (
        <div className="mx-1 mt-1 mb-1 rounded-[20px] bg-surface p-3">
          <div className="text-[12.5px] font-semibold text-ink-3">Patrimônio com QR na porta</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shown.map((u) => (
              <span key={u.id} className="num inline-flex h-7 items-center rounded-full bg-card px-2.5 text-[12px] font-bold text-ink shadow-pill">
                {u.id}
              </span>
            ))}
            {units.length > 11 && (
              <button onClick={() => setAll((x) => !x)} className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-[12px] font-bold text-ink-2">
                {all ? 'Menos' : `+${units.length - 11}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ContactCard({ flow, className, desk }: { flow: Flow; className?: string; desk?: boolean }) {
  const { rental, b, zone, contacts, navApps, first } = flow
  return (
    <div className={cn('rounded-[28px] bg-card p-5 shadow-card', className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-[18px] font-bold text-white">{first[0]}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-bold text-ink">{rental.contact.name}</div>
          <div className="truncate text-[13.5px] font-medium text-ink-3">
            {rental.contact.role} · <span className="num">{rental.contact.phone}</span>
          </div>
        </div>
        {!desk &&
          contacts.map((c, i) => (
            <RoundBtn key={c.label} label={c.label} tone={i === 1 ? 'black' : 'muted'} size={46} onClick={c.onClick}>
              <c.icon className={cn('size-[18px]', i === 1 && 'text-brand')} strokeWidth={2} />
            </RoundBtn>
          ))}
      </div>
      <div className="mt-4 rounded-[20px] bg-surface p-3.5">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 size-[17px] shrink-0 text-ink" strokeWidth={2} />
          <div className="min-w-0 text-[14.5px] leading-snug">
            <div className="font-bold text-ink">{rental.address}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
              <span className="size-1.5 rounded-full" style={{ background: zone.hex }} />
              {b.name}, Brasília
            </div>
          </div>
        </div>
      </div>
      {desk && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {contacts.map((c) => (
            <button key={c.label} onClick={c.onClick} className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-muted px-3 text-[13.5px] font-semibold text-ink transition-[background,transform] hover:bg-muted-2 active:scale-[.97]">
              <c.icon className="size-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{c.label}</span>
            </button>
          ))}
        </div>
      )}
      <NavButtons apps={navApps} size={desk ? 'md' : 'lg'} className={desk ? 'mt-2' : 'mt-3'} />
    </div>
  )
}

/** Abrir o endereço no Waze ou no Google Maps (nova aba) */
export function NavButtons({ apps, className, size = 'lg' }: { apps: { label: string; href: string; icon: typeof MapPin }[]; className?: string; size?: 'md' | 'lg' }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {apps.map((a, i) => (
        <a
          key={a.label}
          href={a.href}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background,transform] active:scale-[.97]',
            size === 'lg' ? 'h-12 text-[15px]' : 'h-11 text-[13.5px]',
            i === 0 ? 'bg-black text-white hover:bg-black-2' : 'bg-muted text-ink hover:bg-muted-2',
          )}
        >
          <a.icon className={cn('size-4', i === 0 && 'text-brand')} strokeWidth={2.2} />
          {a.label}
          <ArrowUpRight className={cn('size-3.5', i === 0 ? 'text-white/50' : 'text-ink-3')} strokeWidth={2.2} />
        </a>
      ))}
    </div>
  )
}

export function Tracker({ stage, className }: { stage: number; className?: string }) {
  const steps = ['A caminho', 'Chegada', 'Registro']
  if (stage >= 3) return null
  return (
    <div className={cn('mb-3 flex gap-1.5', className)}>
      {steps.map((s, i) => (
        <span
          key={s}
          className={cn(
            'flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-[12.5px] font-semibold transition-colors duration-300',
            i < stage ? 'bg-black text-white' : i === stage ? 'bg-brand text-white' : 'bg-muted text-ink-3',
          )}
        >
          {i < stage && <Check className="size-3.5 text-brand" strokeWidth={3} />}
          {s}
        </span>
      ))}
    </div>
  )
}

