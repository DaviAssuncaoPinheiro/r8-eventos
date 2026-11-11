# R8 · Design system v2

Especificação de design do sistema de operação para locadoras (banheiros químicos, estruturas para eventos, som e luz, equipamentos). Substitui o v1 (pílulas, laranja fixo, só tema claro). Quem constrói tela lê este arquivo e usa `src/ui` e `src/styles/tokens.css`. Valores aqui são exatos; se algo não estiver aqui, pergunte antes de inventar.

- Página viva: `/design-system` (alternador de tema e de cor da marca no topo).
- Código: tokens em `src/styles/tokens.css`, marca em `src/lib/brand.ts`, tema em `src/lib/theme.ts`, formatos em `src/lib/format.ts`, primitivos em `src/ui/`.
- Telas novas usam a classe `ds-root` no contêiner raiz (aplica fonte, cor de texto, seleção, cursor, barra de rolagem e anel de foco do v2). Os tokens antigos (`canvas`, `card`, `ink`, `brand`…) continuam em `src/index.css` só para as telas antigas; não use em tela nova.

---

## 1. Análise das referências

As duas imagens são renders de Dribbble a 1080 px de largura. A moldura do app mede 972 px nas duas (x 54 a 1026), então o fator para uma tela de 1440 px é **1440 / 972 = 1,48**. Medido com PIL (amostragem de pixel e caixa delimitadora de texto escuro). JPEG: cores com erro de ±3 por canal.

### 1.1 Donezo (dashboard verde)

| Medida | Na imagem | Em 1440 px |
|---|---|---|
| Fundo da página | `#ebecee` | |
| Moldura / painéis / cartões | `#ffffff` / `#f7f7f7` / `#ffffff` | |
| Verde: badge, gradiente do KPI (início → fim), médio, claro, menta | `#183725`, `#21422f → #407d54`, `#3f7b57`, `#78bc95`, `#d5fbe6` | |
| Texto / secundário / terciário | `#050505` / `#838786` / `#929493` | |
| Largura da lateral (painel) | 169 px | 250 px |
| Gap entre cartões | 9 px | 13 px |
| Altura de capitular do título "Dashboard" | 19 px (≈ 26 px de corpo) | ≈ 39 px |
| Algarismo do KPI ("10") | 27 px de altura (≈ 37 px de corpo) | ≈ 55 px |
| Título de cartão | ≈ 14 px de corpo | ≈ 21 px |
| Item de navegação | ≈ 11,5 px de corpo | ≈ 17 px |
| Botão primário (pílula) | 43 px de altura | 64 px |
| Cartão de KPI | ≈ 121 px de altura | ≈ 179 px |
| Sombra | nenhuma visível | |

**Por que funciona.** Hierarquia por tom de superfície (página < moldura < painel < cartão), sem uma sombra sequer. Um único bloco preenchido de verde ancora o olhar no número que importa. Números grandes e rótulos pequenos dão leitura em 1 segundo. Ritmo regular de gaps.

**O que não copiar.** Cinza `#838786` sobre `#ffffff` dá 3,7:1 e `#929493` dá 3,1:1 (reprovam AA para texto). Legendas de 9 a 10 px na imagem. Grade de 4 KPIs idênticos como estrutura. Cartão promocional com imagem. Avatares memoji. Hachura como enfeite de gráfico. Botão em pílula grande.

### 1.2 logip (app branco)

| Medida | Na imagem | Em 1440 px |
|---|---|---|
| Fundo / app / divisor | `#d7d5d6` / `#ffffff` / `#f1f1f1` | |
| Cartão de perfil e círculos de ícone | `#f2f2f2` | |
| Bolha / arquivo | `#e6eff6` a `#f6fbff` | |
| Tooltip | `#0a1123` | |
| Linhas do gráfico (azul / areia) | `#889cbd` / `#dec09c` | |
| Texto / secundário | `#0d0e10` / `#747474` a `#777777` | |
| Lateral esquerda | 170 px | 252 px |
| Trilho direito (do divisor à borda) | 268 px | ≈ 397 px |
| Capitular do título "Hello, Margaret" | 21 px (≈ 29 px de corpo) | ≈ 43 px |
| Faixa de estatísticas (entre divisores) | 74 px | 110 px |
| Rótulo da estatística | ≈ 10 px de corpo | ≈ 15 px |
| Valor da estatística | ≈ 13 px de corpo | ≈ 19 px |
| Título de seção ("Performance") | ≈ 14 px de corpo | ≈ 21 px |
| Passo entre linhas da tabela | 48 px | 71 px |

**Por que funciona.** Estatísticas em linha com divisores verticais: comparação lado a lado sem caixas. Tabela sem bordas, separada só por espaço, com status em ponto colorido + rótulo. Trilho direito mostra contexto sem tirar o usuário da tela. Tooltip escuro com contraste máximo sobre um app claro.

**O que não copiar.** `#747474` sobre branco dá 4,6:1 só no limite e reprova sobre `#f2f2f2`. Texto de 9 px. Botão azul-pálido "Upgrade" (texto escuro sobre `#b9d4ee`, cara de desabilitado). Tabela com 71 px de linha é solta demais para operação.

### 1.3 Síntese

Casca e camadas do Donezo (fundo em tom, painel, cartão branco, um bloco da marca por tela, números grandes) + maneira de conteúdo do logip (faixa de estatísticas com divisores, tabela sem bordas com ponto de status, trilho direito, tooltip escuro). As medidas em 1440 px das referências são de apresentação (render ampliado). Para uma ferramenta de operação usamos ≈ 0,7 delas: título 28 px (não 39), KPI 28 a 38 px (não 55), botão 40 px (não 64), linha de tabela 48 px (não 71). Larguras de casca ficam próximas: lateral 248 px, trilho 336 px.

---

## 2. Princípios

1. **Dinheiro primeiro.** Toda tela responde "quanto está escapando e onde". O valor em reais vem antes do gráfico, com centavos, e cada número tem "como é calculado".
2. **Um destaque por tela.** A cor da marca preenche no máximo um bloco por tela (o número que ancora a página) e o botão primário. O resto é neutro.
3. **Tom, não sombra.** Camadas se separam por tom de superfície. Sombra só para o que flutua (menu, diálogo); no escuro, contorno de 1 px.
4. **Uma mão, sol, rua.** No app de campo: corpo 16 px, alvos ≥ 48 px na ação principal, ação no rodapé ao alcance do polegar, contraste ≥ 7:1 no texto principal.
5. **A marca é do cliente.** Nada depende do verde: todo uso de marca lê `--accent*`, e o contraste é garantido pela derivação, não pelo olho de quem desenha.

---

## 3. Tokens

### 3.1 Cor: neutros e estados

Família neutra fria quase acromática (matiz ≈ 250°, croma ≤ 0,01), para combinar com qualquer cor de marca.

| Token (CSS) | Classe Tailwind | Claro | Escuro | Uso |
|---|---|---|---|---|
| `--app` | `bg-app` | `#e9ebee` | `#0b0d0f` | Fundo da janela |
| `--panel` | `bg-panel` | `#f5f6f8` | `#121518` | Lateral, painel principal, trilho, topo |
| `--raised` | `bg-raised` | `#ffffff` | `#191d21` | Cartão, campo, tabela |
| `--sunken` | `bg-sunken` | `#eef0f3` | `#0f1214` | Trilho de segmentado, área vazia, cartão afundado, esqueleto |
| `--hover` | `bg-hover` | `#eceef1` | `#22272c` | Hover de linha, de botão secundário e de item de navegação |
| `--overlay` | `bg-overlay` | `#ffffff` | `#21262b` | Menu, popover, diálogo, gaveta |
| `--inverse` | `bg-inverse` | `#14171b` | `#eef0f3` | Tooltip, toast |
| `--on-inverse` / `--on-inverse-2` | `text-on-inverse(-2)` | `#f3f4f6` / `#b4bac2` | `#121417` / `#454b54` | Texto sobre inverse |
| `--scrim` | `bg-scrim` | `rgba(12,14,16,.48)` | `rgba(0,0,0,.62)` | Fundo atrás de diálogo e gaveta |
| `--fg` | `text-fg` | `#121417` | `#eceef1` | Texto principal, números |
| `--fg-2` | `text-fg-2` | `#454b54` | `#b9bfc7` | Rótulo, texto secundário |
| `--fg-3` | `text-fg-3` | `#5c636d` | `#9198a2` | Legenda, ajuda, placeholder, cabeçalho de tabela |
| `--fg-disabled` | `text-fg-disabled` | `#a1a7b0` | `#5a616b` | Desabilitado (isento de contraste) |
| `--hairline` | `border-hairline` | `#e3e6ea` | `#262b31` | Divisor, linha de tabela |
| `--edge` | `border-edge` / `ring-edge` | `#cfd4da` | `#353b42` | Contorno de botão secundário, segmentado ativo |
| `--strong` | `border-strong` | `#7d848e` | `#6c747e` | Borda de campo, caixa, rádio, switch desligado (≥ 3:1) |
| `--ring` | `outline-ring` | = `--accent-ink` | = `--accent-ink` | Anel de foco |
| `--ok` / `-soft` / `-ink` | `bg-ok`, `bg-ok-soft`, `text-ok-ink` | `#1b7f48` / `#e3f3e9` / `#11603a` | `#3db876` / `#132b1e` / `#86dcaa` | Concluído, pago, disponível |
| `--warn` / `-soft` / `-ink` | | `#b97800` / `#fcf1d4` / `#7a4f00` | `#e0a833` / `#2f250d` / `#f2cd7d` | Atenção, vence hoje, aguardando |
| `--danger` / `-soft` / `-ink` | | `#cf2f37` / `#fce8e8` / `#a3161d` | `#ef5f5a` / `#371718` / `#ffa8a3` | Atraso, avaria, erro |
| `--danger-solid` / `-hover` | `bg-danger-solid` | `#c8282f` / `#b12027` | `#c9333a` / `#b5262d` | Botão de perigo (texto branco) |
| `--info` / `-soft` / `-ink` | | `#2b6cd9` / `#e5edfc` / `#1c4ea6` | `#6b9cf5` / `#14223b` / `#a9c6ff` | A caminho, informativo |
| `--idle` | `bg-idle`, `ring-idle` | `#8a919b` | `#7b838d` | Parado, sem uso (sempre com hachura ou ponto vazado) |

