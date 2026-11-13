// Testes 5–7: coleta, escudo, cone e óleo (caminho real: itens.js, movimento.js, colisao.js)
const test = require("node:test");
const assert = require("node:assert/strict");
const { novoJogo, obstaculoNoJogador, coletar } = require("./helpers/apoio");

test("5a. recoletar pontos x2 renova a duração sem acumular", () => {
  const j = novoJogo();
  const dur = j.v.TIPOS_DE_POWERUP.dobro.duracao;

  coletar(j, "dobro");
  assert.equal(j.v.powerUps.dobro, dur);

  for (let i = 0; i < 250; i++) j.f.atualizarPowerUps(1);
  assert.equal(j.v.powerUps.dobro, dur - 250);

  coletar(j, "dobro");
  assert.equal(j.v.powerUps.dobro, dur, "renovou para a duração cheia, não somou");
  assert.equal(j.f.multiplicadorDePontosDosPowerUps(), 2, "continua x2, não x4");
  assert.equal(j.v.powerUps.coletados, 2);
});

test("5b. recoletar câmera lenta renova o tempo e não acumula o fator", () => {
  const j = novoJogo();
  coletar(j, "lentidao");
  for (let i = 0; i < 100; i++) j.f.atualizarPowerUps(1);
  coletar(j, "lentidao");

  assert.equal(j.v.powerUps.lentidao, j.v.TIPOS_DE_POWERUP.lentidao.duracao);
  for (let i = 0; i < 300; i++) j.f.atualizarPowerUps(1);
  assert.ok(j.v.powerUps.lentidao > 0, "ainda ativa: o tempo foi renovado para 360");
  assert.ok(Math.abs(j.v.powerUps.fatorDeTempo - 0.6) < 0.01, "fator converge a 0,6 (não 0,36)");
});

test("5c. recoletar o escudo renova o tempo e continua absorvendo UMA batida só", () => {
  const j = novoJogo();
  coletar(j, "escudo");
  for (let i = 0; i < 300; i++) j.f.atualizarPowerUps(1);
  coletar(j, "escudo");
  assert.equal(j.v.powerUps.escudo, j.v.TIPOS_DE_POWERUP.escudo.duracao);

  obstaculoNoJogador(j, "civilian");
  j.f.atualizarObstaculos(1, 0);
  assert.equal(j.v.powerUps.escudo, 0, "um escudo só, consumido na primeira batida");
  assert.equal(j.v.powerUps.escudosUsados, 1);
});

test("5d. nitro recoletado soma energia até o teto de 100 (efeito instantâneo, sem timer)", () => {
  const j = novoJogo();
  j.v.gameState.turboEnergy = 30;
  coletar(j, "nitro");
  assert.equal(j.v.gameState.turboEnergy, 70);
  coletar(j, "nitro");
  assert.equal(j.v.gameState.turboEnergy, 100);
  assert.equal(j.v.powerUps.nitro, undefined);
});

test("5e. o item só é coletado dentro da janela e da largura de coleta", () => {
  const j = novoJogo();
  const item = j.f.criarItemDePowerUp("dobro", 1);
  item.z = j.v.PLAYER_Z; item.prevZ = j.v.PLAYER_Z + 0.05;
  item.worldX = j.v.player.worldX + 1.2;           // faixa ao lado
  j.f.atualizarItensDePowerUp(1, 0);
  assert.equal(j.v.powerUps.dobro, 0);
  assert.equal(j.v.itensDePowerUp.length, 1);

  item.worldX = j.v.player.worldX;
  j.f.atualizarItensDePowerUp(1, 0);
  assert.equal(j.v.powerUps.dobro, 600);
  assert.equal(j.v.itensDePowerUp.length, 0);
});

const BATIDAS = ["civilian", "police", "truck", "motorcycle", "barrier"];

for (const tipo of BATIDAS) {
  test(`6a. escudo absorve a batida de "${tipo}" e a partida continua`, () => {
    const j = novoJogo();
    j.v.powerUps.escudo = 900;
    const o = obstaculoNoJogador(j, tipo);

    j.f.atualizarObstaculos(1, 0);

    assert.equal(j.v.gameState.isGameOver, false);
    assert.equal(j.v.powerUps.escudo, 0);
    assert.equal(j.v.powerUps.escudosUsados, 1);
    assert.equal(j.v.powerUps.invulneravel, j.v.POWERUPS.invulnerabilidade);
    assert.equal(j.v.obstacles.includes(o), false, "obstáculo removido");
  });

  test(`6b. sem escudo, "${tipo}" encerra a partida`, () => {
    const j = novoJogo();
    obstaculoNoJogador(j, tipo);
    j.f.atualizarObstaculos(1, 0);
    assert.equal(j.v.gameState.isGameOver, true);
    assert.ok(j.v.gameState.crashFrames > 0);
  });
}

