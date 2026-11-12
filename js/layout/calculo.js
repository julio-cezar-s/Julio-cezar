/* js/layout/calculo.js
   CÁLCULO do layout: dado o tamanho da janela, decide onde ficam o canvas, a
   barra de informações (HUD em HTML) e os controles de toque. É matemática
   pura (sem DOM), por isso é testada com dezenas de resoluções.

   O canvas mantém SEMPRE as coordenadas lógicas 640×360 (16:9): só a área em
   que ele é mostrado muda. O que sobra da tela (laterais ou faixas em cima e
   embaixo) é usado pelos controles e pela barra, em vez de ficar vazio.

   Modos:
     lateral   celular na horizontal e tela comprida (ex.: 20:9): botões nas
               laterais, barra de informações em cima, canvas no meio
     inferior  celular antigo (16:9) ou tablet: barra em cima, botões embaixo
     mesa      notebook/desktop com mouse e teclado: só a barra em cima, o
               canvas ocupa todo o resto (os botões de toque ficam escondidos
               até alguém tocar na tela)
*/

const LAYOUT = {
  proporcao: GAME_WIDTH / GAME_HEIGHT,

  // Fator de escala da interface em HTML: acompanha o menor lado da janela
  ui: { referencia: 400, min: 0.85, max: 1.3 },

  // Medidas em pixels CSS para ui = 1 (são multiplicadas por ui)
  barra: 40,               // altura da barra de informações
  controlesInferior: 58,   // altura da faixa de botões (modo inferior)
  controlesInferiorMin: 56, // nunca menor que isso (botão de 44 px + folga)
  lateralMinima: 116,      // largura mínima de cada lateral (modo lateral)

  // Abaixo desta largura a barra usa o formato compacto (rótulo sobre o valor)
  larguraCompacta: 700,

  // Resolução interna do canvas, como múltiplo de 640×360 (nítida sem pesar)
  escalas: [1, 1.25, 1.5, 1.75, 2],
};

function fatorDeInterface(largura, altura) {
  const { referencia, min, max } = LAYOUT.ui;

  return Math.max(min, Math.min(max, Math.min(largura, altura) / referencia));
}

// Maior retângulo 16:9 que cabe em (largura × altura), em múltiplos de 16 pixels
// físicos: assim a proporção é exata e a imagem não é reamostrada com borrão.
function ajustarEm16por9(largura, altura, dpr) {
  const folga = Math.min(largura, altura * LAYOUT.proporcao);
  const blocos = Math.floor((folga * dpr) / 16);

  if (blocos < 1) return { w: 0, h: 0 };

  return { w: (blocos * 16) / dpr, h: (blocos * 9) / dpr };
}

// Entrada: { largura, altura, toque, dpr, seguro: { topo, direita, base, esquerda } }
function calcularLayout(entrada) {
  const dpr = entrada.dpr > 0 ? entrada.dpr : 1;
  const seguro = { topo: 0, direita: 0, base: 0, esquerda: 0, ...(entrada.seguro || {}) };

  // Área útil (descontando entalhes e barras do sistema)
  const area = {
    x: seguro.esquerda,
    y: seguro.topo,
    w: Math.max(0, entrada.largura - seguro.esquerda - seguro.direita),
    h: Math.max(0, entrada.altura - seguro.topo - seguro.base),
  };

  const ui = fatorDeInterface(area.w, area.h);
  const alturaBarra = Math.round(LAYOUT.barra * ui);
  const alturaControles = Math.max(LAYOUT.controlesInferiorMin, Math.round(LAYOUT.controlesInferior * ui));
  const lateralMinima = Math.round(LAYOUT.lateralMinima * ui);

  // Cada candidato diz que espaço sobra para o canvas
  const candidatos = [];

  if (entrada.toque) {
    candidatos.push({
      modo: "lateral",
      disponivel: { w: area.w - 2 * lateralMinima, h: area.h - alturaBarra },
    });
    candidatos.push({
      modo: "inferior",
      disponivel: { w: area.w, h: area.h - alturaBarra - alturaControles },
    });
  } else {
    candidatos.push({ modo: "mesa", disponivel: { w: area.w, h: area.h - alturaBarra } });
  }

  // Vence o que dá o maior canvas (em empate, o primeiro da lista)
  let melhor = null;

  candidatos.forEach((c) => {
    c.mundo = ajustarEm16por9(Math.max(0, c.disponivel.w), Math.max(0, c.disponivel.h), dpr);
    c.pontos = c.mundo.w * c.mundo.h;
    if (!melhor || c.pontos > melhor.pontos) melhor = c;
  });

  const { modo, mundo } = melhor;

  // Posição do canvas: centralizado na horizontal e, na vertical, no espaço
  // que fica entre a barra de cima e (no modo inferior) a faixa de botões
  const topoDoMundo = area.y + alturaBarra;
  const baseDoMundo = area.y + area.h - (modo === "inferior" ? alturaControles : 0);

  const mundoRect = {
    x: area.x + (area.w - mundo.w) / 2,
    y: topoDoMundo + (baseDoMundo - topoDoMundo - mundo.h) / 2,
    w: mundo.w,
    h: mundo.h,
  };

  const barra = { x: area.x, y: area.y, w: area.w, h: alturaBarra };

  let controles = null;

  if (modo === "inferior") {
    controles = { x: area.x, y: baseDoMundo, w: area.w, h: alturaControles };
  } else if (modo === "lateral") {
    // Faixa que vai da barra até a base; os botões ficam nas laterais, embaixo
    controles = { x: area.x, y: topoDoMundo, w: area.w, h: area.y + area.h - topoDoMundo };
  }

  const lateral = {
    esquerda: mundoRect.x - area.x,
    direita: area.x + area.w - (mundoRect.x + mundoRect.w),
  };

  return {
    modo,
    ui,
    compacto: area.w < LAYOUT.larguraCompacta,
    area,
    barra,
    mundo: mundoRect,
    controles,
    lateral,
    aproveitamento: (mundoRect.w * mundoRect.h) / Math.max(1, entrada.largura * entrada.altura),
  };
}

// Resolução interna do canvas (múltiplo de 640×360) para a largura mostrada na
// tela: o menor degrau que ainda fica nítido, limitado pelo teto de qualidade.
function escolherEscalaDeRenderizacao(larguraNaTela, dpr, teto) {
  const degraus = LAYOUT.escalas;
  const necessaria = (larguraNaTela * (dpr > 0 ? dpr : 1)) / GAME_WIDTH;
  const limite = teto === undefined ? degraus[degraus.length - 1] : teto;

  const degrau = degraus.find((d) => d >= necessaria - 0.05) ?? degraus[degraus.length - 1];

  return Math.max(degraus[0], Math.min(degrau, limite));
}

// Degrau logo abaixo de "escala" (ou o mínimo, se já estiver nele)
function degrauAbaixoDe(escala) {
  const menores = LAYOUT.escalas.filter((d) => d < escala - 1e-9);

  return menores.length ? menores[menores.length - 1] : LAYOUT.escalas[0];
}
