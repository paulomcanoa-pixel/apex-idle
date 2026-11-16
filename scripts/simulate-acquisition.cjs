'use strict';
// Deterministic audit of the shipped formulas; these are scenarios, not player data.
const assert=require('node:assert/strict');
const V=require('../src/progression-v2');
const Shop=require('../src/shop');
const Ret=require('../src/retention');
const A=require('../engine');
const E=require('../game/economy');
const Academy=require('../academy-model');
const Adapter=require('../src/v2-adapter');
const NOW=Date.UTC(2026,10,15,12);
const round=(n,d=4)=>Number(n.toFixed(d));
const copy=s=>JSON.parse(JSON.stringify(s));

function mythicDistribution(banner,wish=''){
  let survival=1,mean=0,p50=null,p90=null,p95=null,p99=null,n=0;
  for(;n<100000&&survival>1e-14;n++){
    mean+=survival;
    const rows=Shop.bannerRates(banner,wish,n);
    const total=rows.reduce((v,r)=>v+r.chance,0);
    assert(Math.abs(total-100)<1e-9,'As probabilidades devem somar 100%.');
    const hazard=rows.filter(r=>r.rank===4).reduce((v,r)=>v+r.chance,0)/total;
    assert(hazard>0&&hazard<1,'Sem garantia rígida de mítico.');
    survival*=1-hazard;
    for(const percentile of [50,90,95,99]){
      if(1-survival<percentile/100)continue;
      if(percentile===50&&p50===null)p50=n+1;
      if(percentile===90&&p90===null)p90=n+1;
      if(percentile===95&&p95===null)p95=n+1;
      if(percentile===99&&p99===null)p99=n+1;
    }
  }
  const chance=misses=>round(Shop.bannerRates(banner,wish,misses).filter(r=>r.rank===4).reduce((v,r)=>v+r.chance,0),6);
  return{banner,wish:wish||null,meanPulls:round(mean,3),p50,p90,p95,p99,chancePercent:{first:chance(0),after699Misses:chance(699)},survivalRemainder:survival,steps:n};
}

function snapshot(kind){
  const s=A.initial();Shop.init(s);Ret.init(s,NOW);s.money=0;s.idle.at=NOW;
  if(kind==='kart-stage4'){
    s.stage=3;s.circuit=6;s.maxCircuit=6;s.globalPeak=4;
    s.levels=[10,8,6,5,3,2];s.idle.units=[15,8,2,1,0,0];s.idle.upgrades=[1,0,0,0,0,0];
  }
  if(kind==='f1-stage6'){
    s.cat=4;s.stage=5;s.circuit=22;s.maxCircuit=22;s.globalPeak=54;s.escuderia=50;
    s.season.titles=4;s.levels=[20,18,15,15,10,10];s.idle.units=[25,20,10,5,1,0];s.idle.upgrades=[2,1,1,0,0,0];
  }
  s.idle.categoryScale=V.scale(s);s.idle.escuderia=s.escuderia;s.idle.seasonTitles=s.season.titles;
  return s;
}

function offlineScenario(kind,hours){
  const s=snapshot(kind),teamCRps=E.production(s.idle),result=Ret.offline(s,NOW+hours*3600000,teamCRps);
  const next=Ret.returnSummary(s).nextPurchase;
  const engine=V.buy(copy(s),0,'max');
  const teamCopy=copy(s),teamBought=E.buy(teamCopy,0,'max');
  return{snapshot:kind,hours,creditedHours:result.seconds/3600,teamCRps:round(teamCRps),offlineCR:round(result.amount,2),nextUpgrade:next?{name:next.name,cost:next.cost,affordable:next.affordable}:null,
    alternatives:{engineLevels:engine.bought,engineSpent:engine.spent,pitCrewUnits:teamBought,pitCrewSpent:round(result.amount-teamCopy.money,2),principalPulls:s.stage>=3?Math.floor(result.amount/Shop.summonPrice(s)):0,summonUnlocked:s.stage>=3}};
}

