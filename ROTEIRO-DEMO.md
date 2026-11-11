# Roteiro de demonstração (6 a 7 minutos)

Para mostrar a um dono ou gerente de locadora. A venda é implantação mais mensalidade, então a ordem é a do dinheiro: primeiro quanto ele perde, depois o sistema recuperando sozinho, por último o que prende o cliente dele e o preço.

Antes de começar:

1. Abra o sistema e clique em **Restaurar dados** na faixa do topo (volta ao estado inicial).
2. Deixe uma aba aberta em `/diagnostico` e outra em `/campo` no celular, ou em janela estreita.
3. Use o navegador em tela cheia (o mapa precisa de espaço) e com a internet ligada (o mapa carrega do servidor aberto de mapas; sem ele aparece o mapa de reserva).
4. O tour guiado (9 passos) abre sozinho na primeira visita ao escritório. Clique em **Pular** para ir direto ao roteiro. **Ajuda**, no menu lateral, refaz o tour quando quiser.

Os valores abaixo são os do estado inicial, conferidos na tela. Ao longo do roteiro eles mudam, de propósito: cobrar, otimizar e rodar as automações faz os totais subirem. Se um número não bater, veja se um passo anterior já mexeu nele.

| Tempo | Tela | O que clicar | O que falar |
|---|---|---|---|
| 0:00 | **Calculadora de perdas** (`/diagnostico`) | Nada. Deixe ele olhar o número. Depois mude **Quantidade de equipamentos** e **Faturamento por mês** para os dele. | "Antes de mostrar o sistema: quanto uma locadora do seu tamanho perde por mês sem perceber? Aqui, **R$ 23.456,24 por mês**, **R$ 281.474,88 por ano**. A maior parte é equipamento parado, depois atraso no pagamento, avaria que ninguém cobra e extra que sai sem fatura. Ajuste para o seu caso." Mostre o cartão verde: "O sistema recupera **R$ 9.162,06 por mês** e a implantação se paga em **0,6 meses**." Clique **Ver o sistema funcionando**. |
| 1:00 | **Painel de dinheiro** (`/`) | Nada. Deixe ele olhar. Passe o mouse no cartão laranja. | "Esta é a primeira tela do dia. **R$ 72.624,90 rendendo hoje** e **R$ 28.824,00 parados no depósito**. R$ 3.133,50 de avarias que ninguém cobrou e R$ 457,90 de serviço extra sem faturar." Aponte **Para fazer hoje**: "O sistema já separou o que recupera dinheiro hoje: alugar 24 unidades paradas, cobrar 6 faturas atrasadas, 7 avarias, 5 extras." Aponte **Recuperado no mês** (R$ 6.083,43) e **Feito sozinho hoje** (10): "Isto é o que ele fez sem ninguém pedir." |
| 1:45 | **Operação do dia** (`/operacao`) | Mostre os caminhões andando no mapa. Clique em um caminhão. Depois **Otimizar rotas**. | "Mapa real de Brasília. Cada caminhão está onde está agora, andando pelas ruas. Duas equipes estão atrasadas." Ao abrir a comparação: "Reorganizando a ordem das paradas, o sistema economiza **38,8 km, 67 minutos e R$ 75,06 de diesel só hoje**. A Equipe Wesley sozinha, 16,2 km a menos." Clique **Aplicar**: o confete sai e as duas equipes atrasadas somem do resumo (0 atrasadas). |
| 2:50 | **App da equipe de rua** (`/campo`, no celular) | Na Equipe Fábio: **Continuar serviço**, **Marcar tudo**, **Continuar**, **Usar foto de exemplo**, **Continuar**, **Não** na avaria, **Continuar**, preencha nome e cargo, assine na tela e **Concluir serviço**. | "Este é o app para quem vai ao local: motorista, montador, limpador. Quatro passos: o que foi feito, fotos, avaria, assinatura de quem recebeu. Funciona mesmo sem sinal. Acabou a discussão de 'vocês não vieram limpar'." |
| 3:35 | **Avarias e cobranças** | No Painel, **Cobrar 7 avarias**. No primeiro cartão (TND-0040, lona rasgada, R$ 1.386,40) clique **Cobrar**. Depois **Enviar cobrança** e **Marcar como paga**. | "A foto veio do app. Um clique e a cobrança está pronta: o e-mail já vem escrito, com link de pagamento e Pix, e o cliente vê a fatura no portal dele." Mostre o e-mail na gaveta. Ao marcar como paga: "Entrou dinheiro." (confete). Volte ao Painel: "Avarias não cobradas caiu de R$ 3.133,50 para R$ 1.747,10. O painel soma sozinho." |
| 4:25 | **Automações** (`/automacoes`) | Mostre os cartões com gatilho e ação. Clique em **Rodar agora**. | "Aqui está o que o sistema faz sem você: cobra avaria, fatura extra, manda lembrete de atraso, redistribui rota, propõe renovação. Cada cartão é um gatilho e uma ação." Clique **Rodar agora**: "Tem ações esperando. Ele executa de verdade, com e-mail, cobrança e rota." Os números sobem na tela: **Feito sozinho hoje** e **Cobrado em 30 dias** (R$ 4.470,36 no estado inicial). Aponte a **Atividade** à direita: "Cada execução fica registrada, com o cliente e o código." |
| 5:05 | **Inteligência** (`/inteligencia`) | Mostre os quatro indicadores. Aba **Equipamentos**, depois aba **Preços**. Clique **Aplicar** no Banheiro químico padrão. | "Caixa previsto para os próximos 30 dias: **R$ 64.224,51**. E o sistema avisa que **vai faltar estoque**: 7 banheiros químicos padrão no dia 16/11." Em **Equipamentos**: "Para cada equipamento, um veredito: comprar mais, subir preço, baixar preço, vender. O banheiro padrão: comprar mais, **R$ 1.592,64 por mês**." Em **Preços**: "Preço sugerido: de R$ 289,90 para R$ 312,90, **R$ 560,54 a mais por mês** só neste item. No total, **R$ 6.490,52 por mês** em preço." |
| 5:50 | **Clientes**, Construtora Aurora, depois **Configurações, Marca** | **Abrir portal**. Depois, em Marca, troque a cor e mostre as prévias mudando. | "Este é o link que você manda para a construtora. Ela vê cada limpeza com foto e assinatura, baixa o relatório do mês e paga a fatura. **Com a sua marca**, não a nossa. Depois que o seu cliente se acostuma, ele cobra de você." Na cor: "Em dois cliques o sistema inteiro e o portal ficam com a cara da sua locadora." |
| 6:30 | Fechamento | Volte à calculadora (`/diagnostico`) e mostre **Investimento**. | "Implantação de R$ 5.000,00 mais mensalidade de R$ 497,00. Com o que o sistema recupera, se paga em menos de um mês e, no primeiro ano, o retorno é de **903%**. E o que você viu hoje trabalha sozinho, todo dia." |