Base (`ok`, `warn`, `danger`, `info`) é para ponto, ícone e barra. Texto de estado usa sempre `-ink`, sobre `-soft` ou sobre superfície.

### 3.2 Cor: marca (derivada)

`applyBrand(hex)` em `src/lib/brand.ts` converte para OKLCH e grava `--brand-l-*` (claro) e `--brand-d-*` (escuro) no `:root`. Os temas leem `--accent*` a partir delas. A escolha fica em `localStorage["r8.brand"]` e o script inline do `index.html` aplica antes da primeira pintura.

| Variável | Regra no claro | Regra no escuro |
|---|---|---|
| `--accent` | Cor escolhida; se branco < 4,5:1, baixa só L até atingir 4,55:1 | L do claro + 0,07, limitado ao maior L em que o branco ainda dá 4,55:1 |
| `--accent-hover` | L − 0,045 | L + 0,035 (se ainda passar com branco), senão L − 0,035 |
| `--accent-active` | L − 0,09 | L − 0,06 |
| `--accent-soft` | L 0,955, C = min(C × 0,3; 0,035) | L 0,285, C = min(C × 0,45; 0,06) |
| `--accent-ink` | Começa em L = min(L; 0,46), C ≤ 0,14 e escurece até ≥ 4,5:1 sobre soft, raised, panel e app | Começa em L 0,82, C ≤ 0,12 e clareia até ≥ 4,5:1 sobre soft, raised, panel e app |
| `--on-accent` | `#ffffff` | `#ffffff` |
| `--on-accent-2` | Branco misturado ao acento, o mais suave que dá ≥ 4,5:1 | idem |

Padrão do produto: **verde floresta `#275b3e`** (OKLCH ≈ 0,44 0,07 155). Presets da demo: Verde `#275b3e`, Laranja R8 `#ee6a1c` (vira `#c65200` como preenchimento), Azul `#2557c7`, Grafite `#3b4048`. Resultado medido dos 4 presets e de um amarelo claro `#f5cf45` na seção 12.

### 3.3 Cor: gráficos

Paleta categórica em ordem fixa. Série única usa `--accent`. Encontrada por busca em OKLCH maximizando a menor distância ΔE (OKLab) entre pares com simulação de deuteranopia, protanopia e tritanopia (matrizes de Machado 2009, severidade 1), com contraste ≥ 3:1 sobre `--raised`.

| Token | Claro | Escuro |
|---|---|---|
| `--viz-1` | `#394cb3` | `#6fb1ea` |
| `--viz-2` | `#c57952` | `#f17d29` |
| `--viz-3` | `#29a493` | `#97cb9c` |
| `--viz-4` | `#93266c` | `#be659a` |
| `--viz-5` | `#9481e1` | `#7b85e1` |
| `--viz-6` | `#685c1c` | `#f5c130` |
| `--viz-grid` | `#e8eaee` | `#23282d` |
| `--viz-axis` | `#5c636d` | `#9198a2` |
| `--hatch` | `rgba(18,20,23,.16)` | `rgba(236,238,241,.2)` |

Menor ΔE OKLab entre dois quaisquer (medido): claro normal 0,196 · deuteranopia 0,098 · protanopia 0,101 · tritanopia 0,102. Escuro normal 0,115 · deuteranopia 0,100 · protanopia 0,111 · tritanopia 0,088. Contraste sobre `--raised`: claro 7,35 / 3,37 / 3,08 / 7,68 / 3,24 / 6,70; escuro 7,39 / 6,22 / 9,15 / 4,45 / 5,07 / 10,13.

### 3.4 Tipografia

Uma família: **Manrope Variable** (`@fontsource-variable/manrope`, já instalada), pesos 400 a 800. Mantida porque passou nos critérios no Chromium via Playwright: `tabular-nums` deixa "1111" e "8888" com a mesma largura (67,20 px e 67,20 px a 28 px; proporcional 45,92 e 65,75 px), acentos do português corretos nos pesos 400 a 700 e x-height alto o bastante para 12 px. Inter e Roboto proibidas.

Escala fixa em px, razão entre 1,125 e 1,2: **12, 14, 16, 18, 21, 24, 28, 38** (14/12 = 1,17 · 16/14 = 1,14 · 18/16 = 1,125 · 21/18 = 1,17 · 24/21 = 1,14 · 28/24 = 1,17 · 38/28 é o salto de KPI, 1,36, usado só no número âncora).

| Papel | Classe | Tamanho / linha | Peso | Tracking | Onde |
|---|---|---|---|---|---|
| KPI âncora | `text-kpi-lg` | 38 / 44 | 650 | −0,025em | Número do bloco destaque |
| Título de página | `text-title-page` | 28 / 34 | 700 | −0,022em | H1 do escritório |
| KPI | `text-kpi` | 28 / 34 | 650 | −0,02em | Indicador, faixa de estatísticas |
| Título do app de campo | `text-title-field` | 24 / 30 | 700 | −0,02em | H1 no celular |
| Título de seção | `text-title-section` | 21 / 28 | 650 | −0,015em | H2, título de diálogo |
| Subtítulo | `text-title-sub` | 18 / 24 | 650 | −0,01em | Nome do cliente no dossiê, título de gaveta |
| Título de cartão | `text-title-card` | 16 / 22 | 650 | −0,005em | H3 de cartão, de grupo |
| Corpo grande | `text-body-lg` | 16 / 24 | 500 | 0 | Corpo do app de campo, botão lg/field |
| Corpo | `text-body` | 14 / 20 | 500 | 0 | Corpo do escritório, célula de tabela |
| Rótulo | `text-body font-semibold` | 14 / 20 | 600 | 0 | Rótulo de campo, botão, item de menu |
| Legenda | `text-caption` | 12 / 16 | 500 (600 em badge) | 0 | Ajuda, metadado, cabeçalho de tabela |

Corpo mínimo: 14 px no escritório (o piso pedido era 13), 16 px no app de campo (piso pedido 15). Nada abaixo de 12 px. Prosa até 68ch. Números de tabela, dinheiro, datas e códigos sempre com `.tnum`. Caixa alta só em siglas.

### 3.5 Espaçamento

Base 4 px. Escala usada: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64** (classes Tailwind 1, 2, 3, 4, 5, 6, 8, 10, 12, 16). Dentro de um grupo 8 a 12; entre grupos 24 a 32; entre seções 40. Acima de título, o dobro do espaço abaixo (título de seção: 40 acima, 6 abaixo da intro e 24 até o conteúdo).

### 3.6 Raios

| Token | Valor | Uso |
|---|---|---|
| `rounded-check` | 5 px | Caixa de seleção |
| `rounded-tip` | 8 px | Tooltip, miniatura de foto |
| `rounded-control` | 10 px | Botão, campo, select, segmentado (item ativo 7 px), item de navegação |
| `rounded-card` | 14 px | Cartão, menu, popover, toast, diálogo |
| `rounded-panel` | 18 px | Painéis da casca, gaveta (cantos internos) |
| `rounded-pill` | 999 px | Badge, switch, ponto, avatar |

### 3.7 Bordas e elevação

