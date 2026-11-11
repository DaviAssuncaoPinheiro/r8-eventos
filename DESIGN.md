# R8 · Design system v2

Especificação de design do sistema de operação para locadoras (banheiros químicos, estruturas para eventos, som e luz, equipamentos). A primeira versão da v2 seguiu à risca um piso de raios e de números contidos e saiu seca, com cara de painel administrativo genérico; foi reprovada pelo dono do produto. Esta é a direção atual, calibrada nas referências: cartões bem arredondados, pílulas, degradê da marca no destaque, números grandes, gráficos e mapa em vez de tabela. O código manda: se este arquivo e `src/ui` divergirem, o arquivo está errado. Quem constrói tela lê este arquivo e usa `src/ui` e `src/styles/tokens.css`. Valores aqui são exatos; se algo não estiver aqui, pergunte antes de inventar.

- Página viva: `/design-system` (alternador de tema e de cor da marca no topo; laranja, verde, azul, grafite).
- Telas de referência do padrão aprovado: `src/modules/painel/index.tsx` (escritório) e `src/modules/campo/Hoje.tsx` (celular). A seção 7 descreve a composição delas.
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

**Por que funciona.** Hierarquia por tom de superfície (página < moldura < painel < cartão), sem uma sombra sequer. Um único bloco preenchido de verde, em degradê, ancora o olhar no número que importa. Números grandes e rótulos pequenos dão leitura em 1 segundo. Ritmo regular de gaps. Pílulas e raios generosos dão o acabamento de produto.

**O que não copiar.** Cinza `#838786` sobre `#ffffff` dá 3,7:1 e `#929493` dá 3,1:1 (reprovam AA para texto). Legendas de 9 a 10 px na imagem. Cartão promocional com imagem. Avatares memoji. Hachura como enfeite de gráfico.

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

Casca e camadas do Donezo (fundo em tom, painel, cartão branco, um bloco da marca por tela em degradê, números grandes, pílulas) + maneira de conteúdo do logip (tabela sem bordas com ponto de status, trilho direito, tooltip escuro). Onde uma regra de acessibilidade genérica bate de frente com a referência, vale a referência, desde que o contraste AA, o foco e o alvo de toque se mantenham. Escala adotada em 1440 px, em relação às referências: título 34 (ref. 39), número âncora 44 a 56 (ref. 55), botão 52 a 56 (ref. 64), botão de uso corrente 44, item de navegação 44, linha de tabela 48 (ref. 71, solta demais para operação). Larguras da casca: lateral 256, trilho 336, gap 12.

---

## 2. Princípios

Vêm das preferências do dono do produto (`CLAUDE.md`), registradas em 11/11/2026 depois da revisão da primeira prévia do Painel de Dinheiro.

1. **Simples e direto.** Cada bloco mostra título curto, o dado e a ação. Nada de texto de apoio: sem subtítulo de página, sem linha explicativa embaixo de número, sem legenda embaixo de item de lista, sem "com base em…", sem contagem repetida ao lado de valor. Se uma informação não muda a decisão de quem olha, sai da tela e vai para tooltip ou para a tela de detalhe. Fica o que é necessário para usar: rótulo de campo, texto de erro, "como é calculado" em tooltip.
2. **Visual, não planilha.** Número grande, gráfico, mapa, foto do equipamento, medidor, avatar. Tabela só onde a tarefa é comparar linhas, e mesmo assim com acabamento (seção 6.1).
3. **Laranja é a cor da casa.** A demo abre em laranja (`#f04e0a`, derivado para passar AA). A cor continua configurável, então todo uso de marca lê `--accent*` e o contraste é garantido pela derivação, não pelo olho de quem desenha. Um bloco preenchido em degradê por tela, mais o botão primário.
4. **Bater o olho e entender.** Em 2 segundos tem que estar claro que é um sistema de locadora (equipamento, entrega, cobrança) e o que a tela faz. Vocabulário do ofício, dinheiro em reais com centavos antes do gráfico, mapa e foto quando existirem.
5. **Acabamento de produto premium.** Raios 22 e 28, pílulas, degradê da marca no destaque, microinteração com propósito (número que sobe, barra que cresce, seta que gira, foco de luz). Nada que pareça template ou painel administrativo genérico.
6. **Acessível por construção, legível na rua.** AA em todo texto, foco visível, alvo de toque de 44 px. No app de campo: corpo 16 px, ação principal de 56 px no alcance do polegar, contraste máximo no texto principal para uso sob sol.

---

## 3. Tokens

### 3.1 Cor: neutros e estados

Família neutra fria quase acromática (matiz ≈ 250°, croma ≤ 0,01), para combinar com qualquer cor de marca.

| Token (CSS) | Classe Tailwind | Claro | Escuro | Uso |
|---|---|---|---|---|
| `--app` | `bg-app` | `#ebecee` | `#0b0d0f` | Fundo da janela |
| `--panel` | `bg-panel` | `#f6f6f7` | `#121518` | Lateral, painel principal, trilho, topo |
| `--raised` | `bg-raised` | `#ffffff` | `#191d21` | Cartão, campo, tabela, item ativo da lateral |
| `--sunken` | `bg-sunken` | `#f0f0f2` | `#0f1214` | Trilho de segmentado, área vazia, cartão afundado, esqueleto |
| `--hover` | `bg-hover` | `#ededf0` | `#22272c` | Hover de linha, de botão secundário e de item de navegação |
| `--overlay` | `bg-overlay` | `#ffffff` | `#21262b` | Menu, popover, diálogo, gaveta |
| `--inverse` | `bg-inverse` | `#14171b` | `#eef0f3` | Tooltip, toast, etiqueta de valor das barras |
| `--on-inverse` / `--on-inverse-2` | `text-on-inverse(-2)` | `#f3f4f6` / `#b4bac2` | `#121417` / `#454b54` | Texto sobre inverse |
| `--scrim` | `bg-scrim` | `rgba(12,14,16,.48)` | `rgba(0,0,0,.62)` | Fundo atrás de diálogo e gaveta |
| `--fg` | `text-fg` | `#121417` | `#eceef1` | Texto principal, números |
| `--fg-2` | `text-fg-2` | `#454b54` | `#b9bfc7` | Rótulo, texto secundário |
| `--fg-3` | `text-fg-3` | `#5c636d` | `#9198a2` | Placeholder, cabeçalho de tabela, rótulo de grupo da lateral |
| `--fg-disabled` | `text-fg-disabled` | `#a1a7b0` | `#5a616b` | Desabilitado (isento de contraste) |
| `--hairline` | `border-hairline` | `#e8e8eb` | `#262b31` | Divisor, linha de tabela |
| `--edge` | `border-edge` / `ring-edge` | `#d5d7db` | `#353b42` | Contorno de botão secundário, segmentado ativo, botão circular |
| `--strong` | `border-strong` | `#7d848e` | `#6c747e` | Borda de campo, caixa, rádio, switch desligado (≥ 3:1) |
| `--ring` | `outline-ring` | = `--accent-ink` | = `--accent-ink` | Anel de foco (no destaque vira `--on-accent`) |
| `--ok` / `-soft` / `-ink` | `bg-ok`, `bg-ok-soft`, `text-ok-ink` | `#1b7f48` / `#e3f3e9` / `#11603a` | `#1d8449` / `#132b1e` / `#86dcaa` | Concluído, pago, disponível |
| `--warn` / `-soft` / `-ink` | | `#b97800` / `#fcf1d4` / `#7a4f00` | `#e0a833` / `#2f250d` / `#f2cd7d` | Atenção, vence hoje, aguardando |
| `--danger` / `-soft` / `-ink` | | `#cf2f37` / `#fce8e8` / `#a3161d` | `#ef5f5a` / `#371718` / `#ffa8a3` | Atraso, avaria, erro |
| `--danger-solid` / `-hover` | `bg-danger-solid` | `#c8282f` / `#b12027` | `#c9333a` / `#b5262d` | Botão de perigo e pino de atraso (texto branco) |
| `--info` / `-soft` / `-ink` | | `#2b6cd9` / `#e5edfc` / `#1c4ea6` | `#2f72e0` / `#14223b` / `#a9c6ff` | A caminho, informativo |
| `--idle` | `bg-idle`, `ring-idle` | `#8a919b` | `#7b838d` | Parado, sem uso (sempre com hachura ou ponto vazado) |
| `--map-land` | | `#e4e5e8` | `#1d2126` | Fundo do mapa e regiões |
| `--map-park` / `--map-water` | | `#d9e6dc` / `#cfdbe8` | `#1b2a22` / `#18242f` | Parque e lago no mapa |
| `--map-road` | | `#f6f6f7` | `#2a2f35` | Avenidas no mapa |

Base (`ok`, `warn`, `danger`, `info`) é para ponto, ícone, barra e pino. Texto de estado usa sempre `-ink`, sobre `-soft` ou sobre superfície. No tema escuro `--ok` e `--info` são mais escuros que o esperado de propósito: o pino do mapa leva texto branco e precisa de 4,5:1 (antes eram `#3db876` e `#6b9cf5`, com 2,5:1 e 2,7:1); como ponto sobre o cartão escuro seguem acima de 3:1.

### 3.2 Cor: marca (derivada)

`applyBrand(hex)` em `src/lib/brand.ts` converte para OKLCH e grava `--brand-l-*` (claro) e `--brand-d-*` (escuro) no `:root`. Os temas leem `--accent*` a partir delas. A escolha fica em `localStorage["r8.brand"]` e o script inline do `index.html` aplica antes da primeira pintura. Os valores de `tokens.css` são só o ponto de partida do laranja padrão.

| Variável | Regra no claro | Regra no escuro |
|---|---|---|
| `--accent` | Cor escolhida; se branco < 4,5:1, baixa só L até atingir 4,55:1 | L do claro + 0,07, limitado ao maior L em que o branco ainda dá 4,55:1 |
| `--accent-hover` | L menos 0,045 | L mais 0,035 (se ainda passar com branco), senão L menos 0,035 |
| `--accent-active` | L menos 0,09 | L menos 0,06 |
| `--accent-soft` | L 0,955, C = min(C × 0,3; 0,035) | L 0,285, C = min(C × 0,45; 0,06) |
| `--accent-ink` | Começa em L = min(L; 0,46), C ≤ 0,14 e escurece até ≥ 4,5:1 sobre soft, raised, panel e app | Começa em L 0,82, C ≤ 0,12 e clareia até ≥ 4,5:1 sobre soft, raised, panel e app |
| `--accent-glow` | Mesmo matiz e croma, L = min(0,8; L + 0,14). **Só desenho de fundo** (anéis, foco de luz, brilho do canto). Nunca é cor de texto nem de preenchimento sob texto | L = min(0,82; L + 0,14), mesma regra |
| `--on-accent` | `#ffffff` | `#ffffff` |
| `--on-accent-2` | Branco misturado ao acento, o mais suave que dá ≥ 4,5:1 | idem |

**Padrão do produto: laranja `#f04e0a`.** A derivação escurece o laranja até o branco dar 4,5:1 e ele vira `#d54200` como preenchimento (4,56:1 com branco), nos dois temas; o brilho `#ff7950` é só desenho de fundo. Presets da demo, nesta ordem: **Laranja** `#f04e0a` (padrão), **Verde floresta** `#2d6a47`, **Azul** `#2557c7`, **Grafite** `#3b4048`. Resultado medido dos 4 presets e de um amarelo claro `#f5cf45` na seção 13.2.

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

