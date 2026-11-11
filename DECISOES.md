# Decisões

Registro curto do que entrou, do que saiu e do que mudou de rumo. Uma entrada por decisão.

## Stack

- **Stack mantida:** Vite 6, React 18, TypeScript, Tailwind v4, Radix, zustand, react-router 6, recharts, motion, sonner, vaul, cmdk, lucide, qrcode.react. Nenhuma troca de framework: o build passa, o deploy na Vercel funciona e tudo o que o produto pede cabe nela.
- **HashRouter trocado por BrowserRouter.** Os links públicos (portal do cliente, QR da unidade) ficam sem `#`. O `vercel.json` já reescreve tudo para `index.html`. Links antigos com `#/` são redirecionados.

- **`@radix-ui/react-dropdown-menu` adicionada.** Menu com navegação por setas, foco preso e leitura de tela corretos; fazer isso à mão sobre o Popover repetiria o que a Radix já resolve.

## Skills e repositórios

- **Impeccable** (github.com/pbakaus/impeccable, Apache 2.0, v4.8.2). Skill de design com regras contra interface genérica e um detector determinístico de antipadrões. README lido antes de usar. Uso: os guias `craft-floor.md` e `operate.md` entram como piso de qualidade da especificação, e `npx impeccable detect <url>` entra na auditoria do QA. Nada dela vai para o bundle. Não substitui nada, soma à revisão visual.

## Design

- **Design system refeito, não ajustado.** O anterior (pílulas, laranja fixo, só tema claro) não comporta tema escuro nem marca configurável. Os tokens novos convivem com os antigos até a última tela antiga ser reescrita; depois os antigos saem.
- **Fonte mantida: Manrope variável.** Passou no teste do Chromium (algarismos tabulares com largura igual, acentos, pesos 400 a 700, legível a 12 px) e já estava instalada; trocar não trazia ganho que pagasse a dependência.
- **Laranja `#f04e0a` como marca padrão**, a pedido do dono do produto (o verde das referências foi reprovado). A derivação escurece o preenchimento até 4,5:1 com texto branco (`#d54200`) e usa um tom vivo (`--accent-glow`) só como desenho de fundo. Presets da demo: laranja, verde `#2d6a47`, azul `#2557c7`, grafite `#3b4048`.
- **Nenhuma biblioteca nova no design system.** `tailwind-merge` (já instalada) ganhou configuração própria em `src/ui/cn.ts` para reconhecer os tamanhos de texto novos.

## Trocas de rumo

- **Direção visual recalibrada para ficar fiel às referências.** A primeira versão seguiu à risca o piso da Impeccable (raio de cartão até 16 px, pílula só em controle pequeno, números contidos) e saiu seca, com cara de painel administrativo genérico. Reprovada na primeira olhada do cliente. Mudou: cartões com raio 22 e painéis 28, botões, busca e segmentado em pílula, botão primário e bloco de destaque em degradê da marca, números de 44 px, navegação lateral com indicador, verde padrão `#2d6a47` (mais vivo). O que ficou da Impeccable: contraste AA, foco, alvos de toque, sem cartão dentro de cartão, sem emoji. Onde a regra dela bate de frente com a referência, vale a referência.
- **Aprovação de design por tela real, não por catálogo.** O dono julgou o Painel de Dinheiro e o app de campo montados com os componentes de `src/ui`; as prévias viraram os módulos `painel` e `campo`. O catálogo `/design-system` continua como referência de quem constrói.
- **Componentes novos:** `MoneyCard` (indicador em dinheiro com seta que abre a lista), `PillBars` (barras em pílula) e `ArcGauge` (medidor em meio arco), todos em SVG/CSS próprios, sem biblioteca.

- **Menos texto, por pedido do dono.** Na revisão do Painel ele marcou as linhas de apoio como poluição visual. Regra do produto desde então (registrada em `CLAUDE.md`): título curto, dado e ação; explicação só em tooltip; nada de tela que seja só texto e tabela.
- **Locadora fictícia na demo.** Sai "R8 Eventos", entra "Cerrado Locações" (nome editável em Configurações, para digitar o nome do cliente em potencial durante a demonstração). O produto em si ainda não tem nome; o portal do cliente não exibe marca nossa.
- **Protótipo antigo removido.** Telas, componentes, mock e tokens do protótipo anterior saíram do repositório depois que os oito módulos novos entraram.

