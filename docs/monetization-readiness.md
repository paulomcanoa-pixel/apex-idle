# Condições para monetização

Anúncios e pagamentos reais continuam desativados. A análise aprovada coloca monetização após estabilidade, retenção observada e revisão dos direitos. Implementar a preparação não comprova essas condições.

O projeto já possui slots de pintura, capacete e efeitos, Canvas de carros/chegada e compras visuais com moedas internas. Eles são a base para visuais originais, apresentação da garagem e desafios de recompensa conhecida. Raridade, títulos, compras e poder do save solo não aumentam atributos no ranked normalizado. Troféus cooperativos também não geram poder ou moeda.

Antes de lançar uma oferta paga:

1. Revisar o uso comercial de nomes de equipes, carros, pilotos, pinturas e referências históricas. O catálogo atual é uma adaptação de jogo; não afirmar parceria ou licença inexistente. Essa decisão depende do responsável e de revisão adequada, não de uma suposição no código.
2. Concluir observação de jogadores e coortes maduras usando `validation-protocol.md`, corrigir falhas de save, progressão e compra identificadas e definir os critérios de lançamento.
3. Aprovar uma oferta de conteúdo original com preço e entrega conhecidos. Não oferecer vantagem ranked, venda enganosa de chance ou urgência artificial.
4. Só então integrar um provedor em ambiente de teste, com confirmação de compra, recibo, entrega idempotente no servidor, recuperação, estorno e suporte. Não há cobrança configurada nesta entrega.

Não ativar pagamentos ou anúncios automaticamente porque uma data chegou ou porque os testes unitários passaram. Os módulos `ads.available` e `payments.available` permanecem `false`.
