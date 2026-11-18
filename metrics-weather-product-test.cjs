'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('./server/ranked-model.cjs');
const {analyze}=require('./scripts/analyze-cohorts.cjs');
const {hash}=require('./src/shop');

test('mantém o cálculo legado e ativa regras de clima na segunda-feira UTC',()=>{
  const monday=Date.UTC(2026,10,23);
  const legacy=M.challengeConfig(monday-1);
  assert.equal(legacy.rulesVersion,1);
  assert.equal(legacy.weather,'light_rain');
  const car=legacy.pool[0],result=M.trialResult(legacy,car,'attack');
  const traits=M.normalized(car);
  const rounded=x=>Math.round(x*1000)/1000;
  const sectors=[.15,.65,.2].map((weight,i)=>rounded(500*weight/(traits[i]*[1.025,.995,.975][i])));
  assert.deepEqual(result.sectors,sectors);
  assert.equal(result.time,rounded(sectors.reduce((a,b)=>a+b,0)));
  assert.equal(result.weatherDeltaSeconds,0);
  const next=M.challengeConfig(monday);
  assert.equal(next.rulesVersion,2);
  assert.equal(next.week,'2026-11-23');
  assert.equal(next.weather,'dry');
  assert.equal(M.trialResult(next,next.pool[0],'attack').weatherDeltaSeconds,0);
});

test('a chuva aplica a mesma prova a todos e distingue estratégia e carro normalizado',()=>{
  const now=Date.UTC(2026,10,30),db=M.initial();
  const p=M.register(db,{id:'pilot1',key:'key1',name:'Piloto Um',ip:'local'},now);
  const q=M.register(db,{id:'pilot2',key:'key2',name:'Piloto Dois',ip:'local'},now);
  const challenge=M.challengeView(db,p,now),other=M.challengeView(db,q,now+1000);
  assert.equal(challenge.rulesVersion,2);
  assert.equal(challenge.weather,'light_rain');
  assert.equal(challenge.weatherRules,other.weatherRules);
  assert.deepEqual(challenge.pool,other.pool);
  const car=challenge.pool[0],base={car,style:'save'};
  const result=M.timeTrial(db,p,{...base,requestId:'attempt-0001'},now);
  const rival=M.timeTrial(db,q,{...base,requestId:'attempt-0002'},now+1000);
  assert.equal(result.time,rival.time);
  assert.deepEqual(result.sectors,rival.sectors);
  assert.deepEqual(M.timeTrial(db,p,{...base,requestId:'attempt-0001'},now+2000),result);
  assert.deepEqual(M.challengeView(db,p,now+2000).ranking.map(row=>row.place),[1,1]);
  const dry=M.trialResult({...challenge,weather:'dry'},car,'save');
  assert.equal(result.sectors[0],dry.sectors[0]);
  assert(result.sectors[1]>dry.sectors[1]);
  assert(result.sectors[2]>dry.sectors[2]);
  assert.equal(result.weatherDeltaSeconds,+(result.time-dry.time).toFixed(3));
  assert(result.weatherDeltaSeconds<M.trialResult(challenge,car,'attack').weatherDeltaSeconds);
  assert(new Set(challenge.pool.map(id=>M.trialResult(challenge,id,'save').weatherDeltaSeconds)).size>1);
  assert.match(result.explanation.at(-1),/Chuva leve/);
});

test('aquisições usam eventos primários e medem compras, avanço e censura por etapa',()=>{
  const at=Date.UTC(2026,10,18),row=(event,elapsed,data={})=>({user_id:'private-id',event,data:{at:at+elapsed,cat:0,stage:0,...data}});
  const summon=row('summon',20000,{count:4,newCars:2,duplicates:2,car0:34,car1:35});
  const events=[
    row('session_start',0),
    row('economy_action',10000,{action:hash('team'),deltaCR:-200}),
    row('team_buy',10001),
    row('economy_action',19999,{action:hash('ticketSummon'),deltaTickets:-4}),
    summon,{...summon,data:Object.fromEntries(Object.entries(summon.data).reverse())},
    row('car_unlock',30000,{car:41}),
    row('duplicate_trade',40000,{car:42}),
    row('item_buy',50000,{car:43}),
    row('item_buy',55000,{item:89}),
    row('car_equip',60000,{stage:1,car:43}),
    row('session_resume',2000000,{stage:1}),
    row('race_finish',2001000,{stage:1}),
    row('economy_action',2002000,{stage:1,passive:true,deltaCR:40})
  ];
  const {acquisition,progression}=analyze(events,at+2010000).cohorts[0];
  assert.equal(acquisition.pulls,4);
  assert.equal(acquisition.newCars,2);
  assert.deepEqual(Object.values(acquisition.routes).map(route=>route.newCars),[2,1,1,1]);
  assert.deepEqual(acquisition.routes.gacha.cars,{'34':1,'35':1});
  const first=progression.stages['0:0'],second=progression.stages['0:1'];
  assert.equal(first.advancedPlayers,1);
  assert.equal(first.sessionWindows,1);
  assert.equal(first.withoutUsefulAction,0);
  assert.equal(first.purchaseWait.completedIntervals,6);
  assert.equal(first.purchaseWait.censoredIntervals,1);
  assert.equal(first.purchaseWait.medianObservedLowerBoundSeconds,5);
  assert.equal(second.endOfObservationPlayers,1);
  assert.equal(second.sessionWindows,1);
  assert.equal(second.censoredWindows,1);
  assert.equal(second.censoredWithoutUsefulAction,1);
  assert.equal(second.withoutUsefulActionRate,0);
  assert.equal(second.purchaseWait.completedIntervals,0);
  assert.equal(second.purchaseWait.medianObservedLowerBoundSeconds,10);
  assert(!JSON.stringify(analyze(events,at+2010000)).includes('private-id'));
});

test('compra após avanço dentro da sessão pertence à nova etapa e espera começa na transição',()=>{
  const at=Date.UTC(2026,10,18);
  const row=(event,seconds,stage,data={})=>({user_id:'private-id',event,data:{at:at+seconds*1000,cat:0,stage,...data}});
  const events=[
    row('session_start',0,0),
    row('race_finish',60,1),
    row('economy_action',69.999,1,{action:hash('upgrade'),deltaCR:-100}),
    row('upgrade_buy',70,1,{cost:100})
  ];
  const report=analyze(events,at+90000).cohorts[0];
  const prior=report.progression.stages['0:0'],next=report.progression.stages['0:1'];
  assert.equal(report.sessions.observed,0);
  assert.equal(prior.advancedPlayers,1);
  assert.equal(prior.purchases,0);
  assert.equal(prior.withoutUsefulAction,1);
  assert.equal(prior.purchaseWait.medianObservedLowerBoundSeconds,60);
  assert.equal(next.purchases,1);
  assert.equal(next.censoredWindows,1);
  assert.equal(next.censoredWithoutUsefulAction,0);
  assert.equal(next.purchaseWait.medianSeconds,10);
  assert.equal(next.purchaseWait.medianObservedLowerBoundSeconds,20);
});
