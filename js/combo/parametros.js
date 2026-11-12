/* js/combo/parametros.js
   AJUSTES do COMBO de pontuação. É aqui que se calibra o ritmo da escada.

   O combo é um multiplicador que vale para a PARTIDA TODA e cresce a cada
   obstáculo desviado sem encostar. Ele multiplica:
     - a pontuação que corre com o tempo (0,5 por quadro)
     - o bônus de cada desvio

   (As quase-colisões têm a sua própria SEQUÊNCIA, de curta duração, em
   quase-colisao/. As duas se somam, mas são coisas diferentes.)

   Tudo que NÃO bate conta como desvio: carro, caminhão, moto, barreira,
   cone e mancha de óleo que passaram sem tocar o jogador.
   Bater em carro/caminhão/moto/barreira encerra a partida, então o combo
   só perde força ao tropeçar num cone ou derrapar no óleo.
*/

const COMBO = {
  // Sequência de desvios necessária para cada multiplicador (x1, x2, x3 ...)
  degraus: [0, 6, 14, 26, 42, 64, 90, 120],

  // Pontos base de cada desvio (× peso do tipo × multiplicador do combo)
  bonusPorDesvio: 10,

  // Quanto cada tipo vale na sequência. Veículos difíceis valem mais;
  // cones e óleo valem pouco para fileiras deles não inflarem o combo.
  pesoDoDesvio: {
    civilian: 1,
    police: 1,
    truck: 2,
    motorcycle: 2,
    barrier: 1,
    cone: 0.25,
    oil: 0.5,
  },

  // Fração da sequência perdida em cada erro (1 = zera tudo, 0.5 = metade)
  penalidade: {
    tropeco: 0.5,       // bateu num cone
    derrapagem: 0.5,    // passou no óleo
  },
};

// Duração (em quadros) das animações do painel
const COMBO_ANIMACAO = {
  pulso: 24,       // painel "pulsa" ao subir de multiplicador
  aviso: 80,       // texto "COMBO x4!" abaixo do painel
  perda: 50,       // painel treme em vermelho ao perder
};
