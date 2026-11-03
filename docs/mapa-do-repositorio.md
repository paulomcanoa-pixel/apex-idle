# Mapa do repositório — Etapa 0

Auditoria de 02/11/2026. Referência publicada: 573e0090f04701876c9eaad7b890154469d40100. Nenhum código de jogo alterado nesta etapa. Arte futura permanece em Canvas.

## Estrutura e stack

JavaScript sem framework, scripts clássicos globais e exports CommonJS para testes. Canvas 2D. Sem bundler: build.cjs copia 77 arquivos estáticos para public, gera config.js e inclui SDK local do Supabase. Vercel framework:null; outputDirectory:public. API/server e SQL existem separadamente. A cópia de trabalho não tem histórico Git local; a referência remota é consultável.

Scripts: npm run dev (node dev-server.cjs), npm run build (node build.cjs), npm test (23 suítes encadeadas). Sem lint. Dependências declaradas: @vercel/blob 2.8.2 e @supabase/supabase-js 2.118.0; Node >=22.

### Arquivos versionáveis encontrados (exclui public gerado, node_modules e .env)

```text
.env.example
.github/workflows/checks.yml
.gitignore
ACADEMIA.md
academy-model.js
academy-test.cjs
academy.css
api/ranked.js
ARQUIVO-F1.md
AUDITORIA-NOTURNA.md
AUDITORIA-PDF.md
AUDITORIA.md
banner-test.cjs
BANNERS.md
build.cjs
camera-view.css
camera-view.js
CAMPEONATO.md
car-art.js
car-gallery.html
car-pack/aurora.png
car-pack/eclipse.png
car-pack/scarlatto.png
car-pack/solar.png
car-pack/vento.png
career-model.js
career-test.cjs
career-ui.js
career.css
championship-model.js
championship-test.cjs
championship-ui.js
championship.css
circuit-scenery.js
CIRCUITOS.md
circuits-data.js
CIRCUITS-LICENSE.txt
circuits-test.cjs
circuits.css
cloud-model.js
cloud-test.cjs
cloud-ui.js
dev-server.cjs
drops-test.cjs
drops.js
engine.js
ENTREGA-ONLINE.md
ETAPA-CORRIDA.md
farm-model.js
farm-test.cjs
farm-ui.js
farm.css
game/economy.js
game/format.js
game/save.js
game/state.js
game/tick.js
game.js
garage-state.js
garage.js
idle-test.cjs
idle-ui.js
idle.css
immersive.css
immersive.js
index.html
legends-art.js
legends-data.js
legends-model.js
legends-test.cjs
legends-ui.js
legends.css
lineup-model.js
lineup-test.cjs
lineup-ui.js
LOJA-PECAS.md
main-tabs.js
missions-model.js
missions-traffic-test.cjs
missions-ui.js
missions.css
MISSOES-TRAFEGO.md
navigation-model.js
navigation-test.cjs
navigation-ui.js
night-model.js
night-test.cjs
night-ui.js
night.css
package-lock.json
package.json
parts-shop-model.js
parts-shop-test.cjs
parts-shop-ui.js
parts-shop.css
PESQUISA-GESTAO.md
progression-model.js
progression-test.cjs
progression-ui.js
PROMPT-PROFISSIONAL.md
race-engine.js
race-test.cjs
race-ui.js
race.css
ranked-test.cjs
ranked-ui.js
ranked.css
README.md
REFERENCIA-VISUAL.md
ROTEIRO.md
save-confirm.js
scenery-test.cjs
scenery.js
server/ranked-model.cjs
src/lib/supabase.js
start.js
strategy-test.cjs
strategy-ui.js
strategy.css
style.css
summon-cinema.js
summoning-hub.css
summoning-hub.js
supabase/schema.sql
supabase/verification.sql
tactics-test.cjs
tactics.js
test.cjs
track-clearance-test.cjs
traffic-model.js
traffic-view.js
vercel.json
visual-garage.css
visual-garage.js
```

## Correspondência

