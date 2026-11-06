// Etapa 3: fotos do serviço (antes e depois, instalação, estado das unidades)
import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { compressImage, newId } from '@/lib/photos'
import { PRODUCT, type Job } from '@/data/mock'
import { useDemo, type JobPhoto } from '@/store'
import { notify, queueIfOffline } from './campoStore'
import { cleanUnits, coverPhoto } from './data'
import { Chip, EASE_OUT, Pressable, SafeImg, usePhone } from './kit'
import { Block, StepFrame, StepIntro, type StepProps } from './stepKit'

type Moment = JobPhoto['moment']

/** Momentos de foto por tipo de serviço */
export function momentsFor(job: Job): { id: Moment; label: string }[] {
  if (job.type === 'Limpeza') return [{ id: 'antes', label: 'Antes' }, { id: 'depois', label: 'Depois' }]
  if (job.type === 'Montagem') return [{ id: 'instalacao', label: 'Instalação' }]
  if (job.type === 'Retirada') return [{ id: 'antes', label: 'Estado das unidades' }, { id: 'depois', label: 'Local entregue' }]
  return [{ id: 'antes', label: 'Defeito' }, { id: 'depois', label: 'Consertado' }]
}

export function StepFotos({ job, rental, layout, eyebrow }: StepProps) {
  const { desktop } = usePhone()
  const stored = useDemo((s) => s.photos)
  const addPhoto = useDemo((s) => s.addPhoto)
  const removePhoto = useDemo((s) => s.removePhoto)
  const moments = momentsFor(job)
  const [moment, setMoment] = React.useState<Moment>(moments[0].id)
  const units = job.type === 'Limpeza' || job.type === 'Manutenção' ? cleanUnits(rental) : []
  const [unitId, setUnitId] = React.useState<string | undefined>(undefined)
  const [busy, setBusy] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const current = stored.filter((p) => p.jobId === job.id)
  const momentLabel = (m: Moment) => moments.find((x) => x.id === m)?.label ?? m

  const save = (src: string) => {
    addPhoto({ id: newId('ph'), jobId: job.id, rentalId: rental.id, unitId, date: new Date().toISOString(), src, label: `${momentLabel(moment)}${unitId ? ` · ${unitId}` : ''}`, moment })
    queueIfOffline()
    // depois de "Antes", sugere "Depois"
    const idx = moments.findIndex((m) => m.id === moment)
    if (moments[idx + 1] && !current.some((p) => p.moment === moments[idx + 1].id)) setMoment(moments[idx + 1].id)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      save(await compressImage(file))
    } catch {
      notify({ kind: 'app', title: 'Não deu para ler a foto', body: 'Tente outra imagem.' })
    } finally {
      setBusy(false)
    }
  }

  const before = [...current].reverse().find((p) => p.moment === 'antes')
  const after = [...current].reverse().find((p) => p.moment === 'depois')

  const left = (
    <>
      <Block title="Momento" hint={job.type === 'Limpeza' ? 'Antes e depois aparecem lado a lado no relatório' : 'As fotos vão para o relatório do cliente'}>
        <div className="flex flex-wrap gap-2" data-noswipe>
          {moments.map((m) => (
            <Chip key={m.id} size="sm" on={moment === m.id} onClick={() => setMoment(m.id)}>
              {m.label}
              {current.some((p) => p.moment === m.id) && <span className={cn('size-1.5 rounded-full', moment === m.id ? 'bg-brand' : 'bg-green')} />}
            </Chip>
          ))}
        </div>
        {units.length > 0 && (
          <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5" data-noswipe>
            <Chip size="sm" on={!unitId} onClick={() => setUnitId(undefined)}>
              Geral
            </Chip>
            {units.map((u) => (
              <Chip key={u.id} size="sm" on={unitId === u.id} onClick={() => setUnitId(u.id)}>
                <span className="num">{u.id}</span>
              </Chip>
            ))}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="sr-only" aria-label="Tirar foto" data-testid="photo-input" />
        <Pressable
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-4 flex h-[64px] w-full items-center justify-center gap-3 rounded-full bg-black text-[17px] font-semibold text-white disabled:opacity-70"
        >
          {busy ? (
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex size-5 rounded-full border-2 border-white/30 border-t-brand" />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white">
              <Camera className="size-5" strokeWidth={2.2} />
            </span>
          )}
          {busy ? 'Processando' : `Foto: ${momentLabel(moment).toLowerCase()}`}
        </Pressable>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-ink-3">
          {desktop && <span>No computador abre a escolha de arquivo.</span>}
          <button onClick={() => save(coverPhoto(job))} className="font-semibold text-ink underline decoration-ink-4 underline-offset-2 hover:decoration-ink">
            Usar foto de exemplo
          </button>
        </div>
      </Block>

      <Block title="Deste serviço" hint={current.length ? `${current.length} ${current.length === 1 ? 'foto' : 'fotos'}` : 'Nenhuma ainda'}>
        {current.length === 0 ? (
          <button onClick={() => inputRef.current?.click()} className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-line-2 text-[13.5px] font-semibold text-ink-3 hover:bg-surface">
            <ImagePlus className="size-5" strokeWidth={2} /> As fotos aparecem aqui
          </button>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            <AnimatePresence initial={false}>
              {[...current].reverse().map((p) => (
                <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="relative aspect-square overflow-hidden rounded-[18px] bg-muted">
                  <SafeImg src={p.src} alt={p.label} className="size-full object-cover" />
                  <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold text-ink backdrop-blur-md">{p.label}</span>
                  <button onClick={() => removePhoto(p.id)} aria-label="Remover foto" className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black">
                    <X className="size-3.5" strokeWidth={2.6} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Block>
    </>
  )

  const right =
    moments.length > 1 ? (
      <Block title="Comparar" hint={`${moments[0].label} e ${moments[1].label.toLowerCase()}`}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { m: moments[0], p: before },
            { m: moments[1], p: after },
          ].map(({ m, p }, i) =>
            p ? (
              <div key={m.id} className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-muted">
                <SafeImg src={p.src} alt={p.label} className="size-full object-cover" />
                <span className={cn('absolute top-2 left-2 inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-bold', i === 0 ? 'bg-black text-white' : 'bg-brand text-white')}>{m.label}</span>
              </div>
            ) : (
              <button
                key={m.id}
                onClick={() => {
                  setMoment(m.id)
                  inputRef.current?.click()
                }}
                className={cn('flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[20px] text-[13.5px] font-semibold text-ink', i === 0 ? 'bg-muted hover:bg-muted-2' : 'bg-brand-soft hover:bg-brand/20')}
              >
                <span className={cn('flex size-11 items-center justify-center rounded-full', i === 0 ? 'bg-card shadow-pill' : 'bg-brand text-white')}>
                  <Camera className="size-5" strokeWidth={2.2} />
                </span>
                {m.label}
              </button>
            ),
          )}
        </div>
        <p className="mt-3 text-[13px] font-medium text-ink-3">{before && after ? 'O cliente vê as duas lado a lado no relatório.' : 'Use o mesmo ângulo nas duas fotos.'}</p>
      </Block>
    ) : (
      <Block title="Dica" hint={PRODUCT[rental.items[0].productId].short}>
        <div className="flex items-center gap-3 rounded-[20px] bg-surface p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill">
            <Camera className="size-[18px]" strokeWidth={2} />
          </span>
          <span className="text-[13.5px] font-medium text-ink-2">Uma foto de longe mostrando tudo montado e uma de perto da sinalização. O cliente recebe as duas.</span>
        </div>
      </Block>
    )

  return <StepFrame layout={layout} intro={<StepIntro eyebrow={eyebrow} title="Fotos">{job.type === 'Limpeza' ? 'Antes e depois' : 'Registro do local'}</StepIntro>} left={left} right={right} />
}
