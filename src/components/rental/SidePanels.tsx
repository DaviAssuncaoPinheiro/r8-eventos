import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowUpRight, CalendarPlus, Check, ChevronRight, Copy, Ellipsis, FileText, MapPin, MessageCircle, Phone, QrCode, Send, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, IconButton, IconCircle, RentalAvatar, ViewAll, type Tone } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { CLIENT, COMPANY, rentalsOfClient, type Aviso, type Occurrence, type Rental } from '@/data/mock'
import { daysFromToday, fmt } from '@/data/time'
import { stamp } from '@/lib/history'
import { AVISO_KIND, AVISO_STATUS, OCC_KIND, RENTAL_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { copyText, firstWord, reportUrl, type RentalModel } from './model'

/* ───────────── Região ───────────── */

export function ZoneChip({ bairroId, className }: { bairroId: string; className?: string }) {
  const b = BAIRRO[bairroId]
  if (!b) return null
  const z = ZONE[b.zone]
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full bg-card px-2.5 text-[11.5px] font-semibold whitespace-nowrap text-ink-2 shadow-pill', className)}>
      <span className="size-1.5 rounded-full" style={{ background: z.hex }} />
      {z.name}
    </span>
  )
}

function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-line px-5 pt-4 pb-4', className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

const initials = (name: string) =>
  name
    .replace(/^(Eng\.|Pe\.|Pr\.|Mestre|Sr\.|Sra\.)\s+/, '')
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/* ───────────── Contato no local (cartão de perfil) ───────────── */

export function ContactCard({ rental }: { rental: Rental }) {
  const c = rental.contact
  const client = CLIENT[rental.clientId]
  const b = BAIRRO[rental.bairro]
  const fn = firstWord(c.name)
  const copyAddress = async () => {
    const ok = await copyText(`${rental.address}, ${b.name}, Brasília, DF`)
    toast(ok ? 'Endereço copiado' : 'Não foi possível copiar', { description: `${rental.address}, ${b.name}` })
  }
  return (
    <div className="m-2 rounded-[22px] bg-surface px-5 pt-6 pb-5 text-center">
      <span className="relative mx-auto inline-flex size-[72px] items-center justify-center rounded-full bg-brand text-[24px] font-bold tracking-[-0.02em] text-white">
        {initials(c.name) || <UserRound className="size-7" />}
        <span className="absolute right-0.5 bottom-0.5 size-3.5 rounded-full bg-green ring-[3px] ring-surface" />
      </span>
      <div className="mt-3 text-[16px] font-bold tracking-[-0.01em] text-ink">{c.name}</div>
      <div className="mt-0.5 text-[13px] font-medium text-ink-3">
        {c.role} · <span className="num">{c.phone}</span>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <IconButton size={44} aria-label="Ligar" onClick={() => toast(`Ligando para ${fn}`, { description: c.phone })}>
          <Phone className="size-[17px]" strokeWidth={1.9} />
        </IconButton>
        <IconButton size={44} aria-label="WhatsApp" onClick={() => toast(`Conversa com ${fn} no WhatsApp`, { description: `Sobre ${rental.title}` })}>
          <MessageCircle className="size-[17px]" strokeWidth={1.9} />
        </IconButton>
        <IconButton size={44} aria-label="Copiar endereço" onClick={copyAddress}>
          <Ellipsis className="size-[17px]" strokeWidth={1.9} />
        </IconButton>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-[16px] bg-card px-3.5 py-3 text-left">
        <MapPin className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.9} />
        <div className="min-w-0 text-[13px] leading-snug font-medium">
          <div className="text-ink">{rental.address}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-ink-2">{b?.name}</span>
            <ZoneChip bairroId={rental.bairro} />
          </div>
        </div>
      </div>
      <div className="mt-3 text-left text-[12.5px] font-medium text-ink-3">
        Cliente: <span className="text-ink-2">{client.name}</span> · <span className="num">{client.cnpj}</span>
      </div>
    </div>
  )
}

/* ───────────── Relatório do cliente (cartão preto com QR) ───────────── */

