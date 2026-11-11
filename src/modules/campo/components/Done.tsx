import { useNavigate } from 'react-router-dom'
import { useLabels, type ServiceDetail } from '@/services'
import { Button, useCountUp } from '@/ui'
import { FieldActionBar } from '@/ui/FieldAction'
import { useCampoDay } from '../lib'
import { CheckMark } from './CheckMark'
import { CampoScreen } from './Screen'

export interface Summary {
  items: number
  photos: number
  damages: number
  queued: boolean
}

/** Tela de conclusão: check desenhado uma vez, três números e o caminho para o próximo serviço. */
export function Done({ service, summary }: { service: ServiceDetail; summary: Summary }) {
  const navigate = useNavigate()
  const l = useLabels()
  const { next } = useCampoDay()
  const other = next && next.id !== service.id ? next : undefined
  const nums = [
    { n: summary.items, label: 'itens' },
    { n: summary.photos, label: summary.photos === 1 ? 'foto' : 'fotos' },
    { n: summary.damages, label: summary.damages === 1 ? l.damage : l.damagePlural },
  ]
  return (
    <CampoScreen
      title={service.typeLabel}
      nav={false}
      actionBar={
        <FieldActionBar>
          <Button variant="primary" size="field" block onClick={() => navigate(other ? `/campo/servico/${other.id}` : '/campo')}>
            {other ? 'Próximo serviço' : 'Voltar para hoje'}
          </Button>
        </FieldActionBar>
      }
    >
      <div className="flex flex-col items-center pt-8 text-center">
        <CheckMark size={128} label="Serviço concluído" className="text-accent" />
        <h2 className="mt-6 text-title-field">Serviço concluído</h2>
      </div>
      <dl className="mt-8 grid grid-cols-3 gap-3">
        {nums.map((x) => (
          <Big key={x.label} n={x.n} label={x.label} />
        ))}
      </dl>
    </CampoScreen>
  )
}

function Big({ n, label }: { n: number; label: string }) {
  const v = Math.round(useCountUp(n))
  return (
    <div className="flex min-h-36 flex-col-reverse justify-between rounded-card bg-raised p-4">
      <dt className="text-body font-semibold text-fg-2">{label}</dt>
      <dd className="tnum text-[56px] leading-[56px] font-semibold tracking-[-0.03em] text-fg">{v}</dd>
    </div>
  )
}
