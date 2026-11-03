# Apex Idle: diagnóstico do site publicado (2026-11-02)

Fonte: https://apex-idle.vercel.app ("PROTÓTIPO 0.3"), testado no navegador do app como convidado.
O código público (JS sem bundler, ~400 KB) foi baixado só para leitura em `trabalho/apex-idle/fonte-publicada/`.
Console sem erros. Rede: só arquivos estáticos + Supabase (login opcional, "Convidado · salvo neste navegador").
Save: `localStorage['apex-idle-v2']`, formato `{version:1, money, laps, rep, levels[4], circuit, ...}` + subobjetos
`garage, career, farm, championship, heritage, academy, summonPity, idle, night, onboarded, raceInProgress`.

## Mapa de telas (barra inferior)
- **Pista**: corrida 2D de 6 voltas contra 9 IAs (Solaris…Bellona), classificação ao vivo, ERS (espaço, 5 s / recarga 30 s),
  "Melhor compra agora", Missões, meta "Faltam N pontos para Barcelona-Catalunya", tutorial 3 passos.
- **Carro**: Garagem (F1 e piloto; Acerto e pintura), Desenvolvimento (Melhorias; Peças), Coleção (Álbum; Projetos).
- **Equipe**: Pilotos; Renda da equipe (6 geradores idle); Farm idle; Contratos; Ascensão; Conquistas; Ranking de Fragmentos.
- **Campeonato**: Campeonato; PvP Ranked; Ranking geral; GP semanal; Circuitos (24 pistas por reputação); Nova temporada; Progresso.
- **Loja**: Invocação (gacha de carros, 200 CR, pity 10/200, lista de desejos); Patrocínio (6 metas com prêmio).
- Menu "Mais": export/import de save, câmera (zoom 2,5–10, padrão 5, seguir carro), efeitos, notação, engenheiro automático,
  ritmo Poupar/Normal/Atacar, pit stop, conta e sincronização.

## O que funciona (testado)
- Corrida roda, termina, mostra resultado (P10, +1 ponto, 118 CR, +3 peças) e relarga em 2 s.
- Compra de melhoria: Motor nível 0→1 custou 100 CR; volta 12,600 s → 12,265 s (-2,7%); próximo custo 155 CR (×1,55).
- Seletor ×1/×10/Máx; "Melhor compra agora" sugere Patrocínio 180 CR.
- Save automático no navegador ("✓ Progresso salvo"); offline limitado a 8 h (80% da produção idle).

## Problemas encontrados
1. **Progressão travada no começo**: o jogador termina P10 a ~30 s do líder (líder ~9,3 s/volta, jogador ~14 s/volta).
   P10 dá 1 ponto; a 2ª pista pede 30 pontos → ~30 corridas (~40 min) sem melhora perceptível de posição. Cada nível de
   motor dá só ~2,7% e o custo cresce ×1,55, então o jogador nunca alcança o pelotão. Pistas seguintes pedem +50 XP cada
   (100…1150) e multiplicam renda ×2,3…×15 sem ligar com a dificuldade da IA de forma clara.
2. **Moedas e sistemas demais e sobrepostos**: CR, Pontos/reputação, Gemas (só no Campeonato), Fragmentos, pontos de
   invocação, peças, fichas. Dois prestígios concorrentes (Ascensão reseta só a renda idle; Nova temporada reseta carro+idle
   com meta 1,5 M CR). Duas economias paralelas (corrida e geradores idle) e vários "níveis" (online, operação 0/30, 0/200).
3. **Melhorias confusas**: 4 itens no modelo (Motor, Aero, Pneus, Patrocínio), mas a oficina lista 3 + ERS 25K; Patrocínio
   só aparece na "melhor compra". Tela de Peças à parte (6 categorias × 3 tiers) com pesos de pista definidos só para 3 das
   24 pistas (bug: `weights[s.circuit]` cai no padrão a partir da pista 4).
4. **Loja dispersa**: gacha de carros na Loja, peças em Carro > Peças, circuitos em Campeonato, ERS na Oficina, gemas
   sem fonte clara para o novato. "2 banners" no rótulo da Loja, mas só 1 visível.
