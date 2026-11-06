# R8 Eventos · Design system

Protótipo clicável (100% dados fictícios) do sistema de operação da R8 Eventos, que aluga banheiros químicos, trailers, alambrados, fechamentos, tendas e balcões em Brasília. O protótipo cobre a parte que o Conta Azul não cobre: agenda das equipes, registro de limpeza pelo celular, relatório para o cliente, estoque por data e QR na porta de cada unidade.

A base visual veio do protótipo Vet Domicílio v2 (painel claro, cartões brancos arredondados, navegação em pílulas). O que mudou foi a marca: o destaque verde-limão virou o **laranja da R8**, e o preto continua como cor de ação.

## Telas
- **Painel** (`/`): indicadores do dia, mapa do DF com os serviços de cada equipe, carga do caminhão, próximos serviços, estoque e "Precisa de atenção" (avisos do QR, atrasos, falta de estoque, avisos sem resposta).
- **Agenda** (`/agenda`): semana por equipe, cartões por tipo de serviço, novo serviço.
- **Locações** (`/locacoes`, `/locacoes/:id`): contratos de obra e evento, itens, unidades, plano de limpeza, histórico e relatório do cliente.
- **Equipamentos** (`/equipamentos`): estoque por produto, disponibilidade por data, patrimônio com QR.
- **Regiões** (`/regioes`): demanda por região do DF e escala das equipes.
- **Avisos** (`/avisos`): mensagens de WhatsApp ao cliente e regras automáticas.
- **App da equipe** (`/campo/servico/:id`): chegada, registro em 5 etapas (unidades, checklist, fotos, ocorrências, assinatura) e conclusão.
- **Páginas públicas**: relatório do cliente (`/relatorio/:locacao`) e QR na porta (`/u/:unidade`).

## Tokens (src/index.css)
- **Superfícies:** `canvas`, `surface`, `card` (branco), `muted`, `muted-2`, `line`, `line-2`.
- **Texto:** `ink`, `ink-2`, `ink-3`, `ink-4`.
- **Ação:** `black` (botão principal, pílula ativa, dock) e `brand` (laranja R8 `#ee6a1c`, destaque e "agora"). Sobre `bg-brand` o texto é branco. `brand-soft` com `brand-ink` para fundos claros.
- **Tipos de serviço** (`--color-s-*`, ver `JOB_TYPE` em `src/lib/status.ts`): Montagem azul, Limpeza teal, Retirada violeta, Manutenção amarelo.
- **Regiões do DF** (`--color-z-*`): Plano, Lagos, Guará, Oeste, Sul, Norte. Os hex estão em `src/data/geo.ts`.
- **Status:** `green` (concluído), `brand` (em andamento), `blue` (a caminho), `red` (atraso, falta), `yellow` (atenção).
- **Raios:** cartões 20 a 24px, painéis 28px, controles `rounded-full`.
- **Sombras:** `shadow-card`, `shadow-pill`, `shadow-float`. Nada de bordas escuras.

## Tipografia
- Uma família: **Manrope**, pesos 500 a 800.
- Títulos de página 28 a 32px peso 700; cartões 16 a 18px peso 700; texto 13 a 14px peso 500. Números com `num`.
- **Proibido:** serifas, mono, caixa alta com tracking, labels de terminal.

## Copy, para não ter cara de IA
- Português simples, como app de operação: "Serviços de hoje", "Carga do caminhão", "Ver tudo", "Novo serviço".
- **Proibido:** travessão (— e –), frases de efeito, explicações longas, emoji fora de mensagens de WhatsApp, assistente com esfera ou qualquer elemento que pareça chatbot.

## Dados e estado
- `src/data/mock.ts`: empresa, equipes, produtos, clientes, locações, unidades com patrimônio, serviços, ocorrências, avisos, estoque por dia.
- `src/store.ts`: estado da demonstração (status dos serviços, relatórios salvos pelo app, fotos, ocorrências, avisos). Persistido no navegador; "Reiniciar demonstração" no ícone de engrenagem.
- `src/lib/history.ts`: checklists por tipo e registro dos serviços já concluídos, usado pela ficha, relatório e QR.
- Fotos dos produtos em `public/produtos/` (recortes das fotos da própria R8).
