import * as React from 'react'
import { Search } from 'lucide-react'
import { Checkbox, Field, Input, Radio, RadioGroup, Segmented, Select, Switch, Textarea } from '@/ui'
import { DsSection, Specimen } from '../kit'

export function InputSection() {
  return (
    <DsSection
      id="campos"
      title="Campo de texto"
      intro="Rótulo sempre visível acima (14px peso 600), altura 40px (48px no app de campo), borda border-strong com 3:1. Erro abaixo do campo, antes da ajuda."
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Cliente" help="Nome fantasia ou razão social.">
          <Input placeholder="Ex.: Construtora Planalto" />
        </Field>
        <Field label="Cliente" help="Estado forçado: hover.">
          <Input defaultValue="Construtora Planalto" forceState="hover" />
        </Field>
        <Field label="Cliente" help="Estado forçado: foco.">
          <Input defaultValue="Construtora Planalto" forceState="focus" />
        </Field>
        <Field label="Valor da avaria" help="Será somado à próxima cobrança.">
          <Input prefix="R$" numeric defaultValue="3.184,50" inputMode="decimal" />
        </Field>
        <Field label="Quantidade" optional>
          <Input numeric suffix="unidades" defaultValue="12" inputMode="numeric" />
        </Field>
        <Field label="Buscar equipamento">
          <Input prefix={<Search size={16} strokeWidth={2} aria-hidden />} placeholder="Código ou nome, ex.: BQ-0142" type="search" />
        </Field>
        <Field label="CNPJ" error="CNPJ incompleto. Confira os 14 números.">
          <Input defaultValue="12.345.678/0001" />
        </Field>
        <Field label="Valor da diária" disabled help="Definido no contrato. Edite pela locação.">
          <Input prefix="R$" numeric defaultValue="85,00" />
        </Field>
        <Field label="Placa do caminhão" help="Tamanho lg, usado no app de campo.">
          <Input size="lg" defaultValue="PAW-4B21" />
        </Field>
      </div>
      <Specimen title="Área de texto">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Observação da avaria" help="Aparece no relatório do cliente.">
            <Textarea defaultValue="Porta da BQ-0142 com dobradiça quebrada. Cliente avisado no local." />
          </Field>
          <Field label="Observação da avaria" error="Descreva a avaria antes de enviar.">
            <Textarea placeholder="O que aconteceu, onde e quem viu" />
          </Field>
        </div>
      </Specimen>
      <Specimen title="Seleção (nativo)" note="Nativo de propósito: no celular abre o seletor do sistema. Para lista com busca, use o Combobox (DESIGN.md).">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Equipe">
            <Select defaultValue="b">
              <option value="a">Equipe Norte</option>
              <option value="b">Equipe Sul</option>
              <option value="c">Equipe Lagos</option>
            </Select>
          </Field>
          <Field label="Equipe" help="Sem seleção (vazio).">
            <Select defaultValue="" placeholder="Escolha a equipe">
              <option value="a">Equipe Norte</option>
            </Select>
          </Field>
          <Field label="Equipe" help="Estado forçado: foco.">
            <Select defaultValue="a" forceState="focus">
              <option value="a">Equipe Norte</option>
            </Select>
          </Field>
          <Field label="Forma de cobrança" error="Escolha como o cliente vai pagar.">
            <Select defaultValue="" placeholder="Escolha">
              <option value="boleto">Boleto</option>
              <option value="pix">Pix</option>
            </Select>
          </Field>
          <Field label="Forma de cobrança" disabled>
            <Select defaultValue="pix">
              <option value="pix">Pix</option>
            </Select>
          </Field>
        </div>
      </Specimen>
    </DsSection>
  )
}

export function ChoiceSection() {
  const [period, setPeriod] = React.useState<'dia' | 'semana' | 'mes'>('semana')
  const [view, setView] = React.useState<'lista' | 'mapa'>('lista')
  return (
    <DsSection id="escolhas" title="Caixa, rádio, switch e segmentado" intro="Caixa e rádio de 18px, switch 36×20. A linha inteira é clicável: 32px no desktop, 44px em tela de toque.">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        <Specimen title="Caixa de seleção">
          <Checkbox label="Cobrar avaria na próxima fatura" />
          <Checkbox label="Cobrar avaria na próxima fatura" defaultChecked />
          <Checkbox label="Selecionar todas (3 de 12)" indeterminate />
          <Checkbox label="Hover forçado" forceState="hover" />
          <Checkbox label="Foco forçado" forceState="focus" defaultChecked />
          <Checkbox label="Com erro" invalid description="Confirme antes de enviar." />
          <Checkbox label="Desabilitada" disabled />
          <Checkbox label="Desabilitada marcada" disabled defaultChecked />
        </Specimen>
        <Specimen title="Rádio">
          <RadioGroup legend="Frequência de limpeza">
            <Radio name="freq" label="Diária" description="Segunda a sábado" />
            <Radio name="freq" label="3 vezes por semana" defaultChecked />
            <Radio name="freq" label="Semanal" forceState="focus" />
            <Radio name="freq" label="Sob demanda" disabled />
          </RadioGroup>
        </Specimen>
        <Specimen title="Switch">
          <Switch label="Avisar cliente pelo WhatsApp" description="Mensagem ao concluir cada serviço." defaultChecked />
          <Switch label="Cobrar extra automaticamente" />
          <Switch label="Hover forçado" forceState="hover" />
          <Switch label="Foco forçado" forceState="focus" defaultChecked />
          <Switch label="Desabilitado" disabled />
          <Switch label="Desabilitado ligado" disabled defaultChecked />
        </Specimen>
      </div>
      <Specimen title="Segmentado" note="Troca de visão ou período. Setas do teclado movem a seleção. Até 4 opções; acima disso use Select.">
        <div className="flex flex-col items-start gap-4">
          <Segmented
            label="Período"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'dia', label: 'Hoje' },
              { value: 'semana', label: 'Semana' },
              { value: 'mes', label: 'Mês' },
            ]}
          />
          <Segmented
            label="Visão"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'lista', label: 'Lista' },
              { value: 'mapa', label: 'Mapa' },
            ]}
          />
          <div className="w-full max-w-sm">
            <Segmented
              label="Período no celular"
              block
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'dia', label: 'Hoje' },
                { value: 'semana', label: 'Semana' },
                { value: 'mes', label: 'Mês', disabled: true },
              ]}
            />
          </div>
        </div>
      </Specimen>
    </DsSection>
  )
}
