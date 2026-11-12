// js/obstaculos/desenho/cone.js
// Cone de sinalização laranja com duas faixas refletivas.

function desenharCone(x, y, w, h, o) {
  const chao = y + h * 0.92;

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.45, chao + h * 0.02, w * 0.6, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base quadrada
  ctx.fillStyle = "#1f242c";
  ctx.fillRect(x, chao - h * 0.1, w, h * 0.12);

  // Corpo (trapézio com sombreado lateral)
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "#c24a0c");
  g.addColorStop(0.55, "#ff8a2a");
  g.addColorStop(1, "#d9560f");
  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.42, y);
  ctx.lineTo(x + w * 0.58, y);
  ctx.lineTo(x + w * 0.88, chao - h * 0.1);
  ctx.lineTo(x + w * 0.12, chao - h * 0.1);
  ctx.closePath();
  ctx.fill();

  // Faixas brancas (seguem a largura do cone naquela altura)
  const faixa = (t0, t1) => {
    const larg = (t) => 0.16 + 0.72 * t;   // fração da largura em cada altura t (0 topo, 1 base)
    const topo = y + (chao - h * 0.1 - y) * t0;
    const base = y + (chao - h * 0.1 - y) * t1;

    ctx.fillStyle = "#f4f4ee";
    ctx.beginPath();
    ctx.moveTo(x + w * (0.5 - larg(t0) / 2), topo);
    ctx.lineTo(x + w * (0.5 + larg(t0) / 2), topo);
    ctx.lineTo(x + w * (0.5 + larg(t1) / 2), base);
    ctx.lineTo(x + w * (0.5 - larg(t1) / 2), base);
    ctx.closePath();
    ctx.fill();
  };

  faixa(0.3, 0.46);
  faixa(0.58, 0.74);

  // Realce de luz
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y);
  ctx.lineTo(x + w * 0.58, y);
  ctx.lineTo(x + w * 0.74, chao - h * 0.1);
  ctx.lineTo(x + w * 0.6, chao - h * 0.1);
  ctx.closePath();
  ctx.fill();
}
