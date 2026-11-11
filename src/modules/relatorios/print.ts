import type { MonthlyClientReport, SegmentLabels, Settings } from '@/services'
import { CHARGE_STATUS } from '@/app/status'
import { formatDate, formatDateTime, formatMoney, formatPhone } from '@/lib/format'
import { capitalize } from './lib'

const esc = (s: string | number) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Cores da marca lidas da página (já derivadas para contraste), com a cor cadastrada como reserva. */
export function brandColors(settings: Settings): { accent: string; on: string } {
  const el = document.querySelector('.ds-root') ?? document.documentElement
  const cs = getComputedStyle(el)
  const accent = cs.getPropertyValue('--accent-active').trim() || cs.getPropertyValue('--accent').trim() || settings.brandHex
  const on = cs.getPropertyValue('--on-accent').trim() || '#ffffff'
  return { accent, on }
}

const CSS = `
*{box-sizing:border-box}
@page{size:A4;margin:14mm}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:'Manrope',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#14110f;font-size:13px;line-height:1.45;background:#fff}
.head{background:var(--accent);color:var(--on);border-radius:18px;padding:26px 30px}
.head .top{display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:700}
.brand img{width:40px;height:40px;border-radius:10px;background:#fff;object-fit:contain;padding:3px}
.brand .dot{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center;font-size:14px}
.month{font-weight:700;font-size:14px}
h1{margin:26px 0 2px;font-size:30px;line-height:1.1;letter-spacing:-.02em}
.cnpj{opacity:.88;font-variant-numeric:tabular-nums}
.sum{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin:26px 0 12px}
.sum b{display:block;font-size:30px;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.sum span{display:block;margin-top:8px;font-weight:600;color:#5f5a56}
.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0;margin:0 0 6px;list-style:none}
.chips li{background:#f0eeec;border-radius:99px;padding:3px 11px;font-size:11.5px;font-weight:700}
h2{font-size:17px;margin:28px 0 8px;letter-spacing:-.01em}
.item{border-top:1px solid #e3e0dd;padding:11px 0;break-inside:avoid}
.item:first-of-type{border-top:0}
.row{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
.row b{font-variant-numeric:tabular-nums}
.muted{color:#5f5a56}
.photos{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 6px}
.photos img{width:62px;height:62px;border-radius:9px;object-fit:cover;background:#f0eeec}
.sig{color:#3d3935}
.inv{border-top:1px solid #e3e0dd;padding:9px 0;display:grid;grid-template-columns:1fr auto;gap:2px 12px;break-inside:avoid}
.inv:first-of-type{border-top:0}
.small{font-size:11.5px;color:#5f5a56}
.tot{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;border-top:2px solid #14110f;margin-top:12px;padding-top:12px}
.tot b{display:block;font-size:18px;font-variant-numeric:tabular-nums;white-space:nowrap}
.tot span{font-size:11.5px;font-weight:600;color:#5f5a56}
footer{margin-top:30px;border-top:1px solid #e3e0dd;padding-top:10px;font-size:11.5px;color:#5f5a56}
`

/** Documento HTML próprio do relatório mensal, pronto para a impressão do navegador. */
export function buildReportHtml(opts: { report: MonthlyClientReport; settings: Settings; labels: SegmentLabels; colors: { accent: string; on: string }; origin: string }): string {
  const { report: r, settings, labels, colors, origin } = opts
  const c = settings.company
  const t = r.totals
  const abs = (src: string) => (src.startsWith('/') ? origin + src : src)
  const cleanings = r.cleanings
    .map(
      (x) => `<div class="item">
  <div class="row"><b>${esc(formatDateTime(x.at))}</b><span class="muted">${esc(x.unitCodes.length ? x.unitCodes.slice(0, 4).join(', ') + (x.unitCodes.length > 4 ? ` e mais ${x.unitCodes.length - 4}` : '') : x.rentalCode)}</span></div>
  ${x.photos.length ? `<div class="photos">${x.photos.slice(0, 4).map((p) => `<img src="${esc(abs(p.src))}" alt="${esc(p.label)}">`).join('')}</div>` : ''}
  <div class="sig">${x.signature ? `Assinado por <b>${esc(x.signature.name)}</b>, ${esc(x.signature.role)}` : 'Sem assinatura'}</div>
</div>`,
    )
    .join('')
  const invoices = r.invoices
    .map(
      (i) => `<div class="inv"><span>${esc(i.description)}</span><b>${esc(formatMoney(i.value))}</b><span class="small">${esc(i.code)} · vence em ${esc(formatDate(i.dueAt))}</span><span class="small"><b>${esc(CHARGE_STATUS[i.status].label)}</b></span></div>`,
    )
    .join('')
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de ${esc(r.label)} - ${esc(r.client.name)}</title>
<style>:root{--accent:${colors.accent};--on:${colors.on}}${CSS}</style></head>
<body>
<div class="head">
  <div class="top">
    <div class="brand">${settings.logoDataUrl ? `<img src="${esc(settings.logoDataUrl)}" alt="">` : `<span class="dot">${esc(c.name.slice(0, 2).toUpperCase())}</span>`}<span>${esc(c.name)}</span></div>
    <div class="month">${esc(capitalize(r.label))}</div>
  </div>
  <h1>${esc(r.client.name)}</h1>
  <div class="cnpj">${esc(r.client.cnpj)}</div>
</div>
<div class="sum">
  <div><b>${t.servicesDone}</b><span>Serviços feitos</span></div>
  <div><b>${t.photos}</b><span>Fotos</span></div>
  <div><b>${t.signed}</b><span>Assinaturas</span></div>
  <div><b>${esc(formatMoney(t.invoiced))}</b><span>Faturado</span></div>
</div>
${r.servicesByType.length ? `<ul class="chips">${r.servicesByType.map((s) => `<li>${esc(s.label)} ${s.count}</li>`).join('')}</ul>` : ''}
<h2>${esc(capitalize(labels.cleaningPlural))}</h2>
${cleanings || `<div class="muted">Nenhum serviço de ${esc(labels.cleaning)} neste mês.</div>`}
<h2>Valores</h2>
${invoices || '<div class="muted">Nenhuma cobrança emitida neste mês.</div>'}
<div class="tot"><div><span>Faturado</span><b>${esc(formatMoney(t.invoiced))}</b></div><div><span>Pago</span><b>${esc(formatMoney(t.paid))}</b></div><div><span>Em aberto</span><b>${esc(formatMoney(t.open))}</b></div></div>
<footer>${esc(c.legalName)} · ${esc(c.cnpj)}<br>${esc(formatPhone(c.phone))} · ${esc(c.email)}</footer>
</body></html>`
}

/** Monta o documento num quadro oculto e chama a impressão do navegador (salvar como PDF). */
export function printHtml(html: string): Promise<void> {
  document.getElementById('relatorio-print-frame')?.remove()
  const frame = document.createElement('iframe')
  frame.id = 'relatorio-print-frame'
  frame.setAttribute('aria-hidden', 'true')
  frame.title = 'Documento para impressão'
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  return new Promise((resolve) => {
    frame.onload = async () => {
      const doc = frame.contentDocument
      const win = frame.contentWindow
      if (!doc || !win) return resolve()
      const imgs = [...doc.images]
      await Promise.race([
        Promise.all(imgs.map((i) => (i.complete ? null : new Promise((res) => ((i.onload = res), (i.onerror = res)))))),
        new Promise((res) => window.setTimeout(res, 5000)),
      ])
      win.focus()
      win.print()
      frame.dataset.printed = 'true'
      resolve()
    }
    frame.srcdoc = html
    document.body.appendChild(frame)
  })
}
