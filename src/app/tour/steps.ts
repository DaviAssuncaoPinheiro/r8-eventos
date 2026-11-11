/** Chave que marca a primeira visita ao escritório. */
export const TOUR_KEY = 'r8.tour.v1'

export interface TourStep {
  title: string
  text: string
  /** Rota onde o passo acontece; o tour navega até ela. */
  route: string
  /** Acha o elemento real a destacar. `null` centraliza o balão. */
  target: () => Element | null
  /** Raio do recorte quando o alvo não tem canto arredondado próprio. */
  radius?: number
}

/**
 * Item do menu lateral. No celular o menu fica numa gaveta fechada: sem item visível, destaca o título da tela.
 */
const sideLink = (href: string) => () => {
  const link = document.querySelector(`nav[aria-label="Navegação principal"] a[href="${href}"]`)
  if (link) {
    const r = link.getBoundingClientRect()
    const shown = r.width > 0 && r.right > 0 && r.left < window.innerWidth && getComputedStyle(link).visibility !== 'hidden'
    if (shown) return link
  }
  return document.querySelector('main h1')
}

/** Cartão ou grade do Painel a partir do título que ele mostra (a tela não expõe âncoras próprias). */
function byHeading(tag: 'h2' | 'h3', text: string, up: 'section' | 'grid') {
  return () => {
    const h = Array.from(document.querySelectorAll(`main ${tag}`)).find((n) => n.textContent?.trim() === text)
    if (!h) return null
    const section = h.closest('section')
    // o cartão em destaque vem dentro de um envoltório de inclinação: a grade é o ancestral `grid` mais próximo
    return up === 'section' ? section : (section?.closest('.grid') ?? null)
  }
}

/** Seção da tela a partir do título (h2) que começa com o texto: o título pode trazer o botão "como é calculado". */
function bySectionStart(text: string) {
  return () => {
    const h = Array.from(document.querySelectorAll('main h2')).find((n) => n.textContent?.trim().startsWith(text))
    return h?.closest('section') ?? null
  }
}

/** Faixa de indicadores das Automações: a grade que reúne os três cartões do topo. */
const automationStats = () => document.querySelector('main section[aria-label="Feito sozinho hoje"]')?.parentElement ?? null

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Seu dinheiro hoje',
    text: 'Veja quanto rende, quanto está parado e o que falta cobrar.',
    route: '/',
    target: byHeading('h2', 'Alugado hoje', 'grid'),
    radius: 30,
  },
  {
    title: 'Para fazer hoje',
    text: 'Comece por aqui: o que recupera dinheiro hoje.',
    route: '/',
    target: byHeading('h2', 'Para fazer hoje', 'section'),
  },
  {
    title: 'Operação do dia',
    text: 'Caminhões no mapa real e rotas otimizadas com um clique.',
    route: '/operacao',
    target: sideLink('/operacao'),
  },
  {
    title: 'Locações',
    text: 'Do orçamento à fatura, tudo em um lugar.',
    route: '/locacoes',
    target: sideLink('/locacoes'),
  },
  {
    title: 'Avarias e cobranças',
    text: 'A avaria vira cobrança por e-mail com um clique.',
    route: '/avarias',
    target: sideLink('/avarias'),
  },
  {
    title: 'Automações',
    text: 'O sistema cobra, fatura e redistribui rotas sozinho.',
    route: '/automacoes',
    target: automationStats,
    radius: 30,
  },
  {
    title: 'Inteligência',
    text: 'Caixa previsto, lucro por equipamento e preço sugerido.',
    route: '/inteligencia',
    target: bySectionStart('Caixa previsto em 30 dias'),
  },
  {
    title: 'Portal do cliente',
    text: 'O cliente vê a prova de cada serviço.',
    route: '/clientes',
    target: sideLink('/clientes'),
  },
  {
    title: 'A sua marca',
    text: 'O sistema com a cara da sua locadora.',
    route: '/configuracoes/marca',
    target: () => document.querySelector('main section[aria-label="Marca"]'),
  },
]
