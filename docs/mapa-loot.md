# Mapa de integração do loot — Etapa 0

Inspeção da branch local `loot-v2`, commit-base `6579e0fe6bbcfcce0573158a15fb8e369c16fab6`. Base de jogo `1ef7149442e8059b72945f87cac5f3124c4054db`. Nesta etapa só se acrescenta documentação; não se altera código, save, scripts de build ou configuração do banco.

## Stack e árvore

HTML, JavaScript puro em globais window e Canvas 2D; sem bundler. Node >=22; scripts npm existentes: build, test e dev. Dependências existentes: @vercel/blob, @supabase/supabase-js. Nenhuma dependência adicionada.

```text
/
  index.html, game.js, engine.js, night-ui.js, navigation-ui.js
  package.json, vercel.json, build.cjs, dev-server.cjs
  game/        save, estado, economia, formatação e tick
  src/core/    checksum/save-manager, trava de abas e render
  src/data/    shop-catalog.json (catálogo real: 167 itens)
  src/loot/    modelo, arte, cinema, demo e testes preparados
    arte/      29 SVGs gerados
    tools/     export-svg.mjs
  src/         balance, progression-v2, shop, retention, v2-adapter, v2-ui
  api/, server/, supabase/   backend e contratos de dados existentes
  tools/sim/   simuladores de progressão existentes
  docs/        documentação e auditoria fornecida
  public/      saída gerada pelo build; ignorada pelo Git
```

vercel.json mantém framework null, buildCommand node build.cjs e outputDirectory public. Não foi executado deploy nesta etapa.

## Pontos de integração

| Ponto | Arquivo:linha | O que liga / cuidado |
|---|---|---|
| Carregamento do save | `game.js:7` | Lê o save, conserva observedSave e passa por GameSave.load. O raw usado em load pode ser JSON.stringify(stored.data); para o backup literal, usar stored.raw ou localStorage.getItem(key). |
| Migração/importação | `game/save.js:1` | Clona o JSON e inicializa os módulos existentes. Aceita v1/v2; mantém campos desconhecidos. É chamado também pelos restores. |
| Gravação pública | `game.js:9` | Valida posse da aba, controla concorrência e chama saveManager.saveNow. |
| Chave do armazenamento | `src/core/save-manager.js:2` | A chave permanece apex-idle-v2. |
| Checksum | `src/core/save-manager.js:4` | O checksum inclui loot quando presente; adicionar loot invalida um checksum antigo até selar novamente. |
| Selagem/gravação | `src/core/save-manager.js:13` | Valida, guarda cópia anterior e sela antes de serializar. Não há backup bak-loot atualmente. |
| Backups existentes | `src/core/save-manager.js:9` | Existem .bak-v1 e .prev; não substituir nem reutilizar essas chaves para bak-loot. |
| Autosave/saída | `src/core/save-manager.js:18` | 10 s e eventos pagehide/beforeunload/visibilitychange. A migração deve estar pronta antes da primeira gravação. |
| Offline legado | `game/tick.js:1` | GameTick.offline legado: teto 8 h, devolve {seconds, amount}. Em v2 é substituído pelo adaptador. |
| Offline v2 | `src/v2-adapter.js:38` | Único ponto de entrada público v2: chama Ret.offline com a produção da Equipe. Não adicionar crédito de loot também em Ret.offline e duplicar. |
| Cálculo do retorno | `src/retention.js:5` | Ret.offline devolve {seconds, amount}; seconds pode incluir seguro de retorno e teto estendido. Ver restrição abaixo. |
| Entrada/volta da aba | `idle-ui.js:28` | Chama T.offline ao carregar e ao voltar da aba. O evento hidden atualiza idle.at antes de salvar. |
| Visibilidade | `idle-ui.js:30` | Tempo visível recebe GameTick.tick, que atualiza idle.at. Não creditar loot por tempo ativo. |
| Renda de referência | `src/retention.js:4` | ApexRetention.income é o método real pedido para calcular créditos das caixas; a fórmula é independente de E.production. |
| Fim de corrida | `src/v2-adapter.js:24` | Valida resultado em V.finish; se a seed já existe retorna null antes dos efeitos. options contém ers, pitWindow, event e competition. |
| Chamador do fim | `night-ui.js:49` | Motor da corrida principal envia classificação, duração, seed e opções; depois salva o resultado. |
| Diária | `src/retention.js:8` | Só creditar pontos de loot quando o resgate retorna true; resgate repetido retorna false. |
| Semanal | `src/retention.js:10` | Mesmo contrato booleano: só após resgate bem-sucedido. |
| Drop antigo | `src/retention.js:12` | Bloco random()<.08 e garantias 12/30/150 ainda ativos. Futura integração remove só essa execução; mantém demais desafios, passe, perfeito e eventos. |
| PI/peças | `src/v2-adapter.js:15` | Soma peças legadas e componentes dentro do teto .15; loot ainda não participa. Não ligar PI nesta etapa. |
| Validação v2 | `src/v2-adapter.js:10` | V.valid e validador legado adaptado; não há whitelist de chaves superiores. |
| Validação da progressão | `src/progression-v2.js:16` | Valida campos conhecidos; não rejeita loot por ser uma chave nova, mas também não valida sua estrutura. |
| Validação legada composta | `engine.js:73` | Agrega validadores dos módulos antigos; sem remoção de campos desconhecidos. |
| Snapshot da nuvem | `cloud-model.js:12` | Serializa getData() inteiro; sela checksum e envia p_data completo ao RPC sync_game_save. |
| Contrato SQL versionado | `supabase/schema.sql:64` | JSONB; checa versões, limite de 2 MB e métricas conhecidas. Não há whitelist de chaves. Não é confirmação do banco em execução. |
| Restore da nuvem | `cloud-ui.js:13` | Passa por GameSave.migrate, substitui s e executa GameTick.offline. Precisa do mesmo cuidado de inicialização/backup. |
| Importar arquivo | `game.js:16` | Decodifica, valida e substitui s após confirmação. Precisa preservar loot ou inicializá-lo sem alterar campos antigos. |
| Importar texto | `idle-ui.js:26` | Segundo caminho de importação; também substitui s e salva. |
| Alvo CR legado | `index.html:5` | #money existe no HTML, mas pertence ao painel antigo; o render base retorna cedo quando NightView existe. Não é o contador visível a usar automaticamente no cinema. |
| Contador CR visível | `summoning-hub.js:7` | Cria dinamicamente #wallet_money; é mantido no topo por navigation-ui.js:5–6. Preferir esse destino visual. |
| Menu Mais | `navigation-ui.js:11` | Mais é criado em navigation-ui.js, não em v2-ui.js. Botões de configurações/conta/som/ajuda. |
| Extensão das configurações | `src/v2-ui.js:108` | v2-ui.js acrescenta preferências a menus.settings, que não é menus.compactMore. |
| Aviso visível | `game.js:6` | Rádio usa ApexRender.text; pode exibir falha na futura integração, além de console.error. |
| Build estático | `build.cjs:2` | Copia lista explícita de arquivos para public. Os arquivos de loot não estão incluídos; adicionar scripts no index sem atualizar o build causaria 404. |
| Inicialização do loot preparado | `src/loot/loot-model.js:94` | Apenas modelo local; não carregado pelo jogo e não altera nenhum save existente automaticamente. |
| Catálogo no teste | `src/loot/loot-model.test.mjs:15` | O segundo caminho ../../src/data/shop-catalog.json encontra o catálogo real; não foi necessário inventar arquivo nem alterar o teste. |

