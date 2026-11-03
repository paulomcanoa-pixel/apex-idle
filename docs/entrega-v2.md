# Entrega Apex Idle 1.0

Implementação incremental sobre HTML/JS/Canvas existentes, com ativação por adaptador v2. O roteiro e as seções 18–21 do design orientam esta versão. Os relatórios anteriores são históricos.

## Mantido

- Chave `apex-idle-v2`, exportação/importação em JSON e texto, backup, checksum e proteção entre abas.
- Autenticação Supabase, sincronização com controle de versão, PvP de até dez participantes e rankings existentes.
- Escuderia Aurora, geometrias/licença MIT dos 24 circuitos, áudio, ERS, rádio, simulação de pneus/parada e coleções existentes.
- Cinema de invocação com transformação contínua: a silhueta não desaparece entre interrogação e pintura; aura por raridade, aceleração/chegada e composição final com o mais raro no centro.

## Implementado

1. Balanceamento compartilhado, seis níveis de melhorias, PI relativo à IA, cinco voltas e pontuação uma vez por seed. Migração aditiva dos quatro níveis anteriores.
2. Oficina com lotes e comparação de efeito/posição, recomendação de compra, garagem, seleção imediata de carro/piloto e presets de acerto.
3. Catálogo com 167 itens, três banners novos, taxas/pity/histórico/desejo, pontos de repetidos, componentes até 15%, equipe técnica até 24%, treino temporizado e limites. A coleção clássica continua em um acesso separado dentro da Invocação.
4. Lojas diária/semanal determinísticas, pesos por raridade, reroll limitado, trocas semanais e loja de evento. Itens reais permanecem desativados.
5. Câmera para pista inteira e modo Seguir, margem e dimensões mínimas, classificação acessível no celular, efeitos com pool de 12 e respeito a efeitos desligados/redução de movimento.
6. Farm retirado da execução e banco convertido com teto; Ascensão inativa e fragmentos preservados como legado. Contratos aceitam qualquer carro possuído. Campeonato usa a corrida principal, sem segundo timer de corrida.
7. Seis categorias de 12 etapas, escalas de custo/renda, nível de escuderia, promoção e Nova Temporada com confirmação em dois toques, foco e proteção contra repetição de títulos. Legado/talentos ficam em testes/esqueleto conforme limite explícito do roteiro.
8. Diárias/semanais, baú e sequência, retorno offline sem REP, drops com proteção de azar, corrida perfeita, previsão/chuva/safety car/bandeira vermelha, desafios e Hall da Fama. Safety car reduz o ritmo de todos; bandeira vermelha interrompe o relógio da prova brevemente. Penalidade financeira dos eventos limitada a 8% do prêmio.
9. Tuning validado com fallback, PWA e ícones desenhados em Canvas, atualização, idioma pt-BR/en na interface nova, foco visível, analytics opcional com RLS, retenção de 90 dias, exclusão dos próprios dados, termos/privacidade de rascunho e contratos de anúncios/pagamentos desativados.

Os nomes visíveis de carros/pilotos históricos foram substituídos por fictícios. Identificadores antigos continuam internos para compatibilidade. Fontes oficiais e nomes de recordistas foram removidos dos dados de apresentação; os coeficientes do simulador foram mantidos.

## Verificação

- `npm test`: 23 suítes legadas, 11 testes técnicos anteriores e 23 testes v2 adicionais. Inclui 100.000 invocações pelo método real, migração/round-trip, compra atômica, treino, passe de 28 dias, eventos, categoria/equipe e simuladores originais.
- `npm run build` / `node build.cjs`: 99 arquivos estáticos mais catálogo/locales/config/SDK/ícones gerados.
- Sintaxe verificada com `node --check`; o projeto não possui lint configurado.
- Navegador em 390×844 e 1366×768: largada, classificação de dez carros, compra Motor 0→1 com débito 150→100 CR, importação v1 pela interface, exportação v2, invocação, seleção do carro recém-invocado e aplicação na pista.
- Medição no navegador: 24,33 mutações DOM/s em cinco segundos; 50 de 50 compras aplicadas, mesmo nó de botão, save e checksum válidos.
- Geometria das 24 pistas testada em 360×640 e 1920×1080; simulações de progressão de curto prazo e 90 dias executadas.
- O projeto Supabase recebeu as migrações compatíveis; nenhuma linha de progresso de usuário foi apagada para testar.

## Limites de validação

Lighthouse tentou iniciar Chrome/Edge e falhou na conexão de depuração; nota ≥90 e FPS com CPU 4× não foram medidos. Não se declara aprovação nesses dois critérios. O teste de PvP cobre o servidor e salas 2–10 em suíte, não dez pessoas reais conectadas. Idiomas dos módulos legados mantidos ainda podem conter textos em português. Notificações dependem de o navegador manter o jogo em execução; não foi criado serviço de push. Termos/privacidade aguardam revisão jurídica. Pagamentos, anúncios e Legado ativo não são pendências de implementação desta entrega: foram explicitamente mantidos desativados pelo roteiro.

## Conferir

No preview ou produção: Pista → Oficina → Garagem; Loja → Invocação; Equipe → Pilotos/Contratos; Campeonato → Passe/Temporada. Exportar/importar também fica na Temporada. Atualize a aba quando o botão de nova versão aparecer; não limpe o armazenamento do navegador.
