import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CheckCheck, FileText, Pencil, RotateCcw, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, IconButton, RentalAvatar, TeamAvatar } from '@/components/ui'
import { TEAM } from '@/data/mock'
import { fmt } from '@/data/time'
import { AVISO_KIND, AVISO_STATUS, JOB_TYPE } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { baseTemplate, buildMessage, dm, placeOf, VARIABLES, varsOf, zoneName, type Item } from './data'
import { WhatsAppPhone } from './WhatsAppPhone'

/** Editor de mensagem: variáveis {assim} destacadas sobre o texto */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\w+\})/g).map((p, i) =>
        /^\{\w+\}$/.test(p) ? (
          <span key={i} className="rounded-[6px] bg-blue-soft text-blue shadow-[0_0_0_1.5px_var(--color-blue-soft)]">
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  )
}

function MessageEditor({ value, onChange, onReset, vars }: { value: string; onChange: (v: string) => void; onReset: () => void; vars: Record<string, string> }) {
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const insert = (v: string) => {
    const el = ref.current
    const tag = `{${v}}`
    if (!el) return onChange(value + tag)
    const a = el.selectionStart ?? value.length
    const b = el.selectionEnd ?? value.length
    onChange(value.slice(0, a) + tag + value.slice(b))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(a + tag.length, a + tag.length)
    })
  }
  const font = 'px-3.5 py-3 text-[13px] leading-[1.55] whitespace-pre-wrap break-words font-sans'
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
      <Card className="mt-3 p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[14px] font-bold text-ink">Mensagem</span>
          <button onClick={onReset} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-[12px] font-semibold text-ink-2 hover:bg-muted-2">
            <RotateCcw size={12} strokeWidth={2} /> Restaurar
          </button>
        </div>
        <div className="grid rounded-[16px] bg-surface focus-within:ring-2 focus-within:ring-black">
          <div aria-hidden className={cn('pointer-events-none col-start-1 row-start-1 text-ink', font)}>
            <Highlighted text={value} />
            {'\n'}
          </div>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            aria-label="Texto da mensagem"
            className={cn('col-start-1 row-start-1 h-full w-full resize-none overflow-hidden bg-transparent text-transparent caret-ink outline-none selection:bg-blue/20', font)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button key={v} onClick={() => insert(v)} title={vars[v]} className="h-7 rounded-full bg-blue-soft px-2.5 text-[12px] font-semibold text-blue transition-colors hover:bg-[#d8e4ff]">
              {`{${v}}`}
            </button>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
      <span className="shrink-0 text-ink-3">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-1.5 text-right font-semibold text-ink">{children}</span>
    </div>
  )
}

