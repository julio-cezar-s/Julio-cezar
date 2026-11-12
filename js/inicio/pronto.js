/* js/inicio/pronto.js
   ÚLTIMO script a carregar: se chegou aqui, todos os outros já rodaram.
   Prepara a cena inicial e libera o botão JOGAR (antes disso o menu fica
   inerte, mostrando "Carregando…").
*/

function prepararJogo() {
  try {
    // Algum arquivo falhou: mantém o menu bloqueado e explica
    if (falhasDoJogo.length) {
      const aviso = document.getElementById("carregamentoAviso");
      if (aviso) {
        // A chave fica no elemento: se o idioma mudar, o texto acompanha
        aviso.setAttribute("data-i18n", "carregamento.falha");
        aviso.textContent = traduzir("carregamento.falha");
      }
      return;
    }

    const rotuloVersao = document.getElementById("versaoDoJogo");
    const mostrarVersao = () => {
      if (rotuloVersao) rotuloVersao.textContent = traduzir("menu.versao", { versao: VERSAO_DO_JOGO });
    };

    mostrarVersao();
    aoMudarIdioma(mostrarVersao);
    atualizarUnidadesNoHud();

    if (typeof iniciarOpcoes === "function") iniciarOpcoes();
    if (typeof iniciarLayout === "function") iniciarLayout();
    if (typeof iniciarCena === "function") iniciarCena();

    window.jogoPronto = true;
    document.body.classList.remove("carregando");
  } catch (erro) {
    mostrarErroNaTela(traduzir("erro.preparar"), erro);
  }
}

prepararJogo();
