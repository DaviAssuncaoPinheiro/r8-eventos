import { ArrowUpRight, Clock, Wrench } from 'lucide-react'
import { Badge, Button, Card, CardHeader, Money, Skeleton, Stat, StatStrip, StatusDot, Tooltip, TooltipBody } from '@/ui'
import { DsSection, Specimen } from '../kit'

export function StatusSection() {
  return (
    <DsSection id="status" title="Badge e status" intro="Badge: pílula de 24px. Status em lista e tabela: ponto de 8px com rótulo.">
      <Specimen title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge>Rascunho</Badge>
          <Badge tone="accent">12 novos</Badge>
          <Badge tone="ok">Pago</Badge>
          <Badge tone="warn" icon={Clock}>
            Vence hoje
          </Badge>
          <Badge tone="danger">Atrasado 6 dias</Badge>
          <Badge tone="info">A caminho</Badge>
          <Badge tone="idle" icon={Wrench}>
            Em manutenção
          </Badge>
        </div>
      </Specimen>
      <Specimen title="Ponto de status">
        <ul className="grid max-w-xl grid-cols-1 gap-3 rounded-card bg-raised p-5 sm:grid-cols-2">
          <li>
            <StatusDot tone="ok">Concluído</StatusDot>
          </li>
          <li>
            <StatusDot tone="accent">Em andamento</StatusDot>
          </li>
          <li>
            <StatusDot tone="info">A caminho</StatusDot>
          </li>
          <li>
            <StatusDot tone="warn">Aguardando assinatura</StatusDot>
          </li>
          <li>
            <StatusDot tone="danger">Atrasado</StatusDot>
          </li>
          <li>
            <StatusDot tone="idle">Parado no pátio</StatusDot>
          </li>
        </ul>
      </Specimen>
    </DsSection>
  )
}

export function CardSection() {
  return (
    <DsSection
      id="cartoes"
      title="Cartão e indicador"
      intro="Raio 22, padding 20 (24 a partir de 640), sem borda e sem sombra. Um destaque em degradê por tela."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card variant="highlight">
          <CardHeader
            title="A receber este mês"
            action={
              <span className="grid size-8 place-items-center rounded-pill bg-white/15">
                <ArrowUpRight size={18} strokeWidth={2} aria-hidden />
              </span>
            }
          />
          <Stat
            onAccent
            size="lg"
            label="Total previsto"
            money
            value={48312.9}
            delta={0.124}
            formula="Soma das mensalidades ativas, diárias de evento e extras lançados até hoje, menos descontos."
          />
        </Card>
        <Card>
          <CardHeader title="Avarias não cobradas" action={<Button size="sm">Ver todas</Button>} />
          <Stat label="Valor em aberto" money value={3184.5} delta={0.08} deltaInverted formula="Soma das avarias registradas pela equipe de campo que ainda não entraram em uma cobrança." />
        </Card>
        <Card variant="sunken">
          <CardHeader title="Afundado" />
          <p className="text-body text-fg-2">Nenhuma cobrança pendente para a Construtora Planalto.</p>
        </Card>
      </div>
      <Specimen title="Indicador" note="Número 32px ou 44px, variação 12/600. O (i) abre a fórmula. Sem dados: texto, não zero.">
        <div className="grid grid-cols-1 gap-4 pt-12 md:grid-cols-3">
          <Card>
            <Stat label="Equipamento parado" value="37 unidades" delta={-0.06} deltaInverted formula="Unidades no pátio há mais de 7 dias sem locação." />
          </Card>
          <Card>
            <Stat label="Mensalidades atrasadas" money value={-12480} delta={0.21} deltaInverted />
          </Card>
          <Card>
            <Stat label="Extras faturados" value={null} />
          </Card>
        </div>
      </Specimen>
      <Specimen title="Faixa de indicadores" note="Um cartão com divisores de 1px. Abaixo de 1024px, duas colunas.">
        <StatStrip>
          <Stat label="Serviços hoje" value="46" delta={0.05} />
          <Stat label="Concluídos" value="31" />
          <Stat label="Extras lançados" money value={1920} delta={0.32} formula="Horas extras, limpezas avulsas e taxas de deslocamento lançadas pela equipe." />
          <Stat label="Avarias" value="4" delta={0.33} deltaInverted />
        </StatStrip>
      </Specimen>
    </DsSection>
  )
}

