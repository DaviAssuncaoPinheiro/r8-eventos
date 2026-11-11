import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn, Input, Segmented, TooltipProvider } from '@/ui'
import { useTheme, type ThemePref } from '@/lib/theme'
import { applyBrand, BRAND_PRESETS, getStoredBrand, normalizeHex } from '@/lib/brand'
import { DsVersion } from './kit'
import { DS_GROUPS } from './registry'

function BrandPicker({ onChange }: { onChange: () => void }) {
  const [hex, setHex] = React.useState(() => getStoredBrand())
  const [draft, setDraft] = React.useState(hex)
  const valid = normalizeHex(draft)

  const set = (h: string) => {
    const n = applyBrand(h)
    setHex(n)
    setDraft(n)
    onChange()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Cor da marca" className="flex items-center gap-1.5">
        {BRAND_PRESETS.map((p) => {
          const on = p.hex === hex
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={p.label}
              title={p.label}
              onClick={() => set(p.hex)}
              className={cn(
                'grid size-8 place-items-center rounded-pill transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:size-11',
                on ? 'shadow-[0_0_0_2px_var(--panel),0_0_0_4px_var(--fg)]' : 'hover:shadow-[0_0_0_2px_var(--panel),0_0_0_4px_var(--edge)]',
              )}
            >
              <span className="block size-6 rounded-pill" style={{ background: p.hex }} />
            </button>
          )
        })}
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) set(valid)
        }}
      >
        <label htmlFor="ds-hex" className="sr-only">
          Cor da marca em hexadecimal
        </label>
        <Input
          id="ds-hex"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            const n = normalizeHex(e.target.value)
            if (n && e.target.value.replace('#', '').length === 6) set(n)
          }}
          invalid={!valid}
          prefix={<span aria-hidden className="block size-4 rounded-[4px]" style={{ background: valid ?? 'transparent' }} />}
          className="w-[132px]"
          spellCheck={false}
          autoComplete="off"
          aria-label="Cor da marca em hexadecimal"
        />
      </form>
    </div>
  )
}

export default function DesignSystem() {
  const { pref, setPref } = useTheme()
  const [version, setVersion] = React.useState(0)
  const bump = React.useCallback(() => setVersion((v) => v + 1), [])

  React.useEffect(() => {
    document.title = 'Design system'
    applyBrand(getStoredBrand(), false)
  }, [])
  React.useEffect(bump, [pref, bump])

  return (
    <TooltipProvider>
      <DsVersion.Provider value={version}>
        <div className="ds-root min-h-dvh bg-app p-0 lg:p-3">
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-control focus:bg-raised focus:px-4 focus:py-2"
          >
            Pular para o conteúdo
          </a>
          <div className="mx-auto flex max-w-[1600px] gap-3">
            {/* índice lateral fixo */}
            <aside className="sticky top-3 hidden h-[calc(100dvh-24px)] w-[232px] shrink-0 flex-col rounded-panel bg-panel lg:flex">
              <div className="flex h-16 items-center gap-2.5 px-5">
                <span className="grid size-8 place-items-center rounded-control bg-accent text-body font-bold text-on-accent">DS</span>
                <span className="text-title-card">Design system</span>
              </div>
              <nav aria-label="Índice" className="flex-1 overflow-y-auto px-3 pb-4">
                {DS_GROUPS.map((g) => (
                  <div key={g.title} className="mt-4 first:mt-1">
                    <div className="px-3 pb-1 text-caption font-semibold text-fg-3">{g.title}</div>
                    <ul>
                      {g.items.map((it) => (
                        <li key={it.id}>
                          <a
                            href={`#${it.id}`}
                            className="flex h-9 items-center rounded-control px-3 text-body text-fg-2 no-underline transition-[background-color,color] duration-150 hover:bg-hover hover:text-fg"
                          >
                            {it.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 flex-1">
              {/* a faixa em bg-app cobre o vão de 12px, para o conteúdo não aparecer acima nem atrás do topo ao rolar */}
              <div className="z-40 bg-app lg:sticky lg:top-0 lg:pt-3 lg:pb-3">
              <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-app px-4 py-3 lg:rounded-panel lg:bg-panel lg:px-6">
                <div className="min-w-0">
                  <h1 className="text-title-page">Design system</h1>
                  <p className="text-caption text-fg-3">Tokens, componentes e regras do produto. Versão 2.0, 11/11/2026.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Segmented<ThemePref>
                    label="Tema"
                    value={pref}
                    onChange={setPref}
                    options={[
                      { value: 'light', label: 'Claro', icon: Sun },
                      { value: 'dark', label: 'Escuro', icon: Moon },
                      { value: 'system', label: 'Sistema', icon: Monitor },
                    ]}
                  />
                  <BrandPicker onChange={bump} />
                </div>
              </header>
              </div>

              {/* índice horizontal no celular */}
              <nav aria-label="Índice" className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
                {DS_GROUPS.flatMap((g) => g.items).map((it) => (
                  <a key={it.id} href={`#${it.id}`} className="flex h-11 shrink-0 items-center rounded-control px-3 text-body text-fg-2 no-underline hover:bg-hover">
                    {it.title}
                  </a>
                ))}
              </nav>

              <main id="conteudo" className="mt-0 rounded-none bg-panel px-4 py-6 lg:rounded-panel lg:px-8 lg:py-8">
                {DS_GROUPS.map((g) => (
                  <div key={g.title} className="mb-6">
                    {g.items.map(({ id, Component }) => (
                      <Component key={id} />
                    ))}
                  </div>
                ))}
              </main>
            </div>
          </div>
        </div>
      </DsVersion.Provider>
    </TooltipProvider>
  )
}
