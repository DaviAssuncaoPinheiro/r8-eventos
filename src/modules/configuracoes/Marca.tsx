import * as React from 'react'
import { Check, ClipboardList, ExternalLink, House, ImagePlus, Play, Sparkles, Trash2, TriangleAlert, UserRound } from 'lucide-react'
import { motion, useAnimationControls } from 'motion/react'
import { Button, Field, Input, cn, notify } from '@/ui'
import { Stagger, reduced } from '@/ui/Motion'
import { BRAND_PRESETS, applyBrand, normalizeHex } from '@/lib/brand'
import { formatDate, formatMoney } from '@/lib/format'
import { today } from '@/domain/dates'
import { getPortal, setBrand, useQuery, useSettings } from '@/services'
import { BrandMark } from '../portal/components/PublicShell'

const MAX = 256

/** Lê o arquivo e devolve um PNG com no máximo 256px no maior lado (data URL pequena) */
function resizeLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const w0 = img.naturalWidth || img.width || MAX
      const h0 = img.naturalHeight || img.height || MAX
      const k = Math.min(1, MAX / Math.max(w0, h0))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(w0 * k))
      c.height = Math.max(1, Math.round(h0 * k))
      const ctx = c.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) return reject(new Error('canvas'))
      ctx.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('imagem'))
    }
    img.src = url
  })
}

/* ───── prévias desenhadas com os mesmos blocos das telas reais ───── */

function MiniFrame({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={cn('m-0 flex min-w-0 flex-col gap-3', className)}>
      <figcaption className="text-body font-semibold text-fg-2">{title}</figcaption>
      <div aria-hidden {...{ inert: '' }} className="pointer-events-none flex flex-1 flex-col rounded-panel bg-app p-4 ring-1 ring-edge ring-inset transition-colors duration-[250ms] [&_*]:transition-[background-color,color,box-shadow] [&_*]:duration-[250ms] [&_*]:ease-[var(--ease-ui)]">
        {children}
      </div>
    </figure>
  )
}

function MiniPortal({ name, logo, client, units, cleanings, open }: { name: string; logo?: string; client: string; units: number; cleanings: number; open: number }) {
  return (
    <MiniFrame title="Portal do cliente">
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <BrandMark company={{ name, logoDataUrl: logo }} size={32} />
        <span className="min-w-0 flex-1 truncate text-body font-semibold">{name}</span>
        <span className="max-w-[40%] truncate text-caption text-fg-2">{client}</span>
      </div>
      <div className="ds-hero ds-hero-card rounded-card p-4">
        <p className="truncate text-title-card">Olá, {client}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <p className="tnum text-title-section">{units}</p>
            <p className="text-caption text-on-accent-2">No local</p>
          </div>
          <div>
            <p className="tnum text-title-section">{cleanings}</p>
            <p className="text-caption text-on-accent-2">No mês</p>
          </div>
          <div className="min-w-0">
            <p className="tnum truncate text-body-lg font-semibold leading-[28px]">{formatMoney(open).replace(/,\d{2}$/, '')}</p>
            <p className="text-caption text-on-accent-2">Em aberto</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-card bg-raised p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent-ink">
          <Sparkles size={20} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold">Limpeza</span>
          <span className="tnum block text-caption text-fg-2">{formatDate(today())}</span>
        </span>
        <img src="/produtos/banheiro-quimico.jpg" alt="" className="size-12 shrink-0 rounded-control object-cover" />
      </div>
      <div className="mt-3 flex h-12 items-center justify-center rounded-pill bg-accent text-body font-semibold text-on-accent">
        Pagar com Pix
      </div>
    </MiniFrame>
  )
}

function MiniCampo({ name, logo }: { name: string; logo?: string }) {
  return (
    <MiniFrame title="App da equipe de rua">
      <div className="flex items-center gap-2 px-1 pb-3">
        <BrandMark company={{ name, logoDataUrl: logo }} size={28} />
        <span className="min-w-0 flex-1 truncate text-body font-semibold">Hoje</span>
      </div>
      <div className="ds-hero rounded-card p-4">
        <span className="inline-flex rounded-pill bg-on-accent px-2.5 py-0.5 text-caption font-semibold text-accent-active">Próximo, 10:30</span>
        <p className="mt-2 text-title-card">Limpeza, 12 unidades</p>
        <div className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-pill bg-on-accent text-body font-semibold text-accent-active">
          <Play size={18} strokeWidth={2} aria-hidden />
          Iniciar serviço
        </div>
      </div>
      <div className="mt-3 rounded-card bg-raised p-4">
        <p className="text-body font-semibold">Seu dia</p>
        <div className="mt-2 flex gap-1.5">
          <span className="h-3 flex-1 rounded-pill bg-accent" />
          <span className="h-3 flex-1 rounded-pill bg-accent" />
          <span className="h-3 flex-1 rounded-pill bg-accent-soft ring-2 ring-accent ring-inset" />
          <span className="ds-hatch h-3 flex-1 rounded-pill bg-sunken" />
        </div>
      </div>
      <div className="mt-auto grid grid-cols-4 gap-1 pt-3">
        {[House, ClipboardList, TriangleAlert, UserRound].map((I, i) => (
          <span key={i} className={cn('grid h-10 place-items-center rounded-pill', i === 0 ? 'bg-accent-soft text-accent-ink' : 'text-fg-2')}>
            <I size={20} strokeWidth={2} />
          </span>
        ))}
      </div>
    </MiniFrame>
  )
}

