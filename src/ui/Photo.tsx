import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Camera, ChevronLeft, ChevronRight, ImageOff, Loader2, X } from 'lucide-react'
import { cn } from './cn'
import { Skeleton } from './Skeleton'

export interface PhotoItem {
  id: string
  src: string
  /** Legenda acessível: "Porta da BQ-0142 após a limpeza". */
  alt: string
}

/* ───────────────────────── miniatura ───────────────────────── */

export interface PhotoThumbProps {
  src: string
  alt: string
  /** 64 na lista, 96 na grade do campo. */
  size?: 64 | 96
  /** Força um estado (documentação). Sem isso, a miniatura acompanha o carregamento real. */
  state?: 'ready' | 'loading' | 'error'
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}

export const PhotoThumb = React.forwardRef<HTMLButtonElement, PhotoThumbProps>(function PhotoThumb({ src, alt, size = 64, state, onClick, className }, ref) {
  const [loaded, setLoaded] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [src])
  const error = state === 'error' || (state === undefined && failed)
  const loading = state === 'loading' || (state === undefined && !loaded && !failed)
  const box = size === 96 ? 'size-24' : 'size-16'
  const frame = cn('relative block shrink-0 overflow-hidden rounded-tip bg-sunken', box, className)

  const body = error ? (
    <span role="img" aria-label={`Foto indisponível: ${alt}`} className="grid size-full place-items-center text-fg-3">
      <ImageOff size={24} strokeWidth={2} aria-hidden />
    </span>
  ) : (
    <>
      {state !== 'loading' ? (
        <img src={src} alt={alt} loading="lazy" draggable={false} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={cn('size-full object-cover', loading && 'opacity-0')} />
      ) : null}
      {loading ? <Skeleton className="absolute inset-0 h-full rounded-none" /> : null}
    </>
  )

  if (!onClick) return <span aria-busy={loading || undefined} className={frame}>{body}</span>
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-busy={loading || undefined}
      aria-label={error ? undefined : `Abrir foto: ${alt}`}
      className={cn(frame, 'ds-touch cursor-pointer transition-[filter] duration-150 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring')}
    >
      {body}
    </button>
  )
})

/* ───────────────────────── visualizador ───────────────────────── */

export interface PhotoViewerProps {
  photos: PhotoItem[]
  index: number
  open: boolean
  onIndexChange: (index: number) => void
  onOpenChange: (open: boolean) => void
  /** Elemento que recebe o foco ao fechar (normalmente a miniatura tocada). */
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

const viewerBtn =
  'ds-touch grid size-11 place-items-center rounded-pill bg-black/60 text-white transition-colors duration-150 hover:bg-black/80 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40'

/** Tela cheia: foto contida, contador, setas do teclado, Esc, foco preso, deslize lateral. */
export function PhotoViewer({ photos, index, open, onIndexChange, onOpenChange, returnFocusRef }: PhotoViewerProps) {
  const photo = photos[index]
  const last = photos.length - 1
  const [imgState, setImgState] = React.useState<'loading' | 'ready' | 'error'>('loading')
  React.useEffect(() => setImgState('loading'), [photo?.src])
  const touchX = React.useRef<number | null>(null)

  const go = (i: number) => onIndexChange(Math.max(0, Math.min(last, i)))

  if (!photo) return null
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            if (returnFocusRef?.current) {
              e.preventDefault()
              returnFocusRef.current.focus()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') (e.preventDefault(), go(index + 1))
            if (e.key === 'ArrowLeft') (e.preventDefault(), go(index - 1))
          }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
          }}
          className="fixed inset-0 z-[70] flex flex-col text-white outline-none"
        >
          <Dialog.Title className="sr-only">
            Foto {index + 1} de {photos.length}: {photo.alt}
          </Dialog.Title>
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <p className="tnum text-body font-semibold text-white" aria-live="polite">
              {index + 1} de {photos.length}
            </p>
            <Dialog.Close className={viewerBtn} aria-label="Fechar visualizador">
              <X size={24} strokeWidth={2} aria-hidden />
            </Dialog.Close>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            {imgState === 'error' ? (
              <div role="img" aria-label={`Foto indisponível: ${photo.alt}`} className="flex flex-col items-center gap-2 text-white/80">
                <ImageOff size={24} strokeWidth={2} aria-hidden />
                <p className="text-body">Não foi possível carregar a foto.</p>
              </div>
            ) : (
              <>
                {imgState === 'loading' ? <Loader2 size={24} strokeWidth={2} aria-hidden className="ds-spin absolute text-white/80" /> : null}
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  onLoad={() => setImgState('ready')}
                  onError={() => setImgState('error')}
                  draggable={false}
                  className={cn('max-h-full max-w-full object-contain', imgState === 'loading' && 'opacity-0')}
                />
              </>
            )}
            <button type="button" aria-label="Foto anterior" disabled={index === 0} onClick={() => go(index - 1)} className={cn(viewerBtn, 'absolute left-4 hidden sm:grid')}>
              <ChevronLeft size={24} strokeWidth={2} aria-hidden />
            </button>
            <button type="button" aria-label="Próxima foto" disabled={index === last} onClick={() => go(index + 1)} className={cn(viewerBtn, 'absolute right-4 hidden sm:grid')}>
              <ChevronRight size={24} strokeWidth={2} aria-hidden />
            </button>
          </div>
          <p className="shrink-0 px-4 py-4 text-center text-body text-white/80">{photo.alt}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ───────────────────────── adicionar ───────────────────────── */

