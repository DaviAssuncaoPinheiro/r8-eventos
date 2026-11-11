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

/** Cor da marca lida da página (o documento é HTML solto e não herda os tokens). */
function brand(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  } catch {
    return fallback
  }
}

export function printCss(): string {
  const accent = brand('--accent', '#f04e0a')
  const soft = brand('--accent-soft', '#fde8dd')
  const ink = brand('--accent-ink', '#a8340a')
  return `
  @page { size: A4; margin: 14mm 13mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: 'Manrope', 'Segoe UI', Arial, sans-serif; color: #1a1d21; font-size: 12.5px; line-height: 1.5; }
  h1, h2, h3, p { margin: 0; }
  .brand { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 3px solid ${accent}; }
  .brand b { font-size: 18px; letter-spacing: -0.01em; }
  .brand span { color: #5c636d; font-size: 11px; text-align: right; }
  h1 { font-size: 24px; letter-spacing: -0.02em; margin: 18px 0 4px; }
  h2 { font-size: 13px; margin: 24px 0 10px; text-transform: uppercase; letter-spacing: 0.08em; color: ${ink}; }
  .tag { display: inline-block; padding: 2px 10px; border-radius: 999px; background: ${soft}; color: ${ink}; font-weight: 700; font-size: 11px; }
  .hero { margin-top: 16px; border-radius: 16px; padding: 20px 24px; background: ${accent}; color: #fff; }
  .hero small { display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: .85; }
  .hero h1 { margin: 4px 0 6px; font-size: 26px; color: #fff; }
  .hero p { opacity: .92; font-size: 12.5px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 24px; }
  .kv { padding: 6px 0; border-bottom: 1px solid #e5e7ea; break-inside: avoid; }
  .kv small { display: block; color: #5c636d; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
  .kv b { font-size: 12.5px; }
  .counters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 16px; }
  .counter { border-radius: 14px; padding: 12px 14px; background: ${soft}; }
  .counter b { display: block; font-size: 30px; line-height: 1.1; letter-spacing: -0.03em; color: ${ink}; }
  .counter small { color: #3b4149; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .timeline { position: relative; margin-left: 5px; border-left: 2px solid #e5e7ea; }
  .event { position: relative; display: grid; grid-template-columns: 96px 1fr; gap: 14px; padding: 0 0 18px 20px; break-inside: avoid; }
  .event::before { content: ''; position: absolute; left: -7px; top: 3px; width: 12px; height: 12px; border-radius: 50%; background: ${accent}; border: 2px solid #fff; }
  .event time { color: #5c636d; font-size: 11px; font-weight: 600; }
  .event h3 { font-size: 13px; }
  .event p { color: #3b4149; }
  .photos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .photos figure { margin: 0; width: 136px; }
  .photos img { width: 136px; height: 100px; object-fit: cover; border-radius: 10px; display: block; background: #eef0f2; }
  .photos figcaption { font-size: 9.5px; color: #5c636d; margin-top: 2px; }
  .sign { margin-top: 10px; display: inline-block; border: 1px solid #e5e7ea; border-radius: 12px; padding: 8px 16px; }
  .sign img { display: block; height: 52px; max-width: 220px; object-fit: contain; }
  .sign small { color: #5c636d; font-size: 10.5px; }
  .kind-avaria h3 { color: #b42318; }
  .kind-avaria::before { background: #b42318; }
  .foot { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7ea; color: #5c636d; font-size: 10.5px; display: flex; justify-content: space-between; }
  .contract { white-space: pre-wrap; font-size: 12.5px; line-height: 1.65; }
  .contract h1 { text-align: center; font-size: 18px; margin: 18px 0; }
  .contract h3 { margin: 16px 0 4px; font-size: 12.5px; }
  .sigbox { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; break-inside: avoid; }
  .sigbox div { border-top: 1px solid #1a1d21; padding-top: 6px; min-height: 64px; font-size: 11.5px; }
  .sigbox img { display: block; height: 56px; margin-bottom: 4px; }
`
}
