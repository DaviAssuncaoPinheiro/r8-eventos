import * as React from 'react'
import { Check, Search, X } from 'lucide-react'
import { AddPhoto, Button, Drawer, Field, Input, Select, Skeleton, StatusDot, cn, notify } from '@/ui'
import { UNIT_STATUS } from '@/app/status'
import { parseMoney } from '@/lib/format'
import { listUnits, registerDamage, useMutation, useQuery, useSegment } from '@/services'
import type { UnitView } from '@/services'
import { errMessage } from '@/modules/financeiro/lib'

const SAMPLES = [
  { id: 'banheiro-quimico', src: '/produtos/banheiro-quimico.jpg', label: 'Banheiro' },
  { id: 'tenda', src: '/produtos/tenda.jpg', label: 'Tenda' },
  { id: 'trailer', src: '/produtos/trailer.jpg', label: 'Trailer' },
  { id: 'alambrado', src: '/produtos/alambrado.jpg', label: 'Alambrado' },
  { id: 'balcao', src: '/produtos/balcao.jpg', label: 'Balcão' },
  { id: 'fechamento', src: '/produtos/fechamento.jpg', label: 'Fechamento' },
]

/** Reduz uma foto escolhida a uma miniatura leve (JPEG de até 640 px) para caber no armazenamento local. */
function toThumb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 640 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.width * k))
      c.height = Math.max(1, Math.round(img.height * k))
      const ctx = c.getContext('2d')
      if (!ctx) return reject(new Error('canvas'))
      ctx.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('imagem'))
    }
    img.src = url
  })
}

interface Photo {
  id: string
  src: string
  label: string
}

