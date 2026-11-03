# Etapa 1 — base técnica e revelação contínua

## Implementado
- Comparação de texto, HTML, propriedades e atributos antes de escrever no DOM; renderizações antigas de cinco voltas deixaram de sobrescrever o controlador noturno.
- FNV-1a, meta.createdAt/savedAt/checksum/clockWarnings, gravação síncrona nas ações, autosave de 10 s e eventos de saída/aba oculta.
- Backup original permanente apex-idle-v2.bak-v1 e snapshot anterior apex-idle-v2.prev (rotação de cinco minutos). Recuperação de save inválido sem apagar o original.
- Trava com navigator.locks e BroadcastChannel; fallback por lease/heartbeat. Segunda aba com aviso e escrita local/nuvem bloqueada.
- Notação até aa..zz e modo científico. Decisão: Dc=10^33, aa=10^36, mantendo a sequência de milhares (o exemplo 10^36=Dc do roteiro era inconsistente).
- Revelação Canvas contínua: mesmo chassi e posição, faixa de luz expondo a pintura, interrogação dissolvida, partículas e aura, seguida da aceleração sem reiniciar o desenho. Movimento reduzido respeitado.

## Evidências
Medição de cinco segundos no navegador local: 136 mutações, 27,19/s, contra 293,26/s na primeira amostra desta implementação. São amostras comparáveis de corrida ativa, não benchmark de todas as telas/dispositivos. Botão Melhor compra: 50/50 ações aplicadas no mesmo nó; save válido e checksum válido. Duas abas reais: segunda exibiu modo leitura.

Build: 80 arquivos estáticos. 23 suítes legadas e testes novos node:test. Testes cobrem corrupção, backup, checksum, duas estratégias de trava, roundtrip antigo, continuidade de posição/pintura e DOM. Teste de cliques usa um harness local de QA com saldo artificial, separado do site publicado.

## Preservado
Framework/stack, chave do save, coleção, pilotos, oficina, 24 pistas e todas as regras da economia atual. Sem alteração de banco, RLS ou contas. Contrato RPC de sincronização mantido; apenas guarda de escrita na aba secundária.

## Ainda não implementado neste commit
Etapas 2–9 do roteiro: PI novo, migração para seis ramos, catálogo ativo/lojas rotativas, câmera revisada, simplificações, categorias/temporadas, retenção e pacote comercial. Fontes e simuladores já estão em docs, src/data e tools/sim. Não confundir simuladores validados com mecânicas já integradas ao jogo.

## Limitações
Não foi medido Lighthouse ou FPS em CPU 4x. O teste de rede/autenticação real entre dois aparelhos não foi repetido; os testes de sincronização e CAS existentes continuam no npm test. Diagnóstico e dados enviados são referências de design; campos faltantes unlock nos dois treinos ainda precisam ser completados antes de ativar o catálogo.

