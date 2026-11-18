(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:1}):'—';
const percent=n=>num(n*100)+'%';
const button=(label,action,id='',disabled=false)=>'<button data-action="'+action+'" data-id="'+esc(id)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
const division=s=>['Regional','Nacional','Continental','Internacional','Elite','Lendas'][s.cat||0];
const profile=id=>({potencia:'Retas',curvas:'Curvas',aderencia:'Aderência'}[id]||id||'Equilibrado');
function collectionIdentity(id){
 const D=root.LegendsData||(typeof require==='function'?require('../legends-data'):null),Vehicle=root.ApexVehicle||(typeof require==='function'?require('./vehicle-performance'):null),car=D?.cars.find(c=>c.id===id);if(!car)return null;
 const v=Vehicle.characteristics(id),labels={straight:'retas e aceleração',corners:'curvas',tyres:'conservação de pneus'},ordered=Object.entries(v.stats).sort((a,b)=>b[1]-a[1]);
 return{name:car.name,year:car.year,team:car.team,rarity:D.names[car.rarity],feature:car.feature,source:car.source,trait:'Ponto forte no jogo: '+labels[ordered[0][0]]+'.',caution:'Atenção no acerto: '+labels[ordered[ordered.length-1][0]]+'.'};
}
function affinityText(p){
 if(!p.affinityBonus)return 'Sem bônus de afinidade';
 return esc(p.affinityOrigin)+' · +'+num(p.affinityBonus*100)+' p.p. de afinidade · +'+num(p.effectiveAffinityBonus*100)+' p.p. efetivos com o limite de 40% da equipe';
}
function garage(s,options={}){
 const X=root.ApexV2,S=X.Shop,selected=root.Apex.equippedCar(s),p=X.performance(s,selected.id,options),driver=S.driver(s),engineer=S.engineer(s);
 const owned=[...new Set([...root.GarageState.init(s).owned,...S.init(s).inventory.cars])].filter(id=>S.get(id)?.historical);
 let html='<h2>Sua garagem</h2><div class="garage-hero"><canvas width="560" height="250" data-art="'+esc(selected.id)+'" aria-label="'+esc(selected.name)+' equipado"></canvas><div><p class="product-kicker">Conjunto na pista</p><h3>'+esc(selected.name)+'</h3><p>'+esc(driver?.name||'Piloto da Aurora')+' · Piloto<br>'+esc(engineer?.name||'Nenhum engenheiro selecionado')+' · Engenharia</p><p>'+esc(p.label||profile(p.profile))+' · '+esc(p.trackLabel)+' · '+(options.wet?'Chuva':'Pista seca')+'</p><p>'+affinityText(p)+'</p></div></div>';
 html+='<p class="product-help">Compare o conjunto para este circuito. A previsão usa seu piloto e componentes atuais. Pneus, estratégia e clima também mudam o resultado.</p><p class="product-help">A raridade indica a disponibilidade no gacha. Ela não mede importância histórica. Os atributos são uma adaptação para o jogo, sem comparar tempos reais de épocas diferentes.</p>';
 for(const id of owned){const car=S.get(id),v=X.performance(s,id,options),comparison=X.compare(s,id,options),active=id===selected.id;
 html+='<article class="v2-row garage-choice" '+(active?'aria-current="true"':'')+'><canvas width="180" height="110" data-art="'+esc(id)+'" aria-label="'+esc(car.name)+'"></canvas><div><h3>'+esc(car.name)+'</h3><p>'+esc(car.year||'')+' · '+esc(car.rarity)+' · '+esc(v.label||profile(v.profile))+'</p><div class="car-stat-lines">';
 for(const [key,label]of [['straight','Retas'],['corners','Curvas'],['tyres','Pneus']])html+='<label>'+label+' <progress max="100" value="'+esc(v.stats?.[key]||0)+'"></progress><b>'+num(v.stats?.[key])+'</b></label>';
 const identity=collectionIdentity(id);
 html+='</div><p>'+(!active?'Previsão '+(comparison.lapDelta<0?'−':'+')+num(Math.abs(comparison.lapDelta))+' s/volta · ':'')+'Janela de pneus '+percent(v.windowMult||1)+'</p><p>'+affinityText(v)+'</p>'+(identity?'<p>'+esc(identity.trait)+' '+esc(identity.caution)+'</p><details><summary>Identidade deste carro</summary><p>'+esc(identity.team)+' · '+esc(identity.year)+'. '+esc(identity.feature)+'</p><a href="'+esc(identity.source)+'" target="_blank" rel="noopener noreferrer">Consultar a referência histórica</a></details>':'')+'</div><div class="v2-actions">'+button(active?(s.journey?.marks?.carAction?'Equipado':'Confirmar na pista'):'Equipar','equipCar',id,active&&!!s.journey?.marks?.carAction)+'</div></article>';
 }
 return html;
}
function crew(s){
 const S=root.ApexV2.Shop,selected={pilotos:S.driver(s)?.id,engenheiros:S.engineer(s)?.id},roster=S.teamRoster(s);
 let html='<h2>Pilotos e engenharia</h2><p>Conquiste pilotos na Academia. Treine os contratados e combine suas especialidades com o carro.</p>'+button('Abrir Academia','academy');
 for(const role of ['pilotos','engenheiros']){
 html+='<h3>'+ (role==='pilotos'?'Pilotos contratados':'Engenheiros')+'</h3>';
 const people=roster.filter(p=>(p.role==='driver'||p.role==='pilotos'? 'pilotos':'engenheiros')===role&&p.owned);
 if(!people.length)html+='<p>'+ (role==='pilotos'?'Escolha seu próximo dossiê na Academia.':'Contrate um engenheiro para apoiar seu piloto.')+'</p>';
 for(const p of people){html+='<article class="v2-row"><div><h3>'+esc(p.name)+'</h3><p>'+esc(p.specialty||profile(p.profile))+' · Nível '+num(p.level||1)+' · '+num(p.xp||0)+' XP<br>Bônus da equipe +'+percent(p.bonus||0)+(p.nextXp?' · Próximo nível em '+num(Math.max(0,p.nextXp-p.xp))+' XP · próximo nível: +0,2 ponto percentual no bônus do piloto':' · Desenvolvimento máximo')+'</p></div><div class="v2-actions">'+button(selected[role]===p.id?'Equipado':'Selecionar','equipStaff',p.id,selected[role]===p.id)+'</div></article>'}
 if(role==='engenheiros')for(const p of S.catalog.items.filter(p=>p.category===role&&!roster.some(person=>person.shopId===p.id&&person.owned)))html+='<article class="v2-row"><div><h3>'+esc(p.name)+'</h3><p>Engenharia · +'+percent(p.effect.piPct)+'</p></div><div class="v2-actions">'+button('Contratar · '+num(S.priceInCR(p,s))+' CR','buy',p.id,!S.unlocked(s,p))+'</div></article>';
 }
 return html;
}
function journey(s){
 const J=root.ApexJourney,R=root.ApexV2.Ret,next=J.next(s),challenge=R.weeklyChallenge(s),pass=R.passProgress(s);
 const chapter=J.chapter(s);
 let html='<h2>A história da Aurora</h2><p>'+division(s)+' · etapa '+(s.stage+1)+'/12. '+esc(chapter.title)+'.</p><p>'+esc(chapter.text.replace('Rádio Aurora: ',''))+'</p><div class="career-horizons">'+J.horizons(s).map(h=>'<article><p class="product-kicker">'+esc(h.label)+'</p><h3>'+esc(h.title)+'</h3><p>'+esc(h.text)+'</p></article>').join('')+'</div>';
 if(next)html+='<div class="career-next"><p class="product-kicker">Seu próximo objetivo</p><h3>'+esc(next.title)+'</h3><p>'+esc(next.description)+'</p><progress max="'+esc(next.target)+'" value="'+esc(Math.min(next.target,next.progress))+'"></progress><p>'+num(next.progress)+' / '+num(next.target)+'</p>'+button(next.done?'Recolher recompensa':'Ir ao objetivo',next.done?'journeyClaim':'journeyGo',next.id,next.locked)+'</div>';
 html+='<details><summary>Seu percurso</summary>'+J.goals(s).map(g=>'<article class="v2-row"><div><h3>'+esc(g.title)+'</h3><p>'+esc(g.description)+' · '+num(g.progress)+'/'+num(g.target)+'</p></div><div class="v2-actions">'+button(g.claimed?'Concluído':'Recolher','journeyClaim',g.id,g.claimed||!g.done||g.locked)+'</div></article>').join('')+'</details>';
 html+='<div class="weekly-challenge"><p class="product-kicker">Desafio da semana</p><h3>'+esc(challenge.name)+'</h3><p>'+esc(challenge.description)+'</p><p>'+challenge.totalLaps+' voltas · O Lotus 49 inicial pode participar.'+(challenge.targetLapSeconds?' Meta: '+num(challenge.targetLapSeconds)+' s/volta.':'')+'</p><p>'+(challenge.completed?'Concluído nesta semana · repita para melhorar seu recorde':challenge.queued?'Agendado para a próxima largada':challenge.running?'Em disputa':'Primeira conclusão da semana: 2 fichas, 20 materiais, 150 XP do passe e um troféu')+'</p>'+button(challenge.completed?'Repetir desafio':'Preparar desafio','weeklyChallenge','',challenge.queued||challenge.running)+'</div>';
 html+=trophies(s);
 html+='<h3>Passe da temporada</h3><p>'+pass.tier+'/40 · '+num(pass.xp)+' / '+num(pass.nextXp)+' XP até a próxima recompensa</p><progress max="'+esc(pass.nextXp||1)+'" value="'+esc(Math.min(pass.xp,pass.nextXp||1))+'"></progress>'+button('Recolher disponíveis','passAll','',!pass.claimable?.length)+'<p>Jogue no seu ritmo. Carros, pilotos e recordes permanecem com você.</p>';
 return html;
}
function trophies(s){
 const R=root.ApexV2?.Ret||root.ApexRetention||(typeof require==='function'?require('./retention'):null),a=R.archive(s),rules=R.challengeRules;
 let html='<h3>Troféus da Aurora</h3><p>Memórias das suas conquistas, sem bônus de poder. Coleção, recordes e últimas 12 semanas permanecem nas novas temporadas.</p><div class="trophy-gallery">';
 for(const rule of rules){const trophy=a.trophies.find(t=>t.id===rule.id);html+='<figure class="'+(trophy?'earned':'locked')+'"><canvas width="160" height="140" data-art-trophy="'+esc(rule.id)+'" aria-label="Troféu '+esc(rule.name)+(trophy?' conquistado':' ainda não conquistado')+'"></canvas><figcaption><strong>'+esc(rule.name)+'</strong><span>'+(trophy?num(trophy.completions)+' semana(s) concluída(s)':'A conquistar')+'</span></figcaption></figure>'}
 html+='</div><details class="event-history"><summary>Recordes e semanas anteriores</summary>';
 if(!a.records.length&&!a.history.length)html+='<p>Complete um desafio semanal para registrar sua primeira conquista.</p>';
 for(const record of a.records.slice(0,8)){const rule=rules.find(x=>x.id===record.ruleId),circuit=root.Apex?.circuits?.[record.circuit]?.name||'Circuito '+(record.circuit+1),car=collectionIdentity(record.carId);html+='<article class="v2-row"><div><h4>'+esc(rule?.name||record.ruleId)+' · '+esc(circuit)+'</h4><p>'+num(record.score)+' s'+(record.ruleId==='qualifying'?'/volta':' de prova')+' · '+esc(car?.name||record.carId)+' · categoria '+(record.category+1)+'</p></div></article>'}
 for(const past of a.history){const rule=rules.find(x=>x.id===past.ruleId);html+='<article class="v2-row"><div><h4>'+esc(rule?.name||past.ruleId)+'</h4><p>Semana de '+esc(past.week)+' · '+(past.completed?'Concluído':'Em evolução')+' · '+num(past.attempts)+' tentativa(s)'+(past.bestTime?' · melhor prova '+num(past.bestTime)+' s':'')+'</p></div></article>'}
 return html+'</details>';
}
function drawTrophy(canvas,id){
 const ctx=canvas?.getContext?.('2d');if(!ctx)return false;
 const colors={technical:'#A66BFF',rain:'#70CAFF',tyres:'#35E6A8',heritage:'#FFCD75',qualifying:'#FFB627',endurance:'#FF86BF','coop-1':'#D59A6F','coop-2':'#C9D6F2','coop-3':'#FFCD75'},color=colors[id]||'#FFCD75',w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);ctx.save();ctx.scale(w/160,h/140);
 const glow=ctx.createRadialGradient(80,62,3,80,62,62);glow.addColorStop(0,color+'40');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.fillRect(0,0,160,140);
 ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(49,35);ctx.bezierCurveTo(17,25,30,75,58,71);ctx.moveTo(111,35);ctx.bezierCurveTo(143,25,130,75,102,71);ctx.stroke();
 const metal=ctx.createLinearGradient(46,0,114,0);metal.addColorStop(0,color);metal.addColorStop(.42,'#EEF0FF');metal.addColorStop(.7,color);metal.addColorStop(1,'#455078');ctx.fillStyle=metal;
 ctx.beginPath();ctx.moveTo(48,27);ctx.lineTo(112,27);ctx.quadraticCurveTo(111,81,87,86);ctx.lineTo(87,105);ctx.lineTo(110,112);ctx.lineTo(110,119);ctx.lineTo(50,119);ctx.lineTo(50,112);ctx.lineTo(73,105);ctx.lineTo(73,86);ctx.quadraticCurveTo(49,81,48,27);ctx.fill();
 ctx.fillStyle='#12163A';ctx.beginPath();ctx.arc(80,52,16,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2.2;
 if(id==='qualifying'){ctx.beginPath();ctx.arc(80,52,11,0,Math.PI*2);ctx.moveTo(80,43);ctx.lineTo(80,52);ctx.lineTo(86,56);ctx.stroke()}
 else if(id==='rain'){ctx.beginPath();ctx.moveTo(80,40);ctx.bezierCurveTo(62,59,76,68,85,61);ctx.bezierCurveTo(92,55,84,47,80,40);ctx.fill()}
 else if(id==='tyres'){ctx.beginPath();ctx.arc(80,52,10,0,Math.PI*2);ctx.arc(80,52,4,0,Math.PI*2);ctx.stroke();for(let a=0;a<6;a++){ctx.save();ctx.translate(80,52);ctx.rotate(a*Math.PI/3);ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(10,0);ctx.stroke();ctx.restore()}}
 else if(id==='technical'){ctx.beginPath();ctx.moveTo(72,62);ctx.bezierCurveTo(98,58,63,47,87,42);ctx.stroke()}
 else if(id==='endurance'){ctx.beginPath();ctx.ellipse(80,52,12,7,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(87,42);ctx.lineTo(93,48);ctx.lineTo(85,49);ctx.fill()}
 else {for(let a=0;a<5;a++){ctx.save();ctx.translate(80,52);ctx.rotate(a*Math.PI*2/5);ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(3,-3);ctx.lineTo(10,-3);ctx.lineTo(4,3);ctx.lineTo(6,11);ctx.lineTo(0,6);ctx.closePath();ctx.fill();ctx.restore()}}
 ctx.fillStyle='#2B3162';ctx.fillRect(45,120,70,8);ctx.fillStyle=color;ctx.fillRect(57,122,46,2);ctx.restore();return true;
}
function legacy(s){const T=root.ApexTalents,v=T.status(s);return '<h3>Legado da escuderia</h3><p>Escolha uma especialização permanente. '+(v.unlocked?'A seleção atravessa temporadas.':'Conquiste seu primeiro título para desbloquear.')+'</p>'+T.options.map(o=>'<article class="v2-row"><div><h3>'+esc(o.name)+'</h3><p>'+esc(o.description)+'</p></div><div class="v2-actions">'+button(v.selected===o.id?'Ativo':v.selected?'Trocar especialização':'Escolher','legacySelect',o.id,!v.unlocked||v.selected===o.id)+'</div></article>').join('')+'<p>'+esc(v.selected?'Você pode trocar gratuitamente; apenas uma especialização fica ativa.':'A primeira escolha é gratuita.')+'</p>'}
const api={garage,crew,journey,legacy,division,profile,collectionIdentity,trophies,drawTrophy};root.ApexProductView=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