test("6c. escudo absorve UMA batida; a janela de invulnerabilidade cobre a seguinte; depois disso a batida é fatal", () => {
  const j = novoJogo();
  j.v.powerUps.escudo = 900;

  obstaculoNoJogador(j, "civilian");
  j.f.atualizarObstaculos(1, 0);
  assert.equal(j.v.gameState.isGameOver, false);

  obstaculoNoJogador(j, "truck");                  // logo em seguida: ainda invulnerável
  j.f.atualizarObstaculos(1, 0);
  assert.equal(j.v.gameState.isGameOver, false);
  assert.equal(j.v.powerUps.escudosUsados, 1, "segunda batida NÃO gasta outro escudo");

  for (let i = 0; i < j.v.POWERUPS.invulnerabilidade; i++) j.f.atualizarPowerUps(1);
  assert.equal(j.v.powerUps.invulneravel, 0);

  obstaculoNoJogador(j, "barrier");
  j.f.atualizarObstaculos(1, 0);
  assert.equal(j.v.gameState.isGameOver, true);
});

test("6d. o escudo NÃO é gasto por cone nem por óleo", () => {
  const j = novoJogo();
  j.v.powerUps.escudo = 900;

  obstaculoNoJogador(j, "cone");
  j.f.atualizarObstaculos(1, 0);
  obstaculoNoJogador(j, "oil");
  j.f.atualizarObstaculos(1, 0);

  assert.equal(j.v.powerUps.escudo, 900);
  assert.equal(j.v.powerUps.escudosUsados, 0);
  assert.equal(j.v.powerUps.invulneravel, 0);
  assert.equal(j.v.gameState.isGameOver, false);
});

test("6e. o escudo expira sozinho após a duração e deixa de proteger", () => {
  const j = novoJogo();
  j.v.powerUps.escudo = j.v.TIPOS_DE_POWERUP.escudo.duracao;
  for (let i = 0; i < 900; i++) j.f.atualizarPowerUps(1);
  assert.equal(j.f.escudoAtivo(), false);

  obstaculoNoJogador(j, "civilian");
  j.f.atualizarObstaculos(1, 0);
  assert.equal(j.v.gameState.isGameOver, true);
});

for (const comEscudo of [false, true]) {
  const rotulo = comEscudo ? "com escudo ativo" : "sem power-ups";

  test(`7a. cone continua funcionando (${rotulo}): perde ritmo e turbo, some, partida segue`, () => {
    const j = novoJogo();
    if (comEscudo) j.v.powerUps.escudo = 900;
    j.v.gameState.baseSpeed = 8;
    j.v.gameState.turboEnergy = 100;
    const cone = obstaculoNoJogador(j, "cone");

    j.f.atualizarObstaculos(1, 0);

    assert.ok(Math.abs(j.v.gameState.baseSpeed - (8 - j.v.TROPECO.perdaDeVelocidade)) < 1e-9);
    assert.equal(j.v.gameState.turboEnergy, 100 - j.v.TROPECO.perdaDeTurbo);
    assert.equal(j.v.obstacles.includes(cone), false);
    assert.equal(j.v.gameState.isGameOver, false);
  });

  test(`7b. óleo continua funcionando (${rotulo}): derrapa uma única vez e a partida segue`, () => {
    const j = novoJogo();
    if (comEscudo) j.v.powerUps.escudo = 900;
    const oleo = obstaculoNoJogador(j, "oil");

    j.f.atualizarObstaculos(1, 0);
    assert.equal(j.v.player.derrapagem, j.avaliar("DERRAPAGEM.duracao"));
    assert.equal(oleo.atingido, true);
    assert.equal(j.v.gameState.isGameOver, false);

    j.v.player.derrapagem = 0;                     // passou a derrapagem
    j.f.atualizarObstaculos(1, 0);                 // continua em cima do óleo
    assert.equal(j.v.player.derrapagem, 0, "não derrapa de novo na mesma mancha");
  });
}

test("7c. cone e óleo derrubados penalizam o combo como antes", () => {
  const j = novoJogo();
  j.v.combo.sequencia = 20;
  j.v.combo.degrau = j.f.degrauDaSequencia(20);
  obstaculoNoJogador(j, "cone");
  j.f.atualizarObstaculos(1, 0);
  assert.equal(j.v.combo.sequencia, 10);
});

test("7d. cone não rouba nem renova a proteção da invulnerabilidade", () => {
  const j = novoJogo();
  j.v.powerUps.invulneravel = 30;
  obstaculoNoJogador(j, "cone");
  j.f.atualizarObstaculos(1, 0);
  assert.equal(j.v.powerUps.invulneravel, 30);
});
