import * as React from 'react'
import { Check, HeartPulse, Speaker, Tent, Construction, type LucideIcon } from 'lucide-react'
import { Badge, Button, Dialog, cn, notify } from '@/ui'
import { SEGMENT_LIST, setSegment, useMutation, useSegment, type SegmentId } from '@/services'

const ICON: Record<SegmentId, LucideIcon> = { eventos: Tent, estruturas: Speaker, hospitalar: HeartPulse, maquinas: Construction }

export default function Pacote() {
  const active = useSegment()
  const [picked, setPicked] = React.useState<SegmentId>(active.id)
  const [confirm, setConfirm] = React.useState(false)
  const change = useMutation(setSegment)
  React.useEffect(() => setPicked(active.id), [active.id])

  const pack = SEGMENT_LIST.find((p) => p.id === picked) ?? active
  const L = pack.labels
  const names: [string, string][] = [
    ['Equipamento', L.equipment],
    ['Vários equipamentos', L.equipmentPlural],
    ['Cada item', L.unit],
    ['Limpeza', L.serviceTypes.limpeza],
    ['Entrega', L.serviceTypes.entrega],
    ['Retirada', L.serviceTypes.retirada],
    ['Avaria', L.damage],
  ]

  const apply = async () => {
    try {
      await change.run(picked)
      notify.success(`Pacote ${pack.name} ativado`)
      setConfirm(false)
    } catch {
      notify.error('Não foi possível trocar o pacote. Tente de novo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ul role="radiogroup" aria-label="Pacotes de segmento" className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        {SEGMENT_LIST.map((p) => {
          const Icon = ICON[p.id]
          const on = p.id === picked
          const isActive = p.id === active.id
          return (
            <li key={p.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPicked(p.id)}
                className={cn(
                  'flex h-full w-full items-center gap-4 rounded-card bg-raised p-5 text-left transition-[box-shadow,background-color] duration-150 ease-[var(--ease-ui)] hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6',
                  on ? 'ring-2 ring-accent ring-inset' : 'ring-1 ring-edge ring-inset',
                )}
              >
                <span aria-hidden className={cn('grid size-16 shrink-0 place-items-center rounded-pill', on ? 'ds-hero' : 'bg-accent-soft text-accent-ink')}>
                  <Icon size={30} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-title-sub">{p.name}</span>
                    {isActive ? (
                      <Badge tone="ok" icon={Check}>
                        Ativo
                      </Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-body text-fg-2">{p.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {picked !== active.id ? (
        <div className="flex justify-end">
          <Button variant="primary" size="lg" icon={Check} onClick={() => setConfirm(true)}>
            Usar o pacote {pack.name}
          </Button>
        </div>
      ) : null}

      <section aria-label={`Prévia do pacote ${pack.name}`} className="grid grid-cols-1 gap-6 rounded-card bg-raised p-5 sm:p-6 @min-[1180px]/frame:grid-cols-3">
        <div>
          <h2 className="text-title-sub">Nomes no sistema</h2>
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
            {names.map(([k, v]) => (
              <li key={k} className="rounded-pill bg-sunken py-1.5 pr-4 pl-3.5">
                <span className="text-caption text-fg-3">{k}</span>
                <span className="ml-2 text-body font-semibold">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-title-sub">Campos da ficha</h2>
          <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
            {pack.equipmentFields.map((f) => (
              <li key={f.key}>
                <Badge tone="accent">{f.unit ? `${f.label} (${f.unit})` : f.label}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-title-sub">Checklist de {L.cleaning}</h2>
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
            {pack.checklists.limpeza.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-body">
                <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill bg-ok-soft text-ok-ink">
                  <Check size={12} strokeWidth={3} />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        title={`Trocar para ${pack.name}?`}
        description="Os rótulos, os campos da ficha e os checklists mudam no sistema inteiro. Seus dados continuam os mesmos."
        confirmLabel="Trocar pacote"
        confirmLoading={change.loading}
        onConfirm={() => void apply()}
      />
    </div>
  )
}
