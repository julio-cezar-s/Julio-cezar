/* js/powerups/feedback.js
   Feedback visual dos power-ups: texto ao coletar, estilhaços do escudo
   e brilho dourado do "pontos x2".
*/

const popupsDePowerUp = [];
const aneisDeEscudo = [];

const DURACAO_DO_POPUP_DE_POWERUP = 70;

function limparFeedbackDePowerUps() {
  popupsDePowerUp.length = 0;
  aneisDeEscudo.length = 0;
}

// ----- Coleta -----
function emitirFeedbackDeColeta(def) {
  const caixa = obterCaixaDoJogador();

  // Textos antigos sobem para dar lugar ao novo
  popupsDePowerUp.forEach((p) => { p.y -= 20; });

  popupsDePowerUp.push({
    // Traduzido ao desenhar (o idioma pode mudar com o texto na tela)
    rotulo: def.rotulo,
    energia: def.energia,
    x: caixa.cx,
    y: caixa.y - 8,
    vida: DURACAO_DO_POPUP_DE_POWERUP,
    cor: def.cor,
  });

  // Anel que se expande a partir do carro
  aneisDeEscudo.push({ x: caixa.cx, y: caixa.y + caixa.h * 0.5, raio: caixa.w * 0.4, vida: 24, vidaMax: 24, cor: def.cor });

  for (let i = 0; i < 14; i++) {
    const ang = Math.random() * Math.PI * 2;
    const vida = 16 + Math.random() * 10;

    criarParticula({
      x: caixa.cx, y: caixa.y + caixa.h * 0.5,
      vx: Math.cos(ang) * (1 + Math.random() * 2.5),
      vy: Math.sin(ang) * (1 + Math.random() * 2.5),
      vida, vidaMax: vida,
      tamanho: 1.2 + Math.random() * 1.4,
      cresce: -0.04,
      cor: i % 2 === 0 ? "#ffffff" : def.cor,
      tipo: "fagulha",
    });
  }
}

// ----- Escudo quebrando -----
function emitirQuebraDeEscudo() {
  const caixa = obterCaixaDoJogador();
  const cor = TIPOS_DE_POWERUP.escudo.cor;

  aneisDeEscudo.push({ x: caixa.cx, y: caixa.y + caixa.h * 0.5, raio: caixa.w * 0.7, vida: 30, vidaMax: 30, cor });

  for (let i = 0; i < 30; i++) {
    const ang = Math.random() * Math.PI * 2;
    const vida = 20 + Math.random() * 16;

    criarParticula({
      x: caixa.cx + Math.cos(ang) * caixa.w * 0.6,
      y: caixa.y + caixa.h * 0.5 + Math.sin(ang) * caixa.h * 0.5,
      vx: Math.cos(ang) * (1.5 + Math.random() * 3),
      vy: Math.sin(ang) * (1.5 + Math.random() * 3),
      vida, vidaMax: vida,
      tamanho: 1.4 + Math.random() * 2,
      cresce: -0.05,
      cor: i % 3 === 0 ? "#ffffff" : cor,
      tipo: "fagulha",
      gravidade: 0.04,
    });
  }
}

// Batida ignorada durante a invulnerabilidade: só umas faíscas
function emitirImpactoSemDano() {
  const caixa = obterCaixaDoJogador();

  for (let i = 0; i < 8; i++) {
    const vida = 12 + Math.random() * 8;

    criarParticula({
      x: caixa.cx + (Math.random() - 0.5) * caixa.w,
      y: caixa.y + caixa.h * 0.3,
      vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3,
      vida, vidaMax: vida, tamanho: 1.2, cresce: -0.04,
      cor: "#9fd0ff", tipo: "fagulha",
    });
  }
}

// ----- Pontos x2: faíscas douradas subindo dos lados do carro -----
function emitirBrilhoDoDobro(dt) {
  if (powerUps.dobro <= 0 || Math.random() > 0.3 * dt) return;

  const caixa = obterCaixaDoJogador();
  const lado = Math.random() < 0.5 ? -1 : 1;
  const vida = 22 + Math.random() * 14;

  criarParticula({
    x: caixa.cx + lado * caixa.w * (0.45 + Math.random() * 0.15),
    y: caixa.y + caixa.h * (0.3 + Math.random() * 0.5),
    vx: lado * 0.2, vy: -0.8 - Math.random() * 0.8,
    vida, vidaMax: vida, tamanho: 1.3, cresce: -0.03,
    cor: "#ffd23f", tipo: "fagulha",
  });
}

// ----- Animação e desenho -----
function atualizarFeedbackDePowerUps(dt) {
  for (let i = popupsDePowerUp.length - 1; i >= 0; i--) {
    const p = popupsDePowerUp[i];

    p.y -= 0.5 * dt;
    p.vida -= dt;

    if (p.vida <= 0) popupsDePowerUp.splice(i, 1);
  }

  for (let i = aneisDeEscudo.length - 1; i >= 0; i--) {
    aneisDeEscudo[i].vida -= dt;

    if (aneisDeEscudo[i].vida <= 0) aneisDeEscudo.splice(i, 1);
  }
}

function desenharFeedbackDePowerUps() {
  ctx.save();

  // Anéis que se expandem e somem
  aneisDeEscudo.forEach((a) => {
    const t = 1 - a.vida / a.vidaMax;

    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.strokeStyle = a.cor;
    ctx.lineWidth = 3 * (1 - t) + 1;
    ctx.beginPath();
    ctx.ellipse(a.x, a.y, a.raio * (1 + t * 1.4), a.raio * 0.8 * (1 + t * 1.4), 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Textos
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  // Texto com pelo menos ~9 px reais de altura, mesmo com o canvas reduzido
  const tamanhoBase = Math.min(22, Math.max(15, 9 / escalaDeExibicaoDoCanvas()));

  popupsDePowerUp.forEach((p) => {
    const tempo = DURACAO_DO_POPUP_DE_POWERUP - p.vida;
    const escala = 1 + 0.35 * Math.max(0, 1 - tempo / 8);

    ctx.globalAlpha = Math.min(1, p.vida / 20);
    ctx.font = `900 ${tamanhoBase * escala}px ${HUD_FONTE}`;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(8,12,24,0.92)";
    const texto = traduzir(p.rotulo, { energia: p.energia });

    ctx.strokeText(texto, p.x, p.y);
    ctx.fillStyle = p.cor;
    ctx.fillText(texto, p.x, p.y);
  });

  ctx.restore();
}
