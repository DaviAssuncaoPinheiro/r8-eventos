// Etapa 4: ocorrências (opcional). Resolve avisos abertos e registra novos problemas.
import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, Check, CircleCheck, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { compressImage, newId } from '@/lib/photos'
import { OCC_KIND } from '@/lib/status'
import { relDays } from '@/data/time'
import type { OccKind } from '@/data/mock'
import { useDemo } from '@/store'
import { notify } from './campoStore'
import { cleanUnits, simNow } from './data'
import { Chip, EASE_OUT, Pressable, SafeImg } from './kit'
import { Block, CheckRow, StepFrame, StepIntro, TextArea, type StepProps } from './stepKit'

const KINDS = Object.keys(OCC_KIND) as OccKind[]

export function StepOcorrencias({ job, rental, draft, patch, layout, eyebrow }: StepProps) {
  const occurrences = useDemo((s) => s.occurrences)
  const photos = useDemo((s) => s.photos)
  const addPhoto = useDemo((s) => s.addPhoto)
  const open = occurrences.filter((o) => o.rentalId === rental.id && o.status === 'aberta')
  const units = cleanUnits(rental)
  const [unitId, setUnitId] = React.useState<string | undefined>(units[0]?.id)
  const [kind, setKind] = React.useState<OccKind>('avaria')
  const [note, setNote] = React.useState('')
  const [photoId, setPhotoId] = React.useState<string | undefined>()
  const fileRef = React.useRef<HTMLInputElement>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const src = await compressImage(file)
      const id = newId('ph')
      addPhoto({ id, jobId: job.id, rentalId: rental.id, unitId, date: simNow().toISOString(), src, label: `Ocorrência${unitId ? ` · ${unitId}` : ''}`, moment: 'avaria' })
      setPhotoId(id)
    } catch {
      notify({ kind: 'app', title: 'Não deu para ler a foto', body: 'Tente outra imagem.' })
    }
  }

  const add = () => {
    patch((d) => ({ occurrences: [...d.occurrences, { id: newId('oc'), unitId, kind, note: note.trim() || OCC_KIND[kind].label, photoId }] }))
    setNote('')
    setPhotoId(undefined)
  }

  const left = (
    <>
      {open.length > 0 && (
        <Block title="Avisos abertos" hint="Marque o que foi resolvido agora" bodyClassName="px-2.5">
          <div className="flex flex-col" data-noswipe>
            {open.map((o, i) => (
              <div key={o.id} className={cn(i > 0 && 'border-t border-line')}>
                <CheckRow
                  on={!!draft.resolved[o.id]}
                  onClick={() => patch((d) => ({ resolved: { ...d.resolved, [o.id]: !d.resolved[o.id] } }))}
                  title={
                    <>
                      <span className="num">{o.unitId}</span> · {OCC_KIND[o.kind].label}
                    </>
                  }
                  sub={`${o.source === 'qr' ? 'Aviso pelo QR' : 'Registro da equipe'}, ${relDays(o.at)}${o.note ? `. ${o.note}` : ''}`}
                  aside={draft.resolved[o.id] ? <span className="shrink-0 text-[12.5px] font-bold text-green">Resolvido</span> : undefined}
                />
              </div>
            ))}
          </div>
        </Block>
      )}

      <Block title="Nova ocorrência" hint="Avaria, vandalismo, falta de acesso">
        <div data-noswipe>
          {units.length > 0 && (
            <>
              <div className="text-[13px] font-semibold text-ink-3">Unidade</div>
              <div className="no-scrollbar -mx-5 mt-2 flex gap-1.5 overflow-x-auto px-5">
                {units.map((u) => (
                  <Chip key={u.id} size="sm" on={unitId === u.id} onClick={() => setUnitId(u.id)}>
                    <span className="num">{u.id}</span>
                  </Chip>
                ))}
              </div>
            </>
          )}
          <div className={cn('text-[13px] font-semibold text-ink-3', units.length > 0 && 'mt-4')}>Problema</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <Chip key={k} size="sm" on={kind === k} onClick={() => setKind(k)}>
                {OCC_KIND[k].short}
              </Chip>
            ))}
          </div>
          <TextArea className="mt-4" rows={2} value={note} onChange={(e) => setNote(e.target.value.slice(0, 240))} placeholder="O que aconteceu" />
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="sr-only" aria-label="Foto da ocorrência" />
          <div className="mt-3 flex gap-2">
            <Pressable onClick={() => fileRef.current?.click()} className={cn('inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-4 text-[14.5px] font-semibold', photoId ? 'bg-green-soft text-ink' : 'bg-muted text-ink')}>
              {photoId ? <Check className="size-4 text-green" strokeWidth={2.6} /> : <Camera className="size-4" strokeWidth={2.2} />}
              {photoId ? 'Foto anexada' : 'Foto'}
            </Pressable>
            <Pressable onClick={add} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-black text-[14.5px] font-semibold text-white">
              <Plus className="size-4 text-brand" strokeWidth={2.4} /> Registrar
            </Pressable>
          </div>
        </div>
      </Block>
    </>
  )

  const right = (
    <Block title="Registradas agora" hint={draft.occurrences.length ? `${draft.occurrences.length} neste serviço` : 'Nenhuma. Se estiver tudo certo, siga em frente.'}>
      {draft.occurrences.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[20px] bg-green-soft p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green text-white">
            <CircleCheck className="size-5" strokeWidth={2.2} />
          </span>
          <span className="text-[14px] font-semibold text-ink">Sem ocorrências</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {draft.occurrences.map((o) => {
              const ph = photos.find((p) => p.id === o.photoId)
              return (
                <motion.li key={o.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="flex items-center gap-3 rounded-[20px] bg-red-soft p-3">
                  {ph ? <SafeImg src={ph.src} alt={ph.label} className="size-12 shrink-0 rounded-[14px] object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-card text-[12px] font-bold text-red">{o.unitId?.split('-')[0] ?? '!'}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold text-ink">
                      {o.unitId && <span className="num">{o.unitId} · </span>}
                      {OCC_KIND[o.kind].label}
                    </div>
                    <div className="truncate text-[12.5px] font-medium text-ink-2">{o.note}</div>
                  </div>
                  <button onClick={() => patch((d) => ({ occurrences: d.occurrences.filter((x) => x.id !== o.id) }))} aria-label="Remover" className="flex size-9 shrink-0 items-center justify-center rounded-full text-red hover:bg-card">
                    <Trash2 className="size-4" strokeWidth={2} />
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </Block>
  )

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow={eyebrow} title="Ocorrências">
          Opcional
        </StepIntro>
      }
      left={left}
      right={right}
    />
  )
}
