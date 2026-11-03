const crypto=require('node:crypto');
const cars=['aurora','vento','scarlatto','solar','eclipse','zenith'];
const names=['Aurora Apex-01','Vento Apex-02','Scarlatto Apex-03','Solar Apex-04','Eclipse Apex-05','Zenith Apex-06'];
const unlock=[0,1,3,7,15,30];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=(code,message)=>{const e=new Error(message);e.status=code;throw e};
function initial(){return {version:1,players:{},rooms:[],limits:{}}}
function level(p){return 1+Math.floor(p.xp/100)}
function album(p){return cars.filter((c,i)=>p.matches>=unlock[i])}
function league(r){return r<1100?'Bronze':r<1300?'Prata':r<1500?'Ouro':r<1800?'Platina':'Diamante'}
function publicPlayer(p){return {id:p.id,name:p.name,rating:p.rating,league:league(p.rating),level:level(p),xp:p.xp,matches:p.matches,wins:p.wins,album:album(p),podiums:p.podiums}}
function safeName(name){if(typeof name!=='string')fail(400,'Digite um nome de piloto.');name=name.trim().normalize('NFC');if(!/^[\p{L}\p{N}_ -]{3,20}$/u.test(name))fail(400,'Use de 3 a 20 letras, números, espaços ou traços.');return name}
function register(db,{id,key,name,ip},now){name=safeName(name);if(Object.values(db.players).some(p=>p.name.toLowerCase()===name.toLowerCase()))fail(409,'Este nome de piloto já está em uso.');
if(Object.keys(db.players).length>=2000)fail(503,'Cadastro temporariamente cheio.');
const bucket=hash(ip+':'+Math.floor(now/3600000));if((db.limits[bucket]||0)>=10)fail(429,'Muitos cadastros. Tente novamente mais tarde.');db.limits[bucket]=(db.limits[bucket]||0)+1;
const p={id,name,keyHash:hash(key),created:now,rating:1000,xp:0,matches:0,wins:0,podiums:0,lastAction:0,history:[]};db.players[id]=p;return p}
function authenticate(db,cookie){if(!cookie)return null;const [id,key]=cookie.split('.'),p=db.players[id];if(!p||!key)return null;const a=Buffer.from(p.keyHash),b=Buffer.from(hash(key));return a.length===b.length&&crypto.timingSafeEqual(a,b)?p:null}
function roomOf(db,id){return db.rooms.find(r=>r.status!=='finished'&&r.players.some(v=>v.id===id))}
function join(db,p,{car,style},now,id){if(!cars.includes(car)||!album(p).includes(car))fail(400,'Carro ainda não liberado no álbum ranked.');if(!['balanced','attack','save'].includes(style))fail(400,'Estratégia inválida.');if(roomOf(db,p.id))fail(409,'Você já está em uma sala.');
let r=db.rooms.find(r=>r.status==='waiting'&&r.players.length<10&&(!r.players.length||Math.abs(db.players[r.players[0].id].rating-p.rating)<=500));
if(!r){r={id,status:'waiting',created:now,startAt:null,endAt:null,track:parseInt(hash(id).slice(0,4),16)%3,players:[]};db.rooms.push(r)}
r.players.push({id:p.id,car,style,rating:p.rating});if(r.players.length>=2&&!r.startAt)r.startAt=now+45000;if(r.players.length===10)start(r,now);return r}
function start(r,now){r.status='racing';r.startAt=now;r.endAt=now+30000}
function raceTime(room,v){const seed=parseInt(hash(room.id+':'+v.id).slice(0,8),16)/0xffffffff;
const setup={balanced:[1,1,1],attack:[.98,1.02,1.01],save:[1.025,.99,1.005]}[v.style];
const ci=cars.indexOf(v.car),carBonus=[0,.004,-.004,.003,-.003,.002][ci];
return Math.round((490+room.track*25)*(setup[room.track]+carBonus+(seed-.5)*.012)*1000)/1000}
function finish(db,r,now){if(r.status!=='racing'||now<r.endAt)return false;
const results=r.players.map(v=>({...v,name:db.players[v.id].name,time:raceTime(r,v)})).sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
for(let i=0;i<results.length;i++){const row=results[i],p=db.players[row.id];let delta=0;
for(let j=0;j<results.length;j++){if(i===j)continue;const expected=1/(1+10**((results[j].rating-row.rating)/400));delta+=(i<j?1:0)-expected}
delta=Math.round(32*delta/Math.max(1,results.length-1));p.rating=Math.max(0,p.rating+delta);p.xp+=30+(results.length-i)*10;p.matches++;if(i===0)p.wins++;if(i<3)p.podiums++;p.history=[r.id,...p.history].slice(0,12);row.delta=delta;row.place=i+1;row.xp=30+(results.length-i)*10}
r.results=results;r.status='finished';return true}
function settle(db,now){for(const r of db.rooms){if(r.status==='waiting'&&r.players.length>=2&&r.startAt&&r.startAt<=now)start(r,now);finish(db,r,now)}
const keep=new Set(Object.values(db.players).flatMap(p=>p.history));db.rooms=db.rooms.filter(r=>r.status!=='finished'||keep.has(r.id)).slice(-1000);
if(Object.keys(db.limits).length>1000)db.limits={}
}
function leave(db,p){const r=roomOf(db,p.id);if(!r)return;if(r.status==='racing')fail(409,'A corrida já começou. Aguarde a bandeirada.');r.players=r.players.filter(v=>v.id!==p.id);if(r.players.length<2)r.startAt=null;db.rooms=db.rooms.filter(r=>r.players.length)}
function roomPublic(db,r){if(!r)return null;return {id:r.id,status:r.status,track:r.track,startAt:r.startAt,endAt:r.endAt,capacity:10,players:r.players.map(v=>({id:v.id,name:db.players[v.id].name,car:v.car,style:v.style})),results:r.results||null}}
function view(db,p,sort='rating',now=Date.now()){const keys={rating:p=>p.rating,level:level,album:p=>album(p).length,wins:p=>p.wins,podiums:p=>p.podiums};const score=keys[sort]||keys.rating;
const ranking=Object.values(db.players).sort((a,b)=>score(b)-score(a)||b.rating-a.rating||a.created-b.created).slice(0,100).map(publicPlayer);
return {now,me:p?publicPlayer(p):null,ranking,totalPlayers:Object.keys(db.players).length,room:p?roomPublic(db,roomOf(db,p.id)):null,history:p?p.history.map(id=>roomPublic(db,db.rooms.find(r=>r.id===id))).filter(Boolean):[],cars:cars.map((id,i)=>({id,name:names[i],unlock:unlock[i]}))}}
module.exports={initial,register,authenticate,join,leave,settle,view,hash,raceTime,finish,publicPlayer};

