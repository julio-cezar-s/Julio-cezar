/* js/pista/perspectiva.js
   Sistema central de perspectiva do Retro Turbo Racer.

   TODOS os módulos (pista, acostamentos, faixas, cenário, carros,
   partículas) projetam o mundo por aqui. Não existe outra fórmula
   de perspectiva no projeto.

   Modelo de mundo:
     - worldX: posição lateral em unidades de faixa (1 unidade = 1 faixa).
       A pista tem 3 faixas: vai de -1,5 a +1,5.
     - altura: unidades de faixa acima do asfalto.
     - z: distância da câmera. z = 1 corresponde à borda inferior da tela.

   Projeção:  escala s = 1 / z
     x_tela = centro + (worldX - camera.x + desvioLateral(z)) * CAMERA_SCALE * s
     y_tela = horizonte + s * (altura da tela abaixo do horizonte)
              - (altura + elevacaoRelativa(z)) * CAMERA_SCALE * s
   A pista converge para o ponto de fuga no horizonte, como numa
   câmera real.

   CURVAS E MORROS: desvioLateral(z) e elevacaoRelativa(z) vêm de
   js/pista/trajeto/perfil.js. Como TODO desenho passa por projX/projY,
   o traçado da estrada se aplica a pista, cenário e carros de uma vez.
*/

// =====================================================
// CONSTANTES DA CÂMERA
// =====================================================

const ROAD_HORIZON = 118;
const CAMERA_SCALE = 175;     // pixels por unidade de mundo em s = 1
const LANE_COUNT = 3;
const ROAD_HALF_WIDTH = LANE_COUNT / 2;

const Z_NEAR = 1;
const Z_FAR = 38;
const Z_MIN_DRAW = 0.8;       // abaixo disso já está fora da tela

// Altura da câmera em unidades de faixa (derivada da geometria).
const CAMERA_HEIGHT = (GAME_HEIGHT - ROAD_HORIZON) / CAMERA_SCALE;

// A câmera acompanha parcialmente o jogador, dando paralaxe real.
const CAMERA_FOLLOW = 0.4;
// x: deslocamento lateral seguindo o jogador
// giro: deslizamento do horizonte quando a pista curva ao longe (pixels)
const camera = { x: 0, giro: 0 };

// Geometria lateral da estrada (em unidades de mundo).
const ROAD = {
  half: ROAD_HALF_WIDTH,
  edgeLineOuter: 1.44,
  edgeLineInner: 1.37,
  kerbOuter: 1.64,
  shoulderOuter: 2.25,
  laneLine: 0.5,
};

// Linha de contato dos pneus do jogador com o asfalto (y lógico) e a
// profundidade correspondente. É a referência de colisão e de escala.
const PLAYER_GROUND_Y = GAME_HEIGHT - 20;
const PLAYER_Z = 1 / scaleAtY(PLAYER_GROUND_Y);

// =====================================================
// PROJEÇÃO
// =====================================================

function scaleAtY(y) {
  return (y - ROAD_HORIZON) / (GAME_HEIGHT - ROAD_HORIZON);
}

function projScale(z) {
  return Z_NEAR / Math.max(z, 0.05);
}

// y de um ponto do mundo na escala s, com altura h acima do asfalto
function projY(s, h = 0) {
  const z = Z_NEAR / s;

  return ROAD_HORIZON + s * (GAME_HEIGHT - ROAD_HORIZON)
    - (h + elevacaoRelativa(z)) * CAMERA_SCALE * s
    + termoDeArfagem(s);
}

// Inclinação da câmera nos morros: desloca o horizonte, mas é zero na
// profundidade do jogador, então o carro nunca "descola" do asfalto.
const ESCALA_DO_JOGADOR = Z_NEAR / PLAYER_Z;

function termoDeArfagem(s) {
  return perfil.arfagem * Math.max(0, 1 - s / ESCALA_DO_JOGADOR);
}

// Linha do horizonte na tela, já com a inclinação da câmera
function horizonteAtual() {
  return ROAD_HORIZON + perfil.arfagem;
}

function projX(worldX, s) {
  const z = Z_NEAR / s;

  return GAME_WIDTH / 2 + (worldX - camera.x + desvioLateral(z)) * CAMERA_SCALE * s;
}

