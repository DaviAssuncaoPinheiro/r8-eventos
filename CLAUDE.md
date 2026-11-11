# Sistema de operação para locadoras (demo de venda)

Front-end completo com dados simulados. Stack: Vite, React 18, TypeScript, Tailwind v4, Radix, zustand, react-router 6.
Especificação visual em `DESIGN.md`. Decisões em `DECISOES.md`. Componentes em `src/ui`, tokens em `src/styles/tokens.css`.

## Preferências do dono do produto (valem para toda tela, sempre)

Registradas em 11/11/2026, a partir da revisão dele da primeira prévia do Painel de Dinheiro.

1. **Simples e direto. Sem poluição visual.** Ele reprovou textos de apoio e complementares: linha explicativa embaixo de número, subtítulo de página, legenda embaixo de item de lista, "com base em…", contagem repetida ao lado de valor. Regra prática: cada bloco mostra título curto, o dado e a ação. Se uma informação não muda a decisão de quem olha, sai da tela (vai para tooltip ou para a tela de detalhe).
2. **Nada de tela que é só texto e tabela.** Ele quer visual forte: números grandes, gráficos, mapa, fotos dos equipamentos, medidores, avatares. Tabela só onde a tarefa é mesmo comparar linhas, e mesmo assim com acabamento.
3. **Cor padrão laranja.** Ele não gostou do verde. A cor da marca continua configurável, mas a demo abre em laranja.
4. **Bater o olho e entender.** Em 2 segundos tem que ficar claro que é um sistema de locadora (equipamentos, entregas, cobranças) e o que aquela tela faz.
5. **Acabamento de produto premium.** Ele pediu "algo insano de bonito", com "toque especial", no nível das melhores referências de Dribbble e Pinterest. Cartões bem arredondados, pílulas, degradê da marca no destaque, microinterações. Nada com cara de template ou de painel administrativo genérico.
6. **Estilo de trabalho:** ele quer execução. Decidir e seguir, sem pedir confirmação para o que dá para decidir.

Acrescentadas em 11/11/2026, na revisão do sistema completo (palavras dele, resumidas):

7. **Não pode parecer "gerenciador de estoque".** Ele quer cobrar implantação (na casa de R$ 5 mil) mais mensalidade. O sistema precisa mostrar que trabalha sozinho e gera dinheiro: inteligência (previsão, lucro por equipamento, preço sugerido, risco de calote) e automações de verdade, que é "a ideia da IA".
8. **Mapa real.** Mapa de verdade de Brasília, não desenho estilizado.
9. **Sem integração com WhatsApp por enquanto.** Ele acha a API difícil e não quer prometer. Cobranças e avisos saem por e-mail, link de pagamento e portal do cliente. Não exibir WhatsApp como integração, canal de envio nem prévia de mensagem.
10. **Sem modo TV.**
11. **Animações.** Ele pediu "animações fodas": números que rolam, entradas em cascata, transições de tela, caminhões andando no mapa, comemoração quando o dinheiro entra. Sempre respeitando "reduzir movimento".
12. **App do celular: dizer para quem é.** É para quem vai ao local (motorista, montador, limpador). Não usar "agente de campo" nem "app de campo" como rótulo; usar "equipe de rua" e deixar explícito que é para quem vai ao local.
13. **Visual:** manter o estilo claro com laranja aprovado, porém mais rico (mapa real, gráficos mais elaborados, ilustração dos equipamentos, mais movimento).

Interpretação minha (não foi dito por ele): tooltip "como é calculado" pode ficar, porque não ocupa a tela; rótulos de campo de formulário e textos de erro ficam, porque são necessários para usar.

## Regras de construção

- Telas leem dados só por `src/services` (nunca do mock direto).
- Só tokens de `src/styles/tokens.css`; nenhuma cor solta no JSX.
- Texto em português do Brasil, vocabulário de locadora: equipamento, serviço, cobrança, locação, avaria. Sem travessão, sem emoji, sem "Lorem ipsum".
- Dinheiro `R$ 12.480,00`, datas `dd/mm/aaaa` (`src/lib/format.ts`).
- Acessibilidade AA, foco visível, alvos de toque de 44 px no celular.
