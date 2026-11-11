import * as React from 'react'
import { ArrowLeft, Check, CloudOff, X } from 'lucide-react'
import { cn } from './cn'
import { Badge } from './Badge'
import { Button } from './Button'

/*
  Contêineres de layout. Por padrão preenchem o pai (`h-full w-full`): o app real passa a janela
  inteira com a prop `viewport` (altura 100dvh menos a faixa de demonstração), os quadros de
  demonstração passam um contêiner de altura fixa. Nenhum usa position: fixed.
  Os breakpoints são de CONTÊINER (largura do próprio OfficeFrame), que na janela cheia coincidem
  com os da spec: >= 1280 aberta + trilho fixo; 1024 a 1279 recolhida + trilho em gaveta; < 1024 gavetas.
*/

/* ───────── Escritório ───────── */

export interface OfficeFrameProps {
  /** `<SideNav>`. Abaixo de 1024 vira gaveta pela esquerda; passe `collapsed={false}` nessa largura. */
  sidebar: React.ReactNode
  /** `<TopBar>`. */
  topbar: React.ReactNode
  /** Conteúdo da tela. Largura útil máxima 1280, centralizado. */
  children: React.ReactNode
  /** Trilho direito opcional (contexto, atividade). Fixo a partir de 1280; abaixo, gaveta pela direita. */
  rail?: React.ReactNode
  railOpen?: boolean
  onRailOpenChange?: (open: boolean) => void
  railLabel?: string
  /** Gaveta da lateral (abaixo de 1024). */
  navOpen?: boolean
  onNavOpenChange?: (open: boolean) => void
  /** Usa a janela: altura 100dvh menos `--demo-strip-h`. Sem isso, preenche o pai. */
  viewport?: boolean
  /**
   * Quadro de exemplo dentro de outra página (documentação): o conteúdo vira `div` em vez de `main`,
   * para não duplicar o marco principal da página que o contém.
   */
  embedded?: boolean
  className?: string
}

