const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

const CELL = 12;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;

const COLOR_BG    = '#9bbc0f';
const COLOR_GRID  = '#8bac0f';
const COLOR_SNAKE = '#0f380f';
const COLOR_HEAD  = '#1a5c1a';
const COLOR_FOOD  = '#306230';

let snake, dir, nextDir, food, score, best, running, paused, loop;

best = parseInt(localStorage.getItem('snake_best') || '0');
bestEl.textContent = best;

function init() {
  snake = [
    { x: 7, y: 10 },
    { x: 6, y: 10 },
    { x: 5, y: 10 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = 0;
  spawnFood();
  running = true;
  paused = false;
  overlay.style.display = 'none';
  clearInterval(loop);
  loop = setInterval(tick, 130);
}

function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function tick() {
  if (!running || paused) return;

  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return gameOver();
  }

  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem('snake_best', best);
    }
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLOR_GRID;
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }

  ctx.fillStyle = COLOR_FOOD;
  const fx = food.x * CELL + 2;
  const fy = food.y * CELL + 2;
  ctx.fillRect(fx, fy, CELL - 4, CELL - 4);
  ctx.fillStyle = '#8bbc4f';
  ctx.fillRect(fx + 2, fy + 1, 2, 2);

  for (let i = snake.length - 1; i >= 0; i--) {
    const s = snake[i];
    ctx.fillStyle = i === 0 ? COLOR_HEAD : COLOR_SNAKE;
    ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);

    if (i === 0) {
      ctx.fillStyle = COLOR_BG;
      if (dir.x === 1)       { ctx.fillRect(s.x*CELL+8, s.y*CELL+2, 2, 2); ctx.fillRect(s.x*CELL+8, s.y*CELL+8, 2, 2); }
      else if (dir.x === -1) { ctx.fillRect(s.x*CELL+2, s.y*CELL+2, 2, 2); ctx.fillRect(s.x*CELL+2, s.y*CELL+8, 2, 2); }
      else if (dir.y === -1) { ctx.fillRect(s.x*CELL+2, s.y*CELL+2, 2, 2); ctx.fillRect(s.x*CELL+8, s.y*CELL+2, 2, 2); }
      else                   { ctx.fillRect(s.x*CELL+2, s.y*CELL+8, 2, 2); ctx.fillRect(s.x*CELL+8, s.y*CELL+8, 2, 2); }
    }
  }
}

function gameOver() {
  running = false;
  clearInterval(loop);
  draw();

  let flashes = 0;
  const fl = setInterval(() => {
    ctx.fillStyle = flashes % 2 === 0 ? '#0f380f' : COLOR_BG;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    if (++flashes >= 6) {
      clearInterval(fl);
      showGameOver();
    }
  }, 100);
}

function showGameOver() {
  overlay.style.display = 'flex';
  overlayText.innerHTML = `
    <h2>GAME OVER</h2>
    Pontos: <strong>${score}</strong><br>
    Pressione <strong>ENTER</strong> ou <strong>OK</strong> para jogar novamente
  `;
}

function setDir(dx, dy) {
  if (!running) return;
  if (dx !== 0 && dir.x === -dx) return;
  if (dy !== 0 && dir.y === -dy) return;
  nextDir = { x: dx, y: dy };
}

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    e.preventDefault(); setDir(0, -1); break;
    case 'ArrowDown':  e.preventDefault(); setDir(0,  1); break;
    case 'ArrowLeft':  e.preventDefault(); setDir(-1, 0); break;
    case 'ArrowRight': e.preventDefault(); setDir( 1, 0); break;
    case 'Enter':
      if (!running) init();
      else paused = !paused;
      break;
    case ' ':
      if (!running) init();
      break;
  }
});

document.getElementById('btnUp').addEventListener('pointerdown',    e => { e.preventDefault(); setDir(0, -1); });
document.getElementById('btnDown').addEventListener('pointerdown',  e => { e.preventDefault(); setDir(0,  1); });
document.getElementById('btnLeft').addEventListener('pointerdown',  e => { e.preventDefault(); setDir(-1, 0); });
document.getElementById('btnRight').addEventListener('pointerdown', e => { e.preventDefault(); setDir( 1, 0); });
document.getElementById('btnCenter').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!running) init();
  else paused = !paused;
});

ctx.fillStyle = COLOR_BG;
ctx.fillRect(0, 0, canvas.width, canvas.height);

// --- Responsive scaling ---
let resizeTimer;

function scalePhone() {
  const phone = document.querySelector('.phone');
  phone.style.transform = '';
  const w = phone.offsetWidth;
  const h = phone.offsetHeight;
  const margin = 16;
  const scale = Math.min(
    (window.innerWidth  - margin) / w,
    (window.innerHeight - margin) / h,
    1
  );
  if (scale < 1) phone.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(scalePhone, 80);
});

scalePhone();

// --- Touch swipe on canvas ---
let touchStart = null;

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: false });

canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (Math.max(absDx, absDy) < 15) {
    if (!running) init();
    else paused = !paused;
    return;
  }
  if (absDx > absDy) setDir(dx > 0 ? 1 : -1, 0);
  else               setDir(0, dy > 0 ? 1 : -1);
}, { passive: true });
