// js/cenarios/gerenciador-paisagem.js
// Gerenciamento central da paisagem do Retro Turbo Racer.
//
// Ordem de desenho (de trás para frente):
//   céu → montanhas → terreno → acostamento → asfalto
// Em seguida o loop desenha objetos, jogador e atmosfera por profundidade.

function drawTrack() {
  drawSky();
  drawTerrain();
  drawShoulders();
  drawRoad();
}
