import * as React from 'react'
import { AlertTriangle, ClipboardList, House, MapPin, Navigation, Play, QrCode, UserRound } from 'lucide-react'
import { TooltipProvider } from '@/ui'
import { FieldFrame } from '@/ui/AppFrame'
import { BottomNav, BottomNavItem } from '@/ui/BottomNav'
import { FieldActionGrid, FieldActionTile } from '@/ui/FieldAction'
import { ServiceRow } from '@/ui/ServiceRow'
import { DemoStrip } from '@/ui/DemoStrip'
import { AppToaster, notify } from '@/ui/Toast'

/*
  PRÉVIA DE DIREÇÃO VISUAL do app de campo. Dados fixos só para avaliar o desenho.
  No desktop a tela aparece dentro de uma moldura de celular; no celular ocupa a janela.
*/

const FEITOS = 3
const TOTAL = 6

function Tela() {
  const soon = (what: string) => () => notify.info(`${what} entra na próxima etapa da construção`, { toasterId: 'previa-campo' })
  return (
    <FieldFrame
      title="R8 Eventos"
      pending={2}
      nav={
        <BottomNav>
          <BottomNavItem icon={House} label="Hoje" active />
          <BottomNavItem icon={ClipboardList} label="Serviços" onClick={soon('A lista de serviços')} />
          <BottomNavItem icon={AlertTriangle} label="Avarias" count={2} onClick={soon('O registro de avarias')} />
          <BottomNavItem icon={UserRound} label="Perfil" onClick={soon('O perfil')} />
        </BottomNav>
      }
    >
      <h1 className="text-title-field">Bom dia, Fábio</h1>
      <p className="mt-0.5 text-body-lg text-fg-2">Quarta-feira, 11/11. Caminhão 01.</p>

      {/* o próximo serviço é a única coisa preenchida com a marca */}
      <section aria-label="Próximo serviço" className="ds-hero mt-4 rounded-card p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-pill bg-on-accent px-3 py-1 text-caption font-semibold text-accent-active">Próximo, 10:30</span>
          <span className="text-caption font-medium text-on-accent-2">a 4,2 km</span>
        </div>
        <h2 className="mt-3 text-[26px] leading-8 font-semibold tracking-[-0.02em]">Limpeza, 12 unidades</h2>
        <p className="mt-1 flex items-start gap-1.5 text-body-lg text-on-accent-2">
          <MapPin size={18} strokeWidth={2} aria-hidden className="mt-[3px] shrink-0" />
          Construtora Planalto, SQNW 104, Noroeste
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={soon('O registro do serviço')}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-pill bg-on-accent text-body-lg font-semibold text-accent-active transition-transform duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
          >
            <Play size={22} strokeWidth={2} aria-hidden />
            Iniciar serviço
          </button>
          <button
            type="button"
            aria-label="Abrir rota no mapa"
            onClick={soon('A rota no mapa')}
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-pill bg-on-accent/15 text-on-accent transition-colors duration-150 active:bg-on-accent/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
          >
            <Navigation size={22} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </section>

      {/* progresso do dia */}
      <section aria-label="Progresso do dia" className="mt-3 rounded-card bg-raised p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-title-sub">Seu dia</h2>
          <p className="text-body text-fg-2">
            <strong className="text-title-sub text-fg">{FEITOS}</strong> de {TOTAL} serviços
          </p>
        </div>
        <div className="mt-3 flex gap-1.5" role="img" aria-label={`${FEITOS} de ${TOTAL} serviços concluídos`}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={i < FEITOS ? 'h-3 flex-1 rounded-pill bg-accent' : i === FEITOS ? 'h-3 flex-1 rounded-pill bg-accent-soft ring-2 ring-accent ring-inset' : 'ds-hatch h-3 flex-1 rounded-pill bg-sunken'} />
          ))}
        </div>
      </section>

      <FieldActionGrid className="mt-3">
        <FieldActionTile icon={QrCode} label="Escanear QR" onClick={soon('O leitor de QR')} />
        <FieldActionTile icon={AlertTriangle} label="Registrar avaria" onClick={soon('O registro de avaria')} />
      </FieldActionGrid>

      <h2 className="mt-6 mb-2 px-1 text-title-sub">Depois deste</h2>
      <ul className="overflow-hidden rounded-card bg-raised">
        <ServiceRow variant="field" time="13:00" duration="1 h" type="entrega" title="Entrega, 6 unidades" client="Produtora Cerrado Vivo" address="Parque da Cidade" status="agendado" onOpen={soon('O serviço')} />
        <ServiceRow variant="field" time="14:30" duration="45 min" type="limpeza" title="Limpeza, 8 unidades" client="Administração Regional do Guará" address="QE 23" status="agendado" badges={[{ label: 'Extra', tone: 'warn' }]} onOpen={soon('O serviço')} />
        <ServiceRow variant="field" time="16:00" duration="1 h" type="retirada" title="Retirada, 4 unidades" client="Residencial Vila Verde" address="Sobradinho" status="agendado" onOpen={soon('O serviço')} />
      </ul>
    </FieldFrame>
  )
}

export default function CampoPrevia() {
  const [wide, setWide] = React.useState(() => window.matchMedia('(min-width: 640px)').matches)
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return (
    <TooltipProvider>
      <div className="ds-root min-h-dvh">
        <DemoStrip fixed />
        {wide ? (
          <div className="grid min-h-dvh place-items-center bg-app px-6 pt-[calc(var(--demo-strip-h,0px)+24px)] pb-6">
            <div className="h-[844px] max-h-[calc(100dvh-80px)] w-[390px] overflow-hidden rounded-[44px] bg-app ring-[10px] ring-inverse">
              <Tela />
            </div>
          </div>
        ) : (
          <div className="h-dvh pt-[var(--demo-strip-h,0px)]">
            <Tela />
          </div>
        )}
        <AppToaster id="previa-campo" />
      </div>
    </TooltipProvider>
  )
}