| Arquivo real | Função | Nome do prompt |
|---|---|---|
|engine.js|Estado inicial, validation, durée, revenu, coût, achat|Motor e melhorias|
|game/state.js; game/economy.js; game/tick.js; game/save.js|Geradores, avanços temporais, migração e serialização|Equipe / save|
|game.js; start.js|Loop requestAnimationFrame, render, localStorage|Loop e persistência|
|night-model.js; night-ui.js|6 voltas, IA, pontos, pódio, títulos, ERS|Temporada e IA|
|progression-model.js; progression-ui.js|Objetivo, recomendação e tutorial|Progresso|
|parts-shop-model.js; parts-shop-ui.js|18 componentes, inventário e instalação|Peças|
|navigation-model.js; navigation-ui.js; main-tabs.js|5 áreas e rotas antigas|Navegação|
|circuits-data.js; circuit-scenery.js|24 traçados e cenários|Circuitos|
|camera-view.js; camera-view.css|Pista inteira / seguir e zoom|Câmera|
|race-engine.js; race-ui.js; traffic-model.js; traffic-view.js|Simulação e desenho dos competidores|Corrida visual|
|immersive.js; drops.js; summon-cinema.js; summoning-hub.js|Diálogos, fases, Canvas e banners|Invocação|
|garage-state.js; lineup-model.js; lineup-ui.js|Seleção canônica e dupla|Garagem|
|championship-model.js; championship-ui.js|Competição paralela, pilotos, gemas, passe|Campeonato|
|career-model.js; career-ui.js|Contratos, projetos, GP semanal|Carreira|
|farm-model.js; farm-ui.js|Banco e operações de farm|Farm|
|missions-model.js; missions-ui.js|Objetivos e resgates|Missões|
|cloud-model.js; cloud-ui.js; src/lib/supabase.js; build.cjs|Sincronização e configuração pública gerada|Nuvem / config.js|

## Loop e mutações

game.js executa draw a cada requestAnimationFrame e render aproximadamente a cada 150 ms (até 6,7 chamadas/s). Render é encadeado por wrappers em vários scripts. night-ui.js reatribui textos/atributos e percorre dez linhas de classificação a cada render, mesmo quando o valor não mudou. Cabeçalho, ERS, pneus e menus também são atualizados. Isso justifica investigar render por versão e diff de valores antes de qualquer troca de economia.

A medição quantitativa via navegador foi tentada na corrida real, mas a avaliação isolada do navegador não expõe performance (erro ao ler performance.now). Não foi instalado instrumentador na página do usuário, nem reiniciada sua partida. Portanto ~600/s é hipótese do prompt, não resultado confirmado. A meta <=60/s ainda não foi aferida; registrar uma amostra de MutationObserver de 5–10 s, com menus fechado/aberto, numa instância de QA é pendência da auditoria. Sem atribuição de stack por MutationObserver: relacionar alvos observados às rotinas de escrita.

## Save e responsáveis

Chave: apex-idle-v2 (apesar de state.version ser 1). game.js salva a cada 10 s e em pagehide, além das ações. game/save.js aceita JSON e envelope base64, migra em cópia e valida. save() compara observedSave para detectar outra aba; cloud-model usa revisão/CAS e resolve conflito explicitamente. Ainda não há meta/checksum/FNV, tab lock por navigator.locks nem backup bak-v1 permanente. Não confundir os vários versionamentos. Nenhum save pessoal foi exportado ou alterado por esta auditoria.

### Campos raiz referenciados e consumidores/escritores candidatos

Inventário estático de referências s.campo (inclui leitura e escrita; algumas chaves são opcionais). Não é esquema fechado: dados desconhecidos são preservados pela migração. Para cada campo, os arquivos abaixo precisam ser revisados antes de mudar formato; atribuições, mutações de arrays e mutações via aliases podem escrever.

