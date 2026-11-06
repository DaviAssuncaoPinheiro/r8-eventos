import * as React from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, BadgeCheck, Check, CheckCheck, Clock, Lock, Mic, MoreVertical, Phone, Plus, Reply, Smile, Video } from 'lucide-react'
import { LogoMark } from '@/components/AppShell'
import { COMPANY, simNow } from '@/data/mock'
import { daysFromToday, fmt } from '@/data/time'
import { cn } from '@/lib/utils'
import { QUICK, contactFirst, dm, type Item } from './data'

const CHAT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cg fill='none' stroke='%23b9ad93' stroke-opacity='.22' stroke-width='1.2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='14' r='3.2'/%3E%3Ccircle cx='20' cy='9' r='2.2'/%3E%3Ccircle cx='28' cy='14' r='2.2'/%3E%3Cpath d='M14 22c2-4 8-4 10 0 1 3-2 5-5 5s-6-2-5-5z'/%3E%3Cpath d='M48 50l6-6 6 6-6 6z'/%3E%3Cpath d='M44 18h10M49 13v10'/%3E%3Cpath d='M10 54c4-3 8 3 12 0'/%3E%3C/g%3E%3C/svg%3E\")"

/** Negrito do WhatsApp (*texto*) e links clicáveis em azul */
function renderRich(text: string) {
  return text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line.split(/(\*[^*]+\*|https?:\/\/\S+)/g).map((p, j) =>
        p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
          <strong key={j} className="font-semibold">
            {p.slice(1, -1)}
          </strong>
        ) : /^https?:\/\//.test(p) ? (
          <span key={j} className="break-all text-[#027eb5] underline decoration-[#027eb5]/40">
            {p}
          </span>
        ) : (
          <React.Fragment key={j}>{p}</React.Fragment>
        ),
      )}
    </React.Fragment>
  ))
}

