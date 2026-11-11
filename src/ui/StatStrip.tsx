import * as React from 'react'
import { cn } from './cn'

/**
 * Faixa de indicadores em linha (referência logip): um único cartão, itens separados por
 * divisor vertical de 1px --hairline. Desktop: até 4 itens lado a lado, padding 20/24.
 * Abaixo de 1024px: 2 colunas, divisores horizontais e verticais. Não é grade de cartões.
 */
export function StatStrip({ children, className, framed = true }: { children: React.ReactNode; className?: string; framed?: boolean }) {
  const items = React.Children.toArray(children)
  return (
    <div
      className={cn(
        'grid grid-cols-2 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none',
        framed ? 'rounded-card bg-raised' : 'border-y border-hairline',
        className,
      )}
    >
      {items.map((child, i) => (
        <div
          key={i}
          className={cn(
            'min-w-0 px-4 py-4 lg:px-6 lg:py-5',
            // divisores: vertical entre colunas, horizontal entre linhas no celular
            i % 2 === 1 && 'border-l border-hairline',
            i >= 2 && 'border-t border-hairline lg:border-t-0',
            i > 0 && 'lg:border-l',
          )}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
