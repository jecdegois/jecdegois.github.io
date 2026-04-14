// ── CONFIG ──
const GOAL = 10;
const FALL_INTERVAL = 850;
const ITEMS = ['💕','💖','💗','💓','🌸','✨','💝','🌷','💞','🥰','⭐','🎀'];
const MESSAGES = [
  '¡Te amo!',
  'Eres mi todo 🌸',
  '¡Mi favorita!',
  'Te adoro 💕',
  'Eres hermosa',
  'Mi corazón ❤️',
  'Siempre tú 💖',
  'Mi persona 🥰',
  '¡Eres perfecta!',
  'Te quiero mucho',
];

// Colores para las personas en las gradas
const CROWD_COLORS = [
  '#e91e8c','#9c27b0','#3f51b5','#2196f3','#ff5722',
  '#4caf50','#ff9800','#f44336','#00bcd4','#8bc34a',
];

// ── STATE ──
let score = 0;
let gameRunning = false;
let fallInterval = null;
let basketX = 50;
let msgTimeout = null;
let fallingItems = [];
let lastTouchX = null;

// ── ELEMENTS ──
const screenIntro = document.getElementById('screen-intro');
const screenGame  = document.getElementById('screen-game');
const screenEnd   = document.getElementById('screen-end');
const basket      = document.getElementById('basket');
const gameArea    = document.getElementById('game-area');
const scoreEl     = document.getElementById('score');
const msgPopup    = document.getElementById('message-popup');
const btnPlay     = document.getElementById('btn-play');
const btnReplay   = document.getElementById('btn-replay');
const confettiCanvas = document.getElementById('confetti-canvas');

// ── GENERATE CROWD ──
function generateCrowd(containerId, rows, personsPerRow) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div');
    row.className = containerId === 'intro-stands' ? 'stands-row' : 'bg-stands-row';
    for (let p = 0; p < personsPerRow; p++) {
      const person = document.createElement('div');
      person.className = containerId === 'intro-stands' ? 'stand-person' : 'bg-person';
      person.style.background = CROWD_COLORS[Math.floor(Math.random() * CROWD_COLORS.length)];
      row.appendChild(person);
    }
    container.appendChild(row);
  }
}

generateCrowd('intro-stands', 5, 60);
generateCrowd('game-stands',  4, 80);

// ── SCREEN TRANSITIONS ──
function showScreen(screen) {
  [screenIntro, screenGame, screenEnd].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ── BASKET MOVEMENT ──
function moveBasket(clientX) {
  const rect = gameArea.getBoundingClientRect();
  const x = clientX - rect.left;
  basketX = Math.min(Math.max((x / rect.width) * 100, 5), 95);
  basket.style.left = basketX + '%';
  basket.classList.add('walking');
}

gameArea.addEventListener('touchmove', (e) => {
  e.preventDefault();
  moveBasket(e.touches[0].clientX);
}, { passive: false });

gameArea.addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveBasket(e.touches[0].clientX);
}, { passive: false });

gameArea.addEventListener('touchend', () => {
  basket.classList.remove('walking');
});

// Desktop fallback (mouse)
gameArea.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  moveBasket(e.clientX);
});

// ── SPAWN FALLING ITEM ──
function spawnItem() {
  if (!gameRunning) return;

  const item = document.createElement('div');
  item.classList.add('falling-item');
  item.textContent = ITEMS[Math.floor(Math.random() * ITEMS.length)];

  const leftPct  = 5 + Math.random() * 88;
  const duration = 2.0 + Math.random() * 1.8;

  item.style.left = leftPct + '%';
  item.style.top  = '-50px';
  item.style.animationDuration = duration + 's';

  gameArea.appendChild(item);
  fallingItems.push({ el: item, leftPct, startTime: Date.now(), duration: duration * 1000 });

  item.addEventListener('animationend', () => {
    item.remove();
    fallingItems = fallingItems.filter(f => f.el !== item);
  });
}

