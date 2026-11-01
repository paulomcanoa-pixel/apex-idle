const assert=require('node:assert/strict'),D=require('./drops.js'),A=require('./engine.js');
const drops=[1,5,2,3,1,4,2,1,3,1].map(i=>({car:A.cars[i]}));
for(const width of [320,600,900,1200]){
const m=D.layout(drops,width);assert.equal(m.items.length,10);assert.equal(m.items[0].result.car.rarity,'Mítico');assert.equal(m.items[0].x,width/2);
for(const item of m.items){assert(item.x-item.w/2>=0);assert(item.x+item.w/2<=width);assert(item.y-item.h/2>=0);assert(item.y+item.h/2<=m.height)}
for(let i=0;i<m.items.length;i++)for(let j=i+1;j<m.items.length;j++){const a=m.items[i],b=m.items[j];assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2)}
if(width>=650){const sides=m.items.slice(1);for(const a of sides)for(const b of sides){if(D.order([a.result,b.result])[0]===a.result&&a.result.car!==b.result.car)assert(Math.abs(a.x-width/2)<=Math.abs(b.x-width/2))}}
}
assert.equal(D.layout([drops[0]],1200).items.length,1);
const before=drops.slice();D.order(drops);assert.deepEqual(drops,before);
console.log('OK: composição de 1/10 drops, raro no centro, comuns nas pontas, sem sobreposição e dimensões responsivas.');
