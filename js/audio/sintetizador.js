/* js/audio/sintetizador.js
   Sons SINTETIZADOS com Web Audio: não precisam de arquivo e servem aos
   avisos curtos do jogo (quase-colisão, combo). Os efeitos em arquivo
   (batida, freada, sirene) continuam em audio/gerenciador.js.

   Respeita a opção de som do jogo.
*/

let contextoDeAudio = null;

function somLigado() {
  if (typeof gerenciadorAudio === "undefined") return true;

  return !gerenciadorAudio.mudo && gerenciadorAudio.obterPreferenciaSom();
}

// Cria (uma vez) e devolve o contexto de áudio; null se não houver suporte
function obterContextoDeAudio() {
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;

  contextoDeAudio = contextoDeAudio || new Contexto();

  if (contextoDeAudio.state === "suspended") contextoDeAudio.resume();

  return contextoDeAudio;
}

// Chamado dentro de um clique/toque (ex.: JOGAR): navegadores de celular só
// deixam o áudio sintetizado tocar depois de um gesto. Respeita a opção de som.
function liberarAudioSintetizado() {
  if (!somLigado()) return;

  try {
    obterContextoDeAudio();
  } catch (erro) {
    // Áudio indisponível: o jogo segue normalmente
  }
}

// Nota simples. atraso e duracao em segundos; freqFinal faz a nota deslizar.
function tocarNota({ freq, atraso = 0, duracao = 0.3, tipo = "triangle", volume = 0.14, freqFinal = null }) {
  if (!somLigado()) return;

  try {
    const ac = obterContextoDeAudio();
    if (!ac) return;

    const inicio = ac.currentTime + atraso;

    const osc = ac.createOscillator();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, inicio);
    if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, inicio + duracao);

    const ganho = ac.createGain();
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.03);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);

    osc.connect(ganho).connect(ac.destination);
    osc.start(inicio);
    osc.stop(inicio + duracao + 0.02);
  } catch (erro) {
    // Áudio indisponível: o jogo segue normalmente
  }
}

// Ruído filtrado varrendo de uma frequência a outra (vento, "whoosh")
function tocarRuidoVarrido({ de, ate, duracao = 0.28, volume = 0.16, q = 1.4 }) {
  if (!somLigado()) return;

  try {
    const ac = obterContextoDeAudio();
    if (!ac) return;

    const agora = ac.currentTime;
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duracao), ac.sampleRate);
    const dados = buffer.getChannelData(0);

    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

    const ruido = ac.createBufferSource();
    ruido.buffer = buffer;

    const filtro = ac.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.Q.value = q;
    filtro.frequency.setValueAtTime(de, agora);
    filtro.frequency.exponentialRampToValueAtTime(ate, agora + duracao);

    const ganho = ac.createGain();
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.exponentialRampToValueAtTime(volume, agora + duracao * 0.22);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);

    ruido.connect(filtro).connect(ganho).connect(ac.destination);
    ruido.start(agora);
  } catch (erro) {
    // Áudio indisponível: o jogo segue normalmente
  }
}
