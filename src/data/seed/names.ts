// Nomes fictícios de pessoas, empresas, obras e eventos (Brasília e entorno). Nada aqui é real.
import type { ClientKind } from '@/domain/types'
import type { Rng } from './util'

export const FIRST = ['Paulo', 'Larissa', 'Carla', 'Raimundo', 'Ronaldo', 'Tiago', 'Bruno', 'Mariana', 'Felipe', 'Sônia', 'Gustavo', 'Daniela', 'Rafael', 'Camila', 'Eduardo', 'Patrícia', 'André', 'Juliana', 'Marcelo', 'Fernanda', 'Leandro', 'Aline', 'Rodrigo', 'Vanessa', 'Wagner', 'Priscila', 'Thiago', 'Luciana', 'Henrique', 'Beatriz', 'Otávio', 'Renata', 'Cláudio', 'Simone', 'Diego', 'Adriana', 'Fábio', 'Elaine', 'Murilo', 'Tatiane']
export const LAST = ['Mendes', 'Prado', 'Nogueira', 'Alves', 'Teixeira', 'Brandão', 'Takahashi', 'Albuquerque', 'Andrade', 'Ribeiro', 'Lins', 'Moreira', 'Cardoso', 'Lopes', 'Araújo', 'Souza', 'Rocha', 'Melo', 'Pereira', 'Barbosa', 'Carvalho', 'Freitas', 'Monteiro', 'Cavalcante', 'Rezende', 'Vasconcelos', 'Siqueira', 'Machado', 'Duarte', 'Falcão', 'Guimarães', 'Peixoto', 'Borges', 'Tavares']

export function personName(rng: Rng): string {
  return `${rng.pick(FIRST)} ${rng.pick(LAST)}`
}

export const CLIENT_DEFS: { name: string; kind: ClientKind; domain: string }[] = [
  // Construtoras (18). A primeira é o cliente fixo do portal.
  { name: 'Construtora Aurora', kind: 'Construtora', domain: 'construtoraaurora.com.br' },
  { name: 'Vértice Engenharia', kind: 'Construtora', domain: 'verticeengenharia.com.br' },
  { name: 'Habitar Engenharia', kind: 'Construtora', domain: 'habitar.eng.br' },
  { name: 'Planalto Obras e Reformas', kind: 'Construtora', domain: 'planaltoobras.com.br' },
  { name: 'Consórcio Viário Norte', kind: 'Construtora', domain: 'cvnorte.com.br' },
  { name: 'Construtora Ipê Amarelo', kind: 'Construtora', domain: 'ipeamarelo.com.br' },
  { name: 'Cerrado Incorporações', kind: 'Construtora', domain: 'cerradoinc.com.br' },
  { name: 'Brasil Central Construções', kind: 'Construtora', domain: 'bccconstrucoes.com.br' },
  { name: 'Monte Alto Engenharia', kind: 'Construtora', domain: 'montealto.eng.br' },
  { name: 'Candanga Obras', kind: 'Construtora', domain: 'candangaobras.com.br' },
  { name: 'Via Capital Pavimentação', kind: 'Construtora', domain: 'viacapital.com.br' },
  { name: 'Horizonte Edificações', kind: 'Construtora', domain: 'horizonteedificacoes.com.br' },
  { name: 'Eixo Sul Construtora', kind: 'Construtora', domain: 'eixosul.com.br' },
  { name: 'Santa Luzia Empreendimentos', kind: 'Construtora', domain: 'santaluziaemp.com.br' },
  { name: 'Quadra Zero Engenharia', kind: 'Construtora', domain: 'quadrazero.eng.br' },
  { name: 'Tecnoplan Construções', kind: 'Construtora', domain: 'tecnoplan.com.br' },
  { name: 'Pioneira Engenharia', kind: 'Construtora', domain: 'pioneiraeng.com.br' },
  { name: 'Araguaia Edificações', kind: 'Construtora', domain: 'araguaiaedif.com.br' },
  // Produtoras de eventos (7)
  { name: 'Arena Produções', kind: 'Produtora de eventos', domain: 'arenaproducoes.com.br' },
  { name: 'Palco Central Eventos', kind: 'Produtora de eventos', domain: 'palcocentral.com.br' },
  { name: 'Nova Era Shows', kind: 'Produtora de eventos', domain: 'novaerashows.com.br' },
  { name: 'Cúpula Produções', kind: 'Produtora de eventos', domain: 'cupulaprod.com.br' },
  { name: 'Festa Capital Eventos', kind: 'Produtora de eventos', domain: 'festacapital.com.br' },
  { name: 'Ritmo do Cerrado Produções', kind: 'Produtora de eventos', domain: 'ritmodocerrado.com.br' },
  { name: 'Vibe Planalto Entretenimento', kind: 'Produtora de eventos', domain: 'vibeplanalto.com.br' },
  // Órgãos públicos (4)
  { name: 'Fundação Parque do Cerrado', kind: 'Órgão público', domain: 'parquedocerrado.org.br' },
  { name: 'Instituto Esportivo Candango', kind: 'Órgão público', domain: 'iecandango.org.br' },
  { name: 'Autarquia de Obras do Planalto', kind: 'Órgão público', domain: 'aopcentral.org.br' },
  { name: 'Secretaria de Cultura Vale Verde', kind: 'Órgão público', domain: 'culturavaleverde.org.br' },
  // Cerimoniais (5)
  { name: 'Casar Bem Cerimonial', kind: 'Cerimonial', domain: 'casarbem.com.br' },
  { name: 'Encanto Cerimonial', kind: 'Cerimonial', domain: 'encantocerimonial.com.br' },
  { name: 'Sonho Dourado Eventos', kind: 'Cerimonial', domain: 'sonhodourado.com.br' },
  { name: 'Lírio Branco Cerimonial', kind: 'Cerimonial', domain: 'liriobranco.com.br' },
  { name: 'Vila Jardim Recepções', kind: 'Cerimonial', domain: 'viladjardim.com.br' },
  // Igrejas (4)
  { name: 'Igreja Comunidade da Graça', kind: 'Igreja', domain: 'comunidadedagraca.org' },
  { name: 'Paróquia Nossa Senhora do Cerrado', kind: 'Igreja', domain: 'paroquiacerrado.org' },
  { name: 'Igreja Batista Vida Nova', kind: 'Igreja', domain: 'batistavidanova.org' },
  { name: 'Comunidade Evangélica Rocha Viva', kind: 'Igreja', domain: 'rochaviva.org' },
  // Condomínios (4)
  { name: 'Condomínio Residencial Park Imperial', kind: 'Condomínio', domain: 'parkimperial.com.br' },
  { name: 'Condomínio Villa Bonita', kind: 'Condomínio', domain: 'villabonita.com.br' },
  { name: 'Associação de Moradores Vale do Sol', kind: 'Condomínio', domain: 'valedosol.org.br' },
  { name: 'Condomínio Solar das Palmeiras', kind: 'Condomínio', domain: 'solardaspalmeiras.com.br' },
  // Indústrias (3)
  { name: 'Cerâmica Planalto', kind: 'Indústria', domain: 'ceramicaplanalto.com.br' },
  { name: 'Frigorífico Cerrado Alimentos', kind: 'Indústria', domain: 'cerradoalimentos.com.br' },
  { name: 'Usina de Asfalto Candanga', kind: 'Indústria', domain: 'asfaltocandanga.com.br' },
]

