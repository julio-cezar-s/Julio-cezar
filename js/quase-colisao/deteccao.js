/* js/quase-colisao/deteccao.js
   Detecta a quase-colisão: acompanha a folga lateral enquanto um obstáculo
   atravessa a profundidade do jogador e, quando ele termina de passar,
   classifica a menor folga registrada.

   Usa a MESMA janela de profundidade da colisão (obstaculos/colisao.js),
   inclusive a varredura por quadros: em alta velocidade o obstáculo pode
   "pular" a janela inteira em um quadro e ainda assim é avaliado.
*/

// Chamado pelo movimento a cada quadro, para cada obstáculo
function observarQuaseColisao(obstaculo) {
  const def = tipoDe(obstaculo);

  // Só vale para o que machuca (carros, caminhão, moto, barreira)
  if (!def.duro || obstaculo.quaseAvaliado) return;

  const naJanela =
    obstaculo.z <= PLAYER_Z + def.profundidade &&
    obstaculo.prevZ >= PLAYER_Z - def.profundidade;

  if (naJanela) {
    const folga = Math.max(0, folgaLateral(obstaculo));

    obstaculo.folgaMinima = Math.min(
      obstaculo.folgaMinima === undefined ? Infinity : obstaculo.folgaMinima,
      folga
    );
  }

  // Já passou por completo? Então avalia.
  if (jaPassouDoJogador(obstaculo) && obstaculo.folgaMinima !== undefined) {
    obstaculo.quaseAvaliado = true;

    const nivel = classificarFolga(obstaculo.folgaMinima);
    if (nivel) registrarQuaseColisao(nivel, obstaculo);
  }
}

// Espaço livre entre as hitboxes (positivo = não encostam)
function folgaLateral(obstaculo) {
  const distancia = Math.abs(obstaculo.worldX - player.worldX);

  return distancia - distanciaDeContato(obstaculo);
}

function classificarFolga(folga) {
  return QUASE_COLISAO.niveis.find((nivel) => folga <= nivel.folga) || null;
}
