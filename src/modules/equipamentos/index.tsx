/* Módulo "equipamentos": estoque em /equipamentos e ficha da unidade em /equipamentos/:code. */
import { Navigate, Route, Routes } from 'react-router-dom'
import Estoque from './Estoque'
import Ficha from './Ficha'

export default function Equipamentos() {
  return (
    <Routes>
      <Route index element={<Estoque />} />
      <Route path=":code" element={<Ficha />} />
      <Route path="*" element={<Navigate to="/equipamentos" replace />} />
    </Routes>
  )
}
