// tests/helpers/carregar-jogo.js
// Carrega os scripts REAIS do jogo, na mesma ordem do index.html, dentro de um
// contexto isolado (node:vm) com DOM, canvas, áudio e localStorage simulados.
// Sem dependências externas.

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const RAIZ = path.resolve(__dirname, "..", "..");

function scriptsDoIndex() {
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  return [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1].split("?")[0]);
}

function paraCamelCase(nome) {
  return nome.replace(/^data-/, "").replace(/-(\w)/g, (m, c) => c.toUpperCase());
}

function criarElemento(id = "", atributosIniciais = {}) {
  const classes = new Set();
  const el = {
    id,
    style: {},
    textContent: "",
    innerHTML: "",
    disabled: false,
    clientWidth: 640,
    clientHeight: 360,
    width: 960,
    height: 540,
    children: [],
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      toggle: (c, forcar) => {
        const ligar = forcar === undefined ? !classes.has(c) : forcar;
        if (ligar) classes.add(c); else classes.delete(c);
      },
      contains: (c) => classes.has(c),
    },
    atributos: { ...atributosIniciais },
    dataset: Object.fromEntries(
      Object.entries(atributosIniciais).filter(([n]) => n.startsWith("data-")).map(([n, v]) => [paraCamelCase(n), v])
    ),
    setAttribute(nome, valor) {
      el.atributos[nome] = String(valor);
      if (nome.startsWith("data-")) el.dataset[paraCamelCase(nome)] = String(valor);
    },
    getAttribute(nome) { return nome in el.atributos ? el.atributos[nome] : null; },
    closest: () => null,
    addEventListener() {},
    removeEventListener() {},
    appendChild(f) { el.children.push(f); if (el.__registro) el.__registro(f); return f; },
    append(...filhos) { filhos.forEach((f) => el.appendChild(f)); },
    remove() {},
    setPointerCapture() {},
    getBoundingClientRect: () => ({ width: el.clientWidth, height: el.clientHeight, left: 0, top: 0 }),
    getContext: () => el.__ctx,
  };
  return el;
}

// Contexto 2D que aceita qualquer chamada e conta quantas vezes cada método foi usado
function criarContexto2D() {
  const chamadas = {};
  const ultimosArgumentos = {};
  const textos = [];
  const base = {
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    measureText: () => ({ width: 10 }),
  };

  const ctx = new Proxy(base, {
    get(alvo, prop) {
      if (prop === "__chamadas") return chamadas;
      if (prop === "__ultimosArgumentos") return ultimosArgumentos;
      if (prop === "__textos") return textos;
      if (prop in alvo) {
        const v = alvo[prop];
        if (typeof v === "function") {
          return (...args) => { chamadas[prop] = (chamadas[prop] || 0) + 1; return v(...args); };
        }
        return v;
      }
      if (typeof prop === "symbol") return undefined;
      return (...args) => {
        chamadas[prop] = (chamadas[prop] || 0) + 1;
        ultimosArgumentos[prop] = args;
        if (prop === "fillText" || prop === "strokeText") textos.push(String(args[0]));
        return undefined;
      };
    },
    set(alvo, prop, valor) { alvo[prop] = valor; return true; },
  });

  return ctx;
}

function criarAudio() {
  const contagem = { osciladores: 0, ruidos: 0, contextos: 0, resumes: 0 };

  class AudioContextFalso {
    constructor() { contagem.contextos++; this.currentTime = 0; this.sampleRate = 8000; this.state = "suspended"; this.destination = {}; }
    resume() { contagem.resumes++; this.state = "running"; }
    createOscillator() {
      contagem.osciladores++;
      return { type: "", frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (x) => x, start() {}, stop() {} };
    }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (x) => x }; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() { contagem.ruidos++; return { connect: (x) => x, start() {} }; }
    createBiquadFilter() { return { Q: {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (x) => x }; }
  }

  class AudioFalso {
    constructor(src) { this.src = src; this.volume = 1; this.currentTime = 0; this.paused = true; this.ended = false; this.loop = false; this.tocadas = 0; }
    play() { this.paused = false; this.tocadas++; return Promise.resolve(); }
    pause() { this.paused = true; }
  }

  return { contagem, AudioContextFalso, AudioFalso };
}

/**
 * Carrega o jogo. Opções:
 *   tela: { largura, altura }  tamanho do canvas na tela (CSS px) — padrão 640x360
 */
