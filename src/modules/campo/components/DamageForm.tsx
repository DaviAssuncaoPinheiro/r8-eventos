import * as React from 'react'
import { Plus } from 'lucide-react'
import { formatMoney, parseMoney } from '@/lib/format'
import { Button, Field, Input, Select } from '@/ui'
import { suggestDamageValue } from '../lib'
import type { DraftPhoto } from '../store'
import { newPhoto, PhotoPicker } from './Photos'

export interface DamageUnit {
  id: string
  code: string
  monthlyRate: number
}

export interface DamageValues {
  unitId: string
  unitCode: string
  kind: string
  value: number
  photo?: DraftPhoto
}

/** Campos da avaria: unidade (lista), tipo, valor sugerido editável e uma foto. */
export function DamageFields({
  units,
  kinds,
  unitId,
  onUnitId,
  kind,
  onKind,
  valueText,
  onValueText,
  photo,
  onPhoto,
  unitField,
}: {
  units: DamageUnit[]
  kinds: string[]
  unitId: string
  onUnitId: (v: string) => void
  kind: string
  onKind: (v: string) => void
  valueText: string
  onValueText: (v: string) => void
  photo?: DraftPhoto
  onPhoto: (p?: DraftPhoto) => void
  /** Substitui o seletor de unidade (avaria avulsa: digitar o código). */
  unitField?: React.ReactNode
}) {
  const unit = units.find((u) => u.id === unitId)
  const pick = (k: string) => {
    onKind(k)
    if (unit && k) onValueText(String(suggestDamageValue(k, kinds, unit.monthlyRate)).replace('.', ','))
  }
  return (
    <div className="flex flex-col gap-4">
      {unitField ?? (
        <Field label="Unidade">
          <Select size="lg" value={unitId} onChange={(e) => onUnitId(e.target.value)} placeholder="Escolha a unidade">
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Tipo de avaria">
        <Select size="lg" value={kind} onChange={(e) => pick(e.target.value)} placeholder="Escolha o tipo">
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Valor">
        <Input size="lg" numeric prefix="R$" inputMode="decimal" value={valueText} onChange={(e) => onValueText(e.target.value)} placeholder="0,00" />
      </Field>
      <div>
        <p className="mb-1.5 text-body font-semibold">Foto da avaria</p>
        <PhotoPicker photos={photo ? [photo] : []} onChange={(p) => onPhoto(p[p.length - 1] ? { ...p[p.length - 1], moment: 'avaria', label: 'Avaria' } : undefined)} label="Avaria" moment="avaria" max={1} />
      </div>
    </div>
  )
}

export function parseValue(text: string): number {
  return parseMoney(text) ?? 0
}

export function valueLabel(n: number) {
  return formatMoney(n)
}

export function AddDamageButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button variant="secondary" size="field" icon={Plus} block disabled={disabled} onClick={onClick}>
      Adicionar avaria
    </Button>
  )
}

export { newPhoto }
