// Primitivos de interface do app de campo (tamanhos de toque de celular, visual v2).
import * as React from 'react'
import { AnimatePresence, motion, useScroll, useTransform, type HTMLMotionProps } from 'motion/react'
import { Drawer } from 'vaul'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { ArrowLeft, Check, CloudOff, MessageCircle, Minus, ImageOff, Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { useDemo } from '@/store'
import { useCampo, type Notice } from './campoStore'

/* Contexto do aparelho */

/** desktop: o atendimento está dentro do painel (AppShell), sem tela de celular */
export const PhoneCtx = React.createContext<{ desktop: boolean; root: HTMLElement | null }>({ desktop: false, root: null })
export const usePhone = () => React.useContext(PhoneCtx)

export const EASE_IOS = [0.32, 0.72, 0, 1] as const
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

/* Pressable: feedback de toque */

export const Pressable = React.forwardRef<HTMLButtonElement, HTMLMotionProps<'button'> & { scale?: number }>(({ className, scale = 0.97, ...p }, ref) => (
  <motion.button ref={ref} whileTap={{ scale }} transition={{ duration: 0.12 }} className={cn('select-none [-webkit-tap-highlight-color:transparent]', className)} {...p} />
))
Pressable.displayName = 'Pressable'

/* Botão em pílula */

type BtnTone = 'primary' | 'brand' | 'outline' | 'subtle' | 'ghost' | 'dark' | 'danger'
const btnTone: Record<BtnTone, string> = {
  primary: 'bg-black text-white active:bg-black-2',
  brand: 'bg-brand text-white active:bg-brand-2',
  outline: 'bg-card text-ink shadow-pill active:bg-surface',
  subtle: 'bg-muted text-ink active:bg-muted-2',
  ghost: 'text-ink-2 active:bg-muted',
  dark: 'bg-white/10 text-white active:bg-white/15',
  danger: 'bg-red-soft text-red active:bg-[#fbd7d8]',
}

export function Btn({ tone = 'primary', className, children, ...p }: HTMLMotionProps<'button'> & { tone?: BtnTone }) {
  return (
    <Pressable className={cn('inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold tracking-[-0.01em] transition-colors disabled:opacity-40', btnTone[tone], className)} {...p}>
      {children}
    </Pressable>
  )
}

/** Botão redondo só com ícone */
export function RoundBtn({
  children,
  onClick,
  label,
  className,
  tone = 'card',
  size = 44,
}: {
  children: React.ReactNode
  onClick?: () => void
  label: string
  className?: string
  tone?: 'card' | 'muted' | 'black' | 'brand' | 'glass' | 'red'
  size?: number
}) {
  return (
    <Pressable
      aria-label={label}
      title={label}
      onClick={onClick}
      scale={0.9}
      style={{ width: size, height: size }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full transition-colors',
        tone === 'card' && 'bg-card text-ink shadow-pill',
        tone === 'muted' && 'bg-muted text-ink',
        tone === 'black' && 'bg-black text-white',
        tone === 'brand' && 'bg-brand text-white',
        tone === 'glass' && 'bg-white/10 text-white',
        tone === 'red' && 'bg-red-soft text-red',
        className,
      )}
    >
      {children}
    </Pressable>
  )
}

/* Chip de seleção (ativo preto) */

export function Chip({ on, onClick, children, className, size = 'md' }: { on?: boolean; onClick?: () => void; children: React.ReactNode; className?: string; size?: 'sm' | 'md' }) {
  return (
    <Pressable
      scale={0.95}
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold transition-colors',
        size === 'md' ? 'h-11 px-4 text-[14.5px]' : 'h-10 px-3.5 text-[13.5px]',
        on ? 'bg-black text-white' : 'bg-muted text-ink-2 active:bg-muted-2',
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {on && (
          <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="-ml-0.5 overflow-hidden text-brand">
            <Check className="size-4" strokeWidth={2.6} />
          </motion.span>
        )}
      </AnimatePresence>
      {children}
    </Pressable>
  )
}

/* Toggle estilo iOS */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-muted-2 transition-colors duration-200 data-[state=checked]:bg-black"
    >
      <SwitchPrimitive.Thumb className="block size-[27px] translate-x-[2px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.18),0_0_0_.5px_rgba(0,0,0,.04)] transition-transform duration-200 ease-[cubic-bezier(.32,.72,0,1)] will-change-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  )
}

