import * as React from 'react'
import { AlertTriangle, ClipboardList, House, UserRound } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSettings } from '@/services'
import { Banner, Button } from '@/ui'
import { FieldFrame } from '@/ui/AppFrame'
import { BottomNav, BottomNavItem } from '@/ui/BottomNav'
import { useCampo } from '../store'

export interface CampoScreenProps {
  /** Sem título, usa o nome da empresa (tela Hoje). */
  title?: string
  onBack?: () => void
  actionBar?: React.ReactNode
  /** Sem navegação inferior no registro do serviço, para a ação principal ter o rodapé só para ela. */
  nav?: boolean
  children: React.ReactNode
}

const ITEMS = [
  { to: '/campo', label: 'Hoje', icon: House, end: true },
  { to: '/campo/servicos', label: 'Serviços', icon: ClipboardList, end: false },
  { to: '/campo/avarias', label: 'Avarias', icon: AlertTriangle, end: false },
  { to: '/campo/perfil', label: 'Perfil', icon: UserRound, end: false },
]

/** Moldura de cada tela do campo: cabeçalho com indicador de sinal, conteúdo, ação principal e navegação. */
export function CampoScreen({ title, onBack, actionBar, nav = true, children }: CampoScreenProps) {
  const company = useSettings().company.name
  const pending = useCampo((s) => s.queue.length)
  const { pathname } = useLocation()
  const active = (to: string, end: boolean) => (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`))
  return (
    <FieldFrame
      title={title ?? company}
      onBack={onBack}
      pending={pending}
      actionBar={actionBar}
      nav={
        nav ? (
          <BottomNav>
            {ITEMS.map((i) => (
              <BottomNavItem key={i.to} icon={i.icon} label={i.label} active={active(i.to, i.end)} render={(p) => <NavLink to={i.to} end={i.end} {...p} />} />
            ))}
          </BottomNav>
        ) : undefined
      }
    >
      {children}
    </FieldFrame>
  )
}

/** Cartão branco de bloco. */
export function Block({ className = '', children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-card bg-raised p-5 ${className}`} {...rest}>
      {children}
    </section>
  )
}

export function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <Banner
      tone="danger"
      title="Não foi possível carregar."
      action={
        <Button size="md" onClick={onRetry} className="min-h-12">
          Tentar de novo
        </Button>
      }
    />
  )
}
