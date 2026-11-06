import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Check, MapPin, Search, X } from 'lucide-react'
import { Badge, Button, IconButton, IconCircle, RentalAvatar, Segmented, TeamAvatar } from '@/components/ui'
import { BAIRRO } from '@/data/geo'
import { CLIENT, RENTAL, RENTALS, TEAM, cleanableQty, type JobType } from '@/data/mock'
import { JOB_TYPE, JOB_TYPES } from '@/lib/status'
import { cn } from '@/lib/utils'
import { dayLabel, defaultDur, hhmm, suggest, type AJob, type Suggestion } from './model'
import { ZoneChip } from './shared'

type Urgency = 'rotina' | 'semana' | 'urgente'

export interface NewJobDraft {
  rentalId: string
  type: JobType
  note: string
  dur: number
  units: number
}

const OPEN_RENTALS = RENTALS.filter((r) => r.status !== 'encerrada')

export function ScheduleDialog({
  open,
  onOpenChange,
  all,
  initialRental,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  all: AJob[]
  initialRental?: string | null
  onConfirm: (d: NewJobDraft, s: Suggestion) => void
}) {
  const [q, setQ] = React.useState('')
  const [rentalId, setRentalId] = React.useState<string | null>(null)
  const [type, setType] = React.useState<JobType>('Limpeza')
  const [note, setNote] = React.useState('')
  const [urgency, setUrgency] = React.useState<Urgency>('semana')
  const [sel, setSel] = React.useState<string | null>(null)
  const [focus, setFocus] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setQ('')
      setRentalId(initialRental && RENTAL[initialRental] ? initialRental : null)
      setType(initialRental && RENTAL[initialRental]?.status === 'montagem' ? 'Montagem' : 'Limpeza')
      setNote('')
      setUrgency('semana')
      setSel(null)
    }
  }, [open, initialRental])

  const rental = rentalId ? RENTAL[rentalId] : null
  const dur = rental ? defaultDur(type, rental.id) : 40
  const results = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = OPEN_RENTALS
    if (!t) return list.slice(0, 6)
    return list.filter((r) => `${r.title} ${CLIENT[r.clientId].name} ${BAIRRO[r.bairro].name} ${r.code}`.toLowerCase().includes(t)).slice(0, 7)
  }, [q])
  const sugs = React.useMemo(() => (rental ? suggest(all, rental.id, type, urgency, dur) : []), [all, rental, type, urgency, dur])

  React.useEffect(() => {
    setSel(sugs[0]?.key ?? null)
  }, [sugs])

  const chosen = sugs.find((s) => s.key === sel)
  const canConfirm = !!rental && !!chosen

  const pick = (id: string) => {
    setRentalId(id)
    if (RENTAL[id].status === 'montagem') setType('Montagem')
    else if (RENTAL[id].status === 'retirada') setType('Retirada')
    setFocus(false)
    setQ('')
  }

  const confirm = () => {
    if (!rental || !chosen) return
    const units = type === 'Limpeza' ? cleanableQty(rental) : type === 'Manutenção' ? 1 : rental.items.reduce((a, i) => a + i.qty, 0)
    onConfirm({ rentalId: rental.id, type, note: note.trim() || `${type} agendada pelo escritório`, dur, units }, chosen)
  }

  const input = 'h-11 w-full rounded-full bg-muted pr-4 pl-11 text-[14px] font-medium text-ink outline-none placeholder:text-ink-3 focus:bg-card focus:ring-2 focus:ring-black'
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-card shadow-float outline-none md:inset-0 md:m-auto md:h-fit md:max-h-[88dvh] md:max-w-[940px] md:rounded-[28px]"
              >
                <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3 md:px-7 md:pt-6">
                  <Dialog.Title className="text-[24px] leading-tight font-bold tracking-[-0.025em] text-ink">Novo serviço</Dialog.Title>
                  <Dialog.Close asChild>
                    <IconButton tone="muted" size={40} aria-label="Fechar">
                      <X size={17} strokeWidth={2} />
                    </IconButton>
                  </Dialog.Close>
                </div>

                <div className="scroll-thin grid min-h-0 flex-1 gap-3 overflow-y-auto px-3 pb-3 md:grid-cols-[360px_1fr] md:px-4">
                  {/* formulário */}
                  <div className="space-y-5 p-2 md:p-3">
                    <Field label="Locação">
                      {rental ? (
                        <div className="flex items-center gap-3 rounded-full bg-muted p-1.5 pr-3">
                          <RentalAvatar rental={rental} size={38} />
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="truncate text-[13.5px] font-bold text-ink">{rental.title}</div>
                            <div className="truncate text-[12px] text-ink-3">
                              {CLIENT[rental.clientId].name} · {BAIRRO[rental.bairro].name}
                            </div>
                          </div>
                          <button onClick={() => setRentalId(null)} className="rounded-full bg-card px-3 py-1.5 text-[12px] font-semibold text-ink shadow-pill hover:bg-surface">
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search size={16} strokeWidth={2} className="pointer-events-none absolute top-[14px] left-4 text-ink-3" />
                          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} placeholder="Buscar obra, evento ou cliente" className={input} />
                          {(focus || q) && (
                            <div className="mt-2 overflow-hidden rounded-[20px] bg-card p-1.5 shadow-float">
                              {results.length === 0 && <div className="px-3 py-3 text-[13px] text-ink-3">Nenhuma locação com esse nome.</div>}
                              {results.map((r) => (
                                <button key={r.id} onClick={() => pick(r.id)} className="flex w-full items-center gap-2.5 rounded-full px-2 py-1.5 text-left hover:bg-surface">
                                  <RentalAvatar rental={r} size={32} />
                                  <span className="min-w-0 flex-1 leading-tight">
                                    <span className="block truncate text-[13px] font-bold text-ink">{r.title}</span>
                                    <span className="block truncate text-[11.5px] text-ink-3">
                                      {CLIENT[r.clientId].name} · {BAIRRO[r.bairro].name}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {rental && (
                        <div className="mt-2 flex items-start gap-2 pl-1 text-[12px] font-medium text-ink-3">
                          <MapPin size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
                          <span>{rental.address}</span>
                        </div>
                      )}
                    </Field>

                    <Field label="Tipo de serviço">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {JOB_TYPES.map((t) => {
                          const Icon = JOB_TYPE[t].icon
                          return (
                            <button
                              key={t}
                              onClick={() => setType(t)}
                              className={cn('inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors', type === t ? 'bg-black text-white' : 'bg-muted text-ink-2 hover:bg-muted-2')}
                            >
                              <Icon size={14} strokeWidth={2.2} />
                              {t}
                            </button>
                          )
                        })}
                      </div>
                      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalhe rápido (opcional)" className={cn(input, 'pl-4')} />
                      <div className="mt-1.5 pl-1 text-[12px] text-ink-3">
                        Duração estimada: {dur} min
                        {type === 'Montagem' || type === 'Retirada' ? ' · precisa do caminhão munck' : type === 'Limpeza' ? ' · caminhão de sucção' : ''}
                      </div>
                    </Field>

                    <Field label="Urgência">
                      <Segmented<Urgency>
                        value={urgency}
                        onChange={setUrgency}
                        size="md"
                        className="w-full [&>button]:flex-1 [&>button]:whitespace-nowrap [&>button]:px-2"
                        options={[
                          { value: 'rotina', label: 'Rotina' },
                          { value: 'semana', label: 'Esta semana' },
                          { value: 'urgente', label: 'Urgente' },
                        ]}
                      />
                    </Field>
                  </div>

                  {/* sugestões */}
                  <div className="rounded-[24px] bg-surface p-4 md:p-5">
                    <h3 className="mb-3 text-[16px] font-bold tracking-[-0.01em] text-ink">Horários sugeridos</h3>
                    {!rental ? (
                      <div className="flex flex-col items-center rounded-[20px] bg-card px-5 py-10 text-center shadow-card">
                        <IconCircle size={48} className="mb-3">
                          <MapPin size={20} strokeWidth={1.9} />
                        </IconCircle>
                        <div className="text-[14px] font-bold text-ink">Escolha uma locação</div>
                        <p className="mt-1 max-w-[260px] text-[12.5px] text-ink-3">Os horários aparecem aqui, pela equipe que já está na região naquele dia.</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {sugs.map((s, i) => (
                          <motion.li key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                            <SuggestionCard s={s} best={i === 0} selected={sel === s.key} onSelect={() => setSel(s.key)} />
                          </motion.li>
                        ))}
                        {sugs.length === 0 && <li className="text-[13px] text-ink-3">Nenhum horário livre nesse período. Tente mudar a urgência.</li>}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-7 md:pb-5">
                  <div className="hidden min-w-0 truncate text-[12.5px] font-medium text-ink-3 sm:block">
                    {chosen && rental ? (
                      <>
                        {type} em {rental.title} · {dayLabel(chosen.off)} às <span className="num">{hhmm(chosen.startMin)}</span> com {TEAM[chosen.teamId].name}
                      </>
                    ) : (
                      'Selecione a locação e um horário.'
                    )}
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button variant="primary" size="lg" disabled={!canConfirm} onClick={confirm}>
                      Agendar serviço
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 pl-1 text-[12.5px] font-semibold text-ink-3">{label}</div>
      {children}
    </div>
  )
}

function SuggestionCard({ s, best, selected, onSelect }: { s: Suggestion; best: boolean; selected: boolean; onSelect: () => void }) {
  const tone = s.kind === 'fora' ? 'late' : s.kind === 'vizinha' ? 'warn' : 'ok'
  return (
    <button onClick={onSelect} className={cn('w-full rounded-[20px] bg-card p-3.5 text-left shadow-card transition-[box-shadow] hover:shadow-lift', selected && 'ring-2 ring-black')}>
      <div className="flex items-start gap-3">
        <IconCircle size={40} tone={selected ? 'black' : 'muted'}>
          {selected ? <Check size={17} strokeWidth={2.6} /> : <CalendarDays size={17} strokeWidth={1.9} />}
        </IconCircle>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] leading-none font-bold text-ink">{dayLabel(s.off)}</span>
            <span className="text-[13px] font-bold text-ink-2 num">{hhmm(s.startMin)}</span>
            {best && <Badge tone="brand">Melhor opção</Badge>}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <TeamAvatar teamId={s.teamId} size={20} />
            {s.title}
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{s.why}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={tone}>{{ local: 'Mesmo local', regiao: 'Mesma região', vizinha: 'Região vizinha', fora: 'Fora da região' }[s.kind]}</Badge>
            <ZoneChip id={BAIRRO[s.bairro].zone} />
          </div>
        </div>
      </div>
    </button>
  )
}