/* Título de seção (ref. "Recent activity · View all") */

export function SectionLabel({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between px-1 pt-6 pb-3', className)}>
      <h2 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{children}</h2>
      {action}
    </div>
  )
}

/* Tela com cabeçalho de botão redondo e título central */

export function Screen({
  title,
  large,
  eyebrow,
  back,
  left,
  right,
  children,
  footer,
  below,
  className,
  scrollKey,
  contentProps,
}: {
  title: React.ReactNode
  large?: React.ReactNode
  eyebrow?: React.ReactNode
  back?: { label: string; onClick: () => void }
  left?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  below?: React.ReactNode
  className?: string
  /** quando muda, a rolagem volta ao topo */
  scrollKey?: string | number
  contentProps?: React.HTMLAttributes<HTMLDivElement>
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const headRef = React.useRef<HTMLElement>(null)
  const [headH, setHeadH] = React.useState<number | null>(null)
  const { scrollY } = useScroll({ container: ref })
  React.useLayoutEffect(() => {
    const el = headRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight))
    ro.observe(el)
    setHeadH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])
  React.useEffect(() => {
    ref.current?.scrollTo({ top: 0 })
  }, [scrollKey])
  const titleOpacity = useTransform(scrollY, large ? [34, 58] : [0, 1], [large ? 0 : 1, 1])
  const barBg = useTransform(scrollY, [0, 24], [0, 1])

  return (
    <div className={cn('absolute inset-0 flex flex-col bg-surface', className)}>
      <header ref={headRef} className="absolute inset-x-0 top-0 z-30 pt-[var(--sat)]">
        <motion.div style={{ opacity: barBg }} className="pointer-events-none absolute inset-0 bg-surface/85 backdrop-blur-xl backdrop-saturate-150" />
        <div className="relative flex h-[60px] items-center gap-2 px-4">
          <div className="flex min-w-[96px] items-center">
            {left}
            {back && (
              <RoundBtn label={back.label} onClick={back.onClick}>
                <ArrowLeft className="size-[19px]" strokeWidth={2} />
              </RoundBtn>
            )}
          </div>
          <motion.div style={{ opacity: titleOpacity }} className="min-w-0 flex-1 truncate text-center text-[17px] font-bold tracking-[-0.02em] text-ink">
            {title}
          </motion.div>
          <div className="flex min-w-[96px] items-center justify-end gap-2">{right}</div>
        </div>
        <div className="relative">{below}</div>
      </header>
      <div
        ref={ref}
        {...contentProps}
        className={cn('no-scrollbar relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain', contentProps?.className)}
        style={{ paddingTop: headH != null ? headH : 'calc(var(--sat) + 60px)', ...contentProps?.style }}
      >
        {large && (
          <div className="px-5 pt-1 pb-1">
            {eyebrow && <div className="mb-1 text-[13.5px] font-medium text-ink-3">{eyebrow}</div>}
            <h1 className="text-[30px] leading-[1.08] font-bold tracking-[-0.03em] text-ink">{large}</h1>
          </div>
        )}
        {children}
        <div style={{ height: footer ? 24 : 'calc(var(--sab) + 24px)' }} />
      </div>
      {footer && (
        <div className="relative z-20 bg-surface/92 px-4 pt-3 backdrop-blur-xl" style={{ paddingBottom: 'calc(var(--sab) + 12px)' }}>
          <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-surface to-transparent" />
          {footer}
        </div>
      )}
    </div>
  )
}

