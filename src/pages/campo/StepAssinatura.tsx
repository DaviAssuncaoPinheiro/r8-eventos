// Etapa 5: assinatura do responsável no local
import * as React from 'react'
import { Camera, ClipboardCheck, Eraser, PenLine, TriangleAlert, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHECKLISTS } from '@/lib/history'
import { jobItems } from '@/lib/fieldkit'
import { useDemo } from '@/store'
import { checklistDone, itemsOk } from './campoStore'
import { cleanUnits } from './data'
import { useIsDesk } from './stepKit'
import { Block, StepFrame, StepIntro, TextInput, type StepProps } from './stepKit'

/** Área de assinatura com o dedo ou o mouse. Salva como PNG (data URL) ao soltar. */
export function SignaturePad({ value, onChange, height = 200 }: { value?: string; onChange: (v?: string) => void; height?: number }) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const drawing = React.useRef(false)
  const last = React.useRef<{ x: number; y: number } | null>(null)
  const [empty, setEmpty] = React.useState(!value)

  // ajusta a resolução ao tamanho real e redesenha a assinatura salva
  React.useLayoutEffect(() => {
    const c = ref.current
    if (!c) return
    const fit = () => {
      const r = c.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      c.width = Math.round(r.width * dpr)
      c.height = Math.round(r.height * dpr)
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2.6
      ctx.strokeStyle = '#111214'
      if (value) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0, r.width, r.height)
        img.src = value
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(c)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent) => {
    e.preventDefault()
    ref.current!.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pos(e)
    const ctx = ref.current!.getContext('2d')!
    ctx.beginPath()
    ctx.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#111214'
    ctx.fill()
    setEmpty(false)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return
    const p = pos(e)
    const ctx = ref.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    onChange(ref.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = ref.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
    onChange(undefined)
  }

  return (
    <div className="relative" data-noswipe>
      <canvas
        ref={ref}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label="Área de assinatura"
        className="block w-full touch-none rounded-[22px] bg-surface ring-1 ring-line ring-inset"
        style={{ height }}
      />
      <div className="pointer-events-none absolute inset-x-6 bottom-12 border-b border-dashed border-line-2" />
      {empty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[14px] font-semibold text-ink-4">
          <PenLine className="size-4" strokeWidth={2} /> Assine aqui
        </div>
      )}
      {!empty && (
        <button onClick={clear} className="absolute top-2.5 right-2.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-[13px] font-semibold text-ink shadow-pill">
          <Eraser className="size-3.5" strokeWidth={2.2} /> Limpar
        </button>
      )}
    </div>
  )
}

export function StepAssinatura({ job, rental, draft, patch, layout, eyebrow }: StepProps) {
  const desk = useIsDesk() || layout === 'desktop'
  const photos = useDemo((s) => s.photos).filter((p) => p.jobId === job.id)
  const units = cleanUnits(rental)
  const conf = job.type === 'Montagem' || job.type === 'Retirada'
  const unitsDone = units.filter((u) => draft.units[u.id]).length
  const items = jobItems(job)

  const rows = [
    conf
      ? { icon: ClipboardCheck, label: 'Conferência', value: `${itemsOk(job, draft)} de ${items.length}`, warn: itemsOk(job, draft) < items.length }
      : { icon: ClipboardCheck, label: job.type === 'Manutenção' ? 'Unidade' : 'Unidades', value: `${unitsDone} de ${units.length}`, warn: job.type === 'Limpeza' && unitsDone < units.length },
    { icon: Wrench, label: 'Checklist', value: `${checklistDone(job, draft)} de ${CHECKLISTS[job.type].length}`, warn: checklistDone(job, draft) < CHECKLISTS[job.type].length },
    { icon: Camera, label: 'Fotos', value: String(photos.length), warn: photos.length === 0 },
    { icon: TriangleAlert, label: 'Ocorrências', value: String(draft.occurrences.length), warn: false },
  ]
  const pending = rows.filter((r) => r.warn)

  const left = (
    <Block title="Responsável no local" hint="Quem confere o serviço">
      <div className="flex flex-col gap-2.5">
        <TextInput value={draft.signer} onChange={(e) => patch({ signer: e.target.value })} placeholder="Nome" aria-label="Nome do responsável" />
        <TextInput value={draft.role} onChange={(e) => patch({ role: e.target.value })} placeholder="Função" aria-label="Função" />
      </div>
      <div className="mt-4">
        <SignaturePad value={draft.signature} onChange={(v) => patch({ signature: v })} height={desk ? 220 : 200} />
      </div>
      <p className="mt-2.5 text-[12.5px] font-medium text-ink-3">A assinatura aparece no relatório do cliente com data e hora.</p>
    </Block>
  )

  const right = (
    <Block title="Resumo" hint="Antes de finalizar">
      <ul className="flex flex-col">
        {rows.map((r, i) => (
          <li key={r.label} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', r.warn ? 'bg-yellow-soft text-yellow-ink' : 'bg-muted text-ink')}>
              <r.icon className="size-4" strokeWidth={2} />
            </span>
            <span className="flex-1 text-[14.5px] font-semibold text-ink">{r.label}</span>
            <span className={cn('num text-[14.5px] font-bold', r.warn ? 'text-yellow-ink' : 'text-ink')}>{r.value}</span>
          </li>
        ))}
      </ul>
      {pending.length > 0 ? (
        <p className="mt-3 rounded-[16px] bg-yellow-soft px-3.5 py-2.5 text-[13px] leading-snug font-semibold text-yellow-ink">
          Dá para finalizar assim. O que ficou incompleto aparece no relatório.
        </p>
      ) : (
        <p className="mt-3 rounded-[16px] bg-green-soft px-3.5 py-2.5 text-[13px] font-semibold text-ink">Tudo registrado.</p>
      )}
    </Block>
  )

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow={eyebrow} title="Assinatura">
          {rental.contact.role === 'Cerimonialista' || rental.kind === 'evento' ? 'Responsável pelo evento' : 'Responsável da obra'}
        </StepIntro>
      }
      left={left}
      right={right}
    />
  )
}
