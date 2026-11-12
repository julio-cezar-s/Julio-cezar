/* js/obstaculos/comportamentos.js
   Como cada obstáculo se move DENTRO da pista (além de se aproximar):
     "trocaDeFaixa"  pisca, espera e troca de faixa com aviso
     "zigue"         costura de um lado para o outro (motos)

   A troca de faixa é sempre justa: só começa se houver tempo para o
   jogador reagir depois que ela terminar.
*/

const ZIGUE = { amplitude: 0.28, velocidade: 0.045 };

// Fases da troca de faixa, em quadros (60 = 1 s)
const TROCA = {
  sinal: 22,              // pisca-alerta antes de se mover
  movimento: 26,          // duração do deslocamento lateral
  tempoMinimo: 88,        // quadros até chegar ao jogador, para valer a pena
};

function atualizarComportamento(o, dt) {
  if (o.comportamento === "trocaDeFaixa") atualizarTrocaDeFaixa(o, dt);
  else if (o.comportamento === "zigue") atualizarZigue(o, dt);
}

// =====================================================
// ZIGUE-ZAGUE (motos)
// =====================================================

function atualizarZigue(o, dt) {
  o.tempo += dt;

  const limite = ROAD_HALF_WIDTH - o.worldWidth / 2 - 0.1;
  const x = o.baseX + Math.sin(o.fase + o.tempo * ZIGUE.velocidade) * ZIGUE.amplitude;

  o.worldX = Math.max(-limite, Math.min(limite, x));
}

// =====================================================
// TROCA DE FAIXA
// =====================================================

function atualizarTrocaDeFaixa(o, dt) {
  if (!o.estado) o.estado = iniciarTroca(o);

  const e = o.estado;

  if (e.fase === "fim") return;

  e.t += dt;

  if (e.fase === "sinal") {
    if (e.t >= TROCA.sinal) {
      e.fase = "movimento";
      e.t = 0;
      e.de = o.worldX;
    }

    return;
  }

  // movimento: desliza suavemente até a faixa de destino
  const k = suavizar(0, 1, e.t / TROCA.movimento);

  o.worldX = e.de + (e.para - e.de) * k;
  o.baseX = o.worldX;

  if (e.t >= TROCA.movimento) {
    e.fase = "fim";
    o.sinal = 0;
    o.lane = Math.round(o.worldX + (LANE_COUNT - 1) / 2);
  }
}

// Decide se (e para onde) o carro vai trocar de faixa
function iniciarTroca(o) {
  const cancelada = { fase: "fim", t: 0 };

  // Quadros que faltam para chegar ao jogador, sem turbo
  const porQuadro = gameState.baseSpeed * WORLD_SPEED_FACTOR * o.speedMult;
  const quadrosAteOJogador = (o.z - PLAYER_Z) / porQuadro;

  if (quadrosAteOJogador < TROCA.tempoMinimo) return cancelada;

  const alvo = escolherFaixaAlvo(o);
  if (alvo === null) return cancelada;

  const para = xDaFaixa(alvo);
  o.sinal = Math.sign(para - o.worldX);

  return { fase: "sinal", t: 0, de: o.worldX, para };
}

// Faixa vizinha livre (ou a do jogador, no caso da "cortada")
function escolherFaixaAlvo(o) {
  const atual = o.lane;
  const vizinhas = [atual - 1, atual + 1].filter((f) => f >= 0 && f < LANE_COUNT);

  let candidatas = vizinhas;

  if (o.alvoForcado) {
    const doJogador = faixaDoJogador();
    if (vizinhas.includes(doJogador)) candidatas = [doJogador];
  }

  // Só troca se a faixa de destino estiver vazia (sem carro por perto)
  // e se isso não fechar a pista inteira.
  const livres = candidatas.filter((faixa) => {
    const bloqueadas = faixasBloqueadasEm(o.z - 2.4, o.z + 2.4, o);

    if (bloqueadas.has(faixa)) return false;

    bloqueadas.add(faixa);
    return bloqueadas.size < LANE_COUNT;
  });

  if (!livres.length) return null;

  return livres[Math.floor(Math.random() * livres.length)];
}