export interface AddPhotoProps {
  /** Recebe os arquivos escolhidos ou tirados na hora. */
  onFiles?: (files: File[]) => void
  label?: string
  loading?: boolean
  disabled?: boolean
  className?: string
}

/** Quadrado tracejado do app da equipe de rua: alvo de pelo menos 96 px, abre a câmera no celular. */
export const AddPhoto = React.forwardRef<HTMLButtonElement, AddPhotoProps>(function AddPhoto({ onFiles, label = 'Foto', loading, disabled, className }, ref) {
  const input = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles?.(files)
          e.target.value = ''
        }}
      />
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-label={loading ? 'Enviando foto' : 'Adicionar foto'}
        onClick={() => input.current?.click()}
        className={cn(
          'flex size-24 min-h-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-tip border-[1.5px] border-dashed border-strong text-fg-2 transition-colors duration-150',
          'hover:bg-hover hover:text-fg active:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-not-allowed disabled:border-edge disabled:text-fg-disabled disabled:hover:bg-transparent aria-busy:cursor-progress',
          className,
        )}
      >
        {loading ? <Loader2 size={24} strokeWidth={2} aria-hidden className="ds-spin" /> : <Camera size={24} strokeWidth={2} aria-hidden />}
        <span className="text-caption font-semibold">{loading ? 'Enviando' : label}</span>
      </button>
    </>
  )
})

/* ───────────────────────── grade ───────────────────────── */

export interface PhotoGridProps {
  photos: PhotoItem[]
  size?: 64 | 96
  /** Última célula, normalmente o AddPhoto. */
  children?: React.ReactNode
  className?: string
}

/** Grade com gap 8. Toque abre o visualizador em tela cheia. */
export function PhotoGrid({ photos, size = 96, children, className }: PhotoGridProps) {
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const back = React.useRef<HTMLElement | null>(null)
  return (
    <>
      <ul className={cn('m-0 grid list-none gap-2 p-0', size === 96 ? 'grid-cols-[repeat(auto-fill,96px)]' : 'grid-cols-[repeat(auto-fill,64px)]', className)}>
        {photos.map((p, i) => (
          <li key={p.id}>
            <PhotoThumb
              src={p.src}
              alt={p.alt}
              size={size}
              onClick={(e) => {
                back.current = e.currentTarget
                setIndex(i)
                setOpen(true)
              }}
            />
          </li>
        ))}
        {children ? <li>{children}</li> : null}
      </ul>
      <PhotoViewer photos={photos} index={index} open={open} onIndexChange={setIndex} onOpenChange={setOpen} returnFocusRef={back} />
    </>
  )
}
