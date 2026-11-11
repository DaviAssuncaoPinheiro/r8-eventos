// Mapa estilizado do Distrito Federal (viewBox 1000 x 680). Não é cartografia exata:
// é uma leitura simplificada das regiões, com o Lago Paranoá a leste do Plano Piloto
// e o Parque Nacional a noroeste.

export type ZoneId = 'plano' | 'lagos' | 'guara' | 'oeste' | 'sul' | 'norte'

export interface Zone {
  id: ZoneId
  name: string
  short: string
  color: string // var css
  hex: string
  polygon: [number, number][]
  label: [number, number]
}

export const VIEWBOX = { w: 1000, h: 680 }

export const ZONES: Zone[] = [
  {
    id: 'plano',
    name: 'Plano Piloto',
    short: 'Plano',
    color: 'var(--color-z-plano)',
    hex: '#7b6cf0',
    polygon: [[470, 175], [590, 150], [650, 175], [648, 250], [626, 320], [640, 400], [612, 470], [560, 490], [505, 455], [480, 400], [478, 300]],
    label: [548, 196],
  },
  {
    id: 'lagos',
    name: 'Lagos e Paranoá',
    short: 'Lagos',
    color: 'var(--color-z-lagos)',
    hex: '#3d7afa',
    polygon: [[650, 175], [740, 200], [860, 215], [970, 190], [972, 380], [930, 500], [840, 560], [720, 560], [640, 520], [612, 470], [640, 400], [626, 320], [648, 250]],
    label: [880, 252],
  },
  {
    id: 'guara',
    name: 'Guará e SIA',
    short: 'Guará',
    color: 'var(--color-z-guara)',
    hex: '#1fa7a0',
    polygon: [[400, 330], [478, 300], [480, 400], [505, 455], [560, 490], [612, 470], [640, 520], [600, 560], [500, 560], [420, 520], [380, 450]],
    label: [520, 545],
  },
  {
    id: 'oeste',
    name: 'Taguatinga e Ceilândia',
    short: 'Oeste',
    color: 'var(--color-z-oeste)',
    hex: '#2eb46c',
    polygon: [[50, 250], [200, 210], [340, 215], [380, 290], [400, 330], [380, 450], [420, 520], [360, 540], [250, 540], [130, 500], [60, 400]],
    label: [196, 250],
  },
  {
    id: 'sul',
    name: 'Gama e Santa Maria',
    short: 'Sul',
    color: 'var(--color-z-sul)',
    hex: '#f5b83d',
    polygon: [[130, 500], [250, 540], [360, 540], [420, 520], [500, 560], [600, 560], [640, 520], [720, 560], [700, 640], [520, 655], [300, 650], [170, 600]],
    label: [600, 616],
  },
  {
    id: 'norte',
    name: 'Sobradinho e Planaltina',
    short: 'Norte',
    color: 'var(--color-z-norte)',
    hex: '#e5577e',
    polygon: [[560, 60], [700, 40], [860, 30], [960, 60], [970, 190], [860, 215], [740, 200], [650, 175], [590, 150]],
    label: [800, 160],
  },
]

export const ZONE = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<ZoneId, Zone>

export interface Bairro {
  id: string
  name: string
  zone: ZoneId
  x: number
  y: number
}

