import * as React from 'react'
import { Flag, Mail, MessageCircle, Plus, Save, Trash2 } from 'lucide-react'
import { Banner, Button, Field, Input, Segmented, Select, Skeleton, Switch, Textarea, WhatsAppPreview, cn, notify } from '@/ui'
import { formatDate, formatMoney } from '@/lib/format'
import { getDunning, saveDunning, useMutation, useQuery, useSettings } from '@/services'
import type { ChargeView, DunningStep } from '@/services'
import { errMessage } from '../lib'

type Dir = 'antes' | 'no_dia' | 'depois'

const dirOf = (n: number): Dir => (n < 0 ? 'antes' : n > 0 ? 'depois' : 'no_dia')

function offsetLabel(n: number) {
  if (n === 0) return 'No dia'
  const d = Math.abs(n)
  return `${d} ${d === 1 ? 'dia' : 'dias'} ${n < 0 ? 'antes' : 'depois'}`
}

/** Troca {cliente}, {codigo}... pelos dados de uma cobrança real (ou de exemplo). */
function fill(template: string, sample?: ChargeView) {
  const vars: Record<string, string> = {
    cliente: sample?.clientName ?? 'Construtora Planalto',
    codigo: sample?.code ?? 'COB-5021',
    valor: formatMoney(sample?.value ?? 1260),
    vencimento: sample ? formatDate(sample.dueAt) : '15/11/2026',
    link: 'pagar.r8.app/5021',
  }
  return template.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m)
}

