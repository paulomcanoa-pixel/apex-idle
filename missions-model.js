(function(root){
const list=[
{id:'first-lap',icon:'⚑',name:'Primeira passagem',metric:'laps',goal:1,credits:200,xp:5},
{id:'five-laps',icon:'↻',name:'Pegando ritmo',metric:'laps',goal:5,credits:450,xp:10},
{id:'twenty-laps',icon:'◷',name:'Piloto de endurance',metric:'laps',goal:20,credits:1200,xp:20},
{id:'hundred-laps',icon:'♜',name:'Cem bandeiradas',metric:'laps',goal:100,credits:4000,xp:50},
{id:'first-upgrade',icon:'↗',name:'Primeiro desenvolvimento',metric:'upgrades',goal:1,credits:250,xp:5},
{id:'five-upgrades',icon:'⌁',name:'Equipe de engenharia',metric:'upgrades',goal:5,credits:750,xp:15},
{id:'first-part',icon:'▱',name:'Peça nova no box',metric:'parts',goal:1,credits:350,xp:10},
{id:'first-equipped',icon:'◈',name:'Pronto para a pista',metric:'equipped',goal:1,credits:350,xp:10},
{id:'first-race',icon:'▚',name:'Distância de corrida',metric:'races',goal:1,credits:1000,xp:15},
{id:'first-win',icon:'★',name:'No topo do pódio',metric:'wins',goal:1,credits:2000,xp:30},
{id:'three-cars',icon:'✦',name:'Garagem em expansão',metric:'cars',goal:3,credits:1500,xp:20},
{id:'first-contract',icon:'◇',name:'Patrocinador satisfeito',metric:'contracts',goal:1,credits:900,xp:15}
];
const labels={laps:'voltas completas',upgrades:'melhorias compradas',parts:'peças compradas',equipped:'peças equipadas',races:'corridas de 5 voltas',wins:'vitórias em corrida',cars:'carros na coleção',contracts:'contratos recolhidos'};
function data(s){return s.missions||{claimed:[],farmClaims:0}}
function metric(s,id){if(id==='laps')return s.laps;if(id==='upgrades')return s.levels.reduce((a,b)=>a+b,0);if(id==='parts')return(s.partsInventory||[]).length;if(id==='equipped')return Object.keys(s.partsEquipped||{}).length;if(id==='cars')return(s.ownedCars||['aurora']).length;return s.career?.stats?.[id]||0}
function validate(s){if(s.missions===undefined)return true;const d=s.missions;return !!d&&Array.isArray(d.claimed)&&d.claimed.length<=list.length&&new Set(d.claimed).size===d.claimed.length&&d.claimed.every(id=>list.some(m=>m.id===id))&&Number.isSafeInteger(d.farmClaims)&&d.farmClaims>=0&&d.farmClaims<=Math.floor(s.laps/25)}
function status(s,m){return{value:Math.min(m.goal,metric(s,m.metric)),done:metric(s,m.metric)>=m.goal,claimed:data(s).claimed.includes(m.id)}}
function farm(s){const claims=data(s).farmClaims;return{id:'farm',name:'Turno de pista',goal:(claims+1)*25,value:s.laps,credits:1200,xp:10,ready:s.laps>=(claims+1)*25,pending:Math.max(0,Math.floor(s.laps/25)-claims)}}
function ready(s){return list.filter(m=>{const v=status(s,m);return v.done&&!v.claimed}).length+farm(s).pending}
function claim(s,id){if(!validate(s))return false;const d=data(s);let reward;
if(id==='farm'){const f=farm(s);if(!f.ready)return false;reward=f}else{const m=list.find(m=>m.id===id);if(!m)return false;const v=status(s,m);if(!v.done||v.claimed)return false;reward=m}
if(!Number.isSafeInteger(s.rep+reward.xp)||!Number.isFinite(s.money+reward.credits)||s.money+reward.credits>=1e100)return false;
s.missions={claimed:id==='farm'?d.claimed.slice():[...d.claimed,id],farmClaims:d.farmClaims+(id==='farm'?1:0)};s.money+=reward.credits;s.rep+=reward.xp;return{credits:reward.credits,xp:reward.xp}}
const api={list,labels,data,metric,validate,status,farm,ready,claim};root.Missions=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
