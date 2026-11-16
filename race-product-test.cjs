'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Race=require('./race-engine'),A=require('./engine'),X=require('./src/v2-adapter'),N=require('./night-model'),Academy=require('./academy-model');
function run(options={}){const r=Race.start(16,{night:true,laps:5,compound:'medium',...options});Object.assign(r,{event:'clear',windowMult:1,...options});for(let n=0;n<20000&&!r.done;n++)Race.step(r,.02,.0016);assert(r.done);return r}
test('telemetria mede desgaste, chuva e tempo parado nos boxes sem inventar ganhos',()=>{
  const dry=run({compound:'soft'}),rain=run({compound:'hard',event:'rain'}),wet=run({compound:'wet',event:'rain'}),pit=run({compound:'medium',pitLap:2,nextTyres:'hard'});
  assert(dry.telemetry.wornSeconds>0);assert(Race.insights(dry).some(x=>x.text.includes('janela ideal')));
  assert(rain.telemetry.rainSeconds>0);assert.equal(wet.telemetry.rainSeconds,0);
  assert.equal(pit.pitStops,1);assert(Math.abs(pit.telemetry.pitSeconds-4)<1e-10);assert(pit.pitWindowUsed);assert(pit.telemetry.ersSeconds>0);
  assert(Race.insights(pit).some(x=>x.text.includes('4.0 s')));
});
test('neutralização entra no tempo de prova e impede rivais de avançar durante a bandeira vermelha',()=>{
  const r=Race.start(16,{compound:'hard'});r.countdown=0;r.distance=1;r.elapsed=16;r.event='red';const before=Race.order(r).find(x=>!x.player).distance;
  Race.step(r,2);assert.equal(r.distance,1);assert.equal(r.elapsed,18);assert.equal(r.neutralizedSeconds,2);assert.equal(Race.order(r).find(x=>!x.player).distance,before);
  Race.step(r,1);assert(r.redCleared);assert.equal(r.elapsed,19);
  const safety=Race.start(16,{compound:'hard'});safety.countdown=0;safety.distance=1;safety.elapsed=16;safety.event='safety';Race.step(safety,1);
  assert(Math.abs(safety.elapsed-17)<1e-10);assert.equal(safety.neutralizedSeconds,.25);assert(safety.distance>1);
});
test('automação respeita a janela modificada do carro e as mudanças do conjunto chegam à corrida',()=>{
  const r=Race.start(16,{compound:'soft'});r.tyreAge=2.4;r.distance=2;r.windowMult=.8;assert.equal(Race.chooseMode(r),'save');r.windowMult=1.28;assert.equal(Race.chooseMode(r),'balanced');
  const s=A.initial();r.carId=A.equippedCar(s).id;r.baseWindowMult=.8;r.challenge={trackProfile:'curvas'};
  const lap=X.updateRace(s,r);assert.equal(lap,X.duration(s,{wet:false,trackProfile:'curvas'}));assert.equal(r.windowMult,.8*X.performance(s,r.carId,{trackProfile:'curvas'}).windowMult);
  X.Shop.init(s).inventory.cars.push('lotus79');s.shop.selectedCar='lotus79';X.updateRace(s,r);assert(r.changedCar);assert.equal(r.performance.car.id,'lotus79');
});
test('resultado da pista avança Academia com clima e afinidade reais, apenas uma vez',()=>{
  const s=A.initial();Academy.choose(s,'real_senna');const p=s.academy.projects.real_senna;
  const first=N.finish(s,3,90,A.reward(s),1001,{event:'clear',carId:'lotus49',affinity:true});assert(first);assert.deepEqual([p.races,p.podiums,p.wet,p.combos],[1,1,0,1]);
  assert.equal(N.finish(s,3,90,A.reward(s),1001,{event:'rain',affinity:true}),null);assert.deepEqual([p.races,p.podiums,p.wet,p.combos],[1,1,0,1]);
  N.finish(s,8,100,A.reward(s),1002,{event:'rain',affinity:false});assert.deepEqual([p.races,p.podiums,p.wet,p.combos],[2,1,1,1]);assert(A.validate(s));
});
test('desafio concluído paga uma vez e troca de carro cancela uma tentativa em qualquer regra',()=>{
  const s=A.initial(),Ret=X.Ret;assert.equal(Ret.cancelChallenge(s),false);assert.equal(Ret.cancelChallenge(s,'inexistente'),false);Ret.startChallenge(s);const c=Ret.takeChallenge(s),tickets=s.championship.tickets;assert.equal(Ret.cancelChallenge(s),false);assert.equal(s.retention.weeklyChallenge.running.token,c.token);
  N.finish(s,1,90,A.reward(s),1101,{challenge:c,carId:'lotus49',trackProfile:c.trackProfile,event:c.event,pitWindow:true});
  assert(s.retention.weeklyChallenge.completed);assert(s.championship.tickets>=tickets+2);
  const after=s.championship.tickets;assert.equal(N.finish(s,1,90,A.reward(s),1101,{challenge:c,carId:'lotus49',trackProfile:c.trackProfile,event:c.event,pitWindow:true}),null);assert.equal(s.championship.tickets,after);
  const changed=A.initial();Ret.startChallenge(changed);const challenge=Ret.takeChallenge(changed),r=Race.start(X.duration(changed),{compound:'medium'});Object.assign(r,{challenge,carId:'lotus49',baseWindowMult:1,event:challenge.event});
  X.Shop.init(changed).inventory.cars.push('lotus79');changed.shop.selectedCar='lotus79';X.updateRace(changed,r);assert(r.changedCar);assert.equal(changed.retention.weeklyChallenge.running,null);
  assert.equal(Ret.finishChallenge(changed,{place:1,time:80},{challenge,carId:'lotus79',trackProfile:challenge.trackProfile,event:challenge.event,pitWindow:true}),null);assert(!changed.retention.weeklyChallenge.completed);
});
