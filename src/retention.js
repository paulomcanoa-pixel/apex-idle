(function(root){
const V=root.ProgressionV2||require('./progression-v2'),Shop=root.ApexShop||require('./shop'),Talents=root.ApexTalents||require('./talents'),Journey=root.ApexJourney||require('./career-journey');
function init(s,now=Date.now()){if(!s.retention)s.retention={drop:{none:0,rare:0,legendary:0},claims:[],passXp:0,passClaimed:[],contracts:[],perfect:[],events:{}};const r=s.retention,period=28*86400000;if(!r.passStartedAt)r.passStartedAt=now;if(now-r.passStartedAt>=period){r.passArchive=[{at:r.passStartedAt,xp:r.passXp,claimed:r.passClaimed.slice()},...(r.passArchive||[])].slice(0,12);r.passStartedAt+=Math.floor((now-r.passStartedAt)/period)*period;r.passXp=0;r.passClaimed=[]}return r}
function income(s){return(V.reward(s)*6.3/(V.duration(s)*5+6))+(s.idle?.units||[]).reduce((n,u,i)=>n+V.B.P.gens[i].rate*u*2**s.idle.upgrades[i],0)}
function offline(s,now=Date.now(),teamRate=0){const r=init(s),at=s.idle.at,cap=(8+(s.shop?.offlineCapHours||0))*3600,seconds=Math.min(cap,Math.max(0,(now-at)/1000,s.shop?.returnMinHours?Math.min(cap,s.shop.returnMinHours*3600):0));if(now<at){s.meta.clockWarnings=(s.meta.clockWarnings||0)+1;return{seconds:0,amount:0,clockWarning:true}}const rate=.1*teamRate+.03*(V.reward(s)*6.3/(V.duration(s)*5+6)),amount=seconds*rate*(1+Talents.effects(s).offline);if(s.money+amount<1e100){s.money+=amount;s.idle.totalEarned+=amount;s.idle.cycleEarned+=amount}s.idle.at=now;Shop.init(s).returnMinHours=0;Shop.init(s).lastOfflineRate=rate;r.lastReturn={seconds,amount};if(seconds>=60)Journey.mark(s,'offline_return');return{seconds,amount}}
function refresh(s,now=Date.now()){const d=s.daily,date=Shop.day(now),week=Shop.week(now);if(d.day!==date){const difference=d.day?Math.round((Date.parse(date)-Date.parse(d.day))/86400000):1;if(difference>1){if(difference===2&&d.pauseWeek!==week)d.pauseWeek=week;else d.streak=0}d.day=date;d.claimed=[];d.races=0;d.upgrades=0;d.top=0;d.chest=false}if(d.week!==week){if(s.shop){if(s.shop.eventWeek&&s.shop.eventWeek!==week){s.money+=s.shop.eventTokens*V.B.lapReward(V.index(s))*.5;s.shop.eventTokens=0}s.shop.eventWeek=week}d.week=week;d.weekRaces=0;d.weeklyClaimed=[]}return d}
const missions=[{id:'races',name:'Complete 5 corridas',goal:5},{id:'top',name:'Termine 3 vezes entre os cinco',goal:3},{id:'upgrades',name:'Compre 3 melhorias',goal:3}];
function claimDaily(s,id,now=Date.now()){const d=refresh(s,now);
  if(d.claimed.includes(id))return false;
  const m=missions.find(x=>x.id===id);
  if(!m||(d[id]||0)<m.goal)return false;
  d.claimed.push(id);
  init(s).passXp+=50;
  s.money+=Math.ceil(income(s)*600);
  s.rep+=3;
  s.championship.gems+=2;
  V.addXp(s,50);
  root.ApexLootHooks?.mission(s,'daily');
  return true}
function chest(s,now=Date.now()){const d=refresh(s,now);if(d.chest)return false;d.chest=true;d.streak=d.streak%7+1;s.money+=Math.ceil(income(s)*300);s.championship.tickets++;Shop.init(s).featuredTickets++;if(d.streak===7){s.championship.gems+=20;s.materials+=30}return true}
function claimWeekly(s,now=Date.now()){const d=refresh(s,now);
  if(d.weekRaces<30||d.weeklyClaimed.includes('races'))return false;
  d.weeklyClaimed.push('races');
  init(s).passXp+=500;
  s.championship.gems+=30;
  s.rep+=40;
  V.addXp(s,300);
  root.ApexLootHooks?.mission(s,'weekly');
  return true}
function weather(random=Math.random){const r=random();return r<.12?'rain':r<.22?'safety':r<.24?'red':'clear'}
function raceDone(s,result,random=Math.random,{ers=false,pitWindow=false,event='clear',circuit=s.circuit,challenge=null,carId='',trackProfile=null,totalLaps=5,bestLap=0,pitStops=0}={}){const r=init(s),p=r.drop;
  refresh(s);
  if(s.cat>=3){r.challenges=r.challenges||{};
  const stars=r.challenges[circuit]||[],goals=[result.place===1&&result.time<=V.B.screenLap(V.index(s))*5,!ers,event==='rain'];
  goals.forEach((ok,i)=>{if(ok&&!stars.includes(i)){stars.push(i);
  s.championship.gems+=10}});
  r.challenges[circuit]=stars}
  if(s.cat>=4&&result.place===1&&!(r.hall||[]).includes(circuit)){r.hall=r.hall||[];
  r.hall.push(circuit);
  const cosmetic=Shop.catalog.items.find(x=>x.category==='cosmeticos'&&x.appears.includes('conquista')&&!s.shop.inventory.cosmetics.includes(x.id));
  if(cosmetic)s.shop.inventory.cosmetics.push(cosmetic.id)}s.daily.weekRaces++;
  r.passXp+=5;
  const drop=null;
  r.lastDrop=null;
  if(result.place===1&&ers&&pitWindow){s.money+=Math.floor(result.prize*.5);
  s.championship.tickets++;
  r.perfect.push({at:Date.now(),circuit:s.circuit,time:result.time});r.perfect=r.perfect.slice(-100)}
  if(event!=='clear'){const penalty=Math.floor(result.prize*.08);
  s.money=Math.max(0,s.money-penalty);
  r.lastEvent={event,penalty}}
  Journey.mark(s,'race_finish',{place:result.place});
  if(challenge)finishChallenge(s,result,{challenge,carId,trackProfile,event,pitWindow,totalLaps,bestLap,pitStops,circuit});
  return drop}
function contracts(s){return init(s).contracts}
function startContract(s,car,minutes,owned,now=Date.now()){const list=contracts(s);if(![1,5,15].includes(minutes)||!owned.includes(car)||list.length>=3||list.some(x=>x.car===car))return false;list.push({id:car+'-'+now,car,minutes,end:now+minutes*60000});return true}
function claimContract(s,id,now=Date.now()){const list=contracts(s),i=list.findIndex(x=>x.id===id&&x.end<=now);if(i<0)return false;const [c]=list.splice(i,1);s.money+=Math.ceil(income(s)*c.minutes*30);s.materials+={1:2,5:8,15:24}[c.minutes];return true}
function passProgress(s){const r=init(s);let xp=r.passXp,tier=0;while(tier<40&&xp>=100+25*(tier+1)){xp-=100+25*(tier+1);tier++}return{tier,xp,nextXp:tier===40?0:100+25*(tier+1),claimable:Array.from({length:tier},(_,i)=>i+1).filter(t=>!r.passClaimed.includes(t))}}
function passTier(s){return passProgress(s).tier}
function claimPass(s,tier){const r=init(s);if(!Number.isInteger(tier)||tier<1||tier>passTier(s)||r.passClaimed.includes(tier))return false;r.passClaimed.push(tier);if(tier%10===0){s.championship.gems+=50;s.championship.tickets+=2}else if(tier%5===0)s.championship.gems+=20;else if(tier%2)s.championship.tickets++;else s.money+=Math.ceil(income(s)*(10+tier)*60);return true}
function claimAllPass(s){return passProgress(s).claimable.reduce((n,t)=>n+(claimPass(s,t)?1:0),0)}
function returnSummary(s){const out=init(s).lastReturn||{seconds:0,amount:0};const candidates=V.B.branches.map((b,i)=>({name:b.name,cost:V.cost(s,i),open:V.unlockedBranch(s,i)&&s.levels[i]<100})).filter(x=>x.open&&Number.isFinite(x.cost));candidates.sort((a,b)=>a.cost-b.cost);const n=candidates[0],nextPurchase=n?{name:n.name,cost:n.cost,affordable:s.money>=n.cost,remaining:Math.max(0,n.cost-s.money)}:null;return{...out,nextPurchase,message:n?(s.money>=n.cost?'Você já pode investir em '+n.name+'.':'Continue preparando a próxima melhoria de '+n.name+'.'):'Sua equipe mantém a Aurora em movimento.'}}
const challengeRules=[
  {id:'technical',name:'Precisão nas curvas',description:'Circuito técnico. Termine entre os cinco primeiros com um acerto de curvas.',trackProfile:'curvas',event:'clear',windowMult:1,targetPlace:5},
  {id:'rain',name:'Domine a chuva',description:'Chuva prevista. Termine entre os cinco primeiros e escolha seus pneus com cuidado.',trackProfile:null,event:'rain',windowMult:1,targetPlace:5},
  {id:'tyres',name:'Poupe para atacar',description:'Desgaste elevado. Termine entre os cinco primeiros e faça a parada dentro da janela.',trackProfile:null,event:'clear',windowMult:.8,targetPlace:5,requirePit:true},
  {id:'heritage',name:'Espírito dos clássicos',description:'Use um histórico até 1991 e termine entre os cinco primeiros. O Lotus 49 inicial participa.',trackProfile:null,event:'clear',windowMult:1,targetPlace:5,eraMax:1991},
  {id:'qualifying',name:'Uma volta perfeita',description:'Cinco voltas para bater a meta de volta definida na largada pelo ritmo do seu conjunto. Escolha pneus e ERS para uma tentativa rápida; a posição não é requisito.',trackProfile:null,event:'clear',windowMult:1,targetPlace:10,totalLaps:5,mode:'qualifying'},
  {id:'endurance',name:'Resistência da Aurora',description:'Oito voltas. Termine no top 5 e faça uma parada dentro da janela dos pneus. Preserve o segundo jogo até a bandeirada.',trackProfile:null,event:'clear',windowMult:1,targetPlace:5,totalLaps:8,requirePit:true,mode:'endurance'}
];
const weekMs=604800000,rotationStart=Date.UTC(2026,10,9),ruleAt=(week,count=6)=>challengeRules[((Math.floor((Date.parse(week)-(count===4?0:rotationStart))/weekMs)%count)+count)%count];
function archive(s){const r=init(s);if(!Array.isArray(r.eventHistory))r.eventHistory=[];if(!Array.isArray(r.eventTrophies))r.eventTrophies=[];if(!Array.isArray(r.eventRecords))r.eventRecords=[];return{history:r.eventHistory,trophies:r.eventTrophies,records:r.eventRecords}}
function weeklyChallenge(s,now=Date.now()){
  const r=init(s,now),observed=Shop.week(now),week=r.weeklyChallenge?.week>observed?r.weeklyChallenge.week:observed;
  // Saves from the four-event rotation keep their active rule and their claimed reward.
  if(r.weeklyChallenge&&!r.weeklyChallenge.ruleId)r.weeklyChallenge.ruleId=ruleAt(r.weeklyChallenge.week,4).id;
  if(!r.weeklyChallenge||r.weeklyChallenge.week!==week){
    if(r.weeklyChallenge){archive(s);const q=r.weeklyChallenge;r.eventHistory=[{week:q.week,ruleId:q.ruleId,completed:q.completed,bestTime:q.bestTime,bestLap:q.bestLap||0,attempts:q.attempts},...r.eventHistory.filter(x=>x.week!==q.week)].slice(0,12)}
    r.weeklyChallenge={week,ruleId:ruleAt(week).id,completed:false,bestTime:0,bestLap:0,attempts:0};
  }
  const state=r.weeklyChallenge,rule=challengeRules.find(x=>x.id===state.ruleId)||ruleAt(week);
  return{totalLaps:5,mode:'race',...rule,week,completed:state.completed,bestTime:state.bestTime,bestLap:state.bestLap||0,targetLapSeconds:state.running?.targetLapSeconds||0,queued:!!state.queued,running:!!state.running};
}
function startChallenge(s,now=Date.now()){weeklyChallenge(s,now);const q=s.retention.weeklyChallenge;if(q.queued||q.running)return false;q.queued=true;return true}
function takeChallenge(s,now=Date.now(),options={}){const c=weeklyChallenge(s,now),q=s.retention.weeklyChallenge;if(!q.queued||q.running||q.attempts>=1e9)return null;q.queued=false;q.attempts++;const token=c.week+'-'+q.attempts,targetLapSeconds=c.mode==='qualifying'?(Number.isFinite(options.duration)&&options.duration>0?options.duration:V.duration(s))*1.02:0;q.running={token,started:now,targetLapSeconds};return{...c,token,targetLapSeconds}}
function cancelChallenge(s,token){const q=init(s).weeklyChallenge;if(!token||!q?.running||q.running.token!==token)return false;q.running=null;return true}
function recoverChallenge(s){const q=init(s).weeklyChallenge;if(!q?.running)return false;q.running=null;q.lastResult={success:false,rewarded:false,interrupted:true};return true}
function finishChallenge(s,result,options={},now=Date.now()){const c=weeklyChallenge(s,now),q=s.retention.weeklyChallenge,submitted=options.challenge;if(!submitted||submitted.week!==c.week||submitted.id!==c.id||q.running?.token!==submitted.token)return null;const target=q.running.targetLapSeconds;q.running=null;if(!Number.isFinite(result?.time)||result.time<=0||!Number.isInteger(result.place)||result.place<1||result.place>10)return null;
  const D=root.LegendsData||(typeof require==='function'?require('../legends-data'):null),car=D?.cars.find(x=>x.id===options.carId),eligible=!!car&&(!c.eraMax||Number(car.year)<=c.eraMax),lap=Number.isFinite(options.bestLap)&&options.bestLap>0?options.bestLap:0;
  const distanceOK=c.mode==='race'||options.totalLaps===c.totalLaps,clockOK=c.mode!=='qualifying'||lap>0&&target>0&&lap<=target,pitOK=!c.requirePit||options.pitWindow===true&&(c.mode!=='endurance'||options.pitStops>=1);
  const success=eligible&&result.place<=c.targetPlace&&pitOK&&distanceOK&&clockOK&&(c.event!=='rain'||options.event==='rain')&&(!c.trackProfile||options.trackProfile===c.trackProfile);
  const out={name:c.name,success,eligible,rewarded:false,targetLapSeconds:target||0,bestLap:lap};
  if(success){
    q.bestTime=q.bestTime?Math.min(q.bestTime,result.time):result.time;if(lap)q.bestLap=q.bestLap?Math.min(q.bestLap,lap):lap;
    archive(s);const circuit=Number.isInteger(options.circuit)?options.circuit:s.circuit,key=c.id+':'+circuit+':'+s.cat,previous=s.retention.eventRecords.find(x=>x.key===key),score=c.mode==='qualifying'?lap:result.time;
    if(!previous||score<previous.score)s.retention.eventRecords=[{key,ruleId:c.id,circuit,category:s.cat,score,carId:car.id,week:c.week},...s.retention.eventRecords.filter(x=>x.key!==key)].slice(0,72);
    if(!q.completed){q.completed=true;Shop.init(s);s.championship.tickets+=2;s.materials+=20;init(s).passXp+=150;out.rewarded=true;const trophy=s.retention.eventTrophies.find(x=>x.id===c.id);if(trophy){trophy.lastWeek=c.week;trophy.completions=Math.min(1e9,trophy.completions+1)}else s.retention.eventTrophies.push({id:c.id,firstWeek:c.week,lastWeek:c.week,completions:1})}
  }
  q.lastResult=out;return out;
}
function valid(s){const r=s?.retention;if(r===undefined)return true;if(!r||typeof r!=='object'||Array.isArray(r))return false;
  if(r.passXp!==undefined&&(!Number.isFinite(r.passXp)||r.passXp<0||r.passXp>1e12))return false;
  if(r.passClaimed!==undefined&&(!Array.isArray(r.passClaimed)||r.passClaimed.length>40||new Set(r.passClaimed).size!==r.passClaimed.length||!r.passClaimed.every(n=>Number.isInteger(n)&&n>=1&&n<=40)))return false;
  const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x)),rule=x=>challengeRules.some(c=>c.id===x),positive=x=>Number.isFinite(x)&&x>0,nonnegative=x=>Number.isFinite(x)&&x>=0,count=x=>Number.isSafeInteger(x)&&x>=0&&x<=1e9;
  if(r.eventHistory!==undefined&&(!Array.isArray(r.eventHistory)||r.eventHistory.length>12||new Set(r.eventHistory.map(x=>x?.week)).size!==r.eventHistory.length||!r.eventHistory.every(x=>x&&date(x.week)&&rule(x.ruleId)&&typeof x.completed==='boolean'&&nonnegative(x.bestTime)&&nonnegative(x.bestLap)&&count(x.attempts))))return false;
  if(r.eventTrophies!==undefined&&(!Array.isArray(r.eventTrophies)||r.eventTrophies.length>6||new Set(r.eventTrophies.map(x=>x?.id)).size!==r.eventTrophies.length||!r.eventTrophies.every(x=>x&&rule(x.id)&&date(x.firstWeek)&&date(x.lastWeek)&&x.firstWeek<=x.lastWeek&&count(x.completions)&&x.completions>0)))return false;
  if(r.eventRecords!==undefined&&(!Array.isArray(r.eventRecords)||r.eventRecords.length>72||new Set(r.eventRecords.map(x=>x?.key)).size!==r.eventRecords.length||!r.eventRecords.every(x=>x&&rule(x.ruleId)&&Number.isInteger(x.circuit)&&x.circuit>=0&&x.circuit<24&&Number.isInteger(x.category)&&x.category>=0&&x.category<6&&x.key===x.ruleId+':'+x.circuit+':'+x.category&&positive(x.score)&&typeof x.carId==='string'&&x.carId.length<64&&date(x.week))))return false;
  const q=r.weeklyChallenge;if(q===undefined)return true;
  return!!(q&&typeof q==='object'&&!Array.isArray(q)&&date(q.week)&&(q.ruleId===undefined||rule(q.ruleId))&&typeof q.completed==='boolean'&&nonnegative(q.bestTime)&&(q.bestLap===undefined||nonnegative(q.bestLap))&&count(q.attempts)&&(q.queued===undefined||typeof q.queued==='boolean')&&(!q.running||q.running.token===q.week+'-'+q.attempts&&Number.isSafeInteger(q.running.started)&&q.running.started>=0&&(q.running.targetLapSeconds===undefined||nonnegative(q.running.targetLapSeconds))));
}
const api={init,income,offline,refresh,missions,claimDaily,chest,claimWeekly,weather,raceDone,startContract,claimContract,contracts,passTier,claimPass,passProgress,claimAllPass,returnSummary,weeklyChallenge,startChallenge,takeChallenge,cancelChallenge,recoverChallenge,finishChallenge,archive,challengeRules,valid};root.ApexRetention=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

