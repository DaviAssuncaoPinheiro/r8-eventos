import * as React from 'react'
import { NavLink } from 'react-router-dom'
import {
  ArrowUpRight,
  Boxes,
  CalendarCheck,
  ChartColumn,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Download,
  FileWarning,
  Landmark,
  PackageOpen,
  Plus,
  ReceiptText,
  Send,
  Settings,
  Sparkles,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Badge, Button, Money, Segmented, StatusDot, Tooltip, TooltipProvider, cn, type StatusTone } from '@/ui'
import { SideNav, SideNavGroup, SideNavItem } from '@/ui/SideNav'
import { TopBar } from '@/ui/TopBar'
import { OfficeFrame } from '@/ui/AppFrame'
import { DemoStrip } from '@/ui/DemoStrip'
import { MoneyCard } from '@/ui/MoneyCard'
import { PillBars } from '@/ui/PillBars'
import { ArcGauge } from '@/ui/ArcGauge'
import { MapaDF, type MapPin, type MapRoute } from '@/ui/MapaDF'
import { AppToaster, notify } from '@/ui/Toast'
import { formatMoney } from '@/lib/format'

/*
  PRÉVIA DE DIREÇÃO VISUAL. Dados fixos só para avaliar o desenho:
  na fundação estes números passam a vir da camada de serviços e a somar com as listas.
*/

const NAV: { to: string; icon: LucideIcon; label: string; count?: number }[] = [
  { to: '/previa/painel', icon: Wallet, label: 'Painel de dinheiro' },
  { to: '/previa/operacao', icon: CalendarCheck, label: 'Operação do dia', count: 14 },
]
const GESTAO: typeof NAV = [
  { to: '/previa/locacoes', icon: ClipboardList, label: 'Locações' },
  { to: '/previa/equipamentos', icon: Boxes, label: 'Equipamentos' },
  { to: '/previa/avarias', icon: TriangleAlert, label: 'Avarias e cobranças', count: 7 },
  { to: '/previa/financeiro', icon: Landmark, label: 'Financeiro' },
  { to: '/previa/clientes', icon: Users, label: 'Clientes' },
  { to: '/previa/relatorios', icon: ChartColumn, label: 'Relatórios' },
]

const RECEITA = {
  '6m': [
    { label: 'Jun', fullLabel: 'Junho', value: 36120.4 },
    { label: 'Jul', fullLabel: 'Julho', value: 39874.15 },
    { label: 'Ago', fullLabel: 'Agosto', value: 35410.9 },
    { label: 'Set', fullLabel: 'Setembro', value: 41236.7 },
    { label: 'Out', fullLabel: 'Outubro', value: 42983.25, tone: 'solid' as const },
    { label: 'Nov', fullLabel: 'Novembro, até hoje', value: 48312.9, tone: 'strong' as const },
  ],
  '12m': [
    { label: 'Dez', fullLabel: 'Dezembro', value: 44210.3 },
    { label: 'Jan', fullLabel: 'Janeiro', value: 27640.85 },
    { label: 'Fev', fullLabel: 'Fevereiro', value: 31985.1 },
    { label: 'Mar', fullLabel: 'Março', value: 30120.6 },
    { label: 'Abr', fullLabel: 'Abril', value: 33874.45 },
    { label: 'Mai', fullLabel: 'Maio', value: 34902.2 },
    { label: 'Jun', fullLabel: 'Junho', value: 36120.4 },
    { label: 'Jul', fullLabel: 'Julho', value: 39874.15 },
    { label: 'Ago', fullLabel: 'Agosto', value: 35410.9 },
    { label: 'Set', fullLabel: 'Setembro', value: 41236.7 },
    { label: 'Out', fullLabel: 'Outubro', value: 42983.25, tone: 'solid' as const },
    { label: 'Nov', fullLabel: 'Novembro, até hoje', value: 48312.9, tone: 'strong' as const },
  ],
}

const ACOES: { icon: LucideIcon; tone: 'danger' | 'warn' | 'info' | 'idle'; title: string; value: number }[] = [
  { icon: FileWarning, tone: 'danger', title: 'Cobrar 3 avarias', value: 1260 },
  { icon: ReceiptText, tone: 'warn', title: 'Faturar 5 limpezas extras', value: 1920 },
  { icon: Send, tone: 'info', title: 'Lembrar 6 mensalidades vencidas', value: 7420 },
  { icon: PackageOpen, tone: 'idle', title: 'Realocar 18 banheiros parados', value: 4140 },
]
const ACAO_TOM: Record<string, string> = {
  danger: 'bg-danger-soft text-danger-ink',
  warn: 'bg-warn-soft text-warn-ink',
  info: 'bg-info-soft text-info-ink',
  idle: 'bg-sunken text-fg-2',
}

