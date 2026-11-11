import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, MoreHorizontal, SearchX, type LucideIcon } from 'lucide-react'
import { Banner } from './Banner'
import { Button } from './Button'
import { Card } from './Card'
import { Checkbox } from './Checkbox'
import { cn } from './cn'
import { EmptyState } from './EmptyState'
import { Select } from './Select'
import { Skeleton } from './Skeleton'
import { Tooltip } from './Tooltip'

/* ───────────────────────── tipos ───────────────────────── */

export type SortDir = 'asc' | 'desc'
export interface SortState {
  key: string
  dir: SortDir
}

/** Papel da coluna na lista de linhas (abaixo de 768px). */
export type MobileRole = 'title' | 'secondary' | 'value' | 'status'

export interface TableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  /** Largura fixa da coluna, em px ou CSS. */
  width?: number | string
  /** Largura mínima (a coluna de nome usa 200). */
  minWidth?: number
  sortable?: boolean
  render: (row: T) => React.ReactNode
  /** Linha de apoio abaixo do conteúdo (12px, fg-3). Quando alguma coluna usa, a linha passa a 56px. */
  secondary?: (row: T) => React.ReactNode
  /** Texto do atributo title quando o conteúdo é truncado. */
  titleText?: (row: T) => string
  /** Papel na lista de linhas do celular. Sem papel, a coluna some no celular. */
  mobile?: MobileRole
}

export type TableState = 'ready' | 'loading' | 'empty' | 'error' | 'noResults'

export interface TablePagination {
  /** Página atual, começando em 1. */
  page: number
  pageSize: number
  /** Total de linhas depois de filtrar (não só as da página). */
  total: number
  onPageChange: (page: number) => void
}

export interface TableTotals {
  label?: string
  /** Conteúdo por chave de coluna. */
  cells: Record<string, React.ReactNode>
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  /** Nome da linha para leitores de tela ("Selecionar {nome}", "Ações de {nome}"). */
  getRowLabel?: (row: T) => string
  /** Nome acessível da tabela. */
  label: string
  title?: string
  /** "128 locações" */
  countLabel?: string
  /** Busca e filtros (ao lado do título). */
  toolbar?: React.ReactNode
  /** Ação primária (à direita). */
  actions?: React.ReactNode

  state?: TableState
  /** Estado vazio personalizado. */
  emptyState?: React.ReactNode
  emptyTitle?: string
  emptyText?: string
  emptyAction?: React.ReactNode
  /** Mensagem do estado de erro. */
  errorText?: string
  onRetry?: () => void
  /** Texto do estado "sem resultado de filtro". */
  noResultsTitle?: string
  onClearFilters?: () => void

  sort?: SortState | null
  onSortChange?: (sort: SortState) => void

  selectable?: boolean
  selected?: ReadonlySet<string>
  onSelectedChange?: (selected: Set<string>) => void

  onRowClick?: (row: T) => void
  /** Mostra o botão de ações no fim da linha. */
  onRowActions?: (row: T) => void

  pagination?: TablePagination
  /** Unidade do rodapé: "1 a 10 de 26 locações". */
  unit?: string
  totals?: TableTotals

  density?: 'default' | 'compact'
  /** Layout: auto troca por lista abaixo de 768px de viewport. */
  layout?: 'auto' | 'table' | 'list'
  /** Altura máxima do corpo; com ela o cabeçalho fica fixo ao rolar. */
  maxBodyHeight?: number
  className?: string
}

/* ───────────────────────── utilitários ───────────────────────── */

function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    [query],
  )
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false)
  return React.useSyncExternalStore(subscribe, get, () => false)
}

const focusRow = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

/* ───────────────────────── componente ───────────────────────── */

