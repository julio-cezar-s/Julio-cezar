// Layout responsivo e tela cheia (js/layout/*, css/estilos/layout.css)
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { carregarJogo, scriptsDoIndex, RAIZ } = require("./helpers/carregar-jogo");

// Resoluções em pixels CSS: [nome, largura, altura, dpr]
const TELAS = [
  ["Galaxy A37 horizontal (cheia)", 891, 411, 2.625],
  ["Galaxy A37 com barra do navegador", 891, 360, 2.625],
  ["Celular 20:9 pequeno", 780, 360, 3],
  ["Celular 21:9", 960, 411, 2.625],
  ["Celular 16:9", 640, 360, 2],
  ["Celular pequeno", 568, 320, 2],
  ["iPhone horizontal", 844, 390, 3],
  ["Tablet 4:3", 1024, 768, 2],
  ["Tablet 16:10", 1280, 800, 2],
  ["Notebook 1366x768", 1366, 768, 1],
  ["Notebook 125%", 1536, 864, 1.25],
  ["Notebook 16:10", 1440, 900, 2],
  ["Full HD", 1920, 1080, 1],
  ["4K a 150%", 2560, 1440, 1.5],
  ["Ultrawide 21:9", 2560, 1080, 1],
  ["Janela pequena", 800, 500, 1],
  ["Janela minúscula", 480, 270, 1],
];

const lerLayout = (j, largura, altura, toque, dpr, seguro) =>
  j.f.calcularLayout({ largura, altura, toque, dpr, seguro });

const cruza = (a, b) =>
  a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.h - 1e-6 && b.y < a.y + a.h - 1e-6;

const dentro = (r, w, h) => r.x >= -1e-6 && r.y >= -1e-6 && r.x + r.w <= w + 1e-6 && r.y + r.h <= h + 1e-6;

// ---------- Cálculo puro ----------

for (const toque of [true, false]) {
  for (const [nome, w, h, dpr] of TELAS) {
    test(`cálculo — ${nome} ${w}x${h} @${dpr} (${toque ? "toque" : "mouse"}): 16:9 exato, tudo dentro da tela, sem sobreposição`, () => {
      const j = carregarJogo();
      const l = lerLayout(j, w, h, toque, dpr);

      // Proporção exata e canvas dentro da janela
      assert.ok(Math.abs(l.mundo.w / l.mundo.h - 16 / 9) < 1e-9, `proporção ${l.mundo.w / l.mundo.h}`);
      assert.ok(dentro(l.mundo, w, h), "canvas dentro da janela");
      assert.ok(dentro(l.barra, w, h), "barra dentro da janela");

      // Em pixels físicos o canvas é múltiplo de 16×9 (sem reamostragem borrada)
      assert.ok(Math.abs(l.mundo.w * dpr - Math.round(l.mundo.w * dpr)) < 1e-6);
      assert.ok(Math.round(l.mundo.w * dpr) % 16 === 0);

      // Barra e canvas nunca se sobrepõem
      assert.equal(cruza(l.barra, l.mundo), false, "barra × canvas");

      if (l.modo === "inferior") {
        assert.ok(l.controles && dentro(l.controles, w, h));
        assert.equal(cruza(l.controles, l.mundo), false, "faixa de botões × canvas");
        assert.equal(cruza(l.controles, l.barra), false, "faixa de botões × barra");
      } else if (l.modo === "lateral") {
        const minimo = Math.round(l.ui * j.v.LAYOUT.lateralMinima);
        assert.ok(l.lateral.esquerda >= minimo - 1e-6, `lateral esquerda ${l.lateral.esquerda} < ${minimo}`);
        assert.ok(l.lateral.direita >= minimo - 1e-6, `lateral direita ${l.lateral.direita} < ${minimo}`);
        assert.ok(l.mundo.y >= l.barra.y + l.barra.h - 1e-6);
      } else {
        assert.equal(l.modo, "mesa");
        assert.equal(l.controles, null);
      }

      // Mouse nunca recebe os modos de toque; toque nunca recebe "mesa"
      assert.equal(l.modo === "mesa", !toque);
    });
  }
}

