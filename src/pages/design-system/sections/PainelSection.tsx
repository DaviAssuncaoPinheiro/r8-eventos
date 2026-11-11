import * as React from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import { ArcGauge, Button, MapaDF, MoneyCard, PillBars } from '@/ui'
import type { MapPin, MapRoute } from '@/ui'
import { formatMoney } from '@/lib/format'
import { DsSection, Specimen } from '../kit'

const MESES = [
  { label: 'Jun', fullLabel: 'Junho', value: 36120.4 },
  { label: 'Jul', fullLabel: 'Julho', value: 39874.15 },
  { label: 'Ago', fullLabel: 'Agosto', value: 35410.9 },
  { label: 'Set', fullLabel: 'Setembro', value: 41236.7 },
  { label: 'Out', fullLabel: 'Outubro', value: 42983.25, tone: 'solid' as const },
  { label: 'Nov', fullLabel: 'Novembro, até hoje', value: 48312.9, tone: 'strong' as const },
]

const SEMANAS = [
  { label: 'S1', fullLabel: 'Semana 1', value: 9820, tone: 'solid' as const },
  { label: 'S2', fullLabel: 'Semana 2', value: 11240, tone: 'solid' as const },
  { label: 'S3', fullLabel: 'Semana 3', value: 0, tone: 'idle' as const },
  { label: 'S4', fullLabel: 'Semana 4', value: 12760, tone: 'strong' as const },
]

const PINOS: MapPin[] = [
  { id: 'fc', x: 522, y: 218, label: 'FC', title: 'Equipe Fábio: limpeza em andamento no Noroeste', tone: 'accent', pulse: true },
  { id: 'ma', x: 560, y: 304, label: 'MA', title: 'Equipe Marcos: a caminho do Eixo Monumental', tone: 'info', pulse: true },
  { id: 'ws', x: 704, y: 118, label: 'WS', title: 'Equipe Wesley: atrasada em Sobradinho', tone: 'danger' },
  { id: 'rb', x: 580, y: 432, label: 'RB', title: 'Equipe Rafael: concluiu na Asa Sul', tone: 'ok' },
  { id: 'jp', x: 268, y: 338, label: 'JP', title: 'Equipe João Pedro: entrega em andamento em Taguatinga', tone: 'accent', pulse: true },
  { id: 'ld', x: 742, y: 512, label: 'LD', title: 'Equipe Leandro: a caminho do Lago Sul', tone: 'info' },
]
const ROTAS: MapRoute[] = [
  { id: 'fc', points: [{ x: 452, y: 410 }, { x: 474, y: 330 }, { x: 496, y: 262 }, { x: 522, y: 218 }] },
  { id: 'ma', points: [{ x: 452, y: 410 }, { x: 470, y: 340 }, { x: 510, y: 318 }, { x: 560, y: 304 }], dashed: true },
  { id: 'jp', points: [{ x: 452, y: 410 }, { x: 400, y: 356 }, { x: 330, y: 344 }, { x: 268, y: 338 }] },
]

