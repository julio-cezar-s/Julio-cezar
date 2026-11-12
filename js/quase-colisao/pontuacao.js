/* js/quase-colisao/pontuacao.js
   Pontuação e SEQUÊNCIA das quase-colisões.

   Recompensas por quase-colisão:
     - pontos do nível (RENTE / PERTO / QUASE) × multiplicador da sequência
     - um pouco de energia de turbo (risco alimenta o turbo)

   Sequência: quase-colisões encadeadas dentro da janela de tempo aumentam o
   multiplicador. Bater num cone ou derrapar no óleo quebra a sequência.
   (O COMBO de pontuação, que vale para a partida toda, fica em combo/.)
*/

const quase = {
  sequencia: 0,        // quase-colisões seguidas
  temporizador: 0,     // quadros restantes para manter a sequência
  total: 0,            // quantas houve na partida
  melhorSequencia: 0,
  pontos: 0,           // pontos ganhos só com quase-colisões
};

function reiniciarQuaseColisoes() {
  quase.sequencia = 0;
  quase.temporizador = 0;
  quase.total = 0;
  quase.melhorSequencia = 0;
  quase.pontos = 0;

  if (typeof limparFeedbackDeQuaseColisao === "function") limparFeedbackDeQuaseColisao();
}

function multiplicadorDaSequencia() {
  return Math.min(QUASE_COLISAO.multiplicadorMax, Math.max(1, quase.sequencia));
}

function registrarQuaseColisao(nivel, obstaculo) {
  quase.sequencia = quase.temporizador > 0 ? quase.sequencia + 1 : 1;
  quase.temporizador = QUASE_COLISAO.janelaDaSequencia;

  const multiplicador = multiplicadorDaSequencia();
  // Entra pela pontuação central (bônus globais, como PONTOS x2, valem aqui também)
  const pontos = adicionarPontos(nivel.pontos * multiplicador);
  gameState.turboEnergy = Math.min(100, gameState.turboEnergy + nivel.turbo);

  quase.total++;
  quase.pontos += pontos;
  quase.melhorSequencia = Math.max(quase.melhorSequencia, multiplicador);

  // De que lado o obstáculo passou (+1 direita, -1 esquerda)
  const lado = obstaculo.worldX >= player.worldX ? 1 : -1;

  emitirFeedbackDeQuaseColisao(nivel, pontos, multiplicador, lado);
}

// Chamado a cada quadro: a sequência expira se ninguém encadear a tempo
function atualizarSequencia(dt) {
  if (quase.temporizador <= 0) return;

  quase.temporizador -= dt;

  if (quase.temporizador <= 0) quebrarSequencia();
}

function quebrarSequencia() {
  quase.sequencia = 0;
  quase.temporizador = 0;
}

// Texto para a tela de Game Over (vazio se não houve nenhuma)
function resumoDeQuaseColisoes() {
  if (quase.total === 0) return "";

  return traduzir("resumo.quase", {
    total: quase.total,
    pontos: quase.pontos,
    sequencia: quase.melhorSequencia,
  });
}
