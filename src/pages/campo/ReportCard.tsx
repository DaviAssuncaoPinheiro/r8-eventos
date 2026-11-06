// Cartão "Relatório do cliente" da tela de concluído: prévia em miniatura, abrir e enviar no WhatsApp.
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Camera, ClipboardCheck, MessageCircle, PenLine, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { RentalAvatar } from '@/components/ui'
import { COMPANY, RENTAL, type Job } from '@/data/mock'
import { demoPhotosFor } from '@/lib/history'
import { useDemo, type ServiceReport } from '@/store'
import { notify } from './campoStore'
import { contactFirst, dateShort, phoneDigits } from './data'
import { clientMessage } from './finalize'
import { EASE_OUT, Pressable, SafeImg } from './kit'

/** Fotos do relatório: as tiradas no app ou, em registros antigos, as ilustrativas */
export function useReportPhotos(job: Job, rep: ServiceReport) {
  const stored = useDemo((s) => s.photos)
  const own = stored.filter((p) => rep.photoIds.includes(p.id) || p.jobId === job.id).map((p) => ({ id: p.id, src: p.src, label: p.label }))
  if (own.length) return own
  return demoPhotosFor(job).map((p, i) => ({ id: `demo-${i}`, ...p }))
}

export function ReportCard({ job, rep, className, delay = 0.75 }: { job: Job; rep: ServiceReport; className?: string; delay?: number }) {
  const nav = useNavigate()
  const r = RENTAL[job.rentalId]
  const first = contactFirst(r)
  const photos = useReportPhotos(job, rep)
  const href = `/relatorio/${r.id}?s=${job.id}`

  const send = () => {
    notify({ kind: 'whatsapp', title: `Enviado para ${first}`, body: `Relatório de ${r.title} com fotos e assinatura.` })
    window.open(`https://wa.me/${phoneDigits(r.contact.phone)}?text=${encodeURIComponent(clientMessage(job, rep))}`, '_blank', 'noopener')
  }

  const okUnits = rep.units.filter((u) => u.ok).length
  const rows = [
    { icon: ClipboardCheck, text: rep.units.length ? `${okUnits} de ${rep.units.length} unidades` : rep.items ? `${rep.items.reduce((a, i) => a + i.done, 0).toLocaleString('pt-BR')} itens conferidos` : `${rep.checklist.filter((c) => c.ok).length} itens do checklist` },
    { icon: Camera, text: `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}` },
    { icon: TriangleAlert, text: rep.occurrences.length ? `${rep.occurrences.length} ${rep.occurrences.length === 1 ? 'ocorrência' : 'ocorrências'}` : 'Sem ocorrências' },
    { icon: PenLine, text: rep.signedBy ? `Assinado por ${rep.signedBy.split(' ')[0]}` : 'Sem assinatura' },
  ]

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: EASE_OUT }} className={cn('overflow-hidden rounded-[28px] bg-black p-2 text-white', className)}>
      <div className="flex items-center justify-between px-3 pt-3 pb-3">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.02em]">Relatório do cliente</h3>
          <div className="text-[13px] font-medium text-white/55">Link para {first} acompanhar</div>
        </div>
        <span className="inline-flex h-7 items-center rounded-full bg-brand px-2.5 text-[12px] font-bold text-white">Pronto</span>
      </div>

      {/* prévia em miniatura */}
      <Pressable scale={0.985} onClick={() => nav(href)} aria-label="Abrir relatório" className="block w-full rounded-[22px] bg-surface p-3 text-left text-ink">
        <div className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="text-[12px] font-bold">{COMPANY.name}</span>
          <span className="ml-auto text-[11px] font-semibold text-ink-3">{dateShort(rep.finishedAt)}</span>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-card p-2.5 shadow-card">
          <RentalAvatar rental={r} size={42} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold">{r.title}</div>
            <div className="line-clamp-2 text-[11.5px] leading-snug font-medium text-ink-3">{rep.summary}</div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {rows.map((x) => (
            <span key={x.text} className="flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-card px-2.5 text-[11.5px] font-semibold text-ink-2 shadow-card">
              <x.icon className="size-3.5 shrink-0 text-ink" strokeWidth={2} />
              <span className="truncate">{x.text}</span>
            </span>
          ))}
        </div>
        {photos.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {photos.slice(0, 4).map((p) => (
              <SafeImg key={p.id} src={p.src} alt={p.label} className="size-11 rounded-[12px] object-cover" />
            ))}
            {photos.length > 4 && <span className="flex size-11 items-center justify-center rounded-[12px] bg-card text-[12px] font-bold">+{photos.length - 4}</span>}
          </div>
        )}
      </Pressable>

      <div className="mt-2 flex flex-col gap-2 min-[440px]:grid min-[440px]:grid-cols-2">
        <Pressable onClick={() => nav(href)} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 text-[14px] font-semibold text-white hover:bg-white/15">
          Ver relatório do cliente <ArrowUpRight className="size-4 text-white/60" strokeWidth={2.2} />
        </Pressable>
        <Pressable onClick={send} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-brand px-3 text-[14px] font-semibold text-white hover:bg-brand-2">
          <MessageCircle className="size-4" strokeWidth={2.2} /> Reenviar no WhatsApp
        </Pressable>
      </div>
    </motion.section>
  )
}
