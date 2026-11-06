const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const speedometerElement = document.getElementById('speedometer');
const turboBar = document.getElementById('turbo-bar');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// Botões Touch
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const turboBtn = document.getElementById('turboBtn');

// Estado do Jogo
let score = 0;
let baseSpeed = 5;
let gameSpeed = 5;
let isTurboActive = false;
let turboEnergy = 100;
let isGameOver = false;
let roadOffset = 0;

const keys = { Left: false, Right: false, Up: false, Down: false };

// Jogador
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 110,
    width: 40,
    height: 70,
    speedX: 6,
    speedY: 4
};

// Partículas de Fumaça/Fogo
let particles = [];

// Tipos de Veículos de Obstáculos
const vehicleTypes = [
    { type: 'car', width: 40, height: 70, color: '#ff3366', speedMult: 0.8 },
    { type: 'car', width: 40, height: 70, color: '#ffcc00', speedMult: 1.0 },
    { type: 'truck', width: 46, height: 100, color: '#9933ff', speedMult: 0.6 },
    { type: 'police', width: 40, height: 70, color: '#1a1a1a', speedMult: 1.2 }
];

let obstacles = [];
let spawnTimer = 0;

// Configuração de Eventos de Entrada
function bindInput(element, actionSetter) {
    element.addEventListener('mousedown', () => actionSetter(true));
    element.addEventListener('mouseup', () => actionSetter(false));
    element.addEventListener('mouseleave', () => actionSetter(false));
    element.addEventListener('touchstart', (e) => { e.preventDefault(); actionSetter(true); });
    element.addEventListener('touchend', (e) => { e.preventDefault(); actionSetter(false); });
}

bindInput(btnLeft, (val) => keys.Left = val);
bindInput(btnRight, (val) => keys.Right = val);
bindInput(turboBtn, setTurbo);

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.Left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.Right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.Up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.Down = true;
    if (e.code === 'Space') setTurbo(true);
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.Left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.Right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.Up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.Down = false;
    if (e.code === 'Space') setTurbo(false);
});

restartBtn.addEventListener('click', resetGame);

function setTurbo(active) {
    if (active && turboEnergy > 10) {
        isTurboActive = true;
    } else {
        isTurboActive = false;
    }
}

function spawnObstacle() {
    const laneWidth = (canvas.width - 60) / 3;
    const lane = Math.floor(Math.random() * 3);
    const template = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const x = 30 + lane * laneWidth + (laneWidth - template.width) / 2;

    obstacles.push({
        x: x,
        y: -110,
        width: template.width,
        height: template.height,
        color: template.color,
        type: template.type,
        speedMult: template.speedMult
    });
}

function addParticle(x, y, isTurbo) {
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: isTurbo ? Math.random() * 4 + 4 : Math.random() * 2 + 1,
        radius: isTurbo ? Math.random() * 5 + 3 : Math.random() * 3 + 1,
        color: isTurbo ? (Math.random() > 0.5 ? '#ff5500' : '#ffff00') : '#555555',
        life: 1
    });
}

function update() {
    if (isGameOver) return;

    // Gerenciamento do Turbo
    if (isTurboActive && turboEnergy > 0) {
        gameSpeed = baseSpeed * 2.2;
        turboEnergy -= 0.8;
        addParticle(player.x + 10, player.y + player.height, true);
        addParticle(player.x + player.width - 10, player.y + player.height, true);
        if (turboEnergy <= 0) isTurboActive = false;
    } else {
        gameSpeed = baseSpeed;
        if (turboEnergy < 100) turboEnergy += 0.25; // Recarrega aos poucos
    }
    turboBar.style.width = `${Math.max(0, turboEnergy)}%`;

    // Movimentação
    if (keys.Left && player.x > 35) player.x -= player.speedX;
    if (keys.Right && player.x < canvas.width - 35 - player.width) player.x += player.speedX;
    if (keys.Up && player.y > 60) player.y -= player.speedY;
    if (keys.Down && player.y < canvas.height - player.height - 15) player.y += player.speedY;

    // Efeito de fumaça padrão do escape
    if (Math.random() > 0.4) {
        addParticle(player.x + player.width / 2, player.y + player.height, false);
    }

    // Movimento da Pista
    roadOffset += gameSpeed;
    if (roadOffset >= 40) roadOffset = 0;

    // Inserção de Obstáculos
    spawnTimer += isTurboActive ? 1.6 : 1;
    if (spawnTimer > 55) {
        spawnObstacle();
        spawnTimer = 0;
    }

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Lógica dos Obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += gameSpeed * obs.speedMult;

        // Detecção de Colisão
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            endGame();
            return;
        }

        // Pontuação e Remoção
        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
            score += isTurboActive ? 30 : 10;
            scoreElement.innerText = String(score).padStart(5, '0');
            baseSpeed += 0.04;
        }
    }

    // Atualiza HUD do Velocímetro
    speedometerElement.innerHTML = `${Math.floor(gameSpeed * 24)} <small>KM/H</small>`;
}

