/* js/powerups/som.js
   Sons dos power-ups, sintetizados (audio/sintetizador.js).
*/

function tocarSomDePowerUp(tipo) {
  switch (tipo) {
    case "nitro":
      tocarRuidoVarrido({ de: 300, ate: 3200, duracao: 0.3, volume: 0.15 });
      tocarNota({ freq: 880, atraso: 0.05, duracao: 0.25, volume: 0.12, tipo: "square" });
      break;

    case "escudo":
      tocarNota({ freq: 523, duracao: 0.18, volume: 0.13 });
      tocarNota({ freq: 784, atraso: 0.1, duracao: 0.3, volume: 0.13 });
      tocarNota({ freq: 1175, atraso: 0.2, duracao: 0.35, volume: 0.08, tipo: "sine" });
      break;

    case "lentidao":
      tocarNota({ freq: 700, freqFinal: 180, duracao: 0.55, volume: 0.13, tipo: "sine" });
      break;

    case "dobro":
      tocarNota({ freq: 988, duracao: 0.1, volume: 0.11, tipo: "square" });
      tocarNota({ freq: 1319, atraso: 0.08, duracao: 0.28, volume: 0.11, tipo: "square" });
      break;
  }
}

function tocarSomDeEscudoQuebrando() {
  tocarRuidoVarrido({ de: 2400, ate: 200, duracao: 0.35, volume: 0.2, q: 0.9 });
  tocarNota({ freq: 220, freqFinal: 70, duracao: 0.3, volume: 0.15, tipo: "sawtooth" });
}
