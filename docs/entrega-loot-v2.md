# Entrega loot-v2 — integração completa do último roteiro

## O que mudou

Caixas AFK e Online ligadas ao save, corridas e missões. Acesso por Mais e pelo atalho Caixas na pista. Artes locais SVG do arquivo fornecido; artes dos carros e pista em Canvas preservadas. Probabilidades, garantias, progresso neutro, coleção, forja com fragmentos e lembretes opcionais desligados por padrão. Abertura salva antes do cinema; Pular/Esc, som salvo, movimento reduzido e textos acessíveis.

Mantidos: framework JavaScript puro, chave apex-idle-v2, garagem/pilotos, gacha de carros, ERS, circuitos, recordes, reputação, renda offline, exportação/importação, Supabase e fórmulas base. Nenhuma dependência adicionada. Backup literal apex-idle-v2.bak-loot, uma vez, antes da primeira gravação com loot. Falha de backup impede sobrescrita. Recompensa volta ao estado anterior se a gravação falhar.

Offline de caixa usa ausência real limitada a 8 h; seguros e bônus compráveis não criam tempo artificial. Seeds de corrida repetidas e missões já resgatadas não dão pontos novamente. O drop CR antigo foi desligado e seus campos preservados.

Auditoria: saldo marcado paidGems fica reservado fora de sorteios; produtos reais seguem bloqueados; pagamentos e anúncios continuam indisponíveis. Invocação clona só dados da transação, preservando referências do save. Tuning remoto valida faixas por chave (recompensas até 1,25x) e mostra erro de fallback nas configurações. Os cinco pontos de HTML da V2 viraram criação explícita de nós, com texto por createTextNode/textContent e atributos permitidos. Atualizações periódicas de UI compartilham um timer e pausam em aba oculta, exceto lembretes explicitamente autorizados. Loop de corrida e autosave mantidos.

## Balanceamento

SUPOSIÇÃO de design: peças das caixas são colecionáveis e não dão PI nesta entrega. O método piBonus permanece disponível para uma futura decisão; não foi conectado ao power.

CR por raridade: [50,150,400,1200] → [10,15,40,120] segundos de renda. A configuração fornecida atingiu cerca de 33% no cenário conservador de 60 vitórias perfeitas/h. Só CFG de créditos foi ajustado; custos, recompensas base e progressão existentes não mudaram. Valores mínimos e arredondamento permanecem.

| Pista | Renda real CR/s | Online antes | Online depois | AFK depois, s de renda/h |
|---|---:|---:|---:|---:|
| 3 | 0.973 | 33.13% | 4.42% | 5.32 |
| 8 | 3.750 | 33.02% | 4.30% | 5.27 |
| 15 | 29.700 | 33.06% | 4.34% | 5.28 |
| 24 | 263.882 | 33.06% | 4.33% | 5.27 |

| Perfil | Pista | Sem loot | Com loot | Variação |
|---|---:|---:|---:|---:|
| Ativo | 5 | 0.640 h | 0.666 h | 4.096% |
| Ativo | 10 | 1.632 h | 1.655 h | 1.449% |
| Ativo | 24 | 14.224 h | 14.110 h | -0.806% |
| Casual | 5 | 0.879 dias | 0.879 dias | -0.000% |
| Casual | 10 | 3.876 dias | 3.546 dias | -8.523% |
| Casual | 24 | 16.337 dias | 15.882 dias | -2.789% |

Metas obrigatórias das pistas 5 e 24: variação absoluta <5%, aprovadas. Pista 10 casual: antecipação de 8,52%, registrada; a meta de <5% do roteiro só se aplica a 5 e 24. Políticas gulosas de compra do simulador podem produzir pequenas variações não monotônicas no perfil ativo. Simulador casual agora registra instantes exatos, evitando arredondar por dia. Sem loot, as saídas CLI de sim.mjs e sim90.mjs são idênticas às anteriores. Reprodução: node tools/sim/loot-sim.mjs. JSON completo em docs/loot-balanceamento.json.

## npm test (saída)

Comando único npm test preserva todos os testes anteriores e acrescenta os de loot, cinema, transação, scheduler, orçamento e auditoria. Última execução: todos verdes, zero falhas. Build estático aprovado, scripts modificados com sintaxe válida. Não há script lint no package.json. Sem novo pacote de testes.

## Evidência (navegador, medição)

Testado no navegador em origens locais separadas, preservando o save principal: carregar jogo existente; probabilidades em 390 px; importar fixture pelo fluxo real com confirmação; abrir AFK lendária com 5 cartas em ordem; Pular na Online; recarregar no meio e confirmar recompensa e caixa consumida; forjar item, saldo 170→140 e item Obtido; comprar motor e abrir banners no desktop 1366 px. Console da origem nova sem erros nesses fluxos. Nenhum save real enviado à nuvem.

## Não verificado

A medição DevTools CPU 4x sem tarefa >50 ms ainda não foi executada: o controlador disponível do navegador não oferece throttling de CPU. Não se afirma desempenho 4x aprovado. Movimento reduzido foi coberto em teste automatizado com DOM falso; falta emulação manual no DevTools. Sincronização com loot passa pelo módulo real e RPC simulado, não por gravação no banco de produção. Regressão completa de temporada/ERS/circuitos está coberta pela suíte existente, sem repetir todos esses fluxos manualmente nesta entrega.

## Decisões para o dono

A branch loot-v2 pode ser revisada em preview. O site principal só deve ser atualizado após aprovação específica, conforme o último roteiro. Pagamentos permanecem desligados; nenhuma conclusão jurídica ou autorização de monetização é fornecida nesta entrega.

## Arquivos

- build.cjs
- career-ui.js
- championship-ui.js
- cloud-ui.js
- docs/loot-balanceamento.json
- farm-ui.js
- game.js
- game/save.js
- index.html
- legends-ui.js
- loot-security-test.cjs
- night-ui.js
- package.json
- ranked-ui.js
- retention-v2-test.cjs
- src/commercial.js
- src/core/render-scheduler.js
- src/core/save-manager.js
- src/loot/loot-balance.test.mjs
- src/loot/loot-cinema.css
- src/loot/loot-cinema.js
- src/loot/loot-cinema.test.mjs
- src/loot/loot-hooks.js
- src/loot/loot-integration.test.mjs
- src/loot/loot-model.js
- src/loot/loot-scheduler.test.mjs
- src/loot/loot-transaction.js
- src/loot/loot-ui.css
- src/loot/loot-ui.js
- src/retention.js
- src/safe-dom.js
- src/shop.js
- src/tuning-policy.js
- src/v2-adapter.js
- src/v2-ui.js
- tools/sim/loot-sim.mjs
- tools/sim/sim.mjs
- tools/sim/sim90.mjs