export function ReportCard({ rental, model, className }: { rental: Rental; model: RentalModel; className?: string }) {
  const url = reportUrl(rental.id)
  const cleanings = model.history.filter((h) => h.job.type === 'Limpeza').length
  const fn = firstWord(rental.contact.name)
  const copy = async () => {
    const ok = await copyText(url)
    if (ok) toast.success('Link copiado', { description: 'Cole no WhatsApp ou no e-mail do cliente.' })
    else toast('Copie o link', { description: url })
  }
  const send = () =>
    toast.success(`Relatório enviado para ${fn}`, {
      description: `Link pelo WhatsApp · ${rental.contact.phone}`,
    })

  return (
    <section className={cn('relative overflow-hidden rounded-[24px] bg-black p-5 text-white shadow-card', className)}>
      <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-brand/10" />
      <span aria-hidden className="pointer-events-none absolute -top-6 -right-6 size-20 rounded-full bg-brand/15" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <FileText className="size-[18px]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[17px] leading-tight font-bold tracking-[-0.02em]">Relatório do cliente</h3>
            <p className="mt-0.5 text-[12.5px] font-medium text-white/60">Limpezas, horários, fotos e assinaturas</p>
          </div>
        </div>
        <Link
          to={`/relatorio/${rental.id}`}
          target="_blank"
          aria-label="Abrir relatório"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-ink transition-[background,transform] hover:bg-surface active:scale-[.97]"
        >
          <ArrowUpRight className="size-3.5" strokeWidth={2.2} /> Abrir
        </Link>
      </div>

      <div className="relative mt-5 flex items-center gap-4">
        <div className="shrink-0 rounded-[18px] bg-white p-2.5">
          <QRCodeSVG value={url} size={96} level="M" fgColor="#111214" bgColor="#ffffff" />
        </div>
        <div className="min-w-0">
          <div className="text-[19px] leading-tight font-bold tracking-[-0.02em]">{rental.title}</div>
          <div className="mt-0.5 truncate text-[12.5px] font-medium text-white/60">
            {COMPANY.name} · {rental.code}
          </div>
          <span className="num mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12px] font-semibold">
            <Check className="size-3.5 text-brand" strokeWidth={2.6} />
            {cleanings} {cleanings === 1 ? 'limpeza registrada' : 'limpezas registradas'}
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={copy} className="h-11 min-w-0 bg-white/10 px-3 text-white shadow-none hover:bg-white/15">
          <Copy className="size-4 shrink-0" strokeWidth={2} /> <span className="truncate">Copiar link</span>
        </Button>
        <Button variant="brand" onClick={send} className="h-11 min-w-0 px-3">
          <Send className="size-4 shrink-0" strokeWidth={2} /> <span className="truncate">Enviar a {fn}</span>
        </Button>
      </div>
    </section>
  )
}

/* ───────────── Ocorrências ───────────── */

