// App da equipe (/campo/servico/:id). Celular e tablet: tela cheia. Computador: dentro do painel (AppShell).
import * as React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AppShell } from '@/components/AppShell'
import { useDemo } from '@/store'
import { notify, useCampo } from './campoStore'
import { flushOffline } from './finalize'
import { EASE_IOS, PhoneCtx, PhoneToaster } from './kit'
import { depthOf } from './nav'
import JobScreen from './JobScreen'
import RecordScreen from './RecordScreen'
import DoneScreen from './DoneScreen'
import { DeskCampo } from './DeskCampo'

function useMedia(q: string) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false)
  const [m, setM] = React.useState(get)
  React.useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    f()
    return () => mq.removeEventListener('change', f)
  }, [q])
  return m
}

/** Fila offline: ao perder o sinal acumula registros; ao voltar, sincroniza com animação. */
function useSyncEngine() {
  const offline = useDemo((s) => s.offline)
  const prev = React.useRef(offline)
  React.useEffect(() => {
    const c = useCampo.getState()
    const wasOffline = prev.current
    prev.current = offline
    if (offline) {
      if (!wasOffline) notify({ kind: 'offline', title: 'Sem sinal', body: 'Pode seguir o serviço. Tudo fica salvo no aparelho.' })
      return
    }
    // com sinal: envia o que ficou guardado no aparelho (também depois de recarregar a página)
    const saved = Object.values(useDemo.getState().reports).filter((r) => r.savedOffline).length
    const n = Math.max(c.pending, saved)
    if (n === 0) return
    c.setSyncing(true)
    const t = window.setTimeout(() => {
      c.setSyncing(false)
      c.setPending(0)
      flushOffline()
      notify({ kind: 'sync', title: 'Sincronizado', body: `${n} ${n === 1 ? 'registro enviado' : 'registros enviados'} para a base.` })
    }, 1900)
    return () => window.clearTimeout(t)
  }, [offline])
}

const T = { duration: 0.46, ease: EASE_IOS }
const screenVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-28%', zIndex: d > 0 ? 2 : 1 }),
  center: (d: number) => ({ x: '0%', zIndex: d > 0 ? 2 : 1, transition: { x: T, zIndex: { duration: 0 } } }),
  exit: (d: number) => ({ x: d > 0 ? '-28%' : '100%', zIndex: d > 0 ? 1 : 2, transition: { x: T, zIndex: { duration: 0 } } }),
}

function AppRoutes() {
  const location = useLocation()
  const depth = depthOf(location.pathname)
  const prev = React.useRef(depth)
  const forced = (location.state as { dir?: number } | null)?.dir
  const dir = forced ?? (depth >= prev.current ? 1 : -1)
  React.useEffect(() => {
    prev.current = depth
  }, [depth])

  return (
    <AnimatePresence initial={false} custom={dir}>
      <motion.div
        key={location.pathname}
        custom={dir}
        variants={screenVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="absolute inset-0 overflow-hidden bg-surface shadow-[-10px_0_30px_-12px_rgba(17,18,20,.28)]"
      >
        <Routes location={location}>
          <Route index element={<Navigate to="/" replace />} />
          <Route path="servico/:id" element={<JobScreen />} />
          <Route path="servico/:id/registro" element={<RecordScreen />} />
          <Route path="servico/:id/concluido" element={<DoneScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Campo() {
  const desktop = useMedia('(min-width: 1024px)')
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null)
  useSyncEngine()

  React.useEffect(() => {
    const t = document.title
    document.title = 'App da equipe · R8 Eventos'
    return () => {
      document.title = t
    }
  }, [])

  if (desktop) {
    return (
      <PhoneCtx.Provider value={{ desktop: true, root: null }}>
        <AppShell>
          <DeskCampo />
        </AppShell>
        <PhoneToaster placement="page" />
      </PhoneCtx.Provider>
    )
  }

  // Celular em tela cheia; no tablet o app fica centralizado com largura de celular grande.
  return (
    <div className="fixed inset-0 overflow-hidden bg-canvas">
      <div
        ref={setRoot}
        className="relative mx-auto h-full w-full max-w-[520px] overflow-hidden bg-surface min-[521px]:shadow-[0_0_0_1px_rgba(17,18,20,.04),0_30px_80px_-30px_rgba(17,18,20,.25)]"
        style={{ transform: 'translateZ(0)', ['--sat' as string]: 'max(env(safe-area-inset-top), 4px)', ['--sab' as string]: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <PhoneCtx.Provider value={{ desktop: false, root }}>
          <AppRoutes />
          <PhoneToaster />
        </PhoneCtx.Provider>
      </div>
    </div>
  )
}
