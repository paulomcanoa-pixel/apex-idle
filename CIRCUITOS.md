# Circuitos reais — Apex Idle

24 circuitos do calendário originalmente anunciado para 2026, incluindo Jeddah. É uma coleção de pistas, não uma agenda atualizada de corridas. Os antigos índices 0/1/2 agora correspondem a Interlagos, Barcelona e Bahrain, mantendo seus requisitos de reputação e os saves existentes. Os demais circuitos são desbloqueados progressivamente.

## Geometria

Coordenadas de https://github.com/bacinger/f1-circuits, licença MIT em CIRCUITS-LICENSE.txt. A linha central geográfica é projetada com correção de longitude pela latitude média, norte para cima, escala uniforme e margem fixa. Não há espelhamento, deformação independente dos eixos ou substituição por polígonos inventados. São representações cartográficas da base comunitária, sujeitas à precisão e atualização dela; não reproduzem elevação, largura física, escapes ou construções reais. Suzuka recebe um desenho de viaduto no cruzamento. Carros e miniaturas usam a mesma geometria.

## Tempos e economia

Cada circuito registra distância e a referência publicada como “Fastest lap time” na página da F1, com piloto, ano e link próprio. Dados consultados em 01/11/2026. Bahrain e Jeddah usam páginas de 2025: a página 2026 de Bahrain estava apresentando metadados de outro circuito e Jeddah não continha os dados. Fonte-base: https://www.formula1.com/en/racing/2026. O nome do campo da F1 não implica comparação entre todas as configurações históricas nem recorde de classificação.

O tempo do jogador é simulado a partir dessa referência, acerto, melhorias e peças. Sem pneus/ERS, o carro inicial é mais lento e o desenvolvimento aproxima seu ritmo da referência por retornos decrescentes. A referência não muda. ERS adiciona 8% ao ritmo durante cinco segundos. Estratégia, pneus e ritmo de corrida continuam arcade. Os rivais usam a duração da corrida atual, deixando de completar voltas fixas de 16 segundos.

Créditos por volta foram escalados pela nova duração-base para evitar reduzir drasticamente o ganho por minuto do idle. O limite offline permanece em oito horas. Reputação continua sendo ganha por volta: desbloqueios levam tempo de pista real.

## Validação

`node circuits-test.cjs` verifica 24 geometrias diferentes, projeção sem distorção de proporções, fechamento e coordenadas finitas, duração, recompensas, validação dos saves e escala dos rivais. A suíte existente de coleção, estratégia, peças e corrida também deve passar. O teste econômico anterior foi atualizado para não depender de voltas fictícias de 16 segundos.
