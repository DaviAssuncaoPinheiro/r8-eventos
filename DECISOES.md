# Decisões

Registro curto do que entrou, do que saiu e do que mudou de rumo. Uma entrada por decisão.

## Stack

- **Stack mantida:** Vite 6, React 18, TypeScript, Tailwind v4, Radix, zustand, react-router 6, recharts, motion, sonner, vaul, cmdk, lucide, qrcode.react. Nenhuma troca de framework: o build passa, o deploy na Vercel funciona e tudo o que o produto pede cabe nela.
- **HashRouter trocado por BrowserRouter.** Os links públicos (portal do cliente, QR da unidade) ficam sem `#`. O `vercel.json` já reescreve tudo para `index.html`. Links antigos com `#/` são redirecionados.

## Skills e repositórios

- **Impeccable** (github.com/pbakaus/impeccable, Apache 2.0, v4.8.2). Skill de design com regras contra interface genérica e um detector determinístico de antipadrões. README lido antes de usar. Uso: os guias `craft-floor.md` e `operate.md` entram como piso de qualidade da especificação, e `npx impeccable detect <url>` entra na auditoria do QA. Nada dela vai para o bundle. Não substitui nada, soma à revisão visual.

## Design

- **Design system refeito, não ajustado.** O anterior (pílulas, laranja fixo, só tema claro) não comporta tema escuro nem marca configurável. Os tokens novos convivem com os antigos até a última tela antiga ser reescrita; depois os antigos saem.
