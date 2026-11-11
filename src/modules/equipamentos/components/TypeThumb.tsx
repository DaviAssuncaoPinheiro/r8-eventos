import * as React from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/ui'

/** Foto do tipo de equipamento, sempre `object-cover`. Se a imagem falhar, mostra um quadro neutro. */
/* Tipos que dividem a mesma foto do acervo ganham enquadramentos diferentes */
const FRAME: Record<string, { scale: number; origin: string }> = {
  pcd: { scale: 1.7, origin: '22% 78%' },
  pia: { scale: 1.7, origin: '80% 78%' },
  tnd10: { scale: 1.4, origin: '72% 35%' },
}

export function TypeThumb({ src, alt, className, typeId, tag }: { src: string; alt: string; className?: string; typeId?: string; tag?: string }) {
  const frame = typeId ? FRAME[typeId] : undefined
  const [failed, setFailed] = React.useState(false)
  return (
    <span className={cn('relative block shrink-0 overflow-hidden bg-sunken', className)}>
      {failed ? (
        <span role="img" aria-label={alt} className="grid size-full place-items-center text-fg-3">
          <ImageOff size={20} strokeWidth={2} aria-hidden />
        </span>
      ) : (
        <img src={src} alt={alt} loading="lazy" draggable={false} onError={() => setFailed(true)} className="size-full object-cover" style={frame ? { transform: `scale(${frame.scale})`, transformOrigin: frame.origin } : undefined} />
      )}
      {tag ? <span aria-hidden className="absolute bottom-2 left-2 inline-flex h-6 items-center rounded-pill bg-raised px-2.5 text-caption font-semibold text-fg">{tag}</span> : null}
    </span>
  )
}
