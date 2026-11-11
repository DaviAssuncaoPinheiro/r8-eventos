import * as React from 'react'

/**
 * Devolve o foco a quem abriu a sobreposição. A Radix só faz isso quando a abertura vem do próprio
 * `Trigger`; aqui várias gavetas e diálogos abrem por estado (botão em outro lugar, atalho Ctrl K).
 * Uso: `onOpenAutoFocus={rf.capture}` (ou chamar `rf.capture()` no handler existente) e `onCloseAutoFocus={rf.restore}`.
 */
export function useReturnFocus() {
  const prev = React.useRef<HTMLElement | null>(null)
  return React.useMemo(
    () => ({
      capture: () => {
        const a = document.activeElement
        if (a instanceof HTMLElement && a !== document.body) prev.current = a
      },
      restore: (e: Event) => {
        const el = prev.current
        prev.current = null
        if (el && el.isConnected) {
          e.preventDefault()
          el.focus({ preventScroll: true })
        }
      },
    }),
    [],
  )
}