// ── COLLISION DETECTION ──
function checkCollisions() {
  if (!gameRunning) return;

  const basketRect = basket.getBoundingClientRect();
  const catchZone = {
    left:   basketRect.left   - 12,
    right:  basketRect.right  + 12,
    top:    basketRect.top    - 10,
    bottom: basketRect.bottom + 8,
  };

  // copy array to avoid mutation during iteration
  [...fallingItems].forEach(f => {
    if (!f.el.isConnected) return;
    const itemRect = f.el.getBoundingClientRect();
    const cx = itemRect.left + itemRect.width  / 2;
    const cy = itemRect.top  + itemRect.height / 2;

    if (cx > catchZone.left && cx < catchZone.right &&
        cy > catchZone.top  && cy < catchZone.bottom) {
      catchItem(f);
    }
  });

  requestAnimationFrame(checkCollisions);
}

function catchItem(f) {
  if (!f.el.isConnected) return;
  f.el.remove();
  fallingItems = fallingItems.filter(item => item !== f);

  score++;
  scoreEl.textContent = score;

  showMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  if (score >= GOAL) {
    endGame();
  }
}

// ── MESSAGE POPUP ──
function showMessage(text) {
  msgPopup.textContent = text;
  msgPopup.classList.add('show');
  clearTimeout(msgTimeout);
  msgTimeout = setTimeout(() => msgPopup.classList.remove('show'), 1300);
}

// ── START GAME ──
function startGame() {
  score = 0;
  scoreEl.textContent = 0;
  basketX = 50;
  basket.style.left = '50%';
  gameRunning = true;
  fallingItems = [];

  document.querySelectorAll('.falling-item').forEach(el => el.remove());

  showScreen(screenGame);

  fallInterval = setInterval(spawnItem, FALL_INTERVAL);
  requestAnimationFrame(checkCollisions);
}

// ── END GAME ──
function endGame() {
  gameRunning = false;
  clearInterval(fallInterval);
  document.querySelectorAll('.falling-item').forEach(el => el.remove());
  basket.classList.remove('walking');
  showScreen(screenEnd);
  startConfetti();
}

// ── CONFETTI ──
let confettiParticles = [];
let confettiRunning   = false;
let confettiRaf       = null;

function startConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const emojis = ['💕','💖','💗','❤️','🌸','✨'];
  confettiParticles = Array.from({ length: 90 }, () => ({
    x:     Math.random() * confettiCanvas.width,
    y:     Math.random() * -confettiCanvas.height,
    r:     5 + Math.random() * 8,
    color: ['#ff6b9d','#ff9ec4','#ffb3d1','#e91e8c','#f48fb1','#ff4081','#fff'][Math.floor(Math.random()*7)],
    speed: 1.5 + Math.random() * 2.5,
    swing: Math.random() * 2 - 1,
    angle: Math.random() * Math.PI * 2,
    emoji: Math.random() > 0.45 ? emojis[Math.floor(Math.random() * emojis.length)] : null,
  }));

  confettiRunning = true;
  animateConfetti(ctx);
}

function animateConfetti(ctx) {
  if (!confettiRunning) return;
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles.forEach(p => {
    p.y     += p.speed;
    p.x     += Math.sin(p.angle) * p.swing;
    p.angle += 0.03;

    if (p.emoji) {
      ctx.font = (p.r * 2) + 'px serif';
      ctx.fillText(p.emoji, p.x, p.y);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    if (p.y > confettiCanvas.height + 20) {
      p.y = -20;
      p.x = Math.random() * confettiCanvas.width;
    }
  });

  confettiRaf = requestAnimationFrame(() => animateConfetti(ctx));
}

function stopConfetti() {
  confettiRunning = false;
  if (confettiRaf) cancelAnimationFrame(confettiRaf);
  const ctx = confettiCanvas.getContext('2d');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// ── BUTTONS ──
btnPlay.addEventListener('click', startGame);

btnReplay.addEventListener('click', () => {
  stopConfetti();
  showScreen(screenIntro);
});

// ── RESIZE ──
window.addEventListener('resize', () => {
  if (confettiRunning) {
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
});
