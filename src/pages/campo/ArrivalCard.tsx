// Cartão de chegada: o essencial ao chegar no local (sheet no celular, modal no computador).
import * as React from 'react'
import { Drawer } from 'vaul'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Clock, KeyRound, MapPin, MessageCircle, Phone, PlayCircle, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductThumb } from '@/components/ui'
import { CLIENT, TEAM, type Job } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { JOB_TYPE, OCC_KIND } from '@/lib/status'
import { useDemo } from '@/store'
import { notify } from './campoStore'
import { bairroOf, contactFirst, jobTodo, rentalOf } from './data'
import { Btn, EASE_OUT, Pressable, RoundBtn, usePhone } from './kit'

function useArrival(job: Job) {
  const rental = rentalOf(job)
  const client = CLIENT[rental.clientId]
  const occurrences = useDemo((s) => s.occurrences)
  const open = occurrences.filter((o) => o.rentalId === rental.id && o.status === 'aberta')
  const todo = jobTodo(
    job,
    open.map((o) => ({ unitId: o.unitId, label: OCC_KIND[o.kind].label })),
  )
  return { rental, client, open, todo }
}

type Data = ReturnType<typeof useArrival>

function Hero({ job, data, onClose, title }: { job: Job; data: Data; onClose: () => void; title: React.ReactNode }) {
  const { rental, client } = data
  const tp = JOB_TYPE[job.type]
  return (
    <div className="relative overflow-hidden rounded-[30px] bg-black px-5 pt-4 pb-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_85%_0%,rgba(238,106,28,.22),transparent_60%)]" />
      <div className="relative flex items-center justify-between">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-3 text-[12.5px] font-bold text-white">
          <MapPin className="size-3.5" strokeWidth={2.4} /> Cartão de chegada
        </span>
        <RoundBtn label="Fechar" tone="glass" size={40} onClick={onClose}>
          <X className="size-[18px]" strokeWidth={2.2} />
        </RoundBtn>
      </div>
      <div className="relative mt-4 flex items-center gap-4">
        <ProductThumb productId={job.products?.[0] ?? rental.items[0].productId} size={88} className="ring-4 ring-white/10" />
        <div className="min-w-0 flex-1">
          {title}
          <div className="mt-1 truncate text-[14px] font-medium text-white/60">{client.name}</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[12px] font-semibold">
              <tp.icon className="size-3" strokeWidth={2.4} />
              {job.type}
            </span>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[12px] font-semibold">
              <Clock className="size-3" strokeWidth={2.4} />
              <span className="num">{fmt.time(job.start)}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="relative mt-4 flex items-start gap-3 rounded-[22px] bg-white/[0.08] p-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <KeyRound className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="text-[12.5px] font-semibold text-white/55">Acesso ao local</div>
          <div className="mt-0.5 text-[15.5px] leading-snug font-bold">{rental.access ?? 'Sem orientação cadastrada. Procurar o responsável na chegada.'}</div>
        </div>
      </div>
    </div>
  )
}