export const ROLES_BY_KIND: Record<ClientKind, string[]> = {
  Construtora: ['Engenheiro da obra', 'Mestre de obras', 'Administrativo da obra', 'Comprador', 'Coordenador de frente'],
  'Produtora de eventos': ['Produtor', 'Produtor executivo', 'Coordenador de logística'],
  'Órgão público': ['Gerente de eventos', 'Fiscal do contrato', 'Chefe de gabinete'],
  Cerimonial: ['Cerimonialista', 'Assessora do casal', 'Coordenadora'],
  Igreja: ['Pastor responsável', 'Secretária', 'Tesoureiro'],
  Condomínio: ['Síndico', 'Zelador', 'Administradora'],
  Indústria: ['Gerente de manutenção', 'Técnico de segurança', 'Comprador'],
}

/** Endereços por região (formatos reais de Brasília, números fictícios) */
export function streetFor(bairroId: string, rng: Rng): string {
  const n = rng.int(1, 30)
  const q = rng.int(2, 28)
  const lote = rng.int(1, 40)
  const t: Record<string, string[]> = {
    'asa-norte': [`SQN 3${rng.int(0, 1)}${rng.int(1, 9)}, Bloco ${rng.pick(['A', 'B', 'C', 'F'])}`, `SCN Quadra ${rng.int(1, 6)}, Bloco ${rng.pick(['B', 'C'])}`],
    noroeste: [`SQNW 10${rng.int(1, 9)}, Projeção ${rng.pick(['A', 'D', 'H'])}`, `CLNW 10/11, lote ${lote}`],
    esplanada: ['Setor de Autarquias Sul, Quadra 2, lote 8', 'Eixo Monumental, Setor de Divulgação Cultural', 'Esplanada dos Ministérios, gramado lateral'],
    sudoeste: [`CLSW 30${rng.int(1, 6)}, Bloco ${rng.pick(['A', 'B', 'C'])}`, `SQSW 10${rng.int(1, 6)}, Bloco ${rng.pick(['D', 'E'])}`],
    'asa-sul': [`SQS 3${rng.int(0, 1)}${rng.int(1, 9)}, Bloco ${rng.pick(['A', 'B', 'D', 'G'])}`, `SGAS 9${rng.int(0, 1)}${rng.int(1, 9)}, lote ${lote}`],
    'setor-clubes': [`SCES Trecho 2, lote ${lote}`, `SCES Trecho 3, conjunto ${rng.int(1, 9)}`],
    'mane-garrincha': ['Setor de Recreação Pública Norte, estacionamento', 'SRPN, Via S1, área externa'],
    'lago-norte': [`SHIN QI ${rng.int(1, 12)}, conjunto ${rng.int(1, 9)}, casa ${rng.int(1, 20)}`, `SHIN CA ${rng.int(1, 5)}, lote ${lote}`],
    'lago-sul': [`SHIS QL ${rng.int(2, 26)}, conjunto ${rng.int(1, 9)}, casa ${rng.int(1, 20)}`, `SHIS QI ${rng.int(5, 29)}, lote ${lote}`],
    paranoa: [`Quadra ${q}, conjunto ${rng.int(1, 8)}, lote ${lote}`, `Rua ${n}, Paranoá Parque, lote ${lote}`],
    'jardim-botanico': [`SMDB conjunto ${rng.int(1, 20)}, lote ${rng.int(1, 12)}`, `Estrada do Sol, chácara ${lote}`],
    sia: [`SIA Trecho ${rng.int(1, 8)}, lote ${rng.int(10, 240)}`, `SIA Trecho ${rng.int(1, 8)}, galpão ${rng.int(1, 30)}`],
    guara: [`QE ${rng.int(2, 40)}, conjunto ${rng.pick(['A', 'B', 'C', 'D'])}, lote ${lote}`, `QI ${rng.int(2, 30)}, lote ${lote}`],
    'nucleo-bandeirante': [`Avenida Central, lote ${lote}`, `Quadra ${q}, rua ${n}, lote ${lote}`],
    'park-way': [`SMPW Quadra ${rng.int(1, 28)}, conjunto ${rng.int(1, 8)}, lote ${lote}`, `Quadra ${rng.int(1, 28)}, conjunto ${rng.int(1, 8)}, chácara ${lote}`],
    'riacho-fundo': [`QN ${rng.int(1, 16)}, conjunto ${rng.int(1, 12)}, lote ${lote}`, `Quadra ${q}, lote ${lote}, Riacho Fundo II`],
    ceilandia: [`QNN ${rng.int(2, 38)}, conjunto ${rng.pick(['A', 'C', 'F', 'K'])}, lote ${lote}`, `QNM ${rng.int(2, 38)}, área especial ${rng.int(1, 9)}`, `Setor P Sul, quadra ${q}, lote ${lote}`],
    taguatinga: [`QSD ${rng.int(2, 40)}, lote ${lote}`, `CSB ${rng.int(1, 12)}, lote ${lote}`, `QNL ${rng.int(2, 24)}, conjunto ${rng.pick(['A', 'B', 'D'])}`],
    'vicente-pires': [`Rua ${n}, chácara ${lote}`, `Colônia Agrícola Samambaia, chácara ${lote}`],
    'aguas-claras': [`Rua ${rng.int(20, 40)} Norte, lote ${rng.int(1, 12)}`, `Avenida das Araucárias, lote ${rng.int(1, 12)}`, `Rua ${rng.int(1, 16)} Sul, lote ${rng.int(1, 12)}`],
    samambaia: [`QN ${rng.int(100, 440)}, conjunto ${rng.int(1, 20)}, lote ${lote}`, `QR ${rng.int(200, 430)}, conjunto ${rng.int(1, 20)}`],
    recanto: [`Quadra ${rng.int(100, 800)}, conjunto ${rng.int(1, 20)}, lote ${lote}`, `Avenida Recanto das Emas, quadra ${rng.int(300, 800)}`],
    gama: [`Setor Leste, quadra ${rng.int(2, 40)}, lote ${lote}`, `Setor Oeste, quadra ${rng.int(2, 30)}, lote ${lote}`],
    'santa-maria': [`QR ${rng.int(100, 420)}, conjunto ${rng.pick(['A', 'C', 'D'])}, lote ${lote}`, `Quadra ${rng.int(100, 420)}, rua ${n}`],
    sobradinho: [`Quadra ${rng.int(1, 18)}, conjunto ${rng.pick(['A', 'B', 'C'])}, lote ${lote}`, `BR-020, km ${rng.int(2, 24)}, lote ${lote}`],
    planaltina: [`Setor Tradicional, quadra ${rng.int(1, 40)}, lote ${lote}`, `Vila Vicentina, rua ${n}, lote ${lote}`, `Arapoanga, quadra ${q}, lote ${lote}`],
  }
  return rng.pick(t[bairroId] ?? [`Quadra ${q}, lote ${lote}`])
}