Menor ΔE OKLab entre dois quaisquer (medido): claro normal 0,196 · deuteranopia 0,098 · protanopia 0,101 · tritanopia 0,102. Escuro normal 0,115 · deuteranopia 0,100 · protanopia 0,111 · tritanopia 0,088. Contraste sobre `--raised` na seção 13.1.

### 3.4 Tipografia

Uma família: **Manrope Variable** (`@fontsource-variable/manrope`, já instalada). Passou nos critérios no Chromium via Playwright: `tabular-nums` deixa "1111" e "8888" com a mesma largura, acentos do português corretos nos pesos 400 a 700 e x-height alto o bastante para 12 px. Inter e Roboto proibidas.

Escala fixa em px: **12, 14, 16, 18, 22, 24, 32, 34, 44**, mais 52 e 56 só em número âncora dentro de componente (medidor e indicador largo). Pesos usados: **500** no texto corrido, **600** em rótulo, título, botão e número, **700** só em iniciais, pino e avatar.

| Papel | Classe | Tamanho / linha | Peso | Tracking | Onde |
|---|---|---|---|---|---|
| KPI âncora | `text-kpi-lg` | 44 / 48 | 600 | -0,035em | Número do indicador (`MoneyCard`) |
| Título de página | `text-title-page` | 34 / 40 | 600 | -0,03em | H1 do escritório |
| KPI | `text-kpi` | 32 / 38 | 600 | -0,03em | Valor de bloco médio, número do Copiloto |
| Título do app de campo | `text-title-field` | 24 / 30 | 600 | -0,02em | H1 no celular |
| Título de seção | `text-title-section` | 22 / 28 | 600 | -0,015em | H2 de página longa, título de diálogo |
| Subtítulo | `text-title-sub` | 18 / 24 | 600 | -0,01em | Título de bloco do Painel, título do topo, nome da locadora |
| Título de cartão | `text-title-card` | 16 / 22 | 600 | -0,005em | H3 de cartão, de grupo |
| Corpo grande | `text-body-lg` | 16 / 24 | 500 | 0 | Corpo do app de campo, botão lg e field, linha da lista de ações |
| Corpo | `text-body` | 14 / 20 | 500 | 0 | Corpo do escritório, célula de tabela |
| Rótulo | `text-body font-semibold` | 14 / 20 | 600 | 0 | Rótulo de campo, botão, item de menu |
| Legenda | `text-caption` | 12 / 16 | 500 (600 em badge e etiqueta) | 0 | Ajuda, metadado, cabeçalho de tabela |

Tamanhos fora do mapa de classes, usados em componentes: número do indicador em `size="xl"` `clamp(36px, 15cqw, 56px)` e em `lg` `clamp(30px, 17.5cqw, 44px)` (acompanham a largura do cartão); centro do `ArcGauge` 52 / 56, 600, -0,035em; título do bloco "Próximo serviço" do campo 26 / 32, 600, -0,02em; item da lateral 15 / 20 (500, ativo 600); título do `MoneyCard` 15 / 20, 500, e 16 / 24 quando o cartão passa de 250 px.

Corpo mínimo: 14 px no escritório, 16 px no app de campo. Nada abaixo de 12 px. Prosa até 68ch. Números de tabela, dinheiro, datas e códigos sempre com `.tnum`. Caixa alta só em siglas e no rótulo de grupo da lateral (12 px, 500, tracking 0,08em).

### 3.5 Espaçamento

Base 4 px. Escala usada: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64** (classes Tailwind 1, 2, 3, 4, 5, 6, 8, 10, 12, 16). Dentro de um grupo 8 a 12; entre cartões 16 (linha e coluna); entre cabeçalho da página e primeira linha 24; padding de cartão 20 (24 a partir de 640). Entre seções de página de documentação 40.

### 3.6 Raios

| Token | Valor | Uso |
|---|---|---|
| `rounded-check` | 5 px | Caixa de seleção |
| `rounded-tip` | 10 px | Tooltip, miniatura de foto, item de menu, etiqueta de valor da barra |
| `rounded-control` | 12 px | Campo, select, textarea, logo da locadora, ícone-quadrado de linha, item de menu de gaveta |
| `rounded-card` | 22 px | Cartão, menu, popover, toast, diálogo, aviso |
| `rounded-panel` | 28 px | Painéis da casca (lateral, topo, conteúdo, trilho), gaveta, cantos de cima da gaveta inferior |
| `rounded-pill` | 999 px | Botão (todos os tamanhos), busca, segmentado, badge, switch, ponto, avatar, barra, medidor, botão circular |

Conteúdo encostado dentro de um cartão com padding de 8 px (mapa) usa raio 16.

### 3.7 Bordas e elevação

| Nível | Claro | Escuro |
|---|---|---|
| 0 Página | `bg-app` | `bg-app` |
| 1 Painel | `bg-panel`, sem borda, sem sombra | idem |
| 2 Cartão | `bg-raised`, sem borda, sem sombra | idem (tom mais claro que o painel) |
| 3 Flutuante | `bg-overlay` + `shadow-overlay` = `0 12px 32px -8px rgba(16,18,22,.18), 0 2px 6px rgba(16,18,22,.06)` | `bg-overlay` + `shadow-overlay` = contorno `0 0 0 1px #353b42` |
| 4 Arrastando | `shadow-drag` = `0 18px 40px -12px rgba(16,18,22,.28)` | contorno `0 0 0 1px #474e57` |

Borda OU sombra, nunca as duas. Linhas internas: 1 px `border-hairline`. Campo: 1 px `border-strong`. Botão secundário: anel interno 1 px `ring-edge`. O destaque em degradê (`.ds-hero`) e o cartão escuro do Copiloto são preenchimentos, não elevação: sem sombra.

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
| `--dur-base` | 200 ms | Menu, tooltip (entrada 150), troca de aba, seta que gira |
| `--dur-slow` | 250 ms | Gaveta, diálogo, toast, altura da barra em foco |
| `--ease-ui` | `cubic-bezier(0.16, 1, 0.3, 1)` (exponencial de saída) | Tudo |

**Entrada de dado, uma vez ao montar.** O que mostra um número ganha vida uma vez e para; nada repete. Fica fora do limite de 250 ms porque revela dado, não decora:

| O que | Como | Duração |
|---|---|---|
| Número do `MoneyCard` | Sobe de 0 até o valor, saída exponencial (`useCountUp`) | 600 ms |
| Barras do `PillBars` | Crescem de 8% da altura até 100% a partir da base (`ds-grow-y`), uma após a outra com 40 ms de intervalo | 600 ms |
| Arco do `ArcGauge` | Traço desenhado do começo ao fim (`ds-arc`, `stroke-dashoffset`); o trecho hachurado não anima | 900 ms |
| Rota do `MapaDF` | Linha cheia desenhada do início ao fim (`ds-route`); a tracejada (prevista) não anima | 900 ms |

**Resposta ao gesto.** Botão desce 1 px ao pressionar; seta circular do indicador gira 45° no hover (200 ms); foco de luz do destaque acompanha o ponteiro (sem transição, só no destaque); altura da barra em foco muda em 250 ms.

**Flutuantes.** Opacidade 0 → 1 e translateY 4 px → 0 (menu, tooltip 2 px) ou escala 0,98 → 1 (diálogo); gaveta desliza 100% → 0. Saída com 70% da duração.

**Em loop, só três:** esqueleto (1,4 s), spinner de botão (0,8 s) e o pulso do pino do mapa (`ds-pulse`, 1,8 s, só equipe em deslocamento ou serviço em andamento). Sem sequência de entrada de página, sem parallax. `prefers-reduced-motion: reduce` zera transições e animações (regra global em `src/index.css`); `useCountUp` devolve o valor final direto. Os keyframes de entrada e saída das sobreposições (`ds-scrim`, `ds-dialog`, `ds-drawer-side`, `ds-vaul`, `ds-menu`) e os de dado (`ds-draw`, `ds-grow-y`, `ds-arc`, `ds-pulse`) ficam em `src/styles/tokens.css`; nenhum componente injeta `<style>`.

### 3.10 Ícones

lucide-react, `strokeWidth={2}` em todos os tamanhos, cor herdada (`currentColor`). Tamanhos: **14** (badge, legenda, etiqueta do indicador), **16** (botão sm, tabela, campo), **18** (botão md, seta pequena da lista de ações), **20** (botão lg, navegação lateral, topo, seta do indicador, ícone do círculo da lista de ações), **22** (botão do destaque no campo), **24** (app de campo, estado vazio). Ícone sozinho exige `aria-label` e tooltip. Decorativo leva `aria-hidden`. Nenhum emoji como ícone.

### 3.11 Breakpoints

| Nome | Largura | Tailwind | Comportamento |
|---|---|---|---|
| Celular | 390 (base) | (sem prefixo) | App de campo; escritório com lateral em gaveta |
| Tablet | 640 / 768 | `sm:` / `md:` | Grades de 2 colunas; padding de cartão passa de 20 a 24 |
| Escritório compacto | 1024 | `lg:` | Lateral recolhida (72), trilho direito vira gaveta |
| Escritório | 1280 | `xl:` | Lateral aberta (256), trilho direito fixo (336) |
| Escritório largo | 1440 | `wide:` | Conteúdo até 1280 de largura útil, centralizado |

Breakpoints do `OfficeFrame` são de **contêiner** (`@container/frame`), que na janela cheia coincidem com os da tabela. O Painel acrescenta um: a partir de **1180 px de largura do quadro** as linhas viram grade de 12 colunas e os indicadores ficam 4 em linha; abaixo disso, 1 coluna (2 para os indicadores a partir de `sm`). Para os 4 números caberem, a lateral começa recolhida em janelas menores que 1360 px.

**Alvo de toque.** Em `pointer: coarse` todo controle tem alvo de pelo menos 44 × 44: `ds-touch` (altura mínima 44: botão sm e md, item da lateral, linha de caixa, rádio e switch), `ds-touch-sq` (largura mínima 44: botão só ícone sm e md, seta do indicador) e `ds-hit` (área de toque invisível de 44 × 44 centrada, sem mudar o desenho: trilho do switch, opção de segmentado, número de passo clicável, botão (i) do indicador, botão texto da faixa de demonstração). O desenho no desktop não muda.

---

## 4. Grid e casca

### 4.1 Escritório (desktop)

