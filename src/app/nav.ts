import { Boxes, CalendarCheck, ChartColumn, ClipboardList, Landmark, TriangleAlert, Users, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  group: 'hoje' | 'gestao'
  /** `true` só casa a rota exata (o Painel fica em "/"). */
  end?: boolean
}

/** Itens da navegação lateral, na ordem. Fonte única para a lateral e para a busca (Ctrl K). */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: Wallet, label: 'Painel de dinheiro', group: 'hoje', end: true },
  { to: '/operacao', icon: CalendarCheck, label: 'Operação do dia', group: 'hoje' },
  { to: '/locacoes', icon: ClipboardList, label: 'Locações', group: 'gestao' },
  { to: '/equipamentos', icon: Boxes, label: 'Equipamentos', group: 'gestao' },
  { to: '/avarias', icon: TriangleAlert, label: 'Avarias e cobranças', group: 'gestao' },
  { to: '/financeiro', icon: Landmark, label: 'Financeiro', group: 'gestao' },
  { to: '/clientes', icon: Users, label: 'Clientes', group: 'gestao' },
  { to: '/relatorios', icon: ChartColumn, label: 'Relatórios', group: 'gestao' },
]
