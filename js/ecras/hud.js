// js/ecras/hud.js
// HUD desenhado no canvas: velocímetro analógico e indicador de turbo.
// Pontuação, distância e barra de turbo continuam no HTML (acessíveis).

const HUD_FONTE = '"Bahnschrift", "Arial Narrow", "Segoe UI", system-ui, sans-serif';
const ARCO_INICIO = Math.PI * 0.75;
const ARCO_FIM = Math.PI * 2.25;

function desenharHudNoCanvas() {
  desenharVelocimetro(60, GAME_HEIGHT - 56, 46);
  desenharIndicadorTurbo(GAME_WIDTH - 52, GAME_HEIGHT - 52, 33);
  desenharIndicadorDeNivel();
}

// Nível atual no canto e aviso grande quando ele sobe
function desenharIndicadorDeNivel() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Etiqueta fixa, discreta
  ctx.fillStyle = "rgba(6,12,24,0.55)";
  ctx.fillRect(GAME_WIDTH / 2 - 34, 6, 68, 16);
  ctx.fillStyle = "rgba(160,225,245,0.95)";
  ctx.font = `700 9px ${HUD_FONTE}`;
  ctx.fillText(traduzir("hud.nivel", { n: gameState.nivel }), GAME_WIDTH / 2, 14.5);

  // Aviso ao subir de nível (surge, fica e some)
  if (gameState.nivelAviso > 0 && gameState.nivel > 1) {
    const t = gameState.nivelAviso / AVISO_DE_NIVEL;
    const alfa = Math.min(1, t * 4, (1 - t) * 6);
    const desliz = (1 - Math.min(1, (1 - t) * 6)) * -10;

    ctx.globalAlpha = Math.max(0, alfa);
    ctx.font = `900 26px ${HUD_FONTE}`;
    ctx.shadowColor = "rgba(0,229,255,0.9)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(traduzir("hud.nivel", { n: gameState.nivel }), GAME_WIDTH / 2, 70 + desliz);
  }

  ctx.restore();
}

function corDoMedidor(t) {
  // ciano → amarelo → magenta
  if (t < 0.55) return misturarCor("#00e5ff", "#ffd23f", t / 0.55);
  return misturarCor("#ffd23f", "#ff2e63", (t - 0.55) / 0.45);
}

function discoDoMedidor(cx, cy, r) {
  const g = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r * 1.1);
  g.addColorStop(0, "rgba(22,36,58,0.82)");
  g.addColorStop(1, "rgba(4,8,18,0.88)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(120,200,235,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.stroke();
}

// =====================================================
// VELOCÍMETRO
// =====================================================

function desenharVelocimetro(cx, cy, r) {
  // O mostrador segue a unidade do idioma (km/h ou mph), mas a velocidade real não muda
  const escala = mostradorDeVelocidade();
  const fator = unidadesDoIdioma().velocidade.fator;
  const velocidade = gameState.gameSpeed * KMH_PER_SPEED * fator;
  const t = Math.max(0, Math.min(1, velocidade / escala.maximo));
  const varredura = ARCO_FIM - ARCO_INICIO;

  ctx.save();

  discoDoMedidor(cx, cy, r);

  // Trilho
  ctx.lineCap = "butt";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, ARCO_INICIO, ARCO_FIM);
  ctx.stroke();

  // Preenchimento em segmentos coloridos
  const segmentos = 28;
  const cheios = Math.round(t * segmentos);

  for (let i = 0; i < cheios; i++) {
    const a0 = ARCO_INICIO + (i / segmentos) * varredura;
    const a1 = ARCO_INICIO + ((i + 0.82) / segmentos) * varredura;

    ctx.strokeStyle = corDoMedidor(i / segmentos);
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, a0, a1);
    ctx.stroke();
  }

  // Marcas e números
  ctx.fillStyle = "rgba(220,240,255,0.85)";
  ctx.strokeStyle = "rgba(220,240,255,0.55)";
  ctx.font = `700 7px ${HUD_FONTE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let v = 0; v <= escala.maximo; v += escala.passoMenor) {
    const ang = ARCO_INICIO + (v / escala.maximo) * varredura;
    const maior = v % escala.passoMaior === 0;
    const r0 = r - (maior ? 15 : 12);
    const r1 = r - 10;

    ctx.lineWidth = maior ? 1.2 : 0.7;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
    ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    ctx.stroke();

    if (maior) {
      ctx.fillText(String(v), cx + Math.cos(ang) * (r - 24), cy + Math.sin(ang) * (r - 24));
    }
  }

  // Ponteiro
  const ang = ARCO_INICIO + t * varredura;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);

  ctx.shadowColor = "rgba(255,46,99,0.9)";
  ctx.shadowBlur = 5;
  ctx.fillStyle = "#ff2e63";
  ctx.beginPath();
  ctx.moveTo(-6, -1.6);
  ctx.lineTo(r - 14, -0.6);
  ctx.lineTo(r - 14, 0.6);
  ctx.lineTo(-6, 1.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Cubo central
  ctx.fillStyle = "#10182a";
  ctx.strokeStyle = "#7fdcff";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Unidade
  ctx.fillStyle = "rgba(150,215,240,0.9)";
  ctx.font = `700 6.5px ${HUD_FONTE}`;
  ctx.fillText(rotuloDaVelocidade(), cx, cy + r * 0.52);

  ctx.restore();
}

// =====================================================
// INDICADOR DE TURBO
// =====================================================

function desenharIndicadorTurbo(cx, cy, r) {
  const energia = gameState.turboEnergy / 100;
  const ativo = gameState.isTurboActive;
  const vazio = gameState.turboEnergy <= 1;
  const pulso = 0.5 + 0.5 * Math.sin(performance.now() / 140);

  ctx.save();

  discoDoMedidor(cx, cy, r);

  const varredura = ARCO_FIM - ARCO_INICIO;

  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, ARCO_INICIO, ARCO_FIM);
  ctx.stroke();

  if (energia > 0.005) {
    const cor = ativo ? "#ffb347" : energia < 0.25 ? "#ff4a5e" : "#00e5ff";

    ctx.shadowColor = cor;
    ctx.shadowBlur = ativo ? 10 : 4;
    ctx.strokeStyle = cor;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, ARCO_INICIO, ARCO_INICIO + energia * varredura);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Chama
  const cor = vazio
    ? `rgba(255,74,94,${0.4 + pulso * 0.6})`
    : ativo ? "#ffd27a" : "#9fefff";

  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 15);
  ctx.bezierCurveTo(cx + 10, cy - 5, cx + 11, cy + 6, cx + 5, cy + 11);
  ctx.bezierCurveTo(cx + 3, cy + 7, cx + 1, cy + 6, cx, cy + 2);
  ctx.bezierCurveTo(cx - 1, cy + 6, cx - 3, cy + 7, cx - 5, cy + 11);
  ctx.bezierCurveTo(cx - 11, cy + 6, cx - 10, cy - 5, cx, cy - 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = ativo ? "#fff7da" : "rgba(12,20,36,0.85)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rótulo
  ctx.fillStyle = "rgba(160,225,245,0.9)";
  ctx.font = `700 6.5px ${HUD_FONTE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(traduzir(vazio ? "termos.turboVazio" : "termos.turbo"), cx, cy + r * 0.62);

  ctx.restore();
}
