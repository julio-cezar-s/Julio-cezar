// js/obstaculos/desenho/carro.js
// Desenho dos carros inimigos (civis e viaturas), vistos de frente:
// volumes, vidro refletindo o céu, faróis acesos e giroflex da viatura.
// Quando o carro vai trocar de faixa, o pisca do lado correspondente acende.

// Carro visto de frente com volumes, vidro refletindo o céu e faróis acesos
function desenharCarroFrontal(x, y, w, h, o) {
  const policia = o.type === "police";
  const base = o.color;
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

  // Sombra no asfalto
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.94, w * 0.62, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Versão simplificada para carros muito distantes
  if (w < 16) {
    ctx.fillStyle = escurecerCor(base, 0.45);
    ctx.fillRect(x + w * 0.04, y + h * 0.4, w * 0.92, h * 0.52);
    ctx.fillStyle = base;
    ctx.fillRect(x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.5);
    ctx.fillStyle = "#10263a";
    ctx.fillRect(x + w * 0.22, y + h * 0.24, w * 0.56, h * 0.2);
    ctx.fillStyle = "#fff4b8";
    ctx.fillRect(x + w * 0.08, y + h * 0.58, w * 0.2, h * 0.08);
    ctx.fillRect(x + w * 0.72, y + h * 0.58, w * 0.2, h * 0.08);
    return;
  }

  const contorno = Math.max(0.6, w * 0.014);

  // Pneus dianteiros
  [0.015, 0.825].forEach((px) => {
    const g = ctx.createLinearGradient(x + w * px, 0, x + w * (px + 0.16), 0);
    g.addColorStop(0, "#050608");
    g.addColorStop(0.5, "#2b3039");
    g.addColorStop(1, "#050608");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x + w * px, y + h * 0.55, w * 0.16, h * 0.38, w * 0.03);
    ctx.fill();
  });

  // Saia/para-choque inferior
  const saia = ctx.createLinearGradient(0, y + h * 0.6, 0, y + h * 0.96);
  saia.addColorStop(0, escurecerCor(base, 0.5));
  saia.addColorStop(1, "#0b0d12");
  poli([[0.05, 0.62], [0.95, 0.62], [0.98, 0.88], [0.9, 0.95], [0.1, 0.95], [0.02, 0.88]], saia);

  // Carroceria: gradiente horizontal dá volume arredondado
  const corpo = ctx.createLinearGradient(x, 0, x + w, 0);
  corpo.addColorStop(0, escurecerCor(base, 0.5));
  corpo.addColorStop(0.18, escurecerCor(base, 0.12));
  corpo.addColorStop(0.55, clarearCor(base, 0.2));
  corpo.addColorStop(0.82, base);
  corpo.addColorStop(1, escurecerCor(base, 0.45));

  const carroceria = [
    [0.2, 0.1], [0.8, 0.1], [0.9, 0.28], [0.98, 0.5],
    [0.99, 0.78], [0.92, 0.86], [0.08, 0.86], [0.01, 0.78],
    [0.02, 0.5], [0.1, 0.28],
  ];

  poli(carroceria, corpo);

  ctx.strokeStyle = "rgba(6,8,12,0.65)";
  ctx.lineWidth = contorno;
  ctx.stroke();

  // Capô (superfície inclinada voltada para cima: mais clara)
  const capo = ctx.createLinearGradient(0, y + h * 0.46, 0, y + h * 0.7);
  capo.addColorStop(0, clarearCor(base, 0.38));
  capo.addColorStop(1, clarearCor(base, 0.05));
  poli([[0.17, 0.47], [0.83, 0.47], [0.93, 0.68], [0.07, 0.68]], capo);

  // Vinco central e brilho especular do capô
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = Math.max(0.6, w * 0.012);
  ctx.beginPath();
  let [a1, b1] = pt(0.26, 0.5);
  let [a2, b2] = pt(0.2, 0.64);
  ctx.moveTo(a1, b1); ctx.lineTo(a2, b2);
  [a1, b1] = pt(0.74, 0.5);
  [a2, b2] = pt(0.8, 0.64);
  ctx.moveTo(a1, b1); ctx.lineTo(a2, b2);
  ctx.stroke();

  // Faixa preta de capô na viatura
  if (policia) {
    poli([[0.3, 0.47], [0.7, 0.47], [0.78, 0.68], [0.22, 0.68]], "#14161c");
  }

  // Cabine (estrutura) e teto
  poli([[0.22, 0.12], [0.78, 0.12], [0.88, 0.5], [0.12, 0.5]], escurecerCor(base, 0.28));
  poli([[0.27, 0.07], [0.73, 0.07], [0.78, 0.14], [0.22, 0.14]], clarearCor(base, 0.35));

  // Para-brisa com reflexo do céu
  const vidro = ctx.createLinearGradient(0, y + h * 0.16, 0, y + h * 0.48);
  vidro.addColorStop(0, "#5f9fc8");
  vidro.addColorStop(0.45, "#1d4565");
  vidro.addColorStop(1, "#091522");
  poli([[0.27, 0.17], [0.73, 0.17], [0.84, 0.47], [0.16, 0.47]], vidro);

  poli([[0.3, 0.19], [0.5, 0.19], [0.4, 0.46], [0.2, 0.46]], "rgba(255,255,255,0.16)");
  poli([[0.58, 0.19], [0.64, 0.19], [0.58, 0.46], [0.52, 0.46]], "rgba(255,255,255,0.08)");

  // Retrovisor e coluna
  ctx.fillStyle = escurecerCor(base, 0.3);
  ctx.fillRect(x + w * 0.02, y + h * 0.38, w * 0.1, h * 0.07);
  ctx.fillRect(x + w * 0.88, y + h * 0.38, w * 0.1, h * 0.07);

  // Faróis: moldura, luz e brilho
  const farol = (fx) => {
    poli([[fx, 0.56], [fx + 0.28, 0.58], [fx + 0.26, 0.69], [fx - 0.01, 0.67]], "#232831");
    poli([[fx + 0.02, 0.58], [fx + 0.25, 0.6], [fx + 0.23, 0.66], [fx + 0.01, 0.65]], "#fff6c6");
  };

  farol(0.07);
  poli([[0.65, 0.58], [0.93, 0.56], [0.94, 0.67], [0.67, 0.69]], "#232831");
  poli([[0.67, 0.6], [0.91, 0.58], [0.92, 0.65], [0.69, 0.66]], "#fff6c6");

  // Brilho aditivo dos faróis (mostra que estão acesos)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  [[0.2, 0.63], [0.8, 0.63]].forEach(([fx, fy]) => {
    const [cx, cy] = pt(fx, fy);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.22);
    g.addColorStop(0, "rgba(255,240,180,0.55)");
    g.addColorStop(1, "rgba(255,240,180,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w * 0.22, cy - w * 0.22, w * 0.44, w * 0.44);
  });

  ctx.restore();

  // Grade frontal
  poli([[0.36, 0.66], [0.64, 0.66], [0.66, 0.79], [0.34, 0.79]], "#0a0c11");

  ctx.strokeStyle = "#5a636f";
  ctx.lineWidth = Math.max(0.5, w * 0.008);
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const [gx1, gy1] = pt(0.37, 0.69 + i * 0.035);
    const [gx2] = pt(0.63, 0);
    ctx.moveTo(gx1, gy1);
    ctx.lineTo(gx2, gy1);
  }
  ctx.stroke();

  // Emblema
  ctx.fillStyle = "#dfe6ee";
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.66, Math.max(0.8, w * 0.018), 0, Math.PI * 2);
  ctx.fill();

  // Entrada de ar inferior e placa
  poli([[0.2, 0.84], [0.8, 0.84], [0.74, 0.92], [0.26, 0.92]], "#07080c");
  ctx.fillStyle = "#e9edf2";
  ctx.fillRect(x + w * 0.41, y + h * 0.8, w * 0.18, h * 0.07);
  ctx.fillStyle = "#3a4a63";
  ctx.fillRect(x + w * 0.43, y + h * 0.83, w * 0.14, h * 0.012);

  // Luzes de neblina
  ctx.fillStyle = "#ffd96a";
  ctx.fillRect(x + w * 0.12, y + h * 0.82, w * 0.07, h * 0.035);
  ctx.fillRect(x + w * 0.81, y + h * 0.82, w * 0.07, h * 0.035);

  // Brilho da lateral iluminada pelo sol (direita)
  ctx.fillStyle = "rgba(255,244,220,0.13)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.9, y + h * 0.3);
  ctx.lineTo(x + w * 0.985, y + h * 0.52);
  ctx.lineTo(x + w * 0.99, y + h * 0.76);
  ctx.lineTo(x + w * 0.93, y + h * 0.6);
  ctx.closePath();
  ctx.fill();

  if (o.sinal) desenharPisca(x, y, w, h, o.sinal);

  if (policia) desenharGiroflex(x, y, w, h);
}