function Bubble({ out, children, time, ticks, buttons, onButton, pending }: { out?: boolean; children: React.ReactNode; time: string; ticks?: 'sent' | 'read' | 'wait'; buttons?: string[]; onButton?: (b: string) => void; pending?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={cn('flex flex-col', out ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'relative max-w-[88%] rounded-lg px-2 pt-1.5 pb-1 text-[13px] leading-[1.38] text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,.13)]',
          out ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white',
        )}
      >
        <span className={cn('absolute top-0 size-2', out ? '-right-[7px] bg-[#d9fdd3] [clip-path:polygon(0_0,0_100%,100%_0)]' : '-left-[7px] bg-white [clip-path:polygon(100%_0,0_0,100%_100%)]')} />
        <div className="break-words whitespace-normal">
          {children}
          <span className="float-right mt-1.5 ml-2 inline-flex translate-y-0.5 items-center gap-0.5 text-[10.5px] leading-none text-[#667781]">
            {time}
            {out && (pending ? <Clock size={12} strokeWidth={2} /> : ticks === 'read' ? <CheckCheck size={15} strokeWidth={2} className="text-[#53bdeb]" /> : ticks === 'sent' ? <CheckCheck size={15} strokeWidth={2} /> : <Check size={14} strokeWidth={2} />)}
          </span>
        </div>
      </div>
      {buttons && (
        <div className="mt-0.5 flex w-[88%] max-w-[88%] flex-col gap-0.5">
          {buttons.map((b) => (
            <button key={b} onClick={() => onButton?.(b)} className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white text-[13px] font-medium text-[#027eb5] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] transition-colors hover:bg-[#f5f6f6]">
              <Reply size={14} strokeWidth={2} /> {b}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function Chip({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'sys' }) {
  return (
    <div className="flex justify-center">
      <span className={cn('rounded-lg px-2.5 py-1 text-center text-[11px] shadow-[0_1px_0.5px_rgba(11,20,26,.1)]', tone === 'plain' ? 'bg-white/90 text-[#54656f]' : 'bg-[#fff5c4] text-[#54656f]')}>{children}</span>
    </div>
  )
}

const clock = (d: Date) => fmt.time(d)

export function WhatsAppPhone({ item, message, onQuick, className }: { item: Item; message: string; onQuick?: (b: string) => void; className?: string }) {
  const { a, rental } = item
  const programmed = a.status === 'programado'
  const send = new Date(a.sendDate)
  const now = simNow()
  const sentAt = send > now ? now : send
  const sentToday = daysFromToday(sentAt) === 0
  const read = a.status === 'lido' || a.status === 'confirmado'
  const replyAt = new Date(sentAt.getTime() + (12 + (parseInt(a.id.replace(/\D/g, '') || '3', 10) * 17) % 70) * 60000)
  const followUp = a.status === 'sem-resposta'
  // lembrete automático: no dia seguinte, ou 2 h depois se foi enviado hoje (só se já passou)
  const followAt = new Date(sentAt.getTime() + (sentToday ? 2 * 3600000 : 86400000))
  const showFollow = followUp && followAt <= now
  const silentDays = Math.max(0, -daysFromToday(sentAt))
  const autoOnFinish = programmed && a.kind === 'limpeza'

  return (
    <div className={cn('mx-auto w-[292px] rounded-[40px] bg-black p-[9px] shadow-float', className)}>
      <div className="relative overflow-hidden rounded-[32px] bg-[#efeae2]">
        {/* barra de status */}
        <div className="flex h-6 items-center justify-between bg-[#008069] px-5 pt-1 text-[10px] font-medium text-white/90">
          <span>{clock(now)}</span>
          <span className="absolute top-1.5 left-1/2 h-[14px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
          <span className="tracking-tight">5G ▮▮▮</span>
        </div>
        {/* cabeçalho */}
        <div className="flex items-center gap-1.5 bg-[#008069] px-2 pt-1.5 pb-2 text-white">
          <ArrowLeft size={19} strokeWidth={2} />
          <span className="size-9 shrink-0 overflow-hidden rounded-full bg-card">
            <LogoMark size={36} />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1 text-[14.5px] font-medium">
              {COMPANY.name} <BadgeCheck size={14} strokeWidth={2} className="shrink-0 fill-[#25d366] text-[#008069]" />
            </div>
            <div className="text-[11px] text-white/75">Conta comercial</div>
          </div>
          <Video size={18} strokeWidth={1.8} />
          <Phone size={16} strokeWidth={1.8} className="ml-1.5" />
          <MoreVertical size={17} strokeWidth={1.8} />
        </div>
        {/* conversa */}
        <div className="scroll-thin flex h-[392px] flex-col gap-1.5 overflow-y-auto px-2.5 py-2.5" style={{ backgroundImage: CHAT_BG, backgroundColor: '#efeae2' }}>
          <Chip>{programmed ? 'Mensagem programada' : sentToday ? 'Hoje' : `${dm(sentAt)}/${sentAt.getFullYear()}`}</Chip>
          <Chip tone="sys">
            <Lock size={10} strokeWidth={2.4} className="mr-1 inline -translate-y-px" />
            Conversa com conta comercial verificada.
          </Chip>
          <Bubble out time={clock(programmed ? send : sentAt)} ticks={read ? 'read' : 'sent'} pending={programmed} buttons={QUICK[a.kind]} onButton={onQuick}>
            {renderRich(message)}
          </Bubble>
          {programmed && <Chip tone="sys">{autoOnFinish ? 'Sai sozinha quando a equipe finalizar a limpeza no app' : `Envio automático em ${dm(send)} às ${clock(send)}`}</Chip>}
          {followUp && !showFollow && <Chip tone="sys">Sem resposta desde as {clock(sentAt)}</Chip>}
          {showFollow && (
            <>
              {daysFromToday(followAt) !== daysFromToday(sentAt) && (
                <Chip>{daysFromToday(followAt) === 0 ? 'Hoje' : `${dm(followAt)}/${followAt.getFullYear()}`}</Chip>
              )}
              <Bubble out time={clock(followAt)} ticks="sent">
                {renderRich(`Oi, ${contactFirst(rental.contact.name)}! Conseguiu ver a mensagem sobre *${rental.title}*? Se preferir, me liga no ${COMPANY.whatsapp}.`)}
              </Bubble>
              <Chip tone="sys">{silentDays === 0 ? `Sem resposta desde as ${clock(sentAt)}` : `Sem resposta há ${silentDays} ${silentDays === 1 ? 'dia' : 'dias'}`}</Chip>
            </>
          )}
          {a.reply && <Bubble time={clock(replyAt)}>{a.reply}</Bubble>}
          {a.status === 'confirmado' && !a.reply && <Bubble time={clock(replyAt)}>Confirmado, obrigado!</Bubble>}
        </div>
        {/* campo de mensagem */}
        <div className="flex items-center gap-1.5 bg-[#f0f2f5] px-2 py-2">
          <div className="flex h-8 flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 text-[12.5px] text-[#8696a0]">
            <Smile size={16} strokeWidth={1.8} /> Mensagem
            <Plus size={16} strokeWidth={1.8} className="ml-auto" />
          </div>
          <span className="flex size-8 items-center justify-center rounded-full bg-[#00a884] text-white">
            <Mic size={16} strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  )
}