| Nível | Claro | Escuro |
|---|---|---|
| 0 Página | `bg-app` | `bg-app` |
| 1 Painel | `bg-panel`, sem borda, sem sombra | idem |
| 2 Cartão | `bg-raised`, sem borda, sem sombra | idem (tom mais claro que o painel) |
| 3 Flutuante | `bg-overlay` + `shadow-overlay` = `0 12px 32px -8px rgba(16,18,22,.18), 0 2px 6px rgba(16,18,22,.06)` | `bg-overlay` + `shadow-overlay` = contorno `0 0 0 1px #353b42` |
| 4 Arrastando | `shadow-drag` = `0 18px 40px -12px rgba(16,18,22,.28)` | contorno `0 0 0 1px #474e57` |

Borda OU sombra, nunca as duas. Linhas internas: 1 px `border-hairline`. Campo: 1 px `border-strong`. Botão secundário: anel interno 1 px `ring-edge`.

### 3.8 z-index

| Camada | Valor |
|---|---|
| Conteúdo | 0 |
| Cabeçalho de tabela fixo | 10 |
| Trilho direito em sobreposição (1024 a 1279) | 20 |
| Lateral em sobreposição (< 1024) | 30 |
| Topo fixo, navegação inferior | 40 |
| Menu, popover, combobox | 50 |
| Gaveta | 60 |
| Diálogo | 70 |
| Toast | 80 |
| Tooltip | 90 |
| Faixa "Ambiente de demonstração" | 95 |

