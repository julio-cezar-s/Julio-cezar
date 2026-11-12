/* js/combo/pontuacao.js
   Estado e regras do COMBO de pontuação.

   Cada desvio soma à sequência (com o peso do tipo) e paga um bônus já
   multiplicado. Ao atingir um degrau, o multiplicador sobe. Erros leves
   (cone, óleo) tiram parte da sequência — o multiplicador pode cair.
*/

const combo = {
  sequencia: 0,         // desvios acumulados (ponderados pelo tipo)
  degrau: 0,            // 0 = x1, 1 = x2, ...
  melhorDegrau: 0,
  totalDeDesvios: 0,
  pontosDeDesvios: 0,   // bônus ganhos só com desvios

  // Animações do painel (quadros restantes)
  pulso: 0,
  aviso: 0,
  avisoChave: "",          // chave do texto do aviso (traduzido ao desenhar)
  avisoMultiplicador: 1,   // valor que entra no texto ({n})
  avisoPerda: false,
  perda: 0,
};

function reiniciarCombo() {
  combo.sequencia = 0;
  combo.degrau = 0;
  combo.melhorDegrau = 0;
  combo.totalDeDesvios = 0;
  combo.pontosDeDesvios = 0;
  combo.pulso = 0;
  combo.aviso = 0;
  combo.avisoChave = "";
  combo.avisoMultiplicador = 1;
  combo.avisoPerda = false;
  combo.perda = 0;
}

function multiplicadorDeCombo() {
  return combo.degrau + 1;
}

// Qual degrau uma dada sequência alcança
function degrauDaSequencia(sequencia) {
  let degrau = 0;

  COMBO.degraus.forEach((minimo, i) => {
    if (sequencia >= minimo) degrau = i;
  });

  return degrau;
}

function registrarDesvio(obstaculo) {
  const peso = COMBO.pesoDoDesvio[obstaculo.type] ?? 1;

  // Bônus calculado com o multiplicador de ANTES deste desvio
  const base = Math.round(COMBO.bonusPorDesvio * peso * multiplicadorDeCombo());

  // Entra pela pontuação central (bônus globais, como PONTOS x2, valem aqui também)
  const pontos = adicionarPontos(base);

  combo.sequencia += peso;
  combo.totalDeDesvios++;
  combo.pontosDeDesvios += pontos;

  const novoDegrau = degrauDaSequencia(combo.sequencia);

  if (novoDegrau > combo.degrau) {
    combo.degrau = novoDegrau;
    combo.melhorDegrau = Math.max(combo.melhorDegrau, novoDegrau);

    combo.pulso = COMBO_ANIMACAO.pulso;
    combo.aviso = COMBO_ANIMACAO.aviso;
    combo.avisoChave = "combo.subiu";
    combo.avisoMultiplicador = multiplicadorDeCombo();
    combo.avisoPerda = false;

    if (typeof tocarSomDeCombo === "function") tocarSomDeCombo(novoDegrau);
  }
}

// motivo: "tropeco" | "derrapagem" (ver COMBO.penalidade)
function penalizarCombo(motivo) {
  if (combo.sequencia <= 0) return;

  const fracao = COMBO.penalidade[motivo] ?? 1;
  const degrauAntes = combo.degrau;

  combo.sequencia = Math.floor(combo.sequencia * (1 - fracao));
  combo.degrau = degrauDaSequencia(combo.sequencia);

  combo.perda = COMBO_ANIMACAO.perda;

  if (combo.degrau < degrauAntes) {
    combo.aviso = COMBO_ANIMACAO.aviso;
    combo.avisoChave = combo.degrau === 0 ? "combo.perdido" : "combo.caiu";
    combo.avisoMultiplicador = multiplicadorDeCombo();
    combo.avisoPerda = true;

    if (typeof tocarSomDePerdaDeCombo === "function") tocarSomDePerdaDeCombo();
  }
}

// Chamado a cada quadro: só anima o painel
function atualizarCombo(dt) {
  combo.pulso = Math.max(0, combo.pulso - dt);
  combo.aviso = Math.max(0, combo.aviso - dt);
  combo.perda = Math.max(0, combo.perda - dt);
}

// Linha para a tela de Game Over (vazia se não houve nenhum desvio)
function resumoDeCombo() {
  if (combo.totalDeDesvios === 0) return "";

  return traduzir("resumo.combo", {
    melhor: combo.melhorDegrau + 1,
    desvios: combo.totalDeDesvios,
    pontos: combo.pontosDeDesvios,
  });
}
