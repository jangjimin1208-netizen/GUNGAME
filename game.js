const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let enemies = [];
let bullets = [];
let items = [];

let score = 0;
let lives = 3;

let gameStarted = false;

let enemySpawnRate = 2000;
let nextAmmoScore = 2000;

const maxBullets = 30;
let bulletCount = 30;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

let keys = {};

// ================= INPUT =================
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// ================= START =================
canvas.addEventListener("click", e => {
  if (!gameStarted) {
    gameStarted = true;
    startSpawning();
    return;
  }

  if (bulletCount <= 0) return;

  const dx = e.clientX - player.x;
  const dy = e.clientY - player.y;
  const angle = Math.atan2(dy, dx);

  bullets.push({
    x: player.x,
    y: player.y,
    dx,
    dy,
    angle
  });

  bulletCount--;
  updateUI();
});

// ================= UI =================
function updateUI() {
  document.getElementById("ui").textContent =
    "점수: " + score +
    " ❤️ " + lives +
    " 🔫 " + bulletCount;
}

// ================= HELPERS =================
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function move(obj, speed = 1.5) {
  const dx = player.x - obj.x;
  const dy = player.y - obj.y;
  const d = Math.hypot(dx, dy);

  obj.x += (dx / d) * speed;
  obj.y += (dy / d) * speed;
}

function randomEdge() {
  let x, y;
  const side = Math.floor(Math.random() * 4);

  if (side === 0) { x = Math.random() * canvas.width; y = 0; }
  else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height; }
  else if (side === 2) { x = 0; y = Math.random() * canvas.height; }
  else { x = canvas.width; y = Math.random() * canvas.height; }

  return { x, y, size: 20, speed: 1.5 };
}

function spawnItemNearPlayer() {
  const angle = Math.random() * Math.PI * 2;
  const distance = 150 + Math.random() * 100;

  const x = player.x + Math.cos(angle) * distance;
  const y = player.y + Math.sin(angle) * distance;

  return {
    x: Math.max(0, Math.min(canvas.width, x)),
    y: Math.max(0, Math.min(canvas.height, y)),
    type: "ammo"
  };
}

// ================= SPAWN =================
function startSpawning() {
  setInterval(() => {
    enemies.push(randomEdge());
  }, enemySpawnRate);
}

// ================= UPDATE =================
function update() {
  if (!gameStarted) return;

  const speed = 4;

  if (keys["w"] || keys["arrowup"]) player.y -= speed;
  if (keys["s"] || keys["arrowdown"]) player.y += speed;
  if (keys["a"] || keys["arrowleft"]) player.x -= speed;
  if (keys["d"] || keys["arrowright"]) player.x += speed;

  player.x = Math.max(0, Math.min(canvas.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height, player.y));

  bullets.forEach(b => {
    b.x += b.dx * 0.05;
    b.y += b.dy * 0.05;
  });

  enemies.forEach(e => move(e, e.speed));

  enemies = enemies.filter(e => {
    if (dist(e, player) < 20) {
      lives--;
      updateUI();
      if (lives <= 0) {
        alert("게임 오버!");
        location.reload();
      }
      return false;
    }
    return true;
  });

  enemies = enemies.filter(enemy => {
    for (let i = 0; i < bullets.length; i++) {
      if (dist(enemy, bullets[i]) < enemy.size) {
        bullets.splice(i, 1);
        score += 100;
        updateUI();
        return false;
      }
    }
    return true;
  });

  if (score >= nextAmmoScore) {
    items.push(spawnItemNearPlayer());
    nextAmmoScore += 2000;
  }

  items = items.filter(item => {
    for (let i = 0; i < bullets.length; i++) {
      if (dist(item, bullets[i]) < 15) {
        bullets.splice(i, 1);

        if (item.type === "ammo") {
          bulletCount = maxBullets;
        }

        updateUI();
        return false;
      }
    }
    return true;
  });
}

// ================= DRAW =================
function drawPerson(x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(x, y - 20, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x, y + 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 10, y - 5);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 10, y - 5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x - 8, y + 20);
  ctx.lineTo(x + 8, y + 20);
  ctx.stroke();
}

// 🔥 현실적인 총알
function drawBullet(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);

  // 탄환 몸체 (금속 느낌)
  ctx.fillStyle = "#c0c0c0";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 탄두
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.arc(8, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawAmmo(x, y) {
  ctx.fillStyle = "cyan";
  ctx.fillRect(x - 6, y - 3, 12, 6);
}

// ================= DRAW LOOP =================
function draw() {
  if (!gameStarted) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPerson(player.x, player.y, "blue");

  bullets.forEach(b => drawBullet(b));

  enemies.forEach(e => drawPerson(e.x, e.y, "red"));

  items.forEach(item => {
    if (item.type === "ammo") drawAmmo(item.x, item.y);
  });
}

// ================= LOOP =================
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

updateUI();
gameLoop();