## Arquitetura

- **Telas só leem por `src/services`.** Funções assíncronas com latência e falha simuladas; estado em zustand com persistência em `localStorage`. Detalhe e caminho para back-end em `MOCK-E-BACKEND.md`.
- **Atualização entre telas por contador de versão.** Toda escrita sobe a versão e os ganchos de leitura refazem a busca; dispensou biblioteca de cache.
- **Um módulo por pasta em `src/modules`**, carregado sob demanda, cuidando das próprias sub-rotas. Casca, busca, avisos e tour em `src/app`.
- **Bibliotecas em arquivos separados no build** (`react`, `interface`, `graficos`): o arquivo principal caiu de cerca de 1 MB para cerca de 290 kB.
- **Pesquisa de referências.** O Mobbin exige plano pago e Dribbble/Pinterest não abriram para leitura de imagem na sessão; a pesquisa rendeu padrões descritos em texto (painel em blocos, barra de idade da cobrança, mapa com rota, trilha de etapas em pílulas, cartões com foto), aplicados nas telas. Nenhuma referência visual nova foi vista além das duas imagens do dono.

## QA final (11/11/2026)

- **Avaria registrada no campo fica na locação do serviço.** Antes, avaria feita na entrega (unidade ainda sem locação) caía na última locação antiga da unidade e ia para o cliente errado.
- **Pacote IA desligado esconde a faixa de sugestão da Operação inteira**, não só a etiqueta. O atraso continua visível no mapa e nos cartões.
- **Receita do Painel mostra o último mês fechado** (como já estava); o pagamento de hoje aparece na barra do mês corrente. Mantido: comparar mês aberto com mês fechado engana.
- **Destaque com folga de contraste:** anéis 22% para 14%, brilho do canto 46% para 28%, foco de luz 16% para 10%. Pílulas e avatar sobre o destaque usam `accent-active` (escurece) em vez de branco translúcido (clareia).
- **"Como é calculado" abre no clique/toque** (`Tooltip toggleOnClick`): no celular e no tablet não há hover.
- **Foco volta para quem abriu** diálogos, gavetas, paleta e avisos (`src/ui/returnFocus.ts`), mesmo quando a abertura vem por estado.
- **Fotos de exemplo da semente com rótulo neutro** ("Antes", "Depois"), para não sobrar "limpeza" em outros pacotes.
- **Erro de leitura sem dados mostra só a faixa** no Financeiro e em Avarias (zeros e "nada em aberto" enganavam).
- **Conclusão no campo não grava a avaria duas vezes** quando a conclusão falha depois da avaria salva.

## Fase 2 (11/11/2026)

Revisão do sistema completo pelo dono do produto. Cada decisão tem o que, por quê e a alternativa descartada. Quando algo veio dele, está marcado "Dono"; quando foi escolha nossa para cumprir o que ele pediu, "Interpretação".

### O que o dono disse (resumo das palavras dele, como em `CLAUDE.md`, itens 7 a 14)

- Não pode parecer "gerenciador de estoque". Ele quer cobrar implantação (na casa de R$ 5 mil) mais mensalidade, então o sistema tem que mostrar que trabalha sozinho e gera dinheiro: previsão de caixa e de demanda, lucro por equipamento, preço sugerido e automações de verdade, que ele chama de "a ideia da IA".
- Mapa de verdade de Brasília, não desenho estilizado.
- Sem WhatsApp por enquanto: acha a API difícil e não quer prometer.
- Sem modo TV.
- "Animações fodas": números que rolam, entradas em cascata, transições de tela, caminhões andando no mapa, comemoração quando o dinheiro entra. Sempre respeitando "reduzir movimento".
- App do celular: dizer para quem é (quem vai ao local: motorista, montador, limpador). Rótulo "equipe de rua", não "agente de campo" nem "app de campo".
- Sem risco de calote: nota ou alerta de inadimplência por cliente não entra.
- Visual: manter o estilo claro com laranja aprovado, mais rico: mapa real, gráficos mais elaborados, ilustração dos equipamentos, mais movimento.

