// js/obstaculos/desenho/moto.js
// Moto vista de frente: pneu, farol aceso, carenagem, guidão e piloto.

function desenharMotoFrontal(x, y, w, h, o) {
  const cx = x + w / 2;

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.94, w * 0.55, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pneu dianteiro
  const pneu = ctx.createLinearGradient(cx - w * 0.14, 0, cx + w * 0.14, 0);
  pneu.addColorStop(0, "#050608");
  pneu.addColorStop(0.5, "#323842");
  pneu.addColorStop(1, "#050608");
  ctx.fillStyle = pneu;
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.14, y + h * 0.58, w * 0.28, h * 0.36, w * 0.1);
  ctx.fill();

  // Garfo
  ctx.strokeStyle = "#aeb8c3";
  ctx.lineWidth = Math.max(1, w * 0.06);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.14, y + h * 0.42);
  ctx.lineTo(cx - w * 0.12, y + h * 0.7);
  ctx.moveTo(cx + w * 0.14, y + h * 0.42);
  ctx.lineTo(cx + w * 0.12, y + h * 0.7);
  ctx.stroke();

  // Corpo do piloto (jaqueta com faixa)
  const jaqueta = ctx.createLinearGradient(cx - w * 0.3, 0, cx + w * 0.3, 0);
  jaqueta.addColorStop(0, "#14181f");
  jaqueta.addColorStop(0.6, "#2d3541");
  jaqueta.addColorStop(1, "#14181f");
  ctx.fillStyle = jaqueta;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, y + h * 0.36);
  ctx.quadraticCurveTo(cx, y + h * 0.1, cx + w * 0.3, y + h * 0.36);
  ctx.lineTo(cx + w * 0.22, y + h * 0.5);
  ctx.lineTo(cx - w * 0.22, y + h * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = o.color;
  ctx.fillRect(cx - w * 0.28, y + h * 0.32, w * 0.56, h * 0.03);

  // Capacete
  const capacete = ctx.createRadialGradient(cx - w * 0.06, y + h * 0.07, 1, cx, y + h * 0.1, w * 0.3);
  capacete.addColorStop(0, clarearCor(o.color, 0.5));
  capacete.addColorStop(1, escurecerCor(o.color, 0.3));
  ctx.fillStyle = capacete;
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.1, w * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0b1622";
  ctx.fillRect(cx - w * 0.15, y + h * 0.085, w * 0.3, h * 0.04);

  // Carenagem e farol
  ctx.fillStyle = escurecerCor(o.color, 0.1);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.2, y + h * 0.52);
  ctx.lineTo(cx + w * 0.2, y + h * 0.52);
  ctx.lineTo(cx + w * 0.13, y + h * 0.66);
  ctx.lineTo(cx - w * 0.13, y + h * 0.66);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff6c6";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.56, w * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Guidão, manoplas e retrovisores
  ctx.strokeStyle = "#1b2027";
  ctx.lineWidth = Math.max(1, w * 0.05);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, y + h * 0.4);
  ctx.lineTo(x + w * 0.96, y + h * 0.4);
  ctx.stroke();

  ctx.fillStyle = "#aeb8c3";
  ctx.fillRect(x, y + h * 0.33, w * 0.1, h * 0.04);
  ctx.fillRect(x + w * 0.9, y + h * 0.33, w * 0.1, h * 0.04);

  // Brilho do farol
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(cx, y + h * 0.56, 0, cx, y + h * 0.56, w * 0.6);
  g.addColorStop(0, "rgba(255,240,180,0.6)");
  g.addColorStop(1, "rgba(255,240,180,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - w * 0.6, y + h * 0.56 - w * 0.6, w * 1.2, w * 1.2);
  ctx.restore();
}
