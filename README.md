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