### Removido a pedido do dono

- **WhatsApp.** Saiu como integração, canal de envio e prévia de mensagem. Cobranças e avisos saem por e-mail, link de pagamento e portal do cliente (`EmailPreview` mostra o e-mail; a integração "WhatsApp" deixou de existir em Configurações). Alternativa descartada: manter o canal como "em breve". Ele não quer prometer algo cuja API considera difícil. Pode voltar quando houver decisão de produto.
- **Nota e alerta de risco de inadimplência por cliente.** Não existe em nenhuma tela, nem em tooltip. A régua de cobrança e o "A receber por idade" continuam, porque falam de cobrança, não de julgar o cliente.
- **Modo TV.** Descartado, sem substituto.
- **Rótulos "agente de campo" e "app de campo".** Viram "App da equipe de rua", com a frase de para quem é (motorista, montador, limpador). O caminho do código segue `/campo`: é só endereço, não aparece em texto.
- **A regra "sem coreografia" da fase 1 e a proibição de ilustração.** Substituídas pelo movimento da fase 2 (abaixo) e pela ilustração dos equipamentos.

### Decisões de produto

- **Posicionamento: sistema que trabalha sozinho (Dono, item 7).** Duas telas novas no grupo "Crescer" do menu: Inteligência e Automações. O Painel ganhou a linha "Recuperado no mês" e "Feito sozinho hoje", que levam a elas. Alternativa descartada: pôr a inteligência como aba dentro de Relatórios; esconderia justamente o que justifica a mensalidade.
- **Inteligência com números que saem dos dados (Interpretação do pedido).** Caixa previsto de 12 semanas (cobranças emitidas mais mensalidades das locações longas ainda por emitir), lucro e veredito por equipamento (comprar mais, subir preço, manter, baixar preço, vender), preço sugerido por faixa de ocupação e alerta de falta de estoque, comparando a demanda dos próximos 30 dias com as unidades disponíveis (orçamentos pesam 40%). Alternativa descartada: números fixos no mock. Premissas escolhidas por nós, sem validação do dono: faixas de preço de -15% a +12% por ocupação, custo de manter equipamento parado de 1,5% do valor de compra por mês, peso de 40% do orçamento.
- **Automações de verdade (Dono, item 7).** Cada automação tem gatilho, ação e canal; "Rodar agora" executa de verdade o que está pendente nos serviços existentes (cobrar avaria, faturar extra, lembrete da régua, redistribuir rota) e grava cada execução no histórico. Rodar de novo em seguida não repete. Alternativa descartada: tela de regras que só liga e desliga, sem executar nada. Ficaria igual a qualquer lista de configurações e não provaria a "ideia da IA". Minutos poupados por execução são premissa nossa (`MINUTES_SAVED`).
- **Otimização de rotas no navegador (Interpretação).** "Otimizar rotas" reordena só as paradas que ainda não começaram, partindo de onde a equipe está, mostra a rota nova sobre a antiga e só grava quando se clica em Aplicar. No estado inicial economiza 38,8 km, 67 min e R$ 75,06 de diesel no dia (3,2 km por litro e R$ 6,19 o litro, premissas nossas). Alternativa descartada: solver no servidor. A demo não tem servidor e a heurística resolve o tamanho de rota de uma locadora.
- **Calculadora de perdas em `/diagnostico` (Interpretação).** Página pública, para abrir a venda: o dono da locadora mexe nos números dele e vê quanto perde por mês e em quanto tempo a implantação se paga. Premissa de quanto o sistema recupera de cada perda, nossa e sem validação: 30% do parado, 70% das avarias, 70% dos extras, 50% do atraso. Valores iniciais: implantação R$ 5.000,00 (dito pelo dono) e mensalidade R$ 497,00 (nossa). Alternativa descartada: slide de venda. Número que o prospecto digita convence mais que número que mostramos.
- **Posição dos caminhões simulada por relógio.** O "agora" da demo é 10:40 e o relógio dos caminhões corre 15 vezes mais rápido que o real, para o mapa mostrar movimento durante uma apresentação de poucos minutos. Alternativa descartada: posições fixas. Mapa parado não mostra "trabalha sozinho".

