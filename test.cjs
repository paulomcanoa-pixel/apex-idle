const assert=require('node:assert/strict'),A=require('./engine.js');let s=A.initial();s.setup={wing:7,suspension:7};assert(A.validate(s));assert.equal(A.advance(s,100),0);s.running=true;assert.equal(A.advance(s,16),1);assert.equal(s.money,265);assert.equal(s.rep,1);assert(A.buy(s,0));assert.equal(s.money,165);assert(A.duration(s)<16);s.money=0;assert.equal(A.buy(s,1),false);s=A.initial();s.setup={wing:7,suspension:7};s.running=true;A.advance(s,28800);assert.equal(s.laps,1800);assert.equal(s.money,81220);assert(A.validate(s));assert(!A.validate({...s,levels:[-1,0,0,0]}));assert(!A.validate({...s,circuit:99}));assert(!A.validate({...s,progress:1}));assert(!A.validate({...A.initial(),circuit:2}));console.log('OK: recompensas, melhorias, saldo insuficiente, offline de 8 h e validação de saves.');


const legacy=A.initial();assert(A.validate(legacy));assert.deepEqual(A.ownedCars(legacy),['aurora']);
let collection=A.initial();collection.money=200;
let result=A.summon(collection,()=>0);assert.equal(result.car.id,'vento');assert.equal(collection.money,0);assert(A.validate(collection));
collection.money=200;result=A.summon(collection,()=>.59);assert(result.duplicate);assert.equal(collection.money,100);
const before=JSON.stringify(collection);assert.equal(A.summon(collection,()=>.9),null);assert.equal(JSON.stringify(collection),before);
for(const [roll,id] of [[.6,'scarlatto'],[.85,'solar'],[.95,'eclipse'],[.99,'zenith'],[.9999,'zenith']]){collection.money=200;assert.equal(A.summon(collection,()=>roll).car.id,id)}
assert.equal(A.equipCar(legacy,'eclipse'),false);
const previous=A.duration(collection);assert(A.equipCar(collection,'eclipse'));assert(A.duration(collection)<previous);assert.equal(collection.color,'#ffc857');
collection.running=true;assert.equal(A.equipCar(collection,'vento'),false);assert(A.validate(JSON.parse(JSON.stringify(collection))));
for(const bad of [{ownedCars:['unknown']},{ownedCars:['aurora','aurora']},{equippedCar:'eclipse'},{ownedCars:null}])assert(!A.validate({...legacy,...bad}));
collection.money=200;assert.equal(A.summon(collection,()=>1),null);assert.equal(collection.money,200);
console.log('OK: invocação, limites de chance, repetidos, saldo, equipar, saves antigos e coleção inválida.');

assert.equal(A.cars.slice(1).reduce((n,c)=>n+c.chance,0),100);
let g=A.initial();g.money=100000;
for(let i=1;i<=100;i++){const r=A.summon(g,()=>0);if(i===10)assert.equal(r.car.rarity,'Épico');if(i===50)assert.equal(r.car.rarity,'Lendário');if(i===100)assert.equal(r.car.rarity,'Mítico');assert(A.validate(g))}
assert.deepEqual(A.pity(g),{epic:0,legendary:0,mythic:0});assert.equal(g.summonHistory.length,10);
assert(A.equipCar(g,'zenith'));assert.equal(A.equippedCar(g).rarity,'Mítico');
g=A.initial();g.money=2000;let batch=A.summonMany(g,10,()=>0);assert.equal(batch.length,10);assert.equal(batch[9].car.rarity,'Épico');assert.equal(g.money,800);
const singles=A.initial();singles.money=2000;for(let i=0;i<10;i++)A.summon(singles,()=>0);singles.savedAt=g.savedAt;assert.deepEqual(g,singles);
let unchanged=JSON.stringify(g);assert.equal(A.summonMany(g,10,()=>0),null);assert.equal(JSON.stringify(g),unchanged);
g.money=3000;unchanged=JSON.stringify(g);let calls=0;assert.equal(A.summonMany(g,10,()=>++calls===5?1:0),null);assert.equal(JSON.stringify(g),unchanged);
g.summonPity={epic:9,legendary:49,mythic:99};assert.equal(A.summon(g,()=>0).car.id,'zenith');assert.deepEqual(A.pity(g),{epic:0,legendary:0,mythic:0});
assert(!A.validate({...A.initial(),summonPity:{epic:10,legendary:0,mythic:0}}));assert(!A.validate({...A.initial(),summonHistory:[{id:'unknown'}]}));
assert(A.validate(JSON.parse(JSON.stringify(g))));
console.log('OK: cinco raridades, garantias 10/50/100, reinício dos contadores, lote atômico e histórico persistido.');
