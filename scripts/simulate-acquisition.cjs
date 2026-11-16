'use strict';
// Deterministic audit of the shipped formulas; these are scenarios, not player data.
const assert=require('node:assert/strict');
const V=require('../src/progression-v2');
const Shop=require('../src/shop');
const Ret=require('../src/retention');
const A=require('../engine');
const E=require('../game/economy');
require('../src/v2-adapter');
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

function buildReport(){
  const mythic=Shop.bannerCars('banner-padrao').find(c=>c.rarity==='mitico');
  const common=Shop.bannerCars('banner-padrao').find(c=>c.rarity==='comum');
  const normal=mythicDistribution('banner-padrao');assert(Math.abs(normal.meanPulls-700)<.001);
  const base=Shop.bannerRates('banner-padrao','',699),wish=Shop.bannerRates('banner-padrao',mythic.id,699);
  assert.equal(wish.find(r=>r.car.id===mythic.id).chance,2*base.find(r=>r.car.id===mythic.id).chance);
  return{method:'Fórmulas reais em cenários fixos, sem dados de jogadores; sobrevivência S(n)=produto(1-p(k)), E[N]=soma S(n). Percentis para qualquer mítico, desde contador zero. Cada alternativa de compra usa uma cópia independente do saldo offline.',
    mythic:[normal,mythicDistribution('banner-padrao',mythic.id),mythicDistribution('banner-padrao',common.id),mythicDistribution('banner-lendas')],
    acquisition:acquisitionRoutes(),offline:['new-player','kart-stage4','f1-stage6'].flatMap(kind=>[2,8].map(hours=>offlineScenario(kind,hours)))};
}
if(require.main===module)process.stdout.write(JSON.stringify(buildReport(),null,2)+'\n');
module.exports={buildReport,mythicDistribution};
