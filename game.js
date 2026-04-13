const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let enemies = [];
let allies = [];
let bullets = [];
let items = [];

let score = 0;
let lives = 3;
let doubleScore = false;
let gameStarted = false;

let enemySpawnRate = 2000;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

// 📜 시작 화면
function drawStartScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "40px Arial";
  ctx.fillText("🔫 슈팅 게임", canvas.width / 2, canvas.height / 2 - 100);

  ctx.font = "18px Arial";
  ctx.fillText("🔴 적 = +점수 / 닿으면 -생명", canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillText("⚪ 아군 = 쏘면 -100점", canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText("💖 하트 = 쏴서 맞추면 생명 +1", canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("⭐ 별 = 쏴서 맞추면 10초 점수 2배", canvas.width / 2, canvas.height / 2 + 50);

  ctx.fillText("클릭하면 시작!", canvas.width / 2, canvas.height / 2 + 120);
}

// 시작
canvas.addEventListener("click", (e) => {
  if (!gameStarted) {
    gameStarted = true;
    startSpawning();
    return;
  }

  const dx = e.clientX - player.x;
  const dy = e.clientY - player.y;

  bullets.push({ x: player.x, y: player.y, dx, dy });
});

// UI
function updateUI() {
  document.getElementById("score").textContent =
    "점수: " + score + " ❤️ " + lives;
}

// 적 생성
function randomEdge() {
  let x, y;
  const side = Math.floor(Math.random() * 4);

  if (side === 0) { x = Math.random() * canvas.width; y = 0; }
  else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height; }
  else if (side === 2) { x = 0; y = Math.random() * canvas.height; }
  else { x = canvas.width; y = Math.random() * canvas.height; }

  return { x, y, size: 20, speed: 1.5 };
}

// 거리
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// 이동
function move(obj, speed = 1.5) {
  const dx = player.x - obj.x;
  const dy = player.y - obj.y;
  const d = Math.hypot(dx, dy);

  obj.x += (dx / d) * speed;
  obj.y += (dy / d) * speed;
}

// 스폰
function startSpawning() {
  setInterval(() => enemies.push(randomEdge()), enemySpawnRate);
  setInterval(() => allies.push(randomEdge()), 3000);

  setInterval(() => {
    const type = Math.random() < 0.5 ? "heart" : "star";
    items.push({ ...randomEdge(), type });
  }, 4000);

  setInterval(() => {
    if (enemySpawnRate > 500) enemySpawnRate -= 200;
  }, 5000);
}

// 업데이트
function update() {
  if (!gameStarted) return;

  bullets.forEach(b => {
    b.x += b.dx * 0.05;
    b.y += b.dy * 0.05;
  });

  enemies.forEach(e => move(e, e.speed));
  allies.forEach(a => move(a, a.speed));

  // 🔴 적 닿으면 -1
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

  // ⚪ 아군 닿으면 삭제
  allies = allies.filter(a => dist(a, player) > 20);

  // 💥 총알 충돌 (적 / 아군 / 아이템 분리 처리)

  // 🔴 적
  enemies = enemies.filter(enemy => {
    for (let i = 0; i < bullets.length; i++) {
      if (dist(enemy, bullets[i]) < enemy.size) {
        score += doubleScore ? 200 : 100;
        bullets.splice(i, 1);
        updateUI();
        return false;
      }
    }
    return true;
  });

  // ⚪ 아군
  allies = allies.filter(ally => {
    for (let i = 0; i < bullets.length; i++) {
      if (dist(ally, bullets[i]) < ally.size) {
        score -= 100;
        bullets.splice(i, 1);
        updateUI();
        return false;
      }
    }
    return true;
  });

  // 💖⭐ 아이템 (핵심 수정!)
  items = items.filter(item => {
    for (let i = 0; i < bullets.length; i++) {
      if (dist(item, bullets[i]) < 15) {
        bullets.splice(i, 1);

        if (item.type === "heart") {
          lives++;
        }

        if (item.type === "star") {
          doubleScore = true;
          setTimeout(() => doubleScore = false, 10000);
        }

        updateUI();
        return false;
      }
    }
    return true;
  });
}

// 그리기
function draw() {
  if (!gameStarted) {
    drawStartScreen();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPerson(player.x, player.y, "blue");

  bullets.forEach(b => {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  enemies.forEach(e => drawPerson(e.x, e.y, "red"));
  allies.forEach(a => drawPerson(a.x, a.y, "white"));

  items.forEach(item => {
    if (item.type === "heart") drawHeart(item.x, item.y);
    else drawStar(item.x, item.y);
  });
}

// 사람
function drawPerson(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5, y - 10, 10, 20);
}

// 하트
function drawHeart(x, y) {
  ctx.fillStyle = "pink";
  ctx.beginPath();
  ctx.arc(x - 5, y, 5, 0, Math.PI, true);
  ctx.arc(x + 5, y, 5, 0, Math.PI, true);
  ctx.fill();
}

// 별
function drawStar(x, y) {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

// 루프
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

updateUI();
gameLoop();
