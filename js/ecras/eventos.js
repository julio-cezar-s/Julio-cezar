// js/ecras/eventos.js
// Vinculação de cliques e toques da navegação entre telas.
// (Alternância de som/partículas fica em js/tela-inicial/opcoes.js.)

// Começa (ou recomeça) a partida. Só funciona com o jogo totalmente carregado
// e, se algo falhar, volta ao menu mostrando o erro (nunca deixa a tela vazia).
function iniciarPartida() {
  if (!window.jogoPronto) return;

  const menu = document.getElementById("startScreen");
  menu?.classList.add("hidden");

  // Este clique é um gesto do usuário: é aqui que o celular libera o áudio
  // sintetizado (power-ups, combo). Só acontece se o som estiver ligado.
  if (typeof liberarAudioSintetizado === "function") liberarAudioSintetizado();

  // No celular, tenta a tela cheia uma vez (também exige gesto do usuário)
  if (typeof tentarTelaCheiaAutomatica === "function") tentarTelaCheiaAutomatica();

  try {
    resetGame();
  } catch (erro) {
    menu?.classList.remove("hidden");
    mostrarErroNaTela(traduzir("erro.iniciarPartida"), erro);
  }
}

document.addEventListener("click", (event) => {
  const botao = event.target.closest("button");
  if (!botao) return;

  switch (botao.id) {
    // Início e reinício da partida
    case "playBtn":
      iniciarPartida();
      break;

    case "restartBtn":
      iniciarPartida();
      break;

    // Pausa
    case "pauseBtn":
      pausarJogo();
      break;

    case "resumeBtn":
      continuarJogo();
      break;

    // Saídas para o menu
    case "quitBtn":
    case "backToMenuBtn":
      sairParaMenu();
      break;

    // Opções
    case "optionsBtn":
      document.getElementById("optionsScreen")?.classList.remove("hidden");
      break;

    case "closeOptionsBtn":
      document.getElementById("optionsScreen")?.classList.add("hidden");
      break;

    // Recordes
    case "recordsBtn":
      if (typeof renderizarRecordes === "function") renderizarRecordes();
      document.getElementById("recordsScreen")?.classList.remove("hidden");
      break;

    case "closeRecordsBtn":
      document.getElementById("recordsScreen")?.classList.add("hidden");
      break;
  }
});
