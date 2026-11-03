# Apex Idle 1.0

Idle de automobilismo em HTML, JavaScript e Canvas 2D, publicado no Vercel. Esta versão evolui o projeto existente: não troca o framework nem a chave de save `apex-idle-v2`.

A direção e o balanceamento atuais estão em [docs/doc-design.md](docs/doc-design.md), com precedência das seções 18–21. O relatório atual é [docs/entrega-v2.md](docs/entrega-v2.md). Os demais relatórios de auditoria registram versões anteriores.

## Jogar e evoluir

- Pista: cinco voltas, nove rivais, semáforo de cinco luzes, PI do jogador/líder, ERS e classificação ao vivo.
- Oficina: seis ramos, lotes ×1/×10/Máx, garagem com carro/piloto e presets, projetos com materiais.
- Equipe: renda passiva única, contratação/treino, contratos de 1/5/15 minutos, estatísticas e desafios.
- Campeonato: evento opcional na corrida principal, seis categorias de 12 etapas, passe grátis de 40 níveis/28 dias, diárias, semanais e Nova Temporada.
- Loja: catálogo de 167 itens, três banners, componentes, cosméticos, automação, trocas, eventos e ofertas rotativas. Coleção clássica e exclusivos continuam acessíveis. A revelação usa a mesma transformação contínua e aura de raridade em Canvas.

## Desenvolvimento

Node 22 ou superior. `npm ci`, `npm test`, `npm run build`, `npm run dev`. O build gera `public/`; o servidor local serve essa pasta. Não há script de lint; valide sintaxe com `node --check`.

`SUPABASE_URL` e `SUPABASE_ANON_KEY` devem ser configuradas juntas. Use apenas a chave pública anon/publishable. `SUPABASE_GOOGLE_ENABLED` é opcional. Nunca publique `.env`. O build copia o SDK instalado e gera `config.js` apenas com a configuração pública.

Créditos de QA não entram no build normal. Apenas `APEX_TEST_BUILD=true` preserva a função de créditos de teste e seu botão.

## Compatibilidade e operação

Saves v1 recebem migração aditiva para v2. O original fica em `apex-idle-v2.bak-v1`, com snapshot anterior em `.prev`, checksum, trava entre abas e gravação imediata em compras. Exportação/importação aceitam JSON e texto antigos e novos. Coleções, recordes e identificadores antigos permanecem. Campos históricos não voltam a executar renda Farm ou uma segunda corrida.

Nova Temporada é o único prestígio ativo; Legado/talentos são o esqueleto previsto no roteiro. Offline rende CR, sem REP, por até 8 horas: 10% da produção da Equipe + 3% da corrida; itens de cofre/seguro são explícitos. O balanceamento é compartilhado por `src/balance.js`; `tools/sim` mantém os simuladores originais recebidos.

Supabase mantém autenticação, CAS do save e validação das disputas no servidor. Migrações em `supabase/migrations` aceitam v1/v2, criam analytics com RLS e exclusão dos próprios dados, e removem eventos com mais de 90 dias. Analytics é opt-in. Não existem cobranças nem SDK de anúncios: os produtos reais são stubs desativados. Termos e privacidade são rascunhos para revisão do proprietário.

O PWA usa cache versionado e atualização mediante botão. Lembretes de contratos exigem opt-in e funcionam enquanto o navegador mantém o jogo em execução; não existe serviço de push para o aplicativo fechado.
