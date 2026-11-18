# Continuação do planejamento — 16/11/2026

> Atualização de 17/11: veja [a continuação publicada](entrega-conclusao-2026-11-17.md). A inspeção anterior confirmou partes da interface; a nova inspeção visual foi encerrada a pedido do usuário. Os registros abaixo descrevem a situação daquela rodada.

Referência: `outputs/APEX-IDLE-ANALISE-PRODUTO-2026-11-14.md`. Este acompanhamento separa implementação, simulação e validação com pessoas.

Continuação mais recente: [Estratégia, garagem e continuidade](entrega-fluxos-2026-11-16.md). Presets completos, composição por link, previsão do treino, resumo ao retornar de aba e correções de Equipe/online foram implementados. O relatório abaixo registra o bloco anterior; a continuação eleva o conjunto a 161 testes e o build a 116 arquivos. A validação visual nova continua pendente.

## Mantido

JavaScript e Canvas existentes, chave `apex-idle-v2`, importação/exportação, progresso antigo, Escuderia Aurora, 20 carros históricos e dois exclusivos, gacha com desejo e garantias, preços de troca e duplicatas definidos pelo usuário, Academia, ERS, clima, pneus/boxes, calendário, renda offline, conta/sincronização, legado e publicação no Vercel. Não foi recriado o jogo nem alterado seu framework.

## Situação da análise

| Bloco da análise | Entrega e situação |
| --- | --- |
| 1–3. Auditoria, fundamentos e referências | A auditoria e as correções anteriores permanecem no histórico e em `entrega-produto-2026-11-15.md`. Não repetir pesquisa como se fosse implementação nova. |
| 4. Coleção com utilidade | Retas/curvas/pneus, afinidades e comparação já integrados à corrida. Agora cada histórico mostra ponto forte, atenção no acerto e descrição/referência existente. A tela distingue disponibilidade no gacha de importância histórica. |
| 5. Pilotos e equipe | Academia por observação/provas/contrato, treino com XP real, piloto e engenheiro separados preservados. Capítulos curtos no rádio reforçam a evolução da Aurora. |
| 6. Corrida compreensível | Feedback usa telemetria real. Classificação mede melhor volta da tentativa; trocar o conjunto para tornar a meta mais fácil cancela a tentativa e informa o motivo. |
| 7. Carreira e retorno | Três horizontes: agora, próxima etapa e legado; oito objetivos anteriores e compra sugerida no retorno preservados. |
| 8. Aquisição e economia | Distribuição de míticos, projetos, trocas e Academia comparados em cenários ACTIVE/CASUAL/OFFLINE, com sementes, percentis, censura e hipóteses explícitas. Trajetória inicial de sete dias executa custos, recompensas e desbloqueios reais. Os preços pedidos pelo usuário não foram alterados. |
| 9. Competição e social | Ranked normalizado e desafio assíncrono preservados. Escuderias de até dez, amizade por código e aceite, GP coletivo semanal e ranking de escuderias implementados. Três provas válidas/dia por membro; mudança de escuderia não duplica contribuição. Troféus são cosméticos. |
| 10. Eventos e memória | Seis regras semanais: técnico, chuva, pneus, clássicos, classificação e endurance de oito voltas. Troféus Canvas, melhores marcas e últimas 12 semanas sobrevivem à temporada. Saves da rotação anterior conservam sua regra e recompensa já recebida. |
| 11. Monetização | Preparação e critérios documentados em `monetization-readiness.md`; pagamentos e anúncios continuam desligados. Direitos, dados reais e validação comercial ainda precisam ser resolvidos antes de ativação. |
| 12. Ordem e critérios de entrega | Testes de regressão, save, eventos, modelo/API social e CAS. Há simulação local de 2.000 perfis. Inspeção visual desta rodada e carga real de rede ainda não concluídas. |
| 13. Medição | Consentimento, versão/dispositivo/origem sanitizados, primeiros tempos, seleção por carro/circuito, raridades, moedas, compra após retorno, fila e erros de save. D1/D7/D30 excluem coortes imaturas. Sessões observadas e resultados reais de retenção ainda não existem nesta entrega. |

## Recursos novos no jogo

Em **Carreira → Escuderia e amigos**, crie uma escuderia ou entre por código. As abas Competir, Escuderia, Amigos e Troféus ficam no mesmo painel online. Um pedido de amizade precisa ser aceito pelo outro jogador. Copiar um código ou link não envia mensagem automaticamente.

O GP soma dez pontos por prova válida, no máximo três por dia UTC. Marcos de 60/180/420 pontos concedem troféus bronze/prata/ouro aos contribuintes. Os pontos ficam na equipe em que foram conquistados durante a semana. Há limites e replays idempotentes no servidor, com escrita condicional no armazenamento existente.

Em **Carreira**, veja Agora/Em seguida/Seu legado, agende a prova semanal e acompanhe os troféus. Classificação mantém cinco voltas e exige bater a meta de volta; endurance tem oito, top 5 e box na janela. Cada semana paga a recompensa apenas uma vez, mesmo ao repetir ou recarregar.

## Verificação e limites

- Suíte completa aprovada: 152 testes via node:test, além dos scripts de regressão existentes; build estático de 114 arquivos aprovado. Não há comando de lint no projeto; os 21 arquivos JavaScript alterados passam pela verificação de sintaxe.
- Testes novos verificam rotação/migração/recordes, corrida real de oito voltas, consentimento/segmentação/censura, entrada na escuderia, amizade, contribuição e repetição pela interface JavaScript até a API. Essa interface de teste não renderiza pixels de navegador.
- Capacidade local: 2.000 perfis, 200 equipes e 2.000 conclusões; aproximadamente 3,43 MB de estado. Não é benchmark de latência do Blob ou de jogadores reais simultâneos.
- O Chrome headless não iniciou no ambiente; o controle nativo foi encerrado pela ferramenta por não conseguir validar a URL. Por isso **não foi concluída a inspeção visual nova a 1366 px e 390 px**. As verificações visuais da entrega de 15/11 não são evidência automática desta mudança.
- Nenhum resultado de retenção, licença comercial ou pagamento real foi inventado. A lista de condições externas está nos dois protocolos anexos.

## Arquivos deste bloco

`api/ranked.js`, `server/ranked-model.cjs`, `ranked-ui.js`, `ranked.css`, `src/social-view.js`, `src/retention.js`, `src/product-view.js`, `src/career-journey.js`, `race-engine.js`, `night-ui.js`, `src/v2-adapter.js`, `src/v2-ui.js`, `src/v2.css`, `src/safe-dom.js`, `src/commercial.js`, `scripts/analyze-cohorts.cjs`, `scripts/simulate-acquisition.cjs`, `privacidade.html`, `index.html`, `build.cjs`, `sw.js`, `package.json`, `social-product-test.cjs`, `events-product-test.cjs`, `measurement-product-test.cjs`, `online-flow-test.cjs` e os três documentos desta entrega.
