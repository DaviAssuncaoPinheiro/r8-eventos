import * as React from 'react'
import { ArrowLeft, Hammer, SprayCan, Truck } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useBrandSync } from '@/app/AppLayout'
import { TooltipProvider } from '@/ui'
import { DemoStrip } from '@/ui/DemoStrip'
import { AppToaster } from '@/ui/Toast'
import { ResetDialog } from '../configuracoes/ResetDialog'
import { FrameContext } from './components/Sheet'
import Avarias from './Avarias'
import Hoje from './Hoje'
import Perfil from './Perfil'
import Qr from './Qr'
import Registro from './Registro'
import Servico from './Servico'
import Servicos from './Servicos'
import { syncQueue } from './sync'
import { resetCampo, useCampo } from './store'

const MQ = '(min-width: 640px)'

function useWide() {
  const [wide, setWide] = React.useState(() => window.matchMedia(MQ).matches)
  React.useEffect(() => {
    const mq = window.matchMedia(MQ)
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

/** App da equipe de rua. Fica fora da casca do escritório: no computador aparece numa moldura de celular. */
export default function Campo() {
  useBrandSync()
  const wide = useWide()
  const [frame, setFrame] = React.useState<HTMLElement | null>(null)
  const offline = useCampo((s) => s.offline)
  const queued = useCampo((s) => s.queue.length)

  /* sinal de volta: a fila segue para os serviços, um por vez */
  React.useEffect(() => {
    if (!offline && queued > 0) void syncQueue()
  }, [offline, queued])

  const [confirmReset, setConfirmReset] = React.useState(false)

  const routes = (
    <Routes>
      <Route index element={<Hoje />} />
      <Route path="servicos" element={<Servicos />} />
      <Route path="servico/:id" element={<Servico />} />
      <Route path="servico/:id/registro" element={<Registro />} />
      <Route path="qr" element={<Qr />} />
      <Route path="avarias" element={<Avarias />} />
      <Route path="perfil" element={<Perfil />} />
      <Route path="*" element={<Navigate to="/campo" replace />} />
    </Routes>
  )

  return (
    <TooltipProvider>
      <div className="ds-root min-h-dvh">
        <DemoStrip fixed onReset={() => setConfirmReset(true)} />
        <ResetDialog open={confirmReset} onOpenChange={setConfirmReset} onDone={resetCampo} />
        <FrameContext.Provider value={frame}>
          {wide ? (
            <div className="grid min-h-dvh place-items-center bg-app px-6 pt-[calc(var(--demo-strip-h,0px)+24px)] pb-6">
              <div className="flex flex-col items-center gap-6 min-[1000px]:flex-row min-[1000px]:gap-14">
                <div className="flex flex-col items-center gap-4 text-center min-[1000px]:w-[300px] min-[1000px]:items-start min-[1000px]:text-left">
                  <h1 className="text-title-page">App da equipe de rua</h1>
                  <ul aria-label="Quem usa" className="flex list-none flex-wrap justify-center gap-2 p-0 min-[1000px]:justify-start">
                    {[
                      { label: 'Motorista', icon: Truck },
                      { label: 'Montador', icon: Hammer },
                      { label: 'Limpador', icon: SprayCan },
                    ].map(({ label, icon: Icon }) => (
                      <li key={label} className="inline-flex h-10 items-center gap-2 rounded-pill bg-raised px-4 text-body font-semibold text-fg">
                        <Icon size={18} strokeWidth={2} aria-hidden className="text-accent-ink" />
                        {label}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/"
                    className="-ml-3 inline-flex h-11 items-center gap-2 rounded-pill px-3 text-body font-semibold text-fg-2 no-underline transition-colors duration-150 hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                    Voltar ao escritório
                  </Link>
                </div>
                <div ref={setFrame} className="relative h-[844px] max-h-[calc(100dvh-170px)] w-[390px] shrink-0 overflow-hidden rounded-[44px] bg-app ring-[10px] ring-inverse min-[1000px]:max-h-[calc(100dvh-80px)]">
                  {routes}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-dvh pt-[var(--demo-strip-h,0px)]">
              <div ref={setFrame} className="relative h-full">
                {routes}
              </div>
            </div>
          )}
        </FrameContext.Provider>
        {wide ? (
          <Toaster position="bottom-center" offset={16} gap={8} visibleToasts={3} toastOptions={{ unstyled: true }} containerAriaLabel="Notificações" style={{ zIndex: 80, '--width': '360px' } as React.CSSProperties} />
        ) : (
          <AppToaster />
        )}
      </div>
    </TooltipProvider>
  )
}
