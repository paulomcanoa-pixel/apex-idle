# Continuação da entrega — 17/11/2026

> Continuação de 18/11: [pendências implementáveis concluídas e limites restantes](entrega-plano-2026-11-18.md).

## Alterações

- Atualização do aplicativo: um único aviso; a recarga espera o novo service worker assumir o controle. Falhas permitem tentar novamente e a ativação por outra aba não interrompe a corrida.
- Janelas baixas: minimapa e controles ficam no painel recolhível “Mapa e câmera”, abaixo da altura real do HUD. O painel tem rolagem, controles de toque e fechamento por Escape. Telas altas mantêm o mapa aberto.
- Novos jogadores precisam confirmar um carro na garagem para concluir a primeira dupla. Saves antigos mantêm o progresso inferido e as recompensas resgatadas.
- Aplicar composição ou preset registra a confirmação do carro e as mudanças efetivas de piloto/engenheiro, respeitando o consentimento já existente.
- Corrigido o rótulo de grupo de equipes na introdução; seletores de contrato/recrutamento receberam nomes acessíveis; o nome público do ranked recebeu autocomplete.

## Preservado

Framework, Canvas, chave de save, importação/exportação, coleção de vinte carros e dois exclusivos, economia, preços, garantias, progressão e recompensas anteriores. Não houve alteração no banco de dados.

## Verificação e publicação

Build estático de 117 arquivos concluído. Os 33 testes direcionados de jornada, planejamento e atualização passaram; os arquivos JavaScript alterados passaram pela verificação de sintaxe. O projeto não define lint.

A inspeção visual desta versão foi interrompida a pedido do usuário, que solicitou publicação sem ampliar a validação. Não registrar os novos ajustes responsivos como aprovados visualmente. A inspeção anterior de 17/11 confirmou o planejamento/garagem em 1366×768 e 390×844 e identificou o problema do minimapa em janela baixa; ela não substitui uma nova inspeção desta versão. Os avisos restantes de formulário também não foram reconferidos no navegador.

## Condições que não equivalem a código entregue

A implementação dos recursos do planejamento está presente, mas não há evidência de 100% de validação do produto. Permanecem as sessões observadas com novos jogadores, coortes maduras D1/D7/D30, carga real em armazenamento isolado e definição de direitos/viabilidade comercial. Pagamentos e anúncios continuam desligados conforme os critérios documentados. A revisão completa no navegador e os fluxos destrutivos com save isolado não foram concluídos nesta rodada.

O conflito entre save local e nuvem foi mantido sem escolher um progresso automaticamente. A decisão continua disponível em Conta → Comparar saves.
