// tests/ferramentas/simular-powerups.js
// Simula milhares de minutos do GERADOR REAL de power-ups (js/powerups/) para
// medir frequência, mistura de itens e tempo de efeito ativo. Serve de evidência
// para o balanceamento. Uso:  node tests/ferramentas/simular-powerups.js
//
// Premissas (declaradas, não medidas em jogadores reais):
//  - velocidade base 5 (120 km/h), sem turbo: o item leva o tempo real de viagem;
//  - o jogador coleta a fração "coleta" dos itens (1 = todos: pior caso para a facilidade);
//  - o escudo é consumido por uma batida a cada "intervaloDeBatida" s, em média.

const { carregarJogo } = require("../helpers/carregar-jogo");

function simular({ minutos = 3000, coleta = 1, turbo = 100, intervaloDeBatida = 30, regraAntiga = false, semente = 7 }) {
  const j = carregarJogo();
  j.novaPartida();
  j.semente(semente);
  j.f.resetGame(); j.f.pararLoop();
  j.v.diretor.temporizador = 1e9;

  if (regraAntiga) {
    // Regra anterior: só bloqueava o escudo quando outro escudo estava ativo
    j.avaliar("algumEfeitoDePowerUpAtivo = () => escudoAtivo();");
  }

  const { powerUps, gameState, itensDePowerUp, player, TIPOS_DE_POWERUP } = j.v;
  const quadros = minutos * 60 * 60;
  const contagem = { nitro: 0, escudo: 0, lentidao: 0, dobro: 0 };
  const ativo = { escudo: 0, lentidao: 0, dobro: 0, algum: 0, nenhum: 0 };
  let criados = 0, nitroDesperdicado = 0, escudosComEfeito = 0;
  const vistos = new Set();

  gameState.baseSpeed = 5;
  const aplicarOriginal = j.f.aplicarPowerUp;

  for (let q = 0; q < quadros; q++) {
    gameState.turboEnergy = turbo;
    gameState.gameSpeed = 5;
    const avanco = 5 * 0.023;

    j.f.atualizarGeracaoDePowerUps(1);

    // Item novo? registra o que havia ativo no instante do sorteio
    for (const it of itensDePowerUp) {
      if (vistos.has(it)) continue;
      vistos.add(it);
      criados++;
      contagem[it.tipo]++;
      if (it.tipo === "escudo" && (powerUps.lentidao > 0 || powerUps.dobro > 0)) escudosComEfeito++;
      it.coletar = Math.random() < coleta;
      if (it.tipo === "nitro" && it.coletar && turbo > 60) nitroDesperdicado++;
    }

    // Jogador alinha com o item que quer coletar (e se afasta do resto)
    const alvo = itensDePowerUp.find((i) => i.coletar);
    player.worldX = alvo ? alvo.worldX : 5;

    j.f.atualizarItensDePowerUp(1, avanco);

    if (powerUps.escudo > 0 && Math.random() < 1 / (intervaloDeBatida * 60)) j.f.tentarAbsorverBatida({});

    j.f.atualizarPowerUps(1);

    if (powerUps.escudo > 0) ativo.escudo++;
    if (powerUps.lentidao > 0) ativo.lentidao++;
    if (powerUps.dobro > 0) ativo.dobro++;
    if (powerUps.escudo > 0 || powerUps.lentidao > 0 || powerUps.dobro > 0) ativo.algum++; else ativo.nenhum++;
  }

  const seg = minutos * 60;
  const pct = (n) => (100 * n / quadros).toFixed(1) + "%";
  return {
    itensPorMinuto: +(criados / minutos).toFixed(2),
    mistura: Object.fromEntries(Object.entries(contagem).map(([k, v]) => [k, (100 * v / criados).toFixed(1) + "%"])),
    escudosSorteadosComOutroEfeitoAtivo: escudosComEfeito,
    tempoComEfeito: { escudo: pct(ativo.escudo), lentidao: pct(ativo.lentidao), dobro: pct(ativo.dobro), algumEfeito: pct(ativo.algum) },
    nitroDesperdicado: criados ? (100 * nitroDesperdicado / contagem.nitro || 0).toFixed(1) + "% dos nitros" : "-",
  };
}

if (require.main === module) {
  const cenarios = [
    { nome: "Regra ANTIGA, turbo cheio, coleta 100%", regraAntiga: true, turbo: 100 },
    { nome: "Regra NOVA,   turbo cheio, coleta 100%", turbo: 100 },
    { nome: "Regra NOVA,   turbo 50%,   coleta 100%", turbo: 50 },
    { nome: "Regra NOVA,   turbo vazio, coleta 100%", turbo: 0 },
    { nome: "Regra NOVA,   turbo cheio, coleta 60%", turbo: 100, coleta: 0.6 },
    { nome: "Regra NOVA,   batida a cada 15 s", intervaloDeBatida: 15 },
    { nome: "Regra NOVA,   batida a cada 60 s", intervaloDeBatida: 60 },
  ];
  for (const c of cenarios) {
    console.log("\n== " + c.nome);
    console.log(JSON.stringify(simular({ minutos: 1500, ...c }), null, 1));
  }
}

module.exports = { simular };
