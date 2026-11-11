import { formatDate, formatDateTime, formatMoney, formatCNPJ, formatPhone } from '@/lib/format'
import { RENTAL_STATUS } from '@/app/status'
import type { Company, Contract, RentalDetail, ServicePhoto } from '@/services'
import { printCss, printHtml } from './print'
import { cleanTitle, esc } from './util'

const abs = (src: string) => (/^(data:|https?:)/.test(src) ? src : new URL(src, window.location.origin).href)

function head(company: Company, title: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${printCss()}</style></head><body>
  <div class="brand"><b>${esc(company.name)}</b><span>${esc(company.legalName)} · CNPJ ${esc(formatCNPJ(company.cnpj))}<br>${esc(company.phone)} · ${esc(company.email)}</span></div>`
}

function foot(company: Company): string {
  return `<div class="foot"><span>${esc(company.name)} · ${esc(company.city)}</span><span>Gerado em ${esc(formatDateTime(new Date()))}</span></div></body></html>`
}

function photosHtml(photos?: ServicePhoto[]): string {
  if (!photos?.length) return ''
  return `<div class="photos">${photos.map((p) => `<figure><img src="${esc(abs(p.src))}" alt="${esc(p.label)}"><figcaption>${esc(p.label)}</figcaption></figure>`).join('')}</div>`
}

export interface DossierCounts {
  photos: number
  signatures: number
  checklists: number
}

export function dossierCounts(d: RentalDetail): DossierCounts {
  const photos = d.dossier.reduce((a, e) => a + (e.photos?.length ?? 0), 0)
  const signatures = d.dossier.filter((e) => e.signature).length + (d.rental.contract?.signedAt ? 1 : 0)
  const checklists = d.services.filter((s) => s.report?.checklist?.length).length
  return { photos, signatures, checklists }
}

/** HTML completo do dossiê de prova da locação */
export function buildDossierHtml(d: RentalDetail, company: Company): string {
  const r = d.rental
  const counts = dossierCounts(d)
  const st = RENTAL_STATUS[r.status].label
  const items = d.items.map((i) => `${i.qty} x ${esc(i.type.name)}${i.units.length ? ` (${i.units.map((u) => esc(u.code)).join(', ')})` : ''}`).join('<br>')
  const events = d.dossier
    .map((e) => {
      const sig = e.signature
        ? `<div class="sign">${e.signature.dataUrl ? `<img src="${esc(e.signature.dataUrl)}" alt="Assinatura de ${esc(e.signature.name)}">` : ''}<small>Assinado por ${esc(e.signature.name)}, ${esc(e.signature.role)}</small></div>`
        : ''
      return `<div class="event kind-${e.kind}"><time>${esc(formatDateTime(e.at))}</time><div><h3>${esc(e.title)}</h3>${e.detail ? `<p>${esc(e.detail)}</p>` : ''}${photosHtml(e.photos)}${sig}</div></div>`
    })
    .join('')
  return (
    head(company, `Dossiê ${r.code}`) +
    `<div class="hero"><small>Dossiê de prova · ${esc(r.code)} · ${esc(st)}</small><h1>${esc(cleanTitle(r.title))}</h1><p>${esc(d.client.name)} · ${esc(formatDate(r.start))} a ${esc(formatDate(r.end))}</p></div>
    <div class="counters">
      <div class="counter"><b>${d.dossier.length}</b><small>Registros</small></div>
      <div class="counter"><b>${counts.photos}</b><small>Fotos</small></div>
      <div class="counter"><b>${counts.signatures}</b><small>Assinaturas</small></div>
      <div class="counter"><b>${counts.checklists}</b><small>Checklists</small></div>
    </div>
    <h2>Dados da locação</h2>
    <div class="grid">
      <div class="kv"><small>Cliente</small><b>${esc(d.client.name)}</b></div>
      <div class="kv"><small>Período</small><b>${esc(formatDate(r.start))} a ${esc(formatDate(r.end))}</b></div>
      <div class="kv"><small>Endereço</small><b>${esc(r.address)}</b></div>
      <div class="kv"><small>Contato no local</small><b>${esc(r.contact.name)}, ${esc(r.contact.role)} · ${esc(formatPhone(r.contact.phone))}</b></div>
      <div class="kv"><small>Equipamentos</small><b>${items}</b></div>
      <div class="kv"><small>Valor total</small><b>${esc(formatMoney(d.financial.total))}</b></div>
    </div>
    <h2>Registros em ordem cronológica</h2>
    <div class="timeline">${events || '<p>Nenhum registro até o momento.</p>'}</div>` +
    foot(company)
  )
}

/** HTML do contrato (texto, mais o bloco de assinatura) */
export function buildContractHtml(text: string, contract: Contract | undefined, company: Company, code: string, signer?: string): string {
  const lines = text.split('\n')
  const body = lines
    .map((l, i) => {
      if (i === 0) return `<h1>${esc(l)}</h1>`
      if (/^CLÁUSULA/.test(l)) return `<h3>${esc(l)}</h3>`
      return l ? `${esc(l)}\n` : '\n'
    })
    .join('')
  const sig = contract?.signedAt
    ? `<div>${contract.signatureDataUrl ? `<img src="${esc(contract.signatureDataUrl)}" alt="Assinatura">` : ''}${esc(contract.signedBy ?? signer ?? '')}<br>Assinado em ${esc(formatDateTime(contract.signedAt))}</div>`
    : '<div>Locatária<br>&nbsp;</div>'
  return head(company, `Contrato ${code}`) + `<div class="contract">${body}</div><div class="sigbox"><div>${esc(company.legalName)}<br>Locadora</div>${sig}</div>` + foot(company)
}

export async function printDossier(d: RentalDetail, company: Company) {
  await printHtml(buildDossierHtml(d, company), `dossie-${d.rental.code}`)
}

export async function printContract(text: string, d: RentalDetail, company: Company) {
  await printHtml(buildContractHtml(text, d.rental.contract, company, d.rental.code), `contrato-${d.rental.code}`)
}
