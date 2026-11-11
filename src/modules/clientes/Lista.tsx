import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, Plus, Search, Users } from 'lucide-react'
import { listClients, useQuery, type ClientKind, type ClientView } from '@/services'
import { Badge, Banner, Button, Card, EmptyState, Input, Menu, Money, Segmented, Skeleton, cn, useMediaQuery } from '@/ui'
import { RollingNumber, Stagger } from '@/ui/Motion'
import { PageHeader } from '@/app/PageHeader'
import { formatMoney } from '@/lib/format'
import { Avatar } from './components/Avatar'
import { ClientDrawer } from './components/ClientDrawer'
import { HBars } from './components/HBars'
import { CLIENT_KINDS } from './lib'

type Filtro = 'todos' | 'ativa' | 'atraso'

function ClientCard({ c }: { c: ClientView }) {
  return (
    <Link
      to={`/clientes/${c.id}`}
      className="group flex min-w-0 flex-col gap-4 rounded-card bg-raised p-5 transition-colors duration-150 ease-[var(--ease-ui)] hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <Avatar name={c.name} seed={c.id} />
        <div className="flex min-w-0 flex-col items-start gap-1">
          <h3 className="w-full truncate text-title-card">{c.name}</h3>
          <Badge tone="neutral">{c.kind}</Badge>
        </div>
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        {c.receivable > 0 ? (
          <span className={cn('text-title-sub', c.overdue > 0 ? 'text-danger-ink' : 'text-fg')}>
            <Money value={c.receivable} className={c.overdue > 0 ? 'text-danger-ink' : undefined} />
          </span>
        ) : (
          <span className="text-body font-semibold text-ok-ink">Em dia</span>
        )}
        {c.activeRentals > 0 ? <Badge tone="info">{c.activeRentals === 1 ? '1 ativa' : `${c.activeRentals} ativas`}</Badge> : null}
      </div>
    </Link>
  )
}

function CountTile({ title, value, onClick, hero, danger, active }: { title: string; value: number; onClick: () => void; hero?: boolean; danger?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group relative flex min-h-[132px] min-w-0 flex-col justify-between rounded-card p-5 text-left transition-[filter,background-color] duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6',
        hero ? 'ds-hero ds-hero-card' : 'bg-raised hover:bg-hover',
        active && !hero && 'ring-2 ring-inset ring-danger',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={cn('text-body-lg font-medium', hero ? 'text-on-accent' : 'text-fg')}>{title}</span>
        <span
          aria-hidden
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-pill ring-1 ring-inset transition-colors duration-150',
            hero ? 'bg-on-accent text-accent-active ring-transparent' : 'text-fg ring-edge group-hover:bg-fg group-hover:text-raised group-hover:ring-fg',
          )}
        >
          <ArrowUpRight size={18} strokeWidth={2} className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover:rotate-45" />
        </span>
      </span>
      <span className={cn('tnum text-kpi-lg', danger && 'text-danger-ink', hero && 'text-on-accent')}>
        <RollingNumber value={value} />
      </span>
    </button>
  )
}

function TopSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-4 @min-[1000px]/frame:grid-cols-12">
      <Skeleton shape="block" className="h-[300px] rounded-card @min-[1000px]/frame:col-span-8" />
      <div className="grid grid-cols-2 gap-4 @min-[1000px]/frame:col-span-4 @min-[1000px]/frame:grid-cols-1">
        <Skeleton shape="block" className="h-[142px] rounded-card" />
        <Skeleton shape="block" className="h-[142px] rounded-card" />
      </div>
    </div>
  )
}

