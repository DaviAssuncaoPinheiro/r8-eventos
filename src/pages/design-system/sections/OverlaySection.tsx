import * as React from 'react'
import { Copy, FileText, Pencil, Plus, Printer, Search, Trash2, Truck, Wrench, Inbox, MoreHorizontal } from 'lucide-react'
import { Badge, Banner, Button, Card, EmptyState, Field, Input, Money, Textarea } from '@/ui'
import { Dialog, DialogStatic } from '@/ui/Dialog'
import { Drawer } from '@/ui/Drawer'
import { Menu, MenuStatic, type MenuEntry } from '@/ui/Menu'
import { AppToaster, notify, ToastCard } from '@/ui/Toast'
import { Stepper, StepperFooter, type StepperStep } from '@/ui/Stepper'
import { AiTag, CopilotCard, CopilotValue, type CopilotStatus } from '@/ui/Copilot'
import { DsSection, Specimen, StateCell } from '../kit'

const TOASTER = 'ds-overlay'

/* ───────── diálogos ───────── */

function ChargeForm() {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Valor da cobrança" help="Soma da avaria da BQ-0142 e da limpeza extra.">
        <Input prefix="R$" numeric defaultValue="420,00" inputMode="decimal" />
      </Field>
      <Field label="Vencimento">
        <Input defaultValue="18/11/2026" inputMode="numeric" />
      </Field>
    </div>
  )
}

function DamageForm() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Equipamento">
          <Input defaultValue="BQ-0142" />
        </Field>
        <Field label="Locação">
          <Input defaultValue="Construtora Planalto, obra Asa Norte" />
        </Field>
      </div>
      <Field label="O que aconteceu" optional help="Conte o que a equipe viu na retirada.">
        <Textarea defaultValue="Porta sem trinco e piso trincado, encontrados na retirada de 03/11/2026." />
      </Field>
      <Field label="Valor a cobrar">
        <Input prefix="R$" numeric defaultValue="420,00" inputMode="decimal" />
      </Field>
    </div>
  )
}

const REVIEW_ROWS = [
  { d: 'Mensalidade outubro, 12 unidades', v: 12480 },
  { d: 'Limpeza extra, 12 unidades', v: 3184.5 },
  { d: 'Avaria BQ-0142', v: 420 },
  { d: 'Taxa de deslocamento, Taguatinga', v: 180 },
  { d: 'Retirada fora do horário', v: 260 },
  { d: 'Diária de evento, palco 6 x 4 m', v: 2900 },
  { d: 'Som e luz, 2 diárias', v: 1850 },
  { d: 'Desconto contratual', v: -640 },
  { d: 'Reposição de papel e produto, 40 kits', v: 316 },
  { d: 'Limpeza pós evento, Parque da Cidade', v: 540 },
]

function ReviewTable() {
  return (
    <div className="rounded-control bg-sunken">
      {REVIEW_ROWS.map((r) => (
        <div key={r.d} className="flex h-12 items-center justify-between gap-4 border-b border-hairline px-4 last:border-b-0">
          <span className="min-w-0 truncate text-body">{r.d}</span>
          <Money variant="cell" value={r.v} />
        </div>
      ))}
    </div>
  )
}

function DialogDemos() {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Dialog
          size="sm"
          title="Gerar cobrança"
          description="A cobrança vai para a Construtora Planalto por e-mail e WhatsApp."
          confirmLabel="Gerar cobrança"
          onConfirm={() => notify.success('Cobrança gerada para a Construtora Planalto', { toasterId: TOASTER })}
          trigger={<Button variant="primary">Diálogo pequeno</Button>}
        >
          <ChargeForm />
        </Dialog>
        <Dialog size="md" title="Registrar avaria" description="A avaria entra na próxima cobrança da locação." confirmLabel="Registrar avaria" trigger={<Button>Diálogo médio</Button>}>
          <DamageForm />
        </Dialog>
        <Dialog size="lg" title="Revisar cobrança de outubro" description="Confira os lançamentos antes de enviar. O corpo rola por dentro quando passa da altura da tela." confirmLabel="Enviar cobrança" trigger={<Button>Diálogo grande</Button>}>
          <ReviewTable />
        </Dialog>
        <Dialog
          size="sm"
          destructive
          title="Excluir avaria"
          description="A avaria da BQ-0142 sai da cobrança de R$ 420,00 e não pode ser recuperada."
          confirmLabel="Excluir avaria"
          onConfirm={() => notify.success('Avaria excluída', { toasterId: TOASTER, action: { label: 'Desfazer', onClick: () => {} } })}
          trigger={
            <Button variant="danger" icon={Trash2}>
              Diálogo destrutivo
            </Button>
          }
        />
      </div>
    </>
  )
}

