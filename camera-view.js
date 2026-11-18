// Presentation only: the camera never changes simulation time or save data.
(function(){
const map=document.createElement('section');map.className='race-minimap';ApexRender.attr(map,'aria-label','Minimapa do circuito');ApexRender.html(map,'<details class="minimap-disclosure" open><summary>Mapa e câmera</summary><div class="minimap-content"><div class="minimap-heading"><span>CIRCUITO</span><b id="mapLap">01</b></div><canvas id="raceMap" width="440" height="260" aria-label="Traçado completo com posição do seu carro"></canvas><div class="map-key"><i></i> SEU CARRO <span id="mapProgress">0%</span></div><button type="button" id="mapCamera">Ver pista inteira</button><div class="map-visual-controls"><button type="button" id="lightMode" aria-label="Alternar entre dia e noite">☀ Dia</button><button type="button" id="projectionMode" aria-label="Alternar entre visão 2,5D e superior">◈ 2,5D</button></div><button type="button" id="motionRate" aria-label="Alternar ritmo da corrida">Ritmo 0,5×</button></div></details>');document.body.append(map);
// A short viewport needs a compact HUD, not smaller or unreachable controls.
// Keep the existing full minimap in tall windows and let the player expand it
// with native keyboard/touch disclosure in short windows.
const mapDisclosure=map.querySelector('details');
const compactMap=window.matchMedia('(max-height: 680px) and (min-width: 761px), (max-height: 740px) and (max-width: 760px)');
function updateMapDisclosure(){mapDisclosure.open=!compactMap.matches}
updateMapDisclosure();compactMap.addEventListener('change',updateMapDisclosure);
map.addEventListener('keydown',event=>{if(event.key==='Escape'&&compactMap.matches&&mapDisclosure.open){mapDisclosure.open=false;mapDisclosure.querySelector('summary').focus();event.stopPropagation()}});
document.addEventListener('DOMContentLoaded',()=>{
  const power=document.querySelector('.v2-power');
  if(!power)return;
  const placeMap=()=>map.style.setProperty('--map-compact-top',Math.ceil(power.getBoundingClientRect().bottom+8)+'px');
  new ResizeObserver(placeMap).observe(power);
  window.addEventListener('resize',placeMap,{passive:true});
  placeMap();
},{once:true});
const controls=document.createElement('nav');controls.className='camera-controls';ApexRender.attr(controls,'aria-label','Câmera da corrida');ApexRender.html(controls,'<button id="zoomOut" aria-label="Afastar câmera">−</button><output id="cameraZoom" aria-live="polite">5×</output><button id="zoomIn" aria-label="Aproximar câmera">+</button><button id="cameraMode" aria-pressed="true">◎ Seguir carro</button>');document.body.append(controls);
try{window.apexDaylight=localStorage.getItem('apex-visual-light')!=='night'}catch{window.apexDaylight=true}
function updateLight(){ApexRender.text($('lightMode'),window.apexDaylight?'☀ Dia':'☾ Noite');ApexRender.attr($('lightMode'),'aria-pressed',String(window.apexDaylight))}
$('lightMode').onclick=()=>{window.apexDaylight=!window.apexDaylight;try{localStorage.setItem('apex-visual-light',window.apexDaylight?'day':'night')}catch{}updateLight()};
updateLight();
// A static orthographic tilt is gentler than a rotating or shaking camera.
try{window.apexPseudo3D=localStorage.getItem('apex-visual-projection')!=='flat'}catch{window.apexPseudo3D=true}
function updateProjection(){ApexRender.text($('projectionMode'),window.apexPseudo3D?'◈ 2,5D':'▣ 2D');ApexRender.attr($('projectionMode'),'aria-pressed',String(window.apexPseudo3D))}
$('projectionMode').onclick=()=>{window.apexPseudo3D=!window.apexPseudo3D;try{localStorage.setItem('apex-visual-projection',window.apexPseudo3D?'depth':'flat')}catch{}updateProjection()};
updateProjection();
try{window.apexRaceSpeed=localStorage.getItem('apex-race-speed')==='normal'?1:0.5}catch{window.apexRaceSpeed=0.5}
function updatePace(){ApexRender.text($('motionRate'),window.apexRaceSpeed===1?'Ritmo 1×':'Ritmo 0,5×')}
$('motionRate').onclick=()=>{window.apexRaceSpeed=window.apexRaceSpeed===1?0.5:1;try{localStorage.setItem('apex-race-speed',window.apexRaceSpeed===1?'normal':'calm')}catch{}updatePace()};
updatePace();
const mini=$('raceMap'),mc=mini.getContext('2d');let zoom=s.idle?.settings.camera?.zoom||2.2,follow=s.idle?.settings.camera?.follow===true,cameraX=null,cameraY=null,lastFrame=performance.now(),lastCircuit=-1,mapCircuit=-1,mapBackground=null;
function updateControls(){ ApexRender.text($('mapCamera'),follow?'Ver pista inteira':'Seguir carro'); ApexRender.text($('cameraZoom'),(follow?zoom:1).toLocaleString('pt-BR',{maximumFractionDigits:1})+'×');ApexRender.text($('cameraMode'),follow?'◎ Seguir carro':'⌖ Pista inteira');ApexRender.attr($('cameraMode'),'aria-pressed',String(follow));ApexRender.prop($('zoomOut'),"disabled",follow&&zoom<=1.5);ApexRender.prop($('zoomIn'),"disabled",follow&&zoom>=6)}
function changeZoom(step){follow=true;zoom=Math.max(1.5,Math.min(6,zoom+step));if(s.idle){s.idle.settings.camera={zoom,follow};save()}updateControls()}
$('zoomOut').onclick=()=>changeZoom(-.5);$('zoomIn').onclick=()=>changeZoom(.5);$('mapCamera').onclick=$('cameraMode').onclick=()=>{follow=!follow;cameraX=null;if(s.idle){s.idle.settings.camera={zoom,follow};save()}updateControls()};
canvas.addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();changeZoom(e.deltaY<0?.5:-.5)},{passive:false});
// Non-modal side panels leave the live race and its controls usable.
const observeDrawer=()=>ApexRender.toggle(document.body,'race-panel-open',drawer.open);
new MutationObserver(observeDrawer).observe(drawer,{attributes:true,attributeFilter:['open']});observeDrawer();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.open&&!document.querySelector('dialog:modal')){drawer.close();menuToggle.focus()}});
let nextMapFrame=0;
mapDisclosure.addEventListener('toggle',()=>{nextMapFrame=0});
function minimap(now){
if(!mapDisclosure.open||document.hidden)return;
if(mapCircuit===s.circuit&&now<nextMapFrame)return;
nextMapFrame=now+66;
if(mapCircuit!==s.circuit){mapCircuit=s.circuit;mapBackground=document.createElement('canvas');mapBackground.width=440;mapBackground.height=260;const g=mapBackground.getContext('2d');g.lineJoin='round';g.lineCap='round';g.beginPath();layouts[s.circuit].points.forEach((v,i)=>{const p=CircuitMaps.toMap(layouts[s.circuit],{x:v[0],y:v[1]});i?g.lineTo(p.x*.44,p.y*260/580):g.moveTo(p.x*.44,p.y*260/580)});g.closePath();g.strokeStyle='#07161d';g.lineWidth=12;g.stroke();g.strokeStyle='#8da8a8';g.lineWidth=4;g.stroke();const p=CircuitMaps.toMap(layouts[s.circuit],position(0));g.fillStyle='#f4f7eb';g.fillRect(p.x*.44-3,p.y*260/580-3,6,6);
for(const [fraction,color] of [[1/3,'#67d8ff'],[2/3,'#ffc867']]){
  const marker=CircuitMaps.toMap(layouts[s.circuit],position(fraction));
  g.beginPath();g.arc(marker.x*.44,marker.y*260/580,5,0,Math.PI*2);
  g.fillStyle=color;g.fill();
}}
mc.clearRect(0,0,440,260);mc.drawImage(mapBackground,0,0);
const dot=(t,color,r)=>{const p=CircuitMaps.toMap(layouts[s.circuit],position(t));mc.beginPath();mc.arc(p.x*.44,p.y*260/580,r,0,Math.PI*2);mc.fillStyle=color;mc.fill()};
if(typeof TrafficView!=='undefined'){TrafficView.racers().filter(c=>c.id!=='player').forEach(c=>dot(c.distance,c.color,4))}else if(typeof race!=='undefined'&&race){race.rivals.forEach(r=>dot(race.elapsed/r.pace,r.color,4))}else{dot(s.progress*.94+.32,'#e17e60',4);dot(s.progress*1.02+.65,'#8baded',4)}
dot(s.progress,'#07171e',10);dot(s.progress,s.color||'#d4fc5a',7);ApexRender.text($('mapProgress'),'S'+Math.min(3,Math.floor(s.progress*3)+1)+' · '+Math.floor(s.progress*100)+'%');ApexRender.text($('mapLap'),'VOLTA '+(typeof race!=='undefined'&&race?Math.min(race.totalLaps||5,Math.floor(race.distance)+1):s.laps+1));
}
const worldDraw=draw;
let fittedKey="",fitted=null;
draw=function(){
const bounds=canvas.getBoundingClientRect(),w=bounds.width,h=bounds.height,dpr=Math.min(window.devicePixelRatio||1,2);if(!w||!h)return;
const pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
// Let the camera catch up after a slow frame instead of leaving the car off-screen.
const now=performance.now(),dt=Math.min(.5,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
const p=typeof TrafficView!=='undefined'?TrafficView.playerPosition():position(s.progress),ahead=position(s.progress+.008/layouts[s.circuit].scale),tx=follow?p.x*.8+ahead.x*.2:500,ty=follow?p.y*.8+ahead.y*.2:290;
if(cameraX===null||lastCircuit!==s.circuit){cameraX=tx;cameraY=ty;lastCircuit=s.circuit}else{const blend=1-Math.exp(-dt*8);cameraX+=(tx-cameraX)*blend;cameraY+=(ty-cameraY)*blend}
const tilt=window.apexPseudo3D ? .78 : 1;
const fitKey=[s.circuit,w,h,tilt].join(':');
if(!follow&&fittedKey!==fitKey&&typeof ApexCamera!=='undefined'){fitted=ApexCamera.fitProjected(layouts[s.circuit].points,{w:w<760?w:w-280,h:w<760?Math.max(120,h-200):h-110},tilt,.08);fittedKey=fitKey}
const scale=!follow&&fitted?fitted.scale:Math.min(w/1000,h/580)*(follow?(w<760?Math.max(zoom,2.6):zoom):1/layouts[s.circuit].scale);if(!follow&&fitted){cameraX=fitted.centerX;cameraY=fitted.centerY}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=window.apexDaylight?'#274632':'#0B0E24';ctx.fillRect(0,0,w,h);
const cameraLeft=(!follow&&w>=760?(w-280)*.5:w*.5)-cameraX*scale;
const cameraTop=h*(w<760?.435:.45)-cameraY*scale*tilt;
ctx.save();
ctx.setTransform(dpr*scale,0,0,dpr*scale*tilt,dpr*cameraLeft,dpr*cameraTop);
worldDraw();
ctx.restore();
const px=p.x*scale+cameraLeft,py=p.y*scale*tilt+cameraTop;
if(!follow&&s.running&&px>8&&px<w-8&&py>24&&py<h-10){
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.translate(px,py-10);
  ctx.beginPath();ctx.moveTo(-5,-6);ctx.lineTo(5,-6);ctx.lineTo(0,0);ctx.closePath();
  ctx.strokeStyle='#101629';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=boost>0?'#d9b8ff':'#ffbf49';ctx.fill();
  ctx.restore();
}
ctx.setTransform(1,0,0,1,0,0);minimap(now);
};updateControls();
})();

