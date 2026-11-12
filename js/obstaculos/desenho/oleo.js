// js/obstaculos/desenho/oleo.js
// Mancha de óleo: marca no asfalto, desenhada como uma forma suave
// projetada pela perspectiva (por isso acompanha curvas e morros).

const OLEO_PROFUNDIDADE = 0.34;   // meia extensão da mancha em z
const OLEO_PONTOS = 28;

function desenharManchaDeOleo(o, s) {
  const raioX = o.worldWidth / 2;

  // Contorno orgânico: variação lenta do raio (estável por mancha)
  const contorno = (escala, giro = 0) => {
    const pontos = [];

    for (let i = 0; i < OLEO_PONTOS; i++) {
      const ang = (i / OLEO_PONTOS) * Math.PI * 2 + giro;
      const irregular = 1
        + 0.1 * Math.sin(ang * 2 + o.fase)
        + 0.06 * Math.sin(ang * 3 + o.fase * 2);

      const wx = o.worldX + Math.cos(ang) * raioX * irregular * escala;
      const z = o.z + Math.sin(ang) * OLEO_PROFUNDIDADE * irregular * escala;
      const sz = projScale(Math.max(z, 0.4));

      pontos.push([projX(wx, sz), projY(sz)]);
    }

    return pontos;
  };

  // Curva fechada suave passando entre os pontos
  const tracar = (pontos) => {
    const n = pontos.length;
    const meio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

    const inicio = meio(pontos[n - 1], pontos[0]);

    ctx.beginPath();
    ctx.moveTo(inicio[0], inicio[1]);

    for (let i = 0; i < n; i++) {
      const fim = meio(pontos[i], pontos[(i + 1) % n]);
      ctx.quadraticCurveTo(pontos[i][0], pontos[i][1], fim[0], fim[1]);
    }

    ctx.closePath();
  };

  // Mancha escura
  tracar(contorno(1));
  ctx.fillStyle = "rgba(6,8,12,0.9)";
  ctx.fill();

  // Brilho molhado, deslocado para o lado do sol
  tracar(contorno(0.62, 0.3).map(([px, py]) => [px + projLen(0.05, s), py - projLen(0.012, s)]));
  ctx.fillStyle = "rgba(70,84,110,0.45)";
  ctx.fill();

  // Película de óleo: reflexos coloridos suaves
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  [[190, 0.8, 0.0], [285, 0.68, 0.7], [330, 0.56, 1.4]].forEach(([matiz, escala, giro]) => {
    const pontos = contorno(escala, giro).slice(0, 9);

    ctx.strokeStyle = `hsla(${matiz},85%,60%,0.22)`;
    ctx.lineWidth = Math.max(1, projLen(0.035, s));
    ctx.beginPath();
    pontos.forEach(([px, py], k) => {
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

  ctx.restore();
}