// comprimento em pixels de uma medida do mundo na escala s
function projLen(len, s) {
  return len * CAMERA_SCALE * s;
}

// Fator de neblina por distância (0 perto, 1 no fundo)
function fogAmount(z, start = 10) {
  return Math.max(0, Math.min(1, (z - start) / (Z_FAR - start)));
}

// =====================================================
// JOGADOR NO MUNDO
// =====================================================

// px da câmera relativos ao jogador: a câmera segue CAMERA_FOLLOW do deslocamento
function atualizarCameraPeloJogador() {
  camera.x = player.worldX * CAMERA_FOLLOW;
}

// =====================================================
// FAIXAS (BANDAS) ALONGADAS NA PISTA
// =====================================================

// Percorre bandas de comprimento fixo no mundo, ancoradas na distância
// percorrida (por isso "rolam" em direção à câmera).
// callback(indiceAbsoluto, zPerto, zLonge)
function percorrerFaixas(comprimento, callback, zMax = Z_FAR) {
  const dist = gameState.worldDistance;
  let k = Math.floor((dist + Z_MIN_DRAW) / comprimento);

  for (;; k++) {
    const zA = k * comprimento - dist;
    if (zA >= zMax) break;

    const zB = zA + comprimento;
    if (zB <= Z_MIN_DRAW) continue;

    callback(k, Math.max(zA, Z_MIN_DRAW), Math.min(zB, zMax));
  }
}

// Preenche (com o fillStyle atual) o trecho do solo entre x0 e x1
// (unidades de mundo) e as profundidades zA (perto) e zB (longe).
//
// Em curvas e morros o trecho é dividido em fatias, desenhadas das mais
// distantes para as mais próximas, para acompanhar a forma da estrada.
function preencherFaixa(x0, x1, zA, zB) {
  const extensao = zB - zA;
  if (extensao <= 0) return;

  // Em pista reta e plana uma única fatia basta
  if (perfil.reta) {
    preencherFatia(x0, x1, zA, zB);
    return;
  }

  const passoMax = 1 + zA * 0.2;
  const fatias = Math.max(1, Math.ceil(extensao / passoMax));
  const dz = extensao / fatias;

  for (let k = fatias - 1; k >= 0; k--) {
    preencherFatia(x0, x1, zA + k * dz, zA + (k + 1) * dz);
  }
}

function preencherFatia(x0, x1, zA, zB) {
  const sA = projScale(zA);
  const sB = projScale(zB);

  const yA = projY(sA);
  const yB = projY(sB) - 0.6; // leve sobreposição evita fendas entre fatias

  // Atrás de um morro: só aparece a parte acima da linha de cobertura
  const cobertura = coberturaEm(zA);
  const cortar = yA > cobertura + 0.5;

  if (cortar) {
    if (yB >= cobertura) return;   // totalmente escondida

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, GAME_WIDTH, cobertura);
    ctx.clip();
  }

  ctx.beginPath();
  ctx.moveTo(projX(x0, sA), yA);
  ctx.lineTo(projX(x1, sA), yA);
  ctx.lineTo(projX(x1, sB), yB);
  ctx.lineTo(projX(x0, sB), yB);
  ctx.closePath();
  ctx.fill();

  if (cortar) ctx.restore();
}

// Um objeto em z cuja base está em yBase fica escondido atrás de um morro?
// Devolve a linha de corte (ou null se está totalmente visível).
function linhaDeCorteDoObjeto(z, yBase) {
  const cobertura = coberturaEm(z);

  return yBase > cobertura + 0.5 ? cobertura : null;
}

// Ruído determinístico estável (mesmo número → mesmo resultado).
function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Utilitários de cor compartilhados por cenário e carros.
function hexParaRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function misturarCor(a, b, t) {
  const A = hexParaRgb(a);
  const B = hexParaRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${
    Math.round(A[1] + (B[1] - A[1]) * t)},${
    Math.round(A[2] + (B[2] - A[2]) * t)})`;
}

function clarearCor(hex, t) { return misturarCor(hex, "#ffffff", t); }
function escurecerCor(hex, t) { return misturarCor(hex, "#000000", t); }
