/* js/ecras/resumo.js
   Texto de resumo da partida na tela de Game Over.
   Junta as linhas de cada sistema (combo, quase-colisões); sistema sem nada
   a mostrar não ocupa espaço.
*/

function resumoDaPartida() {
  const linhas = [];

  if (typeof resumoDeCombo === "function") linhas.push(resumoDeCombo());
  if (typeof resumoDePowerUps === "function") linhas.push(resumoDePowerUps());
  if (typeof resumoDeQuaseColisoes === "function") linhas.push(resumoDeQuaseColisoes());

  return linhas.filter(Boolean).join("\n");
}
