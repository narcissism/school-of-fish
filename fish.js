const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const mouse = { x: null, y: null };
window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class Fish {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
  }

  update() {
    // Mouse attraction
    if (mouse.x !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 200) {
        this.vx += dx * 0.00005;
        this.vy += dy * 0.00005;
      }
    }

    // Limit speed
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = 2;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Wrap edges
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw() {
    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fillStyle = "#9bdcff";
    ctx.fill();
    ctx.restore();
  }
}

const fishCount = 150;
const school = Array.from({ length: fishCount }, () => new Fish());

function animate() {
  ctx.clearRect(0, 0, width, height);
  for (const fish of school) {
    fish.update();
    fish.draw();
  }
  requestAnimationFrame(animate);
}

animate();
