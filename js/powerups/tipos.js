/* js/powerups/tipos.js
   CATÁLOGO dos power-ups. É só dados: para criar um novo, descreva-o aqui,
   desenhe o ícone em powerups/desenho/icones.js e trate o efeito em
   powerups/efeitos.js.

   Campos:
     rotulo    chave do texto que aparece na tela ao coletar (em idiomas/textos/)
     cor/cor2  cor principal e cor escura (disco, brilho, HUD)
     icone     nome do ícone em desenho/icones.js
     duracao   quadros de efeito (60 = 1 s); 0 = efeito instantâneo
     peso      chance relativa de ser sorteado
*/

const TIPOS_DE_POWERUP = {
  // Recarrega o turbo na hora
  nitro: {
    rotulo: "powerup.nitro", cor: "#37f2ff", cor2: "#0a8fb5", icone: "raio",
    duracao: 0, peso: 3, energia: 40,
  },

  // Absorve UMA batida (carro, caminhão, moto ou barreira)
  escudo: {
    rotulo: "powerup.escudo", cor: "#5aa8ff", cor2: "#2a4fd0", icone: "escudo",
    duracao: 900, peso: 3,
  },

  // Desacelera o mundo: mais tempo para reagir, o volante continua igual
  lentidao: {
    rotulo: "powerup.lentidao", cor: "#b68cff", cor2: "#6a3fd0", icone: "relogio",
    duracao: 360, peso: 2, fator: 0.6,
  },

  // Dobra TODOS os pontos ganhos (tempo, desvios e quase-colisões)
  dobro: {
    rotulo: "powerup.dobro", cor: "#ffd23f", cor2: "#d98a00", icone: "dobro",
    duracao: 600, peso: 2, multiplicador: 2,
  },
};
