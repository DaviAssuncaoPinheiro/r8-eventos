// Serviço no computador: chegada, registro e resumo dentro do AppShell.
import { Navigate, Route, Routes } from 'react-router-dom'
import { ConnectivityBanner } from './kit'
import { DeskJob } from './DeskJob'
import { DeskRecord } from './DeskRecord'
import { DeskDone } from './DeskDone'

export function DeskCampo() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-1 pb-3 md:px-6">
      <ConnectivityBanner flush />
      <Routes>
        <Route index element={<Navigate to="/" replace />} />
        <Route path="servico/:id" element={<DeskJob />} />
        <Route path="servico/:id/registro" element={<DeskRecord />} />
        <Route path="servico/:id/concluido" element={<DeskDone />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
