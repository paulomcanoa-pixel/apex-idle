# Apex Idle — protótipo 0.1

Abra `index.html` no navegador para jogar. Não precisa instalar dependências. A fonte do Google é opcional; o jogo funciona sem conexão. Para servir por HTTP, use qualquer servidor estático nesta pasta. Testes: `node test.cjs`.

## Esta etapa

Corrida automática 2D, quatro melhorias, três circuitos, ERS, reputação, persistência local, importação/exportação de save e ganhos offline limitados a oito horas. Inicie a corrida para habilitar a produção offline. Pausar interrompe a produção. O ERS dobra o ritmo por cinco segundos e recarrega em trinta segundos; não persiste ao fechar. Circuitos usam a mesma geometria nesta versão, com cores e multiplicadores distintos. Rivais são visuais, sem classificação competitiva.

## Direção do projeto

Pesquisa: https://topidle.com/ (01/11/2026). O catálogo destaca progresso offline, evolução, competição e comunidade em vários títulos. Isso é uma observação das descrições, não evidência de retenção ou faturamento. Vamos adaptar o ciclo de evolução para uma escuderia de monopostos, com identidade e assets próprios.

Próximas etapas: 1) validar o ritmo e diferenciar pistas; 2) pilotos, pneus, boxes e resultados de corrida; 3) temporadas e prestígio; 4) servidor com contas e economia autoritativa antes de ranking multiplayer; 5) hospedagem pública, testes em celular e cadastro no TopIdle.

## Limites

Protótipo solo; sem backend, pagamentos ou multiplayer. Saves locais podem ser editados e não servem para ranking online confiável. O armazenamento depende do navegador e da origem; exporte antes de trocar de navegador ou publicar. Ainda não publicado e não cadastrado no TopIdle. Sem marcas, equipes ou pilotos oficiais.
