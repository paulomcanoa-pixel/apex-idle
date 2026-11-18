'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Race=require('./race-engine'),Drops=require('./drops'),D=require('./legends-data');
function run(step=.1){const r=Race.start(16,{laps:5,compound:'medium',pitLap:2,nextTyres:'hard'});r.event='rain';for(let i=0;i<20000&&!r.done;i++)Race.step(r,step,r.distance>=1&&r.distance<2?step*.08:0);assert(r.done);return r}
test('relato localiza decisões nas voltas e contabiliza efeitos observados sem mudar a corrida',()=>{
 const r=run(),laps=r.telemetry.laps.filter(Boolean),pit=laps.find(l=>l.pitAt!==undefined),boost=laps.find(l=>l.boostDistance>0);
 assert.equal(pit.lap,3);assert.equal(pit.toTyres,'hard');assert(pit.pitWithinWindow);assert(Math.abs(pit.pitSeconds-4)<1e-8);
 assert.equal(boost.lap,2);assert(boost.firstBoostAt>=0);assert(boost.boostDistance>0&&boost.boostDistance<.1);
 assert.equal(laps.length,5);assert(Math.abs(laps.reduce((n,l)=>n+l.rainSeconds,0)-r.telemetry.rainSeconds)<.1);
 const rows=Race.insights(r);assert(rows.some(x=>x.text.includes('Volta 3')));assert(rows.some(x=>x.text.includes('Volta 2')));assert(rows.every(x=>x.action));assert(!JSON.stringify(rows).includes('ganhou posições'));
 assert(Math.abs(run(.02).elapsed-r.elapsed)<.2);
});
test('semáforo não cria eventos e endurance limita telemetria a oito voltas',()=>{
 const r=Race.start(10,{night:true,laps:8,compound:'hard'});Race.step(r,1,1);assert.equal(r.telemetry.laps,undefined);
 for(let i=0;i<20000&&!r.done;i++)Race.step(r,.1);assert(r.done);assert.equal(r.telemetry.laps.length,8);
 const snapshot=JSON.stringify(r.telemetry);Race.step(r,100,100);assert.equal(JSON.stringify(r.telemetry),snapshot);
});
test('cada histórico revelado recebe um ponto forte derivado dos atributos do jogo',()=>{
 for(const car of D.cars)assert(['Retas e aceleração','Precisão em curvas','Conservação de pneus'].includes(Drops.feature(car)),car.id);
 assert.equal(Drops.feature({id:'inventado'}),'');assert.equal(Drops.feature(null),'');
});
test('bandeirada entrega uma prova de Academia usando os dados da corrida e não duplica a recompensa',()=>{
 const A=require('./engine');require('./src/v2-adapter');const N=require('./night-model'),Academy=require('./academy-model');
 const s=A.initial();Academy.choose(s,'real_button');const r=run(),trial={wornSeconds:r.telemetry.wornSeconds,pitWindow:r.pitWindowUsed===true,pitStops:r.pitStops,bestLap:r.bestLap,referenceLap:r.duration,startPlace:10};
 assert.equal(s.academy.projects.real_button.trials,0);
 assert(N.finish(s,3,r.elapsed,A.reward(s),182026,{event:r.event,affinity:true,trial}));
 assert.equal(s.academy.projects.real_button.trials,1);
 assert.equal(N.finish(s,3,r.elapsed,A.reward(s),182026,{event:r.event,affinity:true,trial}),null);
 assert.equal(s.academy.projects.real_button.trials,1);assert(A.validate(s));
});