/* ───────── menu ───────── */

const MENU_ITEMS: MenuEntry[] = [
  { label: 'Editar locação', icon: Pencil, shortcut: 'E' },
  { label: 'Duplicar', icon: Copy, shortcut: 'D' },
  { label: 'Imprimir contrato', icon: Printer, shortcut: 'Ctrl P' },
  { label: 'Enviar relatório', icon: FileText, disabled: true },
  { type: 'separator' },
  { label: 'Excluir locação', icon: Trash2, danger: true },
]

/* ───────── passo a passo ───────── */

const STEPS: StepperStep[] = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'equipamentos', label: 'Equipamentos' },
  { id: 'periodo', label: 'Período' },
  { id: 'valores', label: 'Valores' },
  { id: 'revisao', label: 'Revisão' },
]

function StepperDemo() {
  const [current, setCurrent] = React.useState(2)
  return (
    <Card>
      <Stepper steps={STEPS} current={current} onStepClick={setCurrent} />
      <div className="mt-5 rounded-control bg-sunken p-4">
        <p className="text-body font-semibold">{STEPS[current].label}</p>
        <p className="mt-1 text-body text-fg-2">Passo {current + 1} de {STEPS.length}. Clique num passo concluído para voltar a ele.</p>
      </div>
      <StepperFooter
        className="mt-5"
        backDisabled={current === 0}
        onBack={() => setCurrent((c) => Math.max(0, c - 1))}
        onNext={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
        nextLabel={current === STEPS.length - 1 ? 'Concluir locação' : 'Continuar'}
      />
    </Card>
  )
}

/* ───────── copiloto ───────── */

function CopilotDemo() {
  const [status, setStatus] = React.useState<CopilotStatus>('idle')
  const [gone, setGone] = React.useState(false)
  const timer = React.useRef<number>()
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  if (gone) {
    return (
      <Card variant="sunken" className="flex flex-col items-start gap-3">
        <p className="text-body text-fg-2">Sugestão dispensada. Ela não volta a aparecer para esta locação.</p>
        <Button size="sm" onClick={() => setGone(false)}>
          Restaurar exemplo
        </Button>
      </Card>
    )
  }
  return (
    <CopilotCard
      status={status}
      suggestion={
        <>
          A BQ-0142 voltou com avaria <CopilotValue>3 vezes</CopilotValue> em 60 dias. Cobrar <CopilotValue>R$ 420,00</CopilotValue> da Construtora Planalto?
        </>
      }
      source="Com base em 3 retiradas"
      approveLabel="Gerar cobrança"
      onApprove={() => {
        setStatus('loading')
        timer.current = window.setTimeout(() => setStatus('done'), 900)
      }}
      onDismiss={() => setGone(true)}
      doneMessage="Cobrança enviada para a Construtora Planalto"
      doneDetail="R$ 420,00, vencimento em 18/11/2026"
      doneAction={{ label: 'Voltar ao exemplo', onClick: () => setStatus('idle') }}
    />
  )
}

/* ───────── seção ───────── */

export default function OverlaySection() {
  const [banner, setBanner] = React.useState({ info: true, warn: true })

  return (
    <DsSection
      id="sobreposicoes"
      title="Sobreposições e fluxo"
      intro="Diálogo, gaveta, menu, toast, faixa de aviso, estado vazio, passo a passo, etiqueta Pacote IA e cartão do Copiloto. Sobreposição só quando a tarefa exige: primeiro tente fazer no próprio lugar."
    >
      <AppToaster id={TOASTER} />

      <Specimen
        title="Diálogo"
        note="480, 640 ou 800 de largura, rolagem no corpo, Esc fecha e o foco volta ao botão. O foco inicial vai para o primeiro campo, ou para Cancelar na variante destrutiva. Abaixo de 640px vira gaveta inferior."
      >
        <div className="flex flex-col gap-6">
          <DialogDemos />
          <div className="grid grid-cols-1 gap-6 rounded-card bg-scrim p-4 sm:p-8 xl:grid-cols-2">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <DialogStatic size="sm" title="Gerar cobrança" description="A cobrança vai para a Construtora Planalto por e-mail e WhatsApp." confirmLabel="Gerar cobrança">
                <ChargeForm />
              </DialogStatic>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2">
              <DialogStatic size="sm" destructive title="Excluir avaria" description="A avaria da BQ-0142 sai da cobrança de R$ 420,00 e não pode ser recuperada." confirmLabel="Excluir avaria" />
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen title="Gaveta" note="Lateral de 480 (detalhe) ou 640 (formulário longo) no escritório; inferior com puxador no celular, arrasta para baixo para fechar.">
        <div className="flex flex-wrap gap-2">
          <Drawer
            side="right"
            width={480}
            title="Locação 2026-0318"
            description="Construtora Planalto, obra Asa Norte"
            trigger={<Button>Gaveta lateral 480</Button>}
            footer={
              <>
                <Button>Imprimir contrato</Button>
                <Button variant="primary">Gerar cobrança</Button>
              </>
            }
          >
            <dl className="flex flex-col gap-4 text-body">
              {[
                ['Equipamentos', '12 banheiros químicos, 2 pias portáteis'],
                ['Período', '03/11/2026 a 03/12/2026'],
                ['Mensalidade', 'R$ 12.480,00'],
                ['Situação', 'Em andamento'],
                ['Região', 'Plano Piloto, Brasília/DF'],
                ['Contato', '(61) 99841-2207'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 border-b border-hairline pb-4 last:border-b-0">
                  <dt className="text-caption text-fg-3">{k}</dt>
                  <dd className="text-body font-semibold tnum">{v}</dd>
                </div>
              ))}
            </dl>
          </Drawer>
          <Drawer
            side="right"
            width={640}
            title="Nova locação"
            trigger={<Button>Gaveta lateral 640</Button>}
            footer={
              <>
                <Button>Cancelar</Button>
                <Button variant="primary">Criar locação</Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="Cliente">
                <Input placeholder="Ex.: Construtora Planalto" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Início">
                  <Input placeholder="03/11/2026" inputMode="numeric" />
                </Field>
                <Field label="Fim">
                  <Input placeholder="03/12/2026" inputMode="numeric" />
                </Field>
              </div>
              <Field label="Observações" optional>
                <Textarea />
              </Field>
            </div>
          </Drawer>
          <Drawer
            side="bottom"
            title="Registrar avaria"
            description="BQ-0142, Construtora Planalto"
            trigger={<Button>Gaveta inferior</Button>}
            footer={
              <>
                <Button size="field" variant="primary" block>
                  Registrar avaria
                </Button>
                <Button size="lg" variant="ghost" block>
                  Cancelar
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="O que aconteceu">
                <Textarea defaultValue="Porta sem trinco." />
              </Field>
              <Field label="Valor a cobrar">
                <Input size="lg" prefix="R$" numeric defaultValue="420,00" inputMode="decimal" />
              </Field>
            </div>
          </Drawer>
        </div>
      </Specimen>

      <Specimen title="Menu" note="Setas navegam, Enter escolhe, Esc fecha. Ação de perigo por último, depois do divisor.">
        <div className="flex flex-wrap items-start gap-8">
          <StateCell label="Aberto por botão">
            <Menu
              trigger={
                <Button icon={MoreHorizontal} aria-haspopup="menu">
                  Ações da locação
                </Button>
              }
              items={MENU_ITEMS}
            />
          </StateCell>
          <StateCell label="Versão em linha, com foco no segundo item">
            <MenuStatic items={MENU_ITEMS} highlighted={1} />
          </StateCell>
        </div>
      </Specimen>

      <Specimen title="Toast" note="Uma frase, topo central no escritório e inferior no celular. 5 segundos (8 com ação), pausa ao passar o mouse.">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => notify.success('Cobrança gerada para a Construtora Planalto', { toasterId: TOASTER })}>Mostrar sucesso</Button>
            <Button onClick={() => notify.error('Não foi possível enviar a cobrança. Confira o e-mail do cliente.', { toasterId: TOASTER })}>Mostrar erro</Button>
            <Button onClick={() => notify.info('3 mensalidades vencem hoje', { toasterId: TOASTER, description: 'R$ 7.420,00 no total' })}>Mostrar informação</Button>
            <Button onClick={() => notify.success('Avaria excluída', { toasterId: TOASTER, action: { label: 'Desfazer', onClick: () => {} } })}>Mostrar com ação</Button>
          </div>
          <div className="flex flex-wrap items-start gap-4 rounded-card bg-sunken p-4">
            <ToastCard tone="success" message="Cobrança gerada para a Construtora Planalto" />
            <ToastCard tone="error" message="Não foi possível enviar a cobrança" description="Confira o e-mail do cliente e tente de novo." />
            <ToastCard tone="success" message="Avaria excluída" action={{ label: 'Desfazer', onClick: () => {} }} />
          </div>
        </div>
      </Specimen>

      <Specimen title="Faixa de aviso" note="Em linha no topo do conteúdo, nunca flutua. Quatro tons, com ou sem ação e botão de fechar.">
        <div className="flex flex-col gap-3">
          {banner.info ? (
            <Banner tone="info" title="Tabela de preços atualizada." onClose={() => setBanner((b) => ({ ...b, info: false }))}>
              Os novos valores valem para locações criadas a partir de hoje.
            </Banner>
          ) : null}
          {banner.warn ? (
            <Banner
              tone="warn"
              title="3 mensalidades vencem hoje, R$ 7.420,00 no total."
              action={<Button size="sm">Ver cobranças</Button>}
              onClose={() => setBanner((b) => ({ ...b, warn: false }))}
            />
          ) : null}
          {!banner.info || !banner.warn ? (
            <div>
              <Button size="sm" onClick={() => setBanner({ info: true, warn: true })}>
                Mostrar avisos dispensados
              </Button>
            </div>
          ) : null}
          <Banner tone="danger" title="Cobrança atrasada há 6 dias.">
            A Construtora Planalto deve R$ 3.184,50.
          </Banner>
          <Banner tone="ok" title="Cobrança paga." action={<Button size="sm">Ver recibo</Button>}>
            Pagamento de R$ 12.480,00 confirmado em 03/11/2026.
          </Banner>
        </div>
      </Specimen>

      <Specimen title="Estado vazio" note="Dentro do contêiner que estaria cheio. Diz o que vai aparecer, o próximo passo e a ação que resolve. Sem ilustração.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card padding="none">
            <EmptyState
              icon={Wrench}
              title="As avarias registradas pela equipe aparecem aqui"
              action={
                <Button variant="primary" icon={Plus}>
                  Registrar avaria
                </Button>
              }
            >
              Quando um retirador anotar uma avaria no app de campo, ela entra nesta lista.
            </EmptyState>
          </Card>
          <Card padding="none">
            <EmptyState
              variant="search"
              title="Nenhuma locação para essa busca"
              action={
                <Button icon={Search}>
                  Limpar filtros
                </Button>
              }
            >
              Nada em andamento com o filtro "Construtora Planalto" e região Taguatinga.
            </EmptyState>
          </Card>
        </div>
      </Specimen>

      <Specimen title="Passo a passo" note="Escritório: barra com passos; os concluídos são clicáveis. Campo: contador, título e barra de progresso de 4px.">
        <div className="flex flex-col gap-6">
          <StepperDemo />
          <div className="flex flex-col gap-6">
            <StateCell label="Passo com erro" className="w-full">
              <Card className="w-full">
                <Stepper steps={STEPS.map((s) => (s.id === 'equipamentos' ? { ...s, error: true } : s))} current={3} onStepClick={() => {}} />
              </Card>
            </StateCell>
            <StateCell label="Primeiro passo" className="w-full">
              <Card className="w-full">
                <Stepper steps={STEPS} current={0} />
              </Card>
            </StateCell>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <StateCell label="Campo, passo 2 de 5" className="w-full max-w-[390px]">
              <Card className="flex w-full flex-col gap-6">
                <Stepper variant="field" steps={STEPS} current={1} title="Quais equipamentos?" />
                <StepperFooter size="field" />
              </Card>
            </StateCell>
            <StateCell label="Campo, último passo" className="w-full max-w-[390px]">
              <Card className="flex w-full flex-col gap-6">
                <Stepper variant="field" steps={STEPS} current={4} title="Conferir e concluir" />
                <StepperFooter size="field" nextLabel="Concluir locação" />
              </Card>
            </StateCell>
          </div>
        </div>
      </Specimen>

      <Specimen title="Pacote IA e Copiloto" note="Discreto: sem gradiente, brilho, esfera ou avatar. Não é chat. Mostra a sugestão, de onde veio a conclusão e uma ação com verbo.">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-body font-semibold">Relatório de perdas</span>
            <AiTag />
            <Badge tone="neutral" icon={Truck}>
              Exemplo ao lado de um recurso
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StateCell label="Padrão, interativo" className="w-full">
              <div className="w-full">
                <CopilotDemo />
              </div>
            </StateCell>
            <StateCell label="Carregando" className="w-full">
              <CopilotCard className="w-full" status="loading" suggestion="" approveLabel="Gerar cobrança" />
            </StateCell>
            <StateCell label="Aprovado" className="w-full">
              <CopilotCard
                className="w-full"
                status="done"
                suggestion=""
                approveLabel="Gerar cobrança"
                doneMessage="Cobrança enviada para a Construtora Planalto"
                doneDetail="R$ 420,00, vencimento em 18/11/2026"
                doneAction={{ label: 'Ver cobrança', onClick: () => {} }}
              />
            </StateCell>
          </div>
          <EmptyHint />
        </div>
      </Specimen>
    </DsSection>
  )
}

function EmptyHint() {
  return (
    <p className="inline-flex items-center gap-2 text-caption text-fg-3">
      <Inbox size={14} strokeWidth={2} aria-hidden />
      Sem o Pacote IA, o cartão não aparece e a etiqueta some junto.
    </p>
  )
}
