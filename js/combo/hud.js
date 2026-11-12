/* js/combo/hud.js
   Painel do COMBO no canto superior esquerdo do canvas:
   multiplicador atual, barra de progresso até o próximo degrau e avisos
   ao subir ou perder. Pulsa ao subir e treme em vermelho ao perder.
*/

// Cor de cada multiplicador (x1 ... x8): do frio ao quente
const CORES_DO_COMBO = [
  "#9fefff", "#37f2ff", "#7dffb0", "#ffd23f", "#ff8a2a", "#ff5a4a", "#ff2e63", "#d36bff",
];

function desenharPainelDeCombo() {
  const x = 8;
  const y = 8;
  const largura = 104;
  const altura = 38;

  const cor = CORES_DO_COMBO[Math.min(combo.degrau, CORES_DO_COMBO.length - 1)];
  const noMaximo = combo.degrau >= COMBO.degraus.length - 1;

  // Progresso até o próximo degrau
  const minimo = COMBO.degraus[combo.degrau];
  const proximo = noMaximo ? minimo : COMBO.degraus[combo.degrau + 1];
  const progresso = noMaximo ? 1 : (combo.sequencia - minimo) / (proximo - minimo);

  const escala = 1 + 0.3 * (combo.pulso / COMBO_ANIMACAO.pulso);
  const tremor = combo.perda > 0
    ? Math.sin(combo.perda * 1.7) * 2.2 * (combo.perda / COMBO_ANIMACAO.perda)
    : 0;

  ctx.save();

  // Fica discreto enquanto não há sequência
  ctx.globalAlpha = combo.sequencia > 0 ? 1 : 0.6;

  ctx.translate(x + largura / 2 + tremor, y + altura / 2);
  ctx.scale(escala, escala);
  ctx.translate(-largura / 2, -altura / 2);

  // Painel
  ctx.fillStyle = "rgba(6,12,24,0.72)";
  ctx.fillRect(0, 0, largura, altura);

  ctx.fillStyle = combo.perda > 0 ? "#ff4a5e" : cor;
  ctx.fillRect(0, 0, 3, altura);

  // Rótulo e multiplicador
  ctx.textBaseline = "middle";

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(160,225,245,0.9)";
  ctx.font = `700 8px ${HUD_FONTE}`;
  ctx.fillText(traduzir("hud.combo"), 10, 9);

  ctx.fillStyle = "rgba(160,225,245,0.65)";
  ctx.font = `700 7px ${HUD_FONTE}`;
  ctx.fillText(
    noMaximo ? traduzir("hud.comboMaximo") : `${Math.floor(combo.sequencia)}/${proximo}`,
    10, 20
  );

  ctx.textAlign = "right";
  ctx.shadowColor = cor;
  ctx.shadowBlur = noMaximo ? 10 : 5;
  ctx.fillStyle = cor;
  ctx.font = `900 22px ${HUD_FONTE}`;
  ctx.fillText(`x${multiplicadorDeCombo()}`, largura - 8, 15);
  ctx.shadowBlur = 0;

  // Barra de progresso
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(8, altura - 9, largura - 16, 4);
  ctx.fillStyle = cor;
  ctx.fillRect(8, altura - 9, (largura - 16) * Math.max(0, Math.min(1, progresso)), 4);

  ctx.restore();

  desenharAvisoDeCombo(x + largura / 2, y + altura + 12, cor);
}

// "COMBO x4!" ao subir; "COMBO PERDIDO" ao cair
function desenharAvisoDeCombo(cx, cy, cor) {
  if (combo.aviso <= 0) return;

  const t = combo.aviso / COMBO_ANIMACAO.aviso;

  ctx.save();
  ctx.globalAlpha = Math.min(1, t * 3);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 13px ${HUD_FONTE}`;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(8,12,24,0.9)";

  const texto = traduzir(combo.avisoChave, { n: combo.avisoMultiplicador });
  const sobe = (1 - t) * -6;

  ctx.strokeText(texto, cx, cy + sobe);
  ctx.fillStyle = combo.avisoPerda ? "#ff4a5e" : cor;
  ctx.fillText(texto, cx, cy + sobe);

  ctx.restore();
}
