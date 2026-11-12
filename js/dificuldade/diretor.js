/* js/dificuldade/diretor.js
   O DIRETOR decide QUANDO e O QUE aparece na pista.

   A cada intervalo ele sorteia um padrão (padroes.js) conforme o nível
   atual (niveis.js) e coloca suas peças numa fila. Cada peça é criada
   quando o seu atraso termina, mas só se não fechar as três faixas.

   Ritmo: padrões pesados são seguidos de uma pausa maior e, de tempos em
   tempos, há um respiro. Assim a dificuldade vem em ondas, não em linha
   reta, e o jogador tem momentos para recuperar o fôlego.
*/

const DIRETOR = {
  foraDoAr: 55,           // quadros de folga após um padrão pesado (custo ≥ 2.5)
  padroesAteRespiro: 5,   // a cada tantos padrões há um respiro
  respiro: 90,            // quadros extras no respiro
  tentativas: 4,          // vezes que uma peça tenta entrar antes de ser descartada
  esperaDaTentativa: 24,  // quadros entre tentativas
};

const diretor = {
  temporizador: 0,
  fila: [],
  padroesCriados: 0,
};

function reiniciarDiretor() {
  diretor.temporizador = 70;     // primeiro padrão chega depois de ~1 s
  diretor.fila.length = 0;
  diretor.padroesCriados = 0;

  gameState.nivel = 1;
  gameState.nivelAviso = 0;
}

// Chamado a cada quadro pelo loop
function atualizarDiretor(dt) {
  atualizarNivel(dt);
  processarFila(dt);

  diretor.temporizador -= dt;

  if (diretor.temporizador <= 0 && diretor.fila.length === 0) {
    spawnObstacle();
  }
}

// Cria um padrão AGORA. Também é o ponto de entrada para testes e depuração.
function spawnObstacle() {
  const cfg = configuracaoDoNivel();
  const nome = sortearPadrao(cfg.pesos);
  const padrao = PADROES[nome];

  padrao.gerar(cfg).forEach((peca) => {
    diretor.fila.push({ ...peca, atraso: peca.atraso || 0, tentativas: DIRETOR.tentativas });
  });

  diretor.padroesCriados++;

  // Quanto vale esperar até o próximo padrão
  let espera = sortearEntre(cfg.intervalo[0], cfg.intervalo[1]);

  if (padrao.custo >= 2.5) espera += DIRETOR.foraDoAr;
  if (diretor.padroesCriados % DIRETOR.padroesAteRespiro === 0) espera += DIRETOR.respiro;

  diretor.temporizador = espera;
}

function sortearPadrao(pesos) {
  const nomes = Object.keys(pesos);
  const total = nomes.reduce((soma, nome) => soma + pesos[nome], 0);

  let sorteio = Math.random() * total;

  for (const nome of nomes) {
    sorteio -= pesos[nome];
    if (sorteio <= 0) return nome;
  }

  return nomes[0];
}

// =====================================================
// FILA DE PEÇAS
// =====================================================

function processarFila(dt) {
  for (let i = diretor.fila.length - 1; i >= 0; i--) {
    const peca = diretor.fila[i];

    peca.atraso -= dt;
    if (peca.atraso > 0) continue;

    if (podeCriar(peca)) {
      criarObstaculo(peca.tipo, peca);
      diretor.fila.splice(i, 1);
    } else if (--peca.tentativas <= 0) {
      diretor.fila.splice(i, 1);          // desiste desta peça
    } else {
      peca.atraso = DIRETOR.esperaDaTentativa;
    }
  }
}

// Uma peça dura só entra se sobrar ao menos uma faixa livre perto de onde
// ela vai surgir. Peças macias (cone, óleo) entram sempre.
function podeCriar(peca) {
  const def = TIPOS_DE_OBSTACULO[peca.tipo];
  if (!def.duro) return true;

  const zSurgimento = zDeSurgimento();
  const bloqueadas = faixasBloqueadasEm(zSurgimento - 3.6, zSurgimento + 1);

  const x = peca.x !== undefined ? peca.x : xDaFaixa(peca.faixa);

  faixasCobertas(x, def.largura).forEach((f) => bloqueadas.add(f));

  return bloqueadas.size < LANE_COUNT;
}
