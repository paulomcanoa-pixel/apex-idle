const test=require('node:test'),assert=require('node:assert/strict');
const M=require('./server/ranked-model.cjs'),API=require('./api/ranked');
const monday=Date.parse('2026-11-16T10:00:00Z'),day=86400000;
function pilot(db,n){return M.register(db,{id:'pilot-'+n,key:'private-key-'+n,name:'Piloto '+n,ip:'ip-'+n},monday)}
function setup(count=3){const db=M.initial(),players=Array.from({length:count},(_,i)=>pilot(db,i));return{db,players}}
function act(db,p,action,extra={},at=monday,id='group-0',requestId=action+'_'+at){return M.socialAction(db,p,{action,requestId,...extra},at,id)}
function social(db,p,at=monday){return M.socialView(db,p,at)}
function trial(db,p,n=0,at=monday){return M.timeTrial(db,p,{car:M.challengeConfig(at).pool[0],style:'balanced',requestId:'trial_'+n+'_'+at},at)}
function response(){return{headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.body=v;return this}}}
function cas(db){let state=structuredClone(db),version=1,writes=0,conflicts=0;return{
 get state(){return state},get writes(){return writes},get conflicts(){return conflicts},
 dependencies:{token:'test-only',sleep:async()=>{},get:async()=>({stream:JSON.stringify(state),blob:{etag:'v'+version}}),put:async(path,body,options)=>{if(options.ifMatch!=='v'+version){conflicts++;throw Object.assign(Error('concurrent write'),{name:'BlobPreconditionFailedError'})}state=JSON.parse(body);version++;writes++}}
}}

test('migração preserva pilotos; social público não expõe sessões, pedidos ou limites internos',()=>{
 const {db,players:[p,q]}=setup(),old=structuredClone(p);db.version=1;M.migrate(db);
 assert.deepEqual(p,old);const before=JSON.stringify(db);assert.equal(social(db,p).crew,null);assert.equal(JSON.stringify(db),before);
 act(db,p,'friendRequest',{code:social(db,q).friendCode});
 const own=M.view(db,p,'rating',monday),anonymous=M.view(db,null,'rating',monday);
 assert.equal(own.social.outgoing[0].id,q.id);assert.deepEqual(anonymous.social.outgoing,[]);assert.equal(anonymous.social.friendCode,null);
 const json=JSON.stringify(own);for(const secret of ['keyHash','private-key-','fingerprint','lastAction','quota'])assert(!json.includes(secret));
 assert.deepEqual(p,old);assert.equal(own.room,null);assert.equal(own.cars.length,22);
 for(const sort of ['constructor','toString','__proto__'])assert.deepEqual(M.view(db,p,sort,monday).ranking,own.ranking);
});

test('escuderias respeitam dez membros, transferência de dono, replay e exclusão vazia',()=>{
 const {db,players}=setup(11),p=players[0];act(db,p,'crewCreate',{name:'Aurora Team'});
 const code=social(db,p).crew.code,before=JSON.stringify(db);
 act(db,p,'crewCreate',{name:'Aurora Team'},monday,'ignored');assert.equal(JSON.stringify(db),before);
 assert.throws(()=>act(db,p,'crewCreate',{name:'Outro Nome'}),{status:409});
 for(const q of players.slice(1,10))act(db,q,'crewJoin',{code});
 assert.equal(social(db,p).crew.members.length,10);assert.throws(()=>act(db,players[10],'crewJoin',{code}),{status:409});
 act(db,p,'crewLeave',{},monday+2000);assert.equal(social(db,p).crew,null);assert.equal(social(db,players[1]).crew.ownerId,players[1].id);
 for(const q of players.slice(1,10))act(db,q,'crewLeave',{},monday+2000);
 assert.equal(Object.keys(db.social.groups).length,0);assert.throws(()=>act(db,players[10],'crewJoin',{code},monday+4000),{status:404});
});

test('inputs, protótipos, ritmo e quota de criação são validados no servidor',()=>{
 const {db,players:[p]}=setup();
 for(const name of ['<script>','a','x'.repeat(21),{}])assert.throws(()=>act(db,p,'crewCreate',{name}),{status:400});
 for(const id of ['__proto__','constructor','prototype','../group'])assert.throws(()=>act(db,p,'crewCreate',{name:'Aurora Team'},monday,id),{status:409});
 for(const code of ['constructor','__proto__',null,{},'P-000000000000'])assert.throws(()=>act(db,p,'crewJoin',{code}),{status:400});
 assert.throws(()=>act(db,p,'crewCreate',{name:'Aurora Team',points:999}),{status:400});
 assert.throws(()=>act(db,p,'crewCreate',{name:'Aurora Team'},monday,'group-0','x'),{status:400});
 let at=monday;for(let i=0;i<3;i++){act(db,p,'crewCreate',{name:'Aurora Team'},at,'group-'+i);assert.throws(()=>act(db,p,'crewLeave',{},at+1),{status:429});at+=2000;act(db,p,'crewLeave',{},at);at+=2000}
 assert.throws(()=>act(db,p,'crewCreate',{name:'Aurora Team'},at,'last-group'),{status:429});
 act(db,p,'crewCreate',{name:'Aurora Team'},monday+day,'next-day');assert(social(db,p,monday+day).crew);
 assert.equal({}.points,undefined);
});

