/* js/idiomas/textos/pt.js
   Português do Brasil — idioma PADRÃO e idioma reserva: toda chave nova deve
   nascer aqui. Os outros idiomas têm as mesmas chaves (os testes conferem).

   Marcas como {n} ou {nome} são preenchidas pelo jogo. Um texto que depende de
   quantidade usa { one: "...", other: "..." }.
*/

registrarIdioma({
  codigo: "pt",
  nome: "Português",
  locale: "pt-BR",
  htmlLang: "pt-BR",

  // Unidades mostradas ao jogador (a física continua em km/h e km)
  unidades: {
    velocidade: { fator: 1, rotulo: "KM/H", mostrador: { maximo: 540, passoMenor: 20, passoMaior: 100 } },
    distancia: { fator: 1, rotulo: "KM" },
  },

  textos: {
    comum: {
      voltar: "VOLTAR",
    },

    carregamento: {
      aviso: "CARREGANDO...",
      falha: "Falha ao carregar — veja o aviso no topo",
    },

    menu: {
      subtitulo: "Prepare-se para acelerar!",
      jogar: "JOGAR",
      recordes: "RECORDES",
      opcoes: "OPÇÕES",
      versao: "versão {versao}",
    },

    idioma: {
      rotulo: "IDIOMA",
    },

    // Palavras que aparecem em mais de um lugar
    termos: {
      turbo: "TURBO",
      turboVazio: "VAZIO",
    },

    hud: {
      pontos: "PONTOS",
      velocidade: "VELOCIDADE",
      distancia: "DISTÂNCIA",
      nivel: "NÍVEL {n}",
      combo: "COMBO",
      comboMaximo: "MÁXIMO",
      sequencia: "SEQUÊNCIA x{n}",
    },

    acessibilidade: {
      pausar: "Pausar jogo",
      telaCheia: "Tela cheia",
      sairDaTelaCheia: "Sair da tela cheia",
      esquerda: "Virar para esquerda",
      direita: "Virar para direita",
      turbo: "Ativar turbo",
      idioma: "Idioma",
    },

    pausa: {
      titulo: "JOGO PAUSADO",
      continuar: "CONTINUAR",
      sair: "SAIR",
    },

    opcoes: {
      somLigado: "SOM: LIGADO",
      somDesligado: "SOM: DESLIGADO",
      particulasLigadas: "PARTÍCULAS: LIGADAS",
      particulasDesligadas: "PARTÍCULAS: DESLIGADAS",
      telaCheiaLigada: "TELA CHEIA: LIGADA",
      telaCheiaDesligada: "TELA CHEIA: DESLIGADA",
    },

    fimDeJogo: {
      titulo: "FIM DE JOGO",
      pontuacao: "Pontuação:",
      jogarNovamente: "JOGAR NOVAMENTE",
      menuPrincipal: "MENU PRINCIPAL",
    },

    recordes: {
      vazio: "Nenhum recorde ainda. Complete uma corrida!",
    },

    girar: {
      titulo: "GIRE O APARELHO",
      texto: "O Retro Turbo Racer é jogado com o celular na horizontal.",
    },

    powerup: {
      nitro: "NITRO +{energia}",
      escudo: "ESCUDO!",
      lentidao: "CÂMERA LENTA",
      dobro: "PONTOS x2",
    },

    quase: {
      nivel: {
        RENTE: "RENTE",
        PERTO: "PERTO",
        QUASE: "QUASE",
      },
      aviso: "{nome}!",
    },

    combo: {
      subiu: "COMBO x{n}!",
      perdido: "COMBO PERDIDO",
      caiu: "COMBO CAIU p/ x{n}",
    },

    // Linhas do resumo na tela de fim de jogo
    resumo: {
      combo: "Maior combo: x{melhor} · Desvios: {desvios} (+{pontos} pts)",
      powerups: "Power-ups coletados: {coletados}{salvou}",
      escudoSalvou: " · Escudo salvou {n}x",
      quase: "Quase-colisões: {total} (+{pontos} pts) · Melhor sequência: x{sequencia}",
    },

    // Textos desenhados no mundo do jogo (placas, outdoors, caminhão)
    cenario: {
      cargaLarga: "CARGA LARGA",
      outdoors: ["TURBO", "NITRO", "RETRO", "FUEL"],
      portico: ["TURBO", "RETRO"],
      limites: ["60", "80", "100", "120"],
    },

    // Faixa de erro (também existe uma cópia de emergência em inicio/diagnostico.js)
    erro: {
      carregarArquivo: "Não foi possível carregar um arquivo do jogo",
      generico: "Erro no jogo",
      preparar: "Não foi possível preparar o jogo",
      iniciarPartida: "Não foi possível iniciar a partida",
      recarregar: "Recarregar",
      fechar: "Fechar",
      dica: "Se o erro persistir, recarregue ignorando o cache (Ctrl+F5) e confira se todos os arquivos da pasta foram copiados.",
    },

    formato: {
      ordinal: "{n}º",
    },
  },
});
