const crypto=require('node:crypto');
const historical=require('../legends-data').cars;
const cars=historical.map(c=>c.id),names=historical.map(c=>c.name);
const unlock=[0,1,3,7,15,30,36,42,48,54,60,66,72,78,84,90,96,102,108,114,125,140];
const legacyIds=['aurora','vento','scarlatto','solar','eclipse','zenith'];
const canonical=id=>legacyIds.includes(id)?cars[legacyIds.indexOf(id)]:id;
const styles=['balanced','attack','save'];
// Equal total budget. Solo rarity, upgrades and paid currencies never enter ranked power.
function normalized(id){const c=historical.find(c=>c.id===canonical(id));if(!c)return null;const values=[c.stats.power,(c.stats.aero+c.stats.traction)/2,c.stats.tyres],mean=values.reduce((a,b)=>a+b,0)/3,span=Math.max(10,...values.map(v=>Math.abs(v-mean)));return values.map(v=>1+(v-mean)/span*.012)}
function migrate(db){db.version=2;db.players=db.players||{};db.rooms=db.rooms||[];db.limits=db.limits||{};return db}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=(code,message)=>{const e=new Error(message);e.status=code;throw e};
function initial(){return {version:2,players:{},rooms:[],limits:{}}}
function level(p){return 1+Math.floor(p.xp/100)}
function album(p){return cars.filter((c,i)=>p.matches>=unlock[i])}
function league(r){return r<1100?'Bronze':r<1300?'Prata':r<1500?'Ouro':r<1800?'Platina':'Diamante'}
function publicPlayer(p){return {id:p.id,name:p.name,rating:p.rating,league:league(p.rating),level:level(p),xp:p.xp,matches:p.matches,wins:p.wins,album:album(p),podiums:p.podiums}}
function safeName(name){if(typeof name!=='string')fail(400,'Digite um nome de piloto.');name=name.trim().normalize('NFC');if(!/^[\p{L}\p{N}_ -]{3,20}$/u.test(name))fail(400,'Use de 3 a 20 letras, números, espaços ou traços.');return name}
function register(db,{id,key,name,ip},now){name=safeName(name);if(Object.values(db.players).some(p=>p.name.toLowerCase()===name.toLowerCase()))fail(409,'Este nome de piloto já está em uso.');
if(Object.keys(db.players).length>=2000)fail(503,'Cadastro temporariamente cheio.');
const bucket=hash(ip+':'+Math.floor(now/3600000));if((db.limits[bucket]||0)>=10)fail(429,'Muitos cadastros. Tente novamente mais tarde.');db.limits[bucket]=(db.limits[bucket]||0)+1;
const p={id,name,keyHash:hash(key),created:now,rating:1000,xp:0,matches:0,wins:0,podiums:0,lastAction:0,history:[]};db.players[id]=p;return p}
function authenticate(db,cookie){if(!cookie)return null;if(typeof cookie!=='string'||cookie.length>200)return null;const [id,key,...extra]=cookie.split('.');if(extra.length||!Object.hasOwn(db.players,id))return null;const p=db.players[id];if(!p||!key||typeof p.keyHash!=='string'||!/^[a-f0-9]{64}$/.test(p.keyHash))return null;const a=Buffer.from(p.keyHash),b=Buffer.from(hash(key));return a.length===b.length&&crypto.timingSafeEqual(a,b)?p:null}
function roomOf(db,id){return db.rooms.find(r=>r.status!=='finished'&&r.players.some(v=>v.id===id))}
function join(db,p,{car,style},now,id){car=canonical(car);if(!cars.includes(car)||!album(p).includes(car))fail(400,'Carro ainda não liberado no álbum ranked.');if(!styles.includes(style))fail(400,'Estratégia inválida.');if(roomOf(db,p.id))fail(409,'Você já está em uma sala.');
let r=db.rooms.find(r=>r.status==='waiting'&&r.players.length<10&&(!r.players.length||Math.abs(db.players[r.players[0].id].rating-p.rating)<=500));
if(!r){r={id,status:'waiting',created:now,startAt:null,endAt:null,track:parseInt(hash(id).slice(0,4),16)%3,players:[]};db.rooms.push(r)}
r.players.push({id:p.id,car,style,rating:p.rating});if(r.players.length>=2&&!r.startAt)r.startAt=now+45000;if(r.players.length===10)start(r,now);return r}
function start(r,now){r.status='racing';r.startAt=now;r.endAt=now+30000}
function raceTime(room,v){const seed=parseInt(hash(room.id+':'+v.id).slice(0,8),16)/0xffffffff;
const setup={balanced:[1,1,1],attack:[.98,1.02,1.01],save:[1.025,.99,1.005]}[v.style];
const traits=normalized(v.car)||[1,1,1],carBonus=1-traits[room.track];
return Math.round((490+room.track*25)*(setup[room.track]+carBonus+(seed-.5)*.012)*1000)/1000}
function finish(db,r,now){if(r.status!=='racing'||now<r.endAt)return false;
const results=r.players.map(v=>({...v,name:db.players[v.id].name,time:raceTime(r,v)})).sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
for(let i=0;i<results.length;i++){const row=results[i],p=db.players[row.id];let delta=0;
for(let j=0;j<results.length;j++){if(i===j)continue;const expected=1/(1+10**((results[j].rating-row.rating)/400));delta+=(i<j?1:0)-expected}
delta=Math.round(32*delta/Math.max(1,results.length-1));p.rating=Math.max(0,p.rating+delta);p.xp+=30+(results.length-i)*10;p.matches++;if(i===0)p.wins++;if(i<3)p.podiums++;p.history=[r.id,...p.history].slice(0,12);row.delta=delta;row.place=i+1;row.xp=30+(results.length-i)*10}
r.results=results;r.status='finished';return true}
function settle(db,now){migrate(db);for(const r of db.rooms){if(r.status==='waiting'&&r.players.length>=2&&r.startAt&&r.startAt<=now)start(r,now);finish(db,r,now)}
const keep=new Set(Object.values(db.players).flatMap(p=>p.history));const active=db.rooms.filter(r=>r.status!=='finished'),finished=db.rooms.filter(r=>r.status==='finished'&&keep.has(r.id)).slice(-1000);db.rooms=[...active,...finished];
if(Object.keys(db.limits).length>1000)db.limits={}
settleSocial(db,now);
}
function leave(db,p){const r=roomOf(db,p.id);if(!r)return;if(r.status==='racing')fail(409,'A corrida já começou. Aguarde a bandeirada.');r.players=r.players.filter(v=>v.id!==p.id);if(r.players.length<2)r.startAt=null;db.rooms=db.rooms.filter(r=>r.players.length)}
function roomPublic(db,r){if(!r)return null;return {id:r.id,status:r.status,track:r.track,startAt:r.startAt,endAt:r.endAt,capacity:10,players:r.players.map(v=>({id:v.id,name:db.players[v.id].name,car:canonical(v.car),style:v.style})),results:r.results?r.results.map(v=>({...v,car:canonical(v.car)})):null}}
function view(db,p,sort='rating',now=Date.now()){const keys={rating:p=>p.rating,level:level,album:p=>album(p).length,wins:p=>p.wins,podiums:p=>p.podiums};const score=Object.hasOwn(keys,sort)?keys[sort]:keys.rating;
const ranking=Object.values(db.players).sort((a,b)=>score(b)-score(a)||b.rating-a.rating||a.created-b.created).slice(0,100).map(publicPlayer);
return {now,me:p?publicPlayer(p):null,ranking,totalPlayers:Object.keys(db.players).length,room:p?roomPublic(db,roomOf(db,p.id)):null,history:p?p.history.map(id=>roomPublic(db,db.rooms.find(r=>r.id===id))).filter(Boolean):[],challenge:challengeView(db,p,now),social:socialView(db,p,now),cars:cars.map((id,i)=>({id,name:names[i],unlock:unlock[i],traits:normalized(id)}))}}
// Monday UTC boundary shared by all players; scores and device clocks are never accepted.
function challengeConfig(now){const d=new Date(now);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);const week=d.toISOString().slice(0,10),seed=parseInt(hash(week).slice(0,8),16),track=seed%3;return {week,track,title:['Velocidade nas retas','Precisão nas curvas','Conservação de pneus'][track],condition:track===1?'Chuva leve':'Pista seca',pool:[0,7,14].map(n=>cars[(seed+n)%cars.length]),expires:d.getTime()+7*86400000}}
function challengeStore(db,config){if(db.timeTrial?.week!==config.week)db.timeTrial={week:config.week,players:{}};return db.timeTrial}
function trialResult(config,car,style){const traits=normalized(car),weights=[[.65,.2,.15],[.15,.65,.2],[.2,.2,.6]][config.track],mode={balanced:[1,1,1],attack:[1.025,.995,.975],save:[.985,1.005,1.01]}[style];const sectors=weights.map((weight,i)=>Math.round(500*weight/(traits[i]*mode[i])*1000)/1000);return {car,style,time:Math.round(sectors.reduce((a,b)=>a+b,0)*1000)/1000,sectors,explanation:['Reta '+sectors[0].toFixed(3)+' s','Curvas '+sectors[1].toFixed(3)+' s','Gestão de pneus '+sectors[2].toFixed(3)+' s']}}
function timeTrial(db,p,input,now){if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Pedido inválido.');const {car,style,requestId}=input;
if(['time','score','result','power','pi'].some(k=>Object.hasOwn(input,k)))fail(400,'O resultado é calculado pelo servidor.');
if(typeof requestId!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(requestId))fail(400,'Identificador de tentativa inválido.');
const config=challengeConfig(now);if(!config.pool.includes(car)||!styles.includes(style))fail(400,'Escolha um carro do desafio e uma estratégia válida.');
const store=challengeStore(db,config),day=new Date(now).toISOString().slice(0,10),entry=store.players[p.id]||(store.players[p.id]={day,attempts:0,requests:[],best:null,last:null});
const old=entry.requests.find(r=>r.id===requestId);if(old){if(old.car!==car||old.style!==style)fail(409,'Esta tentativa já foi usada com outra configuração.');return old.result}
if(entry.day!==day){entry.day=day;entry.attempts=0}
if(entry.attempts>=5)fail(429,'Você concluiu as cinco tentativas de hoje. Volte após 00h UTC.');
const result={...trialResult(config,car,style),at:now};result.coop=contributeSocial(db,p,now);entry.attempts++;entry.last=result;entry.requests=[{id:requestId,car,style,result},...entry.requests].slice(0,40);if(!entry.best||result.time<entry.best.time)entry.best=result;return result}
function challengeView(db,p,now){const config=challengeConfig(now),store=db.timeTrial?.week===config.week?db.timeTrial:null,entry=store?.players?.[p?.id],day=new Date(now).toISOString().slice(0,10);const records=Object.entries(store?.players||{}).filter(([id,v])=>db.players[id]&&v.best).map(([id,v])=>({id,name:db.players[id].name,...v.best})).sort((a,b)=>a.time-b.time||a.at-b.at);let place=0;const ranking=records.map((v,i)=>{if(!i||v.time!==records[i-1].time)place=i+1;return {...v,place}});return {...config,cars:config.pool.map(id=>({id,name:names[cars.indexOf(id)],traits:normalized(id)})),remaining:5-(entry?.day===day?entry.attempts:0),attempts:entry?.day===day?entry.attempts:0,best:entry?.best||null,last:entry?.last||null,position:ranking.find(v=>v.id===p?.id)?.place||null,totalPlayers:ranking.length,ranking:ranking.slice(0,50),attemptLimit:5}}
const socialActions=Object.freeze(['crewCreate','crewJoin','crewLeave','friendRequest','friendAccept','friendRemove','friendDecline']);
// Social progress is isolated from ranked rating, album unlocks and solo currencies.
const milestones=Object.freeze([{points:60,title:'Escuderia Bronze',tier:1},{points:180,title:'Escuderia Prata',tier:2},{points:420,title:'Escuderia Ouro',tier:3}]);
function socialStore(db){if(!db.social)db.social={players:{},groups:{}};return db.social}
function socialMember(db,id){const store=socialStore(db);if(!Object.hasOwn(store.players,id))store.players[id]={friends:[],incoming:[],outgoing:[],crewId:null,requests:[],trophies:[],history:[],lastAction:0};return store.players[id]}
function friendCode(id){return 'P-'+hash(id+':friend').slice(0,12).toUpperCase()}
function crewCode(id){return 'E-'+hash(id+':crew').slice(0,12).toUpperCase()}
function findCode(db,code){if(typeof code!=='string'||!/^P-[A-F0-9]{12}$/.test(code.trim().toUpperCase()))fail(400,'Informe um código de amizade válido.');const target=Object.values(db.players).find(p=>friendCode(p.id)===code.trim().toUpperCase());if(!target)fail(404,'Código de piloto não encontrado.');return target}
function crewOf(db,id){const store=db.social,member=store?.players?.[id],group=member?.crewId&&Object.hasOwn(store.groups,member.crewId)?store.groups[member.crewId]:null;return group?.members.includes(id)?group:null}
function awardCrew(db,group){const earned=milestones.filter(m=>group.points>=m.points);if(!earned.length)return;for(const [id,points]of Object.entries(group.contributions)){if(points<10||!Object.hasOwn(db.players,id))continue;const member=socialMember(db,id);for(const m of earned){const trophyId=group.week+':'+group.id+':'+m.tier;if(member.trophies.some(t=>t.id===trophyId))continue;member.trophies.unshift({id:trophyId,title:m.title,week:group.week,crewName:group.name,tier:m.tier})}member.trophies=member.trophies.slice(0,60)}}
function settleSocial(db,now){const store=db.social;if(!store)return;const week=challengeConfig(now).week;for(const group of Object.values(store.groups)){if(group.week===week)continue;awardCrew(db,group);const tier=milestones.filter(m=>group.points>=m.points).at(-1)?.tier||0;const record={week:group.week,crewName:group.name,points:group.points,tier};for(const id of Object.keys(group.contributions)){if(!Object.hasOwn(db.players,id))continue;const member=socialMember(db,id);if(!member.history.some(r=>r.week===record.week&&r.crewId===group.id))member.history.unshift({...record,crewId:group.id});member.history=member.history.slice(0,16)}if(!group.members.length){delete store.groups[group.id];continue}group.week=week;group.points=0;group.contributions={}}}
function socialAction(db,p,input,now,id){
 if(!input||typeof input!=='object'||Array.isArray(input)||!socialActions.includes(input.action))fail(400,'Ação social inválida.');
 const {action,requestId}=input,allowed=action==='crewCreate'?['action','requestId','name']:['crewJoin','friendRequest','friendAccept','friendRemove','friendDecline'].includes(action)?['action','requestId','code']:['action','requestId'];
 if(Object.keys(input).some(key=>!allowed.includes(key)))fail(400,'Envie apenas os dados desta ação.');
 if(typeof requestId!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(requestId))fail(400,'Identificador de ação inválido.');
 const payload={action,...(input.name!==undefined?{name:input.name}:{}),...(input.code!==undefined?{code:input.code}:{})},fingerprint=hash(JSON.stringify(payload)),member=socialMember(db,p.id),old=member.requests.find(r=>r.id===requestId);
 if(old){if(old.fingerprint!==fingerprint)fail(409,'Esta ação já foi usada com outros dados.');return{replayed:true}}
 if(now-member.lastAction<1200)fail(429,'Aguarde um instante antes da próxima ação social.');
 settleSocial(db,now);const store=socialStore(db),day=new Date(now).toISOString().slice(0,10),quota=member.quota?.day===day?member.quota:{day,requests:0,creations:0};
 if(action==='crewCreate'){
  const name=safeName(input.name);if(crewOf(db,p.id))fail(409,'Saia da escuderia atual antes de criar outra.');if(quota.creations>=3)fail(429,'Você já criou três escuderias hoje.');if(Object.keys(store.groups).length>=500)fail(503,'Limite de escuderias atingido. Entre em uma existente.');
  if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(id)||['constructor','prototype','__proto__'].includes(id)||Object.hasOwn(store.groups,id))fail(409,'Não foi possível criar este código de escuderia.');
  store.groups[id]={id,name,ownerId:p.id,members:[p.id],created:now,week:challengeConfig(now).week,points:0,contributions:{}};member.crewId=id;quota.creations++;
 }else if(action==='crewJoin'){
  if(typeof input.code!=='string'||!/^E-[A-F0-9]{12}$/.test(input.code.trim().toUpperCase()))fail(400,'Informe um código de escuderia válido.');const group=Object.values(store.groups).find(g=>crewCode(g.id)===input.code.trim().toUpperCase()&&g.members.length);
  if(!group)fail(404,'Escuderia não encontrada.');if(crewOf(db,p.id))fail(409,'Saia da escuderia atual antes de entrar em outra.');if(group.members.length>=10)fail(409,'Esta escuderia já tem dez pilotos.');group.members.push(p.id);member.crewId=group.id;
 }else if(action==='crewLeave'){
  const group=crewOf(db,p.id);if(group){group.members=group.members.filter(id=>id!==p.id);if(group.ownerId===p.id)group.ownerId=group.members[0]||null;member.crewId=null;if(!group.members.length&&!Object.keys(group.contributions).length)delete store.groups[group.id]}
 }else{
  const target=findCode(db,input.code);if(target.id===p.id)fail(400,'Use o código de outro piloto.');const other=socialMember(db,target.id);
  if(action==='friendRequest'){
   if(member.friends.includes(target.id))fail(409,'Este piloto já é seu amigo.');if(member.incoming.includes(target.id))fail(409,'Este piloto já enviou um pedido. Aceite na lista de recebidos.');if(member.outgoing.includes(target.id))fail(409,'Pedido já enviado.');
   if(member.friends.length>=20||other.friends.length>=20||member.outgoing.length>=20||other.incoming.length>=20)fail(409,'Limite de amigos ou pedidos atingido.');if(quota.requests>=20)fail(429,'Você já enviou vinte pedidos hoje.');member.outgoing.push(target.id);other.incoming.push(p.id);quota.requests++;
  }else if(action==='friendAccept'){
   if(!member.incoming.includes(target.id)||!other.outgoing.includes(p.id))fail(404,'Pedido não encontrado.');if(member.friends.length>=20||other.friends.length>=20)fail(409,'Limite de vinte amigos atingido.');member.friends.push(target.id);other.friends.push(p.id);member.incoming=member.incoming.filter(id=>id!==target.id);other.outgoing=other.outgoing.filter(id=>id!==p.id);
  }else if(action==='friendDecline'){member.incoming=member.incoming.filter(id=>id!==target.id);other.outgoing=other.outgoing.filter(id=>id!==p.id)}
  else{for(const [a,b]of [[member,target.id],[other,p.id]])for(const field of ['friends','incoming','outgoing'])a[field]=a[field].filter(id=>id!==b)}
 }
 member.quota=quota;member.lastAction=now;member.requests.unshift({id:requestId,fingerprint});member.requests=member.requests.slice(0,60);return{replayed:false};
}
// Called only after a new server-computed trial; replay returns before this hook.
function contributeSocial(db,p,now){settleSocial(db,now);const group=crewOf(db,p.id);if(!group)return{counted:false,points:0,reason:'Entre em uma escuderia para participar do GP coletivo.'};const member=socialMember(db,p.id),week=challengeConfig(now).week,day=new Date(now).toISOString().slice(0,10);let cap=member.coop;
 if(cap?.week===week&&cap.crewId!==group.id)return{counted:false,points:0,reason:'Suas contribuições desta semana pertencem à escuderia anterior.'};
 if(!cap||cap.week!==week)cap={week,crewId:group.id,day,count:0};if(cap.day!==day){cap.day=day;cap.count=0}if(cap.count>=3)return{counted:false,points:0,remaining:0,reason:'Limite de três contribuições do dia atingido.'};
 cap.count++;member.coop=cap;group.points+=10;group.contributions[p.id]=(group.contributions[p.id]||0)+10;awardCrew(db,group);return{counted:true,points:10,remaining:3-cap.count};
}
function socialView(db,p,now){const week=challengeConfig(now).week,day=new Date(now).toISOString().slice(0,10),store=db.social,member=store?.players?.[p?.id],group=p?crewOf(db,p.id):null;
 const person=id=>{const other=Object.hasOwn(db.players,id)?db.players[id]:null;return other?{id:other.id,name:other.name,code:friendCode(id),rating:other.rating,league:league(other.rating)}:null};
 const list=key=>(member?.[key]||[]).map(person).filter(Boolean);
 const current=group?.week===week,points=current?group.points:0,cap=member?.coop,locked=!!(group&&cap?.week===week&&cap.crewId!==group.id),dailyRemaining=locked?0:3-(cap?.week===week&&cap.day===day?cap.count:0);
 const crew=group?{id:group.id,name:group.name,code:crewCode(group.id),ownerId:group.ownerId,isOwner:group.ownerId===p.id,members:group.members.map(id=>({id,name:db.players[id]?.name||'Piloto',owner:group.ownerId===id,points:current?group.contributions[id]||0:0})),capacity:10,week,points,goal:420,milestones:milestones.map(m=>({...m,earned:points>=m.points})),ownPoints:current?group.contributions[p.id]||0:0,dailyRemaining,lockedToOtherCrew:locked}:null;
 const crews=Object.values(store?.groups||{}).filter(g=>g.week===week&&g.members.length&&g.points>0).sort((a,b)=>b.points-a.points||a.created-b.created).slice(0,50);let place=0;const crewRanking=crews.map((g,i)=>{if(!i||g.points!==crews[i-1].points)place=i+1;return{name:g.name,points:g.points,members:g.members.length,place}});
 return{friendCode:p?friendCode(p.id):null,friends:list('friends'),incoming:list('incoming'),outgoing:list('outgoing'),crew,crewRanking,trophies:member?.trophies||[],history:member?.history||[],contributionLimit:3,pointsPerContribution:10,friendLimit:20,week};
}
module.exports={initial,migrate,canonical,normalized,challengeConfig,challengeView,timeTrial,trialResult,register,authenticate,join,leave,settle,view,hash,raceTime,finish,publicPlayer,socialActions,socialAction,socialView,settleSocial};

