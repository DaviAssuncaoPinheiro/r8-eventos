import * as React from 'react'

/**
 * Sobe de 0 até `value` uma única vez ao montar (600 ms, saída exponencial) e acompanha mudanças seguintes
 * a partir do valor atual. Com "reduzir movimento" ligado devolve o valor final direto.
 */
export function useCountUp(value: number, duration = 600): number {
  const reduced = React.useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])
  const [shown, setShown] = React.useState(reduced ? value : 0)
  const from = React.useRef(reduced ? value : 0)
  React.useEffect(() => {
    if (reduced) {
      setShown(value)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(2, -10 * t)
      const v = t >= 1 ? value : a + (value - a) * eased
      from.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduced])
  return shown
}
