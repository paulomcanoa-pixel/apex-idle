(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:1}):'—';
const percent=n=>num(n*100)+'%';
const button=(label,action,id='',disabled=false)=>'<button data-action="'+action+'" data-id="'+esc(id)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
const division=s=>['Regional','Nacional','Continental','Internacional','Elite','Lendas'][s.cat||0];
const profile=id=>({potencia:'Retas',curvas:'Curvas',aderencia:'Aderência'}[id]||id||'Equilibrado');
function garage(s){
 const X=root.ApexV2,S=X.Shop,selected=root.Apex.equippedCar(s),p=X.performance(s,selected.id),driver=S.driver(s),engineer=S.engineer(s);
 const owned=[...new Set([...root.GarageState.init(s).owned,...S.init(s).inventory.cars])].filter(id=>S.get(id)?.historical);
 let html='<h2>Sua garagem</h2><div class="garage-hero"><canvas width="560" height="250" data-art="'+esc(selected.id)+'" aria-label="'+esc(selected.name)+' equipado"></canvas><div><p class="product-kicker">Conjunto na pista</p><h3>'+esc(selected.name)+'</h3><p>'+esc(driver?.name||'Piloto da Aurora')+' · Piloto<br>'+esc(engineer?.name||'Nenhum engenheiro selecionado')+' · Engenharia</p><p>'+esc(p.label||profile(p.profile))+' · '+(p.synergy?'Afinidade ativa':'Sem bônus de afinidade')+'</p></div></div>';
 html+='<p class="product-help">Compare o conjunto para este circuito. A previsão usa seu piloto e componentes atuais. Pneus, estratégia e clima também mudam o resultado.</p>';
 for(const id of owned){const car=S.get(id),v=X.performance(s,id),comparison=X.compare(s,id),active=id===selected.id;
 html+='<article class="v2-row garage-choice" '+(active?'aria-current="true"':'')+'><canvas width="180" height="110" data-art="'+esc(id)+'" aria-label="'+esc(car.name)+'"></canvas><div><h3>'+esc(car.name)+'</h3><p>'+esc(car.year||'')+' · '+esc(car.rarity)+' · '+esc(v.label||profile(v.profile))+'</p><div class="car-stat-lines">';
 for(const [key,label]of [['straight','Retas'],['corners','Curvas'],['tyres','Pneus']])html+='<label>'+label+' <progress max="100" value="'+esc(v.stats?.[key]||0)+'"></progress><b>'+num(v.stats?.[key])+'</b></label>';
 html+='</div><p>'+(!active?'Previsão '+(comparison.lapDelta<0?'−':'+')+num(Math.abs(comparison.lapDelta))+' s/volta · ':'')+'Afinidade '+(v.synergy?'ativa':'inativa')+' · Janela de pneus '+percent(v.windowMult||1)+'</p></div><div class="v2-actions">'+button(active?'Equipado':'Equipar','equipCar',id,active)+'</div></article>';
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
 for(const p of people){html+='<article class="v2-row"><div><h3>'+esc(p.name)+'</h3><p>'+esc(p.specialty||profile(p.profile))+' · Nível '+num(p.level||1)+' · '+num(p.xp||0)+' XP<br>Bônus da equipe +'+percent(p.bonus||0)+(p.nextXp?' · Próximo nível em '+num(Math.max(0,p.nextXp-p.xp))+' XP':' · Desenvolvimento máximo')+'</p></div><div class="v2-actions">'+button(selected[role]===p.id?'Equipado':'Selecionar','equipStaff',p.id,selected[role]===p.id)+'</div></article>'}
 if(role==='engenheiros')for(const p of S.catalog.items.filter(p=>p.category===role&&!roster.some(person=>person.shopId===p.id&&person.owned)))html+='<article class="v2-row"><div><h3>'+esc(p.name)+'</h3><p>Engenharia · +'+percent(p.effect.piPct)+'</p></div><div class="v2-actions">'+button('Contratar · '+num(S.priceInCR(p,s))+' CR','buy',p.id,!S.unlocked(s,p))+'</div></article>';
 }
 return html;
}
function journey(s){
 const J=root.ApexJourney,R=root.ApexV2.Ret,next=J.next(s),challenge=R.weeklyChallenge(s),pass=R.passProgress(s);
 let html='<h2>A história da Aurora</h2><p>'+division(s)+' · etapa '+(s.stage+1)+'/12. Construa seu conjunto, domine os circuitos e conquiste seu próximo título.</p>';
 if(next)html+='<div class="career-next"><p class="product-kicker">Seu próximo objetivo</p><h3>'+esc(next.title)+'</h3><p>'+esc(next.description)+'</p><progress max="'+esc(next.target)+'" value="'+esc(Math.min(next.target,next.progress))+'"></progress><p>'+num(next.progress)+' / '+num(next.target)+'</p>'+button(next.done?'Recolher recompensa':'Ir ao objetivo',next.done?'journeyClaim':'journeyGo',next.id,next.locked)+'</div>';
 html+='<details><summary>Seu percurso</summary>'+J.goals(s).map(g=>'<article class="v2-row"><div><h3>'+esc(g.title)+'</h3><p>'+esc(g.description)+' · '+num(g.progress)+'/'+num(g.target)+'</p></div><div class="v2-actions">'+button(g.claimed?'Concluído':'Recolher','journeyClaim',g.id,g.claimed||!g.done||g.locked)+'</div></article>').join('')+'</details>';
 html+='<div class="weekly-challenge"><p class="product-kicker">Desafio da semana</p><h3>'+esc(challenge.name)+'</h3><p>'+esc(challenge.description)+'</p><p>'+(challenge.completed?'Concluído nesta semana':challenge.queued?'Agendado para a próxima largada':challenge.running?'Em disputa':'Complete a prova para conquistar a recompensa')+'</p>'+button(challenge.completed?'Repetir desafio':'Preparar desafio','weeklyChallenge','',challenge.queued||challenge.running)+'</div>';
 html+='<h3>Passe da temporada</h3><p>'+pass.tier+'/40 · '+num(pass.xp)+' / '+num(pass.nextXp)+' XP até a próxima recompensa</p><progress max="'+esc(pass.nextXp||1)+'" value="'+esc(Math.min(pass.xp,pass.nextXp||1))+'"></progress>'+button('Recolher disponíveis','passAll','',!pass.claimable?.length)+'<p>Jogue no seu ritmo. Carros, pilotos e recordes permanecem com você.</p>';
 return html;
}
function legacy(s){const T=root.ApexTalents,v=T.status(s);return '<h3>Legado da escuderia</h3><p>Escolha uma especialização permanente. '+(v.unlocked?'A seleção atravessa temporadas.':'Conquiste seu primeiro título para desbloquear.')+'</p>'+T.options.map(o=>'<article class="v2-row"><div><h3>'+esc(o.name)+'</h3><p>'+esc(o.description)+'</p></div><div class="v2-actions">'+button(v.selected===o.id?'Ativo':v.selected?'Trocar especialização':'Escolher','legacySelect',o.id,!v.unlocked||v.selected===o.id)+'</div></article>').join('')+'<p>'+esc(v.selected?'Você pode trocar gratuitamente; apenas uma especialização fica ativa.':'A primeira escolha é gratuita.')+'</p>'}
const api={garage,crew,journey,legacy,division,profile};root.ApexProductView=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
