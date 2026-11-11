import * as React from 'react'
import { AlertTriangle, CircleCheck, MapPin, Navigation, Play, QrCode } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { today } from '@/domain/dates'
import { formatDate } from '@/lib/format'
import { startService, useMutation } from '@/services'
import { Badge } from '@/ui'
import { FieldActionGrid, FieldActionTile } from '@/ui/FieldAction'
import { notify } from '@/ui/Toast'
import { CampoScreen, LoadFailed } from './components/Screen'
import { ListSkeleton, ServiceList } from './components/ServiceList'
import { fmtDuration, fmtTime, greeting, mapsUrl, useCampoDay, useServiceTitle } from './lib'

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export default function Hoje() {
  const navigate = useNavigate()
  const day = useCampoDay()
  const title = useServiceTitle()
  const start = useMutation(startService)
  const { next, services, done, open, team } = day

  const go = async () => {
    if (!next) return
    try {
      if (next.status !== 'em_andamento') await start.run(next.id)
      navigate(`/campo/servico/${next.id}/registro`)
    } catch {
      notify.error('Não foi possível iniciar. Tente de novo.')
    }
  }

  const d = new Date()
  const first = team?.members[0]?.split(' ')[0]
  const closed = !!services.length && !open.length
  const later = open.filter((s) => s.id !== next?.id)
  const stateTag = next && (next.status === 'atrasado' ? { label: 'Atrasado', tone: 'danger' as const } : next.status === 'a_caminho' ? { label: 'A caminho', tone: 'info' as const } : next.status === 'em_andamento' ? { label: 'Em andamento', tone: 'accent' as const } : null)

  return (
    <CampoScreen>
      {day.loading ? (
        <ListSkeleton />
      ) : day.error && !team ? (
        <LoadFailed onRetry={() => void day.refetch()} />
      ) : (
        <>
          <h1 className="text-title-field">{first ? `${greeting()}, ${first}` : greeting()}</h1>
          <p className="mt-0.5 text-body-lg text-fg-2">
            {WEEKDAYS[d.getDay()]}, {formatDate(today()).slice(0, 5)}. {team?.truck}.
          </p>

          {next ? (
            <section aria-label="Próximo serviço" className="ds-hero mt-4 rounded-card p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-pill bg-on-accent px-3 py-1 text-caption font-semibold text-accent-active">Próximo, {fmtTime(next.start)}</span>
                <span className="text-caption font-medium text-on-accent-2">{stateTag ? stateTag.label : fmtDuration(next.durationMin)}</span>
              </div>
              <Link
                to={`/campo/servico/${next.id}`}
                className="mt-3 block rounded-control no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-accent"
                aria-label={`Abrir ${title(next)}`}
              >
                <h2 className="text-[26px] leading-8 font-semibold tracking-[-0.02em]">{title(next)}</h2>
                <p className="mt-1 flex items-start gap-1.5 text-body-lg text-on-accent-2">
                  <MapPin size={18} strokeWidth={2} aria-hidden className="mt-[3px] shrink-0" />
                  <span>
                    {next.clientName}, {next.address}
                  </span>
                </p>
              </Link>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => void go()}
                  disabled={start.loading}
                  className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-pill bg-on-accent text-body-lg font-semibold text-accent-active transition-transform duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent disabled:opacity-70"
                >
                  <Play size={22} strokeWidth={2} aria-hidden />
                  {next.status === 'em_andamento' ? 'Continuar serviço' : 'Iniciar serviço'}
                </button>
                <a
                  href={mapsUrl(next)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir rota no mapa"
                  className="inline-flex size-14 shrink-0 items-center justify-center rounded-pill bg-on-accent/15 text-on-accent transition-colors duration-150 active:bg-on-accent/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
                >
                  <Navigation size={22} strokeWidth={2} aria-hidden />
                </a>
              </div>
            </section>
          ) : closed ? (
            <section aria-label="Dia fechado" className="ds-hero mt-4 rounded-card p-5">
              <span className="grid size-14 place-items-center rounded-pill bg-on-accent/15">
                <CircleCheck size={32} strokeWidth={2} aria-hidden />
              </span>
              <h2 className="mt-3 text-[26px] leading-8 font-semibold tracking-[-0.02em]">Dia fechado</h2>
              <p className="mt-1 text-body-lg text-on-accent-2">
                <strong className="tnum text-[32px] leading-10 font-semibold text-on-accent">{done.length}</strong> {done.length === 1 ? 'serviço feito' : 'serviços feitos'}
              </p>
            </section>
          ) : (
            <section className="mt-4 rounded-card bg-raised p-5">
              <h2 className="text-title-sub">Nenhum serviço para hoje</h2>
              <p className="mt-1 text-body-lg text-fg-2">{team?.name}</p>
            </section>
          )}

          {services.length ? (
            <section aria-label="Progresso do dia" className="mt-3 rounded-card bg-raised p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-title-sub">Seu dia</h2>
                <p className="text-body text-fg-2">
                  <strong className="tnum text-title-sub text-fg">{done.length}</strong> de {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
                </p>
              </div>
              <div className={`mt-3 flex ${services.length > 10 ? 'gap-1' : 'gap-1.5'}`} role="img" aria-label={`${done.length} de ${services.length} serviços concluídos`}>
                {services.map((s, i) => (
                  <span key={s.id} className={i < done.length ? 'h-3 flex-1 rounded-pill bg-accent' : i === done.length ? 'h-3 flex-1 rounded-pill bg-accent-soft ring-2 ring-accent ring-inset' : 'ds-hatch h-3 flex-1 rounded-pill bg-sunken'} />
                ))}
              </div>
            </section>
          ) : null}

          <FieldActionGrid className="mt-3">
            <FieldActionTile icon={QrCode} label="Escanear QR" onClick={() => navigate('/campo/qr')} />
            <FieldActionTile icon={AlertTriangle} label="Registrar avaria" onClick={() => navigate('/campo/avarias')} />
          </FieldActionGrid>

          {later.length ? (
            <>
              <h2 className="mt-6 mb-2 px-1 text-title-sub">Depois deste</h2>
              <ServiceList services={later} label="Serviços seguintes" />
            </>
          ) : null}
          {closed ? (
            <>
              <h2 className="mt-6 mb-2 flex items-center gap-2 px-1 text-title-sub">
                Feitos hoje <Badge tone="ok">{done.length}</Badge>
              </h2>
              <ServiceList services={done} label="Serviços feitos" />
            </>
          ) : null}
        </>
      )}
    </CampoScreen>
  )
}
