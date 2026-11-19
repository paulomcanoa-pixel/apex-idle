const A=Apex,$=id=>document.getElementById(id),key='apex-idle-v2';let s=A.initial(),boost=0,cooldown=0,storageOk=true,observedSave=null,saveRecoveryPending=false,returnSummary={seconds:0,amount:0};
const tabLock=ApexTabs.acquireTabLock();
window.ApexAccess={canWrite:()=>tabLock.isOwner&&!saveRecoveryPending};
const saveManager=ApexSave.createManager({storage:localStorage,validate:A.validate,canWrite:()=>ApexAccess.canWrite(),onError:error=>console.error('Falha de integridade do save:',error.message)});
const fmt=n=>GameFormat.format(n,s.idle?.settings.notation);
function radio(message){ApexRender.text($('log'),'Engenheiro: '+message)}
try{const stored=saveManager.read();observedSave=stored.raw;const raw=stored.data?JSON.stringify(stored.data):observedSave||localStorage.getItem('apex-idle-v1');if(stored.error)saveRecoveryPending=true;if(stored.recovered){localStorage.setItem('apex_save_backup',stored.original);radio('Save principal danificado. Recuperado o backup anterior; original preservado.');}if(raw){const result=GameSave.load(raw,A.validate);if(result.data&&!stored.error){s=result.data;const elapsed=Math.min(28800,Math.max(0,(Date.now()-s.savedAt)/1000)),before=s.money;A.advance(s,elapsed);returnSummary={seconds:elapsed,amount:s.money-before};if(s.money>before)radio('Bem-vindo de volta! '+fmt(s.money-before)+' créditos ganhos na pista.')}else{localStorage.setItem('apex_save_backup',raw);saveRecoveryPending=true;radio(result.error)}}}catch(error){storageOk=false;saveRecoveryPending=true;console.error('Falha ao carregar save:',error.message)}