### 3.9 Movimento

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast` | 150 ms | Hover, cor, foco, switch, caixa |
| `--dur-base` | 200 ms | Menu, tooltip (entrada 150), troca de aba, accordion |
| `--dur-slow` | 250 ms | Gaveta, diálogo, toast |
| `--ease-ui` | `cubic-bezier(0.16, 1, 0.3, 1)` (exponencial de saída) | Tudo |

Entrada de flutuante: opacidade 0 → 1 e translateY 4 px → 0 (menu, tooltip 2 px) ou escala 0,98 → 1 (diálogo); gaveta desliza 100% → 0. Saída com 70% da duração. Sem sequência de entrada de página, sem parallax, sem animação em loop exceto esqueleto (1,4 s) e spinner de botão (0,8 s). `prefers-reduced-motion: reduce` zera transições e animações (regra global em `src/index.css`). Os keyframes de entrada e saída das sobreposições (`ds-scrim`, `ds-dialog`, `ds-drawer-side`, `ds-vaul`, `ds-menu`) ficam em `src/styles/tokens.css`, fora de `@layer`, para vencer utilitários no mesmo elemento; nenhum componente injeta `<style>`.

### 3.10 Ícones

lucide-react, `strokeWidth={2}` em todos os tamanhos, cor herdada (`currentColor`). Tamanhos: **14** (badge, legenda), **16** (botão sm, tabela, campo), **18** (botão md, navegação lateral), **20** (botão lg, topo), **24** (app de campo, estado vazio). Ícone sozinho exige `aria-label` e tooltip. Decorativo leva `aria-hidden`. Nenhum emoji como ícone.

### 3.11 Breakpoints

| Nome | Largura | Tailwind | Comportamento |
|---|---|---|---|
| Celular | 390 (base) | (sem prefixo) | App de campo; escritório com lateral em gaveta |
| Tablet | 640 / 768 | `sm:` / `md:` | Grades de 2 colunas |
| Escritório compacto | 1024 | `lg:` | Lateral recolhida (72), trilho direito vira gaveta |
| Escritório | 1280 | `xl:` | Lateral aberta (248), trilho direito fixo (336) |
| Escritório largo | 1440 | `wide:` | Conteúdo até 1280 de largura útil, centralizado |

**Alvo de toque.** Em `pointer: coarse` todo controle tem alvo de pelo menos 44 × 44: `ds-touch` (altura mínima 44: botão sm e md, campo md, linha de caixa, rádio e switch), `ds-touch-sq` (largura mínima 44: botão só ícone sm e md) e `ds-hit` (área de toque invisível de 44 × 44 centrada, sem mudar o desenho: trilho do switch, opção de segmentado, número de passo clicável, botão texto da faixa de demonstração). O desenho no desktop não muda.

---

## 4. Grid e casca

### 4.1 Escritório (desktop)

- Fundo `bg-app`. Padding externo 12 px, gap 12 px entre painéis (`--shell-gap`).
- **Lateral** `bg-panel`, `rounded-panel`, altura 100dvh − 24, fixa. Largura 248 px aberta (≥ 1280), 72 px recolhida (1024 a 1279, ou por escolha do usuário; a escolha fica em localStorage). Conteúdo: marca da locadora (logo 32 px + nome 16/650) em 64 px de altura; grupos de navegação com rótulo `text-caption` 600 `fg-3` (12 px acima, 4 abaixo); itens de 40 px; rodapé com Configurações e usuário.
- **Topo** `bg-panel`, `rounded-panel`, altura 64 px, padding horizontal 24 px, fixo no topo da coluna principal: título da tela `text-title-sub` truncado à esquerda; busca (cmdk, 40 px, largura até 360 px, atalho Ctrl K) ao centro (de 1024 a 1279 vira botão só ícone 40); à direita, ações só ícone 40 px (avisos, ajuda) e usuário (avatar 32 px + nome 14/600 + papel 12 fg-3).
- **Painel principal** `bg-panel`, `rounded-panel`, padding 32 px (24 px em 1024 a 1279), largura útil máxima 1280 px. Cabeçalho da página: título `text-title-page` + linha de apoio `text-body fg-2` (4 px abaixo) à esquerda, ações à direita (primário no fim); 24 px até o conteúdo.
- **Grade do conteúdo**: 12 colunas, gap 16 px (cartões) ou 24 px (seções). Padrões: indicadores em `StatStrip` (1 cartão) ou bloco destaque (4 col) + StatStrip (8 col); tabela em 12 col; lista + detalhe em 7/5.
- **Trilho direito** (contexto: dossiê do cliente, atividade, Copiloto): `bg-panel`, `rounded-panel`, 336 px, padding 20 px, fixo a partir de 1280. Entre 1024 e 1279 vira gaveta pela direita (botão só ícone no topo). Abaixo de 1024 vira tela cheia.
- **Abaixo de 1024**: lateral vira gaveta pela esquerda (botão menu 44 px no topo), padding externo 0, painéis sem raio, padding do conteúdo 16 px.

### 4.2 App de campo (celular, 390 × 844 de referência)

- Fundo `bg-app`. Conteúdo em cartões `bg-raised` com padding 16 px e gap 12 px; margem lateral 16 px.
- **Cabeçalho** 56 px + `env(safe-area-inset-top)`, `bg-app`, fixo: voltar (44 px, só ícone 24) à esquerda, título `text-title-sub` truncado ao centro-esquerda, ação secundária só ícone 44 px à direita. Ao rolar ganha borda inferior 1 px `hairline`.
- **Navegação inferior** 64 px + `env(safe-area-inset-bottom)`, `bg-panel`, borda superior 1 px `hairline`, 3 a 4 itens de largura igual, cada um 48 px mínimo: ícone 24 + rótulo 12/600. Ativo: ícone e rótulo `accent-ink`, pílula 56 × 28 `accent-soft` atrás do ícone. Inativo `fg-2`.
- **Ação principal**: botão `field` (56 px, largura total) num rodapé fixo `bg-app` com padding 12/16 e área segura; acima da navegação inferior quando ela existir. Uma ação principal por tela.
- Título da tela `text-title-field` (24/30) no topo do conteúdo, 16 px abaixo do cabeçalho.
- Alvos: ≥ 44 × 44 em tudo, ≥ 48 px de altura nos botões principais (o `field` tem 56). Distância mínima entre alvos 8 px.
- Corpo 16 px; texto principal sempre `fg` (≥ 14:1 no claro, para sol).

Contêineres: `OfficeFrame` e `FieldFrame` em `src/ui/AppFrame.tsx`. No app, passe `viewport`; num quadro de exemplo dentro de outra página (documentação), passe `embedded`: o conteúdo do escritório vira `div` em vez de `main` e o título do campo vira `p` em vez de `h1`, para não duplicar o marco principal nem quebrar a hierarquia de títulos da página que os contém.

### 4.3 Densidade de tabela

| Densidade | Altura da linha | Padding de célula | Texto |
|---|---|---|---|
| Padrão | 48 px | 12 px horizontal (16 px na primeira e na última) | `text-body` 14/20 |
| Compacta (listas longas, > 50 linhas) | 40 px | 8 px horizontal (16 nas pontas) | `text-body` |
| Cabeçalho | 36 px | igual à densidade | `text-caption` 600 `fg-3` |

Detalhes na seção 6.1.

---

## 5. Componentes implementados (`src/ui`)

Estados forçados para documentação: `forceState="hover|focus|active"` grava `data-force` e aplica o mesmo visual do estado real. Não use em tela.

### 5.1 Button

Anatomia: [ícone 16/18/20/24] + rótulo + [ícone à direita]. `rounded-control`, peso 600, gap 6 (sm) ou 8 (md, lg) ou 10 (field).

| Tamanho | Altura | Padding x | Texto | Ícone |
|---|---|---|---|---|
| `sm` | 32 (44 em `pointer: coarse`) | 12 | 14 | 16 |
| `md` (padrão) | 40 (44 em `pointer: coarse`) | 16 | 14 | 18 |
| `lg` | 48 | 20 | 16 | 20 |
| `field` | 56 | 24 | 16 / 700 | 24 |

| Estado | Primário | Secundário | Fantasma | Perigo |
|---|---|---|---|---|
| Padrão | `bg-accent` `text-on-accent` | `bg-raised` `text-fg` anel 1 px `edge` | transparente, `fg-2` | `bg-danger-solid`, branco |
| Hover | `accent-hover` | `bg-hover` | `bg-hover`, `fg` | `danger-solid-hover` |
| Foco (teclado) | contorno 2 px `ring`, afastado 2 px | idem | idem | idem |
| Pressionado | `accent-active`, desce 1 px | `bg-sunken`, desce 1 px | `bg-sunken` | brilho 95% |
| Desabilitado | `bg-sunken` `fg-disabled` | `bg-raised` `fg-disabled` anel `hairline` | `fg-disabled` | `bg-sunken` `fg-disabled` |
| Carregando | spinner 0,8 s no lugar do ícone, rótulo no gerúndio ("Gerando"), `aria-busy`, sem clique | idem | idem | idem |

Só ícone (`iconOnly`): quadrado do tamanho da altura (sm e md viram 44 × 44 em toque), `aria-label` obrigatório, tooltip com o mesmo texto. Largura total (`block`). Um primário por área de ação; ordem: secundário à esquerda, primário à direita. Rótulo é verbo + objeto ("Gerar cobrança").

### 5.2 Field, Input, Textarea, Select

- **Field**: rótulo 14/600 `fg` (6 px até o controle), "opcional" 12 `fg-3` ao lado quando for o caso (obrigatório não leva asterisco); erro 12/600 `danger-ink` com ícone 14, 6 px abaixo do controle; ajuda 12 `fg-3`, abaixo do erro. Liga `id`, `aria-describedby` e `aria-invalid` sozinho.
- **Input**: 40 px (`md`, 44 em toque) ou 48 px (`lg`, app de campo, texto 16). `bg-raised`, borda 1 px `strong`, `rounded-control`, padding x 12. Prefixo/sufixo `fg-3` com gap 8 ("R$", "unidades", ícone de busca 16). `numeric`: `.tnum` e alinhado à direita.
- **Textarea**: mínimo 88 px, padding 12 × 10, redimensiona na vertical.
- **Select**: nativo estilizado (motivo: seletor do sistema no celular, acessível sem código, sem portal), seta 18 `fg-3` a 12 px da direita, padding direito 36. Lista com busca usa o Combobox (5.2.1).

| Estado | Visual |
|---|---|
| Vazio | placeholder `fg-3` ("Ex.: Construtora Planalto"); Select vazio mostra opção desabilitada "Escolha…" |
| Hover | borda `fg-3` |
| Foco | borda `ring` + 1 px de anel `ring` (2 px no total) |
| Preenchido | texto `fg` |
| Erro | borda `danger` (foco: anel `danger`), mensagem que diz o problema e a saída ("CNPJ incompleto. Confira os 14 números.") |
| Desabilitado | `bg-sunken`, borda `hairline`, texto `fg-disabled`, rótulo `fg-disabled` |
| Somente leitura | sem borda, `bg-sunken`, texto `fg` (selecionável) |

#### 5.2.1 Combobox (a implementar, cmdk + Radix Popover)

Gatilho igual ao Select. Popover `bg-overlay` `shadow-overlay` `rounded-card`, largura do gatilho (mín. 240), padding 4. Campo de busca 40 px no topo com ícone 16; lista até 320 px de altura com rolagem; item 36 px (44 em toque), padding x 12, texto 14; hover/ativo por teclado `bg-hover`; selecionado com check 16 `accent-ink` à direita. Vazio: "Nenhum cliente com esse nome" 14 `fg-3`, padding 16. Carregando: 3 linhas de esqueleto.

### 5.3 Checkbox, Radio, Switch

- Caixa e rádio 18 px, borda 1,5 px `strong`, linha clicável inteira com altura mínima 32 px (44 em toque), gap 10 até o rótulo 14 `fg`, descrição 12 `fg-3`.
- Marcado: `bg-accent`, check 14 traço 3 `on-accent` (rádio: ponto 8 px). Indeterminado: traço horizontal.
- Hover: borda `fg-2`. Foco: contorno 2 px `ring` afastado 2. Erro: borda `danger` + mensagem no Field/RadioGroup. Desabilitado: `bg-sunken` borda `edge`, marcado `fg-disabled`, rótulo `fg-disabled`.
- Switch: trilho 36 × 20 pílula, botão 16 branco, deslocamento 16 px em 150 ms. Desligado `bg-strong` (3:1), hover `fg-3`; ligado `bg-accent`, hover `accent-hover`. Desabilitado: trilho `sunken` com contorno `edge`, botão `fg-disabled`. O switch salva na hora; se a ação precisar de confirmação, use caixa + botão.
- RadioGroup usa `fieldset` + `legend` 14/600.

### 5.4 Segmented

Trilho `bg-sunken`, `rounded-control`, padding 4, gap 2, altura 40 (`md`) ou 32 (`sm`). Opção: padding x 12 (sm 10), texto 14/600 (sm 12/600), ícone 16 opcional, raio 7. Ativa: `bg-raised` `fg` com contorno 1 px `edge`. Inativa `fg-2`, hover `bg-hover` `fg`. Foco: contorno 2 `ring` afastado 1. Desabilitada `fg-disabled`. `role="radiogroup"`, setas movem e aplicam. Até 4 opções; mais que isso, Select. `block`: opções dividem a largura (celular).

### 5.5 Badge e StatusDot

- **Badge**: pílula 24 px, padding x 8, texto 12/600, ícone 14 opcional. Tons: neutral (`sunken`/`fg-2`), accent, ok, warn, danger, info, idle, sempre `-soft` + `-ink`. Uso: contagem, tipo, situação de cobrança. Não é botão.
- **StatusDot**: ponto 8 px + rótulo 14 `fg`, gap 8. `idle` é ponto vazado (anel 1,5 px `idle`). Em tabela e lista, status é sempre StatusDot. Vocabulário fixo:

| Situação | Tom |
|---|---|
| Concluído, pago, disponível | ok |
| Em andamento | accent |
| A caminho, agendado | info |
| Aguardando (assinatura, aprovação), vence hoje | warn |
| Atrasado, avaria, falta | danger |
| Parado, sem uso, em manutenção | idle |

### 5.6 Card

`rounded-card`, padding 20 px (16 abaixo de 640), sem borda, sem sombra.

| Variante | Fundo | Uso |
|---|---|---|
| `default` | `bg-raised` | Padrão |
| `sunken` | `bg-sunken` | Área dentro do painel: vazio, filtro, rascunho |
| `highlight` | `bg-accent` com degradê 160° de `--accent` a `--accent-hover`; texto `on-accent`, secundário `on-accent-2`; anel de foco `on-accent` (o cartão redefine `--ring`, porque `accent-ink` some sobre o acento) | Um por tela, só para o número que ancora a página |

CardHeader: título 16/650 + descrição 12 `fg-3` (no destaque, `on-accent-2`), ação à direita (botão sm ou só ícone), 16 px até o conteúdo, altura mínima 32. Proibido cartão dentro de cartão, borda lateral colorida e grade de cartões iguais como estrutura de página.

### 5.7 Stat e StatStrip

- **Stat**: rótulo 14/600 `fg-2` (altura 24) + botão "como é calculado" (ícone Info 16 em alvo 24, 44 em toque; tooltip com a fórmula em frase) · valor `text-kpi` (28) ou `text-kpi-lg` (38) · variação 12: seta 14 + percentual 600 com sinal + contexto `fg-3` ("em relação a outubro"). Verde (`ok-ink`) quando a variação é boa; para métricas de perda (`deltaInverted`: avaria, atraso, parado) subir é `danger-ink`. Gap 4. Dinheiro usa Money `kpi` ("R$" a 0,5em e centavos a 0,6em, opacidade 80%). Vazio: "Sem dados no período" 16 `fg-3`, nunca "0" inventado. Carregando: esqueleto 14 × 128, 32 × 192, 12 × 160.
- **StatStrip**: um cartão `bg-raised` com itens lado a lado de largura igual, divisor vertical 1 px `hairline`, padding 20 × 24. Abaixo de 1024: 2 colunas, divisores vertical e horizontal, padding 16. Máximo 4 itens; mais que isso vira tabela. `framed={false}`: sem cartão, linhas `hairline` em cima e embaixo (logip).

### 5.8 Tooltip

Radix. `bg-inverse` `text-on-inverse`, 12/16, padding 8 × 10, `rounded-tip`, largura máx. 260, seta 10 × 5, deslocamento 6, atraso 300 ms, entrada 150 ms. Para explicar, nunca conteúdo essencial nem ação. `TooltipBody` (gráfico): título 600, linhas com marca 3 × 10 na cor da série, rótulo `on-inverse-2`, valor 600 `.tnum` à direita.

### 5.9 Skeleton

`ds-skeleton`: gradiente `sunken → hover → sunken` em 1,4 s. Linha 14 px raio 4; bloco raio 10; círculo. Mesmo tamanho do conteúdo final. Contêiner com `aria-busy="true"`; esqueleto `aria-hidden`. Spinner só dentro de botão. Depois de 10 s sem resposta, troca pelo estado de erro com "Tentar de novo".

### 5.10 Money

`formatMoney` + `.tnum` + `white-space: nowrap`. Variantes: `inline` (texto corrido), `cell` (bloco alinhado à direita), `kpi` (prefixo e centavos menores a 80% de opacidade, 100% dentro do Card `highlight` para manter 4,5:1; o valor completo vai num texto `sr-only` e as partes visuais ficam `aria-hidden`). Negativo: sinal "-" e `danger-ink`. `sign`: "+" em positivos (variação, extra). Total de coluna: 600 ou 700, linha superior 1 px `strong`.

---

## 6. Componentes de padrão (`src/ui`, demonstrados na página)

Mesmo rigor dos de cima. Use só tokens e primitivos de `src/ui`. Demonstração: `src/pages/design-system/sections/DataSection.tsx`, `OverlaySection.tsx`, `ShellSection.tsx`.

### 6.1 Tabela (`DataSection`)

- Contêiner: cartão `bg-raised`, padding 0, `rounded-card`, `overflow-x: auto` próprio (a página nunca rola na horizontal). Barra acima da tabela (dentro do cartão, padding 16 × 16, borda inferior `hairline`): título 16/650 + contagem `text-caption fg-3` ("128 locações"), busca 40 px (largura 280), filtros (botões secundários sm), ação primária à direita.
- Cabeçalho 36 px, `text-caption` 600 `fg-3`, sem fundo, borda inferior 1 px `hairline`. Ordenável: botão no cabeçalho com seta 14 (ArrowUp/ArrowDown) `fg-2` na coluna ativa; `aria-sort`. Fixo (`sticky`, z 10, `bg-raised`) quando a tabela rola dentro do cartão.
- Linha 48 px (compacta 40), borda inferior 1 px `hairline` (a última sem), sem zebra. Hover `bg-hover`. Selecionada: `bg-accent-soft` + caixa marcada na primeira coluna (coluna de seleção 48 px). Foco de linha (navegação por setas): contorno 2 `ring` interno (`outline-offset: -2px`). Linha clicável abre o detalhe; ações da linha num botão só ícone `MoreHorizontal` 32 px no fim (aparece sempre no toque; no desktop, sempre visível em `fg-3`).
- Células: texto 14 `fg`; secundário na mesma célula em 12 `fg-3` abaixo (linha passa a 56 px). Código (BQ-0142) `.tnum` 600. Dinheiro: `Money cell`, alinhado à direita, cabeçalho também à direita. Datas `dd/mm/aaaa` `.tnum`. Status: StatusDot. Truncar com reticências e `title`; coluna de nome com largura mínima 200.
- Rodapé (52 px, borda superior `hairline`): "1 a 25 de 128" 12 `fg-3` à esquerda; paginação à direita (botões só ícone sm + seletor de página). Totais de coluna numa linha própria acima do rodapé, 600, borda superior 1 px `strong`.
- Estados: carregando = 8 linhas de esqueleto com as larguras das colunas; vazio = estado vazio (6.2.6) dentro do cartão, altura mínima 240; erro = faixa de aviso `danger` acima da tabela + "Tentar de novo"; sem resultado de filtro = "Nenhuma locação com esses filtros" + botão fantasma "Limpar filtros".
- Abaixo de 768: vira **lista de linhas** dentro do mesmo cartão (não vira cartões soltos): cada item 64 px mínimo, título 14/600 + secundário 12 `fg-3` à esquerda, valor/status à direita, divisor `hairline`.

### 6.2 Linha de serviço (`DataSection`)

Item de lista da agenda e do app de campo. Altura mínima 72 px, padding 12 × 16, divisor `hairline`. Esquerda: horário 14/600 `.tnum` em coluna de 56 px (`fg`), abaixo duração 12 `fg-3`. Centro: tipo + quantidade 14/600 ("Limpeza, 12 unidades"), cliente e endereço 12 `fg-3` truncados, linha de badges (equipe, "Extra"). Direita: StatusDot. Tipo de serviço identificado por ícone 16 (Sparkles limpeza, Truck entrega/retirada, Wrench manutenção, Hammer montagem) em quadrado 32 `bg-sunken` `rounded-tip`, nunca por cor de borda lateral. Hover `bg-hover`; atual (em andamento) com fundo `accent-soft` e horário `accent-ink`. Atrasado: horário `danger-ink` + StatusDot danger. No campo: altura 80, texto 16, toque abre o serviço.

### 6.3 Gráficos (`DataSection`, recharts)

- Sempre dentro de cartão; título 16/650 + valor-resumo à direita (Money) + Segmented sm de período. Área do gráfico 240 px (escritório) / 200 px (campo).
- Eixos: rótulos 12 `viz-axis`, sem linha de eixo; grade só horizontal, 1 px `viz-grid`, 4 a 5 linhas. Valores do eixo em reais abreviados ("R$ 12 mil"); no tooltip, valor completo.
- Barras: largura máx. 32, raio superior 4, gap entre grupos ≥ 8. Série única: `--accent`; barra do período atual `--accent`, anteriores `--accent` a 40% (não é outra cor). Linha: 2 px, pontos só no hover (raio 4, borda 2 `raised`). Área: preenchimento da série a 12%.
- Multi-série: `--viz-1…6` na ordem; mais de 6 séries agrupa o resto em "Outros" (`fg-3`). Legenda acima do gráfico, à esquerda, marca 8 px + rótulo 12 `fg-2`; clicar isola a série.
- Dado "parado / sem uso / pendente": barra `bg-sunken` com `.ds-hatch` (hachura 135°, traço 1,5 px a cada 6 px em `--hatch`) e contorno 1 px `idle`. Hachura só para isso.
- Tooltip: `TooltipBody`, linha vertical de referência 1 px `strong` tracejada 3/3.
- Rosca/progresso: só para uma proporção (ex.: ocupação da frota), espessura 12, trilho `sunken`, número no centro `text-kpi`.
- Vazio: área do gráfico `bg-sunken` `rounded-control` com texto 14 `fg-3` centralizado ("Sem locações neste período"). Carregando: esqueleto bloco da altura do gráfico.
- Acessibilidade: `role="img"` + `aria-label` com resumo ("Faturamento de outubro: R$ 48.312,90, 12,4% acima de setembro"); tabela equivalente acessível por botão "Ver dados". A camada de teclado do recharts fica desligada (`accessibilityLayer={false}`, rosca com `rootTabIndex={-1}`): nada focável dentro de `role="img"`; pelo teclado, o caminho é "Ver dados".

### 6.4 Linha do tempo do dossiê (`DataSection`)

Lista vertical no trilho direito ou na ficha. Cada evento: ícone 16 em círculo 28 `bg-sunken` (danger-soft para avaria, ok-soft para pagamento) à esquerda, linha vertical 1 px `hairline` ligando os círculos (centro a 14 px da esquerda). Conteúdo a 40 px: título 14/600 ("Avaria registrada na BQ-0142"), metadado 12 `fg-3` ("03/11/2026 às 14:32 · Marcos Vieira"), anexo opcional (foto 64 × 64 `rounded-tip`, valor Money). Gap entre eventos 16. Agrupado por dia com cabeçalho 12/600 `fg-3` ("Hoje", "Ontem", "03/11/2026"). Carregando: 3 itens de esqueleto. Vazio: "Nenhum registro para este cliente ainda".

### 6.5 Foto (`DataSection`)

Miniatura 64 × 64 (lista) ou 96 × 96 (grade do campo), `rounded-tip`, `object-fit: cover`, fundo `sunken`. Grade de fotos: gap 8, 3 colunas no celular. Toque abre visualizador em tela cheia (`bg-black`, foto contida, contador "2 de 5" 14 branco, fechar 44 px, deslize lateral). Carregando: esqueleto do mesmo tamanho. Erro: ícone ImageOff 24 `fg-3` no quadrado. Adicionar foto (campo): quadrado tracejado 1,5 px `strong`, ícone Camera 24 + "Foto" 12/600, alvo ≥ 96. Sempre com legenda acessível (`alt`: "Porta da BQ-0142 após a limpeza").

### 6.6 QR (`DataSection`)

`qrcode.react` em SVG, módulos pretos fixos (`text-black`) sobre quadrado branco fixo (`bg-white`) nos dois temas, com padding 12 e `rounded-card` (decisão: leitores de QR e impressão precisam do contraste máximo; `--fg` claro no escuro inverteria o código), nível de correção M, tamanho 160 (tela) / 3 cm (impressão). Abaixo: código 14/600 `.tnum` ("BQ-0142") e nome do equipamento 12 `fg-3`. Ações: "Imprimir etiqueta" (secundário) e "Copiar link" (só ícone).

### 6.7 Diálogo (`OverlaySection`, Radix Dialog)

Só quando a tarefa exige interrupção ou foco protegido (confirmar exclusão, cobrança). Fundo `bg-scrim`. Caixa `bg-overlay` `shadow-overlay` `rounded-card`, largura 480 (sm), 640 (md), 800 (lg), máx. 100vw − 32, altura máx. 100dvh − 64 com rolagem interna no corpo. Cabeçalho: título `text-title-section` + descrição 14 `fg-2`, padding 24 × 24 × 0, fechar só ícone 32 no canto (16 do topo e da direita). Corpo padding 24. Rodapé padding 16 × 24, borda superior `hairline`, botões à direita (secundário "Cancelar", primário com verbo). Destrutivo: primário vira perigo e o rótulo repete o objeto ("Excluir avaria"). Entrada 250 ms (opacidade + escala 0,98 → 1). Foco vai para o primeiro campo, ou para "Cancelar" em destrutivo; Esc fecha; foco volta ao gatilho. Abaixo de 640 vira gaveta inferior (6.8).

### 6.8 Gaveta (`OverlaySection`, vaul / Radix Dialog)

- Lateral direita (escritório): largura 480 (detalhe) ou 640 (formulário longo), altura 100dvh − 24, a 12 px da borda, `bg-overlay` `shadow-overlay` `rounded-panel`. Cabeçalho 64 px (título `text-title-sub`, fechar 40), corpo com rolagem e padding 24, rodapé fixo com ações (como o diálogo). Entrada 250 ms deslizando da direita. Fundo `scrim`.
- Inferior (celular, vaul): largura total, raio 18 só em cima, puxador 36 × 4 `strong` centralizado a 8 px do topo, altura máx. 90dvh, ação principal `field` no rodapé com área segura. Arrastar para baixo fecha; Esc fecha; ao abrir, o foco entra na gaveta e fica preso nela (vaul com `autoFocus`) e volta ao gatilho ao fechar.

### 6.9 Menu (`OverlaySection`, Radix Popover/DropdownMenu)

`bg-overlay` `shadow-overlay` `rounded-card`, padding 4, largura mín. 200. Item 36 px (44 em toque), padding x 12, ícone 16 `fg-2` + rótulo 14 + atalho 12 `fg-3` à direita. Hover/foco `bg-hover`. Perigo: texto e ícone `danger-ink`, sempre por último, depois de um divisor 1 px `hairline` (margem 4). Desabilitado `fg-disabled`. Entrada 200 ms (opacidade + 4 px). Escapa do contêiner por portal.

### 6.10 Toast (`OverlaySection`, sonner)

Topo central no escritório, inferior acima da navegação no celular. `bg-inverse` `text-on-inverse`, `rounded-card`, padding 12 × 16, largura 360 (máx. 100vw − 32), sem sombra extra além de `shadow-overlay`. Ícone 16 de estado em tom claro, porque o fundo é escuro no tema claro (sucesso `#3db876`, erro `#ef5f5a`; no tema escuro, onde o toast é claro, `--ok` e `--danger` do tema claro), texto 14/600 + descrição 12 `on-inverse-2`. Ação à direita: botão texto 14/600 `on-inverse` sublinhado no hover ("Desfazer"). Duração 5 s (8 s com ação), pausa no hover. Uma frase: "Cobrança gerada para a Construtora Planalto".

