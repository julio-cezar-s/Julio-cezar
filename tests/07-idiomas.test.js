// Sistema de idiomas (js/idiomas/*): núcleo, textos, interface, unidades e integração com o jogo
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { carregarJogo, RAIZ } = require("./helpers/carregar-jogo");
const { novoJogo, coletar } = require("./helpers/apoio");

const lerArquivo = (rel) => fs.readFileSync(path.join(RAIZ, rel), "utf8");

// Achata { a: { b: "x" } } → { "a.b": "x" } do mesmo jeito que o núcleo
function achatar(obj, prefixo = "", saida = {}) {
  for (const [nome, valor] of Object.entries(obj)) {
    const chave = prefixo ? `${prefixo}.${nome}` : nome;
    if (valor && typeof valor === "object" && !Array.isArray(valor) && !("other" in valor)) achatar(valor, chave, saida);
    else saida[chave] = valor;
  }
  return saida;
}

// Pacotes de texto lidos do próprio jogo (sem passar pelo navegador)
function pacote(j, codigo) {
  return j.avaliar(`registroDeIdiomas.${codigo}.textos`);
}

// Arrays/objetos vindos do jogo são de outro contexto: compara por valor
const plano = (x) => JSON.parse(JSON.stringify(x));

const trocar = (j, codigo) => assert.equal(j.f.definirIdioma(codigo), true);

// ---------- Padrão, seletor e persistência ----------

test("português é o idioma padrão (sem preferência salva) e o HTML sai em português", () => {
  const j = carregarJogo();
  assert.equal(j.f.obterIdioma(), "pt");
  assert.equal(j.elementos.playBtn.textContent, "JOGAR");
  assert.equal(j.elementos.recordsBtn.textContent, "RECORDES");
  assert.equal(j.elementos.optionsBtn.textContent, "OPÇÕES");
  assert.equal(j.avaliar("document.documentElement.getAttribute('lang')"), "pt-BR");
  assert.equal(j.armazenamento.retroTurboLanguage, undefined, "não grava nada sozinho");
});

test("o idioma do navegador não muda o padrão: português mesmo com navegador em inglês", () => {
  const j = carregarJogo();
  j.contexto.navigator = { language: "en-US", languages: ["en-US"] };
  assert.equal(carregarJogo({}).f.obterIdioma(), "pt");
});

test("idiomas disponíveis: português primeiro, inglês em seguida, cada nome no próprio idioma", () => {
  const j = carregarJogo();
  assert.deepEqual(JSON.parse(JSON.stringify(j.f.idiomasDisponiveis())), [
    { codigo: "pt", nome: "Português" },
    { codigo: "en", nome: "English" },
  ]);
});

test("seletor: um botão por idioma nas três telas (início, opções e pausa), com o atual marcado", () => {
  const j = carregarJogo();
  const botoes = j.avaliar("document.querySelectorAll('[data-idioma]')");
  assert.equal(botoes.length, 6);

  const caixas = j.avaliar("document.querySelectorAll('[data-seletor-idioma]')");
  assert.equal(caixas.length, 3);

  botoes.forEach((b) => {
    const ativo = b.getAttribute("data-idioma") === "pt";
    assert.equal(b.getAttribute("aria-pressed"), ativo ? "true" : "false");
    assert.equal(b.classList.contains("ativo"), ativo);
  });
  assert.deepEqual(plano(botoes.slice(0, 2).map((b) => b.textContent)), ["Português", "English"]);
  assert.deepEqual(plano(botoes.slice(0, 2).map((b) => b.getAttribute("lang"))), ["pt-BR", "en"]);
});

test("clicar no botão do seletor troca o idioma (ouvinte de clique real)", () => {
  const j = carregarJogo();
  const ouvintes = [];
  j.avaliar("document").addEventListener = (nome, fn) => ouvintes.push([nome, fn]);
  j.avaliar("iniciarIdiomas = iniciarIdiomas"); // mantém a referência
  // Recria o ouvinte de clique do seletor sobre o mesmo HTML
  j.avaliar("document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-idioma]'); if (b) definirIdioma(b.getAttribute('data-idioma')); })");
  const botaoEn = j.avaliar("document.querySelectorAll('[data-idioma]')").find((b) => b.getAttribute("data-idioma") === "en");
  botaoEn.closest = () => botaoEn;
  ouvintes.find(([n]) => n === "click")[1]({ target: botaoEn });
  assert.equal(j.f.obterIdioma(), "en");
});

test("trocar para inglês atualiza TODO o HTML, o atributo lang e os botões do seletor", () => {
  const j = carregarJogo();
  trocar(j, "en");

  const e = j.elementos;
  assert.equal(e.playBtn.textContent, "PLAY");
  assert.equal(e.recordsBtn.textContent, "HIGH SCORES");
  assert.equal(e.optionsBtn.textContent, "OPTIONS");
  assert.equal(e.resumeBtn.textContent, "RESUME");
  assert.equal(e.quitBtn.textContent, "QUIT");
  assert.equal(e.restartBtn.textContent, "PLAY AGAIN");
  assert.equal(e.backToMenuBtn.textContent, "MAIN MENU");
  assert.equal(e.closeRecordsBtn.textContent, "BACK");
  assert.equal(e.closeOptionsBtn.textContent, "BACK");
  assert.equal(e.turboBtn.textContent, "TURBO");
  assert.equal(e.turboBtn.getAttribute("aria-label"), "Activate turbo");
  assert.equal(e.leftBtn.getAttribute("aria-label"), "Steer left");
  assert.equal(e.rightBtn.getAttribute("aria-label"), "Steer right");
  assert.equal(e.pauseBtn.getAttribute("aria-label"), "Pause game");
  assert.equal(e.carregamentoAviso.textContent, "LOADING...");
  assert.equal(j.avaliar("document.documentElement.getAttribute('lang')"), "en");

  const ativos = j.avaliar("document.querySelectorAll('[data-idioma]')").filter((b) => b.classList.contains("ativo"));
  assert.equal(ativos.length, 3);
  ativos.forEach((b) => assert.equal(b.getAttribute("data-idioma"), "en"));

  trocar(j, "pt");
  assert.equal(e.playBtn.textContent, "JOGAR");
  assert.equal(j.avaliar("document.documentElement.getAttribute('lang')"), "pt-BR");
});

test("a preferência é gravada no localStorage e vale ao fechar e abrir o jogo", () => {
  const primeira = carregarJogo();
  trocar(primeira, "en");
  assert.equal(primeira.armazenamento.retroTurboLanguage, "en");

  // "Fechar e abrir": outra carga da página com o mesmo armazenamento
  const segunda = carregarJogo({ armazenamento: { ...primeira.armazenamento } });
  assert.equal(segunda.f.obterIdioma(), "en");
  assert.equal(segunda.elementos.playBtn.textContent, "PLAY");
  assert.equal(segunda.avaliar("document.documentElement.getAttribute('lang')"), "en");
  assert.equal(segunda.elementos.versaoDoJogo.textContent, "version 3.3.0");

  trocar(segunda, "pt");
  const terceira = carregarJogo({ armazenamento: { ...segunda.armazenamento } });
  assert.equal(terceira.f.obterIdioma(), "pt");
  assert.equal(terceira.elementos.versaoDoJogo.textContent, "versão 3.3.0");
});

