// Presentation only: the camera never changes simulation time or save data.
(function(){
const map=document.createElement('section');map.className='race-minimap';map.setAttribute('aria-label','Minimapa do circuito');map.innerHTML='<div class="minimap-heading"><span>CIRCUITO</span><b id="mapLap">01</b></div><canvas id="raceMap" width="440" height="260" aria-label="Traçado completo com posição do seu carro"></canvas><div class="map-key"><i></i> SEU CARRO <span id="mapProgress">0%</span></div>';document.body.append(map);
const controls=document.createElement('nav');controls.className='camera-controls';controls.setAttribute('aria-label','Câmera da corrida');controls.innerHTML='<button id="zoomOut" aria-label="Afastar câmera">−</button><output id="cameraZoom" aria-live="polite">5×</output><button id="zoomIn" aria-label="Aproximar câmera">+</button><button id="cameraMode" aria-pressed="true">◎ Seguir carro</button>';document.body.append(controls);
const mini=$('raceMap'),mc=mini.getContext('2d');let zoom=5,follow=true,cameraX=null,cameraY=null,lastFrame=performance.now(),lastCircuit=-1,mapCircuit=-1,mapBackground=null;
function updateControls(){ $('cameraZoom').textContent=(follow?zoom:1).toLocaleString('pt-BR',{maximumFractionDigits:1})+'×';$('cameraMode').textContent=follow?'◎ Seguir carro':'⌖ Pista inteira';$('cameraMode').setAttribute('aria-pressed',String(follow));$('zoomOut').disabled=follow&&zoom<=2.5;$('zoomIn').disabled=follow&&zoom>=10 }
function changeZoom(step){follow=true;zoom=Math.max(2.5,Math.min(10,zoom+step));updateControls()}
$('zoomOut').onclick=()=>changeZoom(-.5);$('zoomIn').onclick=()=>changeZoom(.5);$('cameraMode').onclick=()=>{follow=!follow;cameraX=null;updateControls()};
canvas.addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();changeZoom(e.deltaY<0?.5:-.5)},{passive:false});
// Non-modal side panels leave the live race and its controls usable.
const observeDrawer=()=>document.body.classList.toggle('race-panel-open',drawer.open);
new MutationObserver(observeDrawer).observe(drawer,{attributes:true,attributeFilter:['open']});observeDrawer();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.open&&!document.querySelector('dialog:modal')){drawer.close();menuToggle.focus()}});
function minimap(){
if(mapCircuit!==s.circuit){mapCircuit=s.circuit;mapBackground=document.createElement('canvas');mapBackground.width=440;mapBackground.height=260;const g=mapBackground.getContext('2d');g.lineJoin='round';g.lineCap='round';g.beginPath();layouts[s.circuit].points.forEach((v,i)=>{const p=CircuitMaps.toMap(layouts[s.circuit],{x:v[0],y:v[1]});i?g.lineTo(p.x*.44,p.y*260/580):g.moveTo(p.x*.44,p.y*260/580)});g.closePath();g.strokeStyle='#07161d';g.lineWidth=12;g.stroke();g.strokeStyle='#8da8a8';g.lineWidth=4;g.stroke();const p=CircuitMaps.toMap(layouts[s.circuit],position(0));g.fillStyle='#f4f7eb';g.fillRect(p.x*.44-3,p.y*260/580-3,6,6)}
mc.clearRect(0,0,440,260);mc.drawImage(mapBackground,0,0);
const dot=(t,color,r)=>{const p=CircuitMaps.toMap(layouts[s.circuit],position(t));mc.beginPath();mc.arc(p.x*.44,p.y*260/580,r,0,Math.PI*2);mc.fillStyle=color;mc.fill()};
if(typeof TrafficView!=='undefined'){TrafficView.racers().filter(c=>c.id!=='player').forEach(c=>dot(c.distance,c.color,4))}else if(typeof race!=='undefined'&&race){race.rivals.forEach(r=>dot(race.elapsed/r.pace,r.color,4))}else{dot(s.progress*.94+.32,'#e17e60',4);dot(s.progress*1.02+.65,'#8baded',4)}
dot(s.progress,'#07171e',10);dot(s.progress,s.color||'#d4fc5a',7);$('mapProgress').textContent=Math.floor(s.progress*100)+'%';$('mapLap').textContent='VOLTA '+(typeof race!=='undefined'&&race?Math.min(5,Math.floor(race.distance)+1):s.laps+1);
}
const worldDraw=draw;
draw=function(){
const bounds=canvas.getBoundingClientRect(),w=bounds.width,h=bounds.height,dpr=Math.min(window.devicePixelRatio||1,2);if(!w||!h)return;
const pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
const now=performance.now(),dt=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
const p=typeof TrafficView!=='undefined'?TrafficView.playerPosition():position(s.progress),ahead=position(s.progress+.008/layouts[s.circuit].scale),tx=follow?p.x*.8+ahead.x*.2:500,ty=follow?p.y*.8+ahead.y*.2:290;
if(cameraX===null||lastCircuit!==s.circuit){cameraX=tx;cameraY=ty;lastCircuit=s.circuit}else{const blend=1-Math.exp(-dt*30);cameraX+=(tx-cameraX)*blend;cameraY+=(ty-cameraY)*blend}
const scale=Math.min(w/1000,h/580)*(follow?zoom:1/layouts[s.circuit].scale);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle={grass:'#142f26',coast:'#143337',desert:'#3e3b30',night:'#0d2230'}[A.circuits[s.circuit].terrain];ctx.fillRect(0,0,w,h);
ctx.save();ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*(w*.5-cameraX*scale),dpr*(h*.52-cameraY*scale));worldDraw();ctx.restore();ctx.setTransform(1,0,0,1,0,0);minimap();
};updateControls();
})();
