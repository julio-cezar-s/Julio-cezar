// Testes 1–4: regras do sorteio de power-ups (js/powerups/geracao.js)
const test = require("node:test");
const assert = require("node:assert/strict");
const { novoJogo, frequencias, probabilidades } = require("./helpers/apoio");
const { simular } = require("./ferramentas/simular-powerups");

const N = 40000;
const TOLERANCIA = 0.012;   // 1,2 ponto percentual com 40 mil sorteios

test("1a. escudo NUNCA é sorteado com câmera lenta ativa", () => {
  const j = novoJogo();
  j.v.powerUps.lentidao = 300;
  assert.equal(j.f.pesoDoPowerUp("escudo"), 0);
  assert.equal(frequencias(j, N).escudo, 0);
});

test("1b. escudo NUNCA é sorteado com pontos x2 ativo", () => {
  const j = novoJogo();
  j.v.powerUps.dobro = 500;
  assert.equal(j.f.pesoDoPowerUp("escudo"), 0);
  assert.equal(frequencias(j, N).escudo, 0);
});

test("1c. escudo NUNCA é sorteado com dois efeitos ao mesmo tempo, nem com escudo ativo", () => {
  const j = novoJogo();
  j.v.powerUps.lentidao = 10;
  j.v.powerUps.dobro = 10;
  assert.equal(j.f.pesoDoPowerUp("escudo"), 0);

  j.v.powerUps.lentidao = 0;
  j.v.powerUps.dobro = 0;
  j.v.powerUps.escudo = 800;
  assert.equal(j.f.pesoDoPowerUp("escudo"), 0, "escudo ativo bloqueia outro escudo");
  assert.equal(frequencias(j, N).escudo, 0);
});

test("1d. escudo não é sorteado nem na janela de invulnerabilidade após quebrar", () => {
  const j = novoJogo();
  j.v.powerUps.invulneravel = 40;
  assert.equal(j.f.pesoDoPowerUp("escudo"), 0);
});

test("1e. efeito com poucos quadros restantes ainda bloqueia; ao zerar, libera", () => {
  const j = novoJogo();
  j.v.powerUps.dobro = j.v.TIPOS_DE_POWERUP.dobro.duracao;

  for (let i = 0; i < 599; i++) j.f.atualizarPowerUps(1);
  assert.ok(j.v.powerUps.dobro > 0 && j.v.powerUps.dobro <= 1);
  assert.equal(j.f.pesoDoPowerUp("escudo"), 0, "resta 1 quadro: ainda ativo");

  j.f.atualizarPowerUps(1);
  assert.equal(j.v.powerUps.dobro, 0);
  assert.equal(j.f.pesoDoPowerUp("escudo"), j.v.TIPOS_DE_POWERUP.escudo.peso);
});

test("1f. regra vale no gerador completo: nenhum escudo é criado com efeito ativo (1500 min simulados)", () => {
  const r = simular({ minutos: 1500, semente: 7 });
  assert.equal(r.escudosSorteadosComOutroEfeitoAtivo, 0);
});

test("1g. o teste 1f tem dentes: a regra ANTIGA gerava escudos com outro efeito ativo", () => {
  const r = simular({ minutos: 1500, semente: 7, regraAntiga: true });
  assert.ok(r.escudosSorteadosComOutroEfeitoAtivo > 0);
});

test("2a. sem nenhum efeito ativo, o escudo tem seu peso normal", () => {
  const j = novoJogo();
  assert.equal(j.f.pesoDoPowerUp("escudo"), j.v.TIPOS_DE_POWERUP.escudo.peso);
});

test("2b. sem efeito ativo, o escudo pode ser sorteado (sorteio controlado)", () => {
  const j = novoJogo();
  j.v.gameState.turboEnergy = 100;      // pesos: nitro 1,5 | escudo 3 | lentidão 2 | dobro 2
  j.aleatorio(() => 0.3);               // 0,3 × 8,5 = 2,55 → cai dentro do escudo
  assert.equal(j.f.sortearPowerUp(), "escudo");
});

test("2c. sem efeito ativo, a frequência do escudo bate com o peso (≈ 35%)", () => {
  const j = novoJogo();
  const esperado = probabilidades(j).escudo;
  assert.ok(Math.abs(esperado - 3 / 8.5) < 1e-9);
  assert.ok(Math.abs(frequencias(j, N).escudo - esperado) < TOLERANCIA);
});

test("2d. quando os efeitos terminam, o escudo volta ao sorteio", () => {
  const j = novoJogo();
  j.v.powerUps.lentidao = 360;
  assert.equal(frequencias(j, 2000).escudo, 0);
  for (let i = 0; i < 360; i++) j.f.atualizarPowerUps(1);
  assert.ok(frequencias(j, N).escudo > 0.3);
});

