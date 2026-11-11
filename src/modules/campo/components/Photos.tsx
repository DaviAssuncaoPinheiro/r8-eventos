import * as React from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/ui'
import { AddPhoto, PhotoThumb, PhotoViewer } from '@/ui/Photo'
import { notify } from '@/ui/Toast'
import { EXAMPLE_PHOTOS, newId } from '../lib'
import type { DraftPhoto } from '../store'

/** Lê a foto do aparelho e devolve uma miniatura JPEG em data URL (cabe no localStorage). */
export function compressImage(file: File, maxSide = 640, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.width * scale))
      c.height = Math.max(1, Math.round(img.height * scale))
      const ctx = c.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return reject(new Error('canvas'))
      }
      ctx.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('imagem'))
    }
    img.src = url
  })
}

/** Fotos escolhidas na câmera ou nos arquivos, já reduzidas. */
export function usePhotoPicker(make: (src: string) => DraftPhoto, onAdd: (p: DraftPhoto[]) => void) {
  const [busy, setBusy] = React.useState(false)
  const onFiles = React.useCallback(
    async (files: File[]) => {
      setBusy(true)
      try {
        const out: DraftPhoto[] = []
        for (const f of files) out.push(make(await compressImage(f)))
        onAdd(out)
      } catch {
        notify.error('Não foi possível ler a foto. Tente de novo.')
      } finally {
        setBusy(false)
      }
    },
    [make, onAdd],
  )
  return { busy, onFiles }
}

export function nextExample(used: string[]): string {
  return EXAMPLE_PHOTOS.find((p) => !used.includes(p)) ?? EXAMPLE_PHOTOS[used.length % EXAMPLE_PHOTOS.length]
}

export function newPhoto(src: string, label: string, moment: DraftPhoto['moment']): DraftPhoto {
  return { id: newId('ph'), src, label, moment }
}

/** Grade de fotos com remover em cada uma, câmera e atalho de foto de exemplo. */
export function PhotoPicker({ photos, onChange, label, moment, max = 12 }: { photos: DraftPhoto[]; onChange: (p: DraftPhoto[]) => void; label: string; moment: DraftPhoto['moment']; max?: number }) {
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const back = React.useRef<HTMLElement | null>(null)
  const { busy, onFiles } = usePhotoPicker(
    (src) => newPhoto(src, label, moment),
    (add) => onChange([...photos, ...add].slice(0, max)),
  )
  const full = photos.length >= max
  return (
    <div>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
        {photos.map((p, i) => (
          <li key={p.id} className="relative aspect-square">
            <PhotoThumb
              src={p.src}
              alt={`${p.label}, foto ${i + 1}`}
              size={96}
              className="size-full"
              onClick={(e) => {
                back.current = e.currentTarget
                setIndex(i)
                setOpen(true)
              }}
            />
            {max > 1 ? <span className="pointer-events-none absolute bottom-1 left-1 rounded-pill bg-inverse/80 px-2 py-0.5 text-caption font-semibold text-on-inverse">{p.label}</span> : null}
            <button
              type="button"
              aria-label={`Remover foto ${i + 1}`}
              onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
              className="ds-hit absolute top-1 right-1 inline-flex size-9 items-center justify-center rounded-pill bg-inverse/80 text-on-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
        {!full ? (
          <li className="aspect-square">
            <AddPhoto onFiles={onFiles} loading={busy} label="Foto" className="size-full" />
          </li>
        ) : null}
      </ul>
      <Button
        variant="secondary"
        size="field"
        icon={ImagePlus}
        block
        className="mt-3"
        disabled={full}
        onClick={() => onChange([...photos, newPhoto(nextExample(photos.map((p) => p.src)), label, moment)])}
      >
        Usar foto de exemplo
      </Button>
      <PhotoViewer photos={photos.map((p, i) => ({ id: p.id, src: p.src, alt: `${p.label}, foto ${i + 1}` }))} index={index} open={open} onIndexChange={setIndex} onOpenChange={setOpen} returnFocusRef={back} />
    </div>
  )
}
