/* =====================================================
   RETRO TURBO RACER
   Reinicialização da partida
===================================================== */

function resetGame() {
  // Garante um único loop e silencia sons da partida anterior
  pararLoop();

  if (typeof gerenciadorAudio !== "undefined") {
    gerenciadorAudio.pararTudo();
  }

  // Estado da partida
  gameState.score = 0;
  gameState.baseSpeed = 5;
  gameState.gameSpeed = 5;

  gameState.isTurboActive = false;
  gameState.turboEnergy = 100;

  gameState.isGameOver = false;
  gameState.isPaused = false;
  gameState.pausaDesenhada = false;

  gameState.worldDistance = 0;
  gameState.speedEffect = 0;
  gameState.crashFrames = 0;
  gameState.flash = 0;
  gameState.tremor = 0;

  // Diretor de dificuldade volta ao nível 1
  reiniciarDiretor();

  // Power-ups: efeitos, itens na pista e contadores zerados
  reiniciarPowerUps();

  // Combo de pontuação volta a x1
  reiniciarCombo();

  // Sequência e contadores de quase-colisão zerados
  reiniciarQuaseColisoes();

  // Reinicia o hodômetro
  if (typeof resetarOdometro === "function") {
    resetarOdometro();
  }

  // Limpa veículos e partículas
  obstacles.length = 0;
  particles.length = 0;

  // Jogador no centro da pista
  player.width = 70;
  player.height = 95;
  player.worldX = 0;
  player.steer = 0;
  player.derrapagem = 0;

  // Nova estrada sorteada para esta partida
  reiniciarTracado();
  camera.giro = 0;
  atualizarPerfil();

  atualizarCameraPeloJogador();
  atualizarPosicaoDoJogador();

  // Libera controles
  input.left = false;
  input.right = false;

  // Atualiza interface
  if (scoreElement) scoreElement.textContent = "00000";

  if (speedometerElement) {
    speedometerElement.innerHTML = htmlDaVelocidade(gameState.gameSpeed * KMH_PER_SPEED);
  }

  if (turboBar) turboBar.style.width = "100%";
  if (turboPercentage) turboPercentage.textContent = "100%";

  if (gameOverScreen) gameOverScreen.classList.add("hidden");
  if (pauseScreen) pauseScreen.classList.add("hidden");

  // Inicia a partida
  iniciarLoop();
}
