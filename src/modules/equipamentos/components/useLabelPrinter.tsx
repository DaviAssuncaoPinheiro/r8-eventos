import * as React from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import type { UnitView } from '@/services'

export const unitUrl = (code: string) => `${window.location.origin}/u/${code}`

/*
  Folha de etiquetas: fica fora da tela e só aparece na impressão. Ao imprimir, o resto da página some.
  `print(units)` monta a folha, abre a impressão do navegador e desmonta ao terminar.
*/
const CSS = `
.etq-root{display:none}
@media print{
  body > *:not(.etq-root){display:none !important}
  .etq-root{display:block;background:#fff;color:#000}
  .etq-sheet{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;padding:8mm}
  .etq{break-inside:avoid;border:0.3mm dashed #888;border-radius:2mm;padding:3mm;display:flex;flex-direction:column;align-items:center;gap:1.5mm;font-family:system-ui,sans-serif}
  .etq b{font-size:11pt;letter-spacing:.02em}
  .etq span{font-size:8pt}
}
@page{margin:0}
`

export function useLabelPrinter() {
  const [units, setUnits] = React.useState<UnitView[] | null>(null)

  React.useEffect(() => {
    if (!units) return
    const done = () => setUnits(null)
    window.addEventListener('afterprint', done)
    // espera o QR desenhar antes de abrir a impressão
    const t = window.setTimeout(() => {
      document.body.setAttribute('data-etiquetas', String(units.length))
      window.print()
      // alguns navegadores não disparam afterprint; garante a limpeza
      window.setTimeout(done, 1500)
    }, 120)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('afterprint', done)
      document.body.removeAttribute('data-etiquetas')
    }
  }, [units])

  const sheet =
    units && typeof document !== 'undefined'
      ? createPortal(
          <div className="etq-root" aria-hidden>
            <style>{CSS}</style>
            <div className="etq-sheet">
              {units.map((u) => (
                <div className="etq" key={u.id}>
                  <QRCodeSVG value={unitUrl(u.code)} size={110} level="M" />
                  <b>{u.code}</b>
                  <span>{u.type.name}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )
      : null

  return { print: (list: UnitView[]) => list.length && setUnits(list), sheet, printing: units !== null }
}
