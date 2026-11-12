// js/powerups/desenho/escudo.js
// Efeitos dos power-ups ATIVOS sobre o jogador e a tela:
//   - bolha do escudo em volta do carro (pisca quando vai acabar)
//   - câmera lenta: bordas da tela ganham um tom roxo

// Desenhada logo depois do carro do jogador
function desenharAuraDoJogador() {
  const emInvulnerabilidade = powerUps.invulneravel > 0;

  if (!escudoAtivo() && !emInvulnerabilidade) return;

  const { cx, y, w, h } = obterCaixaDoJogador();
  const cor = TIPOS_DE_POWERUP.escudo.cor;

  // Acaba em menos de 2 s? Pisca. Já quebrado? Pisca rápido.
  const acabando = escudoAtivo() && powerUps.escudo < 120;
  const pisca = emInvulnerabilidade
    ? Math.floor(performance.now() / 70) % 2 === 0
    : acabando ? Math.floor(performance.now() / 150) % 2 === 0 : true;

  if (!pisca) return;

  const pulso = 1 + Math.sin(performance.now() / 180) * 0.03;
  const centroY = y + h * 0.5;
  const rx = w * 0.78 * pulso;
  const ry = h * 0.66 * pulso;

  ctx.save();
  ctx.globalAlpha = emInvulnerabilidade && !escudoAtivo() ? 0.45 : 1;
  ctx.globalCompositeOperation = "lighter";

  // Esfera: transparente no centro, brilhante na borda
  const bolha = ctx.createRadialGradient(cx, centroY, Math.min(rx, ry) * 0.45, cx, centroY, Math.max(rx, ry));
  bolha.addColorStop(0, hexParaRgba(cor, 0));
  bolha.addColorStop(0.75, hexParaRgba(cor, 0.16));
  bolha.addColorStop(1, hexParaRgba(cor, 0.55));

  ctx.fillStyle = bolha;
  ctx.beginPath();
  ctx.ellipse(cx, centroY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Contorno e reflexo do sol (canto superior direito)
  ctx.strokeStyle = hexParaRgba(cor, 0.85);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, centroY, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(cx, centroY, rx * 0.82, ry * 0.82, 0, -Math.PI * 0.42, -Math.PI * 0.18);
  ctx.stroke();

  ctx.restore();
}

// Depois da vinheta: tons que indicam efeitos de tela cheia
function desenharEfeitoDeTelaDePowerUps() {
  const intensidade = (1 - powerUps.fatorDeTempo) / (1 - TIPOS_DE_POWERUP.lentidao.fator);

  if (intensidade > 0.02) {
    const cor = TIPOS_DE_POWERUP.lentidao.cor;
    const g = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT * 0.55, GAME_HEIGHT * 0.3,
      GAME_WIDTH / 2, GAME_HEIGHT * 0.55, GAME_WIDTH * 0.62
    );

    g.addColorStop(0, hexParaRgba(cor, 0));
    g.addColorStop(1, hexParaRgba(cor, 0.34 * Math.min(1, intensidade)));

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
