/* js/inicio/diagnostico.js
   PRIMEIRO script a carregar. Garante que nenhum erro fique silencioso:
   falhas ao carregar um arquivo do jogo ou erros durante a execução
   aparecem numa faixa vermelha no topo da tela, com botão para recarregar.

   Também controla se o jogo está "pronto" (window.jogoPronto): o botão
   JOGAR só funciona depois que TODOS os scripts terminaram de carregar.
*/

window.jogoPronto = false;

const falhasDoJogo = [];

// Este script carrega ANTES do módulo de idiomas, e a faixa de erro precisa
// funcionar mesmo se o próprio módulo de idiomas não carregar (pasta incompleta).
// Por isso guarda uma cópia de emergência em português das chaves "erro.*"
// (os testes garantem que ela é igual a idiomas/textos/pt.js).
const TEXTOS_DE_EMERGENCIA = {
  "erro.carregarArquivo": "Não foi possível carregar um arquivo do jogo",
  "erro.generico": "Erro no jogo",
  "erro.recarregar": "Recarregar",
  "erro.fechar": "Fechar",
  "erro.dica": "Se o erro persistir, recarregue ignorando o cache (Ctrl+F5) e confira se todos os arquivos da pasta foram copiados.",
};

function textoDoErro(chave) {
  return typeof traduzir === "function" ? traduzir(chave) : TEXTOS_DE_EMERGENCIA[chave] || chave;
}

function descreverErro(erro) {
  if (!erro) return "erro desconhecido";
  if (typeof erro === "string") return erro;

  if (erro.stack) return erro.stack.split("\n").slice(0, 3).join("\n");

  return erro.message || String(erro);
}

// Mostra (ou atualiza) a faixa de erro no topo da tela
function mostrarErroNaTela(titulo, detalhe) {
  const texto = descreverErro(detalhe);
  const chave = titulo + "|" + texto;

  if (falhasDoJogo.includes(chave)) return;   // não repete a mesma mensagem

  falhasDoJogo.push(chave);
  console.error("[Retro Turbo Racer]", titulo, texto);

  const raiz = document.body || document.documentElement;
  let faixa = document.getElementById("faixa-de-erro");

  if (!faixa) {
    faixa = document.createElement("div");
    faixa.id = "faixa-de-erro";

    faixa.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:99999;max-height:45vh;overflow:auto;" +
      "padding:10px 14px;background:#5b0f1a;color:#fff;border-bottom:3px solid #ff2e63;" +
      "font:13px/1.4 Consolas,monospace;box-shadow:0 4px 20px rgba(0,0,0,.6)";

    const lista = document.createElement("div");
    lista.id = "faixa-de-erro-lista";

    const botoes = document.createElement("div");
    botoes.style.cssText = "margin-top:8px;display:flex;gap:8px;flex-wrap:wrap";

    const recarregar = document.createElement("button");
    recarregar.textContent = textoDoErro("erro.recarregar");
    recarregar.onclick = () => location.reload();

    const fechar = document.createElement("button");
    fechar.textContent = textoDoErro("erro.fechar");
    fechar.onclick = () => faixa.remove();

    [recarregar, fechar].forEach((b) => {
      b.type = "button";
      b.style.cssText = "padding:5px 12px;background:#fff;color:#5b0f1a;border:0;font-weight:700;cursor:pointer";
      botoes.appendChild(b);
    });

    const dica = document.createElement("div");
    dica.style.cssText = "margin-top:6px;opacity:.8;font-size:12px";
    dica.textContent = textoDoErro("erro.dica");

    faixa.append(lista, botoes, dica);
    raiz.appendChild(faixa);
  }

  const item = document.createElement("div");
  item.style.cssText = "margin-bottom:6px;white-space:pre-wrap";

  const forte = document.createElement("strong");
  forte.textContent = titulo;

  item.append(forte, document.createElement("br"), document.createTextNode(texto));
  document.getElementById("faixa-de-erro-lista").appendChild(item);
}

// Falha ao carregar um <script>/<link> (404, rede) ou erro de execução.
// "true" = fase de captura: só assim os erros de carregamento chegam aqui.
window.addEventListener("error", (evento) => {
  const alvo = evento.target;

  if (alvo && alvo !== window && (alvo.src || alvo.href)) {
    mostrarErroNaTela(
      textoDoErro("erro.carregarArquivo"),
      (alvo.src || alvo.href).split("?")[0]
    );
    return;
  }

  const arquivo = (evento.filename || "").split("/").slice(-2).join("/");
  mostrarErroNaTela(textoDoErro("erro.generico"), `${evento.message} (${arquivo}:${evento.lineno})`);
}, true);

window.addEventListener("unhandledrejection", (evento) => {
  const motivo = evento.reason;

  // Navegadores bloqueiam som sem interação: isso é normal, não é erro do jogo
  if (motivo && (motivo.name === "NotAllowedError" || motivo.name === "AbortError")) return;

  mostrarErroNaTela(textoDoErro("erro.generico"), motivo);
});
