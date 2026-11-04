/* Original Canvas environment art. Circuit centerlines are never modified. */
(function(root){
const maps=typeof CircuitMaps!=='undefined'?CircuitMaps:require('./circuits-data.js');
const palettes={grass:{base:'#274632',patch:'#466841',tree:'#315735',leaf:'#6c8a4b',water:'#285b67'},coast:{base:'#355b48',patch:'#73946a',tree:'#396953',leaf:'#86aa68',water:'#206b83'},desert:{base:'#75654b',patch:'#a99468',tree:'#68714c',leaf:'#a5a169',water:'#44777c'},night:{base:'#172c36',patch:'#2a474d',tree:'#254749',leaf:'#4e6e66',water:'#173c55'}};
function random(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)}
function seedFor(id){let n=741;for(const c of id)n=Math.imul(n,31)+c.charCodeAt(0);return n>>>0}
function distanceToTrack(l,x,y){let best=Infinity;for(let i=0;i<l.points.length;i++){const a=l.points[i],b=l.points[(i+1)%l.points.length],dx=b[0]-a[0],dy=b[1]-a[1],f=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(x-a[0]-dx*f,y-a[1]-dy*f))}return best}
function samples(o){const out=[];for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){const x=ix*o.w/2,y=iy*o.h/2;out.push({x:o.x+x*Math.cos(o.a)-y*Math.sin(o.a),y:o.y+x*Math.sin(o.a)+y*Math.cos(o.a)})}return out}
function footprint(o){const pad=o.kind==='pit'?{w:12,h:18,y:3}:{w:4,h:8,y:0};return {...o,x:o.x-Math.sin(o.a)*pad.y,y:o.y+Math.cos(o.a)*pad.y,w:o.w+pad.w,h:o.h+pad.h}}
function rectDistance(l,o){const cs=Math.cos(o.a),sn=Math.sin(o.a),hw=o.w/2,hh=o.h/2,local=p=>({x:(p[0]-o.x)*cs+(p[1]-o.y)*sn,y:-(p[0]-o.x)*sn+(p[1]-o.y)*cs});let best=Infinity;
for(let i=0;i<l.points.length;i++){const a=local(l.points[i]),b=local(l.points[(i+1)%l.points.length]);let lo=0,hi=1;for(const [v,d,min,max] of [[a.x,b.x-a.x,-hw,hw],[a.y,b.y-a.y,-hh,hh]]){if(Math.abs(d)<1e-10){if(v<min||v>max){lo=2;break}}else{const t0=(min-v)/d,t1=(max-v)/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1))}}if(lo<=hi&&hi>=0&&lo<=1)return 0;
for(const p of [a,b])best=Math.min(best,Math.hypot(Math.max(0,Math.abs(p.x)-hw),Math.max(0,Math.abs(p.y)-hh)));
for(const x of [-hw,hw])for(const y of [-hh,hh]){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy))}}
return best}
function plan(c){const world=maps.world(c),l=maps.project(c),rng=random(seedFor(c.id)),road=25/world.scale,objects=[],trees=[],ponds=[];
const safe=o=>rectDistance(l,footprint(o))>road+4&&objects.every(p=>Math.hypot(p.x-o.x,p.y-o.y)>(Math.hypot(p.w,p.h)+Math.hypot(o.w,o.h))*.45+5);
function beside(kind,t,w,h,offset){const p=maps.position(l,t);for(const side of [1,-1])for(const extra of [0,14,30,50]){const d=(offset+extra)*side,o={kind,x:p.x-Math.sin(p.a)*d,y:p.y+Math.cos(p.a)*d,a:p.a,w,h,side,seed:Math.floor(rng()*1e6)};if(o.x<-40||o.x>1040||o.y<15||o.y>560)continue;if(safe(o)){objects.push(o);return o}}return null}
let pit=null;for(const t of [0,.02,.04,.08,.15,.35]){pit=beside('pit',t,83,31,32);if(pit)break}
for(let i=0;i<12;i++)beside('stand',(i*.083+.035)%1,46+(i%3)*7,18,29);
for(let i=0;i<4;i++)beside(i===0?'fan':'parking',.14+i*.23,58,37,90);
for(let i=0;i<7;i++)beside('light',i/7,4,4,18);
for(let i=0;i<12;i++)beside('runoff',(i*.083+.07)%1,22+(i%3)*4,8+(i%2)*3,17);
for(let i=0;i<8;i++)beside('board',(i*.125+.025)%1,14,3,14);
// Lakes and garden beds occupy clear land, never the racing surface.
for(let i=0;i<40&&ponds.length<(c.terrain==='coast'?3:2);i++){const o={kind:'pond',x:130+rng()*740,y:95+rng()*390,a:rng()*3,w:35+rng()*55,h:22+rng()*28};if(safe(o)&&distanceToTrack(l,o.x,o.y)>Math.hypot(o.w,o.h)/2+road){ponds.push(o)}}
const groves=Array.from({length:15},()=>({x:rng()*1000,y:30+rng()*520}));for(let i=0;i<2200&&trees.length<420;i++){const grove=groves[i%groves.length],x=i%3?-40+rng()*1080:grove.x+(rng()-.5)*85,y=i%3?20+rng()*540:grove.y+(rng()-.5)*65,r=2.3+rng()*3.2;if(distanceToTrack(l,x,y)<road+r+6)continue;if(objects.some(o=>Math.hypot(o.x-x,o.y-y)<Math.hypot(o.w,o.h)/2+r+6))continue;if(ponds.some(o=>Math.hypot(o.x-x,o.y-y)<Math.max(o.w,o.h)/2+r))continue;trees.push({x,y,r,shade:rng(),kind:c.terrain==='desert'?'palm':'tree'})}
return {c,l,world,road,objects,trees,ponds,palette:palettes[c.terrain]||palettes.grass}
}
let active=null,ground=null,overview=null;
function groundArt(p){const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1440;const g=canvas.getContext('2d');g.scale(2,2);g.translate(100,70);const rng=random(seedFor(p.c.id)+7),pal=p.palette;g.fillStyle=pal.base;g.fillRect(-100,-70,1200,720);
g.save();g.translate(500,290);g.rotate(-.35);for(let i=-22;i<22;i++){g.fillStyle=i%2?'#8bb16b0a':'#061d2007';g.fillRect(-900,i*28,1800,28)}g.restore();for(let i=0;i<110;i++){g.fillStyle=i%2?pal.patch+'18':'#061d2010';g.beginPath();g.ellipse(-50+rng()*1100,rng()*600,12+rng()*75,8+rng()*32,rng()*6,0,Math.PI*2);g.fill()}
for(let i=0;i<14000;i++){g.fillStyle=i%3?'#d9e6a309':'#041b1e12';const x=-100+rng()*1200,y=-70+rng()*720;g.fillRect(x,y,.4+rng(),.2+rng()*.4)}
for(const o of p.ponds){g.save();g.translate(o.x,o.y);g.rotate(o.a);g.fillStyle=p.c.terrain==='desert'?'#c1ad78':'#7b9964';g.beginPath();g.ellipse(0,0,o.w/2+3,o.h/2+3,0,0,Math.PI*2);g.fill();const grad=g.createLinearGradient(0,-o.h/2,0,o.h/2);grad.addColorStop(0,pal.water);grad.addColorStop(1,'#102f41');g.fillStyle=grad;g.beginPath();g.ellipse(0,0,o.w/2,o.h/2,0,0,Math.PI*2);g.fill();g.strokeStyle='#a7d5ce33';g.lineWidth=.5;for(let k=0;k<5;k++){g.beginPath();g.ellipse(-k,0,o.w/2-4-k*2,o.h/2-3-k,0,.1,2.7);g.stroke()}g.restore()}
return canvas}
function rect(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
function runoff(g,o){
  const rng=random(o.seed);
  g.fillStyle='#a49472';g.beginPath();g.ellipse(0,0,o.w/2,o.h/2,0,0,Math.PI*2);g.fill();
  g.fillStyle='#d2c5a2';g.beginPath();g.ellipse(-.5,-.5,o.w/2-1,o.h/2-1,0,0,Math.PI*2);g.fill();
  for(let i=0;i<32;i++){
    const angle=rng()*Math.PI*2,radius=Math.sqrt(rng());
    g.fillStyle=i%2?'#9f907055':'#f4e8c066';
    g.fillRect(Math.cos(angle)*radius*(o.w/2-2),Math.sin(angle)*radius*(o.h/2-2),.35,.35);
  }
}
function board(g,o){
  rect(g,-o.w/2+1,-o.h/2+1,o.w,o.h,'#06151e66');
  rect(g,-o.w/2,-o.h/2,o.w,o.h,'#122b3b');
  rect(g,-o.w/2,-o.h/2,o.w,.55,'#e8c578');
  rect(g,-o.w/2+1,-.3,o.w-2,.6,'#dfe7df');
}
function stand(g,o,night){
const rng=random(o.seed),w=o.w,h=o.h;
rect(g,-w/2+2,-h/2+4,w,h,'#061b2277');rect(g,-w/2,-h/2,w,h,'#405766');
for(let row=0;row<10;row++){
  const y=-h/2+1+row*1.55;
  rect(g,-w/2+1,y,w-2,1.25,row%2?'#718a90':'#516a76');
  for(let col=0;col<Math.floor((w-4)/.78);col++){
    const x=-w/2+2+col*.78;
    const color=['#efe1b7','#e5755d','#ffc35f','#74b4d1','#bedf9c','#c4d8cf'][Math.floor(rng()*6)];
    rect(g,x-.15,y+.45,.3,.55,color);rect(g,x-.1,y+.22,.2,.2,'#ecd0ac');
  }
}
rect(g,-w/2-1,-h/2-3,w+2,3,'#193a50');rect(g,-w/2,-h/2-3,w,.8,night?'#63d8f0':'#a3c2c0');for(let x=-w/2+1;x<w/2;x+=12)rect(g,x,-h/2,1,h,'#c1d1c055');rect(g,-w/2,h/2,w,1.2,'#abc0b1');for(let i=0;i<4;i++){const x=-w/2+3+i*(w-6)/3;rect(g,x,-h/2-6,.4,4,'#bed0c0');rect(g,x+.3,-h/2-6,3,1.7,['#d4fc5a','#e18a62','#8ccde5','#e5d4a4'][i])}}
function pit(g,o){const bays=10,w=o.w;rect(g,-w/2-4,-o.h/2-5,w+8,o.h+10,'#82958a');rect(g,-w/2+2,-o.h/2+3,w,o.h*.66,'#07172288');rect(g,-w/2,-o.h/2,w,18,'#aebfc1');rect(g,-w/2,-o.h/2,w,3,'#dae2d8');
for(let i=0;i<bays;i++){const x=-w/2+i*w/bays+1;rect(g,x,-o.h/2+5,w/bays-2,10,i%3?'#607c86':'#3e6572');rect(g,x,-o.h/2+5,w/bays-2,1.2,'#c2d3cf');rect(g,x,3,w/bays-1.5,5,'#142c38');rect(g,x,3,w/bays-1.5,.9,['#d4fc5a','#e16857','#81b9e0'][i%3]);rect(g,x+2,9,3,3,'#334b58');g.fillStyle='#d8e5d5';g.font='bold 2.3px Arial';g.fillText(String(i+1).padStart(2,'0'),x+1,2)}
rect(g,-w/2,13,w,8,'#364a50');rect(g,-w/2,20,w,.6,'#f2df99');g.setLineDash([3,3]);g.strokeStyle='#b7c9b1';g.lineWidth=.35;g.beginPath();g.moveTo(-w/2,17);g.lineTo(w/2,17);g.stroke();g.setLineDash([]);g.fillStyle='#e7eadc';g.font='bold 3px Arial';g.textAlign='center';g.fillText('APEX  /  PIT LANE',0,19);g.textAlign='start';for(let i=0;i<5;i++){const x=-w/2+4+i*15;rect(g,x,-o.h/2-3,10,3,'#213b47');rect(g,x+.5,-o.h/2-2.5,7,2,'#b2c6c5');rect(g,x+8,-o.h/2-2.5,1.5,2,'#cfb98b')}}
function parking(g,o){rect(g,-o.w/2+2,-o.h/2+3,o.w,o.h,'#06151e55');rect(g,-o.w/2,-o.h/2,o.w,o.h,'#53665f');for(let row=0;row<3;row++)for(let i=0;i<12;i++){const x=-o.w/2+2+i*4.5,y=-o.h/2+2+row*12;rect(g,x,y,3.4,6,'#a7b5a65a');rect(g,x+.4,y+.5,2.6,4.8,['#c5d7d1','#324c5a','#ad7562','#758e81'][(i+row)%4]);rect(g,x+.7,y+1.6,2,1.7,'#213a41')}}
function fan(g,o){rect(g,-o.w/2,-o.h/2,o.w,o.h,'#a5a98a');rect(g,-o.w/2+2,-o.h/2+2,o.w-4,o.h-4,'#738c74');for(let i=0;i<7;i++){const x=-o.w/2+4+i*7;rect(g,x,-12,5,8,'#0c263455');g.fillStyle=['#d8e6c9','#e3bb71','#77b1bb'][i%3];g.beginPath();g.moveTo(x-1,-5);g.lineTo(x+2.5,-13);g.lineTo(x+6,-5);g.closePath();g.fill()}g.fillStyle='#d4e2c9';g.font='italic bold 5px Arial';g.textAlign='center';g.fillText('FAN ZONE',0,10);g.textAlign='start';for(let i=0;i<30;i++){g.fillStyle=['#bacdad','#d6ac7c','#6b9595'][i%3];g.beginPath();g.arc(-22+(i*7%45),-1+(i*3%15),.7,0,Math.PI*2);g.fill()}}
function tree(g,t,pal){g.fillStyle='#061e2050';g.beginPath();g.ellipse(t.x+t.r*.5,t.y+t.r*.65,t.r*1.2,t.r*.75,0,0,Math.PI*2);g.fill();if(t.kind==='palm'){g.strokeStyle=pal.leaf;g.lineWidth=1;for(let i=0;i<7;i++){const a=i*Math.PI*2/7;g.beginPath();g.moveTo(t.x,t.y);g.quadraticCurveTo(t.x+Math.cos(a+.3)*t.r,t.y+Math.sin(a+.3)*t.r,t.x+Math.cos(a)*t.r*1.5,t.y+Math.sin(a)*t.r*1.5);g.stroke()}return}g.fillStyle=pal.tree;g.beginPath();g.arc(t.x,t.y,t.r,0,Math.PI*2);g.fill();for(let i=0;i<6;i++){const a=i*Math.PI/3+t.shade*4;g.fillStyle=i%2?pal.leaf:'#759458';g.beginPath();g.arc(t.x+Math.cos(a)*t.r*.35,t.y+Math.sin(a)*t.r*.3,t.r*(.48+t.shade*.12),0,Math.PI*2);g.fill()}g.fillStyle='#adc17a66';g.beginPath();g.arc(t.x-t.r*.2,t.y-t.r*.2,t.r*.3,0,Math.PI*2);g.fill()}
function draw(g,c,l,bounds,bake=false){if(!active||active.c.id!==c.id||active.c.terrain!==c.terrain){active=plan(c);ground=groundArt(active);overview=null}const p=active,k=l.scale,b0=maps.toMap(l,{x:bounds.x,y:bounds.y}),b1=maps.toMap(l,{x:bounds.x+bounds.w,y:bounds.y+bounds.h}),useOverview=!bake&&Math.abs(g.getTransform().a*k)<2.5;
if(useOverview&&!overview){overview=document.createElement('canvas');overview.width=2400;overview.height=1440;const og=overview.getContext('2d');og.scale(2,2);og.translate(100,70);og.translate(500,290);og.scale(1/k,1/k);og.translate(-500,-290);draw(og,c,l,{x:500-600*k,y:290-360*k,w:1200*k,h:720*k},true)}
g.save();g.translate(500*(1-k),290*(1-k));g.scale(k,k);g.fillStyle=p.palette.base;g.fillRect(b0.x,b0.y,b1.x-b0.x,b1.y-b0.y);g.drawImage(useOverview?overview:ground,-100,-70,1200,720);if(useOverview){g.restore();return}
const visible=(x,y,r)=>x+r>b0.x&&x-r<b1.x&&y+r>b0.y&&y-r<b1.y;
for(const o of p.objects){if(!visible(o.x,o.y,Math.hypot(o.w,o.h)))continue;g.save();g.translate(o.x,o.y);g.rotate(o.a);if(o.kind==='stand')stand(g,o,c.terrain==='night');if(o.kind==='pit')pit(g,o);if(o.kind==='parking')parking(g,o);if(o.kind==='fan')fan(g,o);if(o.kind==='runoff')runoff(g,o);if(o.kind==='board')board(g,o);if(o.kind==='light'){g.fillStyle='#b6c2ae';g.fillRect(-.3,-.3,.6,7);g.fillStyle='#e5ebc8';g.fillRect(-2,-1.5,4,1.6);if(c.terrain==='night'){const glow=g.createRadialGradient(0,0,0,0,0,16);glow.addColorStop(0,'#d8f6b233');glow.addColorStop(1,'#d8f6b200');g.fillStyle=glow;g.fillRect(-16,-16,32,32)}}g.restore()}
for(const t of p.trees)if(visible(t.x,t.y,t.r*2))tree(g,t,p.palette);g.restore();
}
const api={plan,distanceToTrack,samples,footprint,rectDistance,draw};root.CircuitScenery=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
