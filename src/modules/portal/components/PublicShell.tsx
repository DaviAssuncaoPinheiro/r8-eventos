import * as React from 'react'
import { Mail, Phone } from 'lucide-react'
import { AppToaster, TooltipProvider, cn } from '@/ui'
import { applyBrand } from '@/lib/brand'
import { formatPhone } from '@/lib/format'

export interface CompanyBrand {
  name: string
  logoDataUrl?: string
  brandHex: string
  phone: string
  email: string
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

/** Logo da locadora, ou as iniciais em quadrado na cor da marca */
export function BrandMark({ company, size = 40, className }: { company: Pick<CompanyBrand, 'name' | 'logoDataUrl'>; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn('ds-hero grid shrink-0 place-items-center overflow-hidden rounded-control text-body font-bold', className)}
    >
      {company.logoDataUrl ? <img src={company.logoDataUrl} alt="" className="size-full object-cover" /> : initialsOf(company.name)}
    </span>
  )
}

/**
 * Casca das páginas públicas: fora do escritório, com a marca da locadora.
 * A cor vem de `company.brandHex` (sem gravar nas preferências deste navegador).
 */
export function PublicShell({
  company,
  right,
  width = 960,
  children,
}: {
  company?: CompanyBrand
  right?: React.ReactNode
  width?: 480 | 960
  children: React.ReactNode
}) {
  React.useEffect(() => {
    if (company) applyBrand(company.brandHex, false)
  }, [company?.brandHex]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TooltipProvider>
      <div className="ds-root min-h-dvh bg-app">
        <div className={cn('mx-auto flex min-h-dvh w-full flex-col px-4 pt-4 pb-8 sm:px-6 sm:pt-6', width === 960 ? 'max-w-[960px]' : 'max-w-[480px]')}>
          {company ? (
            <header className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <BrandMark company={company} />
                <span className="min-w-0 truncate text-title-card">{company.name}</span>
              </div>
              {right ? <div className="min-w-0 shrink text-right text-body font-semibold text-fg-2">{right}</div> : null}
            </header>
          ) : null}
          <main className="mt-5 flex-1">{children}</main>
          <footer className="mt-10 flex flex-col items-center gap-4 text-center">
            {company ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a
                  href={`tel:+55${company.phone.replace(/\D/g, '')}`}
                  className="ds-touch inline-flex h-11 items-center gap-2 rounded-pill bg-raised px-5 text-body font-semibold text-fg no-underline transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Phone size={18} strokeWidth={2} aria-hidden />
                  {formatPhone(company.phone)}
                </a>
                {company.email ? (
                  <a
                    href={`mailto:${company.email}`}
                    className="ds-touch inline-flex h-11 items-center gap-2 rounded-pill bg-raised px-5 text-body font-semibold text-fg no-underline transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Mail size={18} strokeWidth={2} aria-hidden />
                    {company.email}
                  </a>
                ) : null}
              </div>
            ) : null}
            <p className="text-caption text-fg-3">Ambiente de demonstração</p>
          </footer>
        </div>
        <AppToaster />
      </div>
    </TooltipProvider>
  )
}
