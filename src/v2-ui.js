(function(){
if(s.version!==2)return;
const {V,B,Shop,Ret}=ApexV2,t=ApexI18n.t,esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),F=n=>GameFormat.format(n),say=(pt,en)=>ApexI18n.language==='en'?en:pt;
document.body.classList.add('apex-v2');Shop.init(s);Ret.init(s);Ret.refresh(s);s.idle.settings.camera=s.idle.settings.camera||{follow:false,zoom:2.2};window.ApexPaintState=()=>s.shop?.equippedCosmetics||{};window.ApexEffectsState=()=>s.idle.settings.effects;ApexI18n.setLanguage(s.idle.settings.language||'pt');
const panel=document.createElement('section');panel.className='v2-panel';menus.apexV2={title:'Apex Idle 1.0',node:panel};bank.append(panel);
const power=document.createElement('section');power.className='v2-power';ApexSafeDOM.render(power,'<strong id="v2PI"></strong><small id="v2Car"></small><div><button data-go="circuits"></button><button data-go="garage"></button><button data-go="standings">Classificação</button></div><small id="v2Weather"></small>');document.body.append(power);
const guide=document.createElement('section');guide.className='v2-guide';ApexSafeDOM.render(guide,'<span></span><button data-action="guideGo">Ver objetivo</button><button data-action="skip"></button>');document.body.append(guide);
let view='upgrades',storeTab='summon',teamTab='income',workTab='upgrades',batch=1,stamp='',currentBanner='banner-padrao',notice='',lastFinish=s.night?.lastResult||null,lastLap=s.laps,lastHUD=0,eventPending=false,confirmedSeason=false;
const aliases={carShop:'upgrades',garage:'upgrades',lineup:'garage',setup:'garage',parts:'components',album:'garage',projects:'projects',operation:'income',pilots:'pilots',contracts:'contracts',farm:'income',ascension:'season',idleStats:'achievements',cloudRanking:'rankings',championship:'championship',circuitShop:'circuits',circuits:'circuits',seasonShop:'season',sponsorShop:'missions',missions:'missions',summon:'summon',compactHelp:'help'};
const previousOpen=openMenu;let formationLink='';const sharedFormation=location.hash.startsWith('#lineup=')?ApexFormation.decode(location.hash.slice(8)):null;
function open(viewId){view=viewId;stamp='';confirmedSeason=false;previousOpen('apexV2');renderPanel(true)}
openMenu=function(id){if(aliases[id])return aliases[id]==='rankings'?previousOpen('rankings'):open(aliases[id]);if(id==='track'){drawer.close();return}previousOpen(id)};
function goToGoal(goal){
  if(!goal||goal.done||goal.locked){open('championship');panel.querySelector('[data-action="journeyClaim"]:not([disabled])')?.focus();return}
  if(goal.action==='academy'){previousOpen('pilots');return}
  if(goal.action==='race'||goal.action==='track'){drawer.close();$('boost').focus();return}
  go(goal.action);
}
function go(id){if(id==='social'){ApexOnline.open('crew');return}if(['account','pvp','rankings','weekly','settings'].includes(id)){previousOpen(id);return}open(id)}
for(const button of document.querySelectorAll('.area-navigation [data-area]')){const id=button.dataset.area;button.onclick=()=>id==='track'?drawer.close():open({car:'upgrades',team:'income',champ:'championship',store:'summon'}[id]);if(id==='car'||id==='champ')ApexRender.text(button.querySelector('span'),t(id==='car'?'workshop':'championship'))}
power.onclick=e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)};guide.onclick=e=>{if(!e.target.closest('button'))return;if(e.target.closest('[data-action="guideGo"]')){goToGoal(ApexJourney.next(s));return}s.onboarding.done=true;save();refreshHUD(true)};
document.querySelector('#trackMissions').onclick=()=>open('missions');
const group=id=>['upgrades','garage','projects'].includes(id)?'work':['income','pilots'].includes(id)?'team':['summon','components','automation','cosmetics','premium','trade','event','dailyShop','weeklyShop'].includes(id)?'store':'champ';
function tabs(items){return '<nav class="v2-tabs">'+items.map(([id,key])=>'<button data-go="'+id+'" aria-current="'+(view===id?'page':'false')+'">'+esc(t(key))+'</button>').join('')+'</nav>'}
function button(label,action,id='',disabled=false){return '<button data-action="'+action+'" data-id="'+esc(id)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>'}
function row(name,detail,controls,art=''){return '<article class="v2-row">'+(art?'<canvas width="180" height="110" data-art="'+esc(art)+'" aria-label="'+esc(name)+'"></canvas>':'')+'<div><h3>'+esc(name)+'</h3><p>'+detail+'</p></div><div class="v2-actions">'+controls+'</div></article>'}
function header(){const g=group(view);return g==='work'?tabs([['upgrades','upgrades'],['garage','garage'],['projects','projects']]):g==='team'?tabs([['income','team'],['pilots','pilots']]):g==='store'?tabs([['summon','summon'],['components','components'],['automation','automation'],['cosmetics','cosmetics'],['premium','premium'],['trade','trade'],['event','event'],['dailyShop','todayOffers'],['weeklyShop','weekOffers']]):tabs([['championship','championship'],['contracts','contracts'],['achievements','achievements'],['circuits','circuits'],['season','season'],['missions','missions']])}
function checkStage(stage){return (s.catProgress?s.stage:s.maxCircuit)>=stage||s.cat>0}
function genOpen(i){return ApexV2.teamUnlocked(s,i)}
function teamProduction(i){return ApexV2.teamProduction(s,i)}
function buyUpgrade(i){const before=ApexV2.pi(s),out=V.buy(s,i,batch);if(out.bought){notice='+'+out.bought+' · '+B.branches[i].name;ApexCommercial.record(s,'upgrade_buy',{branch:i,cost:out.spent});s.onboarding.step=Math.max(1,s.onboarding.step||0);ApexEffects.spawnFloat('+'+((ApexV2.pi(s)/before-1)*100).toFixed(1)+'% PI',innerWidth/2,innerHeight/2)}else notice=say('Junte mais CR para essa compra.','Save more CR for this purchase.');return out.bought}
function best(){let winner=null;const before=ApexV2.pi(s);for(let i=0;i<6;i++){const price=V.cost(s,i);if(!V.unlockedBranch(s,i)||s.levels[i]>=100||price>s.money)continue;const draft=JSON.parse(JSON.stringify(s));draft.levels[i]++;const gain=i===3?(A.reward(draft)/A.reward(s)-1):ApexV2.pi(draft)/before-1,score=price/Math.max(.0001,gain);if(!winner||score<winner.score)winner={i,kind:'car',cost:price,score}}E.generators.forEach((g,i)=>{const price=E.cost(s.idle,i,1);if(s.idle.units[i]>=1000||!genOpen(i)||price>s.money)return;const score=price/Math.max(.0001,g.rate*V.scale(s)/Math.max(1,Ret.income(s)));if(!winner||score<winner.score)winner={i,kind:'team',cost:price,score}});return winner}
const E=GameEconomy;
NightView.buyBest=()=>{if(!ApexAccess.canWrite())return false;const b=best();if(!b)return false;const ok=b.kind==='car'?buyUpgrade(b.i):E.buy(s,b.i,1);if(ok){save();render();renderPanel(true)}return ok};
$('trackBest').onclick=async()=>{
  const choice=best();
  if(!choice)return;
  const name=choice.kind==='car'?B.branches[choice.i].name:E.generators[choice.i].name;
  if(!await SaveConfirmation.ask('Comprar '+name+' por '+F(choice.cost)+' CR?'))return;
  const current=best();
  if(current?.kind===choice.kind&&current.i===choice.i&&current.cost===choice.cost)NightView.buyBest();
};
function renderPanel(force=false){
if(!drawer.open||drawer.dataset.section!=='apexV2')return;
const q=Shop.init(s),c=Championship.init(s),r=Ret.init(s),signature=JSON.stringify([view,storeTab,batch,currentBanner,s.levels,s.rep,s.cat,s.stage,s.maxCircuit,s.garage,q.inventory,q.equipped,q.selectedCar,q.selectedPilot,q.selectedEngineer,q.limits,q.history,q.pts,c.gems,c.tickets,q.eventTokens,q.training,s.journey,s.talents,s.daily,r.passClaimed,r.contracts,notice,confirmedSeason,s.season,s.globalPeak]);
if(!force&&signature===stamp)return;
stamp=signature;
let html=header()+'<p class="v2-balances">'+t('balance')+': <b data-live="cash"></b> CR · '+t('rep')+': '+F(s.rep)+(checkStage(7)?' · '+F(c.gems)+' gemas':'')+(checkStage(5)?' · '+F(s.materials)+' '+t('materials'):'')+'</p><p role="status" class="v2-notice">'+esc(notice)+'</p>';
if(view==='standings'){html+='<h2>'+say('Classificação ao vivo','Live standings')+'</h2><div id="v2Standings"></div>'}
if(view==='upgrades'){html+='<h2>'+t('workshop')+'</h2><p>'+say('Cada melhoria aumenta o PI ou a renda. Compare a posição antes de comprar.','Each upgrade increases power or income. Compare your position before buying.')+'</p><label>'+say('Comprar','Buy')+' <select id="v2Batch"><option value="1">×1</option><option value="10">×10</option><option value="max">Máx</option></select></label>';
for(let i=0;i<6;i++){if(i>=4&&!V.unlockedBranch(s,i))continue;
const level=s.levels[i],draft=JSON.parse(JSON.stringify(s));
draft.levels[i]=Math.min(100,level+1);
const before=ApexV2.place(s),after=ApexV2.place(draft),mark=B.P.ms.find(m=>m>level);
html+=row(B.branches[i].name,say('Nível ','Level ')+esc(level)+'/100 · '+(B.upgradeEffect(i,level)*100).toFixed(1)+'% → '+(B.upgradeEffect(i,Math.min(100,level+1))*100).toFixed(1)+'% '+(i===3?'CR':'PI')+'<br>P'+before+' → P'+after+' · '+say('Próximo marco: ','Next milestone: ')+(mark||'—'),button(t('buy')+' · '+F(V.cost(s,i))+' CR','upgrade',i,!V.unlockedBranch(s,i)||level>=100)+(!V.unlockedBranch(s,i)?'<small>'+say('Etapa 3','Stage 3')+'</small>':''))}
}
if(view==='garage'){
html+=ApexProductView.garage(s,{wet:race?.event==='rain'&&race.distance>=1,trackProfile:race?.challenge?.trackProfile,actions:button('Pilotos e engenharia','go','pilots')+button('Planejar pneus e parada','strategy')+button('Acerto e pintura','legacySetup')});
html+='<p>Presets guardam a dupla, componentes, acerto, pneus, parada e engenheiro automático.</p>'+button('Compartilhar composição','shareFormation')+(formationLink?'<label>Link da sua composição<input readonly value="'+esc(formationLink)+'" aria-label="Link da composição"></label>':'');
if(sharedFormation){const description=ApexFormation.describe(sharedFormation),available=ApexFormation.availability(s,sharedFormation);html+='<article class="v2-row"><canvas width="180" height="110" data-art="'+esc(sharedFormation.car)+'" aria-label="Composição recebida"></canvas><div><h3>Composição compartilhada</h3><p>'+esc(description.car)+' · '+esc(description.pilot)+' · '+esc(description.engineer)+'</p><p>'+esc(description.strategy)+'</p><p>'+esc(available.ok?'Você possui essa dupla. Revise a estratégia e use quando quiser.':'Faltam na sua coleção: '+available.missing.join(', '))+'</p></div><div class="v2-actions">'+button('Usar composição','applyFormation','',!available.ok)+'</div></article>'}
html+='<details><summary>Presets de corrida</summary>'+['potencia','curvas','aderencia'].map(profile=>button('Salvar '+ApexProductView.profile(profile),'savePreset',profile)+button('Usar '+ApexProductView.profile(profile),'loadPreset',profile,!q.presets?.[profile])).join('')+'</details>';
}
if(view==='projects'){html+='<h2>'+t('projects')+'</h2><p>Construa um histórico com materiais de corrida, sem gastar CR em invocações. O projeto é uma rota de longo prazo; compare o custo com os pontos que já acumulou.</p><p>'+F(s.materials)+' '+t('materials')+'</p>';
for(const item of Shop.bannerCars('banner-padrao')){const cost=Shop.projectCost(item.id),owned=Shop.owned(s,item);
html+=row(item.name,cost+' '+t('materials'),button(owned?t('equipped'):say('Construir','Build'),'build',item.id,owned||!checkStage(5)||s.materials<cost),item.id)}
}
if(view==='income'){html+='<h2>'+t('team')+'</h2><p>'+F(E.production(s.idle))+' CR/s · '+say('Uma única renda idle, com marcos de produção.','One idle income system with production milestones.')+'</p><label>'+t('buy')+' <select id="v2Batch"><option value="1">×1</option><option value="10">×10</option><option value="max">Máx</option></select></label>';
E.generators.forEach((g,i)=>{const mark=E.milestones[s.idle.upgrades[i]];html+=row(g.name,F(teamProduction(i))+' CR/s · '+esc(s.idle.units[i])+'<br>'+say('Próximo marco: ','Next milestone: ')+(mark||'—'),button(t('buy')+' · '+F(E.cost(s.idle,i,1))+' CR','team',i,!genOpen(i))+button(say('Dobrar produção','Double production'),'teamUpgrade',i,!mark||s.idle.units[i]<mark))}
);
html+=button(say('Coordenar sessão · 5 s da equipe','Coordinate session · 5 seconds of team income'),'manual')}
if(view==='pilots'){
html+=ApexProductView.crew(s)+'<h3>Desenvolvimento do piloto</h3>';
if(q.training)html+='<p>Treino em andamento · <span data-countdown="'+esc(q.training.end)+'"></span></p>'+button('Concluir treino','finishTraining','',q.training.end>Date.now())+button('Concluir agora · 8 gemas','skipTraining','',c.gems<8);
for(const item of Shop.catalog.items.filter(x=>x.category==='treino')){const preview=Shop.trainingPreview(s,item.id,{wet:race?.event==='rain'&&race.distance>=1,trackProfile:race?.challenge?.trackProfile});html+=row(item.name,preview?preview.minutes+' min · +'+esc(preview.xp)+' XP para '+esc(preview.pilot)+'<br>Nível '+preview.fromLevel+' → '+preview.toLevel+' · bônus do piloto '+F(preview.fromBonus*100)+'% → '+F(preview.toBonus*100)+'%<br>Bônus efetivo do conjunto '+F(preview.effectiveBonusBefore*100)+'% → '+F(preview.effectiveBonusAfter*100)+'% · '+esc(preview.contextLabel)+(preview.capped?'<br>Teto de 40% alcançado neste conjunto. O XP permanece; não há ganho acima do teto.':''):'Selecione um piloto contratado para treinar.',button('Treinar · '+F(Shop.priceInCR(item,s))+' CR','buy',item.id,!!q.training||!preview||!Shop.unlocked(s,item)))}
}
if(view==='contracts'){html+='<h2>'+t('contracts')+'</h2><p>'+say('Envie um carro que você possui em uma missão cronometrada. Históricos também contam.','Send an owned car on a timed mission. Legacy cars also count.')+'</p>';
const owned=[...GarageState.init(s).owned,...q.inventory.cars].filter(id=>id!==A.equippedCar(s).id&&!r.contracts.some(x=>x.car===id));
html+='<select id="v2ContractCar" aria-label="Carro para o contrato">'+owned.map(id=>'<option value="'+esc(id)+'">'+esc(Shop.get(id)?.name||Legends.get(id)?.name||A.cars.find(x=>x.id===id)?.name||id)+'</option>').join('')+'</select>';
for(const n of [1,5,15])html+=button(n+' min','contractStart',n,!owned.length||r.contracts.length>=3||!checkStage(5));
for(const contract of r.contracts)html+=row(Shop.get(contract.car)?.name||Legends.get(contract.car)?.name||contract.car,'<span data-countdown="'+esc(contract.end)+'"></span>',button(t('claim'),'contractClaim',contract.id));
for(const old of s.career?.contracts||[])html+=row(say('Contrato anterior','Previous contract'),' <span data-countdown="'+esc(old.end)+'"></span>',button(t('claim'),'legacyContract',old.car))}
if(view==='missions'){html+='<h2>'+t('missions')+'</h2><h3>'+t('daily')+'</h3>'+button(say('Baú diário · sequência ','Daily chest · streak ')+s.daily.streak+'/7','chest','',s.daily.chest);
for(const m of Ret.missions)html+=row(m.name,(s.daily[m.id]||0)+' / '+m.goal,button(t('claim'),'daily',m.id,s.daily.claimed.includes(m.id)||(s.daily[m.id]||0)<m.goal));
html+=row(t('weekly'),s.daily.weekRaces+' / 30 '+say('corridas','races'),button(t('claim'),'weekly','',s.daily.weekRaces<30||s.daily.weeklyClaimed.includes('races')));
html+=button(say('Objetivos de carreira','Career goals'),'careerMissions');
for(const [i,sponsor]of NightLeague.sponsors.entries())html+=row(sponsor.name,F(sponsor.reward)+' CR',button(t('claim'),'sponsor',i,!NightLeague.sponsorReady(s,i)));
html+='<p>Caixas por corridas e missões: abra em Mais → Caixas AFK e Online.</p>'}
if(view==='championship'){
html+=ApexProductView.journey(s)+'<h3>Dispute e compare</h3>'+button('Campeonato','competition','',!checkStage(7)||r.nextEvent)+button('Ranked e desafio assíncrono','go','pvp')+button('Escuderia e amigos','go','social')+button('Rankings','go','rankings')+button('GP semanal clássico','go','weekly');
}
if(view==='circuits'){html+='<h2>'+t('circuits')+'</h2>';
const count=s.catProgress?12:24;
for(let i=0;i<count;i++){const map=s.catProgress?(2*i+3*s.cat)%24:i,required=V.openRep(s,i),available=s.catProgress?i<=s.stage:i<=s.maxCircuit;
html+=row((i+1)+' · '+A.circuits[map].name,required+' REP · '+B.trackProfile(s.catProgress?2*i:i)+'<br>'+say('Melhor volta: ','Best lap: ')+(s.race.records[A.circuits[map].id]?CircuitMaps.time(s.race.records[A.circuits[map].id]):'—'),button(s.circuit===map?t('equipped'):say('Correr','Race'),'circuit',map,!available||s.circuit===map),'track:'+map)}
}
if(view==='season'){html+='<h2>'+t('season')+' '+esc(s.season.n)+'</h2><p>'+ApexProductView.division(s)+' · '+(s.stage+1)+'/12 · '+esc(s.season.titles)+' '+t('titles')+'<br>+'+s.season.titles*25+'% CR · +'+s.season.titles*8+'% PI (a liga acompanha; a renda acelera suas melhorias) · '+say('Escuderia nível ','Team level ')+esc(s.escuderia)+'</p><p>'+say('Promoção mantém CR, coleção e títulos; reinicia melhorias e equipe. Nova temporada mantém coleção, recordes e nível; reinicia CR, REP, categoria, melhorias e equipe.','Promotion keeps cash, collection and titles; resets upgrades and team. New season keeps collection, records and level; resets cash, REP, category, upgrades and team.')+'</p>'+button(t('promote'),'promote','',s.stage<11||s.cat>=5||s.rep<V.openRep(s,12))+'<label>'+say('Foco da temporada','Season focus')+' <select id="v2Focus"><option value="potencia">Potência</option><option value="curvas">Curvas</option><option value="aderencia">Aderência</option></select></label>'+button((confirmedSeason?t('confirm')+' · ':t('newSeason')+' · ')+'+'+V.titleGain(s)+' '+t('titles'),'season','',s.cat*12+s.stage+1<12)+ApexProductView.legacy(s)+button(t('export'),'export')+button(t('import'),'import')+button(say('Exportar texto','Export text'),'exportText')+button(say('Importar texto','Import text'),'importText')}
if(view==='achievements'){html+=(s.cat>=3?'<h3>'+say('Desafios de pista','Track challenges')+'</h3><p>'+say('Três estrelas: P1 no tempo-alvo, sem ERS, concluir na chuva. +10 gemas por estrela.','Three stars: target-time P1, no ERS, finish in rain. +10 gems each.')+'</p>'+Object.entries(r.challenges||{}
).map(([id,stars])=>'<p>'+esc(A.circuits[id]?.name||id)+' · '+stars.length+'/3 ★</p>').join(''):'')+(s.cat>=4?'<h3>Hall da Fama</h3><p>'+say('Vitórias por circuito: ','Circuit wins: ')+(r.hall||[]).length+'/24 · '+s.globalPeak+' '+say('etapas alcançadas','stages reached')+'</p>':'');
html+='<h2>'+t('achievements')+'</h2><p>'+Ret.init(s).perfect.length+' '+say('corridas perfeitas','perfect races')+' · '+(s.night?.wins||0)+' '+say('vitórias','wins')+' · '+esc(s.escuderia)+' '+say('níveis','levels')+'</p><p>'+say('Corrida perfeita: P1, ERS usado e parada dentro da janela do pneu.','Perfect race: P1, ERS used and pit stop within the tyre window.')+'</p>'+button(say('Estatísticas preservadas','Preserved statistics'),'legacyStats')}
if(view==='summon'){
  const special=currentBanner==='banner-lendas',featured=currentBanner==='banner-destaque';
  const cars=Shop.bannerCars(currentBanner);
  const pity=q.pity[currentBanner]||{epic:0,legendary:0,mythic:0},rates=Shop.nextBannerRates(currentBanner,q.wish,pity);
  const ready=Shop.bannerUnlocked(s,currentBanner);
  const label=featured?say('ficha de destaque','featured ticket'):special?say('ficha','ticket'):F(Shop.summonPrice(s))+' CR';
  const balance=featured?q.featuredTickets:special?c.tickets:s.money/Shop.summonPrice(s);
  html+='<h2>'+t('summon')+'</h2><nav class="v2-tabs v2-banner-picker" aria-label="'+say('Banners gacha','Gacha banners')+'">'+Shop.catalog.banners.map(b=>'<button data-action="banner" data-id="'+esc(b.id)+'" aria-pressed="'+(b.id===currentBanner)+'">'+esc(b.name)+'</button>').join('')+'</nav>';
  html+='<canvas class="v2-banner" width="900" height="220" data-banner-art aria-label="'+esc(special?'Lotus 97T e Jordan 191 em Canvas':'Monopostos históricos em Canvas')+'"></canvas>';
  html+='<p>'+(special?say('Lotus 97T e Jordan 191 são exclusivos deste banner de fichas. Os demais resultados são raros e épicos do principal.','Lotus 97T and Jordan 191 are ticket banner exclusives. Other results are rare and epic cars from the main banner.'):say('20 monopostos históricos de Fórmula 1.','20 historic Formula 1 cars.'))+'</p>';
  if(!special)html+='<label>'+say('Desejo: dobra a chance base','Wish: doubles base chance')+' <select id="v2Wish"><option value="">—</option>'+cars.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label>';
  html+='<details><summary>'+say('Carros e chances na próxima tentativa','Cars and odds for the next pull')+'</summary>'+cars.map(car=>'<p>'+esc(car.name)+' · '+esc(rates.find(row=>row.car===car).chance.toLocaleString(ApexI18n.language==='en'?'en':'pt-BR',{maximumFractionDigits:4}))+'%</p>').join('')+'</details>';
  html+='<p>'+say('Próxima garantia de épico ou superior em ','Guarantees: epic ')+Math.max(1,10-pity.epic)+' · '+say('lendário ','legendary ')+Math.max(1,Shop.legendaryLimit(currentBanner)-pity.legendary)+'</p>';
  html+='<p>'+F(c.tickets)+' '+say('fichas','tickets')+' · '+esc(q.featuredTickets)+' '+say('fichas de destaque','featured tickets')+' · '+F(q.pts)+' '+say('pontos de troca','exchange points')+'</p>';
  html+=button(t('summon')+' ×1 · '+label,'summon',1,!ready||balance<1)+button(t('summon')+' ×10 · '+(featured?say('10 fichas de destaque','10 featured tickets'):special?say('10 fichas','10 tickets'):F(Shop.summonPrice(s)*10)+' CR'),'summon',10,!ready||balance<10);
  if(featured)html+=button(t('summon')+' · 60 '+say('gemas','gems'),'gemSummon',1,!ready||c.gems-(q.paidGems||0)<60);
  if(!special&&!featured)html+=button(t('summon')+' ×1 · '+say('ficha','ticket'),'ticketSummon',1,!ready||c.tickets<1);
  html+='<p>Mítico na próxima tentativa: '+rates.filter(x=>x.rank===4).reduce((a,x)=>a+x.chance,0).toLocaleString('pt-BR',{maximumFractionDigits:4})+'%. A chance aumenta após cada tentativa sem mítico e reinicia ao obtê-lo. Não há garantia de mítico. A referência de 1 em 700 é a média do principal sem desejo, não um prazo.</p>';
  html+='<h3>'+say('Histórico','History')+'</h3><ol>'+q.history.filter(h=>Shop.get(h.id)?.historical).map(h=>'<li>'+esc(Shop.get(h.id)?.name||h.id)+(h.duplicate?' · +'+esc(h.points)+' pts':' · '+say('Novo','New'))+'</li>').join('')+'</ol>';
}
if(['components','cosmetics','premium','automation','trade','event','dailyShop','weeklyShop'].includes(view)){html+='<h2>'+t({dailyShop:'todayOffers',weeklyShop:'weekOffers'}
[view]||view)+'</h2>';
if(view==='automation')html+=row('ERS '+say('automático','automatic'),say('Ativa quando disponível. Sem vantagem em PvP normalizado.','Activates when available. No advantage in normalized PvP.'),button(s.night.autoERSOwned?(s.night.autoERS?say('Desligar','Turn off'):say('Ligar','Turn on')):t('buy')+' · '+F(150*B.lapReward(V.index(s)))+' CR','auto','',!checkStage(5)));
if(view==='trade')html+='<p>Use duplicatas para escolher um histórico com custo conhecido. A troca é sua rota previsível; projetos usam materiais de corrida, e o gacha pode antecipar uma novidade. Exclusivos continuam fora desta loja.</p>'+button(say('Ficha destaque · 200 pts (3/semana)','Featured ticket · 200 pts (3/week)'),'tradeExtra','featured')+button(say('Baú semanal · 150 pts','Weekly chest · 150 pts'),'tradeExtra','chest');
if(view==='dailyShop')html+='<p>'+say('Cosméticos: comum 60 / raro 28 / épico 10 / lendário 2. Equipe: 55 / 30 / 12 / 3.','Cosmetics: common 60 / rare 28 / epic 10 / legendary 2. Staff: 55 / 30 / 12 / 3.')+'</p>';
if(view==='event'){html+='<p>'+q.eventTokens+' '+say('fichas de evento','event tokens')+'</p>';
Shop.catalog.evento.items.forEach((item,i)=>html+=row(item.name,item.cost+' '+say('fichas','tokens'),button(t('buy'),'eventBuy',i,q.eventTokens<item.cost)))}
else if(view==='dailyShop'||view==='weeklyShop'){const slots=view==='dailyShop'?Shop.dailyShop(s):Shop.weeklyShop(s);
if(view==='dailyShop')html+=button(t('reroll')+' · 10 '+say('gemas','gems'),'reroll');
slots.forEach((item,i)=>html+=row(item.name,item.empty?t('locked'):F(item.offerPrice)+' '+item.currency,button(t('buy'),'offer',i,item.empty||q.limits[item.offerKey]),item.category==='carros'?item.id:''))}
else{const list=view==='components'?Shop.catalog.items.filter(x=>x.category==='componentes'):view==='cosmetics'?Shop.catalog.items.filter(x=>x.category==='cosmeticos'):view==='premium'?Shop.catalog.items.filter(x=>x.category==='real'):view==='trade'?Shop.bannerCars('banner-padrao'):Shop.catalog.items.filter(x=>x.category==='boosts');
list.forEach(item=>{const owned=Shop.owned(s,item),trade=view==='trade',price=trade?item.price.pts:Shop.priceInCR(item,s),currency=trade?'pts':item.currency,blocked=!Shop.unlocked(s,item)||item.category==='real'||item.price===0;html+=row(item.name,item.category==='real'?t('soon')+' · '+say('nenhuma cobrança','no charges'):('+'+((item.effect.piPct||0)*100).toFixed(1)+'% PI · '+F(price)+' '+currency),button(owned?(trade&&A.equippedCar(s).id!==item.id?say('Na garagem','In garage'):t('equipped')):blocked?t('locked'):t('buy'),trade?'trade':'buy',item.id,owned||blocked)+(item.category==='componentes'&&owned?button(t('equip'),'componentEquip',item.id):'')+(item.category==='cosmeticos'&&owned?button(t('equip'),'cosmeticEquip',item.id):''),item.category==='carros'?item.id:'')}
)}
}
if(view==='help')html+=button('Mostrar guia de objetivos','showGuide')+'<h2>'+say('Um ciclo claro','One clear loop')+'</h2><p>'+say('Corra → ganhe CR e REP → melhore o PI → dispute posições → avance etapas. A equipe é a única renda idle; contratos dão CR e materiais em missões com prazo. Nova temporada é o único prestígio ativo.','Race → earn CR and REP → improve power → fight for position → advance stages. The team is the only idle income; timed contracts give cash and materials. New season is the only active prestige.')+'</p>';
const focused=panel.contains(document.activeElement)?document.activeElement:null;
const controls='button,select,input,summary';
const controlKey=el=>JSON.stringify([el.id,el.dataset.go,el.dataset.action,el.dataset.id,el.tagName]);
const key=focused&&controlKey(focused);
const tabsScroll=panel.querySelector('.v2-tabs')?.scrollLeft||0;
const expanded=[...panel.querySelectorAll('details')].map(detail=>detail.open);
ApexSafeDOM.render(panel,html);
if(!force){
  const tabs=panel.querySelector('.v2-tabs');
  if(tabs)tabs.scrollLeft=tabsScroll;
  [...panel.querySelectorAll('details')].forEach((detail,i)=>{if(expanded[i])detail.open=true});
}
if(key){
  const replacement=[...panel.querySelectorAll(controls)].find(el=>controlKey(el)===key&&!el.disabled);
  replacement?.focus({preventScroll:true});
}
const select=$('v2Batch');
if(select)select.value=String(batch);
if($('v2Banner'))$('v2Banner').value=currentBanner;
if($('v2Wish'))$('v2Wish').value=Shop.bannerCars(currentBanner).some(car=>car.id===s.shop.wish)?s.shop.wish:'';
if($('v2Focus'))$('v2Focus').value=s.focus||'potencia';
paintArt();
updateLive();
}
function paintArt(){for(const canvas of panel.querySelectorAll('canvas')){if(canvas.hasAttribute('data-art-trophy')){ApexProductView.drawTrophy(canvas,canvas.dataset.artTrophy);continue}const g=canvas.getContext('2d');
g.fillStyle='#12163A';
g.fillRect(0,0,canvas.width,canvas.height);
const id=canvas.dataset.art;
if(id?.startsWith('track:')){const m=CircuitMaps.project(A.circuits[+id.split(':')[1]],canvas.width,canvas.height,14);
g.strokeStyle='#FFB627';
g.lineWidth=4;
g.beginPath();
m.points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));
g.closePath();
g.stroke()}
else if(canvas.hasAttribute('data-banner-art')){
  const cars=Shop.bannerCars(currentBanner);
  const shown=currentBanner==='banner-lendas'?cars.filter(car=>car.exclusive):Shop.rarities.map(rarity=>cars.find(car=>car.rarity===rarity)).filter(Boolean);
  shown.forEach((car,i)=>CarArt.draw(g,{x:canvas.width*(i+.5)/shown.length,y:120,a:-.12,scale:shown.length===2?2.6:1.5,id:car.id}));
}
else CarArt.draw(g,{x:canvas.width/2,y:canvas.height/2,a:-.14,scale:canvas.width>300?3.3:1.4,id}
)}
}
function updateLive(){const finishTraining=panel.querySelector('[data-action="finishTraining"]');if(finishTraining)ApexRender.prop(finishTraining,'disabled',s.shop.training?.end>Date.now());const live=$('v2Standings');if(live&&race){const order=Race.order(race);const signature=order.map(x=>x.name+Math.floor(x.distance*10)).join();if(live.dataset.signature!==signature){live.dataset.signature=signature;ApexSafeDOM.render(live,order.map((x,i)=>'<p class="v2-standing"><b>P'+(i+1)+'</b> '+esc(x.player?'Aurora':x.name)+' <span>'+ (i===0?say('Líder','Leader'):'+'+((order[0].distance-x.distance)*race.duration).toFixed(1)+' s')+'</span></p>').join(''))}}for(const el of panel.querySelectorAll('[data-live="cash"]'))ApexRender.text(el,F(s.money));for(const el of panel.querySelectorAll('[data-countdown]'))ApexRender.text(el,Math.max(0,Math.ceil((+el.dataset.countdown-Date.now())/1000))+' s')}
function reveal(results){pendingReveal=results.map(r=>({car:{id:r.id,name:r.car.name,rarity:['Comum','Raro','Épico','Lendário','Mítico'][Shop.rarities.indexOf(r.car.rarity)],color:r.car.color||['#b8c9d4','#70caff','#c6a0ff','#ffcd75','#ff86bf'][Shop.rarities.indexOf(r.car.rarity)]},duplicate:r.duplicate,guaranteed:r.guaranteed,points:r.points}));revealIndex=results.length>1?pendingReveal.indexOf(DropShowcase.order(pendingReveal)[0]):0;summonBusy=true;summonCinema.showModal();if(matchMedia('(prefers-reduced-motion: reduce)').matches)finishSummon();else startReveal()}
function economySnapshot(){return {CR:s.money,Materials:s.materials||0,Tickets:s.championship.tickets||0,Points:s.shop.pts||0,Gems:s.championship.gems||0,FeaturedTickets:s.shop.featuredTickets||0,EventTokens:s.shop.eventTokens||0}}
let economyObserved=economySnapshot(),economyState=s;
function resetEconomy(){economyState=s;economyObserved=economySnapshot()}
function flushEconomy(){if(economyState!==s){resetEconomy();return}const after=economySnapshot(),details={action:Shop.hash('other_gameplay'),passive:true};for(const key of Object.keys(after)){const delta=after[key]-economyObserved[key];if(Math.abs(delta)>1e-7)details['delta'+key]=delta}if(Object.keys(details).length>2)ApexCommercial.record(s,'economy_action',details);resetEconomy()}
ApexRender.schedule('economy-measurement',flushEconomy,30000);
function recordEconomy(action,before){const after=economySnapshot(),details={action:Shop.hash(action)};for(const key of Object.keys(after))if(after[key]!==before[key]){const delta=after[key]-before[key];details['delta'+key]=delta;economyObserved[key]+=delta}if(Object.keys(details).length>1)ApexCommercial.record(s,'economy_action',details)}
function commit(){save();stamp='';render();renderPanel(true)}
panel.onchange=e=>{if(e.target.id==='v2Batch'){batch=e.target.value==='max'?'max':+e.target.value;stamp='';renderPanel(true)}if(e.target.id==='v2Banner'){currentBanner=e.target.value;stamp='';renderPanel(true)}if(e.target.id==='v2Wish'){s.shop.wish=e.target.value;save();renderPanel(true)}if(e.target.id==='v2Focus')s.focus=e.target.value};
panel.onclick=async e=>{const target=e.target.closest('button');if(!target||target.disabled||!ApexAccess.canWrite())return;if(target.dataset.go){go(target.dataset.go);return}const action=target.dataset.action,id=target.dataset.id;if(!action)return;const ownedBefore=new Set([...GarageState.init(s).owned,...s.shop.inventory.cars]);const selectionBefore=['applyFormation','loadPreset'].includes(action)?{pilot:Shop.driver(s)?.id||'',engineer:Shop.engineer(s)?.id||''}:null;let success=true;let balancesBefore=economySnapshot();notice='';const item=Shop.get(id),purchasePrice=action==='buy'&&item?Shop.priceInCR(item,s):action==='upgrade'?V.cost(s,+id):action==='team'?E.cost(s.idle,+id,batch==='max'?E.maxBuy(s.idle,+id,s.money):batch):0;if(purchasePrice>=s.money*.5&&s.money>0&&!await SaveConfirmation.ask(say('Esta compra usa pelo menos metade do caixa. Confirmar?','This purchase uses at least half your cash. Confirm?')))return;balancesBefore=economySnapshot();
if(action==='go'){go(id);return}if(action==='shareFormation'){const code=ApexFormation.encode(s);formationLink=code?location.origin+'/#lineup='+code:'';notice=code?'Copie o link. A composição é mostrada na Garagem de quem abrir.':'Selecione um conjunto válido para compartilhar.';renderPanel(true);return}if(action==='applyFormation'){if(race?.challenge){notice='Conclua o desafio antes de trocar de conjunto.';renderPanel(true);return}success=ApexFormation.apply(s,sharedFormation);if(success){ApexRacePlan.sync(s,5);NightView.applyEquippedToRace()}}if(action==='banner'){currentBanner=id;stamp='';renderPanel(true);return}
if(action==='upgrade')success=buyUpgrade(+id);
if(action==='team')success=E.buy(s,+id,batch)>0;
if(action==='teamUpgrade')success=E.upgrade(s,+id);
if(action==='manual'){const n=E.click(s);notice='+'+F(n)+' CR'}
if(action==='equipCar'&&race?.challenge){notice='Conclua o desafio antes de trocar de carro.';renderPanel(true);return}if(action==='equipCar'){if(Shop.get(id)&&s.shop.inventory.cars.includes(id))s.shop.selectedCar=id;else{success=GarageState.equip(s,id);if(success)s.shop.selectedCar=''}if(success)NightView.applyEquippedToRace()}
if(action==='finishTraining'||action==='skipTraining')success=Shop.finishTraining(s,action==='skipTraining');
if(action==='equipStaff')success=Shop.equipStaff(s,id);
if(action==='buy'||action==='trade'){const item=Shop.get(id),result=Shop.buy(s,id,action==='trade'?{currency:'pts',price:item.price.pts}:{});success=result.ok;notice=result.reason||t('buy')}
if(action==='componentEquip')s.shop.equipped[Shop.get(id).slot]=id;
if(action==='cosmeticEquip'){s.shop.cosmetic=id;s.shop.equippedCosmetics=s.shop.equippedCosmetics||{};s.shop.equippedCosmetics[Shop.get(id).slot]=id;notice=say('Pintura selecionada. Somente visual.','Paint selected. Visual only.')}
if(action==='build')success=Shop.buildProject(s,id);
if(action==='contractStart')success=Ret.startContract(s,$('v2ContractCar')?.value,+id,[...GarageState.init(s).owned,...s.shop.inventory.cars]);
if(action==='contractClaim')success=Ret.claimContract(s,id);
if(action==='legacyContract'){const before=Object.values(s.career.materials).reduce((a,b)=>a+b,0);success=Career.claimContract(s,id);s.materials+=Object.values(s.career.materials).reduce((a,b)=>a+b,0)-before}
if(action==='chest')success=Ret.chest(s);
if(action==='daily')success=Ret.claimDaily(s,id);
if(action==='weekly')success=Ret.claimWeekly(s);
if(action==='pass')success=Ret.claimPass(s,+id);
if(action==='passAll')success=Ret.claimAllPass(s)>0;
if(action==='showGuide'){s.onboarding.done=false;save();drawer.close();refreshHUD(true);return}
if(action==='journeyClaim')success=ApexJourney.claim(s,id);
if(action==='journeyGo'){goToGoal(ApexJourney.goals(s).find(g=>g.id===id));return}
if(action==='weeklyChallenge'){success=Ret.startChallenge(s);notice=success?'Desafio agendado para a próxima largada. Prepare pneus e estratégia na Garagem.':''}
if(action==='legacySelect'){const status=ApexTalents.status(s);if(status.selected&&!await SaveConfirmation.ask('Trocar a especialização ativa? A troca é gratuita.'))return;success=ApexTalents.select(s,id,!!status.selected)}

if(action==='sponsor')success=NightLeague.claimSponsor(s,+id);
if(action==='competition'){s.retention.nextEvent=true;notice=say('Campeonato agendado para a próxima largada.','Championship scheduled for the next grid.')}
if(action==='circuit'){NightView.beforeRestore();s.circuit=+id;NightView.setMaintenance(false);drawer.close()}
if(action==='promote'){success=V.promote(s);if(success){NightView.beforeRestore();NightView.setMaintenance(false)}}
if(action==='season'){if(!confirmedSeason){confirmedSeason=true;notice=say('Revise o que permanece e confirme novamente.','Review what stays and confirm again.');renderPanel(true);return}success=V.newSeason(s,s.focus);if(success){NightView.beforeRestore();NightView.setMaintenance(false);confirmedSeason=false}}
if(action==='auto'){const n=NightLeague.init(s);if(n.autoERSOwned)n.autoERS=!n.autoERS;else{const price=150*B.lapReward(V.index(s));if(s.money>=price){s.money-=price;n.autoERSOwned=true;n.autoERS=true}else success=false}}
if(action==='summon'||action==='ticketSummon'||action==='gemSummon'){const results=Shop.summon(s,currentBanner,+id,Math.random,{currency:action==='gemSummon'?'gemas':action==='ticketSummon'?(currentBanner==='banner-destaque'?'featured':'fichas'):currentBanner==='banner-padrao'?'cr':currentBanner==='banner-destaque'?'featured':'fichas'});success=!!results;if(results){recordEconomy(action,balancesBefore);ApexCommercial.record(s,'summon',{count:results.length,newCars:results.filter(x=>!x.duplicate).length,duplicates:results.filter(x=>x.duplicate).length,...Object.fromEntries(results.filter(x=>!x.duplicate).map((x,i)=>['car'+i,Shop.hash(x.id)])),...Object.fromEntries(Shop.rarities.map((rarity,index)=>['rarity'+index,results.filter(x=>x.car.rarity===rarity).length]))});commit();reveal(results);return}}
if(action==='offer'){const offers=view==='dailyShop'?Shop.dailyShop(s):Shop.weeklyShop(s),out=Shop.buyOffer(s,offers[+id]);success=out.ok;notice=out.reason||''}
if(action==='tradeExtra')success=Shop.tradeExtra(s,id);
if(action==='reroll')success=Shop.reroll(s);
if(action==='eventBuy'){const item=Shop.catalog.evento.items[+id],key='event:'+Shop.week()+':'+id,limit=[1,1,1,5,2,3][+id];if(s.shop.eventTokens<item.cost||(s.shop.limits[key]||0)>=limit)success=false;else{s.shop.eventTokens-=item.cost;s.shop.limits[key]=(s.shop.limits[key]||0)+1;if(+id<3){const cosmetic=Shop.catalog.items.find(x=>x.category==='cosmeticos'&&x.slot===['pintura','capacete','efeito-chegada'][+id]&&x.appears.includes('evento')&&!s.shop.inventory.cosmetics.includes(x.id));if(cosmetic)s.shop.inventory.cosmetics.push(cosmetic.id)}if(+id===3)s.money+=Ret.income(s)*3600;if(+id===4)s.shop.featuredTickets++;if(+id===5)s.championship.gems+=30}}
if(action==='loadPreset'&&race?.challenge){notice='Conclua o desafio antes de trocar o conjunto.';renderPanel(true);return}if(action==='savePreset'){s.shop.presets=s.shop.presets||{};s.shop.presets[id]={setup:{...A.setup(s)},equipped:{...s.shop.equipped},car:A.equippedCar(s).id,pilot:Shop.driver(s)?.id||'',engineer:Shop.engineer(s)?.id||'',strategy:ApexRacePlan.read(s)}}if(action==='loadPreset'){const preset=s.shop.presets?.[id];if(preset){s.setup={...preset.setup};s.shop.equipped={...preset.equipped};if(Shop.get(preset.car)?.historical&&s.shop.inventory.cars.includes(preset.car))s.shop.selectedCar=preset.car;else if(preset.car&&GarageState.equip(s,preset.car))s.shop.selectedCar='';if(preset.pilot)Shop.equipStaff(s,preset.pilot);if(preset.engineer)Shop.equipStaff(s,preset.engineer);if(preset.strategy)ApexRacePlan.write(s,preset.strategy);ApexRacePlan.sync(s,5);NightView.applyEquippedToRace()}else success=false}if(action==='strategy'){if(race){s.retention.planningPending=true;NightView.setMaintenance(true);notice=say('Planejamento abre após a bandeirada.','Planning opens after the finish.')}else prepareRace()}if(action==='export'){$('export').click();return}if(action==='import'){$('import').click();return}if(action==='exportText'){$('idleExportText').click();return}if(action==='importText'){$('idleImportText').click();return}
if(action==='academy'){previousOpen('pilots');return}if(action==='legacySetup'){previousOpen('setup');return}if(action==='legacyStats'){previousOpen('idleStats');return}if(action==='careerMissions'){previousOpen('missions');return}
if(success&&selectionBefore){
  const requested=action==='applyFormation'?sharedFormation:s.shop.presets?.[id];
  const car=A.equippedCar(s).id;
  if(requested?.car===car){ApexJourney.mark(s,'car_equip',{id:car});ApexCommercial.record(s,'car_equip',{car:Shop.hash(car),circuit:s.circuit})}
  for(const role of ['pilot','engineer']){const selected=(role==='pilot'?Shop.driver(s):Shop.engineer(s))?.id||'';if(selected&&selected!==selectionBefore[role])ApexCommercial.record(s,'staff_equip',{item:Shop.hash(selected)})}
}
if(success){ApexJourney.mark(s,action,{id});recordEconomy(action,balancesBefore);const event={journeyClaim:'journey_claim',team:'team_buy',equipCar:'car_equip',equipStaff:'staff_equip',buy:'item_buy',trade:'duplicate_trade',build:'car_unlock',contractClaim:'contract_claim',promote:'category_unlock',season:'season_reset',daily:'daily_claim',weekly:'weekly_claim',chest:'daily_chest',offer:'item_buy',tradeExtra:'item_buy',eventBuy:'item_buy'}[action];const acquired=[...GarageState.init(s).owned,...s.shop.inventory.cars].find(car=>!ownedBefore.has(car));if(event)ApexCommercial.record(s,event,{item:Shop.hash(acquired||id||action),...(acquired?{car:Shop.hash(acquired)}:{}),...(action==='equipCar'?{car:Shop.hash(id),circuit:s.circuit}:{})})}
if(!success)notice=notice||say('Ação indisponível. Verifique saldo, prazo e requisitos.','Action unavailable. Check balance, timer and requirements.');else if(!notice)notice=say('Pronto. Progresso salvo.','Done. Progress saved.');
ApexEffects[success?'pulse':'shake'](target);commit();
};
panel.addEventListener('click',event=>{if(event.target.matches('input[readonly]'))event.target.select()});
const originalCloseDrops=$('closeDrops').onclick;$('closeDrops').onclick=()=>{originalCloseDrops();open('garage')};
$('improveRace').onclick=()=>{resultDialog.close();open('upgrades')};
$('boost').addEventListener('click',()=>{if(boost>0){if(s.levels[4]>=25)boost=8;if(s.levels[4]>=50)cooldown=20;if(race)race.ersUsed=true;if(!s.onboarding.ers){s.onboarding.ers=true;ApexJourney.mark(s,'ers');ApexCommercial.record(s,'tutorial_ers')}save()}});
function refreshHUD(force=false){if(!force&&performance.now()-lastHUD<300)return;lastHUD=performance.now();Shop.init(s);Ret.init(s);for(const b of document.querySelectorAll('.area-navigation [data-area]')){const id=b.dataset.area;ApexRender.text(b.querySelector('small'),id==='car'?'6 ramos':id==='store'?'3 banners':id==='team'?F(E.production(s.idle))+' CR/s':id==='champ'?s.cat+1+'/6 · '+(s.stage+1)+'/12':say('Ao vivo','Live'));ApexRender.attr(b,'aria-current',(!drawer.open?id==='track':id===({work:'car',team:'team',champ:'champ',store:'store'}[group(view)]))?'page':'false');ApexRender.toggle(b,'has-task',id==='car'?!!best():id==='team'?E.generators.some((_,i)=>genOpen(i)&&s.money>=E.cost(s.idle,i,1)):id==='store'?checkStage(3)&&(s.championship.tickets>0||s.money>=Shop.summonPrice(s)):id==='champ'?Ret.missions.some(m=>(s.daily[m.id]||0)>=m.goal&&!s.daily.claimed.includes(m.id)):false)}Ret.refresh(s);if(s.retention.planningPending&&!race){s.retention.planningPending=false;prepareRace()}const shown=drawer.open&&drawer.dataset.section==='apexV2';ApexRender.prop(power,'hidden',drawer.open);ApexRender.prop(guide,'hidden',drawer.open||s.onboarding.done);ApexRender.text(power.querySelector('[data-go="circuits"]'),t('circuits'));ApexRender.text(power.querySelector('[data-go="garage"]'),t('garage'));ApexRender.text($('v2PI'),t('power')+' '+ApexV2.pi(s).toFixed(2)+' / '+t('leader')+' '+V.leader(s).toFixed(2));ApexRender.text($('v2Car'),A.equippedCar(s).name+' · '+ApexProductView.division(s)+' '+(s.stage+1)+'/12');ApexRender.text($('v2Weather'),race&&race.event!=='clear'?(race.distance<1?say('Previsão para a próxima volta: ','Next lap forecast: '):say('Na pista: ','On track: '))+({rain:say('chuva','rain'),safety:'Safety car',red:say('bandeira vermelha','red flag')}[race.event]):'');const nextGoal=ApexJourney.next(s);ApexRender.text(guide.querySelector('span'),nextGoal?nextGoal.title+' · '+nextGoal.description:'Sua estreia está completa. Continue na Carreira.');ApexRender.text(guide.querySelector('[data-action="skip"]'),'Ocultar guia');
ApexRender.text($('wallet_money').parentElement.querySelector('small'),t('balance'));ApexRender.text($('wallet_xp').parentElement.querySelector('small'),'REP');ApexRender.prop($('wallet_gems').closest('article'),'hidden',!checkStage(7));ApexRender.text($('trackMissions'),t('missions')+' · '+Ret.missions.filter(m=>(s.daily[m.id]||0)>=m.goal&&!s.daily.claimed.includes(m.id)).length);ApexRender.prop($('trackBest'),'disabled',!best());const goal=s.catProgress?'Etapa '+(s.stage+1)+'/12 · '+s.rep+' / '+V.openRep(s,Math.min(12,s.stage+1))+' REP':'Próxima pista · '+s.rep+' / '+B.repToOpen(Math.min(23,s.maxCircuit+1))+' REP';ApexRender.text($('progressGoalText'),goal);ApexRender.prop($('progressGoalBar'),'max',Math.max(1,s.catProgress?V.openRep(s,Math.min(12,s.stage+1)):B.repToOpen(Math.min(23,s.maxCircuit+1))));ApexRender.prop($('progressGoalBar'),'value',s.rep);
if(race){if(Shop.init(s).boosts.ers>Date.now()&&cooldown<=0&&race.countdown<=0)$('boost').click();}if(s.laps!==lastLap){ApexEffects.spawnFloat('+'+F(A.reward(s))+' CR',innerWidth/2,innerHeight/2);lastLap=s.laps}
const result=s.night?.lastResult;if(result&&result!==lastFinish){lastFinish=result;ApexJourney.mark(s,'race_finish',{place:result.place});ApexCommercial.record(s,'race_finish',{place:result.place,secs:result.time});if(s.retention.lastDrop)notice=say('Caixa recebida: +','Crate received: +')+F(s.retention.lastDrop.amount)+' CR'}
updateLive();if(shown)renderPanel();
}
for(const b of document.querySelectorAll('.area-navigation [data-area]')){const small=b.querySelector('small');if(small&&b.dataset.area==='store')ApexRender.text(small,'3 banners');if(small&&b.dataset.area==='car')ApexRender.text(small,'6 ramos')}
$('strategyGo').onclick=()=>{strategy.close();NightView.setMaintenance(false)};
const insights=document.createElement('section');insights.className='race-insights';resultDialog.append(insights);
function showInsights(){const rows=s.retention?.lastInsights||[];ApexSafeDOM.render(insights,'<h3>Sua estratégia na pista</h3>'+rows.map(x=>'<p>'+esc(x.text)+' '+esc(x.action)+'</p>').join(''));const ch=s.retention?.weeklyChallenge?.lastResult;if(ch?.name){const p=document.createElement('p');p.textContent=ch.name+' · '+(ch.success?(ch.rewarded?'Objetivo concluído. Recompensas recebidas.':'Objetivo repetido. Recorde atualizado.'):'Objetivo ainda não concluído. Ajuste seu conjunto.');insights.append(p)}}
window.addEventListener('apex-race-analysis',showInsights);showInsights();
const resultArt=document.createElement('canvas');resultArt.width=440;resultArt.height=210;resultArt.className='v2-result-art';resultArt.setAttribute('aria-label','Seu carro na chegada');resultDialog.append(resultArt);let resultFrame=0,resultStarted=0;
function podium(now){
  resultFrame=0;
  if(!resultDialog.open)return;
  const elapsed=Math.min(1,(now-resultStarted)/1000);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||s.idle.settings.effects==='off';
  const finishCar=Shop.get(s.retention.lastRaceCar)||A.equippedCar(s);
  ApexCosmetics.drawResult(resultArt.getContext('2d'),finishCar,s.shop.equippedCosmetics||{},elapsed,reduced,Number(resultDialog.dataset.place));
  if(!reduced&&elapsed<1)resultFrame=requestAnimationFrame(podium);
}
new MutationObserver(()=>{
  cancelAnimationFrame(resultFrame);
  resultFrame=0;
  if(resultDialog.open){resultStarted=performance.now();podium(resultStarted)}
}).observe(resultDialog,{attributes:true,attributeFilter:['open']});
const beforeRender=render;render=function(){beforeRender();refreshHUD()};
const more=menus.settings.node,extra=document.createElement('section');extra.className='v2-preferences';ApexSafeDOM.render(extra,'<h3>Apex Idle 1.0</h3><label>'+t('language')+' <select id="v2Language"><option value="pt">Português</option><option value="en">English</option></select></label><label><input type="checkbox" id="v2Analytics"> Analytics opcional · desligado por padrão</label><label><input type="checkbox" id="v2Notifications"> Lembretes neste aparelho</label><p id="v2Tuning"></p><button id="v2Install">Instalar jogo</button><button id="v2DeleteCloud">Apagar dados de jogo da nuvem</button><p><a href="/termos.html" target="_blank">'+t('terms')+'</a> · <a href="/privacidade.html" target="_blank">'+t('privacy')+'</a></p><details><summary>Analytics local</summary><pre id="v2Funnel"></pre><button id="v2ExportAnalytics">Exportar eventos deste aparelho</button></details>');more.append(extra);$('v2Language').value=ApexI18n.language;$('v2Analytics').checked=s.consent.analytics===true;$('v2Language').onchange=e=>{s.idle.settings.language=e.target.value;ApexI18n.setLanguage(e.target.value);for(const b of document.querySelectorAll('.area-navigation [data-area]'))ApexRender.text(b.querySelector('span'),t({track:'track',car:'workshop',team:'team',champ:'championship',store:'store'}[b.dataset.area]));stamp='';commit();refreshHUD(true)};$('v2Analytics').onchange=e=>{s.consent.analytics=e.target.checked;resetEconomy();if(s.consent.analytics)ApexCommercial.record(s,'session_start');save();ApexRender.text($('v2Funnel'),JSON.stringify(ApexCommercial.report(s),null,2))};$('v2Notifications').onchange=async e=>{if(e.target.checked&&'Notification'in window){const permission=await Notification.requestPermission();s.idle.settings.notifications=permission==='granted';e.target.checked=s.idle.settings.notifications;save()}else{s.idle.settings.notifications=false;save()}};
$('v2ExportAnalytics').onclick=()=>{const blob=new Blob([JSON.stringify(ApexCommercial.exportEvents(s),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='apex-eventos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});$('v2Install').onclick=async()=>{if(installPrompt)await installPrompt.prompt();else ApexRender.text($('v2Tuning'),say('Use o menu do navegador → Instalar/Adicionar à tela inicial.','Use your browser menu → Install/Add to home screen.'))};
$('v2DeleteCloud').onclick=async()=>{if(!await SaveConfirmation.ask(say('Apagar progresso e eventos da nuvem? O save local e a conta de login serão mantidos.','Delete cloud progress and events? Local save and login account are kept.')))return;const client=ApexSupabase.client;if(!client){radio('Entre na sua conta para excluir dados da nuvem.');return}const {error}=await client.rpc('delete_my_game_data');if(error){radio('Não foi possível excluir: '+error.message);return}await client.auth.signOut();radio('Dados de jogo removidos da nuvem. Save local preservado.')};
ApexCommercial.loadTuning().then(info=>{s.meta.tuning=info.version;ApexRender.text($('v2Tuning'),'Tuning v'+info.version+(info.fallback?' · fallback local: '+info.error:''))});
ApexUpdate.start({labels:{ready:say('Nova versão. Recarregar','New version. Reload'),busy:say('Atualizando…','Updating…'),retry:say('Tente atualizar novamente','Try updating again')}});
ApexCommercial.record(s,'session_start');
let lastSaveFailure=0;const measuredSave=save;save=function(){const ok=measuredSave();if(ok===false&&!storageOk&&Date.now()-lastSaveFailure>60000){lastSaveFailure=Date.now();ApexCommercial.record(s,'save_error')}return ok};
function nextReturnAction(){
  const completed=Ret.contracts(s).some(contract=>contract.end<=Date.now());
  if(completed)return {view:'contracts',label:'Ver contratos',message:'Você tem um contrato pronto para recolher.'};
  const summary=Ret.returnSummary(s);
  return {view:'upgrades',label:'Ver melhorias',message:summary.message};
}
const returnPanel=document.createElement('section');returnPanel.className='v2-return';returnPanel.hidden=true;returnPanel.setAttribute('aria-live','polite');document.body.append(returnPanel);let lastReturnAt=0;
window.addEventListener('apex-offline-settled',event=>{const out=event.detail;if(!ApexAccess.canWrite()||!out||out.seconds<60||out.amount<=0||out.at===lastReturnAt)return;lastReturnAt=out.at;const summary=nextReturnAction();ApexSafeDOM.render(returnPanel,'<h3>Sua equipe continuou trabalhando</h3><p>+'+F(out.amount)+' CR · '+Math.floor(out.seconds/60)+' min fora. '+esc(summary.message)+'</p><button data-return-go>'+esc(summary.label)+'</button><button data-return-close>Continuar na pista</button>');returnPanel.hidden=false;if(analyticsHiddenAt&&Date.now()-analyticsHiddenAt>=30*60*1000){analyticsHiddenAt=0;ApexCommercial.record(s,'session_resume')}ApexCommercial.record(s,'offline_return',{seconds:out.seconds,amount:out.amount});ApexCommercial.record(s,'economy_action',{action:Shop.hash('offline_return'),deltaCR:out.amount,passive:true});if(economyState===s)economyObserved.CR+=out.amount});
returnPanel.onclick=event=>{if(event.target.closest('[data-return-close]'))returnPanel.hidden=true;if(event.target.closest('[data-return-go]')){returnPanel.hidden=true;go(nextReturnAction().view)}};
if(s.retention.lastReturn?.seconds>=60&&s.retention.lastReturn.amount>0){const dialog=document.createElement('dialog');dialog.className='idle-dialog';const h=document.createElement('h2'),p=document.createElement('p'),b=document.createElement('button');h.textContent=say('Baú de retorno','Welcome back');const next=nextReturnAction();p.textContent=F(s.retention.lastReturn.amount)+' CR · '+Math.floor(s.retention.lastReturn.seconds/60)+' min. '+next.message;ApexCommercial.record(s,'offline_return',{seconds:s.retention.lastReturn.seconds,amount:s.retention.lastReturn.amount});ApexCommercial.record(s,'economy_action',{action:Shop.hash('offline_return'),deltaCR:s.retention.lastReturn.amount,passive:true});b.textContent=t('play');b.onclick=()=>dialog.close();const action=document.createElement('button');action.textContent=next.label;action.onclick=()=>{dialog.close();go(next.view)};dialog.append(h,p,b,action);document.body.append(dialog);dialog.showModal()}
ApexRender.schedule('contracts-1',()=>{const day=Shop.day();if(!s.idle.settings.notifications||!document.hidden||typeof Notification==='undefined'||Notification.permission!=='granted'||s.retention.notifiedDay===day||!Ret.contracts(s).some(c=>c.end<=Date.now()))return;navigator.serviceWorker?.ready.then(reg=>reg.showNotification('Apex Idle',{body:say('Um contrato foi concluído. Recolha os materiais na Equipe.','A contract is complete. Collect materials in Team.'),icon:'/icons/icon-192.png',tag:'apex-contract'})).then(()=>{s.retention.notifiedDay=day;save()}).catch(()=>{})},60000,{background:true});
let analyticsHiddenAt=0;document.addEventListener('visibilitychange',()=>{if(document.hidden)analyticsHiddenAt=Date.now();else if(analyticsHiddenAt&&Date.now()-analyticsHiddenAt>=30*60*1000){analyticsHiddenAt=0;ApexCommercial.record(s,'session_resume');save()}});
ApexJourney.init(s);refreshHUD(true);if(sharedFormation){const shortcut=document.createElement('button');shortcut.className='v2-shared-formation';shortcut.textContent='Ver composição recebida';shortcut.onclick=()=>{open('garage');shortcut.remove()};document.body.append(shortcut)}save();
})();
