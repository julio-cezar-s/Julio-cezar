// js/ecras/ui.js
// Controle visual dos ecrãs e pausa do jogo.
// O estado de pausa vive somente em gameState.isPaused.

function pausarJogo() {
  if (!partidaAtiva() || gameState.isPaused) return;

  gameState.isPaused = true;
  gameState.pausaDesenhada = false;

  // Evita manter o turbo ativo durante a pausa
  gameState.isTurboActive = false;
  input.left = false;
  input.right = false;

  pauseScreen?.classList.remove("hidden");

  if (typeof gerenciadorAudio !== "undefined") {
    gerenciadorAudio.pausarTudo();
  }
}

function continuarJogo() {
  if (!gameState.isPaused) return;

  gameState.isPaused = false;
  gameState.isTurboActive = false;

  pauseScreen?.classList.add("hidden");

  if (typeof gerenciadorAudio !== "undefined") {
    gerenciadorAudio.retomarTudo();
  }

  // Zera os relógios para não haver salto de tempo após a pausa
  ultimoTimestamp = 0;

  if (typeof odometroUltimoTimestamp !== "undefined") {
    odometroUltimoTimestamp = null;
  }
}

function alternarPausa() {
  if (gameState.isPaused) continuarJogo();
  else pausarJogo();
}

// Volta ao menu principal encerrando a partida atual
function sairParaMenu() {
  gameState.isPaused = false;
  gameState.isGameOver = true;
  gameState.crashFrames = 0;
  gameState.isTurboActive = false;

  pararLoop();

  if (typeof gerenciadorAudio !== "undefined") {
    gerenciadorAudio.pararTudo();
  }

  pauseScreen?.classList.add("hidden");
  gameOverScreen?.classList.add("hidden");
  document.getElementById("startScreen")?.classList.remove("hidden");
}

// Pausa automática ao esconder a aba
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pausarJogo();
});
