import * as React from 'react'
import { AlertTriangle, CloudOff, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { DAMAGE_STATUS } from '@/app/status'
import { today } from '@/domain/dates'
import { formatMoney } from '@/lib/format'
import { listDamages, listServices, useLabels, useQuery, useSegment } from '@/services'
import { Badge, Button, EmptyState, Field, Input, StatusDot } from '@/ui'
import { FieldActionBar } from '@/ui/FieldAction'
import { notify } from '@/ui/Toast'
import { DamageFields, parseValue } from './components/DamageForm'
import { CampoScreen, LoadFailed } from './components/Screen'
import { Sheet } from './components/Sheet'
import { useCampoDay, useUnits } from './lib'
import { submitDamage } from './sync'
import { useCampo, type DraftPhoto } from './store'

export default function Avarias() {
  const l = useLabels()
  const segment = useSegment()
  const [params, setParams] = useSearchParams()
  const { team } = useCampoDay()
  const units = useUnits()
  const dmg = useQuery(() => listDamages(), [])
  const svc = useQuery(() => listServices({ date: today() }), [])
  const mine = useCampo((s) => (team ? s.myDamages[team.id] : undefined))
  const queue = useCampo((s) => s.queue)

  const day = today()
  const teamServiceIds = new Set((svc.data ?? []).filter((s) => s.teamId === team?.id).map((s) => s.id))
  const list = (dmg.data ?? []).filter((d) => d.date === day && ((mine ?? []).includes(d.id) || (d.serviceId && teamServiceIds.has(d.serviceId))))
  const queuedDamages = queue.filter((q) => q.kind === 'damage' && q.teamId === team?.id)
  const total = list.reduce((a, d) => a + d.value, 0) + queuedDamages.reduce((a, q) => a + (q.kind === 'damage' ? q.input.value : 0), 0)
  const count = list.length + queuedDamages.length

  /* formulário */
  const open = params.get('nova') === '1'
  const [code, setCode] = React.useState(params.get('unidade') ?? '')
  const [kind, setKind] = React.useState('')
  const [valueText, setValueText] = React.useState('')
  const [photo, setPhoto] = React.useState<DraftPhoto | undefined>()
  const [saving, setSaving] = React.useState(false)
  const unit = units.find(code)
  const valid = !!unit && !!kind && parseValue(valueText) > 0
  const close = () => {
    const p = new URLSearchParams(params)
    p.delete('nova')
    p.delete('unidade')
    setParams(p, { replace: true })
  }
  React.useEffect(() => {
    const u = params.get('unidade')
    if (u) setCode(u)
  }, [params])

  const save = async () => {
    if (!unit || !team) return
    setSaving(true)
    try {
      const res = await submitDamage(team.id, { unitId: unit.id, kind, value: parseValue(valueText), photos: photo ? [{ src: photo.src, label: photo.label, moment: 'avaria' }] : [] }, `Avaria em ${unit.code}`)
      notify.success(res === 'fila' ? 'Avaria guardada, aguardando sinal' : 'Avaria registrada')
      setKind('')
      setValueText('')
      setPhoto(undefined)
      setCode('')
      close()
    } catch (e) {
      notify.error(e instanceof Error && e.message ? e.message : 'Não foi possível registrar. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const newBtn = (
    <FieldActionBar>
      <Button variant="primary" size="field" block icon={Plus} onClick={() => setParams({ nova: '1' }, { replace: true })}>
        Registrar avaria
      </Button>
    </FieldActionBar>
  )

  return (
    <CampoScreen title="Avarias" actionBar={newBtn}>
      {dmg.initialLoading || svc.initialLoading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span aria-hidden className="ds-skeleton block h-28 w-full rounded-card" />
          <span aria-hidden className="ds-skeleton block h-48 w-full rounded-card" />
        </div>
      ) : dmg.error && !dmg.data ? (
        <LoadFailed onRetry={() => void dmg.refetch()} />
      ) : (
        <>
          <section aria-label="Resumo de hoje" className="grid grid-cols-2 gap-3">
            <div className="flex flex-col-reverse rounded-card bg-raised p-5">
              <p className="text-body text-fg-2">Hoje</p>
              <p className="tnum text-kpi font-semibold">{count}</p>
            </div>
            <div className="flex flex-col-reverse rounded-card bg-raised p-5">
              <p className="text-body text-fg-2">Valor</p>
              <p className="tnum text-kpi font-semibold">{formatMoney(total)}</p>
            </div>
          </section>

          <h2 className="mt-6 mb-2 px-1 text-title-sub">Registradas hoje</h2>
          {count ? (
            <ul className="overflow-hidden rounded-card bg-raised">
              {queuedDamages.map((q) =>
                q.kind === 'damage' ? (
                  <li key={q.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3">
                    <span className="grid size-14 shrink-0 place-items-center rounded-tip bg-warn-soft text-warn-ink">
                      <CloudOff size={24} strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-lg font-semibold">{q.input.kind}</p>
                      <p className="tnum truncate text-body text-fg-2">{units.units.find((u) => u.id === q.input.unitId)?.code ?? ''}</p>
                      <Badge tone="warn" className="mt-1">
                        Aguardando sinal
                      </Badge>
                    </div>
                    <p className="tnum shrink-0 text-body-lg font-semibold">{formatMoney(q.input.value)}</p>
                  </li>
                ) : null,
              )}
              {list.map((d) => (
                <li key={d.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
                  <img src={d.photos[0]?.src ?? d.typePhoto} alt="" className="size-14 shrink-0 rounded-tip bg-sunken object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-lg font-semibold">{d.kind}</p>
                    <p className="tnum truncate text-body text-fg-2">
                      {d.unitCode}, {d.clientName}
                    </p>
                    <StatusDot tone={DAMAGE_STATUS[d.status].tone} className="mt-0.5 text-caption">
                      {DAMAGE_STATUS[d.status].label}
                    </StatusDot>
                  </div>
                  <p className="tnum shrink-0 text-body-lg font-semibold">{formatMoney(d.value)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-card bg-raised">
              <EmptyState icon={AlertTriangle} title={`As ${l.damagePlural} registradas pela equipe aparecem aqui`} />
            </div>
          )}
        </>
      )}

      <Sheet
        open={open}
        onOpenChange={(o) => !o && close()}
        title="Registrar avaria"
        footer={
          <Button variant="primary" size="field" block loading={saving} disabled={!valid} onClick={() => void save()}>
            Registrar avaria
          </Button>
        }
      >
        <div className="pt-2">
          <DamageFields
            units={[]}
            kinds={segment.damageKinds}
            unitId={unit?.id ?? ''}
            onUnitId={() => undefined}
            kind={kind}
            onKind={(k) => {
              setKind(k)
              if (unit && k) setValueText(String(Math.max(60, Math.round(unit.monthlyValue * (0.18 + 0.04 * (segment.damageKinds.indexOf(k) % 8))))))
            }}
            valueText={valueText}
            onValueText={setValueText}
            photo={photo}
            onPhoto={setPhoto}
            unitField={
              <Field label="Código da unidade" error={code.trim() && !unit && !units.initialLoading ? 'Código não encontrado' : undefined}>
                <Input size="lg" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BQ-0142" autoCapitalize="characters" autoComplete="off" />
                {unit ? <p className="mt-1.5 text-body font-semibold text-ok-ink">{unit.type.name}{unit.rental ? `, ${unit.rental.clientName}` : ''}</p> : null}
              </Field>
            }
          />
        </div>
      </Sheet>
    </CampoScreen>
  )
}
