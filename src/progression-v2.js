(function(root){
const B=root.ApexBalance||require('./balance'),S=root.GameState||require('../game/state'),Maps=root.CircuitMaps||require('../circuits-data');
const Q={stages:12,rScale:[1,22,480,1e4,2.3e5,5e6],repScale:[.2,.3,.45,.65,.9,1.2],titlePI:.08,titleCR:.25,lvlCR:.002,lvlPI:.003,offlineMaxH:8,offlineRace:.03,offlineIdle:.1};
function initial(now=Date.now()){return migrate({version:1,money:150,rep:0,laps:0,levels:[0,0,0,0],circuit:0,progress:0,running:false,savedAt:now},now)}
function migrate(raw,now=Date.now()){
const s=JSON.parse(JSON.stringify(raw));if(s.version===2)return s;if(s.version!==1||!Array.isArray(s.levels)||s.levels.length!==4||!s.levels.every(x=>Number.isInteger(x)&&x>=0&&x<=100)||!Number.isFinite(s.money)||s.money<0)throw Error('Não foi possível migrar. Exporte seu save.');
S.init(s,now);const oldMax=Maps.circuits.reduce((m,c,i)=>s.rep>=c.rep?i:m,0);s.maxCircuit=Math.max(s.circuit,oldMax);s.rep=Math.max(s.rep,B.repToOpen(s.maxCircuit));s.levels.push(0,0);
s.legacy=1+.02*s.idle.fragments;s.season={n:1,titles:s.night?.titles||0,seasonStartedAt:now};s.cat=0;s.stage=Math.min(11,Math.floor(s.maxCircuit/2));s.escuderia=1;s.xp=0;s.globalPeak=s.stage+1;
s.race={records:{...(s.night?.records||{})},history:[]};s.meta={...s.meta,migratedFrom:1,createdAt:s.meta?.createdAt||s.savedAt||now,savedAt:s.savedAt||now,clockWarnings:s.meta?.clockWarnings||0,lifetimeFragments:s.idle.fragments||0};
if(s.farm){const production=B.P.gens.reduce((n,g,i)=>n+g.rate*s.idle.units[i]*2**s.idle.upgrades[i],0);s.money+=Math.min(s.farm.bank||0,production*28800);s.retiredFarm={...s.farm};delete s.farm}
// Lifetime counters remain for the existing monotonic cloud/leaderboard contract; they no longer power a separate prestige.
s.idle.legacy=s.legacy;s.idle.seasonTitles=s.season.titles;s.version=2;s.running=false;s.progress=0;delete s.raceInProgress;if(s.championship)s.championship.running=false;
s.daily={day:'',streak:0,claimed:[],missions:[],week:'',weeklyClaimed:[],pauseWeek:''};s.consent={analytics:null,ads:null,version:1};s.onboarding={step:0,done:!!s.onboarded};s.materials=Object.values(s.career?.materials||{}).reduce((a,b)=>a+b,0);s.catUnlocked=0;
return s
}
function valid(s){return s?.version===2&&Number.isFinite(s.money)&&s.money>=0&&s.money<1e100&&Number.isSafeInteger(s.rep)&&s.rep>=0&&Number.isSafeInteger(s.laps)&&s.laps>=0&&Array.isArray(s.levels)&&s.levels.length===6&&s.levels.every(x=>Number.isInteger(x)&&x>=0&&x<=100)&&Number.isInteger(s.maxCircuit)&&s.maxCircuit>=0&&s.maxCircuit<24&&Number.isInteger(s.circuit)&&s.circuit>=0&&s.circuit<24&&Number.isInteger(s.cat)&&s.cat>=0&&s.cat<6&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<12&&s.season&&Number.isSafeInteger(s.season.titles)&&s.season.titles>=0&&Number.isFinite(s.legacy)&&s.legacy>=1&&Number.isInteger(s.escuderia)&&s.escuderia>=1&&s.escuderia<=500&&Number.isFinite(s.xp)&&s.xp>=0&&Number.isInteger(s.globalPeak)&&s.globalPeak>=1&&s.globalPeak<=72&&Array.isArray(s.race?.history)&&s.race.history.length<=100&&Array.isArray(s.daily?.claimed)&&Number.isFinite(s.materials)&&s.materials>=0&&S.valid(s)}
function index(s){return s.catProgress?2*s.stage:s.circuit}
function scale(s){return Q.rScale[s.cat||0]}
function leader(s){return B.aiLeaderPI(index(s))*(1+.08*s.season.titles)*(1+.003*s.escuderia)}
function pi(s,car=0,parts=0){const development=1+[0,1,2,4,5].reduce((n,i)=>n+B.upgradeEffect(i,s.levels[i])*B.branchMult(i,B.trackProfile(index(s)))*(s.focus?(['potencia','curvas','aderencia'][i]===s.focus?1.2:.9):1),0);return development*(1+.08*s.season.titles)*(1+.003*s.escuderia)*(1+car)*(1+Math.min(.15,parts))}
function duration(s,car=0,parts=0){return B.screenLap(index(s))/B.paceFactor(pi(s,car,parts),leader(s))}
function reward(s){return Math.floor(B.lapReward(index(s))*scale(s)*(1+B.upgradeEffect(3,s.levels[3]))*(1+.25*s.season.titles)*(1+.002*s.escuderia))}
function cost(s,i,target=s.levels[i]+1){return B.upgradeCost(i,target)*scale(s)}
function unlockedBranch(s,i){return i<4||(s.catProgress?s.stage:Math.max(s.maxCircuit,s.circuit))>=2}
function buy(s,i,count=1){if(!B.branches[i]||!unlockedBranch(s,i)||![1,10,'max'].includes(count))return{bought:0,spent:0};let n=0,spent=0,max=count==='max'?100:count;while(n<max&&s.levels[i]+n<100){const next=cost(s,i,s.levels[i]+n+1);if(spent+next>s.money)break;spent+=next;n++}if(count!=='max'&&n!==count)return{bought:0,spent:0};if(!n)return{bought:0,spent:0};s.money-=spent;s.levels[i]+=n;addXp(s,n*5);s.daily.upgrades=(s.daily.upgrades||0)+n;return{bought:n,spent}}
function addXp(s,amount){amount*=s.shop?.boosts?.xp>Date.now()?2:1;s.xp+=amount;let gained=0;while(s.escuderia<500&&s.xp>=40+8*s.escuderia){s.xp-=40+8*s.escuderia;s.escuderia++;gained++;if(s.championship){if(s.escuderia%2)s.championship.tickets++;if(s.escuderia%5===0)s.championship.gems+=20}}return gained}
function openRep(s,next){return s.catProgress?Math.round(B.repToOpen(2*next)*Q.repScale[s.cat]):B.repToOpen(next)}
function unlock(s){if(s.catProgress){while(s.stage<11&&s.rep>=openRep(s,s.stage+1)){s.stage++;addXp(s,100)}s.circuit=(2*s.stage+3*s.cat)%24;s.maxCircuit=Math.max(s.maxCircuit,s.circuit)}else{while(s.maxCircuit<23&&s.rep>=B.repToOpen(s.maxCircuit+1)){s.maxCircuit++;addXp(s,100)}}if(!s.catProgress)s.stage=Math.min(11,Math.floor(s.maxCircuit/2));s.globalPeak=Math.max(s.globalPeak,(s.cat||0)*12+s.stage+1)}
function finish(s,place,time,seed){if(s.race.history.some(x=>x.seed===seed))return null;const points=B.P.pts[place-1];if(!points||!Number.isFinite(time)||time<=0)return null;const prize=Math.floor(reward(s)*(11-place)*.6);s.rep+=points;s.money+=prize;s.materials+=3;addXp(s,25+4*(s.cat*12+s.stage)+2*(11-place));s.daily.races=(s.daily.races||0)+1;if(place<=5)s.daily.top=(s.daily.top||0)+1;const result={place,points,prize,time,seed};s.race.history=[result,...s.race.history].slice(0,100);unlock(s);return result}
function titlesFor(global){return Math.max(0,Math.floor((global-8)/4))}
function promote(s){if(s.stage<11||s.cat>=5||s.rep<openRep(s,12))return false;s.cat++;s.catUnlocked=Math.max(s.catUnlocked,s.cat);s.stage=0;s.rep=0;s.catProgress=true;s.levels.fill(0);s.idle.units.fill(0);s.idle.upgrades.fill(0);s.circuit=3*s.cat%24;addXp(s,1000);unlock(s);return true}
function titleGain(s){return Math.max(0,titlesFor(s.globalPeak)-s.season.titles)}
function newSeason(s,focus='potencia'){const gain=titleGain(s);if(s.cat*12+s.stage+1<12)return false;s.season.titles+=gain;s.season.n++;s.season.seasonStartedAt=Date.now();s.focus=focus;s.money=150;s.rep=0;s.cat=0;s.stage=0;s.catProgress=true;s.circuit=0;s.levels.fill(0);s.idle.units.fill(0);s.idle.upgrades.fill(0);s.idle.seasonTitles=s.season.titles;if(s.night){s.night.titles=s.season.titles;s.night.seasonEarned=0;s.night.seenMoney=150;s.night.sponsors=[]}s.partsEquipped={};if(s.shop)s.shop.equipped={};return true}
function legacyPoints(t){return Math.max(0,Math.floor(t/2)-5)}
const api={B,Q,initial,migrate,valid,index,scale,leader,pi,duration,reward,cost,buy,unlockedBranch,addXp,openRep,unlock,finish,titlesFor,promote,newSeason,titleGain,legacyPoints};root.ProgressionV2=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