export function OccurrencesPanel({ rental, occurrences }: { rental: Rental; occurrences: Occurrence[] }) {
  const nav = useNavigate()
  const setStatus = useDemo((s) => s.setOccurrenceStatus)
  return (
    <Section title="Ocorrências" action={occurrences.some((o) => o.status === 'aberta') ? <span className="text-[12px] font-semibold text-red">{occurrences.filter((o) => o.status === 'aberta').length} abertas</span> : undefined}>
      {occurrences.length === 0 ? (
        <div className="py-3 text-[13px] font-medium text-ink-3">Nenhum aviso pelo QR ou pela equipe.</div>
      ) : (
        <ul className="flex flex-col">
          {occurrences.map((o, i) => {
            const open = o.status === 'aberta'
            return (
              <motion.li
                key={o.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className={cn('flex items-start gap-3 py-2.5', i > 0 && 'border-t border-line')}
              >
                <IconCircle size={36} tone={open ? 'red' : 'muted'}>
                  {o.source === 'qr' ? <QrCode className="size-4" strokeWidth={1.9} /> : <UserRound className="size-4" strokeWidth={1.9} />}
                </IconCircle>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13.5px] leading-snug font-bold text-ink">{OCC_KIND[o.kind].label}</span>
                    <span className={cn('inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-[12px] font-semibold', open ? 'text-red' : 'text-ink-2')}>
                      <span className={cn('size-1.5 rounded-full', open ? 'bg-red' : 'bg-green')} />
                      {open ? 'Aberta' : 'Resolvida'}
                    </span>
                  </div>
                  <div className="num mt-0.5 text-[12px] font-medium text-ink-3">
                    <Link to={`/u/${o.unitId}`} target="_blank" className="font-semibold text-ink-2 hover:underline">
                      {o.unitId}
                    </Link>{' '}
                    · {o.source === 'qr' ? 'pelo QR' : 'pela equipe'} · {stamp(o.at)}
                  </div>
                  {o.note && <div className="mt-2 rounded-[14px] rounded-tl-[5px] bg-blue-soft px-3 py-2 text-[12.5px] leading-snug font-medium text-ink-2">{o.note}</div>}
                  {open && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button size="xs" variant="subtle" onClick={() => nav(`/agenda?novo=1&locacao=${rental.id}`)}>
                        <CalendarPlus className="size-3" strokeWidth={2.2} /> Agendar visita
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setStatus(o.id, 'resolvida')
                          toast.success(`${o.unitId} marcada como resolvida`)
                        }}
                      >
                        <Check className="size-3" strokeWidth={2.6} /> Resolvida
                      </Button>
                    </div>
                  )}
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

/* ───────────── Avisos ao cliente ───────────── */

const DOT: Partial<Record<Tone, string>> = {
  neutral: 'bg-ink-4',
  info: 'bg-blue',
  violet: 'bg-violet',
  ok: 'bg-green',
  dark: 'bg-black',
  late: 'bg-red',
  warn: 'bg-yellow',
  brand: 'bg-brand',
}

export function AvisosPanel({ avisos }: { avisos: Aviso[] }) {
  const nav = useNavigate()
  return (
    <Section title="Avisos ao cliente" action={<ViewAll onClick={() => nav('/avisos')} />}>
      {avisos.length === 0 ? (
        <div className="py-3 text-[13px] font-medium text-ink-3">Nenhum aviso programado.</div>
      ) : (
        <ul className="flex flex-col">
          {avisos.slice(0, 4).map((a, i) => {
            const st = AVISO_STATUS[a.status]
            const n = daysFromToday(a.dueDate)
            return (
              <li key={a.id} className={cn('py-2.5', i > 0 && 'border-t border-line')}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13.5px] leading-snug font-bold text-ink">{a.title}</span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-[12px] font-semibold text-ink-2">
                    <span className={cn('size-1.5 rounded-full', DOT[st.tone] ?? 'bg-ink-4')} />
                    {st.label}
                  </span>
                </div>
                <div className="num mt-0.5 text-[12px] font-medium text-ink-3">
                  {AVISO_KIND[a.kind].label} · {n === 0 ? 'hoje' : n === 1 ? 'amanhã' : n > 0 ? `em ${n} dias` : `há ${-n} dias`} · {fmt.short(a.dueDate)}
                </div>
                {a.reply && <div className="mt-2 rounded-[14px] rounded-tl-[5px] bg-blue-soft px-3 py-2 text-[12.5px] leading-snug font-medium text-ink-2">{a.reply}</div>}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

/* ───────────── Outras locações do cliente ───────────── */

export function ClientRentalsPanel({ rental }: { rental: Rental }) {
  const others = rentalsOfClient(rental.clientId).filter((r) => r.id !== rental.id)
  if (!others.length) return null
  return (
    <Section title={`Outras locações de ${CLIENT[rental.clientId].name}`}>
      <div className="-mx-2 flex flex-col">
        {others.map((r) => (
          <Link key={r.id} to={`/locacoes/${r.id}`} className="group flex items-center gap-3 rounded-[16px] px-2 py-2 transition-colors hover:bg-surface">
            <RentalAvatar rental={r} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-bold text-ink">{r.title}</span>
              <span className="block truncate text-[12px] font-medium text-ink-3">
                {BAIRRO[r.bairro].name} · {RENTAL_STATUS[r.status].label}
              </span>
            </span>
            <ChevronRight className="size-4 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-2" />
          </Link>
        ))}
      </div>
    </Section>
  )
}

/** Coluna direita inteira num cartão branco */
export function SideColumn({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Card className={cn('overflow-hidden pb-1', className)}>{children}</Card>
}
