/* js/pista/trajeto/tracado.js
   O TRAÇADO da estrada: onde há curvas e morros ao longo da distância.

   Este arquivo só responde a duas perguntas, para qualquer distância d
   percorrida:
     - curvaturaEm(d)  → quanto a pista curva ali  (+ direita, - esquerda)
     - elevacaoEm(d)   → quanto a pista sobe ali   (+ morro, - vale)

   O traçado é gerado sob demanda (infinito) e de forma determinística a
   partir de uma semente: cada partida sorteia uma estrada diferente.

   Curvas e morros são sequências INDEPENDENTES; por isso às vezes
   aparecem juntos (curva em subida) e às vezes separados.

   Quem transforma isso em desenho é js/pista/trajeto/perfil.js.
*/

// =====================================================
// AJUSTES (mexa aqui para mudar o "caráter" da estrada)
// =====================================================

const TRACADO = {
  semente: 0,

  // Trecho inicial reto, para o jogador se acostumar
  inicioReto: 55,
  inicioPlano: 40,

  // Curvatura máxima por tipo de curva (unidades de mundo por z²)
  curvaSuave: [0.008, 0.013],
  curvaMedia: [0.014, 0.020],
  curvaFechada: [0.021, 0.029],

  // Altura dos morros e comprimento (unidades de mundo)
  alturaMorro: [2.2, 5.0],
  comprimentoMorro: [50, 95],

  // A estrada fica mais intensa conforme a distância, até este valor
  distanciaDificuldadeMax: 700,
};

const TRACADO_CURVAS = [];   // { inicio, fim, curvatura }  (curvatura 0 = reta)
const TRACADO_COLINAS = [];  // { inicio, fim, altura }     (altura 0 = plano)

// =====================================================
// GERAÇÃO
// =====================================================

// Sorteia uma nova estrada (chamado ao iniciar cada partida)
function reiniciarTracado(semente = Math.random() * 1000) {
  TRACADO.semente = semente;
  TRACADO_CURVAS.length = 0;
  TRACADO_COLINAS.length = 0;
}

// 0.45 no começo → 1 após a distância máxima
function escalaDeDificuldade(distancia) {
  return Math.min(1, 0.45 + (distancia / TRACADO.distanciaDificuldadeMax) * 0.55);
}

function sortear(faixa, t) {
  return faixa[0] + (faixa[1] - faixa[0]) * t;
}

function adicionarSecaoDeCurva() {
  const i = TRACADO_CURVAS.length;
  const anterior = TRACADO_CURVAS[i - 1];
  const inicio = anterior ? anterior.fim : 0;
  const s = TRACADO.semente + i * 7.31;

  let comprimento;
  let curvatura = 0;

  if (!anterior) {
    comprimento = TRACADO.inicioReto;
  } else if (anterior.curvatura !== 0) {
    // Depois de uma curva vem uma reta (às vezes bem curta: curva em "S")
    comprimento = 12 + hash01(s) * 70;
  } else {
    comprimento = 55 + hash01(s + 1) * 60;

    const tipo = hash01(s + 2);
    const faixa = tipo < 0.5 ? TRACADO.curvaSuave
      : tipo < 0.8 ? TRACADO.curvaMedia
        : TRACADO.curvaFechada;

    const direcao = hash01(s + 4) > 0.5 ? 1 : -1;

    curvatura = direcao * sortear(faixa, hash01(s + 3)) * escalaDeDificuldade(inicio);
  }

  TRACADO_CURVAS.push({ inicio, fim: inicio + comprimento, curvatura });
}

function adicionarSecaoDeMorro() {
  const i = TRACADO_COLINAS.length;
  const anterior = TRACADO_COLINAS[i - 1];
  const inicio = anterior ? anterior.fim : 0;
  const s = TRACADO.semente + 500 + i * 5.77;

  let comprimento;
  let altura = 0;

  if (!anterior) {
    comprimento = TRACADO.inicioPlano;
  } else if (anterior.altura !== 0) {
    comprimento = 25 + hash01(s) * 70;   // trecho plano entre morros
  } else {
    comprimento = sortear(TRACADO.comprimentoMorro, hash01(s + 1));

    // 65% morros (sobe e desce), 35% vales (desce e sobe)
    const sinal = hash01(s + 2) < 0.65 ? 1 : -1;

    altura = sinal * sortear(TRACADO.alturaMorro, hash01(s + 3))
      * Math.min(1, 0.5 + inicio / 600);
  }

  TRACADO_COLINAS.push({ inicio, fim: inicio + comprimento, altura });
}

// Garante que o traçado existe pelo menos até a distância informada
function garantirTracadoAte(distancia) {
  while (!TRACADO_CURVAS.length || TRACADO_CURVAS[TRACADO_CURVAS.length - 1].fim < distancia) {
    adicionarSecaoDeCurva();
  }

  while (!TRACADO_COLINAS.length || TRACADO_COLINAS[TRACADO_COLINAS.length - 1].fim < distancia) {
    adicionarSecaoDeMorro();
  }
}

// =====================================================
// CONSULTAS
// =====================================================

// Busca binária: seção que contém a distância d
function buscarSecao(lista, d) {
  let a = 0;
  let b = lista.length - 1;

  while (a < b) {
    const meio = (a + b + 1) >> 1;
    if (lista[meio].inicio <= d) a = meio;
    else b = meio - 1;
  }

  return lista[a];
}

function suavizar(a, b, t) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

// Curvatura da pista na distância d. Cada curva entra e sai suavemente
// (rampa de 30% no início e no fim), sem "quebras" bruscas no volante.
function curvaturaEm(d) {
  if (d < 0) return 0;

  garantirTracadoAte(d + 5);

  const secao = buscarSecao(TRACADO_CURVAS, d);
  if (secao.curvatura === 0) return 0;

  const t = (d - secao.inicio) / (secao.fim - secao.inicio);
  const envelope = suavizar(0, 0.3, t) * (1 - suavizar(0.7, 1, t));

  return secao.curvatura * envelope;
}

// Altura do chão na distância d: um morro é uma lombada suave
// (sen²) que começa e termina no plano.
function elevacaoEm(d) {
  if (d < 0) return 0;

  garantirTracadoAte(d + 5);

  const secao = buscarSecao(TRACADO_COLINAS, d);
  if (secao.altura === 0) return 0;

  const t = (d - secao.inicio) / (secao.fim - secao.inicio);
  const seno = Math.sin(Math.PI * t);

  return secao.altura * seno * seno;
}