/** Regiões administrativas e setores (chamados de "bairro" no código) */
export const BAIRROS: Bairro[] = [
  // Plano Piloto
  { id: 'asa-norte', name: 'Asa Norte', zone: 'plano', x: 590, y: 222 },
  { id: 'noroeste', name: 'Noroeste', zone: 'plano', x: 522, y: 218 },
  { id: 'esplanada', name: 'Esplanada', zone: 'plano', x: 598, y: 330 },
  { id: 'sudoeste', name: 'Sudoeste', zone: 'plano', x: 506, y: 330 },
  { id: 'asa-sul', name: 'Asa Sul', zone: 'plano', x: 572, y: 420 },
  { id: 'setor-clubes', name: 'Setor de Clubes', zone: 'plano', x: 604, y: 456 },
  { id: 'mane-garrincha', name: 'Eixo Monumental', zone: 'plano', x: 545, y: 300 },
  // Lagos
  { id: 'lago-norte', name: 'Lago Norte', zone: 'lagos', x: 772, y: 302 },
  { id: 'lago-sul', name: 'Lago Sul', zone: 'lagos', x: 742, y: 518 },
  { id: 'paranoa', name: 'Paranoá', zone: 'lagos', x: 892, y: 322 },
  { id: 'jardim-botanico', name: 'Jardim Botânico', zone: 'lagos', x: 876, y: 452 },
  // Guará e SIA
  { id: 'sia', name: 'SIA', zone: 'guara', x: 436, y: 392 },
  { id: 'guara', name: 'Guará', zone: 'guara', x: 470, y: 452 },
  { id: 'nucleo-bandeirante', name: 'Núcleo Bandeirante', zone: 'guara', x: 528, y: 512 },
  { id: 'park-way', name: 'Park Way', zone: 'guara', x: 594, y: 528 },
  { id: 'riacho-fundo', name: 'Riacho Fundo', zone: 'guara', x: 440, y: 505 },
  // Oeste
  { id: 'ceilandia', name: 'Ceilândia', zone: 'oeste', x: 140, y: 330 },
  { id: 'taguatinga', name: 'Taguatinga', zone: 'oeste', x: 262, y: 336 },
  { id: 'vicente-pires', name: 'Vicente Pires', zone: 'oeste', x: 318, y: 272 },
  { id: 'aguas-claras', name: 'Águas Claras', zone: 'oeste', x: 334, y: 400 },
  { id: 'samambaia', name: 'Samambaia', zone: 'oeste', x: 226, y: 462 },
  // Sul
  { id: 'recanto', name: 'Recanto das Emas', zone: 'sul', x: 214, y: 566 },
  { id: 'gama', name: 'Gama', zone: 'sul', x: 330, y: 604 },
  { id: 'santa-maria', name: 'Santa Maria', zone: 'sul', x: 480, y: 606 },
  // Norte
  { id: 'sobradinho', name: 'Sobradinho', zone: 'norte', x: 704, y: 112 },
  { id: 'planaltina', name: 'Planaltina', zone: 'norte', x: 884, y: 92 },
]

export const BAIRRO = Object.fromEntries(BAIRROS.map((b) => [b.id, b])) as Record<string, Bairro>

/** Base da locadora no SIA (ponto de saída dos caminhões) */
export const BASE = { name: 'Base, SIA', bairro: 'SIA', x: 452, y: 410 }

/** Lago Paranoá: braço norte, corpo central e braço sul (Ponte JK) */
export const LAKE_PATH =
  'M652,198 C690,190 740,200 780,222 C802,234 802,252 782,254 C750,252 714,242 692,252 C672,264 668,302 674,340 C680,380 690,410 712,432 C740,452 790,452 812,468 C828,480 812,494 788,492 C750,490 712,480 686,472 C660,464 640,442 636,410 C630,370 640,330 644,290 C648,250 640,215 652,198 Z'

/** Parque Nacional de Brasília (área verde fora das regiões) */
export const PARK_PATH = 'M392,186 C420,170 452,170 470,182 C478,220 478,262 476,298 C452,306 428,316 404,326 C388,300 376,272 366,244 C362,214 372,196 392,186 Z'

/** Vias principais (estilizadas) */
export const AVENIDAS: { name: string; d: string }[] = [
  { name: 'Eixo Monumental', d: 'M440,318 C500,322 560,326 640,330' },
  { name: 'Eixão', d: 'M586,160 C600,230 606,290 602,330 C598,380 592,440 580,492' },
  { name: 'EPTG', d: 'M262,336 C320,344 380,346 470,324' },
  { name: 'EPIA', d: 'M500,150 C492,250 476,340 472,420 C470,480 482,540 500,600' },
  { name: 'Estrutural', d: 'M140,312 C240,282 360,262 470,262' },
  { name: 'BR-020', d: 'M600,170 C650,140 700,118 760,104 C820,92 870,86 920,80' },
  { name: 'BR-060', d: 'M380,452 C330,490 280,522 220,562' },
  { name: 'Ponte JK', d: 'M616,462 C650,474 690,486 730,500' },
]
