import * as React from 'react'
import { Eraser } from 'lucide-react'
import { cn } from './cn'

export interface SignaturePadProps {
  /** Recebe a assinatura em data URL (PNG pequeno) a cada traço, ou `null` ao limpar. */
  onChange: (dataUrl: string | null) => void
  /** Altura da área em px. */
  height?: number
  label?: string
  className?: string
}

/** Assinatura desenhada com dedo, caneta ou mouse. Fundo branco fixo nos dois temas, como papel. */
export function SignaturePad({ onChange, height = 180, label = 'Assine aqui', className }: SignaturePadProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const drawing = React.useRef(false)
  const [empty, setEmpty] = React.useState(true)

  React.useEffect(() => {
    const c = ref.current
    if (!c) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    c.width = c.clientWidth * ratio
    c.height = c.clientHeight * ratio
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#14171b'
  }, [])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const [x, y] = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const [x, y] = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    setEmpty(false)
    const c = ref.current
    if (c) onChange(c.toDataURL('image/png'))
  }
  const clear = () => {
    const c = ref.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.restore()
    setEmpty(true)
    onChange(null)
  }

  return (
    <div className={cn('relative overflow-hidden rounded-card bg-white ring-1 ring-edge ring-inset', className)} style={{ height }}>
      <canvas
        ref={ref}
        role="img"
        aria-label={empty ? `${label}: área de assinatura vazia` : 'Assinatura desenhada'}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="block size-full cursor-crosshair touch-none"
      />
      {empty ? <span className="pointer-events-none absolute inset-0 grid place-items-center text-body-lg text-[#5c636d]">{label}</span> : null}
      <span aria-hidden className="pointer-events-none absolute inset-x-6 bottom-9 border-b border-dashed border-[#cfd4da]" />
      {!empty ? (
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 inline-flex h-11 items-center gap-1.5 rounded-pill bg-[#f0f0f2] px-4 text-caption font-semibold text-[#14171b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14171b]"
        >
          <Eraser size={14} strokeWidth={2} aria-hidden />
          Limpar
        </button>
      ) : null}
    </div>
  )
}
