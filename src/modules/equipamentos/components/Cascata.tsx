import { Stagger, type StaggerProps } from '@/ui/Motion'

/* A cascata de entrada vive em `@/ui/Motion` (Stagger). Aqui só se mantém o nome e a unidade usados no módulo: milissegundos. */
export interface CascataProps extends Omit<StaggerProps, 'gap' | 'delay'> {
  /** Intervalo entre os filhos, em ms. */
  gap?: number
  /** Atraso antes do primeiro, em ms. */
  delay?: number
}

export function Cascata({ gap = 55, delay = 0, ...rest }: CascataProps) {
  return <Stagger gap={gap / 1000} delay={delay / 1000} {...rest} />
}
