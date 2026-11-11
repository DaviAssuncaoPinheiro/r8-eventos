import { cn } from './cn'

/**
 * Bloco de carregamento. Use com o mesmo tamanho do conteúdo final (sem salto de layout).
 * O contêiner que carrega recebe aria-busy="true"; o esqueleto é aria-hidden.
 * Com prefers-reduced-motion o brilho para (regra global de movimento reduzido).
 */
export function Skeleton({ shape = 'line', className }: { shape?: 'line' | 'block' | 'circle'; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'ds-skeleton block',
        shape === 'line' && 'h-3.5 w-full rounded-[4px]',
        shape === 'block' && 'h-24 w-full rounded-control',
        shape === 'circle' && 'size-10 rounded-pill',
        className,
      )}
    />
  )
}
