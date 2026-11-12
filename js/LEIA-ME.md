# Mapa do código — Retro Turbo Racer

Cada pasta tem uma responsabilidade. A ordem de carregamento está em `index.html`.

| Pasta / arquivo | O que faz |
|---|---|
| `inicio/` | Primeiros e últimos scripts: `versao.js`, `diagnostico.js` (faixa de erro na tela), `compatibilidade.js` (recursos que faltam em navegadores antigos) e `pronto.js` (libera o botão JOGAR) |
| `config.js` | Canvas, estado global (`gameState`), jogador e constantes de tamanho (`GAME_WIDTH/HEIGHT` = 640×360 lógicos; `RENDER_SCALE` = resolução interna, ajustada pelo layout) |
| `idiomas/` | Idiomas: `nucleo.js` (registro, `traduzir`, fallback, preferência salva), `formatacao.js` (números, unidades, ordinais, datas), `interface.js` (HTML e seletor), `textos/pt.js` e `textos/en.js` (TODOS os textos do jogo) |
| `layout/` | Layout responsivo: `calculo.js` (onde fica cada parte da tela), `responsivo.js` (aplica na página, rotação, redimensionamento), `tela-cheia.js` e `desempenho.js` (baixa a resolução se o aparelho for lento) |
| `pista/` | Perspectiva e a estrada: céu, terreno, acostamento, asfalto, marcadores |
| `pista/perspectiva.js` | **Única** fonte de projeção 3D (todo desenho passa por `projX`/`projY`) |
| `pista/trajeto/` | Curvas e morros: `tracado.js` (onde estão) e `perfil.js` (como a câmera os vê) |
| `cenarios/` | Árvores, construções, cercas, sinalização, atmosfera e a ordem de desenho por profundidade |
| `carros/` | O carro do jogador (desenho e posição) |
| `obstaculos/` | Tudo que aparece na pista: catálogo (`tipos.js`), criação, movimento, colisão, efeitos e `desenho/` (um arquivo por tipo) |
| `dificuldade/` | Quando e o que aparece: `niveis.js` (tabela de níveis), `padroes.js` (cenas de obstáculos), `diretor.js` (ritmo) |
| `combo/` | Multiplicador de pontuação por desvios seguidos: `parametros.js` (degraus, bônus, penalidades), `deteccao.js`, `pontuacao.js`, `hud.js`, `som.js` |
| `powerups/` | Itens coletáveis: `tipos.js` (catálogo), `parametros.js` (frequência), `estado.js`, `itens.js`, `geracao.js`, `efeitos.js`, `feedback.js`, `som.js`, `hud.js` e `desenho/` |
| `quase-colisao/` | Risco e recompensa: `parametros.js` (números para calibrar), `deteccao.js`, `pontuacao.js` (combo), `feedback.js`, `hud-sequencia.js`, `som.js` |
| `sistemas/` | Regras de jogo isoladas: hodômetro, força centrífuga, derrapagem e `pontos.js` (todo ponto ganho passa por ali) |
| `ecras/` | Interface: pausa, eventos de botões, HUD desenhado no canvas |
| `game/` | Ciclo da partida: `state.js` (loop), `reset.js`, `loop.js` |
| `tela-inicial/` | Menu, opções e recordes |
| `audio/` | `gerenciador.js` (efeitos em arquivo) e `sintetizador.js` (sons gerados no navegador) |
| `entities.js`, `input.js` | Lista de obstáculos/partículas e teclado/toque |
| `../css/estilos/layout.css` | Visual da barra, dos botões de toque e do aviso "gire o aparelho" (as medidas vêm de `layout/`) |
| `../tests/` | Testes automáticos (veja "Testes" abaixo) |

## Como ajustar o jogo

- **Dificuldade geral:** `dificuldade/niveis.js` (intervalos, pesos, chance de troca de faixa).
- **Novo tipo de obstáculo:** descreva em `obstaculos/tipos.js`, desenhe em
  `obstaculos/desenho/` e use em um padrão de `dificuldade/padroes.js`.
- **Novo padrão de obstáculos:** adicione em `dificuldade/padroes.js` e coloque o
  nome em `pesos` do nível desejado.
