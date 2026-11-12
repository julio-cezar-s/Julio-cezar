/* =====================================================
   RETRO TURBO RACER — HODÔMETRO
   Calcula a distância percorrida em quilômetros.
===================================================== */

let distanciaPercorridaKm = 0;
let odometroUltimoTimestamp = null;

// Reinicia a distância no início de uma corrida.
function resetarOdometro() {
  distanciaPercorridaKm = 0;
  odometroUltimoTimestamp = null;

  atualizarExibicaoOdometro();
}

// Atualiza a distância usando a velocidade em km/h.
function atualizarOdometro(timestamp, velocidadeKmh) {
  if (!Number.isFinite(timestamp)) return;

  if (odometroUltimoTimestamp === null) {
    odometroUltimoTimestamp = timestamp;
    atualizarExibicaoOdometro();
    return;
  }

  let deltaSegundos = (timestamp - odometroUltimoTimestamp) / 1000;

  odometroUltimoTimestamp = timestamp;

  // Evita saltos grandes quando a aba fica inativa.
  deltaSegundos = Math.max(0, Math.min(deltaSegundos, 0.25));

  const velocidade = Math.max(0, velocidadeKmh);

  distanciaPercorridaKm += (velocidade * deltaSegundos) / 3600;

  atualizarExibicaoOdometro();
}

// Atualiza o valor mostrado no HUD.
function atualizarExibicaoOdometro() {
  const elemento = document.getElementById("distanceometer");

  if (!elemento) return;

  // A distância é guardada em km; a unidade e o separador decimal seguem o idioma
  elemento.textContent = formatarDistancia(distanciaPercorridaKm);
}

// Retorna a distância atual.
function obterDistanciaPercorrida() {
  return distanciaPercorridaKm;
}
