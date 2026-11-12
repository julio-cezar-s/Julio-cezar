/* js/obstaculos/movimento.js
   Atualiza todos os obstáculos a cada quadro: aproximação em z,
   comportamento próprio (troca de faixa, zigue-zague), colisão e remoção.
*/

function atualizarObstaculos(dt, avanco) {
  ajustarVelocidadeDosSeguidores();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstaculo = obstacles[i];

    // Aproximação em profundidade (em z, não em pixels)
    obstaculo.prevZ = obstaculo.z;
    obstaculo.z -= avanco * obstaculo.speedMult;

    atualizarComportamento(obstaculo, dt);

    if (!obstaculo.atingido && verificarColisao(obstaculo)) {
      const resultado = tratarColisao(obstaculo);

      if (resultado === "fim") return;

      if (resultado === "remover") {
        obstacles.splice(i, 1);
        continue;
      }
    }

    // Passou raspando? (quase-colisao/)
    if (typeof observarQuaseColisao === "function") observarQuaseColisao(obstaculo);

    // Desviou sem encostar? (combo/)
    if (typeof observarDesvio === "function") observarDesvio(obstaculo);

    // Remove o que já passou pela câmera
    if (obstaculo.z < Z_MIN_DRAW - 0.1) {
      obstacles.splice(i, 1);
    }
  }
}

// Um veículo mais rápido nunca atravessa o que está na frente dele na
// mesma faixa: ele diminui até igualar a velocidade do líder.
function ajustarVelocidadeDosSeguidores() {
  for (const seguidor of obstacles) {
    if (!tipoDe(seguidor).duro) continue;

    for (const lider of obstacles) {
      if (lider === seguidor || !tipoDe(lider).duro) continue;

      const aFrente = lider.z < seguidor.z;
      const perto = seguidor.z - lider.z < 1.8;
      const mesmaFaixa = Math.abs(seguidor.worldX - lider.worldX)
        < (seguidor.worldWidth + lider.worldWidth) / 2 + 0.05;

      if (aFrente && perto && mesmaFaixa && seguidor.speedMult > lider.speedMult) {
        seguidor.speedMult = lider.speedMult;
      }
    }
  }
}