## Ordem dos scripts

A ordem abaixo foi extraída do index.html, sem reordenar nada. Os módulos de loot ainda não aparecem. O modelo deverá entrar depois de src/retention.js e antes de src/v2-adapter.js; arte/cinema virão nas etapas próprias.

1. `legends-data.js`
2. `garage-state.js`
3. `legends-model.js`
4. `car-art.js`
5. `legends-art.js`
6. `parts-shop-model.js`
7. `circuits-data.js`
8. `career-model.js`
9. `missions-model.js`
10. `traffic-model.js`
11. `farm-model.js`
12. `academy-model.js`
13. `championship-model.js`
14. `src/core/render-scheduler.js`
15. `src/core/save-manager.js`
16. `src/core/tab-lock.js`
17. `game/format.js`
18. `game/state.js`
19. `game/economy.js`
20. `game/tick.js`
21. `game/save.js`
22. `progression-model.js`
23. `night-model.js`
24. `engine.js`
25. `race-engine.js`
26. `circuit-scenery.js`
27. `save-confirm.js`
28. `catalog.js`
29. `src/balance.js`
30. `src/progression-v2.js`
31. `src/shop.js`
32. `src/retention.js`
33. `src/camera-fit.js`
34. `src/effects.js`
35. `src/cosmetics.js`
36. `src/result-art.js`
37. `src/v2-adapter.js`
38. `game.js`
39. `garage.js`
40. `start.js`
41. `drops.js`
42. `immersive.js`
43. `scenery.js`
44. `race-ui.js`
45. `strategy-ui.js`
46. `tactics.js`
47. `visual-garage.js`
48. `parts-shop-ui.js`
49. `camera-view.js`
50. `career-ui.js`
51. `traffic-view.js`
52. `missions-ui.js`
53. `ranked-ui.js`
54. `farm-ui.js`
55. `championship-ui.js`
56. `legends-ui.js`
57. `summon-cinema.js`
58. `summoning-hub.js`
59. `main-tabs.js`
60. `idle-ui.js`
61. `config.js`
62. `vendor/supabase.js`
63. `src/lib/supabase.js`
64. `cloud-model.js`
65. `cloud-ui.js`
66. `night-ui.js`
67. `lineup-model.js`
68. `lineup-ui.js`
69. `progression-ui.js`
70. `navigation-model.js`
71. `navigation-ui.js`
72. `locales.js`
73. `src/i18n.js`
74. `src/commercial.js`
75. `src/v2-ui.js`

