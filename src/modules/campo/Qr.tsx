import * as React from 'react'
import { QrCode, ScanLine } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button, Field, Input } from '@/ui'
import { CampoScreen } from './components/Screen'
import { UnitSheet } from './components/UnitSheet'
import { useBack, useCampoDay, useUnits } from './lib'

const corner = 'absolute size-10 border-accent'

export default function Qr() {
  const back = useBack('/campo')
  const reduced = useReducedMotion()
  const { services, next } = useCampoDay()
  const units = useUnits()
  const current = services.find((s) => s.status === 'em_andamento') ?? services.find((s) => s.status === 'a_caminho') ?? next
  const [text, setText] = React.useState('')
  const [error, setError] = React.useState('')
  const [code, setCode] = React.useState<string | null>(null)
  const cycle = React.useRef(0)

  const choices = current?.unitCodes.length ? current.unitCodes : units.units.filter((u) => u.status === 'em_campo').slice(0, 6).map((u) => u.code)

  const open = (raw: string) => {
    const u = units.find(raw)
    if (!u) {
      setError('Código não encontrado')
      return
    }
    setError('')
    setCode(u.code)
  }

  return (
    <CampoScreen title="Escanear QR" onBack={back}>
      <button
        type="button"
        aria-label="Ler o QR da unidade"
        onClick={() => {
          if (!choices.length) return
          open(choices[cycle.current++ % choices.length])
        }}
        className="relative block aspect-[4/3] w-full overflow-hidden rounded-card bg-inverse text-on-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <QrCode aria-hidden size={96} strokeWidth={1.25} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
        <span aria-hidden className={`${corner} top-5 left-5 rounded-tl-2xl border-t-4 border-l-4`} />
        <span aria-hidden className={`${corner} top-5 right-5 rounded-tr-2xl border-t-4 border-r-4`} />
        <span aria-hidden className={`${corner} bottom-5 left-5 rounded-bl-2xl border-b-4 border-l-4`} />
        <span aria-hidden className={`${corner} right-5 bottom-5 rounded-br-2xl border-r-4 border-b-4`} />
        <motion.span
          aria-hidden
          className="absolute inset-x-8 h-0.5 rounded-pill bg-accent shadow-[0_0_14px_2px_var(--accent)]"
          initial={{ top: '18%' }}
          animate={reduced ? { top: '50%' } : { top: ['18%', '82%'] }}
          transition={reduced ? undefined : { duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        />
        <span className="absolute inset-x-0 bottom-3 flex justify-center">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-on-inverse/15 px-4 text-body font-semibold">
            <ScanLine size={18} strokeWidth={2} aria-hidden />
            Ler agora
          </span>
        </span>
      </button>

      <form
        className="mt-4 rounded-card bg-raised p-4"
        onSubmit={(e) => {
          e.preventDefault()
          open(text)
        }}
      >
        <Field label="Digitar código" error={error || undefined}>
          <Input
            size="lg"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError('')
            }}
            placeholder="BQ-0142"
            autoCapitalize="characters"
            autoComplete="off"
            enterKeyHint="go"
          />
        </Field>
        <Button type="submit" variant="primary" size="field" block className="mt-3" disabled={!text.trim()}>
          Abrir ficha
        </Button>
      </form>

      {choices.length ? (
        <section aria-label="Unidades do serviço" className="mt-5">
          <h2 className="mb-2 px-1 text-title-sub">{current ? `${current.typeLabel}, ${current.clientName}` : 'Em campo'}</h2>
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {choices.slice(0, 12).map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => open(c)}
                  className="tnum inline-flex h-12 items-center rounded-pill bg-raised px-5 text-body-lg font-semibold transition-[background-color,transform] duration-150 hover:bg-hover active:translate-y-px active:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <UnitSheet code={code} onClose={() => setCode(null)} />
    </CampoScreen>
  )
}
