# Vet Domicílio · Design system v2

Protótipo clicável (100% mock) de SaaS para veterinários que atendem em domicílio em Manaus. O cliente reprovou a v1 por "cara de IA". A v2 é engenharia reversa de 4 referências do Dribbble, em `/root/.claude/uploads/47345af6-79db-5cfe-8de2-3891a4e567e6/`: `31f35101-image.jpg`, `73303b79-image.jpg`, `8b0cff8e-image.jpg` e `339cb1b3-image.jpg`. **Abra e estude essas imagens antes de codar.**

## O que copiar de cada referência
1. **Dashboard de RH, "Planned Absences"** (31f35101): é a linguagem principal do desktop.
   - Fundo cinza claro (`bg-canvas` fora e `bg-surface` nos painéis). Painéis grandes com raio de 26–28px que agrupam cartões brancos de raio 16–20px.
   - Navegação em pílulas com ícone e label; a ativa é branca e elevada (`shadow-pill`).
   - Pilha de avatares com "+N", botões redondos brancos e o padrão "↗ Ver tudo" (`ViewAll`).
   - Calendário em grade com dias de folga hachurados (`.hatch`), dia de hoje em pílula azul sólida, linha vertical tracejada azul marcando agora, e eventos como barras coloridas com um mini selo branco interno ("• Aprovado").
   - Cartão amarelo de destaque com pílulas internas (horário, data). Cards de pessoa centralizados com avatar, nome, cargo e uma pílula cinza de progresso ("5/10 tarefas").
   - Cartão de assistente com a esfera brilhante (`.orb`), saudação centralizada, chips de ação e campo de mensagem.
2. **logip** (73303b79):
   - Muito respiro, divisórias de 1px e ícones dentro de círculos cinza (`IconCircle`).
   - Métricas em linha separadas por divisor vertical, com variação pequena colorida ao lado ("▲ +12%").
   - Gráfico de linha com duas séries suaves, tooltip preto e linha guia pontilhada.
   - Lista de tarefas com ícone circular, status com ponto colorido e duração.
   - Coluna direita com cartão de perfil em fundo cinza, botões redondos de ação e feed de atividade com balão de mensagem azul-claro e anexo.
3. **Apps de finanças** (8b0cff8e), para o celular:
   - Cabeçalho escuro (preto com leve gradiente) com o número grande; o conteúdo vem numa folha branca que sobe com cantos arredondados.
   - Abas em pílula, cartão "Insight" com fundo azul-claro, linhas de lista com valor e chevron, cartão de alerta com fundo vermelho-claro.
   - Barra de alocação segmentada (`SegmentBar`).
   - **Dock flutuante preta** com o item ativo em pílula com label.
4. **App de condomínio** (339cb1b3), para o celular:
   - Preto com **verde-limão** (`bg-lime`) nos cartões de ação e nas pílulas ativas pretas.
   - Botões redondos grandes (voltar, chat, sino) e cartões de raio 28px.
   - Cartões de imagem com rótulo translúcido por cima, e chips de "ação rápida" com ícone em círculo.

## Tokens (src/index.css)
- **Superfícies:** `canvas`, `surface`, `card` (branco), `muted`, `muted-2`, `line`, `line-2`.
- **Texto:** `ink`, `ink-2`, `ink-3`, `ink-4`.
- **Ação:** `black` (botão principal, pílula ativa, dock), `lime` (destaque e CTA especial, com texto `ink`), `lime-soft`.
- **Categorias e status**, sempre o sólido para barras e pontos e o `-soft` para fundos:
  - `blue` / `blue-soft`
  - `violet` / `violet-soft`
  - `green` / `green-soft`
  - `yellow` / `yellow-soft` / `yellow-ink`
  - `coral` / `coral-soft`
  - `red` / `red-soft`
  - `teal` / `teal-soft`
