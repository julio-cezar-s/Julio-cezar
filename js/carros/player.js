// =====================================================
// RETRO TURBO RACER
// Supercarro vermelho — posição projetada e desenho final
// =====================================================

// Caixa visual do carro, derivada da MESMA perspectiva da pista.
// A largura é uma fração da faixa (PLAYER_WORLD_WIDTH), então o carro
// tem sempre proporção coerente com o asfalto.
function obterCaixaDoJogador() {
  const s = projScale(PLAYER_Z);

  const w = projLen(PLAYER_WORLD_WIDTH, s);
  const h = w * 0.955;
  const cx = projX(player.worldX, s);

  return {
    x: cx - w / 2,
    y: PLAYER_GROUND_Y - h * 0.9,   // pneus tocam o asfalto em PLAYER_GROUND_Y
    w,
    h,
    cx,
  };
}

// Mantém player.x/y em sincronia com a posição projetada
function atualizarPosicaoDoJogador() {
  const caixa = obterCaixaDoJogador();

  player.x = caixa.cx - player.width / 2;
  player.y = caixa.y + caixa.h - player.height;
}

function drawPlayer() {
  const { x, y, w, h, cx } = obterCaixaDoJogador();

  const vibracao = Math.sin(performance.now() / 26) * 0.35 * gameState.speedEffect;
  const turbo = gameState.isTurboActive;

  // Reflexo das lanternas e sombra no asfalto (sob o carro)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const refl = ctx.createRadialGradient(cx, y + h * 1.02, 0, cx, y + h * 1.02, w * 0.62);
  refl.addColorStop(0, turbo ? "rgba(0,220,255,0.30)" : "rgba(255,40,70,0.24)");
  refl.addColorStop(1, "rgba(255,40,70,0)");
  ctx.fillStyle = refl;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 1.02, w * 0.62, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.save();

  // Inclinação ao esterçar (rolagem) em torno do ponto de contato
  ctx.translate(cx, y + h * 0.9 + vibracao);
  ctx.rotate(player.steer * 0.05);
  ctx.translate(-cx, -(y + h * 0.9));

  // 1. Sombra, rodas e base inferior
  drawPlayerBase(x, y, w, h);

  // 2. Carroceria e elementos superiores
  drawPlayerBody(x, y, w, h);

  // 3. Para-choque, difusor e acabamentos
  drawPlayerRearDetails(x, y, w, h);

  // 4. Luzes: as lanternas brilham (mais forte no turbo)
  ctx.globalCompositeOperation = "lighter";

  [0.24, 0.76].forEach((fx) => {
    const lx = x + w * fx;
    const ly = y + h * 0.672;

    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, w * (turbo ? 0.34 : 0.26));
    g.addColorStop(0, turbo ? "rgba(255,120,150,0.75)" : "rgba(255,40,70,0.55)");
    g.addColorStop(1, "rgba(255,40,70,0)");
    ctx.fillStyle = g;
    ctx.fillRect(lx - w * 0.36, ly - w * 0.36, w * 0.72, w * 0.72);
  });

  ctx.restore();
}

// Posição (em pixels lógicos) das saídas de escape, para as chamas do turbo
function obterEscapesDoJogador() {
  const { x, y, w, h } = obterCaixaDoJogador();

  return [
    { x: x + w * 0.19, y: y + h * 0.93 },
    { x: x + w * 0.81, y: y + h * 0.93 },
  ];
}
