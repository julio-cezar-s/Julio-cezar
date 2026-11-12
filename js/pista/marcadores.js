// js/pista/marcadores.js
// Marcações pintadas e refletores no asfalto (olhos-de-gato).

function drawRoadMarkers() {
  ctx.save();

  // Olhos-de-gato entre os traços das linhas: forte pista de velocidade
  percorrerFaixas(PERIODO_TRACEJADO, (k) => {
    const z = k * PERIODO_TRACEJADO - gameState.worldDistance + 2.3;

    if (z < Z_MIN_DRAW || z > 20) return;

    const s = projScale(z);
    const y = projY(s);
    const w = Math.max(1, projLen(0.045, s));
    const h = Math.max(0.8, projLen(0.025, s));

    [-ROAD.laneLine, ROAD.laneLine].forEach((x) => {
      ctx.fillStyle = "rgba(255,214,70,0.95)";
      ctx.fillRect(projX(x, s) - w / 2, y - h, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(projX(x, s) - w / 4, y - h, w / 2, h / 2);
    });
  });

  ctx.restore();
}
