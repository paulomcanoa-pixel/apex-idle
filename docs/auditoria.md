# Apex Idle: auditoria game-studio (04/11/2026)

Base: `trabalho/apex-idle/site-2026-11-04/` (96 arquivos) contra `entregas/apex-idle/doc-design.md` (02/11).
Método: leitura por trechos (Grep). Nenhum código do site foi executado. FATO = visto no código; SUPOSIÇÃO = inferido.
Limite: o snapshot não traz `vendor/`, `package.json` nem pasta de testes; não sei se o repositório real tem testes (VERIFICAR).
Linhas: vários arquivos têm código em linhas de 300 a 2300 caracteres, então "linha" é a linha do arquivo.

## 1. O que do doc-design de 02/11 já existe (FATO, por arquivo)
| Doc §  | Item | Onde está | Estado |
|---|---|---|---|
| 4 | PI, IA por pista, `repToOpen`, `paceFactor` | `src/balance.js` (P, `aiLeaderPI`, `paceFactor`), `src/progression-v2.js` | feito |
| 5 | 5 ramos da oficina + marcos x1,25 | `balance.js` linhas 8-14, `progression-v2.js:buy` | feito |
| 6 | Loja com 167 itens, preço em CR, limites diário/semanal | `src/shop.js`, `catalog.js` | feito |
| 7.1 | Temporadas e títulos | `progression-v2.js` (`newSeason`, `titlesFor`) | feito |
| 7.3 | Offline 8 h, 0,10 equipe + 0,03 corrida, aviso de relógio | `retention.js:5` | feito; falta tela "Baú de retorno" (VERIFICAR em `v2-ui.js`) |
| 8 | Save v2, migração v1->v2, chave `apex-idle-v2` | `progression-v2.js:migrate`, `game/save.js` | feito |
| 9.3 | Efeitos: pool de 12, `+X` flutuante, ripple, respeita reduced-motion | `src/effects.js` | parcial: só 3 tipos |
| 10 | Diárias, streak, baú diário, semanal, passe 40 | `retention.js:6-9,14` | feito |
| 12 | Anúncio/pagamento | `commercial.js` (`available:false`) | só stub, correto |
| 12.x | Telemetria local com consentimento | `commercial.js:record` | feito |
| 18-21 | Invocação (banners, pity), Lendas | `shop.js:summon`, `legends-*`, `summoning-hub.js` | feito |
Falta do doc: pódio animado, celebração de marco/desbloqueio, "Baú de retorno" visual, ERS com rastro, testes de balanceamento no CI (VERIFICAR).

## 2. Loop central atual
- Micro (segundos): corrida de 5 voltas (16-26 s cada), ERS na barra de espaço, clique de renda (`E.click`, 5x produção).
- Meso (minutos): prêmio (`progression-v2.js:reward`) -> comprar melhoria (custo x1,16) -> PI sobe -> posição melhora -> REP -> abre pista.
- Macro (horas): 12 estágios x 6 categorias, Nova Temporada (+8% PI, +25% CR por título), coleção de carros.
- Meta visível: REP para abrir a próxima pista; sem "faltam X" confirmado fora da tela de pista (VERIFICAR).

## 3. Economia: fontes x sumidouros (FATO, números de `balance.js`/`retention.js`)
| Moeda | Fontes | Sumidouros | Observação |
|---|---|---|---|
| CR | corrida `5*lapReward + prêmio`, Equipe (6 geradores), clique, diária (600 s de renda), baú diário (300 s), offline, drop aleatório 8%/corrida (300-900 s de renda) | melhorias, geradores, invocação, componentes | tudo medido em "segundos de renda" via `Ret.income`: bom padrão, reaproveitado no loot |
| REP | pontos por corrida | nenhum (reseta na temporada) | portão |
| Gemas | desafios (10), semanal (3), diária (2), passe | invocação (60), cosméticos, treino | catálogo prevê comprar gemas com dinheiro real (`real-gemas-1..6`, R$4,90 a R$149,90) |
| Fichas | baú diário, perfeito (1o + ERS + pit) | invocação | |
| Materiais | contratos | projetos | VERIFICAR uso |
Sem resposta clara: para onde vão gemas excedentes depois que cosméticos acabam (sumidouro esgotável).
Loop infinito: não achei compra que se pague sozinha. Estratégia dominante possível: Equipe (geradores) + offline com `returnMinHours` (VERIFICAR).

## 4. Curvas e progressão (FATO)
- Custo de melhoria `base*1,16^n`, base 50 a 260; marcos nos níveis 10/25/50/100 (x1,25).
- IA: `1,3*1,19^n` até a pista 9, depois `1,075^n`. Recompensa por volta `14*1,3^n`.
- Gerador: base 15 a 1,4M, razão 1,15, desbloqueio nas pistas 1,1,3,6,10,16.
- Risco: `commercial.js:3` aceita tuning remoto entre 0,5x e 2x de cada número; um arquivo ruim em `/tuning.json` dobra recompensas sem alerta.
- Escalas por categoria `rScale` `[1,22,480,1e4,2.3e5,5e6]`: salto de 22x a 480x; o simulador de 02/11 cobre só 1 categoria (VERIFICAR com `sim90.mjs` por categoria).

