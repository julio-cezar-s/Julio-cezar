/* js/pista/trajeto/perfil.js
   O PERFIL da estrada visto da câmera, recalculado a cada quadro.

   Pega o traçado (tracado.js) e monta tabelas por profundidade z:
     - desvio[]    quanto a pista se desloca para o lado em z (curvas)
     - elevacao[]  quanto o chão está mais alto/baixo que o carro em z (morros)
     - cobertura[] linha da tela acima da qual ainda se enxerga o chão
                   (o que fica abaixo dela está escondido atrás de um morro)

   perspectiva.js consulta estas tabelas em projX() e projY(): por isso
   pista, acostamentos, cenário e carros acompanham curvas e morros sem
   nenhum cálculo extra.

   No carro do jogador (z = PLAYER_Z) o desvio é sempre 0: a câmera "gira"
   junto com a estrada, então controles e colisões continuam iguais.
*/

const PERFIL_PASSO = 0.25;     // distância entre amostras da tabela
const PERFIL_IP = 3;           // amostras antes do jogador (z menor que PLAYER_Z)
const PERFIL_Z_MAX = 64;
const PERFIL_Z0 = PLAYER_Z - PERFIL_IP * PERFIL_PASSO;
const PERFIL_N = PERFIL_IP + Math.ceil((PERFIL_Z_MAX - PLAYER_Z) / PERFIL_PASSO) + 2;

const perfil = {
  desvio: new Float32Array(PERFIL_N),
  elevacao: new Float32Array(PERFIL_N),
  cobertura: new Float32Array(PERFIL_N),

  // true quando a pista visível é reta e plana (dispensa cálculos extras)
  reta: true,

  // Inclinação da câmera em pixels: sobe a rampa → horizonte desce
  arfagem: 0,
};

// Quanto a inclinação da rampa vira pixels de arfagem
const PERFIL_ARFAGEM_FATOR = 80;

// =====================================================
// ATUALIZAÇÃO (uma vez por quadro)
// =====================================================

function atualizarPerfil() {
  const d = gameState.worldDistance;

  const ip = PERFIL_IP;
  const passo = PERFIL_PASSO;

  // ----- Curvas: integra a curvatura duas vezes a partir do jogador -----
  // inclinação = ∫ curvatura dz     desvio = ∫ inclinação dz
  perfil.desvio[ip] = 0;

  let inclinacao = 0;

  for (let i = ip + 1; i < PERFIL_N; i++) {
    const zMeio = PLAYER_Z + (i - ip - 0.5) * passo;
    const c = curvaturaEm(d + zMeio);

    perfil.desvio[i] = perfil.desvio[i - 1] + inclinacao * passo + 0.5 * c * passo * passo;
    inclinacao += c * passo;
  }

  // Antes do jogador (fora da tela): continua a parábola
  const c0 = curvaturaEm(d + PLAYER_Z);

  for (let i = 0; i < ip; i++) {
    const dz = (i - ip) * passo;
    perfil.desvio[i] = 0.5 * c0 * dz * dz;
  }

  // ----- Morros: altura do chão relativa ao carro -----
  const alturaDoJogador = elevacaoEm(d + PLAYER_Z);

  for (let i = 0; i < PERFIL_N; i++) {
    perfil.elevacao[i] = elevacaoEm(d + PERFIL_Z0 + i * passo) - alturaDoJogador;
  }

  // ----- Arfagem: a câmera acompanha a inclinação da rampa -----
  const dJogador = d + PLAYER_Z;
  const rampa = (elevacaoEm(dJogador + 1) - elevacaoEm(dJogador - 1)) / 2;

  perfil.arfagem = rampa * PERFIL_ARFAGEM_FATOR;

  // ----- Cobertura: o que um morro mais próximo esconde -----
  let maiorAltura = 0;
  let curvou = false;
  let cobertura = Infinity;

  for (let i = 0; i < PERFIL_N; i++) {
    const z = PERFIL_Z0 + i * passo;
    const s = Z_NEAR / z;

    const yDoChao = ROAD_HORIZON + s * (GAME_HEIGHT - ROAD_HORIZON)
      - perfil.elevacao[i] * CAMERA_SCALE * s + termoDeArfagem(s);

    cobertura = Math.min(cobertura, yDoChao);
    perfil.cobertura[i] = cobertura;

    if (z < Z_FAR + 6) {
      maiorAltura = Math.max(maiorAltura, Math.abs(perfil.elevacao[i]));
      curvou = curvou || Math.abs(perfil.desvio[i]) > 0.02;
    }
  }

  perfil.reta = !curvou && maiorAltura < 0.02;
}

// =====================================================
// CONSULTAS (usadas pela projeção)
// =====================================================

function interpolarPerfil(tabela, z) {
  let f = (z - PERFIL_Z0) / PERFIL_PASSO;

  if (f < 0) f = 0;
  if (f > PERFIL_N - 1.001) f = PERFIL_N - 1.001;

  const i = f | 0;

  return tabela[i] + (tabela[i + 1] - tabela[i]) * (f - i);
}

// Deslocamento lateral da pista em z (+ direita)
function desvioLateral(z) {
  return interpolarPerfil(perfil.desvio, z);
}

// Altura do chão em z em relação ao carro (+ mais alto)
function elevacaoRelativa(z) {
  return interpolarPerfil(perfil.elevacao, z);
}

// Linha da tela abaixo da qual o chão em z está escondido por um morro
function coberturaEm(z) {
  const f = (z - PERFIL_Z0) / PERFIL_PASSO;
  const i = Math.max(0, Math.min(PERFIL_N - 1, Math.floor(f)));

  return perfil.cobertura[i];
}

// =====================================================
// GIRO DO HORIZONTE
// =====================================================

// Quando a pista faz curva ao longe, céu e montanhas deslizam para o lado
// oposto, como numa câmera que acompanha a estrada. Suavizado e limitado.
function atualizarGiroDoHorizonte(dt) {
  const alvo = Math.max(-100, Math.min(100, desvioLateral(30) * 9));

  camera.giro += (alvo - camera.giro) * 0.04 * dt;
}
