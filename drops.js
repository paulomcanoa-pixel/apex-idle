// Arte original de monopostos e apresentação dos drops em Canvas 2D.
(function(root){
function rank(result){return ['Inicial','Comum','Raro','Épico','Lendário','Mítico'].indexOf(result.car.rarity)}
function order(results){return results.map((result,index)=>({result,index})).sort((a,b)=>rank(b.result)-rank(a.result)||a.index-b.index).map(x=>x.result)}
function layout(results,width){
const sorted=order(results),mobile=width<650;
if(mobile)return {height:330+Math.ceil((sorted.length-1)/2)*208,items:sorted.map((result,i)=>i===0?{result,x:width/2,y:155,w:Math.min(300,width-32),h:280,hero:true}:{result,x:width*(i%2? .25:.75),y:430+Math.floor((i-1)/2)*208,w:width/2-16,h:192,hero:false})};
const rows=Math.ceil((sorted.length-1)/4),height=Math.max(550,rows*175+55);
return {height,items:sorted.map((result,i)=>{
if(i===0)return {result,x:width/2,y:height/2,w:width*.27,h:Math.min(420,height-50),hero:true};
const n=i-1,side=n%2?1:-1,col=Math.floor(n/(rows*2)),row=Math.floor(n/2)%rows;
return {result,x:width/2+side*width*(col===0?.23:.405),y:(height-(rows-1)*175)/2+row*175,w:width*.158,h:160,hero:false}
})}
}

function auraPalette(model){const labels=['Comum','Raro','Épico','Lendário','Mítico'],index=typeof model.rarity==='number'?model.rarity:labels.indexOf(model.rarity),rank=Math.max(0,Math.min(4,index));return{rank,color:['#b8c9d4','#70caff','#c6a0ff','#ffcd75','#ff86bf'][rank]}}
function aura(ctx,x,y,w,h,model,time=0,reduced=false){const {rank,color}=auraPalette(model),t=reduced?0:time,pulse=reduced?1:1+Math.sin(t*2.2)*.035;ctx.save();ctx.translate(x,y);ctx.scale(w/150*pulse,h/90*pulse);ctx.globalCompositeOperation='screen';const fog=ctx.createRadialGradient(0,0,12,0,0,125);fog.addColorStop(0,color+'16');fog.addColorStop(.42,color+'66');fog.addColorStop(.72,color+'35');fog.addColorStop(1,color+'00');ctx.fillStyle=fog;ctx.fillRect(-130,-130,260,260);
ctx.shadowColor=color;ctx.shadowBlur=12+rank*3;for(let ring=0;ring<(rank>=2?3:2);ring++){ctx.globalAlpha=.35+rank*.09;ctx.strokeStyle=color;ctx.lineWidth=ring===0?2:1;ctx.beginPath();ctx.ellipse(0,0,78+ring*13,51+ring*10,Math.sin(t*.35)*.09,0,Math.PI*2);ctx.stroke()}
for(let i=0;i<8+rank*5;i++){const angle=i*Math.PI*2/(8+rank*5)+t*(rank===4?.18:.08),r=87+Math.sin(i*1.8+t)*14;ctx.globalAlpha=.3+.5*(.5+.5*Math.sin(i+t*1.7));ctx.fillStyle=color;ctx.beginPath();ctx.arc(Math.cos(angle)*r,Math.sin(angle)*r*.7,i%3===0?2.2:1,0,Math.PI*2);ctx.fill()}
if(rank>=3){ctx.globalAlpha=.16;for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4+t*.045);const beam=ctx.createLinearGradient(40,0,150,0);beam.addColorStop(0,color+'bb');beam.addColorStop(1,color+'00');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(35,0);ctx.lineTo(150,-6);ctx.lineTo(150,6);ctx.fill();ctx.restore()}}ctx.restore()
}

