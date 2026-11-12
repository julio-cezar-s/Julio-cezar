/* js/quase-colisao/parametros.js
   AJUSTES da quase-colisão. É aqui que se calibra o "risco e recompensa".

   Uma quase-colisão acontece quando um veículo (ou barreira) passa pelo
   jogador SEM bater, com uma folga lateral pequena. A folga é medida a
   partir da hitbox (84% da largura visual), em unidades de faixa:

        0.07  →  os carros quase se tocam: visualmente a lataria "raspa"
        0.30  →  ainda perto, mas com margem

   Duas faixas vizinhas, com os carros no centro de cada uma, têm folga 0.56:
   dirigir normalmente NUNCA conta como quase-colisão.
*/

const QUASE_COLISAO = {
  // Do mais apertado para o mais folgado (vale a primeira que couber)
  niveis: [
    { nome: "RENTE", folga: 0.07, pontos: 120, turbo: 15, cor: "#ff2e63", faiscas: 14 },
    { nome: "PERTO", folga: 0.16, pontos: 50, turbo: 8, cor: "#ffd23f", faiscas: 6 },
    { nome: "QUASE", folga: 0.30, pontos: 20, turbo: 4, cor: "#37f2ff", faiscas: 0 },
  ],

  // Tempo (em quadros, 60 = 1 s) para encadear a próxima e manter a sequência
  janelaDaSequencia: 180,

  // Multiplicador da sequência = quase-colisões seguidas, até este limite
  // (não confundir com o COMBO de pontuação, em combo/)
  multiplicadorMax: 5,
};
