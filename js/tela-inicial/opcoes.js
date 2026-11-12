// js/tela-inicial/opcoes.js
// Opções de som e partículas, sincronizadas entre a tela de opções
// e a tela de pausa. A navegação (abrir/fechar) fica em ecras/eventos.js.

// Chamado por inicio/pronto.js quando todos os scripts já carregaram.
function iniciarOpcoes() {
  const botoesSom = ["optionsSoundBtn", "soundBtn"]
    .map((id) => document.getElementById(id));

  const botoesParticulas = ["optionsParticlesBtn", "particlesBtn"]
    .map((id) => document.getElementById(id));

  function obterOpcoes() {
    try {
      const salvas = JSON.parse(localStorage.getItem("retroTurboOptions") || "{}");

      return {
        sound: salvas.sound !== false,
        particles: salvas.particles !== false,
      };
    } catch (erro) {
      return { sound: true, particles: true };
    }
  }

  function salvarOpcoes(opcoes) {
    try {
      localStorage.setItem("retroTurboOptions", JSON.stringify(opcoes));
    } catch (erro) {
      // Navegação privada pode bloquear o armazenamento: a opção vale só nesta sessão
    }

    if (typeof invalidarCacheOpcoes === "function") invalidarCacheOpcoes();
  }

  function atualizarBotoes() {
    const opcoes = obterOpcoes();

    const textoDoSom = traduzir(opcoes.sound ? "opcoes.somLigado" : "opcoes.somDesligado");
    const textoDasParticulas = traduzir(
      opcoes.particles ? "opcoes.particulasLigadas" : "opcoes.particulasDesligadas"
    );

    botoesSom.forEach((botao) => {
      if (botao) botao.textContent = textoDoSom;
    });

    botoesParticulas.forEach((botao) => {
      if (botao) botao.textContent = textoDasParticulas;
    });
  }

  function alternarSom() {
    const opcoes = obterOpcoes();
    opcoes.sound = !opcoes.sound;
    salvarOpcoes(opcoes);

    if (typeof gerenciadorAudio !== "undefined") {
      gerenciadorAudio.ativarMudo(!opcoes.sound);
    }

    atualizarBotoes();
  }

  function alternarParticulas() {
    const opcoes = obterOpcoes();
    opcoes.particles = !opcoes.particles;
    salvarOpcoes(opcoes);

    atualizarBotoes();
  }

  botoesSom.forEach((b) => b?.addEventListener("click", alternarSom));
  botoesParticulas.forEach((b) => b?.addEventListener("click", alternarParticulas));

  atualizarBotoes();

  // Trocar o idioma refaz os textos dos botões (o estado ligado/desligado fica)
  aoMudarIdioma(atualizarBotoes);
}
