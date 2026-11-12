/* js/cenarios/construcoes.js
   Construções rurais em caixas 3D projetadas pela perspectiva central:
   galpões, casas, silos e outdoors. Fachada, lateral e telhado são
   desenhados com os mesmos cálculos da pista.
*/

const PALETAS_PAREDE = [
  { parede: "#b0432f", detalhe: "#f4ecdc", telhado: "#4a4a55" },  // celeiro vermelho
  { parede: "#d8b96a", detalhe: "#7c5a2b", telhado: "#7a3b2e" },  // madeira clara
  { parede: "#8d9aa6", detalhe: "#e8eef2", telhado: "#5a2f2a" },  // chapa metálica
];

// =====================================================
// COLETA
// =====================================================

function coletarConstrucoes(lista) {
  percorrerPosicoes(17, (k, z) => {
    for (let lado = -1; lado <= 1; lado += 2) {
      const sem = k * 1.93 + lado * 71;

      if (hash01(sem) < 0.58) continue;

      const t = hash01(sem + 1);
      const x = lado * (6.4 + hash01(sem + 2) * 3);

      if (t < 0.42) {
        lista.push({ tipo: "galpao", z, x, paleta: Math.floor(hash01(sem + 3) * 3), sem });
      } else if (t < 0.78) {
        lista.push({ tipo: "casa", z, x, cor: hash01(sem + 3), sem });
      } else {
        lista.push({ tipo: "silo", z, x, sem });
      }
    }
  });

  // Outdoors junto à pista
  percorrerPosicoes(46, (k, z) => {
    const sem = k * 3.77;
    const lado = hash01(sem) > 0.5 ? 1 : -1;
    const outdoors = traduzirLista("cenario.outdoors");

    lista.push({
      tipo: "outdoor",
      z,
      x: lado * 3.1,
      texto: outdoors[Math.floor(hash01(sem + 1) * outdoors.length)],
      sem,
    });
  });
}

// =====================================================
// UTILITÁRIOS 3D
// =====================================================

function ponto3D(wx, h, z) {
  const s = projScale(z);
  return [projX(wx, s), projY(s, h)];
}

function poligono(pontos, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();

  pontos.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p[0], p[1]);
    else ctx.lineTo(p[0], p[1]);
  });

  ctx.closePath();
  ctx.fill();
}

// Retângulo contido num plano de profundidade constante (fachada)
function retanguloNaFace(xa, xb, ha, hb, z, cor) {
  const s = projScale(z);
  const x1 = projX(xa, s);
  const x2 = projX(xb, s);
  const y1 = projY(s, hb);
  const y2 = projY(s, ha);

  ctx.fillStyle = cor;
  ctx.fillRect(Math.min(x1, x2), y1, Math.abs(x2 - x1), y2 - y1);
}

// Caixa com telhado de duas águas; o.x é a aresta mais próxima da pista
function desenharCaixaComTelhado(o, cfg) {
  const lado = Math.sign(o.x);
  const xi = o.x;
  const xo = o.x + lado * cfg.largura;
  const xc = (xi + xo) / 2;

  const z0 = o.z;
  const z1 = o.z + cfg.profundidade;

  const sol = lado < 0 ? 0.1 : -0.26;   // sol à direita: lateral voltada para ele é clara
  const parede = cfg.parede;

  // Sombra projetada no chão
  const sombra = [
    ponto3D(xi, 0, z0), ponto3D(xo - lado * 0.4, 0, z0),
    ponto3D(xo - lado * 0.4, 0, z1), ponto3D(xi, 0, z1),
  ];
  poligono(sombra.map((p) => [p[0] - 10, p[1]]), "rgba(10,25,14,0.22)");

  // Lateral voltada para a pista
  poligono([
    ponto3D(xi, 0, z0), ponto3D(xi, 0, z1),
    ponto3D(xi, cfg.paredeAltura, z1), ponto3D(xi, cfg.paredeAltura, z0),
  ], sol > 0 ? clarearCor(parede, sol) : escurecerCor(parede, -sol));

  // Janelas laterais
  if (cfg.janelasLaterais) {
    for (let i = 0; i < cfg.janelasLaterais; i++) {
      const za = z0 + cfg.profundidade * (0.18 + i * (0.64 / cfg.janelasLaterais));
      const zb = za + cfg.profundidade * 0.09;

      poligono([
        ponto3D(xi, cfg.paredeAltura * 0.35, za), ponto3D(xi, cfg.paredeAltura * 0.35, zb),
        ponto3D(xi, cfg.paredeAltura * 0.72, zb), ponto3D(xi, cfg.paredeAltura * 0.72, za),
      ], "#27384a");
    }
  }

  // Água do telhado voltada para a pista
  poligono([
    ponto3D(xi + lado * -0.12, cfg.paredeAltura - 0.02, z0 - 0.1),
    ponto3D(xi + lado * -0.12, cfg.paredeAltura - 0.02, z1 + 0.1),
    ponto3D(xc, cfg.cumeeira, z1 + 0.1), ponto3D(xc, cfg.cumeeira, z0 - 0.1),
  ], sol > 0 ? clarearCor(cfg.telhado, sol * 0.9) : escurecerCor(cfg.telhado, -sol * 0.4));

  // Fachada frontal + empena
  poligono([
    ponto3D(xi, 0, z0), ponto3D(xo, 0, z0),
    ponto3D(xo, cfg.paredeAltura, z0), ponto3D(xi, cfg.paredeAltura, z0),
  ], parede);

  poligono([
    ponto3D(xi, cfg.paredeAltura, z0), ponto3D(xo, cfg.paredeAltura, z0),
    ponto3D(xc, cfg.cumeeira, z0),
  ], clarearCor(parede, 0.06));

  // contorno do telhado na empena
  const [ax, ay] = ponto3D(xi, cfg.paredeAltura, z0);
  const [bx, by] = ponto3D(xc, cfg.cumeeira, z0);
  const [cx, cy] = ponto3D(xo, cfg.paredeAltura, z0);

  ctx.strokeStyle = cfg.telhado;
  ctx.lineWidth = Math.max(1, projLen(0.07, projScale(z0)));
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  return { xi, xo, xc, z0, z1 };
}

