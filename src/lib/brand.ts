/*
  Cor da marca configurável.
  applyBrand(hex) deriva, em OKLCH, todas as variáveis de acento dos dois temas
  e grava no :root. Contraste garantido por construção:
  - texto branco sobre --accent >= 4,5:1 (escurece só a luminosidade até atingir)
  - --accent-ink >= 4,5:1 sobre --accent-soft, sobre o cartão e sobre o painel
  - --on-accent-2 (texto secundário sobre o acento) >= 4,5:1
  O resultado fica salvo em localStorage para o script inline do index.html
  aplicar antes da primeira pintura.
*/

export const BRAND_STORAGE_KEY = 'r8.brand'
export const DEFAULT_BRAND = '#275b3e'

export const BRAND_PRESETS = [
  { id: 'verde', label: 'Verde floresta', hex: '#275b3e' },
  { id: 'laranja', label: 'Laranja R8', hex: '#ee6a1c' },
  { id: 'azul', label: 'Azul', hex: '#2557c7' },
  { id: 'grafite', label: 'Grafite', hex: '#3b4048' },
] as const

/* superfícies de referência usadas nas garantias de contraste (iguais a tokens.css) */
const LIGHT_SURFACES = ['#ffffff', '#f5f6f8', '#e9ebee']
const DARK_SURFACES = ['#191d21', '#121518', '#0b0d0f']
const MIN = 4.5

/* ───── conversões sRGB <-> OKLab <-> OKLCH ───── */

type Lch = { l: number; c: number; h: number }
type Rgb = [number, number, number]

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let s = m[1]
  if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255) as Rgb
}

export function rgbToHex([r, g, b]: Rgb): string {
  const h = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function rgbToOklch(rgb: Rgb): Lch {
  const [r, g, b] = rgb.map(toLin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const c = Math.sqrt(A * A + B * B)
  let h = (Math.atan2(B, A) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: L, c, h }
}

function oklchToLinear({ l: L, c, h }: Lch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005)

/** OKLCH -> hex, reduzindo croma até caber em sRGB (preserva luminosidade e matiz). */
function oklchToHex(lch: Lch): string {
  const l = Math.min(1, Math.max(0, lch.l))
  let lo = 0
  let hi = lch.c
  if (inGamut(oklchToLinear({ ...lch, l }))) return rgbToHex(oklchToLinear({ ...lch, l }).map(toGam) as Rgb)
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (inGamut(oklchToLinear({ l, c: mid, h: lch.h }))) lo = mid
    else hi = mid
  }
  return rgbToHex(oklchToLinear({ l, c: lo, h: lch.h }).map(toGam) as Rgb)
}

/* ───── contraste WCAG 2.1 ───── */

export function luminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map(toLin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a)!
  const B = hexToRgb(b)!
  return rgbToHex([0, 1, 2].map((i) => A[i] * t + B[i] * (1 - t)) as Rgb)
}

const passesAll = (fg: string, bgs: string[]) => bgs.every((bg) => contrast(fg, bg) >= MIN)

/* ───── derivação ───── */

export type BrandVars = Record<string, string>

export interface BrandTheme {
  accent: string
  accentHover: string
  accentActive: string
  accentSoft: string
  accentInk: string
  onAccent: string
  onAccent2: string
}

/** Maior luminosidade (mesmo matiz e croma) em que o branco ainda tem >= 4,5:1. */
function maxLForWhite(c: number, h: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (contrast('#ffffff', oklchToHex({ l: mid, c, h })) >= MIN + 0.05) lo = mid
    else hi = mid
  }
  return lo
}

function onAccentSecondary(accent: string): string {
  // texto secundário sobre o acento: branco misturado ao acento, o mais suave que ainda passa
  for (let t = 0.72; t <= 1.0001; t += 0.02) {
    const c = mix('#ffffff', accent, t)
    if (contrast(c, accent) >= MIN) return c
  }
  return '#ffffff'
}

