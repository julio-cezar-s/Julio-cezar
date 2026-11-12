/* js/cenarios/atmosfera.js
   Atmosfera: névoa do horizonte, brilho do sol, linhas de velocidade
   e vinheta. Tudo desenhado depois dos objetos para "colar" a cena.
*/

// Posição do sol na tela (acompanha o paralaxe do fundo do céu)
function posicaoDoSol() {
  return {
    x: GAME_WIDTH / 2 + 190 - (camera.x * CAMERA_SCALE * 0.01 + camera.giro * 0.15),
    y: ROAD_HORIZON - 52 + perfil.arfagem,
  };
}

// Névoa dourada: mais densa exatamente no horizonte
function drawHorizonAtmosphere() {
  const horizonte = horizonteAtual();
  const topo = horizonte - 46;
  const base = horizonte + 118;

  const g = ctx.createLinearGradient(0, topo, 0, base);
  g.addColorStop(0, "rgba(250,232,192,0)");
  g.addColorStop(0.28, "rgba(250,232,192,0.72)");
  g.addColorStop(0.42, "rgba(244,228,190,0.55)");
  g.addColorStop(0.7, "rgba(236,226,190,0.14)");
  g.addColorStop(1, "rgba(236,226,190,0)");

  ctx.fillStyle = g;
  ctx.fillRect(0, topo, GAME_WIDTH, base - topo);
}

// Brilho do sol sobre a cena (blend aditivo)
function drawSunBloom() {
  const sol = posicaoDoSol();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const g = ctx.createRadialGradient(sol.x, sol.y, 0, sol.x, sol.y, 260);
  g.addColorStop(0, "rgba(255,226,150,0.30)");
  g.addColorStop(0.35, "rgba(255,190,110,0.10)");
  g.addColorStop(1, "rgba(255,170,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.restore();
}

// Linhas de vento saindo do ponto de fuga em alta velocidade
function drawSpeedLines() {
  const intensidade = gameState.speedEffect + (gameState.isTurboActive ? 0.35 : 0);
  if (intensidade < 0.3) return;

  const quadro = Math.floor(gameState.worldDistance * 6);
  const vx = GAME_WIDTH / 2 - camera.x * CAMERA_SCALE * 0.05;
  const vy = horizonteAtual() + 8;

  ctx.save();
  ctx.lineCap = "round";

  const n = Math.round(10 + intensidade * 16);

  for (let i = 0; i < n; i++) {
    const sem = quadro * 3.1 + i * 7.7;

    // ângulo apenas na metade inferior, longe do carro (laterais)
    const lado = hash01(sem) > 0.5 ? 1 : -1;
    const ang = (0.12 + hash01(sem + 1) * 0.55) * Math.PI;
    const dx = Math.cos(ang) * lado;
    const dy = Math.sin(ang);

    const r1 = 150 + hash01(sem + 2) * 160;
    const r2 = r1 + 40 + hash01(sem + 3) * 90 * intensidade;

    const x1 = vx + dx * r1 * 1.5;
    const y1 = vy + dy * r1;
    const x2 = vx + dx * r2 * 1.5;
    const y2 = vy + dy * r2;

    if (y1 > GAME_HEIGHT || x1 < 0 || x1 > GAME_WIDTH) continue;

    ctx.strokeStyle = `rgba(255,255,255,${0.10 + hash01(sem + 4) * 0.16 * intensidade})`;
    ctx.lineWidth = 0.8 + hash01(sem + 5) * 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

// Vinheta com cor de turbo nas bordas
function drawVignette() {
  const turbo = gameState.isTurboActive ? 1 : 0;
  const forca = 0.28 + gameState.speedEffect * 0.22;

  const g = ctx.createRadialGradient(
    GAME_WIDTH / 2, GAME_HEIGHT * 0.52, GAME_HEIGHT * 0.45,
    GAME_WIDTH / 2, GAME_HEIGHT * 0.52, GAME_WIDTH * 0.62
  );

  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, turbo
    ? `rgba(0,40,70,${forca + 0.1})`
    : `rgba(6,10,24,${forca})`);

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (turbo) {
    const borda = ctx.createLinearGradient(0, 0, GAME_WIDTH, 0);
    borda.addColorStop(0, "rgba(0,229,255,0.16)");
    borda.addColorStop(0.18, "rgba(0,229,255,0)");
    borda.addColorStop(0.82, "rgba(0,229,255,0)");
    borda.addColorStop(1, "rgba(0,229,255,0.16)");
    ctx.fillStyle = borda;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