test("cálculo — Galaxy A37 na horizontal usa o modo lateral e ocupa bem mais tela que o layout antigo (38%)", () => {
  const j = carregarJogo();
  const l = lerLayout(j, 891, 411, true, 2.625);
  assert.equal(l.modo, "lateral");
  assert.ok(l.aproveitamento > 0.6, `aproveitamento ${l.aproveitamento.toFixed(2)}`);
  assert.ok(l.mundo.h >= 0.95 * (411 - l.barra.h), "o canvas usa (quase) toda a altura que sobra sob a barra");
});

test("cálculo — escolhe o modo que dá o maior canvas (lateral × inferior)", () => {
  const j = carregarJogo();
  assert.equal(lerLayout(j, 891, 411, true, 2).modo, "lateral");
  assert.equal(lerLayout(j, 844, 390, true, 3).modo, "lateral");
  assert.equal(lerLayout(j, 640, 360, true, 2).modo, "inferior");
  assert.equal(lerLayout(j, 568, 320, true, 2).modo, "inferior");
  assert.equal(lerLayout(j, 1024, 768, true, 2).modo, "inferior");
});

test("cálculo — notebook aproveita quase toda a tela (≥ 85%), inclusive em tela cheia", () => {
  const j = carregarJogo();
  for (const [w, h] of [[1366, 768], [1536, 864], [1920, 1080], [1440, 900], [2560, 1440]]) {
    const l = lerLayout(j, w, h, false, 1);
    assert.ok(l.aproveitamento >= 0.85, `${w}x${h}: ${l.aproveitamento.toFixed(3)}`);
  }
});

test("cálculo — respeita entalhes e barras do sistema (áreas seguras)", () => {
  const j = carregarJogo();
  const seguro = { topo: 0, direita: 47, base: 21, esquerda: 47 };
  const l = lerLayout(j, 844, 390, true, 3, seguro);

  assert.ok(l.mundo.x >= 47 - 1e-6 && l.mundo.x + l.mundo.w <= 844 - 47 + 1e-6);
  assert.ok(l.mundo.y + l.mundo.h <= 390 - 21 + 1e-6);
  assert.ok(l.barra.x >= 47 && l.barra.x + l.barra.w <= 844 - 47 + 1e-6);
});

test("cálculo — janela absurdamente pequena não gera tamanhos negativos nem NaN", () => {
  const j = carregarJogo();
  for (const [w, h] of [[0, 0], [10, 10], [100, 30], [300, 20]]) {
    const l = lerLayout(j, w, h, true, 2);
    for (const valor of [l.mundo.w, l.mundo.h, l.mundo.x, l.mundo.y, l.ui, l.barra.h]) {
      assert.ok(Number.isFinite(valor) && valor >= 0, `${w}x${h}: ${valor}`);
    }
  }
});

test("cálculo — o fator de interface fica entre 0,85 e 1,3 e cresce com a tela", () => {
  const j = carregarJogo();
  assert.equal(j.f.fatorDeInterface(300, 200), 0.85);
  assert.equal(j.f.fatorDeInterface(3000, 2000), 1.3);
  assert.ok(j.f.fatorDeInterface(900, 450) < j.f.fatorDeInterface(1400, 800));
});

test("cálculo — barra compacta só em telas estreitas", () => {
  const j = carregarJogo();
  assert.equal(lerLayout(j, 568, 320, true, 2).compacto, true);
  assert.equal(lerLayout(j, 891, 411, true, 2).compacto, false);
});

// ---------- Resolução interna do canvas ----------

test("resolução interna — acompanha a tela, nunca abaixo de 1× nem acima do teto", () => {
  const j = carregarJogo();
  const e = j.f.escolherEscalaDeRenderizacao;
  assert.equal(e(300, 1), 1);
  assert.equal(e(640, 1), 1);
  assert.equal(e(480, 2), 1.5);
  assert.equal(e(1264, 1), 2);
  assert.equal(e(652, 2.625), 2);       // A37: nítido a 1280×720
  assert.equal(e(2000, 2), 2);          // teto de 2× (desempenho)
  assert.equal(e(2000, 2, 1.5), 1.5);   // teto rebaixado pelo desempenho
  assert.equal(e(100, 1, 1), 1);
});