export function Table<T>({
  columns,
  rows,
  getRowId,
  getRowLabel,
  label,
  title,
  countLabel,
  toolbar,
  actions,
  state = 'ready',
  emptyState,
  emptyTitle = 'Nenhum registro ainda',
  emptyText,
  emptyAction,
  errorText = 'Não foi possível carregar os dados.',
  onRetry,
  noResultsTitle = 'Nenhum resultado com esses filtros',
  onClearFilters,
  sort,
  onSortChange,
  selectable,
  selected,
  onSelectedChange,
  onRowClick,
  onRowActions,
  pagination,
  unit,
  totals,
  density = 'default',
  layout = 'auto',
  maxBodyHeight,
  className,
}: TableProps<T>) {
  const narrow = useMediaQuery('(max-width: 767px)')
  const asList = layout === 'list' || (layout === 'auto' && narrow)
  const compact = density === 'compact'
  const twoLine = columns.some((c) => c.secondary)
  const sel = selected ?? new Set<string>()
  const ids = rows.map(getRowId)
  const allOn = ids.length > 0 && ids.every((id) => sel.has(id))
  const someOn = !allOn && ids.some((id) => sel.has(id))
  const rowName = (r: T) => getRowLabel?.(r) ?? getRowId(r)

  const toggleAll = () => {
    const next = new Set(sel)
    if (allOn) ids.forEach((id) => next.delete(id))
    else ids.forEach((id) => next.add(id))
    onSelectedChange?.(next)
  }
  const toggleOne = (id: string) => {
    const next = new Set(sel)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectedChange?.(next)
  }

  /* navegação por setas: uma linha por vez na ordem de tabulação */
  const [active, setActive] = React.useState(0)
  const rowRefs = React.useRef<(HTMLElement | null)[]>([])
  const activeIdx = Math.min(active, Math.max(rows.length - 1, 0))
  const moveTo = (i: number) => {
    const n = Math.max(0, Math.min(rows.length - 1, i))
    setActive(n)
    rowRefs.current[n]?.focus()
  }
  const onRowKey = (e: React.KeyboardEvent<HTMLElement>, i: number, row: T) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowDown') (e.preventDefault(), moveTo(i + 1))
    else if (e.key === 'ArrowUp') (e.preventDefault(), moveTo(i - 1))
    else if (e.key === 'Home') (e.preventDefault(), moveTo(0))
    else if (e.key === 'End') (e.preventDefault(), moveTo(rows.length - 1))
    else if (e.key === 'Enter' && onRowClick) (e.preventDefault(), onRowClick(row))
    else if (e.key === ' ' && selectable) (e.preventDefault(), toggleOne(getRowId(row)))
  }

  const headerH = 'h-9'
  const rowH = compact ? 'h-10' : twoLine ? 'h-14' : 'h-12'
  const cellX = compact ? 'px-2' : 'px-3'
  const edge = 'first:pl-4 last:pr-4'

  /* ───── subcomponentes locais ───── */

  const actionButton = (row: T) =>
    onRowActions ? (
      <Tooltip content="Mais ações" side="left">
        <Button variant="ghost" size="sm" iconOnly icon={MoreHorizontal} aria-label={`Ações de ${rowName(row)}`} className="text-fg-3" onClick={(e) => (e.stopPropagation(), onRowActions(row))} />
      </Tooltip>
    ) : null

  const skeletonRows = (
    <tbody aria-hidden>
      {Array.from({ length: 8 }, (_, r) => (
        <tr key={r} className={cn(rowH, 'border-b border-hairline last:border-b-0')}>
          {selectable ? (
            <td className="w-12 pl-4">
              <Skeleton className="size-[18px]" />
            </td>
          ) : null}
          {columns.map((c, i) => (
            <td key={c.key} className={cn(cellX, selectable ? 'first:pl-3' : edge, i === columns.length - 1 && !onRowActions && 'pr-4')} style={{ minWidth: c.minWidth }}>
              <Skeleton className={cn(c.align === 'right' ? 'ml-auto w-16' : i === 0 ? 'w-3/4' : 'w-1/2')} />
            </td>
          ))}
          {onRowActions ? <td className="w-12 pr-4" /> : null}
        </tr>
      ))}
    </tbody>
  )

  const head = (
    <thead>
      <tr className={cn(headerH, 'border-b border-hairline')}>
        {selectable ? (
          <th scope="col" className={cn(headerH, 'sticky top-0 z-10 w-12 bg-raised pl-4 text-left')}>
            <Checkbox
              label={<span className="sr-only">Selecionar todas as linhas</span>}
              className="gap-0 py-0"
              checked={allOn}
              indeterminate={someOn}
              disabled={state !== 'ready' || rows.length === 0}
              onChange={toggleAll}
            />
          </th>
        ) : null}
        {columns.map((c) => {
          const on = sort?.key === c.key
          const ariaSort = c.sortable ? (on ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined
          const Arrow: LucideIcon | null = on ? (sort!.dir === 'asc' ? ArrowUp : ArrowDown) : null
          return (
            <th
              key={c.key}
              scope="col"
              aria-sort={ariaSort}
              style={{ width: c.width, minWidth: c.minWidth }}
              className={cn(headerH, cellX, edge, 'sticky top-0 z-10 bg-raised text-caption font-semibold whitespace-nowrap text-fg-3', c.align === 'right' ? 'text-right' : 'text-left', !selectable && 'first:pl-4')}
            >
              {c.sortable ? (
                <button
                  type="button"
                  onClick={() => onSortChange?.({ key: c.key, dir: on && sort!.dir === 'asc' ? 'desc' : 'asc' })}
                  className={cn(
                    'ds-touch -mx-1 inline-flex h-7 items-center gap-1 rounded-tip px-1 font-semibold transition-colors duration-150 hover:text-fg',
                    'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
                    c.align === 'right' && 'flex-row-reverse',
                    on && 'text-fg',
                  )}
                >
                  {c.header}
                  <span className="grid size-3.5 place-items-center text-fg-2">{Arrow ? <Arrow size={14} strokeWidth={2} aria-hidden /> : null}</span>
                  <span className="sr-only">{on ? (sort!.dir === 'asc' ? ', ordenado do menor para o maior' : ', ordenado do maior para o menor') : ', ordenar'}</span>
                </button>
              ) : (
                c.header
              )}
            </th>
          )
        })}
        {onRowActions ? (
          <th scope="col" className={cn(headerH, 'sticky top-0 z-10 w-12 bg-raised pr-4')}>
            <span className="sr-only">Ações</span>
          </th>
        ) : null}
      </tr>
    </thead>
  )

  const body = (
    <tbody>
      {rows.map((row, i) => {
        const id = getRowId(row)
        const on = sel.has(id)
        return (
          <tr
            key={id}
            ref={(el) => {
              rowRefs.current[i] = el
            }}
            tabIndex={i === activeIdx ? 0 : -1}
            data-selected={on || undefined}
            onFocus={(e) => e.target === e.currentTarget && setActive(i)}
            onKeyDown={(e) => onRowKey(e, i, row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              rowH,
              'border-b border-hairline transition-colors duration-150 last:border-b-0',
              focusRow,
              on ? 'bg-accent-soft' : 'hover:bg-hover',
              onRowClick && 'cursor-pointer',
            )}
          >
            {selectable ? (
              <td className="w-12 pl-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox label={<span className="sr-only">Selecionar {rowName(row)}</span>} className="gap-0 py-0" checked={on} onChange={() => toggleOne(id)} />
              </td>
            ) : null}
            {columns.map((c) => (
              <td key={c.key} style={{ width: c.width, minWidth: c.minWidth, maxWidth: c.minWidth ? Math.max(c.minWidth, 320) : undefined }} className={cn(cellX, edge, 'align-middle text-body text-fg', c.align === 'right' && 'text-right', c.minWidth && 'max-w-xs')}>
                <div className={cn('min-w-0', c.minWidth && 'truncate')} title={c.titleText?.(row)}>
                  {c.render(row)}
                </div>
                {c.secondary ? <div className="truncate text-caption text-fg-3">{c.secondary(row)}</div> : null}
              </td>
            ))}
            {onRowActions ? (
              <td className="w-12 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                {actionButton(row)}
              </td>
            ) : null}
          </tr>
        )
      })}
    </tbody>
  )

  const totalsRow = totals && state === 'ready' && rows.length > 0 ? (
    <tfoot>
      <tr className="h-12 border-t border-strong font-semibold">
        {selectable ? <td className="w-12" /> : null}
        {columns.map((c, i) => (
          <td key={c.key} className={cn(cellX, edge, 'text-body font-semibold text-fg', c.align === 'right' && 'text-right')}>
            {i === 0 && !totals.cells[c.key] ? totals.label : totals.cells[c.key]}
          </td>
        ))}
        {onRowActions ? <td className="w-12" /> : null}
      </tr>
    </tfoot>
  ) : null

  /* lista de linhas (celular) */
  const byRole = (role: MobileRole) => columns.find((c) => c.mobile === role)
  const listView = (
    <ul aria-label={label} aria-busy={state === 'loading' || undefined} className="m-0 list-none p-0">
      {state === 'loading'
        ? Array.from({ length: 8 }, (_, i) => (
            <li key={i} aria-hidden className="flex min-h-16 items-center justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <Skeleton className="w-3/5" />
                <Skeleton className="mt-2 h-3 w-2/5" />
              </div>
              <Skeleton className="w-16" />
            </li>
          ))
        : rows.map((row, i) => {
            const id = getRowId(row)
            const on = sel.has(id)
            const t = byRole('title')
            const s = byRole('secondary')
            const v = byRole('value')
            const st = byRole('status')
            return (
              <li
                key={id}
                ref={(el) => {
                  rowRefs.current[i] = el
                }}
                tabIndex={i === activeIdx ? 0 : -1}
                onFocus={(e) => e.target === e.currentTarget && setActive(i)}
                onKeyDown={(e) => onRowKey(e, i, row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('flex min-h-16 items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0', focusRow, on ? 'bg-accent-soft' : 'hover:bg-hover', onRowClick && 'cursor-pointer')}
              >
                {selectable ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox label={<span className="sr-only">Selecionar {rowName(row)}</span>} className="gap-0 py-0" checked={on} onChange={() => toggleOne(id)} />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body font-semibold">{(t ?? columns[0]).render(row)}</div>
                  {s ? <div className="truncate text-caption text-fg-3">{s.render(row)}</div> : (t ?? columns[0]).secondary ? <div className="truncate text-caption text-fg-3">{(t ?? columns[0]).secondary!(row)}</div> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  {v ? <div className="text-body font-semibold">{v.render(row)}</div> : null}
                  {st ? <div className="text-caption">{st.render(row)}</div> : null}
                </div>
                {onRowActions ? <div onClick={(e) => e.stopPropagation()}>{actionButton(row)}</div> : null}
              </li>
            )
          })}
      {totals && state === 'ready' && rows.length > 0 ? (
        <li className="flex min-h-12 items-center justify-between gap-4 border-t border-strong px-4 text-body font-semibold">
          <span>{totals.label ?? 'Total'}</span>
          <span>{totals.cells[byRole('value')?.key ?? ''] ?? null}</span>
        </li>
      ) : null}
    </ul>
  )

  const tableView = (
    <table aria-label={label} aria-busy={state === 'loading' || undefined} className="w-full min-w-max border-collapse text-left">
      {head}
      {state === 'loading' ? skeletonRows : body}
      {totalsRow}
    </table>
  )

  /* ───── rodapé ───── */
  let footer: React.ReactNode = null
  if (pagination && state === 'ready' && pagination.total > 0) {
    const { page, pageSize, total, onPageChange } = pagination
    const pages = Math.max(1, Math.ceil(total / pageSize))
    const from = (page - 1) * pageSize + 1
    const to = Math.min(total, page * pageSize)
    footer = (
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-hairline px-4 py-2">
        <p className="tnum text-caption text-fg-3" aria-live="polite">
          {from} a {to} de {total}
          {unit ? ` ${unit}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" iconOnly icon={ChevronLeft} aria-label="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
          <label className="flex items-center gap-2 text-caption text-fg-3">
            Página
            <Select aria-label="Página" size="md" value={page} onChange={(e) => onPageChange(Number(e.target.value))} className="h-8 w-[84px] text-body">
              {Array.from({ length: pages }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </Select>
            <span className="tnum">de {pages}</span>
          </label>
          <Button variant="secondary" size="sm" iconOnly icon={ChevronRight} aria-label="Próxima página" disabled={page >= pages} onClick={() => onPageChange(page + 1)} />
        </div>
      </div>
    )
  }

  /* ───── corpo conforme o estado ───── */
  let content: React.ReactNode
  if (state === 'empty') {
    content = (
      <div className="flex min-h-60 items-center justify-center">
        {emptyState ?? (
          <EmptyState title={emptyTitle} action={emptyAction}>
            {emptyText}
          </EmptyState>
        )}
      </div>
    )
  } else if (state === 'noResults') {
    content = (
      <div className="flex min-h-60 items-center justify-center">
        <EmptyState
          variant="search"
          icon={SearchX}
          title={noResultsTitle}
          action={
            onClearFilters ? (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  } else if (state === 'error') {
    content = (
      <div className="p-4">
        <Banner
          tone="danger"
          title="Não foi possível carregar."
          action={
            <Button size="sm" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        >
          {errorText}
        </Banner>
      </div>
    )
  } else {
    content = (
      <div className={cn(!asList && 'overflow-x-auto', maxBodyHeight && 'overflow-y-auto')} style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}>
        {asList ? listView : tableView}
      </div>
    )
  }

  const hasBar = title || toolbar || actions || countLabel
  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      {hasBar ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-hairline p-4">
          {title ? (
            <div className="mr-auto min-w-0">
              <h3 className="text-title-card">{title}</h3>
              {countLabel ? <p className="tnum text-caption text-fg-3">{countLabel}</p> : null}
            </div>
          ) : null}
          {toolbar ? <div className="flex min-w-0 flex-wrap items-center gap-2">{toolbar}</div> : null}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {content}
      {footer}
    </Card>
  )
}
