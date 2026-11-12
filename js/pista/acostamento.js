// js/pista/acostamento.js
// Zebrado (rumble strips), acostamento de cascalho e borda do gramado.

const ACOSTAMENTO_BANDA = 2.4;
const ZEBRADO_BANDA = 0.9;

function drawShoulders() {
  ctx.save();

  for (let lado = -1; lado <= 1; lado += 2) {
    desenharAcostamento(lado);
    desenharZebrado(lado);
    desenharBordaGrama(lado);
  }

  ctx.restore();
}

function desenharAcostamento(lado) {
  // Cascalho / terra batida
  ctx.fillStyle = "#b09a74";
  preencherFaixa(
    lado * ROAD.kerbOuter, lado * ROAD.shoulderOuter, Z_MIN_DRAW, Z_FAR
  );

  percorrerFaixas(ACOSTAMENTO_BANDA, (k, zA, zB) => {
    ctx.globalAlpha = 1 - fogAmount(zA, 8) * 0.8;

    // faixas alternadas ligeiramente mais escuras
    if (k % 2 === 0) {
      ctx.fillStyle = "rgba(90,70,40,0.14)";
      preencherFaixa(lado * ROAD.kerbOuter, lado * ROAD.shoulderOuter, zA, zB);
    }

    // pedrinhas
    if (zA < 14) {
      for (let i = 0; i < 5; i++) {
        const sem = k * 5.3 + i * 2.9 + lado * 40;
        const x = lado * (ROAD.kerbOuter + 0.06 + hash01(sem) * 0.5);
        const z = zA + hash01(sem + 1) * (zB - zA);
        const s = projScale(z);
        const tam = Math.max(0.6, projLen(0.03 + hash01(sem + 2) * 0.03, s));

        ctx.fillStyle = hash01(sem + 3) > 0.5
          ? "rgba(255,248,225,0.5)" : "rgba(60,45,25,0.45)";
        ctx.fillRect(projX(x, s), projY(s), tam * 1.4, tam);
      }
    }
  });

  ctx.globalAlpha = 1;
}

// Zebrado vermelho e branco colado à pista
function desenharZebrado(lado) {
  percorrerFaixas(ZEBRADO_BANDA, (k, zA, zB) => {
    ctx.globalAlpha = 1 - fogAmount(zA, 9) * 0.75;
    ctx.fillStyle = k % 2 === 0 ? "#d62840" : "#f3efe4";
    preencherFaixa(lado * ROAD.half, lado * ROAD.kerbOuter, zA, zB);
  });

  ctx.globalAlpha = 1;

  // Sombra fina do meio-fio, dá relevo à borda
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  preencherFaixa(
    lado * (ROAD.kerbOuter - 0.025), lado * (ROAD.kerbOuter + 0.03),
    Z_MIN_DRAW, Z_FAR
  );
}

function desenharBordaGrama(lado) {
  ctx.fillStyle = "rgba(40,85,35,0.65)";
  preencherFaixa(
    lado * ROAD.shoulderOuter, lado * (ROAD.shoulderOuter + 0.22),
    Z_MIN_DRAW, Z_FAR
  );
}
