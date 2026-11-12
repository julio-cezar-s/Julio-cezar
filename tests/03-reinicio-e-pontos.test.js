// Testes 8–9: reinício limpa tudo; pontos x2 vale em todas as fontes
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { novoJogo, itemNoJogador } = require("./helpers/apoio");
const { RAIZ } = require("./helpers/carregar-jogo");

// Deixa a partida "suja": efeitos, itens, textos, anéis, contadores
function sujar(j) {
  const v = j.v;
  v.powerUps.escudo = 700;
  v.powerUps.lentidao = 300;
  v.powerUps.dobro = 500;
  v.powerUps.invulneravel = 40;
  v.powerUps.fatorDeTempo = 0.62;
  v.powerUps.coletados = 5;
  v.powerUps.escudosUsados = 2;
  j.f.criarItemDePowerUp("dobro", 0);
  j.f.criarItemDePowerUp("nitro", 2);
  j.f.emitirFeedbackDeColeta(v.TIPOS_DE_POWERUP.dobro);
  j.f.emitirQuebraDeEscudo();
  v.geradorDePowerUps.temporizador = 3;
  v.gameState.score = 4321;
  v.gameState.turboEnergy = 12;
  v.gameState.isGameOver = true;
  v.gameState.crashFrames = 20;
  j.f.criarObstaculo("civilian", { faixa: 0 });
}

function assertLimpo(j) {
  const v = j.v;
  assert.equal(v.powerUps.escudo, 0);
  assert.equal(v.powerUps.lentidao, 0);
  assert.equal(v.powerUps.dobro, 0);
  assert.equal(v.powerUps.invulneravel, 0);
  assert.equal(v.powerUps.fatorDeTempo, 1);
  assert.equal(v.powerUps.coletados, 0);
  assert.equal(v.powerUps.escudosUsados, 0);
  assert.equal(v.itensDePowerUp.length, 0, "itens na pista");
  assert.equal(v.popupsDePowerUp.length, 0, "textos de coleta");
  assert.equal(v.aneisDeEscudo.length, 0, "anéis");
  assert.equal(v.geradorDePowerUps.temporizador, v.POWERUPS.primeiroEm, "gerador volta ao 1º item");
  assert.equal(v.obstacles.length, 0);
  assert.equal(v.particles.length, 0);
  assert.equal(v.gameState.score, 0);
  assert.equal(v.gameState.turboEnergy, 100);
  assert.equal(v.gameState.isGameOver, false);
  assert.equal(j.f.escudoAtivo(), false);
  assert.equal(j.f.algumEfeitoDePowerUpAtivo(), false);
  assert.equal(j.f.multiplicadorDePontosDosPowerUps(), 1);
  assert.equal(j.f.fatorDeVelocidadeDosPowerUps(), 1);
  assert.equal(j.f.resumoDePowerUps(), "");
}

test("8a. resetGame limpa todos os efeitos, itens, textos e contadores", () => {
  const j = novoJogo();
  sujar(j);
  j.f.resetGame();
  assertLimpo(j);
});

test("8b. há um único loop depois de reiniciar várias vezes", () => {
  const j = novoJogo();
  for (let i = 0; i < 4; i++) { sujar(j); j.f.resetGame(); }
  assert.equal(j.quadros.pendentes.length, 1);
});

test("8c. JOGAR NOVAMENTE (clique real em iniciarPartida) limpa tudo", () => {
  const j = novoJogo();
  sujar(j);
  j.f.iniciarPartida();
  assertLimpo(j);
});

test("8d. SAIR para o menu e JOGAR de novo: nada vaza para a partida nova", () => {
  const j = novoJogo();
  sujar(j);
  j.v.gameState.isGameOver = false;
  j.f.sairParaMenu();
  assert.equal(j.quadros.pendentes.length, 0, "loop parado: efeitos não rodam no menu");
  j.f.iniciarPartida();
  assertLimpo(j);
});

test("8e. depois de reiniciar, a câmera lenta não deixa a velocidade do mundo reduzida", () => {
  const j = novoJogo();
  sujar(j);
  j.f.resetGame();
  j.v.diretor.temporizador = 1e9;
  j.v.geradorDePowerUps.temporizador = 1e9;
  j.f.simular(1, 1000);
  assert.ok(Math.abs(j.v.gameState.gameSpeed - 5) < 0.01);
});

test("8f. o resumo de power-ups do Game Over reflete só a partida atual", () => {
  const j = novoJogo();
  j.v.powerUps.coletados = 3;
  j.v.powerUps.escudosUsados = 1;
  assert.match(j.f.resumoDePowerUps(), /coletados: 3.*Escudo salvou 1x/);
  j.f.resetGame();
  assert.equal(j.f.resumoDePowerUps(), "");
});

