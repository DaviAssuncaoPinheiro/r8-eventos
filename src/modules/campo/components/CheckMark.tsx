/** Check desenhado uma vez ao montar: o anel e depois o traço. */
export function CheckMark({ size = 112, label, className = '' }: { size?: number; label: string; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label={label} className={className}>
      <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" pathLength={1} className="ds-arc" transform="rotate(-90 48 48)" />
      <path d="M30 50 L43 63 L67 36" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="ds-arc" style={{ animationDelay: '350ms' }} />
    </svg>
  )
}
