import * as React from 'react'
import { Check, LogIn, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Badge, Button, Dialog, Drawer, EmptyState, Field, Input, Select, Skeleton, Banner, Tooltip, cn, notify, type StatusTone } from '@/ui'
import { TONE_SOFT } from '@/app/status'
import { listUsers, removeUser, saveUser, setCurrentUser, useMutation, useQuery, useSettings, type User, type UserRole } from '@/services'

const ROLE: Record<UserRole, { label: string; tone: StatusTone }> = {
  dono: { label: 'Dono', tone: 'accent' },
  escritorio: { label: 'Escritório', tone: 'info' },
  campo: { label: 'Campo', tone: 'ok' },
}
const ROLES: UserRole[] = ['dono', 'escritorio', 'campo']

const AREAS: { label: string; roles: UserRole[] }[] = [
  { label: 'Painel de dinheiro', roles: ['dono', 'escritorio'] },
  { label: 'Operação do dia', roles: ['dono', 'escritorio'] },
  { label: 'Locações', roles: ['dono', 'escritorio'] },
  { label: 'Equipamentos', roles: ['dono', 'escritorio'] },
  { label: 'Avarias', roles: ['dono', 'escritorio', 'campo'] },
  { label: 'Financeiro', roles: ['dono'] },
  { label: 'Clientes', roles: ['dono', 'escritorio'] },
  { label: 'Relatórios', roles: ['dono'] },
  { label: 'Configurações', roles: ['dono'] },
  { label: 'App de campo', roles: ['dono', 'campo'] },
]

interface Draft {
  id?: string
  name: string
  email: string
  phone: string
  role: UserRole
}
const EMPTY: Draft = { name: '', email: '', phone: '', role: 'escritorio' }

function Avatar({ user, size = 48 }: { user: Pick<User, 'initials' | 'role'>; size?: number }) {
  return (
    <span aria-hidden style={{ width: size, height: size }} className={cn('grid shrink-0 place-items-center rounded-pill text-body-lg font-bold', TONE_SOFT[ROLE[user.role].tone])}>
      {user.initials}
    </span>
  )
}

export default function Usuarios() {
  const settings = useSettings()
  const q = useQuery(listUsers, [])
  const users = q.data ?? settings.users
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [removing, setRemoving] = React.useState<User | null>(null)
  const save = useMutation(saveUser)
  const remove = useMutation(removeUser)
  const switchTo = useMutation(setCurrentUser)

  const emailBad = draft ? draft.email.trim() !== '' && !/.+@.+\..+/.test(draft.email) : false
  const canSave = !!draft && draft.name.trim() !== '' && /.+@.+\..+/.test(draft.email)

  const submit = async () => {
    if (!draft || !canSave) return
    try {
      await save.run({ id: draft.id, name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone, role: draft.role })
      notify.success(draft.id ? 'Usuário atualizado' : 'Usuário adicionado')
      setDraft(null)
    } catch (e) {
      notify.error(e instanceof Error && e.message !== 'Não foi possível concluir. Tente de novo.' ? e.message : 'Não foi possível salvar. Tente de novo.')
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await remove.run(removing.id)
      notify.success('Usuário removido')
      setRemoving(null)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Não foi possível remover. Tente de novo.')
    }
  }

  const enterAs = async (u: User) => {
    try {
      await switchTo.run(u.id)
      notify.success(`Agora você está como ${u.name}`)
    } catch {
      notify.error('Não foi possível trocar de usuário. Tente de novo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title-section">Usuários</h2>
        <Button variant="primary" icon={Plus} onClick={() => setDraft(EMPTY)}>
          Adicionar usuário
        </Button>
      </div>

      {q.error && !q.data ? (
        <Banner tone="danger" title="Não foi possível carregar os usuários." action={<Button variant="secondary" size="sm" onClick={() => void q.refetch()}>Tentar de novo</Button>} />
      ) : q.initialLoading ? (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} shape="block" className="h-36 rounded-card" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-card bg-raised p-2">
          <EmptyState title="Nenhum usuário cadastrado" action={<Button variant="primary" icon={Plus} onClick={() => setDraft(EMPTY)}>Adicionar usuário</Button>} />
        </div>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 @min-[1180px]/frame:grid-cols-3">
          {users.map((u) => {
            const me = u.id === settings.currentUserId
            return (
              <li key={u.id} className="flex flex-col rounded-card bg-raised p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar user={u} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-lg font-semibold">{u.name}</p>
                    <p className="truncate text-body text-fg-2">{u.email}</p>
                  </div>
                  <div className="-mt-1 -mr-2 flex shrink-0">
                    <Tooltip content="Editar">
                      <Button variant="ghost" size="sm" iconOnly icon={Pencil} aria-label={`Editar ${u.name}`} onClick={() => setDraft({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role })} />
                    </Tooltip>
                    {!me ? (
                      <Tooltip content="Remover">
                        <Button variant="ghost" size="sm" iconOnly icon={Trash2} aria-label={`Remover ${u.name}`} onClick={() => setRemoving(u)} />
                      </Tooltip>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Badge tone={ROLE[u.role].tone}>{ROLE[u.role].label}</Badge>
                  {me ? (
                    <Badge tone="ok" icon={Check}>
                      Você
                    </Badge>
                  ) : (
                    <Button variant="secondary" size="sm" icon={LogIn} loading={switchTo.loading} onClick={() => void enterAs(u)}>
                      Entrar como
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <section aria-labelledby="acessos" className="rounded-card bg-raised p-5 sm:p-6">
        <h2 id="acessos" className="text-title-sub">
          O que cada papel acessa
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th scope="col" className="sr-only">
                  Área
                </th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="pb-3 text-center">
                    <Badge tone={ROLE[r].tone}>{ROLE[r].label}</Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AREAS.map((a) => (
                <tr key={a.label}>
                  <th scope="row" className="border-t border-hairline py-2.5 pr-3 text-left text-body font-medium">
                    {a.label}
                  </th>
                  {ROLES.map((r) => {
                    const ok = a.roles.includes(r)
                    return (
                      <td key={r} className="border-t border-hairline py-2.5 text-center">
                        <span className={cn('inline-grid size-7 place-items-center rounded-pill', ok ? 'bg-ok-soft text-ok-ink' : 'bg-sunken text-fg-3')}>
                          {ok ? <Check size={16} strokeWidth={2.5} aria-hidden /> : <X size={16} strokeWidth={2} aria-hidden />}
                          <span className="sr-only">{ok ? 'Acessa' : 'Não acessa'}</span>
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={draft?.id ? 'Editar usuário' : 'Novo usuário'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
            <Button variant="primary" loading={save.loading} disabled={!canSave} onClick={() => void submit()}>
              Salvar
            </Button>
          </>
        }
      >
        {draft ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <Field label="Nome">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoComplete="off" />
            </Field>
            <Field label="E-mail" error={emailBad ? 'E-mail inválido.' : undefined}>
              <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="off" />
            </Field>
            <Field label="Telefone" optional>
              <Input type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </Field>
            <Field label="Papel">
              <Select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE[r].label}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        ) : null}
      </Drawer>

      <Dialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        size="sm"
        destructive
        title={`Remover ${removing?.name ?? ''}?`}
        confirmLabel="Remover usuário"
        confirmLoading={remove.loading}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  )
}