function car(ctx,x,y,scale,color,time,id){
if(typeof CarArt!=='undefined'&&id){CarArt.draw(ctx,{x,y,a:-Math.PI/2,scale:scale*2.05,id,shadow:true});return}
ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.translate(0,Math.sin(time)*2);
ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(4,8,47,102,0,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#070b10';ctx.strokeStyle='#42515b';ctx.lineWidth=2;
for(const [a,b,w,h] of [[-53,-59,25,38],[28,-59,25,38],[-58,45,30,44],[28,45,30,44]]){ctx.fillRect(a,b,w,h);ctx.strokeRect(a,b,w,h);ctx.fillStyle='#9aabb322';ctx.fillRect(a+4,b+3,3,h-6);ctx.fillStyle='#070b10'}
const paint=ctx.createLinearGradient(-35,0,35,0);paint.addColorStop(0,color);paint.addColorStop(.45,'#e8f5ff');paint.addColorStop(.58,color);paint.addColorStop(1,color);
ctx.fillStyle=paint;
ctx.beginPath();ctx.moveTo(-6,-98);ctx.lineTo(6,-98);ctx.lineTo(12,-34);ctx.lineTo(30,12);ctx.lineTo(28,66);ctx.lineTo(15,90);ctx.lineTo(-15,90);ctx.lineTo(-28,66);ctx.lineTo(-30,12);ctx.lineTo(-12,-34);ctx.closePath();ctx.fill();
ctx.fillStyle=color;ctx.fillRect(-48,-86,96,10);ctx.fillRect(-53,-75,106,6);ctx.fillRect(-48,79,96,13);ctx.fillRect(-42,94,84,6);
ctx.fillStyle='#0b1623';ctx.beginPath();ctx.ellipse(0,4,11,22,0,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='#c6dce6';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-1,15,25,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(0,0);ctx.stroke();
ctx.fillStyle='#f4e9c8';ctx.beginPath();ctx.arc(0,8,7,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='#ffffff60';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-20,38);ctx.lineTo(-18,67);ctx.moveTo(20,38);ctx.lineTo(18,67);ctx.stroke();
ctx.restore()
}
function mount(canvas,results){
const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
let frame=0,closed=false,started=performance.now(),width=0,model;
const featured=order(results)[0];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){width=Math.max(280,canvas.getBoundingClientRect().width);model=layout(results,width);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(model.height*dpr);canvas.style.height=model.height+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
function paint(now){
if(closed)return;if(document.hidden){frame=requestAnimationFrame(paint);return}
const time=reduced?0:(now-started)/1000,h=model.height;
ctx.clearRect(0,0,width,h);ctx.fillStyle='#0b0915';ctx.fillRect(0,0,width,h);
const glow=ctx.createRadialGradient(width/2,h/2,10,width/2,h/2,width*.55);glow.addColorStop(0,featured?featured.car.color+'35':'#ffffff12');glow.addColorStop(1,'#0a111b00');ctx.fillStyle=glow;ctx.fillRect(0,0,width,h);
// Raios e partículas originais: celebração de coleção.
ctx.save();ctx.translate(width/2,width<650?155:h/2);
for(let i=0;i<16;i++){const angle=i*Math.PI/8+time*.04;ctx.save();ctx.rotate(angle);const beam=ctx.createLinearGradient(0,0,width*.6,0);beam.addColorStop(0,(featured?featured.car.color:'#ffe19a')+'18');beam.addColorStop(1,'#ffffff00');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(width*.7,-width*.025);ctx.lineTo(width*.7,width*.025);ctx.closePath();ctx.fill();ctx.restore()}ctx.restore();
for(let i=0;i<38;i++){const x=((i*137.5)%width),y=reduced?(i*89)%h:((i*89-time*(12+i%5*4))%h+h)%h;ctx.globalAlpha=.2+(Math.sin(time*2+i)+1)*.2;ctx.fillStyle=i%3===0?'#ffe29b':featured.car.color;ctx.beginPath();ctx.arc(x,y,i%4===0?2:1,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
for(const item of [...model.items].sort((a,b)=>Number(a.hero)-Number(b.hero))){
const {result,x,y,w,h:ch,hero}=item,c=result.car,color=c.color,bob=reduced?0:Math.sin(time*1.8+(hero?0:x))*(hero?4:2);
const index=model.items.indexOf(item),delay=hero?.28:.06*index,progress=reduced?1:Math.min(1,Math.max(0,(time-delay)/.65)),ease=1-Math.pow(1-progress,3);
if(progress<=0)continue;
ctx.save();ctx.globalAlpha=progress;ctx.translate(width/2+(x-width/2)*ease,y+bob+(1-ease)*42);ctx.scale(.85+.15*ease,.85+.15*ease);
const cardBg=ctx.createLinearGradient(0,-ch/2,0,ch/2);cardBg.addColorStop(0,'#25213b');cardBg.addColorStop(.55,'#141325');cardBg.addColorStop(1,'#090d19');
ctx.fillStyle=cardBg;ctx.strokeStyle=color+'bb';ctx.lineWidth=hero?2:1;ctx.beginPath();ctx.roundRect(-w/2,-ch/2,w,ch,12);ctx.fill();ctx.stroke();
ctx.strokeStyle=color+'25';ctx.lineWidth=1;ctx.strokeRect(-w/2+6,-ch/2+6,w-12,ch-12);
if(hero){ctx.shadowColor=color;ctx.shadowBlur=18+Math.sin(time*2)*6;ctx.stroke();ctx.shadowBlur=0}
const halo=ctx.createRadialGradient(0,-ch*.04,5,0,-ch*.04,w*.6);halo.addColorStop(0,color+'48');halo.addColorStop(1,color+'00');ctx.fillStyle=halo;ctx.fillRect(-w/2,-ch/2,w,ch);
ctx.textAlign='center';ctx.fillStyle=color;ctx.font='700 '+(hero?12:10)+'px Arial';ctx.fillText(hero?'✦ DESTAQUE · '+c.rarity.toUpperCase():c.rarity.toUpperCase(),0,-ch/2+24,w-12);
const scale=Math.min((w-22)/120,(ch-104)/200);
aura(ctx,0,-5,Math.max(35,scale*85),Math.max(50,scale*125),c,time,reduced);car(ctx,0,-5,scale,color,time*2,c.id);
ctx.fillStyle=color;ctx.font=(hero?13:10)+'px Arial';ctx.fillText('★'.repeat(Math.max(1,rank(result))),0,ch/2-59,w-12);
ctx.fillStyle='#f4f8fc';ctx.font='700 '+(hero?17:12)+'px Arial';ctx.fillText(c.name,0,ch/2-40,w-12);
ctx.fillStyle=result.duplicate?'#b0c0cc':'#ffe3a1';ctx.font=(hero?12:10)+'px Arial';ctx.fillText(result.duplicate?'Repetido · +'+result.points+' pontos':'✦ NOVO MONOPOSTO',0,ch/2-19,w-12);ctx.restore()
}
// Um único brilho suave de entrada no destaque, sem flashes repetidos.
if(!reduced&&time>.25&&time<.85){ctx.fillStyle='rgba(255,229,165,'+(Math.sin((time-.25)/.6*Math.PI)*.08)+')';ctx.fillRect(0,0,width,h)}
if(!reduced)frame=requestAnimationFrame(paint)
}
resize();paint(performance.now());
const observer=new ResizeObserver(()=>{resize();if(reduced)paint(performance.now())});observer.observe(canvas);
return ()=>{closed=true;cancelAnimationFrame(frame);observer.disconnect()}
}
function race(canvas,model,phase){
const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
let stopped=false,frame=0,width=0;const height=300,start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){width=Math.max(280,canvas.getBoundingClientRect().width);const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0)}
function paint(now){
if(stopped)return;if(document.hidden){frame=requestAnimationFrame(paint);return}const t=reduced?0:(now-start)/1000,finish=width*.7;
ctx.clearRect(0,0,width,height);ctx.fillStyle='#101826';ctx.fillRect(0,0,width,height);
ctx.fillStyle='#263542';ctx.fillRect(0,58,width,174);ctx.fillStyle='#82939c';ctx.fillRect(0,55,width,3);ctx.fillRect(0,232,width,3);
ctx.strokeStyle='#d6e1e833';ctx.lineWidth=2;ctx.setLineDash([24,24]);ctx.beginPath();ctx.moveTo(0,145);ctx.lineTo(width,145);ctx.stroke();ctx.setLineDash([]);
for(let col=0;col<3;col++)for(let row=0;row<14;row++){ctx.fillStyle=(col+row)%2?'#0a1018':'#eff4ee';ctx.fillRect(finish+col*12,60+row*12,12,12)}
ctx.fillStyle='#c5d5dc';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('CHEGADA',finish+18,40);
const reveal=phase!=='mystery',x=phase==='racing'&&!reduced?width*.30+(width*.60)*Math.min(1,t/1.5):phase==='revealed'?width*.30:width/2;
if(reveal)aura(ctx,x,145,Math.min(150,width*.30),74,model,t,reduced);
ctx.save();ctx.translate(x,145);ctx.rotate(Math.PI/2);if(phase==='mystery')ctx.filter='brightness(0)';if(reveal){ctx.shadowColor=model.color;ctx.shadowBlur=22}
car(ctx,0,0,Math.min(.84,(width-60)/220),reveal?model.color:'#26303e',reduced?0:t*2,model.id);ctx.restore();
if(phase==='mystery'){ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=18;ctx.font='bold 60px Arial';ctx.fillText('?',width/2,164);ctx.shadowBlur=0}
if(!reduced)frame=requestAnimationFrame(paint)
}
resize();paint(performance.now());const observer=new ResizeObserver(()=>{resize();if(reduced)paint(performance.now())});observer.observe(canvas);
return ()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect()}
}
root.DropShowcase={order,layout,mount,race,car,aura,auraPalette};
if(typeof module!=='undefined')module.exports=root.DropShowcase;
})(typeof window!=='undefined'?window:globalThis);

