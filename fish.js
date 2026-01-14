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
  // base blue
  bgCtx.fillStyle = '#0a2540';
  bgCtx.fillRect(0, 0, width, height);

  // noise dots
  bgCtx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.5;
    bgCtx.beginPath();
    bgCtx.arc(x, y, r, 0, Math.PI*2);
    bgCtx.fill();
  }

  // gradient overlay
  const grad = bgCtx.createLinearGradient(0, 0, 0, height);
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
  }

  applyForce(x,y){ this.ax+=x; this.ay+=y; }

  flock(fishes){
    let alignX=0,alignY=0,cohX=0,cohY=0,sepX=0,sepY=0,count=0;
    for(const other of fishes){
      if(other===this) continue;
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
    y=(y/mag)*maxSpeed-this.vy;
    x=Math.max(-maxForce,Math.min(maxForce,x));
    y=Math.max(-maxForce,Math.min(maxForce,y));
    this.applyForce(x*strength,y*strength);
  }

  avoidWalls(){
    const margin=100,turn=0.08;
    if(this.x<margin) this.applyForce(turn,0);
    if(this.x>width-margin) this.applyForce(-turn,0);
    if(this.y<margin) this.applyForce(0,turn);
    if(this.y>height-margin) this.applyForce(0,-turn);
  }

  avoidMouse(){
    if(mouse.x===null) return;
    const dx=this.x-mouse.x,dy=this.y-mouse.y,dist=Math.hypot(dx,dy);
    if(dist<mouse.radius && dist>0){
      const strength=(1-dist/mouse.radius)*0.15;
      this.applyForce((dx/dist)*strength,(dy/dist)*strength);
    }
  }

  avoidPredator(predator){
    if(!predator) return;
    const dx=this.x-predator.x,dy=this.y-predator.y,dist=Math.hypot(dx,dy);
    const fearRadius=180;
    if(dist<fearRadius && dist>0){
      const strength=(1-dist/fearRadius)*0.35;
      this.applyForce((dx/dist)*strength,(dy/dist)*strength);
    }
  }

  update(){
    this.vx+=this.ax; this.vy+=this.ay;
    const speed=Math.hypot(this.vx,this.vy);
    if(speed>maxSpeed){ this.vx=(this.vx/speed)*maxSpeed; this.vy=(this.vy/speed)*maxSpeed; }
    this.x+=this.vx; this.y+=this.vy;
    this.ax=0; this.ay=0;
    this.avoidWalls();
    this.avoidMouse();
    this.avoidPredator(predator);
  }

  draw(){
    const angle=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(angle);

    // body
    ctx.fillStyle="#bde9ff";
    ctx.beginPath();
    ctx.moveTo(14,0);
    ctx.quadraticCurveTo(2,6,-10,0);
    ctx.quadraticCurveTo(2,-6,14,0);
    ctx.fill();

    // tail
    ctx.fillStyle="#8fd0f0";
    ctx.beginPath();
    ctx.moveTo(-10,0);
    ctx.lineTo(-16,5);
    ctx.lineTo(-16,-5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

for(let i=0;i<fishCount;i++){ fishes.push(new Fish()); }

// PREDATOR CLASS WITH TAIL WAG
class Predator{
  constructor(){
    this.x=width/2;
    this.y=height/2;
    this.vx=0.8;
    this.vy=0.6;
    this.tailAngle=0;
    this.tailSpeed=0.05;
  }
  update(){
    this.x+=this.vx;
    this.y+=this.vy;
    if(this.x<150||this.x>width-150) this.vx*=-1;
    if(this.y<150||this.y>height-150) this.vy*=-1;
    this.tailAngle = Math.sin(Date.now()*this.tailSpeed)*0.5;
  }
  draw(){
    const angle=Math.atan2(this.vy,this.vx);
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(angle);

    // body
    ctx.fillStyle="#ffb347";
    ctx.beginPath();
    ctx.moveTo(40,0);
    ctx.quadraticCurveTo(10,18,-24,0);
    ctx.quadraticCurveTo(10,-18,40,0);
    ctx.fill();

    // tail wag
    ctx.fillStyle="#ffa14d";
    ctx.beginPath();
    ctx.moveTo(-24,0);
    ctx.lineTo(-44,16*Math.sin(this.tailAngle));
    ctx.lineTo(-44,-16*Math.sin(this.tailAngle));
    ctx.closePath();
    ctx.fill();

    // fins
    ctx.fillStyle="#ffcc80";
    ctx.beginPath();
    ctx.moveTo(5,10); ctx.lineTo(15,18); ctx.lineTo(15,10); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5,-10); ctx.lineTo(15,-18); ctx.lineTo(15,-10); ctx.closePath(); ctx.fill();

    ctx.restore();
  }
}

// ANIMATION LOOP
function animate(){
  // draw persistent background
  ctx.drawImage(bgCanvas,0,0,width,height);

  if(predator) predator.update(), predator.draw();
  for(const fish of fishes) fish.flock(fishes);
  for(const fish of fishes) fish.update(), fish.draw();

  requestAnimationFrame(animate);
}

animate();
