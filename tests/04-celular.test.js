// Revisão para celular: HUD, sobreposição, som, câmera lenta e fim de partida
const test = require("node:test");
const assert = require("node:assert/strict");
const { novoJogo, coletar } = require("./helpers/apoio");

// Tamanhos reais do canvas na tela (CSS px). O canvas é 640x360 lógicos e usa
// object-fit: contain, então a escala é min(largura/640, altura/360).
const TELAS = {
  "celular vertical 360x640": { largura: 348, altura: 470 },     // escala ≈ 0,54
  "celular vertical 320x568 (pequeno)": { largura: 308, altura: 400 },
  "celular horizontal 844x390": { largura: 830, altura: 300 },
  "tablet / desktop": { largura: 1000, altura: 520 },
};

const escala = (t) => Math.min(t.largura / 640, t.altura / 360);
const intersecta = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

for (const [nome, tela] of Object.entries(TELAS)) {
  test(`HUD legível — ${nome}: medidor com pelo menos ~10 px reais de raio`, () => {
    const j = novoJogo({ tela });
    const raio = j.f.raioDoMedidorDePowerUp();
    assert.ok(raio * escala(tela) >= 10, `raio na tela: ${(raio * escala(tela)).toFixed(1)} px`);
    assert.ok(raio >= 14 && raio <= 24);
  });

  test(`HUD sem sobreposição — ${nome}: medidores não encostam em combo, nível, sequência nem nas bordas`, () => {
    const j = novoJogo({ tela });
    const r = j.f.raioDoMedidorDePowerUp();
    const outros = [
      { nome: "painel de combo (com pulso)", x0: 0, y0: 0, x1: 126, y1: 62 },
      { nome: "etiqueta de nível", x0: 286, y0: 6, x1: 354, y1: 22 },
      { nome: "medidor de sequência", x0: 258, y0: 26, x1: 382, y1: 52 },
    ];

    const medidores = [0, 1, 2].map((i) => {
      const { cx, cy } = j.f.posicaoDoMedidorDePowerUp(i, r);
      return { x0: cx - r - 2, y0: cy - r - 2, x1: cx + r + 2, y1: cy + r + 2 };
    });

    medidores.forEach((m, i) => {
      assert.ok(m.x0 >= 0 && m.y0 >= 0 && m.x1 <= 640 && m.y1 <= 360, `medidor ${i} dentro do canvas`);
      outros.forEach((o) => assert.equal(intersecta(m, o), false, `medidor ${i} × ${o.nome}`));
      if (i > 0) assert.equal(intersecta(m, medidores[i - 1]), false, `medidor ${i} × medidor ${i - 1}`);
    });
  });

  test(`render completo com todos os efeitos — ${nome}: sem erro e desenha os 3 medidores`, () => {
    const j = novoJogo({ tela });
    j.v.powerUps.escudo = 800; j.v.powerUps.lentidao = 300; j.v.powerUps.dobro = 500;
    j.v.powerUps.fatorDeTempo = 0.6;
    coletar(j, "nitro");
    const antes = (j.ctx2d.__chamadas.arc || 0);
    j.f.renderizar();
    assert.ok((j.ctx2d.__chamadas.arc || 0) > antes);
    assert.equal(j.avaliar("falhasDoJogo.length"), 0);
  });
}

test("o medidor não é desenhado quando não há efeito ativo (custo zero)", () => {
  const j = novoJogo();
  const antes = { ...j.ctx2d.__chamadas };
  j.f.desenharHudDePowerUps();
  assert.deepEqual(j.ctx2d.__chamadas, antes);
});

test("o nitro (instantâneo) não ocupa lugar no HUD", () => {
  const j = novoJogo();
  assert.deepEqual([...j.v.EFEITOS_NO_HUD], ["escudo", "lentidao", "dobro"]);
});

// ---------- Som ----------

const SONS = ["nitro", "escudo", "lentidao", "dobro"];

test("som DESLIGADO nas opções: nenhum som de power-up é gerado", () => {
  const j = novoJogo();
  j.armazenamento.retroTurboOptions = JSON.stringify({ sound: false, particles: true });
  SONS.forEach((t) => j.f.tocarSomDePowerUp(t));
  j.f.tocarSomDeEscudoQuebrando();
  SONS.forEach((t) => coletar(j, t));
  assert.equal(j.audio.osciladores, 0);
  assert.equal(j.audio.ruidos, 0);
  assert.equal(j.audio.contextos, 0, "nem cria o contexto de áudio");
});

test("mudo ativado pelo gerenciador de áudio: nenhum som de power-up", () => {
  const j = novoJogo();
  j.v.gerenciadorAudio.ativarMudo(true);
  SONS.forEach((t) => j.f.tocarSomDePowerUp(t));
  j.f.tocarSomDeEscudoQuebrando();
  assert.equal(j.audio.osciladores + j.audio.ruidos, 0);
});

test("som LIGADO: cada power-up toca algo", () => {
  for (const tipo of SONS) {
    const j = novoJogo();
    j.f.tocarSomDePowerUp(tipo);
    assert.ok(j.audio.osciladores + j.audio.ruidos > 0, tipo);
  }
  const j = novoJogo();
  j.f.tocarSomDeEscudoQuebrando();
  assert.ok(j.audio.osciladores > 0 && j.audio.ruidos > 0);
});