| Campo | Módulos com acesso direto |
|---|---|
|academy|academy-model.js|
|career|career-model.js, garage-state.js, missions-model.js, navigation-ui.js|
|championship|academy-model.js, championship-model.js, engine.js, game/economy.js, garage-state.js, idle-ui.js, legends-model.js, lineup-model.js, lineup-ui.js, night-model.js, night-ui.js|
|circuit|camera-view.js, career-model.js, career-ui.js, engine.js, game.js, garage.js, night-ui.js, parts-shop-model.js, parts-shop-ui.js, race-ui.js, scenery.js, traffic-view.js|
|color|camera-view.js, career-model.js, championship-ui.js, engine.js, farm-ui.js, game.js, garage-state.js, garage.js, lineup-model.js, start.js, traffic-view.js|
|equippedCar|career-ui.js, engine.js, garage-state.js, legends-model.js, lineup-model.js, parts-shop-ui.js|
|farm|farm-model.js, farm-ui.js, navigation-ui.js|
|garage|garage-state.js, lineup-model.js, navigation-ui.js|
|heritage|career-model.js, career-ui.js, garage-state.js, legends-model.js, legends-ui.js, lineup-model.js|
|idle|game/state.js, game.js, navigation-ui.js, night-model.js, progression-model.js, progression-ui.js|
|laps|camera-view.js, engine.js, game.js, immersive.js, missions-model.js, missions-ui.js, night-ui.js, race-engine.js, start.js, traffic-view.js|
|levels|engine.js, game.js, immersive.js, lineup-ui.js, missions-model.js, navigation-ui.js, night-model.js, night-ui.js, parts-shop-ui.js, progression-model.js, progression-ui.js, start.js, visual-garage.js|
|missions|missions-model.js|
|money|academy-model.js, career-model.js, career-ui.js, championship-model.js, championship-ui.js, engine.js, farm-model.js, farm-ui.js, game/economy.js, game.js, idle-ui.js, immersive.js, legends-model.js, legends-ui.js, missions-model.js, navigation-ui.js, night-model.js, night-ui.js, parts-shop-model.js, parts-shop-ui.js, progression-model.js, race-engine.js, summoning-hub.js, visual-garage.js|
|night|lineup-ui.js, night-model.js, progression-model.js|
|onboarded|engine.js, idle-ui.js, night-model.js, night-ui.js, start.js|
|ownedCars|career-model.js, engine.js, garage-state.js, missions-model.js|
|partsEquipped|missions-model.js, parts-shop-model.js, parts-shop-ui.js|
|partsInventory|missions-model.js, navigation-ui.js, parts-shop-model.js, parts-shop-ui.js|
|progress|camera-view.js, engine.js, game.js, night-ui.js, race-engine.js, race-ui.js, traffic-view.js|
|raceInProgress|game/economy.js, idle-ui.js, lineup-ui.js, night-model.js, night-ui.js, parts-shop-model.js, race-ui.js, summoning-hub.js|
|rep|engine.js, game.js, missions-model.js, navigation-ui.js, night-model.js, night-ui.js, parts-shop-model.js, parts-shop-ui.js, progression-model.js, race-engine.js, summoning-hub.js|
|running|career-model.js, career-ui.js, engine.js, game.js, garage.js, immersive.js, night-ui.js, parts-shop-model.js, race-ui.js, start.js, summoning-hub.js, tactics.js, traffic-view.js, visual-garage.js|
|savedAt|cloud-ui.js, engine.js, game/save.js, game.js|
|setup|engine.js, garage.js|
|summonHistory|engine.js, immersive.js, legends-model.js, summoning-hub.js|
|summonPity|engine.js, legends-model.js, summoning-hub.js|
|summonPoints|engine.js, legends-model.js, summoning-hub.js|
|team|engine.js, garage.js, start.js|
|testCreditsGranted|engine.js, immersive.js|
|version|engine.js|
|wishCar|engine.js, immersive.js, legends-model.js|

### Estruturas aninhadas principais

- idle: v, units, upgrades, clickLevel, cycleEarned, totalEarned, fragments, ascensions, clicks, playtime, at, achievements, settings.effects/sound/notation, seasonTitles. GameState inicializa; GameEconomy/GameTick e idle-ui alteram.
- night: v, tutorial, titles, seasonEarned, seenMoney, races, wins, records, autoERSOwned, autoERS, sponsors, lastResult(place/prize/time/points). NightLeague grava; night-ui e progression leem.
- garage: owned/equipped. GarageState escreve e espelha ownedCars, equippedCar, heritage.equipped e championship.car.
- heritage: v, owned, equipped, wish, pity(epic/legendary/mythic), history. Legends grava; lineup e UI leem.
- farm: levels, bank, at, total. IdleFarm grava e farm-ui lê.
- championship: v, tier, season, round, points, titles, levels, rep, earned, tickets, gems, roster(stars/copies), driver, engineers, pity, results, races, running, at, live, offline, daily, pass, event, lastDrop e car. Championship/Academy gravam; legends/lineup usam afinidades e escalação.
- missions: claimed/farmClaims. Missions grava e interface lê.
- career, academy, inventory e setups têm estruturas dinâmicas definidas nos respectivos modelos; mudanças exigem validação do modelo e fixture real anonimizada. O levantamento de cada chave dinâmica/leitura versus escrita via alias não está encerrado.

## Acoplamento global

Sim: padrão IIFE(root) publica APIs em window/globalThis. Apex (A no jogo), Race, NightLeague, GameState, GameEconomy, GameTick, GameSave, GarageState, Legends, Championship, Career, PartsShop e DropShowcase são compartilhados. index.html define ordem; módulos usam typeof global e fallback require nos testes. Render, save, s, race, openMenu e draw também são globais compartilhados. Mudar de scripts clássicos para export ESM diretamente quebraria esse contrato sem adaptação.

