/* js/obstaculos/efeitos.js
   Efeitos de encostar em obstáculos que NÃO encerram a partida.
   (A derrapagem do óleo fica em sistemas/derrapagem.js.)
*/

const TROPECO = {
  perdaDeVelocidade: 0.6,   // tirado da velocidade-base (nunca abaixo de 5)
  perdaDeTurbo: 14,         // pontos de energia
};

// Cone derrubado: o carro perde ritmo e energia de turbo
function aplicarTropeco(cone) {
  if (typeof quebrarSequencia === "function") quebrarSequencia();
  if (typeof penalizarCombo === "function") penalizarCombo("tropeco");

  gameState.baseSpeed = Math.max(5, gameState.baseSpeed - TROPECO.perdaDeVelocidade);
  gameState.turboEnergy = Math.max(0, gameState.turboEnergy - TROPECO.perdaDeTurbo);
  gameState.tremor = Math.max(gameState.tremor, 3);

  const s = projScale(cone.z);
  emitirDestrocosDeCone(projX(cone.worldX, s), projY(s));

  if (typeof gerenciadorAudio !== "undefined") gerenciadorAudio.tocar("freada");
}

function emitirDestrocosDeCone(x, y) {
  for (let i = 0; i < 16; i++) {
    const vida = 18 + Math.random() * 14;

    criarParticula({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: -1 - Math.random() * 3.5,
      vida, vidaMax: vida,
      tamanho: 1.4 + Math.random() * 1.6,
      cresce: -0.03,
      cor: i % 3 === 0 ? "#ffffff" : "#ff7a1a",
      tipo: "fagulha",
      gravidade: 0.22,
    });
  }
}