test('amizade exige aceite, mantém entradas e saídas simétricas e remove ambos os lados',()=>{
 const {db,players:[p,q,r]}=setup(),pc=social(db,p).friendCode,qc=social(db,q).friendCode;
 assert.throws(()=>act(db,p,'friendRequest',{code:pc}),{status:400});
 act(db,p,'friendRequest',{code:qc});assert.equal(social(db,p).friends.length,0);assert.equal(social(db,p).outgoing[0].id,q.id);assert.equal(social(db,q).incoming[0].id,p.id);
 assert.deepEqual(social(db,r).incoming,[]);assert.throws(()=>act(db,r,'friendAccept',{code:pc}),{status:404});
 act(db,q,'friendAccept',{code:pc});assert.equal(social(db,p).friends[0].id,q.id);assert.equal(social(db,q).friends[0].id,p.id);assert.equal(social(db,p).outgoing.length,0);assert.equal(social(db,q).incoming.length,0);
 const before=JSON.stringify(db);act(db,q,'friendAccept',{code:pc});assert.equal(JSON.stringify(db),before);
 act(db,q,'friendRemove',{code:pc},monday+2000);assert.deepEqual(social(db,p).friends,[]);assert.deepEqual(social(db,q).friends,[]);
 act(db,p,'friendRequest',{code:qc},monday+4000);act(db,q,'friendDecline',{code:pc},monday+4000);assert.deepEqual(social(db,p).outgoing,[]);assert.deepEqual(social(db,q).incoming,[]);
 act(db,p,'friendRequest',{code:qc},monday+6000);act(db,p,'friendRemove',{code:qc},monday+8000);assert.deepEqual(social(db,p).outgoing,[]);assert.deepEqual(social(db,q).incoming,[]);
});

test('vinte amigos e pedidos por dia limitam crescimento e spam',()=>{
 const {db,players}=setup(23),p=players[0],pc=social(db,p).friendCode;
 for(let i=1;i<=20;i++){act(db,p,'friendRequest',{code:social(db,players[i]).friendCode},monday+i*2000);act(db,players[i],'friendAccept',{code:pc},monday+i*2000)}
 assert.equal(social(db,p).friends.length,20);assert.throws(()=>act(db,p,'friendRequest',{code:social(db,players[21]).friendCode},monday+42000),{status:409});
 act(db,p,'friendRemove',{code:social(db,players[1]).friendCode},monday+42000);
 assert.throws(()=>act(db,p,'friendRequest',{code:social(db,players[21]).friendCode},monday+44000),{status:429});
 act(db,p,'friendRequest',{code:social(db,players[21]).friendCode},monday+day);assert.equal(social(db,p,monday+day).outgoing.length,1);
 assert(db.social.players[p.id].requests.length<=60);
});

test('somente desafios válidos contribuem, até três por dia, com replay sem duplicar',()=>{
 const {db,players:[p]}=setup();act(db,p,'crewCreate',{name:'Aurora Team'});const old=structuredClone(p);
 assert.throws(()=>M.timeTrial(db,p,{car:M.challengeConfig(monday).pool[0],style:'balanced',requestId:'fake_trial',score:999},monday),{status:400});assert.equal(social(db,p).crew.points,0);
 for(let i=0;i<5;i++){const result=trial(db,p,i);assert.equal(result.coop.counted,i<3)}
 assert.equal(social(db,p).crew.points,30);assert.equal(social(db,p).crew.dailyRemaining,0);assert.throws(()=>trial(db,p,5),{status:429});
 const snapshot=JSON.stringify(db);trial(db,p,0);assert.equal(JSON.stringify(db),snapshot);
 trial(db,p,0,monday+day);assert.equal(social(db,p,monday+day).crew.points,40);assert.equal(social(db,p,monday+day).crew.dailyRemaining,2);assert.deepEqual(p,old);
});

