/* js/sistemas/derrapagem.js
   Derrapagem ao passar numa mancha de óleo: por um instante o carro
   perde boa parte do controle e é puxado para um dos lados.
*/

const DERRAPAGEM = {
  duracao: 70,         // quadros
  empurrao: 0.011,     // deslocamento lateral por quadro (unidades de mundo)
  controle: 0.4,       // fração do controle que sobra durante a derrapagem
};

function iniciarDerrapagem() {
  if (typeof quebrarSequencia === "function") quebrarSequencia();
  if (typeof penalizarCombo === "function") penalizarCombo("derrapagem");

  player.derrapagem = DERRAPAGEM.duracao;

  // Escorrega para o lado em que há mais espaço (ou sorteia no centro)
  player.derrapagemDir = player.worldX > 0.4 ? -1
    : player.worldX < -0.4 ? 1
      : (Math.random() < 0.5 ? -1 : 1);

  if (typeof gerenciadorAudio !== "undefined") gerenciadorAudio.tocar("freada");
}

// Chamado a cada quadro. Devolve o fator de controle do jogador (0 a 1).
function atualizarDerrapagem(dt) {
  if (player.derrapagem <= 0) return 1;

  player.derrapagem -= dt;

  // Empurrão forte no começo, desvanece até o fim
  const t = Math.max(0, player.derrapagem / DERRAPAGEM.duracao);
  player.worldX += player.derrapagemDir * DERRAPAGEM.empurrao * t * dt;

  // Carro "rabeia": inclinação exagerada oscilando
  player.steer = player.derrapagemDir * Math.sin(player.derrapagem * 0.35) * 1.5 * t;

  emitirFumacaDeDerrapagem();

  return DERRAPAGEM.controle + (1 - DERRAPAGEM.controle) * (1 - t);
}

function emitirFumacaDeDerrapagem() {
  const caixa = obterCaixaDoJogador();

  [0.2, 0.8].forEach((lado) => {
    const vida = 22 + Math.random() * 10;

    criarParticula({
      x: caixa.x + caixa.w * lado,
      y: caixa.y + caixa.h * 0.9,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -0.15 - Math.random() * 0.3,
      vida, vidaMax: vida,
      tamanho: 2.5,
      cresce: 0.28,
      cor: "#cfd2d8",
      tipo: "fumaca",
    });
  });
}
