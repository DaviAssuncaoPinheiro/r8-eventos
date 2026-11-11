import { Check, Download, MoreHorizontal, Plus, Receipt, Trash2 } from 'lucide-react'
import { Button, type ButtonVariant } from '@/ui'
import { DsSection, Specimen, StateCell } from '../kit'

const VARIANTS: { v: ButtonVariant; label: string; text: string; icon?: typeof Plus }[] = [
  { v: 'primary', label: 'Primário', text: 'Gerar cobrança', icon: Receipt },
  { v: 'secondary', label: 'Secundário', text: 'Exportar', icon: Download },
  { v: 'ghost', label: 'Fantasma', text: 'Cancelar' },
  { v: 'danger', label: 'Perigo', text: 'Excluir avaria', icon: Trash2 },
]

export default function ButtonSection() {
  return (
    <DsSection
      id="botoes"
      title="Botão"
      intro="Um primário por área de ação. Raio 10px, texto 14px peso 600. Desabilitado troca a cor (sem transparência) e mantém o rótulo legível."
    >
      {VARIANTS.map(({ v, label, text, icon }) => (
        <Specimen key={v} title={label}>
          <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
            <StateCell label="Padrão">
              <Button variant={v} icon={icon}>
                {text}
              </Button>
            </StateCell>
            <StateCell label="Hover">
              <Button variant={v} icon={icon} forceState="hover">
                {text}
              </Button>
            </StateCell>
            <StateCell label="Foco">
              <Button variant={v} icon={icon} forceState="focus">
                {text}
              </Button>
            </StateCell>
            <StateCell label="Pressionado">
              <Button variant={v} icon={icon} forceState="active">
                {text}
              </Button>
            </StateCell>
            <StateCell label="Desabilitado">
              <Button variant={v} icon={icon} disabled>
                {text}
              </Button>
            </StateCell>
            <StateCell label="Carregando">
              <Button variant={v} loading>
                {v === 'primary' ? 'Gerando' : v === 'danger' ? 'Excluindo' : 'Salvando'}
              </Button>
            </StateCell>
          </div>
        </Specimen>
      ))}
      <Specimen title="Tamanhos" note="sm 32px, md 40px (padrão), lg 48px, field 56px (app de campo, botão principal). Em tela de toque o sm cresce para 44px.">
        <div className="flex flex-wrap items-end gap-4">
          <StateCell label="sm · 32">
            <Button size="sm" variant="primary" icon={Plus}>
              Novo serviço
            </Button>
          </StateCell>
          <StateCell label="md · 40">
            <Button size="md" variant="primary" icon={Plus}>
              Novo serviço
            </Button>
          </StateCell>
          <StateCell label="lg · 48">
            <Button size="lg" variant="primary" icon={Plus}>
              Novo serviço
            </Button>
          </StateCell>
          <StateCell label="field · 56">
            <Button size="field" variant="primary" icon={Check}>
              Concluir limpeza
            </Button>
          </StateCell>
        </div>
      </Specimen>
      <Specimen title="Só ícone" note="Quadrado do tamanho da altura. aria-label obrigatório e tooltip com o mesmo texto.">
        <div className="flex flex-wrap items-end gap-4">
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <StateCell key={s} label={s}>
              <Button size={s} iconOnly icon={MoreHorizontal} aria-label="Mais ações" />
            </StateCell>
          ))}
          <StateCell label="fantasma">
            <Button variant="ghost" iconOnly icon={MoreHorizontal} aria-label="Mais ações" />
          </StateCell>
          <StateCell label="primário">
            <Button variant="primary" iconOnly icon={Plus} aria-label="Novo serviço" />
          </StateCell>
        </div>
      </Specimen>
      <Specimen title="Largura total" note="No celular, a ação principal ocupa a largura e fica no rodapé fixo.">
        <div className="max-w-sm">
          <Button size="field" variant="primary" block icon={Check}>
            Concluir limpeza
          </Button>
        </div>
      </Specimen>
    </DsSection>
  )
}
