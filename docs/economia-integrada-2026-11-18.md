# Economia integrada do Apex Idle

Rodada de 30 dias com 32 réplicas por perfil, semente base 20261118. Cada réplica começa no Kart, etapa 4, com Lotus 49 e Davi Horizonte, melhorias [8, 6, 4, 3, 0, 0], equipe [10, 5, 1, 0, 0, 0], 0 CR, 0 materiais e 0 pontos. A primeira visita é em 18 de novembro às 12h UTC. Cada perfil usa as mesmas 32 sementes para permitir comparação pareada. Os resultados descrevem as políticas abaixo e dependem do ponto de partida escolhido.

```sh
node scripts/simulate-integrated-economy.cjs 30 32 20261118
node --test integrated-economy-test.cjs
```

## Políticas simuladas

| Perfil | Sessões diárias | Ordem de gasto em CR e fração do saldo disponível em cada decisão | Limite por visita |
| --- | --- | --- | --- |
| ACTIVE | 3 × 40 min | Melhorias 35%, equipe 30%, invocação 24% | 12 compras por tipo de investimento, 20 invocações |
| CASUAL | 1 × 20 min | Melhorias 30%, invocação 25%, equipe 22% | 8 compras por tipo de investimento, 10 invocações |
| OFFLINE | 3 coletas, 0 corridas | Equipe 53%, invocação 25%, melhorias 8% | 6 compras por tipo de investimento, 5 invocações |

Cada passagem refaz o orçamento com o saldo restante acima da reserva de cinco prêmios de volta. A reserva inclui 10.000 CR para a Academia quando as provas em pista estão completas e o piloto ainda aguarda negociação. Cada categoria de investimento procura a melhoria ou unidade elegível mais barata. A conta só tem um saldo de CR, um de materiais e um de pontos. Compras, promoções, preços, desbloqueios, produção, teto offline e contadores de invocação seguem os modelos do jogo. A promoção ocorre no fim da visita assim que o modelo permite e reinicia melhorias e equipe.

A política mantém a dupla inicial, deseja o MP4/4 na invocação principal e para de invocar quando o obtém. Projeto e troca também disputam a primeira aquisição. ACTIVE e CASUAL tentam projeto antes de troca quando ambos estão disponíveis. OFFLINE prioriza a troca. Cada réplica registra a rota que concedeu o carro. Invocações que entregam duplicatas abastecem a mesma carteira usada pela troca.

A duração é calculada pelo adaptador, com cinco voltas e seis segundos entre corridas. A colocação prevista pelo PI varia em até duas posições conforme a semente. O clima, a penalidade de CR e a afinidade usam os modelos do jogo. Para a prova de gestão de pneus de Rafael Brisa, a política supõe uma parada dentro da janela e zero segundos com pneus gastos em 60% das corridas ACTIVE e em 35% das CASUAL. Nas demais, supõe parada fora da janela e dois segundos com pneus gastos. A Academia avalia essas entradas com sua regra de prova. Os perfis coletam observações de seis horas e podem negociar ou assinar no início e no fim das sessões. Presentes, missões, passe, loot, pagamento, bônus de ERS, reinício de temporada e compras de outros itens ficaram fora do cenário.

## Primeira aquisição e marcos

P50 e P90 usam todas as 32 réplicas do perfil, em dias corridos desde o início. O travessão indica que o percentil não foi atingido no horizonte. Uma rota fica censurada se outra já concedeu o MP4/4.

| Perfil | MP4/4, P50 / P90 | Invocação | Troca, P50 / P90 | Projeto | Rafael Brisa, P50 / P90 |
| --- | --- | --- | --- | --- | --- |
| ACTIVE | 32/32 · 3,00 / 3,33 d | 3/32 | 29/32 · 3,00 / 3,33 d | 0/32 | 32/32 · 26,33 / 26,67 d |
| CASUAL | 32/32 · 13,00 / 14,00 d | 3/32 | 29/32 · 13,00 / 14,00 d | 0/32 | 0/32 · — / — |
| OFFLINE | 32/32 · 8,00 / 8,67 d | 3/32 | 29/32 · 8,00 / 9,00 d | 0/32 | 0/32 · — / — |

