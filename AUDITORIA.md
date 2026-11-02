# Auditoria do Apex Idle
Estado auditado: 08f23faa7a1f0fc45674d7680890f4a946d6a1bd. HTML, CSS e JavaScript clássico, build estático com Node, APIs Vercel para PvP. Não é React ou Next.js.

| Pilar | Existe? | Onde no código | O que falta |
|---|---|---|---|
| Loop clique e geradores | Parcial | game.js, engine.js, farm-model.js | Corrida e farm automáticos existem. Acrescentar operação manual e seis geradores sem substituir a corrida. |
| Escala de custo | Sim | engine.js, championship-model.js | Preservar curvas existentes; nova economia usa 1,15 por unidade. |
| Formatação | Parcial | game.js fmt | Adicionar K/M/B/T/Qa/Qi e científica, sem valores não finitos. |
| Offline | Sim | game.js, farm-model.js, championship-model.js | Nova produção com 50%, teto de 8 h e resumo próprio. Preservar regras antigas. |
| Save automático | Sim | game.js | Save v1 migrado para chave v2, conflito de abas, JSON export/import. Acrescentar backup de corrupção e texto base64. |
| Upgrades por marco | Parcial | farm-model.js | Farm ganha eficiência a cada cinco níveis. Acrescentar 10/25/50/100 e upgrades x2 na nova operação. |
| Prestígio | Sim | championship-model.js | Regulamento do campeonato existe. Criar Ascensão própria com Fragmentos sem apagar carros/pilotos. |
| Conquistas e estatísticas | Parcial | career-model.js, missions-model.js | Missões e carreira existem. Adicionar 20 conquistas do novo ciclo, tempo, cliques, ganhos e ascensões. |
| Compra em lote | Parcial | championship-model.js | Peças usam 1/10/máximo. Acrescentar geradores 1/10/100/Máx com soma geométrica. |
| Feedback visual | Sim | drops.js, summon-cinema.js, farm-ui.js | Canvas e cinema gacha existem. Acrescentar feedback da nova operação e efeitos configuráveis. |
| Conta e nuvem | Não | ranked-ui.js usa identidade própria | Supabase Auth, RLS, sincronização com revisão e ranking de Fragmentos. Não substituir a identidade do PvP. |

## Decisões de integração
A nova Operação/Ascensão usa o caixa CR compartilhado. As compras da operação consomem CR; a Ascensão zera apenas seus próprios geradores, upgrades e ganhos do ciclo e o saldo de CR compartilhado, mediante confirmação explícita. Coleção, academia, farm, carreira e campeonato são preservados. Ganhos totais da operação e Fragmentos nunca diminuem. Progresso legado recebe a nova seção ao carregar, sem reset.

O ranking semanal exige histórico por semana além da view de ranking geral do anexo. A migração SQL acrescenta uma tabela semanal com apenas métricas públicas e escrita controlada pelo mesmo processo de save. Os dados do save permanecem privados. Validação monotônica básica não prova legitimidade de pontuações calculadas no cliente.

Não há variáveis Supabase nem integração Supabase na Vercel nesta auditoria. Ativar contas e validar RLS real depende de conectar um projeto Supabase. A interface de convidado continua disponível independentemente dessa conexão.
