/* =====================================================
   RETRO TURBO RACER — CONTROLES
   Teclado, mouse e tela sensível ao toque.
===================================================== */

const input = {
  left: false,
  right: false,
};

// Referências dos botões
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const turboBtn = document.getElementById("turboBtn");

// =====================================================
// CONTROLE DO TURBO
// =====================================================

function ativarTurbo() {
  if (typeof gameState === "undefined") return;

  if (gameState.turboEnergy > 0) {
    gameState.isTurboActive = true;
  }
}

function desativarTurbo() {
  if (typeof gameState !== "undefined") {
    gameState.isTurboActive = false;
  }
}

// =====================================================
// TECLADO
// =====================================================

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (["arrowleft", "arrowright", " ", "arrowup", "arrowdown"].includes(key)) {
    e.preventDefault();
  }

  if (key === "arrowleft" || key === "a") {
    input.left = true;
  }

  if (key === "arrowright" || key === "d") {
    input.right = true;
  }

  if (e.code === "Space" && !e.repeat) {
    ativarTurbo();
  }

  // Pausa: P ou Esc (somente com partida em andamento)
  if ((key === "p" || key === "escape") && !e.repeat) {
    if (typeof partidaAtiva === "function" && partidaAtiva()) {
      alternarPausa();
    }
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();

  // Sem isto, no Firefox o Espaço soltava e "clicava" no último botão com foco
  if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
    e.preventDefault();
  }

  if (key === "arrowleft" || key === "a") {
    input.left = false;
  }

  if (key === "arrowright" || key === "d") {
    input.right = false;
  }

  if (e.code === "Space") {
    desativarTurbo();
  }
});

// =====================================================
// PERDA DE FOCO DA JANELA
// =====================================================

window.addEventListener("blur", () => {
  input.left = false;
  input.right = false;
  desativarTurbo();
});

// =====================================================
// BOTÕES DE MOVIMENTO
// =====================================================

function configurarBotaoMovimento(botao, direcao) {
  if (!botao) return;

  botao.style.touchAction = "none";

  botao.addEventListener("pointerdown", (e) => {
    e.preventDefault();

    if (e.button !== undefined && e.button !== 0) return;

    direcao(true);

    if (botao.setPointerCapture) {
      botao.setPointerCapture(e.pointerId);
    }
  });

  const soltar = (e) => {
    e.preventDefault();
    direcao(false);
  };

  botao.addEventListener("pointerup", soltar);
  botao.addEventListener("pointercancel", soltar);

  botao.addEventListener("lostpointercapture", () => {
    direcao(false);
  });
}

configurarBotaoMovimento(leftBtn, (pressionado) => {
  input.left = pressionado;
});

configurarBotaoMovimento(rightBtn, (pressionado) => {
  input.right = pressionado;
});

// =====================================================
// BOTÃO DE TURBO
// =====================================================

if (turboBtn) {
  turboBtn.style.touchAction = "none";

  turboBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();

    if (e.button !== undefined && e.button !== 0) return;

    ativarTurbo();

    if (turboBtn.setPointerCapture) {
      turboBtn.setPointerCapture(e.pointerId);
    }
  });

  const soltarTurbo = (e) => {
    e.preventDefault();
    desativarTurbo();
  };

  turboBtn.addEventListener("pointerup", soltarTurbo);
  turboBtn.addEventListener("pointercancel", soltarTurbo);

  turboBtn.addEventListener("lostpointercapture", () => {
    desativarTurbo();
  });
}

console.log("Controles do jogo carregados.");