As primeiras promoções chegaram em P50 de 7,69 dias no ACTIVE, que terminou com três promoções por réplica. CASUAL e OFFLINE permaneceram no Kart. O projeto abriu em P50 de 0,68 dia no ACTIVE e 4,01 dias no CASUAL. Para verificar a rota de materiais sem a aquisição concorrente, uma réplica ACTIVE com semente 20261118 e zero invocações fez o projeto no dia 27,68, consumindo 4.500 materiais, e assinou o contrato no dia 26,33.

CASUAL teve média de 247 corridas, 85 provas válidas de pneus e zero pódios. OFFLINE acumulou 1.958 fragmentos e 40 pontos de licença, com zero corridas e zero provas. O contrato exige 30 fragmentos, licença 10, 24 corridas, três pódios, quatro combos e uma prova válida de gestão.

## Fluxos médios em 30 dias

Valores aproximados em CR. Produção online é o rendimento da equipe durante as sessões. Voltas e prêmios vêm das corridas.

| Perfil | Offline | Produção online | Voltas | Prêmios | Penalidade | Melhorias | Equipe | Invocação | Academia | Saldo final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ACTIVE | 592,65 bi | 627,41 bi | 30,00 bi | 12,99 bi | 251,94 mi | 30,89 bi | 347,03 bi | 1,99 mi | 10.000 | 884,88 bi |
| CASUAL | 157,91 mi | 75,42 mi | 4,82 mi | 0,93 mi | 17.034 | 2,36 mi | 33,19 mi | 1,04 mi | 0 | 202,48 mi |
| OFFLINE | 2,37 bi | 0 | 0 | 0 | 0 | 211,52 mi | 2,07 bi | 309.205 | 0 | 93,10 mi |

Os perfis usaram em média 115,38 invocações, receberam 14.512,50 pontos de duplicatas, gastaram 13.593,75 em trocas e terminaram com 918,75. As corridas geraram cerca de 4.861 materiais no ACTIVE e 740 no CASUAL. As 96 réplicas passaram pela validação do save e pela conciliação de CR, materiais, pontos e fragmentos a cada visita. O JSON inclui P95, contagem de censura e o detalhamento de cada fonte e gasto.

## Recomendações

- Preserve os preços de troca de 100, 300, 800, 4.000 e 15.000 pontos e a devolução de metade por duplicata. A troca cumpriu o papel de aquisição previsível, obtendo o alvo em 29 de 32 réplicas de cada perfil. Use os tempos em dias como referência de cenário, pois o número de visitas e os limites de invocação determinaram o calendário.
- Verifique o requisito de pódios de Rafael Brisa com um grupo casual em sessões reais e acompanhe a distribuição dos pódios por etapa, PI e conjunto. O CASUAL acumulou corridas e provas de pneus, mas não obteve pódios sob a política adotada. A incapacidade do OFFLINE de concluir o contrato decorre dos requisitos de pista.
- Antes de alterar custos de projetos, compare trajetórias com diferentes prioridades de coleção e de invocação. Neste cenário, a troca já concedeu o MP4/4 antes da janela de 1.500 corridas necessária para o projeto, enquanto uma réplica sem invocações concluiu o projeto no horizonte.
- Faça a próxima verificação de ritmo de CR por categoria e frequência de retorno. O ganho offline respondeu por cerca de 66% das entradas do CASUAL, e a equipe absorveu cerca de 87% de todo o CR ganho pelo OFFLINE. Esses números decorrem da coleta no teto e da política que reinveste na própria produção. Compare com dados consentidos de retorno e compra antes de mudar o teto ou a produção.
