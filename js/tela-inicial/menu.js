
 // js/tela-inicial/menu.js
// Gerenciamento do botão de início do jogo.
//
// O evento do botão playBtn é controlado exclusivamente
// por js/ecras/eventos.js para evitar inicialização duplicada
// do loop de animação.

document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const playBtn = document.getElementById('playBtn');

    if (!playBtn) {
        console.warn('Botão playBtn não encontrado.');
        return;
    }

    // Não adiciona outro evento de clique.
    // O início da partida é responsabilidade de eventos.js.
    console.log('Menu inicial carregado com sucesso.');
});

