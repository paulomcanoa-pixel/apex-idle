# Auditoria da corrida noturna

Base: 46ba5300d006e163e23203d46b14cf784f8e055c.

## Stack e estrutura
HTML/CSS/JavaScript clássico, Canvas 2D e Node para build estático; APIs Vercel para PvP; Supabase para conta/save/ranking. Sem migração de framework. Arquivos principais na raiz, módulos puros em game/, cliente em src/lib/supabase.js e SQL em supabase/.

Estado e persistência: game.js, engine.js, game/save.js; chave localStorage apex-idle-v2 com leitura do legado apex-idle-v1. Loop requestAnimationFrame em game.js. Corrida em race-engine.js/race-ui.js, pneus e estratégia em strategy-ui.js/tactics.js, tráfego em traffic-model.js/traffic-view.js, câmera em camera-view.js e cenário em circuit-scenery.js. CSS base style.css, immersive.css, camera-view.css e folhas específicas.

## Manter
Save e backup de corrupção; exportação JSON/base64 e importação de ambos; limite offline de 8 h; ERS 5s/30s/+8%; 24 circuitos geográficos e desbloqueios existentes; níveis da oficina e seus custos; rádio; nomes e identidade da Escuderia Aurora; coleção e pintura dos carros; gacha e banners; Academia; farm, missões, contratos, campeonatos, PvP, Operação/Ascensão e Supabase. Nenhum dado de coleção deve ser removido.

## Evoluir
A corrida atual tem 5 voltas, 3 rivais e 3 luzes; classificação textual pouco legível; não possui recordes por volta nem nova temporada com títulos. Visual com estilos acumulados, predomínio diurno e lojas baseadas em cartões repetidos. ERS não possui anel/atalho/automação. Adicionar pontos/recompensa de chegada e ciclos automáticos.

## Integração planejada
O motor legado continua com cinco voltas por padrão para preservar simuladores/testes existentes. A experiência principal passa opções de seis voltas e grade de dez carros ao mesmo motor, mantendo desgaste, paradas e ritmos. O ritmo da nova corrida é arcade, sem alterar os dados geográficos nem as referências históricas das pistas.

Circuitos sugeridos aparecem primeiro na nova loja, mantendo todos os índices e requisitos antigos para não bloquear saves. Títulos da Nova temporada dão +25% e preservam reputação/recordes/coleções. A Ascensão por Fragmentos permanece acessível. O novo save night.v=1 é opcional para saves antigos e inicializado sem perda de campos. A equipe utiliza os geradores existentes, com seus marcos e custos preservados.