function Legend({ items }: { items: { label: string; value: number; cls: string }[] }) {
  return (
    <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-caption text-fg-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span aria-hidden className={`size-3 rounded-pill ${i.cls}`} />
          {i.label} <span className="tnum font-semibold text-fg">{i.value}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PainelSection() {
  const [run, setRun] = React.useState(0)
  const [sel, setSel] = React.useState<string | undefined>('fc')
  const open = () => undefined

  return (
    <DsSection id="painel" title="Painel" intro="Indicador em dinheiro, barras em pílula, medidor e mapa. Modelo na tela Painel de dinheiro.">
      <Specimen title="Indicador em dinheiro" note="Um destaque por tela. Seta abre a lista, (i) mostra a fórmula.">
        <div className="mb-3">
          <Button size="sm" icon={RotateCcw} onClick={() => setRun((n) => n + 1)}>
            Repetir entrada
          </Button>
        </div>
        <div key={run} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyCard hero title="Alugado hoje" value={4218.6} tag={{ label: '+8,2%', dir: 'up' }} formula="Soma da diária de cada equipamento que está em campo hoje." onOpen={open} className="min-h-[200px]" />
          <MoneyCard title="Parado no depósito" value={9640} formula="44 unidades sem locação × valor mensal de tabela de cada uma." onOpen={open} className="min-h-[200px]" />
          <MoneyCard title="Avarias não cobradas" value={3184.5} tag={{ label: '+12%', dir: 'up', good: false }} formula="7 avarias registradas em campo que ainda não viraram cobrança." onOpen={open} className="min-h-[200px]" />
          <MoneyCard title="Extras faturados" value={1920} tag={{ label: '-4,1%', dir: 'down', good: true }} formula="Limpezas e entregas fora do contrato, já em fatura." onOpen={open} className="min-h-[200px]" />
        </div>
      </Specimen>

      <Specimen title="Tamanhos do número" note="md 32, lg 44 (padrão), xl 56. Sem seta quando não há lista.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MoneyCard size="md" title="Receita do mês" value={48312.9} className="min-h-[160px]" />
          <MoneyCard size="lg" title="Receita do mês" value={48312.9} className="min-h-[160px]" />
          <MoneyCard size="xl" hero title="Receita do mês" value={48312.9} onOpen={open} className="min-h-[160px]" />
        </div>
      </Specimen>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Specimen title="Barras em pílula" note="Toque ou passe o mouse para ver o valor.">
          <div className="rounded-card bg-raised p-5 sm:p-6">
            <PillBars key={run} height={150} data={MESES} format={(v) => formatMoney(v)} label="Receita por mês" />
          </div>
        </Specimen>
        <Specimen title="Com semana parada" note="Hachura só para o que não teve movimento.">
          <div className="rounded-card bg-raised p-5 sm:p-6">
            <PillBars key={run} height={150} data={SEMANAS} format={(v) => formatMoney(v)} label="Receita por semana" defaultActive={3} />
          </div>
        </Specimen>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Specimen title="Medidor" note="Uma proporção só. Legenda por conta de quem usa.">
          <div className="rounded-card bg-raised p-5 sm:p-6">
            <ArcGauge
              key={run}
              center="76%"
              caption=""
              label="Ocupação do estoque: 76%. 128 em campo, 14 em limpeza, 44 parados."
              segments={[
                { label: 'Em campo', value: 128, tone: 'solid' },
                { label: 'Em limpeza', value: 14, tone: 'strong' },
                { label: 'Parados', value: 44, tone: 'idle' },
              ]}
            />
            <Legend
              items={[
                { label: 'Em campo', value: 128, cls: 'bg-accent' },
                { label: 'Limpeza', value: 14, cls: 'bg-accent-active' },
                { label: 'Parados', value: 44, cls: 'ds-hatch bg-sunken ring-1 ring-idle ring-inset' },
              ]}
            />
          </div>
        </Specimen>
        <Specimen title="Copiloto, bloco escuro" note="O único bloco escuro da tela. Igual nos dois temas.">
          <section aria-label="Copiloto" className="ds-copilot relative flex min-h-[286px] min-w-0 flex-col overflow-hidden rounded-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-title-sub">
                <Sparkles size={18} strokeWidth={2} aria-hidden />
                Copiloto
              </h4>
              <span className="rounded-pill bg-white/15 px-2.5 py-1 text-caption font-semibold">Pacote IA</span>
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <span className="block text-kpi">14</span>
                <span className="text-body text-white/75">serviços hoje, 2 em risco</span>
              </li>
              <li>
                <span className="block text-kpi">{formatMoney(3184.5)}</span>
                <span className="text-body text-white/75">prontos para cobrar</span>
              </li>
            </ul>
            <div className="mt-auto pt-5">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-pill bg-white px-5 text-body font-semibold text-[#14110f] transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Ver propostas
              </button>
            </div>
          </section>
        </Specimen>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Specimen title="Mapa de reserva" note="Sem WebGL ou sem servidor de mapa. Só rotas e pinos têm cor.">
          <div className="h-[380px] overflow-hidden rounded-card bg-raised p-2">
            <div className="size-full overflow-hidden rounded-[16px]">
              <MapaDF key={run} pins={PINOS} routes={ROTAS} selectedId={sel} onSelect={(id) => setSel((cur) => (cur === id ? undefined : id))} label="Mapa do Distrito Federal com as 6 equipes" />
            </div>
          </div>
        </Specimen>
        <Specimen title="Recorte do mapa de reserva" note="Rota cheia é feita, tracejada é prevista.">
          <div className="h-[380px] overflow-hidden rounded-card bg-raised p-2">
            <div className="size-full overflow-hidden rounded-[16px]">
              <MapaDF key={run} pins={PINOS.filter((p) => ['fc', 'ma', 'jp'].includes(p.id))} routes={ROTAS} box={[180, 120, 560, 380]} label="Recorte do mapa com 3 equipes" />
            </div>
          </div>
        </Specimen>
      </div>
    </DsSection>
  )
}
