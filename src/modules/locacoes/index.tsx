import { Navigate, Route, Routes } from 'react-router-dom'
import Lista from './Lista'
import Nova from './Nova'
import Detalhe from './Detalhe'

export default function Locacoes() {
  return (
    <Routes>
      <Route index element={<Lista />} />
      <Route path="nova" element={<Nova />} />
      <Route path=":id" element={<Detalhe />} />
      <Route path="*" element={<Navigate to="/locacoes" replace />} />
    </Routes>
  )
}