- **Power-ups (frequência, duração, efeitos):** `powerups/parametros.js` e `powerups/tipos.js`.
- **Combo de pontuação (degraus, bônus, penalidades):** `combo/parametros.js`.
- **Quase-colisão (folga, pontos, sequência):** `quase-colisao/parametros.js`.
- **Forma da estrada:** `pista/trajeto/tracado.js` (topo do arquivo, objeto `TRACADO`).

## Idiomas (3.3.0)

Português (padrão e reserva) e inglês. Nenhum texto da tela fica espalhado pelo
código: tudo está em `js/idiomas/textos/<codigo>.js`.

- **Escolher:** botões "Português / English" no menu inicial, em OPÇÕES e no menu de
  pausa. A troca vale na hora, **sem reiniciar a partida** (HUD, canvas, menus,
  recordes e resumo do Game Over se refazem). A escolha fica no `localStorage`
  (`retroTurboLanguage`); valor inválido ou armazenamento bloqueado = português.
  O idioma do navegador não é consultado: o padrão é sempre o português.
- **No HTML:** `data-i18n="chave"` (texto), `data-i18n-aria="chave"` (leitor de
  tela), `data-unidade="velocidade|distancia"` (KM/H, MPH, KM, MI).
- **No JavaScript:** `traduzir("hud.nivel", { n: 3 })`, `traduzirLista("cenario.limites")`.
  Texto que já está na tela (popups, avisos do combo) guarda a CHAVE e é
  traduzido ao desenhar, por isso acompanha a troca de idioma.
  Quem escreve texto por código se registra com `aoMudarIdioma(funcao)`.
- **Números e unidades:** português usa vírgula, km/h e km; inglês usa ponto, mph e
  milhas (o mostrador analógico muda a graduação: 0–540 km/h ou 0–340 mph). É só a
  apresentação: física, distância e pontuação continuam em km/h e km. Para o inglês
  usar km/h, copie o bloco `unidades` de `pt.js` para `en.js`. Ordinais dos recordes
  (1º / 1st 2nd 3rd) e datas também seguem o idioma.
- **Faltou uma tradução?** Cai no português; se faltar até lá, aparece a própria
  chave. Os testes exigem as mesmas chaves em todos os idiomas.
- **Palavras que não mudam:** TURBO, NITRO, RETRO, FUEL e o nome do jogo.
- A faixa de erro (`inicio/diagnostico.js`) guarda uma cópia de emergência em português
  para funcionar mesmo se o módulo de idiomas não carregar; um teste a mantém igual ao `pt.js`.

### Como adicionar espanhol (ou outro idioma)

1. Copie `js/idiomas/textos/en.js` para `es.js` e troque `codigo: "es"`,
   `nome: "Español"`, `locale: "es-ES"`, `htmlLang: "es"`, os textos e as `unidades`.
   Textos com plural usam `{ one: "...", other: "..." }`; o ordinal em `formato.ordinal`.
2. No `index.html`, acrescente `<script src="js/idiomas/textos/es.js?v=..."></script>`
   depois de `en.js`.
3. Pronto: o botão do idioma aparece nos três seletores sozinho. Rode `npm test`:
   o teste de consistência aponta chave faltando, marca `{n}` diferente ou texto não traduzido.
   Textos maiores: confira a barra e os menus (`python3 tests/ferramentas/verificar-idiomas-no-navegador.py`).

## Layout responsivo e tela cheia (3.2.0)

O jogo continua desenhado em **640×360 lógicos** (16:9); só muda a área da tela
em que o canvas aparece. `layout/calculo.js` escolhe, a cada tamanho de janela,
um dos modos abaixo (o que der o maior canvas) e `layout/responsivo.js` o aplica:

| Modo | Quando | Como fica |
|---|---|---|
| `lateral` | celular na horizontal e tela comprida (ex.: 20:9) | barra em cima; ◀ ▶ na lateral esquerda e TURBO na direita; canvas no meio |
| `inferior` | celular 16:9, tablet | barra em cima; ◀ TURBO ▶ numa faixa embaixo |
| `mesa` | notebook/desktop com mouse | só a barra em cima; o canvas ocupa todo o resto; botões de toque escondidos até o primeiro toque na tela |

