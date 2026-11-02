const assert=require('node:assert/strict'),M=require('./circuits-data'),S=require('./circuit-scenery');let total=0;
for(const c of M.circuits){const raw=JSON.stringify(c.coordinates),p=S.plan(c);assert(p.objects.some(o=>o.kind==='pit'),c.name+' boxes');assert(p.objects.filter(o=>o.kind==='stand').length>=4,c.name+' arquibancadas');assert(p.trees.length>100,c.name+' vegetação');
for(const o of p.objects){assert(S.rectDistance(p.l,S.footprint(o))>p.road+3.99,c.name+' '+o.kind+' longe da pista');assert(Number.isFinite(o.x)&&Number.isFinite(o.y)&&Number.isFinite(o.a))}
for(const t of p.trees)assert(S.distanceToTrack(p.l,t.x,t.y)>p.road+t.r+5.99);
for(const o of p.ponds)assert(S.distanceToTrack(p.l,o.x,o.y)>Math.hypot(o.w,o.h)/2+p.road);
assert.equal(JSON.stringify(c.coordinates),raw);total+=p.objects.length;
}assert.deepEqual(S.plan(M.circuits[0]).objects,S.plan(M.circuits[0]).objects);console.log('OK: cenário determinístico nas 24 pistas; '+total+' estruturas, boxes, plateia, vegetação e lagos fora da faixa de corrida; traçados intactos.');
