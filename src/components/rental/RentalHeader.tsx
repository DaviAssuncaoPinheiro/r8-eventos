import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, CalendarPlus, ChevronLeft, KeyRound, RefreshCw, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, RentalAvatar, TeamAvatar } from '@/components/ui'
import { CLIENT, TEAM, itemsLabel, type Rental } from '@/data/mock'
import { fmt, iso } from '@/data/time'
import { RENTAL_STATUS } from '@/lib/status'
import { useDemo } from '@/store'
import { endAlert, firstWord, type RentalModel } from './model'
import { period, valueLabel } from './RentalViews'

export function RentalHeader({ rental, model }: { rental: Rental; model: RentalModel }) {
  const nav = useNavigate()
  const addAvisos = useDemo((s) => s.addAvisos)
  const client = CLIENT[rental.clientId]
  const st = RENTAL_STATUS[rental.status]
  const live = model.live
  const alert = endAlert(rental)
  const openOcc = model.occurrences.filter((o) => o.status === 'aberta').length
  const closed = rental.status === 'encerrada'

  const renew = () => {
    addAvisos([
      {
        id: `renov-${rental.id}-${Date.now()}`,
        rentalId: rental.id,
        kind: 'renovacao',
        title: rental.kind === 'obra' ? 'Renovação por mais 30 dias' : 'Nova data do evento',
        dueDate: rental.end,
        sendDate: iso(0, '10:40'),
        status: 'enviado',
        origin: 'Enviado pela ficha da locação',
      },
    ])
    toast.success('Proposta de renovação enviada', {
      description: `WhatsApp para ${firstWord(rental.contact.name)} · ${rental.contact.phone}. A resposta aparece em Avisos.`,
      action: { label: 'Ver avisos', onClick: () => nav('/avisos') },
    })
  }

  const chips = [rental.kind === 'obra' ? 'Obra' : 'Evento', itemsLabel(rental.items, 4), period(rental), valueLabel(rental)]

  const actions = (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {live ? (
        <Button variant="primary" onClick={() => nav(`/campo/servico/${live.id}`)} className="col-span-2 h-11 sm:h-10">
          <ArrowUpRight className="size-4" strokeWidth={2.2} /> Acompanhar no app
        </Button>
      ) : (
        <Button variant="primary" onClick={() => nav(`/agenda?novo=1&locacao=${rental.id}`)} className="col-span-2 h-11 sm:h-10" disabled={closed}>
          <CalendarPlus className="size-4" strokeWidth={2} /> Novo serviço
        </Button>
      )}
      {live && (
        <Button variant="outline" onClick={() => nav(`/agenda?novo=1&locacao=${rental.id}`)} className="h-11 sm:h-10">
          <CalendarPlus className="size-4" strokeWidth={2} /> Novo serviço
        </Button>
      )}
      <Button variant="outline" onClick={renew} className="h-11 sm:h-10" disabled={closed}>
        <RefreshCw className="size-4" strokeWidth={2} /> Renovar
      </Button>
    </div>
  )

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 text-[13px] font-semibold text-ink-3">
          <Link
            to="/locacoes"
            aria-label="Voltar para locações"
            className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-muted text-ink transition-[background,transform] hover:bg-muted-2 active:scale-95"
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </Link>
          <Link to="/locacoes" className="hover:text-ink">
            Locações
          </Link>
          <span className="text-ink-4">/</span>
          <span className="num text-ink">{rental.code}</span>
        </div>
        <div className="hidden shrink-0 lg:block">{actions}</div>
      </div>

      <div className="mt-4 flex flex-col gap-5 lg:mt-2">
        <div className="flex min-w-0 items-center gap-4 md:gap-5">
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="relative shrink-0">
            <RentalAvatar rental={rental} size={112} className="max-md:size-[84px]!" />
            {live?.status === 'em-andamento' && (
              <span className="absolute right-1 bottom-1.5 flex size-5 items-center justify-center rounded-full bg-brand ring-[3px] ring-card md:right-2 md:bottom-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" />
              </span>
            )}
          </motion.div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">{rental.title}</h1>
              {live?.status === 'em-andamento' ? (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand pr-3 pl-1 text-[12px] font-semibold text-white">
                  <TeamAvatar teamId={live.teamId} size={20} />
                  {live.type} em andamento
                </span>
              ) : live?.status === 'a-caminho' ? (
                <Badge tone="info" dot>
                  {TEAM[live.teamId].short} a caminho
                </Badge>
              ) : (
                <Badge tone={st.tone} dot>
                  {st.label}
                </Badge>
              )}
            </div>
            <div className="mt-1 text-[14px] font-semibold text-ink-2">{client.name}</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className="num inline-flex h-7 items-center rounded-full bg-muted px-3 text-[12.5px] font-semibold text-ink-2">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-medium text-ink-3">
              {live ? (
                <span>
                  {TEAM[live.teamId].name} · {live.note}
                </span>
              ) : model.next ? (
                <span>
                  Próximo: <span className="text-ink-2">{model.next.type.toLowerCase()}</span> {fmt.weekday(model.next.start)}, {fmt.short(model.next.start)} às {fmt.time(model.next.start)}
                </span>
              ) : (
                <span>Nada agendado</span>
              )}
              {rental.eventDays && (
                <span>
                  Evento de {fmt.short(rental.eventDays[0])} a {fmt.short(rental.eventDays[1])}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:hidden">{actions}</div>
      </div>

      {(rental.access || openOcc > 0 || alert) && (
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {(openOcc > 0 || alert) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              role="alert"
              className={`flex items-center gap-3 rounded-[18px] px-3.5 py-3 ${openOcc ? 'bg-red-soft' : 'bg-yellow-soft'} ${!rental.access ? 'md:col-span-2' : ''}`}
            >
              <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white ${openOcc ? 'bg-red' : 'bg-yellow'}`}>
                <TriangleAlert className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className={`text-[12px] font-semibold ${openOcc ? 'text-red' : 'text-yellow-ink'}`}>{openOcc ? 'Ocorrência aberta' : 'Prazo'}</div>
                <div className="text-[13.5px] leading-snug font-semibold text-ink">
                  {openOcc ? `${openOcc} ${openOcc === 1 ? 'aviso aguardando solução' : 'avisos aguardando solução'}` : alert?.label}
                  {openOcc > 0 && alert ? `. ${alert.label}` : ''}
                </div>
              </div>
            </motion.div>
          )}
          {rental.access && (
            <div className={`flex items-center gap-3 rounded-[18px] bg-surface px-3.5 py-3 ${!(openOcc > 0 || alert) ? 'md:col-span-2' : ''}`}>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill">
                <KeyRound className="size-4" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-ink-3">Acesso ao local</div>
                <div className="text-[13.5px] leading-snug font-semibold text-ink">{rental.access}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
