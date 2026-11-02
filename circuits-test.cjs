const assert=require('node:assert/strict'),M=require('./circuits-data.js'),A=require('./engine.js'),R=require('./race-engine.js');
assert.equal(M.circuits.length,24);assert.equal(new Set(M.circuits.map(c=>c.id)).size,24);
assert.equal(M.time(70.54),'1:10.540');assert.equal(M.time(59.9999),'1:00.000');
assert.equal(A.circuits[0].name,'Interlagos');assert.equal(A.circuits[1].rep,30);assert.equal(A.circuits[2].rep,100);
const shapes=new Set();for(let i=0;i<24;i++){const c=M.circuits[i],l=M.project(c);assert(c.coordinates.length>70);assert(c.time>60&&c.time<120);assert(c.km>3&&c.km<8);assert(c.source.startsWith('https://www.formula1.com/'));assert(l.length>0);shapes.add(JSON.stringify(l.points));
for(const p of l.points){assert(p[0]>=84.99&&p[0]<=915.01);assert(p[1]>=84.99&&p[1]<=495.01)}
assert.deepEqual(M.position(l,0),M.position(l,1));for(let t=0;t<1;t+=.01){const p=M.position(l,t);assert(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.a))}
const s={...A.initial(),rep:c.rep,circuit:i,running:true};assert(A.validate(s));const d=A.duration(s);assert(d>=c.time&&d<c.time*1.5);assert.equal(A.advance(s,d*.99),0);assert.equal(A.advance(s,d*.02),1);assert.equal(s.money,220+A.reward(s));s.running=false;s.levels[0]=100;assert(A.duration(s)>=c.time);assert(A.duration(s)<d);
const r=R.start(d);assert(r.rivals.every(v=>v.pace>d*.9&&v.pace<d*1.1));
}assert.equal(shapes.size,24);console.log('OK: 24 geometrias distintas, limites/projeção, fechamento, tempos reais, progressão, saves e ritmo dos rivais.');
