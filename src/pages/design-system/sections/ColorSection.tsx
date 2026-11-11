import * as React from 'react'
import { DsSection, DsVersion, readHex, Specimen } from '../kit'

type Tok = { v: string; name: string; use: string; text?: string }

const GROUPS: { title: string; note: string; tokens: Tok[] }[] = [
  {
    title: 'Superfícies',
    note: 'Separação por tom, sem sombra: app (fundo) < painel < cartão. Afundado para áreas dentro do painel.',
    tokens: [
      { v: '--app', name: 'bg-app', use: 'Fundo da janela' },
      { v: '--panel', name: 'bg-panel', use: 'Lateral, painel principal, trilho' },
      { v: '--raised', name: 'bg-raised', use: 'Cartão, campo, tabela' },
      { v: '--sunken', name: 'bg-sunken', use: 'Trilho do segmentado, área vazia' },
      { v: '--hover', name: 'bg-hover', use: 'Hover de linha e botão' },
      { v: '--overlay', name: 'bg-overlay', use: 'Menu, diálogo, gaveta' },
      { v: '--inverse', name: 'bg-inverse', use: 'Tooltip, toast', text: '--on-inverse' },
    ],
  },
  {
    title: 'Texto e linhas',
    note: 'Três níveis de texto, todos acima de 4,5:1 em qualquer superfície. Desabilitado é isento por norma.',
    tokens: [
      { v: '--fg', name: 'text-fg', use: 'Texto principal, números' },
      { v: '--fg-2', name: 'text-fg-2', use: 'Rótulo, texto secundário' },
      { v: '--fg-3', name: 'text-fg-3', use: 'Legenda, ajuda, placeholder' },
      { v: '--fg-disabled', name: 'text-fg-disabled', use: 'Desabilitado' },
      { v: '--hairline', name: 'border-hairline', use: 'Divisor, linha de tabela' },
      { v: '--edge', name: 'border-edge', use: 'Contorno de botão secundário' },
      { v: '--strong', name: 'border-strong', use: 'Borda de campo, caixa (3:1)' },
    ],
  },
  {
    title: 'Marca',
    note: 'Derivada da cor escolhida pelo cliente. Muda ao trocar a cor no topo da página.',
    tokens: [
      { v: '--accent', name: 'bg-accent', use: 'Botão primário, bloco destaque', text: '--on-accent' },
      { v: '--accent-hover', name: 'bg-accent-hover', use: 'Hover do primário', text: '--on-accent' },
      { v: '--accent-active', name: 'bg-accent-active', use: 'Pressionado', text: '--on-accent' },
      { v: '--accent-soft', name: 'bg-accent-soft', use: 'Seleção, item ativo', text: '--accent-ink' },
      { v: '--accent-ink', name: 'text-accent-ink', use: 'Link, item ativo, anel de foco' },
      { v: '--on-accent-2', name: 'text-on-accent-2', use: 'Texto secundário sobre a marca' },
    ],
  },
  {
    title: 'Estados',
    note: 'Cada estado tem cor base (ponto, ícone), fundo suave e tinta para texto.',
    tokens: [
      { v: '--ok', name: 'ok', use: 'Concluído, pago, disponível' },
      { v: '--ok-soft', name: 'ok-soft', use: 'Fundo', text: '--ok-ink' },
      { v: '--warn', name: 'warn', use: 'Atenção, vence hoje' },
      { v: '--warn-soft', name: 'warn-soft', use: 'Fundo', text: '--warn-ink' },
      { v: '--danger', name: 'danger', use: 'Atraso, avaria, erro' },
      { v: '--danger-soft', name: 'danger-soft', use: 'Fundo', text: '--danger-ink' },
      { v: '--danger-solid', name: 'danger-solid', use: 'Botão de perigo', text: '--on-accent' },
      { v: '--info', name: 'info', use: 'A caminho, informativo' },
      { v: '--info-soft', name: 'info-soft', use: 'Fundo', text: '--info-ink' },
      { v: '--idle', name: 'idle', use: 'Parado, sem uso (com hachura)' },
    ],
  },
  {
    title: 'Gráficos',
    note: 'Ordem fixa. Série única usa a cor da marca. Testada para deuteranopia e protanopia (ver DESIGN.md).',
    tokens: [
      { v: '--viz-1', name: 'viz-1', use: 'Série 1' },
      { v: '--viz-2', name: 'viz-2', use: 'Série 2' },
      { v: '--viz-3', name: 'viz-3', use: 'Série 3' },
      { v: '--viz-4', name: 'viz-4', use: 'Série 4' },
      { v: '--viz-5', name: 'viz-5', use: 'Série 5' },
      { v: '--viz-6', name: 'viz-6', use: 'Série 6' },
    ],
  },
]

function Swatch({ t }: { t: Tok }) {
  React.useContext(DsVersion)
  const [hex, setHex] = React.useState('')
  const version = React.useContext(DsVersion)
  React.useEffect(() => setHex(readHex(t.v)), [t.v, version])
  return (
    <li className="flex min-w-0 items-center gap-3 py-2">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-control text-caption font-bold shadow-[inset_0_0_0_1px_var(--edge)]"
        style={{ background: `var(${t.v})`, color: t.text ? `var(${t.text})` : undefined }}
      >
        {t.text ? 'Aa' : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-body font-semibold text-fg">{t.name}</span>
        <span className="block truncate text-caption text-fg-3">
          <span className="tnum">{hex}</span> · {t.use}
        </span>
      </span>
    </li>
  )
}

export default function ColorSection() {
  return (
    <DsSection id="cores" title="Cores" intro="Valores lidos do CSS em tempo real. Troque o tema e a cor da marca no topo para ver a derivação.">
      {GROUPS.map((g) => (
        <Specimen key={g.title} title={g.title} note={g.note}>
          <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
            {g.tokens.map((t) => (
              <Swatch key={t.v} t={t} />
            ))}
          </ul>
        </Specimen>
      ))}
    </DsSection>
  )
}
