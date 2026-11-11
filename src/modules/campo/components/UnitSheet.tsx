import { AlertTriangle, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { UNIT_STATUS } from '@/app/status'
import { today } from '@/domain/dates'
import { formatDate } from '@/lib/format'
import { getUnit, listServices, useLabels, useQuery } from '@/services'
import { Button, Skeleton, StatusDot } from '@/ui'
import { useCampoDay } from '../lib'
import { Sheet } from './Sheet'

/** Ficha rápida da unidade, em gaveta inferior: o que a equipe precisa saber com a unidade na mão. */
export function UnitSheet({ code, onClose }: { code: string | null; onClose: () => void }) {
  const navigate = useNavigate()
  const l = useLabels()
  const { team } = useCampoDay()
  const q = useQuery(() => (code ? getUnit(code) : Promise.reject(new Error('sem código'))), [code])
  const svc = useQuery(() => listServices({ date: today() }), [])
  const detail = code ? q.data : undefined
  const u = detail?.unit
  const mine = (svc.data ?? [])
    .filter((s) => u && s.unitIds.includes(u.id) && s.status !== 'concluido' && s.status !== 'cancelado')
    .sort((a, b) => Number(b.teamId === team?.id) - Number(a.teamId === team?.id) || a.start.localeCompare(b.start))[0]
  const lastClean = detail?.history.filter((h) => h.kind === 'servico' && h.title.toLowerCase().startsWith(l.serviceTypes.limpeza.toLowerCase())).at(-1)
  const st = u ? UNIT_STATUS[u.status] : undefined

  const rows: { k: string; v: string }[] = u
    ? [
        { k: 'Cliente atual', v: u.rental?.clientName ?? 'Sem locação' },
        { k: `Última ${l.cleaning}`, v: lastClean ? formatDate(lastClean.at) : 'Sem registro' },
      ]
    : []

  return (
    <Sheet
      open={!!code}
      onOpenChange={(o) => !o && onClose()}
      title={code ?? 'Unidade'}
      footer={
        <>
          <Button
            variant="primary"
            size="field"
            block
            icon={Play}
            disabled={!mine}
            onClick={() => {
              if (mine) navigate(`/campo/servico/${mine.id}`)
            }}
          >
            {mine ? 'Abrir serviço' : 'Sem serviço hoje'}
          </Button>
          <Button variant="secondary" size="field" block icon={AlertTriangle} onClick={() => navigate(`/campo/avarias?nova=1&unidade=${encodeURIComponent(code ?? '')}`)}>
            Registrar avaria
          </Button>
        </>
      }
    >
      {q.initialLoading || !u ? (
        q.error && !u ? (
          <p className="py-6 text-body-lg text-danger-ink">Unidade não encontrada.</p>
        ) : (
          <div aria-busy="true" className="flex flex-col gap-3 pt-2">
            <Skeleton shape="block" className="h-20" />
            <Skeleton shape="block" className="h-28" />
          </div>
        )
      ) : (
        <div className="pt-2">
          <div className="flex items-center gap-4">
            <img src={u.type.photo} alt="" className="size-20 shrink-0 rounded-card bg-sunken object-cover" />
            <div className="min-w-0">
              <p className="tnum text-title-field">{u.code}</p>
              <p className="truncate text-body-lg text-fg-2">{u.type.name}</p>
              {st ? (
                <div className="mt-1">
                  <StatusDot tone={st.tone} className="text-body-lg">
                    {st.label}
                  </StatusDot>
                </div>
              ) : null}
            </div>
          </div>
          <dl className="mt-4 overflow-hidden rounded-card bg-raised">
            {rows.map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0">
                <dt className="shrink-0 text-body text-fg-2">{r.k}</dt>
                <dd className="min-w-0 truncate text-right text-body-lg font-semibold">{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Sheet>
  )
}
