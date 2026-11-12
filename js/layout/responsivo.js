/* js/layout/responsivo.js
   Liga o cálculo (calculo.js) à página: mede a janela, posiciona o canvas, a
   barra e os controles, escolhe a resolução interna do canvas, mostra o aviso
   "gire o aparelho" no celular na vertical e reage a redimensionamento,
   rotação e tela cheia.
*/

const tela = {
  toque: false,         // controles de toque visíveis (celular/tablet ou toque detectado)
  tocou: false,         // alguém tocou na tela (mesmo em notebook com tela sensível)
  retrato: false,       // celular/tablet na vertical: pede para girar
  layout: null,         // último resultado de calcularLayout()
  teto: LAYOUT.escalas[LAYOUT.escalas.length - 1],   // teto de qualidade (cai se faltar desempenho)
  agendado: null,
};

function consultarMidia(consulta) {
  try {
    return !!(window.matchMedia && window.matchMedia(consulta).matches);
  } catch (erro) {
    return false;
  }
}

function lerTamanhoDaJanela() {
  return {
    largura: window.innerWidth || document.documentElement.clientWidth || GAME_WIDTH,
    altura: window.innerHeight || document.documentElement.clientHeight || GAME_HEIGHT,
    dpr: window.devicePixelRatio || 1,
  };
}

// Entalhes e barras do sistema (env(safe-area-inset-*)), lidos uma vez por medição
function lerAreasSeguras() {
  const zeros = { topo: 0, direita: 0, base: 0, esquerda: 0 };

  try {
    const sonda = document.createElement("div");

    sonda.style.cssText =
      "position:fixed;visibility:hidden;pointer-events:none;" +
      "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) " +
      "env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";

    document.body.appendChild(sonda);

    const css = window.getComputedStyle(sonda);
    const valor = (v) => Math.max(0, parseFloat(v) || 0);
    const medidas = {
      topo: valor(css.paddingTop),
      direita: valor(css.paddingRight),
      base: valor(css.paddingBottom),
      esquerda: valor(css.paddingLeft),
    };

    if (sonda.remove) sonda.remove();

    return medidas;
  } catch (erro) {
    return zeros;
  }
}

function definirVariavelCss(elemento, nome, valor) {
  if (elemento.style.setProperty) elemento.style.setProperty(nome, String(valor));
  else elemento.style[nome] = String(valor);
}

function posicionar(elemento, retangulo) {
  if (!elemento) return;

  elemento.style.display = retangulo ? "" : "none";
  if (!retangulo) return;

  elemento.style.left = `${retangulo.x}px`;
  elemento.style.top = `${retangulo.y}px`;
  elemento.style.width = `${retangulo.w}px`;
  elemento.style.height = `${retangulo.h}px`;
}

// Resolução interna do canvas. Mudar de degrau recria o canvas (e o céu em cache)
function aplicarEscalaDeRenderizacao(escala) {
  if (escala === RENDER_SCALE) return false;

  RENDER_SCALE = escala;
  canvas.width = Math.round(GAME_WIDTH * escala);
  canvas.height = Math.round(GAME_HEIGHT * escala);

  // As camadas do céu são desenhadas na escala atual: refaz na próxima vez
  if (typeof camadasCeu !== "undefined") camadasCeu = null;

  if (typeof reiniciarMedicaoDeDesempenho === "function") reiniciarMedicaoDeDesempenho();

  return true;
}

function reduzirQualidadeDeRenderizacao() {
  const nova = degrauAbaixoDe(RENDER_SCALE);

  if (nova >= RENDER_SCALE) return;

  tela.teto = nova;
  aplicarEscalaDeRenderizacao(nova);
  redesenharSeParado();
}

// O canvas é limpo ao mudar de tamanho: se o loop não está rodando (menu, fim de
// jogo) ou está pausado, desenha de novo para não ficar vazio
function redesenharSeParado() {
  if (!window.jogoPronto || typeof renderizar !== "function") return;

  try {
    if (typeof gameState !== "undefined" && gameState.isPaused) gameState.pausaDesenhada = false;
    if (typeof animationFrameId !== "undefined" && animationFrameId === null) renderizar();
  } catch (erro) {
    // O próximo quadro do loop desenha normalmente
  }
}

function aplicarLayout(l, dpr) {
  const container = document.getElementById("game-container");
  const mundo = document.getElementById("game-world");
  const hud = document.getElementById("hud");
  const controles = document.getElementById("mobile-controls");

  container.setAttribute("data-layout", l.modo);
  container.setAttribute("data-compacto", l.compacto ? "sim" : "nao");
  container.setAttribute("data-toque", tela.toque ? "sim" : "nao");

  definirVariavelCss(container, "--ui", l.ui.toFixed(3));
  definirVariavelCss(container, "--lateral", `${Math.floor(Math.min(l.lateral.esquerda, l.lateral.direita))}px`);

  posicionar(hud, l.barra);
  posicionar(mundo, l.mundo);
  posicionar(controles, tela.toque ? l.controles : null);

  aplicarEscalaDeRenderizacao(escolherEscalaDeRenderizacao(l.mundo.w, dpr, tela.teto));
}

function atualizarAvisoDeRotacao() {
  const aviso = document.getElementById("girar-aparelho");
  const antes = tela.retrato;

  tela.retrato = tela.toque && window.innerHeight > window.innerWidth;

  document.body.classList.toggle("retrato", tela.retrato);
  if (aviso) aviso.classList.toggle("hidden", !tela.retrato);

  // Não deixa a partida correndo atrás do aviso: pausa (o jogador retoma ao girar)
  if (tela.retrato && !antes && typeof partidaAtiva === "function" && partidaAtiva() &&
      !gameState.isPaused && typeof pausarJogo === "function") {
    pausarJogo();
  }
}

// Recalcula tudo. Chamado ao iniciar e a cada redimensionamento/rotação
function atualizarLayout() {
  const { largura, altura, dpr } = lerTamanhoDaJanela();

  tela.toque = tela.tocou || consultarMidia("(pointer: coarse)");

  const l = calcularLayout({ largura, altura, toque: tela.toque, dpr, seguro: lerAreasSeguras() });

  tela.layout = l;

  const escalaAnterior = RENDER_SCALE;

  aplicarLayout(l, dpr);
  atualizarAvisoDeRotacao();

  if (RENDER_SCALE !== escalaAnterior) redesenharSeParado();
}

// Espera o navegador terminar de girar/redimensionar antes de recalcular
function agendarAtualizacaoDoLayout() {
  if (tela.agendado) clearTimeout(tela.agendado);

  tela.agendado = setTimeout(() => {
    tela.agendado = null;
    // Se a tela mudou de tamanho, a qualidade volta a poder subir
    tela.teto = LAYOUT.escalas[LAYOUT.escalas.length - 1];
    atualizarLayout();
  }, 60);
}

function iniciarLayout() {
  atualizarLayout();

  window.addEventListener("resize", agendarAtualizacaoDoLayout);
  window.addEventListener("orientationchange", agendarAtualizacaoDoLayout);
  if (window.visualViewport && window.visualViewport.addEventListener) {
    window.visualViewport.addEventListener("resize", agendarAtualizacaoDoLayout);
  }

  ["fullscreenchange", "webkitfullscreenchange"].forEach((nome) => {
    document.addEventListener(nome, agendarAtualizacaoDoLayout);
  });

  // Primeiro toque: mostra os botões também em notebook com tela sensível
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" && !tela.tocou) {
      tela.tocou = true;
      atualizarLayout();
    }
  }, { capture: true });

  if (typeof iniciarTelaCheia === "function") iniciarTelaCheia();
}
