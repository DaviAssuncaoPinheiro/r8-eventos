import * as React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Boxes, Building2, CalendarDays, House, Map, MessageCircle, Plus, QrCode, Search, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CLIENT, COMPANY, CURRENT_USER, PRODUCT, RENTALS, TEAMS, UNITS } from '@/data/mock'
import { BAIRRO } from '@/data/geo'
import { AvatarStack, IconButton, Kbd, RentalAvatar, TeamAvatar, Tip } from './ui'
import { useDemo, useJobs } from '@/store'
import { DemoGuide } from './DemoGuide'

/** Marca R8: quadrado preto com "R8" no laranja da marca */
export function LogoMark({ size = 36, className, tone = 'black' }: { size?: number; className?: string; tone?: 'black' | 'brand' | 'white' }) {
  const bg = tone === 'black' ? 'var(--color-black)' : tone === 'brand' ? 'var(--color-brand)' : '#fff'
  const fg = tone === 'black' ? 'var(--color-brand)' : tone === 'brand' ? '#fff' : 'var(--color-black)'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" fill={bg} />
      <text x="20" y="26.2" textAnchor="middle" fontFamily="'Manrope Variable', ui-sans-serif, system-ui, sans-serif" fontSize="17" fontWeight="800" letterSpacing="-0.6" fill={fg}>
        R8
      </text>
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'Painel', icon: House, end: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/locacoes', label: 'Locações', icon: Building2 },
  { to: '/equipamentos', label: 'Equipamentos', icon: Boxes },
  { to: '/regioes', label: 'Regiões', icon: Map },
  { to: '/avisos', label: 'Avisos', icon: MessageCircle, badge: true },
]