## Se sobrar tempo ou vier pergunta

- **"E a previsão de estoque?"** Inteligência, aba **Equipamentos**: clique no Banheiro químico padrão e mostre o gráfico de 30 dias contra o estoque ("faltam 7 em 16/11"). **Ver na linha do tempo** abre a disponibilidade por dia.
- **"E o caixa dos próximos meses?"** Inteligência, aba **Caixa**: 12 semanas, com 30, 60 e 90 dias, e o quadro **O sistema recuperou** com o que veio de avaria, extra, atrasado e parado.
- **"Dá para criar uma regra minha?"** Automações, **Nova automação**: escolha o gatilho, a ação e o canal, e o fluxo aparece montando.
- **"Funciona para o meu ramo?"** Configurações, **Pacote**: troque para outro segmento e mostre os nomes e os checklists mudando.
- **"E o meu financeiro?"** Financeiro: a receber por idade, régua de cobrança automática, exportação e a integração com o Conta Azul.
- **"E a inteligência artificial?"** Botão de brilho no topo: o Copiloto resume o dia e deixa cobranças prontas para aprovar. Em Configurações, **IA**, desligue para mostrar que o sistema fica completo sem ele (é um pacote adicional).
- **"Manda cobrança pelo WhatsApp?"** Por enquanto não: a cobrança sai por e-mail, link de pagamento e portal do cliente. Não prometa mais que isso.
- **"E se o equipamento estiver na rua?"** Equipamentos: abra uma unidade, mostre o QR e o histórico. O QR colado na porta abre uma página onde o usuário avisa um problema.
- **"Como sei que o serviço foi feito?"** Locações, abra uma em campo e role até o **Dossiê de prova**: fotos, horários e assinaturas. **Baixar dossiê** gera o arquivo.
- **"E se der erro?"** Configurações, **Demonstração**: ligue "Simular falha de conexão" e mostre que o sistema avisa e não perde o que foi digitado.

## Onde mostrar o dinheiro perdido

1. Calculadora de perdas (`/diagnostico`): o total por mês e por ano, e de onde vem cada parte.
2. Painel: **Parado no depósito**, **Avarias não cobradas**, **Extras não faturados** e **A receber** com os atrasados. São os quatro vazamentos.
3. Avarias e cobranças: o destaque "Sem cobrança" e o botão **Cobrar todas**.
4. Avarias, aba **Extras**: serviço feito e não faturado.
5. Equipamentos, filtro **Parado**: as unidades em vermelho. Inteligência, aba **Equipamentos**: as que menos renderam e o veredito de vender.
6. Financeiro: a barra de idade da dívida.
7. Automações e Inteligência: **Cobrado em 30 dias** e **Recuperado no mês**, a prova de que o sistema devolve o que a calculadora mostrou.