- Fundo `bg-app`. Padding externo 12 px, gap 12 px entre painéis (`--shell-gap`).
- **Lateral** `bg-panel`, `rounded-panel`, altura 100dvh menos 24, fixa. Largura 256 px aberta (≥ 1280), 72 px recolhida (1024 a 1279, ou por escolha do usuário; a escolha fica em localStorage). Conteúdo: marca da locadora em 72 px de altura (padding x 20; logo 36 em degradê da marca, `rounded-control`, iniciais 14/700; nome `text-title-sub`); grupos de navegação (rótulo em caixa alta, seção 6.15); itens de 44 px; rodapé com Configurações, Ajuda e usuário (linha de 48, avatar 32 `accent-soft`).
- **Topo** `bg-panel`, `rounded-panel`, altura 72 px, padding horizontal 20 px, gap 16, fixo no topo da coluna principal: título da tela `text-title-sub` truncado à esquerda (no Painel, a data por extenso); busca em pílula (Input md, 44 px, largura até 360 px, atalho Ctrl K) ao centro (de 1024 a 1279 vira botão circular de 44); à direita, botões circulares de 44 (avisos) e usuário (avatar 40 + nome 14/600 + papel 12 `fg-3`, botão de 48 em pílula).
- **Painel principal** `bg-panel`, `rounded-panel`, padding 28 px (24 em 1024 a 1279, 16 abaixo de 1024), largura útil máxima 1280 px. Cabeçalho da página: só o título `text-title-page`, sem linha de apoio, e as ações à direita em botões `lg` (primário primeiro); 24 px até o conteúdo.
- **Grade do conteúdo**: 12 colunas, gap 16 px. Composições aprovadas na seção 7.
- **Trilho direito** (contexto: dossiê do cliente, atividade, Copiloto): `bg-panel`, `rounded-panel`, 336 px, padding 20 px, fixo a partir de 1280. Entre 1024 e 1279 vira gaveta pela direita (botão só ícone no topo). Abaixo de 1024 vira tela cheia.
- **Abaixo de 1024**: lateral vira gaveta pela esquerda (botão menu de 44 no topo), padding externo 0, painéis sem raio, padding do conteúdo 16 px.

### 4.2 App de campo (celular, 390 × 844 de referência)

- Fundo `bg-app`. Conteúdo em cartões `bg-raised` (`rounded-card`, padding 20) com gap 12 px; margem lateral 16 px.
- **Cabeçalho** 56 px + `env(safe-area-inset-top)`, `bg-app`, fixo: voltar (44 px, só ícone 24) à esquerda, título `text-title-sub` truncado, indicador de sincronização e ação secundária só ícone 44 à direita. Ao rolar ganha borda inferior 1 px `hairline`.
- **Navegação inferior** 64 px + `env(safe-area-inset-bottom)`, `bg-panel`, borda superior 1 px `hairline`, 3 a 4 itens de largura igual, cada um 48 px mínimo: ícone 24 + rótulo 12/600. Ativo: ícone e rótulo `accent-ink`, pílula 56 × 28 `accent-soft` atrás do ícone. Inativo `fg-2`.
- **Ação principal**: botão `field` (56 px, pílula, largura total) num rodapé fixo `bg-app` com padding 12/16 e área segura; acima da navegação inferior quando ela existir. Uma ação principal por tela. Quando a tela tem o bloco de destaque, a ação principal mora dentro dele (seção 7.2).
- Título da tela `text-title-field` (24/30) no topo do conteúdo, 16 px abaixo do cabeçalho.
- Alvos: ≥ 44 × 44 em tudo, ≥ 52 px de altura nos botões principais (o `field` tem 56). Distância mínima entre alvos 8 px.
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

Anatomia: [ícone 16/18/20/24] + rótulo + [ícone à direita]. **Pílula** (`rounded-pill`), peso 600.

| Tamanho | Altura | Padding x | Gap | Texto | Ícone |
|---|---|---|---|---|---|
| `sm` | 36 (44 em `pointer: coarse`) | 16 | 6 | 14 | 16 |
| `md` (padrão) | 44 | 20 | 8 | 14 | 18 |
| `lg` | 52 | 24 | 8 | 16 | 20 |
| `field` | 56 | 28 | 10 | 16 | 24 |

| Estado | Primário | Secundário | Fantasma | Perigo |
|---|---|---|---|---|
| Padrão | **degradê da marca** (`ds-hero`: 140°, `accent-active` → `accent-hover` → `accent`), `text-on-accent` | `bg-raised` `text-fg` anel 1 px `edge` | transparente, `fg-2` | `bg-danger-solid`, branco |
| Hover | cor lisa `accent-hover` (o degradê some) | `bg-hover` | `bg-hover`, `fg` | `danger-solid-hover` |
| Foco (teclado) | contorno 2 px `ring`, afastado 2 px | idem | idem | idem |
| Pressionado | cor lisa `accent-active`, desce 1 px | `bg-sunken`, desce 1 px | `bg-sunken` | brilho 95% |
| Desabilitado | `bg-sunken` `fg-disabled` (sem degradê) | `bg-raised` `fg-disabled` anel `hairline` | `fg-disabled` | `bg-sunken` `fg-disabled` |
| Carregando | spinner 0,8 s no lugar do ícone, rótulo no gerúndio ("Gerando"), `aria-busy`, sem clique | idem | idem | idem |

Só ícone (`iconOnly`): círculo do tamanho da altura (36, 44, 52, 56), `aria-label` obrigatório, tooltip com o mesmo texto. Largura total (`block`). Um primário por área de ação; ordem: secundário à esquerda, primário à direita (cabeçalho da página: primário primeiro, à esquerda do secundário, como no Painel). Rótulo é verbo + objeto ("Gerar cobrança"). Botões de cabeçalho de página e de bloco usam `lg`; botão de linha e de barra de ferramentas usa `sm`.

### 5.2 Field, Input, Textarea, Select

- **Field**: rótulo 14/600 `fg` (6 px até o controle), "opcional" 12 `fg-3` ao lado quando for o caso (obrigatório não leva asterisco); erro 12/600 `danger-ink` com ícone 14, 6 px abaixo do controle; ajuda 12 `fg-3`, abaixo do erro. Liga `id`, `aria-describedby` e `aria-invalid` sozinho. Rótulo e erro são exceção à regra de não ter texto de apoio; ajuda só quando evita um erro.
- **Input**: **44 px** (`md`) ou **52 px** (`lg`, app de campo, texto 16). `bg-raised`, borda 1 px `strong`, `rounded-control` (12), padding x 12. Prefixo/sufixo `fg-3` com gap 8 ("R$", "unidades", ícone de busca 16). `numeric`: `.tnum` e alinhado à direita. A busca do topo é o mesmo Input com raio de pílula, padding x 16 e `bg-raised`.
- **Textarea**: mínimo 88 px, padding 12 × 10, redimensiona na vertical.
- **Select**: nativo estilizado (motivo: seletor do sistema no celular, acessível sem código, sem portal), seta 18 `fg-3` a 12 px da direita, padding direito 36, `rounded-control`. Altura hoje **40 px** (`md`) e **48 px** (`lg`), menor que a do Input; ver "Perguntas em aberto". Lista com busca usa o Combobox (5.2.1).

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

Gatilho igual ao Select. Popover `bg-overlay` `shadow-overlay` `rounded-card`, largura do gatilho (mín. 240), padding 4. Campo de busca 44 px no topo com ícone 16; lista até 320 px de altura com rolagem; item 36 px (44 em toque), padding x 12, texto 14; hover/ativo por teclado `bg-hover`; selecionado com check 16 `accent-ink` à direita. Vazio: "Nenhum cliente com esse nome" 14 `fg-3`, padding 16. Carregando: 3 linhas de esqueleto.

### 5.3 Checkbox, Radio, Switch

- Caixa e rádio 18 px, borda 1,5 px `strong`, linha clicável inteira com altura mínima 32 px (44 em toque), gap 10 até o rótulo 14 `fg`, descrição 12 `fg-3`.
- Marcado: `bg-accent`, check 14 traço 3 `on-accent` (rádio: ponto 8 px). Indeterminado: traço horizontal.
- Hover: borda `fg-2`. Foco: contorno 2 px `ring` afastado 2. Erro: borda `danger` + mensagem no Field/RadioGroup. Desabilitado: `bg-sunken` borda `edge`, marcado `fg-disabled`, rótulo `fg-disabled`.
- Switch: trilho 36 × 20 pílula, botão 16 branco, deslocamento 16 px em 150 ms. Desligado `bg-strong` (3:1), hover `fg-3`; ligado `bg-accent`, hover `accent-hover`. Desabilitado: trilho `sunken` com contorno `edge`, botão `fg-disabled`. O switch salva na hora; se a ação precisar de confirmação, use caixa + botão.
- RadioGroup usa `fieldset` + `legend` 14/600.

### 5.4 Segmented

Trilho `bg-sunken`, **pílula**, padding 4, gap 2, altura **44** (`md`) ou **36** (`sm`). Opção em pílula: padding x 16 (sm 12), texto 14/600 (sm 12/600), ícone 16 opcional. Ativa: `bg-raised` `fg` com contorno 1 px `edge`. Inativa `fg-2`, hover `bg-hover` `fg`. Foco: contorno 2 `ring` afastado 1. Desabilitada `fg-disabled`. `role="radiogroup"`, setas movem e aplicam. Até 4 opções; mais que isso, Select. `block`: opções dividem a largura (celular). No Painel, `sm` no canto do bloco de receita.

### 5.5 Badge e StatusDot

- **Badge**: pílula 24 px, padding x 8, texto 12/600, ícone 14 opcional. Tons: neutral (`sunken`/`fg-2`), accent, ok, warn, danger, info, idle, sempre `-soft` + `-ink`. Uso: contagem, tipo, situação de cobrança. Não é botão. Na lateral, o contador é um Badge (ativo: accent).
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

`rounded-card` (22), padding 20 px (24 a partir de 640; `padding="sm"` dá 16), sem borda, sem sombra.

| Variante | Fundo | Uso |
|---|---|---|
| `default` | `bg-raised` | Padrão |
| `sunken` | `bg-sunken` | Área dentro do painel: vazio, filtro, rascunho |
| `highlight` | **Degradê da marca** (`ds-hero`, 140°, `accent-active` → `accent-hover` → `accent`); texto `on-accent`, secundário `on-accent-2`; o cartão redefine `--ring` para `on-accent` (a tinta do acento some sobre o acento) | Um por tela, só para o número que ancora a página |

**Cartão de destaque com anéis e foco de luz** (`ds-hero` + `ds-hero-card`, já aplicado pelo `MoneyCard hero`): por cima do degradê, camadas só de desenho, atrás do conteúdo (`z-index: -1`, `isolation: isolate`, `overflow: hidden`):

1. anéis concêntricos com centro fora do cartão, no canto superior direito (108% / -12%): traço de 1,5 px a cada 27,5 px em `--accent-glow` a 22%;
2. brilho do canto (105% / -10%): `--accent-glow` a 46% que some em 48% do raio;
3. foco de luz de 240 px de raio que acompanha o ponteiro (`--mx`, `--my`, posição inicial fora do cartão): `--accent-glow` a 38% que some em 70%.

A base do degradê nunca é mais clara que `--accent`, para o texto branco manter 4,5:1; o brilho é só desenho. As camadas de desenho clareiam o fundo sob o texto em alguns pontos e ficam abaixo de 4,5:1 com o laranja padrão (medido em 13.3; ver "Perguntas em aberto").

CardHeader: título 16/22 600, ação à direita (botão sm ou só ícone), 16 px até o conteúdo, altura mínima 32. A `description` do CardHeader existe no componente, mas **não se usa em tela nova** (regra de texto de apoio). Proibido cartão dentro de cartão, borda lateral colorida e grade de cartões iguais, sem destaque, como estrutura de página.

