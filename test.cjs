const assert=require('node:assert/strict'),A=require('./engine.js');let s=A.initial();s.setup={wing:7,suspension:7};assert(A.validate(s));assert.equal(A.advance(s,100),0);s.running=true;assert.equal(A.advance(s,16),1);assert.equal(s.money,265);assert.equal(s.rep,1);assert(A.buy(s,0));assert.equal(s.money,165);assert(A.duration(s)<16);s.money=0;assert.equal(A.buy(s,1),false);s=A.initial();s.setup={wing:7,suspension:7};s.running=true;A.advance(s,28800);assert.equal(s.laps,1800);assert.equal(s.money,81220);assert(A.validate(s));assert(!A.validate({...s,levels:[-1,0,0,0]}));assert(!A.validate({...s,circuit:99}));assert(!A.validate({...s,progress:1}));assert(!A.validate({...A.initial(),circuit:2}));console.log('OK: recompensas, melhorias, saldo insuficiente, offline de 8 h e validação de saves.');


const legacy=A.initial();assert(A.validate(legacy));assert.deepEqual(A.ownedCars(legacy),['aurora']);
let collection=A.initial();collection.money=200;
let result=A.summon(collection,()=>0);assert.equal(result.car.id,'vento');assert.equal(collection.money,0);assert(A.validate(collection));
collection.money=200;result=A.summon(collection,()=>.59);assert(result.duplicate);assert.equal(collection.money,100);
const before=JSON.stringify(collection);assert.equal(A.summon(collection,()=>.9),null);assert.equal(JSON.stringify(collection),before);
for(const [roll,id] of [[.6,'scarlatto'],[.9,'solar'],[.99,'eclipse'],[.9999,'eclipse']]){collection.money=200;assert.equal(A.summon(collection,()=>roll).car.id,id)}
assert.equal(A.equipCar(legacy,'eclipse'),false);
const previous=A.duration(collection);assert(A.equipCar(collection,'eclipse'));assert(A.duration(collection)<previous);assert.equal(collection.color,'#bd9aff');
collection.running=true;assert.equal(A.equipCar(collection,'vento'),false);assert(A.validate(JSON.parse(JSON.stringify(collection))));
for(const bad of [{ownedCars:['unknown']},{ownedCars:['aurora','aurora']},{equippedCar:'eclipse'},{ownedCars:null}])assert(!A.validate({...legacy,...bad}));
collection.money=200;assert.equal(A.summon(collection,()=>1),null);assert.equal(collection.money,200);
console.log('OK: invocação, limites de chance, repetidos, saldo, equipar, saves antigos e coleção inválida.');