test('sair e trocar de escuderia não duplica contribuição; troca de semana libera e arquiva',()=>{
 const {db,players:[p,q]}=setup();act(db,p,'crewCreate',{name:'Aurora Team'});act(db,q,'crewCreate',{name:'Solaris Team'},monday,'group-1');
 trial(db,p);act(db,p,'crewLeave',{},monday+2000);assert(db.social.groups['group-0']);
 act(db,p,'crewJoin',{code:social(db,q).crew.code},monday+4000);assert(social(db,p).crew.lockedToOtherCrew);assert.equal(social(db,p).crew.dailyRemaining,0);
 assert.equal(trial(db,p,1).coop.counted,false);assert.equal(trial(db,p,0,monday+day).coop.counted,false);assert.equal(social(db,q).crew.points,0);
 const next=monday+7*day;M.settle(db,next);assert(!db.social.groups['group-0']);assert.equal(social(db,p,next).history[0].points,10);assert.equal(social(db,p,next).crew.lockedToOtherCrew,false);
 assert.equal(trial(db,p,0,next).coop.counted,true);assert.equal(social(db,p,next).crew.points,10);assert.equal(social(db,p,next).history.length,1);
 M.settle(db,next);assert.equal(social(db,p,next).history.length,1);
});

test('troféus persistentes são cosméticos; ranking coletivo tem empate e é separado do individual',()=>{
 const {db,players:[p,q,r]}=setup();act(db,p,'crewCreate',{name:'Aurora Team'});act(db,q,'crewJoin',{code:social(db,p).crew.code});act(db,r,'crewCreate',{name:'Solaris Team'},monday,'group-1');
 const old=[structuredClone(p),structuredClone(q),structuredClone(r)];
 for(let n=0;n<7;n++)for(let i=0;i<3;i++){trial(db,p,i,monday+n*day);trial(db,q,i,monday+n*day)}
 assert.equal(social(db,p,monday+6*day).crew.points,420);assert.deepEqual(social(db,p).trophies.map(t=>t.tier).sort(),[1,2,3]);assert.equal(social(db,q).trophies.length,3);assert.equal(social(db,r).trophies.length,0);
 M.settle(db,monday+7*day);assert.equal(social(db,p,monday+7*day).history[0].tier,3);assert.equal(social(db,p,monday+7*day).trophies.length,3);assert.equal(social(db,p,monday+7*day).crew.points,0);
 trial(db,p,0,monday+7*day);trial(db,r,0,monday+7*day);const ranks=social(db,p,monday+7*day).crewRanking;assert.deepEqual(ranks.map(v=>v.place),[1,1]);assert(!ranks.some(v=>Object.hasOwn(v,'rating')));
 assert.deepEqual([p,q,r],old);
});

test('API usa sessão e origem existentes; retry imediato idempotente não consome rate limit',async()=>{
 let db=M.initial(),at=monday;const handler=API.createHandler(async action=>{const draft=structuredClone(db),value=action(draft);db=draft;return value},()=>at),headers={host:'apex.test',origin:'https://apex.test'};
 const reg=response();await handler({method:'POST',headers,body:{action:'register',name:'Aurora Online'}},reg);assert.equal(reg.code,200);
 const cookie=reg.headers['Set-Cookie'].split(';')[0],body={action:'crewCreate',name:'Aurora Team',requestId:'create_api_1'};
 const noSession=response();await handler({method:'POST',headers,body},noSession);assert.equal(noSession.code,401);
 const first=response(),replay=response();await handler({method:'POST',headers:{...headers,cookie},body},first);await handler({method:'POST',headers:{...headers,cookie},body},replay);
 assert.equal(first.code,200);assert.equal(replay.code,200);assert.equal(first.body.social.crew.id,replay.body.social.crew.id);assert.equal(Object.keys(db.social.groups).length,1);
 const changed=response();await handler({method:'POST',headers:{...headers,cookie},body:{...body,name:'Outro Time'}},changed);assert.equal(changed.code,409);
 const wrong=response();await handler({method:'POST',headers:{...headers,cookie,origin:'https://evil.test'},body:{action:'crewLeave',requestId:'leave_api_1'}},wrong);assert.equal(wrong.code,403);assert(first.body.social.crew);
 at+=2000;const spoof=response();await handler({method:'POST',headers:{...headers,cookie},body:{action:'crewLeave',requestId:'leave_api_1',points:999}},spoof);assert.equal(spoof.code,400);assert.equal(Object.keys(db.social.groups).length,1);
});

