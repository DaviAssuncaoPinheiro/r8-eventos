import { Navigate, Route, Routes } from 'react-router-dom'
import Lista from './Lista'
import Ficha from './Ficha'

export default function Clientes() {
  return (
    <Routes>
      <Route index element={<Lista />} />
      <Route path=":id" element={<Ficha />} />
      <Route path="*" element={<Navigate to="/clientes" replace />} />
    </Routes>
  )
}
