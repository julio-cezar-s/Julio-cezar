// tests/helpers/apoio.js — atalhos usados pelos testes
const { carregarJogo } = require("./carregar-jogo");

function novoJogo(opcoes) {
  const j = carregarJogo(opcoes);
  j.novaPartida();
  return j;
}

// Obstáculo exatamente em cima do jogador (colide no próximo atualizarObstaculos)
function obstaculoNoJogador(j, tipo) {
  const o = j.f.criarObstaculo(tipo, { faixa: 1, velocidade: 1 });
  o.worldX = j.v.player.worldX;
  o.z = j.v.PLAYER_Z;
  o.prevZ = j.v.PLAYER_Z + 0.05;
  return o;
}

// Item de power-up exatamente em cima do jogador
function itemNoJogador(j, tipo) {
  const item = j.f.criarItemDePowerUp(tipo, 1);
  item.worldX = j.v.player.worldX;
  item.z = j.v.PLAYER_Z;
  item.prevZ = j.v.PLAYER_Z + 0.05;
  return item;
}

function coletar(j, tipo) {
  itemNoJogador(j, tipo);
  j.f.atualizarItensDePowerUp(1, 0);
}

// Sorteia n vezes e devolve a frequência de cada tipo
function frequencias(j, n) {
  const cont = { nitro: 0, escudo: 0, lentidao: 0, dobro: 0 };
  for (let i = 0; i < n; i++) cont[j.f.sortearPowerUp()]++;
  return Object.fromEntries(Object.entries(cont).map(([k, v]) => [k, v / n]));
}

// Probabilidade teórica de cada tipo a partir dos pesos reais
function probabilidades(j) {
  const nomes = Object.keys(j.v.TIPOS_DE_POWERUP);
  const pesos = nomes.map((n) => j.f.pesoDoPowerUp(n));
  const total = pesos.reduce((a, b) => a + b, 0);
  return Object.fromEntries(nomes.map((n, i) => [n, pesos[i] / total]));
}

module.exports = { novoJogo, obstaculoNoJogador, itemNoJogador, coletar, frequencias, probabilidades };
