/* js/cenarios/ambiente.js
   Coleta e ordena TODOS os objetos 3D da cena (vegetação, construções,
   cercas, sinalização e veículos) em uma única lista por profundidade.

   O desenho é feito de trás para frente (painter's algorithm), então
   nenhum elemento do cenário cobre a pista ou um carro indevidamente.
*/

// Percorre posições fixas ao longo da pista (ancoradas na distância
// percorrida, portanto estáveis enquanto rolam em direção à câmera).
// callback(indiceAbsoluto, z)
function percorrerPosicoes(espaco, callback, zMax = Z_FAR, zMin = 0.9) {
  const dist = gameState.worldDistance;

  for (let k = Math.ceil((dist + zMin) / espaco); ; k++) {
    const z = k * espaco - dist;
    if (z > zMax) break;
    callback(k, z);
  }
}

function coletarObjetosDaCena(inimigos) {
  const lista = [];

  if (typeof coletarVegetacao === "function") coletarVegetacao(lista);
  if (typeof coletarConstrucoes === "function") coletarConstrucoes(lista);
  if (typeof coletarElementos === "function") coletarElementos(lista);
  if (typeof coletarSinalizacaoDeCurva === "function") coletarSinalizacaoDeCurva(lista);
  if (typeof listarItensDePowerUp === "function") listarItensDePowerUp(lista);

  inimigos.forEach((inimigo) => {
    lista.push({ tipo: "obstaculo", z: inimigo.z, ref: inimigo, chao: inimigo.chao });
  });

  // Mais distantes primeiro
  lista.sort((a, b) => b.z - a.z);

  return lista;
}

// parte "tras": objetos atrás do jogador; "frente": à frente dele
function desenharObjetos(lista, parte) {
  for (let i = 0; i < lista.length; i++) {
    const obj = lista[i];

    // Marcas no asfalto (óleo) ficam sempre sob o carro do jogador
    const atras = obj.z >= PLAYER_Z || obj.chao;
    if ((parte === "tras") !== atras) continue;

    desenharObjetoDaCena(obj);
  }
}

function desenharObjetoDaCena(obj) {
  const s = projScale(obj.z);

  // Desvanecimento com a distância (some na névoa)
  const alfa = 1 - fogAmount(obj.z, 12) * 0.95;
  if (alfa <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = alfa;

  // Objeto atrás de um morro: aparece só a parte acima da crista
  const corte = linhaDeCorteDoObjeto(obj.z, projY(s));

  if (corte !== null) {
    if (corte <= 0) { ctx.restore(); return; }

    ctx.beginPath();
    ctx.rect(0, 0, GAME_WIDTH, corte);
    ctx.clip();
  }

  switch (obj.tipo) {
    case "arvore": desenharArvore(obj, s); break;
    case "arbusto": desenharArbusto(obj, s); break;
    case "flores": desenharFlores(obj, s); break;
    case "galpao": desenharGalpao(obj, s); break;
    case "casa": desenharCasa(obj, s); break;
    case "silo": desenharSilo(obj, s); break;
    case "outdoor": desenharOutdoor(obj, s); break;
    case "cerca": desenharSegmentoCerca(obj, s); break;
    case "delineador": desenharDelineador(obj, s); break;
    case "placa": desenharPlaca(obj, s); break;
    case "portico": desenharPortico(obj, s); break;
    case "chevron": desenharChevron(obj, s); break;
    case "obstaculo": drawObstacle(obj.ref); break;
    case "powerup": desenharItemDePowerUp(obj.ref); break;
  }

  ctx.restore();
}

// Sombra elíptica no chão, projetada para longe do sol (esquerda)
function desenharSombraChao(bx, by, largura, profundidade, alfa = 0.24) {
  ctx.fillStyle = `rgba(14,30,18,${alfa})`;
  ctx.beginPath();
  ctx.ellipse(bx - largura * 0.35, by + profundidade * 0.15,
    largura, profundidade, 0, 0, Math.PI * 2);
  ctx.fill();
}
