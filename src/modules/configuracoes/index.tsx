/* Módulo "configuracoes": empresa, marca, usuários, pacote de segmento, integrações, IA e demonstração. */
import * as React from 'react'
import { Building2, FlaskConical, Layers, Palette, Plug, Sparkles, UsersRound, type LucideIcon } from 'lucide-react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { PageHeader } from '@/app/PageHeader'
import { cn } from '@/ui'
import Empresa from './Empresa'
import Marca from './Marca'
import Usuarios from './Usuarios'
import Pacote from './Pacote'
import Integracoes from './Integracoes'
import IA from './IA'
import Demonstracao from './Demonstracao'

const TABS: { path: string; label: string; icon: LucideIcon; element: React.ReactElement }[] = [
  { path: 'empresa', label: 'Empresa', icon: Building2, element: <Empresa /> },
  { path: 'marca', label: 'Marca', icon: Palette, element: <Marca /> },
  { path: 'usuarios', label: 'Usuários', icon: UsersRound, element: <Usuarios /> },
  { path: 'pacote', label: 'Pacote', icon: Layers, element: <Pacote /> },
  { path: 'integracoes', label: 'Integrações', icon: Plug, element: <Integracoes /> },
  { path: 'ia', label: 'IA', icon: Sparkles, element: <IA /> },
  { path: 'demonstracao', label: 'Demonstração', icon: FlaskConical, element: <Demonstracao /> },
]

export default function Configuracoes() {
  return (
    <>
      <PageHeader title="Configurações" />
      <nav aria-label="Seções das configurações" className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ul className="m-0 flex w-max list-none gap-2 p-0">
          {TABS.map((t) => (
            <li key={t.path}>
              <NavLink
                to={`/configuracoes/${t.path}`}
                className={({ isActive }) =>
                  cn(
                    'ds-touch inline-flex h-11 items-center gap-2 rounded-pill px-5 text-body font-semibold no-underline transition-colors duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    isActive ? 'bg-fg text-raised' : 'bg-raised text-fg-2 hover:bg-hover hover:text-fg',
                  )
                }
              >
                <t.icon size={18} strokeWidth={2} aria-hidden />
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route index element={<Navigate to="empresa" replace />} />
        {TABS.map((t) => (
          <Route key={t.path} path={t.path} element={t.element} />
        ))}
        <Route path="*" element={<Navigate to="/configuracoes/empresa" replace />} />
      </Routes>
    </>
  )
}