### 5.7 Stat e StatStrip

Indicador de faixa e de tela de análise. Para o número de dinheiro que abre uma lista (Painel), use o `MoneyCard` (5.11).

- **Stat**: rótulo 14/600 `fg-2` (altura 24) + botão "como é calculado" (ícone Info 16 em alvo 24, 44 em toque; tooltip com a fórmula em frase) · valor `text-kpi` (32) ou `text-kpi-lg` (44) · variação 12: seta 14 + percentual 600 com sinal. O contexto da variação (`deltaLabel`, "em relação a outubro") existe no componente mas fica de fora nas telas novas. Verde (`ok-ink`) quando a variação é boa; para métricas de perda (`deltaInverted`: avaria, atraso, parado) subir é `danger-ink`. Gap 4. Dinheiro usa Money `kpi`. Vazio: "Sem dados no período" 16 `fg-3`, nunca "0" inventado. Carregando: esqueleto 14 × 128, 32 × 192, 12 × 160.
- **StatStrip**: um cartão `bg-raised` com itens lado a lado de largura igual, divisor vertical 1 px `hairline`, padding 20 × 24. Abaixo de 1024: 2 colunas, divisores vertical e horizontal, padding 16. Máximo 4 itens; mais que isso vira tabela. `framed={false}`: sem cartão, linhas `hairline` em cima e embaixo (logip).

### 5.8 Tooltip

Radix. `bg-inverse` `text-on-inverse`, 12/16, padding 8 × 10, `rounded-tip` (10), largura máx. 260, seta 10 × 5, deslocamento 6, atraso 300 ms, entrada 150 ms. É onde mora tudo o que saiu da tela por ser texto de apoio: "como é calculado", origem do número, detalhe de uma fatia. Nunca conteúdo essencial nem ação. `TooltipBody` (gráfico): título 600, linhas com marca 3 × 10 na cor da série, rótulo `on-inverse-2`, valor 600 `.tnum` à direita.

### 5.9 Skeleton

`ds-skeleton`: gradiente `sunken → hover → sunken` em 1,4 s. Linha 14 px raio 4; bloco raio 10; círculo. Mesmo tamanho do conteúdo final. Contêiner com `aria-busy="true"`; esqueleto `aria-hidden`. Spinner só dentro de botão. Depois de 10 s sem resposta, troca pelo estado de erro com "Tentar de novo".

### 5.10 Money

`formatMoney` + `.tnum` + `white-space: nowrap`. Variantes: `inline` (texto corrido), `cell` (bloco alinhado à direita), `kpi` (prefixo "R$" a 0,5em e centavos a 0,6em, os dois com peso 600 e 80% de opacidade, 100% dentro do cartão destaque para manter 4,5:1; o valor completo vai num texto `sr-only` e as partes visuais ficam `aria-hidden`). Negativo: sinal "-" e `danger-ink`. `sign`: "+" em positivos (variação, extra). Total de coluna: 600 ou 700, linha superior 1 px `strong`.

### 5.11 MoneyCard (`src/ui/MoneyCard.tsx`)

Indicador em dinheiro que o dono do produto lê em 2 segundos: título, número grande, seta que abre a lista. Nada além disso.

**Quando usar.** Número de reais que leva a uma lista de itens (alugado hoje, parado, avarias não cobradas, extras não faturados). Quatro por linha no Painel, um deles `hero`. Para variação em série ou comparação lado a lado use `Stat`/`StatStrip`.

**Anatomia** (de cima para baixo, `rounded-card`, padding 20/24, coluna flex, `@container`):
1. Cabeçalho: título (h3, 15/20, 500; 16/24 quando o cartão passa de 250 px; 8 px de respiro no topo) à esquerda; à direita a **seta circular** de 40 × 40 (44 em toque) com `ArrowUpRight` 20 (aparece só se houver `onOpen`).
2. Bloco do número, encostado na base do cartão (`mt-auto`, 20 px de respiro): etiqueta opcional (`tag`) e, abaixo dela, o número. A etiqueta fica acima do número para os números de todos os cartões da linha alinharem pela base.
3. Botão (i) "como é calculado" no canto inferior direito (24 px, `ds-hit`), com a fórmula em tooltip (`formula`).
4. `children` opcional, 16 px abaixo: só desenho (minigráfico, barra de proporção), nunca texto corrido.

**Medidas.** Número `size="lg"` (padrão) 44 px, `clamp(30px, 17.5cqw, 44px)`; `xl` 56 px, `clamp(36px, 15cqw, 56px)` com altura de linha 1,05, para destaque largo; `md` 32 px. Valor passa por `Money kpi`. Etiqueta: pílula 24 px, padding x 8, 12/600, seta 14 (`TrendingUp` ou `TrendingDown`) quando `dir` é dado; uma etiqueta no máximo, variação ou contagem, nunca frase.

| Variante | Fundo e texto | Seta circular | Etiqueta |
|---|---|---|---|
| Padrão | `bg-raised`, `fg` | contorno 1,5 px `fg`; hover: preenche `fg` com ícone `raised` e o ícone gira 45° | `good`: `ok-soft`/`ok-ink`; `good === false`: `danger-soft`/`danger-ink`; sem `good`: `sunken`/`fg-2` |
| Destaque (`hero`) | degradê da marca com anéis e foco de luz (5.6), texto `on-accent` | fundo `on-accent`, ícone `accent-active` | `on-accent` a 20% de fundo, texto `on-accent` |

**Estados.** Hover: seta gira e preenche; (i) aparece (opacidade 0 → 1; em toque fica a 60%, sempre visível). Foco: contorno 2 px `ring` (no destaque, `on-accent`). Sem `onOpen`, não há seta. Número entra com `useCountUp` (5.15). No destaque, o foco de luz segue o ponteiro. Um `hero` por tela.

**Acessibilidade.** Seta com `aria-label` ("Ver alugado hoje" por padrão); (i) com `aria-label` "Como é calculado: título"; número com valor completo em `sr-only`.

### 5.12 PillBars (`src/ui/PillBars.tsx`)

Barras em pílula para **poucas categorias** (até 8, em geral meses): leitura de relance, sem eixo nem grade. Para série longa, muitas séries ou dois eixos use os gráficos de recharts (6.3).

**Anatomia.** Linha de barras alinhadas pela base, com 8 px entre elas (12 a partir de `sm`), e uma linha de rótulos 12 abaixo (8 px de respiro). Cada barra é um botão de largura total do espaço, máximo 64 px, `rounded-pill`, **altura mínima 44 px**, proporcional ao maior valor (`height` padrão 184 px de área; o Painel usa 150). Acima da barra em foco aparece a **etiqueta de valor**: 26 px de altura, `rounded-tip`, `bg-inverse` `text-on-inverse`, 12/600, valor completo em reais; nas outras barras a etiqueta fica transparente e ocupa o mesmo espaço (sem salto de layout).

| Tom | Preenchimento | Uso |
|---|---|---|
| `soft` (padrão) | `accent` a 55% misturado ao `raised` | Períodos anteriores |
| `solid` | `accent` | Período recente de comparação |
| `strong` | `accent-active` | O atual ou o maior |
| `idle` | hachura 135° em `sunken` com anel interno 1 px `edge` | Sem movimento (nunca como enfeite) |

**Estados.** A barra em foco (mouse, foco de teclado ou toque) ganha a etiqueta e `brightness(95%)`, e o rótulo do mês passa a `fg` 600 (os outros `fg-3`). Começa ativa a última barra (ou `defaultActive`). Altura anima em 250 ms. Entrada: crescem de baixo, 600 ms, 40 ms de intervalo (3.9). Foco de teclado: contorno 2 px `ring`, afastado 2.

**Acessibilidade.** `ul` com `aria-label` (resumo), cada barra é botão com `aria-pressed` e `aria-label` "Novembro, até hoje: R$ 48.312,90" (`fullLabel` e valor); a etiqueta e os rótulos visuais são `aria-hidden`. Troque de período recriando o componente (`key`) para a entrada rodar de novo.

**Contraste.** A barra `soft` fica abaixo de 3:1 sobre o cartão (13.2). A informação não depende dela: altura, posição, rótulo e valor completo em foco carregam o dado.

### 5.13 ArcGauge (`src/ui/ArcGauge.tsx`)

Medidor em **meio arco** para uma proporção só (ocupação do estoque). Não é rosca multissérie: no máximo 3 trechos que somam o todo.

**Anatomia.** SVG de 320 × 176 (largura máxima 320, centralizado), arco de raio 124 e espessura 44 com pontas arredondadas, da esquerda para a direita. Os trechos se sobrepõem pelas pontas redondas, e o primeiro é desenhado por cima. Número grande no centro-base: 52/56, 600, -0,035em, `fg`. Legenda curta opcional abaixo do número (`caption`, 12 `accent-ink`); o Painel não usa e põe a legenda por conta própria, fora do componente: pontos de 12 px + rótulo 12 `fg-2` + quantidade 600 `fg`, centralizados, gap 20.

| Tom do trecho | Preenchimento |
|---|---|
| `solid` | `accent` |
| `strong` | `accent-active` |
| `idle` | hachura 45° (traço `idle` de 3,5 px a cada 9 px sobre `sunken`) para o que está parado |

**Estados e entrada.** Arco desenhado em 900 ms uma vez (o trecho hachurado não anima). Sem interação. **Acessibilidade:** `role="img"` com `aria-label` que diz o número e a composição ("Ocupação do estoque: 76%. 128 em campo, 14 em limpeza, 44 parados."). **Contraste:** os trechos coloridos têm 3:1 sobre o cartão no claro; no escuro, `accent-active` e, com marcas escuras, `accent` ficam abaixo disso (13.2); o número e a legenda dizem o mesmo que a cor.

### 5.14 MapaDF (`src/ui/MapaDF.tsx`)

Mapa estilizado do Distrito Federal, em tons neutros; **só rotas e pinos levam cor**. Não é cartografia: serve para ver onde cada equipe e cada parada estão.

**Anatomia.** SVG que preenche o pai (`size-full`, herda o raio, `preserveAspectRatio="xMidYMid slice"`), viewBox de 1000 × 680; recorte padrão `[60, 40, 920, 620]`, ou `box` para aproximar (Painel: `[130, 40, 800, 560]`). Camadas, de baixo para cima: regiões em `--map-land` separadas por linha `--sunken`; parque `--map-park`; lago `--map-water`; avenidas `--map-road`; nomes das regiões opcionais (`labels`, 12 px aproximados, 500, `fg-3`); base da locadora (quadrado `fg` com miolo `raised`); rotas; pinos. Unidade `u` = largura do recorte / 100, e tudo (traço, pino, texto) é proporcional a ela.

| Elemento | Medida | Estados |
|---|---|---|
| Rota | traço `accent` de 0,9u, pontas redondas; cheia = feito, tracejada (1,6u / 1,8u) = previsto | desenhada em 900 ms na entrada; com `selectedId`, as outras ficam a 25% |
| Pino | círculo de 3,1u com anel `raised` de 0,7u e iniciais 2,5u 700; tons `accent` (em andamento), `info` (a caminho), `ok` (concluído), `danger` (atrasado), `neutral` (parada) | `pulse`: anel que cresce 1 → 2,3 e some, 1,8 s em loop, só em deslocamento; selecionado: os outros a 35%; foco de teclado: anel `ring` de 0,5u a 1,5u do pino |

