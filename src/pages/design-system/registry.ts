import type { ComponentType } from 'react'
import ColorSection from './sections/ColorSection'
import TypeSection from './sections/TypeSection'
import { ElevationSection, MotionSection, RadiusSection, SpaceSection } from './sections/SpaceSection'
import { FormatSection, IconSection } from './sections/IconFormatSection'
import ButtonSection from './sections/ButtonSection'
import { ChoiceSection, InputSection } from './sections/FormSection'
import { CardSection, MoneySection, SkeletonSection, StatusSection, TooltipSection } from './sections/DisplaySection'
import DataSection from './sections/DataSection'
import OverlaySection from './sections/OverlaySection'
import ShellSection from './sections/ShellSection'

export type DsEntry = { id: string; title: string; Component: ComponentType }
export type DsGroup = { title: string; items: DsEntry[] }

/** Índice da página. O id de cada item é a âncora (#id) e precisa bater com o DsSection. */
export const DS_GROUPS: DsGroup[] = [
  {
    title: 'Fundamentos',
    items: [
      { id: 'cores', title: 'Cores', Component: ColorSection },
      { id: 'tipografia', title: 'Tipografia', Component: TypeSection },
      { id: 'espacamento', title: 'Espaçamento', Component: SpaceSection },
      { id: 'raios', title: 'Raios', Component: RadiusSection },
      { id: 'elevacao', title: 'Elevação', Component: ElevationSection },
      { id: 'movimento', title: 'Movimento', Component: MotionSection },
      { id: 'icones', title: 'Ícones', Component: IconSection },
      { id: 'formatos', title: 'Formatos', Component: FormatSection },
    ],
  },
  {
    title: 'Componentes',
    items: [
      { id: 'botoes', title: 'Botão', Component: ButtonSection },
      { id: 'campos', title: 'Campo de texto', Component: InputSection },
      { id: 'escolhas', title: 'Caixa, rádio, switch', Component: ChoiceSection },
      { id: 'status', title: 'Badge e status', Component: StatusSection },
      { id: 'cartoes', title: 'Cartão e indicador', Component: CardSection },
      { id: 'dinheiro', title: 'Dinheiro', Component: MoneySection },
      { id: 'tooltip', title: 'Tooltip', Component: TooltipSection },
      { id: 'carregando', title: 'Carregando', Component: SkeletonSection },
    ],
  },
  {
    title: 'Padrões',
    items: [
      { id: 'dados', title: 'Dados', Component: DataSection },
      { id: 'sobreposicoes', title: 'Sobreposições e fluxo', Component: OverlaySection },
      { id: 'casca', title: 'Casca', Component: ShellSection },
    ],
  },
]
