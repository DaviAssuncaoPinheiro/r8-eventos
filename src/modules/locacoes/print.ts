/*
  Impressão sem biblioteca: monta o documento HTML em um iframe oculto e chama a impressão do navegador
  (a pessoa escolhe "Salvar como PDF"). O iframe fica na página (data-print-frame) até a próxima impressão.
*/
export async function printHtml(html: string, name: string): Promise<void> {
  document.querySelectorAll('iframe[data-print-frame]').forEach((f) => f.remove())
  const frame = document.createElement('iframe')
  frame.setAttribute('data-print-frame', name)
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  const win = frame.contentWindow
  if (!doc || !win) throw new Error('Não foi possível preparar a impressão.')
  doc.open()
  doc.write(html)
  doc.close()
  // espera as imagens (fotos e assinaturas) antes de imprimir
  const imgs = Array.from(doc.images)
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            setTimeout(resolve, 4000)
          }),
    ),
  )
  win.focus()
  win.print()
}

export const PRINT_CSS = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: 'Manrope', 'Segoe UI', Arial, sans-serif; color: #1a1d21; font-size: 12.5px; line-height: 1.5; }
  h1, h2, h3, p { margin: 0; }
  .brand { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; border-bottom: 3px solid #f04e0a; }
  .brand b { font-size: 18px; letter-spacing: -0.01em; }
  .brand span { color: #5c636d; font-size: 11.5px; text-align: right; }
  h1 { font-size: 24px; letter-spacing: -0.02em; margin: 18px 0 4px; }
  h2 { font-size: 14px; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; color: #5c636d; }
  .tag { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #fde8dd; color: #a8340a; font-weight: 700; font-size: 11px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; }
  .kv { padding: 6px 0; border-bottom: 1px solid #e5e7ea; }
  .kv small { display: block; color: #5c636d; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; }
  .kv b { font-size: 12.5px; }
  .counters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; }
  .counter { border: 1px solid #e5e7ea; border-radius: 12px; padding: 10px 12px; }
  .counter b { display: block; font-size: 22px; letter-spacing: -0.02em; }
  .counter small { color: #5c636d; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; }
  .event { display: grid; grid-template-columns: 112px 1fr; gap: 14px; padding: 12px 0; border-bottom: 1px solid #e5e7ea; page-break-inside: avoid; }
  .event time { color: #5c636d; font-size: 11px; }
  .event h3 { font-size: 13px; }
  .event p { color: #3b4149; }
  .photos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .photos figure { margin: 0; width: 104px; }
  .photos img { width: 104px; height: 78px; object-fit: cover; border-radius: 8px; display: block; background: #eef0f2; }
  .photos figcaption { font-size: 9.5px; color: #5c636d; margin-top: 2px; }
  .sign { margin-top: 8px; display: inline-block; border: 1px solid #e5e7ea; border-radius: 10px; padding: 6px 12px; }
  .sign img { display: block; height: 44px; max-width: 200px; object-fit: contain; }
  .sign small { color: #5c636d; font-size: 10.5px; }
  .kind-avaria h3 { color: #b42318; }
  .foot { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e7ea; color: #5c636d; font-size: 10.5px; display: flex; justify-content: space-between; }
  .contract { white-space: pre-wrap; font-size: 12.5px; line-height: 1.65; }
  .contract h1 { text-align: center; font-size: 18px; margin: 18px 0; }
  .contract h3 { margin: 16px 0 4px; font-size: 12.5px; }
  .sigbox { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .sigbox div { border-top: 1px solid #1a1d21; padding-top: 6px; min-height: 64px; font-size: 11.5px; }
  .sigbox img { display: block; height: 56px; margin-bottom: 4px; }
`