/* a receber por idade: uma pílula só, largura proporcional ao valor */
const IDADE = [
  { label: 'Em dia', value: 30992.9, cls: 'bg-accent' },
  { label: 'Até 15 dias', value: 4380, cls: 'bg-warn' },
  { label: 'Mais de 15 dias', value: 3040, cls: 'bg-danger' },
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

export default function PainelPrevia() {
  // abaixo de 1360 px a lateral começa recolhida, para os quatro números caberem em uma linha
  const [collapsed, setCollapsed] = React.useState(() => window.matchMedia('(max-width: 1359px)').matches)
  const [navOpen, setNavOpen] = React.useState(false)
  const [periodo, setPeriodo] = React.useState<'6m' | '12m'>('6m')
  const soon = (what: string) => () => notify.info(`${what} entra na próxima etapa da construção`, { toasterId: 'previa' })

  const item = (n: (typeof NAV)[number]) => (
    <SideNavItem
      key={n.to}
      icon={n.icon}
      label={n.label}
      count={n.count}
      active={n.to === '/previa/painel'}
      render={(p) => <NavLink to="/previa/painel" {...p} />}
    />
  )

  return (
    <TooltipProvider>
      <div className="ds-root min-h-dvh">
        <DemoStrip fixed onReset={() => notify.success('Dados de demonstração restaurados', { toasterId: 'previa' })} />
        <div style={{ paddingTop: 'var(--demo-strip-h, 0px)' }}>
          <OfficeFrame
            viewport
            navOpen={navOpen}
            onNavOpenChange={setNavOpen}
            sidebar={
              <SideNav
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
                brand={{ name: 'R8 Eventos', initials: 'R8' }}
                user={{ name: 'Paula Ramos', role: 'Operação' }}
                footer={
                  <>
                    <SideNavItem icon={Settings} label="Configurações" onClick={soon('Configurações')} />
                    <SideNavItem icon={CircleHelp} label="Ajuda e tour" onClick={soon('O tour guiado')} />
                  </>
                }
              >
                <SideNavGroup label="Hoje">{NAV.map(item)}</SideNavGroup>
                <SideNavGroup label="Gestão">{GESTAO.map(item)}</SideNavGroup>
              </SideNav>
            }
            topbar={
              <TopBar
                title="Quarta-feira, 11 de novembro"
                unreadCount={3}
                user={{ name: 'Paula Ramos', role: 'Operação' }}
                onMenuClick={() => setNavOpen(true)}
                onSearchClick={soon('A busca')}
                onBellClick={soon('A central de avisos')}
              />
            }
          >
            {/* cabeçalho da tela */}
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <h1 className="text-title-page">Painel de dinheiro</h1>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary" size="lg" icon={Plus} onClick={soon('O cadastro de locação')}>
                  Nova locação
                </Button>
                <Button variant="secondary" size="lg" icon={Download} onClick={soon('A exportação')}>
                  Exportar
                </Button>
              </div>
            </div>

            {/* 1. os quatro números */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
              <MoneyCard
                hero
                title="Alugado hoje"
                value={4218.6}
                tag={{ label: '+8,2%', dir: 'up' }}
                formula="Soma da diária de cada equipamento que está em campo hoje."
                onOpen={soon('A lista de equipamentos em campo')}
              />
              <MoneyCard
                title="Parado no depósito"
                value={9640}
                formula="44 unidades sem locação × valor mensal de tabela de cada uma. É o que deixa de render por mês."
                onOpen={soon('A lista de unidades paradas')}
              />
              <MoneyCard
                title="Avarias não cobradas"
                value={3184.5}
                formula="7 avarias registradas em campo que ainda não viraram cobrança."
                onOpen={soon('A lista de avarias')}
              />
              <MoneyCard
                title="Extras não faturados"
                value={1920}
                formula="5 limpezas e entregas fora do contrato, feitas e ainda fora de fatura."
                onOpen={soon('A lista de extras')}
              />
            </div>

            {/* 2. receita, cobrança e o que fazer hoje */}
            <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
              <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-title-sub">Receita</h2>
                  <Segmented<'6m' | '12m'>
                    label="Período"
                    size="sm"
                    value={periodo}
                    onChange={setPeriodo}
                    options={[
                      { value: '6m', label: '6 meses' },
                      { value: '12m', label: '12 meses' },
                    ]}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <p className="text-kpi">
                    <Money value={48312.9} variant="kpi" />
                  </p>
                  <span className="mb-1 inline-flex h-6 items-center rounded-pill bg-ok-soft px-2 text-caption font-semibold text-ok-ink">+12,4%</span>
                </div>
                <PillBars key={periodo} className="mt-1" height={150} data={RECEITA[periodo]} format={(v) => formatMoney(v)} label="Receita por mês" />
              </section>

              <section className="flex min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-3">
                <h2 className="text-title-sub">A receber</h2>
                <p className="mt-2 text-kpi">
                  <Money value={38412.9} variant="kpi" />
                </p>

                <div className="mt-5 flex h-3.5 gap-1" role="img" aria-label="A receber por idade: R$ 30.992,90 em dia, R$ 4.380,00 atrasados até 15 dias, R$ 3.040,00 atrasados há mais de 15 dias">
                  {IDADE.map((f) => (
                    <Tooltip key={f.label} content={`${f.label}: ${formatMoney(f.value)}`}>
                      <span tabIndex={0} className={cn('min-w-3 rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', f.cls)} style={{ flexGrow: f.value }} />
                    </Tooltip>
                  ))}
                </div>

                <div className="mt-5 flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-body font-medium text-fg-2">
                    <span aria-hidden className="size-2.5 rounded-pill bg-danger" />
                    Atrasados
                  </span>
                  <span className="text-title-sub text-danger-ink">{formatMoney(7420)}</span>
                </div>

                <div className="mt-auto pt-6">
                  <Button variant="primary" size="lg" block icon={Send} onClick={soon('A régua de cobrança')}>
                    Cobrar atrasados
                  </Button>
                </div>
              </section>

              <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-5">
                <h2 className="text-title-sub">Para fazer hoje</h2>
                <ul className="mt-3 flex flex-col gap-1">
                  {ACOES.map((a) => (
                    <li key={a.title}>
                      <button
                        type="button"
                        onClick={soon(a.title)}
                        className="group -mx-2 flex w-[calc(100%+16px)] items-center gap-3.5 rounded-control px-2 py-2.5 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <span aria-hidden className={cn('grid size-11 shrink-0 place-items-center rounded-pill', ACAO_TOM[a.tone])}>
                          <a.icon size={20} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1 text-body-lg font-medium text-fg">{a.title}</span>
                        <span className="shrink-0 text-body-lg font-semibold text-fg">{formatMoney(a.value)}</span>
                        <span
                          aria-hidden
                          className="grid size-9 shrink-0 place-items-center rounded-pill text-fg ring-1 ring-edge transition-colors duration-150 ring-inset group-hover:bg-fg group-hover:text-raised group-hover:ring-fg"
                        >
                          <ArrowUpRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover:rotate-45" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* 3. operação, estoque e Copiloto */}
            <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
              <section className="flex min-w-0 flex-col rounded-card bg-raised p-2 @min-[1180px]/frame:col-span-5">
                <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3 sm:px-4 sm:pt-4">
                  <h2 className="text-title-sub">Na rua agora</h2>
                  <Button variant="secondary" size="sm" icon={Truck} onClick={soon('A operação do dia')}>
                    Operação
                  </Button>
                </div>
                <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-[16px]">
                  <MapaDF pins={PINOS} routes={ROTAS} labels={false} box={[130, 40, 800, 560]} label="Mapa do Distrito Federal com as 6 equipes" className="absolute inset-0" />
                </div>
              </section>

              <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4">
                <h2 className="text-title-sub">Ocupação do estoque</h2>
                <ArcGauge
                  className="mt-5"
                  center="76%"
                  caption=""
                  label="Ocupação do estoque: 76%. 128 em campo, 14 em limpeza, 44 parados."
                  segments={[
                    { label: 'Em campo', value: 128, tone: 'solid' },
                    { label: 'Em limpeza', value: 14, tone: 'strong' },
                    { label: 'Parados', value: 44, tone: 'idle' },
                  ]}
                />
                <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-caption text-fg-2">
                  <li className="flex items-center gap-2">
                    <span aria-hidden className="size-3 rounded-pill bg-accent" />
                    Em campo <span className="font-semibold text-fg">128</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden className="size-3 rounded-pill bg-accent-active" />
                    Limpeza <span className="font-semibold text-fg">14</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden className="ds-hatch size-3 rounded-pill bg-sunken ring-1 ring-idle ring-inset" />
                    Parados <span className="font-semibold text-fg">44</span>
                  </li>
                </ul>
              </section>

              <section aria-label="Copiloto" className="ds-copilot relative flex min-w-0 flex-col overflow-hidden rounded-card p-5 sm:p-6 @min-[1180px]/frame:col-span-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-title-sub">
                    <Sparkles size={18} strokeWidth={2} aria-hidden />
                    Copiloto
                  </h2>
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
                    onClick={soon('O resumo do Copiloto')}
                    className="inline-flex h-11 items-center justify-center rounded-pill bg-white px-5 text-body font-semibold text-[#14110f] transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Ver propostas
                  </button>
                </div>
              </section>
            </div>
          </OfficeFrame>
        </div>
        <AppToaster id="previa" />
      </div>
    </TooltipProvider>
  )
}