### 6.11 Faixa de aviso (`OverlaySection`)

Faixa em linha no topo do conteúdo (não flutua). `rounded-card`, padding 12 × 16, fundo `-soft` do tom, ícone 18 `-ink` (Info, TriangleAlert, CircleAlert, CircleCheck), título 14/600 `-ink` + texto 14 `fg` na mesma linha ou abaixo, ação à direita (botão secundário sm; em largura estreita desce para baixo do texto) e fechar só ícone 32 (44 em toque) quando dispensável. Sem borda lateral. Tons: info, warn, danger, ok. Exemplo: "3 mensalidades vencem hoje, R$ 7.420,00 no total. Ver cobranças".

### 6.12 Estado vazio (`OverlaySection`)

Dentro do contêiner que estaria cheio, centralizado, padding 40 × 24, largura do texto máx. 360. Ícone 24 `fg-3` em círculo 48 `bg-sunken`; título 16/650 que diz o que vai aparecer aqui ("As avarias registradas pela equipe aparecem aqui"); texto 14 `fg-2` com o próximo passo; ação primária ou secundária que resolve ("Registrar avaria"). Sem ilustração. Variante "sem resultado de busca": sem ícone de círculo, só texto + "Limpar filtros".

### 6.13 Passo a passo de wizard (`OverlaySection`)