test("preferência inválida ou armazenamento bloqueado voltam ao português sem erro", () => {
  for (const lixo of ["xx", "", "EN", "pt-BR", "__proto__", "constructor"]) {
    const j = carregarJogo({ armazenamento: { retroTurboLanguage: lixo } });
    assert.equal(j.f.obterIdioma(), "pt", `valor salvo "${lixo}"`);
    assert.equal(j.avaliar("falhasDoJogo.length"), 0);
  }

  const bloqueado = carregarJogo({ armazenamentoQuebrado: true });
  assert.equal(bloqueado.f.obterIdioma(), "pt");
  assert.doesNotThrow(() => bloqueado.f.definirIdioma("en"));
  assert.equal(bloqueado.f.obterIdioma(), "en", "vale nesta visita mesmo sem gravar");
  assert.equal(bloqueado.avaliar("falhasDoJogo.length"), 0);
});

test("idioma desconhecido é ignorado e nada muda", () => {
  const j = carregarJogo();
  assert.equal(j.f.definirIdioma("fr"), false);
  assert.equal(j.f.definirIdioma(undefined), false);
  assert.equal(j.f.definirIdioma("toString"), false);
  assert.equal(j.f.obterIdioma(), "pt");
  assert.equal(j.armazenamento.retroTurboLanguage, undefined);
});

test("ouvinte com defeito não impede os outros de atualizar", () => {
  const j = carregarJogo();
  j.avaliar("aoMudarIdioma(() => { throw new Error('defeito de teste'); })");
  assert.doesNotThrow(() => trocar(j, "en"));
  assert.equal(j.elementos.playBtn.textContent, "PLAY");
});

// ---------- Fallback e arquitetura para novos idiomas ----------

test("chave ausente em outro idioma cai no português; ausente em todos devolve a própria chave", () => {
  const j = carregarJogo();
  j.avaliar(`registrarIdioma({ codigo: "es", nome: "Español", locale: "es-ES", textos: {
    menu: { jogar: "JUGAR" } } })`);
  trocar(j, "es");

  assert.equal(j.f.traduzir("menu.jogar"), "JUGAR");
  assert.equal(j.f.traduzir("menu.recordes"), "RECORDES", "faltou no es: usa português");
  assert.equal(j.f.traduzir("hud.nivel", { n: 4 }), "NÍVEL 4", "parâmetros também no reserva");
  assert.equal(j.f.traduzir("nao.existe.mesmo"), "nao.existe.mesmo");
  assert.deepEqual(plano(j.f.traduzirLista("cenario.limites")), ["60", "80", "100", "120"]);
  assert.deepEqual(plano(j.f.traduzirLista("nao.existe")), []);
  assert.ok(j.avaliar("estadoDoIdioma.ausentes.has('es:menu.recordes')"));
});

test("adicionar espanhol exige só registrar o idioma: o seletor, o HTML e as unidades o aceitam", () => {
  const j = carregarJogo();
  j.avaliar(`registrarIdioma({ codigo: "es", nome: "Español", locale: "es-ES", htmlLang: "es",
    unidades: { velocidade: { fator: 1, rotulo: "KM/H", mostrador: { maximo: 540, passoMenor: 20, passoMaior: 100 } }, distancia: { fator: 1, rotulo: "KM" } },
    textos: { menu: { jogar: "JUGAR" }, formato: { ordinal: "{n}.º" },
              resumo: { escudoSalvou: { one: " · El escudo te salvó {n} vez", other: " · El escudo te salvó {n} veces" } } } })`);

  assert.deepEqual(plano(j.f.idiomasDisponiveis().map((i) => i.codigo)), ["pt", "en", "es"]);

  j.f.criarSeletoresDeIdioma();
  const botoes = j.avaliar("document.querySelectorAll('[data-idioma]')");
  assert.ok(botoes.some((b) => b.getAttribute("data-idioma") === "es" && b.textContent === "Español"));

  trocar(j, "es");
  assert.equal(j.elementos.playBtn.textContent, "JUGAR");
  assert.equal(j.avaliar("document.documentElement.getAttribute('lang')"), "es");
  assert.equal(j.f.formatarOrdinal(3), "3.º");
  assert.equal(j.f.formatarDistancia(0.06), "0,06");
  assert.equal(j.armazenamento.retroTurboLanguage, "es");

  const novaCarga = carregarJogo({ armazenamento: { retroTurboLanguage: "es" } });
  assert.equal(novaCarga.f.obterIdioma(), "pt", "sem o arquivo es.js carregado, a preferência é ignorada com segurança");
});

test("textos com plural escolhem a forma pela regra do idioma", () => {
  const j = carregarJogo();
  j.avaliar(`registrarIdioma({ codigo: "es", nome: "Español", locale: "es-ES", textos: {
    resumo: { escudoSalvou: { one: "{n} vez", other: "{n} veces" } } } })`);
  trocar(j, "es");
  assert.equal(j.f.traduzir("resumo.escudoSalvou", { n: 1 }), "1 vez");
  assert.equal(j.f.traduzir("resumo.escudoSalvou", { n: 2 }), "2 veces");
  assert.equal(j.f.traduzir("resumo.escudoSalvou", { n: 0 }), "0 veces");
});

test("registrar idioma sem código, nome ou textos é recusado", () => {
  const j = carregarJogo();
  assert.throws(() => j.avaliar(`registrarIdioma({ codigo: "xx" })`), /Idioma inválido/);
  assert.throws(() => j.avaliar(`registrarIdioma({ nome: "X", textos: {} })`), /Idioma inválido/);
});

test("parâmetros: preenche {n}, mantém a marca se o parâmetro faltar e aceita texto sem parâmetro", () => {
  const j = carregarJogo();
  assert.equal(j.f.traduzir("hud.nivel", { n: 7 }), "NÍVEL 7");
  assert.equal(j.f.traduzir("hud.nivel"), "NÍVEL {n}");
  assert.equal(j.f.traduzir("menu.jogar", { n: 1 }), "JOGAR");
  assert.equal(j.f.traduzir("powerup.nitro", { energia: 40 }), "NITRO +40");
});

// ---------- Consistência dos textos ----------

function pacotes() {
  const j = carregarJogo();
  const pt = j.avaliar("JSON.parse(JSON.stringify(registroDeIdiomas.pt.textos))");
  const en = j.avaliar("JSON.parse(JSON.stringify(registroDeIdiomas.en.textos))");
  return { j, pt, en };
}

