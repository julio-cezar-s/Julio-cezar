/* js/dificuldade/niveis.js
   TABELA DE NÍVEIS. É aqui que se ajusta a curva de dificuldade do jogo.

   O nível sobe com a distância percorrida. Cada nível define:
     distancia      a partir de quando vale (unidades de mundo)
     intervalo      [mín, máx] quadros entre um padrão e o próximo (60 = 1 s)
     pesos          chance relativa de cada padrão (nomes de padroes.js);
                    padrão fora da lista não aparece nesse nível
     trocaDeFaixa   chance de um carro comum trocar de faixa (com aviso)

   Para um jogo mais fácil: aumente `intervalo` e `distancia`.
   Para mais variedade cedo: adicione padrões em `pesos` dos níveis iniciais.
*/

const NIVEIS = [
  { // 1 — aquecimento: só carros, um de cada vez
    distancia: 0, intervalo: [85, 110], trocaDeFaixa: 0,
    pesos: { simples: 10 },
  },
  { // 2 — entram cones, óleo e dois carros juntos
    distancia: 110, intervalo: [72, 96], trocaDeFaixa: 0.1,
    pesos: { simples: 6, slalom: 2, oleo: 2, duplo: 2 },
  },
  { // 3 — caminhões largos, motos e carros que cortam
    distancia: 260, intervalo: [64, 86], trocaDeFaixa: 0.18,
    pesos: { simples: 4, duplo: 3, slalom: 2, oleo: 2, caminhao: 2, moto: 2, cortada: 1 },
  },
  { // 4 — zonas de obras
    distancia: 450, intervalo: [58, 78], trocaDeFaixa: 0.25,
    pesos: { simples: 3, duplo: 3, slalom: 2, oleo: 2, caminhao: 2, moto: 2, cortada: 2, obras: 2 },
  },
  { // 5 — escadas de carros
    distancia: 680, intervalo: [52, 72], trocaDeFaixa: 0.3,
    pesos: { simples: 2, duplo: 3, slalom: 2, oleo: 2, caminhao: 3, moto: 3, cortada: 2, obras: 2, escada: 2 },
  },
  { // 6
    distancia: 950, intervalo: [46, 64], trocaDeFaixa: 0.35,
    pesos: { simples: 2, duplo: 3, slalom: 2, oleo: 2, caminhao: 3, moto: 3, cortada: 3, obras: 3, escada: 3 },
  },
  { // 7
    distancia: 1300, intervalo: [42, 58], trocaDeFaixa: 0.4,
    pesos: { simples: 1, duplo: 3, slalom: 2, oleo: 3, caminhao: 3, moto: 4, cortada: 3, obras: 3, escada: 3 },
  },
  { // 8 — máximo
    distancia: 1700, intervalo: [38, 52], trocaDeFaixa: 0.45,
    pesos: { simples: 1, duplo: 4, slalom: 2, oleo: 3, caminhao: 4, moto: 4, cortada: 4, obras: 3, escada: 4 },
  },
];

// Quantos quadros o aviso "NÍVEL N" fica na tela
const AVISO_DE_NIVEL = 150;

function calcularNivel(distancia) {
  let nivel = 1;

  NIVEIS.forEach((n, i) => {
    if (distancia >= n.distancia) nivel = i + 1;
  });

  return nivel;
}

function configuracaoDoNivel() {
  return NIVEIS[Math.min(gameState.nivel, NIVEIS.length) - 1];
}

// Sobe de nível quando a distância permite e conta o tempo do aviso
function atualizarNivel(dt) {
  const nivel = calcularNivel(gameState.worldDistance);

  if (nivel > gameState.nivel) {
    gameState.nivel = nivel;
    gameState.nivelAviso = AVISO_DE_NIVEL;
  }

  if (gameState.nivelAviso > 0) gameState.nivelAviso -= dt;
}
