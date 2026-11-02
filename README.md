# Apex Idle — corrida noturna

Abra `index.html` no navegador para jogar. Não precisa instalar dependências. A fonte do Google é opcional; o jogo funciona sem conexão. Para servir por HTTP, use qualquer servidor estático nesta pasta. Testes: `node test.cjs`.

## Esta etapa

O jogo existente evoluiu para corridas noturnas em Canvas, com cinco luzes, seis voltas e nove rivais fictícios. Os 24 circuitos, coleções, gacha, Academia, farm, campeonatos, ranked e conta Supabase continuam integrados. ERS: +8% de ritmo por cinco segundos e recarga de trinta segundos. Veja `AUDITORIA-NOTURNA.md` para a auditoria e as decisões de compatibilidade.

## Direção do projeto

Pesquisa: https://topidle.com/ (01/11/2026). O catálogo destaca progresso offline, evolução, competição e comunidade em vários títulos. Isso é uma observação das descrições, não evidência de retenção ou faturamento. Vamos adaptar o ciclo de evolução para uma escuderia de monopostos, com identidade e assets próprios.

Próximas etapas: 1) validar o ritmo e diferenciar pistas; 2) pilotos, pneus, boxes e resultados de corrida; 3) temporadas e prestígio; 4) servidor com contas e economia autoritativa antes de ranking multiplayer; 5) hospedagem pública, testes em celular e cadastro no TopIdle.

## Limites

Protótipo solo; sem backend, pagamentos ou multiplayer. Saves locais podem ser editados e não servem para ranking online confiável. O armazenamento depende do navegador e da origem; exporte antes de trocar de navegador ou publicar. Ainda não publicado e não cadastrado no TopIdle. Sem marcas, equipes ou pilotos oficiais.

## Invocação de F1 — regras atuais
Menu → Invocação F1. ×1 custa 200 CR, ×10 custa 2.000 CR. Base sem desejo nem progresso: comum 49,357142857%, raro 35%, épico 15%, lendário 0,5%, mítico 1/700 (aproximadamente 0,142857%). Os 20 históricos integram o banner principal; dois exclusivos usam fichas no banner especial. Saves antigos mantêm a coleção.

Escolha um modelo na lista de desejos: sua chance atual dobra exatamente antes das garantias; as outras são reduzidas proporcionalmente para somar 100%. As chances dinâmicas são exibidas. A chance mítica é fixa em 1/700 antes do desejo e das garantias. O contador sem mítico é preservado como histórico; não aumenta a taxa e não há garantia mítica.

Garantias: épico ou superior em até dez tentativas, lendário ou superior em até duzentas. Receber a qualidade ou superior reinicia o contador correspondente. Mítico não é forçado em nenhuma tentativa. Lotes seguem as mesmas regras dos sorteios individuais. Contadores e histórico são persistidos.

Repetidos não devolvem créditos: rendem 50/150/400/2.000/7.500 pontos para comum/raro/épico/lendário/mítico. A loja troca 100/300/800/4.000/15.000 pontos pelo respectivo modelo ainda bloqueado. Compras não alteram contadores e não equipam automaticamente. Reembolsos antigos já recebidos permanecem no saldo.

Revelação central em diálogo: primeiro um monoposto vetorial original escuro com interrogação; depois o carro cruza uma linha de chegada quadriculada; por fim, cada carro ganha a cor de raridade e nome. Lotes são revelados um a um, com avanço automático, Próximo carro e Revelar todos. Escape encerra com resumo completo. Respeita movimento reduzido. Saldo/resultados são salvos antes da animação; cliques extras são bloqueados durante a revelação. Fechar o menu encerra a animação sem perder o resultado.

### Créditos de teste
Abra a URL do jogo com ?test=1 para receber 1.000.000 CR uma vez por save. O progresso existente é preservado, e a concessão é marcada no save/exportação. O jogo é solo e local, sem autenticação ou moeda real; esse modo não concede créditos remotamente a outro navegador. Não altera o saldo inicial dos visitantes comuns.

