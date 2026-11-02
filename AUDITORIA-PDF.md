# Auditoria e implementação do PDF — 02/11/2026
Base: 4a12dc21a57c9ac1c2e0cbb56874ec0fe48bf7c4.

## Auditoria antes de editar
Stack HTML/JS/CSS/Canvas, sem framework. Lógica em engine.js; loop/save em game.js; corrida em race-engine.js/race-ui.js; migração em game/save.js; interface em night-ui.js/night.css.
Equipamento passava por engine.js, legends-model.js e lineup-model.js; a renderização usa traffic-view.js.
Preservados chave apex-idle-v2, coleções, pilotos/afinidades, gacha, oficina, oito horas offline, ERS, 24 circuitos, rádio, títulos, sistemas anteriores e Vercel.

## Causas encontradas na base
- engine.js:67 bloqueava equipar com s.running; lineup-model.js:6 e :9 exigiam pista pausada; race-ui.js:12 bloqueava novamente A.equipCar enquanto race existisse.
- engine.js:14 não incluía o bônus do carro original no prêmio por volta.
- traffic-view.js:3 forçava a cor âmbar no jogador, em vez da pintura do carro equipado.
- A duração do objeto race era fixada na largada em night-ui.js:45 e não atualizada ao mudar de carro.
- summoning-hub.js:13 usava s.money no cache estrutural e :20 recriava o conteúdo; ganhos contínuos descartavam o canvas do banner, causando piscadas.
- Não foi encontrada perda deliberada do id no save: os campos antigos persistiam, mas havia fontes de seleção separadas e bloqueios de UI/modelo.

## Solução
garage-state.js centraliza garage.owned/equipped e migra os campos legados sem perder coleção. Os campos anteriores permanecem espelhos de compatibilidade.
Compra e invocação só adicionam propriedade. Equipar valida posse e reserva de contrato; altera o mesmo estado usado por desempenho, prêmio, arte e save.
A corrida deriva duration a cada passo, preservando elapsed/distance. Trocas de F1/piloto são permitidas durante a corrida principal; campeonato e reserva de contratos conservam seus bloqueios.
O banner só reconstrói por alterações estruturais e limites de compra, e pinta imediatamente; o caixa atualiza sem descartar o canvas.
A invocação revela antes de correr, retira a interrogação e leva a aura junto até cruzar a chegada.
Corrida automática na abertura, ERS como ação principal, objetivo contextual, tutorial 3 passos, Caixa/Pontos/Títulos e renda estimada, lojas com previsão e melhor compra por ganho de CR/s por custo.
Patrocínio/Temporada aparecem conforme progresso. Configurações e saves continuam acessíveis no Paddock. Manutenção após a bandeirada permite usar acertos/peças sem remover recursos antigos.
As fórmulas e custos anteriores foram mantidos onde o documento permite; não foram criados carros a1–a6 nem substituídos os 24 circuitos.
Nova temporada mantém garagem e seleção e reseta também apoios/automação de temporada. Títulos continuam exigindo renda nova, sem prestígio gratuito.

## Verificação
npm test: 22 suítes, incluindo compra sem equipar, troca ao vivo, prêmio/ritmo derivados, exportação/reload, carro não possuído, save antigo, fallback inválido e preservação da garagem no prestígio.
Build estático. Não há lint configurado; checagem node --check nos JS alterados.
Os resultados de navegador e URLs finais constam no relatório da entrega.
