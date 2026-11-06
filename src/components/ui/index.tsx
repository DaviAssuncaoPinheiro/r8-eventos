import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'motion/react'
import { cn } from '@/lib/utils'
import { PRODUCT, TEAM, type ProductId, type Rental } from '@/data/mock'

/* ───────────── Button (pílula) ───────────── */

type ButtonVariant = 'primary' | 'accent' | 'brand' | 'outline' | 'ghost' | 'subtle' | 'danger'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const btnBase =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold select-none transition-[background,color,box-shadow,transform] duration-150 ease-out active:scale-[.97] disabled:opacity-40 disabled:pointer-events-none'
const btnVariants: Record<ButtonVariant, string> = {
  primary: 'bg-black text-white hover:bg-black-2',
  accent: 'bg-black text-white hover:bg-black-2',
  brand: 'bg-brand text-white hover:bg-brand-2',
  outline: 'bg-card text-ink shadow-pill hover:bg-surface',
  ghost: 'text-ink-2 hover:bg-muted hover:text-ink',
  subtle: 'bg-muted text-ink hover:bg-muted-2',
  danger: 'bg-red-soft text-red hover:bg-[#fbd7d8]',
}
const btnSizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-3 text-[12px]',
  sm: 'h-8 px-3.5 text-[12.5px]',
  md: 'h-10 px-4 text-[13.5px]',
  lg: 'h-12 px-6 text-[15px]',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'outline', size = 'md', className, ...p }, ref) => (
  <button ref={ref} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...p} />
))
Button.displayName = 'Button'

/** Botão redondo só com ícone (ref. sino, busca, chamada) */
export const IconButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: number; tone?: 'card' | 'muted' | 'black' | 'brand' | 'ghost' }>(
  ({ size = 40, tone = 'card', className, style, ...p }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-[background,transform] duration-150 active:scale-95',
        tone === 'card' && 'bg-card text-ink shadow-pill hover:bg-surface',
        tone === 'muted' && 'bg-muted text-ink hover:bg-muted-2',
        tone === 'black' && 'bg-black text-white hover:bg-black-2',
        tone === 'brand' && 'bg-brand text-white hover:bg-brand-2',
        tone === 'ghost' && 'text-ink-2 hover:bg-muted',
        className,
      )}
      style={{ width: size, height: size, ...style }}
      {...p}
    />
  ),
)
IconButton.displayName = 'IconButton'

/* ───────────── Badge / Chip ───────────── */

export type Tone = 'neutral' | 'sage' | 'terra' | 'ok' | 'warn' | 'late' | 'info' | 'dark' | 'violet' | 'brand' | 'white'
const toneCls: Record<Tone, string> = {
  neutral: 'bg-muted text-ink-2',
  sage: 'bg-muted text-ink',
  terra: 'bg-blue-soft text-blue',
  ok: 'bg-green-soft text-[#1e8a50]',
  warn: 'bg-yellow-soft text-yellow-ink',
  late: 'bg-red-soft text-red',
  info: 'bg-blue-soft text-blue',
  dark: 'bg-black text-white',
  violet: 'bg-violet-soft text-violet',
  brand: 'bg-brand text-white',
  white: 'bg-card text-ink shadow-pill',
}
export function Badge({ tone = 'neutral', dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold leading-none whitespace-nowrap', toneCls[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/** Chip clicável de filtro (pílula) */
export function Chip({ active, onClick, children, className, color }: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
        active ? 'bg-black text-white' : 'bg-card text-ink-2 shadow-pill hover:text-ink',
        className,
      )}
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

/* ───────────── Cards ───────────── */

export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-[24px] bg-card shadow-card', className)} {...p}>
      {children}
    </div>
  )
}

/** Painel cinza que agrupa cartões brancos (ref. "Planned Absences") */
export function Panel({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-[28px] bg-surface p-2 ring-1 ring-white/80', className)} {...p}>
      {children}
    </div>
  )
}

export function CardHeader({ title, eyebrow, action, className }: { title: React.ReactNode; eyebrow?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-5 pt-5 pb-3', className)}>
      <div className="min-w-0">
        <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
        {eyebrow && <div className="mt-0.5 text-[12.5px] font-medium text-ink-3">{eyebrow}</div>}
      </div>
      {action}
    </div>
  )
}

/** Botão "↗ Ver tudo" das referências */
export function ViewAll({ onClick, children = 'Ver tudo' }: { onClick?: () => void; children?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-card px-3 text-[12.5px] font-semibold text-ink shadow-pill hover:bg-surface">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </button>
  )
}

/* ───────────── Avatares ───────────── */

/** Avatar da equipe (cor da equipe e iniciais do encarregado) */
export function TeamAvatar({ teamId, size = 28, className }: { teamId: string; size?: number; className?: string }) {
  const t = TEAM[teamId]
  return (
    <span
      title={t.name}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white', className)}
      style={{ width: size, height: size, background: t.color, fontSize: size * 0.36 }}
    >
      {t.initials}
    </span>
  )
}

const kindTint: Record<Rental['kind'], string> = { obra: 'bg-yellow-soft text-yellow-ink', evento: 'bg-brand-soft text-brand-ink' }

/** Avatar da locação: inicial do local, amarelo para obra e laranja-claro para evento */
export function RentalAvatar({ rental, size = 40, ring, className }: { rental: Rental; size?: number; ring?: boolean; className?: string }) {
  return (
    <span
      title={rental.title}
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full', kindTint[rental.kind], ring && 'ring-2 ring-card', className)}
      style={{ width: size, height: size }}
    >
      <span className="font-bold" style={{ fontSize: size * 0.4 }}>
        {rental.title.replace(/^(Residencial|Edifício|Reforma|Condomínio|Duplicação|Torre|Galpão|Casamento|Festival|Corrida|Congresso|Feira)\s+(d[oae]s?\s+)?/i, '')[0]?.toUpperCase() ?? rental.title[0]}
      </span>
    </span>
  )
}

