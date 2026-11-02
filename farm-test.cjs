const assert=require('node:assert/strict'),F=require('./farm-model.js');
const now=1800000000000,s={money:100000};F.init(s,now);assert.equal(F.totalRate(s),24);F.settle(s,now+60000);assert.equal(s.farm.bank,24);assert.equal(F.collect(s,now+60000),24);assert.equal(F.collect(s,now+60000),0);assert.equal(s.money,100024);
F.settle(s,now+60000+86400000);assert.equal(s.farm.bank,24*480);
const before=s.money;assert(F.buy(s,1,now+60000+86400000));assert.equal(s.money,before-1800);assert.equal(F.totalRate(s),114);
assert(!F.buy(s,99));assert(!F.valid({farm:{levels:[-1,0,0],bank:0,at:now,total:0}}));assert(F.valid({}));assert(F.valid(s));
const tiny={money:0};F.init(tiny,now);assert(!F.buy(tiny,2,now));F.settle(tiny,now-1000);assert.equal(tiny.farm.bank,0);assert.equal(tiny.farm.at,now);
F.settle(tiny,now+1000);assert.equal(F.collect(tiny,now+1000),0);F.settle(tiny,now+3000);assert.equal(F.collect(tiny,now+3000),1);assert(tiny.farm.bank>0&&tiny.farm.bank<1);
const clone=JSON.parse(JSON.stringify(s));F.settle(clone,clone.farm.at);assert.equal(clone.farm.bank,s.farm.bank);
console.log('OK: farm, offline limitado a 8h, recolhimento único, custo, produção, frações, relógio regressivo e validação.');
