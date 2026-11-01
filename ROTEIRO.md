# Apex Idle — direção de produto e roteiro

Pesquisa inicial em 01/11/2026. Objetivo: gestão acessível de uma escuderia de monopostos, em 2D, com decisões que alteram resultados e progresso automático compreensível. Esta é uma hipótese de produto a validar com jogadores, não uma promessa de retenção.

## O que a pesquisa sustenta

- TopIdle: vários títulos anunciam progresso offline, evolução, builds, clãs e competição. O ranking mistura votos e exposição comercial; não permite concluir receita ou retenção. Fonte: https://topidle.com/
- Melvor Idle: progressão de atividades e cuidado com experiência offline e uso de CPU aparecem nas notas oficiais. Aplicação: automação configurável, resumo de retorno e ganho transparente. Fonte: https://news.melvoridle.com/major-update-v1-2/
- Não implementei nem testei partidas completas dos jogos listados. O levantamento inicial usou páginas públicas e documentação; a próxima pesquisa deve observar onboarding e sessões reais de dois concorrentes antes de definir recursos sociais.

## Fórmula 1: formatos e tradução para o jogo

### Fim de semana convencional

Três treinos livres, classificação e GP. Treinos permitem entender o circuito e ajustar o carro; a classificação estabelece a posição de largada. Tradução: treino automatizado entrega conhecimento do acerto; o jogador escolhe uma configuração; classificação calcula voltas de desempenho; corrida executa estratégia. Evitar transformar cada treino em espera obrigatória.

### Fim de semana Sprint

Treino e classificação Sprint na sexta; Sprint e classificação do GP no sábado; GP no domingo. Sprint é uma prova de aproximadamente 100 km sem pit stop obrigatório. Os oito primeiros recebem 8 a 1 pontos; seu resultado não define o grid do GP. SQ1/SQ2/SQ3 duram 12/10/8 minutos. Com 22 carros, seis saem em cada uma das duas primeiras fases. Tradução: evento opcional curto, com resultado e classificação separados do GP.

Fonte: https://www.formula1.com/en/latest/article/the-beginners-guide-to-the-f1-print.55yJBEiF7vYkZEwSV9lZJ9

### Pneus e estratégia

Soft privilegia ritmo, hard durabilidade e medium equilíbrio; há pneus para condições molhadas. Para o jogo: compostos precisam ter custo de desgaste e janela de parada, não apenas um bônus permanente. Planejar parada automática evita exigir presença contínua. A primeira garagem ainda não simula pneus, clima nem pit stops.

### Tecnologia de 2026

Aerodinâmica ativa altera configurações das asas. Boost é uso de energia pelo piloto; Overtake Mode possui condição de proximidade e é distinto do Boost; recarga recupera energia. As regras sofreram refinamentos ao longo do ano. O ERS atual com ritmo dobrado é arcade e não representa potência ou recarga reais. Não acrescentar DRS ao modelo de 2026 por hábito.

Fontes: https://corp.formula1.com/f1-2026-regulations-terminology-update/ e https://www.formula1.com/en/latest/article/refinements-to-2026-f1-regulations-agreed-by-all-stakeholders.1xA0TRau0DvyId6R7oZjFv.1xA0TRau0DvyId6R7oZjFv.1xA0TRau0DvyId6R7oZjFv

Antes de implementar campeonato, conferir versão vigente do regulamento esportivo FIA e documentar pontuação, desempates, classificação, limites e exceções. Não tratar resumos históricos como especificação de 2026.

## Ciclos para tornar a experiência cativante

1. Segundos: movimento, rádio e feedback visual da passagem.
2. Minutos: testar um acerto, comprar uma melhoria e ver a previsão mudar.
3. Sessão: alcançar uma meta e desbloquear um circuito ou componente.
4. Dias: formar dupla de pilotos e disputar uma temporada.
5. Longo prazo: desenvolver sede e legado entre temporadas, com reinício voluntário claramente explicado.

Motivadores: identidade da equipe, domínio da estratégia, pilotos memoráveis e comparação com resultados anteriores. Não depender de cliques repetitivos, punição por ausência ou bônus diários que apagam progresso.

## Entregas em ordem

