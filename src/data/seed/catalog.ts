// Cadastros fixos da semente: tipos de equipamento, unidades, equipes, configurações e clientes.
import { BAIRRO } from '@/data/geo'
import { addDays } from '@/domain/dates'
import type { Client, Contact, DunningStep, EquipmentType, ISODate, Settings, Team, Unit } from '@/domain/types'
import { CLIENT_DEFS, FIRST, LAST, ROLES_BY_KIND, streetFor } from './names'
import { cnpj, phone, type Rng } from './util'

export const TYPES: EquipmentType[] = [
  { id: 'bq', name: 'Banheiro químico padrão', short: 'Banheiro padrão', group: 'Banheiros', prefix: 'BQ', photo: '/produtos/banheiro-quimico.jpg', dailyRate: 18.4, monthlyRate: 289.9, cleanable: true, purchasePrice: 3180, usefulLifeMonths: 96 },
  { id: 'pcd', name: 'Cabine PcD acessível', short: 'Cabine PcD', group: 'Banheiros', prefix: 'PCD', photo: '/produtos/banheiro-quimico.jpg', dailyRate: 34.9, monthlyRate: 419.9, cleanable: true, purchasePrice: 5940, usefulLifeMonths: 96 },
  { id: 'pia', name: 'Pia e lavatório portátil', short: 'Pia portátil', group: 'Banheiros', prefix: 'PIA', photo: '/produtos/banheiro-quimico.jpg', dailyRate: 22.6, monthlyRate: 168.9, cleanable: true, purchasePrice: 2260, usefulLifeMonths: 84 },
  { id: 'trailer', name: 'Trailer sanitário 4 boxes', short: 'Trailer sanitário', group: 'Banheiros', prefix: 'TRL', photo: '/produtos/trailer.jpg', dailyRate: 1090.9, monthlyRate: 4290.9, cleanable: true, purchasePrice: 86400, usefulLifeMonths: 180 },
  { id: 'tnd5', name: 'Tenda 5 x 5', short: 'Tenda 5 x 5', group: 'Estruturas', prefix: 'TND', photo: '/produtos/tenda.jpg', dailyRate: 284.5, monthlyRate: 1190.5, cleanable: false, purchasePrice: 4870, usefulLifeMonths: 96 },
  { id: 'tnd10', name: 'Tenda 10 x 10', short: 'Tenda 10 x 10', group: 'Estruturas', prefix: 'TND', photo: '/produtos/tenda.jpg', dailyRate: 648.5, monthlyRate: 2690.9, cleanable: false, purchasePrice: 14650, usefulLifeMonths: 120 },
  { id: 'ala', name: 'Alambrado (lote de 10 grades)', short: 'Alambrado', group: 'Estruturas', prefix: 'ALA', photo: '/produtos/alambrado.jpg', dailyRate: 94.5, monthlyRate: 318.9, cleanable: false, purchasePrice: 2940, usefulLifeMonths: 180 },
  { id: 'fec', name: 'Fechamento metálico (lote de 10 painéis)', short: 'Fechamento', group: 'Estruturas', prefix: 'FEC', photo: '/produtos/fechamento.jpg', dailyRate: 108.9, monthlyRate: 372.5, cleanable: false, purchasePrice: 3720, usefulLifeMonths: 180 },
  { id: 'bal', name: 'Balcão de bar 2 m', short: 'Balcão de bar', group: 'Estruturas', prefix: 'BAL', photo: '/produtos/balcao.jpg', dailyRate: 148.9, monthlyRate: 489.9, cleanable: false, purchasePrice: 1980, usefulLifeMonths: 120 },
]

/** Unidades por tipo e como ficam hoje: em campo, em limpeza, em manutenção, disponíveis (soma 180; 44 disponíveis) */
export const UNIT_PLAN: Record<string, { total: number; em: number; lim: number; man: number; disp: number; first: number }> = {
  bq: { total: 70, em: 52, lim: 5, man: 3, disp: 10, first: 101 },
  pcd: { total: 14, em: 9, lim: 1, man: 1, disp: 3, first: 11 },
  pia: { total: 14, em: 10, lim: 1, man: 0, disp: 3, first: 31 },
  trailer: { total: 6, em: 4, lim: 1, man: 0, disp: 1, first: 1 },
  tnd5: { total: 12, em: 5, lim: 0, man: 1, disp: 6, first: 21 },
  tnd10: { total: 8, em: 6, lim: 0, man: 0, disp: 2, first: 33 },
  ala: { total: 22, em: 15, lim: 0, man: 1, disp: 6, first: 51 },
  fec: { total: 24, em: 15, lim: 0, man: 1, disp: 8, first: 31 },
  bal: { total: 10, em: 5, lim: 0, man: 0, disp: 5, first: 5 },
}

