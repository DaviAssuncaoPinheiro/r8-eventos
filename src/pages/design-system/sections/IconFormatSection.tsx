import { Bell, CalendarDays, ClipboardCheck, Package, QrCode, Receipt, Truck, Wrench } from 'lucide-react'
import { formatCNPJ, formatDate, formatDateTime, formatMoney, formatPercent, formatPhone } from '@/lib/format'
import { DsSection, Specimen } from '../kit'

const SIZES = [
  { px: 14, use: 'Dentro de badge e legenda' },
  { px: 16, use: 'Botão sm, tabela, campo' },
  { px: 18, use: 'Botão md, navegação' },
  { px: 20, use: 'Botão lg, cabeçalho' },
  { px: 24, use: 'App da equipe de rua, estado vazio' },
]
const SET = [Truck, Package, Wrench, Receipt, CalendarDays, ClipboardCheck, QrCode, Bell]

export function IconSection() {
  return (
    <DsSection id="icones" title="Ícones" intro="lucide-react, traço 2 em todos os tamanhos, cor herdada do texto. Nenhum emoji como ícone. Ícone sozinho exige aria-label.">
      <div className="flex flex-col gap-4 rounded-card bg-raised p-5">
        {SIZES.map((s) => (
          <div key={s.px} className="grid grid-cols-[120px_1fr] items-center gap-4">
            <div>
              <div className="tnum text-body font-semibold">{s.px}px</div>
              <div className="text-caption text-fg-3">{s.use}</div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-fg-2">
              {SET.map((I, i) => (
                <I key={i} size={s.px} strokeWidth={2} aria-hidden />
              ))}
            </div>
          </div>
        ))}
      </div>
    </DsSection>
  )
}

const now = new Date(2026, 10, 3, 14, 32)
const FORMATS = [
  { what: 'Dinheiro', fn: 'formatMoney(3184.5)', out: formatMoney(3184.5) },
  { what: 'Dinheiro negativo', fn: 'formatMoney(-420)', out: formatMoney(-420) },
  { what: 'Variação', fn: 'formatMoney(860, { sign: true })', out: formatMoney(860, { sign: true }) },
  { what: 'Data', fn: 'formatDate(date)', out: formatDate(now) },
  { what: 'Data e hora', fn: 'formatDateTime(date)', out: formatDateTime(now) },
  { what: 'Telefone', fn: "formatPhone('61998412207')", out: formatPhone('61998412207') },
  { what: 'CNPJ', fn: "formatCNPJ('12345678000190')", out: formatCNPJ('12345678000190') },
  { what: 'Percentual', fn: 'formatPercent(0.124)', out: formatPercent(0.124) },
]

export function FormatSection() {
  return (
    <DsSection id="formatos" title="Formatos" intro="Funções em src/lib/format.ts. Dinheiro sempre com centavos e alinhado à direita em tabela.">
      <Specimen title="Exemplos">
        <div className="overflow-x-auto rounded-card bg-raised">
          <table className="w-full min-w-[520px] text-left text-body">
            <thead>
              <tr className="h-9 text-caption font-semibold text-fg-3">
                <th className="px-5 font-semibold">Tipo</th>
                <th className="px-3 font-semibold">Chamada</th>
                <th className="px-5 text-right font-semibold">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {FORMATS.map((f) => (
                <tr key={f.what} className="h-12 border-t border-hairline">
                  <td className="px-5 font-semibold">{f.what}</td>
                  <td className="px-3 font-mono text-caption text-fg-2">{f.fn}</td>
                  <td className="tnum px-5 text-right whitespace-nowrap">{f.out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Specimen>
    </DsSection>
  )
}