/* --- DESENHO GRÁFICO (CANVAS) --- */
function drawTrack() {
    // Grama / Laterais de Synthwave
    ctx.fillStyle = '#0f0f1b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Zebrada Lateral (Guia)
    const stripeHeight = 20;
    for (let y = -40 + (roadOffset % 40); y < canvas.height; y += stripeHeight * 2) {
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(24, y, 6, stripeHeight);
        ctx.fillRect(canvas.width - 30, y, 6, stripeHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(24, y + stripeHeight, 6, stripeHeight);
        ctx.fillRect(canvas.width - 30, y + stripeHeight, 6, stripeHeight);
    }

    // Asfalto
    ctx.fillStyle = '#181824';
    ctx.fillRect(30, 0, canvas.width - 60, canvas.height);

    // Linhas Tracejadas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadOffset;

    const laneWidth = (canvas.width - 60) / 3;
    ctx.beginPath();
    ctx.moveTo(30 + laneWidth, 0);
    ctx.lineTo(30 + laneWidth, canvas.height);
    ctx.moveTo(30 + laneWidth * 2, 0);
    ctx.lineTo(30 + laneWidth * 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPlayer() {
    // Sombra do Veículo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(player.x + 4, player.y + 6, player.width, player.height);

    // Corpo Principal (Estilo Esportivo)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 8);
    ctx.fill();

    // Detalhes / Listras de Corrida
    ctx.fillStyle = '#111';
    ctx.fillRect(player.x + 14, player.y, 12, player.height);

    // Parabrisa e Vidros
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(player.x + 6, player.y + 18, player.width - 12, 16);

    // Faróis Dianteiros Neon
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.fillRect(player.x + 4, player.y + 2, 8, 4);
    ctx.fillRect(player.x + player.width - 12, player.y + 2, 8, 4);

    // Luzes Traseiras de Freio
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.fillRect(player.x + 4, player.y + player.height - 4, 8, 4);
    ctx.fillRect(player.x + player.width - 12, player.y + player.height - 4, 8, 4);

    ctx.shadowBlur = 0; // Reseta sombra
}

function drawObstacle(obs) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(obs.x + 4, obs.y + 4, obs.width, obs.height);

    // Corpo
    ctx.fillStyle = obs.color;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
    ctx.fill();

    // Vidro
    ctx.fillStyle = '#000000';
    ctx.fillRect(obs.x + 5, obs.y + obs.height - 28, obs.width - 10, 12);

    // Giroflex para Carro de Polícia
    if (obs.type === 'police') {
        const flash = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.fillStyle = flash ? '#ff0000' : '#0055ff';
        ctx.fillRect(obs.x + obs.width / 2 - 8, obs.y + 30, 16, 5);
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack();
    drawParticles();
    drawPlayer();
    obstacles.forEach(drawObstacle);
}

function loop() {
    update();
    draw();
    if (!isGameOver) requestAnimationFrame(loop);
}

function endGame() {
    isGameOver = true;
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    score = 0;
    baseSpeed = 5;
    gameSpeed = 5;
    turboEnergy = 100;
    isTurboActive = false;
    isGameOver = false;
    obstacles = [];
    particles = [];
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 110;
    scoreElement.innerText = '00000';
    gameOverScreen.classList.add('hidden');
    loop();
}

loop();