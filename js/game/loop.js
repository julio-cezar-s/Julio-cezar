// =====================================================
// RETRO TURBO RACER — LOOP PRINCIPAL
// Simulação em passo normalizado (dt = 1 equivale a 60 quadros/s) e
// renderização por profundidade com perspectiva compartilhada.
// =====================================================

// Quadros da animação de batida antes de exibir o Game Over
const QUADROS_DE_BATIDA = 55;

// =====================================================
// QUADRO
// =====================================================

// Ponto de entrada de cada quadro. Qualquer erro vira um aviso na tela e o
// jogo volta ao menu, em vez de ficar travado com a tela vazia.
function update(timestamp) {
  animationFrameId = requestAnimationFrame(update);

  try {
    executarQuadro(timestamp);
  } catch (erro) {
    tratarFalhaNoLoop(erro);
  }
}

function tratarFalhaNoLoop(erro) {
  pararLoop();

  gameState.isGameOver = true;
  gameState.isPaused = false;
  gameState.crashFrames = 0;

  if (typeof gerenciadorAudio !== "undefined") gerenciadorAudio.pararTudo();

  pauseScreen?.classList.add("hidden");
  gameOverScreen?.classList.add("hidden");
  document.getElementById("startScreen")?.classList.remove("hidden");

  mostrarErroNaTela("O jogo parou por causa de um erro", erro);
}

function executarQuadro(timestamp) {
  // Passo de tempo normalizado: o jogo roda igual em 60, 120 ou 144 Hz
  let dt = ultimoTimestamp ? (timestamp - ultimoTimestamp) / (1000 / 60) : 1;
  ultimoTimestamp = timestamp;
  dt = Math.max(0, Math.min(dt, 2.5));

  // ---------------------------------------------------
  // BATIDA / GAME OVER
  // ---------------------------------------------------
  if (gameState.isGameOver) {
    if (gameState.crashFrames > 0) {
      atualizarBatida(dt);
      renderizar();

      gameState.crashFrames -= dt;

      if (gameState.crashFrames <= 0) {
        mostrarGameOver();
        pararLoop();
      }
    } else {
      pararLoop();
    }

    return;
  }

  // ---------------------------------------------------
  // PAUSA: desenha o quadro uma vez e congela
  // ---------------------------------------------------
  if (gameState.isPaused) {
    if (!gameState.pausaDesenhada) {
      renderizar();
      gameState.pausaDesenhada = true;
    }

    return;
  }

  simular(dt, timestamp);

  // Mede a fluidez para baixar a resolução do canvas em aparelhos lentos
  if (typeof observarDesempenhoDoQuadro === "function") {
    observarDesempenhoDoQuadro(dt * (1000 / 60));
  }

  if (!gameState.isGameOver) {
    atualizarInterface();
  }

  renderizar();
}

// =====================================================
// SIMULAÇÃO
// =====================================================

function simular(dt, timestamp) {
  // ----- Turbo -----
  if (gameState.isTurboActive && gameState.turboEnergy > 0) {
    gameState.gameSpeed = gameState.baseSpeed * 1.8;
    gameState.turboEnergy -= 0.45 * dt;

    obterEscapesDoJogador().forEach((escape) => {
      emitirChamaTurbo(escape.x, escape.y, Math.random() < 0.5 ? "#00e5ff" : "#4aa8ff");
    });

    if (gameState.turboEnergy <= 0) {
      gameState.turboEnergy = 0;
      gameState.isTurboActive = false;
    }
  } else {
    gameState.isTurboActive = false;
    gameState.gameSpeed = gameState.baseSpeed;

    gameState.turboEnergy += 0.18 * dt;
  }

  gameState.turboEnergy = Math.max(0, Math.min(100, gameState.turboEnergy));

  // Câmera lenta (powerups/): o mundo inteiro desacelera
  gameState.gameSpeed *= fatorDeVelocidadeDosPowerUps();

  // Intensidade visual da velocidade (suavizada)
  const alvoVelocidade = Math.max(0, Math.min(1, (gameState.gameSpeed - 5) / 14));
  gameState.speedEffect += (alvoVelocidade - gameState.speedEffect) * 0.07 * dt;

  // ----- Hodômetro -----
  if (typeof atualizarOdometro === "function") {
    atualizarOdometro(timestamp, Math.floor(gameState.gameSpeed * KMH_PER_SPEED));
  }

  // ----- Mundo rola em direção à câmera -----
  const avanco = gameState.gameSpeed * WORLD_SPEED_FACTOR * dt;
  gameState.worldDistance += avanco;

  // ----- Estrada: o horizonte acompanha as curvas -----
  atualizarGiroDoHorizonte(dt);

  // ----- Jogador: movimento lateral no mundo -----
  moverJogador(dt);

  // ----- Pontuação e velocidade progressiva -----
  // A pontuação que corre com o tempo é multiplicada pelo combo (combo/)
  adicionarPontos(0.5 * dt * multiplicadorDeCombo());
  gameState.baseSpeed = Math.min(gameState.baseSpeed + 0.001 * dt, 12);

  // ----- Dificuldade: o diretor decide o que surge na pista -----
  // (na câmera lenta o tempo do diretor também desacelera, mantendo o espaçamento)
  atualizarDiretor(dt * fatorDeVelocidadeDosPowerUps());

  // ----- Obstáculos: aproximação, comportamento e colisão -----
  atualizarObstaculos(dt, avanco);

  // ----- Power-ups: itens na pista, coleta e efeitos ativos -----
  atualizarGeracaoDePowerUps(dt);
  atualizarItensDePowerUp(dt, avanco);
  atualizarPowerUps(dt);
  atualizarFeedbackDePowerUps(dt);

  // ----- Quase-colisões: sequência e feedback na tela -----
  atualizarSequencia(dt);
  atualizarCombo(dt);
  atualizarFeedbackDeQuaseColisao(dt);

  // ----- Partículas e sirene -----
  atualizarParticulas(dt);
  atualizarSirene();
}

