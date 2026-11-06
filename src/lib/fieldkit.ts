import { BAIRRO } from '@/data/geo'
import { PRODUCT, RENTAL, qtyLabel, type Job, type ProductId, type RentalItem } from '@/data/mock'

/** Link para abrir o endereço do serviço no Waze ou no Google Maps (sem calcular nada no sistema). */
export function navLinks(job: Job) {
  const r = RENTAL[job.rentalId]
  const q = encodeURIComponent(`${r.address}, ${BAIRRO[r.bairro].name}, Brasília, DF`)
  return {
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
    maps: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  }
}

/** Itens da locação que este serviço movimenta (montagem dividida em dias usa job.products) */
export function jobItems(j: Job): RentalItem[] {
  const r = RENTAL[j.rentalId]
  return j.products ? r.items.filter((i) => j.products!.includes(i.productId)) : r.items
}

/** Carga do caminhão: o que sai da base para os serviços do dia. */
export interface LoadItem {
  id: string
  group: 'Equipamentos' | 'Insumos de limpeza' | 'Ferramentas e peças'
  label: string
  qty: number
  unit: string
  /** títulos das locações que usam o item */
  forSites: string[]
}

const UNIT_PLURAL: Record<string, [string, string]> = {
  rolo: ['rolo', 'rolos'],
  litro: ['litro', 'litros'],
  galão: ['galão', 'galões'],
  pacote: ['pacote', 'pacotes'],
  un: ['un', 'un'],
  kit: ['kit', 'kits'],
}

export function loadQtyLabel(it: LoadItem) {
  const u = UNIT_PLURAL[it.unit]
  if (u) return `${it.qty.toLocaleString('pt-BR')} ${it.qty === 1 ? u[0] : u[1]}`
  return `${it.qty.toLocaleString('pt-BR')} ${it.unit}`
}

/**
 * Montagem leva os equipamentos da locação. Limpeza leva insumos por unidade
 * (papel, produto químico, sabonete, sacos). Manutenção leva peças.
 */
export function buildLoad(jobs: Job[]): LoadItem[] {
  const map = new Map<string, LoadItem>()
  const add = (id: string, group: LoadItem['group'], label: string, qty: number, unit: string, site: string) => {
    const cur = map.get(id)
    if (cur) {
      cur.qty += qty
      if (!cur.forSites.includes(site)) cur.forSites.push(site)
    } else map.set(id, { id, group, label, qty, unit, forSites: [site] })
  }
  for (const j of jobs) {
    const r = RENTAL[j.rentalId]
    const site = r.title
    if (j.type === 'Montagem') {
      const items = jobItems(j)
      for (const it of items) {
        const p = PRODUCT[it.productId]
        add(`eq-${it.productId}`, 'Equipamentos', p.short, it.qty, p.unit[1], site)
      }
      const toilets = items.filter((i) => i.productId.startsWith('bq')).reduce((a, i) => a + i.qty, 0)
      if (toilets) add('quimico', 'Insumos de limpeza', 'Produto químico (carga inicial)', Math.ceil(toilets * 0.5), 'litro', site)
      const tents = items.filter((i) => i.productId.startsWith('tenda')).reduce((a, i) => a + i.qty, 0)
      if (tents) add('estacas', 'Ferramentas e peças', 'Estacas e cintas para tenda', tents, 'kit', site)
      if (items.some((i) => i.productId.startsWith('trailer'))) add('extensao', 'Ferramentas e peças', 'Cabo de energia 30 m', 1, 'un', site)
    }
    if (j.type === 'Limpeza') {
      const n = j.units
      add('papel', 'Insumos de limpeza', 'Papel higiênico', n * 2, 'rolo', site)
      add('quimico', 'Insumos de limpeza', 'Produto químico', Math.ceil(n * 0.5), 'litro', site)
      add('desinfetante', 'Insumos de limpeza', 'Desinfetante', Math.ceil(n / 6), 'galão', site)
      add('sacos', 'Insumos de limpeza', 'Sacos de lixo', Math.ceil(n / 4), 'pacote', site)
      if (r.items.some((i) => i.productId === 'bq-luxo' || i.productId.startsWith('trailer') || i.productId === 'bq-pne')) add('sabonete', 'Insumos de limpeza', 'Sabonete líquido e papel toalha', 1, 'kit', site)
    }
    if (j.type === 'Manutenção') {
      if (/porta|trava/i.test(j.note)) add('trava', 'Ferramentas e peças', 'Trava e dobradiça de porta', 1, 'kit', site)
      if (/vazamento|vedação/i.test(j.note)) add('vedacao', 'Ferramentas e peças', 'Kit de vedação do tanque', 1, 'kit', site)
      add('ferramentas', 'Ferramentas e peças', 'Caixa de ferramentas', 1, 'un', site)
    }
    if (j.type === 'Retirada') add('cintas', 'Ferramentas e peças', 'Cintas de amarração', Math.max(4, Math.ceil(j.units / 6)), 'un', site)
  }
  return [...map.values()]
}

/** Equipamentos que saem ou voltam para a base no dia */
export function equipmentMoves(jobs: Job[]) {
  const out: { productId: ProductId; qty: number; dir: 'sai' | 'volta'; site: string }[] = []
  for (const j of jobs) {
    if (j.type !== 'Montagem' && j.type !== 'Retirada') continue
    const r = RENTAL[j.rentalId]
    for (const it of jobItems(j)) out.push({ productId: it.productId, qty: it.qty, dir: j.type === 'Montagem' ? 'sai' : 'volta', site: r.title })
  }
  return out
}

export { qtyLabel }
