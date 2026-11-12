// Regressão: o que NÃO deve mudar (hitboxes, parâmetros preservados, carregamento) e fumaça do loop
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { carregarJogo, scriptsDoIndex, RAIZ } = require("./helpers/carregar-jogo");
const { novoJogo, obstaculoNoJogador } = require("./helpers/apoio");

test("todos os scripts do index.html existem, pronto.js é o último e o jogo fica pronto sem erros", () => {
  const scripts = scriptsDoIndex();
  scripts.forEach((s) => assert.ok(fs.existsSync(path.join(RAIZ, s)), s));
  assert.equal(scripts.at(-1), "js/inicio/pronto.js");
  assert.equal(new Set(scripts).size, scripts.length, "sem script repetido");

  const j = carregarJogo();
  assert.equal(j.avaliar("window.jogoPronto"), true);
  assert.equal(j.avaliar("falhasDoJogo.length"), 0);
});

test("todos os arquivos .js de js/ estão no index.html (nada esquecido fora do carregamento)", () => {
  const listados = new Set(scriptsDoIndex());
  const achados = [];
  (function varrer(p) {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const c = path.join(p, e.name);
      if (e.isDirectory()) varrer(c);
      else if (e.name.endsWith(".js")) achados.push(path.relative(RAIZ, c).replaceAll("\\", "/"));
    }
  })(path.join(RAIZ, "js"));
  assert.deepEqual(achados.filter((a) => !listados.has(a)), []);
});

test("a versão do rótulo e o ?v= de todos os scripts/estilos do index.html são a mesma", () => {
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  const versoes = new Set([...html.matchAll(/\?v=([\w.]+)"/g)].map((m) => m[1]));
  assert.equal(versoes.size, 1, [...versoes].join(", "));
  const j = carregarJogo();
  assert.equal(j.avaliar("VERSAO_DO_JOGO"), [...versoes][0]);
});

test("parâmetros de balanceamento preservados (nenhum valor mudou sem evidência)", () => {
  const j = carregarJogo();
  const { POWERUPS, TIPOS_DE_POWERUP: T } = j.v;
  assert.equal(
    JSON.stringify(POWERUPS),
    JSON.stringify({ primeiroEm: 420, intervalo: [660, 960], maximoNaPista: 1, larguraDeColeta: 0.6, profundidadeDeColeta: 0.25, janelaSegura: 3.2, invulnerabilidade: 75, suavizacaoDoTempo: 0.12 })
  );
  assert.equal(T.nitro.energia, 40);   assert.equal(T.nitro.peso, 3);    assert.equal(T.nitro.duracao, 0);
  assert.equal(T.escudo.duracao, 900); assert.equal(T.escudo.peso, 3);
  assert.equal(T.lentidao.duracao, 360); assert.equal(T.lentidao.fator, 0.6); assert.equal(T.lentidao.peso, 2);
  assert.equal(T.dobro.duracao, 600);  assert.equal(T.dobro.multiplicador, 2); assert.equal(T.dobro.peso, 2);
  assert.equal(Object.keys(T).join(","), "nitro,escudo,lentidao,dobro", "sem power-ups novos");
});

test("hitboxes preservadas (84% da largura visual; óleo 100%)", () => {
  const j = carregarJogo();
  assert.equal(j.v.HITBOX_WIDTH_FACTOR, 0.84);
  assert.equal(j.v.PLAYER_WORLD_WIDTH, 0.54);
  const t = j.v.TIPOS_DE_OBSTACULO;
  for (const tipo of ["civilian", "police", "truck", "motorcycle", "cone", "barrier"]) assert.equal(t[tipo].hitbox, 0.84, tipo);
  assert.equal(t.oil.hitbox, 1);
  assert.equal(
    JSON.stringify(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.profundidade]))),
    JSON.stringify({ civilian: 0.15, police: 0.15, truck: 0.22, motorcycle: 0.12, cone: 0.08, oil: 0.4, barrier: 0.15 })
  );
});

test("colisão: encosta logo abaixo da distância de contato e não encosta logo acima", () => {
  const j = novoJogo();
  const o = obstaculoNoJogador(j, "civilian");
  const d = j.f.distanciaDeContato(o);
  assert.ok(Math.abs(d - (0.54 * 0.84 + 0.5 * 0.84) / 2) < 1e-12);

  o.worldX = j.v.player.worldX + d - 0.001;
  assert.equal(j.f.verificarColisao(o), true);
  o.worldX = j.v.player.worldX + d + 0.001;
  assert.equal(j.f.verificarColisao(o), false);
});

