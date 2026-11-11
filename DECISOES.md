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