function acquisitionRoutes(){
  const expectedProjects=[90,240,600,1800,4500],expectedTrade=[100,300,800,4000,15000];
  const rows=Shop.rarities.map((rarity,i)=>{
    const item=Shop.catalog.items.find(c=>c.historical&&!c.exclusive&&c.rarity===rarity&&c.id!=='lotus49');
    assert.equal(Shop.projectCost(item.id),expectedProjects[i]);assert.equal(item.price.pts,expectedTrade[i]);assert.equal(item.duplicate_pts,expectedTrade[i]/2);
    const locked=snapshot('new-player');locked.materials=1e6;locked.stage=4;assert.equal(Shop.buildProject(locked,item.id),false);
    locked.stage=5;locked.materials=expectedProjects[i]-1;assert.equal(Shop.buildProject(locked,item.id),false);
    locked.materials=expectedProjects[i];assert.equal(Shop.buildProject(locked,item.id),true);assert.equal(locked.materials,0);assert.equal(Shop.buildProject(locked,item.id),false);
    return{rarity,example:item.name,materials:expectedProjects[i],racesAt3Materials:Math.ceil(expectedProjects[i]/3),tradePoints:item.price.pts,duplicatePoints:item.duplicate_pts};
  });
  const exclusives=Shop.catalog.items.filter(c=>c.historical&&c.exclusive).map(item=>{
    const s=snapshot('f1-stage6');s.money=1e99;s.materials=1e9;s.shop.pts=1e9;
    assert.equal(Shop.projectCost(item.id),Infinity);assert.equal(Shop.buildProject(s,item.id),false);assert.equal(Shop.canBuy(s,item.id).ok,false);
    assert.equal(Shop.summon(s,'banner-lendas',1,()=>.5,{currency:'cr'}),null);
    return{id:item.id,name:item.name,route:'banner-lendas',currency:'fichas',project:false,shop:false};
  });
  assert.equal(exclusives.length,2);assert.equal(Shop.bannerCars('banner-padrao').length,20);
  return{rows,exclusives,projectGate:'Kart, etapa 6 (stage 5), ou categoria superior; não possuir o carro; materiais suficientes.'};
}

