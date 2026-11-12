// =====================================================
// RETRO TURBO RACER
// Detalhes, rodas e acabamentos do jogador
// =====================================================

function drawPlayerBase(x, y, w, h) {

  // -----------------------------------------------------
  // SOMBRA
  // -----------------------------------------------------

  const shadow = ctx.createRadialGradient(
    x + w * 0.5, y + h * 0.88, 2,
    x + w * 0.5, y + h * 0.88, w * 0.58
  );

  shadow.addColorStop(0, "rgba(0,0,0,0.65)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = shadow;

  ctx.beginPath();
  ctx.ellipse(
    x + w * 0.5,
    y + h * 0.88,
    w * 0.58,
    h * 0.11,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // -----------------------------------------------------
  // RODAS TRASEIRAS
  // -----------------------------------------------------

  function drawWheel(wx) {
    const wheelGradient = ctx.createLinearGradient(
      wx, y + h * 0.48,
      wx + w * 0.16, y + h * 0.48
    );

    wheelGradient.addColorStop(0, "#030407");
    wheelGradient.addColorStop(0.45, "#252a32");
    wheelGradient.addColorStop(0.75, "#090b10");
    wheelGradient.addColorStop(1, "#020305");

    ctx.fillStyle = wheelGradient;

    ctx.beginPath();
    ctx.roundRect(
      wx, y + h * 0.47,
      w * 0.17, h * 0.40,
      w * 0.035
    );
    ctx.fill();

    ctx.strokeStyle = "#414751";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sulcos externos
    ctx.strokeStyle = "#080a0e";
    ctx.beginPath();

    ctx.moveTo(
      wx + w * 0.035,
      y + h * 0.52
    );

    ctx.lineTo(
      wx + w * 0.035,
      y + h * 0.82
    );

    ctx.moveTo(
      wx + w * 0.135,
      y + h * 0.52
    );

    ctx.lineTo(
      wx + w * 0.135,
      y + h * 0.82
    );

    ctx.stroke();
  }

  drawWheel(x + w * 0.015);
  drawWheel(x + w * 0.815);

  // -----------------------------------------------------
  // DIFUSOR E FUNDO DA CARROCERIA
  // -----------------------------------------------------

  const lowerGradient = ctx.createLinearGradient(
    x, y + h * 0.65,
    x, y + h
  );

  lowerGradient.addColorStop(0, "#4c0012");
  lowerGradient.addColorStop(0.5, "#181a22");
  lowerGradient.addColorStop(1, "#050609");

  ctx.fillStyle = lowerGradient;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.43);
  ctx.lineTo(x + w * 0.88, y + h * 0.43);
  ctx.lineTo(x + w * 0.99, y + h * 0.82);
  ctx.lineTo(x + w * 0.89, y + h * 0.97);
  ctx.lineTo(x + w * 0.11, y + h * 0.97);
  ctx.lineTo(x + w * 0.01, y + h * 0.82);
  ctx.closePath();
  ctx.fill();
}


// =====================================================
// DETALHES TRASEIROS
// =====================================================

function drawPlayerRearDetails(x, y, w, h) {

  // -----------------------------------------------------
  // PARA-CHOQUE ESPORTIVO
  // -----------------------------------------------------

  const bumperGradient = ctx.createLinearGradient(
    x, y + h * 0.74,
    x, y + h * 0.91
  );

  bumperGradient.addColorStop(0, "#5b0018");
  bumperGradient.addColorStop(0.35, "#252832");
  bumperGradient.addColorStop(0.7, "#11141c");
  bumperGradient.addColorStop(1, "#050609");

  ctx.fillStyle = bumperGradient;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.055, y + h * 0.745);
  ctx.quadraticCurveTo(
    x + w * 0.5, y + h * 0.79,
    x + w * 0.945, y + h * 0.745
  );
  ctx.lineTo(x + w * 0.97, y + h * 0.87);
  ctx.lineTo(x + w * 0.86, y + h * 0.94);
  ctx.lineTo(x + w * 0.14, y + h * 0.94);
  ctx.lineTo(x + w * 0.03, y + h * 0.87);
  ctx.closePath();
  ctx.fill();

  // Filete metálico
  ctx.strokeStyle = "#717987";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.10, y + h * 0.79);
  ctx.quadraticCurveTo(
    x + w * 0.5, y + h * 0.82,
    x + w * 0.90, y + h * 0.79
  );
  ctx.stroke();

  // -----------------------------------------------------
  // DIFUSOR TRASEIRO
  // -----------------------------------------------------

  ctx.fillStyle = "#030509";

  ctx.beginPath();
  ctx.moveTo(x + w * 0.27, y + h * 0.86);
  ctx.lineTo(x + w * 0.73, y + h * 0.86);
  ctx.lineTo(x + w * 0.66, y + h * 0.98);
  ctx.lineTo(x + w * 0.34, y + h * 0.98);
  ctx.closePath();
  ctx.fill();

  // Aletas
  ctx.fillStyle = "#555e6c";

  ctx.beginPath();
  ctx.moveTo(x + w * 0.37, y + h * 0.88);
  ctx.lineTo(x + w * 0.40, y + h * 0.88);
  ctx.lineTo(x + w * 0.39, y + h * 0.96);
  ctx.lineTo(x + w * 0.36, y + h * 0.96);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.485, y + h * 0.88);
  ctx.lineTo(x + w * 0.515, y + h * 0.88);
  ctx.lineTo(x + w * 0.515, y + h * 0.96);
  ctx.lineTo(x + w * 0.485, y + h * 0.96);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.60, y + h * 0.88);
  ctx.lineTo(x + w * 0.63, y + h * 0.88);
  ctx.lineTo(x + w * 0.64, y + h * 0.96);
  ctx.lineTo(x + w * 0.61, y + h * 0.96);
  ctx.closePath();
  ctx.fill();

  // -----------------------------------------------------
  // ESCAPAMENTOS METÁLICOS
  // -----------------------------------------------------

  function drawExhaust(ex) {
    const exhaustGradient = ctx.createLinearGradient(
      ex, y + h * 0.88,
      ex, y + h * 0.95
    );

    exhaustGradient.addColorStop(0, "#c4ccd5");
    exhaustGradient.addColorStop(0.4, "#424b58");
    exhaustGradient.addColorStop(1, "#090c12");

    ctx.fillStyle = exhaustGradient;

    ctx.beginPath();
    ctx.roundRect(
      ex,
      y + h * 0.885,
      w * 0.12,
      h * 0.065,
      2
    );
    ctx.fill();

    ctx.fillStyle = "#05070b";
    ctx.fillRect(
      ex + w * 0.018,
      y + h * 0.90,
      w * 0.084,
      h * 0.035
    );

    ctx.strokeStyle = "#d3dae2";
    ctx.lineWidth = 0.8;

    ctx.strokeRect(
      ex,
      y + h * 0.885,
      w * 0.12,
      h * 0.065
    );
  }

  drawExhaust(x + w * 0.13);
  drawExhaust(x + w * 0.75);

  // -----------------------------------------------------
  // REFLEXOS FINAIS DA CARROCERIA
  // -----------------------------------------------------

  ctx.strokeStyle = "rgba(255, 180, 195, 0.48)";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.30);
  ctx.quadraticCurveTo(
    x + w * 0.15, y + h * 0.22,
    x + w * 0.27, y + h * 0.16
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.88, y + h * 0.30);
  ctx.quadraticCurveTo(
    x + w * 0.85, y + h * 0.22,
    x + w * 0.73, y + h * 0.16
  );
  ctx.stroke();
}