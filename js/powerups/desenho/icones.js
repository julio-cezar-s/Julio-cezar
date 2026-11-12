// js/powerups/desenho/icones.js
// Ícones dos power-ups, desenhados em vetor. Usados no item da pista e no HUD.
// Cada função recebe o centro (cx, cy), o raio r e a cor de preenchimento.

function desenharIconeDePowerUp(nome, cx, cy, r, cor) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = cor;
  ctx.strokeStyle = cor;

  switch (nome) {
    case "raio": iconeRaio(r); break;
    case "escudo": iconeEscudo(r); break;
    case "relogio": iconeRelogio(r); break;
    case "dobro": iconeDobro(r); break;
  }

  ctx.restore();
}

function iconeRaio(r) {
  const pontos = [[0.2, -1], [-0.6, 0.1], [-0.08, 0.1], [-0.25, 1], [0.62, -0.18], [0.1, -0.18]];

  ctx.beginPath();
  pontos.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * r, y * r);
    else ctx.lineTo(x * r, y * r);
  });
  ctx.closePath();
  ctx.fill();
}

function iconeEscudo(r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0.85 * r, -0.65 * r);
  ctx.lineTo(0.8 * r, 0.1 * r);
  ctx.quadraticCurveTo(0.7 * r, 0.65 * r, 0, r);
  ctx.quadraticCurveTo(-0.7 * r, 0.65 * r, -0.8 * r, 0.1 * r);
  ctx.lineTo(-0.85 * r, -0.65 * r);
  ctx.closePath();
  ctx.fill();

  // Realce na metade esquerda
  ctx.globalAlpha *= 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -0.75 * r);
  ctx.lineTo(-0.6 * r, -0.5 * r);
  ctx.lineTo(-0.58 * r, 0.05 * r);
  ctx.quadraticCurveTo(-0.45 * r, 0.5 * r, 0, 0.78 * r);
  ctx.closePath();
  ctx.fill();
}

function iconeRelogio(r) {
  ctx.lineWidth = Math.max(1.2, r * 0.22);
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -r * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(r * 0.38, r * 0.2);
  ctx.stroke();
}

function iconeDobro(r) {
  ctx.font = `900 ${r * 1.35}px ${HUD_FONTE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("x2", 0, r * 0.06);
}
