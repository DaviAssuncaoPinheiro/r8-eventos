import * as React from 'react'
import {
  Boxes,
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  Camera,
  Hammer,
  House,
  Landmark,
  PanelRight,
  PenLine,
  Play,
  Settings,
  Truck,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
  Plus,
  ChartColumn,
  Sparkles,
} from 'lucide-react'
import { Button, Segmented, StatusDot, Tooltip, useMediaQuery, type StatusTone } from '@/ui'
import { SideNav, SideNavGroup, SideNavItem, SideNavScope } from '@/ui/SideNav'
import { TopBar } from '@/ui/TopBar'
import { BottomNav, BottomNavItem } from '@/ui/BottomNav'
import { FieldActionBar, FieldActionGrid, FieldActionTile } from '@/ui/FieldAction'
import { DemoStrip } from '@/ui/DemoStrip'
import { FieldFrame, OfficeFrame, SyncIndicator } from '@/ui/AppFrame'
import { DsSection, Specimen, StateCell } from '../kit'

/* ───────── dados de exemplo ───────── */

const BRAND = { name: 'R8 Eventos', initials: 'R8' }
const USER = { name: 'Paula Ramos', role: 'Operação' }

type NavId = 'dinheiro' | 'operacao' | 'locacoes' | 'equipamentos' | 'avarias' | 'financeiro' | 'clientes' | 'relatorios'

const NAV_MAIN: { id: NavId; label: string; icon: typeof Wallet; count?: number }[] = [
  { id: 'dinheiro', label: 'Painel de dinheiro', icon: Wallet },
  { id: 'operacao', label: 'Operação do dia', icon: CalendarCheck, count: 14 },
]
const NAV_MANAGE: { id: NavId; label: string; icon: typeof Wallet; count?: number }[] = [
  { id: 'locacoes', label: 'Locações', icon: ClipboardList },
  { id: 'equipamentos', label: 'Equipamentos', icon: Boxes },
  { id: 'avarias', label: 'Avarias e cobranças', icon: TriangleAlert, count: 3 },
  { id: 'financeiro', label: 'Financeiro', icon: Landmark },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'relatorios', label: 'Relatórios', icon: ChartColumn },
]

const SERVICES: { time: string; title: string; meta: string; tone: StatusTone; status: string }[] = [
  { time: '08:00', title: 'Limpeza, 12 unidades', meta: 'Construtora Planalto, Setor Industrial', tone: 'ok', status: 'Concluído' },
  { time: '09:30', title: 'Entrega, 24 unidades', meta: 'Feira Agro Centro-Oeste, Parque de Exposições', tone: 'accent', status: 'Em andamento' },
  { time: '11:00', title: 'Retirada, 8 unidades', meta: 'Condomínio Vila Verde, Quadra 4', tone: 'info', status: 'A caminho' },
  { time: '13:30', title: 'Limpeza, 6 unidades', meta: 'Obra Residencial Aurora, Lote 12', tone: 'warn', status: 'Aguardando assinatura' },
  { time: '15:00', title: 'Manutenção, BQ-0142', meta: 'Pátio R8, Galpão 2', tone: 'danger', status: 'Atrasado' },
]

/* ───────── peças locais da demonstração ───────── */

/** Lateral do escritório completa, com os itens da spec. Cada instância guarda o próprio estado. */
function OfficeSideNav({
  collapsed,
  onCollapsedChange,
  active,
  onActive,
}: {
  collapsed: boolean
  onCollapsedChange: (c: boolean) => void
  active: NavId
  onActive: (id: NavId) => void
}) {
  const item = (n: (typeof NAV_MAIN)[number]) => (
    <SideNavItem key={n.id} icon={n.icon} label={n.label} count={n.count} active={active === n.id} onClick={() => onActive(n.id)} />
  )
  return (
    <SideNav
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      brand={BRAND}
      user={USER}
      onUserClick={() => undefined}
      footer={
        <>
          <SideNavItem icon={Settings} label="Configurações" />
          <SideNavItem icon={CircleHelp} label="Ajuda" />
        </>
      }
    >
      <SideNavGroup label="Hoje">{NAV_MAIN.map(item)}</SideNavGroup>
      <SideNavGroup label="Gestão">{NAV_MANAGE.map(item)}</SideNavGroup>
    </SideNav>
  )
}