## Pesquisa de referência — 01/11/2026
- Genshin: regras variam por banner; a HoYoverse orienta consultar Detalhes no jogo. A página oficial do banner permanente documenta garantias de 4★+ em 10 e 5★ em 90. Inspiração: garantias e probabilidades explícitas, sem copiar taxas ou personagens. https://support.hoyoverse.com/hc/en-us/articles/50333906347929-What-are-the-rules-for-making-a-Wish e https://webstatic-sea.hoyoverse.com/genshin/event/e20190909gacha/index.html?gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc&lang=en&region=os_asia
- AFK Journey: guia comunitário Prydwen descreve wishlist para restringir resultados e uso de duplicatas na ascensão. Referência para futura seleção de modelos; wishlist e ascensão não foram implementadas. https://www.prydwen.gg/afk-journey/guides/wishlist-tips
- AFK Arena: guia comunitário descreve diferentes pools, wishlist e conversão de comuns. Referência de gestão de coleção. https://www.afk.global/afk-arena/guides/summoning
- Idle Heroes: wiki comunitária descreve invocações básica, heroica e de amizade, estrelas e pacotes de dez. Referência para ×1/×10 e progressão. Taxas externas variam por modalidade/evento e não foram copiadas. https://idleheroes.fandom.com/wiki/Summon_Circle

As cinco qualidades são decisão do Apex, não a classificação de Genshin. Testes automatizados cobrem chances, garantias, prioridade, reinícios, lotes atômicos, histórico e saves. Build e sintaxe verificados. Inspeção visual local bloqueada pelo navegador sem acesso ao servidor local; testes com jogadores pendentes.

## Pódio dos drops em Canvas
Ao concluir ou pular as revelações, uma janela central permanece aberta mostrando os carros em Canvas 2D. O mais raro ocupa o centro com arte maior e brilho da qualidade; os demais ficam nas laterais, com as qualidades menores mais afastadas. Cada drop exibe nome, qualidade e status novo/repetido. No celular, o destaque vem primeiro no centro e os demais seguem em pares. Arte original de F1 com pneus, asas, cockpit, halo e pintura; flutuação e brilho animados, com respeito a movimento reduzido. Continuar ou Escape fecha a janela e encerra o loop de desenho. Testes cobrem posição, ordem, limites e ausência de sobreposição em 320/600/900/1200 px; inspeção visual não realizada.

## Estilo da celebração final
Referência visual: https://anime-idle.com/play/ (01/11/2026). A página pública e o modo visitante foram inspecionados; a animação final de invocação não ficou acessível, pois o visitante pede cadastro antes dessa parte. A adaptação usa a linguagem visual observável das cartas e da interface: fundo escuro violeta, título dourado, bordas de raridade, estrelas e botão destacado. Entrada escalonada, raios/partículas e brilho suave do destaque foram criados originalmente para o Apex em Canvas, sem copiar código ou assets do Anime Idle. A geometria e as regras de raridade foram preservadas.

## Revisão de balanceamento e arte — regras vigentes
Mítico agora tem chance fixa de 1/700 por tentativa (100/700 por cento), sem crescimento por ausência nem garantia. Desejo mítico dobra para 1/350; escolher outro desejo redistribui as demais taxas como antes. Garantias épico 10 e lendário 200 continuam. Comum ajustado para 49,357142857% para manter o pool em 100%. Os contadores antigos permanecem no save, mas o contador mítico não aumenta mais a chance.
Loja: comum 100, raro 300, épico 800, lendário 4.000, mítico 15.000 pontos. Repetidos rendem exatamente metade: 50/150/400/2.000/7.500. Pontos existentes são preservados. Valores e regras anteriores registrados neste documento são históricos e foram substituídos por esta revisão.
A animação de mistério/corrida/revelação agora é desenhada em Canvas com a mesma função de desenho de F1 usada nas cartas finais. A pista, linha quadriculada e interrogação também são Canvas; fases trocam apenas posição, rotação, escala e pintura. Loops são encerrados ao avançar ou fechar.