/* Bottom sheet (vaul) dentro do aparelho */

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dark,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  dark?: boolean
}) {
  const { root, desktop } = usePhone()
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} container={root} repositionInputs={false} direction={desktop ? 'right' : 'bottom'}>
      <Drawer.Portal container={root}>
        <Drawer.Overlay className={cn('fixed inset-0 z-[80]', desktop ? 'bg-black/25 backdrop-blur-[2px]' : 'bg-black/40')} />
        <Drawer.Content
          aria-describedby={undefined}
          style={desktop ? ({ ['--sab' as string]: '0px' } as React.CSSProperties) : undefined}
          className={cn(
            'fixed z-[90] flex flex-col outline-none',
            desktop ? 'inset-y-3 right-3 w-[440px] max-w-[calc(100vw-24px)] rounded-[28px] shadow-float' : 'inset-x-0 bottom-0 max-h-[90%] rounded-t-[32px]',
            dark ? 'bg-black text-white' : 'bg-card',
          )}
        >
          {!desktop && <div className={cn('mx-auto mt-2.5 mb-1 h-[5px] w-10 shrink-0 rounded-full', dark ? 'bg-white/20' : 'bg-muted-2')} />}
          <div className={cn('px-5 pb-4', desktop ? 'pt-6' : 'pt-2')}>
            <Drawer.Title className={cn('text-[20px] font-bold tracking-[-0.02em]', dark ? 'text-white' : 'text-ink')}>{title}</Drawer.Title>
            {description && <Drawer.Description className={cn('mt-0.5 text-[14px] font-medium', dark ? 'text-white/55' : 'text-ink-3')}>{description}</Drawer.Description>}
          </div>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer && (
            <div className="px-4 pt-2" style={{ paddingBottom: 'calc(var(--sab) + 12px)' }}>
              {footer}
            </div>
          )}
          {!footer && <div style={{ height: 'var(--sab)' }} />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/* Stepper numérico grande com botões redondos */

function useHoldRepeat(fn: () => void) {
  const t = React.useRef<number | null>(null)
  const fnRef = React.useRef(fn)
  fnRef.current = fn
  const stop = React.useCallback(() => {
    if (t.current) window.clearTimeout(t.current)
    t.current = null
  }, [])
  const start = React.useCallback(() => {
    fnRef.current()
    let delay = 380
    const loop = () => {
      fnRef.current()
      delay = Math.max(60, delay * 0.78)
      t.current = window.setTimeout(loop, delay)
    }
    t.current = window.setTimeout(loop, delay)
  }, [])
  React.useEffect(() => stop, [stop])
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop }
}

