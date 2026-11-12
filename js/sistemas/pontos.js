/* js/sistemas/pontos.js
   Ponto de entrada ÚNICO para ganhar pontos. Pontuação com o tempo, bônus
   de desvio (combo/) e quase-colisões (quase-colisao/) passam por aqui, e
   por isso bônus globais — como o "PONTOS x2" dos power-ups — valem para
   todas as fontes sem cada sistema precisar saber deles.

   Devolve quanto foi ganho de fato (já com os bônus).
*/

function adicionarPontos(valor) {
  const bonus = typeof multiplicadorDePontosDosPowerUps === "function"
    ? multiplicadorDePontosDosPowerUps()
    : 1;

  const ganho = valor * bonus;

  gameState.score += ganho;

  return ganho;
}
