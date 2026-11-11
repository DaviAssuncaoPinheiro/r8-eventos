# O que é simulado e como ligar a um back-end real

Tudo o que a interface mostra passa por `src/services`. As telas nunca leem os dados direto. Para ligar um back-end, cada arquivo de serviço troca a leitura do estado local por uma chamada HTTP, mantendo as mesmas assinaturas; as telas não mudam.

## Como a simulação funciona hoje

- **Dados:** gerados por `src/data/seed.ts` com semente fixa (sempre iguais) e guardados no navegador (`localStorage`, chave `locadora.db.v1`). "Restaurar dados" volta ao estado inicial.
- **Rede:** cada função espera de 200 a 600 ms e pode falhar de propósito (`src/services/config.ts`), para a interface mostrar carregamento e erro.
- **Atualização das telas:** toda escrita sobe um contador; quem está lendo refaz a busca (`src/services/hooks.ts`). Com back-end, o mesmo gancho passa a invalidar por resposta do servidor ou por evento em tempo real.

## Serviço por serviço

| Serviço (`src/services/`) | Hoje | Com back-end real |
|---|---|---|
| `painel.ts` | Soma os indicadores a partir das coleções locais. | `GET /painel` calculado no servidor (consultas agregadas ou visão materializada). |
| `locacoes.ts` | Lista, cria, confirma, assina e avança locações no estado local; disponibilidade por contagem. | `GET/POST /locacoes`, `POST /locacoes/:id/confirmar`; disponibilidade com trava no banco para evitar reserva dupla. |
| `operacao.ts` | Agenda e status em memória; "ao vivo" por temporizador. | `GET /servicos?data=`, `PATCH /servicos/:id`; posição e status por WebSocket ou notificação do app da equipe de rua. |
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
| E-mail transacional | Só a pré-visualização do e-mail; "enviar" marca como enviado, e o link de pagamento abre o portal do cliente. | Provedor de e-mail transacional (Amazon SES, SendGrid ou similar), com domínio da locadora autenticado e modelos de e-mail. |
| Pix e boleto | QR e linha digitável fictícios. | Banco ou provedor de pagamento, com conciliação automática. |
| NFS-e | Estado "conectado". | Emissor da prefeitura ou serviço de emissão. |
| Conta Azul | "Sincronizar" simula o envio. | API do Conta Azul: lançamentos e clientes. |
| Contrato e assinatura | Texto gerado no navegador; assinatura desenhada na tela. | Geração de PDF no servidor e assinatura eletrônica com validade jurídica. |
| Fotos da equipe de rua | Miniaturas no navegador e fotos de exemplo. | Envio para armazenamento de arquivos, com fila sem sinal no aparelho. |
| QR dos equipamentos | Aponta para `/u/<código>` neste mesmo site. | Mesmo endereço, em domínio da locadora. |
| Mapa | Desenho estilizado do DF, posições por bairro. | Mapa real com geocodificação e posição do caminhão. |
