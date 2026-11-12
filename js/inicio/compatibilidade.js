/* js/inicio/compatibilidade.js
   Recursos que alguns navegadores ainda não têm. Sem eles o desenho do
   carro lançava um erro a cada quadro e a tela ficava vazia.
*/

// CanvasRenderingContext2D.roundRect (Safari < 16, Firefox < 112)
if (typeof CanvasRenderingContext2D !== "undefined" &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, largura, altura, raio = 0) {
    const bruto = Array.isArray(raio) ? raio[0] : (typeof raio === "object" ? raio.x : raio);
    const r = Math.max(0, Math.min(bruto || 0, Math.abs(largura) / 2, Math.abs(altura) / 2));

    this.moveTo(x + r, y);
    this.arcTo(x + largura, y, x + largura, y + altura, r);
    this.arcTo(x + largura, y + altura, x, y + altura, r);
    this.arcTo(x, y + altura, x, y, r);
    this.arcTo(x, y, x + largura, y, r);
    this.closePath();
  };
}