function save(){if(!ApexAccess.canWrite())return false;try{if(localStorage.getItem(key)!==observedSave){s.running=false;if(!document.getElementById('saveConflict')){const notice=document.createElement('button');notice.id='saveConflict';notice.style.cssText='position:fixed;bottom:110px;left:10%;width:80%;z-index:9999;padding:18px;background:#ffd36b;color:#12212a';ApexRender.text(notice,'Outra aba atualizou seu progresso. Clique para recarregar esta aba.');notice.onclick=()=>location.reload();document.body.append(notice)}return}const result=saveManager.saveNow(s,{reason:'ação do jogador',expected:observedSave});if(!result.ok)throw Error('Não foi possível confirmar a gravação: '+result.reason);observedSave=result.payload;storageOk=true;ApexRender.text($('saveStatus'),'✓ Progresso salvo');return true}catch(error){console.error('Falha ao salvar progresso:',error);storageOk=false;ApexRender.text($('saveStatus'),'Armazenamento indisponível · exporte seu save');return false}}
function render(){if(typeof NightView!=='undefined'){ApexRender.prop($('boost'),"disabled",!s.running||cooldown>0||race?.countdown>0||race?.pitRemaining>0);return}const d=A.duration(s),r=A.reward(s);ApexRender.text($('money'),fmt(s.money)+' CR');ApexRender.text($('income'),`+${fmt(r)} CR / volta · ~${fmt(r/d*60)} CR / min`);ApexRender.text($('laps'),fmt(s.laps));ApexRender.text($('power'),fmt(100+s.levels.slice(0,3).reduce((a,b)=>a+b,0)*12)+' PI');ApexRender.text($('pace'),CircuitMaps.time(d)+' / volta');ApexRender.text($('rep'),fmt(s.rep)+' XP');const next=A.circuits.find(c=>c.rep>s.rep);ApexRender.text($('goal'),next?`Próximo circuito em ${next.rep-s.rep} XP`:'Todos os circuitos liberados');ApexRender.text($('circuitName'),A.circuits[s.circuit].name);if(document.getElementById('circuitFacts')){const c=A.circuits[s.circuit];ApexRender.html($('circuitFacts'),`<span>${c.km.toFixed(3)} KM</span><span>REF. ${c.reference}</span><a href="${c.source}" target="_blank" rel="noopener" title="${c.driver} · ${c.year} · referência publicada pela F1">↗</a>`);ApexRender.text($('lapClock'),CircuitMaps.time(s.progress*d))}ApexRender.text($('status'),s.running?'NA PISTA':'AGUARDANDO LARGADA');ApexRender.text($('toggle'),s.running?'Pausar corrida':'Iniciar corrida');$('progress').style.width=s.progress*100+'%';ApexRender.text($('laplabel'),`VOLTA ${s.laps+1} · ${Math.floor(s.progress*100)}%`);ApexRender.text($('speed'),s.running?Math.round(A.circuits[s.circuit].km/d*3600*(1+.16*Math.sin(s.progress*6.28)))+' KM/H':'BOX');ApexRender.prop($('boost'),"disabled",!s.running||cooldown>0);ApexRender.text($('boost'),boost>0?'ERS ativo ⚡':cooldown>0?`ERS em ${Math.ceil(cooldown)} s`:'Ativar ERS ⚡');
document.querySelectorAll('[data-upgrade]').forEach(b=>{const i=+b.dataset.upgrade;ApexRender.prop(b,"disabled",s.money<A.cost(s,i)||s.levels[i]>=100);ApexRender.html(b,`<span>${s.levels[i]>=100?'Máximo':'Melhorar ↗'}</span><span>${fmt(A.cost(s,i))} CR</span>`);$('level'+i).textContent='NÍVEL '+s.levels[i]});document.querySelectorAll('[data-circuit]').forEach(b=>{const i=+b.dataset.circuit;ApexRender.prop(b,"disabled",s.rep<A.circuits[i].rep);ApexRender.toggle(b,'selected',s.circuit===i)})}
ApexRender.html($('upgrades'),A.parts.map((p,i)=>`<article class="upgrade"><div class="title">${p.name}<span id="level${i}"></span></div><p>${p.desc}</p><button data-upgrade="${i}"></button></article>`).join(''));ApexRender.html($('circuits'),A.circuits.map((c,i)=>`<button data-circuit="${i}">${CircuitMaps.thumbnail(c)}<b>${c.name}</b><small>${c.region} · ${c.km.toFixed(3)} km</small><small>${c.rep?c.rep+' XP':'LIVRE'} · ×${c.mult}</small></button>`).join(''));
document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{const i=+b.dataset.upgrade;if(A.buy(s,i)){radio(A.parts[i].name+' melhorada. Vamos buscar mais ritmo!');save();render()}});document.querySelectorAll('[data-circuit]').forEach(b=>b.onclick=()=>{const i=+b.dataset.circuit;if(s.rep>=A.circuits[i].rep){s.circuit=i;s.progress=0;radio('Equipe transferida para '+A.circuits[i].name+'.');save();render()}});
$('toggle').onclick=()=>{s.running=!s.running;radio(s.running?'Sinal verde. A corrida segue automaticamente!':'Carro nos boxes. Corrida pausada.');save();render()};$('boost').onclick=()=>{if(s.running&&cooldown<=0){boost=5;cooldown=30;radio('Energia liberada! Ritmo +8% por 5 segundos.');render()}};
function restoreSave(candidate,backupKey){
  if(!ApexAccess.canWrite())return false;
  try {
    if(localStorage.getItem(key)!==observedSave)return false;
    localStorage.setItem(backupKey,JSON.stringify(GameSave.snapshot(s)));
    const result=saveManager.saveNow(candidate,{reason:'restauração',expected:observedSave});
    if(!result.ok)return false;
    observedSave=result.payload;
  } catch {
    return false;
  }
  if(typeof NightView!=='undefined')NightView.beforeRestore();
  s=candidate;
  saveRecoveryPending=false;
  boost=0;
  cooldown=0;
  storageOk=true;
  ApexRender.text($('saveStatus'),'✓ Progresso salvo');
  return true;
}
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(GameSave.snapshot(s),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='apex-idle-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error();const data=GameSave.decode(await file.text());if(!A.validate(data))throw Error();if(!await SaveConfirmation.ask('Substituir o progresso atual pelo save importado?'))return;if(!restoreSave(data,'apex_before_import')){radio('Não foi possível gravar o save. Seu progresso atual foi mantido.');return}ApexIdleUI.settings();render();radio('Progresso importado com sucesso.')}catch{radio('Arquivo inválido. Seu progresso atual foi mantido.')}finally{ApexRender.prop(e.target,"value",'')}};
const canvas=$('track'),ctx=canvas.getContext('2d');
const layouts=A.circuits.map(c=>CircuitMaps.world(c));
function position(t){return CircuitMaps.position(layouts[s.circuit],t)}
function path(){ctx.beginPath();layouts[s.circuit].points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath()}
function drawCar(t,color){const p=position(t),player=color==='#d4fc5a'||color===s.color;CarArt.draw(ctx,{x:p.x,y:p.y,a:p.a,scale:.17,id:player?A.equippedCar(s).id:'vento',color,number:player?'01':'02',depth:window.apexPseudo3D===true})}
const worldPaths=layouts.map(l=>{const p=new Path2D();l.points.forEach((v,i)=>i?p.lineTo(...v):p.moveTo(...v));p.closePath();return p});
const bridges=layouts.map((l,index)=>{if(A.circuits[index].id!=='jp-1962')return[];const out=[],pts=l.points;for(let i=0;i<pts.length;i++)for(let j=i+3;j<pts.length-1;j++){const a=pts[i],b=pts[(i+1)%pts.length],u=pts[j],v=pts[(j+1)%pts.length],dx=b[0]-a[0],dy=b[1]-a[1],ex=v[0]-u[0],ey=v[1]-u[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-8)continue;const t=((u[0]-a[0])*ey-(u[1]-a[1])*ex)/den,q=((u[0]-a[0])*dy-(u[1]-a[1])*dx)/den;if(t>0&&t<1&&q>0&&q<1)out.push({x:a[0]+t*dx,y:a[1]+t*dy,a:Math.atan2(dy,dx)})}return out});
function drawTrackEnvironment(ctx,tr,daylight,wet){
// Draw vectors at camera resolution rather than enlarging a road painted into a small bitmap.
const x0=-tr.e/tr.a,y0=-tr.f/tr.d,w=canvas.width/tr.a,h=canvas.height/tr.d;
ctx.fillStyle={grass:'#0B0E24',coast:'#0B0E24',desert:'#0B0E24',night:'#0B0E24'}[A.circuits[s.circuit].terrain];ctx.fillRect(x0,y0,w,h);
const circuit=A.circuits[s.circuit];
const sceneryCircuit=daylight&&circuit.terrain==='night'?{...circuit,terrain:'grass'}:circuit;
if(typeof CircuitScenery!=='undefined')CircuitScenery.draw(ctx,sceneryCircuit,layouts[s.circuit],{x:x0,y:y0,w,h});
if(!daylight){ctx.fillStyle='#060919aa';ctx.fillRect(x0,y0,w,h);if(typeof NightView!=='undefined')NightView.lighting(ctx,{x:x0,y:y0,w,h});}ctx.lineJoin='round';ctx.lineCap='round';
const roadScale=s.version===2?Math.max(1,6/(44*Math.abs(tr.a)/(canvas.apexRenderDpr||window.devicePixelRatio||1))):1;for(const [width,color,dash] of [[64,daylight?'#233a3255':'#05071b88',[]],[56,daylight?'#64746c':'#202750',[]],[50,'#EEF0FF',[]],[50,'#e04b46',[5,7]],[44,daylight?'#34464a':'#11172e',[]],[40,wet?(daylight?'#344956':'#263951'):daylight?'#3e494d':'#1d2541',[]],
[29,wet?'#99c7e21b':daylight?'#28303541':'#0f152d71',[]],
[.8,daylight?'#eef2de69':'#c7d6ff72',[3,9]]]){ctx.lineWidth=width*roadScale;ctx.lineCap=width===50?'butt':'round';ctx.strokeStyle=color;ctx.setLineDash(dash.map(v=>v*roadScale));ctx.stroke(worldPaths[s.circuit])}ctx.setLineDash([]);
if(wet&&s.idle?.settings?.effects!=='off'){
  ctx.save();
  ctx.lineWidth=1.2*roadScale;
  for(let i=0;i<18;i++){
    const patch=position((i+.41)/18);
    if(patch.x<x0-26||patch.x>x0+w+26||patch.y<y0-26||patch.y>y0+h+26)continue;
    ctx.save();
    ctx.translate(patch.x,patch.y);
    ctx.rotate(patch.a);
    const reflection=ctx.createLinearGradient(-19,0,19,0);
    reflection.addColorStop(0,'#bcdeff00');
    reflection.addColorStop(.5,daylight?'#d2eaff42':'#90c4ff8a');
    reflection.addColorStop(1,'#bcdeff00');
    ctx.strokeStyle=reflection;
    ctx.beginPath();
    for(const offset of [-12,-8,8,12]){
      ctx.moveTo(-18,offset*roadScale);
      ctx.lineTo(18,offset*roadScale);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

for(const p of bridges[s.circuit]){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillStyle='#aebdb8';ctx.fillRect(-30,-25,60,50);ctx.shadowBlur=0;ctx.fillStyle='#33444b';ctx.fillRect(-32,-22,64,44);ctx.restore()}
// Grid markings are painted on the existing track and never affect placement.
const p=position(0);
ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);
for(let x=0;x<2;x++)for(let y=0;y<20;y++){
  ctx.fillStyle=(x+y)%2?'#f3f4eb':'#101624';
  ctx.fillRect(x*2-2,(y*2-20)*roadScale,2,2*roadScale);
}
ctx.restore();
for(let row=0;row<6;row++){
  const slot=position(1-(row+1)*.003/layouts[s.circuit].scale);
  ctx.save();ctx.translate(slot.x,slot.y);ctx.rotate(slot.a);
  ctx.strokeStyle=daylight?'#f7f7e887':'#a7bce894';ctx.lineWidth=.85;
  const offset=(row%2?7:-7)*roadScale;
  ctx.beginPath();ctx.moveTo(-4,offset-4);ctx.lineTo(4,offset-4);
  ctx.lineTo(4,offset+4);ctx.lineTo(-4,offset+4);ctx.stroke();
  ctx.restore();
}

}
let environmentLayer=null,environmentKey='',previousEnvironmentKey='';
function draw(){
  const tr=ctx.getTransform();
  const daylight=window.apexDaylight!==false;
  const wet=window.NightView?.wetTrack===true;
  const key=[s.circuit,s.version,canvas.width,canvas.height,tr.a,tr.d,tr.e,tr.f,
    window.devicePixelRatio,daylight,wet,s.idle?.settings?.effects,window.apexPseudo3D,!!window.NightView,!!window.CircuitScenery].join(':');

  // A fixed camera can reuse the ground, lights, asphalt and grid as one image.
  // Wait for a repeated transform so a moving camera keeps drawing directly.
  if(key===environmentKey){
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(environmentLayer,0,0);
    ctx.restore();
  }else if(key===previousEnvironmentKey){
    environmentLayer=environmentLayer||document.createElement('canvas');
    environmentLayer.width=canvas.width;
    environmentLayer.height=canvas.height;
    const layer=environmentLayer.getContext('2d');
    layer.setTransform(tr.a,0,0,tr.d,tr.e,tr.f);
    drawTrackEnvironment(layer,tr,daylight,wet);
    environmentKey=key;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(environmentLayer,0,0);
    ctx.restore();
  }else{
    drawTrackEnvironment(ctx,tr,daylight,wet);
  }
  previousEnvironmentKey=key;
drawCar(s.progress*.94+.32,'#e17e60');drawCar(s.progress*1.02+.65,'#8baded');drawCar(s.progress,'#d4fc5a');
}

let last=performance.now(),paint=0;function frame(now){if(!ApexAccess.canWrite()){last=now;requestAnimationFrame(frame);return}const dt=Math.max(0,(now-last)/1000);last=now;const boosted=Math.min(dt,boost)*.08;const pace=window.apexRaceSpeed??0.5;const raceDt=dt*pace,raceBoost=boosted*pace;const laps=(typeof advanceRace==='function'?advanceRace(raceDt,raceBoost):A.advance(s,raceDt+raceBoost));boost=Math.max(0,boost-dt);cooldown=Math.max(0,cooldown-dt);if(laps)radio(`Boa passagem! +${fmt(laps*A.reward(s))} CR. Continue investindo na oficina.`);draw();if(now-paint>150){render();paint=now}requestAnimationFrame(frame)}
render();requestAnimationFrame(frame);saveManager.installAutosave(()=>s,{save});window.addEventListener('pagehide',()=>setTimeout(()=>tabLock.release(),0));window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});if(!storageOk)ApexRender.text($('saveStatus'),'Exporte seu save para garantir o progresso');





tabLock.ready.then(owner=>{if(owner){save();return}s.running=false;const panel=document.createElement('dialog');panel.className='idle-dialog';ApexRender.attr(panel,'aria-label','Jogo aberto em outra aba');const title=document.createElement('h2');ApexRender.text(title,'Jogo aberto em outra aba');const message=document.createElement('p');ApexRender.text(message,'Esta aba está em modo leitura e não salva nem envia progresso. Feche a outra aba e recarregue esta para jogar aqui.');const reload=document.createElement('button');ApexRender.text(reload,'Recarregar esta aba');reload.onclick=()=>location.reload();panel.append(title,message,reload);document.body.append(panel);panel.addEventListener('cancel',e=>e.preventDefault());panel.showModal()});
