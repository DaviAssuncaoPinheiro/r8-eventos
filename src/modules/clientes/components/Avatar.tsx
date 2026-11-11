import { cn } from '@/ui'
import { avatarTone, initialsOf } from '../lib'

/** Círculo com as iniciais, em cor suave estável por nome. */
export function Avatar({ name, seed, size = 48, className }: { name: string; seed?: string; size?: 40 | 48 | 56 | 72; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-pill font-semibold text-fg',
        avatarTone(seed ?? name),
        size === 40 && 'size-10 text-body',
        size === 48 && 'size-12 text-body-lg',
        size === 56 && 'size-14 text-title-sub',
        size === 72 && 'size-[72px] text-title-section',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  )
}
