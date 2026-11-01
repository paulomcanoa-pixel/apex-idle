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
function car(ctx,x,y,scale,color,time){
ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.translate(0,Math.sin(time)*2);
ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(4,8,47,102,0,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#070b10';ctx.strokeStyle='#42515b';ctx.lineWidth=2;
for(const [a,b,w,h] of [[-53,-59,25,38],[28,-59,25,38],[-58,45,30,44],[28,45,30,44]]){ctx.fillRect(a,b,w,h);ctx.strokeRect(a,b,w,h);ctx.fillStyle='#9aabb322';ctx.fillRect(a+4,b+3,3,h-6);ctx.fillStyle='#070b10'}
const paint=ctx.createLinearGradient(-35,0,35,0);paint.addColorStop(0,color);paint.addColorStop(.45,'#e8f5ff');paint.addColorStop(.58,color);paint.addColorStop(1,color);
ctx.fillStyle=paint;
ctx.beginPath();ctx.moveTo(-6,-98);ctx.lineTo(6,-98);ctx.lineTo(12,-34);ctx.lineTo(30,12);ctx.lineTo(28,66);ctx.lineTo(15,90);ctx.lineTo(-15,90);ctx.lineTo(-28,66);ctx.lineTo(-30,12);ctx.lineTo(-12,-34);ctx.closePath();ctx.fill();
ctx.fillStyle=color;ctx.fillRect(-48,-86,96,10);ctx.fillRect(-53,-75,106,6);ctx.fillRect(-48,79,96,13);ctx.fillRect(-42,94,84,6);
ctx.fillStyle='#0b1623';ctx.beginPath();ctx.ellipse(0,4,11,22,0,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='#c6dce6';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-1,15,25,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(0,0);ctx.stroke();
ctx.fillStyle='#f4e9c8';ctx.beginPath();ctx.arc(0,8,7,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='#ffffff60';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-20,38);ctx.lineTo(-18,67);ctx.moveTo(20,38);ctx.lineTo(18,67);ctx.stroke();
ctx.restore()
}
function mount(canvas,results){
const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
let frame=0,closed=false,started=performance.now(),width=0,model;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function resize(){width=Math.max(280,canvas.getBoundingClientRect().width);model=layout(results,width);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(model.height*dpr);canvas.style.height=model.height+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
function paint(now){
if(closed)return;
const time=reduced?0:(now-started)/1000,h=model.height;
ctx.clearRect(0,0,width,h);ctx.fillStyle='#0a111b';ctx.fillRect(0,0,width,h);
const glow=ctx.createRadialGradient(width/2,h/2,10,width/2,h/2,width*.55);glow.addColorStop(0,results.length?order(results)[0].car.color+'28':'#ffffff12');glow.addColorStop(1,'#0a111b00');ctx.fillStyle=glow;ctx.fillRect(0,0,width,h);
ctx.strokeStyle='#ffffff08';ctx.lineWidth=1;for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
for(const item of [...model.items].sort((a,b)=>Number(a.hero)-Number(b.hero))){
const {result,x,y,w,h:ch,hero}=item,c=result.car,color=c.color,bob=reduced?0:Math.sin(time*1.8+(hero?0:x))*(hero?4:2);
ctx.save();ctx.translate(x,y+bob);ctx.fillStyle='#111e2be8';ctx.strokeStyle=color+'88';ctx.lineWidth=hero?2:1;ctx.beginPath();ctx.roundRect(-w/2,-ch/2,w,ch,12);ctx.fill();ctx.stroke();
if(hero){ctx.shadowColor=color;ctx.shadowBlur=18+Math.sin(time*2)*6;ctx.stroke();ctx.shadowBlur=0}
const halo=ctx.createRadialGradient(0,-ch*.04,5,0,-ch*.04,w*.6);halo.addColorStop(0,color+'48');halo.addColorStop(1,color+'00');ctx.fillStyle=halo;ctx.fillRect(-w/2,-ch/2,w,ch);
ctx.textAlign='center';ctx.fillStyle=color;ctx.font='700 '+(hero?12:10)+'px Arial';ctx.fillText(hero?'✦ DESTAQUE · '+c.rarity.toUpperCase():c.rarity.toUpperCase(),0,-ch/2+24,w-12);
const scale=Math.min((w-22)/120,(ch-90)/200);
car(ctx,0,-5,scale,color,time*2);
ctx.fillStyle='#f4f8fc';ctx.font='700 '+(hero?17:12)+'px Arial';ctx.fillText(c.name,0,ch/2-40,w-12);
ctx.fillStyle=result.duplicate?'#b0c0cc':color;ctx.font=(hero?12:10)+'px Arial';ctx.fillText(result.duplicate?'Repetido · +'+result.points+' pontos':'NOVO NA GARAGEM',0,ch/2-19,w-12);ctx.restore()
}
if(!reduced)frame=requestAnimationFrame(paint)
}
resize();paint(performance.now());
const observer=new ResizeObserver(()=>{resize();if(reduced)paint(performance.now())});observer.observe(canvas);
return ()=>{closed=true;cancelAnimationFrame(frame);observer.disconnect()}
}
root.DropShowcase={order,layout,mount};
if(typeof module!=='undefined')module.exports=root.DropShowcase;
})(typeof window!=='undefined'?window:globalThis);