export default function Marca() {
  const s = useSettings()
  const [hex, setHex] = React.useState(s.brandHex)
  const [busy, setBusy] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const portal = useQuery(() => getPortal('construtora-aurora'), [])

  React.useEffect(() => setHex(s.brandHex), [s.brandHex])

  /* a troca de cor faz as prévias "respirarem": leve pulso de escala, além da transição de cor */
  const breathe = useAnimationControls()
  const firstBrand = React.useRef(true)
  React.useEffect(() => {
    if (firstBrand.current) {
      firstBrand.current = false
      return
    }
    if (!reduced()) void breathe.start({ scale: [1, 1.018, 1], transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } })
  }, [s.brandHex, breathe])

  const norm = normalizeHex(hex)
  const invalid = hex.trim() !== '' && !/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim())
  const current = s.brandHex.toLowerCase()

  /** Aplica na hora em todo o sistema e grava nas configurações */
  const apply = async (next: string, logo?: string | null) => {
    const before = current
    applyBrand(next)
    setBusy(true)
    try {
      await setBrand(next, logo)
    } catch {
      applyBrand(before)
      setHex(before)
      notify.error('Não foi possível salvar a marca. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  const onType = (v: string) => {
    setHex(v)
    const n = normalizeHex(v)
    if (n && n !== current && /^#?[0-9a-f]{6}$/i.test(v.trim())) void apply(n)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const data = await resizeLogo(f)
      await apply(current, data)
      notify.success('Logo atualizado')
    } catch {
      notify.error('Não foi possível usar esta imagem. Envie um PNG ou JPG.')
    }
  }

  const pd = portal.data
  const openTotal = pd ? pd.invoices.filter((i) => i.status === 'aberta' || i.status === 'atrasada').reduce((a, i) => a + i.value, 0) : 0

  return (
    <Stagger className="grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
      <section aria-label="Marca" className="flex min-w-0 flex-col gap-6 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-5">
        <div>
          <h2 className="text-title-sub">Logo</h2>
          <div className="mt-3 flex items-center gap-4">
            <BrandMark company={{ name: s.company.name, logoDataUrl: s.logoDataUrl }} size={72} className="rounded-card text-title-sub" />
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" tabIndex={-1} aria-label="Arquivo do logo" onChange={onFile} />
              <Button variant="secondary" icon={ImagePlus} loading={busy} onClick={() => fileRef.current?.click()}>
                Enviar logo
              </Button>
              {s.logoDataUrl ? (
                <Button
                  variant="ghost"
                  icon={Trash2}
                  onClick={async () => {
                    await apply(current, null)
                    notify.success('Logo removido')
                  }}
                >
                  Remover
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-title-sub">Cor</h2>
          <ul role="radiogroup" aria-label="Cores prontas" className="m-0 mt-3 flex list-none flex-wrap gap-3 p-0">
            {BRAND_PRESETS.map((p) => {
              const on = current === p.hex
              return (
                <li role="none" key={p.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={p.label}
                    onClick={() => void apply(p.hex)}
                    style={{ backgroundColor: p.hex }}
                    className={cn(
                      'ds-touch ds-touch-sq grid size-14 place-items-center rounded-pill text-white transition-transform duration-150 ease-[var(--ease-ui)] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      on && 'ring-2 ring-fg ring-offset-2 ring-offset-[var(--raised)]',
                    )}
                  >
                    {on ? <Check size={24} strokeWidth={2.5} aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex items-end gap-3">
            <Field label="Outra cor" error={invalid ? 'Use o formato #f04e0a.' : undefined} className="flex-1">
              <Input
                value={hex}
                onChange={(e) => onType(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                maxLength={7}
                prefix={<span aria-hidden className="block size-5 rounded-pill ring-1 ring-edge ring-inset" style={{ backgroundColor: norm ?? current }} />}
              />
            </Field>
          </div>
        </div>

        <div className="mt-auto">
          <Button variant="secondary" size="lg" block icon={ExternalLink} onClick={() => window.open('/portal/construtora-aurora', '_blank', 'noopener')}>
            Abrir portal de exemplo
          </Button>
        </div>
      </section>

      <section aria-label="Prévia ao vivo" className="flex min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-7">
        <h2 className="text-title-sub">Prévia</h2>
        <motion.div animate={breathe} className="mt-4 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
          <MiniPortal name={s.company.name} logo={s.logoDataUrl} client={pd?.client.name ?? 'Construtora Aurora'} units={pd ? new Set(pd.activeRentals.flatMap((r) => r.units.map((u) => u.id))).size : 0} cleanings={pd?.monthlyReport.cleanings.length ?? 0} open={openTotal} />
          <MiniCampo name={s.company.name} logo={s.logoDataUrl} />
        </motion.div>
      </section>
    </Stagger>
  )
}