### Decisões técnicas

- **Mapa real com MapLibre GL `5` e estilos do OpenFreeMap (Dono, item 8).** `positron` no claro e `dark` no escuro, sem chave de API. Fixamos a versão 5: a 6 separa o worker em arquivo que o Vite não serve. O estilo é baixado e saneado (saem as camadas de escudo de rodovia e as de padrão, que geravam avisos no console). Alternativa descartada: manter o `MapaDF` como padrão (o dono pediu mapa de verdade).
- **Rotas pelas ruas pré-calculadas, sem roteamento em tempo de execução.** Calculadas uma vez com OSRM e embutidas em `src/data/rotas.json` (351 pares: base com cada região e cada par de regiões). Alternativa descartada: chamar o servidor público do OSRM na tela. Ele limita requisições, e uma demo travando na frente do cliente é o pior caso.
- **Mapa de reserva.** Sem WebGL ou sem resposta do servidor de mapa, `MapaReal` cai no `MapaDF` com os mesmos pinos. A tela nunca fica vazia.
- **Movimento centralizado em `src/ui/Motion.tsx` (Dono, item 11).** Números que rolam com `@number-flow/react` (biblioteca nova); cascata em CSS puro (`.ds-stagger`), que não cria elemento e não quebra a grade; transição de tela com `motion` (já instalada); `celebrate` em canvas próprio, sem biblioteca de confete. Tudo respeita "reduzir movimento", e o valor final sempre existe em texto. Regra de uso: roda uma vez, com propósito, e `celebrate` só quando entra dinheiro de verdade. Alternativa descartada: animar tudo. Cansa em uso diário e atrasa o clique.
- **Ilustração própria dos equipamentos, `TypeArt` (Dono, item 13).** Nove desenhos vetoriais numa família (dois tons da marca), que seguem tema e marca sozinhos. Alternativa descartada: usar só a foto do tipo. Foto não acompanha a marca configurável nem o tema escuro e deixa a tela com cara de catálogo; a foto real segue valendo onde existir.
- **Tour com 9 passos.** Entraram Automações e Inteligência; o passo do Painel passou a achar o grupo de indicadores pelo título certo (`h2`); no celular, onde o menu fica numa gaveta fechada, o passo destaca o título da tela em vez de ficar sem alvo.

### Interpretação nossa (não foi dito por ele)

- O tooltip "como é calculado" fica, porque não ocupa a tela. Rótulos de campo e textos de erro ficam, porque são necessários para usar (já registrado em `CLAUDE.md`).
- A calculadora de perdas, a otimização de rotas, as faixas de preço, o peso de orçamento, o custo de manter parado, as taxas de recuperação e a mensalidade de R$ 497,00 são escolhas nossas para dar corpo ao que ele pediu. Ele não viu nem validou esses valores. Conferir com ele antes de apresentar como regra do produto.
- Chamar a tela do menu de "Crescer" e os rótulos "Inteligência" e "Automações" são nossos.
- Que o "Pacote IA" continue como pacote adicional (seção Copiloto) com Otimizar rotas, Preços sugeridos e a Atividade das automações marcados com a etiqueta: manteve-se o que já estava aprovado.

### Limite de pesquisa

Nesta fase repetiu-se o limite da fase 1: o Mobbin exige plano pago, e o Dribbble e o Pinterest não puderam ser abertos daqui. Os padrões novos (mapa com cartões flutuantes, linha do tempo de execuções, cartão de veredito com anel, comparação de rota antes e depois) vieram de busca em texto e das duas imagens de referência do dono. Nenhuma referência visual nova foi vista.
