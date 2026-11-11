import * as React from 'react'
import { Check, CheckCheck, Trash2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getService, listTypes, startService, useQuery, useSegment, type ServiceDetail } from '@/services'
import { formatMoney } from '@/lib/format'
import { Button, EmptyState, Field, Input, Segmented } from '@/ui'
import { FieldActionBar } from '@/ui/FieldAction'
import { SignaturePad } from '@/ui/SignaturePad'
import { Stepper } from '@/ui/Stepper'
import { notify } from '@/ui/Toast'
import { AddDamageButton, DamageFields, parseValue } from './components/DamageForm'
import { PhotoPicker } from './components/Photos'
import { CampoScreen, LoadFailed } from './components/Screen'
import { Done, type Summary } from './components/Done'
import { newId, useBack, useCampoDay } from './lib'
import { submitCompletion, type LocalDamage } from './sync'
import { useCampo, type Draft, type DraftDamage, type DraftPhoto } from './store'

const STEPS = [
  { id: 'checklist', label: 'Checklist' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'avaria', label: 'Avaria' },
  { id: 'assinatura', label: 'Assinatura' },
]
const TITLES = ['O que foi feito', 'Fotos do serviço', 'Teve avaria?', 'Quem recebeu']

export default function Registro() {
  const { id = '' } = useParams()
  const q = useQuery(() => getService(id), [id])
  const back = useBack(`/campo/servico/${id}`)
  const queuedItem = useCampo((s) => s.queue.find((i) => i.kind === 'complete' && i.serviceId === id))
  const [result, setResult] = React.useState<Summary | null>(null)
  const s = q.data

  const summary: Summary | null =
    result ??
    (queuedItem && queuedItem.kind === 'complete'
      ? { items: queuedItem.report.checklist.filter((c) => c.ok).length, photos: queuedItem.report.photos?.length ?? 0, damages: queuedItem.damageLocalIds.length, queued: true }
      : s?.status === 'concluido' && s.report
        ? { items: s.report.checklist.filter((c) => c.ok).length, photos: s.report.photos.length, damages: s.report.damageIds.length, queued: false }
        : null)

  if (q.initialLoading) {
    return (
      <CampoScreen title="Registro" onBack={back} nav={false}>
        <div aria-busy="true" className="flex flex-col gap-3">
          <span aria-hidden className="ds-skeleton block h-20 w-full rounded-card" />
          <span aria-hidden className="ds-skeleton block h-72 w-full rounded-card" />
        </div>
      </CampoScreen>
    )
  }
  if (!s) {
    return (
      <CampoScreen title="Registro" onBack={back} nav={false}>
        {q.error && !q.error.message.includes('não encontrado') ? (
          <LoadFailed onRetry={() => void q.refetch()} />
        ) : (
          <div className="rounded-card bg-raised">
            <EmptyState title="Serviço não encontrado" />
          </div>
        )}
      </CampoScreen>
    )
  }
  if (summary) return <Done service={s} summary={summary} />
  return <Wizard service={s} back={back} onDone={setResult} />
}

