/*
  Tema claro / escuro / sistema.
  A preferência fica em localStorage ("r8.theme"). O script inline do index.html aplica
  data-theme antes da primeira pintura; este módulo mantém o valor sincronizado depois.
*/
import { useEffect, useState } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'r8.theme'
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#e9ebee', dark: '#0b0d0f' }

const media = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* armazenamento indisponível */
  }
  return 'system'
}

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  if (pref === 'system') return media()?.matches ? 'dark' : 'light'
  return pref
}

export function applyTheme(pref: ThemePref, persist = true): ResolvedTheme {
  const resolved = resolveTheme(pref)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.dataset.themePref = pref
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved])
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref)
    } catch {
      /* ignora */
    }
  }
  return resolved
}

/** Hook: preferência atual, tema resolvido e setter. Acompanha a mudança do sistema. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => getThemePref())
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getThemePref()))

  useEffect(() => {
    setResolved(applyTheme(pref))
    if (pref !== 'system') return
    const mq = media()
    if (!mq) return
    const onChange = () => setResolved(applyTheme('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  return { pref, resolved, setPref }
}
