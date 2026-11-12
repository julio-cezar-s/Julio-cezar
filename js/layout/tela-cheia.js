/* js/layout/tela-cheia.js
   Tela cheia (Fullscreen API) com os prefixos antigos do Safari. Onde não há
   suporte (ex.: iPhone), os botões de tela cheia ficam escondidos.

   Botões: qualquer elemento com data-tela-cheia. Tecla: F.
   No celular, o primeiro clique em JOGAR tenta entrar em tela cheia uma vez
   (depois disso só pelo botão ou tecla, para não incomodar quem saiu).
*/

let telaCheiaAutomaticaFeita = false;

function elementoDeTelaCheia() {
  return document.documentElement;
}

function telaCheiaDisponivel() {
  const el = elementoDeTelaCheia();

  return !!(el && (el.requestFullscreen || el.webkitRequestFullscreen) &&
    (document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false));
}

function telaCheiaAtiva() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function entrarEmTelaCheia() {
  const el = elementoDeTelaCheia();

  try {
    const pedido = el.requestFullscreen
      ? el.requestFullscreen({ navigationUI: "hide" })
      : el.webkitRequestFullscreen();

    // Já na tela cheia, tenta travar na horizontal (só funciona no Android)
    Promise.resolve(pedido).then(() => {
      const orientacao = window.screen && window.screen.orientation;
      if (orientacao && orientacao.lock) return orientacao.lock("landscape");
    }).catch(() => {});
  } catch (erro) {
    // Navegador recusou (sem gesto do usuário, política, etc.): segue sem tela cheia
  }
}

function sairDaTelaCheia() {
  try {
    const pedido = document.exitFullscreen
      ? document.exitFullscreen()
      : document.webkitExitFullscreen && document.webkitExitFullscreen();

    Promise.resolve(pedido).catch(() => {});
  } catch (erro) {
    // Nada a fazer
  }
}

function alternarTelaCheia() {
  if (!telaCheiaDisponivel()) return;

  if (telaCheiaAtiva()) sairDaTelaCheia();
  else entrarEmTelaCheia();
}

// Chamado no clique de JOGAR (um gesto do usuário, exigido pelo navegador)
function tentarTelaCheiaAutomatica() {
  if (telaCheiaAutomaticaFeita) return;
  telaCheiaAutomaticaFeita = true;

  if (typeof tela !== "undefined" && tela.toque && telaCheiaDisponivel() && !telaCheiaAtiva()) {
    entrarEmTelaCheia();
  }
}

// Texto/estado dos botões conforme a tela cheia ligada ou não
function atualizarBotoesDeTelaCheia() {
  const disponivel = telaCheiaDisponivel();
  const ativa = telaCheiaAtiva();

  document.querySelectorAll("[data-tela-cheia]").forEach((botao) => {
    botao.classList.toggle("hidden", !disponivel);

    if (botao.dataset.telaCheia === "texto") {
      botao.textContent = traduzir(ativa ? "opcoes.telaCheiaLigada" : "opcoes.telaCheiaDesligada");
    } else {
      botao.setAttribute("aria-pressed", ativa ? "true" : "false");
      botao.setAttribute(
        "aria-label",
        traduzir(ativa ? "acessibilidade.sairDaTelaCheia" : "acessibilidade.telaCheia")
      );
    }
  });
}

// Chamado por responsivo.js quando o jogo fica pronto
function iniciarTelaCheia() {
  document.addEventListener("click", (evento) => {
    const botao = evento.target.closest && evento.target.closest("[data-tela-cheia]");
    if (botao) alternarTelaCheia();
  });

  window.addEventListener("keydown", (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key || "").toLowerCase() === "f") alternarTelaCheia();
  });

  ["fullscreenchange", "webkitfullscreenchange"].forEach((nome) => {
    document.addEventListener(nome, atualizarBotoesDeTelaCheia);
  });

  atualizarBotoesDeTelaCheia();
  aoMudarIdioma(atualizarBotoesDeTelaCheia);
}
