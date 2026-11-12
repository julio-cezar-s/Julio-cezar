/* js/combo/deteccao.js
   Detecta o DESVIO: o obstáculo passou pelo jogador sem encostar.
   Chamado pelo movimento a cada quadro, para cada obstáculo; cada um
   conta uma única vez.
*/

function observarDesvio(obstaculo) {
  if (obstaculo.desviado || obstaculo.atingido) return;
  if (!jaPassouDoJogador(obstaculo)) return;

  obstaculo.desviado = true;

  registrarDesvio(obstaculo);
}