Com `onSelect`, o pino é botão (`tabIndex`, Enter e Espaço); sem, é imagem. `<title>` em cada pino e `aria-label` com a frase completa ("Equipe Wesley: atrasada em Sobradinho"). O grupo tem `aria-label` com o resumo.

**Quando usar.** Onde a pergunta é "onde" (na rua agora, rota do dia, entregas do evento). Dentro de um cartão com padding 8, altura mínima 240 e raio interno 16 (3.6). Cor do pino diz a situação e vem sempre com a frase em `aria-label`; no tema escuro `ok` e `info` são os tons mais escuros de 3.1.

### 5.15 useCountUp (`src/ui/useCountUp.ts`)

Hook que devolve o número animado: `useCountUp(value, duration = 600)`. Sobe de 0 até `value` **uma única vez ao montar**, com saída exponencial (`1 - 2^(-10t)`); se `value` mudar depois, anima a partir do valor atual (não volta a zero). Com `prefers-reduced-motion: reduce` devolve o valor final direto. Use para o número de um indicador de dinheiro ou contagem grande; não use em tabela, em campo de formulário nem em valor que muda a cada segundo. Formate o valor devolvido (`Money kpi` já faz); o leitor de tela recebe o valor final, não os intermediários.

---

## 6. Componentes de padrão (`src/ui`, demonstrados na página)

Mesmo rigor dos de cima. Use só tokens e primitivos de `src/ui`. Demonstração: `src/pages/design-system/sections/DataSection.tsx`, `OverlaySection.tsx`, `ShellSection.tsx`, `PainelSection.tsx`.

### 6.1 Tabela (`DataSection`)

Só onde a tarefa é comparar linhas (princípio 2). Com acabamento: cartão arredondado, status em ponto, dinheiro alinhado.

- Contêiner: cartão `bg-raised`, padding 0, `rounded-card`, `overflow-x: auto` próprio (a página nunca rola na horizontal). Barra acima da tabela (dentro do cartão, padding 16 × 16, borda inferior `hairline`): título 16/650 + contagem `text-caption fg-3` ("128 locações"), busca 44 px (largura 280), filtros (botões secundários sm), ação primária à direita.
- Cabeçalho 36 px, `text-caption` 600 `fg-3`, sem fundo, borda inferior 1 px `hairline`. Ordenável: botão no cabeçalho com seta 14 (ArrowUp/ArrowDown) `fg-2` na coluna ativa; `aria-sort`. Fixo (`sticky`, z 10, `bg-raised`) quando a tabela rola dentro do cartão.
- Linha 48 px (compacta 40), borda inferior 1 px `hairline` (a última sem), sem zebra. Hover `bg-hover`. Selecionada: `bg-accent-soft` + caixa marcada na primeira coluna (coluna de seleção 48 px). Foco de linha (navegação por setas): contorno 2 `ring` interno (`outline-offset: -2px`). Linha clicável abre o detalhe; ações da linha num botão só ícone `MoreHorizontal` 32 px no fim (aparece sempre no toque; no desktop, sempre visível em `fg-3`).
- Células: texto 14 `fg`; secundário na mesma célula em 12 `fg-3` abaixo (linha passa a 56 px). Código (BQ-0142) `.tnum` 600. Dinheiro: `Money cell`, alinhado à direita, cabeçalho também à direita. Datas `dd/mm/aaaa` `.tnum`. Status: StatusDot. Truncar com reticências e `title`; coluna de nome com largura mínima 200.
- Rodapé (52 px, borda superior `hairline`): "1 a 25 de 128" 12 `fg-3` à esquerda; paginação à direita (botões só ícone sm + seletor de página). Totais de coluna numa linha própria acima do rodapé, 600, borda superior 1 px `strong`.
- Estados: carregando = 8 linhas de esqueleto com as larguras das colunas; vazio = estado vazio (6.12) dentro do cartão, altura mínima 240; erro = faixa de aviso `danger` acima da tabela + "Tentar de novo"; sem resultado de filtro = "Nenhuma locação com esses filtros" + botão fantasma "Limpar filtros".
- Abaixo de 768: vira **lista de linhas** dentro do mesmo cartão (não vira cartões soltos): cada item 64 px mínimo, título 14/600 + secundário 12 `fg-3` à esquerda, valor/status à direita, divisor `hairline`.

### 6.2 Linha de serviço (`DataSection`)

Item de lista da agenda e do app de campo. Altura mínima 72 px, padding 12 × 16, divisor `hairline`. Esquerda: horário 14/600 `.tnum` em coluna de 56 px (`fg`), abaixo duração 12 `fg-3`. Centro: tipo + quantidade 14/600 ("Limpeza, 12 unidades"), cliente e endereço 12 `fg-3` truncados, linha de badges (equipe, "Extra"). Direita: StatusDot. Tipo de serviço identificado por ícone 16 (Sparkles limpeza, Truck entrega/retirada, Wrench manutenção, Hammer montagem) em quadrado 32 `bg-sunken` `rounded-tip`, nunca por cor de borda lateral. Hover `bg-hover`; atual (em andamento) com fundo `accent-soft` e horário `accent-ink`. Atrasado: horário `danger-ink` + StatusDot danger. No campo: altura 80, texto 16, toque abre o serviço. Cliente e endereço ficam porque decidem a rota; a lista de ações do Painel (7.1) não tem esse tipo de legenda.

### 6.3 Gráficos (`DataSection`, recharts)

Para série longa, várias séries ou dois eixos. Para poucas categorias (mês a mês) prefira `PillBars` (5.12); para uma proporção, `ArcGauge` (5.13); para "onde", `MapaDF` (5.14).

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

Só quando a tarefa exige interrupção ou foco protegido (confirmar exclusão, cobrança). Fundo `bg-scrim`. Caixa `bg-overlay` `shadow-overlay` `rounded-card`, largura 480 (sm), 640 (md), 800 (lg), máx. 100vw menos 32, altura máx. 100dvh menos 64 com rolagem interna no corpo. Cabeçalho: título `text-title-section` + descrição 14 `fg-2`, padding 24 × 24 × 0, fechar só ícone 36 no canto. Corpo padding 24. Rodapé padding 16 × 24, borda superior `hairline`, botões à direita (secundário "Cancelar", primário com verbo). Destrutivo: primário vira perigo e o rótulo repete o objeto ("Excluir avaria"). Entrada 250 ms (opacidade + escala 0,98 → 1). Foco vai para o primeiro campo, ou para "Cancelar" em destrutivo; Esc fecha; foco volta ao gatilho. Abaixo de 640 vira gaveta inferior (6.8).

### 6.8 Gaveta (`OverlaySection`, vaul / Radix Dialog)

- Lateral direita (escritório): largura 480 (detalhe) ou 640 (formulário longo), altura 100dvh menos 24, a 12 px da borda, `bg-overlay` `shadow-overlay` `rounded-panel` (28). Cabeçalho 64 px (título `text-title-sub`, fechar 44), corpo com rolagem e padding 24, rodapé fixo com ações (como o diálogo). Entrada 250 ms deslizando da direita. Fundo `scrim`.
- Inferior (celular, vaul): largura total, raio 28 só em cima, puxador 36 × 4 `strong` centralizado a 8 px do topo, altura máx. 90dvh, ação principal `field` no rodapé com área segura. Arrastar para baixo fecha; Esc fecha; ao abrir, o foco entra na gaveta e fica preso nela (vaul com `autoFocus`) e volta ao gatilho ao fechar.

### 6.9 Menu (`OverlaySection`, Radix Popover/DropdownMenu)

`bg-overlay` `shadow-overlay` `rounded-card`, padding 4, largura mín. 200. Item 36 px (44 em toque), padding x 12, `rounded-control`, ícone 16 `fg-2` + rótulo 14 + atalho 12 `fg-3` à direita. Hover/foco `bg-hover`. Perigo: texto e ícone `danger-ink`, sempre por último, depois de um divisor 1 px `hairline` (margem 4). Desabilitado `fg-disabled`. Entrada 200 ms (opacidade + 4 px). Escapa do contêiner por portal.

### 6.10 Toast (`OverlaySection`, sonner)

Topo central no escritório, inferior acima da navegação no celular. `bg-inverse` `text-on-inverse`, `rounded-card`, padding 12 × 16, largura 360 (máx. 100vw menos 32), sem sombra extra além de `shadow-overlay`. Ícone 16 de estado em tom claro, porque o fundo é escuro no tema claro (sucesso `#3db876`, erro `#ef5f5a`; no tema escuro, onde o toast é claro, `--ok` e `--danger` do tema claro), texto 14/600 + descrição 12 `on-inverse-2`. Ação à direita: botão texto 14/600 `on-inverse` sublinhado no hover ("Desfazer"). Duração 5 s (8 s com ação), pausa no hover. Uma frase: "Cobrança gerada para a Construtora Planalto".

### 6.11 Faixa de aviso (`OverlaySection`)

Faixa em linha no topo do conteúdo (não flutua). `rounded-card`, padding 12 × 16, fundo `-soft` do tom, ícone 18 `-ink` (Info, TriangleAlert, CircleAlert, CircleCheck), título 14/600 `-ink` + texto 14 `fg` na mesma linha ou abaixo, ação à direita (botão secundário sm; em largura estreita desce para baixo do texto) e fechar só ícone 32 (44 em toque) quando dispensável. Sem borda lateral. Tons: info, warn, danger, ok. Exemplo: "3 mensalidades vencem hoje, R$ 7.420,00 no total. Ver cobranças".

### 6.12 Estado vazio (`OverlaySection`)

Dentro do contêiner que estaria cheio, centralizado, padding 40 × 24, largura do texto máx. 360. Ícone 24 `fg-3` em círculo 48 `bg-sunken`; título 16/650 que diz o que vai aparecer aqui ("As avarias registradas pela equipe aparecem aqui"); texto 14 `fg-2` com o próximo passo; ação primária ou secundária que resolve ("Registrar avaria"). Sem ilustração. Variante "sem resultado de busca": sem ícone de círculo, só texto + "Limpar filtros".

### 6.13 Passo a passo de wizard (`OverlaySection`)

Escritório: barra horizontal acima do formulário, itens com número em círculo 24 (`bg-sunken` `fg-2` 12/600; atual `bg-accent` `on-accent`; concluído `bg-accent-soft` com check 14 `accent-ink`) + rótulo 14 (atual 600 `fg`, outros `fg-2`), ligados por linha 1 px `hairline` (concluída `accent`). Clicar num passo concluído volta a ele. Celular (app de campo): cabeçalho "Passo 2 de 5" 12/600 `fg-3` + título `text-title-field` + barra de progresso 4 px `sunken` com preenchimento `accent` (transição 250 ms). Rodapé: "Voltar" fantasma + "Continuar" primário (`field` no celular). Passo com erro: círculo `danger-soft` com `!`.

### 6.14 Etiqueta "Pacote IA" e Copiloto (`OverlaySection`, `PainelSection`)

