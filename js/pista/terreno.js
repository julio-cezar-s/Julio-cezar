// js/pista/terreno.js
// Terreno lateral: campos em perspectiva (manta de retalhos), cercas vivas
// e tufos de grama. Tudo projetado pela perspectiva central.

const TERRENO_BANDA = 3;                 // comprimento das faixas do gramado
const TERRENO_CELULAS = [2.25, 5, 9, 15, 24, 40, 90]; // limites laterais dos campos

const CORES_CAMPO = [
  "#4f9040", "#478636", "#5a9a43", "#3f7c34",
  "#62994a", "#7a9b45", "#8fa24a", "#a89a48", "#5d6f3a",
];

function drawTerrain() {
  ctx.save();

  const horizonte = horizonteAtual();
  const altura = GAME_HEIGHT - horizonte;

  // Base: do verde enevoado do horizonte ao verde profundo perto da câmera
  const solo = ctx.createLinearGradient(0, horizonte, 0, GAME_HEIGHT);
  solo.addColorStop(0, "#8cac62");
  solo.addColorStop(0.3, "#58903f");
  solo.addColorStop(1, "#356b2e");
  ctx.fillStyle = solo;
  ctx.fillRect(0, horizonte, GAME_WIDTH, altura);

  desenharCamposEmPerspectiva();
  desenharCercasVivas();
  desenharTufosDeGrama();

  ctx.restore();
}

// =====================================================
// CAMPOS (retalhos de cultivo que rolam com a pista)
// =====================================================

function desenharCamposEmPerspectiva() {
  percorrerFaixas(TERRENO_BANDA, (k, zA, zB) => {
    const neblina = fogAmount(zA, 8);
    ctx.globalAlpha = 1 - neblina * 0.55;

    for (let lado = -1; lado <= 1; lado += 2) {
      for (let c = 0; c < TERRENO_CELULAS.length - 1; c++) {
        const semente = (k * 0.37 + 1) + c * 5.13 + lado * 17.7;
        const base = CORES_CAMPO[Math.floor(hash01(semente) * CORES_CAMPO.length)];

        // Faixas alternadas escurecem ligeiramente — sensação de aragem/arado
        ctx.fillStyle = k % 2 === 0 ? base : escurecerCor(base, 0.07);

        preencherFaixa(
          lado * TERRENO_CELULAS[c], lado * TERRENO_CELULAS[c + 1], zA, zB
        );
      }
    }
  });

  ctx.globalAlpha = 1;
}

// Cercas vivas escuras que separam os campos e fogem para o horizonte
function desenharCercasVivas() {
  for (let lado = -1; lado <= 1; lado += 2) {
    for (let c = 1; c < TERRENO_CELULAS.length - 1; c++) {
      const x = TERRENO_CELULAS[c];

      ctx.fillStyle = "rgba(22,58,28,0.55)";
      preencherFaixa(lado * (x - 0.09), lado * (x + 0.09), Z_MIN_DRAW, Z_FAR);
    }
  }
}

// =====================================================
// TUFOS DE GRAMA (textura de alta frequência)
// =====================================================

function desenharTufosDeGrama() {
  ctx.lineCap = "round";

  const escuros = [];
  const claros = [];

  percorrerFaixas(TERRENO_BANDA, (k, zA, zB) => {
    if (zA > 15) return;

    for (let i = 0; i < 9; i++) {
      const sem = k * 9.7 + i * 3.1;
      const lado = hash01(sem) > 0.5 ? 1 : -1;
      const x = lado * (2.6 + hash01(sem + 1) * 7);
      const z = zA + hash01(sem + 2) * (zB - zA);
      const s = projScale(z);

      const px = projX(x, s);
      const py = projY(s);

      if (px < -10 || px > GAME_WIDTH + 10) continue;

      const comp = projLen(0.2 + hash01(sem + 3) * 0.16, s);

      (i % 3 === 0 ? claros : escuros).push(px, py, comp);
    }
  });

  [[escuros, "rgba(20,60,28,0.5)"], [claros, "rgba(190,215,110,0.45)"]]
    .forEach(([lista, cor]) => {
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();

      for (let i = 0; i < lista.length; i += 3) {
        const [x, y, h] = [lista[i], lista[i + 1], lista[i + 2]];
        ctx.moveTo(x, y);
        ctx.lineTo(x - h * 0.25, y - h);
        ctx.moveTo(x + h * 0.15, y);
        ctx.lineTo(x + h * 0.35, y - h * 0.8);
      }

      ctx.stroke();
    });
}