function carregarJogo(opcoes = {}) {
  const tela = opcoes.tela || { largura: 640, altura: 360 };
  // Janela do navegador simulada (padrão: notebook sem toque)
  const janela = { largura: 1366, altura: 768, dpr: 1, toque: false, ...(opcoes.janela || {}) };
  const elementos = {};
  const armazenamento = { ...(opcoes.armazenamento || {}) };
  const audio = criarAudio();
  const ctx2d = criarContexto2D();
  const quadros = { pendentes: [], proximoId: 1, cancelados: 0 };

  // Todos os elementos que a página tem (ou ganha por código): permite
  // querySelectorAll("[data-i18n]") etc. sobre o HTML REAL do index.html
  const todos = [];
  const registrar = (el) => {
    if (todos.includes(el)) return el;
    todos.push(el);
    el.__registro = registrar;
    (el.children || []).forEach(registrar);
    return el;
  };

  const preparar = (el, id) => {
    if (id === "gameCanvas") {
      el.__ctx = ctx2d;
      el.clientWidth = tela.largura;
      el.clientHeight = tela.altura;
    }
    return registrar(el);
  };

  const obter = (id) => {
    if (!elementos[id]) elementos[id] = preparar(criarElemento(id), id);
    return elementos[id];
  };

  // Lê o index.html: cria elementos com id ou atributos data-*
  const htmlDaPagina = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const marca of htmlDaPagina.matchAll(/<(?!script|link|meta|\/)(\w+)([^>]*)>/g)) {
    const atributos = {};
    for (const a of marca[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) atributos[a[1]] = a[2] === undefined ? "" : a[2];
    if (!atributos.id && !Object.keys(atributos).some((n) => n.startsWith("data-"))) continue;

    const el = criarElemento(atributos.id || "", atributos);
    if (atributos.class) atributos.class.split(/\s+/).forEach((c) => el.classList.add(c));
    if (atributos.id) elementos[atributos.id] = el;
    preparar(el, atributos.id);
  }

  const consultar = (seletor) => {
    const m = seletor.match(/^\[([\w-]+)\]$/);
    if (!m) return [];
    return todos.filter((el) => m[1] in el.atributos);
  };

  const sandbox = {
    console: { log() {}, error() {}, warn() {} },
    performance: { now: () => Date.now() },
    setTimeout, clearTimeout,
    localStorage: {
      getItem: (k) => { if (opcoes.armazenamentoQuebrado) throw new Error("bloqueado"); return k in armazenamento ? armazenamento[k] : null; },
      setItem: (k, v) => { if (opcoes.armazenamentoQuebrado) throw new Error("bloqueado"); armazenamento[k] = String(v); },
      removeItem: (k) => { delete armazenamento[k]; },
    },
    Audio: audio.AudioFalso,
    AudioContext: audio.AudioContextFalso,
    requestAnimationFrame: (fn) => { const id = quadros.proximoId++; quadros.pendentes.push({ id, fn }); return id; },
    cancelAnimationFrame: (id) => { quadros.cancelados++; quadros.pendentes = quadros.pendentes.filter((q) => q.id !== id); },
    location: { reload() {} },
    innerWidth: janela.largura,
    innerHeight: janela.altura,
    devicePixelRatio: janela.dpr,
    matchMedia: (consulta) => ({
      matches: /pointer:\s*coarse/.test(consulta) ? janela.toque : false,
      addEventListener() {},
    }),
    getComputedStyle: () => ({ paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px" }),
    screen: { orientation: { lock: () => Promise.resolve() } },
    document: {
      body: preparar(criarElemento("body"), "body"),
      documentElement: preparar(criarElemento("html"), "html"),
      hidden: false,
      getElementById: obter,
      querySelector: (sel) => consultar(sel)[0] || null,
      querySelectorAll: consultar,
      createElement: () => { const e = criarElemento(); e.__ctx = criarContexto2D(); return e; },
      createTextNode: () => ({}),
      addEventListener() {},
      removeEventListener() {},
    },
    addEventListener() {},
    removeEventListener() {},
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const contexto = vm.createContext(sandbox);
  const scripts = scriptsDoIndex();

  for (const arquivo of scripts) {
    const caminho = path.join(RAIZ, arquivo);
    vm.runInContext(fs.readFileSync(caminho, "utf8"), contexto, { filename: arquivo });
  }

  // Expõe as constantes/objetos de topo (const/let não viram propriedades do global)
  const nomes = [
    "gameState", "powerUps", "POWERUPS", "TIPOS_DE_POWERUP", "itensDePowerUp", "geradorDePowerUps",
    "popupsDePowerUp", "aneisDeEscudo", "obstacles", "particles", "player", "combo", "quase",
    "COMBO", "QUASE_COLISAO", "TIPOS_DE_OBSTACULO", "TROPECO", "diretor", "input",
    "PLAYER_Z", "HITBOX_WIDTH_FACTOR", "PLAYER_WORLD_WIDTH", "GAME_WIDTH", "GAME_HEIGHT",
    "EFEITOS_NO_HUD", "gerenciadorAudio", "ctx", "canvas", "LANE_COUNT",
    "LAYOUT", "tela", "RENDER_SCALE", "DESEMPENHO", "desempenho", "camadasCeu",
  ];

  vm.runInContext(
    `globalThis.__j = { ${nomes.map((n) => `get ${n}() { return typeof ${n} === "undefined" ? undefined : ${n}; }`).join(", ")} };`,
    contexto
  );

  const jogo = {
    contexto,
    scripts,
    elementos,
    todos,
    armazenamento,
    audio: audio.contagem,
    quadros,
    ctx2d,
    janela,
    v: sandbox.__j,        // constantes e objetos de estado
    f: sandbox,            // funções declaradas (global)
    avaliar: (codigo) => vm.runInContext(codigo, contexto),

    // Aleatório controlado: recebe uma função () => número em [0,1)
    aleatorio(fn) { sandbox.__rand = fn; vm.runInContext("Math.random = () => globalThis.__rand();", contexto); },

    // Gerador pseudoaleatório determinístico (mulberry32)
    semente(s) {
      let a = s >>> 0;
      jogo.aleatorio(() => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      });
    },

    // Estado limpo de partida, sem passar pelo loop
    novaPartida() {
      jogo.semente(12345);
      sandbox.resetGame();
      quadros.pendentes.length = 0;
      sandbox.pararLoop();
      jogo.v.diretor.temporizador = 1e9;
      jogo.v.diretor.fila.length = 0;
      jogo.v.geradorDePowerUps.temporizador = 1e9;
    },
  };

  return jogo;
}

module.exports = { carregarJogo, scriptsDoIndex, RAIZ };
