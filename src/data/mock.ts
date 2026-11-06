import { BAIRRO, type ZoneId } from './geo'
import { day, daysFromToday, iso, TODAY } from './time'

/* ───────────────────────── Empresa e usuário ───────────────────────── */

export const COMPANY = {
  name: 'R8 Eventos',
  short: 'R8',
  city: 'Brasília · DF',
  whatsapp: '(61) 99996-1628',
  site: 'r8eventos.com.br',
  instagram: '@r8eventosbrasilia_',
  base: 'SIA Trecho 3, Brasília',
}

/** Quem está "logado" no protótipo */
export const CURRENT_USER = { name: 'Paula Ramos', role: 'Operação', initials: 'PR' }

/* ───────────────────────── Equipes (caminhões) ───────────────────────── */

export interface Team {
  id: string
  name: string
  short: string
  initials: string
  members: string[]
  truck: string
  plate: string
  focus: string
  color: string
  phone: string
}

export const TEAMS: Team[] = [
  { id: 'fabio', name: 'Equipe Fábio', short: 'Fábio', initials: 'FC', members: ['Fábio Cardoso', 'Renan Lopes'], truck: 'Caminhão 01 · Sucção', plate: 'QHL-2A57', focus: 'Limpeza e sucção', color: '#7b6cf0', phone: '(61) 99641-2207' },
  { id: 'marcos', name: 'Equipe Marcos', short: 'Marcos', initials: 'MA', members: ['Marcos Araújo', 'Júnior Souza'], truck: 'Caminhão 02 · Sucção', plate: 'REX-4B21', focus: 'Limpeza e sucção', color: '#1fa7a0', phone: '(61) 99218-5530' },
  { id: 'wesley', name: 'Equipe Wesley', short: 'Wesley', initials: 'WS', members: ['Wesley Santos', 'Daniel Rocha', 'Igor Melo'], truck: 'Caminhão 03 · Munck', plate: 'PBT-7C08', focus: 'Montagem e retirada', color: '#3d7afa', phone: '(61) 99375-0814' },
]
export const TEAM = Object.fromEntries(TEAMS.map((t) => [t.id, t])) as Record<string, Team>

/* ───────────────────────── Produtos (o que a R8 aluga) ───────────────────────── */

export type ProductId = 'bq' | 'bq-pne' | 'bq-luxo' | 'trailer-2' | 'trailer-4' | 'alambrado' | 'fechamento' | 'tenda-5' | 'tenda-10' | 'balcao'
export type ProductGroup = 'Banheiros' | 'Estruturas'

export interface Product {
  id: ProductId
  name: string
  short: string
  group: ProductGroup
  /** singular e plural da unidade de contagem ("banheiro", "banheiros") */
  unit: [string, string]
  stock: number
  /** prefixo do número de patrimônio (itens rastreados um a um, com QR na porta) */
  prefix?: string
  /** recebe limpeza e sucção periódica */
  cleanable: boolean
  photo: string
  priceDay: number
  priceMonth?: number
  note: string
}

export const PRODUCTS: Product[] = [
  { id: 'bq', name: 'Banheiro químico standard', short: 'Banheiro químico', group: 'Banheiros', unit: ['banheiro', 'banheiros'], stock: 140, prefix: 'BQ', cleanable: true, photo: '/produtos/banheiro-quimico.jpg', priceDay: 180, priceMonth: 390, note: 'Obras e eventos. Com mictório e suporte de papel.' },
  { id: 'bq-pne', name: 'Banheiro químico PNE', short: 'Banheiro PNE', group: 'Banheiros', unit: ['banheiro PNE', 'banheiros PNE'], stock: 16, prefix: 'PNE', cleanable: true, photo: '/produtos/banheiro-quimico.jpg', priceDay: 260, priceMonth: 540, note: 'Acessível, com barras de apoio e rampa.' },
  { id: 'bq-luxo', name: 'Banheiro químico com pia', short: 'Banheiro com pia', group: 'Banheiros', unit: ['banheiro com pia', 'banheiros com pia'], stock: 20, prefix: 'LX', cleanable: true, photo: '/produtos/banheiro-quimico.jpg', priceDay: 240, priceMonth: 480, note: 'Pia com pedal, espelho e saboneteira.' },
  { id: 'trailer-2', name: 'Banheiro trailer 2 boxes', short: 'Trailer 2 boxes', group: 'Banheiros', unit: ['trailer', 'trailers'], stock: 3, prefix: 'TR2', cleanable: true, photo: '/produtos/trailer.jpg', priceDay: 1800, note: 'Climatizado, acabamento VIP. Precisa de ponto de energia.' },
  { id: 'trailer-4', name: 'Banheiro trailer 4 boxes', short: 'Trailer 4 boxes', group: 'Banheiros', unit: ['trailer', 'trailers'], stock: 3, prefix: 'TR4', cleanable: true, photo: '/produtos/trailer.jpg', priceDay: 2900, note: 'Climatizado, masculino e feminino. Precisa de ponto de energia.' },
  { id: 'alambrado', name: 'Alambrado (grade de 2 m)', short: 'Alambrado', group: 'Estruturas', unit: ['grade', 'grades'], stock: 900, cleanable: false, photo: '/produtos/alambrado.jpg', priceDay: 12, note: 'Contenção e controle de público.' },
  { id: 'fechamento', name: 'Fechamento metálico galvanizado', short: 'Fechamento', group: 'Estruturas', unit: ['painel', 'painéis'], stock: 600, cleanable: false, photo: '/produtos/fechamento.jpg', priceDay: 14, priceMonth: 95, note: 'Painéis de 2,2 m para obras e eventos.' },
  { id: 'tenda-5', name: 'Tenda pirâmide 5 x 5', short: 'Tenda 5 x 5', group: 'Estruturas', unit: ['tenda', 'tendas'], stock: 40, cleanable: false, photo: '/produtos/tenda.jpg', priceDay: 320, note: 'Lona branca antichama.' },
  { id: 'tenda-10', name: 'Tenda pirâmide 10 x 10', short: 'Tenda 10 x 10', group: 'Estruturas', unit: ['tenda', 'tendas'], stock: 12, cleanable: false, photo: '/produtos/tenda.jpg', priceDay: 890, note: 'Lona branca antichama, com calhas.' },
  { id: 'balcao', name: 'Balcão de bar (módulo 2 m)', short: 'Balcão de bar', group: 'Estruturas', unit: ['balcão', 'balcões'], stock: 30, cleanable: false, photo: '/produtos/balcao.jpg', priceDay: 150, note: 'Chapa xadrez e frente galvanizada.' },
]
export const PRODUCT = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<ProductId, Product>