const ROWS = [
  { d: 'Mensalidade outubro', v: 12480 },
  { d: 'Limpeza extra, 12 unidades', v: 3184.5 },
  { d: 'Avaria BQ-0142', v: 420 },
  { d: 'Desconto contratual', v: -640 },
]

export function MoneySection() {
  const total = ROWS.reduce((s, r) => s + r.v, 0)
  return (
    <DsSection id="dinheiro" title="Dinheiro" intro="Formata, algarismos tabulares, sem quebra. Em tabela, à direita. Negativo em danger-ink.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Specimen title="Em coluna">
          <div className="rounded-card bg-raised py-2">
            {ROWS.map((r) => (
              <div key={r.d} className="flex h-12 items-center justify-between gap-4 border-b border-hairline px-5 last:border-b-0">
                <span className="min-w-0 truncate text-body">{r.d}</span>
                <Money variant="cell" value={r.v} />
              </div>
            ))}
            <div className="flex h-12 items-center justify-between gap-4 border-t border-strong px-5">
              <span className="text-body font-semibold">Total</span>
              <Money variant="cell" value={total} className="font-bold" />
            </div>
          </div>
        </Specimen>
        <Specimen title="Variantes">
          <div className="flex flex-col gap-3 rounded-card bg-raised p-5">
            <p className="text-body">
              Texto corrido: a cobrança de <Money value={3184.5} /> vence em 10/11/2026.
            </p>
            <div className="text-kpi">
              <Money variant="kpi" value={48312.9} />
            </div>
            <div className="text-kpi-lg">
              <Money variant="kpi" value={1284903.27} />
            </div>
            <p className="text-body">
              Variação: <Money value={860} sign className="font-semibold text-ok-ink" />
            </p>
          </div>
        </Specimen>
      </div>
    </DsSection>
  )
}

export function TooltipSection() {
  return (
    <DsSection id="tooltip" title="Tooltip" intro="Fundo inverso, 12/16, até 260px. Para explicar, nunca conteúdo essencial.">
      {/* no celular um exemplo por linha, para os dois tooltips abertos não se sobreporem */}
      <div className="flex flex-col items-start gap-16 pt-16 pb-4 sm:flex-row sm:flex-wrap sm:gap-10 sm:pl-24">
        <Tooltip content="Unidades no pátio há mais de 7 dias sem locação." open side="top">
          <Button size="sm">Tooltip simples</Button>
        </Tooltip>
        <Tooltip
          open
          side="right"
          content={
            <TooltipBody
              title="03/11/2026"
              rows={[
                { label: 'Limpeza', value: '12', color: 'var(--viz-1)' },
                { label: 'Retirada', value: '5', color: 'var(--viz-2)' },
              ]}
            />
          }
        >
          <Button size="sm" variant="ghost">
            Tooltip de gráfico
          </Button>
        </Tooltip>
      </div>
    </DsSection>
  )
}

export function SkeletonSection() {
  return (
    <DsSection id="carregando" title="Carregando" intro="Esqueleto do tamanho do conteúdo final. Spinner só dentro de botão.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="status" aria-busy="true" aria-label="Carregando exemplo">
        <Card>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-48" />
          <Skeleton className="mt-3 h-3 w-40" />
        </Card>
        <Card>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton shape="circle" className="size-8" />
              <div className="flex-1">
                <Skeleton className="w-3/5" />
                <Skeleton className="mt-2 h-3 w-2/5" />
              </div>
              <Skeleton className="w-20" />
            </div>
          ))}
        </Card>
      </div>
    </DsSection>
  )
}
