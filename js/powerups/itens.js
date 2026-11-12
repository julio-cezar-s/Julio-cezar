/* js/powerups/itens.js
   Os itens de power-up na pista: criação, aproximação e coleta.
   Eles ficam parados no asfalto (aproximam-se na velocidade da pista),
   então chegam ao jogador junto com os cones e o óleo.

   Não são obstáculos: vivem em lista própria e não contam para colisão,
   quase-colisão nem combo.
*/

const itensDePowerUp = [];

function limparItensDePowerUp() {
  itensDePowerUp.length = 0;
}

function criarItemDePowerUp(tipo, faixa) {
  const z = zDeSurgimento();

  const item = {
    tipo,
    faixa,
    worldX: xDaFaixa(faixa),
    z,
    prevZ: z,
    zSurgimento: z,
    tempo: 0,                        // anima giro e flutuação
    fase: Math.random() * Math.PI * 2,
  };

  itensDePowerUp.push(item);

  return item;
}

// Aproxima os itens, coleta os que o jogador tocou e descarta os que passaram
function atualizarItensDePowerUp(dt, avanco) {
  for (let i = itensDePowerUp.length - 1; i >= 0; i--) {
    const item = itensDePowerUp[i];

    item.prevZ = item.z;
    item.z -= avanco;
    item.tempo += dt;

    if (itemFoiColetado(item)) {
      itensDePowerUp.splice(i, 1);
      aplicarPowerUp(item.tipo);
      continue;
    }

    if (item.z < Z_MIN_DRAW - 0.1) itensDePowerUp.splice(i, 1);
  }
}

// Mesma varredura em profundidade da colisão: em alta velocidade o item
// pode "pular" a janela inteira em um quadro e ainda assim ser coletado.
function itemFoiColetado(item) {
  const nasProfundidades =
    item.z <= PLAYER_Z + POWERUPS.profundidadeDeColeta &&
    item.prevZ >= PLAYER_Z - POWERUPS.profundidadeDeColeta;

  if (!nasProfundidades) return false;

  const alcance = (PLAYER_WORLD_WIDTH * HITBOX_WIDTH_FACTOR + POWERUPS.larguraDeColeta) / 2;

  return Math.abs(item.worldX - player.worldX) < alcance;
}

// Entrega os itens para a lista de objetos da cena (ordenada por profundidade)
function listarItensDePowerUp(lista) {
  itensDePowerUp.forEach((item) => {
    lista.push({ tipo: "powerup", z: item.z, ref: item });
  });
}
