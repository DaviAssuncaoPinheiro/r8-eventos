import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, Search } from 'lucide-react'
import { Button, Card, IconCircle, RentalAvatar } from '@/components/ui'
import { RENTAL, RENTALS } from '@/data/mock'
import { useDemo } from '@/store'
import { useRentalModel } from '@/components/rental/model'
import { RentalHeader } from '@/components/rental/RentalHeader'
import { ItemsCard } from '@/components/rental/ItemsCard'
import { CleaningPlan, ComplianceIndex } from '@/components/rental/CleaningPlan'
import { ServiceTimeline } from '@/components/rental/ServiceTimeline'
import { PhotosCard } from '@/components/rental/PhotosCard'
import { AvisosPanel, ClientRentalsPanel, ContactCard, OccurrencesPanel, ReportCard, SideColumn } from '@/components/rental/SidePanels'

function NotFound({ id }: { id?: string }) {
  const suggestions = RENTALS.filter((r) => r.status === 'ativa').slice(0, 4)
  return (
    <div className="px-4 pt-6 pb-6 md:px-6 md:pt-10">
      <Card className="mx-auto max-w-lg px-6 py-10 text-center sm:px-10">
        <IconCircle size={56} className="mx-auto">
          <Building2 className="size-6" strokeWidth={1.9} />
        </IconCircle>
        <h1 className="mt-4 text-[26px] leading-tight font-bold tracking-[-0.03em] text-ink">Locação não encontrada</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] font-medium text-ink-3">
          Nenhuma locação com o código <span className="rounded-full bg-muted px-2 py-0.5 text-ink">{id ?? 'vazio'}</span>.
        </p>
        <Link to="/locacoes" className="mt-6 inline-block">
          <Button variant="primary" size="md">
            <Search className="size-4" strokeWidth={2} /> Ver locações
          </Button>
        </Link>
        <div className="mt-8 border-t border-line pt-5">
          <div className="mb-3 text-[13px] font-semibold text-ink-3">No local agora</div>
          <div className="flex justify-center gap-3">
            {suggestions.map((r) => (
              <Link key={r.id} to={`/locacoes/${r.id}`} className="group flex w-20 flex-col items-center gap-1.5 rounded-[16px] p-1.5 hover:bg-surface">
                <RentalAvatar rental={r} size={44} className="transition-transform group-hover:-translate-y-0.5" />
                <span className="line-clamp-2 text-[11.5px] leading-tight font-semibold text-ink-2">{r.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function Locacao() {
  const { id } = useParams()
  const over = useDemo((s) => (id ? s.rentalStatus[id] : undefined))
  const rental = React.useMemo(() => (id && RENTAL[id] ? (over ? { ...RENTAL[id], status: over } : RENTAL[id]) : undefined), [id, over])
  const model = useRentalModel(rental)
  const avisos = useDemo((s) => s.avisos)

  if (!rental || !model) return <NotFound id={id} />

  const myAvisos = avisos.filter((a) => a.rentalId === rental.id).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))

  return (
    <div className="px-4 pb-28 md:px-6 lg:pb-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <RentalHeader rental={rental} model={model} />
          <ReportCard rental={rental} model={model} className="xl:hidden" />
          <CleaningPlan rental={rental} model={model} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
            <ItemsCard rental={rental} occurrences={model.occurrences} />
            <ComplianceIndex model={model} />
          </div>
          <PhotosCard photos={model.photos} />
          <ServiceTimeline items={model.history} live={model.live} title={rental.title} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <ReportCard rental={rental} model={model} className="max-xl:hidden" />
          <SideColumn>
            <ContactCard rental={rental} />
            <OccurrencesPanel rental={rental} occurrences={model.occurrences} />
            <AvisosPanel avisos={myAvisos} />
            <ClientRentalsPanel rental={rental} />
          </SideColumn>
        </aside>
      </div>
    </div>
  )
}