export function NumberStepper({
  label,
  icon,
  value,
  onChange,
  step,
  min,
  max,
  decimals = 0,
  unit,
  hint,
  tone,
  extra,
}: {
  label: string
  icon?: React.ReactNode
  value: number
  onChange: (n: number) => void
  step: number
  min: number
  max: number
  decimals?: number
  unit: string
  hint?: React.ReactNode
  tone?: 'late'
  extra?: React.ReactNode
}) {
  const clamp = (n: number) => +Math.min(max, Math.max(min, n)).toFixed(decimals)
  const valRef = React.useRef(value)
  valRef.current = value
  const dec = useHoldRepeat(() => onChange(clamp(valRef.current - step)))
  const inc = useHoldRepeat(() => onChange(clamp(valRef.current + step)))
  return (
    <div className="flex items-center gap-3 py-4">
      <Pressable scale={0.88} aria-label={`Diminuir ${label}`} {...dec} className="flex size-[54px] shrink-0 items-center justify-center rounded-full bg-muted text-ink active:bg-muted-2">
        <Minus className="size-5" strokeWidth={2.4} />
      </Pressable>
      <div className="min-w-0 flex-1 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-ink-3">
          {icon}
          {label}
        </div>
        <div className={cn('mt-1 flex items-baseline justify-center gap-1 leading-none', tone === 'late' ? 'text-red' : 'text-ink')}>
          <span className="num text-[36px] font-bold tracking-[-0.03em]">{value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
          <span className="text-[15px] font-semibold text-ink-3">{unit}</span>
        </div>
        {hint && <div className={cn('mt-1.5 text-[12.5px] font-medium', tone === 'late' ? 'text-red' : 'text-ink-3')}>{hint}</div>}
        {extra}
      </div>
      <Pressable scale={0.88} aria-label={`Aumentar ${label}`} {...inc} className="flex size-[54px] shrink-0 items-center justify-center rounded-full bg-black text-white active:bg-black-2">
        <Plus className="size-5" strokeWidth={2.4} />
      </Pressable>
    </div>
  )
}

/* Notificações do aparelho (banner iOS) */

function NoticeIcon({ kind }: { kind: Notice['kind'] }) {
  if (kind === 'whatsapp')
    return (
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-green text-white">
        <MessageCircle className="size-5" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
      </span>
    )
  if (kind === 'sync')
    return (
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-brand text-white">
        <RefreshCw className="size-5" strokeWidth={2.2} />
      </span>
    )
  if (kind === 'offline')
    return (
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-black text-white">
        <CloudOff className="size-5" strokeWidth={2} />
      </span>
    )
  return <LogoMark size={38} className="shrink-0" />
}

function NoticeItem({ n }: { n: Notice }) {
  const dismiss = useCampo((s) => s.dismiss)
  React.useEffect(() => {
    const t = window.setTimeout(() => dismiss(n.id), 4200)
    return () => window.clearTimeout(t)
  }, [n.id, dismiss])
  return (
    <motion.div
      layout
      initial={{ y: -90, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -70, opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0.1 }}
      onDragEnd={(_, i) => i.offset.y < -24 && dismiss(n.id)}
      onClick={() => dismiss(n.id)}
      className="pointer-events-auto flex cursor-grab items-start gap-3 rounded-[24px] bg-card/90 p-3 shadow-float ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150"
    >
      <NoticeIcon kind={n.kind} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-[14.5px] font-bold text-ink">{n.title}</div>
          <div className="shrink-0 text-[12px] font-medium text-ink-3">agora</div>
        </div>
        <div className="mt-0.5 line-clamp-3 text-[13.5px] leading-snug font-medium text-ink-2">{n.body}</div>
      </div>
    </motion.div>
  )
}

/** Avisos: no celular como banner do sistema; no computador no canto superior da página. */
export function PhoneToaster({ placement = 'phone' }: { placement?: 'phone' | 'page' }) {
  const notices = useCampo((s) => s.notices)
  return (
    <div
      className={cn(
        'pointer-events-none z-[120] flex flex-col gap-2',
        placement === 'phone' ? 'absolute inset-x-0 px-2.5' : 'fixed top-4 right-4 w-[min(380px,calc(100vw-32px))]',
      )}
      style={placement === 'phone' ? { top: 'calc(var(--sat) - 4px)' } : undefined}
    >
      <AnimatePresence initial={false}>
        {notices.map((n) => (
          <NoticeItem key={n.id} n={n} />
        ))}
      </AnimatePresence>
    </div>
  )
}

/* Faixa de offline e sincronização */

export function ConnectivityBanner({ dark, flush }: { dark?: boolean; flush?: boolean }) {
  const offline = useDemo((s) => s.offline)
  const pending = useCampo((s) => s.pending)
  const syncing = useCampo((s) => s.syncing)
  const show = offline || syncing
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="overflow-hidden">
          <div className={cn(flush ? 'pb-4' : 'pb-2', !dark && !flush && 'px-4')}>
            <div className={cn('relative flex h-10 items-center gap-2 overflow-hidden rounded-full px-4 text-[13.5px] font-semibold', syncing ? 'bg-brand text-white' : dark ? 'bg-white/10 text-white' : 'bg-black text-white')}>
              {syncing ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} className="inline-flex">
                    <RefreshCw className="size-4" strokeWidth={2.2} />
                  </motion.span>
                  Enviando {pending} {pending === 1 ? 'registro' : 'registros'}
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.8, ease: 'easeInOut' }} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-black/25" />
                </>
              ) : (
                <>
                  <CloudOff className="size-4 text-brand" strokeWidth={2.2} />
                  <span>Sem sinal</span>
                  <span className="truncate font-medium text-white/60">{pending > 0 ? `${pending} ${pending === 1 ? 'registro' : 'registros'} na fila` : 'salvando no aparelho'}</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Imagem com reserva: se a foto não carregar, mostra um fundo neutro em vez do texto alternativo */

export function SafeImg({ src, alt, className, style, draggable }: { src: string; alt: string; className?: string; style?: React.CSSProperties; draggable?: boolean }) {
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])
  if (failed)
    return (
      <span role="img" aria-label={alt} className={cn('flex items-center justify-center bg-muted-2 text-ink-4', className)} style={style}>
        <ImageOff className="size-6" strokeWidth={1.8} />
      </span>
    )
  return <img src={src} alt={alt} className={className} style={style} draggable={draggable} onError={() => setFailed(true)} />
}
