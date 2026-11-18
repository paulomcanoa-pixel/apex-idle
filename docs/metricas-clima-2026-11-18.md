# Métricas e clima do desafio semanal

## Aquisição e etapas

O relatório de coortes lê uma exportação autorizada de `game_events` com eventos autenticados e consentidos. Execute `node scripts/analyze-cohorts.cjs eventos.json`. A saída contém totais e segmentos por data UTC, versão, dispositivo e origem.

- `acquisition.routes` conta carros novos por gacha, projeto, troca e compra direta. Um giro de dez pode gerar vários carros novos. Duplicatas ficam no total anterior de duplicatas, sem aumentar a aquisição. Eventos de saldo entram na contabilidade da economia. Cada aquisição vem do evento da ação que a realizou.
- Os campos `cars` usam hashes dos IDs do catálogo. O relatório aproveita o hash antigo de `item` quando o catálogo identifica o carro. `unknownCarEvents` e `unknownCars` indicam onde a identidade ficou indisponível. Os totais anteriores em `acquisition` continuam descrevendo apenas invocações.
- `progression.stages` usa chave interna de categoria e etapa com índices de zero a partir de `0:0`. O campo `stage` usa o número exibido no jogo, de 1 a 12. Uma etapa recebe um avanço quando uma observação posterior registra uma categoria ou etapa superior à anterior. O último ponto registrado de cada jogador aparece em `endOfObservationPlayers`.
- A proxy de abandono mede tempo sem ação útil por até 30 minutos a partir da entrada ou retorno, limitado pelo início da próxima sessão. O relatório geral conta sessões completas. O relatório por etapa divide a janela a cada mudança observada de categoria ou etapa. `sessionWindows` conta trechos encerrados na etapa. Trechos ainda abertos na data de corte aparecem em `censoredWindows`, e os que ainda não mostram ação útil aparecem em `censoredWithoutUsefulAction`. Corridas automáticas e renda passiva ficam fora das ações úteis.
- `purchaseWait` mede a espera do início do trecho na etapa até a primeira compra e entre compras no mesmo trecho. Compra inclui melhoria, equipe, item, invocação, projeto e troca. Eventos de saldo da mesma operação são pareados com o evento da ação. Intervalos finalizados por uma compra entram na mediana e no P90. O tempo desde a última compra até o fim do trecho é contado separadamente como limite inferior censurado.

Os intervalos vêm de timestamps de telemetria. O consentimento, a janela de observação e a cobertura da exportação determinam quais conclusões podem ser tiradas sobre compra, abandono e retenção. Etapas puladas entre eventos não aparecem como visitas.

## Clima no desafio assíncrono

A regra 2 entra em vigor na semana de 23 de novembro de 2026, a partir de 00h UTC. Essa semana é seca pelo calendário já existente. A primeira prova com efeito de chuva começa em 30 de novembro, às 00h UTC.

O servidor usa a mesma pista, condição e seleção de carros para todos durante a semana. A chuva leve adiciona tempo nos setores de curvas e pneus. O efeito usa os atributos normalizados de aderência e pneus e varia com a estratégia. Conservar reduz o acréscimo em relação a atacar. O detalhamento da tentativa exibe o acréscimo comparado ao tempo seco daquele carro e estratégia.

Os tempos já registrados até a semana de 16 de novembro seguem a regra 1. O servidor continua calculando cada tentativa a partir do carro e da estratégia escolhidos.

Testes locais com `node --test metrics-weather-product-test.cjs measurement-product-test.cjs ranked-product-test.cjs social-product-test.cjs`.