## Divergências e decisões pendentes

1. Não existem docs/doc-design.md, src/data/shop-catalog.json nem tools/sim/{balance,sim,tabelas,sim90}. A árvore remota main também não contém esses arquivos. Não inventar 167 itens, parâmetros Q ou tabelas de nomes.
2. Atual: 4 ramos, 6 voltas, pontos F1 [25,18,15,12,10,8,6,4,2,1]. Prompt: 6 ramos, 5 voltas, últimos lugares 3/2 pontos. São mudanças intencionais futuras, não bugs a corrigir nesta auditoria.
3. Atual: 24 circuitos, pilotos e carros históricos, Farm/Ascensão e campeonato paralelo. Etapas futuras pedem remoções, ficcionalização e migrações. Preservar estado até migração testada e decisão de avançar.
4. Prompt contém inconsistências numéricas a resolver com simuladores: aiLeaderPI(23) pela fórmula fornecida não bate necessariamente com 17,12; repToOpen(23) deve ser confrontado com 4952. Testes não devem falsificar resultados para atender exemplos incompatíveis.
5. Novas regras limitam publicação e pedem pausa a cada etapa; nenhuma publicação foi feita nesta auditoria.

## Validação e pendências

23 suítes existentes passaram na última verificação da versão publicada. A etapa de auditoria não migrou save nem alterou visual; compatibilidade atual coberta por testes antigos, sem teste novo de migração v2. Não foi feito commit remoto/push/deploy. Ainda faltam: medição DOM real, esquema exaustivo aninhado com leitura/escrita por alias e os documentos externos. Mapa inicial entregue para revisão; critério completo da Etapa 0 ainda depende dessas pendências e aprovação. Revelação fluida em Canvas continua pendente, sem mudanças de código já aplicadas.


## Atualização — arquivos recebidos e simulações executadas

Os oito arquivos enviados foram incorporados sem alteração de parâmetros: docs/doc-design.md, docs/diagnostico-site.md, src/data/shop-catalog.json e cinco scripts em tools/sim. A ausência dessas fontes registrada acima foi resolvida. Não houve alteração de código executado pelo jogo, save ou publicação.

- sim.mjs: pista 2 em 5,1 min; pista 5 em 38,4 min; pista 24 em 14,22 h (1 título: 7,72 h).
- sim90.mjs: F1 dia 54, Lendas dia 85; maior intervalo de compras 5,9 min; nenhuma sessão consecutiva sem compra. São resultados do modelo, não tempos medidos no jogo atual.
- tabelas.mjs: aiLeaderPI(23)=17.12318; repToOpen(23)=4952. As suspeitas sobre esses dois valores foram descartadas.
- Catálogo: 167 itens, 0 IDs duplicados, 2 campos obrigatórios ausentes. Contagem por categoria: {"componentes":24,"carros":30,"pilotos":5,"engenheiros":5,"treino":2,"boosts":9,"cosmeticos":82,"real":10}. Isso é checagem estrutural, não validação integral de efeitos/preços/limites.

### Inconsistências confirmadas para as próximas etapas

1. placeOf(1.09,0) retorna 10; a IA mais lenta tem PI 1.11280. O teste que exige P9 com 1,09 conflita com os parâmetros. Preservar os parâmetros enviados e ajustar o exemplo do teste, sem mudar o balanceamento silenciosamente.
2. A notação lista K=10^3 até Dc=10^33, mas exige 10^36=1,00Dc. Pela sequência, 10^36 seria aa. Decisão pendente antes da etapa técnica.
3. O roteiro mantém grantTestCredits sob testMode; o §20.4 pede remoção da chamada na produção. Será necessário distinguir explicitamente build de QA e produção, preservando a autorização de créditos apenas no teste.
4. A tabela de perfil não admite média <=1,05 para todos os ramos simultaneamente: Motor/Aero/Pneus têm somas 3,2/3,2/3,3 entre perfis e Piloto mínimo 1. O teste deve ser reconciliado com a tabela antes de implementar esse trecho; não normalizar os valores sem aprovação.

O diagnóstico enviado relata cerca de 1.200 mutações em 2 s. Essa é evidência fornecida no documento; a medição independente no ambiente atual continua pendente. A auditoria permanece limitada quanto ao inventário exaustivo de campos aninhados e atribuição de escrita por aliases. Não foi feita migração nem iniciado o código da Etapa 1; a animação Canvas permanece pendente.

Saídas reproduzíveis em docs/auditoria/sim.txt, sim90.txt, tabelas.txt e catalogo-validacao.json.
