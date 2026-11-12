/* js/cenarios/sinalizacao.js
   Sinalização que depende do traçado da estrada: placas chevron (setas
   amarelas) no lado de fora das curvas mais fechadas. Avisam o jogador
   para qual lado a pista vai e servem de referência visual da curva.
*/

const CHEVRON_ESPACO = 3;            // distância entre placas
const CHEVRON_CURVATURA_MIN = 0.016; // só curvas mais fechadas ganham placa
const CHEVRON_LADO_X = 2.75;         // afastamento do centro da pista

// =====================================================
// COLETA
// =====================================================

function coletarSinalizacaoDeCurva(lista) {
  percorrerPosicoes(CHEVRON_ESPACO, (k, z) => {
    // Posição absoluta na estrada = k * espaçamento
    const curvatura = curvaturaEm(k * CHEVRON_ESPACO);

    if (Math.abs(curvatura) < CHEVRON_CURVATURA_MIN) return;

    const direcao = Math.sign(curvatura);   // +1 curva à direita

    lista.push({
      tipo: "chevron",
      z,
      x: -direcao * CHEVRON_LADO_X,         // lado de fora da curva
      direcao,
    });
  }, 30);
}

// =====================================================
// DESENHO
// =====================================================

function desenharChevron(o, s) {
  const u = projLen(1, s);
  if (u < 4) return;

  // Poste
  retanguloNaFace(o.x - 0.04, o.x + 0.04, 0, 0.62, o.z, "#59616d");

  // Painel: borda preta, fundo amarelo
  retanguloNaFace(o.x - 0.5, o.x + 0.5, 0.52, 1.34, o.z, "#14161c");
  retanguloNaFace(o.x - 0.46, o.x + 0.46, 0.56, 1.3, o.z, "#f7c61a");

  // Setas apontando para onde a curva vai
  const cx = projX(o.x, s);
  const cy = projY(s, 0.93);
  const d = o.direcao;

  ctx.strokeStyle = "#14161c";
  ctx.lineWidth = Math.max(1, u * 0.1);
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";

  [-0.16, 0.12].forEach((deslocamento) => {
    const x = cx + d * deslocamento * u;

    ctx.beginPath();
    ctx.moveTo(x - d * 0.17 * u, cy - 0.27 * u);
    ctx.lineTo(x + d * 0.14 * u, cy);
    ctx.lineTo(x - d * 0.17 * u, cy + 0.27 * u);
    ctx.stroke();
  });
}
