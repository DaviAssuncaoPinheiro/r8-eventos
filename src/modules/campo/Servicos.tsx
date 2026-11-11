import { ClipboardList } from 'lucide-react'
import { Badge, EmptyState } from '@/ui'
import { CampoScreen, LoadFailed } from './components/Screen'
import { ListSkeleton, ServiceList } from './components/ServiceList'
import { useCampoDay } from './lib'

export default function Servicos() {
  const { open, done, loading, error, team, refetch } = useCampoDay()
  return (
    <CampoScreen title="Serviços">
      {loading ? (
        <ListSkeleton />
      ) : error && !team ? (
        <LoadFailed onRetry={() => void refetch()} />
      ) : !open.length && !done.length ? (
        <div className="rounded-card bg-raised">
          <EmptyState icon={ClipboardList} title="Os serviços do dia aparecem aqui" />
        </div>
      ) : (
        <>
          {open.length ? (
            <>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-title-sub">
                A fazer <Badge tone="accent">{open.length}</Badge>
              </h2>
              <ServiceList services={open} label="A fazer" />
            </>
          ) : null}
          {done.length ? (
            <>
              <h2 className="mt-6 mb-2 flex items-center gap-2 px-1 text-title-sub">
                Feitos <Badge tone="ok">{done.length}</Badge>
              </h2>
              <ServiceList services={done} label="Feitos" />
            </>
          ) : null}
        </>
      )}
    </CampoScreen>
  )
}