/** Foto do produto (recorte das fotos da R8) */
export function ProductThumb({ productId, size = 44, className, rounded = 'full' }: { productId: ProductId; size?: number; className?: string; rounded?: 'full' | 'xl' }) {
  const p = PRODUCT[productId]
  const [failed, setFailed] = React.useState(false)
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-muted text-ink-3', rounded === 'full' ? 'rounded-full' : 'rounded-[14px]', className)}
      style={{ width: size, height: size }}
    >
      {!failed ? (
        <img src={p.photo} alt={p.name} loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <span className="font-bold" style={{ fontSize: size * 0.36 }}>
          {p.short[0]}
        </span>
      )}
    </span>
  )
}

/** Pilha de avatares com "+N" (ref. topo do dashboard) */
export function AvatarStack({ children, extra, size = 36 }: { children: React.ReactNode; extra?: number; size?: number }) {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5 [&>*]:ring-[3px] [&>*]:ring-card [&>*]:rounded-full">{children}</div>
      {extra ? (
        <span className="-ml-2.5 inline-flex items-center justify-center rounded-full bg-card text-[11.5px] font-bold text-ink shadow-pill ring-[3px] ring-card" style={{ width: size, height: size }}>
          {extra}+
        </span>
      ) : null}
    </div>
  )
}

/* ───────────── Tooltip ───────────── */

export function Tip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} sideOffset={6} className="z-50 max-w-64 rounded-xl bg-black px-3 py-2 text-[12px] font-medium leading-snug text-white shadow-float">
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
export const TooltipProvider = TooltipPrimitive.Provider

/* ───────────── Abas em pílula ───────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'sm',
  tone = 'light',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode }[]
  className?: string
  size?: 'sm' | 'md'
  tone?: 'light' | 'dark'
}) {
  const id = React.useId()
  return (
    <div className={cn('inline-flex rounded-full p-1', tone === 'light' ? 'bg-muted' : 'bg-white/10', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative rounded-full font-semibold transition-colors',
            size === 'sm' ? 'h-8 px-3.5 text-[12.5px]' : 'h-9 px-4 text-[13px]',
            value === o.value ? (tone === 'light' ? 'text-ink' : 'text-ink') : tone === 'light' ? 'text-ink-3 hover:text-ink-2' : 'text-white/60 hover:text-white',
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className={cn('absolute inset-0 rounded-full', tone === 'light' ? 'bg-card shadow-pill' : 'bg-white')}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            />
          )}
          <span className="relative inline-flex items-center gap-1.5">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ───────────── Números ───────────── */

export function NumberTicker({ value, decimals = 0, className, prefix = '', suffix = '' }: { value: number; decimals?: number; className?: string; prefix?: string; suffix?: string }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 90, damping: 22 })
  const text = useTransform(spring, (n) => prefix + n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix)
  React.useEffect(() => {
    mv.set(value)
  }, [value, mv])
  return <motion.span className={cn('num', className)}>{text}</motion.span>
}

export function CountUp({ to, decimals = 0, duration = 1.1, className }: { to: number; decimals?: number; duration?: number; className?: string }) {
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setN })
    return () => c.stop()
  }, [to, duration])
  return <span className={cn('num', className)}>{n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
}

export function Ring({ value, size = 44, stroke = 4, color = 'var(--color-black)', track = 'var(--color-muted)', children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  )
}

/** Barra segmentada (ref. alocação do app de finanças) */
export function SegmentBar({ parts, className }: { parts: { value: number; color: string }[]; className?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  return (
    <div className={cn('flex h-2 w-full gap-1', className)}>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="h-full rounded-full"
          style={{ background: p.color }}
          initial={{ width: 0 }}
          animate={{ width: `${(p.value / total) * 100}%` }}
          transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}

/* ───────────── Diversos ───────────── */

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-[10.5px] font-semibold text-ink-3', className)}>{children}</kbd>
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">{title}</h1>
        {(description || eyebrow) && <p className="mt-1.5 max-w-2xl text-[14px] font-medium text-ink-3">{description ?? eyebrow}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon && <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-muted text-ink-3">{icon}</div>}
      <div className="text-[14px] font-bold text-ink">{title}</div>
      {children && <div className="max-w-xs text-[13px] text-ink-3">{children}</div>}
    </div>
  )
}

/** Ícone dentro de círculo cinza (ref. logip) */
export function IconCircle({ children, size = 40, tone = 'muted', className }: { children: React.ReactNode; size?: number; tone?: 'muted' | 'black' | 'brand' | 'brand-soft' | 'white' | 'blue' | 'violet' | 'green' | 'yellow' | 'coral' | 'teal' | 'red'; className?: string }) {
  const t = {
    muted: 'bg-muted text-ink',
    black: 'bg-black text-white',
    brand: 'bg-brand text-white',
    white: 'bg-card text-ink shadow-pill',
    blue: 'bg-blue-soft text-blue',
    violet: 'bg-violet-soft text-violet',
    green: 'bg-green-soft text-green',
    yellow: 'bg-yellow-soft text-yellow-ink',
    coral: 'bg-coral-soft text-coral',
    teal: 'bg-teal-soft text-teal',
    red: 'bg-red-soft text-red',
    'brand-soft': 'bg-brand-soft text-brand-ink',
  }[tone]
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full', t, className)} style={{ width: size, height: size }}>
      {children}
    </span>
  )
}