// Barra de luz da viatura: alterna vermelho/azul
function desenharGiroflex(x, y, w, h) {
  const fase = Math.floor(performance.now() / 160) % 2 === 0;

  ctx.fillStyle = "#12151c";
  ctx.fillRect(x + w * 0.3, y + h * 0.045, w * 0.4, h * 0.075);

  ctx.fillStyle = fase ? "#ff2640" : "#6b1420";
  ctx.fillRect(x + w * 0.32, y + h * 0.055, w * 0.17, h * 0.055);
  ctx.fillStyle = fase ? "#10305a" : "#2aa3ff";
  ctx.fillRect(x + w * 0.51, y + h * 0.055, w * 0.17, h * 0.055);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const lx = fase ? x + w * 0.4 : x + w * 0.6;
  const cor = fase ? "255,38,64" : "42,163,255";
  const g = ctx.createRadialGradient(lx, y + h * 0.08, 0, lx, y + h * 0.08, w * 0.42);
  g.addColorStop(0, `rgba(${cor},0.65)`);
  g.addColorStop(1, `rgba(${cor},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(lx - w * 0.42, y + h * 0.08 - w * 0.42, w * 0.84, w * 0.84);

  ctx.restore();

  // Faixa branca da lateral
  ctx.fillStyle = "rgba(20,24,34,0.9)";
  ctx.fillRect(x + w * 0.12, y + h * 0.7, w * 0.76, h * 0.03);
}

// Pisca-alerta: avisa para qual lado o carro vai trocar de faixa
// (+1 = direita da tela, -1 = esquerda). Pisca ~3 vezes por segundo.
function desenharPisca(x, y, w, h, lado) {
  const aceso = Math.floor(performance.now() / 160) % 2 === 0;
  if (!aceso) return;

  const px = lado > 0 ? x + w * 0.86 : x + w * 0.02;
  const py = y + h * 0.5;

  ctx.fillStyle = "#ffb020";
  ctx.fillRect(px, py, w * 0.12, h * 0.08);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const g = ctx.createRadialGradient(px + w * 0.06, py + h * 0.04, 0,
    px + w * 0.06, py + h * 0.04, w * 0.3);
  g.addColorStop(0, "rgba(255,176,32,0.8)");
  g.addColorStop(1, "rgba(255,176,32,0)");
  ctx.fillStyle = g;
  ctx.fillRect(px - w * 0.25, py - w * 0.25, w * 0.62, w * 0.62);

  ctx.restore();
}
