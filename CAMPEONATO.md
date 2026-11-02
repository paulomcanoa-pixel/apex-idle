
# Campeonato idle — adaptação do white paper

Implementação jogável solo, coexistindo com treino, corridas de cinco voltas, farm e PvP. O caixa CR é compartilhado; as outras três moedas são fichas de integrantes, gemas de jogo e reputação permanente do campeonato (independente do XP que desbloqueia circuitos).

- 20 carros, corrida automática de 30 segundos, temporada de 24 corridas, promoção com 380 pontos e título com 480. Seis categorias: Júnior, Challenger, Pro, Elite, Apex, Lenda.
- Seis peças próprias, custo e renda com as fórmulas do documento; compra de um, até dez ou máximo de níveis, até nível 200 por peça. Piloto modifica ritmo; dois engenheiros modificam renda.
- Dez integrantes fictícios em quatro raridades. Recrutamento permanente e destaque mensal: base lendária 1%, soft pity na tentativa 60 (+4,5 pontos percentuais), hard pity 80; épico garantido na décima. Destaque 60%, próxima lendária garantida após perder; contadores separados por tipo e preservados entre meses. Cópias e estrelas 1/2/4/8/16.
- Taxas são do novo recrutamento de integrantes. Carros preservam integralmente o balanceamento anterior (inclusive mítico, loja e duplicatas).
- 10 fichas iniciais; uma a cada dez corridas; cinco diárias e dez por título. Sem venda de fichas. Contratos diretos alternativos por gemas de jogo, sem sorteio.
- Diárias: 150 pontos possíveis, baú com 100, reinício à meia-noite de Brasília. Passe gratuito mensal com dez etapas, evento de 24 corridas e rotação mensal de destaque entre dois integrantes. Recompensas com resgate único.
- Gemas de atividades permitem resolver 24 corridas, equivalentes a seis horas offline, por 100 gemas. Não é anúncio nem compra com dinheiro.
- Offline: uma corrida por 15 minutos com campeonato ativo, até 32 corridas por ausência de oito horas. Ao vivo: uma a cada 30 segundos, inclusive com painel fechado. Pausa explícita para parar a produção. Em URL de teste, velocidades 5×/20× afetam somente o campeonato.
- Prestígio opcional pela fórmula logarítmica sobre créditos efetivamente ganhos no campeonato; confirmação informa o saldo exato que será apagado. Zera o caixa CR compartilhado e estas seis peças; mantém categoria, integrantes, estrelas e demais sistemas. Cada reputação adiciona 3% à renda do campeonato.
- Arte do campeonato em Canvas, mostrando 20 monopostos e projeção do grid. O resultado é de simulação por ritmo, não direção em tempo real.

Limites desta entrega: save local, relógio local e sorteio no cliente. Não representa economia autoritativa, cadastro em nuvem, verificação de idade ou proteção contra edição de saves. Não há integração de pagamentos, anúncios ou oferta paga; não há botão que finja verificação de idade. Essas partes do roadmap exigem provedor real e configuração de produto. A renomeação de toda a marca e a substituição dos circuitos existentes não foram feitas; o universo dos integrantes é original. Não se declara conformidade jurídica a partir do PDF.

Validação: regressões anteriores e testes próprios de temporadas, título, offline, pity, estrelas, contratos diretos, diárias, passe, eventos, tempo, prestígio e validação de saves.
