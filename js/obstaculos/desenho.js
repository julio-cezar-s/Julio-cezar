/* js/obstaculos/desenho.js
   Ponto único de desenho dos obstáculos. Calcula posição e tamanho pela
   perspectiva central e entrega para a função do tipo, em obstaculos/desenho/.

   Convenção de todas as funções de desenho: recebem (x, y, w, h, obstaculo),
   onde (x, y) é o canto superior esquerdo da caixa e o contato com o chão
   fica em y + h * 0.92.
*/

function drawObstacle(obstaculo) {
  const def = tipoDe(obstaculo);
  const s = projScale(obstaculo.z);

  // Surge suavemente da névoa
  const zSurgimento = obstaculo.zSurgimento || ENEMY_Z_SPAWN;
  const surgimento = Math.min(1, (zSurgimento - obstaculo.z) / 2.2);

  if (surgimento <= 0) return;

  ctx.save();
  ctx.globalAlpha *= surgimento;

  if (def.chao) {
    desenharManchaDeOleo(obstaculo, s);
    ctx.restore();
    return;
  }

  const w = projLen(obstaculo.worldWidth, s);
  const h = w * def.proporcao;

  if (w >= 2) {
    const x = projX(obstaculo.worldX, s) - w / 2;
    const y = projY(s) - h * 0.92;

    switch (obstaculo.type) {
      case "truck": desenharCaminhaoFrontal(x, y, w, h, obstaculo); break;
      case "motorcycle": desenharMotoFrontal(x, y, w, h, obstaculo); break;
      case "cone": desenharCone(x, y, w, h, obstaculo); break;
      case "barrier": desenharBarreira(x, y, w, h, obstaculo); break;
      default: desenharCarroFrontal(x, y, w, h, obstaculo);
    }
  }

  ctx.restore();
}