/** Régua de cobrança: linha do tempo em relação ao vencimento, com edição de cada passo. */
export function Dunning({ sample }: { sample?: ChargeView }) {
  const q = useQuery(getDunning, [])
  const save = useMutation(saveDunning)
  const company = useSettings().company.name
  const [draft, setDraft] = React.useState<DunningStep[]>([])
  const [dirty, setDirty] = React.useState(false)
  const [selected, setSelected] = React.useState<string | null>(null)
  const seq = React.useRef(0)

  React.useEffect(() => {
    if (q.data && !dirty) setDraft(q.data)
  }, [q.data, dirty])

  const sorted = React.useMemo(() => [...draft].sort((a, b) => a.dayOffset - b.dayOffset), [draft])
  const sel = draft.find((s) => s.id === selected) ?? null
  const hasDueDay = draft.some((s) => s.dayOffset === 0)

  const patch = (id: string, p: Partial<DunningStep>) => {
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...p } : s)))
    setDirty(true)
  }
  const add = () => {
    const id = `novo-${++seq.current}`
    const next = draft.length ? Math.max(...draft.map((s) => s.dayOffset)) + 5 : 1
    setDraft((d) => [...d, { id, dayOffset: next, channel: 'whatsapp', enabled: true, template: 'Olá, {cliente}. Não encontramos o pagamento da cobrança {codigo} ({valor}). Pix: {link}' }])
    setSelected(id)
    setDirty(true)
  }
  const remove = (id: string) => {
    setDraft((d) => d.filter((s) => s.id !== id))
    setSelected(null)
    setDirty(true)
  }
  const doSave = async () => {
    if (draft.some((s) => !s.template.trim())) return notify.error('Todo passo precisa de uma mensagem.')
    try {
      await save.run(draft.map((s) => (s.id.startsWith('novo-') ? { ...s, id: '' } : s)))
      setDirty(false)
      setSelected(null)
      notify.success('Régua de cobrança salva')
    } catch (e) {
      notify.error(errMessage(e, 'Não foi possível salvar a régua. Tente de novo.'))
    }
  }

  // marcos: passos ordenados e, se não há passo no dia, o marco do vencimento no lugar certo
  type Mark = { kind: 'step'; step: DunningStep } | { kind: 'due' }
  const marks: Mark[] = []
  let dueDone = hasDueDay
  for (const s of sorted) {
    if (!dueDone && s.dayOffset > 0) {
      marks.push({ kind: 'due' })
      dueDone = true
    }
    marks.push({ kind: 'step', step: s })
  }
  if (!dueDone) marks.push({ kind: 'due' })

  return (
    <section aria-label="Régua de cobrança" className="min-w-0 rounded-card bg-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title-sub">Régua de cobrança</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={Plus} onClick={add} disabled={q.initialLoading}>
            Adicionar passo
          </Button>
          <Button variant="primary" size="sm" icon={Save} loading={save.loading} disabled={!dirty} onClick={doSave}>
            Salvar
          </Button>
        </div>
      </div>

      {q.error && !q.data ? (
        <Banner
          tone="danger"
          title="Não foi possível carregar a régua."
          className="mt-4"
          action={
            <Button variant="secondary" size="sm" onClick={() => void q.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : q.initialLoading ? (
        <div role="status" aria-busy="true" aria-label="Carregando régua" className="mt-6 flex gap-6 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex w-36 shrink-0 flex-col items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton shape="circle" className="size-12" />
              <Skeleton className="h-5 w-10" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <ol className="relative mt-6 flex list-none gap-0 overflow-x-auto pb-2">
            {marks.map((m, i) => {
              const first = i === 0
              const last = i === marks.length - 1
              const lineCls = 'absolute top-[41px] h-0.5 bg-edge'
              return (
                <li key={m.kind === 'due' ? 'due' : m.step.id} className="relative flex min-w-[148px] flex-1 flex-col items-center gap-2">
                  {!first ? <span aria-hidden className={cn(lineCls, 'right-1/2 left-0')} /> : null}
                  {!last ? <span aria-hidden className={cn(lineCls, 'right-0 left-1/2')} /> : null}
                  {m.kind === 'due' ? (
                    <>
                      <span className="text-caption font-semibold text-fg-3">Vencimento</span>
                      <span aria-hidden className="relative grid size-12 place-items-center rounded-pill bg-inverse text-on-inverse">
                        <Flag size={20} strokeWidth={2} />
                      </span>
                      <span className="h-9" />
                    </>
                  ) : (
                    <>
                      <span className={cn('text-caption font-semibold', m.step.enabled ? 'text-fg' : 'text-fg-3')}>{offsetLabel(m.step.dayOffset)}</span>
                      <button
                        type="button"
                        onClick={() => setSelected(m.step.id === selected ? null : m.step.id)}
                        aria-pressed={m.step.id === selected}
                        aria-label={`Editar passo: ${offsetLabel(m.step.dayOffset)}, ${m.step.channel === 'email' ? 'e-mail' : 'WhatsApp'}`}
                        className={cn(
                          'ds-touch ds-touch-sq relative grid size-12 place-items-center rounded-pill transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-ui)]',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                          m.step.enabled ? 'bg-accent-soft text-accent-ink hover:bg-accent hover:text-on-accent' : 'bg-sunken text-fg-3 hover:bg-hover',
                          m.step.id === selected && 'shadow-[0_0_0_2px_var(--raised),0_0_0_4px_var(--accent)]',
                        )}
                      >
                        {m.step.channel === 'email' ? <Mail size={20} strokeWidth={2} aria-hidden /> : <MessageCircle size={20} strokeWidth={2} aria-hidden />}
                      </button>
                      <Switch
                        checked={m.step.enabled}
                        onCheckedChange={(v) => patch(m.step.id, { enabled: v })}
                        label={<span className="sr-only">{`Passo ${offsetLabel(m.step.dayOffset)} ligado`}</span>}
                        className="min-h-9 justify-center gap-0 py-0"
                      />
                    </>
                  )}
                </li>
              )
            })}
          </ol>

          {sel ? (
            <div className="mt-5 grid grid-cols-1 gap-6 border-t border-hairline pt-5 @min-[1180px]/frame:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-body font-semibold">Canal</span>
                  <Segmented<DunningStep['channel']>
                    label="Canal do passo"
                    value={sel.channel}
                    onChange={(v) => patch(sel.id, { channel: v })}
                    options={[
                      { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                      { value: 'email', label: 'E-mail', icon: Mail },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quando">
                    <Select
                      value={dirOf(sel.dayOffset)}
                      onChange={(e) => {
                        const d = e.target.value as Dir
                        const n = Math.abs(sel.dayOffset) || 1
                        patch(sel.id, { dayOffset: d === 'antes' ? -n : d === 'depois' ? n : 0 })
                      }}
                    >
                      <option value="antes">Antes do vencimento</option>
                      <option value="no_dia">No dia</option>
                      <option value="depois">Depois do vencimento</option>
                    </Select>
                  </Field>
                  <Field label="Dias">
                    <Input
                      numeric
                      type="number"
                      min={1}
                      max={90}
                      disabled={sel.dayOffset === 0}
                      value={sel.dayOffset === 0 ? '' : Math.abs(sel.dayOffset)}
                      onChange={(e) => {
                        const n = Math.max(1, Math.min(90, Number(e.target.value) || 1))
                        patch(sel.id, { dayOffset: sel.dayOffset < 0 ? -n : n })
                      }}
                    />
                  </Field>
                </div>
                <Field label="Mensagem" help="Use {cliente}, {codigo}, {valor}, {vencimento} e {link}.">
                  <Textarea rows={5} value={sel.template} onChange={(e) => patch(sel.id, { template: e.target.value })} />
                </Field>
                <div>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(sel.id)}>
                    Remover passo
                  </Button>
                </div>
              </div>
              <div className="min-w-0">
                {sel.channel === 'whatsapp' ? (
                  <WhatsAppPreview from={company} message={fill(sel.template, sample)} />
                ) : (
                  <div className="rounded-card bg-sunken p-5">
                    <p className="flex items-center gap-2 text-caption font-semibold text-fg-3">
                      <Mail size={14} strokeWidth={2} aria-hidden />
                      E-mail de {company}
                    </p>
                    <p className="mt-3 text-body break-words whitespace-pre-wrap">{fill(sel.template, sample)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
