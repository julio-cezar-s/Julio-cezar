/* js/quase-colisao/hud-sequencia.js
   Medidor da SEQUÊNCIA de quase-colisões no topo da tela (abaixo da etiqueta
   de nível): mostra o multiplicador e uma barra que esvazia até acabar.
*/

const CORES_DA_SEQUENCIA = ["#37f2ff", "#37f2ff", "#7dffb0", "#ffd23f", "#ff8a2a", "#ff2e63"];

function desenharMedidorDeSequencia() {
  if (quase.sequencia < 1 || quase.temporizador <= 0) return;

  const multiplicador = multiplicadorDaSequencia();
  const cor = CORES_DA_SEQUENCIA[multiplicador];
  const restante = quase.temporizador / QUASE_COLISAO.janelaDaSequencia;

  const cx = GAME_WIDTH / 2;
  const topo = 26;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Painel
  ctx.fillStyle = "rgba(6,12,24,0.7)";
  ctx.fillRect(cx - 62, topo, 124, 26);

  // Barra de tempo restante
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(cx - 58, topo + 20, 116, 3);
  ctx.fillStyle = cor;
  ctx.fillRect(cx - 58, topo + 20, 116 * restante, 3);

  // Texto
  ctx.shadowColor = cor;
  ctx.shadowBlur = multiplicador >= QUASE_COLISAO.multiplicadorMax ? 12 : 6;
  ctx.fillStyle = cor;
  ctx.font = `900 13px ${HUD_FONTE}`;
  ctx.fillText(traduzir("hud.sequencia", { n: multiplicador }), cx, topo + 10);

  ctx.restore();
}
