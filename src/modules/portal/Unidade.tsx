import * as React from 'react'
import { useParams } from 'react-router-dom'
import { DoorClosed, Eraser, MessageSquareMore, PackageX, QrCode, Send, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Banner, Button, Drawer, EmptyState, Field, PhotoThumb, PhotoViewer, Skeleton, StatusDot, Textarea, cn, notify, type PhotoItem } from '@/ui'
import { UNIT_STATUS } from '@/app/status'
import { formatDate, formatTime } from '@/lib/format'
import { getUnitPage, reportProblem, useLabels, useMutation, useQuery, type ProblemKind } from '@/services'
import { PublicShell } from './components/PublicShell'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function Unidade() {
  const { code = '' } = useParams()
  const l = useLabels()
  const q = useQuery(() => getUnitPage(code), [code])
  const data = q.data
  const send = useMutation(reportProblem)
  const [open, setOpen] = React.useState(false)
  const [kind, setKind] = React.useState<ProblemKind | null>(null)
  const [note, setNote] = React.useState('')
  const [viewer, setViewer] = React.useState<number | null>(null)

  const options: { value: ProblemKind; label: string; icon: LucideIcon }[] = [
    { value: 'papel', label: 'Falta papel', icon: PackageX },
    { value: 'limpeza', label: `Precisa de ${l.cleaning}`, icon: Eraser },
    { value: 'porta', label: 'Porta ou trava', icon: DoorClosed },
    { value: 'outro', label: 'Outro', icon: MessageSquareMore },
  ]

  const notFound = q.error && q.error.message.startsWith('Equipamento')
  if (notFound) {
    return (
      <PublicShell width={480}>
        <div className="mt-10 rounded-card bg-raised p-4">
          <EmptyState icon={QrCode} title="Equipamento não encontrado">
            Confira o código na etiqueta ou fale com a locadora.
          </EmptyState>
        </div>
      </PublicShell>
    )
  }

  const submit = async () => {
    if (!data || !kind) return
    try {
      await send.run(data.unit.code, kind, note)
      notify.success(`Aviso enviado para a ${data.company.name}`)
      setOpen(false)
      setKind(null)
      setNote('')
    } catch {
      notify.error('Não foi possível enviar o aviso. Tente de novo.')
    }
  }

  const photos: PhotoItem[] = (data?.lastCleaning?.photos ?? []).map((p) => ({ id: p.id, src: p.src, alt: `${p.label}, ${data?.unit.code}` }))
  const st = data ? UNIT_STATUS[data.unit.status] : undefined

  return (
    <PublicShell company={data?.company} width={480}>
      {q.error && !data ? (
        <Banner tone="danger" title="Não foi possível carregar o equipamento." action={<Button variant="secondary" size="sm" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : !data ? (
        <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-4">
          <Skeleton shape="block" className="h-72 rounded-card" />
          <Skeleton shape="block" className="h-40 rounded-card" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <section aria-label="Equipamento" className="overflow-hidden rounded-card bg-raised">
            <img src={data.unit.photo} alt={data.unit.typeName} className="h-52 w-full bg-sunken object-cover" />
            <div className="flex items-end justify-between gap-3 p-5 sm:p-6">
              <div className="min-w-0">
                <h1 className="tnum text-title-page">{data.unit.code}</h1>
                <p className="mt-1 truncate text-body-lg text-fg-2">{data.unit.typeName}</p>
              </div>
              {st ? <StatusDot tone={st.tone}>{st.label}</StatusDot> : null}
            </div>
          </section>

          <section aria-labelledby="ultima" className="rounded-card bg-raised p-5 sm:p-6">
            <h2 id="ultima" className="flex items-center gap-2 text-title-sub">
              <Sparkles size={18} strokeWidth={2} aria-hidden className="text-accent-ink" />
              Última {l.cleaning}
            </h2>
            {data.lastCleaning ? (
              <>
                <p className="tnum mt-2 text-kpi">
                  {formatDate(data.lastCleaning.at)}
                  <span className="ml-3 text-title-sub text-fg-2">{formatTime(data.lastCleaning.at)}</span>
                </p>
                {photos.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {photos.map((p, i) => (
                      <li key={p.id}>
                        <PhotoThumb src={p.src} alt={p.alt} size={96} onClick={() => setViewer(i)} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-body text-fg-2">Ainda sem {l.cleaning} registrada.</p>
            )}
          </section>

          <Button variant="primary" size="field" block icon={TriangleAlert} onClick={() => setOpen(true)}>
            Avisar um problema
          </Button>
        </div>
      )}

      {viewer !== null && photos.length ? <PhotoViewer photos={photos} index={viewer} open onIndexChange={setViewer} onOpenChange={(o) => !o && setViewer(null)} /> : null}

      <Drawer
        side="bottom"
        open={open}
        onOpenChange={setOpen}
        title="Avisar um problema"
        footer={
          <Button variant="primary" size="lg" block icon={Send} loading={send.loading} disabled={!kind} onClick={submit}>
            Enviar aviso
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Tipo de problema" className="grid grid-cols-2 gap-3">
            {options.map((o) => {
              const on = kind === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setKind(o.value)}
                  className={cn(
                    'flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-card p-3 text-center text-body font-semibold transition-colors duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    on ? 'ds-hero' : 'bg-sunken text-fg hover:bg-hover',
                  )}
                >
                  <o.icon size={26} strokeWidth={2} aria-hidden />
                  {cap(o.label)}
                </button>
              )
            })}
          </div>
          <Field label="Observação" optional>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Drawer>
    </PublicShell>
  )
}
