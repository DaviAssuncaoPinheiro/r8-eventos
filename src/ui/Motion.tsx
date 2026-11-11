import * as React from 'react'
import NumberFlow from '@number-flow/react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from './cn'

/*
  Movimento do produto, em um lugar só. O dono pediu animação de impacto; a regra é:
  entra uma vez, com propósito (número que rola, blocos em cascata, tela que desliza, dinheiro que comemora),
  nunca atrasa o clique seguinte e some por completo com "reduzir movimento".
*/

export const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const EASE = [0.16, 1, 0.3, 1] as const

/* ───────── Cascata: os filhos diretos entram um depois do outro ───────── */

export interface StaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Intervalo entre os filhos, em segundos. */
  gap?: number
  /** Atraso antes do primeiro, em segundos. */
  delay?: number
  as?: 'div' | 'ul' | 'ol' | 'section'
}

/**
 * Envolve uma grade ou lista: cada filho direto sobe 14 px e aparece, em sequência.
 * Use uma vez por bloco principal da tela (linha de indicadores, grade de cartões), não em tudo.
 */
export function Stagger({ gap = 0.055, delay = 0, as = 'div', className, children, ...rest }: StaggerProps) {
  const Tag = motion[as] as typeof motion.div
  if (reduced()) {
    const Plain = as as 'div'
    return (
      <Plain className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </Plain>
    )
  }
  return (
    <Tag
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      {...(rest as object)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? (
          <motion.div
            className="contents-none min-w-0"
            style={{ display: 'contents' }}
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } } }}
          >
            {child}
          </motion.div>
        ) : (
          child
        ),
      )}
    </Tag>
  )
}

/** Um bloco só: sobe e aparece ao montar. `delay` em segundos. */
export function Reveal({ delay = 0, className, children, ...rest }: { delay?: number } & React.HTMLAttributes<HTMLDivElement>) {
  if (reduced())
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    )
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: EASE, delay }} {...(rest as object)}>
      {children}
    </motion.div>
  )
}

/* ───────── Troca de tela ───────── */

/** Em volta do conteúdo da rota: a tela nova entra deslizando 10 px, a antiga some rápido. */
export function PageTransition({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  if (reduced()) return <>{children}</>
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={routeKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.28, ease: EASE }}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/* ───────── Números que rolam ───────── */

/** Dinheiro com os algarismos rolando a cada mudança. `kpi`: "R$" e centavos menores, como no <Money variant="kpi">. */
export function RollingMoney({ value, kpi, className }: { value: number; kpi?: boolean; className?: string }) {
  // começa em zero e assume o valor no primeiro quadro: o número rola ao aparecer
  const [shown, setShown] = React.useState(reduced() ? value : 0)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value))
    return () => cancelAnimationFrame(id)
  }, [value])
  return (
    <span className={cn('inline-flex whitespace-nowrap', className)}>
      <span className="sr-only">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
      <NumberFlow
        aria-hidden
        className={cn('ds-roll', kpi && 'ds-roll-kpi')}
        value={shown}
        locales="pt-BR"
        format={{ style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        transformTiming={{ duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        spinTiming={{ duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        opacityTiming={{ duration: 300, easing: 'ease-out' }}
        animated={!reduced()}
      />
    </span>
  )
}

/** Número inteiro ou percentual com os algarismos rolando. */
export function RollingNumber({ value, suffix, className, decimals = 0 }: { value: number; suffix?: string; className?: string; decimals?: number }) {
  const [shown, setShown] = React.useState(reduced() ? value : 0)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value))
    return () => cancelAnimationFrame(id)
  }, [value])
  return (
    <span className={cn('inline-flex whitespace-nowrap', className)}>
      <span className="sr-only">
        {value.toLocaleString('pt-BR', { maximumFractionDigits: decimals })}
        {suffix}
      </span>
      <NumberFlow
        aria-hidden
        className="ds-roll"
        value={shown}
        locales="pt-BR"
        suffix={suffix}
        format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
        transformTiming={{ duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        spinTiming={{ duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        animated={!reduced()}
      />
    </span>
  )
}

/* ───────── Comemoração: dinheiro que entrou ───────── */

/**
 * Estouro curto de confete nas cores da marca, saindo de um ponto da tela (o botão que foi clicado).
 * Use só quando dinheiro entra de verdade: cobrança paga, extras faturados, rota otimizada aplicada.
 */
export function celebrate(origin?: { x: number; y: number } | Element | null) {
  if (typeof window === 'undefined' || reduced()) return
  let x = window.innerWidth / 2
  let y = window.innerHeight / 3
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect()
    x = r.left + r.width / 2
    y = r.top + r.height / 2
  } else if (origin) {
    x = origin.x
    y = origin.y
  }
  const cs = getComputedStyle(document.documentElement)
  const pick = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb
  const colors = [pick('--accent', '#d54200'), pick('--accent-glow', '#ff7950'), pick('--ok', '#1b7f48'), pick('--warn', '#b97800'), pick('--fg', '#121417')]
  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:120'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.remove()
  ctx.scale(dpr, dpr)
  const parts = Array.from({ length: 64 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 64 + Math.random() * 0.4
    const v = 5 + Math.random() * 8
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length], round: i % 3 === 0 }
  })
  const start = performance.now()
  const frame = (now: number) => {
    const t = (now - start) / 1300
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const p of parts) {
      p.vx *= 0.985
      p.vy = p.vy * 0.985 + 0.32
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - t * t)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.fillStyle = p.c
      if (p.round) {
        ctx.beginPath()
        ctx.arc(0, 0, p.h, 0, Math.PI * 2)
        ctx.fill()
      } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (t < 1) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}

/* ───────── Inclinação no ponteiro (cartão de destaque) ───────── */

/** O bloco inclina até 4 graus acompanhando o ponteiro e volta ao soltar. Só em tela com mouse. */
export function Tilt({ max = 4, className, children }: { max?: number; className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse' || reduced()) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
  }
  const leave = () => {
    if (ref.current) ref.current.style.transform = ''
  }
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={cn('transition-transform duration-200 ease-[var(--ease-ui)] will-change-transform', className)}>
      {children}
    </div>
  )
}