test("resolução interna — só aumenta quando a largura aumenta", () => {
  const j = carregarJogo();
  let anterior = 0;
  for (let w = 100; w <= 2600; w += 25) {
    const escala = j.f.escolherEscalaDeRenderizacao(w, 1.5);
    assert.ok(escala >= anterior);
    assert.ok(j.v.LAYOUT.escalas.includes(escala));
    anterior = escala;
  }
});

test("resolução interna — degrau abaixo", () => {
  const j = carregarJogo();
  assert.equal(j.f.degrauAbaixoDe(2), 1.75);
  assert.equal(j.f.degrauAbaixoDe(1.25), 1);
  assert.equal(j.f.degrauAbaixoDe(1), 1);
});

// ---------- Integração com a página ----------

test("página — Galaxy A37: canvas 16:9 posicionado, 1280×720 internos, botões de toque visíveis", () => {
  const j = carregarJogo({ janela: { largura: 891, altura: 411, dpr: 2.625, toque: true } });
  const mundo = j.elementos["game-world"].style;
  const container = j.elementos["game-container"];
  const l = j.v.tela.layout;

  assert.equal(container.getAttribute("data-layout"), "lateral");
  assert.equal(container.getAttribute("data-toque"), "sim");
  assert.equal(mundo.width, `${l.mundo.w}px`);
  assert.equal(mundo.height, `${l.mundo.h}px`);
  assert.equal(j.elementos.gameCanvas.width, 1280);
  assert.equal(j.elementos.gameCanvas.height, 720);
  assert.equal(j.elementos["mobile-controls"].style.display, "");
  assert.equal(j.avaliar("falhasDoJogo.length"), 0);
});

test("página — notebook com mouse: controles de toque escondidos e canvas quase na tela toda", () => {
  const j = carregarJogo({ janela: { largura: 1536, altura: 864, dpr: 1, toque: false } });
  assert.equal(j.elementos["game-container"].getAttribute("data-layout"), "mesa");
  assert.equal(j.elementos["mobile-controls"].style.display, "none");
  assert.ok(j.v.tela.layout.aproveitamento > 0.85);
  assert.equal(j.avaliar("document.body.classList.contains('retrato')"), false);
});

test("página — as coordenadas lógicas continuam 640×360 em qualquer tela", () => {
  for (const [, w, h, dpr] of TELAS) {
    const j = carregarJogo({ janela: { largura: w, altura: h, dpr, toque: true } });
    assert.equal(j.v.GAME_WIDTH, 640);
    assert.equal(j.v.GAME_HEIGHT, 360);
    const c = j.elementos.gameCanvas;
    assert.ok(Math.abs(c.width / c.height - 16 / 9) < 0.003, `${w}x${h}: ${c.width}x${c.height}`);
    assert.ok(c.width >= 640);
  }
});

test("página — celular na vertical mostra o aviso de girar (e não esconde os menus)", () => {
  const j = carregarJogo({ janela: { largura: 411, altura: 891, dpr: 2.625, toque: true } });
  assert.equal(j.elementos["girar-aparelho"].classList.contains("hidden"), false);
  assert.equal(j.avaliar("document.body.classList.contains('retrato')"), true);
  assert.equal(j.v.tela.retrato, true);
});

test("página — notebook com janela vertical NÃO pede para girar", () => {
  const j = carregarJogo({ janela: { largura: 500, altura: 900, dpr: 1, toque: false } });
  assert.equal(j.elementos["girar-aparelho"].classList.contains("hidden"), true);
  assert.equal(j.v.tela.retrato, false);
});

function girar(j, largura, altura) {
  j.contexto.innerWidth = largura;
  j.contexto.innerHeight = altura;
  j.f.atualizarLayout();
}

test("girar para a vertical no meio da partida pausa e mostra o aviso; voltar libera o aviso sem retomar", () => {
  const j = carregarJogo({ janela: { largura: 891, altura: 411, dpr: 2, toque: true } });
  j.f.iniciarPartida();
  j.quadros.pendentes.length = 0;
  assert.equal(j.v.gameState.isPaused, false);

  girar(j, 411, 891);
  assert.equal(j.v.gameState.isPaused, true, "pausou");
  assert.equal(j.elementos["pauseScreen"].classList.contains("hidden"), false, "menu de pausa");
  assert.equal(j.elementos["girar-aparelho"].classList.contains("hidden"), false, "aviso");

  girar(j, 891, 411);
  assert.equal(j.elementos["girar-aparelho"].classList.contains("hidden"), true, "aviso some");
  assert.equal(j.v.gameState.isPaused, true, "continua pausado até o jogador apertar CONTINUAR");
});