5. **Botão "Melhorar carro"** na tela de resultado não abre a oficina (só fecha o resultado).
6. Pedidos do usuário (2026-11-02): corrida **mais lenta** (hoje ~12–14 s por volta na tela, `duração = max(4, tempo×0,15)`);
   **zoom** que mostre a pista inteira sem ficar distante (hoje padrão 5×, seguindo o carro); **efeitos nos cliques**;
   pode **mudar o design** se necessário (manter a identidade atual: fundo azul-noite, amarelo/verde-limão, cartões arredondados).

## Não verificado
Telas internas de Campeonato, PvP, GP semanal, Álbum, Projetos, Contratos, Farm e Ascensão não foram abertas uma a uma
(o código delas está na pasta). Não criei conta nem fiz login. Não testei o progresso offline real (precisa esperar).

## Telas internas (testadas em 2026-11-02, cliques reais)
| Tela | Resultado | Observação |
|---|---|---|
| Missões (12 objetivos) | **funciona**: recolher deu +200 CR e +5 pontos, salvou | 4 recompensas prontas e ninguém avisa direito; missões dão pontos = melhor fonte de progressão hoje, mas escondida |
| Farm idle (3 operações, nível máx 30) | **funciona**: recolher somou ao caixa | 2º sistema idle paralelo à Operação (6 geradores) |
| Operação / geradores (Equipe > Renda) | abre; 6 geradores 15 CR…1,4 M CR, marcos 10/25/50/100 ×2, clique "Coordenar sessão" +1 CR | 3º sistema de renda; "Dobrar trabalho manual" 100 CR; clicker dentro de um jogo de corrida |
| Peças (6 categorias × Club/Pro/Elite) | **funciona**: Motor Club 250 CR comprado | equipar só "nos boxes" (corrida parada); efeito pequeno (−0,22 s/volta); Pro exige 25 pontos, Elite 100 |
| Invocação (gacha, 25 F1) | **funciona**: 200 CR → Williams FW18 com animação de revelação bonita | também "Fichas: 10", banner exclusivo, pontos de troca, pity 10/200, lista de desejos |
| Campeonato (Júnior 1 de 6) | **funciona**: corrida automática de ~30 s com grid de 20 | 2ª corrida em paralelo à da pista; 4º sistema de upgrade (6 projetos 0/200, 20 CR…); gemas, fichas, recrutar, diárias, passe e evento, prestígio próprio |
| Pilotos / Academia (25 pilotos) | abre; Observar → Provar → Assinar, 3 missões/dia | |
| PvP Ranked / Ranking geral | precisa de perfil online (Supabase); ficou em "Conectando…"; ranking com 0 pilotos | não criei perfil |
| Ranking de Fragmentos | "Carregando o ranking…" sem dados | |
| Ascensão | abre; fórmula √(ganho do ciclo / 1 M); explica bem o que reseta | concorre com "Nova temporada" (meta 1,5 M CR) |
| Contratos | "Invoque ou construa outro carro" mesmo com 3 carros (2 históricos) | provável bug: carros históricos não contam para contratos |
| Circuitos | 24 pistas, 30 XP…1150 XP, ×2,3…×15 | rótulo mistura "XP" e "pontos" |

### Achados técnicos
- **Re-render excessivo**: ~1.200 mutações de DOM em 2 s com a corrida rodando. Os botões são recriados o tempo todo, o
  que explica cliques que "não pegam" (ex.: "Melhor compra agora" falhou na primeira vez) e pesa em celular.
- Save grava com atraso (alguns segundos); se a aba fechar logo após uma compra, a compra pode se perder (não confirmado).
- Duas abas abertas gravam a mesma chave do localStorage (risco de uma sobrescrever a outra; não reproduzido).
- Modo de teste com +1.000.000 CR (`grantTestCredits`) existe no código, protegido por `testMode`; garantir que não vaze.
- Chave pública (publishable) do Supabase no `config.js`: normal para cliente, mas exige RLS bem feito no banco.

### Riscos para vender o jogo
- **Propriedade intelectual**: usa nomes reais de pilotos (Senna, Hamilton, Verstappen, Schumacher…), carros reais
  (Ferrari F2004, McLaren MP4/4, Red Bull RB19, Williams FW18 com pintura parecida), "F1", "Fórmula 1", link para
  formula1.com e tempos oficiais. Para comercializar: trocar por nomes e pinturas fictícios ou licenciar. Mapas de
  circuitos vêm de bacinger/f1-circuits (MIT); nomes de circuitos também podem ter marca.
- Gacha com dinheiro real exige taxas visíveis (já existem), pity e atenção a regras de loot box/consumidor por país.