/** "8 banheiros", "1 trailer", "300 grades" */
export function qtyLabel(productId: ProductId, qty: number) {
  const u = PRODUCT[productId].unit
  return `${qty.toLocaleString('pt-BR')} ${qty === 1 ? u[0] : u[1]}`
}

/* ───────────────────────── Clientes ───────────────────────── */

export type ClientKind = 'Construtora' | 'Produtora' | 'Cerimonial' | 'Assessoria esportiva' | 'Órgão público' | 'Igreja' | 'Paróquia'

export interface Client {
  id: string
  name: string
  kind: ClientKind
  cnpj: string
  email: string
}

export const CLIENTS: Client[] = [
  { id: 'vertice', name: 'Construtora Vértice', kind: 'Construtora', cnpj: '12.418.330/0001-07', email: 'obras@vertice.com.br' },
  { id: 'habitar', name: 'Habitar Engenharia', kind: 'Construtora', cnpj: '08.774.512/0001-90', email: 'suprimentos@habitar.eng.br' },
  { id: 'planalto', name: 'Planalto Obras e Reformas', kind: 'Construtora', cnpj: '31.205.887/0001-44', email: 'contato@planaltoobras.com.br' },
  { id: 'consorcio', name: 'Consórcio Viário Norte', kind: 'Construtora', cnpj: '45.902.116/0001-28', email: 'adm@cvnorte.com.br' },
  { id: 'ipe', name: 'Construtora Ipê', kind: 'Construtora', cnpj: '22.631.049/0001-73', email: 'engenharia@construtoraipe.com.br' },
  { id: 'arena', name: 'Arena Produções', kind: 'Produtora', cnpj: '19.554.703/0001-12', email: 'producao@arenaproducoes.com.br' },
  { id: 'casarbem', name: 'Casar Bem Cerimonial', kind: 'Cerimonial', cnpj: '27.118.946/0001-55', email: 'eventos@casarbem.com.br' },
  { id: 'correbsb', name: 'Corre Brasília Assessoria', kind: 'Assessoria esportiva', cnpj: '33.470.218/0001-61', email: 'provas@correbrasilia.com.br' },
  { id: 'graca', name: 'Igreja Comunidade da Graça', kind: 'Igreja', cnpj: '05.881.374/0001-09', email: 'secretaria@comunidadedagraca.org' },
  { id: 'adm-gama', name: 'Administração Regional do Gama', kind: 'Órgão público', cnpj: '16.615.075/0001-38', email: 'eventos.gama@df.gov.br' },
  { id: 'paroquia', name: 'Paróquia N. S. Aparecida', kind: 'Paróquia', cnpj: '00.410.229/0001-80', email: 'corrida@paroquiaaparecida.org' },
]
export const CLIENT = Object.fromEntries(CLIENTS.map((c) => [c.id, c])) as Record<string, Client>

/* ───────────────────────── Locações ───────────────────────── */

export type RentalKind = 'obra' | 'evento'
/** montagem: ainda vai para o local · ativa: equipamento no local · retirada: acabou e falta recolher · encerrada */
export type RentalStatus = 'montagem' | 'ativa' | 'retirada' | 'encerrada'

export interface RentalItem {
  productId: ProductId
  qty: number
}

export interface Rental {
  id: string
  code: string
  clientId: string
  title: string
  kind: RentalKind
  address: string
  bairro: string
  /** dia da montagem (equipamento chega ao local) */
  start: string
  /** dia previsto da retirada */
  end: string
  /** só eventos: dias do evento */
  eventDays?: [string, string]
  items: RentalItem[]
  /** limpezas por semana em obras; em eventos a limpeza é diária durante o evento */
  cleanPerWeek: number
  contact: { name: string; role: string; phone: string }
  access?: string
  status: RentalStatus
  /** valor mensal (obra) ou total (evento) */
  value: number
  /** equipe responsável pelas limpezas */
  teamId: string
}

let rSeq = 1031
function rental(p: Omit<Rental, 'code'>): Rental {
  rSeq += 7
  return { code: `LOC-${rSeq}`, ...p }
}