test("girar com o jogo no menu ou em Game Over não pausa nada", () => {
  const j = carregarJogo({ janela: { largura: 891, altura: 411, dpr: 2, toque: true } });
  girar(j, 411, 891);
  assert.equal(j.v.gameState.isPaused, false);
  assert.equal(j.elementos["girar-aparelho"].classList.contains("hidden"), false);
});

test("redimensionar com o jogo rodando mantém a partida e recalcula o canvas", () => {
  const j = carregarJogo({ janela: { largura: 891, altura: 411, dpr: 2, toque: true } });
  j.f.iniciarPartida();
  j.v.gameState.score = 123;

  for (const [w, h] of [[800, 360], [1024, 768], [640, 360], [960, 411]]) {
    girar(j, w, h);
    assert.equal(j.v.gameState.isPaused, false);
    assert.equal(j.v.gameState.score, 123);
    const l = j.v.tela.layout;
    assert.equal(j.elementos["game-world"].style.width, `${l.mundo.w}px`);
  }
});

test("mudar de resolução interna refaz o céu em cache na escala nova e o jogo continua desenhando", () => {
  const j = carregarJogo({ janela: { largura: 500, altura: 300, dpr: 1, toque: false } });
  assert.equal(j.v.RENDER_SCALE, 1);

  j.f.renderizar();
  assert.notEqual(j.v.camadasCeu, null);
  const larguraAntes = j.v.camadasCeu.fundo.width;

  j.contexto.devicePixelRatio = 2;
  j.contexto.innerWidth = 1366;
  j.contexto.innerHeight = 768;
  j.f.atualizarLayout();

  assert.equal(j.v.RENDER_SCALE, 2);
  assert.equal(j.elementos.gameCanvas.width, 1280);
  // O céu foi descartado e já redesenhado (loop parado) com o dobro de pixels
  assert.notEqual(j.v.camadasCeu, null);
  assert.equal(j.v.camadasCeu.fundo.width, larguraAntes * 2, "camadas refeitas na escala nova");
  j.f.renderizar();
  assert.equal(j.avaliar("falhasDoJogo.length"), 0);
});

test("o tremor da câmera tem o mesmo tamanho visual em qualquer resolução interna", () => {
  const j = carregarJogo();
  j.aleatorio(() => 1);          // (1 - 0,5) × tremor
  j.v.gameState.tremor = 10;

  // O primeiro setTransform de renderizar() é o da câmera (os seguintes são do desenho)
  const chamadas = [];
  const original = j.avaliar("ctx").setTransform;
  j.avaliar("ctx").setTransform = (...a) => { chamadas.push(a); return original(...a); };

  const tx = (escala) => {
    j.avaliar(`RENDER_SCALE = ${escala}`);
    chamadas.length = 0;
    j.f.renderizar();
    return chamadas[0][4];
  };

  const base = tx(1.5);
  assert.equal(base, 5);                    // comportamento original (1,5)
  assert.equal(tx(3), base * 2);
  assert.equal(tx(0.75), base / 2);
});

// ---------- Desempenho ----------

function alimentar(j, quadros, ms) {
  for (let i = 0; i < quadros; i++) j.f.observarDesempenhoDoQuadro(ms);
}

test("desempenho — aparelho lento perde um degrau de resolução por janela, sem passar do mínimo", () => {
  const j = carregarJogo({ janela: { largura: 1366, altura: 768, dpr: 2, toque: false } });
  assert.equal(j.v.RENDER_SCALE, 2);

  const D = j.v.DESEMPENHO;
  const ciclo = D.aquecimento + D.janela;     // após cada troca, aquece de novo (o céu é refeito)

  alimentar(j, ciclo, 40);
  assert.equal(j.v.RENDER_SCALE, 1.75);

  alimentar(j, ciclo, 40);
  assert.equal(j.v.RENDER_SCALE, 1.5);

  alimentar(j, ciclo * 6, 40);
  assert.equal(j.v.RENDER_SCALE, 1, "chega ao mínimo e para");
  alimentar(j, ciclo * 2, 40);
  assert.equal(j.v.RENDER_SCALE, 1);
});

