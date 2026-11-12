/* js/quase-colisao/som.js
   Som da quase-colisão, montado com o sintetizador (audio/sintetizador.js):
     - "whoosh": ruído que varre de grave para agudo
     - "ding": nota que sobe a cada passo da sequência, premiando o encadeamento
*/

function tocarSomDeQuaseColisao(nivel, multiplicador) {
  const forca = nivel.nome === "RENTE" ? 1 : nivel.nome === "PERTO" ? 0.75 : 0.5;

  tocarRuidoVarrido({ de: 350, ate: 2200, duracao: 0.28, volume: 0.16 * forca });

  // Sobe um tom (2 semitons) a cada quase-colisão encadeada
  tocarNota({
    freq: 523.25 * Math.pow(2, ((multiplicador - 1) * 2) / 12),
    atraso: 0.04,
    duracao: 0.38,
    volume: 0.14 * forca,
  });
}