export default function Lista() {
  const q = useQuery(() => listClients(), [])
  const [filtro, setFiltro] = React.useState<Filtro>('todos')
  const [kind, setKind] = React.useState<ClientKind | undefined>()
  const [busca, setBusca] = React.useState('')
  const [novo, setNovo] = React.useState(false)
  const compact = useMediaQuery('(max-width: 639px)')

  const all = q.data ?? []
  const top5 = React.useMemo(() => [...all].sort((a, b) => b.totalPaid - a.totalPaid).slice(0, 5), [all])
  const ativos = all.filter((c) => c.activeRentals > 0).length
  const atrasados = all.filter((c) => c.overdue > 0).length

  const list = React.useMemo(() => {
    const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const term = norm(busca.trim())
    return all.filter((c) => {
      if (filtro === 'ativa' && c.activeRentals <= 0) return false
      if (filtro === 'atraso' && c.overdue <= 0) return false
      if (kind && c.kind !== kind) return false
      if (term && !norm(`${c.name} ${c.cnpj} ${c.contacts.map((x) => x.name).join(' ')}`).includes(term)) return false
      return true
    })
  }, [all, filtro, kind, busca])

  const filtered = filtro !== 'todos' || !!kind || !!busca.trim()
  const clear = () => {
    setFiltro('todos')
    setKind(undefined)
    setBusca('')
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        actions={
          <Button variant="primary" size="lg" icon={Plus} onClick={() => setNovo(true)}>
            Novo cliente
          </Button>
        }
      />

      {q.error && !q.data ? (
        <Banner
          tone="danger"
          title="Não foi possível carregar os clientes."
          action={
            <Button variant="secondary" size="sm" onClick={() => void q.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : q.initialLoading ? (
        <>
          <TopSkeleton />
          <div className="mt-4 grid grid-cols-1 gap-4 @min-[700px]/frame:grid-cols-2 @min-[1100px]/frame:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} shape="block" className="h-[148px] rounded-card" />
            ))}
          </div>
        </>
      ) : (
        <>
          <Stagger className="grid grid-cols-1 gap-4 @min-[1000px]/frame:grid-cols-12">
            <Card as="section" className="min-w-0 sm:p-6 @min-[1000px]/frame:col-span-8">
              <h2 className="mb-3 text-title-sub">Maiores clientes por receita</h2>
              {top5.length ? (
                <HBars labelWidth={230} label="Cinco maiores clientes por receita" rows={top5.map((c) => ({ key: c.id, label: c.name, value: c.totalPaid, valueLabel: formatMoney(c.totalPaid), href: `/clientes/${c.id}` }))} />
              ) : (
                <EmptyState icon={Users} title="Os maiores clientes aparecem aqui">
                  Cadastre um cliente e emita a primeira cobrança.
                </EmptyState>
              )}
            </Card>
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 @min-[1000px]/frame:col-span-4 @min-[1000px]/frame:grid-cols-1">
              <CountTile hero title="Com locação ativa" value={ativos} active={filtro === 'ativa'} onClick={() => setFiltro((f) => (f === 'ativa' ? 'todos' : 'ativa'))} />
              <CountTile danger title="Com atraso" value={atrasados} active={filtro === 'atraso'} onClick={() => setFiltro((f) => (f === 'atraso' ? 'todos' : 'atraso'))} />
            </div>
          </Stagger>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1 sm:max-w-[360px]">
              <Input
                aria-label="Buscar cliente"
                placeholder="Buscar por nome, CNPJ ou contato"
                prefix={<Search size={16} strokeWidth={2} aria-hidden />}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="rounded-pill px-4"
              />
            </div>
            <Segmented<Filtro>
              label="Situação"
              size={compact ? 'sm' : 'md'}
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'ativa', label: 'Com locação ativa' },
                { value: 'atraso', label: 'Com atraso' },
              ]}
            />
            <Menu
              align="start"
              trigger={
                <Button variant="secondary" iconRight={ChevronDown}>
                  {kind ?? 'Todos os tipos'}
                </Button>
              }
              items={[{ label: 'Todos os tipos', icon: !kind ? Check : undefined, onSelect: () => setKind(undefined) }, { type: 'separator' }, ...CLIENT_KINDS.map((k) => ({ label: k, icon: kind === k ? Check : undefined, onSelect: () => setKind(k) }))]}
            />
          </div>

          {list.length ? (
            <Stagger role="list" aria-label="Clientes" gap={0.035} delay={0.2} className="m-0 mt-4 grid list-none grid-cols-1 gap-4 p-0 @min-[700px]/frame:grid-cols-2 @min-[1100px]/frame:grid-cols-3 @min-[1500px]/frame:grid-cols-4">
              {list.map((c) => (
                <li key={c.id} className="min-w-0">
                  <ClientCard c={c} />
                </li>
              ))}
            </Stagger>
          ) : (
            <Card className="mt-4">
              {filtered ? (
                <EmptyState
                  variant="search"
                  title="Nenhum cliente com esse filtro"
                  action={
                    <Button variant="secondary" onClick={clear}>
                      Limpar filtros
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="Os clientes cadastrados aparecem aqui"
                  action={
                    <Button variant="primary" icon={Plus} onClick={() => setNovo(true)}>
                      Novo cliente
                    </Button>
                  }
                />
              )}
            </Card>
          )}
        </>
      )}

      <ClientDrawer open={novo} onOpenChange={setNovo} onSaved={(c) => {
          clear()
          setBusca(c.name)
        }} />
    </>
  )
}