// =====================================================
// GALPÃO
// =====================================================

function desenharGalpao(o, s) {
  if (projLen(1, s) < 2.5) return;

  const p = PALETAS_PAREDE[o.paleta];

  const g = desenharCaixaComTelhado(o, {
    largura: 3.3, profundidade: 4.6,
    paredeAltura: 1.25, cumeeira: 2.0,
    parede: p.parede, telhado: p.telhado,
    janelasLaterais: 3,
  });

  const lado = Math.sign(o.x);
  const largura = Math.abs(g.xo - g.xi);

  // Porta dupla com travessas em X
  const x0 = g.xc - 0.55;
  const x1 = g.xc + 0.55;

  retanguloNaFace(x0, x1, 0, 0.92, g.z0, escurecerCor(p.parede, 0.35));
  retanguloNaFace(x0 + 0.04, g.xc - 0.02, 0.04, 0.88, g.z0, escurecerCor(p.parede, 0.15));
  retanguloNaFace(g.xc + 0.02, x1 - 0.04, 0.04, 0.88, g.z0, escurecerCor(p.parede, 0.15));

  const [px0, py0] = ponto3D(x0 + 0.04, 0.04, g.z0);
  const [px1, py1] = ponto3D(g.xc - 0.02, 0.88, g.z0);
  const [qx0, qy0] = ponto3D(g.xc + 0.02, 0.04, g.z0);
  const [qx1, qy1] = ponto3D(x1 - 0.04, 0.88, g.z0);

  ctx.strokeStyle = p.detalhe;
  ctx.lineWidth = Math.max(0.8, projLen(0.035, s));
  ctx.beginPath();
  ctx.moveTo(px0, py0); ctx.lineTo(px1, py1);
  ctx.moveTo(px0, py1); ctx.lineTo(px1, py0);
  ctx.moveTo(qx0, qy0); ctx.lineTo(qx1, qy1);
  ctx.moveTo(qx0, qy1); ctx.lineTo(qx1, qy0);
  ctx.stroke();

  // Abertura do feno
  retanguloNaFace(g.xc - 0.22, g.xc + 0.22, 1.32, 1.7, g.z0, "#2b1d16");
}

// =====================================================
// CASA
// =====================================================

function desenharCasa(o, s) {
  if (projLen(1, s) < 2.5) return;

  const parede = o.cor > 0.5 ? "#ead9b4" : "#c9d9e6";
  const telhado = o.cor > 0.5 ? "#a2402f" : "#4d5667";

  const g = desenharCaixaComTelhado(o, {
    largura: 2.5, profundidade: 3,
    paredeAltura: 1.0, cumeeira: 1.65,
    parede, telhado, janelasLaterais: 2,
  });

  // Porta
  retanguloNaFace(g.xc - 0.17, g.xc + 0.17, 0, 0.7, g.z0, "#5b3a24");
  retanguloNaFace(g.xc + 0.08, g.xc + 0.11, 0.3, 0.38, g.z0, "#e8c872");

  // Janelas com moldura clara e vidro refletindo o céu
  [[-0.9, -0.5], [0.5, 0.9]].forEach(([a, b]) => {
    retanguloNaFace(g.xc + a - 0.04, g.xc + b + 0.04, 0.3, 0.78, g.z0, "#f6f1e6");
    retanguloNaFace(g.xc + a, g.xc + b, 0.34, 0.74, g.z0, "#6ea8cf");
    retanguloNaFace(g.xc + a, g.xc + b, 0.58, 0.74, g.z0, "#a9d4ee");
  });

  // Chaminé
  const lado = Math.sign(o.x);
  retanguloNaFace(g.xc + lado * 0.35 - 0.09, g.xc + lado * 0.35 + 0.09, 1.35, 1.9, g.z0 + 1.2, "#7b4a3a");
}

