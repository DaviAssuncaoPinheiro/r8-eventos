// Etapa 2: checklist do serviço e insumos usados (limpeza)
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHECKLISTS } from '@/lib/history'
import { checklistDone } from './campoStore'
import { Pressable } from './kit'
import { Block, CheckRow, StepFrame, StepIntro, TextArea, type StepProps } from './stepKit'

export function StepChecklist({ job, draft, patch, layout, eyebrow }: StepProps) {
  const list = CHECKLISTS[job.type]
  const done = checklistDone(job, draft)
  const toggle = (l: string) => patch((d) => ({ checklist: { ...d.checklist, [l]: !d.checklist[l] } }))
  const setQty = (id: string, q: number) => patch((d) => ({ supplies: d.supplies.map((s) => (s.id === id ? { ...s, qty: Math.max(0, q) } : s)) }))

  const left = (
    <Block
      title="Checklist"
      hint={`${done} de ${list.length} feitos`}
      action={
        done < list.length ? (
          <button onClick={() => patch({ checklist: Object.fromEntries(list.map((l) => [l, true])) })} className="h-9 shrink-0 rounded-full bg-muted px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-muted-2">
            Marcar tudo
          </button>
        ) : undefined
      }
      bodyClassName="px-2.5"
    >
      <div className="flex flex-col" data-noswipe>
        {list.map((l, i) => (
          <div key={l} className={cn(i > 0 && 'border-t border-line')}>
            <CheckRow on={!!draft.checklist[l]} onClick={() => toggle(l)} title={l} />
          </div>
        ))}
      </div>
    </Block>
  )

  const right = (
    <>
      {draft.supplies.length > 0 && (
        <Block title="Insumos usados" hint="Saem do estoque do caminhão" bodyClassName="px-3">
          <ul className="flex flex-col" data-noswipe>
            {draft.supplies.map((s, i) => (
              <li key={s.id} className={cn('flex items-center gap-3 px-2 py-3', i > 0 && 'border-t border-line')}>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{s.label}</span>
                <Pressable scale={0.88} aria-label={`Menos ${s.label}`} onClick={() => setQty(s.id, s.qty - s.step)} className="flex size-10 items-center justify-center rounded-full bg-muted text-ink">
                  <Minus className="size-4" strokeWidth={2.4} />
                </Pressable>
                <span className="w-[86px] text-center leading-tight">
                  <span className="num block text-[19px] font-bold text-ink">{s.qty}</span>
                  <span className="block text-[11.5px] font-semibold text-ink-3">{s.qty === 1 ? s.unit[0] : s.unit[1]}</span>
                </span>
                <Pressable scale={0.88} aria-label={`Mais ${s.label}`} onClick={() => setQty(s.id, s.qty + s.step)} className="flex size-10 items-center justify-center rounded-full bg-black text-white">
                  <Plus className="size-4" strokeWidth={2.4} />
                </Pressable>
              </li>
            ))}
          </ul>
        </Block>
      )}
      <Block title="Observações" hint="Opcional. Vai para o relatório do cliente">
        <TextArea rows={3} value={draft.notes} onChange={(e) => patch({ notes: e.target.value.slice(0, 400) })} placeholder={job.type === 'Limpeza' ? 'Ex.: uso intenso no térreo, reforçar papel na sexta' : 'Algo que o cliente precisa saber'} />
      </Block>
    </>
  )

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow={eyebrow} title="Checklist">
          {job.type === 'Limpeza' ? 'Marque o que foi feito em todas as unidades' : 'Confira antes de sair do local'}
        </StepIntro>
      }
      left={left}
      right={right}
    />
  )
}