export function AvisoDetail({ item, custom, onCustom, onClose }: { item: Item; custom?: string; onCustom: (id: string, v: string | undefined) => void; onClose: () => void }) {
  const nav = useNavigate()
  const setStatus = useDemo((s) => s.setAvisoStatus)
  const occurrences = useDemo((s) => s.occurrences)
  const { a, rental, client, job } = item
  const [editing, setEditing] = React.useState(false)
  React.useEffect(() => setEditing(false), [a.id])
  const tpl = custom ?? baseTemplate(item)
  const st = AVISO_STATUS[a.status]
  const confirmed = a.status === 'confirmado'
  const vars = varsOf(item, occurrences)

  const send = () => {
    setStatus(a.id, 'enviado')
    toast.success(`Mensagem enviada para ${rental.contact.name}`, { description: 'Entregue pelo WhatsApp Business.' })
  }
  const confirm = () => {
    setStatus(a.id, 'confirmado')
    toast.success('Marcado como confirmado', { description: `${rental.title}, ${a.title.toLowerCase()}.` })
  }

  const sendLabel = a.status === 'programado' ? 'Enviar agora' : a.status === 'sem-resposta' ? 'Reenviar' : 'Reenviar'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <RentalAvatar rental={rental} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate text-[20px] leading-tight font-bold tracking-[-0.02em] text-ink">{rental.title}</h2>
            {item.isNew && <Badge tone="brand">Novo</Badge>}
          </div>
          <div className="mt-1 truncate text-[12.5px] text-ink-3">
            {rental.contact.name} · {rental.contact.phone}
          </div>
        </div>
        <IconButton tone="card" size={40} onClick={onClose} aria-label="Fechar">
          <X size={18} strokeWidth={1.9} />
        </IconButton>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <Card className="divide-y divide-line px-4 py-1.5">
          <Row label={AVISO_KIND[a.kind].label}>
            <span className="truncate">{a.title}</span>
          </Row>
          <Row label="Cliente">
            <span className="truncate">{client.name}</span>
          </Row>
          <Row label="Data">
            <span className="num">{fmt.date(a.dueDate)}</span>
          </Row>
          <Row label="Origem">
            <span className="truncate">{a.origin}</span>
          </Row>
          {job && (
            <Row label="Serviço">
              <TeamAvatar teamId={job.teamId} size={22} />
              <span className="truncate">
                {job.type} às <span className="num">{fmt.time(job.start)}</span>, {TEAM[job.teamId].short}
              </span>
            </Row>
          )}
          <Row label="Local">
            <span className="truncate">
              {placeOf(rental)} <span className="font-medium text-ink-3">({zoneName(item.zone)})</span>
            </span>
          </Row>
          <Row label="Status">
            <Badge tone={st.tone} dot>
              {st.label}
            </Badge>
          </Row>
          {a.status === 'programado' && <Row label="Envio">{a.kind === 'limpeza' ? 'Quando a equipe finalizar' : <span className="num">{dm(a.sendDate)} às 09:00</span>}</Row>}
        </Card>

        <div className="mt-3 rounded-[24px] bg-muted px-3 py-6">
          <WhatsAppPhone
            item={item}
            message={buildMessage(item, occurrences, tpl)}
            onQuick={(b) => {
              if (b === 'Ver relatório') nav(`/relatorio/${rental.id}`)
              else toast(`Resposta rápida: "${b}"`, { description: 'O cliente responde com um toque.' })
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => nav(`/locacoes/${rental.id}`)}>
            <ArrowUpRight size={14} strokeWidth={2} /> Abrir locação
          </Button>
          {(a.kind === 'limpeza' || job?.type === 'Limpeza') && (
            <Button variant="outline" size="sm" onClick={() => nav(`/relatorio/${rental.id}`)}>
              <FileText size={14} strokeWidth={2} /> Relatório do cliente
            </Button>
          )}
          {job && (
            <span className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold', JOB_TYPE[job.type].soft, JOB_TYPE[job.type].text)}>
              {React.createElement(JOB_TYPE[job.type].icon, { size: 14, strokeWidth: 2 })}
              {job.type}
            </span>
          )}
        </div>

        <AnimatePresence initial={false}>{editing && <MessageEditor vars={vars} value={tpl} onChange={(v) => onCustom(a.id, v)} onReset={() => onCustom(a.id, undefined)} />}</AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-card px-5 py-3.5">
        <Button variant={editing ? 'brand' : 'subtle'} size="md" onClick={() => setEditing((v) => !v)} className="mr-auto">
          <Pencil size={15} strokeWidth={1.9} /> {editing ? 'Concluir' : 'Editar'}
        </Button>
        {!confirmed && (
          <Button variant="outline" size="md" onClick={confirm}>
            <CheckCheck size={15} strokeWidth={1.9} /> Confirmado
          </Button>
        )}
        {!confirmed && (
          <Button variant="primary" size="md" onClick={send} disabled={a.status === 'enviado' || a.status === 'lido'}>
            <Send size={15} strokeWidth={1.9} /> {a.status === 'enviado' || a.status === 'lido' ? 'Enviado' : sendLabel}
          </Button>
        )}
        {confirmed && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green">
            <CheckCheck size={15} strokeWidth={1.9} /> Cliente confirmou
          </span>
        )}
      </div>
    </div>
  )
}