function moverJogador(dt) {
  const s = projScale(PLAYER_Z);
  const pixelsPorUnidade = projLen(1, s);

  // player.speedX é em pixels por quadro na profundidade do jogador
  // Na derrapagem o controle cai (sistemas/derrapagem.js)
  const controle = atualizarDerrapagem(dt);
  const passo = (player.speedX / pixelsPorUnidade) * dt * controle;

  if (input.left) player.worldX -= passo;
  if (input.right) player.worldX += passo;

  // Curvas empurram o carro para fora (força centrífuga)
  aplicarForcaLateral(dt);

  // Mantém o desenho inteiro dentro da pista
  const margem = 8 / pixelsPorUnidade;
  const limite = ROAD_HALF_WIDTH - PLAYER_WORLD_WIDTH / 2 - margem;

  player.worldX = Math.max(-limite, Math.min(limite, player.worldX));

  // Inclinação visual suavizada (durante a derrapagem ela é controlada por lá)
  if (player.derrapagem <= 0) {
    const alvo = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    player.steer += (alvo - player.steer) * 0.2 * dt;
  }

  atualizarCameraPeloJogador();
  atualizarPosicaoDoJogador();
}

// =====================================================
// BATIDA E GAME OVER
// =====================================================

function iniciarBatida(obstacle) {
  gameState.isGameOver = true;
  gameState.isTurboActive = false;
  gameState.crashFrames = QUADROS_DE_BATIDA;
  gameState.flash = 1;
  gameState.tremor = 7;

  const caixa = obterCaixaDoJogador();
  emitirExplosao(caixa.cx, caixa.y + caixa.h * 0.25);

  if (typeof stopPoliceSiren === "function") stopPoliceSiren();

  if (typeof gerenciadorAudio !== "undefined") {
    gerenciadorAudio.tocar("freada");
    gerenciadorAudio.tocar("batida");
  }

  if (typeof checkAndSaveRecord === "function") {
    checkAndSaveRecord(gameState.score);
  }

  // Remove o carro atingido da vista para não atravessar o jogador
  const indice = obstacles.indexOf(obstacle);
  if (indice >= 0) obstacles.splice(indice, 1);
}

function atualizarBatida(dt) {
  // Desacelera até parar e deixa efeitos terminarem
  gameState.gameSpeed *= Math.pow(0.94, dt);
  gameState.worldDistance += gameState.gameSpeed * WORLD_SPEED_FACTOR * dt;
  gameState.speedEffect *= Math.pow(0.9, dt);
  gameState.flash = Math.max(0, gameState.flash - 0.06 * dt);
  gameState.tremor = Math.max(0, gameState.tremor - 0.18 * dt);

  atualizarParticulas(dt);
  atualizarFeedbackDeQuaseColisao(dt);
  atualizarFeedbackDePowerUps(dt);
  atualizarCombo(dt);
}

function mostrarGameOver() {
  if (finalScoreElement) {
    finalScoreElement.textContent = Math.floor(gameState.score)
      .toString()
      .padStart(5, "0");
  }

  if (finalExtrasElement) finalExtrasElement.textContent = resumoDaPartida();

  if (gameOverScreen) gameOverScreen.classList.remove("hidden");
}