function ServiceRows() {
  return (
    <ul className="rounded-card bg-raised">
      {SERVICES.map((s) => (
        <li key={s.time} className="flex items-center gap-4 border-b border-hairline px-4 py-3 last:border-b-0">
          <span className="tnum w-12 shrink-0 text-body font-semibold">{s.time}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold">{s.title}</span>
            <span className="block truncate text-caption text-fg-3">{s.meta}</span>
          </span>
          <StatusDot tone={s.tone}>{s.status}</StatusDot>
        </li>
      ))}
    </ul>
  )
}

/** Escala o quadro de largura de projeto para caber na página; abaixo de 70% passa a rolar dentro do próprio contêiner. */
function ScaledFrame({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [avail, setAvail] = React.useState(width)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setAvail(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const zoom = Math.min(1, Math.max(0.7, avail / width))
  return (
    <div ref={ref} className="overflow-x-auto overflow-y-hidden rounded-panel" style={{ height }}>
      <div style={{ width, height: height / zoom, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  )
}

function OfficeMiniature() {
  const [mode, setMode] = React.useState<'1280' | '1024'>('1280')
  const [collapsed, setCollapsed] = React.useState(false)
  const [active, setActive] = React.useState<NavId>('operacao')
  const [railOpen, setRailOpen] = React.useState(false)
  const [navOpen, setNavOpen] = React.useState(false)
  const width = Number(mode)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<'1280' | '1024'>
          label="Largura do quadro"
          value={mode}
          onChange={(m) => {
            setMode(m)
            setCollapsed(m === '1024')
            setRailOpen(false)
          }}
          options={[
            { value: '1280', label: '1280 px' },
            { value: '1024', label: '1024 px' },
          ]}
        />
        <p className="max-w-[60ch] text-caption text-fg-3">
          {mode === '1280' ? 'Lateral aberta, trilho fixo.' : 'Lateral recolhida, trilho em gaveta.'}
        </p>
      </div>
      <ScaledFrame width={width} height={680}>
        <OfficeFrame
          embedded
          rail={
            <div className="flex flex-col gap-4">
              <h5 className="text-title-card">Atividade recente</h5>
              <ul className="flex flex-col gap-3">
                {[
                  ['Avaria registrada na BQ-0142', '11/11/2026 às 10:12, Marcos Vieira'],
                  ['Cobrança gerada, R$ 420,00', '11/11/2026 às 09:40, Paula Ramos'],
                  ['Retirada concluída, 8 unidades', '10/11/2026 às 17:05, Equipe 2'],
                ].map(([t, m]) => (
                  <li key={t}>
                    <p className="text-body font-semibold">{t}</p>
                    <p className="text-caption text-fg-3">{m}</p>
                  </li>
                ))}
              </ul>
            </div>
          }
          railOpen={railOpen}
          onRailOpenChange={setRailOpen}
          navOpen={navOpen}
          onNavOpenChange={setNavOpen}
          sidebar={<OfficeSideNav collapsed={collapsed} onCollapsedChange={setCollapsed} active={active} onActive={setActive} />}
          topbar={
            <TopBar
              title="Operação do dia"
              unreadCount={3}
              user={USER}
              shortcut={false}
              onMenuClick={() => setNavOpen(true)}
              actions={
                <Tooltip content={railOpen ? 'Ocultar atividade' : 'Mostrar atividade'}>
                  <Button
                    variant="ghost"
                    iconOnly
                    icon={PanelRight}
                    aria-label={railOpen ? 'Ocultar atividade' : 'Mostrar atividade'}
                    aria-pressed={railOpen}
                    onClick={() => setRailOpen((o) => !o)}
                  />
                </Tooltip>
              }
            />
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <h4 className="text-title-page">Serviços de hoje</h4>
            <Button variant="primary" icon={Plus}>
              Nova locação
            </Button>
          </div>
          <div className="mt-6">
            <ServiceRows />
          </div>
        </OfficeFrame>
      </ScaledFrame>
    </div>
  )
}

function PhoneFrame() {
  const [tab, setTab] = React.useState<'hoje' | 'servicos' | 'avarias' | 'perfil'>('hoje')
  const tabs = [
    { id: 'hoje', label: 'Hoje', icon: House },
    { id: 'servicos', label: 'Serviços', icon: ClipboardList },
    { id: 'avarias', label: 'Avarias', icon: TriangleAlert, count: 2 },
    { id: 'perfil', label: 'Perfil', icon: UserRound },
  ] as const
  return (
    <div className="w-[406px] max-w-full shrink-0 p-2">
      <div className="h-[720px] w-full max-w-[390px] overflow-hidden rounded-[32px] ring-[6px] ring-edge">
        <FieldFrame
          embedded
          title="R8 Eventos"
          pending={3}
          actionBar={
            <FieldActionBar>
              <Button variant="primary" size="field" block icon={Play}>
                Iniciar serviço
              </Button>
            </FieldActionBar>
          }
          nav={
            <BottomNav>
              {tabs.map((t) => (
                <BottomNavItem key={t.id} icon={t.icon} label={t.label} count={'count' in t ? t.count : undefined} active={tab === t.id} onClick={() => setTab(t.id)} />
              ))}
            </BottomNav>
          }
        >
          <h4 className="mb-4 text-title-field">Hoje</h4>
          <ul className="rounded-card bg-raised">
            {SERVICES.map((s) => (
              <li key={s.time} className="flex min-h-20 items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
                <span className="tnum w-12 shrink-0 text-body-lg font-semibold">{s.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-lg font-semibold">{s.title}</span>
                  <span className="mt-0.5 block">
                    <StatusDot tone={s.tone}>{s.status}</StatusDot>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </FieldFrame>
      </div>
    </div>
  )
}

/* ───────── seção ───────── */

export default function ShellSection() {
  const [openCollapsed, setOpenCollapsed] = React.useState(false)
  const [closedCollapsed, setClosedCollapsed] = React.useState(true)
  const [openActive, setOpenActive] = React.useState<NavId>('locacoes')
  const [closedActive, setClosedActive] = React.useState<NavId>('operacao')
  const [resets, setResets] = React.useState(0)
  /* tooltip à direita aberto à força só onde cabe; no celular ele sairia da tela */
  const wide = useMediaQuery('(min-width: 640px)')

  return (
    <DsSection
      id="casca"
      title="Casca"
      intro="Lateral, topo, navegação do celular, botões do campo e faixa de demonstração."
    >
      <Specimen
        title="Item da lateral"
        note="44 px, ícone 20, rótulo 15/500. Ativo: fundo cartão, ícone na marca e indicador de 4 × 28 à esquerda."
      >
        <div className="rounded-panel bg-panel p-4 ring-1 ring-hairline ring-inset">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-x-6 gap-y-6">
            <StateCell label="Padrão" className="w-full">
              <SideNavItem icon={ClipboardList} label="Locações" />
            </StateCell>
            <StateCell label="Hover" className="w-full">
              <SideNavItem icon={ClipboardList} label="Locações" forceState="hover" />
            </StateCell>
            <StateCell label="Foco (teclado)" className="w-full p-1">
              <SideNavItem icon={ClipboardList} label="Locações" forceState="focus" />
            </StateCell>
            <StateCell label="Ativo" className="w-full">
              <SideNavItem icon={ClipboardList} label="Locações" active />
            </StateCell>
            <StateCell label="Com contador" className="w-full">
              <SideNavItem icon={TriangleAlert} label="Avarias e cobranças" count={3} />
            </StateCell>
            <StateCell label="Ativo com contador" className="w-full">
              <SideNavItem icon={CalendarCheck} label="Operação do dia" count={14} active />
            </StateCell>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-6">
            <StateCell label="Desabilitado, com tooltip (sem permissão)" className="min-w-[232px] sm:min-w-[480px]">
              <div className="w-[232px]">
                <SideNavItem icon={ChartColumn} label="Relatórios" disabled disabledReason="Sem permissão. Peça acesso ao administrador." forceTooltip={wide} />
              </div>
            </StateCell>
            <StateCell label="Recolhida, tooltip à direita" className="min-w-[200px] sm:min-w-[320px]">
              <CollapsedItemDemo />
            </StateCell>
          </div>
        </div>
      </Specimen>

      <Specimen title="Lateral aberta e recolhida" note="256 e 72 px. Recolhida, o rótulo de grupo vira filete e o tooltip aparece à direita.">
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-[760px] rounded-panel bg-app p-3">
            <OfficeSideNav collapsed={openCollapsed} onCollapsedChange={setOpenCollapsed} active={openActive} onActive={setOpenActive} />
          </div>
          <div className="h-[760px] rounded-panel bg-app p-3">
            <OfficeSideNav collapsed={closedCollapsed} onCollapsedChange={setClosedCollapsed} active={closedActive} onActive={setClosedActive} />
          </div>
        </div>
      </Specimen>

      <Specimen
        title="Topo"
        note="72 px. Busca em pílula e botões circulares de 44. De 1024 a 1279 a busca vira só ícone."
      >
        <div className="flex flex-col gap-3 overflow-x-auto rounded-panel bg-app p-3">
          <div className="min-w-[760px]">
            <StateCell label="Quadro de 1280 px ou mais" className="w-full">
              <TopBar title="Operação do dia" unreadCount={3} user={USER} shortcut={false} className="w-full" />
            </StateCell>
          </div>
          <div className="min-w-[760px]">
            <StateCell label="Quadro de 1024 a 1279 px, sem avisos não lidos" className="w-full">
              <TopBar title="Operação do dia" compact user={USER} shortcut={false} className="w-full" />
            </StateCell>
          </div>
        </div>
      </Specimen>

      <Specimen
        title="Casca do escritório"
        note="Lateral, topo, conteúdo e trilho opcional."
      >
        <OfficeMiniature />
      </Specimen>

      <Specimen
        title="App de campo"
        note="390 por 720. Cabeçalho de 56, navegação de 64, ação principal de 56."
      >
        <div className="flex flex-wrap items-start gap-x-10 gap-y-8">
          <PhoneFrame />
          <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h4 className="text-body font-semibold">Navegação inferior, estados</h4>
              <div className="flex max-w-[390px] flex-col gap-4">
                <StateCell label="Item ativo, com contador, e itens inativos" className="w-full">
                  <div className="w-full overflow-hidden rounded-card ring-1 ring-hairline ring-inset">
                    <BottomNav>
                      <BottomNavItem icon={House} label="Hoje" active />
                      <BottomNavItem icon={ClipboardList} label="Serviços" />
                      <BottomNavItem icon={TriangleAlert} label="Avarias" count={2} />
                      <BottomNavItem icon={UserRound} label="Perfil" />
                    </BottomNav>
                  </div>
                </StateCell>
                <StateCell label="Foco (teclado) no item Serviços" className="w-full">
                  <div className="w-full overflow-hidden rounded-card ring-1 ring-hairline ring-inset">
                    <BottomNav>
                      <BottomNavItem icon={House} label="Hoje" active />
                      <BottomNavItem icon={ClipboardList} label="Serviços" forceFocus />
                      <BottomNavItem icon={TriangleAlert} label="Avarias" count={2} />
                      <BottomNavItem icon={UserRound} label="Perfil" />
                    </BottomNav>
                  </div>
                </StateCell>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-body font-semibold">Sincronização</h4>
              <div className="flex flex-wrap gap-3">
                <SyncIndicator />
                <SyncIndicator pending={3} />
              </div>
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen
        title="Botões grandes do campo"
        note="Etapa: 96 px, grade de 2 colunas. Principal: botão field. Avaria: field secundário."
      >
        <div className="flex flex-wrap items-start gap-x-10 gap-y-8 rounded-panel bg-app p-5">
          <div className="grid w-full max-w-[560px] grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
            <StateCell label="Padrão" className="w-full">
              <FieldActionTile icon={Truck} label="Cheguei" />
            </StateCell>
            <StateCell label="Hover" className="w-full">
              <FieldActionTile icon={Truck} label="Cheguei" forceState="hover" />
            </StateCell>
            <StateCell label="Pressionado" className="w-full">
              <FieldActionTile icon={Truck} label="Cheguei" forceState="active" />
            </StateCell>
            <StateCell label="Foco (teclado)" className="w-full p-1">
              <FieldActionTile icon={Truck} label="Cheguei" forceState="focus" />
            </StateCell>
            <StateCell label="Concluída" className="w-full">
              <FieldActionTile icon={Camera} label="Fotos" done />
            </StateCell>
            <StateCell label="Desabilitada" className="w-full">
              <FieldActionTile icon={PenLine} label="Assinatura" disabled />
            </StateCell>
          </div>
          <div className="flex w-full max-w-[358px] flex-col gap-3">
            <StateCell label="Ação principal" className="w-full">
              <Button variant="primary" size="field" block icon={Sparkles}>
                Iniciar limpeza
              </Button>
            </StateCell>
            <StateCell label="Ação de avaria" className="w-full">
              <Button variant="secondary" size="field" block icon={TriangleAlert} className="[&>svg]:text-danger-ink">
                Registrar avaria
              </Button>
            </StateCell>
            <StateCell label="Principal desabilitada" className="w-full">
              <Button variant="primary" size="field" block icon={Hammer} disabled>
                Concluir montagem
              </Button>
            </StateCell>
          </div>
          <div className="w-full max-w-[358px]">
            <FieldActionGrid>
              <FieldActionTile icon={Truck} label="Cheguei" done />
              <FieldActionTile icon={Sparkles} label="Iniciar limpeza" />
              <FieldActionTile icon={Camera} label="Fotos" />
              <FieldActionTile icon={PenLine} label="Assinatura" disabled />
            </FieldActionGrid>
            <p className="mt-2 text-caption text-fg-3">Grade de etapas, gap 12.</p>
          </div>
        </div>
      </Specimen>

      <Specimen
        title="Faixa Ambiente de demonstração"
        note="32 px no escritório, 28 no celular. Aqui fora de posição fixa."
      >
        <div className="flex flex-col gap-5">
          <StateCell label="Escritório, 32 px" className="w-full">
            <div className="w-full overflow-hidden rounded-card">
              <DemoStrip compact={false} onReset={() => setResets((n) => n + 1)} />
            </div>
          </StateCell>
          <StateCell label="Celular, 28 px" className="w-full max-w-[390px]">
            <div className="w-full overflow-hidden rounded-card">
              <DemoStrip compact />
            </div>
          </StateCell>
          <p aria-live="polite" className="text-caption text-fg-3">
            {resets === 0 ? 'Restaurar dados ainda não foi acionado nesta página.' : `Restaurar dados acionado ${resets} ${resets === 1 ? 'vez' : 'vezes'}.`}
          </p>
        </div>
      </Specimen>
    </DsSection>
  )
}

/** Item recolhido isolado, com o tooltip aberto. */
function CollapsedItemDemo() {
  return (
    <div className="w-12 rounded-panel bg-panel">
      <SideNavScope collapsed>
        <SideNavItem icon={ClipboardList} label="Locações" count={12} active forceTooltip />
      </SideNavScope>
    </div>
  )
}
