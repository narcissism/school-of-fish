// CANVAS SETUP
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

// BACKGROUND TEXTURE
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = width;
bgCanvas.height = height;

function createBackground() {
  bgCtx.fillStyle = '#0a2540';
  bgCtx.fillRect(0, 0, width, height);

  bgCtx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.5;
    bgCtx.beginPath();
    bgCtx.arc(x, y, r, 0, Math.PI*2);
    bgCtx.fill();
  }

  const grad = bgCtx.createLinearGradient(0,0,0,height);
  grad.addColorStop(0, 'rgba(255,255,255,0.02)');
  grad.addColorStop(1, 'rgba(0,0,0,0.15)');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0,0,width,height);
}
createBackground();

// MOUSE
const mouse = { x:null, y:null, radius:120 };
window.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
window.addEventListener('mouseleave', ()=>{ mouse.x=null; mouse.y=null; });

// PREDATOR TOGGLE
let predatorMode=false;
let predator=null;
const predatorToggle=document.getElementById('predatorToggle');
predatorToggle.addEventListener('change', ()=>{
  predatorMode = predatorToggle.checked;
  predator = predatorMode ? new Predator() : null;
});

// SPLATTER EFFECT
const splatters = [];
class Splatter {
  constructor(x,y){
    this.x=x; this.y=y;
    this.radius=5 + Math.random()*5;
    this.alpha=1;
    this.life=30 + Math.random()*20;
  }
  update(){
    this.alpha -= 1/this.life;
  }
  draw(){
    ctx.fillStyle = `rgba(255,0,0,${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius,0,Math.PI*2);
    ctx.fill();
  }
}

// FISH CLASS
const fishCount=120;
const fishes=[];
const perceptionRadius=70;
const separationRadius=26;
const maxSpeed=2;
const maxForce=0.06;

class Fish{
  constructor(){
    this.x=Math.random()*width;
    this.y=Math.random()*height;
    this.vx=Math.random()*2-1;
    this.vy=Math.random()*2-1;
    this.ax=0;
    this.ay=0;
    this.alive=true;
  }

  applyForce(x,y){ this.ax+=x; this.ay+=y; }

  flock(fishes){
    if(!this.alive) return;
    let alignX=0,alignY=0,cohX=0,cohY=0,sepX=0,sepY=0,count=0;
    for(const other of fishes){
      if(other===this || !other.alive) continue;
      const dx=other.x-this.x,dy=other.y-this.y,dist=Math.hypot(dx,dy);
      if(dist<perceptionRadius && dist>0){
        alignX+=other.vx; alignY+=other.vy;
        cohX+=other.x; cohY+=other.y;
        if(dist<separationRadius){ sepX -= dx/dist; sepY -= dy/dist; }
        count++;
      }
    }
    if(count>0){
      alignX/=count; alignY/=count;
      cohX=cohX/count-this.x; cohY=cohY/count-this.y;
      this.steer(alignX,alignY,0.5);
      this.steer(cohX,cohY,0.05);
      this.steer(sepX,sepY,1.0);
    }
  }

  steer(x,y,strength){
    const mag=Math.hypot(x,y);
    if(mag===0) return;
    x=(x/mag)*maxSpeed-this.vx;
    y=(y/mag)*maxSpeed-this.vy*
