import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { CircleHelp, Moon, Settings, Smartphone, Sun } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn, Tooltip, TooltipProvider } from '@/ui'
import { OfficeFrame } from '@/ui/AppFrame'
import { DemoStrip } from '@/ui/DemoStrip'
import { SideNav, SideNavGroup, SideNavItem } from '@/ui/SideNav'
import { AppToaster, notify } from '@/ui/Toast'
import { TopBar } from '@/ui/TopBar'
import { useReturnFocus } from '@/ui/returnFocus'
import { PageTransition } from '@/ui/Motion'
import { applyBrand } from '@/lib/brand'
import { useTheme } from '@/lib/theme'
import { formatDateTime } from '@/lib/format'
import { getMoneyPanel, listNotifications, markAllRead, useQuery, useSettings } from '@/services'
import { Copiloto, CopilotoButton } from '@/modules/copiloto'
import { ResetDialog } from '@/modules/configuracoes/ResetDialog'
import { CommandPalette } from './CommandPalette'
import { NAV_ITEMS } from './nav'
import { Tour } from './Tour'

const topBtn =
  'ds-touch ds-touch-sq relative inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-raised text-fg-2 transition-[background-color,color] duration-150 ease-[var(--ease-ui)] hover:bg-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const NOTIF_ROUTE: Record<string, (id: string) => string> = {
  rental: (id) => `/locacoes/${id}`,
  service: () => '/operacao',
  charge: () => '/financeiro',
  damage: () => '/avarias',
  client: (id) => `/clientes/${id}`,
  unit: (id) => `/equipamentos/${id}`,
}

/** Aplica a cor da marca das configurações em toda a casca, na hora em que muda. */
export function useBrandSync() {
  const hex = useSettings().brandHex
  React.useEffect(() => {
    applyBrand(hex)
  }, [hex])
}

/**
 * Casca do escritório: lateral, topo, busca (Ctrl K), avisos, tema e faixa de demonstração.
 * Cada módulo entra pelo <Outlet/> e começa com <PageHeader/>.
 * Pontos de extensão marcados com "EXTENSÃO": Copiloto e tour guiado.
 */