// =====================================================
// SILO
// =====================================================

function desenharSilo(o, s) {
  const u = projLen(1, s);
  if (u < 2.5) return;

  const lado = Math.sign(o.x);
  const bx = projX(o.x + lado * 0.6, s);
  const by = projY(s);
  const R = 0.5 * u;
  const H = 2.5 * u;

  desenharSombraChao(bx, by, R * 1.5, R * 0.3, 0.2);

  // Corpo cilíndrico com sombreado horizontal
  const g = ctx.createLinearGradient(bx - R, 0, bx + R, 0);
  g.addColorStop(0, "#7d8996");
  g.addColorStop(0.45, "#d3dbe3");
  g.addColorStop(0.8, "#eef2f5");
  g.addColorStop(1, "#9aa6b2");
  ctx.fillStyle = g;
  ctx.fillRect(bx - R, by - H, R * 2, H);

  // Anéis
  ctx.fillStyle = "rgba(60,70,80,0.25)";
  for (let i = 1; i < 6; i++) {
    ctx.fillRect(bx - R, by - H * (i / 6), R * 2, Math.max(0.8, u * 0.02));
  }

  // Base da cúpula (elipse) e cúpula
  ctx.fillStyle = "#98a4b0";
  ctx.beginPath();
  ctx.ellipse(bx, by - H, R, R * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  const domo = ctx.createLinearGradient(bx - R, 0, bx + R, 0);
  domo.addColorStop(0, "#9a3b30");
  domo.addColorStop(0.6, "#d6604f");
  domo.addColorStop(1, "#b04a3d");
  ctx.fillStyle = domo;
  ctx.beginPath();
  ctx.ellipse(bx, by - H, R, R * 0.22, 0, Math.PI, 0);
  ctx.quadraticCurveTo(bx + R * 0.6, by - H - R * 1.0, bx, by - H - R * 1.05);
  ctx.quadraticCurveTo(bx - R * 0.6, by - H - R * 1.0, bx - R, by - H);
  ctx.fill();
}

// =====================================================
// OUTDOOR
// =====================================================

function desenharOutdoor(o, s) {
  const u = projLen(1, s);
  if (u < 4) return;

  const lado = Math.sign(o.x);
  const larg = 2.5;
  const xa = lado < 0 ? o.x - larg : o.x;
  const xb = lado < 0 ? o.x : o.x + larg;

  // Postes
  const pc = "#454c56";
  retanguloNaFace(xa + 0.2, xa + 0.3, 0, 1.15, o.z, pc);
  retanguloNaFace(xb - 0.3, xb - 0.2, 0, 1.15, o.z, pc);

  // Moldura e painel
  retanguloNaFace(xa - 0.06, xb + 0.06, 0.94, 1.96, o.z, "#d9dde3");
  retanguloNaFace(xa, xb, 1.0, 1.9, o.z, "#0c1a2b");

  // Gradiente do painel
  const sx0 = projX(xa, s);
  const sx1 = projX(xb, s);
  const sy0 = projY(s, 1.9);
  const sy1 = projY(s, 1.0);

  const g = ctx.createLinearGradient(0, sy0, 0, sy1);
  g.addColorStop(0, "#143a63");
  g.addColorStop(1, "#7a1f4f");
  ctx.fillStyle = g;
  ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);

  // Luminárias no topo
  ctx.fillStyle = "#ffe9a8";
  for (let i = 0; i < 3; i++) {
    const lx = sx0 + (sx1 - sx0) * (0.2 + i * 0.3);
    ctx.fillRect(lx - u * 0.05, sy0 - u * 0.1, u * 0.1, u * 0.05);
  }

  // Texto
  if (sx1 - sx0 > 34) {
    ctx.font = `900 ${Math.round((sy1 - sy0) * 0.55)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ff2e63";
    ctx.fillText(o.texto, (sx0 + sx1) / 2 + 1, (sy0 + sy1) / 2 + 1);
    ctx.fillStyle = "#37f2ff";
    ctx.fillText(o.texto, (sx0 + sx1) / 2, (sy0 + sy1) / 2);
  }
}
