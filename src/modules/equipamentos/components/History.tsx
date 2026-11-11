import * as React from 'react'
import { Link } from 'react-router-dom'
import { History as HistoryIcon, Sparkles, Repeat, TriangleAlert, Truck, Undo2, type LucideIcon } from 'lucide-react'
import { EmptyState, Money, PhotoThumb, PhotoViewer, cn, type PhotoItem } from '@/ui'

export interface HistoryItem {
  id: string
  at: string
  icon: LucideIcon
  tone: 'neutral' | 'danger' | 'ok' | 'warn' | 'info'
  title: string
  /** texto simples, depois dele vêm os links */
  meta?: string
  rentalId?: string
  rentalCode?: string
  clientId?: string
  clientName?: string
  photo?: { src: string; alt: string }
  amount?: number
}

export const HISTORY_ICON = { locacao: Truck, retorno: Undo2, servico: Sparkles, avaria: TriangleAlert, situacao: Repeat }

const circle: Record<HistoryItem['tone'], string> = {
  neutral: 'bg-sunken text-fg-2',
  danger: 'bg-danger-soft text-danger-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  info: 'bg-info-soft text-info-ink',
}
const link = 'rounded-tip font-semibold text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Linha do tempo da unidade: do mais recente ao mais antigo, com links para locação e cliente e fotos que abrem em tela cheia. */
export function History({ items, dateTime }: { items: HistoryItem[]; dateTime: (iso: string) => string }) {
  const photos: PhotoItem[] = items.filter((i) => i.photo).map((i) => ({ id: i.id, src: i.photo!.src, alt: i.photo!.alt }))
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const back = React.useRef<HTMLElement | null>(null)

  if (items.length === 0) return <EmptyState icon={HistoryIcon} title="O histórico desta unidade aparece aqui" />

  return (
    <>
      <ol className="m-0 list-none p-0">
        {items.map((e, i) => {
          const Icon = e.icon
          const last = i === items.length - 1
          return (
            <li key={e.id} className={cn('relative pl-12', !last && 'pb-5')}>
              {!last ? <span aria-hidden className="absolute top-9 bottom-0 left-[17px] w-px bg-hairline" /> : null}
              <span aria-hidden className={cn('absolute top-0 left-0 grid size-9 place-items-center rounded-pill', circle[e.tone])}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <div className="min-h-9">
                <p className="text-body font-semibold">{e.title}</p>
                <p className="text-caption text-fg-3">
                  {dateTime(e.at)}
                  {e.meta ? ` · ${e.meta}` : ''}
                  {e.rentalId ? (
                    <>
                      {' · '}
                      <Link to={`/locacoes/${e.rentalId}`} className={link}>
                        {e.rentalCode}
                      </Link>
                    </>
                  ) : null}
                  {e.clientId ? (
                    <>
                      {' · '}
                      <Link to={`/clientes/${e.clientId}`} className={link}>
                        {e.clientName}
                      </Link>
                    </>
                  ) : null}
                </p>
                {e.photo || e.amount != null ? (
                  <div className="mt-2 flex items-center gap-3">
                    {e.photo ? (
                      <PhotoThumb
                        src={e.photo.src}
                        alt={e.photo.alt}
                        size={64}
                        onClick={(ev) => {
                          back.current = ev.currentTarget
                          setIndex(photos.findIndex((p) => p.id === e.id))
                          setOpen(true)
                        }}
                      />
                    ) : null}
                    {e.amount != null ? <Money value={e.amount} className="text-body font-semibold text-danger-ink" /> : null}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
      <PhotoViewer photos={photos} index={index} open={open} onIndexChange={setIndex} onOpenChange={setOpen} returnFocusRef={back} />
    </>
  )
}
