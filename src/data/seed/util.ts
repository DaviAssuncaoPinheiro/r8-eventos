// Ferramentas da geração determinística: PRNG com semente, CNPJ válido, telefone, dinheiro quebrado.

export type Rng = ReturnType<typeof createRng>

/** mulberry32 */
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]
  return {
    next,
    int,
    float: (min: number, max: number) => next() * (max - min) + min,
    chance: (p: number) => next() < p,
    pick,
    weighted<T>(items: readonly T[], weights: readonly number[]): T {
      const total = weights.reduce((a, b) => a + b, 0)
      let r = next() * total
      for (let i = 0; i < items.length; i++) {
        r -= weights[i]
        if (r < 0) return items[i]
      }
      return items[items.length - 1]
    },
    shuffle<T>(arr: readonly T[]): T[] {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    sample<T>(arr: readonly T[], n: number): T[] {
      const out = [...arr]
      const res: T[] = []
      while (res.length < n && out.length) res.push(out.splice(Math.floor(next() * out.length), 1)[0])
      return res
    },
  }
}

export const round2 = (n: number) => Math.round(n * 100) / 100

/** Valor com centavos "quebrados" (nunca redondo): 1386 -> 1386.40 */
export function oddMoney(value: number, rng: Rng): number {
  const cents = rng.pick([0.4, 0.6, 0.7, 0.8, 0.9, 0.3, 0.5])
  return round2(Math.floor(value) + cents)
}

export function phone(rng: Rng): string {
  const n = String(rng.int(0, 99999999)).padStart(8, '0')
  return `(61) 9${n.slice(0, 4)}-${n.slice(4)}`
}

export function cnpj(rng: Rng): string {
  const base = Array.from({ length: 8 }, () => rng.int(0, 9))
  base[0] = Math.max(1, base[0])
  const d = [...base, 0, 0, 0, 1]
  const dv = (arr: number[]) => {
    const w = arr.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = arr.reduce((a, v, i) => a + v * w[i], 0)
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  d.push(dv(d))
  d.push(dv(d))
  const s = d.join('')
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`
}

export function cnpjIsValid(c: string): boolean {
  const s = c.replace(/\D/g, '')
  if (s.length !== 14) return false
  const nums = s.split('').map(Number)
  const dv = (arr: number[]) => {
    const w = arr.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const r = arr.reduce((a, v, i) => a + v * w[i], 0) % 11
    return r < 2 ? 0 : 11 - r
  }
  return dv(nums.slice(0, 12)) === nums[12] && dv(nums.slice(0, 13)) === nums[13]
}

/** Assinatura rabiscada (SVG minúsculo em data URL), estável por semente de texto */
export function signatureDataUrl(name: string): string {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const r = (n: number) => ((h >>> n) & 15) - 8
  const y = 30 + (r(0) % 6)
  const d = `M6 ${y} C ${18 + r(4)} ${6 + r(8)}, ${26 + r(12)} ${48 + r(16)}, ${40} ${y} S ${62 + r(20)} ${8 + r(24)}, ${76} ${y + 4} S ${98 + r(28)} ${46 + r(2)}, ${118} ${y - 6} L 150 ${y + 2}`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 60'><path d='${d}' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
  return `data:image/svg+xml;utf8,${svg}`
}