- **Zonas:** `z-oeste` (verde), `z-centrooeste` (teal), `z-sul` (amarelo), `z-centrosul` (violeta), `z-norte` (azul), `z-leste` (coral). Os hex estão em `geo.ts`.
- **Aliases legados:** `paper`, `sage-*`, `terra-*`, `ok`, `warn`, `late`, `info` existem só para não quebrar código antigo. **Migre todo uso para os tokens novos** nos seus arquivos.
- **Raios:** cartões `rounded-[20px]` a `rounded-[24px]`, painéis `rounded-[28px]`, controles `rounded-full`. Nada de cantos de 6–8px em superfícies.
- **Sombras:** `shadow-card` (muito sutil), `shadow-pill` (pílulas e botões brancos), `shadow-float` (popovers, dock). Nada de bordas escuras: separe por cor de fundo ou por `line`.

## Tipografia
- Uma família só: **Manrope** (`font-sans`). Use pesos 500, 600, 700 e 800.
- Títulos de página: 28–32px, peso 700, tracking −0.03em. Títulos de cartão: 16–18px, peso 700. Texto: 13–14px, peso 500. Secundário: `text-ink-3`.
- Números grandes: 28–40px, peso 700, com `num` (tabular).
- **Proibido:** serifas, mono, caixa alta com tracking (eyebrow em CAPS), labels técnicos estilo terminal.

## Copy, para não ter cara de IA
- Português do Brasil simples, como nos apps reais: "Visitas de hoje", "Próximas vacinas", "Ver tudo", "Nova visita".
- **Proibido:**
  - travessão (— e –);
  - frases de efeito ou títulos poéticos ("Quem vai a cada zona, e quando", "O sistema sugere, o veterinário confirma");
  - explicações longas na interface;
  - emoji decorativo, fora das mensagens de WhatsApp.
- Títulos de seção são substantivos curtos, como nas referências: "Planned Absences", "Future Events", "Onboarding", "Current Tasks".

## Componentes (src/components/ui/index.tsx)
- `Button` (pílulas `primary`, que é preto, e `lime` | `outline` | `ghost` | `subtle` | `danger`), `IconButton` (redondo; tones `card` | `muted` | `black` | `lime` | `ghost`).
- `Badge` (tones `neutral` | `ok` | `warn` | `late` | `info` | `dark` | `violet` | `lime` | `white`), `Chip` (filtro em pílula; o ativo é preto).
- `Card` (branco, raio 24px), `Panel` (cinza, que agrupa cartões), `CardHeader`, `ViewAll`.
- `PetAvatar`, `VetAvatar`, `AvatarStack`, `IconCircle`.
- `Segmented` (abas em pílula; `tone="dark"` para fundo preto), `Tip`, `NumberTicker`, `CountUp`, `Ring`, `SegmentBar`, `Kbd`, `Divider`, `PageHeader`, `Empty`.
- **Utilitários CSS:** `.hatch` (hachura), `.orb` (esfera do assistente), `.num`, `.no-scrollbar`, `.scroll-thin`.
- **Ícones:** `lucide-react`, `strokeWidth` de 1.9 a 2, tamanho 16–19px, quase sempre dentro de um círculo.
- **Movimento:** `motion/react`, 150–400ms, ease-out. Anime só transform e opacity, com stagger leve. Hover em tudo que é clicável e `active:scale-[.97]` em botões.

## Layout
- O shell (`AppShell.tsx`) já existe: trilho de ícones à esquerda, pílulas no topo e, no celular, dock preta flutuante. O conteúdo da página fica em `bg-surface` e usa `px-4 md:px-6 pb-6`.
- Monte a página como no dashboard de RH: grids de cartões brancos (`Card`), às vezes dentro de `Panel`, com gap de 12–16px.
- Celular a partir de 390px sem scroll horizontal. Deixe espaço no rodapé para a dock (`pb-28`).
- **Dados e estado:** `src/data/*`, `src/store.ts` e `src/lib/*` (não altere a lógica). Uma ação numa tela reflete nas outras pelo store.
