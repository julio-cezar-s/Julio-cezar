/* js/powerups/estado.js
   Estado dos efeitos ativos e consultas usadas pelo resto do jogo.
   Cada valor é o número de quadros que ainda restam (0 = inativo).
*/

const powerUps = {
  escudo: 0,
  lentidao: 0,
  dobro: 0,

  // Janela em que batidas são ignoradas logo após o escudo se quebrar
  invulneravel: 0,

  // Escala do tempo do mundo (1 = normal), suavizada entre 1 e o fator da lentidão
  fatorDeTempo: 1,

  // Estatísticas da partida
  coletados: 0,
  escudosUsados: 0,
};

function reiniciarPowerUps() {
  powerUps.escudo = 0;
  powerUps.lentidao = 0;
  powerUps.dobro = 0;
  powerUps.invulneravel = 0;
  powerUps.fatorDeTempo = 1;
  powerUps.coletados = 0;
  powerUps.escudosUsados = 0;

  if (typeof limparItensDePowerUp === "function") limparItensDePowerUp();
  if (typeof limparFeedbackDePowerUps === "function") limparFeedbackDePowerUps();
  if (typeof reiniciarGeracaoDePowerUps === "function") reiniciarGeracaoDePowerUps();
}

function powerUpAtivo(tipo) {
  return powerUps[tipo] > 0;
}

function escudoAtivo() {
  return powerUps.escudo > 0;
}

// Há algum efeito em curso? Conta o escudo, a câmera lenta, o pontos x2 e a
// janela de invulnerabilidade logo após o escudo quebrar (a bolha ainda
// aparece na tela). Usado pelo sorteio: o escudo só sai com tudo parado.
function algumEfeitoDePowerUpAtivo() {
  if (powerUps.invulneravel > 0) return true;

  return Object.keys(TIPOS_DE_POWERUP).some(
    (tipo) => TIPOS_DE_POWERUP[tipo].duracao > 0 && powerUpAtivo(tipo)
  );
}

// Contagem regressiva dos efeitos e suavização da câmera lenta
function atualizarPowerUps(dt) {
  powerUps.escudo = Math.max(0, powerUps.escudo - dt);
  powerUps.lentidao = Math.max(0, powerUps.lentidao - dt);
  powerUps.dobro = Math.max(0, powerUps.dobro - dt);
  powerUps.invulneravel = Math.max(0, powerUps.invulneravel - dt);

  const alvo = powerUps.lentidao > 0 ? TIPOS_DE_POWERUP.lentidao.fator : 1;
  powerUps.fatorDeTempo += (alvo - powerUps.fatorDeTempo) * POWERUPS.suavizacaoDoTempo * dt;

  if (typeof emitirBrilhoDoDobro === "function") emitirBrilhoDoDobro(dt);
}

// Quanto a velocidade do mundo é multiplicada pelos power-ups (câmera lenta)
function fatorDeVelocidadeDosPowerUps() {
  return powerUps.fatorDeTempo;
}

// Quanto os pontos são multiplicados pelos power-ups (pontos x2)
function multiplicadorDePontosDosPowerUps() {
  return powerUps.dobro > 0 ? TIPOS_DE_POWERUP.dobro.multiplicador : 1;
}

// Linha para a tela de Game Over (vazia se nada foi coletado)
function resumoDePowerUps() {
  if (powerUps.coletados === 0) return "";

  const salvou = powerUps.escudosUsados > 0
    ? traduzir("resumo.escudoSalvou", { n: powerUps.escudosUsados })
    : "";

  return traduzir("resumo.powerups", { coletados: powerUps.coletados, salvou });
}
