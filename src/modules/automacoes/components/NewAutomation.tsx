import * as React from 'react'
import { AUTOMATION_ACTIONS, AUTOMATION_CHANNELS, AUTOMATION_TRIGGERS, createAutomation, useLabels, useMutation } from '@/services'
import type { AutomationChannel } from '@/domain/types'
import { Button, Drawer, Field, Input, Segmented, cn, notify } from '@/ui'
import { Flow, segText } from './Flow'
import { iconFor } from './icons'

function Choice({ icon, label, selected, onClick }: { icon: string; label: string; selected: boolean; onClick: () => void }) {
  const Icon = iconFor(icon)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'ds-touch flex items-center gap-3 rounded-[16px] p-2.5 pr-3 text-left transition-[background-color,box-shadow] duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected ? 'bg-accent-soft ring-2 ring-accent' : 'bg-sunken hover:bg-hover',
      )}
    >
      <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center rounded-pill', selected ? 'ds-hero text-on-accent' : 'bg-raised text-fg-2')}>
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0 text-caption leading-4 font-medium text-fg">{label}</span>
    </button>
  )
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** Construtor visual: Quando, Fazer, Por onde, com a prévia do fluxo se montando no topo. */
export function NewAutomation({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const [trigger, setTrigger] = React.useState('')
  const [action, setAction] = React.useState('')
  const [channel, setChannel] = React.useState<AutomationChannel>('email')
  const [name, setName] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const create = useMutation(createAutomation)
  const labels = useLabels()

  const t = AUTOMATION_TRIGGERS.find((x) => x.kind === trigger)
  const a = AUTOMATION_ACTIONS.find((x) => x.kind === action)

  React.useEffect(() => {
    if (open) return
    setTrigger('')
    setAction('')
    setChannel('email')
    setName('')
    setTouched(false)
  }, [open])
  React.useEffect(() => {
    if (!touched) setName(t && a ? `${t.label}: ${lowerFirst(segText(a.label, labels))}` : '')
  }, [t, a, touched, labels])

  const save = async () => {
    try {
      const rec = await create.run({ name, triggerKind: trigger, actionKind: action, channel })
      notify.success('Automação criada')
      onOpenChange(false)
      onCreated(rec.id)
    } catch (e) {
      notify.error(e instanceof Error && e.message ? e.message : 'Não foi possível criar. Tente de novo.')
    }
  }

  const ready = !!t && !!a && !!name.trim()
  const group = 'grid grid-cols-1 gap-2 min-[420px]:grid-cols-2'

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      width={640}
      title="Nova automação"
      footer={
        <Button variant="primary" size="lg" loading={create.loading} disabled={!ready} onClick={save}>
          Criar automação
        </Button>
      }
    >
      <div className="sticky -top-4 z-[1] -mx-6 -mt-4 mb-5 bg-overlay px-6 pt-4 pb-4">
        <Flow triggerKind={trigger || undefined} triggerLabel={t?.label} actionKind={action || undefined} actionLabel={a?.label} size={60} />
      </div>

      <h3 className="mb-2 text-title-card">Quando</h3>
      <div role="radiogroup" aria-label="Quando" className={group}>
        {AUTOMATION_TRIGGERS.map((x) => (
          <Choice key={x.kind} icon={x.icon} label={x.label} selected={x.kind === trigger} onClick={() => setTrigger(x.kind)} />
        ))}
      </div>

      <h3 className="mt-6 mb-2 text-title-card">Fazer</h3>
      <div role="radiogroup" aria-label="Fazer" className={group}>
        {AUTOMATION_ACTIONS.map((x) => (
          <Choice key={x.kind} icon={x.icon} label={segText(x.label, labels)} selected={x.kind === action} onClick={() => setAction(x.kind)} />
        ))}
      </div>

      <h3 className="mt-6 mb-2 text-title-card">Por onde</h3>
      <Segmented
        label="Por onde"
        block
        size="sm"
        className="max-sm:hidden"
        value={channel}
        onChange={(v) => setChannel(v)}
        options={AUTOMATION_CHANNELS.map((c) => ({ value: c.value, label: c.label }))}
      />
      <div role="radiogroup" aria-label="Por onde" className="grid grid-cols-2 gap-2 sm:hidden">
        {AUTOMATION_CHANNELS.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={c.value === channel}
            onClick={() => setChannel(c.value)}
            className={cn('ds-touch rounded-[16px] px-3 py-2 text-caption leading-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', c.value === channel ? 'bg-accent-soft text-accent-ink ring-2 ring-accent' : 'bg-sunken text-fg-2')}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Field label="Nome">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setTouched(true)
            }}
          />
        </Field>
      </div>
    </Drawer>
  )
}
