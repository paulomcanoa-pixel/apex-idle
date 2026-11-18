# Fechamento das pendências implementáveis — 18/11/2026

Continuação do diagnóstico de produto de 14/11. As três frentes delegadas deste pacote foram executadas com GPT-6.2 Sol, conforme solicitado.

## Entregue no jogo e nas ferramentas

1. **Treino:** a previsão usa o mesmo bônus efetivo da corrida, incluindo afinidade, especialidade, chuva e limite de 40%. A interface explica quando XP adicional não aumenta o bônus do conjunto atual. O XP continua adquirido e utilizável em outro conjunto.
2. **Garagem:** mostra a origem dos 3 pontos percentuais de afinidade e quanto cabe no teto. A comparação considera o contexto de circuito e chuva da corrida em andamento.
3. **Academia:** novos dossiês pedem uma prova coerente com a especialidade: chuva, conservação, volta rápida ou ataque. Contam dados da corrida concluída. Dossiês antigos e contratos em andamento mantêm requisitos e progresso.
4. **Pós-corrida:** os registros identificam volta e instante de parada, exposição a desgaste/chuva e contribuição direta do ERS. A explicação não atribui posições fictícias a uma intervenção. Telemetria limitada às oito voltas possíveis; o save guarda apenas o resumo.
5. **Gacha:** a passagem na chegada, a legenda acessível e os drops finais mostram um ponto forte calculado dos atributos do carro. Arte, aura, silhueta contínua e texto desenhado na apresentação continuam em Canvas; pular e movimento reduzido permanecem.
6. **Economia integrada:** um único save e carteiras competem entre investimentos, invocações, projetos, trocas e contratação. Progressão, promoção, desbloqueios e conciliação são executados pelos modelos existentes. [Resultados e premissas](economia-integrada-2026-11-18.md).
7. **Métricas:** aquisições por rota e identidade disponível; transições de etapa; espera entre compras; janelas de observação incompletas separadas. Compra e evento de saldo não contam duas vezes. Dados dependem do consentimento existente. [Metodologia](metricas-clima-2026-11-18.md).
8. **Clima assíncrono:** cálculo de chuva afeta curvas, pneus e estratégia, com atributos normalizados iguais para todos. A regra entra na semana de 23/11/2026, às 00h UTC, sem mudar tempos da semana em andamento. A primeira semana chuvosa nessa rotação começa em 30/11, às 00h UTC.

## Economia: decisão e limites

Mantidos os preços de troca 100/300/800/4.000/15.000 e duplicatas pela metade, além das taxas e garantias já publicadas. A interface identifica troca como rota previsível e projetos como alternativa de materiais, sem exigir CR em invocações. A rodada de 30 dias/32 sementes por perfil usou 96 saves válidos e saldos conciliados. A troca entregou o alvo em 29/32 casos por perfil; um cenário ativo sem invocações concluiu o projeto.

O simulador tem políticas de gasto e premissas explícitas sobre desempenho. Parte da etapa 4 e não inclui todas as fontes opcionais de recursos: presentes, missões, passe e loot estão fora. Não demonstra equilíbrio de toda trajetória humana. O gargalo de pódios do perfil casual permanece como hipótese a avaliar, sem reduzir automaticamente a dificuldade nem contrariar os preços definidos pelo usuário.

## Preservação e verificação

- Mantidos framework, Canvas, `apex-idle-v2`, importação/exportação, catálogo de 20 históricos e dois exclusivos, inventários, recompensas, preços e sincronização. Nenhuma alteração de banco de dados ou cobrança.
- Suíte completa aprovada com 188 testes via `node:test`, além dos scripts legados. Depois foi acrescentado e aprovado um teste de integração de corrida → Academia (total atual: 189 testes). Build estático de 117 arquivos e verificações de sintaxe aprovados. Não há comando de lint no projeto.
- A inspeção visual ampla permanece dispensada por solicitação do usuário. Não apresentamos essa etapa como aprovada.
- Não foram criados jogadores no ranking público nem alterados os limites de capacidade.

## O que depende de uma etapa posterior

Sessões com jogadores novos, coortes maduras D1/D7/D30, carga real em armazenamento isolado, licenças e oferta comercial. Pagamentos/anúncios continuam desligados. A simulação é um instrumento para decidir ajustes, não substitui essas evidências. O conflito entre save local e nuvem continua aguardando escolha do usuário em Conta → Comparar saves.

## Arquivos

Jogo: `academy-model.js`, `legends-ui.js`, `src/shop.js`, `src/vehicle-performance.js`, `src/product-view.js`, `src/v2-ui.js`, `src/v2-adapter.js`, `night-ui.js`, `race-engine.js`, `drops.js`, `immersive.js`, `ranked-ui.js`, `server/ranked-model.cjs`, `src/commercial.js`, `sw.js`.

Ferramentas e testes: `scripts/analyze-cohorts.cjs`, `scripts/simulate-acquisition.cjs`, `scripts/simulate-integrated-economy.cjs`, `metrics-weather-product-test.cjs`, `training-academy-product-test.cjs`, `race-moments-product-test.cjs`, `integrated-economy-test.cjs`, `package.json` e os documentos de acompanhamento.
