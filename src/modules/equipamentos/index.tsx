/* Módulo "equipamentos": estoque em /equipamentos e ficha da unidade em /equipamentos/:code. */
import { Navigate, Route, Routes } from 'react-router-dom'
import Estoque from './Estoque'
import Ficha from './Ficha'
import ArteTeste from './_ArteTeste'

export default function Equipamentos() {
  return (
    <Routes>
      <Route index element={<Estoque />} />
      <Route path="_arte" element={<ArteTeste />} />
      <Route path=":code" element={<Ficha />} />
      <Route path="*" element={<Navigate to="/equipamentos" replace />} />
    </Routes>
  )
}