test("desempenho — aparelho que roda a 60 fps ou mais nunca perde qualidade", () => {
  const j = carregarJogo({ janela: { largura: 1366, altura: 768, dpr: 2, toque: false } });
  alimentar(j, 5000, 16.7);
  alimentar(j, 5000, 8.3);
  assert.equal(j.v.RENDER_SCALE, 2);
});

test("desempenho — ignora o aquecimento e quadros isolados de travada (> 100 ms)", () => {
  const j = carregarJogo({ janela: { largura: 1366, altura: 768, dpr: 2, toque: false } });
  const D = j.v.DESEMPENHO;
  alimentar(j, D.aquecimento, 80);          // aquecimento lento não conta
  alimentar(j, D.janela * 3, 16.7);
  for (let i = 0; i < 200; i++) j.f.observarDesempenhoDoQuadro(i % 20 === 0 ? 300 : 16.7);
  assert.equal(j.v.RENDER_SCALE, 2);
});

test("desempenho — o loop real alimenta a medição (quadros simulados, não pausa)", () => {
  const j = carregarJogo({ janela: { largura: 1366, altura: 768, dpr: 2, toque: false } });
  j.novaPartida();
  const antes = j.v.desempenho.vistos;
  j.f.executarQuadro(1000);
  j.f.executarQuadro(1016);
  assert.equal(j.v.desempenho.vistos, antes + 2);

  j.v.gameState.isPaused = true;
  j.f.executarQuadro(1032);
  assert.equal(j.v.desempenho.vistos, antes + 2, "pausado não mede");
});

test("redimensionar a janela devolve o teto de qualidade (a tela mudou)", async () => {
  const j = carregarJogo({ janela: { largura: 1366, altura: 768, dpr: 2, toque: false } });
  const D = j.v.DESEMPENHO;
  alimentar(j, D.aquecimento + D.janela, 40);
  assert.equal(j.v.RENDER_SCALE, 1.75);

  j.f.agendarAtualizacaoDoLayout();
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(j.v.RENDER_SCALE, 2);
});

// ---------- Tela cheia ----------

function elementoCheio(j, { prefixo = false } = {}) {
  const doc = j.avaliar("document");
  const el = doc.documentElement;
  const pedidos = { entrar: 0, sair: 0, travou: 0 };

  const entrar = () => { pedidos.entrar++; doc[prefixo ? "webkitFullscreenElement" : "fullscreenElement"] = el; return Promise.resolve(); };
  el[prefixo ? "webkitRequestFullscreen" : "requestFullscreen"] = entrar;
  doc[prefixo ? "webkitExitFullscreen" : "exitFullscreen"] = () => {
    pedidos.sair++;
    doc.fullscreenElement = null; doc.webkitFullscreenElement = null;
    return Promise.resolve();
  };
  j.contexto.screen.orientation.lock = () => { pedidos.travou++; return Promise.resolve(); };
  return pedidos;
}

test("tela cheia — sem suporte (ex.: iPhone) os botões ficam escondidos e nada quebra", () => {
  const j = carregarJogo();
  const botao = { dataset: { telaCheia: "icone" }, classList: carregarJogo().avaliar("document.body.classList"), setAttribute() {} };
  const marcas = [];
  botao.classList = { toggle: (c, f) => marcas.push([c, f]) };
  j.avaliar("document").querySelectorAll = () => [botao];

  assert.equal(j.f.telaCheiaDisponivel(), false);
  j.f.atualizarBotoesDeTelaCheia();
  assert.deepEqual(marcas, [["hidden", true]]);
  assert.doesNotThrow(() => j.f.alternarTelaCheia());
});

