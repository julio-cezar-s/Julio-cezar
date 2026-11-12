/* js/idiomas/nucleo.js
   NÚCLEO do sistema de idiomas. Não conhece o jogo: só guarda os idiomas
   registrados, o idioma atual e traduz chaves.

   - Os textos de cada idioma ficam em idiomas/textos/<codigo>.js, que se
     registram com registrarIdioma(...). Para um novo idioma (ex.: espanhol) basta
     criar o arquivo e incluí-lo no index.html (veja js/LEIA-ME.md).
   - Português (pt) é o idioma padrão E o reserva: chave que falta em outro
     idioma usa o texto em português; se faltar até lá, aparece a própria chave.
   - A escolha do jogador fica no localStorage.
*/

const IDIOMA_PADRAO = "pt";
const CHAVE_DO_IDIOMA = "retroTurboLanguage";

const registroDeIdiomas = {};          // codigo → { codigo, nome, locale, htmlLang, unidades, textos (achatado) }
const estadoDoIdioma = {
  atual: IDIOMA_PADRAO,
  ouvintes: [],
  ausentes: new Set(),                 // "codigo:chave" que caíram no reserva (útil para testes)
};

// { menu: { jogar: "JOGAR" } }  →  { "menu.jogar": "JOGAR" }
// Objeto com a chave "other" é um texto com plural ({ one: "...", other: "..." })
function achatarTextos(origem, prefixo = "", destino = {}) {
  Object.keys(origem).forEach((nome) => {
    const valor = origem[nome];
    const chave = prefixo ? `${prefixo}.${nome}` : nome;
    const ehObjeto = valor && typeof valor === "object" && !Array.isArray(valor);

    if (ehObjeto && !("other" in valor)) achatarTextos(valor, chave, destino);
    else destino[chave] = valor;
  });

  return destino;
}

function registrarIdioma(definicao) {
  const { codigo, nome, locale, textos } = definicao;

  if (!codigo || !nome || !textos) throw new Error("Idioma inválido: faltam codigo, nome ou textos");

  registroDeIdiomas[codigo] = {
    codigo,
    nome,                                   // sempre no próprio idioma ("Português", "English")
    locale: locale || codigo,               // usado por Intl (números, datas, plural)
    htmlLang: definicao.htmlLang || locale || codigo,
    unidades: definicao.unidades || null,
    textos: achatarTextos(textos),
  };
}

function idiomasDisponiveis() {
  return Object.keys(registroDeIdiomas).map((codigo) => ({
    codigo,
    nome: registroDeIdiomas[codigo].nome,
  }));
}

function idiomaExiste(codigo) {
  return Object.prototype.hasOwnProperty.call(registroDeIdiomas, codigo);
}

function obterIdioma() {
  return estadoDoIdioma.atual;
}

function dadosDoIdioma(codigo) {
  return registroDeIdiomas[codigo || estadoDoIdioma.atual] || registroDeIdiomas[IDIOMA_PADRAO];
}

// Procura a chave no idioma atual e, se faltar, em português
function buscarTexto(chave) {
  const atual = dadosDoIdioma();

  if (atual && chave in atual.textos) return atual.textos[chave];

  const reserva = registroDeIdiomas[IDIOMA_PADRAO];

  if (reserva && chave in reserva.textos) {
    estadoDoIdioma.ausentes.add(`${estadoDoIdioma.atual}:${chave}`);
    return reserva.textos[chave];
  }

  estadoDoIdioma.ausentes.add(`${estadoDoIdioma.atual}:${chave}`);
  return undefined;
}

// "Olá, {nome}" + { nome: "Ana" } → "Olá, Ana"
function preencherParametros(texto, parametros) {
  if (!parametros || texto.indexOf("{") === -1) return texto;

  return texto.replace(/\{(\w+)\}/g, (marca, nome) =>
    nome in parametros ? String(parametros[nome]) : marca);
}

// Texto com plural: escolhe a forma pela regra do idioma (Intl.PluralRules)
function escolherForma(formas, quantidade, locale) {
  let categoria = "other";

  try {
    categoria = new Intl.PluralRules(locale).select(Number(quantidade));
  } catch (erro) {
    categoria = Number(quantidade) === 1 ? "one" : "other";
  }

  return formas[categoria] !== undefined ? formas[categoria] : formas.other;
}

// Traduz uma chave. parametros.n (ou .quantidade) escolhe a forma do plural.
function traduzir(chave, parametros) {
  const valor = buscarTexto(chave);

  if (valor === undefined) return chave;

  if (typeof valor === "object" && !Array.isArray(valor)) {
    const n = parametros && (parametros.n !== undefined ? parametros.n : parametros.quantidade);
    return preencherParametros(escolherForma(valor, n, dadosDoIdioma().locale), parametros);
  }

  if (Array.isArray(valor)) return chave;

  return preencherParametros(valor, parametros);
}

// Listas de textos (ex.: palavras dos outdoors). Faltando, usa a de português.
function traduzirLista(chave) {
  const valor = buscarTexto(chave);

  return Array.isArray(valor) ? valor : [];
}

function existeTraducao(chave, codigo) {
  const dados = registroDeIdiomas[codigo];

  return !!dados && chave in dados.textos;
}

// Quem precisa refazer textos quando o idioma muda se registra aqui
function aoMudarIdioma(ouvinte) {
  estadoDoIdioma.ouvintes.push(ouvinte);
}

function lerIdiomaSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE_DO_IDIOMA);

    if (salvo && idiomaExiste(salvo)) return salvo;
  } catch (erro) {
    // Armazenamento bloqueado: usa o idioma padrão
  }

  return IDIOMA_PADRAO;
}

function salvarIdioma(codigo) {
  try {
    localStorage.setItem(CHAVE_DO_IDIOMA, codigo);
  } catch (erro) {
    // Navegação privada: a escolha vale só nesta visita
  }
}

// Troca o idioma. Código desconhecido é ignorado (devolve false).
function definirIdioma(codigo, { salvar = true } = {}) {
  if (!idiomaExiste(codigo)) return false;

  const mudou = estadoDoIdioma.atual !== codigo;

  estadoDoIdioma.atual = codigo;
  if (salvar) salvarIdioma(codigo);

  // Um ouvinte com defeito não impede os outros de atualizar
  if (mudou) {
    estadoDoIdioma.ouvintes.slice().forEach((ouvinte) => {
      try {
        ouvinte(codigo);
      } catch (erro) {
        console.error("[idiomas] erro ao atualizar a interface:", erro);
      }
    });
  }

  return true;
}

// Carrega o idioma salvo (sem regravar nem avisar os ouvintes)
function iniciarIdioma() {
  estadoDoIdioma.atual = lerIdiomaSalvo();
}
