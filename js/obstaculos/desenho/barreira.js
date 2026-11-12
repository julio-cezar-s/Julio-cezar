// js/obstaculos/desenho/barreira.js
// Barreira de obras (new jersey) com listras vermelhas e luz piscante.

function desenharBarreira(x, y, w, h, o) {
  const chao = y + h * 0.92;
  const topo = y + h * 0.08;
  const pt = (a, b) => [x + w * a, topo + (chao - topo) * b];

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, chao + h * 0.03, w * 0.58, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // Perfil do bloco: base larga que afina em cima
  const formato = [[0.02, 1], [0.0, 0.55], [0.1, 0.2], [0.18, 0], [0.82, 0], [0.9, 0.2], [1.0, 0.55], [0.98, 1]];

  const concreto = ctx.createLinearGradient(x, 0, x + w, 0);
  concreto.addColorStop(0, "#9aa0a8");
  concreto.addColorStop(0.55, "#e6e8ea");
  concreto.addColorStop(1, "#aab0b7");
  ctx.fillStyle = concreto;
  ctx.beginPath();
  formato.forEach(([a, b], i) => {
    const [px, py] = pt(a, b);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();

  // Listras vermelhas diagonais na parte de cima
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + w * 0.04, topo, w * 0.92, (chao - topo) * 0.62);
  ctx.clip();

  ctx.fillStyle = "#d62840";
  const passo = w * 0.16;

  for (let i = -2; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(x + passo * i, topo + (chao - topo) * 0.62);
    ctx.lineTo(x + passo * i + passo * 0.5, topo + (chao - topo) * 0.62);
    ctx.lineTo(x + passo * i + passo * 1.2, topo);
    ctx.lineTo(x + passo * i + passo * 0.7, topo);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Contorno
  ctx.strokeStyle = "rgba(20,24,30,0.55)";
  ctx.lineWidth = Math.max(0.8, w * 0.012);
  ctx.beginPath();
  formato.forEach(([a, b], i) => {
    const [px, py] = pt(a, b);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();

  // Luz âmbar piscante no topo
  const aceso = Math.floor(performance.now() / 280) % 2 === 0;
  const lx = x + w * 0.5;
  const ly = topo - h * 0.04;

  ctx.fillStyle = aceso ? "#ffb020" : "#7a5410";
  ctx.beginPath();
  ctx.arc(lx, ly, Math.max(1.2, w * 0.05), 0, Math.PI * 2);
  ctx.fill();

  if (aceso) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, w * 0.28);
    g.addColorStop(0, "rgba(255,176,32,0.8)");
    g.addColorStop(1, "rgba(255,176,32,0)");
    ctx.fillStyle = g;
    ctx.fillRect(lx - w * 0.28, ly - w * 0.28, w * 0.56, w * 0.56);
    ctx.restore();
  }
}
