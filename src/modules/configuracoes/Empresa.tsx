import * as React from 'react'
import { Save } from 'lucide-react'
import { Button, Field, Input, notify } from '@/ui'
import { formatCNPJ, formatPhone } from '@/lib/format'
import { updateCompany, useMutation, useSettings, type Company } from '@/services'
import { BrandMark } from '../portal/components/PublicShell'

export default function Empresa() {
  const s = useSettings()
  const [draft, setDraft] = React.useState<Company>(s.company)
  const save = useMutation(updateCompany)
  const dirty = (Object.keys(draft) as (keyof Company)[]).some((k) => draft[k] !== s.company[k])
  const set = (k: keyof Company) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  const nameMissing = !draft.name.trim()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nameMissing) return
    try {
      const next = await save.run(draft)
      setDraft(next.company)
      notify.success('Dados da empresa salvos')
    } catch {
      notify.error('Não foi possível salvar. Tente de novo.')
    }
  }

  return (
    <form onSubmit={submit} className="rounded-card bg-raised p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <BrandMark company={{ name: draft.name || 'Empresa', logoDataUrl: s.logoDataUrl }} size={64} className="rounded-card text-title-sub" />
        <div className="min-w-0">
          <h2 className="truncate text-title-section">{draft.name || 'Nome da empresa'}</h2>
          <p className="tnum truncate text-body text-fg-2">{formatCNPJ(draft.cnpj)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome" error={nameMissing ? 'Informe o nome da empresa.' : undefined}>
          <Input value={draft.name} onChange={set('name')} autoComplete="organization" />
        </Field>
        <Field label="Razão social">
          <Input value={draft.legalName} onChange={set('legalName')} />
        </Field>
        <Field label="CNPJ">
          <Input value={draft.cnpj} onChange={set('cnpj')} onBlur={() => setDraft((d) => ({ ...d, cnpj: formatCNPJ(d.cnpj) }))} inputMode="numeric" />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={draft.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Telefone">
          <Input type="tel" value={draft.phone} onChange={set('phone')} onBlur={() => setDraft((d) => ({ ...d, phone: formatPhone(d.phone) }))} autoComplete="tel" />
        </Field>
        <Field label="WhatsApp">
          <Input type="tel" value={draft.whatsapp} onChange={set('whatsapp')} onBlur={() => setDraft((d) => ({ ...d, whatsapp: formatPhone(d.whatsapp) }))} />
        </Field>
        <Field label="Endereço" className="sm:col-span-2">
          <Input value={draft.address} onChange={set('address')} autoComplete="street-address" />
        </Field>
        <Field label="Cidade">
          <Input value={draft.city} onChange={set('city')} />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2.5">
        <Button type="button" variant="ghost" disabled={!dirty || save.loading} onClick={() => setDraft(s.company)}>
          Descartar
        </Button>
        <Button type="submit" variant="primary" size="lg" icon={Save} loading={save.loading} disabled={!dirty || nameMissing}>
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
