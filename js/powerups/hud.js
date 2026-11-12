/* js/powerups/hud.js
   Medidores dos power-ups ativos no canto superior direito do canvas:
   um círculo por efeito, com o ícone e um arco que esvazia com o tempo.
   O nitro é instantâneo e não aparece aqui (ele enche a barra de turbo).
*/

const EFEITOS_NO_HUD = ["escudo", "lentidao", "dobro"];

// O canvas é 640x360 lógicos, mas em celular na vertical ele aparece com ~55%
// do tamanho. Para o ícone continuar legível, o medidor cresce quando a tela é
// pequena: raio de pelo menos RAIO_MINIMO_NA_TELA pixels reais (até o limite).
const MEDIDOR_DE_POWERUP = {
  raioNormal: 14,           // em unidades lógicas (telas grandes)
  raioMaximo: 24,
  raioMinimoNaTela: 11,     // em pixels reais da tela
  margem: 8,
  espaco: 6,
};

// Quantos pixels reais da tela cabem em 1 unidade lógica do canvas
function escalaDeExibicaoDoCanvas() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  if (!w || !h) return 1;

  return Math.min(w / GAME_WIDTH, h / GAME_HEIGHT);
}

function raioDoMedidorDePowerUp() {
  const M = MEDIDOR_DE_POWERUP;
  const desejado = M.raioMinimoNaTela / escalaDeExibicaoDoCanvas();

  return Math.min(M.raioMaximo, Math.max(M.raioNormal, desejado));
}

// Centro do n-ésimo medidor (0 = o mais à direita, no canto superior)
function posicaoDoMedidorDePowerUp(indice, raio) {
  const M = MEDIDOR_DE_POWERUP;

  return {
    cx: GAME_WIDTH - M.margem - raio - indice * (2 * raio + M.espaco),
    cy: M.margem + 2 + raio,
  };
}

function desenharHudDePowerUps() {
  let posicao = 0;
  const raio = raioDoMedidorDePowerUp();

  EFEITOS_NO_HUD.forEach((tipo) => {
    const restante = powerUps[tipo];
    if (restante <= 0) return;

    const def = TIPOS_DE_POWERUP[tipo];
    const fracao = restante / def.duracao;

    // Vai acabar? pisca
    if (restante < 120 && Math.floor(performance.now() / 160) % 2 === 0) {
      posicao++;
      return;
    }

    const { cx, cy } = posicaoDoMedidorDePowerUp(posicao, raio);
    desenharMedidorDePowerUp(cx, cy, raio, def, fracao);
    posicao++;
  });
}

function desenharMedidorDePowerUp(cx, cy, r, def, fracao) {
  ctx.save();

  ctx.fillStyle = "rgba(6,12,24,0.78)";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();

  // Trilho e arco de tempo restante (começa no topo)
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowColor = def.cor;
  ctx.shadowBlur = 5;
  ctx.strokeStyle = def.cor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fracao);
  ctx.stroke();
  ctx.shadowBlur = 0;

  desenharIconeDePowerUp(def.icone, cx, cy, r * 0.55, def.cor);

  ctx.restore();
}
