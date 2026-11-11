import { CloudOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLabels, type ServiceDetail } from '@/services'
import { Badge, Button } from '@/ui'
import { FieldActionBar } from '@/ui/FieldAction'
import { useCampoDay } from '../lib'
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
    { n: summary.items, label: 'itens conferidos' },
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
      <div className="flex flex-col items-center pt-6 text-center">
        <svg viewBox="0 0 96 96" width="112" height="112" role="img" aria-label="Serviço concluído" className="text-accent">
          <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" pathLength={1} className="ds-arc" transform="rotate(-90 48 48)" />
          <path d="M30 50 L43 63 L67 36" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="ds-arc" style={{ animationDelay: '350ms' }} />
        </svg>
        <h2 className="mt-5 text-title-field">Serviço concluído</h2>
        <p className="mt-1 text-body-lg text-fg-2">{service.clientName}</p>
        {summary.queued ? (
          <Badge tone="warn" icon={CloudOff} className="mt-3">
            Aguardando sinal
          </Badge>
        ) : null}
      </div>
      <dl className="mt-8 grid grid-cols-3 gap-3">
        {nums.map((x) => (
          <div key={x.label} className="flex min-h-28 flex-col-reverse justify-between rounded-card bg-raised p-4">
            <dt className="text-caption font-semibold text-fg-2">{x.label}</dt>
            <dd className="tnum text-kpi font-semibold">{x.n}</dd>
          </div>
        ))}
      </dl>
    </CampoScreen>
  )
}