test("alternar o som no meio da partida vale já para o próximo power-up", () => {
  const j = novoJogo();
  j.f.tocarSomDePowerUp("dobro");
  const ligado = j.audio.osciladores;
  assert.ok(ligado > 0);

  j.armazenamento.retroTurboOptions = JSON.stringify({ sound: false });
  j.f.tocarSomDePowerUp("dobro");
  assert.equal(j.audio.osciladores, ligado);
});

test("JOGAR libera o áudio sintetizado dentro do gesto do usuário (celular), se o som estiver ligado", () => {
  const ligado = novoJogo();
  ligado.f.iniciarPartida();
  assert.equal(ligado.audio.contextos, 1);
  assert.ok(ligado.audio.resumes >= 1);

  const desligado = novoJogo();
  desligado.armazenamento.retroTurboOptions = JSON.stringify({ sound: false });
  desligado.f.iniciarPartida();
  assert.equal(desligado.audio.contextos, 0);
});

test("partículas desligadas: o feedback de coleta não cria partículas (textos continuam)", () => {
  const j = novoJogo();
  j.armazenamento.retroTurboOptions = JSON.stringify({ particles: false });
  j.f.invalidarCacheOpcoes();
  coletar(j, "dobro");
  j.f.emitirQuebraDeEscudo();
  assert.equal(j.v.particles.length, 0);
  assert.equal(j.v.popupsDePowerUp.length, 1);
});

// ---------- Câmera lenta ----------

for (const dt of [0.5, 1, 2.5]) {
  test(`câmera lenta: o fator entra e sai suavemente, sem overshoot (dt = ${dt})`, () => {
    const j = novoJogo();
    j.v.powerUps.lentidao = 1e6;
    let anterior = 1;
    for (let i = 0; i < 400 / dt; i++) {
      j.f.atualizarPowerUps(dt);
      const f = j.v.powerUps.fatorDeTempo;
      assert.ok(f <= anterior + 1e-12 && f >= 0.6 - 1e-9, `f=${f}`);
      anterior = f;
    }
    assert.ok(Math.abs(anterior - 0.6) < 0.005);

    j.v.powerUps.lentidao = 0;
    for (let i = 0; i < 400 / dt; i++) {
      j.f.atualizarPowerUps(dt);
      const f = j.v.powerUps.fatorDeTempo;
      assert.ok(f >= anterior - 1e-12 && f <= 1 + 1e-9);
      anterior = f;
    }
    assert.ok(anterior > 0.995);
  });
}

test("câmera lenta: o mundo anda a 60% da velocidade, mas o tempo do efeito e as animações seguem em tempo real", () => {
  const j = novoJogo();
  j.v.powerUps.lentidao = 360;
  j.v.powerUps.fatorDeTempo = 0.6;

  const popup = { texto: "x", x: 0, y: 0, vida: 70, cor: "#fff" };
  j.v.popupsDePowerUp.push(popup);

  j.f.simular(1, 1000);
  assert.ok(Math.abs(j.v.gameState.gameSpeed - 3) < 0.01, `gameSpeed=${j.v.gameState.gameSpeed}`);
  assert.equal(j.v.powerUps.lentidao, 359, "o timer do efeito corre em tempo real");
  assert.equal(popup.vida, 69, "animação do texto não fica lenta");
});

test("câmera lenta: dura exatamente 360 quadros (6 s) em tempo real", () => {
  const j = novoJogo();
  coletar(j, "lentidao");
  let quadros = 0;
  while (j.v.powerUps.lentidao > 0) { j.f.atualizarPowerUps(1); quadros++; }
  assert.equal(quadros, 360);
});

test("câmera lenta: o efeito de tela é leve (bordas ≤ 34% de roxo, centro da pista livre)", () => {
  const j = novoJogo();
  const stops = [];
  j.avaliar("ctx").createRadialGradient = () => ({ addColorStop: (p, c) => stops.push([p, c]) });
  j.v.powerUps.fatorDeTempo = 0.6;
  j.f.desenharEfeitoDeTelaDePowerUps();
  assert.match(stops[0][1], /,0\)$/, "centro transparente");
  assert.match(stops[1][1], /,0\.34\)$/, "borda no máximo 0,34");
});

// ---------- Fim de partida ----------

test("ao bater, a partida acaba e o resumo de power-ups continua disponível para o Game Over", () => {
  const j = novoJogo();
  j.v.powerUps.coletados = 2;
  j.v.powerUps.dobro = 300;
  j.f.iniciarBatida({});
  assert.equal(j.v.gameState.isGameOver, true);
  assert.match(j.f.resumoDePowerUps(), /coletados: 2/);
});

test("pausar congela os efeitos (timers só andam no loop de simulação)", () => {
  const j = novoJogo();
  j.v.powerUps.dobro = 400;
  j.v.gameState.isPaused = true;
  j.f.executarQuadro(5000);
  j.f.executarQuadro(5016);
  assert.equal(j.v.powerUps.dobro, 400);
});

test("um quadro grande (aba em segundo plano) não consome mais que 2,5 quadros do efeito", () => {
  const j = novoJogo();
  j.v.powerUps.dobro = 400;
  j.v.diretor.temporizador = 1e9;
  j.v.geradorDePowerUps.temporizador = 1e9;
  j.f.executarQuadro(1000);
  j.f.executarQuadro(1000 + 60_000);
  assert.ok(j.v.powerUps.dobro >= 400 - 1 - 2.5 - 1e-9);
});
