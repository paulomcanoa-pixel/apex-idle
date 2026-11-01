# Apex Idle — protótipo 0.1

Abra `index.html` no navegador para jogar. Não precisa instalar dependências. A fonte do Google é opcional; o jogo funciona sem conexão. Para servir por HTTP, use qualquer servidor estático nesta pasta. Testes: `node test.cjs`.

## Esta etapa

Corrida automática 2D, quatro melhorias, três circuitos, ERS, reputação, persistência local, importação/exportação de save e ganhos offline limitados a oito horas. Inicie a corrida para habilitar a produção offline. Pausar interrompe a produção. O ERS dobra o ritmo por cinco segundos e recarrega em trinta segundos; não persiste ao fechar. Circuitos usam a mesma geometria nesta versão, com cores e multiplicadores distintos. Rivais são visuais, sem classificação competitiva.

## Direção do projeto

Pesquisa: https://topidle.com/ (01/11/2026). O catálogo destaca progresso offline, evolução, competição e comunidade em vários títulos. Isso é uma observação das descrições, não evidência de retenção ou faturamento. Vamos adaptar o ciclo de evolução para uma escuderia de monopostos, com identidade e assets próprios.

Próximas etapas: 1) validar o ritmo e diferenciar pistas; 2) pilotos, pneus, boxes e resultados de corrida; 3) temporadas e prestígio; 4) servidor com contas e economia autoritativa antes de ranking multiplayer; 5) hospedagem pública, testes em celular e cadastro no TopIdle.

## Limites

Protótipo solo; sem backend, pagamentos ou multiplayer. Saves locais podem ser editados e não servem para ranking online confiável. O armazenamento depende do navegador e da origem; exporte antes de trocar de navegador ou publicar. Ainda não publicado e não cadastrado no TopIdle. Sem marcas, equipes ou pilotos oficiais.

## Invocação de F1 — regras atuais
Menu → Invocação F1. ×1 custa 200 CR, ×10 custa 2.000 CR. Base sem desejo nem progresso: comum 49,4%, raro 35%, épico 15%, lendário 0,5%, mítico 0,1%. Um modelo por qualidade. Saves antigos mantêm a coleção.

Escolha um modelo na lista de desejos: sua chance atual dobra exatamente antes das garantias; as outras são reduzidas proporcionalmente para somar 100%. As chances dinâmicas são exibidas. A chance base mítica cresce +0,01 ponto percentual por invocação sem mítico, até 25% antes do desejo. Receber mítico por invocação reinicia esse aumento; com desejo mítico, o reinício aparece como 0,2%. Não há garantia mítica.

Garantias: épico ou superior em até dez tentativas, lendário ou superior em até duzentas. Receber a qualidade ou superior reinicia o contador correspondente. Mítico não é forçado em nenhuma tentativa. Lotes seguem as mesmas regras dos sorteios individuais. Contadores e histórico são persistidos.

Repetidos não devolvem créditos: rendem 5/15/50/200/1.000 pontos para comum/raro/épico/lendário/mítico. A loja troca 50/150/500/2.000/10.000 pontos pelo respectivo modelo ainda bloqueado. Compras não alteram contadores e não equipam automaticamente. Reembolsos antigos já recebidos permanecem no saldo.

Animação de chegada ao box por 1,8 s, botão de pular e respeito a movimento reduzido. Saldo/resultados são salvos antes da animação; cliques extras são bloqueados durante a revelação. Fechar o menu encerra a animação sem perder o resultado.

### Créditos de teste
Abra a URL do jogo com ?test=1 para receber 1.000.000 CR uma vez por save. O progresso existente é preservado, e a concessão é marcada no save/exportação. O jogo é solo e local, sem autenticação ou moeda real; esse modo não concede créditos remotamente a outro navegador. Não altera o saldo inicial dos visitantes comuns.

## Pesquisa de referência — 01/11/2026
- Genshin: regras variam por banner; a HoYoverse orienta consultar Detalhes no jogo. A página oficial do banner permanente documenta garantias de 4★+ em 10 e 5★ em 90. Inspiração: garantias e probabilidades explícitas, sem copiar taxas ou personagens. https://support.hoyoverse.com/hc/en-us/articles/50333906347929-What-are-the-rules-for-making-a-Wish e https://webstatic-sea.hoyoverse.com/genshin/event/e20190909gacha/index.html?gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc&lang=en&region=os_asia
- AFK Journey: guia comunitário Prydwen descreve wishlist para restringir resultados e uso de duplicatas na ascensão. Referência para futura seleção de modelos; wishlist e ascensão não foram implementadas. https://www.prydwen.gg/afk-journey/guides/wishlist-tips
- AFK Arena: guia comunitário descreve diferentes pools, wishlist e conversão de comuns. Referência de gestão de coleção. https://www.afk.global/afk-arena/guides/summoning
- Idle Heroes: wiki comunitária descreve invocações básica, heroica e de amizade, estrelas e pacotes de dez. Referência para ×1/×10 e progressão. Taxas externas variam por modalidade/evento e não foram copiadas. https://idleheroes.fandom.com/wiki/Summon_Circle

As cinco qualidades são decisão do Apex, não a classificação de Genshin. Testes automatizados cobrem chances, garantias, prioridade, reinícios, lotes atômicos, histórico e saves. Build e sintaxe verificados. Inspeção visual local bloqueada pelo navegador sem acesso ao servidor local; testes com jogadores pendentes.
