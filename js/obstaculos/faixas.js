/* js/obstaculos/faixas.js
   Consultas sobre quais faixas estão ocupadas. Usadas pelo diretor
   (para nunca fechar a pista inteira) e pelos comportamentos
   (para só trocar de faixa quando há espaço).
*/

// Faixas (0, 1, 2) tocadas por algo centrado em x com a largura dada
function faixasCobertas(x, largura) {
  const faixas = [];

  for (let faixa = 0; faixa < LANE_COUNT; faixa++) {
    // meia largura do objeto + meia largura do carro do jogador (84%)
    const alcance = largura / 2 + (PLAYER_WORLD_WIDTH * HITBOX_WIDTH_FACTOR) / 2;

    if (Math.abs(xDaFaixa(faixa) - x) < alcance) faixas.push(faixa);
  }

  return faixas;
}

// Conjunto de faixas fechadas por obstáculos DUROS entre zMin e zMax
function faixasBloqueadasEm(zMin, zMax, ignorar = null) {
  const bloqueadas = new Set();

  obstacles.forEach((o) => {
    if (o === ignorar) return;
    if (!tipoDe(o).duro) return;
    if (o.z < zMin || o.z > zMax) return;

    faixasCobertas(o.worldX, o.worldWidth).forEach((f) => bloqueadas.add(f));
  });

  return bloqueadas;
}

// Faixa em que o jogador está agora (0, 1 ou 2)
function faixaDoJogador() {
  const f = Math.round(player.worldX + (LANE_COUNT - 1) / 2);

  return Math.max(0, Math.min(LANE_COUNT - 1, f));
}
