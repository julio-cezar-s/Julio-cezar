// js/tela-inicial/recordes.js
// Recordes: guarda os 5 melhores resultados e mantém a chave antiga
// (retroTurboMaxScore) com a melhor pontuação, por compatibilidade.

const CHAVE_RECORDES = "retroTurboRecords";
const CHAVE_RECORDE_MAXIMO = "retroTurboMaxScore";

function lerRecordes() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_RECORDES));
    if (Array.isArray(lista)) return lista;
  } catch (erro) { /* usa o recorde antigo abaixo */ }

  // Migra o recorde único de versões anteriores
  const antigo = parseInt(localStorage.getItem(CHAVE_RECORDE_MAXIMO) || "0", 10);

  return antigo > 0 ? [{ pontos: antigo, data: null }] : [];
}

// Função global usada pelo loop ao final da partida
function checkAndSaveRecord(score) {
  const pontos = Math.floor(score);
  if (pontos <= 0) return;

  const lista = lerRecordes();
  lista.push({ pontos, data: new Date().toISOString() });
  lista.sort((a, b) => b.pontos - a.pontos);

  const melhores = lista.slice(0, 5);

  try {
    localStorage.setItem(CHAVE_RECORDES, JSON.stringify(melhores));
    localStorage.setItem(CHAVE_RECORDE_MAXIMO, String(melhores[0].pontos));
  } catch (erro) {
    console.warn("Não foi possível salvar o recorde.", erro);
  }
}

function renderizarRecordes() {
  const area = document.getElementById("recordsList");
  if (!area) return;

  const lista = lerRecordes();

  if (lista.length === 0) {
    const aviso = document.createElement("p");
    aviso.textContent = traduzir("recordes.vazio");
    area.textContent = "";
    area.appendChild(aviso);
    return;
  }

  area.innerHTML = lista.map((r, i) => {
    const data = formatarData(r.data);
    return `<div class="record-row"><span>${formatarOrdinal(i + 1)}</span>` +
      `<strong>${String(r.pontos).padStart(5, "0")}</strong><small>${data}</small></div>`;
  }).join("");
}

// Recordes já desenhados acompanham o idioma (data e ordinais mudam)
aoMudarIdioma(renderizarRecordes);
