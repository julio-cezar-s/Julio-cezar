/* js/layout/desempenho.js
   Rede de segurança de desempenho. A resolução interna do canvas acompanha a
   tela (nítido em notebook e celular de alta densidade), mas se o aparelho
   não aguentar — média de quadro lenta por alguns segundos — a resolução cai
   um degrau. Nunca sobe sozinha: só volta a crescer quando a tela mudar de
   tamanho ou orientação. A física não depende disso (usa passo de tempo).
*/

const DESEMPENHO = {
  aquecimento: 90,    // quadros ignorados no início (cache do céu, etc.)
  janela: 90,         // quadros por avaliação (~1,5 s)
  limiteMs: 24,       // média acima disso = abaixo de ~42 quadros/s
  maximoValidoMs: 100,
};

const desempenho = { vistos: 0, soma: 0, quantidade: 0 };

function reiniciarMedicaoDeDesempenho() {
  desempenho.vistos = 0;
  desempenho.soma = 0;
  desempenho.quantidade = 0;
}

// Chamado pelo loop a cada quadro simulado, com a duração do quadro em ms
function observarDesempenhoDoQuadro(duracaoMs) {
  desempenho.vistos++;

  if (desempenho.vistos <= DESEMPENHO.aquecimento) return;
  if (!(duracaoMs > 0) || duracaoMs > DESEMPENHO.maximoValidoMs) return;

  desempenho.soma += duracaoMs;
  desempenho.quantidade++;

  if (desempenho.quantidade < DESEMPENHO.janela) return;

  const media = desempenho.soma / desempenho.quantidade;

  desempenho.soma = 0;
  desempenho.quantidade = 0;

  if (media > DESEMPENHO.limiteMs && typeof reduzirQualidadeDeRenderizacao === "function") {
    reduzirQualidadeDeRenderizacao();
  }
}
