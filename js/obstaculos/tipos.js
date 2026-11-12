/* js/obstaculos/tipos.js
   CATÁLOGO de tudo que pode aparecer na pista além do jogador.
   É só dados: para criar um obstáculo novo, descreva-o aqui, escreva o
   desenho em obstaculos/desenho/ e use-o num padrão em dificuldade/padroes.js.

   Campos:
     largura       largura visual em unidades de faixa (hitbox = largura × hitbox)
     proporcao     altura ÷ largura do desenho
     profundidade  meia-soma de profundidade usada na colisão (em z)
     hitbox        fração da largura visual que realmente colide
     duro          true = pode fechar uma faixa (conta para "nunca bloquear tudo")
     efeito        o que acontece ao encostar: "batida" | "tropeco" | "derrapagem"
     velocidade    [mín, máx] multiplicador de aproximação (1 = parado no asfalto)
     chao          true = marca pintada no asfalto (desenhada sob o carro)
*/

// Profundidade em que os obstáculos surgem (na névoa, ao longe)
const ENEMY_Z_SPAWN = 9;

const enemyColors = [
  "#e53935",
  "#1e7be0",
  "#eef1f4",
  "#2b3340",
  "#f5a60f",
  "#8e35c4",
  "#17a673",
];

const coresDeCaminhao = ["#c8372d", "#2d6fb5", "#e0a526", "#3a8a4f"];

const TIPOS_DE_OBSTACULO = {
  // ----- Veículos comuns -----
  civilian: {
    largura: ENEMY_WORLD_WIDTH, proporcao: 0.9, profundidade: 0.15,
    hitbox: HITBOX_WIDTH_FACTOR, duro: true, efeito: "batida",
    velocidade: [0.75, 1.2],
  },

  police: {
    largura: POLICE_WORLD_WIDTH, proporcao: 0.9, profundidade: 0.15,
    hitbox: HITBOX_WIDTH_FACTOR, duro: true, efeito: "batida",
    velocidade: [0.75, 1.2],
  },

  // ----- Caminhão de carga larga: ocupa duas faixas, é lento -----
  truck: {
    largura: 1.5, proporcao: 0.66, profundidade: 0.22,
    hitbox: HITBOX_WIDTH_FACTOR, duro: true, efeito: "batida",
    velocidade: [0.6, 0.75],
  },

  // ----- Moto: estreita, rápida e costuma costurar entre faixas -----
  motorcycle: {
    largura: 0.3, proporcao: 1.55, profundidade: 0.12,
    hitbox: HITBOX_WIDTH_FACTOR, duro: true, efeito: "batida",
    velocidade: [1.3, 1.6],
  },

  // ----- Cone: não destrói, mas faz o carro perder ritmo -----
  cone: {
    largura: 0.2, proporcao: 1.15, profundidade: 0.08,
    hitbox: HITBOX_WIDTH_FACTOR, duro: false, efeito: "tropeco",
    velocidade: [1, 1],
  },

  // ----- Mancha de óleo: o carro perde o controle por um instante -----
  oil: {
    largura: 0.95, proporcao: 0, profundidade: 0.4,
    hitbox: 1, duro: false, efeito: "derrapagem",
    velocidade: [1, 1], chao: true,
  },

  // ----- Barreira de obras: fecha uma faixa de vez -----
  barrier: {
    largura: 0.85, proporcao: 0.5, profundidade: 0.15,
    hitbox: HITBOX_WIDTH_FACTOR, duro: true, efeito: "batida",
    velocidade: [1, 1],
  },
};

// Definição de um obstáculo em jogo (tipo desconhecido vira carro comum)
function tipoDe(obstaculo) {
  return TIPOS_DE_OBSTACULO[obstaculo.type] || TIPOS_DE_OBSTACULO.civilian;
}