test("tela cheia — alternar entra, sai e tenta travar a orientação na horizontal", async () => {
  const j = carregarJogo();
  const pedidos = elementoCheio(j);

  assert.equal(j.f.telaCheiaDisponivel(), true);
  assert.equal(j.f.telaCheiaAtiva(), false);

  j.f.alternarTelaCheia();
  await new Promise((r) => setImmediate(r));
  assert.equal(pedidos.entrar, 1);
  assert.equal(pedidos.travou, 1);
  assert.equal(j.f.telaCheiaAtiva(), true);

  j.f.alternarTelaCheia();
  assert.equal(pedidos.sair, 1);
  assert.equal(j.f.telaCheiaAtiva(), false);
});

test("tela cheia — funciona com os prefixos antigos do Safari (iPad)", () => {
  const j = carregarJogo();
  const pedidos = elementoCheio(j, { prefixo: true });
  assert.equal(j.f.telaCheiaDisponivel(), true);
  j.f.alternarTelaCheia();
  assert.equal(pedidos.entrar, 1);
  assert.equal(j.f.telaCheiaAtiva(), true);
  j.f.alternarTelaCheia();
  assert.equal(pedidos.sair, 1);
});

test("tela cheia — recusa do navegador não derruba o jogo", async () => {
  const j = carregarJogo();
  const doc = j.avaliar("document");
  doc.documentElement.requestFullscreen = () => Promise.reject(new Error("recusado"));
  assert.doesNotThrow(() => j.f.alternarTelaCheia());
  await new Promise((r) => setImmediate(r));
  assert.equal(j.avaliar("falhasDoJogo.length"), 0);

  doc.documentElement.requestFullscreen = () => { throw new Error("sem gesto"); };
  assert.doesNotThrow(() => j.f.alternarTelaCheia());
});

test("tela cheia — automática no celular só uma vez, e nunca em notebook", () => {
  const celular = carregarJogo({ janela: { largura: 891, altura: 411, dpr: 2, toque: true } });
  const pedidosCelular = elementoCheio(celular);
  celular.f.tentarTelaCheiaAutomatica();
  celular.avaliar("document").fullscreenElement = null;       // o jogador saiu da tela cheia
  celular.f.tentarTelaCheiaAutomatica();
  assert.equal(pedidosCelular.entrar, 1);

  const notebook = carregarJogo({ janela: { largura: 1366, altura: 768, dpr: 1, toque: false } });
  const pedidosNotebook = elementoCheio(notebook);
  notebook.f.tentarTelaCheiaAutomatica();
  assert.equal(pedidosNotebook.entrar, 0);
});

test("tela cheia — o clique em JOGAR (iniciarPartida) dispara a tela cheia automática no celular", () => {
  const j = carregarJogo({ janela: { largura: 891, altura: 411, dpr: 2, toque: true } });
  const pedidos = elementoCheio(j);
  j.f.iniciarPartida();
  assert.equal(pedidos.entrar, 1);
});

