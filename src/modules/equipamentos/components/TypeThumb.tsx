import * as React from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/ui'

/** Foto do tipo de equipamento, sempre `object-cover`. Se a imagem falhar, mostra um quadro neutro. */
export function TypeThumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span className={cn('relative block shrink-0 overflow-hidden bg-sunken', className)}>
      {failed ? (
        <span role="img" aria-label={alt} className="grid size-full place-items-center text-fg-3">
          <ImageOff size={20} strokeWidth={2} aria-hidden />
        </span>
      ) : (
        <img src={src} alt={alt} loading="lazy" draggable={false} onError={() => setFailed(true)} className="size-full object-cover" />
      )}
    </span>
  )
}
