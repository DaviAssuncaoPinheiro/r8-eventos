import * as React from 'react'
import { useNavigate } from 'react-router-dom'

/** Navegação interna do app; dir força a direção da transição (1 = empurra, -1 = volta). */
export function useGo() {
  const navigate = useNavigate()
  return React.useCallback(
    (to: string, opts?: { dir?: 1 | -1; replace?: boolean }) => navigate(`/campo${to}`, { state: { dir: opts?.dir }, replace: opts?.replace }),
    [navigate],
  )
}

/** Profundidade da tela: serviço (1), registro (2), concluído (3) */
export function depthOf(pathname: string) {
  const parts = pathname.replace(/^\/campo\/?/, '').split('/').filter(Boolean)
  if (parts.length === 0) return 0
  if (parts.length <= 2) return 1
  return parts[2] === 'concluido' ? 3 : 2
}