- **Celular na vertical:** aparece o aviso "GIRE O APARELHO" e a partida em
  andamento é pausada (ao girar de volta ela continua pausada até CONTINUAR).
  Em notebook, janela estreita não pede para girar.
- **Tela cheia:** botão ⛶ na barra, tecla **F** e botão nos menus de pausa e
  opções (somem onde não há suporte, como no iPhone). No celular o primeiro
  clique em JOGAR tenta entrar sozinho em tela cheia, uma vez só.
- **Nitidez:** a resolução interna do canvas acompanha o tamanho e a densidade da
  tela (degraus 1, 1,25, 1,5, 1,75 e 2 × 640×360). Se o aparelho ficar abaixo de
  ~42 quadros/s por alguns segundos, cai um degrau (nunca sobe sozinho até a
  tela mudar de tamanho).
- **Ajustes:** `LAYOUT` no topo de `layout/calculo.js` (alturas, largura mínima das
  laterais, degraus de resolução). Para limitar a qualidade, troque o último
  degrau de `LAYOUT.escalas`.
- O HTML da barra (pontos, velocidade, distância, turbo, ⛶, pausa) usa o fator
  `--ui`, calculado pela menor dimensão da tela; botões de toque nunca ficam
  abaixo de 44 px.
- `css/base.css`, `css/controles.css`, `css/painel.css` e `css/modais.css` (na raiz
  de `css/`) são antigos e **não** são carregados pelo `index.html`.

## Carregamento e erros

- O menu mostra **CARREGANDO...** e o botão JOGAR fica inerte até o último script
  (`inicio/pronto.js`) rodar. Sem isso, clicar cedo demais na primeira visita
  escondia o menu e deixava só a tela vazia.
- Qualquer falha (arquivo que não carregou, erro durante a partida) aparece numa
  **faixa vermelha no topo** com botão de recarregar. Nada falha em silêncio.
- A **versão** aparece no rodapé do menu. Se ela não for a esperada, o navegador
  está usando arquivos antigos do cache: recarregue com Ctrl+F5.

## Ao atualizar arquivos

1. Troque `VERSAO_DO_JOGO` em `inicio/versao.js`.
2. No `index.html`, use Localizar e Substituir para trocar `?v=3.3.0` pela nova versão
   em todos os `<script>` e `<link>` (isso impede o navegador de misturar arquivos
   novos com antigos guardados no cache).
3. Se criar um arquivo novo, inclua-o no `index.html` **antes** de
   `js/inicio/pronto.js`, que deve continuar sendo o último script.

## Testes

Os testes carregam os scripts **reais** do jogo, na ordem do `index.html`, num
ambiente simulado (sem navegador, sem dependências). Precisam só do Node 20+:

    npm test                      # ou: node --test "tests/*.test.js"
    npm run simular-powerups      # frequência e tempo de efeito (evidência de balanceamento)

- `01-geracao` — regras do sorteio (escudo, pesos, nitro)
- `02-efeitos-e-colisoes` — coleta, escudo, cone e óleo
- `03-reinicio-e-pontos` — reinício limpa tudo; pontos x2 em todas as fontes
- `04-celular` — HUD em telas pequenas, som, câmera lenta, fim de partida
- `05-regressao` — hitboxes, parâmetros preservados, carregamento e partidas simuladas
- `06-layout` — layout em 17 resoluções (com e sem toque), proporção 16:9, áreas seguras,
  rotação e pausa, resolução interna, desempenho e tela cheia
- `07-idiomas` — troca pt/en, preferência salva, fallback, novo idioma (espanhol simulado),
  consistência dos textos, acentuação/UTF-8, nenhum texto solto no código ou no HTML,
  números/unidades/datas, textos no canvas, e simulação idêntica em qualquer idioma

Verificação em **navegador real** (opcional; precisa de Playwright com Chromium,
não faz parte do `npm test`): abre o jogo em 14 resoluções/orientações, mede
canvas, barra e botões, confere sobreposições, rotação e redimensionamento, e
salva capturas de tela:

    python3 tests/ferramentas/verificar-layout-no-navegador.py
    python3 tests/ferramentas/verificar-idiomas-no-navegador.py   # português e inglês em 5 telas

Os testes **não** medem FPS nem aparência: isso exige um aparelho real.
