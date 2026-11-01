# Inspeção do Foliary — 01/11/2026

Interface autenticada observada com captura de tela e árvore de acessibilidade em https://foliary.com.br/, acessado pelo TopIdle.

Observado: mundo 2D de cima ocupando a superfície principal; recursos agrupados no topo; faixa inferior com atalhos; botão central Menu que revela funções; missões recolhíveis; minimapa; janelas de gestão separadas do cenário. A captura também tinha diversos avisos, portanto não é uma referência de ausência total de informação.

Tecnologia confirmável pelo DOM: elementos HTML Canvas para mundo, formigueiro e minimapa, com bundle JavaScript em /assets/. Não foi possível confirmar engine gráfica, editor, linguagem original do bundle, framework, banco ou infraestrutura do servidor. Não afirmar equivalência total de stack com base nessa observação.

Aplicado ao Apex: Canvas existente preservado; cenário fixo de tela inteira; menu inferior recolhível; menus de gestão em diálogo; recursos compactos; árvores, boxes e arquibancada desenhados com código original. Não foram copiados assets ou código do Foliary. Simulação e persistência continuam locais.

Verificação: sintaxe JavaScript e testes do motor. Inspeção visual do Apex segue pendente: o navegador integrado bloqueou navegação a arquivos file://. A observação do Foliary não valida automaticamente a interface do Apex.
