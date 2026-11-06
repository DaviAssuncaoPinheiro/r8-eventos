// Etapa 1: unidades atendidas (limpeza e manutenção) ou conferência de itens (montagem e retirada)
import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Minus, Plus, QrCode, ScanLine, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductThumb, Ring } from '@/components/ui'
import { PRODUCT, type ProductId } from '@/data/mock'
import { jobItems } from '@/lib/fieldkit'
import { OCC_KIND } from '@/lib/status'
import { useDemo } from '@/store'
import { notify } from './campoStore'
import { jobUnits } from './data'
import { EASE_OUT, Pressable } from './kit'
import { Block, StepFrame, StepIntro, type StepProps } from './stepKit'

export function StepUnidades(props: StepProps) {
  if (props.job.type === 'Montagem' || props.job.type === 'Retirada') return <Conferencia {...props} />
  return <Unidades {...props} />
}

/* ───────────── limpeza e manutenção ───────────── */

function Unidades({ job, rental, draft, patch, layout, eyebrow }: StepProps) {
  const units = jobUnits(job, rental)
  const occurrences = useDemo((s) => s.occurrences)
  const open = occurrences.filter((o) => o.rentalId === rental.id && o.status === 'aberta')
  const maint = job.type === 'Manutenção'
  const done = units.filter((u) => draft.units[u.id]).length
  const [lastRead, setLastRead] = React.useState<string | null>(null)

  const toggle = (id: string) => patch((d) => ({ units: { ...d.units, [id]: !d.units[id] } }))
  const readQr = () => {
    const next = units.find((u) => !draft.units[u.id])
    if (!next) {
      notify({ kind: 'app', title: 'Todas as unidades lidas', body: `${units.length} de ${units.length} conferidas.` })
      return
    }
    patch((d) => ({ units: { ...d.units, [next.id]: true } }))
    setLastRead(next.id)
  }
  const all = () => patch({ units: Object.fromEntries(units.map((u) => [u.id, true])) })

  const left = (
    <Block
      title={maint ? 'Unidade consertada' : 'Unidades'}
      hint={units.length ? `${done} de ${units.length} ${maint ? 'marcadas' : 'feitas'}` : 'Sem patrimônio cadastrado'}
      action={
        !maint && units.length > 0 && done < units.length ? (
          <button onClick={all} className="h-9 shrink-0 rounded-full bg-muted px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-muted-2">
            Marcar todas
          </button>
        ) : undefined
      }
    >
      <Pressable onClick={readQr} className="flex h-[60px] w-full items-center justify-center gap-3 rounded-full bg-black text-[16px] font-semibold text-white">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white">
          <ScanLine className="size-5" strokeWidth={2.2} />
        </span>
        Ler QR da porta
      </Pressable>
      <AnimatePresence initial={false}>
        {lastRead && (
          <motion.div key={lastRead} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="overflow-hidden">
            <div className="mt-2.5 flex items-center gap-2 rounded-full bg-green-soft px-3.5 py-2 text-[13.5px] font-semibold text-ink">
              <Check className="size-4 text-green" strokeWidth={2.6} />
              <span className="num">{lastRead}</span> lida e marcada
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" data-noswipe>
        {units.map((u) => {
          const on = !!draft.units[u.id]
          const occ = open.find((o) => o.unitId === u.id)
          return (
            <li key={u.id}>
              <Pressable
                scale={0.96}
                onClick={() => toggle(u.id)}
                aria-pressed={on}
                className={cn('relative flex h-[68px] w-full items-center gap-2.5 rounded-[20px] px-3 text-left transition-colors', on ? 'bg-black text-white' : 'bg-muted text-ink')}
              >
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', on ? 'bg-brand text-white' : 'bg-card text-ink-3')}>
                  {on ? <Check className="size-4" strokeWidth={3} /> : <QrCode className="size-4" strokeWidth={2} />}
                </span>
                <span className="min-w-0">
                  <span className="num block text-[15px] font-bold">{u.id}</span>
                </span>
                {occ && <span className="absolute top-2 right-2 size-2.5 rounded-full bg-red ring-2 ring-card" title={OCC_KIND[occ.kind].label} />}
              </Pressable>
            </li>
          )
        })}
      </ul>
    </Block>
  )

  const right = (
    <>
      <Block title="Andamento" hint={rental.title}>
        <div className="flex items-center gap-4">
          <Ring value={units.length ? done / units.length : 0} size={76} stroke={7} color={done === units.length && units.length ? 'var(--color-green)' : 'var(--color-brand)'}>
            <span className="num text-[18px] font-bold text-ink">
              {done}/{units.length}
            </span>
          </Ring>
          <div className="min-w-0 text-[14px] font-medium text-ink-2">
            {done === units.length && units.length ? (
              <span className="font-semibold text-ink">Todas as unidades {maint ? 'conferidas' : 'feitas'}.</span>
            ) : (
              <>
                <span className="font-semibold text-ink">Faltam {units.length - done}.</span>{' '}
                <span className="num">
                  {units
                    .filter((u) => !draft.units[u.id])
                    .slice(0, 6)
                    .map((u) => u.id)
                    .join(', ')}
                  {units.length - done > 6 ? '…' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </Block>
      {open.length > 0 && (
        <section className={cn(layout === 'desktop' ? '' : 'mx-4 mt-3', 'rounded-[24px] bg-red-soft p-4')}>
          <div className="flex items-center gap-2 text-[13.5px] font-bold text-red">
            <span className="flex size-6 items-center justify-center rounded-full bg-red text-white">
              <TriangleAlert className="size-3.5" strokeWidth={2.4} />
            </span>
            Avisos abertos neste local
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {open.map((o) => (
              <div key={o.id} className="flex items-center gap-2.5 rounded-full bg-card/80 py-1.5 pr-3.5 pl-1.5">
                <span className="num inline-flex h-7 items-center rounded-full bg-card px-2.5 text-[12.5px] font-bold text-ink shadow-pill">{o.unitId}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{OCC_KIND[o.kind].label}</span>
                <span className="shrink-0 text-[12px] font-semibold text-red">{o.source === 'qr' ? 'QR' : 'Equipe'}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12.5px] font-medium text-ink-2">Marque como resolvido na etapa Ocorrências.</p>
        </section>
      )}
    </>
  )

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow={eyebrow} title={maint ? 'Unidade' : 'Unidades'}>
          {maint ? 'Leia o QR da unidade que recebeu o conserto' : 'Leia o QR de cada porta ou toque para marcar'}
        </StepIntro>
      }
      left={left}
      right={right}
    />
  )
}

/* ───────────── montagem e retirada ───────────── */

function Conferencia({ job, draft, patch, layout, eyebrow }: StepProps) {
  const items = jobItems(job)
  const ret = job.type === 'Retirada'
  const set = (pid: ProductId, n: number, max: number) => patch((d) => ({ items: { ...d.items, [pid]: Math.max(0, Math.min(max, n)) } }))
  const okCount = items.filter((i) => (draft.items[i.productId] ?? 0) === i.qty).length
  const totalPlanned = items.reduce((a, i) => a + i.qty, 0)
  const totalDone = items.reduce((a, i) => a + (draft.items[i.productId] ?? 0), 0)

  const left = (
    <Block
      title={ret ? 'Recolhido' : 'Entregue'}
      hint={`${okCount} de ${items.length} ${items.length === 1 ? 'item confere' : 'itens conferem'}`}
      action={
        okCount < items.length ? (
          <button onClick={() => patch({ items: Object.fromEntries(items.map((i) => [i.productId, i.qty])) })} className="h-9 shrink-0 rounded-full bg-muted px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-muted-2">
            Tudo confere
          </button>
        ) : undefined
      }
      bodyClassName="px-3"
    >
      <ul className="flex flex-col" data-noswipe>
        {items.map((it, i) => {
          const p = PRODUCT[it.productId]
          const n = draft.items[it.productId] ?? 0
          const ok = n === it.qty
          const big = it.qty >= 20
          return (
            <li key={it.productId} className={cn('flex items-center gap-3 px-2 py-3', i > 0 && 'border-t border-line')}>
              <ProductThumb productId={it.productId} size={48} rounded="xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-ink">{p.short}</div>
                <div className={cn('text-[12.5px] font-semibold', ok ? 'text-green' : n > 0 ? 'text-yellow-ink' : 'text-ink-3')}>
                  {ok ? 'Confere' : `Previsto ${it.qty.toLocaleString('pt-BR')}`}
                  {!ok && n > 0 && ` · faltam ${(it.qty - n).toLocaleString('pt-BR')}`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Pressable scale={0.88} aria-label={`Menos ${p.short}`} onClick={() => set(it.productId, n - (big ? 10 : 1), it.qty)} className="flex size-10 items-center justify-center rounded-full bg-muted text-ink">
                  <Minus className="size-4" strokeWidth={2.4} />
                </Pressable>
                <span className={cn('num w-12 text-center text-[19px] font-bold', ok ? 'text-ink' : 'text-ink-2')}>{n.toLocaleString('pt-BR')}</span>
                <Pressable scale={0.88} aria-label={`Mais ${p.short}`} onClick={() => set(it.productId, n + (big ? 10 : 1), it.qty)} className="flex size-10 items-center justify-center rounded-full bg-black text-white">
                  <Plus className="size-4" strokeWidth={2.4} />
                </Pressable>
              </div>
            </li>
          )
        })}
      </ul>
    </Block>
  )

  const right = (
    <Block title="Total" hint={ret ? 'Peças e unidades recolhidas' : 'Peças e unidades entregues'}>
      <div className="flex items-center gap-4">
        <Ring value={totalPlanned ? totalDone / totalPlanned : 0} size={76} stroke={7} color={okCount === items.length ? 'var(--color-green)' : 'var(--color-brand)'}>
          <span className="num text-[15px] font-bold text-ink">{Math.round((totalDone / Math.max(1, totalPlanned)) * 100)}%</span>
        </Ring>
        <div className="text-[14px] font-medium text-ink-2">
          <div className="num text-[22px] font-bold tracking-[-0.02em] text-ink">
            {totalDone.toLocaleString('pt-BR')} <span className="text-[15px] font-semibold text-ink-3">de {totalPlanned.toLocaleString('pt-BR')}</span>
          </div>
          {okCount === items.length ? 'Tudo confere com o contrato.' : 'Itens com diferença saem no relatório do cliente.'}
        </div>
      </div>
    </Block>
  )

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow={eyebrow} title="Conferência">
          {ret ? 'Conte o que volta para a base' : 'Conte o que ficou montado no local'}
        </StepIntro>
      }
      left={left}
      right={right}
    />
  )
}
