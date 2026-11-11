/*
  Pacotes de segmento. Trocar o pacote muda rótulos, campos da ficha e checklists;
  os dados de base (clientes, locações, cobranças) continuam os mesmos.
  Telas: use `useLabels()` (src/services/hooks.ts) em vez de escrever "banheiro", "limpeza" etc. fixo.
*/
import type { SegmentId, ServiceType } from './types'

export interface EquipmentField {
  key: string
  label: string
  kind: 'text' | 'number' | 'select' | 'date'
  unit?: string
  options?: string[]
}

export interface SegmentLabels {
  /** substantivo do equipamento: 'equipamento' / 'equipamentos' */
  equipment: string
  equipmentPlural: string
  /** item rastreado individualmente: 'unidade' / 'unidades' */
  unit: string
  unitPlural: string
  /** nome de cada tipo de serviço (já capitalizado) */
  serviceTypes: Record<ServiceType, string>
  /** "limpeza" do segmento: 'higienização', 'revisão'... (minúsculo, singular e plural) */
  cleaning: string
  cleaningPlural: string
  /** dano ao equipamento: 'avaria' */
  damage: string
  damagePlural: string
}

export interface SegmentPack {
  id: SegmentId
  name: string
  description: string
  labels: SegmentLabels
  /** campos extras da ficha do equipamento; os valores ficam em Unit.fields[key] */
  equipmentFields: EquipmentField[]
  /** itens do checklist do relatório, por tipo de serviço */
  checklists: Record<ServiceType, string[]>
  /** tipos de avaria para o seletor */
  damageKinds: string[]
}

const eventos: SegmentPack = {
  id: 'eventos',
  name: 'Eventos',
  description: 'Banheiros químicos e estruturas para eventos',
  labels: {
    equipment: 'equipamento',
    equipmentPlural: 'equipamentos',
    unit: 'unidade',
    unitPlural: 'unidades',
    serviceTypes: { entrega: 'Entrega', limpeza: 'Limpeza', retirada: 'Retirada', manutencao: 'Manutenção', montagem: 'Montagem' },
    cleaning: 'limpeza',
    cleaningPlural: 'limpezas',
    damage: 'avaria',
    damagePlural: 'avarias',
  },
  equipmentFields: [
    { key: 'capacidadeL', label: 'Capacidade do tanque', kind: 'number', unit: 'L' },
    { key: 'fabricante', label: 'Fabricante', kind: 'select', options: ['Polipex', 'Sanilux', 'Ecobox'] },
    { key: 'lote', label: 'Lote de fabricação', kind: 'text' },
  ],
  checklists: {
    entrega: ['Unidades niveladas e travadas', 'Carga inicial de produto químico', 'Papel higiênico abastecido', 'Sinalização conferida', 'Responsável conferiu a entrega'],
    limpeza: ['Sucção do tanque', 'Lavagem interna com desinfetante', 'Reposição de produto químico', 'Reposição de papel higiênico', 'Porta e trava funcionando', 'Área ao redor limpa'],
    retirada: ['Unidades esgotadas antes do transporte', 'Itens conferidos com o contrato', 'Avarias registradas com foto', 'Local entregue limpo'],
    manutencao: ['Defeito identificado', 'Peça trocada ou ajustada', 'Teste de funcionamento', 'Unidade liberada para uso'],
    montagem: ['Estruturas niveladas e fixadas', 'Lonas e travamentos conferidos', 'Quantidade conferida com o contrato', 'Responsável conferiu a montagem'],
  },
  damageKinds: ['Porta quebrada', 'Trinco ou fechadura', 'Mictório trincado', 'Tanque danificado', 'Teto trincado', 'Pichação', 'Lona rasgada', 'Estrutura amassada', 'Grade empenada', 'Unidade não devolvida'],
}

const estruturas: SegmentPack = {
  id: 'estruturas',
  name: 'Estruturas, som e luz',
  description: 'Palcos, tendas, som, iluminação e treliças',
  labels: {
    equipment: 'equipamento',
    equipmentPlural: 'equipamentos',
    unit: 'peça',
    unitPlural: 'peças',
    serviceTypes: { entrega: 'Entrega', limpeza: 'Revisão técnica', retirada: 'Desmontagem', manutencao: 'Manutenção', montagem: 'Montagem' },
    cleaning: 'revisão técnica',
    cleaningPlural: 'revisões técnicas',
    damage: 'avaria',
    damagePlural: 'avarias',
  },
  equipmentFields: [
    { key: 'serie', label: 'Número de série', kind: 'text' },
    { key: 'potenciaW', label: 'Potência', kind: 'number', unit: 'W' },
    { key: 'tensao', label: 'Tensão', kind: 'select', options: ['110 V', '220 V', 'Bivolt'] },
  ],
  checklists: {
    entrega: ['Equipamento conferido com o contrato', 'Cabos e conexões testados', 'Ponto de energia verificado', 'Responsável conferiu a entrega'],
    limpeza: ['Teste de som e sinal', 'Conferência de cabos e conectores', 'Lâmpadas e refletores testados', 'Fixações e travas revisadas', 'Equipamento limpo'],
    retirada: ['Peças contadas na desmontagem', 'Cabos recolhidos e identificados', 'Avarias registradas com foto', 'Local liberado'],
    manutencao: ['Defeito identificado', 'Peça trocada ou ajustada', 'Teste de bancada', 'Equipamento liberado'],
    montagem: ['Estrutura nivelada e travada', 'Aterramento conferido', 'Teste geral de som e luz', 'Responsável conferiu a montagem'],
  },
  damageKinds: ['Refletor queimado', 'Cabo rompido', 'Caixa acústica com falante danificado', 'Treliça empenada', 'Mesa de som com defeito', 'Lona rasgada', 'Peça não devolvida'],
}

