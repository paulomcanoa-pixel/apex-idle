# Aquisição e retorno offline — 15/11/2026

Reproduzir com `node scripts/simulate-acquisition.cjs`. O script usa as funções publicadas, valida os caminhos determinísticos e calcula a distribuição por sobrevivência. São cenários matemáticos, não dados de jogadores nem promessa de prazo.

## Mítico

| Condição | Média de invocações | Mediana | 95% obtêm até |
| --- | ---: | ---: | ---: |
| Principal, sem desejo | 700 | 571 | 1792 |
| Principal, desejo MP4/4 | 556,521 | 446 | 1454 |
| Principal, desejo Lotus 49 | 787,899 | 649 | 1994 |
| Exclusivo | 86,661 | 65 | 241 |

Os números se referem a qualquer mítico, partindo de contador zero. O principal começa em 0,1%; depois de 699 tentativas sem mítico chega a 0,152392%, antes do desejo. A chance cresce suavemente e reinicia quando vem um mítico. Não existe garantia rígida de mítico. A lista de desejos dobra a probabilidade do modelo escolhido e redistribui as demais: por isso a média geral muda. As garantias de épico e lendário não substituem um mítico sorteado.

## Caminhos determinísticos

| Raridade | Materiais para projeto | Pontos para troca | Pontos por repetido |
| --- | ---: | ---: | ---: |
| Comum | 90 | 100 | 50 |
| Raro | 240 | 300 | 150 |
| Épico | 600 | 800 | 400 |
| Lendário | 1800 | 4000 | 2000 |
| Mítico | 4500 | 15000 | 7500 |

Projetos abrem na sexta etapa Regional ou categoria superior; exigem carro ainda não possuído. A referência de três materiais por corrida equivaleria a 30/80/200/600/1500 corridas, sem contar contratos, objetivos, desafios ou outras fontes. Não é uma estimativa de dias de jogo.

Lotus 97T e Jordan 191 continuam exclusivos do banner especial, sem compra por CR, troca ou projeto. São 20 históricos no principal e dois exclusivos. O script verifica essas restrições.

## O que o retorno pode comprar

Cada coluna representa uma alternativa independente usando apenas o saldo recebido, não compras simultâneas. Estados e quantidades de equipe estão declarados no script.

| Cenário fixo | Ausência | CR recebido | Níveis de motor | Invocações principais |
| --- | ---: | ---: | ---: | ---: |
| Inicial, sem equipe | 2 h | 178,83 | 3 | bloqueadas |
| Inicial, sem equipe | 8 h | 715,30 | 7 | bloqueadas |
| Regional, etapa 4, equipe desenvolvida | 2 h | 54307,44 | 24 | 20 |
| Regional, etapa 4, equipe desenvolvida | 8 h | 217229,76 | 34 | 81 |
| Elite, etapa 6, equipe desenvolvida | 2 h | 260252923055,79 | 35 | 146 |
| Elite, etapa 6, equipe desenvolvida | 8 h | 1041011692223,18 | 44 | 586 |

A renda offline existente foi preservada. Os cenários tardios mostram que a renda da equipe pode financiar muitas invocações: acompanhar consumo, geração e tempo real de progressão antes de alterar novamente os multiplicadores. O relatório não mede o tempo necessário para chegar a esses estados.

## Medição

Analytics continua opcional. Eventos de primeira ação são deduplicados; D1/D7/D30 usam retorno por sessão ativa e excluem coortes sem tempo suficiente. `scripts/analyze-cohorts.cjs` não trata corridas automáticas como retorno. Ainda não existem resultados longitudinais obtidos por esta entrega.