function deriveLight(base: Lch): BrandTheme {
  const lMax = maxLForWhite(base.c, base.h)
  const l = Math.min(base.l, lMax)
  const accent = oklchToHex({ ...base, l })
  const accentHover = oklchToHex({ ...base, l: Math.max(0.12, l - 0.045) })
  const accentActive = oklchToHex({ ...base, l: Math.max(0.1, l - 0.09) })
  const accentSoft = oklchToHex({ l: 0.955, c: Math.min(base.c * 0.3, 0.035), h: base.h })
  let inkL = Math.min(l, 0.46)
  const inkC = Math.min(base.c, 0.14)
  let accentInk = oklchToHex({ l: inkL, c: inkC, h: base.h })
  while (!passesAll(accentInk, [accentSoft, ...LIGHT_SURFACES]) && inkL > 0.05) {
    inkL -= 0.01
    accentInk = oklchToHex({ l: inkL, c: inkC, h: base.h })
  }
  return { accent, accentHover, accentActive, accentSoft, accentInk, onAccent: '#ffffff', onAccent2: onAccentSecondary(accent) }
}

function deriveDark(base: Lch): BrandTheme {
  const lMax = maxLForWhite(base.c, base.h)
  const light = Math.min(base.l, lMax)
  const l = Math.min(lMax, light + 0.07)
  const accent = oklchToHex({ ...base, l })
  const hoverL = l + 0.035 <= lMax ? l + 0.035 : l - 0.035
  const accentHover = oklchToHex({ ...base, l: hoverL })
  const accentActive = oklchToHex({ ...base, l: Math.max(0.1, l - 0.06) })
  const accentSoft = oklchToHex({ l: 0.285, c: Math.min(base.c * 0.45, 0.06), h: base.h })
  let inkL = 0.82
  const inkC = Math.min(base.c, 0.12)
  let accentInk = oklchToHex({ l: inkL, c: inkC, h: base.h })
  while (!passesAll(accentInk, [accentSoft, ...DARK_SURFACES]) && inkL < 0.99) {
    inkL += 0.01
    accentInk = oklchToHex({ l: inkL, c: inkC, h: base.h })
  }
  return { accent, accentHover, accentActive, accentSoft, accentInk, onAccent: '#ffffff', onAccent2: onAccentSecondary(accent) }
}

export function deriveBrand(hex: string): { light: BrandTheme; dark: BrandTheme } {
  const rgb = hexToRgb(hex) ?? hexToRgb(DEFAULT_BRAND)!
  const base = rgbToOklch(rgb)
  return { light: deriveLight(base), dark: deriveDark(base) }
}

const KEYS: [keyof BrandTheme, string][] = [
  ['accent', 'accent'],
  ['accentHover', 'accent-hover'],
  ['accentActive', 'accent-active'],
  ['accentSoft', 'accent-soft'],
  ['accentInk', 'accent-ink'],
  ['onAccent', 'on-accent'],
  ['onAccent2', 'on-accent-2'],
]

export function brandVars(hex: string): BrandVars {
  const { light, dark } = deriveBrand(hex)
  const out: BrandVars = {}
  for (const [k, name] of KEYS) {
    out[`--brand-l-${name}`] = light[k]
    out[`--brand-d-${name}`] = dark[k]
  }
  return out
}

export function normalizeHex(input: string): string | null {
  const rgb = hexToRgb(input)
  return rgb ? rgbToHex(rgb) : null
}

/** Aplica a cor da marca no :root (os dois temas) e persiste. Retorna o hex normalizado. */
export function applyBrand(hex: string, persist = true): string {
  const norm = normalizeHex(hex) ?? DEFAULT_BRAND
  const vars = brandVars(norm)
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  root.dataset.brand = norm
  if (persist) {
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify({ hex: norm, vars }))
    } catch {
      /* armazenamento indisponível: a cor vale só nesta sessão */
    }
  }
  return norm
}

export function getStoredBrand(): string {
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY)
    if (raw) {
      const hex = normalizeHex(JSON.parse(raw).hex ?? '')
      if (hex) return hex
    }
  } catch {
    /* ignora */
  }
  return DEFAULT_BRAND
}
