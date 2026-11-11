# O que é simulado e como ligar a um back-end real

Tudo o que a interface mostra passa por `src/services`. As telas nunca leem os dados direto. Para ligar um back-end, cada arquivo de serviço troca a leitura do estado local por uma chamada HTTP, mantendo as mesmas assinaturas; as telas não mudam.

## Como a simulação funciona hoje

- **Dados:** gerados por `src/data/seed.ts` com semente fixa (sempre iguais) e guardados no navegador (`localStorage`, chave `locadora.db.v1`). "Restaurar dados" volta ao estado inicial.
- **Rede:** cada função espera de 200 a 600 ms e pode falhar de propósito (`src/services/config.ts`), para a interface mostrar carregamento e erro.
- **Relógio da demonstração:** o "agora" é sempre 10:40 de hoje, para a agenda ficar coerente. Os caminhões do mapa usam um relógio simulado que corre 15 vezes mais rápido (`FLEET_TIME_SCALE`) e se atualiza a cada 2 s na Operação e a cada 3 s no Painel.
- **Cálculos no navegador:** previsões, vereditos, preços sugeridos e a otimização de rotas rodam sobre os dados locais. Em produção viram consultas e jobs no servidor (tabela abaixo).
- **Atualização das telas:** toda escrita sobe um contador; quem está lendo refaz a busca (`src/services/hooks.ts`). Com back-end, o mesmo gancho passa a invalidar por resposta do servidor ou por evento em tempo real.

## Serviço por serviço

| Serviço (`src/services/`) | Hoje | Com back-end real |
|---|---|---|
| `painel.ts` | Soma os indicadores a partir das coleções locais, inclusive o recuperado no mês e as execuções de automação do dia. | `GET /painel` calculado no servidor (consultas agregadas ou visão materializada). |
| `locacoes.ts` | Lista, cria, confirma, assina e avança locações no estado local; disponibilidade por contagem. | `GET/POST /locacoes`, `POST /locacoes/:id/confirmar`; disponibilidade com trava no banco para evitar reserva dupla. |
| `operacao.ts` | Agenda e status em memória. **Posição dos caminhões simulada por relógio:** `getFleetPositions` calcula onde cada equipe estaria agora (sai da base, anda até a parada, fica no local, volta), com o relógio da demo 15 vezes mais rápido que o real. **Rotas otimizadas no navegador:** `getRouteDistances` mede os quilômetros que faltam por equipe; `optimizeRoutes` reordena só as paradas que ainda não começaram (heurística de menor percurso, partindo de onde a equipe está) e devolve a economia em km, minutos e diesel (3,2 km por litro, R$ 6,19 o litro) sem gravar; `applyOptimizedRoutes` grava a nova ordem, refaz os horários e registra a execução no histórico de automações. Distâncias pelas ruas vêm de `src/data/rotas.json`. | `GET /servicos?data=`, `PATCH /servicos/:id`. Posição por GPS do app da equipe de rua, enviada por WebSocket ou notificação. Otimização por serviço de roteamento (próprio ou contratado) no servidor, com janela de horário, capacidade e trânsito, e `POST /rotas/otimizar` para a proposta e `POST /rotas/aplicar` para gravar. |
| `inteligencia.ts` | Tudo calculado no navegador sobre os dados locais, em funções puras `calc*` (testáveis) e envelopes `get*`: caixa previsto de 12 semanas e totais de 30, 60 e 90 dias (`getCashForecast`); lucro e veredito por equipamento, com custo de manter parado de 1,5% do valor de compra por mês (`getAssetProfitability`); preço sugerido por faixa de ocupação e `applyPriceSuggestion` (`getPriceSuggestions`); previsão de demanda de 30 dias contra o estoque, orçamentos a 40% (`getDemandForecast`); dinheiro recuperado no mês (`getRecoveredMoney`); resumo da tela (`getIntelligenceSummary`); calculadora de perdas da venda (`diagnoseLosses`, com taxas de recuperação em `RECOVERY_RATE`). | Consultas agregadas e visões materializadas no servidor (`GET /inteligencia/caixa`, `/equipamentos`, `/precos`, `/demanda`), recalculadas por agendador. Modelo de previsão treinado com o histórico real da locadora no lugar das regras fixas. `POST /precos/:tipo/aplicar` grava o preço novo. A calculadora segue no navegador: não depende de dados do cliente. |
| `automacoes.ts` | Catálogo de gatilhos, ações e canais em `src/domain/automations.ts`; nove automações de fábrica (oito ligadas). `runAutomationsNow` ("Rodar agora") **executa de verdade** o que está pendente chamando os outros serviços (`chargeDamage` e `sendCharge`, `billExtras`, `sendReminder`, `applyReroute`), e cada execução entra no histórico com texto, valor e minutos poupados. `simulateNextRun` faz o mesmo uma pendência por vez, para o modo "Ao vivo". Estatísticas dos últimos 30 dias derivadas do histórico. Sem agendador: nada roda sozinho com a tela fechada. | **Agendador e fila no servidor:** os gatilhos viram eventos (avaria registrada, cobrança vencida, fim do mês) e jobs agendados; cada ação roda numa fila com nova tentativa e registro idempotente. E-mail transacional para as ações de cobrança e aviso. Histórico persistido, com `GET /automacoes/execucoes` e atualização em tempo real para a tela "Ao vivo". |
| `equipamentos.ts` | Unidades, histórico e calendário derivados das locações locais. | `GET /unidades`, `GET /unidades/:codigo`; calendário por consulta de períodos. |
| `avarias.ts` | Registra avaria e cria a cobrança ligada. | `POST /avarias` com envio da foto para armazenamento de arquivos; `POST /avarias/:id/cobrar`. |
| `financeiro.ts` | Cobranças, lembretes e régua no estado local; Pix e boleto com códigos fictícios; CSV montado no navegador. | Provedor de pagamento (Pix e boleto reais, com aviso de pagamento por webhook); régua executada por agendador no servidor; exportação pelo servidor. |
| `clientes.ts` | Cadastro e totais calculados localmente. | `GET/POST/PATCH /clientes`. |
| `portal.ts` | Lê o mesmo estado local pelo token do cliente; "Já paguei" marca como paga. | Rota pública com token assinado e somente leitura; pagamento confirmado pelo provedor, não pelo cliente. |
| `relatorios.ts` | Agregações em memória. | Consultas agregadas no servidor; PDF gerado no servidor. |
| `configuracoes.ts` | Empresa, marca, usuários, pacote e integrações no estado local; "Entrar como" troca o usuário sem senha. | `GET/PATCH /configuracoes`; login real com permissões por papel aplicadas no servidor; logo em armazenamento de arquivos. |
| `copiloto.ts` | Propostas e mensagens geradas por regras e modelos de texto a partir dos dados. | Mesmas regras no servidor para as propostas; modelo de linguagem só para redigir as mensagens, sempre com aprovação humana antes do envio. |
| `busca.ts` | Filtro em memória. | `GET /busca?q=` com índice de texto. |
| `avisos.ts` | Lista local de avisos. | Notificações persistidas e entregues em tempo real. |

