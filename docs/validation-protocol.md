# Protocolo de validação do Apex Idle

> Continuação de 18/11: [pendências implementáveis concluídas e limites restantes](entrega-plano-2026-11-18.md).

> Atualização de 17/11: veja [a continuação publicada](entrega-conclusao-2026-11-17.md). A inspeção anterior confirmou partes da interface; a nova inspeção visual foi encerrada a pedido do usuário. Os registros abaixo descrevem a situação daquela rodada.

Versão de produto: 2026-11-16. Os números de simulação são cenários reproduzíveis, não resultados de jogadores.

## Instrumentação disponível

O consentimento começa desligado. `ApexCommercial.record` mantém até 200 eventos neste aparelho e envia eventos à tabela já existente somente quando o jogador consentiu e está autenticado. Retirar consentimento interrompe o envio. A versão, a categoria de tela e a origem geral passam por listas permitidas; URLs, referrers, user-agent e texto livre não entram nos eventos.

- Primeira compra, corrida, seleção de carro/piloto, contrato da Academia e retorno offline: tempo desde a primeira sessão consentida. Saves anteriores sem início observado não ganham um tempo inventado.
- `car_equip`: identificador numérico estável e circuito. O relatório mede frequência de seleção e participação por carro; não confundir seleção com tempo efetivamente equipado.
- `summon`: quantidade, novidades, repetidos e raridades. `economy_action`: variações de CR, materiais, fichas, pontos, gemas, fichas de destaque e tokens de evento.
- Compras e resgates têm ação própria. O saldo residual é amostrado a cada 30 segundos como `other_gameplay`, incluindo renda automática e ações antigas ainda sem marcador próprio. Não atribuir esse agregado inteiro à equipe ou à corrida. Fechar a aba antes da amostra pode perder parte do último intervalo.
- Fila: entradas, saídas, resultados e espera observada. Erros de save são limitados a um evento por minuto. Uma falha de armazenamento pode impedir o próprio evento de persistir localmente.

O retorno de uma aba oculta registra o crédito offline já aplicado, sem duplicá-lo na renda residual. Após pelo menos 30 minutos fora, `session_resume` precede `offline_return` para conservar a janela da compra após retorno. Isso continua sendo medição de uma sessão consentida, não prova de retenção de toda a população.

## Análise reproduzível

Execute `node scripts/simulate-acquisition.cjs > aquisicao.json` para probabilidades, retorno de 2/8 horas, uma trajetória inicial de sete dias e 32 sementes por perfil durante 90 dias. O relatório declara a política de compras, sessões, hipótese de posições e recursos excluídos. As rotas projeto/troca são contrafactuais independentes: não some seus recursos como se as quatro rotas fossem gratuitas simultaneamente. Percentis `null` significam que a proporção não atingiu a meta no horizonte.

Para dados reais, exporte apenas eventos consentidos e autorizados no formato `{user_id,event,data}` e execute `node scripts/analyze-cohorts.cjs eventos.json`. O resultado agrupa a primeira sessão observada por dia UTC, versão, dispositivo e origem. Não imprime IDs. D1/D7/D30 exige sessão no dia exato; corridas automáticas não contam como retorno. Coortes imaturas ficam sem taxa. Tempos são de calendário, não tempo ativo.

A janela de 30 minutos sem ação útil é uma aproximação de uma sessão sem interação. Não é prova de abandono. Compras após retorno usam a mesma janela e relatam casos não observados. Exportações parciais não representam aquisição total, churn, todo o público ou receita. O relatório local de 200 eventos serve para diagnóstico individual, não substitui a exportação da coorte.

## Sessões observadas e decisão de produto

Recrute jogadores novos que aceitem participar. Peça que iniciem sem orientação, escolham a primeira compra, expliquem por que terminaram nessa posição, equipem uma dupla e apontem o próximo objetivo. Registre dificuldades, sem preencher respostas por eles. Refaça o fluxo após um retorno offline e no celular.

Antes de mudar a economia, compare coortes maduras da mesma origem e dispositivo. Publique tamanho da amostra, período, versão e distribuição; defina o limiar de sucesso com a linha de base do próprio Apex. Não existe taxa de retenção universal demonstrada por estes testes. Preserve os preços e o valor de duplicata explicitamente definidos pelo usuário até uma decisão de balanceamento fundamentada.

## Limites de capacidade e publicação

`social-product-test.cjs` exerce CAS, limites, replays e 2.000 perfis sintéticos com 200 equipes. Isso mede o modelo em memória; não mede a latência, custo ou concorrência real do Blob. O cadastro existente permanece limitado a 2.000 perfis, escuderias a 500, equipes a dez membros e amizades a vinte. Antes de ampliar esses limites, faça carga em armazenamento isolado e verifique p95 de resposta, taxa de conflitos, tamanho do estado e consumo. Nunca crie milhares de perfis no ranking público para testar.

Confira o fluxo browser → API → armazenamento → resposta em um ambiente isolado. Nesta rodada há cobertura automatizada da interface JavaScript e da API, mas a inspeção visual a 1366 px/390 px ficou pendente por interrupção da ferramenta de navegador. Não registrar essa etapa como aprovada.
