import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Printer } from 'lucide-react'
import { Button } from './Button'
import { cn } from './cn'
import { Tooltip } from './Tooltip'

export interface QrTileProps {
  /** Endereço que o QR abre ao ser lido. */
  value: string
  /** "BQ-0142" */
  code: string
  /** "Banheiro químico standard". Sem valor, a legenda mostra só o código. */
  name?: string
  /** 160 na tela. Na impressão a etiqueta usa 3 cm. */
  size?: number
  onPrint?: () => void
  /** Chamado depois de copiar o link. */
  onCopied?: () => void
  className?: string
}

/**
 * QR sempre sobre quadrado branco com padding 12 e raio 14, nos dois temas.
 * Os módulos usam preto (não `--fg`, que no escuro é claro e deixaria o código ilegível).
 */
export function QrTile({ value, code, name, size = 160, onPrint, onCopied, className }: QrTileProps) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* sem permissão de área de transferência: o aviso abaixo continua honesto, o link está no QR */
    }
    setCopied(true)
    onCopied?.()
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <figure className={cn('m-0 flex w-fit flex-col items-start', className)}>
      <div className="rounded-card bg-white p-3 text-black print:p-0">
        <QRCodeSVG value={value} size={size} level="M" bgColor="transparent" fgColor="currentColor" role="img" aria-label={`QR code do equipamento ${code}`} className="block print:size-[3cm]" />
      </div>
      <figcaption className="mt-3">
        <div className="tnum text-body font-semibold">{code}</div>
        {name ? <div className="text-caption text-fg-3">{name}</div> : null}
      </figcaption>
      <div className="mt-3 flex items-center gap-2 print:hidden">
        <Button variant="secondary" size="sm" icon={Printer} onClick={onPrint ?? (() => window.print())}>
          Imprimir etiqueta
        </Button>
        <Tooltip content={copied ? 'Link copiado' : 'Copiar link'}>
          <Button variant="secondary" size="sm" iconOnly icon={copied ? Check : Copy} aria-label="Copiar link" onClick={copy} />
        </Tooltip>
        <span className="sr-only" role="status">
          {copied ? 'Link copiado' : ''}
        </span>
      </div>
    </figure>
  )
}