const OBRA_TIPO = ['Edifício Residencial', 'Residencial', 'Condomínio', 'Galpão logístico', 'Centro empresarial', 'Reforma da Escola Classe', 'Posto de saúde', 'Shopping', 'Hospital', 'Centro comercial', 'Loteamento']
const OBRA_NOME = ['Jardins do Lago', 'Noroeste 104', 'Águas Claras Prime', 'Vale do Sol', 'Park Imperial', 'Cerrado Verde', 'Ipê Roxo', 'Monumental', 'Alvorada', 'Bosque das Aves', 'Mirante do Planalto', 'Villa Serena', 'Horizonte Azul', 'Santa Clara', 'Buriti', 'Pequi', 'Aroeira', 'Lagoa Bonita', 'das Palmas', 'Sucupira']
const OBRA_ESPECIAIS = ['Duplicação da via de acesso', 'Recapeamento da via principal', 'Praça e quadra poliesportiva', 'Ampliação do pronto atendimento', 'Galpão de armazenagem', 'Fachada e cobertura do bloco B', 'Reforma do ginásio', 'Estação de bombeamento']

export function obraTitle(rng: Rng, bairroName: string): string {
  if (rng.chance(0.22)) return `${rng.pick(OBRA_ESPECIAIS)} · ${bairroName}`
  const tipo = rng.pick(OBRA_TIPO)
  if (tipo === 'Reforma da Escola Classe') return `${tipo} ${rng.int(2, 420)}`
  if (tipo === 'Posto de saúde') return `Posto de saúde ${bairroName}`
  return `${tipo} ${rng.pick(OBRA_NOME)}`
}

