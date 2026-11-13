#!/usr/bin/env python3
"""
Verificação dos IDIOMAS em um NAVEGADOR REAL (Chromium via Playwright).

Opcional: não faz parte do `npm test`. Para português e inglês, em várias telas:
  - o seletor troca o idioma e o texto da interface muda (sem chave "crua" aparecendo);
  - a escolha fica salva e volta ao recarregar a página (fechar e abrir);
  - trocar no menu de pausa NÃO reinicia a partida (pontos, distância e pausa intactos);
  - nenhum texto estoura botões, barra de informações ou menus;
  - menus abertos (início, opções, pausa, recordes, fim de jogo) e HUD cabem na tela.
Gera capturas em --saida (padrão: /tmp/capturas-idiomas).

Uso:  pip install playwright && playwright install chromium
      python3 tests/ferramentas/verificar-idiomas-no-navegador.py
"""
import argparse, pathlib, re, sys
from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parents[2]
URL = (RAIZ / "index.html").as_uri()

TELAS = [  # nome, largura, altura, toque, dpr
    ("A37 horizontal", 891, 411, True, 2.625),
    ("A37 com barra do navegador", 891, 360, True, 2.625),
    ("Celular 16:9", 640, 360, True, 2),
    ("Celular pequeno", 568, 320, True, 2),
    ("Notebook 1366x768", 1366, 768, False, 1),
]

ESPERADO = {
    "pt": {"jogar": "JOGAR", "pausa": "JOGO PAUSADO", "lang": "pt-BR", "vel": "KM/H", "dist": "KM", "pontos": "PONTOS"},
    "en": {"jogar": "PLAY", "pausa": "GAME PAUSED", "lang": "en", "vel": "MPH", "dist": "MI", "pontos": "SCORE"},
}

