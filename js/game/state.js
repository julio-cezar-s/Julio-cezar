// js/game/state.js
// O estado global (gameState) é definido em config.js.
// Este arquivo controla o ciclo de vida do loop de animação: existe no
// máximo UM requestAnimationFrame ativo, mesmo após vários reinícios.

let animationFrameId = null;
let ultimoTimestamp = 0;

function iniciarLoop() {
  pararLoop();

  ultimoTimestamp = 0;
  animationFrameId = requestAnimationFrame(update);
}

function pararLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// Há uma partida em andamento (mesmo pausada)?
function partidaAtiva() {
  return animationFrameId !== null && !gameState.isGameOver;
}
