import { DsSection, Specimen } from '../kit'

const ROLES = [
  { cls: 'text-kpi-lg', name: 'kpi-lg', spec: '44/48 · 600 · -0,035em', sample: 'R$ 48.312,90', tnum: true },
  { cls: 'text-title-page', name: 'title-page', spec: '34/40 · 600 · -0,03em', sample: 'Locações em andamento' },
  { cls: 'text-kpi', name: 'kpi', spec: '32/38 · 600 · -0,03em', sample: '1.284 unidades', tnum: true },
  { cls: 'text-title-field', name: 'title-field', spec: '24/30 · 600 · -0,02em (app da equipe de rua)', sample: 'Limpeza, 12 unidades' },
  { cls: 'text-title-section', name: 'title-section', spec: '22/28 · 600 · -0,015em', sample: 'Cobranças da semana' },
  { cls: 'text-title-sub', name: 'title-sub', spec: '18/24 · 600 · -0,01em', sample: 'Construtora Planalto' },
  { cls: 'text-title-card', name: 'title-card', spec: '16/22 · 600 · -0,005em', sample: 'Equipamentos parados' },
  { cls: 'text-body-lg', name: 'body-lg', spec: '16/24 · 500 (corpo do app da equipe de rua)', sample: 'Fotografe a porta e o interior da unidade antes de limpar.' },
  { cls: 'text-body', name: 'body', spec: '14/20 · 500 (corpo do escritório)', sample: 'Avaria registrada na BQ-0142 durante a retirada de 03/11/2026.' },
  { cls: 'text-body font-semibold', name: 'body + 600', spec: '14/20 · 600 (rótulo, botão)', sample: 'Gerar cobrança' },
  { cls: 'text-caption', name: 'caption', spec: '12/16 · 500 (legenda, ajuda; mínimo absoluto)', sample: 'Atualizado às 14:32 por Marcos Vieira' },
]

export default function TypeSection() {
  return (
    <DsSection
      id="tipografia"
      title="Tipografia"
      intro="Manrope variável. Escala: 12, 14, 16, 18, 22, 24, 32, 34, 44. Peso 500 no texto, 600 em título e número. Números tabulares."
    >
      <Specimen title="Papéis">
        <ul className="divide-y divide-hairline rounded-card bg-raised">
          {ROLES.map((r) => (
            <li key={r.name} className="grid gap-1 px-4 py-4 sm:grid-cols-[200px_1fr] sm:items-baseline sm:gap-6 sm:px-5">
              <div>
                <div className="text-body font-semibold">{r.name}</div>
                <div className="text-caption text-fg-3">{r.spec}</div>
              </div>
              <div className={`${r.cls} min-w-0 break-words ${r.tnum ? 'tnum' : ''}`}>{r.sample}</div>
            </li>
          ))}
        </ul>
      </Specimen>
      <Specimen title="Algarismos tabulares" note="Com .tnum, 1111 e 8888 têm a mesma largura.">
        <div className="grid max-w-md grid-cols-2 gap-x-6 rounded-card bg-raised p-5 text-body">
          <span className="text-fg-3">Tabular</span>
          <span className="text-fg-3">Proporcional</span>
          <span className="tnum text-kpi" data-testid="tnum-1">
            1111
          </span>
          <span className="text-kpi">1111</span>
          <span className="tnum text-kpi" data-testid="tnum-8">
            8888
          </span>
          <span className="text-kpi">8888</span>
        </div>
      </Specimen>
      <Specimen title="Acentos" note="Conferido em 400, 500, 600 e 700.">
        <div className="flex flex-col gap-1 rounded-card bg-raised p-5 text-body-lg">
          <span className="font-normal">400 · Ação, manutenção, cobrança, São Sebastião, Águas Claras</span>
          <span className="font-medium">500 · Ação, manutenção, cobrança, São Sebastião, Águas Claras</span>
          <span className="font-semibold">600 · Ação, manutenção, cobrança, São Sebastião, Águas Claras</span>
          <span className="font-bold">700 · Ação, manutenção, cobrança, São Sebastião, Águas Claras</span>
        </div>
      </Specimen>
    </DsSection>
  )
}