## Integrações (todas simuladas)

| Integração | Hoje | Real |
|---|---|---|
| E-mail transacional | Só a pré-visualização do e-mail (`EmailPreview`); "enviar" marca como enviado, e o link de pagamento abre o portal do cliente. É o único canal de envio do produto, junto com o link de pagamento e o portal. As automações de cobrança usam o mesmo caminho. | Provedor de e-mail transacional (Amazon SES, SendGrid ou similar), com domínio da locadora autenticado e modelos de e-mail; as automações enfileiram o envio no servidor. |
| Pix e boleto | QR e linha digitável fictícios. | Banco ou provedor de pagamento, com conciliação automática. |
| NFS-e | Estado "conectado". | Emissor da prefeitura ou serviço de emissão. |
| Conta Azul | "Sincronizar" simula o envio. | API do Conta Azul: lançamentos e clientes. |
| Contrato e assinatura | Texto gerado no navegador; assinatura desenhada na tela. | Geração de PDF no servidor e assinatura eletrônica com validade jurídica. |
| Fotos da equipe de rua | Miniaturas no navegador e fotos de exemplo. | Envio para armazenamento de arquivos, com fila sem sinal no aparelho. |
| QR dos equipamentos | Aponta para `/u/<código>` neste mesmo site. | Mesmo endereço, em domínio da locadora. |
| Mapa | Mapa real de Brasília (MapLibre GL com estilos do OpenFreeMap) e rotas pelas ruas pré-calculadas uma vez com OSRM e embutidas em `src/data/rotas.json` (351 pares de regiões); sem consulta de rota em tempo de execução. Endereço vira ponto pela região mais próxima. Sem WebGL ou sem o servidor de mapa, cai no desenho estilizado `MapaDF`. | Geocodificação do endereço do cliente, roteamento próprio ou contratado (as rotas deixam de ser tabela), posição do caminhão por GPS do app da equipe de rua, e servidor de mapas contratado ou próprio no lugar do OpenFreeMap público. |