- **Etiqueta Pacote IA**: Badge tom `accent` com ícone Sparkles 14 e texto "Pacote IA"; ao lado de recursos que dependem do pacote. Sem gradiente, sem brilho, sem esfera.
- **Cartão do Copiloto (`CopilotCard`)**: no trilho direito ou no fim de uma seção. `Card default` com cabeçalho: ícone Sparkles 16 `accent-ink` + título 16/650 ("Copiloto") + Badge "Pacote IA". Corpo: sugestão em 14 `fg` com o número em destaque 600 ("A BQ-0142 voltou com avaria 3 vezes em 60 dias. Cobrar R$ 420,00 da Construtora Planalto?"). Ações: primário sm com verbo ("Gerar cobrança") + fantasma sm "Dispensar". Carregando: 3 linhas de esqueleto. Não é chat, não tem avatar. O campo `source` ("Com base em 3 retiradas") não se preenche em tela nova: a origem vai em tooltip.
- **Cartão escuro do Copiloto no Painel** (`ds-copilot`): o único bloco escuro da tela, igual nos dois temas: fundo `#14110f`, texto branco, `rounded-card`, padding 20/24, anéis concêntricos centrados no canto inferior direito (115% / 125%, traço 1,5 px a cada 23,5 px, `accent-glow` a 24%) e brilho radial de `accent` a 62% misturado ao fundo; anel de foco branco. Cabeçalho: Sparkles 18 + "Copiloto" 18/24 e a etiqueta "Pacote IA" (pílula `white/15`, 12/600). Corpo: dois números `text-kpi` (32) com o rótulo curto abaixo (14, branco a 75%); no rodapé, um botão pílula branco de 44 com texto `#14110f`. É a variante vitrine; para o Copiloto operacional dentro do trilho, use o `CopilotCard`.

### 6.15 Item da navegação lateral (`ShellSection`)

Altura **44**, `rounded-control` (12), padding x 12, ícone **20** + rótulo 15/20 500 `fg-2`, gap 12; itens a 2 px entre si. Hover `bg-hover` `fg`. **Ativo:** `bg-raised` `fg` 600, ícone `accent-ink` e um **indicador à esquerda**: barra de 4 × 28 `accent`, raio só no lado direito, colada na borda esquerda do painel (fica 12 px fora do item, no padding da lista). Contador à direita: Badge neutral (ativo: accent). Foco: contorno 2 `ring`. **Rótulo de grupo**: caixa alta, 12/16, 500, tracking 0,08em, `fg-3`, padding 12 × 16 × 6 (recolhida, vira um filete de 1 px `hairline`; o rótulo continua para leitor de tela). Recolhida (72): só ícone, item de largura total com padding 14, tooltip à direita com o rótulo (e o contador). Desabilitado (sem permissão): `fg-disabled` + tooltip explicando.

### 6.16 Topo (`ShellSection`)

Ver 4.1. Ordem: título à esquerda, busca ao centro, avisos e usuário à direita. Altura 72. Busca: Input md em pílula (44) com ícone Search 16, placeholder "Buscar cliente, locação ou código", atalho "Ctrl K" em Badge neutral à direita. Avisos: botão circular de 44 (`bg-raised`, ícone Bell 20, hover `bg-hover`) com ponto 8 `danger` (anel 2 `raised`) no canto superior direito quando há não lidos. Usuário: botão em pílula de 48 que abre menu (Perfil, Configurações, Sair), avatar 40 `accent-soft`.

### 6.17 Navegação inferior do celular (`ShellSection`)

Ver 4.2. Itens do app de campo: Hoje, Serviços, Avarias, Perfil. Foco: contorno 2 `ring` afastado -2 no item. Badge numérico 12/600 sobre o ícone (pílula 18, `bg-danger-solid` com texto branco, 5,5:1; `danger` com branco não passa) quando houver pendência.

### 6.18 Botões grandes do app de campo (`ShellSection`)

- Ação principal: Button `field` primário (pílula, 56), largura total, ícone 24.
- Ação de etapa (grade 2 colunas, gap 12): bloco de 96 px de altura, `bg-raised`, `rounded-card`, ícone 24 `accent-ink` em cima + rótulo 16/600 `fg` embaixo, padding 16. Hover/pressionado `bg-hover` / `bg-sunken`. Concluída: ícone CircleCheck `ok`, rótulo + "Feito" 12 `ok-ink`. Desabilitada `fg-disabled`. Foco contorno 2 `ring`.
- Ação de perigo no campo ("Registrar avaria"): Button `field` variante secundário com ícone `danger-ink`; perigo sólido só para excluir.

### 6.19 Faixa "Ambiente de demonstração" (`ShellSection`)

Fixa no topo de tudo (z 95), altura 32, largura total, `bg-inverse` `text-on-inverse`, texto 12/600 centralizado: "Ambiente de demonstração. Dados fictícios." + botão texto "Restaurar dados" 12/600 sublinhado ("restaurar" diz que os dados voltam ao estado de exemplo; "reiniciar" soava como reiniciar o app). Empurra a casca 32 px para baixo (não sobrepõe), publicando a altura em `--demo-strip-h`. No celular: 28 px, só "Demonstração, dados fictícios", sem o botão.

---

## 7. Padrão de tela

As telas `src/modules/painel/index.tsx` e `src/modules/campo/Hoje.tsx` são o modelo. Tela nova segue a composição, troca o conteúdo e mantém as medidas. Em toda tela: um bloco de destaque, título curto em cada bloco, o dado, a ação; nenhuma linha de apoio.

### 7.1 Painel (escritório): `Painel.tsx`

Cabeçalho: H1 `text-title-page` à esquerda; à direita `Nova locação` (primário `lg`, ícone Plus) e `Exportar` (secundário `lg`). Sem subtítulo. 24 px até a primeira linha. Todas as linhas: gap 16, 16 px entre linhas, grade de 12 colunas a partir de 1180 px de quadro.

| Linha | Colunas | Blocos | Regras |
|---|---|---|---|
| 1. Os quatro números | 3 + 3 + 3 + 3 (4 iguais) | Quatro `MoneyCard`; **o primeiro é `hero`** (o número que ancora a página: "Alugado hoje", com etiqueta de variação). Os outros três: parado no depósito, avarias não cobradas, extras não faturados | Todos com `formula` (tooltip) e `onOpen` (seta que leva à lista). Número `lg` 44. Sem frase embaixo do número. Abaixo de 1180: 1 coluna (2 a partir de `sm`) |
| 2. Receita, cobrança, ação | 4 + 3 + 5 | **Receita:** título 18, `Segmented sm` no canto, número `text-kpi` com etiqueta de variação, `PillBars` (150 px; anteriores `soft`, penúltimo `solid`, atual `strong`). **A receber:** título, número `text-kpi`, barra de proporção em pílulas (14 px de altura, gap 4, `flex-grow` proporcional ao valor: em dia `accent`, até 15 dias `warn`, mais de 15 `danger`, tooltip em cada trecho), uma linha "Atrasados" com valor 18/600 `danger-ink`, e o primário `lg block` "Cobrar atrasados" colado na base. **Para fazer hoje:** lista de 4 ações | Item da lista de ações: círculo de 44 com ícone 20 no tom da urgência (`danger-soft`, `warn-soft`, `info-soft`, `sunken`), título `body-lg` 500, valor `body-lg` 600, botão circular de 36 com seta (contorno `edge`, hover preenche `fg`). Sem legenda embaixo do título |
| 3. Rua, estoque, Copiloto | 5 + 4 + 3 | **Na rua agora:** cartão com padding 8, cabeçalho com título 18 e botão `sm` "Operação", `MapaDF` com pinos das equipes e rotas, altura mínima 240, raio interno 16. **Ocupação do estoque:** título, `ArcGauge` com o percentual no centro e legenda de pontos com contagem embaixo. **Copiloto:** cartão escuro `ds-copilot` com dois números e o botão branco "Ver propostas" | O cartão escuro é o único bloco escuro. A cor dos pinos diz a situação (7.3) |

Lateral: dois grupos com rótulo em caixa alta ("Hoje", "Gestão"), Painel de dinheiro ativo, contadores em Badge; rodapé com Configurações, Ajuda e usuário. Topo: título é a data por extenso.

### 7.2 App de campo (celular): `Campo.tsx`

De cima para baixo, em coluna de 390 px, gap 12 entre blocos:

1. **Cabeçalho do app** (56 px, `FieldFrame`): nome da locadora e indicador de sincronização.
2. **Saudação:** H1 `text-title-field` ("Bom dia, Fábio") e uma linha `body-lg fg-2` com o dia e o caminhão, a única linha de contexto da tela.
3. **Bloco de destaque, o próximo serviço** (`ds-hero`, `rounded-card`, padding 20): pílula "Próximo, 10:30" (12/600, fundo `on-accent` a 15%) e distância à direita (12 `on-accent-2`); título 26/32 600 ("Limpeza, 12 unidades"); endereço `body-lg` `on-accent-2` com pino 18; embaixo, uma linha de dois botões de 56: **Iniciar serviço** (pílula branca `bg-on-accent`, texto `accent-active`, ícone Play 22, ocupa o espaço) e o botão circular de rota (fundo `on-accent` a 15%, ícone Navigation 22). É a ação principal da tela, dentro do destaque; a tela não tem barra de ação no rodapé.
4. **Progresso do dia** (cartão `raised`, padding 20): título 18 "Seu dia" e, à direita, "3 de 6 serviços" (o 3 em 18/600); embaixo, **progresso em segmentos**: um segmento por serviço, pílulas de 12 px de altura com gap 6 e mesma largura. Feito: `accent`. Atual: `accent-soft` com anel interno 2 `accent`. Pendente: hachura sobre `sunken`. Grupo com `role="img"` e `aria-label` "3 de 6 serviços concluídos".
5. **Ações em grade:** `FieldActionGrid` de 2 colunas, gap 12, dois `FieldActionTile` de 96 ("Escanear QR", "Registrar avaria").
6. **Lista "Depois deste":** título 18/24 com 24 px acima e 8 abaixo, depois uma lista num cartão `raised` encostado (`overflow-hidden`) com `ServiceRow variant="field"` (80 px, hora, tipo, cliente, status).
7. **Navegação inferior** de 64 px com Hoje (ativo), Serviços, Avarias (contador) e Perfil.

No desktop, a prévia do campo aparece dentro de moldura de celular de 390 × 844 (raio 44, anel de 10 px `inverse`); no celular ocupa a janela.

### 7.3 Como adaptar a outra tela

- Escolha o **número ou o item único** que ancora a tela e dê a ele o degradê (`MoneyCard hero` no escritório, bloco de destaque no campo). Se nada ancora, não há destaque.
- Primeira linha de escritório: números. Segunda: o que se compara no tempo ou se cobra (barras, proporção, lista de ações). Terceira: onde e quanto (mapa, medidor) e o Copiloto.
- Pergunta "onde?" pede mapa; "quanto?" pede número grande; "quantos de quantos?" pede segmentos ou medidor; "o que fazer?" pede lista de ações com valor e seta. Tabela só se o usuário vai comparar linhas.
- Cor de pino e de etiqueta é situação, não decoração: accent em andamento, info a caminho, ok concluído, danger atrasado.
- Cada bloco: título curto (18/24), dado, ação. Se for tentador escrever uma frase embaixo, ela vira tooltip.