## 5. Retenção, sessão e juice
- Retorno: offline com teto de 8 h (`+shop.offlineCapHours`), diária, streak de 7 com dia de pausa, semanal, passe. Bom.
- Recompensa aleatória hoje (`retention.js:12`): 8% por corrida, só CR, pity escondido (12/30/150 corridas), sem item, sem tela, sem probabilidade visível. É o "loot" atual: invisível.
- Juice atual (`effects.js`): `+X` flutuante, ripple, círculo "negado"; canvas de tela cheia redesenhado a cada quadro; pool de 12. Nenhum momento de impacto (caixa, marco, pista nova).
- Reduced-motion: tratado em `effects.js` e em 5 CSS, mas não é global (VERIFICAR em `immersive.css`, `summoning-hub.css`).
- Cinema de invocação (`summon-cinema.js`, `drops.js`) existe mas é amarrado a carros e `<dialog>`; o novo `loot-cinema.js` é independente.

## 6. Top 10 problemas (prioridade P0 = antes de qualquer pagamento/publicação; P1 = próxima entrega; P2 = depois)
| # | Prio | Arquivo:linha | Problema | Correção |
|---|---|---|---|---|
| 1 | P0 | `catalog.js` (itens `real-gemas-*`), `shop.js:33`, `shop.js:19` | Gemas compráveis com dinheiro real e a invocação aceita gemas (`currency==='gemas'`, custo 60): vira caixa de recompensa paga. ECA Digital art. 2º IV e art. 20 (ver prompt, Conformidade). Hoje está desligado (`commercial.js:8`, `shop.js:19`) | Antes de ligar pagamentos: gemas pagas numa carteira separada que não compra sorteio, ou remover `gemSummon` para gemas pagas; teste que impede |
| 2 | P1 | `retention.js:12` | Drop aleatório escondido, sem item e sem odds; `Math.random` por padrão | Substituir por `ApexLoot.onRace` + caixa Online (etapas 2-4) |
| 3 | P1 | `retention.js:5` | Offline só entrega CR; sem objeto "recompensa" para comemorar a volta | Caixa AFK alimentada por `seconds` (`ApexLoot.creditAway`) |
| 4 | P1 | `shop.js:33`, `v2-ui.js:6-7,51`, `retention.js:12` | Linhas de 1,5 a 2,3 mil caracteres: ilegíveis e intestáveis (viola a regra de arquivo legível) | Reformatar só o que for tocado; um teste por função extraída |
| 5 | P1 | `effects.js:8,35` | Efeitos pobres: só 3 tipos, pool 12, canvas limpo inteiro por quadro | Reusar `loot-cinema.js` para momentos de impacto; fila de eventos de juice |
| 6 | P1 | `v2-ui.js:51` e mais 4 | `panel.innerHTML=html` em tela grande; se algum texto vier do save/nuvem, risco de XSS | Auditar cada interpolação; usar `textContent` ou escapar |
| 7 | P2 | `career-ui.js:64`, `championship-ui.js:37`, `cloud-ui.js:28-29`, `farm-ui.js:26`, `legends-ui.js:46`, `night-ui.js:65`, `v2-ui.js:114` | 8 `setInterval` independentes (1 s cada em vários) | Unificar no `render-scheduler.js` existente; pausar com `document.hidden` |
| 8 | P2 | `commercial.js:3` | Faixa 0,5x a 2x do tuning remoto sem assinatura ou limite por chave de recompensa | Faixa por chave (ex.: recompensas até 1,25x) e log visível |
| 9 | P2 | `v2-adapter.js:8-45` | Adaptador reescreve funções globais (`A.*`, `N.*`, `E.*`, `T.*`) em tempo de carga: ordem de `<script>` vira lei | Mapa de dependências na Etapa 0; evitar nova camada igual |
| 10 | P2 | `shop.js:33` | `summon` clona o save inteiro (`JSON.parse(JSON.stringify(s))`) a cada giro x10 | Clonar só `s.shop.pity` e carteiras |

## 7. Veredito de balanceamento (balance-check)
Entradas: ACHADA `balance.js`, `tuning.json`, `sim*.mjs` (02/11); AUSENTE metas de sessão medidas com jogadores.
- CRÍTICO: nenhum no código de números. Risco de conformidade (#1) tratado como P0.
- ATENÇÃO: rScale 22x-480x sem simulação por categoria; tuning remoto sem faixa por chave.
- Loot novo (simulado em `loot-model.test.mjs`, income = 1 CR/s, escala linear): Online injeta ~307 s de renda por hora ativa (8,5% do que se ganha jogando; teto de projeto 10%); AFK injeta ~46-52 s por hora fora. SAUDÁVEL dentro das metas escritas; depende de medir com a renda real (`Ret.income`) na Etapa 5.
- NÃO AVALIADO: efeito dos itens de PI do loot (teto +3%) na curva de posição; rodar `sim90.mjs` com +3% de PI.

## 8. O que não foi verificado
Site em execução, saves reais, testes existentes no repositório, `v2-ui.js` inteiro, desempenho real em celular.