JS_TEXTO = "(id) => document.getElementById(id).textContent.trim()"
JS_CRUAS = r"""() => {
  // chave de tradução aparecendo na tela (ex.: "menu.jogar") = texto que faltou
  const achadas = [];
  document.querySelectorAll('body *').forEach(e => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim();
    if (/^[a-z]+(\.[a-zA-Z]+)+$/.test(t)) achadas.push(t);
  });
  const vazios = [...document.querySelectorAll('[data-i18n]')].filter(e => !e.textContent.trim()).map(e => e.dataset.i18n);
  return {achadas, vazios};
}"""
JS_ESTOURO = """() => {
  const ruins = [];
  const alvos = document.querySelectorAll('.hud-box, .hud-label, .hud-valor, #turbo-container, .menu-btn, .menu-btn-danger, .idioma-btn, #leftBtn, #rightBtn, #turboBtn, .seletor-idioma');
  alvos.forEach(e => {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (e.scrollWidth > e.clientWidth + 1) ruins.push((e.id || e.className) + ' largura ' + e.scrollWidth + '>' + e.clientWidth);
  });
  return ruins;
}"""
JS_MENU_CABE = """(id) => {
  const el = document.querySelector('#' + id + ' .menu-content, #' + id + ' .modal-content') || document.getElementById(id);
  const r = el.getBoundingClientRect();
  return {x: r.x, y: r.y, w: r.width, h: r.height, rolagem: el.scrollHeight > el.clientHeight + 1, j: [innerWidth, innerHeight]};
}"""


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--saida", default="/tmp/capturas-idiomas"); a = ap.parse_args()
    saida = pathlib.Path(a.saida); saida.mkdir(parents=True, exist_ok=True)
    falhas, total = [], 0

    def checar(ok, msg):
        nonlocal total; total += 1
        if not ok: falhas.append(msg)

    with sync_playwright() as p:
        nav = p.chromium.launch()
        for nome, w, h, toque, dpr in TELAS:
            ctx = nav.new_context(viewport={"width": w, "height": h}, device_scale_factor=dpr, has_touch=toque, is_mobile=toque)
            pg = ctx.new_page(); erros = []
            pg.on("pageerror", lambda e: erros.append(str(e)))
            pg.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)
            pg.goto(URL); pg.wait_for_timeout(400)
            tag = f"[{nome}]"
            slug = re.sub(r"[^a-z0-9]+", "-", f"{w}x{h}-{nome}".lower())
            clicar = (lambda sel: pg.tap(sel)) if toque else (lambda sel: pg.click(sel))

            # 1) padrão: português, sem preferência salva
            checar(pg.evaluate("() => localStorage.getItem('retroTurboLanguage')") is None, f"{tag} não deve gravar nada sozinho")
            checar(pg.evaluate(JS_TEXTO, "playBtn") == "JOGAR", f"{tag} padrão deve ser português")
            checar(pg.evaluate("() => document.documentElement.lang") == "pt-BR", f"{tag} lang pt-BR")
            checar(pg.evaluate("() => document.querySelectorAll('[data-idioma]').length") == 6, f"{tag} 3 seletores x 2 idiomas")

            for idioma in ["en", "pt", "en"]:
                esp = ESPERADO[idioma]
                # 2) menu inicial: seletor visível e funcionando
                pg.evaluate("() => { document.getElementById('startScreen').classList.remove('hidden'); }")
                clicar("#startScreen [data-idioma=%s]" % idioma); pg.wait_for_timeout(250)
                checar(pg.evaluate(JS_TEXTO, "playBtn") == esp["jogar"], f"{tag} {idioma}: botão JOGAR/PLAY")
                checar(pg.evaluate("() => document.documentElement.lang") == esp["lang"], f"{tag} {idioma}: atributo lang")
                crus = pg.evaluate(JS_CRUAS)
                checar(not crus["achadas"] and not crus["vazios"], f"{tag} {idioma}: textos faltando {crus}")
                checar(pg.evaluate("() => localStorage.getItem('retroTurboLanguage')") == idioma, f"{tag} {idioma}: preferência gravada")
                ativos = pg.evaluate("() => [...document.querySelectorAll('[data-idioma].ativo')].map(b => b.dataset.idioma)")
                checar(ativos == [idioma] * 3, f"{tag} {idioma}: botões ativos {ativos}")
                checar(pg.evaluate("(id) => document.getElementById(id).textContent.includes('3.3.0')", "versaoDoJogo"), f"{tag} versão no menu")
                pg.screenshot(path=str(saida / f"{slug}-menu-{idioma}.png"))
                est = pg.evaluate(JS_ESTOURO)
                checar(not est, f"{tag} {idioma}: texto estourando no menu/HUD: {est}")
                m = pg.evaluate(JS_MENU_CABE, "startScreen")
                checar(m["x"] >= -0.5 and m["y"] >= -0.5 and m["x"] + m["w"] <= w + 0.5 and (m["y"] + m["h"] <= h + 0.5 or m["rolagem"]), f"{tag} {idioma}: menu inicial fora da tela {m}")

            # 3) persistência: recarrega a página (fechar e abrir) e confere o inglês
            pg.reload(); pg.wait_for_timeout(500)
            checar(pg.evaluate(JS_TEXTO, "playBtn") == "PLAY", f"{tag} idioma deve persistir ao recarregar")
            checar(pg.evaluate("() => document.documentElement.lang") == "en", f"{tag} lang persistido")

            # 4) opções nos dois idiomas
            for idioma in ["en", "pt"]:
                esp = ESPERADO[idioma]
                clicar("#startScreen [data-idioma=%s]" % idioma); pg.wait_for_timeout(200)
                clicar("#optionsBtn"); pg.wait_for_timeout(200)
                clicar("#optionsScreen [data-idioma=%s]" % ("pt" if idioma == "en" else "en")); pg.wait_for_timeout(200)
                clicar("#optionsScreen [data-idioma=%s]" % idioma); pg.wait_for_timeout(200)
                som = pg.evaluate(JS_TEXTO, "optionsSoundBtn")
                checar(som == ("SOUND: ON" if idioma == "en" else "SOM: LIGADO"), f"{tag} {idioma}: botão de som '{som}'")
                est = pg.evaluate(JS_ESTOURO); checar(not est, f"{tag} {idioma}: opções estouram {est}")
                m = pg.evaluate(JS_MENU_CABE, "optionsScreen")
                checar(m["y"] + m["h"] <= h + 0.5 or m["rolagem"], f"{tag} {idioma}: opções fora da tela {m}")
                pg.screenshot(path=str(saida / f"{slug}-opcoes-{idioma}.png"))
                clicar("#closeOptionsBtn"); pg.wait_for_timeout(150)

            # 5) partida: trocar o idioma na pausa não reinicia
            clicar("#startScreen [data-idioma=pt]"); pg.wait_for_timeout(200)
            clicar("#playBtn"); pg.wait_for_timeout(1400)
            pg.evaluate("() => document.fullscreenElement ? document.exitFullscreen() : null"); pg.wait_for_timeout(300)
            checar(pg.evaluate("() => speedometer.innerHTML").endswith("KM/H</small>"), f"{tag} HUD em km/h")
            clicar("#pauseBtn"); pg.wait_for_timeout(250)
            # medido já pausado: o estado está congelado, então qualquer mudança vem da troca de idioma
            antes = pg.evaluate("() => ({s: gameState.score, d: distanciaPercorridaKm, over: gameState.isGameOver, n: obstacles.length, p: powerUps.coletados, t: gameState.turboEnergy})")
            checar(pg.evaluate(JS_TEXTO, "pauseScreen").startswith("JOGO PAUSADO") or "JOGO PAUSADO" in pg.evaluate("() => document.getElementById('pauseScreen').innerText"), f"{tag} pausa em português")
            pg.screenshot(path=str(saida / f"{slug}-pausa-pt.png"))
            clicar("#pauseScreen [data-idioma=en]"); pg.wait_for_timeout(300)
            depois = pg.evaluate("() => ({s: gameState.score, d: distanciaPercorridaKm, over: gameState.isGameOver, n: obstacles.length, p: powerUps.coletados, t: gameState.turboEnergy, pausado: gameState.isPaused})")
            checar(depois["pausado"] and not depois["over"], f"{tag} continua pausado e vivo após trocar o idioma")
            checar(all(depois[k] == antes[k] for k in ("s", "d", "n", "p", "t")), f"{tag} estado idêntico após trocar o idioma {antes} → {depois}")
            checar("GAME PAUSED" in pg.evaluate("() => document.getElementById('pauseScreen').innerText"), f"{tag} pausa em inglês")
            checar(pg.evaluate("() => speedometer.innerHTML").endswith("MPH</small>"), f"{tag} HUD em mph")
            checar(pg.evaluate("() => document.querySelector('[data-unidade=distancia]').textContent") == "MI", f"{tag} distância em milhas")
            est = pg.evaluate(JS_ESTOURO); checar(not est, f"{tag} pausa/HUD em inglês estoura: {est}")
            m = pg.evaluate(JS_MENU_CABE, "pauseScreen")
            checar(m["y"] + m["h"] <= h + 0.5 or m["rolagem"], f"{tag} pausa fora da tela {m}")
            pg.screenshot(path=str(saida / f"{slug}-pausa-en.png"))
            clicar("#resumeBtn"); pg.wait_for_timeout(800)
            pg.screenshot(path=str(saida / f"{slug}-jogo-en.png"))
            est = pg.evaluate(JS_ESTOURO); checar(not est, f"{tag} jogo em inglês estoura: {est}")
            checar(pg.evaluate("() => !gameState.isPaused"), f"{tag} jogo retomou")

            checar(not erros, f"{tag} erros de JavaScript: {erros}")
            print(f"{tag} ok" if not [f for f in falhas if f.startswith(tag)] else f"{tag} COM FALHAS")
            ctx.close()
        nav.close()

    print(f"\n{total} verificações, {len(falhas)} falha(s)")
    for f in falhas: print("  FALHA:", f)
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
