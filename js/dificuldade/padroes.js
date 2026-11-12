/* js/dificuldade/padroes.js
   CATÁLOGO DE PADRÕES de obstáculos. Cada padrão é uma pequena "cena":
   uma lista de obstáculos com o atraso (em quadros) de cada um.

   Regras de projeto — todo padrão precisa ser possível de passar:
     - o atraso é em QUADROS (tempo), não em distância: assim o tempo de
       reação é o mesmo em qualquer velocidade;
     - nenhum padrão fecha as três faixas ao mesmo tempo
       (o diretor ainda confere isso antes de criar cada peça).

   Cada especificação aceita: tipo, faixa | x, atraso, velocidade,
   comportamento, alvoForcado, cor (ver obstaculos/criacao.js).
*/

// Velocidade de quem troca de faixa: lento o bastante para dar tempo
const VELOCIDADE_DE_QUEM_TROCA = [0.7, 0.78];

function sortearEntre(min, max) {
  return min + Math.random() * (max - min);
}

function faixaAleatoria(excluir = []) {
  const opcoes = [];

  for (let f = 0; f < LANE_COUNT; f++) {
    if (!excluir.includes(f)) opcoes.push(f);
  }

  return opcoes[Math.floor(Math.random() * opcoes.length)];
}

// 85% carro comum, 15% viatura
function tipoDeCarroComum() {
  return Math.random() < 0.15 ? "police" : "civilian";
}

const PADROES = {
  // Um carro; nos níveis altos pode trocar de faixa avisando com o pisca
  simples: {
    custo: 1,
    gerar(cfg) {
      const troca = Math.random() < cfg.trocaDeFaixa;

      return [{
        tipo: tipoDeCarroComum(),
        faixa: faixaAleatoria(),
        comportamento: troca ? "trocaDeFaixa" : null,
        velocidade: troca ? sortearEntre(...VELOCIDADE_DE_QUEM_TROCA) : undefined,
      }];
    },
  },

  // Dois carros lado a lado, sobra uma faixa
  duplo: {
    custo: 2,
    gerar() {
      const a = faixaAleatoria();
      const b = faixaAleatoria([a]);
      const velocidade = sortearEntre(0.85, 1.1);

      return [
        { tipo: tipoDeCarroComum(), faixa: a, velocidade },
        { tipo: tipoDeCarroComum(), faixa: b, velocidade },
      ];
    },
  },

  // Caminhão de carga larga: cobre duas faixas, sobra uma. É lento.
  caminhao: {
    custo: 2.5,
    gerar() {
      const x = Math.random() < 0.5 ? -0.5 : 0.5;   // entre duas faixas

      return [{ tipo: "truck", x }];
    },
  },

  // Moto veloz costurando entre as faixas
  moto: {
    custo: 1.5,
    gerar() {
      return [{ tipo: "motorcycle", faixa: faixaAleatoria(), comportamento: "zigue" }];
    },
  },

  // Fileira de cones em zigue-zague (não destroem, tiram velocidade e turbo)
  slalom: {
    custo: 1,
    gerar() {
      const cones = [];
      let faixa = faixaAleatoria();
      let sentido = faixa === 0 ? 1 : faixa === 2 ? -1 : (Math.random() < 0.5 ? 1 : -1);

      for (let i = 0; i < 5; i++) {
        cones.push({ tipo: "cone", faixa, atraso: i * 34 });

        faixa += sentido;

        if (faixa < 0 || faixa > LANE_COUNT - 1) {
          sentido = -sentido;
          faixa += 2 * sentido;
        }
      }

      return cones;
    },
  },

  // Uma ou duas manchas de óleo
  oleo: {
    custo: 1,
    gerar() {
      const a = faixaAleatoria();
      const manchas = [{ tipo: "oil", faixa: a }];

      if (Math.random() < 0.5) {
        manchas.push({ tipo: "oil", faixa: faixaAleatoria([a]), atraso: 55 });
      }

      return manchas;
    },
  },

  // Zona de obras: cones de aviso e, logo depois, uma barreira que fecha
  // uma faixa. Quem vê os cones já sabe que precisa mudar de faixa.
  obras: {
    custo: 2.5,
    gerar() {
      const fechada = faixaAleatoria();
      const x = xDaFaixa(fechada);
      const pecas = [];

      // Três cones de aviso, cada vez mais para o centro da faixa
      [0.22, 0.12, 0.0].forEach((desvio, i) => {
        pecas.push({ tipo: "cone", x: x + (i % 2 === 0 ? desvio : -desvio), atraso: i * 14 });
      });

      // Barreira fechando a faixa, com um cone de cada lado
      pecas.push({ tipo: "barrier", faixa: fechada, atraso: 48 });
      pecas.push({ tipo: "cone", x: x - 0.55, atraso: 48 });
      pecas.push({ tipo: "cone", x: x + 0.55, atraso: 48 });

      return pecas;
    },
  },

  // Três carros em degraus, um por faixa, com 0,8 s entre eles
  escada: {
    custo: 3,
    gerar() {
      const subindo = Math.random() < 0.5;
      const velocidade = sortearEntre(0.85, 1.05);
      const carros = [];

      for (let i = 0; i < LANE_COUNT; i++) {
        carros.push({
          tipo: tipoDeCarroComum(),
          faixa: subindo ? i : LANE_COUNT - 1 - i,
          atraso: i * 48,
          velocidade,
        });
      }

      return carros;
    },
  },

  // Carro ao lado do jogador que corta para a faixa dele (com pisca)
  cortada: {
    custo: 2,
    gerar() {
      const doJogador = faixaDoJogador();
      const vizinhas = [doJogador - 1, doJogador + 1].filter((f) => f >= 0 && f < LANE_COUNT);
      const faixa = vizinhas[Math.floor(Math.random() * vizinhas.length)];

      return [{
        tipo: tipoDeCarroComum(),
        faixa,
        comportamento: "trocaDeFaixa",
        alvoForcado: true,
        velocidade: sortearEntre(...VELOCIDADE_DE_QUEM_TROCA),
      }];
    },
  },
};
