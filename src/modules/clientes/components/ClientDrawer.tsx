import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { BAIRROS } from '@/data/geo'
import { createClient, updateClient, useMutation, type Client, type ClientKind, type Contact } from '@/services'
import { Button, Drawer, Field, Input, Select, notify } from '@/ui'
import { CLIENT_KINDS, cnpjOk, emailOk, maskCNPJ, maskPhone, phoneOk } from '../lib'

const FORM_ID = 'form-cliente'
const BAIRROS_SORTED = [...BAIRROS].sort((a, b) => a.name.localeCompare(b.name))
const blank = (): Contact => ({ name: '', role: '', phone: '', email: '' })

interface Errors {
  name?: string
  cnpj?: string
  address?: string
  bairroId?: string
  contacts: Record<number, { name?: string; phone?: string; email?: string }>
}

function ClientForm({ client, onSaved, onBusy }: { client?: Client; onSaved: (c: Client) => void; onBusy: (b: boolean) => void }) {
  const [name, setName] = React.useState(client?.name ?? '')
  const [kind, setKind] = React.useState<ClientKind>(client?.kind ?? 'Construtora')
  const [cnpj, setCnpj] = React.useState(client?.cnpj ?? '')
  const [address, setAddress] = React.useState(client?.address ?? '')
  const [bairroId, setBairroId] = React.useState(client?.bairroId ?? '')
  const [contacts, setContacts] = React.useState<Contact[]>(client?.contacts.length ? client.contacts.map((c) => ({ ...c })) : [blank()])
  const [errors, setErrors] = React.useState<Errors>({ contacts: {} })
  const create = useMutation(createClient)
  const update = useMutation(updateClient)

  const setContact = (i: number, patch: Partial<Contact>) => setContacts((cs) => cs.map((c, k) => (k === i ? { ...c, ...patch } : c)))

  const validate = (): Errors => {
    const e: Errors = { contacts: {} }
    if (!name.trim()) e.name = 'Informe o nome do cliente.'
    if (!cnpjOk(cnpj)) e.cnpj = 'CNPJ incompleto. Confira os 14 números.'
    if (!address.trim()) e.address = 'Informe o endereço.'
    if (!bairroId) e.bairroId = 'Escolha o bairro.'
    contacts.forEach((c, i) => {
      const touched = c.name.trim() || c.phone.trim() || c.email.trim() || c.role.trim()
      if (!touched && (client || i > 0)) return
      const ce: { name?: string; phone?: string; email?: string } = {}
      if (!c.name.trim()) ce.name = 'Informe o nome do contato.'
      if (!phoneOk(c.phone)) ce.phone = 'Telefone incompleto. Use DDD e número.'
      if (!emailOk(c.email)) ce.email = 'E-mail inválido. Confira o endereço.'
      if (ce.name || ce.phone || ce.email) e.contacts[i] = ce
    })
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (e.name || e.cnpj || e.address || e.bairroId || Object.keys(e.contacts).length) return
    const cleaned = contacts
      .filter((c) => c.name.trim() || c.phone.trim())
      .map((c) => ({ name: c.name.trim(), role: c.role.trim(), phone: c.phone.trim(), email: c.email.trim() }))
    onBusy(true)
    try {
      const saved = client
        ? await update.run(client.id, { name: name.trim(), kind, cnpj, address: address.trim(), bairroId, contacts: cleaned })
        : await create.run({ name: name.trim(), kind, cnpj, address: address.trim(), bairroId, contacts: cleaned })
      notify.success(client ? 'Cliente atualizado' : 'Cliente cadastrado')
      onSaved(saved)
    } catch {
      notify.error(client ? 'Não foi possível salvar o cliente. Tente de novo.' : 'Não foi possível cadastrar o cliente. Tente de novo.')
    } finally {
      onBusy(false)
    }
  }

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Nome" error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Construtora Planalto" autoComplete="off" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tipo de cliente">
          <Select value={kind} onChange={(e) => setKind(e.target.value as ClientKind)}>
            {CLIENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="CNPJ" error={errors.cnpj}>
          <Input value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} inputMode="numeric" placeholder="00.000.000/0000-00" autoComplete="off" />
        </Field>
      </div>
      <Field label="Endereço" error={errors.address}>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, complemento" autoComplete="off" />
      </Field>
      <Field label="Bairro" error={errors.bairroId}>
        <Select value={bairroId} onChange={(e) => setBairroId(e.target.value)} placeholder="Escolha o bairro">
          {BAIRROS_SORTED.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-title-card">Contatos</h3>
          <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => setContacts((cs) => [...cs, blank()])}>
            Adicionar contato
          </Button>
        </div>
        {contacts.map((c, i) => {
          const ce = errors.contacts[i] ?? {}
          return (
            <fieldset key={i} className="m-0 flex flex-col gap-4 rounded-card bg-sunken p-4">
              <legend className="sr-only">Contato {i + 1}</legend>
              <div className="flex items-end gap-2">
                <Field label="Nome do contato" error={ce.name} className="flex-1">
                  <Input value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} autoComplete="off" />
                </Field>
                {contacts.length > 1 ? (
                  <Button type="button" variant="ghost" iconOnly icon={Trash2} aria-label={`Remover contato ${i + 1}`} onClick={() => setContacts((cs) => cs.filter((_, k) => k !== i))} />
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cargo" optional>
                  <Input value={c.role} onChange={(e) => setContact(i, { role: e.target.value })} autoComplete="off" />
                </Field>
                <Field label="Telefone" error={ce.phone}>
                  <Input value={c.phone} onChange={(e) => setContact(i, { phone: maskPhone(e.target.value) })} inputMode="tel" placeholder="(61) 99999-0000" autoComplete="off" />
                </Field>
              </div>
              <Field label="E-mail" optional error={ce.email}>
                <Input type="email" value={c.email} onChange={(e) => setContact(i, { email: e.target.value })} autoComplete="off" />
              </Field>
            </fieldset>
          )
        })}
      </div>
    </form>
  )
}

/** Gaveta de cadastro (sem `client`) ou de edição (com `client`). */
export function ClientDrawer({ open, onOpenChange, client, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; client?: Client; onSaved?: (c: Client) => void }) {
  const [busy, setBusy] = React.useState(false)
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      width={640}
      title={client ? 'Editar cliente' : 'Novo cliente'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={busy}>
            {client ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </>
      }
    >
      <ClientForm
        client={client}
        onBusy={setBusy}
        onSaved={(c) => {
          onOpenChange(false)
          onSaved?.(c)
        }}
      />
    </Drawer>
  )
}