export const RENTALS: Rental[] = [
  rental({
    id: 'jardins', clientId: 'vertice', title: 'Residencial Jardins do Lago', kind: 'obra',
    address: 'SMDB Conjunto 12, lote 4', bairro: 'jardim-botanico', start: iso(-64), end: iso(58),
    items: [{ productId: 'bq', qty: 8 }, { productId: 'bq-pne', qty: 1 }, { productId: 'fechamento', qty: 120 }], cleanPerWeek: 3,
    contact: { name: 'Eng. Paulo Mendes', role: 'Engenheiro da obra', phone: '(61) 99812-3306' },
    access: 'Portão 2. Caminhão entra pela rua de trás. Falar com o mestre de obras Sr. Valdir.', status: 'ativa', value: 4180, teamId: 'fabio',
  }),
  rental({
    id: 'noroeste', clientId: 'vertice', title: 'Edifício Noroeste 104', kind: 'obra',
    address: 'SQNW 104, Projeção H', bairro: 'noroeste', start: iso(-120), end: iso(95),
    items: [{ productId: 'bq', qty: 6 }, { productId: 'fechamento', qty: 80 }], cleanPerWeek: 2,
    contact: { name: 'Eng. Larissa Prado', role: 'Engenheira residente', phone: '(61) 99640-1177' },
    access: 'Entrada pela via W9. Identificar na guarita.', status: 'ativa', value: 2940, teamId: 'fabio',
  }),
  rental({
    id: 'torre36', clientId: 'habitar', title: 'Torre Rua 36 Águas Claras', kind: 'obra',
    address: 'Rua 36 Norte, lote 7', bairro: 'aguas-claras', start: iso(-210), end: iso(150),
    items: [{ productId: 'bq', qty: 10 }, { productId: 'bq-pne', qty: 2 }], cleanPerWeek: 3,
    contact: { name: 'Carla Nogueira', role: 'Administrativo da obra', phone: '(61) 99377-1158' },
    access: 'Caminhão para na Rua 36. Banheiros no térreo, ao lado do almoxarifado.', status: 'ativa', value: 5020, teamId: 'marcos',
  }),
  rental({
    id: 'smart', clientId: 'habitar', title: 'Condomínio Smart Taguatinga', kind: 'obra',
    address: 'QSD 28, lote 1', bairro: 'taguatinga', start: iso(-45), end: iso(120),
    items: [{ productId: 'bq', qty: 6 }, { productId: 'bq-pne', qty: 1 }], cleanPerWeek: 2,
    contact: { name: 'Mestre Raimundo', role: 'Mestre de obras', phone: '(61) 98455-0921' },
    status: 'ativa', value: 2880, teamId: 'marcos',
  }),
  rental({
    id: 'escola', clientId: 'planalto', title: 'Reforma Escola Classe 308 Sul', kind: 'obra',
    address: 'SQS 308, Área especial', bairro: 'asa-sul', start: iso(-40), end: iso(3),
    items: [{ productId: 'bq', qty: 3 }], cleanPerWeek: 1,
    contact: { name: 'Ronaldo Teixeira', role: 'Encarregado', phone: '(61) 99260-7735' },
    access: 'Entrar pelo estacionamento lateral. Só depois das 11h por causa das aulas.', status: 'ativa', value: 1170, teamId: 'fabio',
  }),
  rental({
    id: 'galpao', clientId: 'planalto', title: 'Galpão SIA Trecho 5', kind: 'obra',
    address: 'SIA Trecho 5, lote 120', bairro: 'sia', start: iso(-28), end: iso(62),
    items: [{ productId: 'bq', qty: 4 }, { productId: 'fechamento', qty: 60 }], cleanPerWeek: 2,
    contact: { name: 'Ronaldo Teixeira', role: 'Encarregado', phone: '(61) 99260-7735' },
    status: 'ativa', value: 2130, teamId: 'marcos',
  }),
  rental({
    id: 'br020', clientId: 'consorcio', title: 'Duplicação BR-020 · Sobradinho', kind: 'obra',
    address: 'BR-020, km 12, canteiro central', bairro: 'sobradinho', start: iso(-150), end: iso(210),
    items: [{ productId: 'bq', qty: 12 }, { productId: 'bq-pne', qty: 2 }], cleanPerWeek: 3,
    contact: { name: 'Eng. Tiago Brandão', role: 'Coordenador de frente', phone: '(61) 99503-6620' },
    access: 'Frente de obra muda de lugar. Confirmar o km com o coordenador antes de sair.', status: 'ativa', value: 6540, teamId: 'fabio',
  }),
  rental({
    id: 'santamaria', clientId: 'ipe', title: 'Residencial Santa Maria Sul', kind: 'obra',
    address: 'QR 210, conjunto C', bairro: 'santa-maria', start: iso(-90), end: iso(75),
    items: [{ productId: 'bq', qty: 8 }], cleanPerWeek: 2,
    contact: { name: 'Eng. Bruno Takahashi', role: 'Engenheiro', phone: '(61) 98822-6690' },
    access: 'Limpeza combinada às 11h15, antes do almoço da equipe.', status: 'ativa', value: 3120, teamId: 'marcos',
  }),
  rental({
    id: 'festival', clientId: 'arena', title: 'Festival Cerrado Sertanejo', kind: 'evento',
    address: 'Estacionamento do Estádio Mané Garrincha', bairro: 'mane-garrincha', start: iso(0), end: iso(3), eventDays: [iso(1, '16:00'), iso(2, '23:00')],
    items: [{ productId: 'bq', qty: 40 }, { productId: 'bq-pne', qty: 4 }, { productId: 'trailer-4', qty: 2 }, { productId: 'alambrado', qty: 300 }, { productId: 'tenda-10', qty: 8 }, { productId: 'balcao', qty: 8 }], cleanPerWeek: 0,
    contact: { name: 'Gustavo Lins', role: 'Produtor', phone: '(61) 99124-8873' },
    access: 'Acesso de carga pelo portão F. Credencial com a produção.', status: 'montagem', value: 38600, teamId: 'fabio',
  }),
  rental({
    id: 'casamento', clientId: 'casarbem', title: 'Casamento Lima e Duarte', kind: 'evento',
    address: 'SHIS QL 12, conjunto 5, casa 9', bairro: 'lago-sul', start: iso(0), end: iso(2), eventDays: [iso(1, '17:00'), iso(1, '23:59')],
    items: [{ productId: 'trailer-4', qty: 1 }, { productId: 'tenda-10', qty: 2 }, { productId: 'balcao', qty: 2 }], cleanPerWeek: 0,
    contact: { name: 'Mariana Albuquerque', role: 'Cerimonialista', phone: '(61) 99183-4410' },
    access: 'Trailer no gramado lateral. Ponto de energia 220 V ao lado da garagem.', status: 'montagem', value: 5480, teamId: 'fabio',
  }),
  rental({
    id: 'corrida', clientId: 'correbsb', title: 'Corrida Noturna do Eixo', kind: 'evento',
    address: 'Eixo Monumental, em frente à Torre de TV', bairro: 'esplanada', start: iso(1), end: iso(3), eventDays: [iso(2, '18:00'), iso(2, '22:30')],
    items: [{ productId: 'bq', qty: 30 }, { productId: 'bq-pne', qty: 2 }, { productId: 'alambrado', qty: 400 }, { productId: 'tenda-5', qty: 10 }], cleanPerWeek: 0,
    contact: { name: 'Felipe Andrade', role: 'Diretor de prova', phone: '(61) 99612-4478' },
    status: 'montagem', value: 14200, teamId: 'marcos',
  }),
  rental({
    id: 'congresso', clientId: 'graca', title: 'Congresso de Jovens 2026', kind: 'evento',
    address: 'QNM 18, área especial', bairro: 'ceilandia', start: iso(1), end: iso(4), eventDays: [iso(2, '08:00'), iso(3, '21:00')],
    items: [{ productId: 'bq', qty: 20 }, { productId: 'bq-pne', qty: 2 }, { productId: 'tenda-10', qty: 2 }], cleanPerWeek: 0,
    contact: { name: 'Pr. Daniel Moreira', role: 'Organização', phone: '(61) 98701-3356' },
    status: 'montagem', value: 9800, teamId: 'marcos',
  }),
  rental({
    id: 'feira-gama', clientId: 'adm-gama', title: 'Feira do Produtor do Gama', kind: 'evento',
    address: 'Setor Central do Gama, praça do Cine Itapuã', bairro: 'gama', start: iso(-4), end: iso(0), eventDays: [iso(-3, '07:00'), iso(-1, '14:00')],
    items: [{ productId: 'bq', qty: 6 }, { productId: 'bq-pne', qty: 1 }, { productId: 'tenda-5', qty: 10 }], cleanPerWeek: 0,
    contact: { name: 'Sônia Ribeiro', role: 'Gerente de eventos', phone: '(61) 98190-3374' },
    status: 'retirada', value: 7350, teamId: 'marcos',
  }),
  rental({
    id: 'padroeira', clientId: 'paroquia', title: 'Corrida da Padroeira 2026', kind: 'evento',
    address: 'Esplanada dos Ministérios, gramado central', bairro: 'esplanada', start: iso(-27), end: iso(-24), eventDays: [iso(-25, '06:00'), iso(-25, '12:00')],
    items: [{ productId: 'bq', qty: 24 }, { productId: 'bq-pne', qty: 2 }, { productId: 'alambrado', qty: 300 }, { productId: 'tenda-10', qty: 4 }, { productId: 'balcao', qty: 6 }], cleanPerWeek: 0,
    contact: { name: 'Pe. Roberto Lima', role: 'Coordenação', phone: '(61) 99054-1190' },
    status: 'encerrada', value: 16900, teamId: 'fabio',
  }),
]
export const RENTAL = Object.fromEntries(RENTALS.map((r) => [r.id, r])) as Record<string, Rental>

