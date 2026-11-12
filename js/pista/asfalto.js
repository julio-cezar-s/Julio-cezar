// js/pista/asfalto.js
// Asfalto, textura, marcas de pneu, faixas e linhas de borda.

const ASFALTO_BANDA = 2.4;
const PERIODO_TRACEJADO = 3.2;
const COMPRIMENTO_TRACO = 1.4;

function drawRoad() {
  ctx.save();

  desenharBaseAsfalto();
  desenharMarcasDePneu();
  desenharRemendos();
  desenharRuidoAsfalto();
  desenharLinhasDeBorda();
  desenharFaixas();

  if (typeof drawRoadMarkers === "function") {
    drawRoadMarkers();
  }

  ctx.restore();
}

// Asfalto com bandas alternadas e brilho central
function desenharBaseAsfalto() {
  ctx.fillStyle = "#343a42";
  preencherFaixa(-ROAD.half, ROAD.half, Z_MIN_DRAW, Z_FAR);

  percorrerFaixas(ASFALTO_BANDA, (k, zA, zB) => {
    if (k % 2 === 0) return;

    ctx.globalAlpha = 1 - fogAmount(zA, 8) * 0.85;
    ctx.fillStyle = "#3c424b";
    preencherFaixa(-ROAD.half, ROAD.half, zA, zB);
  });

  ctx.globalAlpha = 1;

  // Reflexo suave do sol no centro da pista
  ctx.fillStyle = "rgba(255,244,214,0.045)";
  preencherFaixa(-0.8, 0.8, Z_MIN_DRAW, Z_FAR);
}

// Faixas escuras de borracha onde as rodas passam em cada faixa
function desenharMarcasDePneu() {
  ctx.fillStyle = "rgba(10,12,16,0.16)";

  for (let faixa = -1; faixa <= 1; faixa++) {
    [-0.24, 0.24].forEach((deslocamento) => {
      const x = faixa + deslocamento;
      preencherFaixa(x - 0.07, x + 0.07, Z_MIN_DRAW, Z_FAR);
    });
  }
}

// Remendos e manchas no asfalto
function desenharRemendos() {
  percorrerFaixas(7, (k, zA, zB) => {
    if (zA > 22) return;

    const sem = k * 4.37;
    if (hash01(sem) < 0.45) return;

    const x = (hash01(sem + 1) - 0.5) * 2.4;
    const largura = 0.35 + hash01(sem + 2) * 0.5;
    const z0 = zA + hash01(sem + 3) * (zB - zA) * 0.6;

    ctx.fillStyle = hash01(sem + 4) > 0.5
      ? "rgba(10,12,16,0.28)" : "rgba(80,86,95,0.30)";

    preencherFaixa(x - largura / 2, x + largura / 2, z0, z0 + 0.5 + hash01(sem + 5));
  });
}

// Grãos do asfalto
function desenharRuidoAsfalto() {
  percorrerFaixas(ASFALTO_BANDA, (k, zA, zB) => {
    if (zA > 16) return;

    for (let i = 0; i < 9; i++) {
      const sem = k * 7.9 + i * 1.7;
      const x = (hash01(sem) - 0.5) * 2.8;
      const z = zA + hash01(sem + 1) * (zB - zA);
      const s = projScale(z);
      const tam = Math.max(0.7, projLen(0.025, s));

      ctx.fillStyle = i % 2 === 0
        ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.14)";
      ctx.fillRect(projX(x, s), projY(s), tam * 1.6, tam);
    }
  });
}

// Linhas contínuas brancas junto às bordas
function desenharLinhasDeBorda() {
  ctx.fillStyle = "#f1f1e6";

  for (let lado = -1; lado <= 1; lado += 2) {
    preencherFaixa(
      lado * ROAD.edgeLineInner, lado * ROAD.edgeLineOuter, Z_MIN_DRAW, Z_FAR
    );
  }
}

// Divisões das três faixas (tracejado em perspectiva)
function desenharFaixas() {
  ctx.fillStyle = "rgba(255,255,255,0.94)";

  percorrerFaixas(PERIODO_TRACEJADO, (k) => {
    const z0 = k * PERIODO_TRACEJADO - gameState.worldDistance;
    const z1 = z0 + COMPRIMENTO_TRACO;

    if (z1 <= Z_MIN_DRAW) return;

    const zA = Math.max(z0, Z_MIN_DRAW);
    const zB = Math.min(z1, Z_FAR);

    [-ROAD.laneLine, ROAD.laneLine].forEach((x) => {
      preencherFaixa(x - 0.028, x + 0.028, zA, zB);
    });
  });
}
