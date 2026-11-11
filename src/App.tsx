import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './app/AppLayout'

/* Cada módulo é carregado sob demanda e cuida das próprias sub-rotas (path "x/*"). */
const Painel = lazy(() => import('./modules/painel'))
const Operacao = lazy(() => import('./modules/operacao'))
const Locacoes = lazy(() => import('./modules/locacoes'))
const Equipamentos = lazy(() => import('./modules/equipamentos'))
const Avarias = lazy(() => import('./modules/avarias'))
const Financeiro = lazy(() => import('./modules/financeiro'))
const Clientes = lazy(() => import('./modules/clientes'))
const Relatorios = lazy(() => import('./modules/relatorios'))
const Configuracoes = lazy(() => import('./modules/configuracoes'))
const Campo = lazy(() => import('./modules/campo'))
const Portal = lazy(() => import('./modules/portal'))
const Unidade = lazy(() => import('./modules/portal/Unidade'))
const DesignSystem = lazy(() => import('./pages/design-system/DesignSystem'))

/* Links antigos com # (/#/locacoes/12) viram /locacoes/12 antes do primeiro render */
if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

const Blank = () => <div className="ds-root h-dvh bg-app" />

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<Blank />}>
        <Routes>
          <Route path="/design-system" element={<DesignSystem />} />
          {/* fora da casca do escritório: app de campo e páginas públicas com a marca da locadora */}
          <Route path="/campo/*" element={<Campo />} />
          <Route path="/portal/:token/*" element={<Portal />} />
          <Route path="/u/:code" element={<Unidade />} />
          <Route element={<AppLayout />}>
            <Route index element={<Painel />} />
            <Route path="operacao/*" element={<Operacao />} />
            <Route path="locacoes/*" element={<Locacoes />} />
            <Route path="equipamentos/*" element={<Equipamentos />} />
            <Route path="avarias/*" element={<Avarias />} />
            <Route path="financeiro/*" element={<Financeiro />} />
            <Route path="clientes/*" element={<Clientes />} />
            <Route path="relatorios/*" element={<Relatorios />} />
            <Route path="configuracoes/*" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