const hospitalar: SegmentPack = {
  id: 'hospitalar',
  name: 'Equipamentos hospitalares',
  description: 'Camas, cadeiras de rodas, concentradores de oxigênio e monitores',
  labels: {
    equipment: 'equipamento',
    equipmentPlural: 'equipamentos',
    unit: 'aparelho',
    unitPlural: 'aparelhos',
    serviceTypes: { entrega: 'Entrega e instalação', limpeza: 'Higienização', retirada: 'Recolhimento', manutencao: 'Manutenção', montagem: 'Instalação' },
    cleaning: 'higienização',
    cleaningPlural: 'higienizações',
    damage: 'dano',
    damagePlural: 'danos',
  },
  equipmentFields: [
    { key: 'serie', label: 'Número de série', kind: 'text' },
    { key: 'registroAnvisa', label: 'Registro Anvisa', kind: 'text' },
    { key: 'proximaCalibracao', label: 'Próxima calibração', kind: 'date' },
  ],
  checklists: {
    entrega: ['Aparelho higienizado e lacrado', 'Instalação e teste no local', 'Orientação de uso ao responsável', 'Termo de entrega assinado'],
    limpeza: ['Desinfecção hospitalar', 'Teste de funcionamento', 'Calibração conferida', 'Acessórios completos', 'Embalagem lacrada'],
    retirada: ['Aparelho desligado e desmontado', 'Acessórios conferidos', 'Danos registrados com foto', 'Termo de recolhimento assinado'],
    manutencao: ['Defeito identificado', 'Peça trocada ou ajustada', 'Teste de segurança elétrica', 'Aparelho liberado'],
    montagem: ['Instalação no local', 'Teste de funcionamento', 'Orientação de uso', 'Termo de entrega assinado'],
  },
  damageKinds: ['Sensor danificado', 'Bateria sem carga', 'Painel quebrado', 'Acessório faltando', 'Estofado rasgado', 'Roda travada', 'Aparelho não devolvido'],
}

const maquinas: SegmentPack = {
  id: 'maquinas',
  name: 'Máquinas e ferramentas',
  description: 'Compactadores, geradores, betoneiras e ferramentas elétricas',
  labels: {
    equipment: 'máquina',
    equipmentPlural: 'máquinas',
    unit: 'máquina',
    unitPlural: 'máquinas',
    serviceTypes: { entrega: 'Entrega', limpeza: 'Revisão', retirada: 'Retirada', manutencao: 'Manutenção', montagem: 'Montagem' },
    cleaning: 'revisão',
    cleaningPlural: 'revisões',
    damage: 'avaria',
    damagePlural: 'avarias',
  },
  equipmentFields: [
    { key: 'serie', label: 'Número de série', kind: 'text' },
    { key: 'horimetroH', label: 'Horímetro', kind: 'number', unit: 'h' },
    { key: 'combustivel', label: 'Combustível', kind: 'select', options: ['Diesel', 'Gasolina', 'Elétrica'] },
  ],
  checklists: {
    entrega: ['Máquina conferida com o contrato', 'Horímetro registrado', 'Nível de combustível anotado', 'Orientação de uso ao operador'],
    limpeza: ['Nível de óleo', 'Filtros de ar e combustível', 'Horímetro registrado', 'Parafusos e proteções conferidos', 'Máquina lavada'],
    retirada: ['Horímetro registrado', 'Combustível conferido', 'Avarias registradas com foto', 'Máquina limpa para o transporte'],
    manutencao: ['Defeito identificado', 'Peça trocada ou ajustada', 'Teste em funcionamento', 'Máquina liberada'],
    montagem: ['Máquina posicionada e calçada', 'Teste de partida', 'Orientação de uso ao operador', 'Responsável conferiu'],
  },
  damageKinds: ['Lâmina danificada', 'Vazamento de óleo', 'Pneu furado', 'Peça quebrada', 'Painel danificado', 'Mau uso (superaquecimento)', 'Máquina não devolvida'],
}

export const SEGMENTS: Record<SegmentId, SegmentPack> = { eventos, estruturas, hospitalar, maquinas }
export const SEGMENT_LIST: SegmentPack[] = [eventos, estruturas, hospitalar, maquinas]
export const DEFAULT_SEGMENT: SegmentId = 'eventos'

export function getSegment(id: SegmentId | string | undefined): SegmentPack {
  return SEGMENTS[(id as SegmentId) ?? DEFAULT_SEGMENT] ?? eventos
}
