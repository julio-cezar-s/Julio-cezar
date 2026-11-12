/* js/cenarios/elementos.js
   Cercas, delineadores, placas e pórticos de sinalização.
   Elementos longos (cerca) são segmentos 3D que seguem a perspectiva.
*/

const CERCA_X = 2.62;
const CERCA_SEGMENTO = 1.0;

// =====================================================
// COLETA
// =====================================================

function coletarElementos(lista) {
  // Cercas de madeira, em trechos (nem sempre presentes)
  percorrerPosicoes(CERCA_SEGMENTO, (k, z) => {
    for (let lado = -1; lado <= 1; lado += 2) {
      const trecho = Math.floor(k / 8) + lado * 31;

      if (hash01(trecho * 1.7) < 0.35) continue;

      lista.push({ tipo: "cerca", z, x: lado * CERCA_X, lado, k });
    }
  }, 30);

  // Delineadores refletivos no acostamento
  percorrerPosicoes(2.4, (k, z) => {
    for (let lado = -1; lado <= 1; lado += 2) {
      lista.push({ tipo: "delineador", z, x: lado * 1.95, lado });
    }
  }, 26);

  // Placas de velocidade
  percorrerPosicoes(33, (k, z) => {
    const sem = k * 2.11;
    const lado = hash01(sem) > 0.5 ? 1 : -1;
    const limites = traduzirLista("cenario.limites");   // km/h ou mph, conforme o idioma
    const valor = limites[Math.floor(hash01(sem + 1) * limites.length)];

    lista.push({ tipo: "placa", z, x: lado * 2.05, lado, valor });
  }, 30);

  // Pórtico sobre a pista (grande referência de velocidade)
  percorrerPosicoes(75, (k, z) => {
    const palavras = traduzirLista("cenario.portico");

    lista.push({ tipo: "portico", z, x: 0, texto: palavras[k % palavras.length] });
  });
}

// =====================================================
// CERCA
// =====================================================

function desenharSegmentoCerca(c, s) {
  const u = projLen(1, s);
  if (u < 2) return;

  const zProx = c.z + CERCA_SEGMENTO;
  const sP = projScale(zProx);

  const altura = 0.36;
  const larguraPoste = 0.07;

  // Trilhos (planos entre este poste e o próximo)
  [[0.1, 0.05], [0.24, 0.05]].forEach(([h, e], i) => {
    poligono([
      ponto3D(c.x, h, c.z), ponto3D(c.x, h, zProx),
      ponto3D(c.x, h + e, zProx), ponto3D(c.x, h + e, c.z),
    ], i === 0 ? "#6e4a2b" : "#85603a");

    // brilho de cima do trilho
    ctx.fillStyle = "rgba(255,230,180,0.22)";
    const [x1, y1] = ponto3D(c.x, h + e, c.z);
    const [x2, y2] = ponto3D(c.x, h + e, zProx);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 + 1);
    ctx.lineTo(x1, y1 + 1);
    ctx.fill();
  });

  // Poste
  const bx = projX(c.x, s);
  const by = projY(s);
  const w = Math.max(1, projLen(larguraPoste, s));
  const h = projLen(altura, s);

  ctx.fillStyle = "#4b2f1a";
  ctx.fillRect(bx - w / 2, by - h, w, h);
  ctx.fillStyle = "#9a6c40";
  ctx.fillRect(bx, by - h, w / 2, h);

  // ponta clara do poste
  ctx.fillStyle = "#c79b66";
  ctx.fillRect(bx - w / 2, by - h, w, Math.max(1, w * 0.5));
}

// =====================================================
// DELINEADOR
// =====================================================

function desenharDelineador(d, s) {
  const u = projLen(1, s);
  if (u < 2.2) return;

  const bx = projX(d.x, s);
  const by = projY(s);
  const w = Math.max(1.2, u * 0.07);
  const h = u * 0.34;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(bx - w * 1.8, by - 0.5, w * 2.2, Math.max(1, u * 0.03));

  ctx.fillStyle = "#f4f4ee";
  ctx.fillRect(bx - w / 2, by - h, w, h);

  ctx.fillStyle = "#d9dbd0";
  ctx.fillRect(bx, by - h, w / 2, h);

  // faixa refletiva
  ctx.fillStyle = "#ff3d2e";
  ctx.fillRect(bx - w / 2, by - h * 0.9, w, h * 0.25);
}

// =====================================================
// PLACA DE VELOCIDADE
// =====================================================

function desenharPlaca(p, s) {
  const u = projLen(1, s);
  if (u < 5) return;

  const bx = projX(p.x, s);
  const by = projY(s);
  const R = u * 0.2;
  const altura = u * 0.95;

  ctx.fillStyle = "#6c747e";
  ctx.fillRect(bx - Math.max(1, u * 0.025), by - altura, Math.max(2, u * 0.05), altura);

  const cy = by - altura - R * 0.6;

  ctx.fillStyle = "#d62840";
  ctx.beginPath();
  ctx.arc(bx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(bx, cy, R * 0.76, 0, Math.PI * 2);
  ctx.fill();

  if (R > 6) {
    ctx.fillStyle = "#11141b";
    ctx.font = `900 ${Math.round(R * 0.9)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.valor, bx, cy + R * 0.05);
  }
}

// =====================================================
// PÓRTICO
// =====================================================

function desenharPortico(p, s) {
  const u = projLen(1, s);
  if (u < 2) return;

  const xa = -2.4;
  const xb = 2.4;
  const hTopo = 2.35;

  const col = "#4d5662";

  // Pilares
  retanguloNaFace(xa - 0.1, xa + 0.1, 0, hTopo, p.z, col);
  retanguloNaFace(xb - 0.1, xb + 0.1, 0, hTopo, p.z, col);
  retanguloNaFace(xa - 0.1, xa, 0, hTopo, p.z, "#2f353e");

  // Viga principal
  retanguloNaFace(xa - 0.1, xb + 0.1, hTopo - 0.55, hTopo, p.z, "#262c36");

  // Painel iluminado
  const sx0 = projX(xa + 0.15, s);
  const sx1 = projX(xb - 0.15, s);
  const sy0 = projY(s, hTopo - 0.05);
  const sy1 = projY(s, hTopo - 0.5);

  const g = ctx.createLinearGradient(sx0, 0, sx1, 0);
  g.addColorStop(0, "#ff2e63");
  g.addColorStop(0.5, "#7a1fa2");
  g.addColorStop(1, "#08c4ff");
  ctx.fillStyle = g;
  ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);

  if (sx1 - sx0 > 40) {
    ctx.font = `900 ${Math.round((sy1 - sy0) * 0.78)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(p.texto, (sx0 + sx1) / 2, (sy0 + sy1) / 2 + 1);
  }

  // Luzes sob a viga
  ctx.fillStyle = "rgba(255,244,200,0.9)";
  for (let i = 0; i < 5; i++) {
    const lx = sx0 + (sx1 - sx0) * (0.1 + i * 0.2);
    ctx.fillRect(lx - u * 0.04, sy1 + u * 0.02, u * 0.08, u * 0.04);
  }
}
