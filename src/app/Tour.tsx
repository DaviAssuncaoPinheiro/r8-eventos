import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, cn } from '@/ui'
import { TOUR_KEY, TOUR_STEPS } from './tour/steps'

const PAD = 8
const GAP = 14
const MARGIN = 12
const BALLOON_W = 340
const MISSING_AFTER = 2500

interface Box {
  x: number
  y: number
  w: number
  h: number
  r: number
}

/** Mostra o tour sozinho uma vez por carga da página, mesmo se o navegador bloquear o localStorage. */
let autoShown = false

function seen(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) !== null
  } catch {
    return false
  }
}
function markSeen() {
  try {
    localStorage.setItem(TOUR_KEY, new Date().toISOString())
  } catch {
    /* sem armazenamento: o tour só não lembra */
  }
}

function usable(el: Element | null): el is Element {
  if (!el || !el.isConnected) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
}

function scrollParent(el: Element): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY
    if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n
  }
  return null
}

/** Rola só o necessário para o alvo ficar entre o topo e o limite inferior livre. */
function ensureVisible(el: Element, bottomLimit: number) {
  const r = el.getBoundingClientRect()
  const top = MARGIN + PAD
  const bottom = bottomLimit - PAD
  let delta = 0
  if (r.height > bottom - top) {
    // alvo mais alto que a área livre: só garante que o começo dele apareça
    if (r.top < top || r.top > bottom - 120) delta = r.top - top
  } else if (r.top < top) delta = r.top - top
  else if (r.bottom > bottom) delta = r.bottom - bottom
  if (!delta) return
  scrollParent(el)?.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior })
}

function measure(el: Element, fallbackRadius?: number): Box {
  const r = el.getBoundingClientRect()
  const own = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
  return { x: r.left, y: r.top, w: r.width, h: r.height, r: (own || fallbackRadius || 14) + (own ? PAD : 0) }
}

const same = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5 && a.r === b.r)

function useMedia(query: string) {
  const [v, setV] = React.useState(() => window.matchMedia(query).matches)
  React.useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setV(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return v
}

function place(box: Box | null, vw: number, vh: number, w: number, h: number): { left: number; top: number } {
  const center = { left: (vw - w) / 2, top: Math.max(MARGIN, (vh - h) / 2) }
  if (!box) return center
  const l = box.x - PAD
  const t = box.y - PAD
  const r = box.x + box.w + PAD
  const b = box.y + box.h + PAD
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(n, hi))
  const midY = clamp(box.y + box.h / 2 - h / 2, MARGIN, vh - h - MARGIN)
  const midX = clamp(box.x + box.w / 2 - w / 2, MARGIN, vw - w - MARGIN)
  if (r + GAP + w <= vw - MARGIN) return { left: r + GAP, top: midY }
  if (b + GAP + h <= vh - MARGIN) return { left: midX, top: b + GAP }
  if (l - GAP - w >= MARGIN) return { left: l - GAP - w, top: midY }
  if (t - GAP - h >= MARGIN) return { left: midX, top: t - GAP - h }
  return center
}

