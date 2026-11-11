import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from './components/AppShell'
import { TooltipProvider } from './components/ui'
import { lazy, Suspense } from 'react'
import Hoje from './pages/Hoje'

const Agenda = lazy(() => import('./pages/Agenda'))
const Regioes = lazy(() => import('./pages/Regioes'))
const Locacoes = lazy(() => import('./pages/Locacoes'))
const Locacao = lazy(() => import('./pages/Locacao'))
const Equipamentos = lazy(() => import('./pages/Equipamentos'))
const Avisos = lazy(() => import('./pages/Avisos'))
const Campo = lazy(() => import('./pages/campo/Campo'))
const Relatorio = lazy(() => import('./pages/public/Relatorio'))
const Unidade = lazy(() => import('./pages/public/Unidade'))
const DesignSystem = lazy(() => import('./pages/design-system/DesignSystem'))
const PainelPrevia = lazy(() => import('./pages/previa/Painel'))
const CampoPrevia = lazy(() => import('./pages/previa/Campo'))

/* Links antigos do HashRouter (/#/locacoes/12) viram /locacoes/12 antes do primeiro render */
if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="h-dvh bg-surface" />}>
          <Routes>
            <Route path="/design-system" element={<DesignSystem />} />
            <Route path="/previa/campo" element={<CampoPrevia />} />
            <Route path="/previa/*" element={<PainelPrevia />} />
            <Route path="/campo/*" element={<Campo />} />
            <Route path="/relatorio/:rentalId" element={<Relatorio />} />
            <Route path="/u/:unitId" element={<Unidade />} />
            <Route element={<AppShell />}>
              <Route index element={<Hoje />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="regioes" element={<Regioes />} />
              <Route path="locacoes" element={<Locacoes />} />
              <Route path="locacoes/:id" element={<Locacao />} />
              <Route path="equipamentos" element={<Equipamentos />} />
              <Route path="avisos" element={<Avisos />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: { description: '!text-white/65' },
          style: { background: 'var(--color-black)', color: '#fff', border: 'none', borderRadius: 18, fontFamily: 'var(--font-sans)' },
        }}
      />
    </TooltipProvider>
  )
}
