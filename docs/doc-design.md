# Apex Idle 1.0 – Documento de design e plano técnico

Data: 2026-11-02. **Leitura em ordem:** os §1 a 17 formam a base (economia de uma categoria de 24 pistas, provada no simulador). Os §18 a 21 (adicionados depois, a pedido do dono) acrescentam camadas de longo prazo, catálogo da loja e achados técnicos; onde houver conflito, **os §18 a 21 valem**. Base: site publicado (https://apex-idle.vercel.app, "Protótipo 0.3"), diagnóstico em `trabalho/apex-idle/diagnostico-site.md` e leitura do código público (texto, nunca executado). Este documento NÃO implementa nada: quem implementa é o Codex, no repositório do dono. Os números foram provados num simulador próprio (`trabalho/apex-idle/sim/`, arquivos `balance.mjs`, `sim.mjs`, `tabelas.mjs`, saídas `resultado.txt` e `tabelas.txt`).

Convenção: **[SUPOSIÇÃO]** = não vi no site ou no código, assumi para decidir. **[VERIFICAR]** = confirmar no repositório real ou com o dono.

---

## 1. Resumo executivo

1. **Causa-raiz do travamento.** O jogador começa com 12,7 s/volta na tela e a IA mais lenta faz 11,9 s (`night-model.js: grid()` = `time*.15*(.88+i*.03)/(1+rep/18000)`). Cada nível de motor dá só 2,7% e o custo cresce ×1,55 (`engine.js: cost`). Terminar P10 vale 1 ponto e a pista 2 pede 30. Logo, ~30 corridas (~40 min) sem sentir melhora. A IA também ignora o poder do jogador: só depende da pista.
2. **Correção em uma frase.** Trocar "tempo de volta absoluto" por um **Índice de Poder (PI)** do carro, comparado com o PI da IA de cada pista, de modo que cada upgrade comprado mude a posição de forma visível, e a REP (pontos) abra as pistas com um ritmo planejado.
3. **Moedas.** Visíveis no início: só CR e REP. Títulos (prestígio), Materiais e Gemas entram por desbloqueio. Fragmentos e Ascensão deixam de existir como sistema (viram um bônus herdado oculto). Um único prestígio: **Nova Temporada**.
4. **Resultado da simulação (jogador ativo, sem Loja, sem offline):** pista 2 em 5,1 min; pista 3 em 22 min; pista 5 em 38 min; pista 10 em 1,6 h; pista 24 em 14,2 h de jogo ativo (7,7 h na segunda temporada com 1 título). Antes: ~40 min só para a pista 2.
5. **Escopo comercial.** Monetização ética (anúncio recompensado opcional, passe, cosméticos, remover anúncios), retenção (diárias, streak, missões, GP semanal), PWA, analytics, ajuste remoto de balanceamento, i18n. Nada de pagar para vencer.

---

## 2. Estado atual (diagnóstico + código)

### 2.1 O que o site faz hoje
- Telas: Pista (corrida 2D, 6 voltas, 9 IAs, ERS na barra de espaço 5 s/recarga 30 s), Carro, Equipe, Campeonato, Loja, menu "Mais".
- Save: `localStorage['apex-idle-v2']`, objeto `{version:1, money, laps, rep, levels[4], circuit, progress, running, savedAt, ...}` mais subobjetos `garage, career, farm, championship, heritage, academy, summonPity, idle, night, onboarded, raceInProgress`. O validador (`engine.js: validSave`) é rígido: rejeita qualquer save com `version!==1` ou `levels.length!==4`. Qualquer mudança de formato **precisa** de migração ou o jogador perde tudo (o `save.js: load` devolve erro e só guarda cópia).

### 2.2 Achados no código (arquivos do site publicado)
| Tema | Onde | Fato |
|---|---|---|
| Corrida | `race-engine.js`, `night-ui.js` | `Race.start(duration, {night:true, laps:6})`; duração de volta na tela = `max(4, A.duration(s)*.15)`. A IA tem `pace = c.time*.15*(.88+i*.03)/(1+rep/18000)`. |
| Melhorias | `engine.js` | 4 itens: Motor 100, Aero 140, Pneus 120, Patrocínio 180; custo `ceil(base*1.55^n)`; máx. 100; `duration = time*(1 + setupPenalty + .20/(1+dev*5))` com `dev = n0*.08 + n1*.06 + n2*.05 + bônus carro + (peças-1)`. O teto de ganho das melhorias é só 20% do tempo base: nem zerando o custo o jogador alcança o líder da IA (0,88 do tempo base). |
| Recompensa | `engine.js: reward` | `floor(45*(time/16)*mult*(1+lv3*.3)*(1+bônus carro)*bônusTítulo*renda)`. Em Interlagos dá ~198 CR/volta (calculado da fórmula; **[VERIFICAR]** no jogo, o diagnóstico só viu o prêmio de 118 CR do resultado). Prêmio final: `floor(reward*(11-posição)*.6)`. |
| Pontos | `night-model.js` | Pontos F1 [25,18,15,12,10,8,6,4,2,1] vão para `s.rep`. Voltas em modo noturno não somam REP (`s.rep += r.night ? 0 : laps`). |
| Pistas | `circuits-data.js` | 24 pistas, REP para abrir: 0, 30, 100, 150, 200, … +50 até 1150; `mult` de renda 1, 2,3, 4,8, 5, … 15. Tempo de volta real 67,9 s a 104,7 s. |
| Idle | `game/economy.js` | 6 geradores (base 15 a 1,4 M; produção 0,1 a 1400/s), custo ×1,15^n, 4 marcos (10/25/50/100) dobram, clique `2^clickLevel`. Ascensão: fragmentos `floor(sqrt(cycleEarned/1e6))`, +2% cada, reseta só a renda idle. |
| Offline | `game/tick.js` | até 8 h a 80% da produção dos geradores. Só geradores contam; corrida e Farm não. |
| Nova temporada | `night-model.js: newSeason` | Títulos `floor(sqrt(seasonEarned/1.5M))`, +25% de renda cada; reseta dinheiro, níveis e geradores. Concorre com a Ascensão. |
| Peças | `parts-shop-model.js` | 6 categorias × 3 níveis (Club 250/Pro 1400/Elite 8500 CR, REP 0/25/100); `factor` usa pesos por pista só para índices 0 a 2 (`[..][s.circuit] || padrão`) – bug de dado: da pista 4 em diante vale o padrão. |
| Gacha | `engine.js` | 200 CR por giro, taxas Comum 49,4%, Raro 35%, Épico 15%, Lendário 0,5%, Mítico 0,14%; pity 10 (épico) e 200 (lendário); bônus de carro 3% a 22%. Taxas existem no código; **[VERIFICAR]** se aparecem na tela. |
| Farm | `farm-model.js` | 3 operações, banco acumula até 8 h, coletar. Duplica o offline. |
| Câmera | `camera-view.js` | zoom 2,5 a 10 (padrão 5×, seguindo o carro); botão alterna para "Pista inteira" (escala `min(w/1000,h/580)/layout.scale`). |
| Menu | `navigation-model.js` | 5 áreas, 20 seções. "Circuitos" está em Campeonato, "Melhorias" e "Peças" em Carro, "Invocação" em Loja. |

### 2.3 Problemas (do diagnóstico, com causa-raiz)
| Sintoma | Causa-raiz |
|---|---|
| Pista 2 em ~40 min | REP é a trava; P10 vale 1 ponto; posição não melhora porque o ganho máximo de melhorias (20%) é menor que a distância ao pelotão; IA independe do jogador. |
| Moedas demais | CR, REP, Gemas, Fragmentos, Pontos de invocação, Peças, Títulos: 7 contadores, 2 prestígios. |
| Melhorias confusas | Modelo com 4, oficina com 3 + ERS; Patrocínio escondido; Peças em tela à parte com bug de pesos. |
| Loja dispersa | Gacha na Loja, peças em Carro, circuitos em Campeonato, ERS na Oficina. |
| "Melhorar carro" no resultado só fecha | Handler não navega para a oficina (corrigir: abrir Oficina com a melhor compra pré-selecionada). |
| Corrida rápida demais | Volta de 12,7 s na tela (6 voltas = 76 s) e câmera próxima demais. |

### 2.4 Não verificado
Telas internas (Campeonato, PvP, GP semanal, Álbum, Projetos, Contratos, Farm, Ascensão, Invocação, Patrocínio, Peças): o diagnóstico ainda não trouxe a seção "Telas internas" (no momento da escrita ela é só a nota "não foram abertas"). Onde este documento assume comportamento dessas telas, está marcado. O Codex deve confirmar no repositório (Etapa 0).

---

## 3. Loop principal e simplificação de sistemas

### 3.1 Loop (30 s a 2 min)
```
Corrida (5 voltas, ~107 s no começo) -> CR por volta + prêmio por posição + REP (pontos F1)
   -> gastar CR em Melhorias (Oficina) -> PI sobe -> posição melhora
   -> REP abre a próxima pista -> mais CR por volta, IA mais forte
Em paralelo: Equipe (geradores) rende CR/s passivo; offline paga enquanto fora.
Longo prazo: Nova Temporada (prestígio) -> títulos -> recomeçar mais forte e mais rápido.
```
Corrida recomeça sozinha em 2 s (comportamento atual, mantido). O jogador "decide" onde gastar CR, quando usar o ERS, qual pista correr e quando fazer a Nova Temporada.

### 3.2 Moedas: o que unificar, esconder, cortar
| Hoje | Decisão | Motivo |
|---|---|---|
| CR | **Mantém**, única moeda de gasto do jogo base | Tudo (melhorias, geradores, giros, componentes) em CR. |
| Pontos/REP (`s.rep`) | **Mantém**, vira "Reputação", barra de progresso, nunca gasta | É o gate de pistas. |
| Títulos (Nova Temporada) | **Mantém**, único prestígio | Ver §7. |
| Fragmentos (Ascensão) | **Corta o sistema**; valor existente vira bônus herdado `legacy` (oculto, sem tela) | Evita dois prestígios e não tira poder de quem já tem. |
| Gemas | **Esconde** até a pista 8 (Campeonato). Passam a ser a moeda de **cosméticos/passe** (ganha de graça por missões; comprável por dinheiro real) | Nunca compra poder. |
| Pontos de invocação (duplicatas) | **Esconde** dentro do Banner da Loja; só aparece após a primeira duplicata, com o nome "Pontos de coleção" | Reduz ruído. |
| Peças (materiais de Contratos/Projetos) | Renomear "**Materiais**"; aparece na pista 6 | Evita confusão com Componentes (equipamento). |
| Peças de equipamento (`parts-shop`) | Renomear "**Componentes**"; vão para a Loja | Idem. |
| Farm idle | **Corta**; banco acumulado vira CR no primeiro carregamento (cap 8 h de produção) | Duplica offline e Equipe. |
| Geradores (Equipe) | **Mantém** como renda passiva, com 2 visíveis no início e os demais por pista (§6.4) | Mantém identidade idle sem competir com a corrida. |
| Clique | Mantém, mas valor = máx(1, 5 s de produção da Equipe) para não ficar inútil nem dominante | Feedback tátil + efeito flutuante. |
| Patrocínio | Passa a ser o 6º ramo da árvore (renda de corrida) | Hoje só aparece em "Melhor compra". |
| "Patrocínio" da Loja (6 metas com prêmio) | Vira "Metas de patrocinadores" dentro de Missões (Pista) | É conteúdo de meta, não de loja. |

Moedas visíveis por fase: 0 a 10 min: CR e REP. Pista 2: + Equipe. Pista 6: + Materiais (Contratos/Projetos). Pista 8: + Gemas (Campeonato). Pista 12: + Títulos (botão Nova Temporada).

### 3.3 Unificar sistemas sobrepostos
- **Ascensão x Nova Temporada:** fica só Nova Temporada (§7).
- **Geradores idle x corrida:** a corrida paga mais cedo; a Equipe cresce com o tempo, e o offline paga 10% da Equipe mais 3% da renda de corrida (§7.3, calibrado na simulação de 90 dias, §18.7). Assim a renda passiva é secundária no início e relevante depois.
- **Níveis soltos** ("online", "operação 0/30", "0/200"): substituídos por três barras claras: REP (pista), Pista atual, Temporada.

---

## 4. Progressão de níveis (pistas) e IA

### 4.1 Modelo
**PI do jogador:**
```
PI = (1 + Σ_ramos efeito(ramo)) × (1 + bônusCarro) × (1 + bônusComponentes) × (1 + 0,08 × títulos)
efeito(ramo) = k_ramo × nível × marco(nível)          marco = 1,25^(nº de marcos atingidos em 10/25/50/100)
bônusCarro   ∈ [0, 0,22]  (gacha, valores atuais .03 .06 .10 .15 .22)
bônusComponentes ∈ [0, 0,15] [SUPOSIÇÃO: teto do `factor` atual com peças Elite; ajustar]
```
**PI da IA na pista n (n=0 é Interlagos):**
```
PI_líder(n) = 1,30 × 1,19^min(n, 9) × 1,075^max(0, n−9)
PI_vaga(i)  = PI_líder × (1 − 0,018 × i),  i = 0 (líder) .. 8   -> 9 rivais
```
**Ritmo na tela** (segundos por volta, ver §9):
```
voltaBase(n)  = clamp(0,25 × tempoRealVolta(n), 16, 26) s       (hoje: 0,15×, ~12,7 s)
fatorRitmo    = clamp((PI / PI_líder(n))^0,5, 0,80, 1,35)
voltaCarro    = voltaBase(n) / fatorRitmo        (o líder da IA faz voltaBase)
```
Início: PI=1,0 em Interlagos: volta 20,1 s, corrida de 5 voltas ≈ 107 s (com contagem/resultado). A IA mais lenta (PI 1,11) faz 18,6 s: o jogador perde ~1,5 s por volta e termina P10 a ~8 s do último. O fator ao quadrado-raiz comprime as diferenças visuais (o carro mais forte não vira míssil) e mantém a corrida legível.

**Ordem de chegada:** simulada por tempos de volta acumulados. Cada IA ganha "forma do dia" aleatória ±1,5% por corrida (semente salva no resultado para reproduzir teste). A posição esperada é determinística (`placeOf`), o sorteio só embaralha vizinhos.

**REP por corrida:** pontos F1 `[25,18,15,12,10,8,6,4,3,2]` (P9=3 e P10=2, antes 2 e 1). **REP para abrir a pista n (n≥1):** `round(5 × n^2,2)`.
Pistas já abertas continuam acessíveis; o jogador pode correr em qualquer uma (padrão: a mais alta).

### 4.2 Recompensa em CR
```
CR_volta(n)  = floor(14 × 1,30^n)         (hoje 45×time/16×mult: 198 em Interlagos; ver nota abaixo)
prêmio       = floor(CR_volta × (11 − posição) × 0,6)       (fórmula atual mantida)
CR_corrida   = (5 × CR_volta + prêmio) × (1 + efeito patrocínio) × (1 + 0,25 × títulos)
```
Nota: a recompensa inicial cai de ~198 para 14 CR/volta porque os custos de melhoria também caem (50 CR no primeiro nível, antes 100). O que importa é a razão custo/renda, que foi calibrada no simulador. **Quem já tem save**: o CR guardado não é convertido, o que dá vantagem pontual a saves antigos (aceito, §8.3).

### 4.3 Tabela das 24 pistas (resultado de `tabelas.mjs`)
Volta na tela = segundos do líder da IA. CR/volta antes de multiplicadores.

| # | Pista | Volta tela | CR/volta | PI líder IA | PI último | REP p/ abrir |
|---|---|---|---|---|---|---|
| 1 | Interlagos | 17,6 | 14 | 1,30 | 1,11 | 0 |
| 2 | Barcelona-Catalunya | 18,9 | 18 | 1,55 | 1,32 | 5 |
| 3 | Bahrain | 22,9 | 23 | 1,84 | 1,58 | 23 |
| 4 | Albert Park | 20,0 | 30 | 2,19 | 1,88 | 56 |
| 5 | Shanghai | 23,1 | 39 | 2,61 | 2,23 | 106 |
| 6 | Suzuka | 22,7 | 51 | 3,10 | 2,66 | 172 |
| 7 | Jeddah | 22,7 | 67 | 3,69 | 3,16 | 258 |
| 8 | Miami | 22,4 | 87 | 4,39 | 3,76 | 362 |
| 9 | Gilles-Villeneuve | 18,3 | 114 | 5,23 | 4,47 | 485 |
| 10 | Mônaco | 18,2 | 148 | 6,22 | 5,33 | 628 |
| 11 | Red Bull Ring | 17,0 | 193 | 6,69 | 5,72 | 792 |
| 12 | Silverstone | 21,8 | 250 | 7,19 | 6,15 | 977 |
| 13 | Spa-Francorchamps | 26,0 | 326 | 7,73 | 6,62 | 1184 |
| 14 | Hungaroring | 19,2 | 424 | 8,31 | 7,11 | 1411 |
| 15 | Zandvoort | 17,8 | 551 | 8,93 | 7,65 | 1661 |
| 16 | Monza | 20,2 | 716 | 9,60 | 8,22 | 1934 |
| 17 | Madrid | 23,9 | 931 | 10,32 | 8,83 | 2229 |
| 18 | Baku | 25,8 | 1,2k | 11,10 | 9,50 | 2547 |
| 19 | Marina Bay | 23,5 | 1,6k | 11,93 | 10,21 | 2888 |
| 20 | COTA | 24,0 | 2,0k | 12,82 | 10,98 | 3253 |
| 21 | Hermanos Rodríguez | 19,4 | 2,7k | 13,78 | 11,80 | 3641 |
| 22 | Las Vegas | 23,3 | 3,5k | 14,82 | 12,68 | 4054 |
| 23 | Lusail | 20,6 | 4,5k | 15,93 | 13,63 | 4491 |
| 24 | Yas Marina | 21,4 | 5,8k | 17,12 | 14,66 | 4952 |

Observação: o tempo de volta na tela varia com o traçado real, de 17 s (Red Bull Ring) a 26 s (Spa). Isso dá variedade sem mexer no motor.

### 4.4 Tempo-alvo e resultado da simulação
Política simulada ("jogador ativo", conservadora): corre sem parar na pista mais alta; antes de cada corrida compra geradores com retorno ≤ 480 s e ≤ 35% do caixa, e o resto em melhorias pelo menor custo por efeito; **não** usa gacha nem componentes (bônus de até +37% de PI que dão margem), **não** conta offline, **não** usa ERS. Tempos são de **jogo ativo**.

| Pista aberta | Alvo | Simulado | Corridas | Posição na corrida que abriu | Níveis M/A/Pn/Pi/Pit |
|---|---|---|---|---|---|
| 2 | 5 a 8 min | **5,1 min** | 3 | P10 | 3/0/0/0/0 |
| 3 | 15 a 25 min | 22,2 min | 12 | P9 | 8/4/0/0/0 |
| 4 | 30 a 40 min | 34,8 min | 18 | P1 | 14/11/6/0/0 |
| 5 | 35 a 45 min | **38,4 min** | 20 | P1 | 16/13/8/2/0 |
| 8 | ~1,2 h | 75 min | 38 | P1 | 28/25/20/14/10 |
| 10 | ~1,6 h | **1,63 h** | 51 | P1 | 35/32/27/21/17 |
| 12 | ~2,4 h | 2,41 h | 80 | P1 | 43/39/35/30/25 |
| 15 | ~4 h | 3,88 h | 123 | P1 | 51/48/44/39/34 |
| 20 | ~7 h | 6,96 h | 215 | P2 | 62/59/55/51/48 |
| 24 | 12 a 16 h | **14,2 h** | 435 | P6 | 74/71/68/65/61 |

Posição média por pista (jogador ativo, referência de "alcançável com upgrades"): pista 1 P10; 2 P9,9; 3 P6,7; 4 P2; 5 P4; 6 P4,9; 7 P2,8; 8 P1,6; 9 P2,4; 10 P5,1; 11 P3,5; 12 P3,1; 13 P4; 14 P1; 15 P1,9; 16 P1,3; 17 P3; 18 P2,6; 19 P3,1; 20 P3,8; 21 P4,9; 22 P6,2; 23 P7,5; 24 P9,8.
Leitura: o jogador vive entre P1 e P5 no miolo (sensação de poder), com um "degrau" na pista 3 (primeiro desafio real) e um **muro** nas pistas 22 a 24 que pede a segunda temporada.

Temporada 2: com 1 título a pista 24 sai em 7,7 h; com 2 títulos, 6,1 h. Nova Temporada na pista 12 (2,4 h) com 1 título totaliza 2,4 + 7,7 = 10,1 h para a pista 24, menos que 14,2 h sem prestígio: prestigiar compensa sem ser obrigatório.

**Limites do modelo** (não verificado): o simulador é determinístico (sem forma do dia, sem ERS, sem pit stop), usa só a política descrita, e a conta do `tempo` é puramente de corridas; a Loja e o offline só aceleram, o que o torna um teto de lentidão. Antes de lançar, validar com jogadores reais e ajustar via JSON de tuning (§15).

### 4.5 Desbloqueio de telas por pista
| Pista (REP) | Libera |
|---|---|
| 1 | Pista, Oficina (Motor, Aero, Pneus, Patrocínio), Missões |
| 2 (5) | Equipe (2 primeiros geradores), Pilotos |
| 3 (23) | Piloto e Pit Stop na Oficina |
| 4 (56) | Loja: Invocação de carros e Componentes |
| 6 (172) | Contratos e Projetos (Materiais) |
| 8 (362) | Campeonato, GP semanal, Gemas |
| 10 (628) | PvP Ranked (carros normalizados) |
| 12 (977) | Nova Temporada |
| 17 (2229) | 6º gerador |
Cada nova tela chega com um aviso de uma linha ("Desbloqueado: Campeonato") e um ponto de atenção na barra inferior.

---

## 5. Árvore de upgrades (Oficina)

### 5.1 Ramos
| Ramo | Índice em `levels` | k (PI por nível) | Custo base | Efeito extra de jogo [SUPOSIÇÃO de design] |
|---|---|---|---|---|
| Motor | 0 | 0,030 | 50 | Velocidade nas retas; mantém o texto atual |
| Aerodinâmica | 1 | 0,026 | 75 | Curvas; ganho de ritmo nas pistas "sinuosas" |
| Pneus | 2 | 0,020 | 110 | Desgaste menor: a janela do composto sobe 5% a cada 10 níveis |
| Piloto | 4 | 0,014 | 180 | ERS: duração 5 s -> 8 s (nível 25) e recarga 30 -> 20 s (nível 50) |
| Pit stop | 5 | 0,010 | 260 | Tempo de box 4 s -> 2,5 s (distribuído nos níveis 10/25/50) |
| Patrocínio | 3 | +0,10 de renda por nível | 120 (g=1,17) | Multiplica CR de corrida (não o PI) |

(Índices 0 a 3 mantêm a ordem do save atual: Motor, Aero, Pneus, Patrocínio; Piloto e Pit stop entram nos índices 4 e 5.)

Custo do nível L (de L−1 para L): `ceil(base × 1,16^(L−1))`; Patrocínio usa 1,17. Máximo 100 (igual ao validador atual). Marcos 10/25/50/100 multiplicam o efeito acumulado do ramo por 1,25 cada (efeito acumulado: o salto é visível na hora da compra).

### 5.2 Tabelas (de `tabelas.txt`)
Custo do nível indicado / custo total acumulado / efeito de PI acumulado do ramo (já com marco).

| Ramo | Nível 1 | Nível 5 | Nível 10 | Nível 25 | Nível 50 |
|---|---|---|---|---|---|
| Motor | 50 / 50 / +3% | 91 / 346 / +15% | 191 / 1,1 k / +38% | 1,8 k / 12,5 k / +117% | 72 k / 522 k / +293% |
| Aero | 75 / 75 / +3% | 136 / 517 / +13% | 286 / 1,6 k / +33% | 2,6 k / 18,7 k / +102% | 108 k / 783 k / +254% |
| Pneus | 110 / 110 / +2% | 200 / 759 / +10% | 419 / 2,4 k / +25% | 3,9 k / 27,4 k / +78% | 158 k / 1,15 M / +195% |
| Piloto | 180 / 180 / +1% | 326 / 1,2 k / +7% | 685 / 3,8 k / +18% | 6,3 k / 44,9 k / +55% | 259 k / 1,88 M / +137% |
| Pit stop | 260 / 260 / +1% | 471 / 1,8 k / +5% | 989 / 5,5 k / +13% | 9,2 k / 64,8 k / +39% | 375 k / 2,71 M / +98% |
| Patrocínio | 120 / x1,10 | 225 / x1,50 | 494 / x2,25 | 5,2 k / x4,91 | 263 k / x10,77 |

Leituras: o primeiro nível de motor custa 50 CR e já muda o PI de 1,00 para 1,03 (antes −2,7% de tempo: parecido, mas agora o Motor 3 abre a pista 2). A relação "custo de um nível / custo total" é constante (1,16), então os gastos cumulativos explodem pelo nível 50 (0,5 a 2,7 M por ramo) e quase ninguém chega ao 100 na primeira temporada (nível 100 custa ~10^8). O simulador termina com níveis 61 a 74 na pista 24.

### 5.3 Regras de UX da Oficina
- Seletor ×1/×10/Máx (já existe) mantido; cada cartão de ramo mostra: nível, efeito atual e próximo (`+3% PI -> +6%`), custo, impacto em posição estimada ("P10 -> P9 na pista atual", usando `placeOf`), e o próximo marco.
- "Melhor compra" usa o menor custo por PI, incluindo Patrocínio e Equipe (reaproveitar `progression-model.js: best`).
- Botão "Melhorar carro" do resultado da corrida abre a Oficina com a melhor compra destacada (correção do bug do diagnóstico).
- Mostrar o PI do jogador e o PI do líder da IA da pista atual em uma barra comparativa ("Você 1,34 / Líder 1,55"). É o que torna o progresso legível.

---

## 6. Loja

### 6.1 Onde fica cada coisa
**Loja** (aba inferior), seções: *Carros (Invocação)*, *Componentes*, *Automação (ERS automático)*, *Cosméticos*, *Premium* (passe, remover anúncios). **Circuitos não ficam na Loja**: são o seletor de pistas na tela Pista (desbloqueio por REP, não por CR) [decisão de design: a Loja vende poder lateral; pistas são progresso]. As "metas de patrocinadores" saem da Loja e vão para Missões.

### 6.2 Itens e preços (em CR, ajustados à pista)
| Item | Preço | Desbloqueio | Efeito |
|---|---|---|---|
| Giro de carro | `40 × CR_volta(pista mais alta)` (350 CR a 145 k CR), x10 com o mesmo preço por giro | pista 4 | Carro novo (bônus +3% a +22% de PI); pity 10/200 mantidas; taxas visíveis |
| Carro direto (Pontos de coleção) | Vento 100, Scarlatto 300, Solar 800, Eclipse 4000, Zenith 15000 pontos (valores atuais) | após 1ª duplicata | Compra garantida sem sorte |
| Componente Club/Pro/Elite | `3 × / 17 × / 100 ×` o custo de uma corrida da pista 1 da faixa, na prática 250 / 1400 / 8500 CR escalados por `rg^(pista_mínima)`; [SUPOSIÇÃO] | REP 0 / 25 / 100 (valores atuais, reajustar para a nova tabela de REP: Club pista 4, Pro pista 7, Elite pista 11) | Até +15% de PI somados; peso por pista 24 pistas (corrigir bug) |
| ERS automático | 25.000 CR (atual) -> `150 × CR_volta(pista 8)` ≈ 13 k CR [SUPOSIÇÃO] | pista 6 | Aciona o ERS sozinho no melhor momento |
| Pintura/capacete | Gemas ou R$ | pista 4 | Só cosmético |
| Passe de Temporada | R$ | pista 3 | Ver §12 |

**Gacha, corrigindo o excesso:** o preço de 200 CR fixo vira irrisório depois da pista 6; indexar à pista evita inflação e mantém "um giro ≈ 6 corridas" (CR de 5 voltas + prêmio ≈ 6,3 × CR_volta). Taxas exibidas ao lado do botão e no histórico; pity visível ("Épico garantido em 4 giros"). Sem moeda real envolvida no gacha (só CR), o que reduz o risco regulatório (§12.4).

### 6.3 Regras anti-confusão
- A Loja só mostra o que o jogador pode ver agora: itens futuros aparecem como silhueta com "Pista 7" e nada mais.
- Cada compra mostra o impacto em linguagem de jogo ("+6% PI, você sobe de P7 para P6 em Bahrain").
- Compra ≥ 50% do caixa pede confirmação de um toque.

### 6.4 Equipe (geradores) – regras
Mantém `generators` atuais (bases 15 a 1,4 M, produção 0,1 a 1400/s, custo ×1,15^n). Aparecem: 2 primeiros na pista 2, o 3º na pista 4, o 4º na 7, o 5º na 11, o 6º na 17. Marcos 10/25/50/100 dobram. Pistas altas dão ao dono o poder de comprar grandes lotes; o seletor ×1/×10/×100/Máx continua.

---

## 7. Prestígio, temporadas, offline

### 7.1 Nova Temporada (único prestígio)
- Libera ao concluir o Kart (estágio global 12; ver §18, que substitui o desenho de 24 pistas em uma só categoria). Botão "Encerrar temporada" mostra o ganho antes de confirmar.
- **Títulos ganhos** `= floor((estágioGlobalMaisAlto − 8) / 4)`, com estágio global 1 a 72 (6 categorias × 12 etapas; §18.1): estágio 12 = 1, 24 = 4, 36 = 7, 72 = 16. Cumulativo na conta. Fórmula baseada em progresso (não em CR gasto), mais fácil de explicar que a raiz quadrada atual.
- **Cada título:** +25% de CR de corrida e de Equipe, +8% de PI. Efeito mostrado no topo ("Temporada 2 · 1 título").
- **Reinicia:** CR, níveis das melhorias, geradores, REP (volta a 0 e pistas voltam a bloquear), componentes equipados. **Mantém:** carros, cosméticos, pilotos, títulos, conquistas, recordes de volta, Gemas, passe, `legacy`.
- Motivo de reiniciar REP: a segunda corrida pelas 24 pistas é mais rápida (7,7 h com 1 título) e previsível; sem isso o jogador teria PI baixo em pista alta e o ritmo quebraria.
- A Ascensão deixa de existir. Quem tinha fragmentos mantém `legacy = 1 + 0,02 × fragmentos` multiplicando a Equipe, sem tela.

### 7.2 Migração de títulos antigos
Os títulos atuais (`night.titles`) são mantidos como estão (cada um já valia +25%). O novo título soma +8% de PI, benefício concedido retroativamente. Não há perda.

### 7.3 Offline
- Teto de 8 h (12 h com passe premium) [SUPOSIÇÃO de design].
- `ganhoOffline = min(horas, teto) × 3600 × (0,10 × produçãoEquipe + 0,03 × CR/s de corrida na etapa atual)` (o 0,8 do jogo atual foi reduzido: na simulação de 90 dias, 80% deixava o jogador em P1 em 100% das corridas e tornava o CR irrelevante; ver §18.7). Apresentado ao jogador como "Baú de retorno", onde CR/s de corrida = `CR_corrida(PI atual, posição esperada) / duração`. **REP não é concedida offline** (preserva o valor da sessão ativa).
- Na volta, tela "Bem-vindo de volta": tempo fora, CR ganho, botão "Dobrar (anúncio)" (§12). Se a Equipe e a corrida somam 0 (jogador novo), a tela nem aparece (vazio ≠ zero: se há valor, mostra; se não há, silencia).
- Sem relógio do servidor, o relógio do aparelho pode ser adiantado: aceitar com teto (8 h) e registrar anomalias (retrocesso de relógio zera o ganho e loga o evento).

---

## 8. Estrutura de dados e migração

### 8.1 Estado novo (JSON). Chave `localStorage['apex-idle-v2']` **mantida**; `version: 2`.
```json
{
  "version": 2,
  "money": 150, "rep": 0, "laps": 0,
  "maxCircuit": 0, "circuit": 0,
  "levels": [0,0,0,0,0,0],
  "season": { "n": 1, "titles": 0, "seasonStartedAt": 0 },
  "legacy": 1,
  "idle":  { "v": 1, "units": [0,0,0,0,0,0], "upgrades": [0,0,0,0,0,0], "clickLevel": 0, "at": 0, "totalEarned": 0, "settings": {} },
  "race":  { "running": false, "progress": 0, "records": {}, "history": [] },
  "garage": {}, "career": {}, "championship": {}, "heritage": {}, "academy": {},
  "summonPity": {}, "ownedCars": ["aurora"], "partsInventory": [], "partsEquipped": {},
  "meta": { "createdAt": 0, "savedAt": 0, "migratedFrom": 1, "checksum": "", "clockWarnings": 0 },
  "daily": { "day": 0, "streak": 0, "claimed": [], "missions": [] },
  "monetization": { "adsRemoved": false, "pass": { "season": 0, "premium": false, "tier": 0 }, "cosmetics": [], "adCooldowns": {} },
  "consent": { "analytics": null, "ads": null, "version": 0 },
  "onboarding": { "step": 0, "done": false }
}
```
Campos antigos não listados (`garage`, `career`, `championship`, `heritage`, `academy`, `summonPity`, etc.) **permanecem como estão** para não quebrar os módulos que o Codex não vai tocar. **[VERIFICAR]** todos os campos reais no repositório antes de fechar o schema.

### 8.2 Migração v1 -> v2 (função `migrateV1toV2`)
Entrada: save com `version:1` (ou o formato exportado `{format:'apex-idle'}` que já passa por `GameSave.migrate`).
1. **Backup obrigatório:** antes de escrever, gravar o texto bruto original em `localStorage['apex-idle-v2.bak-v1']` (se ainda não existir; nunca sobrescrever, nunca apagar sem o dono pedir). Se o `localStorage` falhar, abortar a migração e manter o save antigo.
2. `levels`: `[l0,l1,l2,l3]` -> `[l0,l1,l2,l3,0,0]` (Patrocínio continua no índice 3).
3. `maxCircuit` = índice da maior pista com `rep >= circuits[i].rep` na tabela **antiga**; `rep = max(rep, repToOpen(maxCircuit))` (nada de rebaixar); `circuit` preservado se for ≤ `maxCircuit`.
4. `idle.fragments`/`ascensions` -> `legacy = 1 + 0.02 × fragments` (valor inalterado), campo antigo removido só do estado ativo (mantido no backup).
5. `farm.bank` -> `money += min(bank, produçãoEquipe × 8 h)`; `farm` descartado (no backup).
6. `night.titles` -> `season.titles`; `night.sponsors`/metas -> missões.
7. `money`: mantido. Se `money` for maior que 200× o custo do próximo upgrade, registrar no log ("save grande") sem alterar. [Decisão: não converter, para não punir o jogador.]
8. Validar com `validSave(v2)`; se falhar, **não gravar**: mostrar "Não foi possível migrar. Exporte seu save" e manter o v1 intacto (comportamento já existente de `save.js: load`).
9. Migração roda na leitura local e também ao baixar da nuvem (Supabase) [VERIFICAR a rota de sync em `cloud-model.js`].
10. **Idempotente:** `migratedFrom` evita rodar duas vezes. Teste obrigatório (§16): fixture v1 -> v2 -> `JSON.stringify` estável.

### 8.3 Ajustes de balanceamento no save antigo
O jogador antigo com níveis altos (custo ×1,55) agora tem melhorias muito mais baratas de continuar; o CR guardado vale mais. Aceito: ninguém é prejudicado. A pista aberta é preservada.

### 8.4 Integridade do save (anticheat básico)
`meta.checksum` = hash simples (FNV-1a de 32 bits) do JSON ordenado sem o campo `checksum`. Objetivo é detectar edição acidental e a maior parte das edições casuais, **não** impedir um jogador decidido (qualquer lógica no cliente é burlável). Regras: valores fora do intervalo físico (CR < 0, níveis > 100, `maxCircuit > 23`, PI impossível) fazem o save ser tratado como corrompido: carrega a última cópia boa (`apex-idle-v2.prev`, rotacionada a cada 5 min). Ranking, PvP e GP semanal competitivos só valem com validação no servidor (§14).

---

## 9. Ritmo da corrida, câmera e efeitos

### 9.1 Ritmo
- 5 voltas (era 6) para manter ≈ 100 a 130 s por corrida, apesar de a volta ficar 40% mais lenta. A contagem de 3 s e o resultado de 2 s continuam.
- Fórmula em §4.1. Parâmetros (`lapScreenK=0,25; lapMin=16; lapMax=26`) ficam no JSON de tuning para o dono ajustar sem deploy.
- Opção "Ritmo da corrida": Normal (padrão) / Rápido (x1,5 só para repetidores; não altera o balanceamento porque o fator de tempo é cosmético, mas **reduz** CR/s real, então a recompensa por volta deve ser fixa por volta e não por segundo) [decisão: o CR é por volta, logo "Rápido" aumenta o CR/s; limitar a ×1,5 e só depois da pista 5, para não virar exploit].
- Os modos Poupar/Normal/Atacar do menu "Mais" (velocidade 0,94/1/1,08; desgaste 0,65/1/1,75) continuam como estão.

### 9.2 Câmera
- **Padrão: "Pista inteira"** com margem. O mapa da pista é centralizado pelo retângulo delimitador (bounding box) do traçado: `escala = min(w / (bboxW × 1,16), h / (bboxH × 1,16))`, ou seja, 8% de margem por lado, e a pista nunca encosta nas bordas, em qualquer pista e proporção de tela.
- Para não ficar "distante", carros e rótulos usam **tamanho mínimo em pixels** (corpo do carro ≥ 14 px de comprimento no celular, ≥ 18 px no desktop; o jogador destacado 25% maior com halo na cor da equipe) e linha da pista com largura mínima de 6 px. Zoom da arte não escala com o mundo abaixo desse mínimo.
- **Modo "Seguir"** continua, com padrão 2,2× (antes 5×) e faixa 1,5 a 6; botão alterna Pista inteira / Seguir; mouse wheel e pinça funcionam. Preferência gravada em `settings.camera`.
- Mudança de pista ou rotação do aparelho recalcula a escala (evento `resize` com debounce de 100 ms).
- **Critério visual:** a pista toda cabe nos 24 traçados em 360×640 e 1920×1080 com margem ≥ 6% em todos os lados.

### 9.3 Efeitos de clique e feedback
Regras: só `transform` e `opacity` (60 fps), pool de elementos (máx. 12 simultâneos, reutilizados), respeitam `settings.effects` existente (alto/baixo/off) e `prefers-reduced-motion`.
| Gesto | Efeito |
|---|---|
| Qualquer botão | Ondulação (ripple) 180 ms a partir do ponto de toque; escala 0,96 ao apertar |
| Comprar melhoria | Cartão pulsa verde-limão 300 ms; número do nível "salta"; barra do PI anima do valor antigo ao novo; `+3% PI` flutua; vibração curta (`navigator.vibrate(10)` se permitido) |
| Ganho de CR (volta/prêmio) | `+CR` flutuante amarelo sobe do carro/valor por 900 ms; contador no topo faz "tick" proporcional |
| Clique de renda | `+X` no ponto do clique, faíscas pequenas |
| Compra negada | Cartão treme 200 ms em vermelho suave + mensagem "Faltam 120 CR" |
| Desbloqueio de pista | Faixa "NOVA PISTA" 1,5 s, confete leve, mini-mapa do traçado desenhado |
| Subir de posição | Tag "P7 -> P6" no placar + brilho no nome |
| ERS | Rastro luminoso atrás do carro, barra de energia com glow |
| Resultado | Pódio animado; cada linha do prêmio soma em sequência |
Todos os textos têm alternativa não animada e `aria-live="polite"` para valores novos (acessibilidade, §14).

---

## 10. Telas e fluxos

### 10.1 Navegação (barra inferior, 5 áreas)
1. **Pista** – corrida, placar, mini-mapa, seletor de pista (carrossel de cartões com REP), ERS, missões do dia.
2. **Oficina** – Melhorias (6 ramos), Carro/piloto/pintura (Garagem), Setup.
3. **Equipe** – Renda (geradores), Pilotos/Engenheiros, Contratos e Projetos.
4. **Campeonato** (só após pista 8; antes mostra cadeado) – Campeonato, GP semanal, PvP, Rankings, Temporada.
5. **Loja** – Carros, Componentes, Automação, Cosméticos, Premium.
O menu "Mais" (engrenagem) guarda opções, conta, export/import, idioma, privacidade e termos.

### 10.2 Fluxo dos primeiros 3 minutos (onboarding)
1. 0:00 Tela Pista, corrida já em andamento atrás de uma faixa "Toque em Largar". Mensagem única: "Você é o último. Vamos mudar isso."
2. 0:20 Fim da 1ª corrida: resultado, "+78 CR". Seta aponta para a Oficina, botão "Melhorar carro" abre Motor (50 CR, com 150 inicial dá 3 compras).
3. 0:50 Compra do Motor 1: efeito de compra, barra Você/Líder mostra o salto.
4. 1:10 2ª corrida; ERS ensinado na hora (aparece o botão pulsante na 3ª volta).
5. 2:30 Terceira corrida; "Faltam 3 pontos para Barcelona" e missão do dia. Fim do tutorial (≤ 3 min), com possibilidade de pular.
6. Meta de sessão 1: abrir Barcelona (≈ 5 min).
Eventos analíticos em cada passo (§14.1).

### 10.3 Estados vazios e erros
Sem rede: jogo completo funciona, ranking/anúncios mostram "indisponível". Falha de save: faixa vermelha "Progresso não salvo – exporte agora" (nunca silêncio). Botão sem CR: mostra quanto falta e o tempo estimado (`falta / CR/s`).

---

## 11. Economia completa

### 11.1 Fontes e drenos
| Moeda | Fontes | Drenos | Observações |
|---|---|---|---|
| CR | Voltas e prêmio de corrida; Equipe (CR/s); clique; missões, diárias e streak; metas de patrocinadores; offline; anúncio recompensado (dobrar offline); passe (faixa grátis) | Melhorias, geradores, giros, componentes, ERS automático, Projetos (parte) | Um único sumidouro exponencial (custo ×1,16 e ×1,15) segura a inflação |
| REP | Pontos F1 por corrida (2 a 25); marcos de missões (bônus pequeno) | Nenhum; reinicia na Nova Temporada | Gate de pistas |
| Títulos | Nova Temporada | Nenhum (multiplicador permanente) | +25% renda, +8% PI cada |
| Materiais | Contratos (60 s/5 min/15 min), corridas (3 por corrida atual) | Projetos de carro (20/40/80/160/320) | Entra na pista 6 |
| Gemas | Missões semanais, GP semanal, passe, conquistas; compra com dinheiro real | Cosméticos, extensão de slots, trocas de nome | **Nunca compra CR nem PI** |
| Pontos de coleção | Duplicatas de giro | Compra direta de carro | Escondido até a 1ª duplicata |

### 11.2 Fluxo por fase (jogador médio ativo; CR/s e posição do simulador)
| Fase | Pista | CR/s (corrida+Equipe) | Fonte principal | Principal dreno | Posição típica | Notas |
|---|---|---|---|---|---|---|
| Min 0 a 10 | 1 a 2 | 0,8 a 2 | corrida | Motor 1 a 3, Patrocínio 1 | P10 -> P9 | Tutorial, 3 a 5 compras |
| Min 10 a 60 | 2 a 7 | 2 a 45 | corrida, 1º gerador | Motor/Aero/Pneus 8 a 20; geradores | P9 -> P3 | Primeiro muro na pista 3; missões ativas |
| 1 a 5 h | 7 a 18 | 45 a 1000 | corrida + Equipe | Piloto/Pit, geradores, giros | P1 a P5 | Campeonato e Contratos aparecem; Nova Temporada na pista 12 |
| Dias 1 a 7 | 1 a ~15 [estimativa, §11.3] | — | corrida + offline + diárias | tudo | P1 a P4 | Hábito diário, streak de 7 |
| Semana 2+ | 15 a 24, 2ª temporada | 1 k a 4,6 k | corrida + Equipe | Pit/Piloto 50+ | P3 a P9 (muro 22 a 24) | GP semanal, passe, prestígio |
(CR/s: pista 5 = 21; pista 8 = 111; pista 10 = 161; pista 15 = 681; pista 20 = 1853; pista 24 = 4591, todos do simulador.)

### 11.3 Metas de sessão e retorno
Premissas [SUPOSIÇÕES, verificar com dados reais]: jogador casual com 25 a 35 min ativos por dia, em 3 sessões. Progresso = tempo ativo acumulado (a tabela de §4.4):
| Marco | Ativo acumulado | Pista esperada | Meta de produto |
|---|---|---|---|
| Fim da sessão 1 (10 min) | 10 min | 2 | Completar onboarding, abrir Barcelona |
| D1 (35 min ativos no dia 1) | 35 min | 4 | Voltar no dia 2: **meta D1 35 a 40%** [referência típica de idle em mobile; não verificada] |
| D7 (≈ 3,5 h ativas) | 3,5 h | 14 a 15 | **meta D7 12 a 18%**; Nova Temporada ainda não obrigatória |
| D30 (≈ 15 h) | 15 h | 24, 1ª temporada completa | **meta D30 4 a 7%** [idem] |
Retornos planejados: notificação em 1 h (ganho offline pronto), 8 h (teto atingido), 20 h (diária/streak), GP semanal (sábado).

---

## 12. Monetização ética e opcional

Princípio: **tudo que dá poder em jogo é ganho jogando.** O dinheiro compra conveniência, aparência e apoio. Nada de pagar para vencer, principalmente no PvP (que usa carros normalizados; o modo "Copa de fábrica" já existe).

### 12.1 Anúncio recompensado (opcional, sempre explícito)
| Gancho | Efeito | Limite |
|---|---|---|
| Dobrar ganho offline | x2 no pacote atual | 1 por retorno |
| Boost 2x CR por 30 min | CR de corrida e Equipe x2 | 3 por dia; recarga 4 h |
| Refazer prêmio (resultado) | +50% do prêmio daquela corrida | 1 a cada 3 corridas |
Sem anúncio forçado, sem intersticial durante a corrida. "Remover anúncios" mantém o benefício (o boost e o dobro offline viram grátis, uma vez por dia, sem anúncio).

### 12.2 Passe de Temporada (grátis + premium)
60 níveis em 28 dias [SUPOSIÇÃO]; XP por missões/corridas. Faixa grátis: CR, Gemas, Materiais, pinturas básicas. Faixa premium: pinturas e capacetes exclusivos, moldura de perfil, +4 h de teto offline, 1 slot extra de preset de acerto, sem nada de PI. Premium comprável uma vez por temporada; o que foi ganho fica para sempre.

### 12.3 Preços sugeridos [SUPOSIÇÃO: valores de partida a testar; não pesquisei o mercado]
| Produto | R$ | US$ |
|---|---|---|
| Remover anúncios | 14,90 a 24,90 | 2,99 a 4,99 |
| Passe premium (por temporada) | 14,90 a 24,90 | 3,99 a 5,99 |
| Pacote de cosméticos (pinturas + capacete) | 9,90 a 29,90 | 1,99 a 5,99 |
| Pacote de Gemas (só cosméticos) | 4,90 a 49,90 | 0,99 a 9,99 |
Sem "starter pack" com poder. Sem assinaturas no MVP.

### 12.4 Gacha e riscos regulatórios (não é parecer jurídico)
- Gacha usa só CR (moeda de jogo), não dinheiro real. Taxas e pity exibidas na tela e na loja. Registro do histórico dos últimos 10 giros (já existe).
- **Riscos a validar com advogado antes de vender ou lançar:** (a) caixas de recompensa e consumidor (CDC, Lei 8.078/1990) – informação clara, oferta, publicidade; (b) a legislação de proteção de crianças e adolescentes no ambiente digital (a chamada "ECA Digital", Lei 15.211/2025) – segundo o que sei, trata de caixas de recompensa e de público infantil; **[VERIFICAR texto e vigência atuais]**; (c) lojas de aplicativos (Apple e Google) exigem divulgação de probabilidades e política de menores; (d) LGPD (Lei 13.709/2018) – dados de crianças, base legal, consentimento, direitos do titular, encarregado; (e) publicidade a menores. Mitigação de partida: classificação indicativa adequada, nenhum item pago aleatório, nenhum dado pessoal além do necessário.
- Anúncios: usar rede com modo para menores/consentimento; desligar personalização se a idade não for confirmada [SUPOSIÇÃO].

---

## 13. Retenção

| Mecânica | Regra |
|---|---|
| Diárias | 3 missões/dia (ex.: "Complete 5 corridas", "Termine no top 5", "Compre 3 melhorias"); recompensa em CR proporcional a ~10 min da renda atual + Gemas |
| Login streak | 7 dias; dia 7 dá Gemas e baú de Materiais; falhar 1 dia pausa (não zera) uma vez por semana, evitando culpa |
| Missões | Já existem (`missions-model.js`: voltas, melhorias, peças, corridas); manter e agrupar por "Agora", "Hoje", "Semana" |
| GP semanal | Corrida especial com carro normalizado, prêmio em Gemas/cosmético, ranking semanal validado no servidor [VERIFICAR o estado atual do GP semanal] |
| Conquistas | Já existem 20+ (idle); incluir marcos de pista, Nova Temporada, coleção; recompensa pequena em Gemas |
| Notificações PWA | Opt-in explícito após a 1ª sessão boa (não no primeiro toque). 3 tipos: offline pronto, diária disponível, GP. Máx. 1 por dia; toggle em "Mais". |
| Onboarding | ≤ 3 min (§10.2), pulável |
| Eventos de tempo limitado | Mensais: pista temática com cosmético; sem poder de PI |

---

## 14. Requisitos de produto comercial

### 14.1 Analytics (eventos e funil)
Identificador anônimo (UUID local), sem dados pessoais, antes de qualquer envio exige consentimento (banner no 1º acesso; sem consentimento só eventos agregados locais).
Eventos: `first_open`, `tutorial_step{n}`, `tutorial_done`, `session_start/end{dur}`, `race_start{circuit,pi,leader_pi}`, `race_finish{circuit,place,secs,cr}`, `upgrade_buy{branch,level,cost}`, `circuit_unlock{n,t_active}`, `shop_view`, `summon{count,result}`, `component_buy`, `generator_buy`, `season_end{titles}`, `offline_return{secs,gain,doubled}`, `ad_offered{type}`, `ad_completed{type}`, `iap_view{sku}`, `iap_purchase{sku}`, `daily_claim{streak}`, `error{code}`, `save_migrated{from}`.
Funil: instalou/abriu -> 1ª corrida (alvo >95%) -> 1ª melhoria (>90%) -> tutorial pronto (>75%) -> pista 2 (>70%) -> pista 5 (>40%) -> D1 -> pista 10 -> 1º anúncio -> 1ª compra -> Nova Temporada. Painel simples: queda entre etapas e tempo mediano até cada pista (comparar com §4.4).
Ferramenta: a decidir pelo dono; o repositório já fala com Supabase [VERIFICAR] – opção é uma tabela de eventos própria com política de retenção de 90 dias. Não adicionar SDK de terceiros sem o "sim" do dono.

### 14.2 Configuração remota de balanceamento
`tuning.json` publicado junto do site: `{ "version": 1, "min": {...}, "values": {...} }` com todos os parâmetros de `balance.mjs` (r0, rg, d0, dg, dg2, dgBreak, aiStep, repA, repB, g, k por ramo, bases, ms, volta tela). Regras: carrega no início com `fetch` + cache; **valida** (schema + faixas: p.ex. `repB ∈ [1,3]`, `g ∈ [1,05; 1,3]`); em qualquer falha usa o valor embutido; exibe a versão no rodapé de "Mais"; salva a versão usada no save (`meta.tuning`) para análise. Nunca altera custos já pagos retroativamente (afeta só compras futuras).

### 14.3 Termos, privacidade, consentimento
Páginas `termos.html` e `privacidade.html` (texto pelo jurídico), links no rodapé e em "Mais". Texto de privacidade cobre: dados coletados (ID anônimo, eventos, e-mail se houver login), finalidade, base legal, retenção, direitos, contato. Botão "Apagar meus dados" (exclui nuvem e eventos; o save local é do jogador). Anúncios exigem consentimento separado.

### 14.4 PWA e mobile
`manifest.webmanifest` (nome, ícones 192/512 maskable, `display: standalone`, tema azul-noite), service worker (cache de arquivos estáticos, versionado; **nunca** cachear `tuning.json` por mais de 5 min), tela de instalação, orientação retrato e paisagem, áreas seguras (`env(safe-area-inset-*)`), alvos de toque ≥ 44 px, nada que dependa de hover. Atualização do SW avisa "Nova versão. Recarregar".

### 14.5 Desempenho
Metas: carregar < 2 s em 4G, menos de 350 KB de JS inicial (hoje ~400 KB sem bundler: separar o que só importa depois da tela inicial), 60 fps em celular médio, sem alocação por frame no laço de desenho, `requestAnimationFrame` pausado em aba oculta (corrida segue por tempo, ver `document.hidden` no código atual), pool de elementos de efeito, canvas com `devicePixelRatio ≤ 2`. Medir com Lighthouse (alvo ≥ 90 em desempenho e acessibilidade) e perfil de CPU em um aparelho Android de entrada [VERIFICAR aparelho do dono].

### 14.6 i18n pt-BR/en
Extrair todos os textos para `i18n/pt-BR.json` e `i18n/en.json` com chaves estáveis; função `t(key, vars)`; padrão pelo idioma do navegador; seletor em "Mais"; formatação de números por `Intl.NumberFormat` (notação "curta" já existente). Os nomes das pistas reais são mantidos. Cuidado com direitos de marca de F1 [RISCO: nomes de equipes e pilotos reais não são usados hoje (Aurora, Solaris...), manter assim; o uso de nomes de circuitos reais é comum, mas **verificar** com jurídico antes de vender].

### 14.7 Acessibilidade
Contraste AA (o amarelo/limão sobre azul-noite passa; verificar cada estado), foco visível, navegação por teclado (espaço = ERS já existe), `aria-live` para ganhos e resultado, opção de reduzir movimento (também por `prefers-reduced-motion`), alternativa ao ERS por toque sem tempo crítico, texto redimensionável até 200%, nunca depender só de cor (ícone + texto em compra negada).

### 14.8 Segurança
Save importado: validar tamanho (já existe 2 MB), esquema e intervalos; nunca `innerHTML` com texto do usuário (nome da equipe, nome do jogador): usar `textContent`; CSP; chaves do Supabase só a pública (anon) no cliente com RLS ativo; nenhuma chave no repositório. [VERIFICAR `config.js` do repositório real]

---

## 15. Roadmap

### MVP comercial (mínimo para lançar)
1. Progressão de pistas + IA por PI (Etapa 1 do prompt) e árvore de upgrades (Etapa 2).
2. Loja consolidada (Etapa 3) e simplificação de moedas (Etapa 7).
3. Ritmo, câmera, efeitos (Etapas 4 e 5).
4. Migração de save com backup (Etapa 1).
5. Onboarding de 3 min, diárias e streak.
6. Anúncio recompensado (dobrar offline, boost 30 min) e Remover anúncios.
7. Analytics com consentimento, termos e privacidade, PWA básico, `tuning.json`.
8. i18n pt-BR (en como pós-lançamento se faltar tempo).
9. Acessibilidade mínima (contraste, teclado, reduzir movimento).

### Pós-lançamento
Passe de Temporada completo, pacotes de cosméticos, GP semanal competitivo com validação no servidor, PvP ranked com repetição validada, inglês, notificações push, eventos mensais, nuvem com resolução de conflito, loja de Gemas, medição de retenção e ajuste de `tuning.json` com dados reais, segundo bloco de pistas ou campeonatos regionais.

---

## 16. Critérios de aceite (testáveis)

Formato: Given/When/Then com número.
1. **Pista 2 rápida.** Given save novo e simulador ativo, When `simulate(policy)` roda com os parâmetros de `balance.mjs`, Then a pista 2 abre entre 4 e 8 min de jogo e a pista 5 entre 30 e 45 min; pista 24 entre 11 e 17 h. (Teste em `tests/balance.sim.test.js`.)
2. **Posição responde a upgrade.** Given PI=1,00 em Interlagos, When o jogador compra Motor 1 a 3, Then `placeOf` passa de P10 para P9 ou melhor, e `PI ≥ 1,09`.
3. **IA ligada à pista.** For n em 0..23, `aiLeaderPI(n+1) > aiLeaderPI(n)` e `aiPI(n,8) < aiPI(n,0)`; `aiPI(n,i)` estritamente decrescente em i.
4. **REP.** `repToOpen` é estritamente crescente; `repToOpen(1)=5`, `repToOpen(23)=4952`; abrir a pista só depois de `rep >= repToOpen(n)`; nunca desabilitar pista já aberta.
5. **Pontos.** P1=25, P10=2; REP somada uma vez por corrida finalizada.
6. **Custos e efeitos.** `upCost('motor',L)` conforme tabela §5.2 (L=1: 50; L=10: 191; L=25: 1.8k arredondado); `effect` com marco: Motor 10 = 0,375 ±0,001, Motor 25 = 1,17 ±0,01.
7. **Ritmo.** Volta inicial de Interlagos entre 19,5 e 20,5 s e corrida de 5 voltas entre 100 e 115 s (a 60 fps, ±2%); nenhuma pista com volta < 14 s nem > 30 s em PI de 0,8 a 1,8 × PI líder.
8. **Câmera.** Em 360×640 e 1920×1080, para todas as 24 pistas, a caixa do traçado fica com margem ≥ 6% em cada lado e o carro do jogador tem ≥ 14 px de comprimento.
9. **Efeitos.** Comprar melhoria dispara efeito de compra e `+x% PI` flutuante em < 100 ms; com `effects:'off'` ou `prefers-reduced-motion` nenhum elemento animado é criado; ≤ 12 elementos de efeito no DOM ao mesmo tempo; sem queda abaixo de 50 fps em perfil de CPU 4x mais lento [VERIFICAR com ferramenta do dono].
10. **Migração.** Given fixture v1 (money, rep, levels[4], circuit, idle com fragmentos, farm com banco, night.titles), When `migrateV1toV2`, Then: `levels` tem 6 posições com os 4 primeiros iguais; `maxCircuit` ≥ pista antiga; `rep` nunca diminui; `legacy = 1+0,02×fragmentos`; banco do Farm somado ao CR com teto; backup `apex-idle-v2.bak-v1` existe e é idêntico ao original; rodar a função duas vezes resulta no mesmo JSON; save corrompido não é sobrescrito.
11. **Offline.** Given 10 h fora, Then ganho = `min(10,8)` h × 3600 × (0,10×Equipe + 0,03×CR/s corrida); com relógio atrasado (−1 h) ganho = 0 e `clockWarnings += 1`.
12. **Loja.** Preço do giro = `40 × CR_volta(maxCircuit)`; taxa de cada raridade exibida; pity 10/200 preservados; compra com CR insuficiente não altera estado.
13. **Nova Temporada.** `titulos(pista 12)=1`, `(16)=2`, `(24)=4`; após o reinício `money=150`, `rep=0`, `levels=[0×6]`, mantêm carros/cosméticos/títulos; PI multiplicado por `1+0,08×títulos`.
14. **Sem falha silenciosa.** Falha de gravação do `localStorage` mostra faixa visível e registra evento `error`.
15. **Monetização.** Nenhum item pago altera `PI`, `CR_volta` ou REP (teste de contrato: compra premium simulada, PI idêntico). Anúncio indisponível: botão oculto, nada é cobrado.
16. **Acessibilidade.** Lighthouse acessibilidade ≥ 90; todos os botões acessíveis por teclado; contraste AA nos textos principais.
17. **Analytics/consentimento.** Sem consentimento, zero requisições de evento; com consentimento, funil de §14.1 chega ao destino.
18. **Visual.** Mantém azul-noite, amarelo/verde-limão, cartões arredondados (checagem manual com captura de tela antes/depois).

---

## 17. Riscos e suposições

**Riscos**
- Balanceamento depende de um jogador simulado simples; jogadores reais gastam diferente. Mitigação: `tuning.json`, telemetria de tempo até cada pista.
- Reescrita de `engine.js` toca saves de produção: migração com backup e idempotência é a defesa; testar com saves reais do dono.
- Muitos módulos (`night-ui`, `career`, `championship`, `legends`) acoplados a `s.levels`, `A.duration` e `A.reward` por escopo global (`window`): mudar assinatura quebra telas. Mitigação: manter as funções públicas antigas como adaptadores durante a transição.
- Arquivos longos em linha única (código minificado/compacto): reformatar só o que for tocado, arquivos < 500 linhas.
- Anúncios e IAP exigem contas e SDKs (decisão do dono); gacha e menores têm risco legal; fórmula do offline pode ser explorada por relógio.
- Direitos de marca com nomes reais de circuitos/F1.

**Suposições** (todas a confirmar)
- Recompensa por volta real de ~198 CR em Interlagos (derivada de fórmula).
- Componentes: teto de +15% de PI.
- Benchmarks de retenção são referências genéricas de mercado, não medidos.
- Preços em R$ e US$ são pontos de partida, sem pesquisa de mercado.
- Fatores offline de 10% da Equipe e 3% da corrida (calibrados no simulador, §18.7).
- Passe de 60 níveis em 28 dias.
- O repositório do dono usa os mesmos arquivos do site publicado (Etapa 0 confirma).
- Telas internas (Campeonato, PvP, GP semanal, Álbum, Projetos, Contratos) não foram abertas; o comportamento descrito para elas vem do código.

**Reproduzir a simulação:** `node trabalho/apex-idle/sim/sim.mjs` (tabela de pistas, tempos, níveis, posição média, títulos), `node trabalho/apex-idle/sim/tabelas.mjs` (custos por nível, tabela das pistas). Parâmetros em `balance.mjs` (copiar para `src/balance.js` e para `tuning.json`).


---

# PARTE 2 (adicionada a pedido do dono): longo prazo, catálogo da loja, achados técnicos

## 18. Longo prazo e engajamento (meses de jogo)

### 18.1 Camadas de progressão empilhadas
Cada camada abre quando a anterior desacelera. A escada de 24 pistas dos §4 a 5 é a "régua" de balanceamento; no jogo final ela é **comprimida em 12 etapas por categoria** e repetida em escala maior.

| Camada | O que é | Abre quando | Reinicia o quê |
|---|---|---|---|
| 1. Etapas/pistas | 12 etapas por categoria; cada etapa corresponde a uma posição par da escada de 24 (`n_escada = 2 × etapa`), então a dificuldade da IA, o REP exigido e o CR/volta usam as fórmulas do §4 nessa posição. Circuito desenhado = `(2×etapa + 3×categoria) mod 24`, o que faz as 24 pistas aparecerem em cada categoria. | desde o início | – |
| 2. Categorias | Kart, F4, F3, F2, F1, Lendas (6 × 12 = **72 estágios globais**) | REP da etapa 12 da categoria | **Carro novo**: níveis das melhorias e Equipe reiniciam; **CR, cartas, componentes, pilotos, cosméticos e títulos permanecem**; escala de custo e de renda ×22 (Kart->F4), ×21,8, ×20,8, ×23, ×21,7 (valores em `Q.rScale`) |
| 3. Nova Temporada (prestígio 1) | Reinicia o jogador no Kart etapa 1 com multiplicadores permanentes | estágio global 12 (fim do Kart), recomendado de 24 em diante | CR, níveis, REP, categoria atual; mantém inventário de componentes por categoria, cartas, pilotos, XP de escuderia |
| 4. Legado (prestígio 2) | Reinicia títulos e temporadas; concede Pontos de Talento e a árvore permanente (§18.8) | 14 títulos (estágio global 64 ou mais) | títulos, temporadas, categorias; mantém nível de escuderia, coleção, cosméticos, talentos |
| 5. Modos finais | Desafios de pista (recordes), eventos semanais, Hall da Fama | Categoria F2 (Desafios), F1 (Hall da Fama) | nada (paralelos) |

Regras de transição (para o jogador nunca sentir que "perdeu"): a tela de promoção mostra o que fica e o que muda; CR guardado não se perde; o carro novo já nasce com o bônus de classe do `Q.rScale` (a nova categoria reaproveita o PI **relativo**, então o jogador entra de novo "em último" e sobe rápido porque tem dinheiro e títulos).

### 18.2 Nível de escuderia (1 a 500+)
- **XP vem de tudo:** corrida `25 + 4 × estágio_global + 2 × (11 − posição)`; compra de melhoria 5; abrir etapa 100; promover de categoria 1.000; missão diária 50 (x3/dia); semanal 300; GP/evento 400; conquista 150.
- **XP para o próximo nível:** `40 + 8 × L` (acumulado até o nível 100 = 44.000; até 250 = 260.000; até 500 = 1.020.000).
- **Efeito permanente por nível:** +0,2% de CR e +0,3% de PI (e +0,3% de PI da IA, para não destruir o equilíbrio: a IA escala igual; o ganho líquido de PI relativo vem só das compras; o CR sobe de verdade). Teto 500.
- **Recompensa em todo nível:** baú de CR equivalente a 5 min de renda (L par) ou 1 ficha (L ímpar). **A cada 5:** 20 gemas. **A cada 10:** cosmético comum ou boost de 30 min. **A cada 25:** marco grande (cosmético raro, slot de preset de acerto, título de perfil, +1 slot de Missão diária até 5). **Nível 100/250/500:** emblema do Hall da Fama e item lendário cosmético.
- No ritmo da simulação (30 min por dia) o nível 100 chega no dia ~22, o 250 no dia ~73 e o 500 por volta do dia 200 (extrapolação).

### 18.3 Cadência de desbloqueios (algo novo a cada ~5 min na 1ª hora, ~30 min no dia 1, diário na semana 1, semanal depois)
Tempos de **jogo ativo** na primeira hora (simulador §4.4); a partir do dia 2 em dias de calendário de um jogador casual (3 sessões de 10 min).
| Momento | Desbloqueio |
|---|---|
| 0:00 | Corrida, ERS |
| 0:02 | Oficina: Motor |
| 0:05 | Etapa 2, Equipe (2 primeiros geradores), Missões |
| 0:10 | Oficina: Aero e Patrocínio |
| 0:15 | Pilotos (Academia, Observar -> Provar -> Assinar) |
| 0:20 | Oficina: Pneus |
| 0:25 | Etapa 3 (primeiro muro suave) |
| 0:30 | Oficina: Piloto e Pit stop |
| 0:35 | Etapa 4, Loja, Invocação (1º giro de graça) |
| 0:40 | Componentes Club |
| 0:45 | Metas de patrocinadores, Conquistas |
| 0:50 | ERS automático na Loja |
| 1:00 | Etapa 5, Diárias e sequência de login |
| Dia 1 (+30 min) | Contratos e Materiais (estágio 6); Álbum |
| Dia 2 | Campeonato e GP semanal (estágio 8); Banner de destaque |
| Dia 3 | Projetos (construir carro com Materiais); Passe de Temporada |
| Dia 4 | PvP Ranked (estágio 10); Loja diária completa (6 espaços) |
| Dia 5 | Categoria F4; Nova Temporada visível (aviso, não obrigatório) |
| Dia 6 | Troca de repetidos; Treinos de piloto |
| Dia 7 | Liga semanal; 1º ciclo do passe fecha a semana 1 |
| Semana 2 | Nova Temporada recomendada; Desafios de pista (F2) |
| Semana 3 | Categoria F3 (dia ~12 a 27 conforme o caminho) |
| Semana 4 a 5 | Categoria F2; Evento mensal; Hall da Fama (F1) |
| Semana 6 a 8 | Categoria F1; 2ª Nova Temporada |
| Semana 8 a 12 | Lendas; Banner Lendas; Legado visível |
| Mês 4+ | Legado (prestígio 2), árvore de talentos, nível de escuderia 250 a 500 |
(Os dias de categoria dependem do caminho; a coluna vem da simulação da §18.7 e deve ser tratada como estimativa.)

### 18.4 Ganchos em várias escalas de tempo
| Escala | Gancho |
|---|---|
| 30 s a 3 min | Uma corrida (≈110 s): +CR flutuante, posição subindo, compra com efeito, ERS no melhor momento |
| 5 min | Meta de sessão visível ("faltam 2 compras para a próxima etapa"), melhor compra pronta, recorde de volta |
| Diária | 3 missões, baú diário, sequência de 7 dias, Loja diária (6 espaços, 00h), ganhos do "Baú de retorno" |
| Semanal | GP semanal (carros normalizados), liga, Loja semanal, banner de destaque, missões semanais |
| Temporada (4 a 6 semanas) | Passe de 40 níveis, evento mensal com loja própria |
| Longo prazo | Coleção (30 carros, 82 cosméticos, 10 funcionários), Álbum, 40+ conquistas, Hall da Fama, nível de escuderia 500, Legado |

### 18.5 Recompensa variável com controle
- **Drops após a corrida:** 8% de chance de "caixa de patrocinador" (5 a 15 min de renda). Raridade: comum 70, raro 24, épico 5,5, lendário 0,5. **Pity:** o 12º jogo sem drop garante uma caixa; o 30º sem raro garante raro; o 150º sem lendário garante lendário. Valores e pity ficam visíveis na tela de "Detalhes do drop".
- **Corrida perfeita:** P1 + ERS usado pelo menos 1 vez + pit stop dentro da janela do composto. Dá +50% no prêmio, 1 ficha e entra no Hall da Fama. É raro de propósito, mas previsível (mostra os 3 critérios na largada).
- **Eventos raros de pista** (a partir da etapa 3): chuva (12% das corridas, prevista 1 volta antes), safety car (10%, compacta o grid e abre janela de pit) e bandeira vermelha (2%). Mudam a estratégia (escolha de pneu de chuva, parada no safety car); a IA é afetada igualmente. **Controle:** o evento nunca custa mais que ~8% do CR esperado da corrida, o pneu errado só custa até 3% de ritmo, e o resultado final sempre soma REP (nunca zera uma corrida).
- **Sem frustração:** toda compra aleatória tem pity; todo drop ruim garante progresso mínimo (REP e XP vêm sempre).

### 18.6 Escolhas que importam (contra a "compra óbvia única")
1. **Tipo de pista.** As 24 pistas ganham um perfil: **Potência** (retas), **Curvas** ou **Aderência**. Cada ramo vale mais ou menos conforme o perfil (multiplicador do efeito do ramo):
| Ramo | Potência | Curvas | Aderência |
|---|---|---|---|
| Motor | 1,5 | 0,8 | 0,9 |
| Aerodinâmica | 0,8 | 1,5 | 0,9 |
| Pneus | 0,9 | 0,9 | 1,5 |
| Piloto | 1,0 | 1,1 | 1,1 |
| Pit stop | 1,0 | 1,0 | 1,0 |
   A média dos multiplicadores em cada ramo ≈ 1 nas 24 pistas (a atribuição de perfil a cada pista precisa dar média de 1 por ramo; [VERIFICAR com teste]). O jogador escolhe uma **receita** (preset salvo, 3 slots) por tipo de pista; o seletor de etapa mostra o perfil.
2. **Sinergia piloto + carro:** estilo do piloto (Potência/Curvas/Aderência) casado com o perfil do carro dá +3% de PI.
3. **Componentes por tipo:** x1,6 se o componente casa com a pista, x0,7 se não (§19.2). Montar um conjunto para cada perfil é uma decisão de coleção.
4. **Decisões de prestígio:** quando encerrar a temporada (cedo e várias vezes, ou tarde e com mais títulos) e o **foco da temporada** escolhido ao reiniciar (Potência, Curvas ou Aderência: +20% nesse ramo, −10% nos outros na temporada inteira). Na simulação o prestígio com ganho de 4+ títulos compensa, mas o jogador pode jogar mais tempo sem perder.
5. **Equipe versus corrida:** geradores só aparecem a partir da etapa 2; o investimento em Equipe rende pouco offline (10%), então vale mais para quem joga em sessões longas.

### 18.7 Simulação de 90 dias (jogador casual)
Arquivo: `trabalho/apex-idle/sim/sim90.mjs` (saída em `resultado90.txt`). **Perfil:** 3 sessões de 10 min por dia (8h, 13h, 21h), 5 corridas por sessão, ganho offline entre sessões (teto 8 h), diária e semanal de REP, compras automáticas (geradores com retorno ≤ 480 s e ≤ 35% do caixa; melhorias pelo menor custo por efeito), prestígio quando ganha ≥ 4 títulos e ≥ 35% a mais depois do dia 14. Sem gacha, sem componentes, sem anúncios, sem pilotos (margem extra de até +37%+).

**Parâmetros finais** (em `Q` do arquivo): 12 etapas por categoria; `rScale = cScale = [1, 22, 480, 1e4, 2,3e5, 5e6]`; `repScale = [0,2, 0,3, 0,45, 0,65, 0,9, 1,2]` aplicado a `repToOpen(2 × etapa)`; títulos `floor((estágio − 8)/4)`; título = +25% CR, +8% PI (a IA ganha +8% por título, para o PI relativo vir do investimento); nível de escuderia +0,2% CR, +0,3% PI (IA +0,3%); offline = 0,10 × Equipe + 0,03 × corrida.

**Tabela dia x nível x etapa x categoria x prestígios** (resultado da simulação):
| Dia | Nível de escuderia | Etapa (1 a 12) | Categoria | Títulos | Temporadas feitas | Estágio global máx. |
|---|---|---|---|---|---|---|
| 1 | 17 | 5 | Kart | 0 | 0 | 5 |
| 2 | 26 | 7 | Kart | 0 | 0 | 7 |
| 3 | 32 | 9 | Kart | 0 | 0 | 9 |
| 5 | 41 | 11 | Kart | 0 | 0 | 11 |
| 7 | 50 | 12 | Kart | 0 | 0 | 12 |
| 10 | 63 | 3 | F4 | 0 | 0 | 15 |
| 14 | 80 | 10 | F4 | 0 | 0 | 22 |
| 21 | 101 | 12 | Kart (2ª temporada) | 4 | 1 | 24 |
| 28 | 127 | 7 | F3 | 4 | 1 | 31 |
| 35 | 150 | 8 | Kart (3ª temporada) | 8 | 2 | 40 |
| 45 | 178 | 11 | F3 | 8 | 2 | 40 |
| 60 | 222 | 1 | F4 | 12 | 3 | 56 |
| 75 | 257 | 12 | F2 | 12 | 3 | 56 |
| 90 | 301 | 9 | Lendas | 12 | 3 | 69 |
Eventos: F4 no dia 10; **Nova Temporada nº 1 no dia 17** (4 títulos); F4 (2ª vez) dia 22, F3 dia 27, F2 dia 34; Temporada nº 2 no dia 34 (8 títulos); 3ª rodada: F4 dia 38, F3 dia 42, F2 dia 47, F1 dia 54; Temporada nº 3 no dia 57 (12 títulos); 4ª rodada: F4 dia 60, F3 dia 64, F2 dia 69, F1 dia 76; **Lendas no dia 85**. O **Legado** (14 títulos) não chega antes do dia 90 neste perfil (chega por volta do dia 100 a 120, coerente com "meses").

**Medidas contra a parede:**
- Maior intervalo entre compras úteis: **5,9 min de jogo ativo** (mediana 1,8 min, p95 3,8 min); **0 sessões consecutivas sem nenhuma compra**. Critério usado: nenhum trecho com mais de ~2× o esperado sem compra útil, e a sessão de 10 min sempre tem uma compra ou a etapa seguinte à vista.
- Contra o estouro: com o offline calibrado em 10% + 3%, a posição média cai de P1,0 (offline a 80%+15%, que torna o CR irrelevante) para **P2,6, com 68% das corridas em P1**; sem nenhum offline seria P5,3 e 25% em P1. Os valores escolhidos mantêm a tensão e dão ao jogador "dias de P1" como recompensa.
- **Sensibilidade (boost 2x CR em todo o tempo ativo):** F1 chega no dia ~47 em vez de ~54 (cerca de 13% menos tempo), e a Nova Temporada nº 1 passa de dia 17 para 14. Ou seja, o boost de CR acelera, mas a progressão é limitada por REP/tempo de corrida, não por dinheiro.

**Limites e honestidade do modelo:** as políticas são simples; uma pessoa real pode ir mais devagar (ignorar diária, abrir o jogo só 1x/dia) ou mais rápido (sessões longas). A parte de categorias foi calibrada em 6 iterações de ajuste (as primeiras produziam P1 em 100% das corridas porque o dinheiro acumulado ao subir de categoria comprava todos os níveis; a correção foi reduzir o offline e fazer a IA escalar com o PI "meta" do jogador). O `prestígio` do caminho pode ser feito mais cedo do que o jogador faria. Nada disto foi testado com pessoas.

### 18.8 Legado (prestígio 2) e modos finais
- **Legado:** com ≥ 14 títulos. `Pontos de Talento = floor(títulos_máx / 2) − 5` (14 títulos = 2; 24 = 7). Reinicia títulos, temporadas e categorias; **mantém** nível de escuderia, coleção, cosméticos, talentos e `legacy` (herdado da Ascensão).
- **Árvore de talentos (12 nós, permanentes):** PI +3% (3 níveis); CR +5% (3 níveis); XP +5% (2 níveis); teto offline +2 h (2 níveis); ERS +1 s (1 nível); começa cada categoria com Motor 5 (1 nível). Custo 1 a 3 TP por nível.
- **Desafios de pista:** para cada circuito, 3 estrelas por meta ("terminar P1 em menos de X s", "sem ERS", "chuva"), com recordes salvos em `race.records`; recompensa em Gemas e cosméticos. Abre na categoria F2.
- **Hall da Fama:** painel permanente com recordes por pista, corridas perfeitas, maior nível, títulos, coleções completas; abre na F1 (e acumula histórico).
- **Eventos semanais:** GP semanal (carros normalizados) com loja de evento (§19.9).

### 18.9 Notação de números grandes e teto numérico seguro
- Dinheiro e produção ficam em `Number` (double). A simulação chega a ~10^14 CR ao dia 90 e ~10^20 depois; **teto de segurança 1e100** (o validador atual já usa `< 1e100`); acima disso `earn()` recusa e registra aviso.
- Contadores (`laps`, `races`, `clicks`) em inteiros seguros (≤ 2^53−1).
- **Notação curta:** K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, depois `aa`, `ab`, ..., `zz` (cada letra = ×1000). Opção "científica" mantida (já existe). Função `formatNumber(n, mode)` com testes: `1234 -> "1,23K"`, `1e15 -> "1,00Qa"`, `1e36 -> "1,00Dc"`, `1e100 -> "1,00..."` sem NaN ou "Infinity" (se `!isFinite`, mostrar "—" e logar).
- Comparações de custo com `>=` de doubles (sem subtrair grandezas muito diferentes); preços sempre inteiros (`ceil`) até 1e15, depois arredondados na terceira casa significativa para evitar erro de ponto flutuante.

---

## 19. Catálogo da loja (dados completos em `shop-catalog.json`)

O arquivo `entregas/apex-idle/shop-catalog.json` contém **167 itens** (componentes 24, carros 30, pilotos 5, engenheiros 5, treino 2, boosts 9, cosméticos 82, dinheiro real 10), 3 banners, o passe de 40 níveis, as lojas rotativas, a troca de repetidos e a loja de evento. Todos os nomes são fictícios. Campos de cada item: `id, name, category, description, currency, price, effect, unlock, limit, rarity, appears` (carros também `rate_pct`, `duplicate_pts`). **Todos os valores são SUPOSIÇÕES de design** a calibrar com dados reais.

Moedas: `cr` (jogo), `gemas` (premium, ganha de graça em parte), `fichas` (giros, ganhas jogando), `pts` (pontos de troca de repetidos), `brl` (dinheiro real). Fichas de evento são uma moeda temporária.

### 19.1 Preço em CR e unidade
`lapReward(estágio)` = CR/volta do §4.2 na posição da escada. Preços em CR são sempre **múltiplos de corridas** do estágio de desbloqueio (uma corrida ≈ `6,3 × lapReward`), de modo que a janela de tempo para ganhar o item é a mesma em qualquer categoria.

### 19.2 Componentes (24 itens: 6 slots × 4 tiers)
Efeito em PI por slot (somando os 6 slots: Club 3,0%, Pro 7,2%, Elite 12%, Lenda 15% = o teto de 15% usado nos §4). Efeito x1,6 em pista do tipo do slot e x0,7 nas outras. Ficam no inventário por categoria (após prestígio continuam).
| Slot | Tipo | Club | Pro | Elite | Lenda |
|---|---|---|---|---|---|
| Motor | Potência | Unidade Faísca | Unidade Corisco | Unidade Trovão | Unidade Eclipse |
| Aerodinâmica | Curvas | Asa Brisa | Asa Falcão | Asa Aurora | Asa Zênite |
| Suspensão | Curvas | Mola Terra | Mola Dunas | Mola Prisma | Mola Horizonte |
| Freios | Aderência | Disco Pedra | Disco Ferro | Disco Basalto | Disco Meteoro |
| Câmbio | Potência | Caixa Linha | Caixa Rio | Caixa Delta | Caixa Origem |
| Pneus | Aderência | Borracha Seixo | Borracha Trilha | Borracha Cometa | Borracha Rubi |
| PI por peça | | +0,5% | +1,2% | +2,0% | +2,5% |
| Preço (corridas) | | 3 | 8 | 20 | 50 |
| Desbloqueio | | Kart etapa 4 | Kart etapa 9 | Categoria F3 | Categoria F1 |
| Preço de referência na categoria do desbloqueio | | 435 CR | 4.385 CR | 846.720 CR | 1,01 bi CR |
| Limite | | 1 por slot e categoria | | | |
| Raridade | | comum | raro | épico | lendário |
Onde aparece: Loja > Componentes; Loja diária (slot 1, 15 a 30% de desconto); Loja semanal (Elite/Lenda -25%).

### 19.3 Carros (30 itens: 5 raridades × 6 categorias) e banners
Bônus de PI por raridade (na categoria do carro): Comum +3%, Raro +6%, Épico +10%, Lendário +15%, Mítico +22%. Taxas: Comum 49,357%, Raro 35%, Épico 15%, Lendário 0,5%, Mítico 0,143% (soma 100%). Pontos de troca ao duplicar: 50 / 150 / 400 / 2.000 / 7.500. Compra direta em pontos: 100 / 300 / 800 / 4.000 / 15.000.
| Categoria | Comum | Raro | Épico | Lendário | Mítico |
|---|---|---|---|---|---|
| Kart | Kestrel Alfa | Kestrel Beta | Kestrel Gama | Kestrel Delta | Kestrel Ômega |
| F4 | Falcão Alfa | Falcão Beta | Falcão Gama | Falcão Delta | Falcão Ômega |
| F3 | Tempest Alfa | Tempest Beta | Tempest Gama | Tempest Delta | Tempest Ômega |
| F2 | Meridian Alfa | Meridian Beta | Meridian Gama | Meridian Delta | Meridian Ômega |
| F1 | Aurora Alfa | Aurora Beta | Aurora Gama | Aurora Delta | Aurora Ômega |
| Lendas | Panteon Alfa | Panteon Beta | Panteon Gama | Panteon Delta | Panteon Ômega |
Desbloqueio: etapa 4 da categoria. Aparece: Loja > Invocação, Loja > Troca.

| Banner | Pool | Taxas | Pity | Custo |
|---|---|---|---|---|
| Categoria (padrão) | carros da categoria atual | as taxas acima | épico 10, lendário 200 | `40 × CR/volta(maior etapa)` por giro, ou 1 ficha; x10 pelo mesmo preço por giro |
| Destaque (semanal) | 1 lendário em destaque + padrão | destaque x2 (0,5 -> 1,0%) | lendário 100 | 1 ficha de destaque ou 60 gemas; 1 ficha/dia grátis |
| Lendas | carros fictícios da categoria Lendas | Raro 60, Épico 32, Lendário 7, Mítico 1 | lendário 50, mítico 150 | só fichas, desbloqueia na F1 |
Taxas, pity e histórico (10 giros) aparecem na tela, sempre. Tempo sem pagar: com `40 × lapReward` por giro (≈ 6,3 corridas ≈ 13 min), o Lendário por troca de pontos (4.000 pts; média de ~137 pts por giro) sai em ~30 giros (~6 h ativas), o Mítico em ~110 giros (~24 h ativas); o pity de 200 giros garante o Lendário em ~43 h ativas (por isso a troca existe). 1 ficha/dia + passe adicionam ~35 giros/mês grátis.

### 19.4 Pilotos e engenheiros (10 itens) e treino
PI por raridade: Comum +2%, Raro +4%, Épico +7%, Lendário +12%; +10% do bônus por estrela (cópias 1, 2, 4, 8, 16). Contratação em CR: `N × 6,3 × lapReward(maior etapa)` com N = 5 / 25 / 150 / 900. Sinergia: +3% PI se o estilo do piloto bate com o perfil do carro. Desbloqueio: etapa 3 / 6 / 9 / 12 do Kart.
| Nome | Função | Raridade |
|---|---|---|
| Lia Monteiro | Piloto | Comum |
| Enzo Vale | Piloto | Raro |
| Maya Veloz | Piloto | Épico |
| Nico Solari, Inês Costa | Piloto | Lendário |
| Rui Prado | Engenheiro | Comum |
| Ana Circuito | Engenheiro | Raro |
| Léo Ventura | Engenheiro | Épico |
| Íris Brandão, Tomás Luz | Engenheiro | Lendário |
Treino: *Sessão de treino* (2 corridas de CR, +100 XP de piloto, 5 por dia) e *Treino intensivo* (12 corridas de CR, +500 XP, 2 por dia, 30 min de espera ou pular por 8 gemas). Observação: 25 pilotos existem no jogo atual; 20 deles são pilotos históricos reais e devem ser trocados (§20.5).

### 19.5 Boosts e itens de offline (9 itens, moeda: gemas)
Todos desbloqueiam no nível de escuderia 10. Todos podem ser obtidos de graça por anúncio recompensado, missões ou passe.
| Item | Efeito | Preço (gemas) | Limite |
|---|---|---|---|
| Patrocínio em dobro (30 min) | CR x2 (corrida e Equipe) | 20 | 3/dia (mais ilimitado por anúncio, recarga 4 h) |
| Patrocínio em dobro (2 h) | CR x2 | 70 | 2/dia |
| Foco da escuderia (30 min) | XP de escuderia x2 | 15 | 3/dia |
| ERS automático (1 h) | aciona o ERS sozinho | 10 | 3/dia |
| Pular 1 h | credita 1 h de ganho offline (só CR) | 15 | 3/dia |
| Pular 4 h | 4 h offline | 50 | 2/dia |
| Pular 8 h | 8 h offline | 90 | 1/dia |
| Cofre de offline | teto offline +4 h (permanente) | 300 | único |
| Seguro de retorno | garante 4 h de ganho na próxima volta | 25 | 1/semana |
Os itens "Pular" dão CR, **nunca REP**: a progressão por etapas continua dependendo de correr. Na simulação, CR em dobro acelera ~13% do tempo até F1.

### 19.6 Cosméticos (82 itens, moeda: gemas, ou passe/evento/conquista)
Somente visual; nunca alteram PI, CR ou REP. Preços: Comum 40, Raro 120, Épico 250, Lendário 500 gemas (40% comuns, 30% raros, 20% épicos, 10% lendários por tipo). Cerca de 1 em cada 7 é exclusivo de passe, 1 em 11 de evento e 1 em 13 de conquista (não vendido). Desbloqueio no nível de escuderia 5.
| Tipo | Qtde | Exemplos (nomes fictícios) |
|---|---|---|
| Pintura | 30 | Aurora Boreal, Cromo Polar, Pôr do Sol, Jade, Magma, Safira, Neon Rosa, Galáxia, Holográfica... |
| Capacete | 20 | Falcão, Raio, Coruja, Onda, Estrela, Dragão, Lobo, Pixel, Cometa... |
| Rodas | 10 | Clássica, Turbina, Raios, Disco, Aro Neon, Hexágono, Flor, Engrenagem, Cristal, Fogo |
| Efeito de chegada | 8 | Confete, Faíscas, Fumaça colorida, Raios, Serpentina, Fogos, Neve, Pétalas |
| Tema do pit | 6 | Noturno, Neon, Retrô 80, Industrial, Tropical, Minimalista |
| Emote de pódio | 8 | Salto, Troféu ao ar, Dança, Saudação, Brinde, Selfie, Bandeira, Abraço |
Lista completa com `id` e raridade no JSON.

### 19.7 Dinheiro real (10 itens) [SUPOSIÇÃO de preços; faixa sugerida ±30%]
| Produto | R$ | O que dá | Limite |
|---|---|---|---|
| Pacote inicial | 9,90 | 300 gemas, pintura e capacete exclusivos, 5 fichas, 3 dias sem anúncios | único |
| Cartão Garagem (mensal) | 14,90 | 100 gemas na hora + 30 gemas/dia por 30 dias, teto offline +2 h | renovável |
| Remover anúncios | 19,90 | sem anúncios; 1 boost grátis/dia | único |
| Passe de Temporada premium | 19,90 | faixa premium (40 níveis) | por temporada |
| Gemas 55 | 4,90 | 55 | ilimitado |
| Gemas 115 | 9,90 | 115 (+4%) | ilimitado |
| Gemas 240 | 19,90 | 240 (+8%) | ilimitado |
| Gemas 500 | 39,90 | 500 (+12%) | ilimitado |
| Gemas 1.050 | 79,90 | 1.050 (+17%) | ilimitado |
| Gemas 2.000 | 149,90 | 2.000 (+19%) | ilimitado |
Gemas só compram boosts, cosméticos, reroll da loja, itens de offline e extras de passe. **Nunca CR, PI, REP, cartas de PvP ou vantagem de PvP.** O PvP usa carros normalizados e nenhum componente.
Riscos: o Cartão Garagem é assinatura (regras de renovação e cancelamento das lojas de aplicativos e do CDC), e pacotes de moeda premium para menores exigem cuidado [VERIFICAR com jurídico].

### 19.8 Passe de Temporada (40 níveis, 28 dias)
XP por nível `100 + 25 × L` (total 24.500). Fontes: missões diárias (150/dia), semanais (500), 5 por corrida (≈ 75/dia) ≈ 875 por dia para completar em 28 dias.
| Nível | Grátis | Premium |
|---|---|---|
| ímpar (1,3,...,39) | 1 ficha | baú de CR (`20 + L` min de renda) |
| par (2,4,...,38) exceto múltiplos de 5 e 10 | baú de CR (`10 + L` min) | 10 gemas |
| 5, 15, 25, 35 | 20 gemas | 1 cosmético comum da temporada |
| 10, 20, 30 | 50 gemas + 2 fichas | 1 cosmético raro exclusivo + 60 gemas |
| 40 | 50 gemas + 2 fichas | pintura exclusiva da temporada + capacete |
(Detalhe de cada nível no JSON: `passe40`.) Tudo que o premium dá é cosmético, gemas ou conveniência; o que foi ganho fica para sempre.

### 19.9 Lojas rotativas, troca de repetidos e loja de evento
**Loja diária (6 espaços, renova 00:00 America/Fortaleza).** Semente `hash(playerId + data)`: recarregar a página não rerola. Reroll: 10 gemas, 1 por dia. Nunca oferece cosmético ou componente já possuído. Probabilidades visíveis.
| Espaço | Conteúdo | Pagamento |
|---|---|---|
| 1 | Componente da categoria atual (15 a 30% off) | CR |
| 2 | Boost ou ficha | CR ou gemas |
| 3 | Treino ou "Pular 1 h" | CR ou gemas |
| 4 | Cosmético (pesos: comum 60, raro 28, épico 10, lendário 2) | gemas |
| 5 | Cópias de piloto/engenheiro (pesos: 55, 30, 12, 3) | CR |
| 6 | "Oferta do dia": um dos espaços 1 a 5 com mais 20% de desconto | CR ou gemas |
**Loja semanal (4 espaços, renova na segunda 00:00):** carro garantido de raridade ≥ Raro da categoria atual (25× o preço do giro em CR); componente Elite/Lenda com 25% de desconto; cosmético exclusivo da semana (gemas); baú semanal (CR de 60 min + 3 fichas, 150 pontos de troca).
**Troca de repetidos (pontos):** carro garantido pelos valores da §19.3; ficha de destaque 200 pts (3 por semana); cópias de piloto lendário 600 pts (1 por semana); baú semanal 150 pts.
**Loja de evento (GP semanal e eventos mensais; moeda: fichas de evento):** 10 por corrida do evento (+20 por top 3), ≈ 250 por semana jogando 30 min por dia. Pintura 400, capacete 300, efeito de chegada 250, baú de CR (60 min) 50 (x5), ficha de destaque 120 (x2), 30 gemas por 100 (x3). Saldo restante vira CR a 50% ao fim do evento.

### 19.10 Equilíbrio: progresso da loja x do jogo
| Fonte de poder (PI) | Teto | Vem de |
|---|---|---|
| Melhorias do carro (6 ramos) | principal (PI 8 a 25 por categoria) | **jogo** (CR) |
| Carro (invocação) | +22% | **jogo** (CR/fichas/pontos); nada pago |
| Componentes | +15% | **jogo** (CR) |
| Pilotos e engenheiros | +24% | **jogo** (CR/cópias) |
| Nível de escuderia | até +150% (L500), com a IA acompanhando | **jogo** (XP) |
| Títulos e Legado | +8% por título, talentos | **jogo** |
| Dinheiro real | **0% de PI** | cosméticos, gemas, conveniência |
Ou seja, **100% do poder é ganho jogando**; a loja paga vende aparência, conveniência (ficha, boost, pular, remover anúncios) e apoio. Estimativa de aceleração máxima por conveniência paga: CR em dobro o tempo todo = ~13% menos tempo até a F1 (simulação); "pular" dá só CR. Tempo para obter sem pagar (jogador casual, 30 min/dia): primeiro Carro Raro ~1 dia; Componente Pro ~2 dias; Elite ~2 semanas; Lenda ~2 meses; Lendário por troca ~2 semanas; Mítico por troca ~2 meses; cosmético épico por gemas grátis (~300 gemas/mês) ~1 mês; passe grátis completo em 28 dias. [Estimativas de calendário, derivadas dos tempos de §19.3 e §4.4, não da simulação.]

---

## 20. Achados técnicos adicionais e simplificação (do diagnóstico das telas internas)

### 20.1 Quatro sistemas de upgrade e três de renda idle -> unificar
Hoje existem **4 sistemas de upgrade** (Oficina de melhorias, Peças, Projetos do campeonato "0/200", geradores) e **3 de renda idle** (Farm, Operação/geradores, Contratos). Decisão:
| Hoje | Depois |
|---|---|
| Oficina (4 itens) | **Oficina** (6 ramos, §5) |
| Peças | **Componentes** na Loja (§19.2); somam PI |
| Projetos 0/200 do campeonato | viram **Projetos de carro** (construir carros com Materiais), sem upgrades paralelos; o campeonato usa a mesma Oficina |
| Geradores | **Equipe** (única renda idle) |
| Farm | cortado; banco migra para CR (§8.2) |
| Contratos | passam a ser **missões cronometradas** (60 s/5 min/15 min) que dão Materiais e CR; não são renda idle |

### 20.2 Duas corridas em paralelo (pista + campeonato)
O Campeonato roda uma corrida automática de ~30 s em paralelo à da pista, com grid de 20. Decisão: o Campeonato vira **evento ativo opcional** (botão "Disputar etapa", corrida pausa a pista), não corre em segundo plano; usa o mesmo motor de corrida e o mesmo PI normalizado do modo. Impacto: menos CPU, menos DOM, balanceamento único.

### 20.3 Re-render excessivo (etapa técnica cedo)
Medido: ~1.200 mutações de DOM em 2 s com a corrida rodando; botões recriados a cada quadro fazem cliques "não pegarem" (a "Melhor compra agora" falhou na 1ª tentativa). Regra: **render só quando o estado muda** (comparação por versão do estado/`dirty flags`), nunca recriar botões; atualizar texto com `textContent` em nós existentes; desenho do canvas em `requestAnimationFrame` separado do DOM. Critério: com a corrida rodando, ≤ 60 mutações de DOM por segundo e clique em qualquer botão responde na primeira tentativa em 100% de 50 tentativas automatizadas.

### 20.4 Save com atraso e multi-aba
- Salvar **imediatamente** após compra, mudança de categoria e prestígio, além do salvamento periódico; e em `beforeunload`/`pagehide`/`visibilitychange` (estado `hidden`). Falha de gravação: faixa visível.
- **Trava multi-aba:** `BroadcastChannel('apex-idle')` + `navigator.locks` (se existir; senão heartbeat em `localStorage` com `tabId`). Segunda aba abre em modo leitura com aviso "Jogo aberto em outra aba". Teste: abrir duas instâncias, só uma grava.
- `grantTestCredits` (+1.000.000 CR) permanece protegido por `testMode` e é removido da build de produção (teste que garante que a chamada não existe no bundle).
- Chave pública do Supabase no `config.js` é normal para cliente, mas exige RLS bem feito [VERIFICAR no banco]. `Contratos` não aceita carros históricos (bug provável): corrigir para qualquer carro que o jogador possua e escrever o teste.

### 20.5 Propriedade intelectual: nomes fictícios para pilotos, carros e marcas reais
O jogo usa nomes reais de pilotos e carros (diagnóstico). Antes de vender: trocar por fictícios (e revisar a pintura que lembra equipes reais). Tabela sugerida (validar com jurídico; evitar trocadilhos próximos demais ao original):
| Tipo | Real (hoje) | Sugestão fictícia |
|---|---|---|
| Piloto | Senna | Aryon Teles |
| Piloto | Hamilton | Lewin Hallam |
| Piloto | Verstappen | Maks Verhaar |
| Piloto | Schumacher | Mikael Schaube |
| Piloto | Prost | Alain Prevost-Lenz |
| Piloto | Fangio | Juan Manuel Fanduz |
| Piloto | Vettel | Sebastiano Vettri |
| Piloto | Alonso | Fernan Alvarenga |
| Piloto | Raikkonen | Kimi Rautalampi |
| Piloto | Leclerc | Charlo Lecler-Dumas |
| Carro | Ferrari F2004 | Scarlatto Corsa S-04 |
| Carro | McLaren MP4/4 | Mercurial MR-4 |
| Carro | Red Bull RB19 | Taurus Racing TR-19 |
| Carro | Williams FW18 | Wilson Garage W-18 |
| Marca | "F1", "Fórmula 1" | "Fórmula Apex" ou "Categoria F1" substituído por "Elite" |
| Link | formula1.com e tempos oficiais | remover; usar só tempos próprios |
As categorias "F4/F3/F2/F1" são siglas genéricas de formulas, mas "F1" é marca registrada: considerar nomes alternativos como "Classe Elite" para a categoria 5 (decisão do dono). Os circuitos reais (bacinger/f1-circuits, MIT) são geometria pública, mas os nomes oficiais de GP e logos não devem aparecer; usar nome do local ("Autódromo de Interlagos") e checar com jurídico.

## 21. Sistemas e telas internas observadas (resumo para o prompt)
Missões (12 objetivos) funcionam e são hoje a melhor fonte de REP escondida: promover a "Diárias/Semanais" no topo da tela Pista. Farm: funciona, será cortado. Peças: equipar só nos boxes, efeito baixo (−0,22 s/volta): migrar para PI. Invocação: bonita (animação de revelação), manter e adicionar taxas na tela. Campeonato: 6 níveis (Júnior...), gemas, recrutar, diárias, passe e evento próprios: **consolidar** o passe e o evento no Passe/Evento únicos. PvP e rankings dependem de perfil online (Supabase) e ficaram em "Conectando…": exigem validação no servidor antes de monetizar. Ascensão: cortada. Circuitos: rótulo mistura "XP" e "pontos": usar sempre REP.