export function buildUnits(rng: Rng, today: ISODate): Unit[] {
  const out: Unit[] = []
  for (const t of TYPES) {
    const plan = UNIT_PLAN[t.id]
    for (let i = 0; i < plan.total; i++) {
      const code = `${t.prefix}-${String(plan.first + i).padStart(4, '0')}`
      out.push({
        id: `u-${code.toLowerCase()}`,
        code,
        typeId: t.id,
        status: 'disponivel',
        acquiredAt: addDays(today, -rng.int(150, 2300)),
        fields: {
          capacidadeL: rng.pick([200, 220, 240, 260]),
          fabricante: rng.pick(['Polipex', 'Sanilux', 'Ecobox']),
          lote: `L${rng.int(2019, 2025)}-${String(rng.int(1, 480)).padStart(3, '0')}`,
          serie: `SN-${String(rng.int(100000, 999999))}`,
          potenciaW: rng.pick([400, 800, 1200, 2000, 3500]),
          tensao: rng.pick(['110 V', '220 V', 'Bivolt']),
          registroAnvisa: `80${rng.int(10000000, 99999999)}${rng.int(10, 99)}`,
          proximaCalibracao: addDays(today, rng.int(8, 320)),
          horimetroH: rng.int(40, 2400),
          combustivel: rng.pick(['Diesel', 'Gasolina', 'Elétrica']),
        },
      })
    }
  }
  return out
}

export function buildTeams(): Team[] {
  return [
    { id: 'eq-1', name: 'Equipe Fábio', short: 'Fábio', initials: 'FC', members: ['Fábio Cardoso', 'Renan Lopes'], truck: 'Caminhão 01 · Sucção', plate: 'QHL-2A57', color: 'viz-1', phone: '(61) 99641-2207', zoneId: 'plano', focus: 'Plano Piloto' },
    { id: 'eq-2', name: 'Equipe Marcos', short: 'Marcos', initials: 'MA', members: ['Marcos Araújo', 'Júnior Souza'], truck: 'Caminhão 02 · Sucção', plate: 'REX-4B21', color: 'viz-2', phone: '(61) 99218-5530', zoneId: 'lagos', focus: 'Lagos e Paranoá' },
    { id: 'eq-3', name: 'Equipe Wesley', short: 'Wesley', initials: 'WS', members: ['Wesley Santos', 'Daniel Rocha', 'Igor Melo'], truck: 'Caminhão 03 · Munck', plate: 'PBT-7C08', color: 'viz-3', phone: '(61) 99375-0814', zoneId: 'guara', focus: 'Guará e SIA' },
    { id: 'eq-4', name: 'Equipe Rafaela', short: 'Rafaela', initials: 'RN', members: ['Rafaela Nunes', 'Cleiton Dias'], truck: 'Caminhão 04 · Sucção', plate: 'RFD-5J90', color: 'viz-4', phone: '(61) 99512-7741', zoneId: 'oeste', focus: 'Taguatinga e Ceilândia' },
    { id: 'eq-5', name: 'Equipe Tiago', short: 'Tiago', initials: 'TB', members: ['Tiago Brito', 'Elias Moura', 'Pablo Reis'], truck: 'Caminhão 05 · Munck', plate: 'QJP-3D14', color: 'viz-5', phone: '(61) 99430-6182', zoneId: 'sul', focus: 'Gama e Santa Maria' },
    { id: 'eq-6', name: 'Equipe Jussara', short: 'Jussara', initials: 'JT', members: ['Jussara Teles', 'Anderson Cruz'], truck: 'Caminhão 06 · Sucção', plate: 'RHA-8E36', color: 'viz-6', phone: '(61) 99287-3359', zoneId: 'norte', focus: 'Sobradinho e Planaltina' },
  ]
}

const DUNNING: DunningStep[] = [
  { id: 'dun-1', dayOffset: -3, channel: 'email', enabled: true, template: 'Olá, {cliente}! Passando para lembrar que a cobrança {codigo} de {valor} vence em {vencimento}. Link de pagamento: {link}' },
  { id: 'dun-2', dayOffset: 0, channel: 'email', enabled: true, template: 'Olá, {cliente}. A cobrança {codigo} de {valor} vence hoje. Se já pagou, desconsidere. Link de pagamento: {link}' },
  { id: 'dun-3', dayOffset: 3, channel: 'portal', enabled: true, template: 'Olá, {cliente}. Não encontramos o pagamento da cobrança {codigo} ({valor}), vencida em {vencimento}. Podemos ajudar? Pague pelo portal: {link}' },
  { id: 'dun-4', dayOffset: 7, channel: 'email', enabled: false, template: 'Prezado(a) {cliente}, a cobrança {codigo} no valor de {valor} está vencida desde {vencimento}. Segue o link para pagamento: {link}' },
]