export function Tour() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pathRef = React.useRef(pathname)
  pathRef.current = pathname

  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [box, setBox] = React.useState<Box | null>(null)
  const [moving, setMoving] = React.useState(false)
  const [vp, setVp] = React.useState({ w: window.innerWidth, h: window.innerHeight })
  const [bh, setBh] = React.useState(220)
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const sheet = vp.w < 640

  const dialogRef = React.useRef<HTMLDivElement>(null)
  const nextRef = React.useRef<HTMLButtonElement>(null)
  const prevFocus = React.useRef<HTMLElement | null>(null)
  const bhRef = React.useRef(bh)
  bhRef.current = bh
  const sheetRef = React.useRef(sheet)
  sheetRef.current = sheet

  const titleId = React.useId()
  const textId = React.useId()
  const step = TOUR_STEPS[index]
  const last = index === TOUR_STEPS.length - 1

  const goTo = React.useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(TOUR_STEPS.length - 1, i))
      setIndex(n)
      if (pathRef.current !== TOUR_STEPS[n].route) navigate(TOUR_STEPS[n].route)
    },
    [navigate],
  )

  const start = React.useCallback(() => {
    markSeen()
    prevFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setIndex(0)
    setBox(null)
    setOpen(true)
    if (pathRef.current !== TOUR_STEPS[0].route) navigate(TOUR_STEPS[0].route)
  }, [navigate])

  const finish = React.useCallback(() => {
    setOpen(false)
    navigate('/')
    const back = prevFocus.current
    prevFocus.current = null
    window.setTimeout(() => {
      if (back && back.isConnected) back.focus()
    }, 0)
  }, [navigate])

  // reabrir pelo item "Ajuda"
  React.useEffect(() => {
    const on = () => {
      if (!open) start()
    }
    window.addEventListener('app:tour', on)
    return () => window.removeEventListener('app:tour', on)
  }, [open, start])

  // primeira visita: espera a primeira tela carregar
  React.useEffect(() => {
    if (autoShown || seen()) return
    let done = false
    const t0 = performance.now()
    let timer = 0
    const poll = () => {
      if (done) return
      const ready = pathRef.current === '/' ? usable(TOUR_STEPS[0].target()) : usable(document.querySelector('main h1'))
      if (ready || performance.now() - t0 > 8000) {
        timer = window.setTimeout(() => {
          if (done || autoShown) return
          autoShown = true
          start()
        }, 500)
        return
      }
      timer = window.setTimeout(poll, 150)
    }
    poll()
    return () => {
      done = true
      window.clearTimeout(timer)
    }
  }, [start])

  // tamanho da janela
  React.useEffect(() => {
    if (!open) return
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [open])

  // acompanha o alvo a cada quadro: cobre rolagem, redimensionamento, navegação e carregamento
  React.useEffect(() => {
    if (!open) return
    setMoving(true)
    const mv = window.setTimeout(() => setMoving(false), 300)
    const t0 = performance.now()
    let el: Element | null = null
    let scrolled = false
    let raf = 0
    const tick = () => {
      if (!usable(el)) {
        el = step.target()
        scrolled = false
      }
      // existe mas está oculto (lateral em gaveta no celular): não há o que destacar
      const exists = !!el && el.isConnected
      if (usable(el)) {
        if (!scrolled) {
          ensureVisible(el, sheetRef.current ? window.innerHeight - bhRef.current - MARGIN * 2 : window.innerHeight - MARGIN)
          scrolled = true
        }
        const next = measure(el, step.radius)
        // alvo mais alto que a área livre (folha inferior no celular): o recorte termina onde o balão começa
        const limit = (sheetRef.current ? window.innerHeight - bhRef.current - MARGIN * 2 : window.innerHeight - MARGIN) - PAD
        if (next.y + next.h > limit) next.h = Math.max(48, limit - next.y)
        setBox((cur) => (same(cur, next) ? cur : next))
      } else if (exists || performance.now() - t0 > MISSING_AFTER) {
        setBox((cur) => (cur ? null : cur))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(mv)
    }
  }, [open, step])

  React.useLayoutEffect(() => {
    if (open && dialogRef.current) setBh(dialogRef.current.offsetHeight)
  }, [open, index, vp.w])

  // foco no "Avançar" ao abrir
  React.useEffect(() => {
    if (open) nextRef.current?.focus()
  }, [open])

  // teclado: Esc pula, setas mudam de passo, Tab fica preso no balão
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        finish()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (index < TOUR_STEPS.length - 1) goTo(index + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (index > 0) goTo(index - 1)
      } else if (e.key === 'Tab') {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])
        if (!items.length) return
        const first = items[0]
        const lastEl = items[items.length - 1]
        const active = document.activeElement
        if (!dialogRef.current?.contains(active)) {
          e.preventDefault()
          ;(e.shiftKey ? lastEl : first).focus()
        } else if (e.shiftKey && active === first) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && active === lastEl) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    const onFocusIn = (e: FocusEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) nextRef.current?.focus()
    }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open, index, goTo, finish])

  if (!open) return null

  const w = Math.min(BALLOON_W, vp.w - MARGIN * 2)
  const pos = sheet ? null : place(box, vp.w, vp.h, w, bh)
  const ease = reduced ? undefined : 'var(--ease-ui)'
  const animate = !reduced && moving

  return (
    <div className="ds-root">
      {/* bloqueia cliques na tela; escurece sozinho quando não há alvo */}
      <div aria-hidden className="fixed inset-0 z-[100]" />
      <div aria-hidden className={cn('pointer-events-none fixed inset-0 z-[100] bg-scrim', box ? 'opacity-0' : 'opacity-100')} style={{ transition: reduced ? undefined : `opacity 250ms ${ease}` }} />
      <div
        aria-hidden
        className="pointer-events-none fixed z-[100]"
        style={{
          left: (box?.x ?? vp.w / 2) - PAD,
          top: (box?.y ?? vp.h / 2) - PAD,
          width: (box?.w ?? 0) + PAD * 2,
          height: (box?.h ?? 0) + PAD * 2,
          borderRadius: box?.r ?? 22,
          opacity: box ? 1 : 0,
          boxShadow: '0 0 0 2px var(--accent), 0 0 0 100vmax var(--scrim)',
          transition: reduced ? undefined : `opacity 250ms ${ease}${moving ? `, left 250ms ${ease}, top 250ms ${ease}, width 250ms ${ease}, height 250ms ${ease}, border-radius 250ms ${ease}` : ''}`,
        }}
      />

      <div
        className="fixed z-[101]"
        style={
          sheet
            ? { left: MARGIN, right: MARGIN, bottom: MARGIN }
            : { left: pos!.left, top: pos!.top, width: w, transition: animate ? `left 250ms ${ease}, top 250ms ${ease}` : undefined }
        }
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={textId}
          className={cn('rounded-card bg-overlay p-5 text-fg shadow-overlay', sheet ? 'animate-[ds-sheet-in_200ms_var(--ease-ui)]' : 'animate-[ds-menu-in_200ms_var(--ease-ui)]')}
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden>
              {TOUR_STEPS.map((_, i) => (
                <span key={i} className={cn('h-1.5 flex-1 rounded-pill transition-colors duration-250 ease-[var(--ease-ui)]', i <= index ? 'bg-accent' : 'bg-sunken')} />
              ))}
            </div>
            <button
              type="button"
              onClick={finish}
              className="ds-touch -mr-2 inline-flex h-8 items-center rounded-pill px-3 text-caption font-semibold text-fg-2 transition-colors duration-150 hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Pular
            </button>
          </div>
          <p className="sr-only">
            Passo {index + 1} de {TOUR_STEPS.length}
          </p>
          <h2 id={titleId} className="mt-4 text-title-card">
            {step.title}
          </h2>
          <p id={textId} className="mt-1.5 text-body text-fg-2">
            {step.text}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3">
            {index > 0 ? (
              <Button variant="ghost" onClick={() => goTo(index - 1)}>
                Voltar
              </Button>
            ) : (
              <span />
            )}
            <Button ref={nextRef} variant="primary" onClick={() => (last ? finish() : goTo(index + 1))}>
              {last ? 'Começar' : 'Avançar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tour