Escritório: barra horizontal acima do formulário, itens com número em círculo 24 (`bg-sunken` `fg-2` 12/600; atual `bg-accent` `on-accent`; concluído `bg-accent-soft` com check 14 `accent-ink`) + rótulo 14 (atual 600 `fg`, outros `fg-2`), ligados por linha 1 px `hairline` (concluída `accent`). Clicar num passo concluído volta a ele. Celular (app de campo): cabeçalho "Passo 2 de 5" 12/600 `fg-3` + título `text-title-field` + barra de progresso 4 px `sunken` com preenchimento `accent` (transição 250 ms). Rodapé: "Voltar" fantasma + "Continuar" primário (`field` no celular). Passo com erro: círculo `danger-soft` com `!`.

### 6.14 Etiqueta "Pacote IA" e cartão do Copiloto (`OverlaySection`)

- **Etiqueta Pacote IA**: Badge tom `accent` com ícone Sparkles 14 e texto "Pacote IA"; ao lado de recursos que dependem do pacote. Sem gradiente, sem brilho, sem esfera.
- **Cartão do Copiloto**: no trilho direito ou no fim de uma seção. `Card default` com cabeçalho: ícone Sparkles 16 `accent-ink` + título 16/650 ("Copiloto") + Badge "Pacote IA". Corpo: sugestão em 14 `fg` com o número em destaque 600 ("A BQ-0142 voltou com avaria 3 vezes em 60 dias. Cobrar R$ 420,00 da Construtora Planalto?"), fonte da conclusão 12 `fg-3` ("Com base em 3 retiradas"). Ações: primário sm com verbo ("Gerar cobrança") + fantasma sm "Dispensar". Carregando: 3 linhas de esqueleto. Não é chat, não tem avatar.

### 6.15 Item da navegação lateral (`ShellSection`)

Altura 40, `rounded-control`, padding x 12, ícone 18 + rótulo 14/500 `fg-2`, gap 12. Hover `bg-hover` `fg`. Ativo: `bg-raised` `fg` 600, ícone `accent-ink` (o painel é `panel`, o item ativo sobe um tom; sem barra lateral colorida). Contador à direita: Badge neutral (ativo: accent). Foco: contorno 2 `ring`. Recolhida (72): só ícone, 48 × 40 centralizado, tooltip à direita com o rótulo. Desabilitado (sem permissão): `fg-disabled` + tooltip explicando.

### 6.16 Topo (`ShellSection`)

Ver 4.1. Ordem: título à esquerda, busca ao centro, avisos e usuário à direita. Busca: Input md com ícone Search 16, placeholder "Buscar cliente, locação, equipamento" (cabe inteiro nos 360 px com o atalho), atalho "Ctrl K" em Badge neutral à direita. Avisos: botão só ícone Bell 20 com ponto 8 `danger` (borda 2 `panel`) no canto superior direito quando há não lidos. Usuário: botão que abre menu (Perfil, Configurações, Sair).

### 6.17 Navegação inferior do celular (`ShellSection`)

Ver 4.2. Itens do app de campo: Hoje, Serviços, Avarias, Perfil. Foco: contorno 2 `ring` afastado −2 no item. Badge numérico 12/600 sobre o ícone (pílula 18, `bg-danger-solid` com texto branco, 5,5:1; `danger` com branco não passa) quando houver pendência.

