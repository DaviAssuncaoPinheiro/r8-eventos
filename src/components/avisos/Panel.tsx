import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Drawer } from 'vaul'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

export function useIsDesktop(min = 1024) {
  const q = `(min-width:${min}px)`
  const [v, setV] = React.useState(() => (typeof window === 'undefined' ? true : window.matchMedia(q).matches))
  React.useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setV(m.matches)
    m.addEventListener('change', f)
    f()
    return () => m.removeEventListener('change', f)
  }, [q])
  return v
}

/** Desktop: gaveta à direita (Radix Dialog). Mobile: bottom sheet (vaul). */
export function Panel({ open, onOpenChange, title, children, width = 'w-[480px]' }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; width?: string }) {
  const desktop = useIsDesktop()
  if (desktop) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div className="fixed inset-0 z-40 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.aside
                  className={cn('fixed inset-y-3 right-3 z-50 flex max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[28px] bg-surface shadow-float outline-none', width)}
                  initial={{ x: 48, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 48, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Dialog.Title className="sr-only">{title}</Dialog.Title>
                  {children}
                </motion.aside>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    )
  }
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col overflow-hidden rounded-t-[28px] bg-surface outline-none">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-2" />
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
