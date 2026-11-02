const assert=require('node:assert/strict'),M=require('./server/ranked-model.cjs');
const db=M.initial(),now=1800000000000;
const pilots=Array.from({length:11},(_,i)=>M.register(db,{id:'pilot'+i,key:'secret'+i,name:'Piloto '+i,ip:'ip'+i},now));
assert.equal(M.authenticate(db,'pilot0.secret0'),pilots[0]);
assert.equal(M.authenticate(db,'pilot0.forged'),null);
assert.throws(()=>M.register(db,{id:'bad',key:'a',name:'<script>',ip:'x'},now));
assert.throws(()=>M.register(db,{id:'bad',key:'a',name:'PILOTO 0',ip:'x'},now));
assert.throws(()=>M.join(db,pilots[0],{car:'zenith',style:'attack'},now,'bad'));
const enter=(p,t=now)=>M.join(db,p,{car:'aurora',style:'balanced'},t,'room'+p.id);
const room=enter(pilots[0]);
M.settle(db,now+100000);assert.equal(room.status,'waiting');assert.equal(room.players.length,1);
enter(pilots[1],now+100001);
assert.equal(room.startAt,now+145001);
assert.throws(()=>enter(pilots[1]));
M.leave(db,pilots[1]);assert.equal(room.startAt,null);
for(let i=1;i<10;i++)enter(pilots[i],now+100002);
assert.equal(room.players.length,10);assert.equal(room.status,'racing');
assert.throws(()=>M.leave(db,pilots[0]));
const next=enter(pilots[10],now+100003);assert.notEqual(next.id,room.id);assert.equal(next.players.length,1);
M.settle(db,now+130002);assert.equal(room.status,'finished');assert.equal(room.results.length,10);
assert.deepEqual(room.results.map(v=>v.place),[1,2,3,4,5,6,7,8,9,10]);
assert.equal(pilots.slice(0,10).reduce((n,p)=>n+p.wins,0),1);
assert.equal(pilots.slice(0,10).reduce((n,p)=>n+p.podiums,0),3);
assert.equal(pilots[0].matches,1);assert.equal(M.publicPlayer(pilots[0]).album.length,2);
const awarded=JSON.stringify(pilots);M.settle(db,now+300000);assert.equal(JSON.stringify(pilots),awarded);
assert.equal(M.view(db,pilots[0]).history.length,1);
for(const sort of ['rating','level','album','wins','podiums']){
const v=M.view(db,pilots[0],sort);assert.equal(v.ranking.length,11);
assert(!JSON.stringify(v).includes('keyHash'));assert(!JSON.stringify(v).includes('secret0'));
}
const two=M.initial(),a=M.register(two,{id:'a',key:'a',name:'One',ip:'a'},now),b=M.register(two,{id:'b',key:'b',name:'Two',ip:'b'},now);
M.join(two,a,{car:'aurora',style:'attack'},now,'duel');
M.join(two,b,{car:'aurora',style:'save'},now,'unused');
M.settle(two,now+45000);assert.equal(two.rooms[0].status,'racing');
M.settle(two,now+75000);assert.equal(a.matches,1);assert.equal(b.matches,1);
console.log('OK: ranked 2–10, sala cheia, 11º piloto separado, autenticação, validação, saída, Elo, XP, álbum e pagamento único.');

