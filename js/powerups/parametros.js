/* js/powerups/parametros.js
   AJUSTES dos power-ups: com que frequência aparecem e como são coletados.
   (O que cada um faz e por quanto tempo está em powerups/tipos.js.)
*/

const POWERUPS = {
  // Quadros até o primeiro item (60 = 1 s): aparece cedo para o jogador conhecer
  primeiroEm: 420,

  // Quadros entre um item e o próximo: [mín, máx]
  intervalo: [660, 960],

  // Só um item por vez na pista
  maximoNaPista: 1,

  // Coleta: largura do item (em faixas) e meia janela de profundidade
  larguraDeColeta: 0.6,
  profundidadeDeColeta: 0.25,

  // Folga de z em que o item não pode ficar numa faixa fechada por obstáculos
  janelaSegura: 3.2,

  // Depois que o escudo se quebra, a batida seguinte também é ignorada
  // por este tempo (evita perder o escudo e bater no mesmo instante)
  invulnerabilidade: 75,

  // Quão rápido a câmera lenta entra e sai (0 a 1 por quadro)
  suavizacaoDoTempo: 0.12,
};
