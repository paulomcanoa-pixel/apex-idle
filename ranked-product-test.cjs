const test=require('node:test'),assert=require('node:assert/strict');
const M=require('./server/ranked-model.cjs'),API=require('./api/ranked'),D=require('./legends-data');
const now=Date.parse('2026-11-15T10:00:00Z');
function setup(){const db=M.initial(),p=M.register(db,{id:'p1',key:'key1',name:'Aurora Um',ip:'ip1'},now);return{db,p}}
function attempt(db,p,id,at=now,extra={}){const c=M.challengeConfig(at);return M.timeTrial(db,p,{car:c.pool[0],style:'balanced',requestId:id,...extra},at)}
test('22 históricos, orçamento normalizado e progresso antigo preservado',()=>{
 const {db,p}=setup();db.version=1;p.matches=30;p.xp=890;p.rating=1234;p.wins=3;p.podiums=5;
 const before={...p};M.migrate(db);const state=M.view(db,p,'rating',now);
 assert.deepEqual(p,before);assert.equal(state.cars.length,22);assert.deepEqual(state.cars.map(c=>c.id),D.cars.map(c=>c.id));
 assert.equal(state.me.album.length,6);assert.equal(M.canonical('zenith'),'mp423');
 for(const c of state.cars){assert(Math.abs(c.traits.reduce((a,b)=>a+b,0)-3)<1e-12);assert(c.traits.every(n=>n>=.988&&n<=1.012))}
 const room=M.join(db,p,{car:'zenith',style:'attack'},now,'legacy-room');assert.equal(room.players[0].car,'mp423');
 assert.equal(M.roomPublic,undefined);assert.equal(state.me.rating,1234);
});
test('configuração semanal e resultados iguais para todos, sem vantagem do solo',()=>{
 const {db,p}=setup(),q=M.register(db,{id:'p2',key:'key2',name:'Aurora Dois',ip:'ip2'},now),c=M.challengeConfig(now);
 q.matches=200;q.xp=100000;q.rating=2000;assert.equal(new Set(c.pool).size,3);
 const a=attempt(db,p,'request001'),b=attempt(db,q,'request002');assert.equal(a.time,b.time);assert.deepEqual(a.sectors,b.sectors);
 const v=M.view(db,p,'rating',now);assert.deepEqual(v.challenge.ranking.map(x=>x.place),[1,1]);assert.equal(v.challenge.remaining,4);
 assert.equal(p.matches,0);assert.equal(p.rating,1000);assert.equal(p.xp,0);assert.equal(v.challenge.cars.length,3);
 assert.equal(M.challengeConfig(Date.parse('2026-11-16T00:00:00Z')).week,'2026-11-16');
});
test('desafio aceita só configurações válidas, não scores, e tem replay idempotente',()=>{
 const {db,p}=setup(),first=attempt(db,p,'request001'),before=JSON.stringify(db);
 assert.deepEqual(attempt(db,p,'request001'),first);assert.equal(JSON.stringify(db),before);
 assert.throws(()=>attempt(db,p,'request001',now,{style:'attack'}),{status:409});
 for(const key of ['time','score','result','power','pi'])assert.throws(()=>attempt(db,p,'request_bad',now,{[key]:0}),{status:400});
 assert.throws(()=>attempt(db,p,'bad'),{status:400});assert.throws(()=>attempt(db,p,'request_bad',now,{car:'aurora'}),{status:400});
 assert.throws(()=>attempt(db,p,'request_bad',now,{style:'toString'}),{status:400});
 assert.throws(()=>M.timeTrial(db,p,null,now),{status:400});
 assert.equal(JSON.stringify(db),before);
 for(let i=2;i<=5;i++)attempt(db,p,'request00'+i);
 assert.throws(()=>attempt(db,p,'request006'),{status:429});assert.equal(M.challengeView(db,p,now).remaining,0);
 assert.deepEqual(attempt(db,p,'request001'),first); // replay still succeeds after quota
 const tomorrow=now+86400000;attempt(db,p,'request006',tomorrow);assert.equal(M.challengeView(db,p,tomorrow).remaining,4);
});
test('cookies hostis não consultam prototype nem revelam chaves',()=>{
 const {db,p}=setup();for(const cookie of ['constructor.any','__proto__.any','toString.any','p1.key1.extra','x'.repeat(201)])assert.equal(M.authenticate(db,cookie),null);
 assert.equal(M.authenticate(db,'p1.key1'),p);
 const view=JSON.stringify(M.view(db,p,'rating',now));assert(!view.includes('keyHash'));assert(!view.includes('key1'));
});
test('limpeza de histórico nunca remove salas ativas antigas',()=>{
 const {db,p}=setup();M.join(db,p,{car:'lotus49',style:'balanced'},now,'active');
 const ids=[];for(let i=0;i<1001;i++){const id='finished-'+i;ids.push(id);db.rooms.push({id,status:'finished',players:[],results:[]})}
 // Simulates history distributed over players without a massive registration test.
 p.history=ids;M.settle(db,now);assert(db.rooms.some(r=>r.id==='active'));assert.equal(db.rooms.filter(r=>r.status==='finished').length,1000);
});
function response(){return{headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.body=v;return this}}}
test('API valida corpo/origem antes do armazenamento e responde erros HTTP corretos',async()=>{
 let calls=0;const handler=API.createHandler(()=>{calls++;throw Error('should not reach storage')},()=>now);
 for(const [req,code]of [[{method:'DELETE'},405],[{method:'POST',body:'{'},400],[{method:'POST',body:'null'},400],[{method:'POST',body:[]},400],[{method:'POST',body:'x'.repeat(2049)},413],[{method:'POST',headers:{host:'apex.test',origin:'https://evil.test'}},403],[{method:'POST',headers:{host:'apex.test',origin:'not-url'}},403],[{method:'POST',headers:{'sec-fetch-site':'cross-site'}},403]]){const res=response();await handler({headers:{},...req},res);assert.equal(res.code,code);assert.equal(res.headers['Cache-Control'],'no-store')}
 assert.equal(calls,0);
});
test('API inscrição → cookie → desafio → replay conserva uma tentativa',async()=>{
 let db=M.initial();const handler=API.createHandler(async action=>{const draft=structuredClone(db),result=action(draft);db=draft;return result},()=>now);
 const headers={host:'apex.test',origin:'https://apex.test'};
 const registration=response();await handler({method:'POST',headers,body:{action:'register',name:'Nova Aurora'}},registration);assert.equal(registration.code,200);
 assert.match(registration.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Lax/);
 const cookie=registration.headers['Set-Cookie'].split(';')[0],car=registration.body.challenge.pool[0],body={action:'timeTrial',car,style:'attack',requestId:'api_request_1'};
 const unauthorized=response();await handler({method:'POST',headers,body},unauthorized);assert.equal(unauthorized.code,401);
 const a=response(),b=response();await handler({method:'POST',headers:{...headers,cookie},body},a);await handler({method:'POST',headers:{...headers,cookie},body},b);
 assert.equal(a.code,200);assert.equal(b.body.challenge.attempts,1);assert.deepEqual(a.body.challenge.last,b.body.challenge.last);
 const bad=response();await handler({method:'POST',headers:{...headers,cookie},body:{...body,requestId:'api_request_2',time:1}},bad);assert.equal(bad.code,400);
});
test('CAS refaz a ação sobre estado fresco sem perder incremento concorrente',async()=>{
 let state={count:0},etag='v1',writes=0;const deps={token:'test-only',sleep:async()=>{},get:async()=>({stream:JSON.stringify(state),blob:{etag}}),put:async(path,body,options)=>{writes++;assert.equal(options.access,'private');assert.equal(options.addRandomSuffix,false);if(writes===1){state.count=10;etag='v2';throw Object.assign(Error('concurrent write'),{name:'BlobPreconditionFailedError'})}assert.equal(options.ifMatch,'v2');state=JSON.parse(body);etag='v3'}};
 const result=await API.transaction(db=>++db.count,deps);assert.equal(result,11);assert.equal(state.count,11);assert.equal(writes,2);
});