test("tela cheia — botões mostram o estado (texto e aria) e a tecla F alterna", () => {
  const j = carregarJogo();
  const pedidos = elementoCheio(j);
  const ouvintes = {};
  j.contexto.addEventListener = (nome, fn) => { (ouvintes[nome] ||= []).push(fn); };
  j.avaliar("document").addEventListener = (nome, fn) => { (ouvintes["doc:" + nome] ||= []).push(fn); };

  const rotulos = [];
  const texto = { dataset: { telaCheia: "texto" }, classList: { toggle() {} }, setAttribute() {}, set textContent(v) { rotulos.push(v); } };
  const icone = { dataset: { telaCheia: "icone" }, classList: { toggle() {} }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  j.avaliar("document").querySelectorAll = () => [texto, icone];

  j.f.iniciarTelaCheia();
  assert.deepEqual(rotulos, ["TELA CHEIA: DESLIGADA"]);

  ouvintes.keydown[0]({ key: "f", repeat: false });
  assert.equal(pedidos.entrar, 1);
  ouvintes.keydown[0]({ key: "f", ctrlKey: true });          // Ctrl+F (buscar) não conta
  ouvintes.keydown[0]({ key: "f", repeat: true });           // tecla segurada não repete
  assert.equal(pedidos.entrar, 1);

  ouvintes["doc:fullscreenchange"][0]();
  assert.equal(rotulos.at(-1), "TELA CHEIA: LIGADA");
  assert.equal(icone.attrs["aria-pressed"], "true");
});

test("primeiro toque em notebook com tela sensível passa a mostrar os controles de toque", () => {
  const j = carregarJogo({ janela: { largura: 1366, altura: 768, dpr: 1, toque: false } });
  const ouvintes = {};
  j.contexto.addEventListener = (nome, fn) => { (ouvintes[nome] ||= []).push(fn); };
  j.f.iniciarLayout();

  assert.equal(j.elementos["mobile-controls"].style.display, "none");
  ouvintes.pointerdown[0]({ pointerType: "mouse" });
  assert.equal(j.v.tela.toque, false);

  ouvintes.pointerdown[0]({ pointerType: "touch" });
  assert.equal(j.v.tela.toque, true);
  assert.equal(j.elementos["mobile-controls"].style.display, "");
  assert.notEqual(j.elementos["game-container"].getAttribute("data-layout"), "mesa");
});

// ---------- HTML e CSS ----------

const html = () => fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
const css = (nome) => fs.readFileSync(path.join(RAIZ, "css/estilos", nome), "utf8");

test("index.html — scripts de layout carregam antes do jogo e do pronto.js", () => {
  const s = scriptsDoIndex();
  const ordem = ["calculo", "desempenho", "tela-cheia", "responsivo"].map((n) => s.indexOf(`js/layout/${n}.js`));
  assert.ok(ordem.every((i) => i >= 0), "todos presentes");
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem, "ordem calculo → desempenho → tela-cheia → responsivo");
  assert.ok(ordem[3] < s.indexOf("js/game/state.js"));
  assert.ok(ordem[0] > s.indexOf("js/config.js"), "depois da config (usa GAME_WIDTH)");
  assert.equal(s.at(-1), "js/inicio/pronto.js");
});

test("index.html — viewport cobre a tela toda; folha layout.css vem por último; turbo está na barra", () => {
  const h = html();
  assert.match(h, /viewport-fit=cover/);

  const links = [...h.matchAll(/<link rel="stylesheet" href="css\/estilos\/([\w-]+\.css)/g)].map((m) => m[1]);
  assert.equal(links.at(-1), "layout.css");
  links.forEach((f) => assert.ok(fs.existsSync(path.join(RAIZ, "css/estilos", f)), f));

  const barra = h.slice(h.indexOf('<header id="hud">'), h.indexOf("</header>"));
  assert.match(barra, /id="turbo-container"/);
  assert.match(barra, /id="turboBar"/);
  assert.match(barra, /id="fullscreenBtn"/);
  assert.match(barra, /id="pauseBtn"/);
  assert.match(h, /id="girar-aparelho"/);
  assert.match(h, /id="leftBtn"[\s\S]*id="turboBtn"[\s\S]*id="rightBtn"/);
});

test("CSS — o mundo não tem borda que roube pixels do canvas, e o canvas preenche o contêiner 16:9", () => {
  const l = css("layout.css");
  const bloco = l.match(/#game-container\[data-layout\] #game-world \{[^}]*\}/)[0];
  assert.match(bloco, /border:\s*0/);
  assert.match(l, /#game-container\[data-layout\] #gameCanvas \{[^}]*width:\s*100%;[^}]*height:\s*100%/);
  assert.doesNotMatch(css("base.css"), /min\(96vw|max-width:\s*1100px/);
});

test("CSS — botões de toque têm pelo menos 44 px e as laterais deixam o meio livre para toques", () => {
  const l = css("layout.css");
  assert.match(l, /--seta: clamp\(44px/);
  assert.equal((l.match(/max\(44px, calc\(46px/g) || []).length, 2);
  assert.match(l, /#mobile-controls \{[^}]*pointer-events:\s*none/);
  assert.match(l, /#mobile-controls button \{[^}]*pointer-events:\s*auto/);
});

test("CSS — o aviso de rotação respeita 'reduzir movimento'", () => {
  assert.match(css("layout.css"), /prefers-reduced-motion: reduce/);
});

test("o ZIP não depende de arquivos CSS/JS soltos: todo ?v= é igual à versão do jogo (3.3.0)", () => {
  const versoes = new Set([...html().matchAll(/\?v=([\w.]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...versoes], ["3.3.0"]);
  assert.equal(carregarJogo().avaliar("VERSAO_DO_JOGO"), "3.3.0");
});