### 6.18 Botões grandes do app de campo (`ShellSection`)

- Ação principal: Button `field` primário, largura total, ícone 24.
- Ação de etapa (grade 2 colunas, gap 12): botão 96 px de altura, `bg-raised`, `rounded-card`, ícone 24 `accent-ink` em cima + rótulo 16/600 `fg` embaixo, padding 16. Hover/pressionado `bg-hover` / `bg-sunken`. Concluída: ícone CircleCheck `ok`, rótulo + "Feito" 12 `ok-ink`. Desabilitada `fg-disabled`. Foco contorno 2 `ring`.
- Ação de perigo no campo ("Registrar avaria"): Button `field` variante secundário com ícone `danger-ink`; perigo sólido só para excluir.

### 6.19 Faixa "Ambiente de demonstração" (`ShellSection`)

Fixa no topo de tudo (z 95), altura 32, largura total, `bg-inverse` `text-on-inverse`, texto 12/600 centralizado: "Ambiente de demonstração. Dados fictícios." + botão texto "Restaurar dados" 12/600 sublinhado ("restaurar" diz que os dados voltam ao estado de exemplo; "reiniciar" soava como reiniciar o app). Empurra a casca 32 px para baixo (não sobrepõe), publicando a altura em `--demo-strip-h`. No celular: 28 px, só "Demonstração, dados fictícios", sem o botão.

---

## 7. Regras de uso da cor

- **Acento** pode aparecer em: botão primário; um bloco preenchido por tela (Card `highlight`); item ativo de navegação (ícone `accent-ink`); seleção (`accent-soft`); link (`accent-ink`, sublinhado no hover); anel de foco; série única de gráfico; progresso. Em nenhum outro lugar.
- **Um bloco preenchido por tela.** Se a tela tem dois números igualmente importantes, nenhum é destaque: use StatStrip.
- **Estados** nunca usam o acento, mesmo que a marca seja verde (concluído é `ok`, não `accent`).
- **Texto sobre cor**: sobre `accent` só `on-accent`/`on-accent-2`; sobre `-soft` só o `-ink` do mesmo tom; sobre `inverse` só `on-inverse(-2)`.
- **Cor nunca sozinha**: status tem rótulo, gráfico tem legenda, erro tem texto.
- **Hachura** só em dado "parado / sem uso / pendente".

---

## 8. Tema escuro

Não é o claro invertido: superfícies com leve tinta fria; elevação por tom mais claro (app `#0b0d0f` < painel `#121518` < cartão `#191d21` < flutuante `#21262b`) e contorno de 1 px nos flutuantes (sem sombra); texto principal `#eceef1` (não branco puro); estados mais claros e menos saturados; acento com L + 0,07 (limitado pelo contraste com branco); tinta de acento clara (`L ≥ 0,82`). Preferência em `localStorage["r8.theme"]` = `light | dark | system` (padrão `system`), aplicada em `<html data-theme>` por script inline antes da primeira pintura. `color-scheme` e `accent-color` ficam em `.ds-root` para não mudar as telas antigas.

---

## 9. Superfícies do navegador (em `.ds-root`)

Seleção `accent-soft` + `accent-ink`; cursor de texto `accent-ink`; barra de rolagem fina `--scrollbar` (`#c3c8cf` / `#3a4047`) sobre transparente; anel de foco 2 px `ring` afastado 2 px em todo elemento focável; sublinhado com afastamento 3 px e espessura 1 px; números tabulares em tabela, dinheiro, data e código.

---

## 10. Formatos (`src/lib/format.ts`)

| Função | Exemplo |
|---|---|
| `formatMoney(3184.5)` | R$ 3.184,50 (sempre centavos; espaço normal após "R$") |
| `formatMoney(-420)` / `formatMoney(860, { sign: true })` | -R$ 420,00 / +R$ 860,00 |
| `formatMoneyValue`, `parseMoney` | 12.480,00 / "R$ 12.480,00" → 12480 |
| `formatDate`, `formatDateTime`, `formatTime` | 03/11/2026 · 03/11/2026 às 14:32 · 14:32 |
| `formatPhone` | (61) 99841-2207 · fixo (61) 3333-0000 |
| `formatCNPJ`, `formatCPF` | 12.345.678/0001-90 · 123.456.789-00 |
| `formatPercent(0.124)` | 12,4% |

---

## 11. Copy

Frases curtas de app de operação. Botão: verbo + objeto ("Gerar cobrança", "Registrar avaria"). Erro: problema + saída ("CNPJ incompleto. Confira os 14 números."). Vocabulário: equipamento, serviço, cobrança, locação, avaria, extra, mensalidade, retirada, limpeza. Dados de exemplo plausíveis ("Construtora Planalto", "R$ 3.184,50", "BQ-0142", "Limpeza, 12 unidades"). Proibido: travessão (— e –), frase de efeito, "Lorem ipsum", números redondos falsos, emoji em interface.

---

## 12. Contraste medido

Script Playwright (`getComputedStyle` das variáveis resolvidas no navegador, fórmula WCAG 2.1) rodado na página `/design-system`. Texto exige 4,5:1; borda de controle, ponto de status e série de gráfico exigem 3:1.

### 12.1 Neutros e estados

