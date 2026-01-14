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

/* ------------------------------
   BACKGROUND TEXTURE
------------------------------ */
function drawBackground() {
  ctx.fillStyle = "#0a2540";
  ctx.fillRect(0, 0, width, height);

  // Soft noise
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

/* ------------------------------
   MOUSE
------------------------------ */
const mouse = { x: null, y: null, radius: 120 };
window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener("mouseleave", () => { mouse.x = null; mouse.y = null; });

/* ------------------------------
   PREDATOR MODE
------------------------------ */
let predatorMode = false;
let predator = null
