# Entrega da Operação e contas

## Auditoria e integração
A auditoria encontrou corrida idle, farm, offline, prestígio de campeonato, missões e save já existentes. Foram preservados. A nova Operação acrescenta seis geradores, marcos, trabalho manual, Ascensão com Fragmentos e conquistas. A conta Supabase é opcional.

## Arquivos novos
- AUDITORIA.md
- game/state.js, game/economy.js, game/tick.js, game/save.js, game/format.js
- idle-ui.js, idle.css, idle-test.cjs
- src/lib/supabase.js, cloud-model.js, cloud-ui.js, cloud-test.cjs
- supabase/schema.sql, supabase/verification.sql
- .env.example, package-lock.json, dev-server.cjs
- ENTREGA-ONLINE.md

## Arquivos existentes alterados
engine.js (validação), game.js (migração, backup e formatação), start.js (recuperação antes da estreia), index.html (módulos), build.cjs (artefatos e configuração pública), package.json (dependência fixa/scripts), README.md (instruções).

## Evidências
- 19 suítes de testes passaram, incluindo todos os testes legados.
- Build estático local com SDK oficial fixado passou.
- RLS real: usuário A leu somente seu save; B não pôde ser lido ou sobrescrito.
- RPC real: revisão antiga/nula e regressão recusadas; revisão válida incrementou; anônimo não pôde gravar; escrita direta bloqueada.
- Ranking real: leitura pública permitida; delta semanal correto; fixtures removidas por rollback.
- API pública: Email e signup habilitados; leaderboard respondeu HTTP 200.
- Navegador local: compra x10, marco x2, produção com pista pausada, clique e mensagem de login inválido em português verificados.
- Conta temporária real: login, apelido, primeiro upload, indicador de nuvem e ranking público verificados com o SDK oficial.
- Duas sessões de armazenamento separado: comparação local/nuvem e restauração de geradores e upgrade x2 verificadas. Uma escrita concorrente gerou novo pedido de escolha, preservando as cópias.
- Mobile 390x844: cinco abas fixas, painel legível, sem overflow horizontal; tamanho de viewport restaurado.
- Conta temporária desconectada e removida junto com seus dados; nenhum e-mail enviado a terceiros.

## Limites da validação
URLs de e-mail configuradas pelo usuário no Supabase. Entrega de confirmação, recuperação e link mágico em uma caixa real ainda depende de validação com o usuário; nenhum e-mail de teste foi enviado a terceiros. Google fica oculto até haver provedor OAuth configurado. Desempenho em aparelho físico de porte médio não foi certificado; o parallax usa ponteiro ou inclinação opcional, e os efeitos respeitam redução de movimento.

O mecanismo de revisão protege contra sobrescrita concorrente; não transforma a economia local em simulação autoritativa de servidor. Os avisos de advisor foram reduzidos ao uso intencional da RPC autenticada privilegiada descrito no README.
