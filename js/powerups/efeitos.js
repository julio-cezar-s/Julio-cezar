/* js/powerups/efeitos.js
   O que cada power-up FAZ quando é coletado e como o escudo reage a uma
   batida. A duração e os valores ficam em powerups/tipos.js.
*/

function aplicarPowerUp(tipo) {
  const def = TIPOS_DE_POWERUP[tipo];

  powerUps.coletados++;

  if (tipo === "nitro") {
    gameState.turboEnergy = Math.min(100, gameState.turboEnergy + def.energia);
    gameState.speedEffect = Math.min(1, gameState.speedEffect + 0.25);
  } else {
    // Coletar de novo apenas renova o tempo (efeitos não se acumulam)
    powerUps[tipo] = def.duracao;
  }

  emitirFeedbackDeColeta(def);

  if (typeof tocarSomDePowerUp === "function") tocarSomDePowerUp(tipo);
}

// Chamado pela colisão antes de uma batida. Devolve true se algo a absorveu
// (o obstáculo então é removido e a partida continua).
function tentarAbsorverBatida(obstaculo) {
  // Logo após o escudo quebrar, a batida seguinte também é ignorada
  if (powerUps.invulneravel > 0) {
    emitirImpactoSemDano();
    return true;
  }

  if (!escudoAtivo()) return false;

  powerUps.escudo = 0;
  powerUps.invulneravel = POWERUPS.invulnerabilidade;
  powerUps.escudosUsados++;

  gameState.tremor = Math.max(gameState.tremor, 4);
  gameState.flash = Math.max(gameState.flash, 0.35);

  emitirQuebraDeEscudo();

  if (typeof tocarSomDeEscudoQuebrando === "function") tocarSomDeEscudoQuebrando();

  return true;
}