export function buildSettings(rng: Rng, today: ISODate): Settings {
  const stamp = `${addDays(today, -200)}T13:00:00.000Z`
  return {
    company: {
      name: 'Cerrado Locações',
      legalName: 'Cerrado Locações de Equipamentos Ltda',
      cnpj: cnpj(rng),
      phone: '(61) 3399-4410',
      email: 'contato@cerradolocacoes.com.br',
      address: 'SIA Trecho 3, lote 140',
      city: 'Brasília · DF',
    },
    brandHex: '#f04e0a',
    segmentId: 'eventos',
    aiEnabled: true,
    users: [
      { id: 'usr-1', name: 'Marcos Vinícius Pires', email: 'marcos@cerradolocacoes.com.br', phone: '(61) 99641-0087', role: 'dono', initials: 'MP' },
      { id: 'usr-2', name: 'Paula Ramos', email: 'paula@cerradolocacoes.com.br', phone: '(61) 99812-4470', role: 'escritorio', initials: 'PR' },
      { id: 'usr-3', name: 'Fábio Cardoso', email: 'fabio@cerradolocacoes.com.br', phone: '(61) 99641-2207', role: 'campo', initials: 'FC' },
    ],
    integrations: {
      email: { connected: true, account: 'cobranca@cerradolocacoes.com.br', connectedAt: stamp },
      pix: { connected: true, account: 'Chave CNPJ cadastrada', connectedAt: stamp },
      boleto: { connected: true, account: 'Conta 4410-7 · Banco Cooperativo', connectedAt: stamp },
      nfse: { connected: true, account: 'Prefeitura de Brasília, inscrição 07.441.209', connectedAt: stamp },
      contaAzul: { connected: true, account: 'financeiro@cerradolocacoes.com.br', connectedAt: stamp },
    },
    dunning: DUNNING,
    currentUserId: 'usr-1',
  }
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function contactFor(rng: Rng, kind: Client['kind'], domain: string, forceName?: string, forceRole?: string): Contact {
  const first = forceName ? forceName.split(' ')[0] : rng.pick(FIRST)
  const last = forceName ? forceName.split(' ').slice(-1)[0] : rng.pick(LAST)
  return {
    name: forceName ?? `${first} ${last}`,
    role: forceRole ?? rng.pick(ROLES_BY_KIND[kind]),
    phone: phone(rng),
    email: `${slug(first)}.${slug(last)}@${domain}`,
  }
}

export function buildClients(rng: Rng, today: ISODate): Client[] {
  const zoneWeights: Record<string, number> = { plano: 4, lagos: 2, guara: 4, oeste: 7, sul: 3, norte: 3 }
  const bairros = Object.values(BAIRRO)
  return CLIENT_DEFS.map((def, i) => {
    const bairro = i === 0 ? BAIRRO['aguas-claras'] : rng.weighted(bairros, bairros.map((b) => zoneWeights[b.zone]))
    const nContacts = i === 0 ? 3 : rng.int(1, 3)
    const contacts: Contact[] = []
    for (let k = 0; k < nContacts; k++) {
      if (i === 0 && k === 0) contacts.push(contactFor(rng, def.kind, def.domain, 'Roberta Quintela', 'Engenheira residente'))
      else if (i === 0 && k === 1) contacts.push(contactFor(rng, def.kind, def.domain, 'Valdir Souza', 'Mestre de obras'))
      else if (i === 0 && k === 2) contacts.push(contactFor(rng, def.kind, def.domain, 'Heloísa Barros', 'Financeiro'))
      else contacts.push(contactFor(rng, def.kind, def.domain))
    }
    const token = i === 0 ? 'construtora-aurora' : `${slug(def.name)}-${rng.int(1000, 9999).toString(36)}`
    return {
      id: `cli-${String(i + 1).padStart(3, '0')}`,
      name: def.name,
      kind: def.kind,
      cnpj: cnpj(rng),
      since: addDays(today, i === 0 ? -520 : -rng.int(40, 1500)),
      address: streetFor(bairro.id, rng),
      bairroId: bairro.id,
      contacts,
      portalToken: token,
    }
  })
}