---

## 8. Regras de uso da cor

- **Acento** pode aparecer em: botão primário (degradê); um bloco preenchido por tela (degradê do destaque, no escritório e no campo); item ativo de navegação (indicador de 4 × 28 e ícone `accent-ink`); seleção (`accent-soft`); link (`accent-ink`, sublinhado no hover); anel de foco; barras, arco, segmentos de progresso e proporção no gráfico; rota e pino do mapa; brilho do cartão escuro do Copiloto (só anéis e fundo). Em nenhum outro lugar.
- **Um bloco preenchido por tela.** Se a tela tem dois números igualmente importantes, nenhum é destaque: use `StatStrip` ou cartões sem destaque. O cartão escuro do Copiloto não conta como preenchimento de marca e não é segundo destaque: é o único bloco escuro permitido.
- **Estados** nunca usam o acento, mesmo que a marca seja verde (concluído é `ok`, não `accent`).
- **Texto sobre cor**: sobre `accent` e o degradê só `on-accent`/`on-accent-2`; sobre `-soft` só o `-ink` do mesmo tom; sobre `inverse` só `on-inverse(-2)`; sobre o cartão escuro do Copiloto, branco. `--accent-glow` nunca é cor de texto.
- **Cor nunca sozinha**: status tem rótulo, gráfico tem legenda ou valor, erro tem texto, pino tem `aria-label`.
- **Hachura** só em dado "parado / sem uso / pendente".

---

## 9. Tema escuro

Não é o claro invertido: superfícies com leve tinta fria; elevação por tom mais claro (app `#0b0d0f` < painel `#121518` < cartão `#191d21` < flutuante `#21262b`) e contorno de 1 px nos flutuantes (sem sombra); texto principal `#eceef1` (não branco puro); estados mais claros e menos saturados (exceto `ok` e `info`, escurecidos para o texto branco do pino); acento com L + 0,07 (limitado pelo contraste com branco; no laranja padrão fica igual ao claro, porque o claro já está no limite); tinta de acento clara (`L ≥ 0,82`). O degradê do destaque e o cartão do Copiloto são os mesmos nos dois temas. Preferência em `localStorage["r8.theme"]` = `light | dark | system` (padrão `system`), aplicada em `<html data-theme>` por script inline antes da primeira pintura. `color-scheme` e `accent-color` ficam em `.ds-root` para não mudar as telas antigas.

---

## 10. Superfícies do navegador (em `.ds-root`)

Seleção `accent-soft` + `accent-ink`; cursor de texto `accent-ink`; barra de rolagem fina `--scrollbar` (`#c3c8cf` / `#3a4047`) sobre transparente; anel de foco 2 px `ring` afastado 2 px em todo elemento focável; sublinhado com afastamento 3 px e espessura 1 px; números tabulares em tabela, dinheiro, data e código.

---

## 11. Formatos (`src/lib/format.ts`)

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

## 12. Copy

Frases curtas de app de operação. Botão: verbo + objeto ("Gerar cobrança", "Registrar avaria"). Erro: problema + saída ("CNPJ incompleto. Confira os 14 números."). Vocabulário: equipamento, serviço, cobrança, locação, avaria, extra, mensalidade, retirada, limpeza. Dados de exemplo plausíveis ("Construtora Planalto", "R$ 3.184,50", "BQ-0142", "Limpeza, 12 unidades"). Proibido: travessão (— e –), frase de efeito, "Lorem ipsum", números redondos falsos, emoji em interface.

**Sem texto de apoio.** Regra do dono do produto, vale para toda tela e também para esta documentação e o catálogo.

| Sai da tela | Para onde vai |
|---|---|
| Subtítulo de página | Some. O título e o dado bastam |
| Linha explicativa embaixo de número ("Soma da diária de cada equipamento…") | Tooltip do (i) "como é calculado" |
| Legenda embaixo de item de lista | Some, ou vai para a tela de detalhe |
| "Com base em…", fonte da conclusão | Tooltip |
| Contagem repetida ao lado de um valor | Some (a etiqueta de variação ou o rótulo bastam) |
| Descrição no cabeçalho de cartão | Some |

Fica, porque é necessário para usar: rótulo de campo, texto de erro, ajuda que evita um erro, título curto do bloco, rótulo do botão, aria-label e texto de leitor de tela. Um bloco tem título curto, o dado e a ação; se a informação não muda a decisão de quem olha, não entra.

---

## 13. Contraste medido

Script Playwright (`getComputedStyle` das variáveis resolvidas no navegador, fórmula WCAG 2.1) rodado em 11/11/2026 na página `/design-system`, nos dois temas, com o laranja padrão para os neutros e com cada preset para a marca. Texto exige 4,5:1; borda de controle, ponto de status, barra, arco e série de gráfico exigem 3:1. Razões com vírgula decimal.

Resumo do pior caso, pares de neutros e estados (13.1):

| Tema | Pior par de texto (mínimo 4,50) | Pior par de objeto (mínimo 3,00) |
|---|---|---|
| Claro | `--fg-3` sobre `--map-land`: 4,82 | `--viz-3` sobre `--raised`: 3,08 |
| Escuro | `#ffffff` sobre `--info`: 4,56 | `--accent` sobre `--map-land`: 3,55 |

Pior caso da marca, texto (13.2): branco sobre `--accent` e `--on-accent-2` sobre `--accent` ficam em 4,50 a 4,56 (no limite por construção da derivação). Fora do limite estão as barras de gráfico e as camadas de desenho do destaque (13.2 e 13.3).

### 13.1 Neutros e estados

| Texto / objeto | Fundo | Claro (hex) | Razão | Escuro (hex) | Razão | Mínimo |
|---|---|---|---|---|---|---|
| `--fg` | `--app` | `#121417` / `#ebecee` | 15,61 | `#eceef1` / `#0b0d0f` | 16,75 | 4,50 |
| `--fg` | `--panel` | `#121417` / `#f6f6f7` | 17,08 | `#eceef1` / `#121518` | 15,76 | 4,50 |
| `--fg` | `--raised` | `#121417` / `#ffffff` | 18,45 | `#eceef1` / `#191d21` | 14,58 | 4,50 |
| `--fg` | `--sunken` | `#121417` / `#f0f0f2` | 16,21 | `#eceef1` / `#0f1214` | 16,18 | 4,50 |
| `--fg` | `--hover` | `#121417` / `#ededf0` | 15,79 | `#eceef1` / `#22272c` | 12,95 | 4,50 |
| `--fg` | `--overlay` | `#121417` / `#ffffff` | 18,45 | `#eceef1` / `#21262b` | 13,12 | 4,50 |
| `--fg-2` | `--app` | `#454b54` / `#ebecee` | 7,44 | `#b9bfc7` / `#0b0d0f` | 10,51 | 4,50 |
| `--fg-2` | `--panel` | `#454b54` / `#f6f6f7` | 8,14 | `#b9bfc7` / `#121518` | 9,89 | 4,50 |
| `--fg-2` | `--raised` | `#454b54` / `#ffffff` | 8,80 | `#b9bfc7` / `#191d21` | 9,15 | 4,50 |
| `--fg-2` | `--sunken` | `#454b54` / `#f0f0f2` | 7,73 | `#b9bfc7` / `#0f1214` | 10,15 | 4,50 |
| `--fg-2` | `--hover` | `#454b54` / `#ededf0` | 7,53 | `#b9bfc7` / `#22272c` | 8,13 | 4,50 |
| `--fg-2` | `--overlay` | `#454b54` / `#ffffff` | 8,80 | `#b9bfc7` / `#21262b` | 8,24 | 4,50 |
| `--fg-3` | `--app` | `#5c636d` / `#ebecee` | 5,13 | `#9198a2` / `#0b0d0f` | 6,69 | 4,50 |
| `--fg-3` | `--panel` | `#5c636d` / `#f6f6f7` | 5,62 | `#9198a2` / `#121518` | 6,30 | 4,50 |
| `--fg-3` | `--raised` | `#5c636d` / `#ffffff` | 6,07 | `#9198a2` / `#191d21` | 5,82 | 4,50 |
| `--fg-3` | `--sunken` | `#5c636d` / `#f0f0f2` | 5,33 | `#9198a2` / `#0f1214` | 6,46 | 4,50 |
| `--fg-3` | `--hover` | `#5c636d` / `#ededf0` | 5,19 | `#9198a2` / `#22272c` | 5,17 | 4,50 |
| `--fg-3` | `--overlay` | `#5c636d` / `#ffffff` | 6,07 | `#9198a2` / `#21262b` | 5,24 | 4,50 |
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
| `#ffffff` (pino do mapa) | `--ok` | `#ffffff` / `#1b7f48` | 5,03 | `#ffffff` / `#1d8449` | 4,72 | 4,50 |
| `#ffffff` (pino do mapa) | `--info` | `#ffffff` / `#2b6cd9` | 4,94 | `#ffffff` / `#2f72e0` | 4,56 | 4,50 |
| `--fg-3` (nome de região no mapa) | `--map-land` | `#5c636d` / `#e4e5e8` | 4,82 | `#9198a2` / `#1d2126` | 5,56 | 4,50 |
| `--strong` | `--raised` | `#7d848e` / `#ffffff` | 3,77 | `#6c747e` / `#191d21` | 3,58 | 3,00 |
| `--strong` | `--panel` | `#7d848e` / `#f6f6f7` | 3,50 | `#6c747e` / `#121518` | 3,87 | 3,00 |
| `--strong` | `--app` | `#7d848e` / `#ebecee` | 3,19 | `#6c747e` / `#0b0d0f` | 4,11 | 3,00 |
| `--ok` | `--raised` | `#1b7f48` / `#ffffff` | 5,03 | `#1d8449` / `#191d21` | 3,59 | 3,00 |
| `--warn` | `--raised` | `#b97800` / `#ffffff` | 3,65 | `#e0a833` / `#191d21` | 7,92 | 3,00 |
| `--danger` | `--raised` | `#cf2f37` / `#ffffff` | 5,10 | `#ef5f5a` / `#191d21` | 5,21 | 3,00 |
| `--info` | `--raised` | `#2b6cd9` / `#ffffff` | 4,94 | `#2f72e0` / `#191d21` | 3,72 | 3,00 |
| `--idle` | `--raised` | `#8a919b` / `#ffffff` | 3,18 | `#7b838d` / `#191d21` | 4,42 | 3,00 |
| `--viz-1` | `--raised` | `#394cb3` / `#ffffff` | 7,35 | `#6fb1ea` / `#191d21` | 7,39 | 3,00 |
| `--viz-2` | `--raised` | `#c57952` / `#ffffff` | 3,37 | `#f17d29` / `#191d21` | 6,22 | 3,00 |
| `--viz-3` | `--raised` | `#29a493` / `#ffffff` | 3,08 | `#97cb9c` / `#191d21` | 9,15 | 3,00 |
| `--viz-4` | `--raised` | `#93266c` / `#ffffff` | 7,68 | `#be659a` / `#191d21` | 4,45 | 3,00 |
| `--viz-5` | `--raised` | `#9481e1` / `#ffffff` | 3,24 | `#7b85e1` / `#191d21` | 5,07 | 3,00 |
| `--viz-6` | `--raised` | `#685c1c` / `#ffffff` | 6,70 | `#f5c130` / `#191d21` | 10,13 | 3,00 |
| `--accent` (rota e pino no mapa) | `--map-land` | `#d54200` / `#e4e5e8` | 3,62 | `#d54200` / `#1d2126` | 3,55 | 3,00 |

