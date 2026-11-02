// Carreira solo: contratos, GP semanal, álbum, projetos e replay local.
const careerPanel=document.createElement('section');careerPanel.className='career-hub';menus.career.node.append(careerPanel);menus.career.title='Carreira da escuderia';
const careerNav=document.createElement('button');careerNav.dataset.menu='career';careerNav.innerHTML='✧<span>Carreira</span>';dock.append(careerNav);careerNav.onclick=()=>{openMenu('career');if(!dock.hidden)toggleDock()};
let careerTab='contracts',careerCache='',contractCar='',contractOffer='test';
Career.init(s);save();
function simulateGP(entry){
const r=Race.start(entry.duration,{compound:entry.tyres,pitLap:2,nextTyres:entry.tyres});r.autoStrategy=true;
r.rivals.forEach((v,i)=>v.pace=entry.duration*([.96,1.03,1.10][i]+-entry.division*.025+((entry.week+i)%3)*.005));
while(!r.done)Race.step(r,.1);
return {time:r.elapsed,place:Race.order(r).findIndex(v=>v.player)+1}
}
function carName(id){return A.cars.find(c=>c.id===id)?.name||Legends.get(id)?.name||id}
function dateLabel(ms){return new Date(ms).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function renderCareer(){
const d=Career.data(s),signature=JSON.stringify([careerTab,d,s.money,A.ownedCars(s),s.equippedCar,s.running,s.circuit,!!race,Math.floor(Date.now()/10000)]);
if(signature===careerCache)return;careerCache=signature;
const tabs=[['contracts','Contratos'],['weekly','GP semanal'],['album','Álbum'],['projects','Projetos'],['stats','Progresso']];
let html='<p class="eyebrow">CARREIRA DA ESCUDERIA</p><nav class="career-tabs" aria-label="Seções da carreira">'+tabs.map(([id,label])=>'<button data-career-tab="'+id+'" aria-pressed="'+(careerTab===id)+'">'+label+'</button>').join('')+'</nav>';
if(careerTab==='contracts'){
const options=A.ownedCars(s).filter(id=>id!==A.equippedCar(s).id&&Career.available(s,id));
if(!options.includes(contractCar))contractCar=options[0]||'';
html+='<h2>Carros parados também trabalham</h2><p class="muted">Até três contratos simultâneos. O carro fica reservado até recolher a recompensa. O tempo continua com o jogo fechado.</p>';
html+='<div class="career-form"><label>Carro<select id="contractCar">'+options.map(id=>'<option value="'+id+'" '+(id===contractCar?'selected':'')+'>'+carName(id)+'</option>').join('')+'</select></label><label>Contrato<select id="contractOffer">'+Object.entries(Career.offers).map(([id,o])=>'<option value="'+id+'" '+(id===contractOffer?'selected':'')+'>'+o.name+' · '+o.ms/60000+' min · '+fmt(o.credits)+' CR + '+o.parts+' peças</option>').join('')+'</select></label><button data-career-action="contract" '+(!options.length||d.contracts.length>=3?'disabled':'')+'>Enviar carro</button></div>';
if(!options.length)html+='<p>Invoque ou construa outro carro para enviar aos contratos.</p>';
html+=d.contracts.map(c=>'<article class="career-card"><h3>'+carName(c.car)+'</h3><p>'+Career.offers[c.offer].name+' · '+(c.end>Date.now()?'Disponível em '+dateLabel(c.end):'Recompensa pronta')+'</p><button data-claim="'+c.car+'" '+(c.end>Date.now()?'disabled':'')+'>Recolher '+fmt(Career.offers[c.offer].credits)+' CR + '+Career.offers[c.offer].parts+' peças</button></article>').join('');
}
if(careerTab==='projects'){
html+='<h2>Engenharia com destino certo</h2><p>Escolha um projeto. Cada corrida completa de cinco voltas rende 3 peças do projeto, ou 5 por vitória. Treino livre não rende peças. Se já possui o modelo, homologue o projeto para completar a meta de engenharia. Contratos rendem peças do carro enviado; o Aurora usa o projeto escolhido.</p><label>Projeto ativo<select id="projectTarget">'+Career.ids.map(id=>'<option value="'+id+'" '+(d.target===id?'selected':'')+'>'+carName(id)+'</option>').join('')+'</select></label><div class="career-grid">';
html+=Career.ids.map(id=>{const cost=Career.projects[id],have=d.materials[id]||0,owned=A.ownedCars(s).includes(id),complete=d.completed.includes(id);return '<article class="career-card"><h3>'+carName(id)+'</h3><p>'+have+' / '+cost+' peças · '+fmt(cost*20)+' CR</p><progress max="'+cost+'" value="'+Math.min(cost,have)+'"></progress><button data-build="'+id+'" '+(complete||have<cost||s.money<cost*20?'disabled':'')+'>'+(complete?'Projeto concluído':owned?'Homologar projeto':'Construir carro')+'</button></article>'}).join('')+'</div>';
}
if(careerTab==='album'){
html+='<h2>Seu álbum e suas pinturas</h2><p>'+(A.ownedCars(s).length+(s.heritage?.owned.length||0))+' / '+(A.cars.length+LegendsData.cars.length)+' modelos descobertos. Pinturas são cosméticas e não alteram o ritmo. Pause antes de aplicar.</p><div class="career-grid">';
html+=[...A.cars,...LegendsData.cars.map(c=>({...c,rarity:LegendsData.names[c.rarity]}))].map(c=>'<article class="career-card" style="--career-color:'+c.color+'"><h3>'+c.name+'</h3><p>'+c.rarity+' · '+((A.ownedCars(s).includes(c.id)||s.heritage?.owned.includes(c.id))?'Colecionado ✓':'Ainda não descoberto')+'</p></article>').join('')+'</div><h3>Metas da coleção</h3><div class="career-grid">';
html+=Career.paints.map(p=>{const ready=Career.canPaint(s,A,p.id),value=p.metric?Career.metric(s,A,p.metric):1;const labels={cars:'carros colecionados',races:'corridas concluídas',contracts:'contratos recolhidos',gps:'GPs semanais concluídos',built:'projetos concluídos'};return '<article class="career-card" style="--career-color:'+(p.color||A.equippedCar(s).color)+'"><h3>'+p.name+'</h3><p>'+(p.metric?value+'/'+p.goal+' '+labels[p.metric]:'Disponível desde o início')+'</p><button data-paint="'+p.id+'" '+(!ready||s.running||race?'disabled':'')+'>'+(d.paint===p.id?'Pintura selecionada':ready?'Aplicar pintura':'Bloqueada')+'</button></article>'}).join('')+'</div>';
}
if(careerTab==='weekly'){
const w=Career.weekly(),entry=d.entry,done=d.history.find(h=>h.week===w.week),rank=Legends.get(A.equippedCar(s).id)?.rarity+1||A.cars.indexOf(A.equippedCar(s));
html+='<h2>'+w.rule.name+'</h2><p>'+w.rule.text+'</p><p>Semana até '+dateLabel(w.ends)+' (Brasília). Divisão: '+['Bronze','Prata','Ouro'][Math.min(2,Math.floor(d.stats.gps/3))]+'. Avance de divisão a cada três GPs concluídos.</p><p class="career-notice">Competição solo contra três adversários simulados. Não é ranking online. Uma inscrição por semana. O resultado fica pronto após 90 segundos, mesmo se você fechar o jogo, e é calculado ao retornar.</p>';
html+='<p>Circuito: '+A.circuits[s.circuit].name+' · Carro: '+A.equippedCar(s).name+' · Previsão: '+(w.rule.id==='stock'?A.circuits[s.circuit].time*1.08:A.duration(s)).toFixed(2)+' s/volta antes do desgaste. Preparação capturada na inscrição.</p>';
html+='<p>Prêmios: 1º 6.000 / 2º 4.000 / 3º 2.500 / 4º 1.500 CR × nível da divisão, mais 20 peças do projeto ativo na conclusão.</p><button data-career-action="weekly" '+(entry||done||s.running||race||rank>w.rule.maxRank||!Career.available(s,A.equippedCar(s).id)?'disabled':'')+'>'+(entry?'Inscrito · resultado em '+dateLabel(entry.end):done?'Participação desta semana concluída':'Inscrever e deixar a equipe correr')+'</button>';
if(rank>w.rule.maxRank)html+='<p>Equipe um carro comum ou raro no menu de invocação para este regulamento.</p>';
html+='<h3>Resultados e replay</h3>'+d.history.map((h,i)=>'<article class="career-card"><h3>P'+h.place+' · '+carName(h.car)+'</h3><p>'+h.time.toFixed(2)+' s · '+Career.rules.find(r=>r.id===h.rule).name+' · '+['Bronze','Prata','Ouro'][h.division]+'</p><button data-replay="'+i+'">Assistir replay da simulação</button></article>').join('');
}
if(careerTab==='stats')html+='<h2>Progresso local da escuderia</h2><p>Dados deste save, sem envio para servidor.</p><div class="career-grid">'+[['Corridas concluídas',d.stats.races],['Vitórias',d.stats.wins],['Contratos recolhidos',d.stats.contracts],['GPs semanais',d.stats.gps],['Projetos concluídos',d.stats.built],['Dias ativos registrados',d.days.length]].map(([label,value])=>'<article class="career-card"><h3>'+value+'</h3><p>'+label+'</p></article>').join('')+'</div><p>Para avaliar retenção de todos os jogadores e comparar grupos, será necessário um serviço de contas e métricas. Estes números mostram apenas a sua carreira.</p>';
careerPanel.innerHTML=html
}
careerPanel.onclick=e=>{
const tab=e.target.closest('[data-career-tab]');if(tab){careerTab=tab.dataset.careerTab;careerCache='';renderCareer();return}
let ok=false,message='';const b=e.target.closest('button');if(!b||b.disabled)return;
if(b.dataset.careerAction==='contract'){ok=Career.startContract(s,A,contractCar,contractOffer);message='Carro enviado ao contrato.'}
if(b.dataset.claim){ok=Career.claimContract(s,b.dataset.claim);message='Contrato recolhido. Créditos e peças adicionados.'}
if(b.dataset.build){ok=Career.build(s,A,b.dataset.build);message='Projeto concluído e homologado na carreira.'}
if(b.dataset.paint){ok=Career.paint(s,A,b.dataset.paint);if(ok)syncGarage();message='Pintura aplicada.'}
if(b.dataset.careerAction==='weekly'){ok=!race&&Career.enter(s,A);message='Equipe inscrita. O resultado ficará pronto em 90 segundos.'}
if(b.dataset.replay!==undefined){showCareerReplay(Career.data(s).history[+b.dataset.replay]);return}
if(ok){save();radio(message);render()}
};
careerPanel.onchange=e=>{if(e.target.id==='contractCar')contractCar=e.target.value;if(e.target.id==='contractOffer')contractOffer=e.target.value;if(e.target.id==='projectTarget'){Career.setTarget(s,e.target.value);save();render()}};
const careerRender=render;render=function(){careerRender();renderCareer()};
const careerEquip=A.equipCar;A.equipCar=function(state,id){if(!Career.available(state,id))return false;const ok=careerEquip(state,id);if(ok){const p=Career.paints.find(p=>p.id===Career.data(state).paint);if(p&&p.color&&Career.canPaint(state,A,p.id))state.color=p.color}return ok};
const careerPrepare=prepareRace;prepareRace=function(){if(!Career.available(s,A.equippedCar(s).id)){radio('Este carro está reservado para o GP semanal. Equipe outro carro.');return}careerPrepare()};
raceButton.onclick=prepareRace;$('againRace').onclick=prepareRace;
function settleCareer(){if(Career.settle(s,simulateGP)){save();radio('GP semanal concluído! Veja resultado e replay na Carreira.');render()}}
settleCareer();setInterval(settleCareer,1000);
const replayDialog=document.createElement('dialog');replayDialog.className='race-result career-replay';replayDialog.innerHTML='<h2>Replay do GP semanal</h2><p id="careerReplayLabel"></p><canvas id="careerReplayCanvas" width="800" height="360" aria-label="Replay do GP simulado"></canvas><label>Velocidade<select id="careerReplaySpeed"><option value="1">1×</option><option value="4">4×</option><option value="8" selected>8×</option></select></label><button id="careerReplayPause">Pausar</button><button id="careerReplayClose">Fechar replay</button>';document.body.append(replayDialog);
let replayFrame=0,replayState=null,replayElapsed=0,replayLast=0,replayPaused=false;
function stopCareerReplay(){cancelAnimationFrame(replayFrame);replayState=null}
replayDialog.addEventListener('close',stopCareerReplay);$('careerReplayClose').onclick=()=>replayDialog.close();$('careerReplayPause').onclick=()=>{replayPaused=!replayPaused;$('careerReplayPause').textContent=replayPaused?'Continuar':'Pausar'};
function showCareerReplay(entry){if(!entry)return;stopCareerReplay();replayState=Race.start(entry.duration,{compound:entry.tyres,pitLap:2,nextTyres:entry.tyres});replayState.autoStrategy=true;replayState.rivals.forEach((v,i)=>v.pace=entry.duration*([.96,1.03,1.10][i]+-entry.division*.025+((entry.week+i)%3)*.005));replayElapsed=0;replayLast=performance.now();replayPaused=false;$('careerReplayPause').textContent='Pausar';$('careerReplayLabel').textContent=carName(entry.car)+' · resultado P'+entry.place+' · '+entry.time.toFixed(2)+' s';replayDialog.showModal();
const canvas=$('careerReplayCanvas'),g=canvas.getContext('2d');
function frame(now){if(!replayState)return;const dt=Math.min(.15,(now-replayLast)/1000);replayLast=now;if(!replayPaused){Race.step(replayState,dt*+$('careerReplaySpeed').value);replayElapsed=replayState.elapsed}
g.fillStyle='#0c1824';g.fillRect(0,0,800,360);g.strokeStyle='#53636d';g.lineWidth=45;g.beginPath();g.ellipse(400,175,300,110,0,0,Math.PI*2);g.stroke();
const racers=[{distance:replayState.distance,color:(A.cars.find(c=>c.id===entry.car)||Legends.get(entry.car)).color},...replayState.rivals.map(v=>({distance:Math.min(5,replayElapsed/v.pace),color:v.color}))];
racers.forEach(v=>{const a=(v.distance%1)*Math.PI*2;CarArt.draw(g,{x:400+300*Math.cos(a),y:175+110*Math.sin(a),a:a+Math.PI/2,scale:.65,color:v.color,id:entry.car})});g.fillStyle='#fff';g.font='bold 19px Arial';g.textAlign='center';g.fillText(replayState.done?'BANDEIRADA':replayState.countdown>0?'LARGADA':'VOLTA '+Math.min(5,Math.floor(replayState.distance)+1)+' / 5',400,160);g.fillText(replayElapsed.toFixed(1)+' s',400,190);replayFrame=requestAnimationFrame(frame)}replayFrame=requestAnimationFrame(frame)}
render();