// =====================================================
// SIRENE DA VIATURA
// =====================================================

function atualizarSirene() {
  const haViatura = obstacles.some((o) => o.type === "police" && o.z > PLAYER_Z);

  if (haViatura) {
    if (typeof playPoliceSiren === "function") playPoliceSiren();
  } else if (typeof stopPoliceSiren === "function") {
    stopPoliceSiren();
  }
}

// =====================================================
// INTERFACE (HTML)
// =====================================================

const ultimoHud = { score: "", speed: "", turbo: -1 };

function atualizarInterface() {
  const pontos = Math.floor(gameState.score).toString().padStart(5, "0");

  if (scoreElement && ultimoHud.score !== pontos) {
    scoreElement.textContent = pontos;
    ultimoHud.score = pontos;
  }

  const velocidade = Math.floor(gameState.gameSpeed * KMH_PER_SPEED);

  // O número mostrado já está na unidade do idioma (km/h ou mph)
  const velocidadeMostrada = converterVelocidade(velocidade);

  if (speedometerElement && ultimoHud.speed !== velocidadeMostrada) {
    speedometerElement.innerHTML = htmlDaVelocidade(velocidade);
    ultimoHud.speed = velocidadeMostrada;
  }

  const energiaTurbo = Math.round(gameState.turboEnergy);

  if (ultimoHud.turbo !== energiaTurbo) {
    if (turboBar) turboBar.style.width = `${energiaTurbo}%`;
    if (turboPercentage) turboPercentage.textContent = `${energiaTurbo}%`;
    ultimoHud.turbo = energiaTurbo;
  }

  if (typeof turboBtn !== "undefined" && turboBtn) {
    turboBtn.disabled = gameState.turboEnergy <= 0;
    turboBtn.classList.toggle("turbo-empty", gameState.turboEnergy <= 0);
  }
}

// Velocidade e distância do HUD em HTML, na unidade do idioma atual
function atualizarUnidadesNoHud() {
  ultimoHud.speed = "";
  atualizarInterface();

  if (typeof atualizarExibicaoOdometro === "function") atualizarExibicaoOdometro();
}

// Trocar o idioma no meio da partida (pelo menu de pausa): refaz os textos que o
// JavaScript escreve e redesenha o canvas, sem reiniciar nada
aoMudarIdioma(() => {
  atualizarUnidadesNoHud();

  if (finalExtrasElement && gameOverScreen && !gameOverScreen.classList.contains("hidden")) {
    finalExtrasElement.textContent = resumoDaPartida();
  }

  if (typeof redesenharSeParado === "function") redesenharSeParado();
});

// =====================================================
// RENDERIZAÇÃO
// =====================================================

function renderizar() {
  // Tremor de câmera (batida): medido para a resolução original de 1,5, então
  // acompanha a resolução atual do canvas e o balanço visual não muda
  const fatorDeTremor = RENDER_SCALE / 1.5;
  const tx = gameState.tremor ? (Math.random() - 0.5) * gameState.tremor * fatorDeTremor : 0;
  const ty = gameState.tremor ? (Math.random() - 0.5) * gameState.tremor * fatorDeTremor : 0;

  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, tx, ty);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  atualizarCameraPeloJogador();

  // Curvas e morros visíveis neste quadro
  atualizarPerfil();

  // Cenário base (céu, terreno, acostamento, asfalto)
  drawTrack();

  // Objetos 3D ordenados por profundidade: o jogador entra no meio da lista
  const cena = coletarObjetosDaCena(obstacles);

  desenharObjetos(cena, "tras");
  drawPlayer();
  desenharAuraDoJogador();
  desenharObjetos(cena, "frente");

  desenharParticulas();

  // Atmosfera e HUD por cima de tudo
  drawHorizonAtmosphere();
  drawSunBloom();
  drawSpeedLines();
  drawVignette();
  desenharEfeitoDeTelaDePowerUps();

  desenharHudNoCanvas();
  desenharHudDePowerUps();
  desenharPainelDeCombo();
  desenharMedidorDeSequencia();
  desenharFeedbackDeQuaseColisao();
  desenharFeedbackDePowerUps();

  if (gameState.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${gameState.flash * 0.7})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Primeiro quadro estático (cena visível atrás do menu inicial).
// Chamado por inicio/pronto.js quando todos os scripts já carregaram.
function iniciarCena() {
  reiniciarTracado();
  atualizarCameraPeloJogador();
  atualizarPosicaoDoJogador();
  renderizar();
}