export const zoneOfRental = (r: Rental): ZoneId => BAIRRO[r.bairro].zone
export const rentalsOfClient = (clientId: string) => RENTALS.filter((r) => r.clientId === clientId)

/** "8 banheiros, 1 banheiro PNE e 120 painéis" */
export function itemsLabel(items: RentalItem[], max = 3) {
  const parts = items.map((i) => qtyLabel(i.productId, i.qty))
  const shown = parts.slice(0, max)
  const rest = parts.length - shown.length
  if (rest > 0) return `${shown.join(', ')} e mais ${rest}`
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} e ${shown[shown.length - 1]}` : shown[0] ?? ''
}

/** Banheiros (unidades que recebem limpeza) da locação */
export const cleanableQty = (r: Rental) => r.items.filter((i) => PRODUCT[i.productId].cleanable).reduce((a, i) => a + i.qty, 0)

/** A locação ocupa estoque neste dia? (da montagem até a retirada) */
export function onSite(r: Rental, offset: number) {
  if (r.status === 'encerrada') return false
  return daysFromToday(r.start) <= offset && offset <= daysFromToday(r.end)
}

/* ───────────────────────── Unidades com patrimônio (QR na porta) ───────────────────────── */

export type UnitState = 'campo' | 'base' | 'manutencao'

export interface Unit {
  id: string
  productId: ProductId
  rentalId?: string
  state: UnitState
  note?: string
}

const pad = (n: number, w: number) => String(n).padStart(w, '0')

export const UNITS: Unit[] = (() => {
  const out: Unit[] = []
  const serial: Record<string, number> = {}
  const next = (pid: ProductId) => {
    const p = PRODUCT[pid]
    serial[pid] = (serial[pid] ?? 0) + 1
    const w = pid === 'bq' ? 3 : 2
    return `${p.prefix}-${pad(serial[pid], w)}`
  }
  // equipamento que já está no local
  for (const r of RENTALS.filter((x) => x.status === 'ativa' || x.status === 'retirada')) {
    for (const it of r.items) {
      if (!PRODUCT[it.productId].prefix) continue
      for (let i = 0; i < it.qty; i++) out.push({ id: next(it.productId), productId: it.productId, rentalId: r.id, state: 'campo' })
    }
  }
  // em manutenção
  const maint: [ProductId, string][] = [
    ['bq', 'Troca de tanque'],
    ['bq', 'Porta empenada'],
    ['bq', 'Pintura e adesivos'],
    ['bq', 'Troca de mictório'],
    ['bq-pne', 'Barra de apoio solta'],
    ['trailer-2', 'Revisão do ar-condicionado'],
  ]
  for (const [pid, note] of maint) out.push({ id: next(pid), productId: pid, state: 'manutencao', note })
  // o restante está na base
  for (const p of PRODUCTS.filter((x) => x.prefix)) {
    while ((serial[p.id] ?? 0) < p.stock) out.push({ id: next(p.id), productId: p.id, state: 'base' })
  }
  return out
})()
export const UNIT = Object.fromEntries(UNITS.map((u) => [u.id, u])) as Record<string, Unit>
export const unitsOf = (rentalId: string) => UNITS.filter((u) => u.rentalId === rentalId)

/** Unidade usada na demonstração do QR na porta */
export const DEMO_UNIT = unitsOf('jardins')[2]?.id ?? 'BQ-003'

/* ───────────────────────── Serviços (agenda das equipes) ───────────────────────── */

export type JobType = 'Montagem' | 'Limpeza' | 'Retirada' | 'Manutenção'
export type JobStatus = 'concluido' | 'em-andamento' | 'a-caminho' | 'agendado' | 'cancelado'

export interface Job {
  id: string
  rentalId: string
  teamId: string
  start: string
  durationMin: number
  type: JobType
  note: string
  status: JobStatus
  /** horário combinado com o cliente (não muda na otimização de rota) */
  fixedTime: boolean
  /** unidades ou peças envolvidas */
  units: number
  /** montagem dividida em mais de um dia: só estes produtos */
  products?: ProductId[]
}

let jSeq = 0
function job(dayOffset: number, hhmm: string, teamId: string, rentalId: string, type: JobType, note: string, status: JobStatus, durationMin = 40, fixedTime = false, units?: number): Job {
  jSeq++
  const r = RENTAL[rentalId]
  return { id: `s${jSeq}`, rentalId, teamId, start: iso(dayOffset, hhmm), durationMin, type, note, status, fixedTime, units: units ?? cleanableQty(r) }
}

/** Hora "agora" simulada no protótipo: 10h40 de hoje */
export const NOW = day(0, '10:40')

const HAND_JOBS: Job[] = [
  // ── HOJE · Equipe Fábio · Norte, Plano e Lagos
  job(0, '07:10', 'fabio', 'br020', 'Limpeza', 'Sucção, lavagem e reposição', 'concluido', 55),
  job(0, '08:30', 'fabio', 'noroeste', 'Limpeza', 'Sucção, lavagem e reposição', 'concluido', 35),
  job(0, '10:05', 'fabio', 'jardins', 'Limpeza', 'Sucção, lavagem e reposição. Conferir a PNE.', 'em-andamento', 50, true),
  job(0, '11:30', 'fabio', 'escola', 'Limpeza', 'Última limpeza antes da retirada', 'agendado', 25, true),
  job(0, '14:30', 'fabio', 'br020', 'Manutenção', 'Porta que não trava, aviso pelo QR', 'agendado', 40, false, 1),
  // ── HOJE · Equipe Marcos · Oeste, Guará e Sul
  job(0, '07:30', 'marcos', 'torre36', 'Limpeza', 'Sucção, lavagem e reposição', 'concluido', 60),
  job(0, '08:50', 'marcos', 'smart', 'Limpeza', 'Sucção, lavagem e reposição', 'concluido', 35),
  job(0, '10:00', 'marcos', 'galpao', 'Limpeza', 'Sucção, lavagem e reposição', 'a-caminho', 30),
  job(0, '11:15', 'marcos', 'santamaria', 'Limpeza', 'Sucção, lavagem e reposição', 'agendado', 45, true),
  job(0, '14:00', 'marcos', 'smart', 'Manutenção', 'Vazamento na PNE, levar vedação', 'agendado', 40, false, 1),
  // ── HOJE · Equipe Wesley · montagens e retiradas
  job(0, '07:00', 'wesley', 'feira-gama', 'Retirada', '6 banheiros, 1 PNE e 10 tendas', 'concluido', 90, false, 17),
  job(0, '09:30', 'wesley', 'festival', 'Montagem', 'Estruturas: alambrado, tendas e balcões', 'em-andamento', 240, true, 316),
  job(0, '15:00', 'wesley', 'casamento', 'Montagem', 'Trailer 4 boxes, 2 tendas e 2 balcões', 'agendado', 120, true, 5),
  // ── Próximos dias: eventos
  job(1, '06:30', 'wesley', 'festival', 'Montagem', '40 banheiros, 4 PNE e 2 trailers', 'agendado', 180, true, 46),
  job(1, '10:30', 'wesley', 'corrida', 'Montagem', '30 banheiros, 2 PNE, 400 grades e 10 tendas', 'agendado', 210, true, 442),
  job(1, '15:00', 'wesley', 'congresso', 'Montagem', '20 banheiros, 2 PNE e 2 tendas', 'agendado', 120, true, 24),
  job(1, '15:30', 'fabio', 'casamento', 'Limpeza', 'Abastecer o trailer antes da festa', 'agendado', 30, true, 1),
  job(1, '19:00', 'fabio', 'festival', 'Limpeza', 'Plantão no evento: 1ª rodada', 'agendado', 120, true),
  job(2, '08:00', 'wesley', 'casamento', 'Retirada', 'Trailer, tendas e balcões', 'agendado', 90, true, 5),
  job(2, '12:00', 'marcos', 'congresso', 'Limpeza', 'Plantão no evento', 'agendado', 90, true),
  job(2, '17:00', 'fabio', 'festival', 'Limpeza', 'Plantão no evento: 2ª rodada', 'agendado', 120, true),
  job(2, '20:00', 'marcos', 'corrida', 'Limpeza', 'Plantão na largada', 'agendado', 60, true),
  job(3, '07:00', 'wesley', 'festival', 'Retirada', 'Tudo: banheiros, trailers e estruturas', 'agendado', 300, true, 362),
  job(3, '09:00', 'marcos', 'congresso', 'Limpeza', 'Plantão no evento', 'agendado', 90, true),
  job(3, '13:00', 'wesley', 'corrida', 'Retirada', 'Banheiros, grades e tendas', 'agendado', 180, false, 442),
  job(3, '15:30', 'wesley', 'escola', 'Retirada', '3 banheiros', 'agendado', 40, false, 3),
  job(4, '08:00', 'wesley', 'congresso', 'Retirada', '20 banheiros, 2 PNE e 2 tendas', 'agendado', 150, false, 24),
]

// o festival monta em dois dias: estruturas hoje, banheiros amanhã
for (const j of HAND_JOBS) {
  if (j.rentalId !== 'festival' || j.type !== 'Montagem') continue
  j.products = daysFromToday(j.start) === 0 ? ['alambrado', 'tenda-10', 'balcao'] : ['bq', 'bq-pne', 'trailer-4']
}

/** Equipe e ordem na rota de cada obra (limpezas recorrentes) */
const ROUTE: Record<string, { teamId: string; slot: string; phase: number }> = {
  br020: { teamId: 'fabio', slot: '07:10', phase: 0 },
  noroeste: { teamId: 'fabio', slot: '08:30', phase: 1 },
  jardins: { teamId: 'fabio', slot: '10:05', phase: 0 },
  escola: { teamId: 'fabio', slot: '11:30', phase: 3 },
  torre36: { teamId: 'marcos', slot: '07:30', phase: 0 },
  smart: { teamId: 'marcos', slot: '08:50', phase: 1 },
  galpao: { teamId: 'marcos', slot: '10:00', phase: 2 },
  santamaria: { teamId: 'marcos', slot: '11:15', phase: 1 },
}

/** Limpezas recorrentes das obras, de 21 dias atrás até 13 dias à frente (hoje vem de HAND_JOBS) */
const RECURRING: Job[] = (() => {
  const out: Job[] = []
  for (let d = -21; d <= 13; d++) {
    if (d === 0) continue
    const date = day(d)
    if (date.getDay() === 0) continue
    for (const r of RENTALS.filter((x) => x.kind === 'obra' && x.cleanPerWeek > 0)) {
      if (!onSite(r, d)) continue
      const route = ROUTE[r.id]
      if (!route) continue
      const step = r.cleanPerWeek >= 3 ? 2 : r.cleanPerWeek === 2 ? 3 : 7
      if ((((d + route.phase) % step) + step) % step !== 0) continue
      const status: JobStatus = d < 0 ? 'concluido' : 'agendado'
      jSeq++
      out.push({
        id: `g-${r.id}-${d < 0 ? 'm' : 'p'}${Math.abs(d)}`,
        rentalId: r.id,
        teamId: route.teamId,
        start: iso(d, route.slot),
        durationMin: Math.max(25, cleanableQty(r) * 5),
        type: 'Limpeza',
        note: 'Sucção, lavagem e reposição',
        status,
        fixedTime: r.id === 'santamaria' || r.id === 'escola',
        units: cleanableQty(r),
      })
    }
  }
  // limpezas e retirada da Corrida da Padroeira (histórico do relatório)
  out.push(
    { id: 'g-padroeira-m', rentalId: 'padroeira', teamId: 'wesley', start: iso(-27, '06:00'), durationMin: 240, type: 'Montagem', note: 'Banheiros, grades, tendas e balcões', status: 'concluido', fixedTime: true, units: 336 },
    { id: 'g-padroeira-l1', rentalId: 'padroeira', teamId: 'fabio', start: iso(-25, '05:30'), durationMin: 60, type: 'Limpeza', note: 'Antes da largada', status: 'concluido', fixedTime: true, units: 26 },
    { id: 'g-padroeira-l2', rentalId: 'padroeira', teamId: 'fabio', start: iso(-25, '09:30'), durationMin: 70, type: 'Limpeza', note: 'Depois da chegada', status: 'concluido', fixedTime: true, units: 26 },
    { id: 'g-padroeira-r', rentalId: 'padroeira', teamId: 'wesley', start: iso(-24, '07:00'), durationMin: 240, type: 'Retirada', note: 'Tudo', status: 'concluido', fixedTime: false, units: 336 },
    { id: 'g-feira-m', rentalId: 'feira-gama', teamId: 'wesley', start: iso(-4, '08:00'), durationMin: 120, type: 'Montagem', note: '6 banheiros, 1 PNE e 10 tendas', status: 'concluido', fixedTime: true, units: 17 },
    { id: 'g-feira-l1', rentalId: 'feira-gama', teamId: 'marcos', start: iso(-3, '13:00'), durationMin: 40, type: 'Limpeza', note: 'Plantão na feira', status: 'concluido', fixedTime: true, units: 7 },
    { id: 'g-feira-l2', rentalId: 'feira-gama', teamId: 'marcos', start: iso(-2, '13:00'), durationMin: 40, type: 'Limpeza', note: 'Plantão na feira', status: 'concluido', fixedTime: true, units: 7 },
    { id: 'g-feira-l3', rentalId: 'feira-gama', teamId: 'marcos', start: iso(-1, '12:00'), durationMin: 40, type: 'Limpeza', note: 'Plantão na feira', status: 'concluido', fixedTime: true, units: 7 },
  )
  return out
})()

export const JOBS: Job[] = [...HAND_JOBS, ...RECURRING].sort((a, b) => +new Date(a.start) - +new Date(b.start))
export const JOB = Object.fromEntries(JOBS.map((j) => [j.id, j])) as Record<string, Job>

export const jobsOn = (offset: number) => JOBS.filter((j) => daysFromToday(j.start) === offset)
export const jobsToday = () => jobsOn(0)
export const jobsOf = (rentalId: string) => JOBS.filter((j) => j.rentalId === rentalId)

/** Serviço usado no roteiro da demonstração (limpeza em andamento no Jardins do Lago) */
export const DEMO_JOB = HAND_JOBS.find((j) => j.rentalId === 'jardins' && j.status === 'em-andamento')!.id

/** Ordem "como foi marcada" e "otimizada por região" (Equipe Fábio, hoje) */
export const ROUTE_FABIO = {
  teamId: 'fabio',
  kmNaive: 118.6,
  kmOptimized: 82.4,
  minNaive: 214,
  minOptimized: 151,
}

/** Dia da semana (1 = seg) → regiões de cada equipe. Base do "organizar por região". */
export const WEEK_PLAN: Record<string, Record<number, ZoneId[]>> = {
  fabio: { 1: ['norte', 'plano'], 2: ['plano', 'lagos'], 3: ['norte', 'lagos'], 4: ['plano'], 5: ['norte', 'plano', 'lagos'], 6: ['plano'] },
  marcos: { 1: ['oeste', 'guara'], 2: ['oeste', 'sul'], 3: ['oeste', 'guara'], 4: ['sul', 'guara'], 5: ['oeste', 'guara', 'sul'], 6: ['oeste'] },
  wesley: { 1: ['guara'], 2: ['plano', 'sul'], 3: ['oeste'], 4: ['lagos'], 5: ['plano', 'lagos', 'sul'], 6: ['plano', 'oeste'] },
}

/* ───────────────────────── Ocorrências (QR na porta e equipe) ───────────────────────── */

export type OccKind = 'sem-papel' | 'sujo' | 'cheio' | 'porta' | 'vazamento' | 'avaria' | 'outro'
export type OccStatus = 'aberta' | 'resolvida'

export interface Occurrence {
  id: string
  unitId: string
  rentalId: string
  kind: OccKind
  note?: string
  at: string
  source: 'qr' | 'equipe'
  status: OccStatus
  reporter?: string
}

export const OCCURRENCES: Occurrence[] = [
  { id: 'o1', unitId: unitsOf('br020')[4]?.id ?? 'BQ-040', rentalId: 'br020', kind: 'porta', note: 'A porta não fecha direito, a trava está solta.', at: iso(-1, '17:20'), source: 'qr', status: 'aberta', reporter: 'Operário da frente km 12' },
  { id: 'o2', unitId: unitsOf('torre36')[6]?.id ?? 'BQ-020', rentalId: 'torre36', kind: 'sem-papel', at: iso(0, '09:12'), source: 'qr', status: 'aberta' },
  { id: 'o3', unitId: unitsOf('smart').find((u) => u.productId === 'bq-pne')?.id ?? 'PNE-04', rentalId: 'smart', kind: 'vazamento', note: 'Vazamento na base do tanque. Isolada com fita.', at: iso(-1, '15:40'), source: 'equipe', status: 'aberta', reporter: 'Equipe Marcos' },
  { id: 'o4', unitId: unitsOf('jardins')[5]?.id ?? 'BQ-006', rentalId: 'jardins', kind: 'cheio', at: iso(-2, '16:05'), source: 'qr', status: 'resolvida' },
]

/* ───────────────────────── Avisos ao cliente (WhatsApp) ───────────────────────── */

export type AvisoKind = 'limpeza' | 'montagem' | 'retirada' | 'renovacao' | 'ocorrencia'
export type AvisoStatus = 'programado' | 'enviado' | 'lido' | 'confirmado' | 'sem-resposta'

export interface Aviso {
  id: string
  rentalId: string
  kind: AvisoKind
  title: string
  dueDate: string
  sendDate: string
  status: AvisoStatus
  origin: string
  reply?: string
}

let aSeq = 0
function aviso(rentalId: string, kind: AvisoKind, title: string, dueOffset: number, status: AvisoStatus, origin: string, reply?: string, sendBefore = 2): Aviso {
  aSeq++
  return { id: `a${aSeq}`, rentalId, kind, title, dueDate: iso(dueOffset), sendDate: iso(dueOffset - sendBefore, '09:00'), status, origin, reply }
}

export const AVISOS: Aviso[] = [
  aviso('escola', 'retirada', 'Retirada dos 3 banheiros', 3, 'sem-resposta', 'Fim do contrato', undefined, 3),
  aviso('noroeste', 'renovacao', 'Renovação mensal', 6, 'lido', 'Contrato vence todo dia 12', undefined, 4),
  aviso('br020', 'ocorrencia', 'Porta com trava solta', 0, 'enviado', 'Aviso pelo QR da unidade', undefined, 0),
  aviso('festival', 'montagem', 'Montagem dos banheiros', 1, 'confirmado', 'Ordem de serviço', 'Confirmado. Portão F liberado a partir das 6h.', 1),
  aviso('casamento', 'montagem', 'Montagem do trailer e tendas', 0, 'confirmado', 'Ordem de serviço', 'Perfeito, a casa estará aberta a partir das 14h.', 1),
  aviso('corrida', 'montagem', 'Montagem de banheiros e grades', 1, 'enviado', 'Ordem de serviço', undefined, 1),
  aviso('congresso', 'montagem', 'Montagem dos banheiros', 1, 'lido', 'Ordem de serviço', undefined, 1),
  aviso('feira-gama', 'retirada', 'Retirada após a feira', 0, 'confirmado', 'Fim do evento', 'Pode retirar cedo, o portão abre às 6h30.', 1),
  aviso('jardins', 'limpeza', 'Relatório da limpeza de hoje', 0, 'programado', 'Enviado ao concluir cada limpeza', undefined, 0),
  aviso('torre36', 'limpeza', 'Relatório da limpeza de hoje', 0, 'enviado', 'Enviado ao concluir cada limpeza', undefined, 0),
  aviso('smart', 'limpeza', 'Relatório da limpeza de hoje', 0, 'lido', 'Enviado ao concluir cada limpeza', undefined, 0),
  aviso('br020', 'limpeza', 'Relatório da limpeza de hoje', 0, 'enviado', 'Enviado ao concluir cada limpeza', undefined, 0),
  aviso('santamaria', 'renovacao', 'Renovação do contrato', 12, 'programado', 'Contrato vence em 75 dias, renovação mensal', undefined, 5),
  aviso('galpao', 'renovacao', 'Renovação mensal', 9, 'programado', 'Contrato vence todo dia 15', undefined, 5),
  aviso('smart', 'ocorrencia', 'Vazamento na PNE', 0, 'confirmado', 'Registro da equipe', 'Ok, obrigado pelo aviso. Podem vir às 14h.', 0),
  aviso('torre36', 'ocorrencia', 'Falta de papel', 0, 'sem-resposta', 'Aviso pelo QR da unidade', undefined, 0),
  aviso('festival', 'retirada', 'Retirada após o festival', 3, 'programado', 'Fim do evento', undefined, 2),
  aviso('corrida', 'retirada', 'Retirada após a prova', 3, 'programado', 'Fim do evento', undefined, 1),
]

/* ───────────────────────── Modelos de mensagem ───────────────────────── */

export const TEMPLATES: Record<AvisoKind, string> = {
  limpeza: 'Olá, {contato}! Aqui é a {empresa}.\nA limpeza dos banheiros em *{local}* foi concluída às {hora}: {unidades} higienizados e abastecidos.\nRelatório com fotos: {link}',
  montagem: 'Olá, {contato}! Confirmando a montagem em *{local}* na *{data}* às {hora}.\nEquipe {equipe}, {caminhao}. Precisamos de acesso para caminhão no local.',
  retirada: 'Olá, {contato}! A locação em *{local}* termina na *{data}*.\nPodemos fazer a retirada nesse dia pela manhã? Se quiser renovar, é só responder aqui.',
  renovacao: 'Olá, {contato}! O contrato de *{local}* vence em *{data}*.\nQuer renovar por mais 30 dias nas mesmas condições?',
  ocorrencia: 'Olá, {contato}! Recebemos um aviso da unidade *{unidade}* em {local}: {problema}.\nNossa equipe passa hoje para resolver.',
}

/* ───────────────────────── Indicadores ───────────────────────── */

export const KPIS = {
  cleaningsMonth: 214,
  cleaningsMonthPrev: 188,
  onTimeRate: 0.96,
  onTimeRatePrev: 0.87,
  reportsOpened: 0.82,
  revenueMonth: 186400,
  occurrencesMonth: 9,
  avgResponseH: 3.2,
  avgResponseHPrev: 7.5,
}

/** Serviços por região × dia da semana (últimas 8 semanas): para o mapa de calor */
export const HEATMAP: Record<ZoneId, number[]> = {
  plano: [14, 12, 9, 13, 18, 22],
  lagos: [6, 9, 7, 5, 11, 15],
  guara: [10, 8, 9, 7, 9, 4],
  oeste: [18, 15, 17, 14, 16, 8],
  sul: [7, 9, 5, 9, 7, 3],
  norte: [12, 4, 11, 3, 12, 2],
}

/* ───────────────────────── Estoque por dia ───────────────────────── */

/** Quantas unidades de cada produto estão comprometidas no dia (locações no local + manutenção) */
export function demandOn(offset: number): Record<ProductId, number> {
  const out = Object.fromEntries(PRODUCTS.map((p) => [p.id, 0])) as Record<ProductId, number>
  for (const r of RENTALS) {
    if (!onSite(r, offset)) continue
    for (const it of r.items) out[it.productId] += it.qty
  }
  for (const u of UNITS) if (u.state === 'manutencao') out[u.productId] += 1
  return out
}

/** Locações que ocupam o produto no dia */
export function rentalsUsing(productId: ProductId, offset: number) {
  return RENTALS.filter((r) => onSite(r, offset) && r.items.some((i) => i.productId === productId))
}

/** Dias com falta de estoque nos próximos N dias */
export function shortages(daysAhead = 14) {
  const out: { offset: number; productId: ProductId; need: number; stock: number }[] = []
  for (let d = 0; d <= daysAhead; d++) {
    const dem = demandOn(d)
    for (const p of PRODUCTS) if (dem[p.id] > p.stock) out.push({ offset: d, productId: p.id, need: dem[p.id], stock: p.stock })
  }
  return out
}

export { TODAY }
