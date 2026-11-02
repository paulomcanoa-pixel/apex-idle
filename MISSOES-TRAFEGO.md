# Missões e disputas na pista

O menu Missões oferece 12 objetivos de carreira com créditos e XP. Voltas, melhorias, peças, coleção, corridas, vitórias e contratos usam o progresso existente do save. Cada objetivo pode ser recolhido uma vez. Turnos repetíveis de 25 voltas rendem 1.200 CR e 10 XP por bloco, incluindo voltas offline; blocos acumulados podem ser recolhidos posteriormente. XP de missão aumenta reputação, não contadores de voltas, evitando completar a própria missão repetível.

`missions-model.js` é independente da interface. O ledger de resgates é validado ao carregar/importar. Saves anteriores continuam válidos. Resgates verificam saldo seguro, adicionam crédito e XP e são persistidos pelo mecanismo existente; a interface não permite resgatar de uma aba que perdeu a posse do save.

O asfalto foi ampliado de 11 para 44 unidades visuais, sem alterar a linha central geográfica. Até quatro carros usam deslocamentos laterais distintos quando próximos, com transição suave. No treino, os rivais mantêm progresso contínuo entre voltas. Na corrida, a classificação continua vindo do simulador de ritmo/pneus/ERS: o desenho lateral acompanha a disputa; não foi introduzido um modelo físico de colisões. A câmera e o efeito de ERS acompanham o deslocamento do jogador, e o minimapa usa os mesmos competidores.

Validação: `node missions-traffic-test.cjs`, junto às suítes existentes de corrida, economia, peças, mapas e carreira. Testa recompensa exata, resgate único, repetíveis acumulados, saves legados e inválidos, quatro linhas distintas dentro do asfalto e suavização de mudanças de linha. A carreira e a invocação existentes foram preservadas.
