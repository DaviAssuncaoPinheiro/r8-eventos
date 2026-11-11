import * as React from 'react'
import { cn } from './cn'

export interface DemoStripProps {
  /** "Restaurar dados". Sem esta função, o botão não aparece. */
  onReset?: () => void
  /**
   * Fixa no topo da janela (z 95) e publica a altura em `--demo-strip-h` no `:root`
   * (32 px, ou 28 px abaixo de 640). A casca desconta com `var(--demo-strip-h, 0px)`:
   * `h-[calc(100dvh-var(--demo-strip-h,0px))]` ou a prop `viewport` dos frames.
   * Sem `fixed`, a faixa ocupa o fluxo do contêiner e não mexe no `:root`.
   */
  fixed?: boolean
  /** Força a versão do celular (28 px, texto curto). Sem isso, segue a largura da janela (< 640). */
  compact?: boolean
  className?: string
}

const MQ = '(max-width: 639px)'

function useNarrow(): boolean {
  const [narrow, setNarrow] = React.useState(() => (typeof window === 'undefined' ? false : window.matchMedia(MQ).matches))
  React.useEffect(() => {
    const mq = window.matchMedia(MQ)
    const on = () => setNarrow(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

export function DemoStrip({ onReset, fixed = false, compact, className }: DemoStripProps) {
  const narrow = useNarrow()
  const small = compact ?? narrow
  const height = small ? 28 : 32

  React.useEffect(() => {
    if (!fixed) return
    const root = document.documentElement
    root.style.setProperty('--demo-strip-h', `${height}px`)
    return () => {
      root.style.removeProperty('--demo-strip-h')
    }
  }, [fixed, height])

  return (
    <div
      role="note"
      style={{ height }}
      className={cn(
        'flex w-full shrink-0 items-center justify-center gap-3 bg-inverse px-4 text-caption font-semibold text-on-inverse',
        fixed && 'fixed inset-x-0 top-0 z-[95]',
        className,
      )}
    >
      <span className="truncate">{small ? 'Demonstração, dados fictícios' : 'Ambiente de demonstração. Dados fictícios.'}</span>
      {!small && onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-tip px-1 text-caption font-semibold text-on-inverse underline underline-offset-2 hover:text-on-inverse-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-on-inverse"
        >
          Restaurar dados
        </button>
      ) : null}
    </div>
  )
}
