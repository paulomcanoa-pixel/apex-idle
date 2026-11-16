# Carreira, garagem e competição — entrega de 15/11/2026

## Preservado

Projeto JavaScript existente, Canvas, Escuderia Aurora, chave de save e importação/exportação, inventário antigo, renda offline, corrida automática, ERS, pneus, boxes, clima, oficina, contratação pela Academia, circuitos, prestígio, conta e sincronização, 20 históricos e dois exclusivos. Nenhuma recriação de framework ou remoção de progresso.

## Alterações

- Um cálculo de veículo para a garagem, corrida e aquisição antiga/nova. Retas, curvas e pneus afetam adequação à pista e janela de parada. Piloto e engenheiro são slots separados, com afinidades explícitas.
- Treinamento entrega XP, nível e bônus efetivo. Pilotos novos são conquistados na Academia; os já contratados continuam disponíveis. A seleção inicial passa ao Lotus 49, e os cinco fictícios permanecem apenas nos dados antigos de compatibilidade.
- Garagem mostra o conjunto ativo e a comparação. Presets preservam carro, piloto e engenheiro. Canvas adaptado ao painel estreito e a 390 px.
- Carreira apresenta oito objetivos com recompensas únicas, desafio semanal entre quatro regras, passe compacto e resumo útil de retorno.
- Após um título, escolher engenharia, academia ou operação mantém uma especialização entre temporadas. A troca é gratuita e apenas um caminho fica ativo.
- Pós-corrida usa telemetria efetiva de desgaste, chuva, boxes e ERS. Academia recebe o clima e afinidade reais. Troca de carro cancela uma tentativa semanal. Neutralizações contam no tempo da prova.
- Mítico tem aumento gradual, reset ao sair e nenhuma garantia rígida. Principal sem desejo: média matemática de 700. Projetos e duplicatas seguem a tabela documentada no relatório de balanceamento.
- Ranked usa 22 identidades históricas com desempenho normalizado. Desafio assíncrono semanal tem conjunto emprestado igual para todos, limite diário, resultado calculado no servidor e configuração compartilhável. O solo não transmite poder para o ranked.
- Validação protege importação de estruturas de loja inválidas e inicializa campos ausentes de saves antigos. Recompensas, treinamento e XP mantêm compatibilidade.
- Analytics opcional registra primeiras ações uma vez, sessões e variações de CR. O relatório local é limitado a este aparelho; coortes exigem sessões reais e maturidade.

## Verificação

- `npm test`: suíte completa aprovada, incluindo 122 testes via `node:test` e os scripts de regressão anteriores.
- Quatro suítes de produto somam 39 testes: desempenho e save, jornada e coortes, corrida e Academia, API e concorrência ranked.
- `npm run build`: 113 arquivos estáticos e SDK público preparados. Não existe comando de lint configurado; JavaScript alterado verificado por `node --check`.
- Navegador local em 1366×768 e 390×844: corrida e largada, garagem/seleção de piloto, compra, objetivo/recompensa, temporada, exportação/reimportação e banner gacha. Sem erros de console nos fluxos observados. Correção visual de padding herdado no Canvas mobile feita durante essa validação.
- API ranked exercitada em testes desde requisição/cookie até armazenamento simulado e resposta, incluindo atualização concorrente. Isso não substitui teste de carga nem dez jogadores reais simultâneos.
- Preview no Vercel: página e `/api/ranked` responderam 200; a API retornou os 22 carros e o desafio semanal. O teste real identificou conflito de ETag na entrega comprimida do Blob: a leitura agora solicita `accept-encoding: identity`, mantém `ifMatch` e recusa gravação quando não há ETag forte. Documentação de referência: [SDK Vercel Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk).
- Cenários reproduzíveis de aquisição e offline: `node scripts/simulate-acquisition.cjs`.

## Como conferir

Abra o deployment publicado e recarregue quando houver aviso de nova versão. Em Garagem, confira carro, piloto, engenharia, três atributos e afinidade. Em Equipe → Pilotos, confira Academia e treino. Em Carreira, recolha um objetivo concluído e agende o desafio; após um título, veja o legado em Temporada. Em Invocação, veja a taxa atual, os 20 históricos e as duas exclusividades. No ranked, abra o desafio assíncrono para condições iguais.

Os testes locais usam um save isolado e não alteram a conta de produção. Retenção longitudinal, teste de carga, licenciamento comercial e monetização real não são resultados desta entrega; anúncios e pagamentos permanecem indisponíveis. Recursos sociais cooperativos são etapa posterior da análise, não apresentados como implementados.
