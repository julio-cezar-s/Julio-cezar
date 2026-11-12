/* js/obstaculos/colisao.js
   Colisão entre o jogador e os obstáculos, no espaço do mundo:
     - horizontal: hitbox = fração da largura visual de cada um
                   (84% para veículos — valor já testado, não alterar)
     - profundidade: varredura entre o z anterior e o atual, para nunca
                     "atravessar" um obstáculo em alta velocidade
*/

function verificarColisao(obstaculo) {
  const def = tipoDe(obstaculo);

  const nasProfundidades =
    obstaculo.z <= PLAYER_Z + def.profundidade &&
    obstaculo.prevZ >= PLAYER_Z - def.profundidade;

  if (!nasProfundidades) return false;

  const distancia = Math.abs(obstaculo.worldX - player.worldX);

  return distancia < distanciaDeContato(obstaculo);
}

// Distância lateral (centro a centro) abaixo da qual as hitboxes se tocam.
// Também é a base da quase-colisão (quase-colisao/deteccao.js).
function distanciaDeContato(obstaculo) {
  const larguraJogador = PLAYER_WORLD_WIDTH * HITBOX_WIDTH_FACTOR;
  const larguraObstaculo = obstaculo.worldWidth * tipoDe(obstaculo).hitbox;

  return (larguraJogador + larguraObstaculo) / 2;
}

// O obstáculo já passou por completo pela profundidade do jogador?
// (usado por quase-colisao/ e combo/ para saber que o obstáculo foi "desviado")
function jaPassouDoJogador(obstaculo) {
  return obstaculo.z < PLAYER_Z - tipoDe(obstaculo).profundidade;
}

// Aplica o efeito do tipo. Devolve:
//   "fim"      a partida acabou (batida)
//   "remover"  o obstáculo some (ex.: cone derrubado)
//   null       segue normalmente
function tratarColisao(obstaculo) {
  switch (tipoDe(obstaculo).efeito) {
    case "batida":
      // Escudo (powerups/): absorve a batida e o obstáculo é removido
      if (typeof tentarAbsorverBatida === "function" && tentarAbsorverBatida(obstaculo)) {
        return "remover";
      }

      iniciarBatida(obstaculo);
      return "fim";

    case "tropeco":
      aplicarTropeco(obstaculo);
      return "remover";

    case "derrapagem":
      obstaculo.atingido = true;   // só derrapa uma vez por mancha
      iniciarDerrapagem();
      return null;
  }

  return null;
}