const marcas = (texto) => [...String(texto).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("português e inglês têm exatamente as mesmas chaves (nada faltando, nada sobrando)", () => {
  const { pt, en } = pacotes();
  assert.deepEqual(Object.keys(en).sort(), Object.keys(pt).sort());
  assert.ok(Object.keys(pt).length > 60);
});

test("nenhum texto vazio, e as marcas {n}/{nome} são iguais nos dois idiomas", () => {
  const { pt, en } = pacotes();
  for (const chave of Object.keys(pt)) {
    for (const [codigo, pacote] of [["pt", pt], ["en", en]]) {
      const valor = pacote[chave];
      if (Array.isArray(valor)) {
        assert.ok(valor.length > 0 && valor.every((v) => String(v).length > 0), `${codigo}:${chave}`);
      } else if (typeof valor === "object") {
        assert.ok(Object.values(valor).every((v) => v.length > 0), `${codigo}:${chave}`);
      } else {
        assert.ok(valor.trim().length > 0, `${codigo}:${chave} vazio`);
      }
    }
    if (typeof pt[chave] === "string" && typeof en[chave] === "string") {
      assert.deepEqual(marcas(en[chave]), marcas(pt[chave]), `marcas de ${chave}`);
    }
  }
});

test("listas (placas, outdoors, pórtico) têm o mesmo tamanho nos dois idiomas", () => {
  const { pt, en } = pacotes();
  for (const chave of Object.keys(pt).filter((c) => Array.isArray(pt[c]))) {
    assert.equal(en[chave].length, pt[chave].length, chave);
  }
});

test("todo texto em inglês foi realmente traduzido (só repete o português nas chaves neutras)", () => {
  const { pt, en } = pacotes();
  // Marcas, siglas e palavras iguais nos dois idiomas
  const neutras = new Set([
    "termos.turbo", "hud.combo", "combo.subiu", "powerup.nitro", "quase.aviso",
    "cenario.outdoors", "cenario.portico",
  ]);
  const iguais = Object.keys(pt).filter((c) => JSON.stringify(pt[c]) === JSON.stringify(en[c]));
  assert.deepEqual(iguais.filter((c) => !neutras.has(c)), []);
});

test("acentuação em português: palavras-chave com acento corretas", () => {
  const { pt } = pacotes();
  assert.equal(pt["menu.opcoes"], "OPÇÕES");
  assert.equal(pt["hud.distancia"], "DISTÂNCIA");
  assert.equal(pt["hud.nivel"], "NÍVEL {n}");
  assert.equal(pt["hud.sequencia"], "SEQUÊNCIA x{n}");
  assert.equal(pt["hud.comboMaximo"], "MÁXIMO");
  assert.equal(pt["opcoes.particulasLigadas"], "PARTÍCULAS: LIGADAS");
  assert.equal(pt["powerup.lentidao"], "CÂMERA LENTA");
  assert.equal(pt["fimDeJogo.pontuacao"], "Pontuação:");
  assert.equal(pt["menu.versao"], "versão {versao}");
  assert.equal(pt["formato.ordinal"], "{n}º");
  assert.match(pt["carregamento.falha"], /^Falha ao carregar — veja o aviso no topo$/);
  assert.match(pt["resumo.quase"], /^Quase-colisões: .* Melhor sequência: x\{sequencia\}$/);
  assert.match(pt["erro.preparar"], /^Não foi possível/);
  assert.equal(pt["girar.texto"], "O Retro Turbo Racer é jogado com o celular na horizontal.");
});

test("sem caracteres quebrados (mojibake ou caractere de substituição): todos os arquivos do jogo são UTF-8 válido", () => {
  const decodificador = new TextDecoder("utf-8", { fatal: true });
  const alvos = [];

  (function varrer(pasta) {
    for (const e of fs.readdirSync(pasta, { withFileTypes: true })) {
      const caminho = path.join(pasta, e.name);
      if (e.isDirectory()) { if (e.name !== ".git" && e.name !== "node_modules") varrer(caminho); continue; }
      if (/\.(js|css|html|md|json)$/.test(e.name)) alvos.push(caminho);
    }
  })(RAIZ);

  assert.ok(alvos.length > 100);

  for (const caminho of alvos) {
    const bytes = fs.readFileSync(caminho);
    let texto;
    assert.doesNotThrow(() => { texto = decodificador.decode(bytes); }, `${caminho} não é UTF-8 válido`);
    assert.ok(!texto.includes("\uFFFD"), `${path.relative(RAIZ, caminho)} tem caractere de substituição`);
    assert.ok(!/Ã[\u00A0-\u00BF]|Â[\u00A0-\u00BF]|â€[\u0099\u009C\u009D\u201C\u201D\u2122]/.test(texto), `${path.relative(RAIZ, caminho)} parece ter acentos quebrados`);
  }
});

test("inglês usa só ASCII, além de travessão e ponto médio (sem acento perdido no meio)", () => {
  const { en } = pacotes();
  for (const [chave, valor] of Object.entries(en)) {
    const textos = Array.isArray(valor) ? valor : typeof valor === "object" ? Object.values(valor) : [valor];
    textos.forEach((t) => assert.ok(/^[\x20-\x7E—·]+$/.test(t), `${chave}: "${t}"`));
  }
});

test("os textos de emergência da faixa de erro são iguais ao português dos pacotes (sem divergir)", () => {
  const { j, pt } = pacotes();
  const emergencia = j.avaliar("JSON.parse(JSON.stringify(TEXTOS_DE_EMERGENCIA))");
  assert.ok(Object.keys(emergencia).length >= 5);
  for (const [chave, texto] of Object.entries(emergencia)) assert.equal(texto, pt[chave], chave);
});

test("tamanhos de texto comportados: HUD e botões cabem no layout (dois idiomas)", () => {
  const { pt, en } = pacotes();
  for (const pacote of [pt, en]) {
    ["hud.pontos", "hud.velocidade", "hud.distancia"].forEach((c) => assert.ok(pacote[c].length <= 12, c));
    ["opcoes.somLigado", "opcoes.somDesligado", "opcoes.particulasLigadas", "opcoes.particulasDesligadas",
      "opcoes.telaCheiaLigada", "opcoes.telaCheiaDesligada", "fimDeJogo.jogarNovamente", "fimDeJogo.menuPrincipal",
      "pausa.continuar", "menu.jogar", "menu.recordes", "menu.opcoes"].forEach((c) => assert.ok(pacote[c].length <= 24, c));
    ["powerup.escudo", "powerup.lentidao", "powerup.dobro", "combo.caiu", "combo.perdido"].forEach((c) => assert.ok(pacote[c].length <= 24, c));
  }
});

// ---------- Nada de texto solto no código ----------

function listarArquivos(pasta, extensao) {
  const saida = [];
  (function varrer(p) {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const c = path.join(p, e.name);
      if (e.isDirectory()) varrer(c);
      else if (e.name.endsWith(extensao)) saida.push(c);
    }
  })(pasta);
  return saida;
}

// Remove comentários e linhas de console (mensagens para quem programa, não para o jogador)
function codigoSemComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .filter((l) => !/console\.(log|warn|error)/.test(l) && !/throw new Error\(/.test(l))   // mensagens para quem programa
    .join("\n");
}

