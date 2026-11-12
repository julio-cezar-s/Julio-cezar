// js/pista/ceu.js
// Céu, sol, nuvens, montanhas e mata distante.
// As camadas estáticas são pré-renderizadas uma única vez em canvases
// auxiliares e deslocadas com paralaxe (acompanham a câmera lateral).

const CEU_LARGURA = 900;          // camadas mais largas que a tela, para o paralaxe
const CEU_ALTURA = ROAD_HORIZON + 14;

let camadasCeu = null;

function criarCamada(largura, altura) {
  const c = document.createElement("canvas");
  c.width = Math.round(largura * RENDER_SCALE);
  c.height = Math.round(altura * RENDER_SCALE);

  const x = c.getContext("2d");
  x.scale(RENDER_SCALE, RENDER_SCALE);

  return { canvas: c, ctx: x };
}

// =====================================================
// CONSTRUÇÃO DAS CAMADAS
// =====================================================

function construirCamadasCeu() {
  camadasCeu = {
    fundo: construirFundoCeu(),
    montanhasLonge: construirMontanhas({
      semente: 11, base: ROAD_HORIZON - 4, altura: 74, ruido: 0.55,
      corTopo: "#8da0c6", corBase: "#c3cfdf", neve: true, brilho: 0.20,
    }),
    montanhasPerto: construirMontanhas({
      semente: 29, base: ROAD_HORIZON + 2, altura: 46, ruido: 0.8,
      corTopo: "#5f7f9a", corBase: "#8fb0b3", neve: false, brilho: 0.16,
    }),
    mata: construirMataDistante(),
    nuvens: construirNuvens(),
  };
}

function construirFundoCeu() {
  const { canvas: c, ctx: x } = criarCamada(CEU_LARGURA, CEU_ALTURA);

  const g = x.createLinearGradient(0, 0, 0, ROAD_HORIZON + 6);
  g.addColorStop(0, "#0d56a2");
  g.addColorStop(0.35, "#2f8bd6");
  g.addColorStop(0.7, "#8fd0f0");
  g.addColorStop(1, "#f7e6bd");
  x.fillStyle = g;
  x.fillRect(0, 0, CEU_LARGURA, CEU_ALTURA);

  // Brilho do sol baixo, do lado direito
  const sx = CEU_LARGURA / 2 + 190;
  const sy = ROAD_HORIZON - 52;

  const halo = x.createRadialGradient(sx, sy, 4, sx, sy, 150);
  halo.addColorStop(0, "rgba(255,246,204,0.95)");
  halo.addColorStop(0.18, "rgba(255,232,160,0.55)");
  halo.addColorStop(0.55, "rgba(255,200,120,0.16)");
  halo.addColorStop(1, "rgba(255,200,120,0)");
  x.fillStyle = halo;
  x.fillRect(0, 0, CEU_LARGURA, CEU_ALTURA);

  x.fillStyle = "#fff7d6";
  x.beginPath();
  x.arc(sx, sy, 17, 0, Math.PI * 2);
  x.fill();

  return c;
}

// Cordilheira procedural com facetas iluminadas pelo sol (à direita)
function construirMontanhas(o) {
  const { canvas: c, ctx: x } = criarCamada(CEU_LARGURA, CEU_ALTURA);

  const passo = 10;
  const pontos = [];

  for (let px = -passo; px <= CEU_LARGURA + passo; px += passo) {
    const t = px / CEU_LARGURA;
    const r =
      Math.sin(t * 9.1 + o.semente) * 0.5 +
      Math.sin(t * 21.3 + o.semente * 2.1) * 0.28 * o.ruido +
      Math.sin(t * 47.7 + o.semente * 3.7) * 0.12 * o.ruido +
      hash01(px * 0.17 + o.semente) * 0.14 * o.ruido;

    pontos.push({ x: px, y: o.base - (0.55 + r * 0.6) * o.altura });
  }

  const topo = Math.min(...pontos.map((p) => p.y));

  // Silhueta
  const g = x.createLinearGradient(0, topo, 0, o.base + 4);
  g.addColorStop(0, o.corTopo);
  g.addColorStop(1, o.corBase);
  x.fillStyle = g;

  x.beginPath();
  x.moveTo(pontos[0].x, o.base + 6);
  pontos.forEach((p) => x.lineTo(p.x, p.y));
  x.lineTo(pontos[pontos.length - 1].x, o.base + 6);
  x.closePath();
  x.fill();

  // Facetas: encosta voltada ao sol clareia, a oposta escurece
  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i];
    const b = pontos[i + 1];
    const inclinacao = (b.y - a.y) / passo;

    const luz = inclinacao > 0;
    const forca = Math.min(1, Math.abs(inclinacao) * 0.9);

    const fy = (a.y + b.y) / 2;
    const f = x.createLinearGradient(0, fy, 0, o.base);
    const cor = luz ? "255,244,214" : "20,30,60";
    const alfa = (luz ? o.brilho : 0.22) * forca;

    f.addColorStop(0, `rgba(${cor},${alfa})`);
    f.addColorStop(1, `rgba(${cor},0)`);
    x.fillStyle = f;

    x.beginPath();
    x.moveTo(a.x, a.y);
    x.lineTo(b.x, b.y);
    x.lineTo(b.x, o.base);
    x.lineTo(a.x, o.base);
    x.closePath();
    x.fill();
  }

  // Neve nos picos mais altos
  if (o.neve) {
    x.fillStyle = "rgba(250,252,255,0.92)";

    for (let i = 1; i < pontos.length - 1; i++) {
      const p = pontos[i];
      const alto = p.y < topo + o.altura * 0.28;
      const pico = p.y <= pontos[i - 1].y && p.y <= pontos[i + 1].y;

      if (alto && pico) {
        const d = 8 + (topo + o.altura * 0.28 - p.y) * 0.5;

        x.beginPath();
        x.moveTo(p.x, p.y);
        x.lineTo(p.x + d * 0.8, p.y + d * 0.9);
        x.lineTo(p.x + d * 0.35, p.y + d * 0.6);
        x.lineTo(p.x, p.y + d * 1.1);
        x.lineTo(p.x - d * 0.4, p.y + d * 0.65);
        x.lineTo(p.x - d * 0.85, p.y + d * 0.9);
        x.closePath();
        x.fill();
      }
    }
  }

  return c;
}

