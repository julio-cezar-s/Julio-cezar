/* js/powerups/geracao.js
   QUANDO e QUAL power-up aparece. Segue um ritmo próprio, independente do
   diretor de obstáculos (dificuldade/), mas respeita as faixas fechadas
   por ele: nunca coloca um item onde só se chega batendo.
*/

const geradorDePowerUps = { temporizador: POWERUPS.primeiroEm };

function reiniciarGeracaoDePowerUps() {
  geradorDePowerUps.temporizador = POWERUPS.primeiroEm;
}

function atualizarGeracaoDePowerUps(dt) {
  geradorDePowerUps.temporizador -= dt;
  if (geradorDePowerUps.temporizador > 0) return;

  // Já há um item na pista: espera um pouco
  if (itensDePowerUp.length >= POWERUPS.maximoNaPista) {
    geradorDePowerUps.temporizador = 60;
    return;
  }

  const faixa = faixaLivreParaItem();

  // Pista cheia agora: tenta de novo daqui a pouco
  if (faixa === null) {
    geradorDePowerUps.temporizador = 45;
    return;
  }

  criarItemDePowerUp(sortearPowerUp(), faixa);

  const [min, max] = POWERUPS.intervalo;
  geradorDePowerUps.temporizador = min + Math.random() * (max - min);
}

// Faixa sem obstáculo duro por perto (nem a caminho, na fila do diretor)
function faixaLivreParaItem() {
  const z = zDeSurgimento();
  const fechadas = faixasBloqueadasEm(z - POWERUPS.janelaSegura, z + POWERUPS.janelaSegura);

  if (typeof diretor !== "undefined") {
    diretor.fila.forEach((peca) => {
      const def = TIPOS_DE_OBSTACULO[peca.tipo];
      if (!def.duro || peca.atraso > 90) return;

      const x = peca.x !== undefined ? peca.x : xDaFaixa(peca.faixa);
      faixasCobertas(x, def.largura).forEach((f) => fechadas.add(f));
    });
  }

  const livres = [];

  for (let f = 0; f < LANE_COUNT; f++) {
    if (!fechadas.has(f)) livres.push(f);
  }

  return livres.length ? livres[Math.floor(Math.random() * livres.length)] : null;
}

// Peso de cada tipo agora: o escudo só entra no sorteio quando NENHUM efeito
// está ativo; o que está ativo é menos provável; e o nitro aparece mais
// quando o turbo está vazio.
function pesoDoPowerUp(tipo) {
  let peso = TIPOS_DE_POWERUP[tipo].peso;

  if (tipo === "escudo" && algumEfeitoDePowerUpAtivo()) return 0;
  if (powerUpAtivo(tipo)) peso *= 0.2;
  if (tipo === "nitro") peso *= 0.5 + (100 - gameState.turboEnergy) / 50;

  return peso;
}

function sortearPowerUp() {
  const nomes = Object.keys(TIPOS_DE_POWERUP);
  const pesos = nomes.map(pesoDoPowerUp);
  const total = pesos.reduce((soma, p) => soma + p, 0);

  if (total <= 0) return "nitro";

  let sorteio = Math.random() * total;

  for (let i = 0; i < nomes.length; i++) {
    sorteio -= pesos[i];
    if (sorteio <= 0) return nomes[i];
  }

  return nomes[0];
}
