(function(root){
const names=['Solaris','Marenga','Kairos','Zedd','Rio Bravo','Luxor','Vossen','Ortega','Bellona'];
const colors=['#F0243E','#65C9FF','#A66BFF','#35E6A8','#F7F0C9','#F078B7','#74A9FF','#D4A16B','#A1D264'];
const points=[25,18,15,12,10,8,6,4,2,1],autoPrice=25000;
function fresh(s){return{v:1,tutorial:s.onboarded?3:0,titles:0,seasonEarned:0,seenMoney:s.money,races:0,wins:0,records:{},autoERSOwned:false,autoERS:false,sponsors:[],lastResult:null}}
function init(s){const n=s.night||(s.night=fresh(s));if(n.tutorial===undefined)n.tutorial=s.onboarded?3:0;if(s.idle)s.idle.seasonTitles=n.titles;return n}
function valid(s){const n=s?.night;if(n===undefined)return true;const int=(v,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=0&&v<=max,num=v=>Number.isFinite(v)&&v>=0&&v<1e100;
return !!(n&&n.v===1&&(n.tutorial===undefined||int(n.tutorial,3))&&int(n.titles)&&num(n.seasonEarned)&&num(n.seenMoney)&&int(n.races)&&int(n.wins)&&n.wins<=n.races&&n.records&&typeof n.records==='object'&&!Array.isArray(n.records)&&Object.keys(n.records).length<=24&&Object.entries(n.records).every(([id,v])=>/^[a-z]{2}-\d{4}$/.test(id)&&Number.isFinite(v)&&v>0&&v<1e6)&&typeof n.autoERSOwned==='boolean'&&typeof n.autoERS==='boolean'&&(!n.autoERS||n.autoERSOwned)&&Array.isArray(n.sponsors)&&new Set(n.sponsors).size===n.sponsors.length&&n.sponsors.every(v=>int(v,5))&&(n.lastResult===null||n.lastResult&&int(n.lastResult.place,10)&&n.lastResult.place>0&&num(n.lastResult.prize)&&num(n.lastResult.time)&&int(n.lastResult.points,25)))}
function bonus(s){return 1+.25*(s.night?.titles||0)}
function observe(s){const n=init(s),delta=s.money-n.seenMoney;if(delta>0)n.seasonEarned=Math.min(1e99,n.seasonEarned+delta);n.seenMoney=s.money;return Math.max(0,delta)}
function titles(s){const n=init(s);return Math.max(0,Math.min(Number.MAX_SAFE_INTEGER-n.titles,Math.floor(Math.sqrt(n.seasonEarned/1500000))))}
function newSeason(s){const n=init(s),gain=titles(s);if(!gain||s.raceInProgress||s.championship?.running)return 0;n.titles+=gain;n.sponsors=[];n.autoERSOwned=false;n.autoERS=false;n.seasonEarned=0;n.seenMoney=0;s.money=0;s.levels=[0,0,0,0];if(s.idle){s.idle.units.fill(0);s.idle.upgrades.fill(0);s.idle.clickLevel=0;s.idle.cycleEarned=0;s.idle.seasonTitles=n.titles}return gain}
function grid(c){return names.map((name,i)=>({name,color:colors[i],pace:c.time*.15*(.88+i*.03)/(1+c.rep/18000)}))}
function duration(s,A){return Math.max(4,A.duration(s)*.15)}
function record(s,id,seconds){const n=init(s);if(!Number.isFinite(seconds)||seconds<=0)return false;if(!n.records[id]||seconds<n.records[id]){n.records[id]=seconds;return true}return false}
function finish(s,place,time,lapReward){const n=init(s);if(!Number.isInteger(place)||place<1||place>10||!Number.isFinite(time)||time<=0)return null;const p=points[place-1],prize=Math.floor(lapReward*(11-place)*.6);s.rep+=p;s.money+=prize;n.races++;if(place===1)n.wins++;n.lastResult={place,points:p,prize,time};observe(s);return n.lastResult}
function buyAuto(s){const n=init(s);if(n.autoERSOwned||s.money<autoPrice)return false;s.money-=autoPrice;n.autoERSOwned=true;n.autoERS=true;n.seenMoney=s.money;return true}
const sponsors=[{name:'Apoio do paddock',rep:60,reward:500},{name:'Transmissão regional',races:5,reward:2500},{name:'Programa de talentos',wins:3,reward:7500},{name:'Acordo de performance',rep:500,reward:15000},{name:'Parceiro de temporada',races:20,reward:40000},{name:'Patrocínio internacional',rep:1000,reward:80000}];
function sponsorReady(s,i){const v=sponsors[i],n=init(s);return !!(v&&!n.sponsors.includes(i)&&s.rep>=(v.rep||0)&&n.races>=(v.races||0)&&n.wins>=(v.wins||0))}
function claimSponsor(s,i){if(!sponsorReady(s,i))return false;const n=init(s);n.sponsors.push(i);s.money+=sponsors[i].reward;observe(s);return true}
function carCost(s,A,i,count){if(!Number.isInteger(i)||i<0||i>3||!Number.isInteger(count)||count<0||s.levels[i]+count>100)return Infinity;let total=0;for(let k=0;k<count;k++)total+=Math.ceil(A.parts[i].base*1.55**(s.levels[i]+k));return total}
function maxCar(s,A,i){let lo=0,hi=100-s.levels[i];while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(carCost(s,A,i,mid)<=s.money)lo=mid;else hi=mid-1}return lo}
const api={names,colors,points,autoPrice,fresh,init,valid,bonus,observe,titles,newSeason,grid,duration,record,finish,buyAuto,sponsors,sponsorReady,claimSponsor,carCost,maxCar};root.NightLeague=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

