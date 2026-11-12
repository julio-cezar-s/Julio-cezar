/* js/idiomas/formatacao.js
   Números, ordinais, datas e unidades conforme o idioma atual.
   Depende de nucleo.js. Nada aqui altera valores do jogo: só a APRESENTAÇÃO
   (a física e a pontuação seguem em km/h e quilômetros).
*/

function localeAtual() {
  return dadosDoIdioma().locale;
}

// 0.06 → "0,06" (pt) ou "0.06" (en)
function formatarDecimal(valor, casas) {
  try {
    return new Intl.NumberFormat(localeAtual(), {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(valor);
  } catch (erro) {
    return Number(valor).toFixed(casas);
  }
}

// 1 → "1º" (pt) ou "1st" (en). O modelo de cada idioma fica em formato.ordinal.
function formatarOrdinal(n) {
  const modelo = buscarTexto("formato.ordinal");

  if (typeof modelo === "string") return preencherParametros(modelo, { n });
  if (!modelo) return String(n);

  let categoria = "other";

  try {
    categoria = new Intl.PluralRules(localeAtual(), { type: "ordinal" }).select(n);
  } catch (erro) {
    categoria = "other";
  }

  return preencherParametros(modelo[categoria] !== undefined ? modelo[categoria] : modelo.other, { n });
}

// Data guardada em ISO ("2026-11-10T...") → data curta do idioma
function formatarData(iso) {
  if (!iso) return "";

  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return "";

  try {
    return data.toLocaleDateString(localeAtual());
  } catch (erro) {
    return data.toLocaleDateString();
  }
}

// ----- Unidades -----
// Cada idioma diz em que unidade mostra velocidade e distância (km/h e km, ou
// mph e milhas) e como o mostrador analógico é graduado.

// As unidades de cada idioma ficam em "unidades" no arquivo do idioma. Faltando,
// vale a definição do português (km/h e km).
function unidadesDoIdioma() {
  return dadosDoIdioma().unidades || registroDeIdiomas[IDIOMA_PADRAO].unidades;
}

// Velocidade em km/h → número inteiro na unidade do idioma
function converterVelocidade(kmh) {
  return Math.floor(kmh * unidadesDoIdioma().velocidade.fator);
}

function rotuloDaVelocidade() {
  return unidadesDoIdioma().velocidade.rotulo;
}

function mostradorDeVelocidade() {
  return unidadesDoIdioma().velocidade.mostrador;
}

// Distância em km → "0,06" / "0.04" na unidade do idioma
function formatarDistancia(km) {
  return formatarDecimal(km * unidadesDoIdioma().distancia.fator, 2);
}

function rotuloDaDistancia() {
  return unidadesDoIdioma().distancia.rotulo;
}

// Velocímetro do HUD em HTML: "120 <small>KM/H</small>"
function htmlDaVelocidade(kmh) {
  return `${converterVelocidade(kmh)} <small>${rotuloDaVelocidade()}</small>`;
}