const profiles=[{id:'ACTIVE',sessions:3,minutesPerSession:40},{id:'CASUAL',sessions:1,minutesPerSession:20},{id:'OFFLINE',sessions:3,minutesPerSession:0}];
function distribution(values,total,horizonDays){const achieved=values.filter(Number.isFinite).sort((a,b)=>a-b),at=p=>achieved.length>=Math.ceil(total*p)?round(achieved[Math.ceil(total*p)-1],3):null;return{runs:total,completed:achieved.length,censored:total-achieved.length,horizonDays,p50Days:at(.5),p90Days:at(.9),p95Days:at(.95),minDays:achieved.length?round(achieved[0],3):null,maxObservedDays:achieved.length?round(achieved.at(-1),3):null}}
function scenarioState(){const s=snapshot('kart-stage4');s.stage=5;s.circuit=10;s.maxCircuit=10;s.globalPeak=6;s.materials=0;s.shop.pts=0;s.idle.categoryScale=V.scale(s);return s}
function acquisitionScenario(profile,seed,days){
  const baseline=scenarioState(),gacha=copy(baseline),academy=copy(baseline),offline=copy(baseline),random=Shop.rng(seed),raceRandom=Shop.rng(seed^0x5f3759df),target='mp44',driver='real_fittipaldi';
  Academy.init(academy,NOW);Academy.choose(academy,driver,NOW);gacha.shop.wish=target;
  const raceSeconds=A.duration(baseline)*5+6,teamRate=E.production(baseline.idle),lapReward=A.reward(baseline),cost=Shop.summonPrice(baseline),rewards=[];
  for(let place=1;place<=10;place++){const probe=copy(baseline),before=probe.materials,result=V.finish(probe,place,raceSeconds,place);rewards[place]={prize:result.prize,materials:probe.materials-before}}
  let projectMaterials=0,races=0,pulls=0,crIn=0,crSpent=0,pointsIn=0,previousEnd=NOW;
  const outcome={gacha:null,project:null,trade:null,academy:null};
  for(let day=0;day<days;day++)for(let visit=0;visit<profile.sessions;visit++){
    const start=NOW+(day*24+visit*24/profile.sessions)*3600000,end=start+profile.minutesPerSession*60000,dayAt=(end-NOW)/86400000;
    offline.idle.at=previousEnd;const absent=Ret.offline(offline,start,teamRate).amount;previousEnd=end;
    let sessionCR=teamRate*profile.minutesPerSession*60;
    const count=Math.floor(profile.minutesPerSession*60/raceSeconds);
    for(let i=0;i<count;i++){
      // Fixed competence assumption: 30% podiums, otherwise P4-P10; weather uses the shipped model.
      const place=raceRandom()<.3?1+Math.floor(raceRandom()*3):4+Math.floor(raceRandom()*7),event=Ret.weather(raceRandom);
      const reward=rewards[place];sessionCR+=lapReward*5+reward.prize-(event==='clear'?0:Math.floor(reward.prize*.08));
      projectMaterials+=reward.materials;races++;Academy.record(academy,{place,event,affinity:true});
    }
    const gross=absent+sessionCR;crIn+=gross;gacha.money+=gross*.25;academy.money+=gross;
    if(outcome.project===null&&projectMaterials>=Shop.projectCost(target)){const probe=copy(baseline);probe.materials=projectMaterials;assert(Shop.buildProject(probe,target));outcome.project=dayAt}
    while((outcome.gacha===null||outcome.trade===null)&&gacha.money>=cost){
      const results=Shop.summon(gacha,'banner-padrao',1,random);assert(results?.length===1);pulls++;crSpent+=cost;pointsIn+=results[0].points;
      if(outcome.gacha===null&&results[0].id===target)outcome.gacha=dayAt;
      if(outcome.trade===null&&gacha.shop.pts>=Shop.get(target).price.pts){const probe=copy(gacha);probe.shop.inventory.cars=probe.shop.inventory.cars.filter(id=>id!==target);assert(Shop.buy(probe,target,{currency:'pts',now:end}).ok);outcome.trade=dayAt}
    }
    // Visits, not background timers, collect observations and sign contracts.
    for(const at of [start,end]){
      Academy.collect(academy,at);
      if(outcome.academy===null&&Academy.sign(academy,at))outcome.academy=(at-NOW)/86400000;
      if(outcome.academy===null&&!academy.academy.assignment&&!academy.academy.contract){if(!Academy.negotiate(academy,at))Academy.start(academy,'endurance',at)}
    }
  }
  return{outcome,races,pulls,crIn,crSpent,pointsIn,materials:projectMaterials};
}
function simulateProfiles({runs=32,days=90,seed=20261116}={}){
  assert(Number.isInteger(runs)&&runs>0&&runs<=128);assert(Number.isInteger(days)&&days>0&&days<=180);assert(Number.isSafeInteger(seed));
  const state=scenarioState();
  return{seed,runs,days,targetCar:'mp44',targetDriver:'real_fittipaldi',snapshot:'Kart etapa 6, carro/piloto inicial, melhorias [10,8,6,5,3,2], equipe [15,8,2,1,0,0], sem títulos.',assumptions:[
    'Cenário após desbloqueios, não tempo desde criação da conta. Estágio/equipe/melhorias congelados; não prevê comportamento humano nem retenção.',
    'ACTIVE abre 3 vezes/dia por 40min; CASUAL 1 vez/dia por 20min; OFFLINE coleta 3 vezes/dia e não completa corridas. A ausência segue o teto e fórmula de Ret.offline.',
    'Cada corrida usa duração real × 5 voltas + 6s; cinco prêmios de volta, prêmio de V.finish e penalidade de clima. Hipótese de habilidade: 30% de pódios; demais P4-P10, clima Ret.weather, combo inicial ativo. Sem ERS/pit perfeito, missões, baús, passe, bônus ou dinheiro pago.',
    '25% do CR bruto disponível para invocar no banner principal, desejo MP4/4. Shop.summon aplica taxas, garantias e duplicatas reais; contadores começam zerados. Compra em lote não muda a amostragem.',
    'Projeto e troca são alternativas independentes: prazo para juntar recursos e executar a compra se o carro ainda faltar. Materiais e pontos não são compartilhados com outros gastos; a troca continua medindo pontos mesmo se o gacha já tiver dado o alvo.',
    'Academia usa observar/endurance, provas reais exigidas pelo modelo e assinatura nas visitas; saldo próprio sem concorrência de gastos. Sem corridas, OFFLINE não cumpre provas, mesmo com fragmentos.',
    'Percentis por posto sobre TODOS os runs. null significa que a proporção não foi atingida até o horizonte; não é média apenas dos sortudos. Dias são tempo de calendário, com compras contabilizadas no fim da sessão.'
  ],rates:{lapSeconds:round(A.duration(state)),teamCRps:round(E.production(state.idle)),principalPullCR:Shop.summonPrice(state),projectMaterials:Shop.projectCost('mp44'),tradePoints:Shop.get('mp44').price.pts},profiles:profiles.map(profile=>{
    const rows=Array.from({length:runs},(_,i)=>acquisitionScenario(profile,seed+i*997,days)),average=key=>round(rows.reduce((n,row)=>n+row[key],0)/runs,2);
    return{...profile,routes:Object.fromEntries(['gacha','project','trade','academy'].map(route=>[route,distribution(rows.map(row=>row.outcome[route]),runs,days)])),economy:{meanCRSources:average('crIn'),meanCRGachaSinks:average('crSpent'),meanDuplicatePoints:average('pointsIn'),meanRaceMaterials:average('materials'),meanPulls:average('pulls'),races:rows[0].races}};
  })};
}
function buildReport(options){
  const mythic=Shop.bannerCars('banner-padrao').find(c=>c.rarity==='mitico');
  const common=Shop.bannerCars('banner-padrao').find(c=>c.rarity==='comum');
  const normal=mythicDistribution('banner-padrao');assert(Math.abs(normal.meanPulls-700)<.001);
  const base=Shop.bannerRates('banner-padrao','',699),wish=Shop.bannerRates('banner-padrao',mythic.id,699);
  assert.equal(wish.find(r=>r.car.id===mythic.id).chance,2*base.find(r=>r.car.id===mythic.id).chance);
  return{method:'Fórmulas reais em cenários fixos, sem dados de jogadores; sobrevivência S(n)=produto(1-p(k)), E[N]=soma S(n). Percentis para qualquer mítico, desde contador zero. Cada alternativa de compra usa uma cópia independente do saldo offline.',
    mythic:[normal,mythicDistribution('banner-padrao',mythic.id),mythicDistribution('banner-padrao',common.id),mythicDistribution('banner-lendas')],
    acquisition:acquisitionRoutes(),offline:['new-player','kart-stage4','f1-stage6'].flatMap(kind=>[2,8].map(hours=>offlineScenario(kind,hours))),onboarding:simulateOnboarding(),scenarios:simulateProfiles(options)};
}
function simulateOnboarding({days=7}={}){
  return {horizonDays:days,method:'Trajetória determinística desde A.initial. Sem pagamentos, cliques manuais, presentes, baús ou missões. A cada bandeirada compra até 12 melhorias entre as liberadas, sempre a mais barata, usando até 60% do caixa; até três unidades de equipe usando 20% do saldo. Corrida de cinco voltas com posição prevista por Adapter.place, sem simular decisões de pneus/ERS. É uma política de teste, não uma previsão de jogadores. OFFLINE parte da mesma conta nova, sem corridas. Custos, recompensas, desbloqueios e offline executam os modelos publicados.',profiles:profiles.map(profile=>{
    const s=A.initial();Shop.init(s);Ret.init(s,NOW);s.idle.at=NOW;let previousEnd=NOW,races=0;
    const milestones={firstUpgrade:null,firstTeam:null,firstRace:null,banners:null,projects:null};
    const mark=(id,at)=>{if(milestones[id]===null)milestones[id]=round((at-NOW)/3600000,3)};
    const invest=at=>{
      let budget=s.money*.6;
      for(let i=0;i<12;i++){const candidates=V.B.branches.map((_,branch)=>({branch,cost:V.cost(s,branch)})).filter(x=>V.unlockedBranch(s,x.branch)&&s.levels[x.branch]<100&&x.cost<=budget).sort((a,b)=>a.cost-b.cost);if(!candidates.length)break;const purchase=V.buy(s,candidates[0].branch);if(!purchase.bought)break;budget-=purchase.spent;mark('firstUpgrade',at)}
      for(let i=0;i<3;i++){const candidates=E.generators.map((_,index)=>({index,cost:E.cost(s.idle,index,1)})).filter(x=>(s.catProgress?2*s.stage:s.maxCircuit)>=V.B.P.genUnlock[x.index]&&x.cost<=s.money*.2).sort((a,b)=>a.cost-b.cost);if(!candidates.length||!E.buy(s,candidates[0].index,1))break;mark('firstTeam',at)}
    };
    for(let day=0;day<days;day++)for(let visit=0;visit<profile.sessions;visit++){
      let at=NOW+(day*24+visit*24/profile.sessions)*3600000;const end=at+profile.minutesPerSession*60000;
      s.idle.at=previousEnd;Ret.offline(s,at,E.production(s.idle));invest(at);
      while(at+(A.duration(s)*5+6)*1000<=end){const seconds=A.duration(s)*5+6,place=Adapter.place(s);s.money+=A.reward(s)*5+E.production(s.idle)*seconds;at+=seconds*1000;s.laps+=5;races++;V.finish(s,place,seconds,races);mark('firstRace',at);if(s.stage>=3||s.cat>0)mark('banners',at);if(s.stage>=5||s.cat>0)mark('projects',at);invest(at)}
      s.money+=E.production(s.idle)*Math.max(0,(end-at)/1000);previousEnd=end;
    }
    return{id:profile.id,hoursToMilestone:milestones,races,stage:s.stage+1,category:s.cat,carLevels:s.levels,teamUnits:s.idle.units,valid:V.valid(s)};
  })};
}
if(require.main===module)process.stdout.write(JSON.stringify(buildReport(),null,2)+'\n');
module.exports={buildReport,mythicDistribution,simulateProfiles,simulateOnboarding,distribution};
