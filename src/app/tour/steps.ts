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

const sideLink = (href: string) => () => document.querySelector(`nav[aria-label="Navegação principal"] a[href="${href}"]`)

/** Cartão ou grade do Painel a partir do título que ele mostra (a tela não expõe âncoras próprias). */
function byHeading(tag: 'h2' | 'h3', text: string, up: 'section' | 'grid') {
  return () => {
    const h = Array.from(document.querySelectorAll(`main ${tag}`)).find((n) => n.textContent?.trim() === text)
    if (!h) return null
    const section = h.closest('section')
    return up === 'section' ? section : (section?.parentElement ?? null)
  }
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Seu dinheiro hoje',
    text: 'Veja quanto rende, quanto está parado e o que falta cobrar.',
    route: '/',
    target: byHeading('h3', 'Alugado hoje', 'grid'),
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
    text: 'Veja onde está cada caminhão agora.',
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
    text: 'A avaria vira cobrança com um clique.',
    route: '/avarias',
    target: sideLink('/avarias'),
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
