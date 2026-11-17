# Estratégia, garagem e continuidade — 16/11/2026

Continuação de `planejamento-status-2026-11-16.md` e da análise de produto de 14/11. Esta entrega melhora os fluxos que conectam coleção, preparação, corrida e retorno ao jogo.

## O que mudou

- **Garagem:** presets passam a guardar pneus de largada, volta da parada, pneus dos boxes, ritmo e engenheiro automático, além do carro, piloto, engenheiro, componentes e acerto que já guardavam. Presets antigos continuam válidos. A confirmação inicial do carro permite verificar o conjunto na pista.
- **Planejamento:** a lista de voltas considera a prova agendada, incluindo endurance de oito voltas. Um plano com parada tardia é ajustado à distância da corrida sem apagar o preset original. A interface explica que as regras e o ERS dos históricos são uma adaptação arcade.
- **Compartilhamento:** “Compartilhar composição” gera um link com carro, piloto, engenheiro e estratégia. Quem abre pode inspecionar a composição em Canvas e só aplicá-la se possuir os integrantes. O link não concede itens, não transporta saldo ou conta e não envia mensagens automaticamente.
- **Pilotos:** cada treino mostra duração, XP, mudança prevista de nível, bônus individual e efeito no bônus total da equipe. A previsão usa as fórmulas de recompensa existentes.
- **Equipe:** o desbloqueio exibido coincide com a regra efetiva de compra; cada linha mostra a produção com os multiplicadores vigentes.
- **Retorno:** voltar de uma aba em segundo plano mostra o crédito offline já aplicado e acesso às melhorias, sem pagar novamente. A medição distingue esse retorno da renda residual e inicia a nova sessão antes do evento quando aplicável.
- **Online:** consultas automáticas não bloqueiam ações nem destroem campos em edição. Respostas antigas não sobrescrevem uma ação mais recente, e erros temporários desaparecem quando a conexão volta. O cabeçalho da escuderia e a contribuição efetiva ao GP ficam visíveis.

## Preservado

Stack JavaScript/Canvas, chave `apex-idle-v2`, importação/exportação, saves anteriores, 20 históricos e dois exclusivos, preços e duplicatas definidos pelo usuário, probabilidades e garantias do gacha, Academia, progressão, economia, conta, eventos e competição existentes. Os novos campos são opcionais para saves anteriores. Toda arte continua no Canvas existente.

## Verificação

Suíte completa: 160 testes via `node:test`, além dos scripts de regressão existentes, sem falhas. Após a revisão, um teste adicional de recuperação da conexão foi adicionado; os 12 testes de planejamento e integração online passaram (161 testes no conjunto). Build estático de 116 arquivos e verificação de sintaxe dos 17 arquivos JavaScript alterados aprovados. O projeto não define comando de lint.

A cobertura inclui preset antigo/novo, corrida real de oito voltas, aplicação do plano em distâncias menores, recompensa de treino, link sem concessão de inventário, desbloqueio e produção da equipe, crédito offline único, edição durante consulta online e concorrência entre consulta e ação.

A inspeção visual nova a 1366 px e 390 px permanece pendente: a ferramenta encerrou o controle nativo por não conseguir validar a URL. Testes de lógica/API e verificação HTTP do deploy não substituem essa etapa. Não há resultado novo de retenção com jogadores nem teste de carga na rede real; os limites do protocolo de validação continuam válidos.

## Como conferir

1. Em **Meu F1 → Garagem**, escolha o conjunto, abra **Planejar pneus e parada**, salve um preset e recarregue o jogo. Reaplique o preset e confira a próxima corrida.
2. Na semana de endurance, agende a prova em **Carreira** e veja as opções de parada até a sétima volta.
3. Use **Compartilhar composição**; abra o link em outro save. Itens ausentes devem impedir a aplicação, sem alterar a coleção.
4. Em **Equipe → Pilotos**, confira as previsões antes de iniciar o treino. Em **Equipe**, compare a soma das linhas à produção total.
5. Deixe a aba em segundo plano por mais de um minuto e volte. Confira o resumo e o crédito uma única vez.
6. Em **Carreira → Escuderia e amigos**, digite nos campos durante as atualizações. Confira os pontos da equipe após uma prova válida.

## Arquivos modificados

`src/race-plan.js`, `src/formation.js`, `src/shop.js`, `src/v2-adapter.js`, `src/v2-ui.js`, `src/v2.css`, `src/product-view.js`, `src/career-journey.js`, `src/social-view.js`, `src/safe-dom.js`, `strategy-ui.js`, `tactics.js`, `night-ui.js`, `ranked-ui.js`, `ranked.css`, `index.html`, `build.cjs`, `sw.js`, `package.json`, `planning-product-test.cjs`, `online-flow-test.cjs` e os documentos de entrega/acompanhamento/validação.