/** Gaveta "Registrar avaria": unidade (busca por código), tipo, valor, descrição curta e foto. */
export function RegisterDamageDrawer({ open, onClose, onRegistered }: { open: boolean; onClose: () => void; onRegistered: () => void }) {
  const kinds = useSegment().damageKinds
  const register = useMutation(registerDamage)
  const [term, setTerm] = React.useState('')
  const [unit, setUnit] = React.useState<UnitView | null>(null)
  const [kind, setKind] = React.useState('')
  const [value, setValue] = React.useState('')
  const [desc, setDesc] = React.useState('')
  const [uploads, setUploads] = React.useState<Photo[]>([])
  const [photoId, setPhotoId] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<{ unit?: string; kind?: string; value?: string }>({})

  React.useEffect(() => {
    if (open) {
      setTerm('')
      setUnit(null)
      setKind('')
      setValue('')
      setDesc('')
      setUploads([])
      setPhotoId(null)
      setErrors({})
    }
  }, [open])

  const q = term.trim()
  const found = useQuery(() => (open && !unit ? listUnits(q ? { q } : { status: 'em_campo' }) : Promise.resolve([])), [open, q, unit?.id])
  const results = (found.data ?? []).slice(0, 6)

  const photos: Photo[] = [...uploads, ...SAMPLES]
  const chosen = photos.find((p) => p.id === photoId)

  const addFiles = async (files: File[]) => {
    try {
      const out: Photo[] = []
      for (const f of files.slice(0, 3)) out.push({ id: `up-${Date.now()}-${out.length}`, src: await toThumb(f), label: 'Foto da avaria' })
      setUploads((u) => [...out, ...u])
      setPhotoId(out[0]?.id ?? null)
    } catch {
      notify.error('Não foi possível ler a foto. Tente outra.')
    }
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const v = parseMoney(value)
    const err: typeof errors = {}
    if (!unit) err.unit = 'Escolha a unidade pelo código.'
    if (!kind) err.kind = 'Escolha o tipo da avaria.'
    if (!v || v <= 0) err.value = 'Informe o valor, por exemplo 420,00.'
    setErrors(err)
    if (Object.keys(err).length || !unit || !v) return
    try {
      await register.run({
        unitId: unit.id,
        kind,
        description: desc.trim() || undefined,
        value: v,
        photos: chosen ? [{ src: chosen.src, label: `${kind} · ${unit.code}`, moment: 'avaria' }] : [],
      })
      notify.success(`Avaria registrada em ${unit.code}`)
      onRegistered()
    } catch (e2) {
      notify.error(errMessage(e2, 'Não foi possível registrar a avaria. Tente de novo.'))
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Registrar avaria"
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="lg" loading={register.loading} onClick={() => void submit()}>
            Registrar avaria
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {/* unidade */}
        {unit ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-body font-semibold">Unidade</span>
            <div className="flex items-center gap-3 rounded-control bg-sunken p-2 pl-3">
              <img src={unit.type.photo} alt="" className="size-11 shrink-0 rounded-tip object-cover" />
              <div className="min-w-0 flex-1">
                <p className="tnum text-body font-bold">{unit.code}</p>
                <p className="truncate text-caption text-fg-3">{unit.rental?.clientName ?? unit.type.name}</p>
              </div>
              <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Trocar unidade" onClick={() => setUnit(null)} />
            </div>
          </div>
        ) : (
          <Field label="Unidade" error={errors.unit}>
            <Input
              prefix={<Search size={16} strokeWidth={2} aria-hidden />}
              placeholder="Código, ex.: BQ-0142"
              value={term}
              autoComplete="off"
              onChange={(e) => {
                setTerm(e.target.value)
                setErrors((x) => ({ ...x, unit: undefined }))
              }}
            />
          </Field>
        )}
        {!unit ? (
          found.initialLoading ? (
            <div role="status" aria-busy="true" aria-label="Buscando unidades" className="-mt-2 flex flex-col gap-2">
              <Skeleton className="h-12" shape="block" />
              <Skeleton className="h-12" shape="block" />
            </div>
          ) : results.length === 0 ? (
            <p className="-mt-2 text-body text-fg-2">Nenhuma unidade com este código.</p>
          ) : (
            <ul className="-mt-2 flex flex-col gap-1" aria-label="Unidades encontradas">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setUnit(u)
                      setErrors((x) => ({ ...x, unit: undefined }))
                    }}
                    className="flex w-full items-center gap-3 rounded-control p-2 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  >
                    <img src={u.type.photo} alt="" className="size-11 shrink-0 rounded-tip object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="tnum block text-body font-bold">{u.code}</span>
                      <span className="block truncate text-caption text-fg-3">{u.rental?.clientName ?? u.type.name}</span>
                    </span>
                    <StatusDot tone={UNIT_STATUS[u.status].tone}>{UNIT_STATUS[u.status].label}</StatusDot>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}

        <Field label="Tipo da avaria" error={errors.kind}>
          <Select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value)
              setErrors((x) => ({ ...x, kind: undefined }))
            }}
            placeholder="Escolha o tipo"
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Valor" error={errors.value}>
          <Input
            numeric
            prefix="R$"
            inputMode="decimal"
            placeholder="0,00"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setErrors((x) => ({ ...x, value: undefined }))
            }}
          />
        </Field>

        <Field label="Descrição" optional>
          <Input value={desc} maxLength={120} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: porta sem trinco, achada na retirada" />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-body font-semibold">
            Foto <span className="text-caption font-medium text-fg-3">opcional</span>
          </span>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,72px)] gap-2 p-0">
            <li>
              <AddPhoto onFiles={(f) => void addFiles(f)} label="Enviar" className="size-[72px] min-h-[72px]" />
            </li>
            {photos.map((p) => {
              const on = p.id === photoId
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Foto: ${p.label}`}
                    onClick={() => setPhotoId(on ? null : p.id)}
                    className={cn(
                      'relative block size-[72px] overflow-hidden rounded-tip bg-sunken transition-[filter,box-shadow] duration-150 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      on && 'ring-2 ring-accent ring-offset-2 ring-offset-overlay',
                    )}
                  >
                    <img src={p.src} alt="" className="size-full object-cover" draggable={false} />
                    {on ? (
                      <span aria-hidden className="absolute top-1 right-1 grid size-5 place-items-center rounded-pill bg-accent text-on-accent">
                        <Check size={14} strokeWidth={2} />
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <button type="submit" className="sr-only" tabIndex={-1}>
          Registrar avaria
        </button>
      </form>
    </Drawer>
  )
}