export function AppShell({ children }: { children?: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = React.useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const avisos = useDemo((s) => s.avisos)
  const occurrences = useDemo((s) => s.occurrences)
  const reset = useDemo((s) => s.reset)
  const jobs = useJobs()
  const due = avisos.filter((r) => r.status === 'programado' || r.status === 'sem-resposta').length
  const openQr = occurrences.filter((o) => o.status === 'aberta' && o.source === 'qr').length
  /** serviço atual (ou o próximo) de cada equipe hoje: abre o app da equipe */
  const teamJob = (teamId: string) => {
    const today = jobs.filter((j) => j.teamId === teamId && new Date(j.start).toDateString() === new Date().toDateString())
    return (today.find((j) => j.status === 'em-andamento') ?? today.find((j) => j.status === 'a-caminho') ?? today.find((j) => j.status === 'agendado') ?? today[today.length - 1])?.id
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  React.useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0 })
  }, [loc.pathname])

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas lg:p-3">
      {/* Trilho de ícones */}
      <aside className="mr-3 hidden w-[68px] shrink-0 flex-col items-center rounded-[26px] bg-surface py-4 ring-1 ring-white/80 lg:flex">
        <NavLink to="/" aria-label={COMPANY.name}>
          <LogoMark size={40} />
        </NavLink>
        <nav className="mt-auto mb-auto flex flex-col items-center gap-2.5">
          {NAV.map((n) => (
            <Tip key={n.to} content={n.label} side="right">
              <span className="inline-flex">
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex size-11 items-center justify-center rounded-full transition-[background,color,box-shadow] duration-150',
                    isActive ? 'bg-card text-ink shadow-pill' : 'text-ink-3 hover:bg-card/70 hover:text-ink',
                  )
                }
              >
                <n.icon className="size-[19px]" strokeWidth={1.9} />
                {n.badge && due > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand ring-2 ring-surface" />}
              </NavLink>
              </span>
            </Tip>
          ))}
        </nav>
        <Tip content="Reiniciar demonstração" side="right">
          <button onClick={() => { reset(); toast('Demonstração reiniciada') }} className="flex size-11 items-center justify-center rounded-full text-ink-3 hover:bg-card hover:text-ink">
            <Settings className="size-[19px]" strokeWidth={1.9} />
          </button>
        </Tip>
      </aside>

      {/* Área principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface lg:rounded-[26px] lg:ring-1 lg:ring-white/80">
        <header className="flex h-[72px] shrink-0 items-center gap-3 px-4 md:px-6">
          <div className="flex items-center gap-2.5 xl:hidden">
            <LogoMark size={34} className="lg:hidden" />
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-[-0.02em]">{COMPANY.name}</div>
              <div className="text-[11.5px] font-medium text-ink-3">Brasília</div>
            </div>
          </div>

          {/* Navegação em pílulas */}
          <nav className="hidden items-center gap-1.5 xl:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-10 items-center gap-2 rounded-full px-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors xl:px-4',
                    isActive ? 'bg-card text-ink shadow-pill' : 'text-ink-2 hover:text-ink',
                  )
                }
              >
                <n.icon className="size-4" strokeWidth={2} />
                {n.label}
                {n.badge && due > 0 && <span className="num -mr-1 rounded-full bg-black px-1.5 text-[10.5px] leading-[18px] font-bold text-white">{due}</span>}
              </NavLink>
            ))}
            <IconButton aria-label="Buscar" onClick={() => setCmdOpen(true)} size={40} className="ml-1">
              <Search className="size-4" strokeWidth={2} />
            </IconButton>
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden items-center gap-2.5 xl:flex">
              <AvatarStack size={36}>
                {TEAMS.map((t) => {
                  const jid = teamJob(t.id)
                  return (
                    <Tip key={t.id} content={`${t.name} · app da equipe`} side="bottom">
                      <NavLink to={jid ? `/campo/servico/${jid}` : '/agenda'}>
                        <TeamAvatar teamId={t.id} size={36} />
                      </NavLink>
                    </Tip>
                  )
                })}
              </AvatarStack>
            </div>
            <button
              onClick={() => nav('/agenda?novo=1')}
              className="hidden h-10 items-center gap-2 rounded-full bg-card px-4 text-[13.5px] font-semibold whitespace-nowrap text-ink shadow-pill hover:bg-surface md:inline-flex"
            >
              <Plus className="size-4" strokeWidth={2.2} /> Novo serviço
            </button>
            <IconButton aria-label="Buscar" onClick={() => setCmdOpen(true)} className="xl:hidden">
              <Search className="size-[18px]" strokeWidth={2} />
            </IconButton>
            <IconButton
              aria-label="Notificações"
              className="relative"
              onClick={() =>
                openQr
                  ? toast(`${openQr} ${openQr === 1 ? 'aviso chegou' : 'avisos chegaram'} pelo QR das portas`, { description: 'Veja em Precisa de atenção, no Painel.' })
                  : toast('Nenhum aviso novo pelo QR')
              }
            >
              <Bell className="size-[18px]" strokeWidth={2} />
              {openQr > 0 && <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-brand ring-2 ring-card" />}
            </IconButton>
            <span className="hidden size-10 items-center justify-center rounded-full bg-black text-[13px] font-bold text-white md:inline-flex" title={`${CURRENT_USER.name} · ${CURRENT_USER.role}`}>
              {CURRENT_USER.initials}
            </span>
          </div>
        </header>

        <main className="scroll-thin flex-1 overflow-y-auto">
          <React.Suspense fallback={<div className="h-[60vh]" />}>
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}>
              {children ?? <Outlet />}
            </motion.div>
          </React.Suspense>
        </main>
      </div>

      {/* Dock flutuante no celular (ref. apps de finanças e condomínio) */}
      <nav className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-30 flex justify-center px-4 lg:hidden">
        <div className="flex items-center gap-1 rounded-full bg-black p-1.5 shadow-float">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={'end' in n ? n.end : undefined}
              className={({ isActive }) =>
                cn('flex h-11 items-center gap-1.5 rounded-full transition-[background,padding] duration-200', isActive ? 'bg-white/14 px-3.5 text-white' : 'w-11 justify-center text-white/55')
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon className="size-[19px]" strokeWidth={2} />
                  {isActive && <span className="text-[12.5px] font-semibold">{n.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <DemoGuide />
    </div>
  )
}

function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNavigate()
  const go = (to: string) => {
    onOpenChange(false)
    nav(to)
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-[12vh] backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onOpenChange(false)}>
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-[560px] overflow-hidden rounded-[24px] bg-card shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Busca" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-ink-3">
              <div className="flex items-center gap-3 border-b border-line px-5">
                <Search className="size-[18px] text-ink-3" />
                <Command.Input autoFocus placeholder="Buscar locação, cliente, região ou unidade (BQ-012)" className="h-14 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-ink-4" />
                <Kbd>esc</Kbd>
              </div>
              <Command.List className="scroll-thin max-h-[380px] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-[13px] text-ink-3">Nenhum resultado.</Command.Empty>
                <Command.Group heading="Locações">
                  {RENTALS.map((r) => {
                    const c = CLIENT[r.clientId]
                    return (
                      <Command.Item
                        key={r.id}
                        value={`${r.title} ${c.name} ${BAIRRO[r.bairro].name} ${r.code}`}
                        onSelect={() => go(`/locacoes/${r.id}`)}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 data-[selected=true]:bg-muted"
                      >
                        <RentalAvatar rental={r} size={34} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-semibold text-ink">{r.title}</div>
                          <div className="truncate text-[12.5px] font-medium text-ink-3">
                            {c.name}, {BAIRRO[r.bairro].name}
                          </div>
                        </div>
                        <span className="num text-[12px] font-semibold text-ink-4">{r.code}</span>
                      </Command.Item>
                    )
                  })}
                </Command.Group>
                <Command.Group heading="Unidades com QR">
                  {UNITS.filter((u) => u.state !== 'base').map((u) => (
                    <Command.Item
                      key={u.id}
                      value={`${u.id} ${PRODUCT[u.productId].short}`}
                      onSelect={() => go(`/equipamentos?u=${u.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 data-[selected=true]:bg-muted"
                    >
                      <span className="flex size-[34px] items-center justify-center rounded-full bg-muted text-ink-2">
                        <QrCode className="size-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="num text-[14px] font-semibold text-ink">{u.id}</div>
                        <div className="truncate text-[12.5px] font-medium text-ink-3">
                          {PRODUCT[u.productId].short}
                          {u.rentalId ? `, ${RENTALS.find((r) => r.id === u.rentalId)?.title}` : u.state === 'manutencao' ? ', em manutenção' : ''}
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Telas">
                  {NAV.map((n) => (
                    <Command.Item key={n.to} value={n.label} onSelect={() => go(n.to)} className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2.5 text-[14px] font-semibold data-[selected=true]:bg-muted">
                      {n.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