test('CAS concorrente para última vaga revalida capacidade no estado atualizado',async()=>{
 const {db,players}=setup(11);act(db,players[0],'crewCreate',{name:'Aurora Team'});const code=social(db,players[0]).crew.code;for(const p of players.slice(1,9))act(db,p,'crewJoin',{code});
 const storage=cas(db);const results=await Promise.allSettled(players.slice(9).map(p=>API.transaction(draft=>act(draft,draft.players[p.id],'crewJoin',{code}),storage.dependencies)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);assert.equal(storage.conflicts,1);assert.equal(storage.state.social.groups['group-0'].members.length,10);
});

test('CAS de pedidos simultâneos e aceite repetido mantém relações simétricas',async()=>{
 const {db,players:[p,q,r]}=setup(),code=social(db,p).friendCode,storage=cas(db);
 await Promise.all([q,r].map(other=>API.transaction(draft=>act(draft,draft.players[other.id],'friendRequest',{code}),storage.dependencies)));
 assert.equal(storage.conflicts,1);assert.deepEqual(new Set(storage.state.social.players[p.id].incoming),new Set([q.id,r.id]));
 const qc=social(storage.state,q).friendCode;await Promise.all([0,1].map(()=>API.transaction(draft=>act(draft,draft.players[p.id],'friendAccept',{code:qc}),storage.dependencies)));
 assert.equal(storage.state.social.players[p.id].friends.length,1);assert.equal(storage.state.social.players[q.id].friends.length,1);assert.deepEqual(storage.state.social.players[p.id].incoming,[r.id]);
});

test('CAS revalida vinte pedidos recebidos e não duplica GP em tentativa repetida',async()=>{
 const {db,players}=setup(22),p=players[0],code=social(db,p).friendCode;
 for(const other of players.slice(1,20))act(db,other,'friendRequest',{code});
 const storage=cas(db),results=await Promise.allSettled(players.slice(20).map(other=>API.transaction(draft=>act(draft,draft.players[other.id],'friendRequest',{code}),storage.dependencies)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);assert.equal(storage.state.social.players[p.id].incoming.length,20);
 act(storage.state,storage.state.players[p.id],'crewCreate',{name:'Aurora Team'});
 const finishes=await Promise.all([0,1].map(()=>API.transaction(draft=>trial(draft,draft.players[p.id]),storage.dependencies)));
 assert.deepEqual(finishes[0],finishes[1]);assert.equal(storage.state.timeTrial.players[p.id].attempts,1);assert.equal(storage.state.social.groups['group-0'].points,10);
});

test('histórico e troféus têm limite após muitas temporadas cooperativas',()=>{
 const {db,players:[p,q]}=setup();act(db,p,'crewCreate',{name:'Aurora Team'});act(db,q,'crewJoin',{code:social(db,p).crew.code});
 for(let week=0;week<24;week++){for(let n=0;n<7;n++)for(let i=0;i<3;i++){const at=monday+(week*7+n)*day;trial(db,p,i,at);trial(db,q,i,at)}M.settle(db,monday+(week+1)*7*day)}
 const state=social(db,p,monday+24*7*day);assert.equal(state.trophies.length,60);assert.equal(state.history.length,16);assert.equal(new Set(state.trophies.map(v=>v.id)).size,60);assert.equal(state.crew.points,0);
});

test('capacidade local: 2000 perfis e conclusões válidas com estado limitado e sem dados privados',t=>{
 const start=performance.now(),{db,players}=setup(2000);
 for(let i=0;i<players.length;i+=10){const owner=players[i];act(db,owner,'crewCreate',{name:'Equipe '+i},monday,'group-'+i);const code=social(db,owner).crew.code;for(const p of players.slice(i+1,i+10))act(db,p,'crewJoin',{code})}
 for(const p of players)trial(db,p);
 const view=M.view(db,players[0],'rating',monday),bytes=Buffer.byteLength(JSON.stringify(db));
 assert.equal(Object.keys(db.players).length,2000);assert.equal(Object.keys(db.social.groups).length,200);assert.equal(Object.keys(db.timeTrial.players).length,2000);
 assert.equal(view.ranking.length,100);assert.equal(view.social.crewRanking.length,50);assert.equal(view.challenge.ranking.length,50);assert.equal(view.social.crew.points,100);assert.equal(view.social.trophies.length,1);
 assert.equal(Object.values(db.social.groups).reduce((sum,g)=>sum+g.points,0),20000);assert(bytes<8*1024*1024);assert(!JSON.stringify(view).includes('private-key-'));
 assert.throws(()=>pilot(db,2001),{status:503});t.diagnostic('2000 perfis, 200 equipes e 2000 conclusões: '+Math.round(performance.now()-start)+' ms; estado '+bytes+' bytes (simulação local, sem rede).');
});
