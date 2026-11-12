// js/powerups/desenho/item.js
// O item de power-up na pista: um disco que gira e flutua, com halo e um
// feixe de luz vertical para ser visto de longe. Usa a mesma perspectiva
// do resto do cenário.

function desenharItemDePowerUp(item) {
  const def = TIPOS_DE_POWERUP[item.tipo];
  const s = projScale(item.z);
  const u = projLen(1, s);

  if (u < 2) return;

  // Surge suavemente da névoa
  const surgimento = Math.min(1, (item.zSurgimento - item.z) / 2.2);
  if (surgimento <= 0) return;

  const cx = projX(item.worldX, s);
  const chao = projY(s);

  // Flutua e gira
  const altura = 0.44 + Math.sin(item.tempo * 0.08 + item.fase) * 0.06;
  const cy = chao - altura * u;
  const R = Math.max(2.5, 0.27 * u);

  const giro = Math.cos(item.tempo * 0.07 + item.fase);
  const largura = Math.max(0.16, Math.abs(giro));

  ctx.save();
  ctx.globalAlpha *= surgimento;

  // Sombra no asfalto
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(cx, chao, R * 0.95, R * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feixe de luz e halo (aditivos)
  ctx.globalCompositeOperation = "lighter";

  const feixe = ctx.createLinearGradient(0, chao, 0, chao - u * 1.9);
  feixe.addColorStop(0, hexParaRgba(def.cor, 0.42));
  feixe.addColorStop(1, hexParaRgba(def.cor, 0));
  ctx.fillStyle = feixe;
  ctx.fillRect(cx - R * 0.28, chao - u * 1.9, R * 0.56, u * 1.9);

  const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.3);
  halo.addColorStop(0, hexParaRgba(def.cor, 0.55));
  halo.addColorStop(1, hexParaRgba(def.cor, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6);

  ctx.globalCompositeOperation = "source-over";

  // Disco (a largura encolhe quando está de lado)
  const corpo = ctx.createRadialGradient(cx - R * 0.3 * largura, cy - R * 0.35, R * 0.1, cx, cy, R);
  corpo.addColorStop(0, clarearCor(def.cor, 0.35));
  corpo.addColorStop(0.7, def.cor);
  corpo.addColorStop(1, def.cor2);

  ctx.fillStyle = corpo;
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * largura, R, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(1, R * 0.12);
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * largura, R, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Ícone só quando o disco está de frente
  if (largura > 0.35 && R > 5) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(largura, 1);
    desenharIconeDePowerUp(def.icone, 0, 0, R * 0.58, "#ffffff");
    ctx.restore();
  }

  ctx.restore();
}

// "#rrggbb" + opacidade → "rgba(r,g,b,a)"
function hexParaRgba(hex, alfa) {
  const [r, g, b] = hexParaRgb(hex);

  return `rgba(${r},${g},${b},${alfa})`;
}
