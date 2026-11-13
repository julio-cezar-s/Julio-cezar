#!/usr/bin/env python3
"""
Verificação do layout em um NAVEGADOR REAL (Chromium via Playwright).

Opcional: não faz parte do `npm test` (não exige Playwright). Abre o jogo em
várias resoluções/orientações/densidades, mede e confere:
  - o canvas tem proporção 16:9 e cabe na janela;
  - barra, canvas e botões de toque não se sobrepõem e nada sai da janela;
  - os botões de toque têm pelo menos 44 px;
  - a resolução interna acompanha a tela (nítido) e é 16:9;
  - girar o aparelho pausa e mostra o aviso; voltar libera;
  - redimensionar com o jogo rodando não gera erros.
Gera capturas de tela em --saida (padrão: /tmp/capturas-layout).

Uso:  pip install playwright && playwright install chromium
      python3 tests/ferramentas/verificar-layout-no-navegador.py
"""
import argparse, pathlib, sys
from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parents[2]
URL = (RAIZ / "index.html").as_uri()

# nome, largura, altura, toque, dpr
TELAS = [
    ("Galaxy A37 horizontal (cheia)", 891, 411, True, 2.625),
    ("Galaxy A37 horizontal (com barra do navegador)", 891, 360, True, 2.625),
    ("Celular 16:9 horizontal", 640, 360, True, 2),
    ("Celular pequeno horizontal", 568, 320, True, 2),
    ("iPhone horizontal com entalhe", 844, 390, True, 3),
    ("Celular comprido 21:9", 960, 411, True, 2.625),
    ("Tablet horizontal 4:3", 1024, 768, True, 2),
    ("Tablet vertical 3:4 (pede para girar)", 768, 1024, True, 2),
    ("Celular vertical (pede para girar)", 411, 891, True, 2.625),
    ("Notebook 1366x768", 1366, 768, False, 1),
    ("Notebook 1536x864 (125%)", 1536, 864, False, 1.25),
    ("Notebook 16:10 1440x900", 1440, 900, False, 2),
    ("Desktop Full HD 1920x1080", 1920, 1080, False, 1),
    ("Janela pequena 800x500", 800, 500, False, 1),
]

JS_MEDIDAS = """() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return {x:b.x,y:b.y,w:b.width,h:b.height,visivel:b.width>0&&b.height>0&&getComputedStyle(e).display!=='none'}; };
  const c = document.getElementById('gameCanvas');
  return {
    janela:{w:innerWidth,h:innerHeight}, layout: document.getElementById('game-container').dataset.layout,
    canvas:r(c), hud:r(document.getElementById('hud')),
    esq:r(document.getElementById('leftBtn')), dir:r(document.getElementById('rightBtn')), turbo:r(document.getElementById('turboBtn')),
    pausa:r(document.getElementById('pauseBtn')), tela:r(document.getElementById('fullscreenBtn')),
    aviso: !document.getElementById('girar-aparelho').classList.contains('hidden'),
    interno:{w:c.width,h:c.height}, rolagem:{x:document.documentElement.scrollWidth>innerWidth, y:document.documentElement.scrollHeight>innerHeight}
  };
}"""

def redimensionar(pg, w, h):
    # Em tela cheia o navegador não deixa mudar a janela: sai antes (o jogo entra
    # sozinho em tela cheia no celular ao tocar em JOGAR)
    pg.evaluate("() => document.fullscreenElement ? document.exitFullscreen() : null")
    pg.wait_for_timeout(300)
    pg.set_viewport_size({"width": w, "height": h})
    pg.wait_for_timeout(400)