// ---------- Pontos x2 ----------

// Roda "cenario" duas vezes (sem e com PONTOS x2) e devolve [pontosNormais, pontosComDobro]
function comparar(cenario) {
  const resultados = [];
  for (const dobro of [0, 600]) {
    const j = novoJogo();
    j.v.powerUps.dobro = dobro;
    const antes = j.v.gameState.score;
    cenario(j);
    resultados.push(j.v.gameState.score - antes);
  }
  return resultados;
}

test("9a. pontos x2 dobra a pontuação que corre com o tempo (loop real)", () => {
  const [normal, dobro] = comparar((j) => {
    j.v.geradorDePowerUps.temporizador = 1e9;
    for (let i = 0; i < 120; i++) j.f.simular(1, 1000 + i * 16);
  });
  assert.ok(normal > 50);
  assert.ok(Math.abs(dobro - 2 * normal) < 1e-9, `${dobro} vs 2×${normal}`);
});

test("9b. pontos x2 dobra o bônus de desvio do combo", () => {
  const [normal, dobro] = comparar((j) => j.f.registrarDesvio({ type: "truck" }));
  assert.equal(normal, 20);
  assert.equal(dobro, 40);
});

test("9c. pontos x2 dobra o bônus do combo também em degraus altos", () => {
  const [normal, dobro] = comparar((j) => {
    j.v.combo.sequencia = 30; j.v.combo.degrau = j.f.degrauDaSequencia(30);
    j.f.registrarDesvio({ type: "civilian" });
  });
  assert.equal(dobro, normal * 2);
  assert.ok(normal >= 40);
});

for (const [indice, nome] of [[0, "RENTE"], [1, "PERTO"], [2, "QUASE"]]) {
  test(`9d. pontos x2 dobra a quase-colisão ${nome}`, () => {
    const [normal, dobro] = comparar((j) => {
      const nivel = j.v.QUASE_COLISAO.niveis[indice];
      j.f.registrarQuaseColisao(nivel, { worldX: 1 });
    });
    assert.equal(normal, [120, 50, 20][indice]);
    assert.equal(dobro, normal * 2);
  });
}

test("9e. quase-colisão detectada de verdade (passando raspando) também é dobrada", () => {
  const [normal, dobro] = comparar((j) => {
    const o = j.f.criarObstaculo("civilian", { faixa: 1, velocidade: 1 });
    o.worldX = j.v.player.worldX + j.f.distanciaDeContato(o) + 0.03;   // folga 0,03 → RENTE
    o.z = j.v.PLAYER_Z + 0.1; o.prevZ = j.v.PLAYER_Z + 0.2;
    j.f.atualizarObstaculos(1, 0);                // dentro da janela: mede a folga
    o.prevZ = o.z; o.z = j.v.PLAYER_Z - 0.5;      // passou por completo
    j.f.atualizarObstaculos(1, 0);
  });
  assert.ok(normal > 0, "houve pontuação de quase-colisão/desvio");
  assert.equal(dobro, normal * 2);
});

test("9f. o resumo do Game Over soma os pontos já dobrados", () => {
  const j = novoJogo();
  j.v.powerUps.dobro = 600;
  j.f.registrarDesvio({ type: "civilian" });
  assert.equal(j.v.combo.pontosDeDesvios, 20);
  j.f.registrarQuaseColisao(j.v.QUASE_COLISAO.niveis[2], { worldX: 1 });
  assert.equal(j.v.quase.pontos, 40);
});

test("9g. depois que o efeito acaba, a pontuação volta ao normal", () => {
  const j = novoJogo();
  j.v.powerUps.dobro = 600;
  for (let i = 0; i < 600; i++) j.f.atualizarPowerUps(1);
  const antes = j.v.gameState.score;
  j.f.registrarDesvio({ type: "civilian" });
  assert.equal(j.v.gameState.score - antes, 10);
});

test("9h. nenhuma fonte de pontos ignora adicionarPontos (varredura do código)", () => {
  const permitidos = new Set(["sistemas/pontos.js", "game/reset.js"]);
  const achados = [];

  (function varrer(pasta) {
    for (const nome of fs.readdirSync(pasta, { withFileTypes: true })) {
      const caminho = path.join(pasta, nome.name);
      if (nome.isDirectory()) { varrer(caminho); continue; }
      if (!nome.name.endsWith(".js")) continue;
      const rel = path.relative(path.join(RAIZ, "js"), caminho).replaceAll("\\", "/");
      if (/gameState\.score\s*(\+=|-=|=(?!=))/.test(fs.readFileSync(caminho, "utf8")) && !permitidos.has(rel)) achados.push(rel);
    }
  })(path.join(RAIZ, "js"));

  assert.deepEqual(achados, []);
});