export function OfficeFrame({
  sidebar,
  topbar,
  children,
  rail,
  railOpen = false,
  onRailOpenChange,
  railLabel = 'Contexto',
  navOpen = false,
  onNavOpenChange,
  viewport,
  embedded,
  className,
}: OfficeFrameProps) {
  const Main = embedded ? 'div' : 'main'
  const onRailKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && railOpen) onRailOpenChange?.(false)
  }
  return (
    <div
      className={cn(
        '@container/frame relative isolate w-full overflow-hidden bg-app text-fg',
        viewport ? 'h-[calc(100dvh-var(--demo-strip-h,0px))]' : 'h-full',
        className,
      )}
    >
      <div className="flex h-full gap-[var(--shell-gap)] p-[var(--shell-gap)] @max-[1023px]/frame:gap-0 @max-[1023px]/frame:p-0">
        {/* gaveta da lateral abaixo de 1024 */}
        <div
          onClick={() => onNavOpenChange?.(false)}
          className={cn(
            'absolute inset-0 z-20 bg-scrim transition-opacity duration-200 ease-[var(--ease-ui)] @min-[1024px]/frame:hidden',
            navOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
        <div
          className={cn(
            'min-h-0 shrink-0 @max-[1023px]/frame:absolute @max-[1023px]/frame:inset-y-0 @max-[1023px]/frame:left-0 @max-[1023px]/frame:z-30',
            '@max-[1023px]/frame:transition-[transform,visibility] @max-[1023px]/frame:duration-250 @max-[1023px]/frame:ease-[var(--ease-ui)]',
            !navOpen && '@max-[1023px]/frame:invisible @max-[1023px]/frame:-translate-x-full',
          )}
        >
          {sidebar}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[var(--shell-gap)] @max-[1023px]/frame:gap-0">
          {topbar}
          <Main className="min-h-0 flex-1 overflow-y-auto rounded-panel bg-panel p-7 @max-[1279px]/frame:p-6 @max-[1023px]/frame:rounded-none @max-[1023px]/frame:p-4">
            <div className="mx-auto w-full max-w-[var(--content-max)]">{children}</div>
          </Main>
        </div>

        {rail ? (
          <>
            <div
              onClick={() => onRailOpenChange?.(false)}
              className={cn(
                'absolute inset-0 z-10 bg-scrim transition-opacity duration-250 ease-[var(--ease-ui)] @min-[1280px]/frame:hidden',
                railOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            />
            <aside
              aria-label={railLabel}
              onKeyDown={onRailKey}
              className={cn(
                'z-20 w-[var(--rail-w)] shrink-0 overflow-y-auto rounded-panel p-5 text-fg',
                '@min-[1280px]/frame:bg-panel',
                '@max-[1279px]/frame:absolute @max-[1279px]/frame:inset-y-[var(--shell-gap)] @max-[1279px]/frame:right-[var(--shell-gap)] @max-[1279px]/frame:bg-overlay @max-[1279px]/frame:shadow-overlay',
                '@max-[1279px]/frame:transition-[transform,visibility] @max-[1279px]/frame:duration-250 @max-[1279px]/frame:ease-[var(--ease-ui)]',
                '@max-[1023px]/frame:inset-0 @max-[1023px]/frame:w-auto @max-[1023px]/frame:rounded-none',
                !railOpen && '@min-[1280px]/frame:hidden @max-[1279px]/frame:invisible @max-[1279px]/frame:translate-x-[calc(100%+24px)]',
              )}
            >
              <div className="mb-3 flex justify-end @min-[1280px]/frame:hidden">
                <Button variant="ghost" size="md" iconOnly icon={X} aria-label={`Fechar ${railLabel.toLowerCase()}`} onClick={() => onRailOpenChange?.(false)} />
              </div>
              {rail}
            </aside>
          </>
        ) : null}
      </div>
    </div>
  )
}

/* ───────── App de campo ───────── */

/** "Sincronizado" (ok) ou "3 aguardando sinal" (aviso). */
export function SyncIndicator({ pending = 0, className }: { pending?: number; className?: string }) {
  return pending > 0 ? (
    <Badge tone="warn" icon={CloudOff} className={cn('shrink-0', className)}>
      <span role="status">{pending} aguardando sinal</span>
    </Badge>
  ) : (
    <Badge tone="ok" icon={Check} className={cn('shrink-0', className)}>
      <span role="status">Sincronizado</span>
    </Badge>
  )
}

export interface FieldFrameProps {
  /** Título do cabeçalho (`text-title-sub`, truncado). */
  title: string
  /** Mostra o botão voltar (44 px, ícone 24). */
  onBack?: () => void
  /** Itens aguardando sinal; 0 mostra "Sincronizado". */
  pending?: number
  /** Ação secundária só ícone 44 px, à direita do indicador. */
  action?: React.ReactNode
  /** Rodapé da ação principal (`FieldActionBar`), acima da navegação inferior. */
  actionBar?: React.ReactNode
  /** `<BottomNav>`. */
  nav?: React.ReactNode
  /** Conteúdo rolável. Margem lateral 16 já aplicada. */
  children: React.ReactNode
  viewport?: boolean
  /** Quadro de exemplo dentro de outra página: o título vira `p` em vez de `h1`. */
  embedded?: boolean
  className?: string
}

export function FieldFrame({ title, onBack, pending = 0, action, actionBar, nav, children, viewport, embedded, className }: FieldFrameProps) {
  const Title = embedded ? 'p' : 'h1'
  const [scrolled, setScrolled] = React.useState(false)
  return (
    <div
      className={cn(
        'relative isolate flex w-full flex-col overflow-hidden bg-app text-body-lg text-fg',
        viewport ? 'h-[calc(100dvh-var(--demo-strip-h,0px))]' : 'h-full',
        className,
      )}
    >
      <header
        className={cn(
          'flex shrink-0 items-center gap-1 border-b bg-app pt-[env(safe-area-inset-top)] pr-2 pl-2 transition-[border-color] duration-150 ease-[var(--ease-ui)]',
          scrolled ? 'border-hairline' : 'border-transparent',
        )}
        style={{ height: 'calc(var(--field-header-h) + env(safe-area-inset-top))' }}
      >
        {onBack ? (
          <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-fg-2 transition-colors duration-150 ease-[var(--ease-ui)] hover:bg-hover hover:text-fg active:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft size={24} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        <Title className={cn('min-w-0 flex-1 truncate text-title-sub', onBack ? '' : 'pl-2')}>{title}</Title>
        <SyncIndicator pending={pending} />
        {action}
      </header>
      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)} className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {children}
      </div>
      {actionBar}
      {nav}
    </div>
  )
}