| Etapa | Entrega | Critério para avançar |
|---|---|---|
| 1 — Garagem, iniciada | Três identidades de equipe, pintura, acerto de asas e suspensão, previsão e persistência | Escolha altera visual; acerto altera ritmo; saves antigos continuam válidos |
| 2 — Primeira corrida real | Geometrias distintas, grid, voltas limitadas, rivais simulados e classificação final | Resultado nasce da simulação, com explicação do ganho/perda de tempo |
| 3 — Estratégia | Compostos, desgaste, parada automática, ritmo e energia | Estratégias diferentes podem vencer em circunstâncias diferentes; offline usa as mesmas regras |
| 4 — Fim de semana | Treinos, classificação e GP; Sprint depois | Grid da classificação afeta a prova e Sprint mantém resultado separado |
| 5 — Campeonato | Dois carros, pilotos, contratos, pontos, construtores e calendário | Temporada completa reproduzível, desempates definidos, nenhum bloqueio econômico |
| 6 — Progressão | Pesquisa, sede, patrocinadores com objetivos, conquistas e legado | Metas curtas e longas claras; retorno offline explicado |
| 7 — Serviço online | Contas, banco, simulação autoritativa e ranking | Saldo e resultados verificados pelo servidor; recuperação e migração de saves |
| 8 — Lançamento | QA mobile, acessibilidade, tutorial, hospedagem e ficha TopIdle | Partida completa sem erro bloqueante; link público e descrição honesta |

## Escopo da etapa 1

Equipes fictícias e equilibradas, sem vantagens iniciais. Seleção troca identidade/pintura; melhoria e acerto determinam desempenho. Acertos gratuitos apenas com corrida pausada. Valores atuais são de balanceamento arcade e não instruções de engenharia reais. Alvos de acerto variam por circuito; por enquanto não há telemetria nem descoberta por treino. Saves antigos recebem defaults sem apagar saldo.

## Validação de produto planejada

Observar se um novo jogador consegue iniciar, comprar melhoria e entender um acerto sem ajuda. Medir tempo até primeira decisão, compreensão da previsão, conclusão de corrida e vontade de continuar. Instrumentação e testes com pessoas ainda não realizados. Ajustar economia com esses resultados antes de monetização ou multiplayer.

## Incremento entregue — Invocação

Aba de invocação com créditos do jogo, quatro modelos fictícios sorteáveis, chances explícitas, reembolso de repetidos e coleção persistida. Carro equipado altera pintura e ritmo. Sem monetização, garantia de raridade ou mercado. Testes de regras e compatibilidade de saves adicionados; balanceamento com jogadores e inspeção visual em dispositivo real pendentes.

## Incremento gacha — cinco qualidades
Comum, raro, épico, lendário e mítico com identidade por cor, taxas explícitas 60/25/10/4/1%, invocação ×1/×10, histórico de dez resultados e garantias 10/50/100. Receber a qualidade-alvo ou superior reinicia sua garantia; contadores persistem entre sessões e lotes. Preserva carros já obtidos; contadores novos começam em zero. Referências e limitações no README. Wishlist, evolução por cópias e banners de destaque ficam como possibilidades futuras, sem anúncio de entrega. Testes de regras e build passaram; inspeção visual local bloqueada por acesso ao localhost.

## Revisão solicitada — desejo, loja e testes
As regras atuais substituem os valores do incremento anterior: lendário 0,5%, mítico 0,1%; desejo dobra a chance atual do carro; repetidos rendem pontos; loja de modelos; garantias épico 10/lendário 200; sem garantia mítica, com +0,01 pp por falha até 25% antes do desejo e reinício no mítico. Comum 49,4%/raro 35%/épico 15% completam o pool base e permitem dobrar qualquer modelo sem ultrapassar 100%. Animação com pular e modo ?test=1 concede um milhão de créditos uma vez por save. Testes cobrem regras, persistência, loja, crédito idempotente e mil sorteios reproduzíveis; sintaxe e build verificados. Inspeção visual permanece pendente por indisponibilidade de acesso do navegador ao servidor local.

## Revelação central de invocação
Diálogo centralizado e responsivo com F1 vetorial original misterioso, interrogação, passagem pela linha de chegada e revelações individuais. Avanço automático/manual, revelar todos, Escape e modo de movimento reduzido. Verificação automatizada da sequência e cobrança única, além dos testes do motor e build. Inspeção visual interrompida pela ferramenta de navegador por não conseguir identificar a URL do Chrome com segurança; não foi validada visualmente.