## Carreira da escuderia
Menu → Carreira (ou Objetivos) reúne quatro sistemas solo persistidos no save:
- Contratos: até três carros não equipados, reservados até recolher. Teste de 1 min: 300 CR + 2 peças; exibição de 5 min: 1.800 CR + 8; resistência de 15 min: 6.000 CR + 24. Relógio continua com jogo fechado. Cada contrato só paga uma vez.
- Projetos: corridas completas rendem 3 peças do projeto escolhido, ou 5 por vitória. Peças por modelo: 20/40/80/160/320; construção cobra também 20 CR por peça requerida. Compra libera modelo ainda não possuído. Contratos rendem peças do carro enviado; Aurora usa alvo ativo. Treino livre não gera peças.
- Álbum: mostra a coleção e metas para pinturas cosméticas (3 carros, 5 corridas, 3 contratos, 1 GP e 1 construção). Pintura se aplica com jogo pausado, acompanha o save e não concede bônus.
- GP semanal: regulamentos rodam por semana de segunda a segunda, Brasília: comuns/raros com médios, resistência com duros e fábrica com melhorias normalizadas. Uma inscrição por semana, preparação capturada, resultado após 90 segundos e calculado ao retornar. Não requer manter a aba aberta. Adversários e divisões são simulados localmente; não há ranking online. Bronze/Prata/Ouro por 0/3/6 GPs concluídos. Resultado paga 6.000/4.000/2.500/1.500 CR por posição, multiplicado por nível da divisão, mais 20 peças. Replay usa o mesmo motor e snapshot, com pausa e 1×/4×/8×.
Dias ativos e conclusões são contados somente neste save, sem telemetria externa. Saves antigos recebem defaults sem perder saldo ou coleção. Relógio e save editáveis não servem como proteção de economia online. Validação de retorno offline, reservas e resgate único adicionada; testes de regressão existentes passaram.


## PvP ranked online e navegação
As abas sob o nome do circuito reúnem todas as atividades; Menu contém exportação/importação e configurações de câmera, minimapa e tela cheia.
PvP: perfil visitante com nome público e cookie HttpOnly/Secure, fila com 2–10 pilotos reais e faixa inicial de 500 rating. Sem bots. Com dois pilotos, a largada ocorre após 45 segundos; com dez, imediatamente. A resolução demora 30 segundos, usa carro/estratégia capturados na entrada e é calculada no servidor. Atualização a cada 5 segundos enquanto o painel está aberto. Não é direção em tempo real. Cancelamento permitido apenas antes da largada. Resultados persistidos, Elo por confronto com o grid, XP, vitórias, pódios e álbum por partidas concluídas. Rankings top 100 por rating, nível, álbum, vitórias e pódios.
O progresso online é independente do save solo e de créditos de teste. Não envia estatísticas editáveis do navegador. O GP semanal antigo continua solo/simulado. O perfil visitante não tem recuperação ou sincronização entre dispositivos; apagar cookies perde acesso ao perfil.
Backend: Vercel Function /api/ranked e @vercel/blob 2.8.2, store privado conectado ao projeto com BLOB_READ_WRITE_TOKEN somente no servidor. Leitura sem cache e escrita condicional por ETag com repetição para evitar resultados duplicados ou perda de entradas simultâneas. Protótipo de baixo volume: documento único e limite de 2.000 perfis; exige migração para banco transacional para escala maior. O servidor avança salas nas consultas, sem depender de relógio do cliente; não há WebSocket. Teste automatizado cobre sala de dez, décimo primeiro em outra sala, duelo, saída, autenticação, recompensas únicas e filtros.


## Operação Ascensão e conta Supabase

