(function(root){
const tiers=['Júnior','Challenger','Pro','Elite','Apex','Lenda'];
const parts=['Motor','Aerodinâmica','Chassi','Pneus','Câmbio','Resfriamento'];
const rarity=['Comum','Raro','Épico','Lendário'],bonuses=[.04,.08,.15,.28],starNeed=[1,2,4,8,16];
const roster=[
{id:'lia',name:'Lia Monteiro',role:'driver',rarity:0,color:'#a9bac8'},
{id:'enzo',name:'Enzo Vale',role:'driver',rarity:1,color:'#70caff'},
{id:'maya',name:'Maya Veloz',role:'driver',rarity:2,color:'#c6a0ff'},
{id:'nico',name:'Nico Solari',role:'driver',rarity:3,color:'#ffd07a'},
{id:'ines',name:'Inês Costa',role:'driver',rarity:3,color:'#ffd07a'},
{id:'rui',name:'Rui Prado',role:'engineer',rarity:0,color:'#a9bac8'},
{id:'ana',name:'Ana Circuito',role:'engineer',rarity:1,color:'#70caff'},
{id:'leo',name:'Léo Ventura',role:'engineer',rarity:2,color:'#c6a0ff'},
{id:'iris',name:'Íris Brandão',role:'engineer',rarity:3,color:'#ffd07a'},
{id:'tomas',name:'Tomás Luz',role:'engineer',rarity:3,color:'#ffd07a'}];
function day(now){return Math.floor((now-10800000)/86400000)}
function month(now){const d=new Date(now-10800000);return d.getUTCFullYear()*12+d.getUTCMonth()}
function fresh(now=Date.now()){return{v:1,tier:0,season:1,round:0,points:0,titles:0,levels:[0,0,0,0,0,0],rep:0,earned:0,tickets:10,gems:0,roster:{lia:{stars:0,copies:0},rui:{stars:0,copies:0}},driver:'lia',engineers:['rui'],pity:{standard:{leg:0,epic:0,guaranteed:false},featured:{leg:0,epic:0,guaranteed:false}},results:[],races:0,running:false,at:now,live:0,offline:0,daily:{day:day(now),races:0,upgrades:0,pulls:0,claimed:[],bonus:false,chest:false},pass:{month:month(now),races:0,claimed:[]},event:{month:month(now),races:0,claimed:false},lastDrop:[]}}
function init(s,now=Date.now()){if(!s.championship)s.championship=fresh(now);return s.championship}
function valid(s){const c=s?.championship;if(c===undefined)return true;
const integer=(v,max=1e12)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
return !!(c&&c.v===1&&integer(c.tier,5)&&integer(c.season)&&integer(c.round,23)&&integer(c.points,600)&&integer(c.titles)&&Array.isArray(c.levels)&&c.levels.length===6&&c.levels.every(v=>integer(v,200))&&integer(c.rep)&&Number.isFinite(c.earned)&&c.earned>=0&&integer(c.tickets)&&integer(c.gems)&&c.roster&&typeof c.roster==='object'&&Object.keys(c.roster).length<=10&&Object.entries(c.roster).every(([id,v])=>roster.some(r=>r.id===id)&&v&&integer(v.stars,5)&&integer(v.copies,100000))&&c.roster[c.driver]&&roster.find(r=>r.id===c.driver)?.role==='driver'&&Array.isArray(c.engineers)&&c.engineers.length<=2&&new Set(c.engineers).size===c.engineers.length&&c.engineers.every(id=>c.roster[id]&&roster.find(r=>r.id===id)?.role==='engineer')&&['standard','featured'].every(k=>c.pity?.[k]&&integer(c.pity[k].leg,79)&&integer(c.pity[k].epic,9)&&typeof c.pity[k].guaranteed==='boolean')&&Array.isArray(c.results)&&c.results.length<=24&&c.results.every(r=>r&&integer(r.season)&&r.season>0&&integer(r.round,24)&&r.round>0&&integer(r.tier,5)&&integer(r.place,20)&&r.place>0&&integer(r.points,25)&&Number.isFinite(r.credits)&&r.credits>=0&&(r.seasonPoints===undefined||integer(r.seasonPoints,600))&&(r.promoted===undefined||typeof r.promoted==='boolean')&&(r.title===undefined||typeof r.title==='boolean'))&&integer(c.races)&&typeof c.running==='boolean'&&Number.isFinite(c.at)&&c.at>0&&Number.isFinite(c.live)&&c.live>=0&&c.live<30&&Number.isFinite(c.offline)&&c.offline>=0&&c.offline<900000&&c.daily&&integer(c.daily.day)&&['races','upgrades','pulls'].every(k=>integer(c.daily[k]))&&Array.isArray(c.daily.claimed)&&new Set(c.daily.claimed).size===c.daily.claimed.length&&c.daily.claimed.every(k=>['race','upgrade','pull','long'].includes(k))&&typeof c.daily.bonus==='boolean'&&typeof c.daily.chest==='boolean'&&c.pass&&integer(c.pass.month)&&integer(c.pass.races)&&Array.isArray(c.pass.claimed)&&new Set(c.pass.claimed).size===c.pass.claimed.length&&c.pass.claimed.every(v=>integer(v,10)&&v>0)&&c.event&&integer(c.event.month)&&integer(c.event.races)&&typeof c.event.claimed==='boolean'&&Array.isArray(c.lastDrop)&&c.lastDrop.length<=10&&c.lastDrop.every(v=>v&&roster.some(r=>r.id===v.id)&&typeof v.duplicate==='boolean'))}
function calendars(c,now){const d=day(now),m=month(now);if(d>c.daily.day)c.daily={day:d,races:0,upgrades:0,pulls:0,claimed:[],bonus:false,chest:false};if(m>c.pass.month)c.pass={month:m,races:0,claimed:[]};if(m>c.event.month)c.event={month:m,races:0,claimed:false}}
function bonus(c,id){const r=roster.find(r=>r.id===id),v=c.roster[id];return r&&v?bonuses[r.rarity]*(1+v.stars/5):0}
function pace(c){return 100*1.06**c.levels.reduce((a,b)=>a+b,0)*(1+bonus(c,c.driver))}
function income(c,place){return Math.floor(12*5.5**c.tier*(1+.06*c.levels.reduce((a,b)=>a+b,0))*(place===1?3:place<=3?2:place<=10?1:.6)*(1+.03*c.rep)*(1+c.engineers.reduce((n,id)=>n+bonus(c,id),0)))}
function cost(c,i){return Math.ceil(20*(1+.2*i)*1.15**c.levels[i]*7**c.tier)}
function rivals(c){return Array.from({length:19},(_,i)=>({id:i,name:['Atlas','Orion','Velar','Cobalto','Fênix'][i%5]+' '+(i+1),pace:90*1.18**c.tier*(1+i*.045)*(1+(c.round%4)*.015)}))}
function order(c){return[{id:'you',name:'Sua escuderia',pace:pace(c)},...rivals(c)].sort((a,b)=>b.pace-a.pace)}
function race(s,now=Date.now()){const c=init(s,now);calendars(c,now);const place=order(c).findIndex(r=>r.id==='you')+1,points=([25,18,15,12,10,8,6,4,2,1][place-1]||0),credits=income(c,place),result={season:c.season,round:c.round+1,tier:c.tier,place,points,credits};
s.money+=credits;c.earned+=credits;c.races++;c.round++;c.points+=points;c.daily.races++;c.pass.races++;c.event.races++;if(c.races%10===0)c.tickets++;
if(c.round===24){result.seasonPoints=c.points;result.promoted=c.points>=380&&c.tier<5;result.title=c.points>=480;if(result.title){c.titles++;c.tickets+=10;c.gems+=50}if(result.promoted)c.tier++;c.season++;c.round=0;c.points=0}
c.results=[result,...c.results].slice(0,24);return result}
function settle(s,now=Date.now()){const c=init(s,now),ms=Math.min(28800000,Math.max(0,now-c.at));calendars(c,now);let count=0;if(c.running){c.offline+=ms;count=Math.floor(c.offline/900000);c.offline%=900000;for(let i=0;i<count;i++)race(s,now)}c.at=Math.max(c.at,now);return count}
function tick(s,dt,now=Date.now()){const c=init(s,now);calendars(c,now);if(!c.running){c.at=Math.max(c.at,now);return 0}c.live+=Math.max(0,Math.min(120,dt));let n=0;while(c.live>=30){c.live-=30;race(s,now);n++}c.at=Math.max(c.at,now);return n}
function buy(s,i,count=1){const c=init(s);if(!Number.isInteger(i)||i<0||i>5||![1,10,200].includes(count))return 0;let n=0;while(n<count&&c.levels[i]<200){const price=cost(c,i);if(s.money<price)break;s.money-=price;c.levels[i]++;c.daily.upgrades++;n++}return n}
function pLeg(n){return n>=80?1:n>=60?Math.min(1,.01+(n-59)*.045):.01}
function featured(c,now=Date.now()){return month(now)%2?'nico':'iris'}
function pull(s,banner,count=1,rng=Math.random,now=Date.now()){const c=init(s,now);if(!['standard','featured'].includes(banner)||![1,10].includes(count)||c.tickets<count)return null;const draft=JSON.parse(JSON.stringify(c)),out=[];calendars(draft,now);const P=draft.pity[banner],f=featured(c,now);
for(let i=0;i<count;i++){const a=rng(),b=rng(),z=rng();if([a,b,z].some(v=>!Number.isFinite(v)||v<0||v>=1))return null;P.leg++;P.epic++;let rank=a<pLeg(P.leg)?3:P.epic>=10?2:b<.09?2:b<.6966666667?0:1;
let pool=roster.filter(r=>r.rarity===rank),r;if(rank===3&&banner==='featured'){if(P.guaranteed||b<.6){r=roster.find(r=>r.id===f);P.guaranteed=false}else{pool=pool.filter(v=>v.id!==f);r=pool[Math.floor(z*pool.length)];P.guaranteed=true}}else r=pool[Math.floor(z*pool.length)];
if(rank===3)P.leg=0;if(rank>=2)P.epic=0;let duplicate=!!draft.roster[r.id];if(duplicate)draft.roster[r.id].copies=Math.min(100000,draft.roster[r.id].copies+1);else draft.roster[r.id]={stars:0,copies:0};out.push({id:r.id,duplicate});draft.tickets--;draft.daily.pulls++}
draft.lastDrop=out;s.championship=draft;return out}
function star(s,id){const c=init(s),v=c.roster[id];if(!v||v.stars>=5||v.copies<starNeed[v.stars])return false;v.copies-=starNeed[v.stars];v.stars++;return true}
function equip(s,id){const c=init(s),r=roster.find(r=>r.id===id);if(!r||!c.roster[id])return false;if(r.role==='driver')c.driver=id;else if(c.engineers.includes(id))c.engineers=c.engineers.filter(v=>v!==id);else if(c.engineers.length<2)c.engineers.push(id);else return false;return true}
const dailyMissions=[{id:'race',name:'Complete 3 corridas',metric:'races',goal:3,points:40},{id:'upgrade',name:'Compre 3 níveis de peças',metric:'upgrades',goal:3,points:30},{id:'pull',name:'Recrute 1 integrante',metric:'pulls',goal:1,points:30},{id:'long',name:'Complete 10 corridas',metric:'races',goal:10,points:50}];
function claim(s,id,now=Date.now()){const c=init(s,now);calendars(c,now);if(id==='login'){if(c.daily.bonus)return false;c.daily.bonus=true;c.tickets+=5;return true}if(id==='daily'){const pts=dailyMissions.filter(m=>c.daily.claimed.includes(m.id)).reduce((n,m)=>n+m.points,0);if(pts<100||c.daily.chest)return false;c.daily.chest=true;c.tickets+=3;c.gems+=20;return true}if(id==='event'){if(c.event.races<24||c.event.claimed)return false;c.event.claimed=true;c.tickets+=5;c.gems+=100;return true}if(id.startsWith('pass:')){const n=Number(id.slice(5));if(!Number.isInteger(n)||n<1||n>10||c.pass.races<n*10||c.pass.claimed.includes(n))return false;c.pass.claimed.push(n);c.gems+=25;c.tickets+=2;return true}const m=dailyMissions.find(m=>m.id===id);if(!m||c.daily[m.metric]<m.goal||c.daily.claimed.includes(id))return false;c.daily.claimed.push(id);s.money+=100*5.5**c.tier;return true}
function prestigeGain(c){return Math.max(0,Math.floor(3*(Math.log10(c.earned+1)-3)))}
function prestige(s,now=Date.now()){const c=init(s,now),n=prestigeGain(c);if(!n)return 0;c.rep+=n;c.earned=0;c.levels=[0,0,0,0,0,0];c.live=0;c.offline=0;c.at=now;s.money=0;return n}
function timeSkip(s,now=Date.now()){const c=init(s,now);if(c.gems<100)return false;c.gems-=100;for(let i=0;i<24;i++)race(s,now);return true}
function direct(s,id){const c=init(s),r=roster.find(r=>r.id===id);if(!r||c.roster[id])return false;const price=[50,150,600,2400][r.rarity];if(c.gems<price)return false;c.gems-=price;c.roster[id]={stars:0,copies:0};return true}
const api={direct,tiers,parts,roster,rarity,starNeed,fresh,init,valid,bonus,pace,income,cost,rivals,order,race,settle,tick,buy,pLeg,featured,pull,star,equip,dailyMissions,claim,prestigeGain,prestige,timeSkip};root.Championship=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
