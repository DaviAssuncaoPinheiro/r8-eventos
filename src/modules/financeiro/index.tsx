/* Módulo financeiro: /financeiro e /financeiro/cobranca/:id (a gaveta abre pela URL). */
import { Route, Routes } from 'react-router-dom'
import Financeiro from './Financeiro'

export default function FinanceiroModule() {
  return (
    <Routes>
      <Route path="*" element={<Financeiro />} />
    </Routes>
  )
}
