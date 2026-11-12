/* js/combo/som.js
   Sons do COMBO, sintetizados (audio/sintetizador.js):
     - subir de multiplicador: dois toques ascendentes, mais agudos a cada degrau
     - perder: queda de tom
*/

function tocarSomDeCombo(degrau) {
  // Sobe um tom (2 semitons) por degrau
  const base = 392 * Math.pow(2, (degrau * 2) / 12);

  tocarNota({ freq: base, duracao: 0.16, volume: 0.12, tipo: "square" });
  tocarNota({ freq: base * 1.5, atraso: 0.09, duracao: 0.24, volume: 0.12, tipo: "square" });
}

function tocarSomDePerdaDeCombo() {
  tocarNota({ freq: 330, freqFinal: 110, duracao: 0.32, volume: 0.13, tipo: "sawtooth" });
}
