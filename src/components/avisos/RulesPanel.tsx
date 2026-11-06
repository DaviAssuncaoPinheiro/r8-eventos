import * as React from 'react'
import { KPIS } from '@/data/mock'
import * as Switch from '@radix-ui/react-switch'
import { motion } from 'motion/react'
import { ArrowUpFromLine, Clock3, FileText, Lock, Mail, QrCode, RefreshCw, Truck, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, IconButton, IconCircle } from '@/components/ui'
import { cn } from '@/lib/utils'

type RuleTone = 'teal' | 'blue' | 'violet' | 'yellow' | 'brand-soft'

export interface Rule {
  id: string
  title: string
  desc: string
  icon: LucideIcon
  tone: RuleTone
  on: boolean
  /** dias de antecedência; texto fixo quando não depende de data */
  before: number | string
  /** reenviar se não ler (dias); 0 = não repetir */
  repeat: number
  options?: number[]
  stat: string
}

export const INITIAL_RULES: Rule[] = [
  { id: 'limpeza', title: 'Relatório da limpeza', desc: 'Sai quando a equipe finaliza a limpeza no app, com o link do relatório e as fotos.', icon: FileText, tone: 'teal', on: true, before: 'Ao concluir', repeat: 0, stat: `${KPIS.cleaningsMonth} enviados no mês` },
  { id: 'montagem', title: 'Confirmação de montagem', desc: 'Data, horário, equipe e placa do caminhão.', icon: Truck, tone: 'blue', on: true, before: 1, repeat: 0, options: [1, 2, 3], stat: '23 enviados no mês' },
  { id: 'retirada', title: 'Aviso de retirada', desc: 'Pergunta se pode retirar ou se o cliente quer renovar.', icon: ArrowUpFromLine, tone: 'violet', on: true, before: 2, repeat: 1, options: [1, 2, 5], stat: '14 enviados no mês' },
  { id: 'renovacao', title: 'Renovação de contrato', desc: 'Para obras com contrato mensal.', icon: RefreshCw, tone: 'yellow', on: true, before: 5, repeat: 3, options: [3, 5, 10], stat: '9 enviados no mês' },
  { id: 'ocorrencia', title: 'Aviso pelo QR da porta', desc: 'Responde na hora a quem avisou e ao contato da obra, com o prazo da equipe.', icon: QrCode, tone: 'brand-soft', on: true, before: 'Na hora', repeat: 0, stat: '9 respondidos no mês' },
]

function Chips<T extends string | number>({ value, options, onChange, disabled }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.v)}
          disabled={disabled}
          onClick={() => onChange(o.v)}
          className={cn('h-8 rounded-full px-3 text-[12.5px] font-semibold transition-colors disabled:pointer-events-none', value === o.v ? 'bg-black text-white' : 'bg-muted text-ink-2 hover:bg-muted-2')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Sw({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Switch.Root checked={checked} onCheckedChange={onChange} aria-label={label} className="relative h-[26px] w-[44px] shrink-0 rounded-full bg-line-2 transition-colors data-[state=checked]:bg-black">
      <Switch.Thumb className="block size-[22px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out data-[state=checked]:translate-x-[20px] data-[state=checked]:bg-brand" />
    </Switch.Root>
  )
}

const days = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`

export function RulesPanel({
  rules,
  setRules,
  hour,
  setHour,
  email,
  setEmail,
  onClose,
}: {
  rules: Rule[]
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>
  hour: string
  setHour: (h: string) => void
  email: boolean
  setEmail: (v: boolean) => void
  onClose: () => void
}) {
  const patch = (id: string, p: Partial<Rule>) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const active = rules.filter((r) => r.on).length
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-ink">Regras</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-3">
            {active} de {rules.length} ativas
          </p>
        </div>
        <IconButton tone="card" size={40} onClick={onClose} aria-label="Fechar">
          <X size={18} strokeWidth={1.9} />
        </IconButton>
      </div>

      <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        <Card className="divide-y divide-line">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <IconCircle tone="muted" size={40}>
              <Mail size={18} strokeWidth={1.9} />
            </IconCircle>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-ink">Cópia do relatório por e-mail</div>
              <div className="text-[12.5px] text-ink-3">Para o e-mail cadastrado do cliente</div>
            </div>
            <Sw checked={email} onChange={setEmail} label="Cópia do relatório por e-mail" />
          </div>
        </Card>

        <h3 className="px-2 pt-3 pb-1 text-[16px] font-bold text-ink">Por tipo</h3>
        {rules.map((rule, i) => {
          const Icon = rule.icon
          return (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <IconCircle tone={rule.on ? rule.tone : 'muted'} size={40}>
                    <Icon size={18} strokeWidth={1.9} />
                  </IconCircle>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[14.5px] font-bold', rule.on ? 'text-ink' : 'text-ink-3')}>{rule.title}</div>
                    <p className="text-[12.5px] leading-snug text-ink-3">{rule.on ? rule.desc : 'Desligada'}</p>
                  </div>
                  <Sw checked={rule.on} onChange={(v) => patch(rule.id, { on: v })} label={rule.title} />
                </div>
                <div className={cn('mt-3.5 grid gap-2.5 transition-opacity', !rule.on && 'opacity-40')}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-[76px] shrink-0 text-[12px] text-ink-3">Quando</span>
                    {typeof rule.before === 'string' || !rule.options ? (
                      <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-[12.5px] font-semibold text-ink-2">
                        <Lock size={12} strokeWidth={2} /> {rule.before}
                      </span>
                    ) : (
                      <Chips disabled={!rule.on} value={rule.before} onChange={(v) => patch(rule.id, { before: v })} options={rule.options.map((n) => ({ v: n, label: `${days(n)} antes` }))} />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-[76px] shrink-0 text-[12px] text-ink-3">Se não ler</span>
                    <Chips
                      disabled={!rule.on}
                      value={rule.repeat}
                      onChange={(v) => patch(rule.id, { repeat: v })}
                      options={[
                        { v: 0, label: 'Não repetir' },
                        { v: 1, label: 'No dia seguinte' },
                        { v: 3, label: 'Em 3 dias' },
                      ]}
                    />
                  </div>
                </div>
                {rule.on && <div className="mt-3 text-[12px] text-ink-3">{rule.stat}</div>}
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-2 bg-card px-5 py-3.5">
        <Button variant="subtle" onClick={onClose}>
          Fechar
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            toast.success('Regras salvas', { description: `${active} ${active === 1 ? 'regra ativa' : 'regras ativas'}.` })
            onClose()
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}
