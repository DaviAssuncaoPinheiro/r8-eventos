import * as React from 'react'
import { NavLink } from 'react-router-dom'
import {
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

const ACOES: { icon: LucideIcon; tone: StatusTone; title: string; sub: string; cta: string }[] = [
  { icon: FileWarning, tone: 'danger', title: '3 avarias de 08/11 sem cobrança', sub: 'Construtora Planalto · R$ 1.260,00', cta: 'Cobrar agora' },
  { icon: ReceiptText, tone: 'warn', title: '5 limpezas extras não faturadas', sub: 'Festival Raízes do Planalto · R$ 1.920,00', cta: 'Faturar' },
  { icon: Send, tone: 'info', title: '6 mensalidades vencidas há mais de 5 dias', sub: 'R$ 7.420,00 em 4 clientes', cta: 'Enviar lembrete' },
  { icon: PackageOpen, tone: 'idle', title: '18 banheiros parados há mais de 30 dias', sub: 'Deixam de render R$ 4.140,00 por mês', cta: 'Ver unidades' },
]
const ACAO_TOM: Record<string, string> = {
  danger: 'bg-danger-soft text-danger-ink',
  warn: 'bg-warn-soft text-warn-ink',
  info: 'bg-info-soft text-info-ink',
  idle: 'bg-sunken text-fg-2',
}

const EQUIPES: { nome: string; sigla: string; cor: string; fazendo: string; onde: string; status: string; tone: StatusTone; feitos: string }[] = [
  { nome: 'Equipe Fábio', sigla: 'FC', cor: 'bg-info-soft text-info-ink', fazendo: 'Limpeza, 12 unidades', onde: 'Construtora Planalto, Noroeste', status: 'Em andamento', tone: 'accent', feitos: '3 de 6' },
  { nome: 'Equipe Marcos', sigla: 'MA', cor: 'bg-ok-soft text-ok-ink', fazendo: 'Entrega, 24 unidades', onde: 'Festival Raízes do Planalto, Estádio Nacional', status: 'A caminho', tone: 'info', feitos: '2 de 5' },
  { nome: 'Equipe Wesley', sigla: 'WS', cor: 'bg-warn-soft text-warn-ink', fazendo: 'Retirada, 8 unidades', onde: 'Residencial Vila Verde, Sobradinho', status: 'Atrasada 25 min', tone: 'danger', feitos: '1 de 4' },
  { nome: 'Equipe Rafael', sigla: 'RB', cor: 'bg-accent-soft text-accent-ink', fazendo: 'Montagem, tenda 10 x 10 m', onde: 'Igreja Batista Central, Asa Sul', status: 'Concluído', tone: 'ok', feitos: '4 de 4' },
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
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <div className="min-w-0">
                <h1 className="text-title-page">Painel de dinheiro</h1>
                <p className="mt-1 text-body-lg text-fg-2">Quanto está rendendo, quanto está parado e o que ainda não foi cobrado.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary" size="lg" icon={Plus} onClick={soon('O cadastro de locação')}>
                  Nova locação
                </Button>
                <Button variant="secondary" size="lg" icon={Download} onClick={soon('A exportação')}>
                  Exportar
                </Button>
              </div>
            </div>

            {/* 1. os quatro números que vendem o produto */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-4">
              <MoneyCard
                hero
                title="Alugado hoje"
                value={4218.6}
                delta={{ label: '+8,2%', dir: 'up', good: true }}
                note="142 em campo"
                formula="Soma da diária de cada equipamento que está em campo hoje."
                onOpen={soon('A lista de equipamentos em campo')}
              />
              <MoneyCard
                title="Parado no depósito"
                value={9640}
                delta={{ label: '44 unidades', good: false }}
                note="por mês"
                formula="Unidades disponíveis sem locação × valor mensal de tabela de cada uma."
                onOpen={soon('A lista de unidades paradas')}
              />
              <MoneyCard
                title="Avarias não cobradas"
                value={3184.5}
                delta={{ label: '7 avarias', good: false }}
                note="desde 28/10"
                formula="Avarias registradas em campo que ainda não viraram cobrança."
                onOpen={soon('A lista de avarias')}
              />
              <MoneyCard
                title="Extras não faturados"
                value={1920}
                delta={{ label: '5 serviços', good: false }}
                note="em 3 locações"
                formula="Limpezas e entregas fora do contrato que foram feitas e não entraram em fatura."
                onOpen={soon('A lista de extras')}
              />
            </div>

            {/* 2. receita, cobrança e o que fazer hoje */}
            <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
              <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-title-sub">Receita</h2>
                    <p className="mt-1 text-kpi">
                      <Money value={48312.9} variant="kpi" />
                    </p>
                    <p className="mt-1 text-caption text-fg-2">
                      <span className="font-semibold text-ok-ink">+12,4%</span> sobre outubro, com o mês ainda aberto
                    </p>
                  </div>
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
                <PillBars key={periodo} className="mt-1" height={148} data={RECEITA[periodo]} format={(v) => formatMoney(v)} label="Receita por mês" />
              </section>

              <section className="flex min-w-0 flex-col rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-3">
                <h2 className="text-title-sub">A receber</h2>
                <p className="mt-4 text-kpi text-accent-ink">
                  <Money value={38412.9} variant="kpi" />
                </p>
                <p className="mt-1 text-caption text-fg-2">em 31 cobranças abertas</p>

                <div className="mt-5 rounded-control bg-danger-soft px-4 py-3">
                  <p className="text-caption font-semibold text-danger-ink">Atrasados</p>
                  <p className="mt-0.5 text-title-sub text-danger-ink">{formatMoney(7420)}</p>
                  <p className="text-caption text-fg-2">6 cobranças, 4 clientes</p>
                </div>

                <div className="mt-auto pt-5">
                  <Button variant="primary" size="lg" block icon={Send} onClick={soon('A régua de cobrança')}>
                    Cobrar atrasados
                  </Button>
                </div>
              </section>

              <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-title-sub">Para fazer hoje</h2>
                  <Badge tone="accent">4 ações</Badge>
                </div>
                <ul className="mt-3 flex flex-col">
                  {ACOES.map((a) => (
                    <li key={a.title}>
                      <button
                        type="button"
                        onClick={soon(a.cta)}
                        className="group -mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-control px-2 py-2.5 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-pill', ACAO_TOM[a.tone])}>
                          <a.icon size={18} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-body font-semibold text-fg">{a.title}</span>
                          <span className="block truncate text-caption text-fg-3">{a.sub}</span>
                        </span>
                        <span className="hidden h-9 shrink-0 items-center gap-1 rounded-pill pr-2.5 pl-3.5 text-caption font-semibold text-fg ring-1 ring-edge ring-inset transition-colors duration-150 group-hover:bg-fg group-hover:text-raised group-hover:ring-fg sm:inline-flex">
                          {a.cta}
                          <ChevronRight size={14} strokeWidth={2} aria-hidden />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* 3. operação, estoque e Copiloto */}
            <div className="mt-4 grid grid-cols-1 gap-4 @min-[1180px]/frame:grid-cols-12">
              <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-title-sub">Equipes na rua</h2>
                  <Button variant="secondary" size="sm" icon={Truck} onClick={soon('A operação do dia')}>
                    Ver operação
                  </Button>
                </div>
                <ul className="mt-4 flex flex-col gap-4">
                  {EQUIPES.map((e) => (
                    <li key={e.nome} className="flex items-center gap-3">
                      <span aria-hidden className={cn('grid size-11 shrink-0 place-items-center rounded-pill text-body font-semibold', e.cor)}>
                        {e.sigla}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="truncate text-body font-semibold text-fg">{e.nome}</span>
                          <span className="tnum shrink-0 text-caption text-fg-3">{e.feitos}</span>
                        </span>
                        <span className="block truncate text-caption text-fg-2">
                          {e.fazendo} <span className="text-fg-3">· {e.onde}</span>
                        </span>
                      </span>
                      <StatusDot tone={e.tone} className="shrink-0 text-caption font-medium">
                        {e.status}
                      </StatusDot>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="min-w-0 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:col-span-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-title-sub">Ocupação do estoque</h2>
                  <Tooltip content="Equipamentos em campo ou em limpeza, divididos pelo total do estoque.">
                    <button type="button" aria-label="Como é calculado: ocupação do estoque" className="ds-hit relative grid size-6 place-items-center rounded-pill text-fg-3 hover:text-fg">
                      <CircleHelp size={16} strokeWidth={2} aria-hidden />
                    </button>
                  </Tooltip>
                </div>
                <ArcGauge
                  className="mt-5"
                  center="76%"
                  caption="do estoque rendendo"
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
                    Em campo <span className="tnum font-semibold text-fg">128</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden className="size-3 rounded-pill bg-accent-active" />
                    Em limpeza <span className="tnum font-semibold text-fg">14</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden className="ds-hatch size-3 rounded-pill bg-sunken ring-1 ring-idle ring-inset" />
                    Parados <span className="tnum font-semibold text-fg">44</span>
                  </li>
                </ul>
              </section>

              <section
                aria-label="Copiloto"
                className="ds-copilot relative flex min-w-0 flex-col overflow-hidden rounded-card p-5 sm:p-6 @min-[1180px]/frame:col-span-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-title-sub">
                    <Sparkles size={18} strokeWidth={2} aria-hidden />
                    Copiloto
                  </h2>
                  <span className="rounded-pill bg-white/15 px-2.5 py-1 text-caption font-semibold">Pacote IA</span>
                </div>
                <p className="mt-4 text-body-lg leading-6">
                  Hoje são <strong className="font-semibold">14 serviços</strong>, <strong className="font-semibold">2 em risco de atraso</strong>, e dá para cobrar{' '}
                  <strong className="tnum font-semibold whitespace-nowrap">R$ 3.184,50</strong> em avarias.
                </p>
                <p className="mt-2 text-caption text-white/70">Com base na agenda e nos registros de campo até 10:40.</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <button
                    type="button"
                    onClick={soon('O resumo do Copiloto')}
                    className="inline-flex h-11 items-center justify-center rounded-pill bg-white px-5 text-body font-semibold text-[#10241a] transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
