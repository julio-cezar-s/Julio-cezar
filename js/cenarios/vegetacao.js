/* js/cenarios/vegetacao.js
   Árvores, arbustos e flores em vários planos de profundidade.
   A luz vem do sol à direita: o lado direito é claro, o esquerdo escuro.
*/

const TIPO_ARVORE = ["redonda", "conifera", "alta"];

// =====================================================
// COLETA (posições estáveis por distância)
// =====================================================

function coletarVegetacao(lista) {
  // Árvores — três planos: margem, meio e fundo
  percorrerPosicoes(1.7, (k, z) => {
    for (let lado = -1; lado <= 1; lado += 2) {
      const sem = k * 3.17 + lado * 91;

      if (hash01(sem) < 0.28) continue;

      const plano = hash01(sem + 1);
      const afastamento = plano < 0.5
        ? 3 + hash01(sem + 2) * 1.6          // margem
        : plano < 0.85
          ? 5.6 + hash01(sem + 2) * 3.4      // meio
          : 10 + hash01(sem + 2) * 7;        // fundo

      lista.push({
        tipo: "arvore",
        z,
        x: lado * afastamento,
        variante: Math.floor(hash01(sem + 3) * 3),
        tamanho: 0.85 + hash01(sem + 4) * 0.55,
        sem,
      });
    }
  });

  // Arbustos junto à cerca
  percorrerPosicoes(0.95, (k, z) => {
    for (let lado = -1; lado <= 1; lado += 2) {
      const sem = k * 5.71 + lado * 13;

      if (hash01(sem) < 0.55) continue;

      lista.push({
        tipo: "arbusto",
        z,
        x: lado * (2.45 + hash01(sem + 1) * 1.4),
        tamanho: 0.7 + hash01(sem + 2) * 0.7,
        sem,
      });
    }
  }, 26);

  // Canteiros de flores
  percorrerPosicoes(1.9, (k, z) => {
    for (let lado = -1; lado <= 1; lado += 2) {
      const sem = k * 2.39 + lado * 57;

      if (hash01(sem) < 0.6) continue;

      lista.push({
        tipo: "flores",
        z,
        x: lado * (2.5 + hash01(sem + 1) * 2.2),
        cor: ["#ffd23f", "#fff4e0", "#ff7aa8", "#ff5a4a", "#b88cff"][
          Math.floor(hash01(sem + 2) * 5)
        ],
        sem,
      });
    }
  }, 20);
}

// =====================================================
// ÁRVORES
// =====================================================

function desenharArvore(a, s) {
  const bx = projX(a.x, s);
  const by = projY(s);
  const u = projLen(1, s) * a.tamanho;

  if (u < 1.2) return;

  const lado = Math.sign(a.x);
  const tipo = TIPO_ARVORE[a.variante];

  // fora da tela
  const raio = tipo === "redonda" ? 0.95 : 0.7;
  if (bx + raio * u < -20 || bx - raio * u > GAME_WIDTH + 20) return;

  desenharSombraChao(bx, by, u * 0.9, u * 0.16);

  if (tipo === "redonda") desenharArvoreRedonda(bx, by, u, a.sem);
  else if (tipo === "conifera") desenharConifera(bx, by, u);
  else desenharArvoreAlta(bx, by, u, a.sem);
}

function desenharTronco(bx, by, u, altura, largura) {
  const w = largura * u;
  const h = altura * u;

  const g = ctx.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
  g.addColorStop(0, "#3d2615");
  g.addColorStop(0.55, "#6d4426");
  g.addColorStop(1, "#8d5d34");
  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.moveTo(bx - w * 0.5, by);
  ctx.lineTo(bx - w * 0.32, by - h);
  ctx.lineTo(bx + w * 0.32, by - h);
  ctx.lineTo(bx + w * 0.5, by);
  ctx.closePath();
  ctx.fill();
}

