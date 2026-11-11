import * as React from 'react'
import { Link } from 'react-router-dom'
import { Ban, Building2, Check, ClipboardList, MapPin, Navigation, PenLine, Play, ReceiptText, Truck, X, type LucideIcon } from 'lucide-react'
import { Badge, Button, Dialog, PhotoGrid, Skeleton, StatusDot, cn, notify } from '@/ui'
import { DAMAGE_STATUS, SERVICE_ICON, SERVICE_STATUS } from '@/app/status'
import { formatMoney, formatTime } from '@/lib/format'
import { Drawer } from '@/ui/Drawer'
import { cancelService, completeService, getService, setServiceStatus, startService, useMutation, useQuery, type ServiceDetail } from '@/services'
import { TeamAvatar } from './TeamAvatar'
import { serviceTitle } from './helpers'

const link = 'rounded-tip font-semibold text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-tip bg-sunken text-fg-2">
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-caption font-semibold text-fg-3">{label}</dt>
        <dd className="text-body text-fg">{children}</dd>
      </div>
    </div>
  )
}

export interface ServiceDrawerProps {
  serviceId: string | null
  onClose: () => void
}

/** Gaveta do serviço: dados, ações conforme o status e, quando já existe, o relatório */
export function ServiceDrawer({ serviceId, onClose }: ServiceDrawerProps) {
  const q = useQuery(() => (serviceId ? getService(serviceId) : Promise.resolve(undefined)), [serviceId])
  // mantém o último serviço enquanto a gaveta fecha, para o conteúdo não sumir antes da animação
  const last = React.useRef<ServiceDetail | undefined>(undefined)
  if (q.data && q.data.id === serviceId) last.current = q.data
  const s = q.data && q.data.id === serviceId ? q.data : last.current?.id === serviceId ? last.current : undefined
  const [confirmCancel, setConfirmCancel] = React.useState(false)

  const toRoute = useMutation(setServiceStatus)
  const start = useMutation(startService)
  const finish = useMutation(completeService)
  const cancel = useMutation(cancelService)

  const run = async (fn: () => Promise<unknown>, ok: string, fail: string) => {
    try {
      await fn()
      notify.success(ok)
    } catch {
      notify.error(fail)
    }
  }

  const footer = s ? (
    <>
      {s.status !== 'concluido' && s.status !== 'cancelado' ? (
        <Button variant="ghost" icon={Ban} className="mr-auto text-danger-ink" onClick={() => setConfirmCancel(true)}>
          Cancelar serviço
        </Button>
      ) : null}
      {s.status === 'agendado' || s.status === 'atrasado' ? (
        <Button icon={Navigation} loading={toRoute.loading} onClick={() => run(() => toRoute.run(s.id, 'a_caminho'), `${s.teamName} a caminho`, 'Não foi possível atualizar. Tente de novo.')}>
          Marcar a caminho
        </Button>
      ) : null}
      {s.status === 'agendado' || s.status === 'atrasado' || s.status === 'a_caminho' ? (
        <Button variant="primary" icon={Play} loading={start.loading} onClick={() => run(() => start.run(s.id), 'Serviço iniciado', 'Não foi possível iniciar. Tente de novo.')}>
          Iniciar
        </Button>
      ) : null}
      {s.status === 'em_andamento' ? (
        <Button
          variant="primary"
          icon={Check}
          loading={finish.loading}
          onClick={() =>
            run(
              () =>
                finish.run(s.id, {
                  checklist: s.checklistTemplate.map((label) => ({
                    label,
                    ok: true,
                  })),
                }),
              'Serviço concluído',
              'Não foi possível concluir. Tente de novo.',
            )
          }
        >
          Concluir
        </Button>
      ) : null}
    </>
  ) : undefined

  const hasFooter = s && s.status !== 'concluido' && s.status !== 'cancelado'
  const Icon = s ? SERVICE_ICON[s.type] : Truck

  return (
    <>
      <Drawer open={!!serviceId} onOpenChange={(o) => !o && onClose()} title={s ? serviceTitle(s) : 'Serviço'} footer={hasFooter ? footer : undefined}>
        {q.error && !s ? (
          <div role="alert" className="rounded-card bg-danger-soft px-4 py-3 text-body text-danger-ink">
            Não foi possível abrir o serviço.
            <Button size="sm" className="ml-3" onClick={() => void q.refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : !s ? (
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <span className="grid size-12 place-items-center rounded-pill bg-accent-soft text-accent-ink">
                <Icon size={22} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="tnum text-kpi">{formatTime(s.start)}</p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {s.extra ? <Badge tone="warn">Extra{s.extraValue ? ` ${formatMoney(s.extraValue)}` : ''}</Badge> : null}
                <span className="rounded-pill bg-sunken px-3 py-1">
                  <StatusDot tone={SERVICE_STATUS[s.status].tone}>{SERVICE_STATUS[s.status].label}</StatusDot>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-control bg-sunken p-3">
              <TeamAvatar team={s.team} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold">{s.team.name}</p>
                <p className="tnum text-caption text-fg-2">
                  {formatTime(s.start)} às {formatTime(s.end)}
                </p>
              </div>
              <span className="tnum rounded-tip bg-raised px-1.5 text-caption font-semibold text-fg-2">{s.team.plate}</span>
            </div>

            <dl className="flex flex-col gap-4">
              <Row icon={Building2} label="Cliente">
                <Link to={`/clientes/${s.clientId}`} className={link}>
                  {s.clientName}
                </Link>
              </Row>
              <Row icon={MapPin} label="Endereço">
                {s.address}, {s.bairroName}
              </Row>
              <Row icon={ReceiptText} label="Locação">
                <Link to={`/locacoes/${s.rentalId}`} className={link}>
                  {s.rentalCode}
                </Link>
                <span className="text-fg-2"> {s.rentalTitle}</span>
              </Row>
              <Row icon={ClipboardList} label="Unidades">
                {s.units.length === 0 ? (
                  <span className="text-fg-3">Nenhuma</span>
                ) : (
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {s.units.map((u) => (
                      <li key={u.id}>
                        <Link
                          to={`/equipamentos/${u.code}`}
                          className="inline-flex h-6 items-center rounded-pill bg-sunken px-2 text-caption font-semibold tnum text-fg transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {u.code}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Row>
              {s.note ? (
                <Row icon={PenLine} label="Observação">
                  {s.note}
                </Row>
              ) : null}
            </dl>

            {s.report ? (
              <section aria-label="Relatório do serviço" className="flex flex-col gap-5 border-t border-hairline pt-6">
                <h3 className="text-title-card">Relatório</h3>
                <ul className="flex flex-col gap-2">
                  {s.report.checklist.map((c) => (
                    <li key={c.label} className="flex items-center gap-2.5 text-body">
                      <span aria-hidden className={cn('grid size-5 shrink-0 place-items-center rounded-pill', c.ok ? 'bg-ok-soft text-ok-ink' : 'bg-danger-soft text-danger-ink')}>
                        {c.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                      </span>
                      <span className="sr-only">{c.ok ? 'Feito: ' : 'Não feito: '}</span>
                      {c.label}
                    </li>
                  ))}
                </ul>
                {s.report.photos.length ? (
                  <PhotoGrid
                    photos={s.report.photos.map((p) => ({
                      id: p.id,
                      src: p.src,
                      alt: p.label,
                    }))}
                  />
                ) : null}
                {s.report.signature ? (
                  <div className="flex items-center gap-3 rounded-control bg-sunken p-3">
                    {s.report.signature.dataUrl ? (
                      <img src={s.report.signature.dataUrl} alt={`Assinatura de ${s.report.signature.name}`} className="h-12 w-24 shrink-0 rounded-tip bg-white object-contain" />
                    ) : (
                      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-tip bg-raised text-fg-2">
                        <PenLine size={20} strokeWidth={2} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-body font-semibold">{s.report.signature.name}</p>
                      <p className="truncate text-caption text-fg-2">{s.report.signature.role}</p>
                    </div>
                  </div>
                ) : null}
                {s.report.notes ? <p className="text-body text-fg">{s.report.notes}</p> : null}
              </section>
            ) : null}

            {s.damages.length ? (
              <section aria-label="Avarias ligadas" className="flex flex-col gap-3 border-t border-hairline pt-6">
                <h3 className="text-title-card">Avarias</h3>
                <ul className="flex flex-col gap-2">
                  {s.damages.map((d) => (
                    <li key={d.id}>
                      <Link
                        to={`/avarias?status=${d.status}`}
                        className="flex items-center gap-3 rounded-control bg-sunken p-3 transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <span className="min-w-0 flex-1 truncate text-body font-semibold">{d.kind}</span>
                        <StatusDot tone={DAMAGE_STATUS[d.status].tone}>{DAMAGE_STATUS[d.status].label}</StatusDot>
                        <span className="tnum text-body font-semibold">{formatMoney(d.value)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </Drawer>

      <Dialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        size="sm"
        destructive
        title="Cancelar este serviço?"
        confirmLabel="Cancelar serviço"
        cancelLabel="Voltar"
        confirmLoading={cancel.loading}
        onConfirm={async () => {
          if (!s) return
          try {
            await cancel.run(s.id)
            setConfirmCancel(false)
            notify.success('Serviço cancelado')
            onClose()
          } catch {
            notify.error('Não foi possível cancelar. Tente de novo.')
          }
        }}
      />
    </>
  )
}
