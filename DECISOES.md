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
- **Verde floresta `#275b3e` como marca padrão.** Presets da demo: verde, laranja R8 `#ee6a1c`, azul `#2557c7`, grafite `#3b4048`. A cor do cliente é derivada em OKLCH com contraste garantido (`src/lib/brand.ts`).
- **Nenhuma biblioteca nova no design system.** `tailwind-merge` (já instalada) ganhou configuração própria em `src/ui/cn.ts` para reconhecer os tamanhos de texto novos.

## Trocas de rumo

- **Direção visual recalibrada para ficar fiel às referências.** A primeira versão seguiu à risca o piso da Impeccable (raio de cartão até 16 px, pílula só em controle pequeno, números contidos) e saiu seca, com cara de painel administrativo genérico. Reprovada na primeira olhada do cliente. Mudou: cartões com raio 22 e painéis 28, botões, busca e segmentado em pílula, botão primário e bloco de destaque em degradê da marca, números de 44 px, navegação lateral com indicador, verde padrão `#2d6a47` (mais vivo). O que ficou da Impeccable: contraste AA, foco, alvos de toque, sem cartão dentro de cartão, sem emoji. Onde a regra dela bate de frente com a referência, vale a referência.
- **Aprovação de design por tela real, não por catálogo.** `/previa/painel` (Painel de Dinheiro) e `/previa/campo` (app de campo) usam os componentes de `src/ui` com dados fixos. O catálogo `/design-system` continua existindo como referência de quem constrói.
- **Componentes novos:** `MoneyCard` (indicador em dinheiro com seta que abre a lista), `PillBars` (barras em pílula) e `ArcGauge` (medidor em meio arco), todos em SVG/CSS próprios, sem biblioteca.
