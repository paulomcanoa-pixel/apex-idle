const assert=require('node:assert/strict'),M=require('./circuits-data');
for(const c of M.circuits){const original=JSON.stringify(c.coordinates),base=M.project(c),world=M.world(c);assert(world.scale>=4);assert(world.clearance*world.scale>=96-1e-8);
assert.equal(world.points.length,base.points.length);assert.equal(world.length,base.length*world.scale);
base.points.forEach((p,i)=>{const q=M.toMap(world,{x:world.points[i][0],y:world.points[i][1]});assert(Math.abs(q.x-p[0])<1e-8);assert(Math.abs(q.y-p[1])<1e-8);assert.equal(world.segments[i],base.segments[i]*world.scale)});
for(const t of [0,.1,.333,.5,.75,.999]){const p=M.position(base,t),q=M.toMap(world,M.position(world,t));assert(Math.hypot(p.x-q.x,p.y-q.y)<1e-7)}assert.equal(JSON.stringify(c.coordinates),original);
}const interlagos=M.world(M.circuits[0]);assert(interlagos.scale>4);assert(interlagos.clearance<44);assert(interlagos.clearance*interlagos.scale>50);console.log('OK: 24 traçados preservados sem deformação, separação de ramos maior que asfalto/zebra, minimapa e posições sincronizados. Suzuka mantém cruzamento de viaduto.');