O jogo permanece em HTML/JS/Canvas. A nova aba **Operação** acrescenta seis geradores da escuderia, trabalho manual, compras 1/10/100/Máx, upgrades ×2 em 10/25/50/100 unidades e 20 conquistas. Os créditos usam o caixa CR compartilhado. A produção nova recebe 80% por até 8 h offline; pista, farm e campeonato mantêm suas próprias regras existentes.

**Ascensão:** floor(sqrt(ganho deste ciclo / 1.000.000)) Fragmentos. Cada Fragmento dá +2% à produção e ao clique. A confirmação informa que o caixa CR compartilhado e somente os geradores/upgrades desta Operação serão zerados. Carros, pilotos, Academia, farm, carreira e campeonato permanecem. Total produzido, conquistas e Fragmentos são permanentes.

### Executar localmente

Requer Node 22 ou superior e npm.

1. Execute `npm ci`.
2. Copie `.env.example` para `.env` e preencha apenas URL e chave pública do projeto, se quiser testar contas.
3. Execute `npm test`, `npm run build` e `npm run dev`.
4. Abra `http://127.0.0.1:5173`. O servidor local serve o site estático; o PvP usa as APIs da Vercel na implantação.

O build copia o Supabase JS **2.118.0** do pacote instalado para `public/vendor/supabase.js`, sem dependência de CDN. O lockfile fixa as dependências. A configuração pública é gerada em `public/config.js`; nenhum valor de ambiente é commitado. Não configure service_role/secret no front-end. O build recusa essas chaves.

### Configurar Supabase e Vercel

1. Crie um projeto Supabase (região São Paulo, sa-east-1).
2. Execute `supabase/schema.sql` no SQL Editor. O SQL é idempotente para a estrutura deste projeto.
3. Authentication → Providers: Email habilitado. Em URL Configuration, Site URL = `https://apex-idle.vercel.app`; Redirect URLs = `https://apex-idle.vercel.app/**` e, para desenvolvimento, `http://127.0.0.1:5173/**` e `http://localhost:5173/**`.
4. Project Settings → API: obtenha Project URL e a chave pública publishable. Na Vercel → Settings → Environment Variables, configure `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_GOOGLE_ENABLED=false` em produção/preview/desenvolvimento. Publique novamente após mudanças.
5. Google é opcional: primeiro configure o OAuth Client no Google Cloud e o provedor no Supabase. Só então altere `SUPABASE_GOOGLE_ENABLED=true` e publique. O botão fica oculto até isso ser habilitado.
6. Para e-mails em produção fora das limitações do serviço padrão, configure um remetente SMTP próprio no Supabase e verifique as políticas e limites do seu plano.

### Conta e sincronização

Convidados jogam sem cadastro. Email/senha, cadastro com confirmação, recuperação, nova senha e link mágico usam um único client Supabase. Apelidos únicos têm 3–20 caracteres (letras/números/_). Dados de apelido são renderizados com textContent.

Na primeira conexão, se não houver save remoto, o local é enviado. Se existirem os dois, aparece a comparação de ganho, Fragmentos e data. A retomada do mesmo aparelho usa a última revisão conhecida; revisão remota diferente sempre pausa a escrita e pede escolha. Antes de restaurar, o local é guardado em `apex_before_cloud_restore`.

Sincroniza a cada 60 s, ao ascender e por tentativa keepalive ao ocultar/fechar. O fechamento não garante entrega de rede: o save local continua sendo a cópia imediata. Offline mostra estado local e tenta novamente ao reconectar. A RPC faz comparação de revisão dentro de uma transação e bloqueio por usuário. Valores acumulados não podem regredir. Escolher um save local com totais menores pode ser recusado pelo servidor; nenhuma cópia local é apagada nessa situação.

Os saves JSON ficam privados sob RLS. `player_scores` e `weekly_scores` só contêm pontuações públicas, e as views usam security_invoker. O ranking mostra top 50. Semanal: segunda-feira 00h UTC, contando apenas Fragmentos novos após a primeira sincronização. Primeiro upload importa o legado sem premiá-lo retroativamente na semana.

