/* js/sistemas/forca-lateral.js
   Força centrífuga: em curva, o carro tende a ser empurrado para fora.
   O jogador precisa corrigir com o volante, e quanto mais rápido o carro,
   mais forte o empurrão (limitado para continuar justo no turbo).
*/

const FORCA_LATERAL = {
  fator: 0.085,         // intensidade geral do empurrão
  velocidadeMax: 9,    // acima disso a força não cresce mais
};

// Quanto a pista curva exatamente sob o carro (+ direita, - esquerda)
function curvaturaSobOJogador() {
  return curvaturaEm(gameState.worldDistance + PLAYER_Z);
}

function aplicarForcaLateral(dt) {
  const velocidade = Math.min(gameState.gameSpeed, FORCA_LATERAL.velocidadeMax);

  // Curva para a direita empurra o carro para a esquerda (e vice-versa)
  player.worldX -= curvaturaSobOJogador() * velocidade * FORCA_LATERAL.fator * dt;
}
