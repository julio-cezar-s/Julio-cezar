// js/entities.js
// Retro Turbo Racer — dados e sistemas auxiliares: listas de entidades,
// opções de partículas e o sistema de partículas.

// =====================================================
// ELEMENTOS DO JOGO
// =====================================================

const obstacles = [];
const particles = [];

const MAX_PARTICULAS = 240;

// =====================================================
// OPÇÃO DE PARTÍCULAS (com cache)
// =====================================================

let cacheParticulas = { valor: true, lidoEm: -9999 };

function particulasAtivadas() {
  const agora = performance.now();

  if (agora - cacheParticulas.lidoEm > 400) {
    let valor = true;

    try {
      const opcoes = JSON.parse(localStorage.getItem("retroTurboOptions"));
      valor = opcoes?.particles !== false;
    } catch {
      valor = true;
    }

    cacheParticulas = { valor, lidoEm: agora };
  }

  return cacheParticulas.valor;
}

// Chamado pelas opções após salvar, para refletir a mudança na hora
function invalidarCacheOpcoes() {
  cacheParticulas.lidoEm = -9999;
}

// =====================================================
// CRIAÇÃO DE PARTÍCULAS
// =====================================================

function criarParticula(dados) {
  if (!particulasAtivadas()) return;
  if (particles.length >= MAX_PARTICULAS) particles.shift();

  particles.push({
    x: 0, y: 0, vx: 0, vy: 0,
    vida: 1, vidaMax: 1,
    tamanho: 2, cresce: 0,
    cor: "#00e5ff", tipo: "chama", gravidade: 0,
    ...dados,
  });
}

// Compatibilidade com a assinatura antiga: chama de turbo
function addParticle(x, y, color = "#00e5ff") {
  emitirChamaTurbo(x, y, color);
}

function emitirChamaTurbo(x, y, cor = "#00e5ff") {
  const vida = 14 + Math.random() * 8;

  criarParticula({
    x: x + (Math.random() - 0.5) * 3,
    y,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 1.6 + Math.random() * 1.8,
    vida, vidaMax: vida,
    tamanho: 2 + Math.random() * 2.2,
    cresce: 0.22,
    cor,
    tipo: "chama",
  });

  // núcleo quente
  criarParticula({
    x, y,
    vx: (Math.random() - 0.5) * 0.4,
    vy: 1.2 + Math.random() * 1.2,
    vida: vida * 0.6, vidaMax: vida * 0.6,
    tamanho: 1.4 + Math.random(),
    cresce: 0.1,
    cor: "#fff3c2",
    tipo: "chama",
  });
}

function emitirExplosao(x, y) {
  for (let i = 0; i < 46; i++) {
    const ang = Math.random() * Math.PI * 2;
    const vel = 1 + Math.random() * 5;
    const vida = 22 + Math.random() * 26;

    criarParticula({
      x, y,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel * 0.8 - 1,
      vida, vidaMax: vida,
      tamanho: 1 + Math.random() * 2.2,
      cresce: -0.02,
      cor: i % 3 === 0 ? "#fff1a8" : i % 3 === 1 ? "#ff9a2e" : "#ff4a2a",
      tipo: "fagulha",
      gravidade: 0.12,
    });
  }

  for (let i = 0; i < 18; i++) {
    const vida = 40 + Math.random() * 30;

    criarParticula({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 1.3,
      vy: -0.4 - Math.random() * 1.2,
      vida, vidaMax: vida,
      tamanho: 5 + Math.random() * 7,
      cresce: 0.35,
      cor: "#2a2d34",
      tipo: "fumaca",
    });
  }
}

// =====================================================
// ATUALIZAÇÃO E DESENHO
// =====================================================

function atualizarParticulas(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravidade * dt;
    p.tamanho = Math.max(0.2, p.tamanho + p.cresce * dt);
    p.vida -= dt;

    if (p.vida <= 0 || p.y > GAME_HEIGHT + 20) {
      particles.splice(i, 1);
    }
  }
}

function desenharParticulas() {
  if (particles.length === 0) return;

  ctx.save();

  // Fumaça por baixo, brilho por cima
  ctx.globalCompositeOperation = "source-over";

  particles.forEach((p) => {
    if (p.tipo !== "fumaca") return;

    const t = p.vida / p.vidaMax;
    ctx.globalAlpha = Math.max(0, t) * 0.5;
    ctx.fillStyle = p.cor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = "lighter";

  particles.forEach((p) => {
    if (p.tipo === "fumaca") return;

    const t = Math.max(0, p.vida / p.vidaMax);
    ctx.globalAlpha = t * (p.tipo === "chama" ? 0.85 : 1);
    ctx.fillStyle = p.cor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