export default function AppLayout() {
  const settings = useSettings()
  useBrandSync()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { resolved, setPref } = useTheme()
  const [collapsed, setCollapsed] = React.useState(() => window.matchMedia('(max-width: 1359px)').matches)
  const [navOpen, setNavOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [bellOpen, setBellOpen] = React.useState(false)
  const bellFocus = useReturnFocus()

  const panel = useQuery(getMoneyPanel, [])
  const notifs = useQuery(listNotifications, [])
  const unread = notifs.data?.filter((n) => !n.read).length ?? 0
  const user = settings.users.find((u) => u.id === settings.currentUserId) ?? settings.users[0]
  const roleLabel = { dono: 'Dono', escritorio: 'Escritório', campo: 'Campo' }[user?.role ?? 'escritorio']

  React.useEffect(() => setNavOpen(false), [pathname])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const counts: Record<string, number | undefined> = {
    '/operacao': panel.data?.teamsNow.reduce((a, t) => a + (t.total - t.done), 0) || undefined,
    '/avarias': panel.data?.uncollectedDamages.count || undefined,
  }
  const isActive = (to: string, end?: boolean) => (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`))
  const link = (n: (typeof NAV_ITEMS)[number]) => (
    <SideNavItem key={n.to} icon={n.icon} label={n.label} count={counts[n.to]} active={isActive(n.to, n.end)} render={(p) => <NavLink to={n.to} end={n.end} {...p} />} />
  )
  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  const [resetOpen, setResetOpen] = React.useState(false)

  return (
    <TooltipProvider>
      <div className="ds-root min-h-dvh">
        <DemoStrip fixed onReset={() => setResetOpen(true)} />
        <div style={{ paddingTop: 'var(--demo-strip-h, 0px)' }}>
          <OfficeFrame
            viewport
            navOpen={navOpen}
            onNavOpenChange={setNavOpen}
            sidebar={
              <SideNav
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
                brand={{ name: settings.company.name, logoSrc: settings.logoDataUrl || undefined }}
                user={user ? { name: user.name, role: roleLabel } : undefined}
                onUserClick={() => navigate('/configuracoes/usuarios')}
                footer={
                  <>
                    <SideNavItem icon={Smartphone} label="App da equipe de rua" render={(p) => <NavLink to="/campo" {...p} />} />
                    <SideNavItem icon={Settings} label="Configurações" active={isActive('/configuracoes')} render={(p) => <NavLink to="/configuracoes" {...p} />} />
                                        <SideNavItem icon={CircleHelp} label="Ajuda" onClick={() => window.dispatchEvent(new CustomEvent('app:tour'))} />
                  </>
                }
              >
                <SideNavGroup label="Hoje">{NAV_ITEMS.filter((n) => n.group === 'hoje').map(link)}</SideNavGroup>
                <SideNavGroup label="Gestão">{NAV_ITEMS.filter((n) => n.group === 'gestao').map(link)}</SideNavGroup>
                <SideNavGroup label="Crescer">{NAV_ITEMS.filter((n) => n.group === 'crescer').map(link)}</SideNavGroup>
              </SideNav>
            }
            topbar={
              <Popover.Root open={bellOpen} onOpenChange={setBellOpen}>
                <Popover.Anchor asChild>
                  <div>
                    <TopBar
                      title={today.charAt(0).toUpperCase() + today.slice(1)}
                      shortcut={false}
                      unreadCount={unread}
                      user={{ name: user?.name ?? '', role: roleLabel }}
                      onMenuClick={() => setNavOpen(true)}
                      onSearchClick={() => setSearchOpen(true)}
                      onBellClick={() => setBellOpen((o) => !o)}
                      onUserAction={(a) => {
                        if (a === 'logout') notify.info('Esta é uma demonstração: não há sessão para encerrar')
                        else navigate(a === 'profile' ? '/configuracoes/usuarios' : '/configuracoes')
                      }}
                      actions={
                        <>
                          <CopilotoButton />
                          <Tooltip content={resolved === 'dark' ? 'Tema claro' : 'Tema escuro'}>
                            <button type="button" aria-label={resolved === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'} onClick={() => setPref(resolved === 'dark' ? 'light' : 'dark')} className={topBtn}>
                              {resolved === 'dark' ? <Sun size={20} strokeWidth={2} aria-hidden /> : <Moon size={20} strokeWidth={2} aria-hidden />}
                            </button>
                          </Tooltip>
                        </>
                      }
                    />
                  </div>
                </Popover.Anchor>
                <Popover.Portal>
                  <Popover.Content
                    onOpenAutoFocus={bellFocus.capture}
                    onCloseAutoFocus={bellFocus.restore}
                    align="end"
                    sideOffset={8}
                    collisionPadding={12}
                    className="ds-root z-50 w-[min(380px,calc(100vw-24px))] rounded-card bg-overlay p-2 text-fg shadow-overlay outline-none data-[state=open]:animate-[ds-menu-in_200ms_var(--ease-ui)]"
                  >
                    <div className="flex items-center justify-between px-3 pt-2 pb-1">
                      <h2 className="text-title-card">Avisos</h2>
                      {unread ? (
                        <button type="button" onClick={() => void markAllRead()} className="rounded-pill px-2 py-1 text-caption font-semibold text-accent-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-ring">
                          Marcar como lidos
                        </button>
                      ) : null}
                    </div>
                    <ul className="max-h-[420px] overflow-y-auto">
                      {(notifs.data ?? []).slice(0, 12).map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setBellOpen(false)
                              if (n.ref) navigate(NOTIF_ROUTE[n.ref.type]?.(n.ref.id) ?? '/')
                            }}
                            className="flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                          >
                            <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-pill', n.read ? 'bg-transparent' : 'bg-accent')} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-body font-semibold">{n.title}</span>
                              <span className="block text-caption text-fg-3">{formatDateTime(n.at)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                      {notifs.data && !notifs.data.length ? <li className="px-3 py-8 text-center text-body text-fg-2">Nenhum aviso por enquanto</li> : null}
                    </ul>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            }
          >
            <PageTransition routeKey={pathname.split('/')[1] ?? ''}>
              <Outlet />
            </PageTransition>
          </OfficeFrame>
        </div>
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        <ResetDialog open={resetOpen} onOpenChange={setResetOpen} />
        <Copiloto />
        <Tour />
        <AppToaster />
      </div>
    </TooltipProvider>
  )
}