function desenharArvoreRedonda(bx, by, u, sem) {
  desenharTronco(bx, by, u, 0.95, 0.2);

  const cx = bx;
  const cy = by - 1.5 * u;
  const R = 0.78 * u;

  const lobos = [
    [0, 0, 1], [-0.62, 0.18, 0.7], [0.6, 0.14, 0.72],
    [-0.28, -0.5, 0.66], [0.32, -0.46, 0.64],
  ];

  // 1) massa escura (sombra da copa)
  ctx.fillStyle = "#17472a";
  lobos.forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(cx + dx * R, cy + dy * R, r * R, 0, Math.PI * 2);
    ctx.fill();
  });

  if (R < 5) return;

  // 2) tom médio deslocado para a luz
  ctx.fillStyle = "#2f7a39";
  lobos.forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(cx + (dx + 0.2) * R, cy + (dy - 0.12) * R, r * R * 0.82, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3) luz do sol
  ctx.fillStyle = "#5fa545";
  lobos.slice(0, 4).forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(cx + (dx + 0.38) * R, cy + (dy - 0.28) * R, r * R * 0.46, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4) pontos de folhas brilhantes
  if (R > 9) {
    ctx.fillStyle = "rgba(200,235,120,0.75)";
    for (let i = 0; i < 7; i++) {
      const ang = hash01(sem + i) * Math.PI * 2;
      const d = hash01(sem + i + 9) * R * 0.7;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * d + R * 0.25, cy + Math.sin(ang) * d * 0.7 - R * 0.2,
        Math.max(1, R * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function desenharConifera(bx, by, u) {
  desenharTronco(bx, by, u, 0.55, 0.16);

  const andares = 4;

  for (let i = 0; i < andares; i++) {
    const t = i / andares;
    const largura = (0.78 - t * 0.5) * u;
    const baseY = by - (0.4 + i * 0.52) * u;
    const altura = 0.9 * u;

    // metade escura (esquerda)
    ctx.fillStyle = i % 2 === 0 ? "#123f2c" : "#17503a";
    ctx.beginPath();
    ctx.moveTo(bx, baseY - altura);
    ctx.lineTo(bx - largura, baseY);
    ctx.lineTo(bx, baseY + altura * 0.08);
    ctx.closePath();
    ctx.fill();

    // metade iluminada (direita)
    ctx.fillStyle = i % 2 === 0 ? "#2a7a4a" : "#34905a";
    ctx.beginPath();
    ctx.moveTo(bx, baseY - altura);
    ctx.lineTo(bx + largura, baseY);
    ctx.lineTo(bx, baseY + altura * 0.08);
    ctx.closePath();
    ctx.fill();
  }
}

function desenharArvoreAlta(bx, by, u, sem) {
  desenharTronco(bx, by, u, 0.7, 0.14);

  const cy = by - 1.95 * u;

  ctx.fillStyle = "#1b4d2c";
  ctx.beginPath();
  ctx.ellipse(bx, cy, 0.4 * u, 1.35 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  if (u < 6) return;

  ctx.fillStyle = "#3b8a3c";
  ctx.beginPath();
  ctx.ellipse(bx + 0.1 * u, cy - 0.05 * u, 0.28 * u, 1.2 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7fbc4d";
  ctx.beginPath();
  ctx.ellipse(bx + 0.18 * u, cy - 0.3 * u, 0.12 * u, 0.75 * u, 0.05, 0, Math.PI * 2);
  ctx.fill();
}

// =====================================================
// ARBUSTOS E FLORES
// =====================================================

function desenharArbusto(a, s) {
  const bx = projX(a.x, s);
  const by = projY(s);
  const u = projLen(1, s) * a.tamanho;

  if (u < 1.5 || bx < -30 || bx > GAME_WIDTH + 30) return;

  desenharSombraChao(bx, by, u * 0.42, u * 0.07, 0.2);

  const partes = [[-0.22, 0.2, 0.26], [0.2, 0.22, 0.27], [0, 0.34, 0.3]];

  ctx.fillStyle = "#1c4f2c";
  partes.forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(bx + dx * u, by - dy * u, r * u, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#3b8a3c";
  partes.forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(bx + (dx + 0.06) * u, by - (dy + 0.04) * u, r * u * 0.78, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#86c456";
  ctx.beginPath();
  ctx.arc(bx + 0.14 * u, by - 0.42 * u, 0.1 * u, 0, Math.PI * 2);
  ctx.fill();
}

function desenharFlores(a, s) {
  const bx = projX(a.x, s);
  const by = projY(s);
  const u = projLen(1, s);

  if (u < 3 || bx < -20 || bx > GAME_WIDTH + 20) return;

  for (let i = 0; i < 6; i++) {
    const dx = (hash01(a.sem + i) - 0.5) * 0.9 * u;
    const dy = (hash01(a.sem + i + 4) - 0.5) * 0.12 * u;

    ctx.strokeStyle = "#2f6f2f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + dx, by + dy);
    ctx.lineTo(bx + dx, by + dy - 0.17 * u);
    ctx.stroke();

    ctx.fillStyle = a.cor;
    ctx.beginPath();
    ctx.arc(bx + dx, by + dy - 0.18 * u, Math.max(0.9, 0.04 * u), 0, Math.PI * 2);
    ctx.fill();
  }
}
