import { CircleCheck, Clock, MapPin, MessageCircle, Navigation, Phone, Play } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { SERVICE_ICON, SERVICE_STATUS } from '@/app/status'
import { formatPhone } from '@/lib/format'
import { getService, setServiceStatus, startService, useMutation, useQuery } from '@/services'
import { Badge, Banner, Button, EmptyState, StatusDot } from '@/ui'
import { FieldActionBar } from '@/ui/FieldAction'
import { notify } from '@/ui/Toast'
import { Block, CampoScreen, LoadFailed } from './components/Screen'
import { LinkButton } from './components/LinkButton'
import { fmtDuration, fmtTime, mapsUrl, useBack, useServiceTitle } from './lib'
import { useCampo } from './store'

const digits = (s: string) => s.replace(/\D/g, '')

export default function Servico() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack('/campo/servicos')
  const title = useServiceTitle()
  const q = useQuery(() => getService(id), [id])
  const queued = useCampo((s) => s.queue.some((i) => i.kind === 'complete' && i.serviceId === id))
  const onWay = useMutation(setServiceStatus)
  const start = useMutation(startService)
  const s = q.data
  const status = s ? (queued ? 'concluido' : s.status) : 'agendado'

  const act = async (kind: 'caminho' | 'iniciar') => {
    if (!s) return
    try {
      if (kind === 'caminho') {
        await onWay.run(s.id, 'a_caminho')
        notify.success('Equipe a caminho')
      } else {
        await start.run(s.id)
        navigate(`/campo/servico/${s.id}/registro`)
      }
    } catch {
      notify.error(kind === 'caminho' ? 'Não foi possível avisar. Tente de novo.' : 'Não foi possível iniciar. Tente de novo.')
    }
  }

  let bar: React.ReactNode = null
  if (s && status !== 'concluido' && status !== 'cancelado') {
    bar =
      status === 'a_caminho' ? (
        <FieldActionBar>
          <Button variant="primary" size="field" block icon={Play} loading={start.loading} onClick={() => void act('iniciar')}>
            Cheguei, iniciar
          </Button>
        </FieldActionBar>
      ) : status === 'em_andamento' ? (
        <FieldActionBar>
          <Button variant="primary" size="field" block icon={Play} onClick={() => navigate(`/campo/servico/${s.id}/registro`)}>
            Continuar registro
          </Button>
        </FieldActionBar>
      ) : (
        <FieldActionBar>
          <Button variant="primary" size="field" block icon={Navigation} loading={onWay.loading} onClick={() => void act('caminho')}>
            Estou a caminho
          </Button>
        </FieldActionBar>
      )
  }

  const Icon = s ? SERVICE_ICON[s.type] : Clock
  const phone = s ? digits(s.contact.phone) : ''
  const wa = phone.length <= 11 ? `55${phone}` : phone
  const note = s ? [s.note, s.rental.notes].filter(Boolean).join(' ') : ''

  return (
    <CampoScreen title={s ? s.typeLabel : 'Serviço'} onBack={back} actionBar={bar} nav={!bar}>
      {q.initialLoading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span aria-hidden className="ds-skeleton block h-56 w-full rounded-card" />
          <span aria-hidden className="ds-skeleton block h-40 w-full rounded-card" />
        </div>
      ) : q.error && !s ? (
        q.error.message.includes('não encontrado') ? (
          <div className="rounded-card bg-raised">
            <EmptyState icon={Clock} title="Serviço não encontrado" action={<Button size="md" variant="primary" className="min-h-12" onClick={() => navigate('/campo/servicos')}>Ver serviços</Button>} />
          </div>
        ) : (
          <LoadFailed onRetry={() => void q.refetch()} />
        )
      ) : s ? (
        <div className="flex flex-col gap-3">
          <Block aria-label="Serviço">
            <div className="flex items-start gap-3">
              <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-card bg-accent-soft text-accent-ink">
                <Icon size={28} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-title-field">{title(s)}</h2>
                <div className="mt-1">
                  <StatusDot tone={SERVICE_STATUS[status].tone} className="text-body-lg">
                    {SERVICE_STATUS[status].label}
                  </StatusDot>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="neutral" icon={Clock}>
                {fmtTime(s.start)}, {fmtDuration(s.durationMin)}
              </Badge>
              {s.extra ? <Badge tone="warn">Extra</Badge> : null}
              <Badge tone="neutral">{s.rentalCode}</Badge>
            </div>
            <p className="mt-4 text-title-sub">{s.clientName}</p>
            <div className="mt-1 flex items-start gap-3">
              <p className="flex min-w-0 flex-1 items-start gap-1.5 text-body-lg text-fg-2">
                <MapPin size={18} strokeWidth={2} aria-hidden className="mt-[3px] shrink-0" />
                <span>
                  {s.address}, {s.bairroName}
                </span>
              </p>
              <a
                href={mapsUrl(s)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir rota no mapa"
                className="inline-flex size-12 shrink-0 items-center justify-center rounded-pill bg-accent text-on-accent transition-transform duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Navigation size={22} strokeWidth={2} aria-hidden />
              </a>
            </div>
          </Block>

          {note ? <Banner tone="warn" title="Acesso:">{note}</Banner> : null}

          <Block aria-label="Contato">
            <h2 className="text-title-sub">{s.contact.name}</h2>
            <p className="text-body-lg text-fg-2">
              {s.contact.role}, {formatPhone(s.contact.phone)}
            </p>
            <div className="mt-4 flex gap-2.5">
              <LinkButton href={`tel:+${wa}`} icon={Phone}>
                Ligar
              </LinkButton>
              <LinkButton href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" icon={MessageCircle}>
                WhatsApp
              </LinkButton>
            </div>
          </Block>

          <Block aria-label="Unidades">
            <h2 className="flex items-center gap-2 text-title-sub">
              Unidades <Badge tone="accent">{s.unitCodes.length}</Badge>
            </h2>
            <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
              {s.unitCodes.map((c) => (
                <li key={c} className="tnum inline-flex h-9 items-center rounded-pill bg-sunken px-3.5 text-body font-semibold">
                  {c}
                </li>
              ))}
            </ul>
          </Block>

          {status === 'concluido' ? (
            <Banner tone="ok" title="Serviço concluído.">
              {queued ? 'Aguardando sinal para enviar.' : null}
            </Banner>
          ) : null}
          {status === 'concluido' ? (
            <Button size="field" block variant="secondary" icon={CircleCheck} onClick={() => navigate('/campo')}>
              Voltar para hoje
            </Button>
          ) : null}
        </div>
      ) : null}
    </CampoScreen>
  )
}
