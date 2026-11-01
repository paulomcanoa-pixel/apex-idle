(function(root){
const circuits=[{name:'Vale Verde',region:'BRASIL',rep:0,mult:1,time:16},{name:'Costa Azul',region:'PORTUGAL',rep:30,mult:2.3,time:20},{name:'Deserto Solar',region:'BAHREIN',rep:100,mult:4.8,time:25}];
const parts=[{name:'Unidade de potência',desc:'Mais velocidade nas retas.',base:100},{name:'Aerodinâmica',desc:'Curvas rápidas, voltas mais curtas.',base:140},{name:'Engenharia de pneus',desc:'Aderência que se transforma em ritmo.',base:120},{name:'Patrocínio',desc:'Aumente os créditos de cada volta.',base:180}];
function initial(){return {version:1,money:220,laps:0,rep:0,levels:[0,0,0,0],circuit:0,progress:0,running:false,savedAt:Date.now()}}
function validate(s){return s&&s.version===1&&Number.isFinite(s.money)&&s.money>=0&&s.money<1e100&&Number.isSafeInteger(s.laps)&&s.laps>=0&&Number.isSafeInteger(s.rep)&&s.rep>=0&&Array.isArray(s.levels)&&s.levels.length===4&&s.levels.every(n=>Number.isInteger(n)&&n>=0&&n<=100)&&Number.isInteger(s.circuit)&&s.circuit>=0&&s.circuit<3&&s.rep>=circuits[s.circuit].rep&&Number.isFinite(s.progress)&&s.progress>=0&&s.progress<1&&typeof s.running==='boolean'&&Number.isFinite(s.savedAt)&&s.savedAt>0}
const teams=[{name:'Aurora Racing',color:'#d4fc5a',style:'Identidade brasileira · verde elétrico'},{name:'Scarlatto Corse',color:'#ff685c',style:'Tradição italiana · vermelho'},{name:'Atlantic Motorsport',color:'#66b8ff',style:'Engenharia britânica · azul'}];
const targets=[{wing:7,suspension:7},{wing:5,suspension:4},{wing:2,suspension:3}];
function setup(s){return s.setup||{wing:5,suspension:5}}
function setupPenalty(s){const p=setup(s),t=targets[s.circuit];return (Math.abs(p.wing-t.wing)+Math.abs(p.suspension-t.suspension))*.012}
function duration(s){return circuits[s.circuit].time*(1+setupPenalty(s))/(1+s.levels[0]*.08+s.levels[1]*.06+s.levels[2]*.05+equippedCar(s).bonus)}
function reward(s){return Math.floor(45*circuits[s.circuit].mult*(1+s.levels[3]*.3))}
function cost(s,i){return Math.ceil(parts[i].base*1.55**s.levels[i])}
function buy(s,i){if(!Number.isInteger(i)||i<0||i>3||s.levels[i]>=100||s.money<cost(s,i))return false;s.money-=cost(s,i);s.levels[i]++;return true}
function advance(s,seconds,mult=1){if(!s.running)return 0;const total=s.progress+Math.max(0,seconds)*mult/duration(s),laps=Math.floor(total);s.progress=total-laps;s.laps+=laps;s.rep+=laps;s.money+=laps*reward(s);return laps}

const cars=[
{id:'aurora',name:'Aurora F1-01',rarity:'Inicial',chance:0,bonus:0,color:'#d4fc5a'},
{id:'vento',name:'Vento F1-02',rarity:'Comum',chance:60,bonus:.03,color:'#a8b3bd'},
{id:'scarlatto',name:'Scarlatto F1-03',rarity:'Raro',chance:25,bonus:.06,color:'#66b8ff'},
{id:'solar',name:'Solar F1-04',rarity:'Épico',chance:10,bonus:.10,color:'#bd9aff'},
{id:'eclipse',name:'Eclipse F1-05',rarity:'Lendário',chance:4,bonus:.15,color:'#ffc857'},
{id:'zenith',name:'Zenith F1-06',rarity:'Mítico',chance:1,bonus:.22,color:'#ff7aa8'}
];
const summonCost=200,duplicateRefund=100;
function ownedCars(s){return s.ownedCars===undefined?['aurora']:s.ownedCars}
function equippedCar(s){return cars.find(c=>c.id===(s.equippedCar||'aurora'))||cars[0]}
function validCollection(s){const owned=ownedCars(s);return Array.isArray(owned)&&owned.length>0&&owned.length<=cars.length&&new Set(owned).size===owned.length&&owned.includes('aurora')&&owned.every(id=>cars.some(c=>c.id===id))&&(s.equippedCar===undefined||owned.includes(s.equippedCar))}
const pityLimits={epic:10,legendary:50,mythic:100};
function pity(s){return s.summonPity||{epic:0,legendary:0,mythic:0}}
function validGacha(s){return (s.summonPity===undefined||s.summonPity&&Object.keys(pityLimits).every(k=>Number.isInteger(s.summonPity[k])&&s.summonPity[k]>=0&&s.summonPity[k]<pityLimits[k]))&&(s.summonHistory===undefined||Array.isArray(s.summonHistory)&&s.summonHistory.length<=10&&s.summonHistory.every(h=>h&&cars.slice(1).some(c=>c.id===h.id)&&typeof h.duplicate==='boolean'&&typeof h.guaranteed==='boolean'))}
function summon(s,rng=Math.random){
if(s.money<summonCost)return null;
const roll=rng();if(!Number.isFinite(roll)||roll<0||roll>=1)return null;
let threshold=0,car=cars.slice(1).find(c=>{threshold+=c.chance;return roll*100<threshold});
const p=pity(s);let guaranteed=false;
const floor=p.mythic>=99?5:p.legendary>=49?4:p.epic>=9?3:0;
if(cars.indexOf(car)<floor){car=cars[floor];guaranteed=true}
const rank=cars.indexOf(car),owned=ownedCars(s).slice(),duplicate=owned.includes(car.id);
s.money-=summonCost;if(duplicate)s.money+=duplicateRefund;else owned.push(car.id);
s.ownedCars=owned;s.summonPity={epic:rank>=3?0:p.epic+1,legendary:rank>=4?0:p.legendary+1,mythic:rank>=5?0:p.mythic+1};
s.summonHistory=[{id:car.id,duplicate,guaranteed},...(s.summonHistory||[])].slice(0,10);
return {car,duplicate,guaranteed,refund:duplicate?duplicateRefund:0}
}
function summonMany(s,count=10,rng=Math.random){
if(![1,10].includes(count)||s.money<summonCost*count)return null;
const draft=JSON.parse(JSON.stringify(s)),results=[];
for(let i=0;i<count;i++){const result=summon(draft,rng);if(!result)return null;results.push(result)}
Object.assign(s,draft);return results
}
function equipCar(s,id){if(s.running||!cars.some(c=>c.id===id)||!ownedCars(s).includes(id))return false;s.equippedCar=id;s.color=equippedCar(s).color;return true}

const baseValidate=validate;
function validSave(s){return baseValidate(s)&&validCollection(s)&&validGacha(s)&&(s.onboarded===undefined||typeof s.onboarded==='boolean')&&(s.team===undefined||Number.isInteger(s.team)&&s.team>=0&&s.team<teams.length)&&(s.color===undefined||/^#[0-9a-f]{6}$/i.test(s.color))&&(s.setup===undefined||s.setup&&['wing','suspension'].every(k=>Number.isInteger(s.setup[k])&&s.setup[k]>=0&&s.setup[k]<=10))}
const api={pity,pityLimits,summonMany,cars,summonCost,duplicateRefund,ownedCars,equippedCar,summon,equipCar,circuits,parts,teams,setup,setupPenalty,initial,validate:validSave,duration,reward,cost,buy,advance};root.Apex=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