Correção feita nesta rodada: `--ok` e `--info` do tema escuro (3.1). Antes, o pino do mapa (texto branco 12 px sobre `--ok` e `--info`) dava 2,53:1 e 2,73:1.

### 13.2 Marca (5 testes × 2 temas)

Colunas: branco sobre accent, hover e active; `on-accent-2` sobre accent; `accent-ink` sobre `accent-soft`, `raised` e `panel`; anel de foco sobre `app`; accent e accent-active sobre `raised` (barra, arco, segmento; objeto, 3:1); accent sobre `panel` (informativo, o botão é identificado pelo rótulo); barra `soft` do `PillBars` sobre `raised` (objeto, 3:1).

| Marca (hex de entrada) | Tema | `--accent` | branco / accent | branco / hover | branco / active | on-accent-2 / accent | ink / soft | ink / raised | ink / panel | anel / app | accent / raised | active / raised | accent / panel | barra suave / raised |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Laranja (padrão) (`#f04e0a`) | claro | `#d54200` | 4,56 | 5,46 | 6,59 | 4,56 | 6,58 | 7,56 | 7,00 | 6,40 | 4,56 | 6,59 | 4,22 | 2,13 |
| Verde floresta (`#2d6a47`) | claro | `#2d6a47` | 6,43 | 7,81 | 9,51 | 4,64 | 6,06 | 6,83 | 6,32 | 5,78 | 6,43 | 9,51 | 5,96 | 2,51 |
| Azul (`#2557c7`) | claro | `#2557c7` | 6,43 | 7,82 | 9,58 | 4,58 | 6,36 | 7,27 | 6,73 | 6,15 | 6,43 | 9,58 | 5,95 | 2,47 |
| Grafite (`#3b4048`) | claro | `#3b4048` | 10,43 | 12,48 | 14,62 | 6,35 | 9,14 | 10,43 | 9,66 | 8,83 | 10,43 | 14,62 | 9,66 | 3,20 |
| Amarelo claro (teste) (`#f5cf45`) | claro | `#8e7300` | 4,56 | 5,49 | 6,69 | 4,56 | 6,26 | 7,13 | 6,60 | 6,03 | 4,56 | 6,69 | 4,22 | 2,14 |
| Laranja (padrão) (`#f04e0a`) | escuro | `#d54200` | 4,56 | 5,22 | 5,82 | 4,56 | 8,13 | 9,40 | 10,16 | 10,80 | 3,72 | 2,91 | 4,02 | 1,96 |
| Verde floresta (`#2d6a47`) | escuro | `#427f5a` | 4,76 | 5,55 | 6,15 | 4,53 | 8,35 | 10,02 | 10,83 | 11,51 | 3,56 | 2,75 | 3,85 | 1,89 |
| Azul (`#2557c7`) | escuro | `#396ddf` | 4,74 | 5,51 | 6,17 | 4,50 | 8,22 | 9,65 | 10,44 | 11,09 | 3,57 | 2,75 | 3,86 | 1,90 |
| Grafite (`#3b4048`) | escuro | `#4e535b` | 7,74 | 6,65 | 9,96 | 4,96 | 8,20 | 9,67 | 10,45 | 11,10 | 2,19 | 1,70 | 2,37 | 1,48 |
| Amarelo claro (teste) (`#f5cf45`) | escuro | `#8e7300` | 4,56 | 5,24 | 5,84 | 4,56 | 8,22 | 9,71 | 10,50 | 11,16 | 3,71 | 2,90 | 4,02 | 1,96 |

Todos os pares de texto da marca passam (≥ 4,50). Abaixo de 3:1, como objeto: a barra `soft` do `PillBars` em todos os casos (o dado vai também em altura, rótulo e valor em foco); `accent-active` sobre `raised` no tema escuro (arco e barra forte); `accent` sobre `raised` e `panel` no Grafite escuro, o caso já conhecido. Detalhes em "Perguntas em aberto".

### 13.3 Texto sobre o destaque (camadas de desenho)

Medido por composição: branco sobre o acento com a camada de desenho por cima. O mínimo é 4,5:1 (texto de 12 px).

| Marca | Tema | Etiqueta do destaque (branco 20% sobre o acento) | Pílula "Próximo" do campo (branco 15%) | Foco de luz 38% (sobre o acento / sobre o tom do meio) | Anel concêntrico 22% | Brilho do canto 46% |
|---|---|---|---|---|---|---|
| Laranja (padrão) | claro | 3,44 | 3,72 | 3,68 / 4,08 | 4,04 | 3,53 |
| Verde floresta | claro | 4,08 | 4,58 | 5,10 / 5,73 | 5,64 | 4,89 |
| Azul | claro | 4,19 | 4,69 | 5,09 / 5,75 | 5,59 | 4,87 |
| Grafite | claro | 5,77 | 6,64 | 8,36 / 9,32 | 9,19 | 7,98 |
| Amarelo claro (teste) | claro | 3,19 | 3,49 | 3,64 / 4,04 | 4,01 | 3,49 |
| Laranja (padrão) | escuro | 3,44 | 3,72 | 3,68 / 3,99 | 4,04 | 3,53 |
| Verde floresta | escuro | 3,27 | 3,60 | 3,82 / 4,19 | 4,20 | 3,67 |
| Azul | escuro | 3,35 | 3,64 | 3,79 / 4,14 | 4,18 | 3,61 |
| Grafite | escuro | 4,63 | 5,20 | 6,13 / 5,62 | 6,73 | 5,86 |
| Amarelo claro (teste) | escuro | 3,19 | 3,49 | 3,64 / 3,97 | 4,01 | 3,49 |

Com o laranja padrão a derivação deixa o acento em 4,56:1 com branco, e qualquer camada que clareie o fundo derruba isso: a etiqueta do destaque (`on-accent` a 20%), a pílula "Próximo" do campo (15%) e o foco de luz sob o ponteiro ficam entre 3,4 e 4,1. Verde e azul passam em quase tudo no claro. Os anéis de 1,5 px e o brilho do canto ficam longe do texto na maior parte dos tamanhos de cartão.

---

## 14. Proibições

- Rótulo "eyebrow" acima de título (o rótulo de grupo da lateral é a exceção, e é navegação). Numeração de seção (01, 02).
- **Texto de apoio**: subtítulo de página, linha explicativa embaixo de número, legenda embaixo de item de lista, "com base em…", contagem repetida ao lado de valor.
- Cartão dentro de cartão. Quatro indicadores iguais sem nenhum destaque como estrutura de página.
- Texto em gradiente. Glassmorphism. Borda lateral colorida em cartão, item de lista ou aviso (o indicador do item ativo da lateral é parte da navegação e fica).
- Borda e sombra no mesmo elemento. Sombra no tema escuro. Sombra dura sem desfoque.
- Raio de cartão diferente de 22, de painel diferente de 28, de campo diferente de 12. Cartão em pílula.
- Texto abaixo de 12 px. Texto secundário abaixo de 4,5:1. Cinza sobre cor (use a tinta do tom). `--accent-glow` como cor de texto.
- Fonte que não seja Manrope. Inter, Roboto, mono fora de código. Peso abaixo de 400.
- Emoji como ícone. Ícone de outra biblioteca. Traço diferente de 2.
- Hachura como enfeite. Ilustração, memoji, avatar fictício decorativo, imagem promocional.
- Acento em estado (concluído verde-marca), em fundo de seção, em texto corrido sem ser link. Mais de um bloco preenchido por tela.
- Animação de entrada de página, parallax, animação em loop fora do esqueleto, do spinner de botão e do pulso do pino. Animação de dado (número, barra, arco, rota) que repete: roda uma vez ao montar.
- Modal como primeira opção. Spinner no meio do conteúdo.
- Travessão, frase de efeito, "Lorem ipsum", números redondos falsos.
- Tokens antigos (`canvas`, `card`, `ink`, `brand`…) em tela nova.

---

## Perguntas em aberto

1. **Neutros tingidos pela marca?** Mantive neutros frios fixos para combinar com qualquer marca. Se o cliente quiser neutros puxados para a cor dele, dá para derivar em `applyBrand` (croma ≤ 0,01).
2. **Contraste do botão preenchido e dos desenhos de marca com o fundo no escuro.** Com Grafite no escuro, accent sobre painel dá 2,37:1 e sobre o cartão 2,19:1. Nas marcas coloridas, `accent-active` sobre o cartão escuro dá de 2,75 a 2,91:1 (trecho escuro do `ArcGauge`, barra `strong` do `PillBars`). O botão é identificado pelo rótulo (WCAG 1.4.11 não exige) e o gráfico traz valor e legenda, mas pode parecer apagado. O mesmo vale para o trilho do switch ligado (2,37:1 sobre o painel no Grafite): o estado é lido pela posição do botão branco, que dá 7,7:1 com o trilho. Alternativa conservadora, não aplicada: contorno 1 px `edge` no primário e no switch ligado quando accent/painel < 3:1, e `accent` no lugar de `accent-active` no escuro.
3. **Texto sobre o destaque com camadas de desenho.** Com o laranja padrão, a etiqueta do `MoneyCard hero` (3,44:1), a pílula "Próximo" do campo (3,72:1) e o foco de luz sob o ponteiro (3,68:1, 4,08:1 no tom do meio) ficam abaixo de 4,5:1 (13.3). A causa é estrutural: o acento já está no piso de 4,5:1 e o desenho clareia o fundo. Correções possíveis, todas fora de `tokens.css`: fundo da etiqueta e da pílula em `accent-active` (escurece em vez de clarear, passa em todas as marcas) e derivar o acento com folga (5:1) em `brand.ts`; ou reduzir o foco de luz para cerca de 15%. Não apliquei: mexe no visual aprovado.
4. **Barra `soft` do `PillBars` abaixo de 3:1** (1,5 a 3,2:1 sobre o cartão). A leitura não depende da cor (altura, posição, rótulo, valor em foco), mas um tom 70% em vez de 55% resolveria no claro. Mudança de componente.
5. **Altura do Select e do Input.** O Input passou para 44 e 52; o Select continua 40 e 48. Lado a lado num formulário ficam desalinhados. Igualar é mudança de componente.
6. **Corpo do escritório em 14 px** (o piso era 13). Densidade de tabela aceita 13 px se o cliente pedir mais linhas por tela.
7. **Superfícies de referência em `brand.ts`** (`#f5f6f8`, `#e9ebee` no claro) estão com os cinzas antigos; os atuais são `#f6f6f7` e `#ebecee`. Medido: `accent-ink` continua com 6,06:1 ou mais em todos os presets, então não afeta o resultado hoje.
8. **Componentes que ainda aceitam texto de apoio:** `CardHeader.description`, `Stat.deltaLabel`, `CopilotCard.source`. Ficam por compatibilidade com as telas antigas; tela nova não preenche.
