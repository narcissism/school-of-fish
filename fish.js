const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height, dpr;

function resize() {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();
const mouse = {
  x: null,
  y: null,
  radius: 120
};

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});


/* =========================
   BACKGROUND TEXTURE
========================= */

function drawBackground() {
  // Base ocean color
  ctx.fillStyle = "#0a2540";
  ctx.fillRect(0, 0, width, height);

  // Soft noise / light texture
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle depth gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "rgba(255,255,255,0.04)");
  grad.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

/* =========================
   FISH SYSTEM
========================= */

const fishCount = 120;
const fishes = [];

const perceptionRadius = 70;
const separationRadius = 26;

const maxSpeed = 2;
const maxForce = 0.06;

class Fish {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.ax = 0;
    this.ay = 0;
  }

  applyForce(x, y) {
    this.ax += x;
    this.ay += y;
  }

  flock(fishes) {
    let alignX = 0, alignY = 0;
    let cohX = 0, cohY = 0;
    let sepX = 0, sepY = 0;
    let count = 0;

    for (const other of fishes) {
      if (other === this) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < perceptionRadius && dist > 0) {
        alignX += other.vx;
        alignY += other.vy;

        cohX += other.x;
        cohY += other.y;

        if (dist < separationRadius) {
          sepX -= dx / dist;
          sepY -= dy / dist;
        }
        count++;
      }
    }

    if (count > 0) {
      alignX /= count;
      alignY /= count;
      cohX = cohX / count - this.x;
      cohY = cohY / count - this.y;

      this.steer(alignX, alignY, 0.5);
      this.steer(cohX, cohY, 0.05);
      this.steer(sepX, sepY, 1.0);
    }
  }

  steer(x, y, strength) {
    const mag = Math.hypot(x, y);
    if (mag === 0) return;

    x = (x / mag) * maxSpeed - this.vx;
    y = (y / mag) * maxSpeed - this.vy;

    x = Math.max(-maxForce, Math.min(maxForce, x));
    y = Math.max(-maxForce, Math.min(maxForce, y));

    this.applyForce(x * strength, y * strength);
  }

  avoidWalls() {
    const margin = 100;
    const turn = 0.08;

    if (this.x < margin) this.applyForce(turn, 0);
    if (this.x > width - margin) this.applyForce(-turn, 0);
    if (this.y < margin) this.applyForce(0, turn);
    if (this.y > height - margin) this.applyForce(0, -turn);
  }

  update() {
    this.vx += this.ax;
    this.vy += this.ay;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.ax = 0;
    this.ay = 0;

    this.avoidWalls();
  }

  draw() {
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Body
    ctx.fillStyle = "#bde9ff";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.quadraticCurveTo(2, 8, -10, 0);
    ctx.quadraticCurveTo(2, -8, 16, 0);
    ctx.fill();

    // Tail
    ctx.fillStyle = "#8fd0f0";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-18, 6);
    ctx.lineTo(-18, -6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

for (let i = 0; i < fishCount; i++) {
  fishes.push(new Fish());
}

/* =========================
   ANIMATION LOOP
========================= */

function animate() {
  drawBackground();

  for (const fish of fishes) fish.flock(fishes);
  for (const fish of fishes) {
    fish.update();
    fish.draw();
  }

  requestAnimationFrame(animate);
}

animate();
