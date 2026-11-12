/* js/quase-colisao/feedback.js
   Feedback da quase-colisão: texto que sobe ao lado do carro, faíscas
   (nas mais apertadas), leve tremor de câmera e som.
*/

const popupsDeQuaseColisao = [];
const DURACAO_DO_POPUP = 60;
const ESPACO_ENTRE_POPUPS = 34;   // pixels que o texto antigo sobe a cada novo

function limparFeedbackDeQuaseColisao() {
  popupsDeQuaseColisao.length = 0;
}

// lado: +1 o obstáculo passou pela direita, -1 pela esquerda
function emitirFeedbackDeQuaseColisao(nivel, pontos, multiplicador, lado) {
  const caixa = obterCaixaDoJogador();
  const x = caixa.cx + lado * caixa.w * 0.85;

  // Os textos anteriores sobem para dar lugar ao novo (nunca se sobrepõem)
  popupsDeQuaseColisao.forEach((antigo) => { antigo.y -= ESPACO_ENTRE_POPUPS; });

  popupsDeQuaseColisao.push({
    // O nome do nível (RENTE/PERTO/QUASE) é a chave; o texto é traduzido ao desenhar
    nivel: nivel.nome,
    detalhe: multiplicador > 1 ? `+${pontos}  x${multiplicador}` : `+${pontos}`,
    x,
    y: caixa.y + caixa.h * 0.1,
    vida: DURACAO_DO_POPUP,
    cor: nivel.cor,
    tamanho: nivel.nome === "RENTE" ? 17 : nivel.nome === "PERTO" ? 14 : 12,
  });

  // Faíscas no ponto onde os carros quase se tocam
  for (let i = 0; i < nivel.faiscas; i++) {
    const vida = 14 + Math.random() * 10;

    criarParticula({
      x: caixa.cx + lado * caixa.w * 0.5,
      y: caixa.y + caixa.h * (0.45 + Math.random() * 0.4),
      vx: lado * (0.5 + Math.random() * 2.4),
      vy: (Math.random() - 0.6) * 2.2,
      vida, vidaMax: vida,
      tamanho: 1 + Math.random() * 1.2,
      cresce: -0.04,
      cor: i % 2 === 0 ? "#ffffff" : nivel.cor,
      tipo: "fagulha",
      gravidade: 0.05,
    });
  }

  gameState.tremor = Math.max(gameState.tremor, nivel.nome === "RENTE" ? 2.5 : 1);

  if (typeof tocarSomDeQuaseColisao === "function") {
    tocarSomDeQuaseColisao(nivel, multiplicador);
  }
}

function atualizarFeedbackDeQuaseColisao(dt) {
  for (let i = popupsDeQuaseColisao.length - 1; i >= 0; i--) {
    const p = popupsDeQuaseColisao[i];

    p.y -= 0.55 * dt;
    p.vida -= dt;

    if (p.vida <= 0) popupsDeQuaseColisao.splice(i, 1);
  }
}

function desenharFeedbackDeQuaseColisao() {
  if (!popupsDeQuaseColisao.length) return;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  popupsDeQuaseColisao.forEach((p) => {
    const tempo = DURACAO_DO_POPUP - p.vida;
    const alfa = Math.min(1, p.vida / 18);

    // "Pop": começa maior e assenta nos primeiros quadros
    const escala = 1 + 0.4 * Math.max(0, 1 - tempo / 8);
    const tamanho = p.tamanho * escala;

    // Mantém o texto dentro da tela
    const x = Math.max(55, Math.min(GAME_WIDTH - 55, p.x));

    ctx.globalAlpha = alfa;

    ctx.font = `900 ${tamanho}px ${HUD_FONTE}`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(8,12,24,0.9)";
    const titulo = traduzir("quase.aviso", { nome: traduzir(`quase.nivel.${p.nivel}`) });

    ctx.strokeText(titulo, x, p.y);
    ctx.fillStyle = p.cor;
    ctx.fillText(titulo, x, p.y);

    ctx.font = `800 ${tamanho * 0.72}px ${HUD_FONTE}`;
    ctx.strokeText(p.detalhe, x, p.y + tamanho * 0.9);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(p.detalhe, x, p.y + tamanho * 0.9);
  });

  ctx.restore();
}
