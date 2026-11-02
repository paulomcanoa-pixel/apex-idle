const assert=require('node:assert/strict'),A=require('./engine.js');let s=A.initial();s.setup={wing:7,suspension:7};assert(A.validate(s));assert.equal(A.advance(s,100),0);s.running=true;assert.equal(A.advance(s,A.duration(s)),1);assert.equal(s.money,220+A.reward(s));assert.equal(s.rep,1);assert(A.buy(s,0));assert.equal(s.money,220+A.reward(s)-100);assert(A.duration(s)<A.circuits[0].time*1.2);s.money=0;assert.equal(A.buy(s,1),false);s=A.initial();s.setup={wing:7,suspension:7};s.running=true;A.advance(s,28800);assert.equal(s.laps,Math.floor(28800/A.duration(s)));assert.equal(s.money,220+s.laps*A.reward(s));assert(A.validate(s));assert(!A.validate({...s,levels:[-1,0,0,0]}));assert(!A.validate({...s,circuit:99}));assert(!A.validate({...s,progress:1}));assert(!A.validate({...A.initial(),circuit:2}));console.log('OK: recompensas, melhorias, saldo insuficiente, offline de 8 h e validação de saves.');



const approx=(a,b)=>assert(Math.abs(a-b)<1e-9,a+' != '+b);
const fresh=()=>({...A.initial(),money:1000000});
function drawId(s,id){const rates=A.summonRates(s);let sum=0;for(const r of rates){if(r.id===id)return A.summon(s,()=>(sum+r.chance/2)/100);sum+=r.chance}throw Error(id)}
const legacy=fresh();assert(A.validate(legacy));assert.equal(A.points(legacy),0);
approx(A.summonRates(legacy).reduce((n,r)=>n+r.chance,0),100);
approx(A.summonRates(legacy).find(r=>r.id==='eclipse').chance,.5);
approx(A.summonRates(legacy).find(r=>r.id==='zenith').chance,100/700);
for(const car of A.cars.slice(1)){
let s=fresh();const old=A.summonRates(s).find(r=>r.id===car.id).chance;assert(A.setWish(s,car.id));
approx(A.summonRates(s).find(r=>r.id===car.id).chance,old*2);approx(A.summonRates(s).reduce((n,r)=>n+r.chance,0),100);
assert(A.summonRates(s).every(r=>r.chance>0));
assert.equal(drawId(s,car.id).car.id,car.id);
}
assert.equal(A.setWish(legacy,'invalid'),false);assert(A.setWish(legacy,''));
let g=fresh();const oldMoney=g.money;
assert.equal(drawId(g,'vento').points,0);assert.equal(drawId(g,'vento').points,50);
assert.equal(g.money,oldMoney-400);assert.equal(A.points(g),50);
g=fresh();
for(let i=1;i<=200;i++){const result=A.summon(g,()=>0);if(i===10)assert.equal(result.car.rarity,'Épico');if(i===100)assert.notEqual(result.car.rarity,'Mítico');if(i===200)assert.equal(result.car.rarity,'Lendário');assert(A.validate(g))}
assert.equal(A.pity(g).mythic,200);approx(A.summonRates(g).find(r=>r.id==='zenith').chance,100/700);
drawId(g,'zenith');assert.equal(A.pity(g).mythic,0);approx(A.summonRates(g).find(r=>r.id==='zenith').chance,100/700);
g.summonPity={epic:0,legendary:0,mythic:100000};approx(A.summonRates(g).find(r=>r.id==='zenith').chance,100/700);assert.notEqual(A.summon(g,()=>0).car.id,'zenith');
A.setWish(g,'zenith');approx(A.summonRates(g).find(r=>r.id==='zenith').chance,200/700);drawId(g,'zenith');approx(A.summonRates(g).find(r=>r.id==='zenith').chance,200/700);
g=fresh();g.summonPity={epic:9,legendary:199,mythic:200};assert.equal(A.summon(g,()=>0).car.id,'eclipse');assert.deepEqual(A.pity(g),{epic:0,legendary:0,mythic:201});
g=fresh();g.money=2000;let batch=A.summonMany(g,10,()=>0);assert.equal(batch.length,10);assert.equal(g.money,0);assert.equal(batch[9].car.id,'solar');assert.equal(A.points(g),400);
const single=fresh();single.money=2000;for(let i=0;i<10;i++)A.summon(single,()=>0);single.savedAt=g.savedAt;assert.deepEqual(single,g);
let before=JSON.stringify(g);assert.equal(A.summonMany(g,10,()=>0),null);assert.equal(JSON.stringify(g),before);
g.money=3000;before=JSON.stringify(g);let calls=0;assert.equal(A.summonMany(g,10,()=>++calls===5?1:0),null);assert.equal(JSON.stringify(g),before);
assert.equal(g.summonHistory.length,10);assert(A.validate(JSON.parse(JSON.stringify(g))));
g=fresh();assert(!A.shopBuy(g,'zenith'));g.summonPoints=15000;g.summonPity={epic:3,legendary:30,mythic:70};assert(A.shopBuy(g,'zenith'));assert.equal(A.points(g),0);assert.deepEqual(A.pity(g),{epic:3,legendary:30,mythic:70});assert(!A.shopBuy(g,'zenith'));assert(A.equipCar(g,'zenith'));
assert(A.validate(g));assert.equal(A.equippedCar(g).rarity,'Mítico');g.running=true;assert(!A.equipCar(g,'aurora'));
g=fresh();g.money=200;assert(A.grantTestCredits(g));assert.equal(g.money,1000200);assert(!A.grantTestCredits(g));assert.equal(g.money,1000200);
for(const bad of [{summonPoints:-1},{wishCar:'unknown'},{ownedCars:null},{equippedCar:'zenith'},{summonPity:{epic:0,legendary:200,mythic:0}},{summonPity:{epic:0,legendary:0,mythic:-1}},{summonHistory:[{id:'unknown'}]}])assert(!A.validate({...A.initial(),...bad}));
assert(A.validate({...A.initial(),summonPity:{epic:9,legendary:49,mythic:99},summonHistory:[{id:'vento',duplicate:true,guaranteed:false}]}));
let seed=42;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
g=fresh();for(let i=0;i<1000;i++){A.summon(g,rng);assert(A.validate(g));approx(A.summonRates(g).reduce((n,r)=>n+r.chance,0),100)}
console.log('OK: desejo dobra chance, chance fixa 1/700, garantias 10/200, sem garantia mítica, reset mítico, pontos/loja, lotes, saves antigos e créditos de teste.');


for(const [id,price] of Object.entries(A.shopPrices)){assert.equal(A.duplicatePoints[id],price/2);const s=fresh();s.summonPoints=price-1;assert(!A.shopBuy(s,id));s.summonPoints=price;assert(A.shopBuy(s,id));assert.equal(A.points(s),0);const repeat=drawId(s,id);assert.equal(repeat.points,price/2)}
console.log('OK: preços 100/300/800/4000/15000 e repetidos valem metade de cada troca.');
