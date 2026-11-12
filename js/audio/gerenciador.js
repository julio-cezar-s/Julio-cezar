// js/audio/gerenciador.js - Gerenciador de Efeitos Sonoros (arquivos de áudio)

const gerenciadorAudio = {
    sons: {
        freada: new Audio('audio/freadaCarro.mp3'),
        policia: new Audio('audio/policia.mp3'),
        batida: new Audio('audio/batidaCarro.mp3')
    },

    mudo: false,
    sonsPausados: new Set(),

    obterPreferenciaSom() {
        try {
            const opcoes = JSON.parse(
                localStorage.getItem('retroTurboOptions') || '{}'
            );
            return opcoes.sound !== false;
        } catch (erro) {
            return true;
        }
    },

    inicializar() {
        this.sons.freada.volume = 0.5;
        this.sons.policia.volume = 0.4;
        this.sons.batida.volume = 0.7;

        this.mudo = !this.obterPreferenciaSom();
    },

    ativarMudo(ativar) {
        this.mudo = ativar;

        if (ativar) {
            Object.values(this.sons).forEach(som => {
                som.pause();
                som.currentTime = 0;
            });

            this.sonsPausados.clear();
        }
    },

    tocar(nomeSom, loop = false) {
        if (this.mudo || !this.obterPreferenciaSom()) return;

        const som = this.sons[nomeSom];

        if (!som) return;

        som.loop = loop;
        som.currentTime = 0;

        som.play().catch(erro => {
            console.log('Áudio aguardando interação do usuário:', erro);
        });
    },

    parar(nomeSom) {
        const som = this.sons[nomeSom];

        if (som) {
            som.pause();
            som.currentTime = 0;
            this.sonsPausados.delete(som);
        }
    },

    estaTocando(nomeSom) {
        const som = this.sons[nomeSom];
        return !!som && !som.paused && !som.ended;
    },

    pararTudo() {
        Object.values(this.sons).forEach(som => {
            som.pause();
            som.currentTime = 0;
        });

        this.sonsPausados.clear();
    },

    pausarTudo() {
        this.sonsPausados.clear();

        Object.values(this.sons).forEach(som => {
            if (!som.paused && !som.ended) {
                this.sonsPausados.add(som);
                som.pause();
            }
        });
    },

    retomarTudo() {
        if (this.mudo || !this.obterPreferenciaSom()) {
            this.sonsPausados.clear();
            return;
        }

        this.sonsPausados.forEach(som => {
            som.play().catch(erro => {
                console.log('Não foi possível retomar o áudio:', erro);
            });
        });

        this.sonsPausados.clear();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    gerenciadorAudio.inicializar();
});

// Sirene da viatura: só inicia se ainda não estiver tocando
function playPoliceSiren() {
    if (gerenciadorAudio.estaTocando('policia')) return;
    if (gerenciadorAudio.sonsPausados.size > 0) return;
    gerenciadorAudio.tocar('policia', true);
}

function stopPoliceSiren() {
    gerenciadorAudio.parar('policia');
}