const EVENT_BY_KIND: Record<string, string[]> = {
  'Produtora de eventos': ['Festival {n}', 'Show {n}', 'Festa de aniversário da cidade', 'Rodeio {n}', 'Feira gastronômica {n}', 'Arraiá {n}'],
  'Órgão público': ['Feira do Produtor', 'Corrida de rua {n}', 'Festival cultural {n}', 'Dia do Servidor', 'Exposição agropecuária', 'Parada cívica'],
  Cerimonial: ['Casamento {n}', 'Casamento {n}', 'Formatura {n}', 'Bodas de ouro {n}', 'Debutante {n}'],
  Igreja: ['Festa junina da comunidade', 'Congresso {n}', 'Retiro de jovens {n}', 'Festa da padroeira', 'Bazar beneficente'],
  Condomínio: ['Festa de confraternização', 'Feira de saúde do condomínio', 'Festa junina do condomínio'],
  Construtora: ['Estande de vendas {n}', 'Lançamento {n}', 'Confraternização de obra {n}'],
  Indústria: ['Semana de segurança do trabalho', 'Confraternização de fim de ano', 'Inauguração da unidade'],
}
const EVENT_N = ['Cerrado', 'Capital', 'Planalto', 'Candango', 'Brasília Viva', 'Ipê', 'Buriti', 'Norte', 'Sul', 'Vale Verde', 'Ana e Pedro', 'Lima e Duarte', 'Camila e Rodrigo', 'Beatriz e Henrique', 'Turma de Direito', 'Turma de Medicina']

export function eventTitle(rng: Rng, kind: ClientKind): string {
  const base = rng.pick(EVENT_BY_KIND[kind] ?? EVENT_BY_KIND['Produtora de eventos'])
  return base.replace('{n}', rng.pick(EVENT_N))
}

export const DAMAGE_DESCRIPTIONS: Record<string, string> = {
  'Porta quebrada': 'Porta saiu da dobradiça e a trava foi arrancada. Encontrada assim na retirada.',
  'Trinco ou fechadura': 'Trinco quebrado e indicador de ocupado travado.',
  'Mictório trincado': 'Mictório rachado na lateral, com vazamento no tanque.',
  'Tanque danificado': 'Tanque amassado, com trinca na base. Precisa de troca.',
  'Teto trincado': 'Teto trincado por impacto de material de obra.',
  Pichação: 'Pichação com tinta spray nas duas paredes laterais.',
  'Lona rasgada': 'Lona da tenda rasgada em 1,5 m por vento forte.',
  'Estrutura amassada': 'Perna da estrutura amassada, sem condições de montar.',
  'Grade empenada': 'Duas grades empenadas por impacto de veículo.',
  'Unidade não devolvida': 'Unidade não foi encontrada no local na retirada.',
}
