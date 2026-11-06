import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, ImageOff, Images, X } from 'lucide-react'
import { Badge, Button, Card, Empty, IconButton } from '@/components/ui'
import { JOB } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { cn } from '@/lib/utils'
import type { PhotoItem } from './model'

function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed)
    return (
      <div className={cn('flex items-center justify-center bg-muted text-ink-4', className)}>
        <ImageOff className="size-6" strokeWidth={1.9} />
      </div>
    )
  return <img src={src} alt={alt} draggable={false} loading="lazy" onError={() => setFailed(true)} className={cn('object-cover select-none', className)} />
}

function Lightbox({ photos, index, onClose, onIndex }: { photos: PhotoItem[]; index: number; onClose: () => void; onIndex: (n: number) => void }) {
  const p = photos[index]
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photos.length, onClose, onIndex])
  const job = JOB[p.jobId]
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[720px]" onClick={(e) => e.stopPropagation()}>
        <Img src={p.src} alt={p.label} className="aspect-[4/3] w-full rounded-[24px]" />
        <div className="mt-3 flex items-center gap-3 text-white">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold">{p.label}</div>
            <div className="num text-[12.5px] font-medium text-white/60">
              {job ? `${job.type}, ` : ''}
              {fmt.short(p.date)} às {fmt.time(p.date)}
            </div>
          </div>
          <IconButton tone="ghost" className="text-white hover:bg-white/10" aria-label="Anterior" onClick={() => onIndex((index - 1 + photos.length) % photos.length)}>
            <ChevronLeft className="size-5" />
          </IconButton>
          <span className="num text-[12.5px] font-semibold text-white/60">
            {index + 1} de {photos.length}
          </span>
          <IconButton tone="ghost" className="text-white hover:bg-white/10" aria-label="Próxima" onClick={() => onIndex((index + 1) % photos.length)}>
            <ChevronRight className="size-5" />
          </IconButton>
        </div>
        <IconButton className="absolute top-3 right-3" aria-label="Fechar" onClick={onClose}>
          <X className="size-4" />
        </IconButton>
      </div>
    </motion.div>,
    document.body,
  )
}

const PAGE = 8

export function PhotosCard({ photos }: { photos: PhotoItem[] }) {
  const [open, setOpen] = React.useState<number | null>(null)
  const [all, setAll] = React.useState(false)
  const shown = all ? photos : photos.slice(0, PAGE)
  const fresh = photos.filter((p) => p.isNew).length
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Fotos</h3>
          <div className="mt-0.5 text-[12.5px] font-medium text-ink-3">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} tiradas pela equipe{fresh ? ` · ${fresh} hoje` : ''}
          </div>
        </div>
      </div>
      {photos.length === 0 ? (
        <Empty icon={<Images className="size-5" strokeWidth={1.9} />} title="Sem fotos ainda">
          As fotos tiradas no app da equipe aparecem aqui e no relatório do cliente.
        </Empty>
      ) : (
        <div className="px-5 pt-4 pb-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shown.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.25 }}
                onClick={() => setOpen(i)}
                className={cn('group relative aspect-square overflow-hidden rounded-[18px] bg-muted', p.isNew && 'ring-2 ring-brand')}
              >
                <Img src={p.src} alt={p.label} className="size-full transition-transform duration-300 group-hover:scale-[1.04]" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-6 pb-2 text-left">
                  <span className="block truncate text-[12px] font-semibold text-white">{p.label}</span>
                  <span className="num block text-[11px] font-medium text-white/70">{relDays(p.date)}</span>
                </span>
                {p.isNew && (
                  <Badge tone="brand" className="absolute top-2 left-2">
                    Novo
                  </Badge>
                )}
              </motion.button>
            ))}
          </div>
          {photos.length > PAGE && (
            <div className="flex justify-center pt-3">
              <Button variant="subtle" size="sm" onClick={() => setAll((v) => !v)}>
                {all ? 'Mostrar menos' : `Ver mais ${photos.length - PAGE}`}
              </Button>
            </div>
          )}
        </div>
      )}
      <AnimatePresence>{open !== null && <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}</AnimatePresence>
    </Card>
  )
}
