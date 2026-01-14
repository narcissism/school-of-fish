window.addEventListener("load", ()=>{
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  window.addEventListener("resize", ()=>{
    width=window.innerWidth; height=window.innerHeight;
    canvas.width=width; canvas.height=height;
    createBackground();
  });

  // BACKGROUND
  const bgCanvas=document.createElement('canvas');
  const bgCtx=bgCanvas.getContext('2d');
  bgCanvas.width=width; bgCanvas.height=height;

  function createBackground(){
    bgCanvas.width=width; bgCanvas.height=height;
    bgCtx.fillStyle='#0a2540';
    bgCtx.fillRect(0,0,width,height);
    bgCtx.fillStyle='rgba(255,255,255,0.02)';
    for(let i=0;i<600;i++){
      const x=Math.random()*width, y=Math.random()*height;
      const r=Math.random()*1.5;
      bgCtx.beginPath(); bgCtx.arc(x,y,r,0,Math.PI*2); bgCtx.fill();
    }
    const grad=bgCtx.createLinearGradient(0,0,0,height);
    grad.addColorStop(0,'rgba(255,255,255,0.02)');
    grad.addColorStop(1,'rgba(0,0,0,0.15)');
    bgCtx.fillStyle=grad; bgCtx.fillRect(0,0,width,height);
  }

  createBackground();

  // MOUSE
  const mouse={x:null,y:null,radius:120};
  window.addEventListener('mousemove',e=>{mouse.x=e.clientX; mouse.y=e.clientY;});
  window.addEventListener('mouseleave',()=>{mouse.x=null;mouse.y=null;});

  // PREDATOR TOGGLE
  let predatorMode=false;
  let predator=null;
  const predatorToggle=document.getElementById('predatorToggle');
  predatorToggle.addEventListener('change', ()=>{
    predatorMode=predatorToggle.checked;
    predator = predatorMode ? new Predator() : null;
  });

  // SPLATTER
  const splatters=[];
  class Splatter{
    constructor(x,y){ this.x=x; this.y=y; this.radius=5+Math.random()*5; this.alpha=1; this.life=30+Math.random()*20; }
    update(){ this.alpha-=1/this.life; }
    draw(){ ctx.fillStyle=`rgba(255,0,0,${this.alpha})`; ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fill(); }
  }

  // FISH
  const fishCount=120;
  const fishes=[];
  class Fish{
    constructor(){
      this.x=Math.random()*width;
      this.y=Math.random()*height;
      this.vx=Math.random()*2-1;
      this.vy=Math.random()*2-1;
      this.ax=0; this.ay=0;
      this.alive=true;
    }
    applyForce(x,y){ this.ax+=x; this.ay+=y; }
    flock(fishes){
      if(!this.alive) return;
      let alignX=0,alignY=0,cohX=0,cohY=0,sepX=0,sepY=0,count=0;
      for(const other of fishes){
        if(other===this||!other.alive) continue;
        const dx=other.x-this.x,dy=other.y-this.y,dist=Math.hypot(dx,dy);
        if(dist<70 && dist>0){
          alignX+=other.vx; alignY+=other.vy;
          cohX+=other.x; cohY+=other.y;
          if(dist<26){ sepX-=dx/dist; sepY-=dy/dist; }
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
    steer(x,y,str){ const mag=Math.hypot(x,y); if(mag===0) return; x=(x/mag)*2-this.vx; y=(y/mag)*2-this.vy; x=Math.max(-0.06,Math.min(0.06,x)); y=Math.max(-0.06,Math.min(0.06,y)); this.applyForce(x*str,y*str); }
    avoidWalls(){ if(!this.alive) return; const margin=100,turn=0.08; if(this.x<margin)this.applyForce(turn,0); if(this.x>width-margin)this.applyForce(-turn,0); if(this.y<margin)this.applyForce(0,turn); if(this.y>height-margin)this.applyForce(0,-turn); }
    avoidMouse(){ if(!this.alive || mouse.x===null) return; const dx=this.x-mouse.x,dy=this.y-mouse.y,dist=Math.hypot(dx,dy); if(dist<mouse.radius && dist>0){ const s=(1-dist/mouse.radius)*0.15; this.applyForce((dx/dist)*s,(dy/dist)*s); } }
    avoidPredator(pred){ if(!this.alive||!pred) return; const dx=this.x-pred.x,dy=this.y-pred.y,dist=Math.hypot(dx,dy); if(dist<180 && dist>0){ const s=(1-dist/180)*0.35; this.applyForce((dx/dist)*s,(dy/dist)*s); } }
    update(){ if(!this.alive) return; this.vx+=this.ax; this.vy+=this.ay; const speed=Math.hypot(this.vx,this.vy); if(speed>2){ this.vx=(this.vx/speed)*2; this.vy=(this.vy/speed)*2; } this.x+=this.vx; this.y+=this.vy; this.ax=0; this.ay=0; this.avoidWalls(); this.avoidMouse(); this.avoidPredator(predator); }
    draw(){ if(!this.alive) return; const a=Math.atan2(this.vy,this.vx); ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(a); ctx.fillStyle="#bde9ff"; ctx.beginPath(); ctx.moveTo(14,0); ctx.quadraticCurveTo(2,6,-10,0); ctx.quadraticCurveTo(2,-6,14,0); ctx.fill(); ctx.fillStyle="#8fd0f0"; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-16,5); ctx.lineTo(-16,-5); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  for(let i=0;i<fishCount;i++){ fishes.push(new Fish()); }

  // PREDATOR
  class Predator{
    constructor(){ this.x=width/2; this.y=height/2; this.vx=0; this.vy=0; this.tailAngle=0; this.tailSpeed=0.05; this.speed=1.5; }
    update(){
      if(mouse.x!==null && mouse.y!==null){ const dx=mouse.x-this.x,dy=mouse.y-this.y,dist=Math.hypot(dx,dy); if(dist>2){ this.vx=(dx/dist)*this.speed; this.vy=(dy/dist)*this.speed; } else { this.vx=0; this.vy=0; } }
      this.x+=this.vx; this.y+=this.vy;
      this.tailAngle=Math.sin(Date.now()*this.tailSpeed)*0.5;
      for(const fish of fishes){ if(!fish.alive) continue; const dx=fish.x-this.x, dy=fish.y-this.y; if(Math.hypot(dx,dy)<20){ fish.alive=false; splatters.push(new Splatter(fish.x,fish.y)); } }
    }
    draw(){ const a=Math.atan2(this.vy,this.vx); ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(a); ctx.fillStyle="#ffb347"; ctx.beginPath(); ctx.moveTo(40,0); ctx.quadraticCurveTo(10,18,-24,0); ctx.quadraticCurveTo(10,-18,40,0); ctx.fill(); ctx.fillStyle="#ffa14d"; ctx.beginPath(); ctx.moveTo(-24,0); ctx.lineTo(-44,16*Math.sin(this.tailAngle)); ctx.lineTo(-44,-16*Math.sin(this.tailAngle)); ctx.closePath(); ctx.fill(); ctx.fillStyle="#ffcc80"; ctx.beginPath(); ctx.moveTo(5,10); ctx.lineTo(15,18); ctx.lineTo(15,10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(5,-10); ctx.lineTo(15,-18); ctx.lineTo(15,-10); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }

  // ANIMATION
  function animate(){
    ctx.drawImage(bgCanvas,0,0,width,height);
    if(predator) predator.update(), predator.draw();
    for(const f of fishes) f.flock(fishes);
    for(const f of fishes) f.update(), f.draw();
    for(let i=splatters.length-1;i>=0;i--){ const s=splatters[i]; s.update(); s.draw(); if(s.alpha<=0) splatters.splice(i,1); }
    requestAnimationFrame(animate);
  }
  animate();
});