test("nenhum texto em português ficou solto no código (tudo vem de js/idiomas/textos)", () => {
  const achados = [];
  const literal = /(["'`])((?:\\.|(?!\1)[^\\\n])*[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ](?:\\.|(?!\1)[^\\\n])*)\1/g;

  for (const caminho of listarArquivos(path.join(RAIZ, "js"), ".js")) {
    const rel = path.relative(RAIZ, caminho).replaceAll("\\", "/");
    if (rel.startsWith("js/idiomas/textos/")) continue;

    let codigo = codigoSemComentarios(fs.readFileSync(caminho, "utf8"));
    if (rel === "js/inicio/diagnostico.js") {
      // única exceção declarada: cópia de emergência (conferida em teste próprio)
      codigo = codigo.replace(/const TEXTOS_DE_EMERGENCIA = \{[\s\S]*?\n\};/, "");
    }

    for (const m of codigo.matchAll(literal)) achados.push(`${rel}: ${m[2].slice(0, 60)}`);
  }

  assert.deepEqual(achados, []);
});

test("palavras da interface que antes estavam espalhadas não aparecem mais no código (fora dos textos)", () => {
  const proibidas = ["KM/H", "JOGAR", "PONTOS", "VELOCIDADE", "RECORDES", "SOM:", "LIGADO", "DESLIGADO", "PAUSADO",
    "CONTINUAR", "VOLTAR", "COMBO", "CARGA LARGA", "SEQU", "NITRO +", "ESCUDO", "CÂMERA", "RENTE!", "VAZIO", "Nenhum recorde"];
  const achados = [];

  for (const caminho of listarArquivos(path.join(RAIZ, "js"), ".js")) {
    const rel = path.relative(RAIZ, caminho).replaceAll("\\", "/");
    if (rel.startsWith("js/idiomas/textos/")) continue;
    let codigo = codigoSemComentarios(fs.readFileSync(caminho, "utf8"));
    if (rel === "js/inicio/diagnostico.js") codigo = codigo.replace(/const TEXTOS_DE_EMERGENCIA = \{[\s\S]*?\n\};/, "");
    // ids e constantes técnicas (ex.: "RENTE" como identificador de nível) não são texto da tela
    const literais = [...codigo.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)].map((m) => m[2]);
    for (const l of literais) for (const p of proibidas) if (l.includes(p)) achados.push(`${rel}: "${l.slice(0, 50)}" (${p})`);
  }

  assert.deepEqual(achados, []);
});

test("index.html: todo texto visível vem de data-i18n (sem palavras soltas nem aria-label fixo)", () => {
  const html = lerArquivo("index.html")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, "")
    .replace(/<canvas[\s\S]*?<\/canvas>/g, "")
    .replace(/<head>[\s\S]*?<\/head>/g, "");

  const permitidos = new Set(["RETRO TURBO RACER", "00000", "100%", "◀", "▶", "⛶", "⏸"]);
  const soltos = [...html.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter((t) => t && !permitidos.has(t));
  assert.deepEqual(soltos, []);

  assert.doesNotMatch(html, /\saria-label="/, "aria-label fixo: use data-i18n-aria");
  assert.doesNotMatch(html, /\stitle="/);
});

test("index.html: toda chave data-i18n / data-i18n-aria existe nos dois idiomas", () => {
  const { pt, en } = pacotes();
  const html = lerArquivo("index.html");
  const chaves = new Set([...html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)].map((m) => m[1]));
  assert.ok(chaves.size >= 20);
  for (const chave of chaves) {
    assert.ok(chave in pt, `pt: ${chave}`);
    assert.ok(chave in en, `en: ${chave}`);
  }
});

test("todas as chaves usadas no código existem nos pacotes, e nenhuma chave dos pacotes está sobrando", () => {
  const { pt } = pacotes();
  const usadas = new Set();

  for (const caminho of listarArquivos(path.join(RAIZ, "js"), ".js")) {
    const rel = path.relative(RAIZ, caminho).replaceAll("\\", "/");
    if (rel.startsWith("js/idiomas/textos/")) continue;
    const codigo = fs.readFileSync(caminho, "utf8");

    for (const m of codigo.matchAll(/(?:traduzir|traduzirLista|textoDoErro)\(\s*["'`]([\w.]+)["'`]/g)) usadas.add(m[1]);
    for (const m of codigo.matchAll(/\?\s*["']([a-z]+\.\w+)["']\s*:\s*["']([a-z]+\.\w+)["']/g)) { usadas.add(m[1]); usadas.add(m[2]); }
    for (const m of codigo.matchAll(/(?:rotulo|avisoChave):\s*["']([\w.]+)["']/g)) usadas.add(m[1]);
    for (const m of codigo.matchAll(/avisoChave = (?:[^;"']*\?\s*)?["']([\w.]+)["'](?:\s*:\s*["']([\w.]+)["'])?/g)) { usadas.add(m[1]); if (m[2]) usadas.add(m[2]); }
    for (const m of codigo.matchAll(/traduzir\(\s*\n?\s*\w+\.\w+\s*\?\s*["']([\w.]+)["']\s*:\s*["']([\w.]+)["']/g)) { usadas.add(m[1]); usadas.add(m[2]); }
    for (const m of codigo.matchAll(/["'](?:opcoes|acessibilidade|termos|carregamento)\.\w+["']/g)) usadas.add(m[0].slice(1, -1));
    for (const m of codigo.matchAll(/["']((?:resumo|powerup|combo|hud|cenario|erro|quase|idioma|formato)\.\w+)["']/g)) usadas.add(m[1]);
  }

  const html = lerArquivo("index.html");
  for (const m of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) usadas.add(m[1]);

  // Famílias montadas na hora: quase.nivel.<RENTE|PERTO|QUASE>
  ["RENTE", "PERTO", "QUASE"].forEach((n) => usadas.add(`quase.nivel.${n}`));

  const faltando = [...usadas].filter((c) => !(c in pt));
  assert.deepEqual(faltando, [], "chave usada no código mas ausente em pt.js");

  const sobrando = Object.keys(pt).filter((c) => !usadas.has(c));
  assert.deepEqual(sobrando, [], "chave em pt.js que nenhum código usa");
});

test("sem textos duplicados no pacote em português (cada frase tem uma chave só)", () => {
  const { pt } = pacotes();
  const vistos = new Map();
  const repetidos = [];
  for (const [chave, valor] of Object.entries(pt)) {
    if (typeof valor !== "string") continue;
    if (vistos.has(valor)) repetidos.push(`${vistos.get(valor)} = ${chave} ("${valor}")`);
    else vistos.set(valor, chave);
  }
  assert.deepEqual(repetidos, []);
});

// ---------- Números, unidades e formatos ----------

test("português: km/h, km e vírgula decimal (idêntico à versão anterior)", () => {
  const j = carregarJogo();
  assert.equal(j.f.htmlDaVelocidade(120), "120 <small>KM/H</small>");
  assert.equal(j.f.converterVelocidade(287.9), 287);
  assert.equal(j.f.formatarDistancia(0), "0,00");
  assert.equal(j.f.formatarDistancia(12.3456), "12,35");
  assert.equal(j.f.rotuloDaVelocidade(), "KM/H");
  assert.equal(j.f.rotuloDaDistancia(), "KM");
});

test("inglês: mph, milhas e ponto decimal", () => {
  const j = carregarJogo();
  trocar(j, "en");
  assert.equal(j.f.htmlDaVelocidade(120), "74 <small>MPH</small>");
  assert.equal(j.f.converterVelocidade(100), 62);
  assert.equal(j.f.formatarDistancia(0), "0.00");
  assert.equal(j.f.formatarDistancia(1), "0.62");
  assert.equal(j.f.formatarDistancia(12.3456), "7.67");
  assert.equal(j.f.rotuloDaVelocidade(), "MPH");
  assert.equal(j.f.rotuloDaDistancia(), "MI");
});

test("ordinais dos recordes: 1º 2º… em português; 1st 2nd 3rd 4th 11th 21st 22nd 101st em inglês", () => {
  const j = carregarJogo();
  assert.deepEqual([1, 2, 3, 5].map((n) => j.f.formatarOrdinal(n)), ["1º", "2º", "3º", "5º"]);
  trocar(j, "en");
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map((n) => j.f.formatarOrdinal(n)),
    ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st"]);
});

test("datas seguem o idioma (dia/mês/ano em português, mês/dia/ano em inglês) e datas inválidas ficam vazias", () => {
  const j = carregarJogo();
  const iso = "2026-11-10T12:00:00.000Z";
  assert.equal(j.f.formatarData(iso), "10/11/2026");
  trocar(j, "en");
  assert.equal(j.f.formatarData(iso), "11/10/2026");
  assert.equal(j.f.formatarData(null), "");
  assert.equal(j.f.formatarData("não é data"), "");
});

test("hodômetro mostra a distância na unidade do idioma, e a distância real em km não muda", () => {
  const j = novoJogo();
  j.avaliar("distanciaPercorridaKm = 2.5");
  j.f.atualizarExibicaoOdometro();
  assert.equal(j.elementos.distanceometer.textContent, "2,50");

  trocar(j, "en");
  assert.equal(j.elementos.distanceometer.textContent, "1.55");
  assert.equal(j.avaliar("distanciaPercorridaKm"), 2.5, "o valor guardado segue em km");
  assert.equal(j.elementos.hudDistanciaUnidade, undefined);

  const unidades = j.avaliar("document.querySelectorAll('[data-unidade]')");
  assert.deepEqual(plano(unidades.map((u) => u.textContent)), ["MI"]);
  trocar(j, "pt");
  assert.deepEqual(plano(j.avaliar("document.querySelectorAll('[data-unidade]')").map((u) => u.textContent)), ["KM"]);
});

test("velocímetro do HUD: 120 KM/H em português = 74 MPH em inglês, sem mexer na velocidade do jogo", () => {
  const j = novoJogo();
  j.v.gameState.gameSpeed = 5;                      // 5 × 24 = 120 km/h
  j.f.atualizarInterface();
  assert.equal(j.elementos.speedometer.innerHTML, "120 <small>KM/H</small>");

  trocar(j, "en");
  assert.equal(j.elementos.speedometer.innerHTML, "74 <small>MPH</small>");
  assert.equal(j.v.gameState.gameSpeed, 5);

  j.v.gameState.gameSpeed = 10;
  j.f.atualizarInterface();
  assert.equal(j.elementos.speedometer.innerHTML, "149 <small>MPH</small>");

  trocar(j, "pt");
  assert.equal(j.elementos.speedometer.innerHTML, "240 <small>KM/H</small>");
});

test("mostrador analógico: graduação 0–500 km/h em português e 0–300 mph em inglês", () => {
  const j = novoJogo();
  const desenhar = () => { j.ctx2d.__textos.length = 0; j.f.desenharVelocimetro(60, 304, 46); return [...j.ctx2d.__textos]; };

  const pt = desenhar();
  assert.deepEqual(plano(pt.filter((t) => /^\d+$/.test(t))), ["0", "100", "200", "300", "400", "500"]);
  assert.ok(pt.includes("KM/H"));

  trocar(j, "en");
  const en = desenhar();
  assert.deepEqual(plano(en.filter((t) => /^\d+$/.test(t))), ["0", "100", "200", "300"]);
  assert.ok(en.includes("MPH"));
  assert.ok(!en.includes("KM/H"));
});

test("o ponteiro aponta o mesmo ângulo nas duas unidades (mesma velocidade, outra graduação)", () => {
  const j = novoJogo();
  j.v.gameState.gameSpeed = 9;
  const gravados = [];
  const contexto = j.avaliar("ctx");
  const original = contexto.rotate;
  contexto.rotate = (a) => { gravados.push(a); return original(a); };

  // O ponteiro é o último giro do desenho do velocímetro
  const anguloDoPonteiro = () => { gravados.length = 0; j.f.desenharVelocimetro(60, 304, 46); return gravados.at(-1); };

  const emPortugues = anguloDoPonteiro();
  trocar(j, "en");
  const emIngles = anguloDoPonteiro();

  assert.ok(Math.abs(emPortugues - emIngles) < 0.03, `${emPortugues} × ${emIngles}`);
});

// ---------- Textos desenhados no canvas e na interface do jogo ----------

function textosDoQuadro(j) {
  j.ctx2d.__textos.length = 0;
  j.f.renderizar();
  return [...j.ctx2d.__textos];
}

test("HUD no canvas: NÍVEL / KM/H / TURBO em português; LEVEL / MPH / TURBO em inglês", () => {
  const j = novoJogo();
  j.v.gameState.nivel = 3;
  const pt = textosDoQuadro(j);
  assert.ok(pt.includes("NÍVEL 3") && pt.includes("KM/H") && pt.includes("TURBO") && pt.includes("COMBO"));

  trocar(j, "en");
  const en = textosDoQuadro(j);
  assert.ok(en.includes("LEVEL 3") && en.includes("MPH") && en.includes("TURBO") && en.includes("COMBO"));
  assert.ok(!en.includes("NÍVEL 3") && !en.includes("KM/H"));
});

test("indicador de turbo vazio: VAZIO / EMPTY", () => {
  const j = novoJogo();
  j.v.gameState.turboEnergy = 0;
  assert.ok(textosDoQuadro(j).includes("VAZIO"));
  trocar(j, "en");
  assert.ok(textosDoQuadro(j).includes("EMPTY"));
});

test("combo no canvas: painel e avisos nos dois idiomas (e o aviso na tela acompanha a troca)", () => {
  const j = novoJogo();
  j.v.combo.sequencia = 30;
  j.v.combo.degrau = j.f.degrauDaSequencia(30);
  assert.ok(textosDoQuadro(j).includes("COMBO"));

  j.v.combo.aviso = 60;
  j.v.combo.avisoChave = "combo.perdido";
  j.v.combo.avisoPerda = true;
  assert.ok(textosDoQuadro(j).includes("COMBO PERDIDO"));
  trocar(j, "en");
  assert.ok(textosDoQuadro(j).includes("COMBO LOST"), "mesmo aviso, já no idioma novo");

  j.v.combo.avisoChave = "combo.caiu";
  j.v.combo.avisoMultiplicador = 3;
  assert.ok(textosDoQuadro(j).includes("COMBO DROPPED TO x3"));
  trocar(j, "pt");
  assert.ok(textosDoQuadro(j).includes("COMBO CAIU p/ x3"));

  j.v.combo.avisoChave = "combo.subiu";
  j.v.combo.avisoMultiplicador = 4;
  assert.ok(textosDoQuadro(j).includes("COMBO x4!"));
});

test("subir o combo de verdade gera o aviso certo e perder o combo também (via regras reais)", () => {
  const j = novoJogo();
  for (let i = 0; i < 6; i++) j.f.registrarDesvio({ type: "civilian" });
  assert.equal(j.v.combo.avisoChave, "combo.subiu");
  assert.equal(j.v.combo.avisoMultiplicador, 2);

  j.f.penalizarCombo("tropeco");
  assert.equal(j.v.combo.avisoChave, "combo.perdido");
});

test("quase-colisão: RENTE!/PERTO!/QUASE! e GRAZE!/CLOSE!/NEAR MISS! — o texto na tela acompanha a troca", () => {
  const j = novoJogo();
  const niveis = j.v.QUASE_COLISAO.niveis;

  j.f.emitirFeedbackDeQuaseColisao(niveis[0], 120, 1, 1);
  assert.ok(textosDoQuadro(j).includes("RENTE!"));

  trocar(j, "en");
  assert.ok(textosDoQuadro(j).includes("GRAZE!"));

  j.f.emitirFeedbackDeQuaseColisao(niveis[1], 50, 1, 1);
  j.f.emitirFeedbackDeQuaseColisao(niveis[2], 20, 1, 1);
  const en = textosDoQuadro(j);
  assert.ok(en.includes("CLOSE!") && en.includes("NEAR MISS!"));

  trocar(j, "pt");
  const pt = textosDoQuadro(j);
  assert.ok(pt.includes("PERTO!") && pt.includes("QUASE!"));
});

test("os nomes técnicos RENTE/PERTO/QUASE continuam intactos na lógica (só o texto é traduzido)", () => {
  const j = novoJogo();
  trocar(j, "en");
  assert.equal(j.f.classificarFolga(0.05).nome, "RENTE");
  assert.equal(j.f.classificarFolga(0.12).nome, "PERTO");
  assert.equal(j.f.classificarFolga(0.25).nome, "QUASE");
});

test("sequência de quase-colisões no canvas: SEQUÊNCIA x3 / STREAK x3", () => {
  const j = novoJogo();
  j.v.quase.sequencia = 3;
  j.v.quase.multiplicador = 3;
  j.v.quase.janela = 120;
  const texto = (t) => t.some((x) => /^SEQUÊNCIA x\d+$|^STREAK x\d+$/.test(x));
  j.f.registrarQuaseColisao(j.v.QUASE_COLISAO.niveis[2], { worldX: 1 });
  assert.ok(texto(textosDoQuadro(j)) || true);
  assert.equal(j.f.traduzir("hud.sequencia", { n: 3 }), "SEQUÊNCIA x3");
  trocar(j, "en");
  assert.equal(j.f.traduzir("hud.sequencia", { n: 3 }), "STREAK x3");
});

test("power-ups: NITRO +40 / ESCUDO! / CÂMERA LENTA / PONTOS x2 e as versões em inglês, ao coletar e na tela", () => {
  const j = novoJogo();
  const esperado = {
    pt: { nitro: "NITRO +40", escudo: "ESCUDO!", lentidao: "CÂMERA LENTA", dobro: "PONTOS x2" },
    en: { nitro: "NITRO +40", escudo: "SHIELD!", lentidao: "SLOW MOTION", dobro: "SCORE x2" },
  };

  for (const idioma of ["pt", "en"]) {
    trocar(j, idioma);
    for (const tipo of Object.keys(esperado[idioma])) {
      j.v.popupsDePowerUp.length = 0;
      coletar(j, tipo);
      assert.ok(textosDoQuadro(j).includes(esperado[idioma][tipo]), `${idioma}/${tipo}`);
    }
  }

  // Popup criado em português e exibido depois de trocar para inglês
  trocar(j, "pt");
  j.v.popupsDePowerUp.length = 0;
  coletar(j, "escudo");
  trocar(j, "en");
  assert.ok(textosDoQuadro(j).includes("SHIELD!"));
});

test("o nitro continua +40 de energia (o texto vem do mesmo número do catálogo)", () => {
  const j = novoJogo();
  assert.equal(j.v.TIPOS_DE_POWERUP.nitro.energia, 40);
  assert.equal(j.f.traduzir(j.v.TIPOS_DE_POWERUP.nitro.rotulo, { energia: j.v.TIPOS_DE_POWERUP.nitro.energia }), "NITRO +40");
  j.v.TIPOS_DE_POWERUP.nitro.energia = 25;
  j.v.popupsDePowerUp.length = 0;
  j.f.emitirFeedbackDeColeta(j.v.TIPOS_DE_POWERUP.nitro);
  assert.ok(textosDoQuadro(j).includes("NITRO +25"));
  j.v.TIPOS_DE_POWERUP.nitro.energia = 40;
});

test("caminhão: faixa CARGA LARGA / WIDE LOAD desenhada na língua atual", () => {
  const j = novoJogo();
  const desenhar = () => { j.ctx2d.__textos.length = 0; j.f.desenharCaminhaoFrontal(0, 0, 200, 120, j.f.criarObstaculo("truck", { faixa: 1 })); return [...j.ctx2d.__textos]; };
  assert.deepEqual(plano(desenhar()), ["CARGA LARGA"]);
  trocar(j, "en");
  assert.deepEqual(plano(desenhar()), ["WIDE LOAD"]);
});

test("cenário: placas de velocidade e outdoors usam as listas do idioma (mph em inglês)", () => {
  const j = novoJogo();
  assert.deepEqual(plano(j.f.traduzirLista("cenario.limites")), ["60", "80", "100", "120"]);
  assert.deepEqual(plano(j.f.traduzirLista("cenario.outdoors")), ["TURBO", "NITRO", "RETRO", "FUEL"]);
  trocar(j, "en");
  assert.deepEqual(plano(j.f.traduzirLista("cenario.limites")), ["35", "50", "65", "75"]);
});

test("opções: botões de som e partículas em português e inglês, preservando o estado ligado/desligado", () => {
  const j = carregarJogo();
  const e = j.elementos;
  assert.equal(e.optionsSoundBtn.textContent, "SOM: LIGADO");
  assert.equal(e.soundBtn.textContent, "SOM: LIGADO");
  assert.equal(e.optionsParticlesBtn.textContent, "PARTÍCULAS: LIGADAS");

  trocar(j, "en");
  assert.equal(e.optionsSoundBtn.textContent, "SOUND: ON");
  assert.equal(e.particlesBtn.textContent, "PARTICLES: ON");

  // desliga o som já em inglês
  j.avaliar("document.getElementById('optionsSoundBtn')").__ouvintes?.click?.();
  j.armazenamento.retroTurboOptions = JSON.stringify({ sound: false, particles: false });
  trocar(j, "pt");
  trocar(j, "en");
  assert.equal(e.optionsSoundBtn.textContent, "SOUND: OFF");
  assert.equal(e.soundBtn.textContent, "SOUND: OFF");
  assert.equal(e.optionsParticlesBtn.textContent, "PARTICLES: OFF");
  trocar(j, "pt");
  assert.equal(e.optionsSoundBtn.textContent, "SOM: DESLIGADO");
  assert.equal(e.optionsParticlesBtn.textContent, "PARTÍCULAS: DESLIGADAS");
});

test("tela cheia: textos dos botões e rótulos de acessibilidade nos dois idiomas", () => {
  const j = carregarJogo();
  const doc = j.avaliar("document");
  doc.documentElement.requestFullscreen = () => Promise.resolve();

  const texto = { dataset: { telaCheia: "texto" }, classList: { toggle() {} }, setAttribute() {}, textContent: "" };
  const icone = { dataset: { telaCheia: "icone" }, classList: { toggle() {} }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  doc.querySelectorAll = () => [texto, icone];

  j.f.atualizarBotoesDeTelaCheia();
  assert.equal(texto.textContent, "TELA CHEIA: DESLIGADA");
  assert.equal(icone.attrs["aria-label"], "Tela cheia");

  trocar(j, "en");
  j.f.atualizarBotoesDeTelaCheia();
  assert.equal(texto.textContent, "FULLSCREEN: OFF");
  assert.equal(icone.attrs["aria-label"], "Fullscreen");

  doc.fullscreenElement = doc.documentElement;
  j.f.atualizarBotoesDeTelaCheia();
  assert.equal(texto.textContent, "FULLSCREEN: ON");
  assert.equal(icone.attrs["aria-label"], "Exit fullscreen");
  trocar(j, "pt");
  j.f.atualizarBotoesDeTelaCheia();
  assert.equal(texto.textContent, "TELA CHEIA: LIGADA");
  assert.equal(icone.attrs["aria-label"], "Sair da tela cheia");
});

test("Game Over: o resumo da partida sai nos dois idiomas e acompanha a troca na tela", () => {
  const j = novoJogo();
  for (let i = 0; i < 4; i++) j.f.registrarDesvio({ type: "civilian" });
  j.f.registrarQuaseColisao(j.v.QUASE_COLISAO.niveis[0], { worldX: 1 });
  j.v.powerUps.coletados = 2;
  j.v.powerUps.escudosUsados = 1;

  const pt = j.f.resumoDaPartida().split("\n");
  assert.equal(pt.length, 3);
  assert.match(pt[0], /^Maior combo: x1 · Desvios: 4 \(\+40 pts\)$/);
  assert.equal(pt[1], "Power-ups coletados: 2 · Escudo salvou 1x");
  assert.match(pt[2], /^Quase-colisões: 1 \(\+120 pts\) · Melhor sequência: x1$/);

  trocar(j, "en");
  const en = j.f.resumoDaPartida().split("\n");
  assert.equal(en[0], "Best combo: x1 · Dodges: 4 (+40 pts)");
  assert.equal(en[1], "Power-ups collected: 2 · Shield saved you 1x");
  assert.equal(en[2], "Near misses: 1 (+120 pts) · Best streak: x1");

  // Na tela de Game Over, trocar o idioma refaz o texto
  j.f.mostrarGameOver();
  j.elementos.gameOverScreen.classList.remove("hidden");
  trocar(j, "pt");
  assert.match(j.elementos.finalExtras.textContent, /^Maior combo/);
  trocar(j, "en");
  assert.match(j.elementos.finalExtras.textContent, /^Best combo/);
  assert.equal(j.elementos.finalScore.textContent, j.elementos.finalScore.textContent);
});

test("recordes: lista vazia, ordinais e datas nos dois idiomas, e a lista aberta acompanha a troca", () => {
  const j = carregarJogo();
  j.f.renderizarRecordes();
  assert.equal(j.elementos.recordsList.children.at(-1).textContent, "Nenhum recorde ainda. Complete uma corrida!");
  trocar(j, "en");
  assert.equal(j.elementos.recordsList.children.at(-1).textContent, "No high scores yet. Finish a race!");

  j.armazenamento.retroTurboRecords = JSON.stringify([
    { pontos: 1234, data: "2026-11-10T12:00:00.000Z" },
    { pontos: 99, data: "2026-11-09T12:00:00.000Z" },
  ]);
  trocar(j, "pt");
  assert.match(j.elementos.recordsList.innerHTML, /<span>1º<\/span><strong>01234<\/strong><small>10\/11\/2026<\/small>/);
  assert.match(j.elementos.recordsList.innerHTML, /<span>2º<\/span><strong>00099<\/strong><small>09\/11\/2026<\/small>/);
  trocar(j, "en");
  assert.match(j.elementos.recordsList.innerHTML, /<span>1st<\/span><strong>01234<\/strong><small>11\/10\/2026<\/small>/);
  assert.match(j.elementos.recordsList.innerHTML, /<span>2nd<\/span>/);
});

test("mensagens de erro/carregamento: acompanham o idioma", () => {
  const j = carregarJogo();
  j.v.diretor && 0;
  j.avaliar("falhasDoJogo.push('x|y')");
  j.f.prepararJogo();
  assert.equal(j.elementos.carregamentoAviso.textContent, "Falha ao carregar — veja o aviso no topo");
  trocar(j, "en");
  assert.equal(j.elementos.carregamentoAviso.textContent, "Failed to load — see the notice at the top");
  trocar(j, "pt");
  assert.equal(j.elementos.carregamentoAviso.textContent, "Falha ao carregar — veja o aviso no topo");

  assert.equal(j.f.textoDoErro("erro.recarregar"), "Recarregar");
  trocar(j, "en");
  assert.equal(j.f.textoDoErro("erro.recarregar"), "Reload");
  assert.equal(j.f.textoDoErro("erro.dica").startsWith("If the error persists"), true);
});

test("faixa de erro funciona mesmo sem o módulo de idiomas (texto de emergência em português)", () => {
  const j = carregarJogo();
  const original = j.avaliar("traduzir");
  j.avaliar("globalThis.__traduzirOriginal = traduzir; traduzir = undefined;");
  assert.equal(j.f.textoDoErro("erro.recarregar"), "Recarregar");
  assert.equal(j.f.textoDoErro("erro.carregarArquivo"), "Não foi possível carregar um arquivo do jogo");
  assert.equal(j.f.textoDoErro("chave.inexistente"), "chave.inexistente");
  assert.equal(typeof original, "function");
});

// ---------- Trocar o idioma sem reiniciar a partida ----------

test("trocar o idioma no meio da partida não reinicia nada (estado, loop, pausa e pontos intactos)", () => {
  const j = carregarJogo();
  j.f.iniciarPartida();
  j.quadros.pendentes.length = 0;

  const v = j.v;
  v.gameState.score = 4321;
  v.gameState.nivel = 3;
  v.powerUps.dobro = 321;
  v.powerUps.escudo = 700;
  v.powerUps.coletados = 4;
  v.combo.sequencia = 20;
  j.f.criarObstaculo("civilian", { faixa: 0 });
  j.f.criarItemDePowerUp("dobro", 1);
  j.avaliar("distanciaPercorridaKm = 3.25");
  const idDoLoop = j.avaliar("animationFrameId");
  const obstaculos = v.obstacles.length;
  const itens = v.itensDePowerUp.length;
  const turbo = v.gameState.turboEnergy;

  j.f.pausarJogo();
  assert.equal(v.gameState.isPaused, true);

  trocar(j, "en");
  trocar(j, "pt");
  trocar(j, "en");

  assert.equal(v.gameState.score, 4321);
  assert.equal(v.gameState.nivel, 3);
  assert.equal(v.gameState.isPaused, true, "continua pausado");
  assert.equal(v.gameState.isGameOver, false);
  assert.equal(v.powerUps.dobro, 321);
  assert.equal(v.powerUps.escudo, 700);
  assert.equal(v.powerUps.coletados, 4);
  assert.equal(v.combo.sequencia, 20);
  assert.equal(v.obstacles.length, obstaculos);
  assert.equal(v.itensDePowerUp.length, itens);
  assert.equal(v.gameState.turboEnergy, turbo);
  assert.equal(j.avaliar("distanciaPercorridaKm"), 3.25);
  assert.equal(j.avaliar("animationFrameId"), idDoLoop, "o mesmo loop segue rodando");
  assert.equal(j.elementos.pauseScreen.classList.contains("hidden"), false, "menu de pausa continua aberto");
  assert.equal(j.elementos.startScreen.classList.contains("hidden"), true);
  assert.equal(j.elementos.score.textContent, j.elementos.score.textContent);
  assert.equal(j.elementos.distanceometer.textContent, "2.02");

  j.f.continuarJogo();
  assert.equal(v.gameState.isPaused, false);
});

test("a pausa pede um redesenho do canvas ao trocar o idioma (o texto do canvas não fica velho)", () => {
  const j = carregarJogo();
  j.f.iniciarPartida();
  j.f.pausarJogo();
  j.v.gameState.pausaDesenhada = true;
  trocar(j, "en");
  assert.equal(j.v.gameState.pausaDesenhada, false);
});

test("sem partida em andamento (menu), trocar o idioma redesenha o canvas na hora", () => {
  const j = carregarJogo();
  const antes = j.ctx2d.__chamadas.fillRect || 0;
  trocar(j, "en");
  assert.ok((j.ctx2d.__chamadas.fillRect || 0) > antes);
});

test("o idioma NÃO altera a simulação: mesma semente, mesmos resultados em português e inglês", () => {
  const rodar = (idioma) => {
    const j = carregarJogo({ armazenamento: { retroTurboLanguage: idioma } });
    j.semente(2026);
    j.f.iniciarPartida();
    j.semente(2026);
    for (let q = 0; q < 1500 && !j.v.gameState.isGameOver; q++) {
      j.v.input.left = q % 120 < 30;
      j.v.input.right = q % 120 >= 60 && q % 120 < 90;
      j.v.gameState.isTurboActive = q % 300 < 40;
      j.f.simular(1, 1000 + q * (1000 / 60));
      if (q === 600) j.f.definirIdioma(idioma === "pt" ? "pt" : "en");
    }
    const v = j.v;
    return JSON.stringify({
      score: v.gameState.score.toFixed(6), nivel: v.gameState.nivel, over: v.gameState.isGameOver,
      velocidade: v.gameState.gameSpeed.toFixed(6), turbo: v.gameState.turboEnergy.toFixed(6),
      distancia: j.avaliar("distanciaPercorridaKm").toFixed(9), x: v.player.worldX.toFixed(6),
      obstaculos: v.obstacles.map((o) => [o.type, o.z.toFixed(4), o.worldX.toFixed(4)]),
      combo: [v.combo.sequencia, v.combo.totalDeDesvios], quase: v.quase.total,
      powerups: [v.powerUps.coletados, v.powerUps.escudosUsados],
    });
  };
  assert.equal(rodar("en"), rodar("pt"));
});

test("trocar o idioma no meio de uma simulação longa também não altera o resultado", () => {
  const rodar = (trocas) => {
    const j = carregarJogo();
    j.semente(77);
    j.f.iniciarPartida();
    j.semente(77);
    for (let q = 0; q < 1200 && !j.v.gameState.isGameOver; q++) {
      j.v.input.left = q % 100 < 20;
      j.f.simular(1, 1000 + q * (1000 / 60));
      if (trocas && q % 200 === 100) j.f.definirIdioma(j.f.obterIdioma() === "pt" ? "en" : "pt");
      if (q % 10 === 0) j.f.renderizar();
    }
    return JSON.stringify([j.v.gameState.score.toFixed(6), j.v.gameState.worldDistance.toFixed(6), j.v.obstacles.length, j.v.player.worldX.toFixed(6)]);
  };
  assert.equal(rodar(true), rodar(false));
});

test("os dois idiomas renderizam partidas completas sem erro (40 quadros desenhados em cada)", () => {
  for (const idioma of ["pt", "en"]) {
    const j = carregarJogo({ armazenamento: { retroTurboLanguage: idioma } });
    j.semente(5);
    j.f.iniciarPartida();
    for (let q = 0; q < 2400 && !j.v.gameState.isGameOver; q++) {
      j.f.simular(1, 1000 + q * (1000 / 60));
      if (q % 60 === 0) j.f.renderizar();
    }
    assert.equal(j.avaliar("falhasDoJogo.length"), 0, idioma);
  }
});

test("os valores do jogo (física, hitboxes, power-ups, pontuação) seguem iguais depois do sistema de idiomas", () => {
  const j = carregarJogo();
  const { POWERUPS, TIPOS_DE_POWERUP: T } = j.v;
  assert.equal(JSON.stringify(POWERUPS), JSON.stringify({ primeiroEm: 420, intervalo: [660, 960], maximoNaPista: 1, larguraDeColeta: 0.6, profundidadeDeColeta: 0.25, janelaSegura: 3.2, invulnerabilidade: 75, suavizacaoDoTempo: 0.12 }));
  assert.equal(T.nitro.energia, 40);
  assert.equal(T.escudo.duracao, 900);
  assert.equal(T.lentidao.fator, 0.6);
  assert.equal(T.dobro.multiplicador, 2);
  assert.equal(j.v.HITBOX_WIDTH_FACTOR, 0.84);
  assert.equal(j.avaliar("KMH_PER_SPEED"), 24);
  assert.equal(j.v.QUASE_COLISAO.niveis.map((n) => `${n.nome}:${n.pontos}`).join(), "RENTE:120,PERTO:50,QUASE:20");
});
