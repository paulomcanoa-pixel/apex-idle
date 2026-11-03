const assert=require('node:assert/strict'),D=require('./legends-data'),L=require('./legends-model'),A=require('./engine'),C=require('./championship-model'),Career=require('./career-model');
assert.equal(D.cars.filter(c=>!c.exclusive).length,20);assert.equal(D.cars.length,22);assert.equal(D.drivers.length,20);assert.equal(new Set(D.cars.map(c=>c.id)).size,22);
for(const car of D.cars){assert(car.year>=1967&&car.year<=2024);assert.equal(car.source,'');assert.equal(Object.keys(car.stats).length,6);assert(Object.values(car.stats).every(n=>n>0&&n<=100));assert(D.drivers.some(d=>d.key===car.driver));assert.equal(typeof car.shape,'string')}
const s=A.initial();s.money=1000000;L.init(s);C.init(s);assert(A.validate(s));assert.equal(L.rates(s).reduce((a,r)=>a+r.chance,0).toFixed(8),'100.00000000');
const chosen=L.rates(s).find(r=>r.id==='rb19').chance;s.heritage.wish='rb19';assert.equal(L.rates(s).find(r=>r.id==='rb19').chance,chosen*2);assert(Math.abs(L.rates(s).reduce((a,r)=>a+r.chance,0)-100)<1e-10);s.heritage.wish='';
const original=A.duration(s);assert(L.buy(s,'f2004'));assert(L.equip(s,'f2004'));assert.equal(A.equippedCar(s).id,'f2004');assert(A.duration(s)<original);assert(A.validate(s));assert.equal(s.championship.car,'f2004');
const noSynergy=L.scores('f2004','real_senna'),yes=L.scores('f2004','real_schumacher');assert(yes.synergy);assert(!noSynergy.synergy);assert(yes.pace>noSynergy.pace);
s.championship.roster.real_schumacher={stars:0,copies:0};assert(C.equip(s,'real_schumacher'));assert(A.validate(s));assert.equal(C.roster.length,30);
assert(L.equip(s,''));assert.equal(A.equippedCar(s).id,'aurora');assert(A.equipCar(s,'aurora'));assert(A.validate(s));
const g=A.initial();g.money=10000;L.init(g);g.heritage.pity.epic=9;let out=L.summon(g,1,()=>0);assert.equal(L.get(out[0].id).rarity,2);g.heritage.pity.legendary=199;out=L.summon(g,1,()=>0);assert.equal(L.get(out[0].id).rarity,3);assert.equal(g.heritage.pity.legendary,0);
const d=A.initial();d.money=10000;L.init(d);out=L.summon(d,1,()=>0);assert(out[0].duplicate);assert.equal(out[0].points,50);assert.equal(d.summonPoints,50);const saved=JSON.stringify(d);assert.equal(L.summon(d,10,()=>NaN),null);assert.equal(JSON.stringify(d),saved);d.summonPoints=300;assert(L.exchange(d,'r25'));assert.equal(d.summonPoints,0);assert(!L.exchange(d,'r25'));assert(A.validate(d));
const roundtrip=JSON.parse(JSON.stringify(s));assert(A.validate(roundtrip));roundtrip.heritage.equipped='missing';assert(!A.validate(roundtrip));
const weekly=A.initial();weekly.money=1e6;L.init(weekly);L.buy(weekly,'f2004');L.equip(weekly,'f2004');let time=1800000000000;while(Career.weekly(time).rule.maxRank<4)time+=604800000;assert(Career.enter(weekly,A,time));assert(Career.validate(weekly));assert(A.validate(weekly));
const expectedColors=new Set(D.cars.map(c=>c.color+c.accent+c.shape));assert(expectedColors.size>=18);
console.log('OK: 20 carros/20 pilotos, atributos, paletas e geometrias, taxas, desejo, garantias, repetidos/troca, compra/equipar, afinidade, campeonato, GP semanal, saves antigos e roundtrip.');