A RPC `sync_game_save` é uma função privilegiada intencional: autenticação, usuário-alvo, revisão e monotonicidade são verificados no servidor; execução anônima e escrita direta nos saves são negadas. O advisor sinaliza sua exposição autenticada como aviso esperado ([descrição do aviso](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)). A validação básica não comprova a legitimidade de valores produzidos por um cliente modificado.

### Save e efeitos

O estado mantém a versão legada do jogo e acrescenta `idle.v=1`; exportação textual usa envelope v2/base64 UTF-8. JSONs antigos continuam aceitos. Save inválido é copiado para `apex_save_backup` e a gravação fica bloqueada até uma escolha de recuperação. Uma importação guarda `apex_before_import`. Configurações incluem efeitos alto/baixo/desligado, som opcional e notação curta/científica. O novo Canvas pausa com a aba oculta e respeita prefers-reduced-motion.

### Verificação

`npm test` inclui economia, soma geométrica, saldo não negativo, marcos, Ascensão, teto offline, notação, migração, base64, conflito de revisões, perda/reconexão de rede, sessão obsoleta e regressão recusada. `supabase/verification.sql` executa verificações reais de RLS e RPC com dois usuários temporários dentro de transação e desfaz todos os dados de teste. Não execute em uma base onde os identificadores de teste já sejam utilizados.

A entrega real de confirmação, recuperação e link mágico depende do e-mail do usuário e do remetente configurado; não se confunde com os testes de lógica. A meta de 60 fps em celular médio requer medição em dispositivo físico e não é um resultado certificado.



## Corrida noturna e garagem

A loja inferior reúne Carro, Equipe, Circuitos, Patrocínio e Temporada. O Paddock preserva acesso a todos os sistemas anteriores. Garagem permite preparar F1 e piloto já possuídos, comparar prêmio/ritmo/afinidade e aplicar a dupla durante a corrida principal. A transação usa os campos existentes; não concede itens. A afinidade histórica permanece +4% no cálculo de ritmo original.

A invocação mantém mistério, passagem pela chegada e resumo com o mais raro no centro. Uma aura em Canvas envolve o carro revelado: cinza, azul, roxa, dourada ou rosa conforme a qualidade. Movimento reduzido conserva a cor e reduz a animação.

Nova temporada é um prestígio separado da Ascensão: exige renda nova, concede floor(sqrt(renda/1500000)) títulos e +25% de renda por título. Confirmação em dois toques. Preserva coleção, pilotos, reputação, circuitos, recordes e moedas/progressão dos demais sistemas. A chave segue apex-idle-v2; novos campos night recebem padrões em saves antigos.

Validação: npm test executa 22 suítes. npm run build prepara o site estático. Não há script de lint no projeto; use node --check nos arquivos JS modificados.



## Integração do PDF — garagem ao vivo
`garage.owned/equipped` é a seleção canônica. Migração reúne campos legados sem perder modelos; compra não equipa. A corrida deriva ritmo e prêmio do equipamento a cada passo, e a arte usa a pintura do carro. Reserva de contrato e campeonato continuam protegidos.
A abertura é automática; o Paddock mantém todos os sistemas. Caixa, Pontos e Títulos são visíveis, com renda por segundo estimada (voltas + produção da equipe, sem prever posição/prêmio variável de chegada). A recomendação compra uma unidade/nível com maior ganho estimado de CR/s por custo, entre melhorias e geradores compráveis.
Patrocínio e Temporada são exibidos conforme avanço. Tutorial de três passos apenas no primeiro save. Para alterar peças/acerto nos boxes, programe manutenção após a corrida em Configurações e saves; retome pelo mesmo botão.
O banner não é reconstruído a cada crédito. Na invocação, o carro é revelado, perde a interrogação e cruza a chegada com a aura de raridade. Veja AUDITORIA-PDF.md para causas com linhas da versão anterior.
