import { formatDate, formatDateTime, formatMoney, formatPhone } from '@/lib/format'
import type { MonthlyClientReport } from '@/services'
import type { CompanyBrand } from './components/PublicShell'
import { initialsOf } from './components/PublicShell'

const esc = (s: string | number | undefined) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const abs = (src: string) => {
  try {
    return new URL(src, window.location.origin).href
  } catch {
    return src
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Documento HTML do relatório do mês, com a marca da locadora (resumo, serviços, fotos, assinaturas).
 * Fica autocontido (CSS no próprio documento) para abrir a impressão e salvar em PDF.
 */
export function buildReportHtml(company: CompanyBrand, report: MonthlyClientReport, cleaningLabelPlural: string): string {
  const t = report.totals
  const brand = esc(company.brandHex)
  const logo = company.logoDataUrl
    ? `<img class="logo" src="${esc(company.logoDataUrl)}" alt="" />`
    : `<span class="logo ini">${esc(initialsOf(company.name))}</span>`

  const kpis = [
    { n: t.servicesDone, l: 'Serviços feitos' },
    { n: report.cleanings.length, l: cap(cleaningLabelPlural) },
    { n: t.photos, l: 'Fotos' },
    { n: t.signed, l: 'Assinados no local' },
  ]
    .map((k) => `<div class="kpi"><b>${k.n}</b><span>${esc(k.l)}</span></div>`)
    .join('')

  const byType = report.servicesByType.length
    ? report.servicesByType.map((s) => `<li><span>${esc(s.label)}</span><b>${s.count}</b></li>`).join('')
    : '<li><span>Nenhum serviço concluído neste mês</span></li>'

  const rentals = report.rentals.length
    ? report.rentals.map((r) => `<li><span>${esc(r.title)} <em>${esc(r.code)}</em></span><b>${r.units}</b></li>`).join('')
    : '<li><span>Nenhuma locação no mês</span></li>'

  const services = report.cleanings
    .map((c) => {
      const photos = c.photos.slice(0, 6).map((p) => `<figure><img src="${esc(abs(p.src))}" alt="${esc(p.label)}" /><figcaption>${esc(p.label)}</figcaption></figure>`).join('')
      const sign = c.signature
        ? `<div class="sign">${c.signature.dataUrl ? `<img src="${esc(c.signature.dataUrl)}" alt="Assinatura" />` : ''}<div><b>${esc(c.signature.name)}</b><span>${esc(c.signature.role)}</span></div></div>`
        : ''
      const items = c.checklist.map((i) => `<li class="${i.ok ? 'ok' : 'no'}">${esc(i.label)}</li>`).join('')
      return `<section class="svc">
        <header><div><h3>${esc(c.typeLabel)}</h3><p>${esc(c.rentalTitle)}</p></div><time>${esc(formatDateTime(c.at))}</time></header>
        ${c.unitCodes.length ? `<p class="codes">${c.unitCodes.map((u) => `<span>${esc(u)}</span>`).join('')}</p>` : ''}
        ${photos ? `<div class="photos">${photos}</div>` : ''}
        ${sign}
        ${items ? `<ul class="check">${items}</ul>` : ''}
      </section>`
    })
    .join('')

  const invoices = report.invoices.length
    ? `<table><thead><tr><th>Fatura</th><th>Descrição</th><th>Vencimento</th><th class="r">Valor</th><th>Situação</th></tr></thead><tbody>${report.invoices
        .map(
          (i) =>
            `<tr><td>${esc(i.code)}</td><td>${esc(i.description)}</td><td>${esc(formatDate(i.dueAt))}</td><td class="r">${esc(formatMoney(i.value))}</td><td>${i.status === 'paga' ? 'Paga' : i.status === 'atrasada' ? 'Atrasada' : 'Aberta'}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="muted">Nenhuma fatura emitida neste mês.</p>'

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" /><title>Relatório de ${esc(report.label)} - ${esc(report.client.name)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #17191c; font-size: 12px; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cover { background: ${brand}; color: #fff; border-radius: 18px; padding: 22px 26px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .brandrow { display: flex; align-items: center; gap: 12px; }
  .logo { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; background: rgba(255,255,255,.2); display: grid; place-items: center; font-weight: 800; font-size: 16px; }
  .cover h1 { margin: 0; font-size: 22px; letter-spacing: -.02em; }
  .cover .who { text-align: right; font-size: 12px; opacity: .92; }
  .cover .who b { display: block; font-size: 15px; }
  h2 { font-size: 15px; margin: 22px 0 8px; letter-spacing: -.01em; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
  .kpi { border: 1px solid #e3e5e8; border-radius: 14px; padding: 12px 14px; }
  .kpi b { display: block; font-size: 26px; letter-spacing: -.03em; color: ${brand}; }
  .kpi span { color: #5b616a; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  ul.list { list-style: none; margin: 0; padding: 0; border: 1px solid #e3e5e8; border-radius: 14px; }
  ul.list li { display: flex; justify-content: space-between; gap: 10px; padding: 8px 14px; border-bottom: 1px solid #eef0f2; }
  ul.list li:last-child { border-bottom: 0; }
  em { color: #5b616a; font-style: normal; }
  .svc { border: 1px solid #e3e5e8; border-radius: 14px; padding: 14px; margin-bottom: 10px; break-inside: avoid; }
  .svc header { display: flex; justify-content: space-between; gap: 10px; }
  .svc h3 { margin: 0; font-size: 14px; }
  .svc p { margin: 2px 0 0; color: #5b616a; }
  .svc time { font-weight: 700; white-space: nowrap; }
  .codes { margin-top: 8px !important; }
  .codes span { display: inline-block; background: #f1f2f4; border-radius: 99px; padding: 2px 9px; margin: 0 4px 4px 0; font-weight: 700; color: #17191c; }
  .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
  .photos figure { margin: 0; }
  .photos img { width: 100%; height: 96px; object-fit: cover; border-radius: 10px; display: block; background: #eee; }
  .photos figcaption { font-size: 10px; color: #5b616a; margin-top: 2px; }
  .sign { display: flex; align-items: center; gap: 12px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #d4d7db; }
  .sign img { height: 44px; background: #fff; }
  .sign span { display: block; color: #5b616a; }
  .check { list-style: none; padding: 0; margin: 10px 0 0; columns: 2; font-size: 11px; }
  .check li::before { content: '\\2713  '; color: ${brand}; font-weight: 800; }
  .check li.no::before { content: '\\2715  '; color: #b3261e; }
  table { width: 100%; border-collapse: collapse; border: 1px solid #e3e5e8; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eef0f2; }
  th { background: #f6f7f8; font-size: 11px; }
  .r { text-align: right; white-space: nowrap; }
  .totals { display: flex; gap: 18px; margin-top: 8px; font-weight: 700; }
  .muted { color: #5b616a; }
  footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e3e5e8; color: #5b616a; font-size: 11px; display: flex; justify-content: space-between; }
</style></head>
<body>
  <div class="cover">
    <div class="brandrow">${logo}<div><h1>Relatório de ${esc(report.label)}</h1><span>${esc(company.name)}</span></div></div>
    <div class="who"><b>${esc(report.client.name)}</b>${esc(report.client.cnpj)}</div>
  </div>
  <div class="kpis">${kpis}</div>
  <div class="cols">
    <div><h2>Serviços por tipo</h2><ul class="list">${byType}</ul></div>
    <div><h2>Locações no mês</h2><ul class="list">${rentals}</ul></div>
  </div>
  ${report.cleanings.length ? `<h2>Comprovantes de ${esc(cleaningLabelPlural)}</h2>${services}` : ''}
  <h2>Faturas</h2>
  ${invoices}
  <div class="totals"><span>Faturado ${esc(formatMoney(t.invoiced))}</span><span>Pago ${esc(formatMoney(t.paid))}</span><span>Em aberto ${esc(formatMoney(t.open))}</span></div>
  <footer><span>${esc(company.name)}${company.whatsapp ? ' · WhatsApp ' + esc(formatPhone(company.whatsapp)) : ''}${company.email ? ' · ' + esc(company.email) : ''}</span><span>Ambiente de demonstração</span></footer>
</body></html>`
}

/** Monta o documento num quadro invisível e abre a impressão do navegador (salvar em PDF) */
export function printReport(html: string): Promise<void> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('data-portal-report', '')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
    frame.srcdoc = html
    frame.onload = () => {
      const win = frame.contentWindow
      // aguarda as imagens do documento antes de imprimir
      const imgs = Array.from(win?.document.images ?? [])
      Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise<void>((r) => { i.onload = i.onerror = () => r() })))).then(() => {
        try {
          win?.focus()
          win?.print()
        } catch {
          /* impressão indisponível neste navegador */
        }
        resolve()
        window.setTimeout(() => frame.remove(), 60_000)
      })
    }
    document.body.appendChild(frame)
  })
}
