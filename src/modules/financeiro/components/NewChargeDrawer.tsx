import * as React from 'react'
import { Banknote, QrCode } from 'lucide-react'
import { Button, Drawer, Field, Input, Segmented, Select, Skeleton, notify } from '@/ui'
import { CHARGE_KIND } from '@/app/status'
import { addDays, today } from '@/domain/dates'
import { parseMoney } from '@/lib/format'
import { createCharge, listClients, useMutation, useQuery } from '@/services'
import type { ChargeKind, PayMethod } from '@/services'
import { errMessage } from '../lib'

const KINDS = Object.keys(CHARGE_KIND) as ChargeKind[]

interface Form {
  clientId: string
  kind: ChargeKind
  description: string
  value: string
  dueAt: string
  method: PayMethod
}

const blank = (): Form => ({ clientId: '', kind: 'locacao', description: '', value: '', dueAt: addDays(today(), 10), method: 'pix' })

/** Gaveta "Nova cobrança": cria um rascunho e devolve o id para abrir a gaveta da cobrança. */
export function NewChargeDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const clients = useQuery(listClients, [])
  const create = useMutation(createCharge)
  const [form, setForm] = React.useState<Form>(blank)
  const [errors, setErrors] = React.useState<Partial<Record<keyof Form, string>>>({})

  React.useEffect(() => {
    if (open) {
      setForm(blank())
      setErrors({})
    }
  }, [open])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const value = parseMoney(form.value)
    const err: typeof errors = {}
    if (!form.clientId) err.clientId = 'Escolha o cliente.'
    if (!form.description.trim()) err.description = 'Descreva a cobrança em poucas palavras.'
    if (!value || value <= 0) err.value = 'Informe o valor, por exemplo 1.250,00.'
    if (!form.dueAt) err.dueAt = 'Informe o vencimento.'
    setErrors(err)
    if (Object.keys(err).length || !value) return
    try {
      const c = await create.run({ clientId: form.clientId, kind: form.kind, description: form.description, value, dueAt: form.dueAt, method: form.method })
      notify.success('Cobrança criada como rascunho')
      onCreated(c.id)
    } catch (e2) {
      notify.error(errMessage(e2, 'Não foi possível criar a cobrança. Tente de novo.'))
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Nova cobrança"
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="lg" loading={create.loading} onClick={() => void submit()}>
            Criar cobrança
          </Button>
        </>
      }
    >
      {clients.initialLoading ? (
        <div role="status" aria-busy="true" aria-label="Carregando clientes" className="flex flex-col gap-4">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Cliente" error={errors.clientId}>
            <Select value={form.clientId} onChange={(e) => set('clientId', e.target.value)} placeholder="Escolha o cliente">
              {(clients.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={form.kind} onChange={(e) => set('kind', e.target.value as ChargeKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {CHARGE_KIND[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descrição" error={errors.description}>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ex.: Reposição de porta, LOC-2046" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Valor" error={errors.value}>
              <Input numeric prefix="R$" inputMode="decimal" value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Vencimento" error={errors.dueAt}>
              <Input type="date" value={form.dueAt} onChange={(e) => set('dueAt', e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-body font-semibold">Forma de pagamento</span>
            <Segmented<PayMethod>
              label="Forma de pagamento"
              block
              value={form.method}
              onChange={(v) => set('method', v)}
              options={[
                { value: 'pix', label: 'Pix', icon: QrCode },
                { value: 'boleto', label: 'Boleto', icon: Banknote },
              ]}
            />
          </div>
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
            Criar cobrança
          </button>
        </form>
      )}
    </Drawer>
  )
}