// Linha de árvores no horizonte
function construirMataDistante() {
  const { canvas: c, ctx: x } = criarCamada(CEU_LARGURA, CEU_ALTURA);

  for (let camada = 0; camada < 2; camada++) {
    const base = ROAD_HORIZON + 1 + camada * 2;
    const cor = camada === 0 ? "#3f6a48" : "#2f5a3b";
    const luz = camada === 0 ? "#5d8d58" : "#4a7a4b";

    for (let px = -8; px < CEU_LARGURA + 8; px += 5 + camada) {
      const h = 6 + hash01(px * 0.31 + camada * 7) * 9;
      const r = 3.2 + hash01(px * 0.77 + camada) * 3;

      x.fillStyle = cor;
      x.beginPath();
      x.ellipse(px, base - h * 0.5, r, h * 0.6, 0, 0, Math.PI * 2);
      x.fill();

      x.fillStyle = luz;
      x.beginPath();
      x.ellipse(px + r * 0.35, base - h * 0.62, r * 0.45, h * 0.3, 0, 0, Math.PI * 2);
      x.fill();
    }
  }

  return c;
}

function construirNuvens() {
  const larguraTotal = CEU_LARGURA + 260;
  const { canvas: c, ctx: x } = criarCamada(larguraTotal, 110);

  const definicoes = [
    [70, 38, 1.0], [250, 20, 0.75], [420, 58, 0.9],
    [610, 26, 1.1], [790, 52, 0.7], [980, 30, 0.95],
  ];

  definicoes.forEach(([cx, cy, esc]) => {
    x.save();
    x.translate(cx, cy);
    x.scale(esc, esc);

    // base sombreada (azulada)
    x.fillStyle = "rgba(120,150,190,0.30)";
    x.beginPath();
    x.ellipse(0, 12, 40, 8, 0, 0, Math.PI * 2);
    x.fill();

    // corpo
    const blobs = [[-26, 4, 15], [-8, -6, 19], [14, -2, 17], [30, 6, 13], [2, 6, 18]];

    x.fillStyle = "rgba(255,255,255,0.93)";
    blobs.forEach(([bx, by, br]) => {
      x.beginPath();
      x.arc(bx, by, br, 0, Math.PI * 2);
      x.fill();
    });

    // realce quente do lado do sol
    x.fillStyle = "rgba(255,238,200,0.55)";
    blobs.forEach(([bx, by, br]) => {
      x.beginPath();
      x.arc(bx + br * 0.28, by - br * 0.3, br * 0.62, 0, Math.PI * 2);
      x.fill();
    });

    x.restore();
  });

  return c;
}

// =====================================================
// DESENHO
// =====================================================

// alturaExtra estica a camada para baixo (usado pelo gradiente do céu)
function drawLayer(img, deslocamento, alturaExtra = 0) {
  ctx.drawImage(
    img,
    0, 0, img.width, img.height,
    -(CEU_LARGURA - GAME_WIDTH) / 2 - deslocamento, 0,
    img.width / RENDER_SCALE, img.height / RENDER_SCALE + alturaExtra
  );
}

function drawSky() {
  if (!camadasCeu) construirCamadasCeu();

  // Morros: o céu desce/sobe junto com o horizonte. O gradiente do céu é
  // esticado para cobrir o topo que a descida expõe; o resto só se desloca.
  // cam:  a câmera lateral gera paralaxe (longe desloca menos)
  // giro: quando a pista curva, o horizonte desliza para o lado oposto
  const arfagem = perfil.arfagem;
  const cam = camera.x * CAMERA_SCALE;
  const giro = camera.giro;

  drawLayer(camadasCeu.fundo, cam * 0.01 + giro * 0.15, Math.max(0, arfagem));

  ctx.save();
  ctx.translate(0, arfagem);

  // Nuvens derivam lentamente com a distância percorrida
  const deriva = (gameState.worldDistance * 0.9) % (CEU_LARGURA + 260);
  const nuvens = camadasCeu.nuvens;
  const largNuvens = nuvens.width / RENDER_SCALE;
  const desloc = deriva + cam * 0.03 + giro * 0.25;

  ctx.drawImage(nuvens, -desloc, 0, largNuvens, nuvens.height / RENDER_SCALE);
  ctx.drawImage(nuvens, largNuvens - desloc, 0, largNuvens, nuvens.height / RENDER_SCALE);

  drawLayer(camadasCeu.montanhasLonge, cam * 0.04 + giro * 0.45);
  drawLayer(camadasCeu.montanhasPerto, cam * 0.09 + giro * 0.7);
  drawLayer(camadasCeu.mata, cam * 0.16 + giro);

  ctx.restore();
}