test("2e. os demais itens seguem seus próprios pesos quando o escudo está bloqueado", () => {
  const j = novoJogo();
  j.v.powerUps.dobro = 100;
  // pesos: nitro 1,5 | escudo 0 | lentidão 2 | dobro 2×0,2 = 0,4
  const p = probabilidades(j);
  assert.equal(p.escudo, 0);
  assert.ok(Math.abs(p.nitro - 1.5 / 3.9) < 1e-9);
  assert.ok(Math.abs(p.lentidao - 2 / 3.9) < 1e-9);
  const f = frequencias(j, N);
  for (const tipo of ["nitro", "lentidao", "dobro"]) assert.ok(Math.abs(f[tipo] - p[tipo]) < TOLERANCIA, tipo);
});

test("3a. efeito ativo tem o peso multiplicado por 0,2 (câmera lenta e pontos x2)", () => {
  const j = novoJogo();
  const base = { lentidao: j.f.pesoDoPowerUp("lentidao"), dobro: j.f.pesoDoPowerUp("dobro") };

  j.v.powerUps.lentidao = 100;
  j.v.powerUps.dobro = 100;
  assert.ok(Math.abs(j.f.pesoDoPowerUp("lentidao") - base.lentidao * 0.2) < 1e-12);
  assert.ok(Math.abs(j.f.pesoDoPowerUp("dobro") - base.dobro * 0.2) < 1e-12);
});

test("3b. na prática, um efeito ativo aparece bem menos do que parado", () => {
  const parado = novoJogo();
  const fParado = frequencias(parado, N);

  const ativo = novoJogo();
  ativo.v.powerUps.dobro = 300;
  const fAtivo = frequencias(ativo, N);

  assert.ok(fAtivo.dobro < fParado.dobro * 0.5, `${fAtivo.dobro} deveria ser < metade de ${fParado.dobro}`);
  assert.ok(Math.abs(fAtivo.dobro - probabilidades(ativo).dobro) < TOLERANCIA);
});

test("4a. nitro pesa mais com turbo vazio do que com turbo cheio", () => {
  const j = novoJogo();
  j.v.gameState.turboEnergy = 100;
  const cheio = j.f.pesoDoPowerUp("nitro");
  j.v.gameState.turboEnergy = 0;
  const vazio = j.f.pesoDoPowerUp("nitro");

  assert.ok(Math.abs(cheio - 1.5) < 1e-12);
  assert.ok(Math.abs(vazio - 7.5) < 1e-12);
  assert.ok(vazio > cheio * 4);
});

test("4b. o peso do nitro cresce de forma contínua conforme o turbo esvazia", () => {
  const j = novoJogo();
  let anterior = -Infinity;
  for (let energia = 100; energia >= 0; energia -= 5) {
    j.v.gameState.turboEnergy = energia;
    const peso = j.f.pesoDoPowerUp("nitro");
    assert.ok(peso > anterior, `energia ${energia}`);
    anterior = peso;
  }
});

test("4c. na prática, o nitro sai mais vezes com turbo vazio", () => {
  const j = novoJogo();
  j.v.gameState.turboEnergy = 100;
  const cheio = frequencias(j, N).nitro;
  j.v.gameState.turboEnergy = 0;
  const vazio = frequencias(j, N).nitro;
  assert.ok(vazio > cheio * 2, `${vazio} vs ${cheio}`);
});

test("4d. o peso do nitro não depende do escudo (nitro nunca é bloqueado)", () => {
  const j = novoJogo();
  j.v.powerUps.lentidao = 100;
  j.v.powerUps.escudo = 100;
  assert.ok(j.f.pesoDoPowerUp("nitro") > 0);
});

test("gerador: cria 1º item no tempo previsto e nunca mais de um item na pista", () => {
  const j = novoJogo();
  j.v.geradorDePowerUps.temporizador = j.v.POWERUPS.primeiroEm;
  for (let q = 0; q < j.v.POWERUPS.primeiroEm - 1; q++) j.f.atualizarGeracaoDePowerUps(1);
  assert.equal(j.v.itensDePowerUp.length, 0);
  j.f.atualizarGeracaoDePowerUps(1);
  assert.equal(j.v.itensDePowerUp.length, 1);

  // Mesmo estourando o temporizador, não cria o segundo enquanto o primeiro está na pista
  j.v.geradorDePowerUps.temporizador = 0;
  j.f.atualizarGeracaoDePowerUps(1);
  assert.equal(j.v.itensDePowerUp.length, j.v.POWERUPS.maximoNaPista);
});
