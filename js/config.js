// js/config.js
// Configuração principal do Retro Turbo Racer.
// Define o canvas, as referências da interface e o estado global.
// A matemática de perspectiva fica exclusivamente em js/pista/perspectiva.js.

// =====================================================
// CANVAS
// =====================================================

// Dimensões lógicas: todo o desenho usa estas coordenadas (16:9).
const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;

// Resolução interna do canvas (múltiplo de 640×360). Começa em 1,5 e é ajustada
// por layout/responsivo.js conforme o tamanho e a densidade da tela.
let RENDER_SCALE = 1.5;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = Math.round(GAME_WIDTH * RENDER_SCALE);
canvas.height = Math.round(GAME_HEIGHT * RENDER_SCALE);

// =====================================================
// INTERFACE
// =====================================================

const scoreElement = document.getElementById("score");
const speedometerElement = document.getElementById("speedometer");
const turboBar = document.getElementById("turboBar");
const turboPercentage = document.getElementById("turboPercentage");

const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const finalExtrasElement = document.getElementById("finalExtras");
const restartBtn = document.getElementById("restartBtn");

const pauseScreen = document.getElementById("pauseScreen");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");

// =====================================================
// ESTADO GLOBAL
// =====================================================

const gameState = {
  score: 0,

  baseSpeed: 5,
  gameSpeed: 5,

  isTurboActive: false,
  turboEnergy: 100,

  isGameOver: false,
  isPaused: false,

  // Distância total percorrida no mundo (unidades de perspectiva).
  // Alimenta faixas do asfalto, cenário e nuvens.
  worldDistance: 0,

  // Intensidade visual da velocidade (0 a 1) — vinheta e linhas de vento.
  speedEffect: 0,

  // Quadros restantes da animação de batida antes do Game Over.
  crashFrames: 0,

  // Nível de dificuldade atual (dificuldade/niveis.js) e tempo do aviso na tela
  nivel: 1,
  nivelAviso: 0,
};

// Fator que converte gameSpeed em unidades de mundo por quadro.
// gameSpeed 5 (120 km/h) → ~0,115 unidades por quadro.
const WORLD_SPEED_FACTOR = 0.023;

// Conversão de gameSpeed para km/h exibido.
const KMH_PER_SPEED = 24;

// =====================================================
// JOGADOR
// =====================================================

const player = {
  // Caixa de desenho em pixels lógicos (derivada de worldX a cada quadro).
  x: GAME_WIDTH / 2 - 35,
  y: GAME_HEIGHT - 107,
  width: 70,
  height: 95,

  // Posição lateral real no mundo: -1 = centro da faixa esquerda,
  // 0 = centro da pista, 1 = centro da faixa direita.
  worldX: 0,

  // Velocidade lateral em pixels por quadro (medida na profundidade do jogador).
  speedX: 6,
  speedY: 6,

  // Inclinação visual suavizada ao esterçar (-1 a 1).
  steer: 0,

  // Derrapagem no óleo (sistemas/derrapagem.js): quadros restantes e lado
  derrapagem: 0,
  derrapagemDir: 1,
};

// Larguras visuais dos veículos em unidades de mundo (1 unidade = 1 faixa).
// A hitbox horizontal é sempre 84% desta largura visual.
const PLAYER_WORLD_WIDTH = 0.54;
const ENEMY_WORLD_WIDTH = 0.5;
const POLICE_WORLD_WIDTH = 0.52;
const HITBOX_WIDTH_FACTOR = 0.84;