function Alerts({ data }: { data: Data }) {
  if (!data.open.length) return null
  return (
    <section className="rounded-[26px] bg-red-soft p-4">
      <div className="flex items-center gap-2 text-[13.5px] font-bold text-red">
        <span className="flex size-7 items-center justify-center rounded-full bg-red text-white">
          <TriangleAlert className="size-3.5" strokeWidth={2.4} />
        </span>
        Atenção
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.open.map((o) => (
          <span key={o.id} className="inline-flex h-9 items-center gap-2 rounded-full bg-card/80 pr-3 pl-1">
            <span className="num inline-flex h-7 items-center rounded-full bg-red px-2.5 text-[12px] font-bold text-white">{o.unitId}</span>
            <span className="text-[13px] font-semibold text-ink">{OCC_KIND[o.kind].short}</span>
            <span className="text-[12px] font-bold text-red">{relDays(o.at)}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

function Todo({ data }: { data: Data }) {
  const [done, setDone] = React.useState<Record<string, boolean>>({})
  const n = data.todo.filter((t) => done[t]).length
  return (
    <section className="rounded-[26px] bg-card p-2 shadow-card">
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h3 className="text-[16px] font-bold tracking-[-0.02em] text-ink">Neste serviço</h3>
        <span className="num text-[13px] font-semibold text-ink-3">
          {n} de {data.todo.length}
        </span>
      </div>
      {data.todo.map((t) => {
        const on = !!done[t]
        return (
          <Pressable key={t} scale={0.985} onClick={() => setDone((s) => ({ ...s, [t]: !s[t] }))} className="flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left hover:bg-surface">
            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full transition-colors', on ? 'bg-brand text-white' : 'bg-muted text-transparent')}>
              <Check className="size-4" strokeWidth={3} />
            </span>
            <span className={cn('min-w-0 flex-1 text-[14.5px] font-semibold transition-colors', on ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>{t}</span>
          </Pressable>
        )
      })}
    </section>
  )
}

function Place({ job, data }: { job: Job; data: Data }) {
  const { rental } = data
  const team = TEAM[job.teamId]
  return (
    <section className="rounded-[26px] bg-card p-4 shadow-card">
      <h3 className="text-[16px] font-bold tracking-[-0.02em] text-ink">Local</h3>
      <div className="mt-1 text-[13px] font-medium text-ink-3">
        {rental.address} · {bairroOf(rental).name}
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {[
          { label: 'Locação', value: `${rental.code} · ${rental.kind === 'obra' ? 'Obra' : 'Evento'}` },
          { label: 'Equipe', value: `${team.name} · ${team.truck}` },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-3.5 py-2.5">
            <span className="text-[12.5px] font-semibold text-ink-3">{r.label}</span>
            <span className="truncate text-[13.5px] font-bold text-ink">{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Contact({ data }: { data: Data }) {
  const { rental } = data
  const first = contactFirst(rental)
  return (
    <section className="flex items-center gap-3 rounded-[26px] bg-card p-4 shadow-card">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-[18px] font-bold text-white">{first[0]}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15.5px] font-bold text-ink">{rental.contact.name}</div>
        <div className="truncate text-[13px] font-medium text-ink-3">
          {rental.contact.role} · <span className="num">{rental.contact.phone}</span>
        </div>
      </div>
      <RoundBtn label={`Ligar para ${first}`} tone="muted" size={46} onClick={() => notify({ kind: 'app', title: `Ligando para ${first}`, body: rental.contact.phone })}>
        <Phone className="size-[18px]" strokeWidth={2} />
      </RoundBtn>
      <RoundBtn label="WhatsApp" tone="black" size={46} onClick={() => notify({ kind: 'whatsapp', title: 'Abrindo conversa', body: `${rental.contact.name}, ${rental.contact.phone}` })}>
        <MessageCircle className="size-[18px] text-brand" strokeWidth={2} />
      </RoundBtn>
    </section>
  )
}

export function ArrivalCard({ job, open, onOpenChange, onStart, startLabel }: { job: Job; open: boolean; onOpenChange: (o: boolean) => void; onStart: () => void; startLabel: string }) {
  const { desktop, root } = usePhone()
  const data = useArrival(job)
  const close = () => onOpenChange(false)
  const name = data.rental.title
  const start = (
    <Btn tone="brand" className={cn('w-full', desktop ? 'h-12 text-[15px]' : 'h-[58px] text-[16.5px]')} onClick={onStart}>
      <PlayCircle className="size-[18px]" /> {startLabel}
    </Btn>
  )

  if (desktop)
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[3px]" />
              </Dialog.Overlay>
              <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-6">
                <Dialog.Content asChild forceMount aria-describedby={undefined}>
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className="pointer-events-auto flex max-h-full w-full max-w-[960px] flex-col overflow-hidden rounded-[34px] bg-surface shadow-float outline-none"
                  >
                    <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
                      <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="flex min-w-0 flex-col gap-3">
                          <Hero job={job} data={data} onClose={close} title={<Dialog.Title className="line-clamp-2 text-[26px] leading-[1.05] font-bold tracking-[-0.035em]">{name}</Dialog.Title>} />
                          <Alerts data={data} />
                          <Contact data={data} />
                        </div>
                        <div className="flex min-w-0 flex-col gap-3">
                          <Todo data={data} />
                          <Place job={job} data={data} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-t border-line bg-card px-4 py-3">
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-3">Confira antes de descarregar o caminhão</span>
                      <button onClick={close} className="inline-flex h-12 items-center rounded-full bg-muted px-5 text-[14.5px] font-semibold text-ink transition-colors hover:bg-muted-2">
                        Fechar
                      </button>
                      <div className="w-[260px]">{start}</div>
                    </div>
                  </motion.div>
                </Dialog.Content>
              </div>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    )

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} container={root} repositionInputs={false}>
      <Drawer.Portal container={root}>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/50" />
        <Drawer.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[94%] flex-col rounded-t-[32px] bg-surface outline-none">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pt-2 pb-3">
            <div className="relative">
              <div className="absolute top-1.5 left-1/2 z-10 h-[5px] w-10 -translate-x-1/2 rounded-full bg-white/25" />
              <Hero job={job} data={data} onClose={close} title={<Drawer.Title className="line-clamp-2 text-[24px] leading-[1.05] font-bold tracking-[-0.035em]">{name}</Drawer.Title>} />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Alerts data={data} />
              <Todo data={data} />
              <Contact data={data} />
              <Place job={job} data={data} />
            </div>
          </div>
          <div className="relative bg-surface px-4 pt-2" style={{ paddingBottom: 'calc(var(--sab) + 12px)' }}>
            <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-surface to-transparent" />
            {start}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
