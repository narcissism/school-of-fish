const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const fishCount = 120;
const fishes = [];

const perceptionRadius = 70;
const separationRadius = 22;

const maxSpeed = 2.2;
const maxForce = 0.05;

class Fish {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.ax = 0;
    this.ay = 0;
  }

  applyForce(fx, fy) {
    this.ax += fx;
    this.ay += fy;
  }

  update() {
    this.vx += this.ax;
    this.vy += this.ay;

    // Limit speed
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Reset acceleration
    this.ax = 0;
    this.ay = 0;

    this.avoidWalls();
  }

  avoidWalls() {
    const margin = 80;
    const turn = 0.08;

    if (this.x < margin) this.applyForce(turn, 0);
    if (this.x > width - margin) this.applyForce(-turn, 0);
    if (this.y < margin) this.applyForce(0, turn);
    if (this.y > height - margin) this.applyForce(0, -turn);
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

      if (dist < perceptionRadius) {
        // Alignment
        alignX += other.vx;
        alignY += other.vy;

        // Cohesion
        cohX += other.x;
        cohY += other.y;

        // Separation
        if (dist < separationRadius && dist > 0) {
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

      this.applySteering(alignX, alignY, 0.5);
      this.applySteering(cohX, cohY, 0.04);
      this.applySteering(sepX, sepY, 0.9);
    }
  }

  applySteering(x, y, strength) {
    const mag = Math.hypot(x, y);
    if (mag > 0) {
      x = (x / mag) * maxSpeed - this.vx;
      y = (y / mag) * maxSpeed - this.vy;
      x = Math.max(-maxForce, Math.min(maxForce, x));
      y = Math.max(-maxForce, Math.min(maxForce, y));
      this.applyForce(x * strength, y * strength);
    }
  }

  draw() {
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Body
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.quadraticCurveTo(0, 6, -10, 0);
    ctx.quadraticCurveTo(0, -6, 14, 0);
    ctx.fillStyle = "#9bdcff";
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-16, 5);
    ctx.lineTo(-16, -5);
    ctx.closePath();
    ctx.fillStyle =

