// js/obstaculos/desenho/caminhao.js
// Caminhão de CARGA LARGA visto de frente: cabine estreita à frente e uma
// carga mais larga que ela, com listras de alerta e giroflex âmbar.

function desenharCaminhaoFrontal(x, y, w, h, o) {
  const pt = (a, b) => [x + w * a, y + h * b];

  function poli(pontos, estilo) {
    ctx.fillStyle = estilo;
    ctx.beginPath();
    pontos.forEach(([a, b], i) => {
      const [px, py] = pt(a, b);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
  }

  // Sombra larga
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.95, w * 0.58, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // ----- Carga (atrás da cabine, mais larga que ela) -----
  const carga = ctx.createLinearGradient(x, 0, x + w, 0);
  carga.addColorStop(0, "#3d4854");
  carga.addColorStop(0.5, "#7d8b99");
  carga.addColorStop(1, "#4a5662");
  poli([[0.0, 0.1], [1.0, 0.1], [1.0, 0.62], [0.0, 0.62]], carga);

  // Topo iluminado
  poli([[0.0, 0.1], [1.0, 0.1], [0.99, 0.15], [0.01, 0.15]], "rgba(255,255,255,0.28)");

  // Listras de alerta nas pontas da carga
  desenharListrasDeAlerta(x, y + h * 0.1, w * 0.1, h * 0.52);
  desenharListrasDeAlerta(x + w * 0.9, y + h * 0.1, w * 0.1, h * 0.52);

  // Faixa amarela com o aviso de carga larga
  poli([[0.12, 0.15], [0.88, 0.15], [0.88, 0.3], [0.12, 0.3]], "#f7c61a");

  if (w > 95) {
    ctx.fillStyle = "#14161c";
    ctx.font = `900 ${Math.round(h * 0.11)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(traduzir("cenario.cargaLarga"), x + w * 0.5, y + h * 0.225);
  } else {
    ctx.fillStyle = "#14161c";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(x + w * (0.15 + i * 0.12), y + h * 0.15, w * 0.05, h * 0.15);
    }
  }

  // Bandeirinhas vermelhas nas extremidades
  ctx.fillStyle = "#e0242d";
  ctx.fillRect(x - w * 0.015, y + h * 0.02, w * 0.07, h * 0.1);
  ctx.fillRect(x + w * 0.945, y + h * 0.02, w * 0.07, h * 0.1);

  // ----- Rodas dianteiras (grandes) -----
  [0.16, 0.74].forEach((px) => {
    const g = ctx.createLinearGradient(x + w * px, 0, x + w * (px + 0.1), 0);
    g.addColorStop(0, "#050608");
    g.addColorStop(0.5, "#2c323b");
    g.addColorStop(1, "#050608");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x + w * px, y + h * 0.6, w * 0.1, h * 0.34, w * 0.015);
    ctx.fill();
  });

  // ----- Cabine -----
  const base = o.color;
  const corpo = ctx.createLinearGradient(x + w * 0.24, 0, x + w * 0.76, 0);
  corpo.addColorStop(0, escurecerCor(base, 0.45));
  corpo.addColorStop(0.5, clarearCor(base, 0.12));
  corpo.addColorStop(1, escurecerCor(base, 0.35));

  poli([[0.25, 0.34], [0.75, 0.34], [0.78, 0.9], [0.22, 0.9]], corpo);

  ctx.strokeStyle = "rgba(6,8,12,0.65)";
  ctx.lineWidth = Math.max(0.8, w * 0.006);
  ctx.stroke();

  // Teto
  poli([[0.27, 0.3], [0.73, 0.3], [0.75, 0.36], [0.25, 0.36]], clarearCor(base, 0.3));

  // Para-brisa
  const vidro = ctx.createLinearGradient(0, y + h * 0.4, 0, y + h * 0.62);
  vidro.addColorStop(0, "#6aa7cf");
  vidro.addColorStop(1, "#0b1a29");
  poli([[0.29, 0.39], [0.71, 0.39], [0.72, 0.62], [0.28, 0.62]], vidro);
  poli([[0.32, 0.4], [0.46, 0.4], [0.4, 0.61], [0.3, 0.61]], "rgba(255,255,255,0.18)");

  // Grade cromada
  poli([[0.32, 0.67], [0.68, 0.67], [0.69, 0.84], [0.31, 0.84]], "#c9d1da");
  ctx.fillStyle = "#1b2027";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + w * 0.33, y + h * (0.69 + i * 0.035), w * 0.34, h * 0.016);
  }

  // Faróis
  [[0.23, 0.68, 0.09], [0.68, 0.68, 0.09]].forEach(([fx, fy, fw]) => {
    ctx.fillStyle = "#232831";
    ctx.fillRect(x + w * fx, y + h * fy, w * fw, h * 0.11);
    ctx.fillStyle = "#fff6c6";
    ctx.fillRect(x + w * (fx + 0.01), y + h * (fy + 0.015), w * (fw - 0.02), h * 0.08);
  });

  // Para-choque
  poli([[0.21, 0.85], [0.79, 0.85], [0.8, 0.94], [0.2, 0.94]], "#262b33");
  poli([[0.22, 0.86], [0.78, 0.86], [0.78, 0.885], [0.22, 0.885]], "#aeb8c3");

  // Luzes de gabarito no teto da cabine
  ctx.fillStyle = "#ffb020";
  [0.3, 0.42, 0.5, 0.58, 0.7].forEach((px) => {
    ctx.fillRect(x + w * px - w * 0.008, y + h * 0.31, w * 0.016, h * 0.025);
  });

  // Brilho do farol (aditivo)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  [0.27, 0.73].forEach((fx) => {
    const cx = x + w * fx;
    const cy = y + h * 0.73;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.13);
    g.addColorStop(0, "rgba(255,240,180,0.55)");
    g.addColorStop(1, "rgba(255,240,180,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w * 0.13, cy - w * 0.13, w * 0.26, w * 0.26);
  });

  // Giroflex âmbar nos cantos da carga
  const fase = Math.floor(performance.now() / 220) % 2 === 0;
  [[0.03, 0.06, fase], [0.97, 0.06, !fase]].forEach(([fx, fy, aceso]) => {
    if (!aceso) return;
    const cx = x + w * fx;
    const cy = y + h * fy;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.14);
    g.addColorStop(0, "rgba(255,176,32,0.9)");
    g.addColorStop(1, "rgba(255,176,32,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w * 0.14, cy - w * 0.14, w * 0.28, w * 0.28);
  });

  ctx.restore();
}

// Listras diagonais amarelas e pretas (sinalização de carga)
function desenharListrasDeAlerta(x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = "#f7c61a";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#14161c";
  const passo = Math.max(3, w * 0.55);

  for (let i = -h; i < w + h; i += passo * 2) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + passo, y + h);
    ctx.lineTo(x + i + passo + h, y);
    ctx.lineTo(x + i + h, y);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
