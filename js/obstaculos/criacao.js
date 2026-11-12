/* js/obstaculos/criacao.js
   Cria obstáculos na pista a partir do catálogo (tipos.js).
   Quem decide QUANDO e O QUE criar é a pasta dificuldade/.
*/

// Posição lateral do centro de uma faixa (0, 1, 2 → -1, 0, +1)
function xDaFaixa(faixa) {
  return faixa - (LANE_COUNT - 1) / 2;
}

// Profundidade de surgimento: cresce com a velocidade para o jogador ter
// sempre ~1,2 s entre ver um obstáculo e chegar nele (mínimo ENEMY_Z_SPAWN).
const TEMPO_DE_REACAO = 1.2;   // segundos

function zDeSurgimento() {
  const porQuadro = gameState.baseSpeed * WORLD_SPEED_FACTOR;

  return Math.max(ENEMY_Z_SPAWN, PLAYER_Z + TEMPO_DE_REACAO * 60 * porQuadro);
}

// opcoes: faixa | x   posição (x em unidades de mundo tem prioridade)
//         velocidade  multiplicador de aproximação (senão sorteia do tipo)
//         cor         cor da carroceria (senão sorteia)
//         comportamento "trocaDeFaixa" | "zigue" | null
//         alvoForcado   a troca de faixa vai em direção ao jogador
function criarObstaculo(tipo, opcoes = {}) {
  const def = TIPOS_DE_OBSTACULO[tipo];

  const x = opcoes.x !== undefined ? opcoes.x : xDaFaixa(opcoes.faixa);
  const [vMin, vMax] = def.velocidade;

  const paleta = tipo === "truck" ? coresDeCaminhao : enemyColors;

  const zInicial = zDeSurgimento();

  const obstaculo = {
    type: tipo,

    lane: opcoes.faixa !== undefined ? opcoes.faixa : Math.round(x + (LANE_COUNT - 1) / 2),
    worldX: x,
    baseX: x,

    z: zInicial,
    prevZ: zInicial,
    zSurgimento: zInicial,   // onde surgiu (controla o fade-in)

    worldWidth: def.largura,
    speedMult: opcoes.velocidade !== undefined
      ? opcoes.velocidade
      : vMin + Math.random() * (vMax - vMin),

    color: opcoes.cor
      || (tipo === "police" ? "#f1f3f6" : paleta[Math.floor(Math.random() * paleta.length)]),

    comportamento: opcoes.comportamento || null,
    alvoForcado: !!opcoes.alvoForcado,
    estado: null,          // usado pelos comportamentos
    sinal: 0,              // pisca aceso (-1 esquerda, +1 direita)
    tempo: 0,
    fase: Math.random() * Math.PI * 2,

    atingido: false,
    chao: !!def.chao,
  };

  obstacles.push(obstaculo);

  return obstaculo;
}