test("colisão: varredura em profundidade não deixa o obstáculo atravessar em um quadro", () => {
  const j = novoJogo();
  const o = obstaculoNoJogador(j, "civilian");
  o.prevZ = j.v.PLAYER_Z + 0.5;          // quadro anterior: bem à frente
  o.z = j.v.PLAYER_Z - 0.5;              // este quadro: já passou (saltou a janela inteira)
  assert.equal(j.f.verificarColisao(o), true, "o salto sobre a janela ainda conta como batida");

  o.prevZ = j.v.PLAYER_Z + 0.6; o.z = j.v.PLAYER_Z + 0.5;     // ainda longe
  assert.equal(j.f.verificarColisao(o), false);
  o.prevZ = j.v.PLAYER_Z - 0.5; o.z = j.v.PLAYER_Z - 0.6;     // já passou
  assert.equal(j.f.verificarColisao(o), false);
});

test("combo: degraus e penalidade preservados", () => {
  const j = novoJogo();
  assert.deepEqual([...j.v.COMBO.degraus], [0, 6, 14, 26, 42, 64, 90, 120]);
  for (let i = 0; i < 6; i++) j.f.registrarDesvio({ type: "civilian" });
  assert.equal(j.f.multiplicadorDeCombo(), 2);
  j.f.penalizarCombo("tropeco");
  assert.equal(j.v.combo.sequencia, 3);
  assert.equal(j.f.multiplicadorDeCombo(), 1);
});

test("quase-colisão: classificação preservada", () => {
  const j = novoJogo();
  assert.equal(j.f.classificarFolga(0.05).nome, "RENTE");
  assert.equal(j.f.classificarFolga(0.12).nome, "PERTO");
  assert.equal(j.f.classificarFolga(0.25).nome, "QUASE");
  assert.equal(j.f.classificarFolga(0.5), null);
});

test("nitro: +40 de energia, teto 100, e dá um empurrão visual de velocidade", () => {
  const j = novoJogo();
  j.v.gameState.turboEnergy = 10;
  j.v.gameState.speedEffect = 0;
  j.f.aplicarPowerUp("nitro");
  assert.equal(j.v.gameState.turboEnergy, 50);
  assert.equal(j.v.gameState.speedEffect, 0.25);
});

test("fumaça: 40 partidas completas com robô e todos os power-ups, sem nenhum erro", () => {
  const j = carregarJogo();
  let coletados = 0;
  const vistos = { nitro: 0, escudo: 0, lentidao: 0, dobro: 0 };

  for (let partida = 0; partida < 40; partida++) {
    j.semente(1000 + partida);
    j.f.iniciarPartida();

    for (let q = 0; q < 4000 && !j.v.gameState.isGameOver; q++) {
      // robô: persegue o item de power-up quando existe, senão zigueza
      const item = j.v.itensDePowerUp[0];
      j.v.input.left = item ? item.worldX < j.v.player.worldX - 0.05 : q % 90 < 30;
      j.v.input.right = item ? item.worldX > j.v.player.worldX + 0.05 : q % 90 >= 60;
      j.v.gameState.isTurboActive = q % 400 < 60;

      j.f.simular(1, 1000 + q * (1000 / 60));          // lógica completa do quadro
      if (q % 20 === 0) j.f.renderizar();              // desenho a cada 20 quadros (velocidade do teste)

      for (const i of j.v.itensDePowerUp) vistos[i.tipo]++;
      coletados = Math.max(coletados, j.v.powerUps.coletados);
    }

    assert.equal(j.avaliar("falhasDoJogo.length"), 0, `erro durante a partida ${partida}`);

    assert.ok(j.v.powerUps.fatorDeTempo >= 0.6 - 1e-9 && j.v.powerUps.fatorDeTempo <= 1);
  }

  assert.ok(coletados > 0, "o robô coletou pelo menos um item");
  assert.ok(Object.values(vistos).every((n) => n > 0), "os quatro tipos apareceram: " + JSON.stringify(vistos));
});