def cruza(a, b):
    return a["x"] < b["x"]+b["w"]-0.5 and b["x"] < a["x"]+a["w"]-0.5 and a["y"] < b["y"]+b["h"]-0.5 and b["y"] < a["y"]+a["h"]-0.5

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--saida", default="/tmp/capturas-layout"); a = ap.parse_args()
    saida = pathlib.Path(a.saida); saida.mkdir(parents=True, exist_ok=True)
    falhas, total = [], 0

    with sync_playwright() as p:
        nav = p.chromium.launch()
        for nome, w, h, toque, dpr in TELAS:
            ctx = nav.new_context(viewport={"width": w, "height": h}, device_scale_factor=dpr, has_touch=toque, is_mobile=toque)
            pg = ctx.new_page(); erros = []
            pg.on("pageerror", lambda e: erros.append(str(e)))
            pg.goto(URL); pg.wait_for_timeout(400)
            retrato = toque and h > w

            if not retrato:
                (pg.tap if toque else pg.click)("#playBtn"); pg.wait_for_timeout(900)
            m = pg.evaluate(JS_MEDIDAS)
            slug = "".join(ch if ch.isalnum() else "-" for ch in f"{w}x{h}-{nome}").lower()
            pg.screenshot(path=str(saida / f"{slug}.png"))

            def checar(ok, msg):
                nonlocal total; total += 1
                if not ok: falhas.append(f"[{nome}] {msg}")

            checar(m["aviso"] == retrato, f"aviso de rotação = {m['aviso']}, esperado {retrato}")
            checar(not m["rolagem"]["x"] and not m["rolagem"]["y"], "a página não deve rolar")
            c = m["canvas"]
            checar(abs(c["w"]/c["h"] - 16/9) < 0.01, f"proporção do canvas {c['w']/c['h']:.4f}")
            checar(c["x"] >= -0.5 and c["y"] >= -0.5 and c["x"]+c["w"] <= w+0.5 and c["y"]+c["h"] <= h+0.5, "canvas fora da janela")
            checar(abs(m["interno"]["w"]/m["interno"]["h"] - 16/9) < 0.01, f"resolução interna {m['interno']}")
            checar(m["interno"]["w"] >= 640, "resolução interna menor que a lógica")
            if not retrato:
                aproveit = c["w"]*c["h"]/(w*h)
                print(f"{nome:50s} {w}x{h} @{dpr}  modo={m['layout']:9s} canvas={c['w']:.0f}x{c['h']:.0f} ({aproveit:.0%} da tela) interno={m['interno']['w']}x{m['interno']['h']}")
                checar(not cruza(m["hud"], c), "barra sobrepõe o canvas")
                for k in ("pausa", "tela"):
                    if m[k] and m[k]["visivel"]:
                        checar(m[k]["x"]+m[k]["w"] <= w+0.5 and m[k]["x"] >= -0.5, f"botão {k} fora da janela")
                if toque:
                    for k in ("esq", "dir", "turbo"):
                        b = m[k]
                        checar(b["visivel"], f"botão {k} invisível")
                        checar(b["w"] >= 43.5 and b["h"] >= 43.5, f"botão {k} pequeno: {b['w']:.0f}x{b['h']:.0f}")
                        checar(not cruza(b, c), f"botão {k} sobrepõe o canvas")
                        checar(not cruza(b, m["hud"]), f"botão {k} sobrepõe a barra")
                        checar(b["x"] >= -0.5 and b["x"]+b["w"] <= w+0.5 and b["y"]+b["h"] <= h+0.5, f"botão {k} fora da janela")
                    checar(not cruza(m["esq"], m["dir"]) and not cruza(m["esq"], m["turbo"]) and not cruza(m["dir"], m["turbo"]), "botões se sobrepõem")
                else:
                    checar(not m["esq"]["visivel"], "botões de toque deveriam estar escondidos no notebook")
                if aproveit < 0.45: print("   (atenção: aproveitamento baixo)")

                # redimensiona com o jogo rodando
                redimensionar(pg, max(320, w-120), max(240, h-60))
                m2 = pg.evaluate(JS_MEDIDAS); c2 = m2["canvas"]
                checar(abs(c2["w"]/c2["h"] - 16/9) < 0.01, "proporção após redimensionar")
                redimensionar(pg, w, h)

            if toque and not retrato:
                # gira: pausa + aviso; volta: aviso some
                viva = pg.evaluate("() => !gameState.isGameOver")   # o robô não dirige: pode ter batido
                redimensionar(pg, h, w)
                g = pg.evaluate("() => ({aviso: !document.getElementById('girar-aparelho').classList.contains('hidden'), pausa: !document.getElementById('pauseScreen').classList.contains('hidden')})")
                checar(g["aviso"], "girar para vertical deve mostrar o aviso")
                checar(g["pausa"] or not viva, "girar para vertical deve pausar a partida")
                redimensionar(pg, w, h)
                g = pg.evaluate("() => !document.getElementById('girar-aparelho').classList.contains('hidden')")
                checar(not g, "voltar para horizontal deve esconder o aviso")
                pg.screenshot(path=str(saida / f"{slug}-pausa.png"))

            checar(not erros, f"erros de JavaScript: {erros}")
            ctx.close()
        nav.close()

    print(f"\n{total} verificações, {len(falhas)} falha(s)")
    for f in falhas: print("  FALHA:", f)
    sys.exit(1 if falhas else 0)

if __name__ == "__main__":
    main()