function Wizard({ service: s, back, onDone }: { service: ServiceDetail; back: () => void; onDone: (r: Summary) => void }) {
  const segment = useSegment()
  const types = useQuery(listTypes, [])
  const stored = useCampo((st) => st.drafts[s.id])
  const patchDraft = useCampo((st) => st.patchDraft)
  const clearDraft = useCampo((st) => st.clearDraft)
  const base = React.useCallback(
    (): Draft => ({ step: 0, checked: {}, photos: [], moment: 'antes', hasDamage: null, damages: [], signName: s.contact.name, signRole: s.contact.role, signature: null }),
    [s.contact.name, s.contact.role],
  )
  const d = stored ?? base()
  const patch = (p: Partial<Draft>) => patchDraft(s.id, base, p)
  const [saving, setSaving] = React.useState(false)

  /* abrir o registro é começar o serviço */
  const started = React.useRef(false)
  React.useEffect(() => {
    if (started.current || s.status === 'em_andamento') return
    started.current = true
    startService(s.id).catch(() => notify.error('Não foi possível iniciar. Tente de novo.'))
  }, [s.id, s.status])

  const items = s.checklistTemplate
  const rate = new Map((types.data ?? []).map((t) => [t.id, t.monthlyRate]))
  const damageUnits = s.units.map((u) => ({ id: u.id, code: u.code, monthlyRate: rate.get(u.typeId) ?? 0 }))

  /* subformulário da avaria (não vai para o rascunho) */
  const [unitId, setUnitId] = React.useState(damageUnits.length === 1 ? damageUnits[0].id : '')
  const [kind, setKind] = React.useState('')
  const [valueText, setValueText] = React.useState('')
  const [dPhoto, setDPhoto] = React.useState<DraftPhoto | undefined>()
  const formValid = !!unitId && !!kind && parseValue(valueText) > 0
  const unitFixed = damageUnits.length === 1 ? damageUnits[0].id : ''
  React.useEffect(() => {
    if (unitFixed && !unitId) setUnitId(unitFixed)
  }, [unitFixed, unitId])

  const addDamage = (): DraftDamage[] => {
    const u = damageUnits.find((x) => x.id === unitId)
    const item: DraftDamage = { localId: newId('dl'), unitId, unitCode: u?.code ?? '', kind, value: parseValue(valueText), photo: dPhoto }
    const next = [...d.damages, item]
    patch({ damages: next })
    setKind('')
    setValueText('')
    setDPhoto(undefined)
    if (!unitFixed) setUnitId('')
    return next
  }

  const step = d.step
  const checkedCount = items.filter((i) => d.checked[i]).length
  const allChecked = checkedCount === items.length
  const signOk = d.signName.trim().length > 0 && !!d.signature

  const canNext =
    step === 0
      ? true
      : step === 1
        ? d.photos.length >= 1
        : step === 2
          ? d.hasDamage === false || (d.hasDamage === true && (d.damages.length > 0 || formValid))
          : signOk

  const go = (n: number) => patch({ step: n })

  const conclude = async () => {
    let damages = d.damages
    if (d.hasDamage && formValid) damages = addDamage()
    if (d.hasDamage === false) damages = []
    setSaving(true)
    const local: LocalDamage[] = damages.map((x) => ({
      localId: x.localId,
      input: { unitId: x.unitId, kind: x.kind, value: x.value, serviceId: s.id, photos: x.photo ? [{ src: x.photo.src, label: x.photo.label, moment: 'avaria' as const }] : [] },
    }))
    try {
      const res = await submitCompletion(
        s.teamId,
        s.id,
        {
          checklist: items.map((label) => ({ label, ok: !!d.checked[label] })),
          photos: d.photos.map((p) => ({ src: p.src, label: p.label, moment: p.moment })),
          signature: { name: d.signName.trim(), role: d.signRole.trim(), dataUrl: d.signature ?? undefined },
          startedAt: s.startedAt,
        },
        local,
        `${s.typeLabel}, ${s.clientName}`,
      )
      clearDraft(s.id)
      onDone({ items: checkedCount, photos: d.photos.length, damages: damages.length, queued: res === 'fila' })
    } catch (e) {
      notify.error(e instanceof Error && e.message ? e.message : 'Não foi possível concluir. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const last = step === STEPS.length - 1
  const bar = (
    <FieldActionBar>
      <Button
        variant="primary"
        size="field"
        block
        icon={last ? CheckCheck : undefined}
        disabled={!canNext}
        loading={saving}
        onClick={() => {
          if (last) void conclude()
          else {
            if (step === 2 && d.hasDamage && formValid) addDamage()
            go(step + 1)
          }
        }}
      >
        {last ? 'Concluir serviço' : 'Continuar'}
      </Button>
    </FieldActionBar>
  )

  return (
    <CampoScreen title={`${s.typeLabel}, ${s.clientName}`} onBack={step > 0 ? () => go(step - 1) : back} actionBar={bar} nav={false}>
      <Stepper variant="field" steps={STEPS} current={step} title={TITLES[step]} />

      <div className="mt-5">
        {step === 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-body-lg text-fg-2">
                <strong className="tnum text-title-sub text-fg">{checkedCount}</strong> de {items.length}
              </p>
              <Button variant="secondary" size="md" className="min-h-12" icon={CheckCheck} onClick={() => patch({ checked: Object.fromEntries(items.map((i) => [i, !allChecked])) })}>
                {allChecked ? 'Desmarcar tudo' : 'Marcar tudo'}
              </Button>
            </div>
            <ul className="overflow-hidden rounded-card bg-raised">
              {items.map((label) => {
                const on = !!d.checked[label]
                return (
                  <li key={label} className="border-b border-hairline last:border-b-0">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => patch({ checked: { ...d.checked, [label]: !on } })}
                      className="flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-body-lg transition-colors duration-150 active:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      <span
                        aria-hidden
                        className={`grid size-8 shrink-0 place-items-center rounded-tip transition-colors duration-150 ${on ? 'bg-accent text-on-accent' : 'bg-sunken ring-2 ring-strong ring-inset'}`}
                      >
                        {on ? <Check size={20} strokeWidth={3} /> : null}
                      </span>
                      <span className={on ? 'text-fg-2 line-through decoration-fg-3' : 'text-fg'}>{label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <Segmented
              block
              label="Momento da foto"
              value={d.moment}
              onChange={(v) => patch({ moment: v })}
              options={[
                { value: 'antes', label: 'Antes' },
                { value: 'depois', label: 'Depois' },
              ]}
              className="h-12"
            />
            <PhotoPicker photos={d.photos} onChange={(photos) => patch({ photos })} label={d.moment === 'antes' ? 'Antes' : 'Depois'} moment={d.moment} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: true, label: 'Sim' },
                { v: false, label: 'Não' },
              ].map((o) => {
                const on = d.hasDamage === o.v
                return (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch(o.v ? { hasDamage: true } : { hasDamage: false, damages: [] })}
                    className={`h-16 rounded-card text-title-sub transition-[background-color,transform] duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${on ? 'bg-accent-soft text-accent-ink ring-2 ring-accent ring-inset' : 'bg-raised text-fg'}`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>

            {d.hasDamage ? (
              <>
                {d.damages.length ? (
                  <ul className="overflow-hidden rounded-card bg-raised">
                    {d.damages.map((x) => (
                      <li key={x.localId} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body-lg font-semibold">{x.kind}</p>
                          <p className="tnum truncate text-body text-fg-2">
                            {x.unitCode}, {formatMoney(x.value)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover avaria ${x.kind}`}
                          onClick={() => patch({ damages: d.damages.filter((y) => y.localId !== x.localId) })}
                          className="inline-flex size-12 shrink-0 items-center justify-center rounded-control text-fg-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Trash2 size={22} strokeWidth={2} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="rounded-card bg-raised p-4">
                  <DamageFields
                    units={damageUnits}
                    kinds={segment.damageKinds}
                    unitId={unitId}
                    onUnitId={(v) => {
                      setUnitId(v)
                      const u = damageUnits.find((x) => x.id === v)
                      if (kind && u) setValueText(String(Math.max(60, Math.round(u.monthlyRate * 0.3))))
                    }}
                    kind={kind}
                    onKind={setKind}
                    valueText={valueText}
                    onValueText={setValueText}
                    photo={dPhoto}
                    onPhoto={setDPhoto}
                  />
                  {d.damages.length || formValid ? (
                    <div className="mt-4">
                      <AddDamageButton disabled={!formValid} onClick={() => void addDamage()} />
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <Field label="Nome de quem recebeu">
              <Input size="lg" value={d.signName} onChange={(e) => patch({ signName: e.target.value })} autoComplete="off" />
            </Field>
            <Field label="Cargo">
              <Input size="lg" value={d.signRole} onChange={(e) => patch({ signRole: e.target.value })} autoComplete="off" />
            </Field>
            <SignatureBlock signature={d.signature} onChange={(v) => patch({ signature: v })} />
          </div>
        ) : null}
      </div>
    </CampoScreen>
  )
}

/** Assinatura: se veio do rascunho (recarregou a página), mostra a imagem com "Refazer"; senão, o quadro de desenho. */
function SignatureBlock({ signature, onChange }: { signature: string | null; onChange: (v: string | null) => void }) {
  const [restored, setRestored] = React.useState(() => !!signature)
  if (restored && signature) {
    return (
      <div>
        <p className="mb-1.5 text-body font-semibold">Assinatura</p>
        <div className="overflow-hidden rounded-card bg-white p-2 ring-1 ring-edge ring-inset">
          <img src={signature} alt="Assinatura de quem recebeu" className="mx-auto h-32 w-full object-contain" />
        </div>
        <Button
          variant="secondary"
          size="md"
          className="mt-2 min-h-12"
          onClick={() => {
            onChange(null)
            setRestored(false)
          }}
        >
          Refazer assinatura
        </Button>
      </div>
    )
  }
  return <SignaturePad height={200} onChange={onChange} />
}