| Texto / objeto | Fundo | Claro (hex) | Razão | Escuro (hex) | Razão | Mínimo |
|---|---|---|---|---|---|---|
| `--fg` | `--app` | `#121417` / `#e9ebee` | 15,45 | `#eceef1` / `#0b0d0f` | 16,75 | 4,50 |
| `--fg` | `--panel` | `#121417` / `#f5f6f8` | 17,06 | `#eceef1` / `#121518` | 15,76 | 4,50 |
| `--fg` | `--raised` | `#121417` / `#ffffff` | 18,45 | `#eceef1` / `#191d21` | 14,58 | 4,50 |
| `--fg` | `--sunken` | `#121417` / `#eef0f3` | 16,16 | `#eceef1` / `#0f1214` | 16,18 | 4,50 |
| `--fg` | `--hover` | `#121417` / `#eceef1` | 15,87 | `#eceef1` / `#22272c` | 12,95 | 4,50 |
| `--fg` | `--overlay` | `#121417` / `#ffffff` | 18,45 | `#eceef1` / `#21262b` | 13,12 | 4,50 |
| `--fg-2` | `--app` | `#454b54` / `#e9ebee` | 7,36 | `#b9bfc7` / `#0b0d0f` | 10,51 | 4,50 |
| `--fg-2` | `--panel` | `#454b54` / `#f5f6f8` | 8,13 | `#b9bfc7` / `#121518` | 9,89 | 4,50 |
| `--fg-2` | `--raised` | `#454b54` / `#ffffff` | 8,80 | `#b9bfc7` / `#191d21` | 9,15 | 4,50 |
| `--fg-2` | `--sunken` | `#454b54` / `#eef0f3` | 7,70 | `#b9bfc7` / `#0f1214` | 10,15 | 4,50 |
| `--fg-2` | `--hover` | `#454b54` / `#eceef1` | 7,57 | `#b9bfc7` / `#22272c` | 8,13 | 4,50 |
| `--fg-3` | `--app` | `#5c636d` / `#e9ebee` | 5,08 | `#9198a2` / `#0b0d0f` | 6,69 | 4,50 |
| `--fg-3` | `--panel` | `#5c636d` / `#f5f6f8` | 5,61 | `#9198a2` / `#121518` | 6,30 | 4,50 |
| `--fg-3` | `--raised` | `#5c636d` / `#ffffff` | 6,07 | `#9198a2` / `#191d21` | 5,82 | 4,50 |
| `--fg-3` | `--sunken` | `#5c636d` / `#eef0f3` | 5,32 | `#9198a2` / `#0f1214` | 6,46 | 4,50 |
| `--fg-3` | `--hover` | `#5c636d` / `#eceef1` | 5,22 | `#9198a2` / `#22272c` | 5,17 | 4,50 |
| `--strong` | `--raised` | `#7d848e` / `#ffffff` | 3,77 | `#6c747e` / `#191d21` | 3,58 | 3,00 |
| `--strong` | `--panel` | `#7d848e` / `#f5f6f8` | 3,49 | `#6c747e` / `#121518` | 3,87 | 3,00 |
| `--strong` | `--app` | `#7d848e` / `#e9ebee` | 3,16 | `#6c747e` / `#0b0d0f` | 4,11 | 3,00 |
| `--on-inverse` | `--inverse` | `#f3f4f6` / `#14171b` | 16,34 | `#121417` / `#eef0f3` | 16,16 | 4,50 |
| `--on-inverse-2` | `--inverse` | `#b4bac2` / `#14171b` | 9,20 | `#454b54` / `#eef0f3` | 7,70 | 4,50 |
| `--ok-ink` | `--ok-soft` | `#11603a` / `#e3f3e9` | 6,62 | `#86dcaa` / `#132b1e` | 9,22 | 4,50 |
| `--ok-ink` | `--raised` | `#11603a` / `#ffffff` | 7,61 | `#86dcaa` / `#191d21` | 10,36 | 4,50 |
| `--warn-ink` | `--warn-soft` | `#7a4f00` / `#fcf1d4` | 6,34 | `#f2cd7d` / `#2f250d` | 9,92 | 4,50 |
| `--warn-ink` | `--raised` | `#7a4f00` / `#ffffff` | 7,13 | `#f2cd7d` / `#191d21` | 11,14 | 4,50 |
| `--danger-ink` | `--danger-soft` | `#a3161d` / `#fce8e8` | 6,64 | `#ffa8a3` / `#371718` | 8,77 | 4,50 |
| `--danger-ink` | `--raised` | `#a3161d` / `#ffffff` | 7,81 | `#ffa8a3` / `#191d21` | 9,19 | 4,50 |
| `--info-ink` | `--info-soft` | `#1c4ea6` / `#e5edfc` | 6,64 | `#a9c6ff` / `#14223b` | 9,24 | 4,50 |
| `--info-ink` | `--raised` | `#1c4ea6` / `#ffffff` | 7,81 | `#a9c6ff` / `#191d21` | 9,85 | 4,50 |
| `#ffffff` | `--danger-solid` | `#ffffff` / `#c8282f` | 5,53 | `#ffffff` / `#c9333a` | 5,23 | 4,50 |
| `#ffffff` | `--danger-solid-hover` | `#ffffff` / `#b12027` | 6,76 | `#ffffff` / `#b5262d` | 6,40 | 4,50 |
| `--ok` | `--raised` | `#1b7f48` / `#ffffff` | 5,03 | `#3db876` / `#191d21` | 6,71 | 3,00 |
| `--warn` | `--raised` | `#b97800` / `#ffffff` | 3,65 | `#e0a833` / `#191d21` | 7,92 | 3,00 |
| `--danger` | `--raised` | `#cf2f37` / `#ffffff` | 5,10 | `#ef5f5a` / `#191d21` | 5,21 | 3,00 |
| `--info` | `--raised` | `#2b6cd9` / `#ffffff` | 4,94 | `#6b9cf5` / `#191d21` | 6,21 | 3,00 |
| `--idle` | `--raised` | `#8a919b` / `#ffffff` | 3,18 | `#7b838d` / `#191d21` | 4,42 | 3,00 |
| `--viz-1` | `--raised` | `#394cb3` / `#ffffff` | 7,35 | `#6fb1ea` / `#191d21` | 7,39 | 3,00 |
| `--viz-2` | `--raised` | `#c57952` / `#ffffff` | 3,37 | `#f17d29` / `#191d21` | 6,22 | 3,00 |
| `--viz-3` | `--raised` | `#29a493` / `#ffffff` | 3,08 | `#97cb9c` / `#191d21` | 9,15 | 3,00 |
| `--viz-4` | `--raised` | `#93266c` / `#ffffff` | 7,68 | `#be659a` / `#191d21` | 4,45 | 3,00 |
| `--viz-5` | `--raised` | `#9481e1` / `#ffffff` | 3,24 | `#7b85e1` / `#191d21` | 5,07 | 3,00 |
| `--viz-6` | `--raised` | `#685c1c` / `#ffffff` | 6,70 | `#f5c130` / `#191d21` | 10,13 | 3,00 |

### 12.2 Marca (5 testes × 2 temas)

Colunas: branco sobre accent, hover e active; `on-accent-2` sobre accent; `accent-ink` sobre `accent-soft`, `raised` e `panel`; anel de foco sobre `app`; accent sobre `panel` (informativo, o botão é identificado pelo rótulo).

| Marca (hex de entrada) | Tema | `--accent` | branco / accent | branco / hover | branco / active | on-accent-2 / accent | ink / soft | ink / raised | ink / panel | anel / app | accent / panel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Verde (padrão) (`#275b3e`) | claro | `#275b3e` | 7,92 | 9,65 | 11,54 | 5,01 | 7,01 | 7,92 | 7,32 | 6,63 | 7,32 |
| Laranja R8 (`#ee6a1c`) | claro | `#c65200` | 4,56 | 5,46 | 6,64 | 4,56 | 6,58 | 7,53 | 6,96 | 6,30 | 4,21 |
| Azul (`#2557c7`) | claro | `#2557c7` | 6,43 | 7,82 | 9,58 | 4,58 | 6,36 | 7,27 | 6,73 | 6,09 | 5,95 |
| Grafite (`#3b4048`) | claro | `#3b4048` | 10,43 | 12,48 | 14,62 | 6,35 | 9,14 | 10,43 | 9,65 | 8,74 | 9,65 |
| Amarelo claro (teste) (`#f5cf45`) | claro | `#8e7300` | 4,56 | 5,49 | 6,69 | 4,56 | 6,26 | 7,13 | 6,60 | 5,97 | 4,22 |
| Verde (padrão) (`#275b3e`) | escuro | `#3b6f51` | 5,87 | 5,06 | 7,57 | 4,56 | 8,37 | 10,00 | 10,81 | 11,48 | 3,12 |
| Laranja R8 (`#ee6a1c`) | escuro | `#c65200` | 4,56 | 5,22 | 5,78 | 4,56 | 8,14 | 9,42 | 10,18 | 10,82 | 4,02 |
| Azul (`#2557c7`) | escuro | `#396ddf` | 4,74 | 5,51 | 6,17 | 4,50 | 8,22 | 9,65 | 10,44 | 11,09 | 3,86 |
| Grafite (`#3b4048`) | escuro | `#4e535b` | 7,74 | 6,65 | 9,96 | 4,96 | 8,20 | 9,67 | 10,45 | 11,10 | 2,37 |
| Amarelo claro (teste) (`#f5cf45`) | escuro | `#8e7300` | 4,56 | 5,24 | 5,84 | 4,56 | 8,22 | 9,71 | 10,50 | 11,16 | 4,02 |

---

## 13. Proibições

- Rótulo "eyebrow" acima de título. Numeração de seção (01, 02).
- Cartão dentro de cartão. Grade de cartões idênticos como estrutura de página. Grade de 4 KPIs iguais.
- Texto em gradiente. Glassmorphism. Borda lateral colorida em cartão, item de lista ou aviso.
- Borda e sombra no mesmo elemento. Sombra no tema escuro. Sombra dura sem desfoque.
- Raio de cartão fora de 12 a 16 (usamos 14). Pílula em botão ou cartão.
- Texto abaixo de 12 px. Texto secundário abaixo de 4,5:1. Cinza sobre cor (use a tinta do tom).
- Fonte que não seja Manrope. Inter, Roboto, mono fora de código. Peso abaixo de 400.
- Emoji como ícone. Ícone de outra biblioteca. Traço diferente de 2.
- Hachura como enfeite. Ilustração, memoji, avatar fictício decorativo, imagem promocional.
- Acento em estado (concluído verde-marca), em fundo de seção, em texto corrido sem ser link.
- Animação de entrada de página, parallax, duração acima de 250 ms (exceto esqueleto e spinner).
- Modal como primeira opção. Spinner no meio do conteúdo.
- Travessão, frase de efeito, "Lorem ipsum", números redondos falsos.
- Tokens antigos (`canvas`, `card`, `ink`, `brand`…) em tela nova.

---

## Perguntas em aberto

1. **Neutros tingidos pela marca?** Mantive neutros frios fixos para combinar com qualquer marca. Se o cliente quiser neutros puxados para a cor dele, dá para derivar em `applyBrand` (croma ≤ 0,01).
2. **Contraste do botão preenchido com o fundo no escuro.** Com Grafite no escuro, accent sobre painel dá 2,37:1. O botão é identificado pelo rótulo (WCAG 1.4.11 não exige), mas pode parecer apagado. O mesmo vale para o trilho do switch ligado (2,37:1 sobre o painel): o estado é lido pela posição do botão branco, que dá 7,7:1 com o trilho e 18:1 com o painel, então passa. Alternativa conservadora, não aplicada: contorno 1 px `edge` no primário e no switch ligado quando accent/painel < 3:1.
3. **Laranja R8 escurece para `#c65200`.** O laranja original `#ee6a1c` dá 3,2:1 com branco; a derivação escurece até 4,56:1. Se o cliente exigir o tom exato, a alternativa é texto escuro sobre o laranja (mudaria `--on-accent`), o que não está implementado.
4. **Corpo do escritório em 14 px** (o piso era 13). Densidade de tabela aceita 13 px se o cliente pedir mais linhas por tela.