## Testes existentes

package.json mantém a cadeia legada, os testes técnicos, v2 e efeitos visuais. Os dois testes de loot são executados separadamente por enquanto; incorporá-los a npm test pertence à Etapa 1.

- `academy-test.cjs`
- `banner-test.cjs`
- `career-test.cjs`
- `championship-test.cjs`
- `circuits-test.cjs`
- `cloud-test.cjs`
- `core-test.cjs`
- `drops-test.cjs`
- `farm-test.cjs`
- `idle-test.cjs`
- `legends-test.cjs`
- `lineup-test.cjs`
- `missions-traffic-test.cjs`
- `navigation-test.cjs`
- `night-test.cjs`
- `parts-shop-test.cjs`
- `progression-test.cjs`
- `race-test.cjs`
- `ranked-test.cjs`
- `retention-v2-test.cjs`
- `scenery-test.cjs`
- `shop-v2-test.cjs`
- `src/loot/loot-art.test.mjs`
- `src/loot/loot-model.test.mjs`
- `strategy-test.cjs`
- `tactics-test.cjs`
- `test.cjs`
- `track-clearance-test.cjs`
- `v2-completion-test.cjs`
- `v2-system-test.cjs`
- `v2-test.cjs`
- `visual-effects-test.cjs`

## Evidência de inspeção

Uma execução em memória, sem escrever em armazenamento do usuário, confirmou: A.validate aceita um estado real inicial com loot; adicionar loot exige recalcular checksum; depois de selar o checksum volta a ser válido; exportar/importar preserva loot. Isso não substitui os testes de save-manager, nuvem e backup exigidos na Etapa 2.

O código de CloudSave.Sync preserva campos novos na serialização. A função SQL versionada também recebe o JSON completo. Não foi enviado um save à nuvem, consultado dado de jogador ou alterado o banco para esta auditoria.

## Dúvidas e restrições para as próximas etapas

1. **Seconds de offline não equivalem sempre a tempo real fora:** seguro de retorno pode elevar seconds a 4 h; cofre pode elevar o teto a 12 h. A regra do novo loot proíbe encher caixa por compra. A futura ligação deve medir o tempo real ausente e limitar a 8 h, sem herdar tempo artificial do seguro; não ligar cegamente creditAway ao valor aumentado.
2. **Crédito em duplicidade:** escolher um único hook de offline. Ligar no adaptador e em Ret.offline simultaneamente duplicaria o enchimento.
3. **Backup literal:** guardar o texto original antes de acrescentar loot, incluindo os caminhos de importação e restore. Não usar JSON reserializado como se fosse o texto original. A chave bak-loot não existe no código atual.
4. **Validação:** aceitar chave desconhecida não significa validar estrutura de loot. Planejar a validação/migração sem apagar campos futuros ou sobrescrever o save em falha.
5. **Alvo visual:** o documento usa #money; o contador efetivo desta interface é #wallet_money. O cinema deve usar o alvo realmente visível na Etapa 4.
6. **Publicação de arquivos:** build.cjs exige lista explícita. A integração deve incluir os novos scripts/estilos na saída; o passo inicial não os publica.
7. **Fórmula de renda:** Ret.income existe, mas calcula equipe pela soma base e não simplesmente por E.production com todos os multiplicadores. Validar o orçamento de loot contra a renda usada no jogo antes de ativar a economia.
8. **PI de loot:** decisão adiada para a Etapa 5, como no roteiro. O teto de peças existente é 15%; o modelo de loot tem teto próprio de 3%, atualmente desconectado.
9. **Cinema, celular e desempenho:** não verificados na Etapa 0; nenhuma interface foi ligada e nenhum fluxo de jogador foi alterado.

## Limite desta entrega

A Etapa 0 termina com este mapa. A integração ao save e ao jogo ainda não foi iniciada. A autorização posterior de commit e push permite enviar os arquivos preparados e este documento à branch loot-v2; não autoriza mesclar na main nem ativar o recurso em produção.
