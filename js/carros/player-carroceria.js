// =====================================================
// RETRO TURBO RACER
// Carroceria do jogador
// =====================================================

function drawPlayerBody(x, y, w, h) {

  // -----------------------------------------------------
  // CARROCERIA PRINCIPAL — SILHUETA LARGA
  // -----------------------------------------------------

  const bodyGradient = ctx.createLinearGradient(
    x, y, x + w, y
  );

  bodyGradient.addColorStop(0, "#650015");
  bodyGradient.addColorStop(0.10, "#a60027");
  bodyGradient.addColorStop(0.24, "#ed123e");
  bodyGradient.addColorStop(0.42, "#ff526b");
  bodyGradient.addColorStop(0.50, "#ff7182");
  bodyGradient.addColorStop(0.58, "#ff526b");
  bodyGradient.addColorStop(0.76, "#ed123e");
  bodyGradient.addColorStop(0.90, "#a60027");
  bodyGradient.addColorStop(1, "#650015");

  ctx.fillStyle = bodyGradient;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.27, y + h * 0.035);
  ctx.lineTo(x + w * 0.73, y + h * 0.035);
  ctx.lineTo(x + w * 0.84, y + h * 0.12);
  ctx.lineTo(x + w * 0.94, y + h * 0.27);
  ctx.lineTo(x + w * 0.985, y + h * 0.62);
  ctx.lineTo(x + w * 0.97, y + h * 0.83);
  ctx.lineTo(x + w * 0.87, y + h * 0.96);
  ctx.lineTo(x + w * 0.13, y + h * 0.96);
  ctx.lineTo(x + w * 0.03, y + h * 0.83);
  ctx.lineTo(x + w * 0.015, y + h * 0.62);
  ctx.lineTo(x + w * 0.06, y + h * 0.27);
  ctx.lineTo(x + w * 0.16, y + h * 0.12);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#500013";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // -----------------------------------------------------
  // VOLUME DAS LATERAIS
  // -----------------------------------------------------

  const sideGradient = ctx.createLinearGradient(
    x, y, x + w * 0.23, y
  );

  sideGradient.addColorStop(0, "#4c0011");
  sideGradient.addColorStop(0.5, "#a60028");
  sideGradient.addColorStop(1, "#ef1745");

  ctx.fillStyle = sideGradient;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y + h * 0.15);
  ctx.lineTo(x + w * 0.27, y + h * 0.10);
  ctx.lineTo(x + w * 0.22, y + h * 0.48);
  ctx.lineTo(x + w * 0.13, y + h * 0.83);
  ctx.lineTo(x + w * 0.045, y + h * 0.80);
  ctx.lineTo(x + w * 0.07, y + h * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(x + w, 0);
  ctx.scale(-1, 1);

  ctx.fillStyle = sideGradient;

  ctx.beginPath();
  ctx.moveTo(w * 0.16, y + h * 0.15);
  ctx.lineTo(w * 0.27, y + h * 0.10);
  ctx.lineTo(w * 0.22, y + h * 0.48);
  ctx.lineTo(w * 0.13, y + h * 0.83);
  ctx.lineTo(w * 0.045, y + h * 0.80);
  ctx.lineTo(w * 0.07, y + h * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // -----------------------------------------------------
  // CABINE E VIDRO TRASEIRO
  // -----------------------------------------------------

  const glassGradient = ctx.createLinearGradient(
    x, y + h * 0.13,
    x, y + h * 0.43
  );

  glassGradient.addColorStop(0, "#263f55");
  glassGradient.addColorStop(0.25, "#0d2639");
  glassGradient.addColorStop(0.7, "#06131f");
  glassGradient.addColorStop(1, "#02080f");

  ctx.fillStyle = glassGradient;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.285, y + h * 0.12);
  ctx.quadraticCurveTo(
    x + w * 0.5, y + h * 0.055,
    x + w * 0.715, y + h * 0.12
  );
  ctx.lineTo(x + w * 0.83, y + h * 0.39);
  ctx.quadraticCurveTo(
    x + w * 0.5, y + h * 0.45,
    x + w * 0.17, y + h * 0.39
  );
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#430e21";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Reflexos do vidro
  ctx.fillStyle = "rgba(105, 178, 218, 0.35)";

  ctx.beginPath();
  ctx.moveTo(x + w * 0.32, y + h * 0.16);
  ctx.lineTo(x + w * 0.46, y + h * 0.13);
  ctx.lineTo(x + w * 0.39, y + h * 0.33);
  ctx.lineTo(x + w * 0.25, y + h * 0.34);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(
    x + w * 0.56,
    y + h * 0.17,
    w * 0.17,
    h * 0.018
  );

  // Coluna central
  ctx.fillStyle = "#07111c";
  ctx.fillRect(
    x + w * 0.492,
    y + h * 0.13,
    w * 0.016,
    h * 0.27
  );

  // -----------------------------------------------------
  // AEROFÓLIO ESPORTIVO
  // -----------------------------------------------------

  ctx.fillStyle = "#171a22";

  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.105);
  ctx.lineTo(x + w * 0.92, y + h * 0.105);
  ctx.lineTo(x + w * 0.96, y + h * 0.15);
  ctx.lineTo(x + w * 0.04, y + h * 0.15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#737b88";
  ctx.fillRect(
    x + w * 0.12,
    y + h * 0.108,
    w * 0.76,
    h * 0.012
  );

  // Suportes
  ctx.fillStyle = "#242832";
  ctx.fillRect(
    x + w * 0.20,
    y + h * 0.14,
    w * 0.035,
    h * 0.075
  );

  ctx.fillRect(
    x + w * 0.765,
    y + h * 0.14,
    w * 0.035,
    h * 0.075
  );

  // -----------------------------------------------------
  // TAMPA TRASEIRA E REFLEXOS
  // -----------------------------------------------------

  const trunkGradient = ctx.createLinearGradient(
    x, y + h * 0.40,
    x, y + h * 0.61
  );

  trunkGradient.addColorStop(0, "#ff526d");
  trunkGradient.addColorStop(0.45, "#d90836");
  trunkGradient.addColorStop(1, "#8d0023");

  ctx.fillStyle = trunkGradient;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.13, y + h * 0.42);
  ctx.quadraticCurveTo(
    x + w * 0.5, y + h * 0.47,
    x + w * 0.87, y + h * 0.42
  );
  ctx.lineTo(x + w * 0.94, y + h * 0.62);
  ctx.lineTo(x + w * 0.06, y + h * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 180, 190, 0.38)";
  ctx.fillRect(
    x + w * 0.18,
    y + h * 0.46,
    w * 0.64,
    h * 0.018
  );

  // -----------------------------------------------------
  // LANTERNAS MODERNAS
  // -----------------------------------------------------

  ctx.fillStyle = "#37000e";
  ctx.fillRect(
    x + w * 0.055,
    y + h * 0.625,
    w * 0.37,
    h * 0.105
  );

  ctx.fillRect(
    x + w * 0.575,
    y + h * 0.625,
    w * 0.37,
    h * 0.105
  );

  const lightGradient = ctx.createLinearGradient(
    x, y + h * 0.63,
    x, y + h * 0.72
  );

  lightGradient.addColorStop(0, "#ffb0bd");
  lightGradient.addColorStop(0.25, "#ff244b");
  lightGradient.addColorStop(1, "#a90029");

  ctx.fillStyle = lightGradient;

  ctx.beginPath();
  ctx.roundRect(
    x + w * 0.075,
    y + h * 0.635,
    w * 0.33,
    h * 0.075,
    h * 0.025
  );
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(
    x + w * 0.595,
    y + h * 0.635,
    w * 0.33,
    h * 0.075,
    h * 0.025
  );
  ctx.fill();

  // Faixa de LED
  ctx.fillStyle = "#fff0f2";

  ctx.fillRect(
    x + w * 0.105,
    y + h * 0.65,
    w * 0.27,
    h * 0.012
  );

  ctx.fillRect(
    x + w * 0.625,
    y + h * 0.65,
    w * 0.27,
    h * 0.012
  );

  // -----------------------------------------------------
  // PLACA TRASEIRA
  // -----------------------------------------------------

  ctx.fillStyle = "#11151d";

  ctx.beginPath();
  ctx.roundRect(
    x + w * 0.405,
    y + h * 0.635,
    w * 0.19,
    h * 0.09,
    2
  );
  ctx.fill();

  ctx.fillStyle = "#aeb8c5";
  ctx.fillRect(
    x + w * 0.445,
    y + h * 0.67,
    w * 0.11,
    h * 0.012
  );
}