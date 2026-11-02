(function(root){
const missions=typeof Missions!=='undefined'?Missions:require('./missions-model.js');
const career=typeof Career!=='undefined'?Career:require('./career-model.js');
const equipment=typeof PartsShop!=='undefined'?PartsShop:typeof require==='function'?require('./parts-shop-model.js'):{factor:()=>1,validate:()=>true};
const circuits=(typeof CircuitMaps!=='undefined'?CircuitMaps:require('./circuits-data.js')).circuits;
const parts=[{name:'Unidade de potência',desc:'Mais velocidade nas retas.',base:100},{name:'Aerodinâmica',desc:'Curvas rápidas, voltas mais curtas.',base:140},{name:'Engenharia de pneus',desc:'Aderência que se transforma em ritmo.',base:120},{name:'Patrocínio',desc:'Aumente os créditos de cada volta.',base:180}];
function initial(){return {version:1,money:220,laps:0,rep:0,levels:[0,0,0,0],circuit:0,progress:0,running:false,savedAt:Date.now()}}
function validate(s){return s&&s.version===1&&Number.isFinite(s.money)&&s.money>=0&&s.money<1e100&&Number.isSafeInteger(s.laps)&&s.laps>=0&&Number.isSafeInteger(s.rep)&&s.rep>=0&&Array.isArray(s.levels)&&s.levels.length===4&&s.levels.every(n=>Number.isInteger(n)&&n>=0&&n<=100)&&Number.isInteger(s.circuit)&&s.circuit>=0&&s.circuit<circuits.length&&s.rep>=circuits[s.circuit].rep&&Number.isFinite(s.progress)&&s.progress>=0&&s.progress<1&&typeof s.running==='boolean'&&Number.isFinite(s.savedAt)&&s.savedAt>0}
const teams=[{name:'Aurora Racing',color:'#d4fc5a',style:'Identidade brasileira · verde elétrico'},{name:'Scarlatto Corse',color:'#ff685c',style:'Tradição italiana · vermelho'},{name:'Atlantic Motorsport',color:'#66b8ff',style:'Engenharia britânica · azul'}];
function setup(s){return s.setup||{wing:5,suspension:5}}
function setupPenalty(s){const p=setup(s),t=circuits[s.circuit].setup;return (Math.abs(p.wing-t.wing)+Math.abs(p.suspension-t.suspension))*.012}
function duration(s){const development=s.levels[0]*.08+s.levels[1]*.06+s.levels[2]*.05+equippedCar(s).bonus+(equipment.factor(s)-1);return circuits[s.circuit].time*(1+setupPenalty(s)+.20/(1+development*5))/heritage.scores(s.heritage?.equipped,s.championship?.driver,setup(s).wing).pace}
function reward(s){return Math.floor(45*(circuits[s.circuit].time/16)*circuits[s.circuit].mult*(1+s.levels[3]*.3)*heritage.scores(s.heritage?.equipped,s.championship?.driver,setup(s).wing).income)}
function cost(s,i){return Math.ceil(parts[i].base*1.55**s.levels[i])}
function buy(s,i){if(!Number.isInteger(i)||i<0||i>3||s.levels[i]>=100||s.money<cost(s,i))return false;s.money-=cost(s,i);s.levels[i]++;return true}
function advance(s,seconds,mult=1){if(!s.running)return 0;const total=s.progress+Math.max(0,seconds)*mult/duration(s),laps=Math.floor(total);s.progress=total-laps;s.laps+=laps;s.rep+=laps;s.money+=laps*reward(s);return laps}

const cars=[
{id:'aurora',name:'Aurora F1-01',rarity:'Inicial',chance:0,bonus:0,color:'#d4fc5a'},
{id:'vento',name:'Vento F1-02',rarity:'Comum',chance:49.5-100/700,bonus:.03,color:'#a8b3bd'},
{id:'scarlatto',name:'Scarlatto F1-03',rarity:'Raro',chance:35,bonus:.06,color:'#66b8ff'},
{id:'solar',name:'Solar F1-04',rarity:'Épico',chance:15,bonus:.10,color:'#bd9aff'},
{id:'eclipse',name:'Eclipse F1-05',rarity:'Lendário',chance:.5,bonus:.15,color:'#ffc857'},
{id:'zenith',name:'Zenith F1-06',rarity:'Mítico',chance:100/700,bonus:.22,color:'#ff7aa8'}
];
const summonCost=200;
const duplicatePoints={vento:50,scarlatto:150,solar:400,eclipse:2000,zenith:7500};
const shopPrices={vento:100,scarlatto:300,solar:800,eclipse:4000,zenith:15000};
function ownedCars(s){return s.ownedCars===undefined?['aurora']:s.ownedCars}
const heritage=typeof Legends!=='undefined'?Legends:require('./legends-model.js');
function equippedCar(s){const h=heritage.car(s);if(h)return h;return cars.find(c=>c.id===(s.equippedCar||'aurora'))||cars[0]}
function validCollection(s){const owned=ownedCars(s);return Array.isArray(owned)&&owned.length>0&&owned.length<=cars.length&&new Set(owned).size===owned.length&&owned.includes('aurora')&&owned.every(id=>cars.some(c=>c.id===id))&&(s.equippedCar===undefined||owned.includes(s.equippedCar))}
const pityLimits={epic:10,legendary:200};
function pity(s){return s.summonPity||{epic:0,legendary:0,mythic:0}}
function points(s){return s.summonPoints||0}
function summonRates(s){
let rates=cars.slice(1).map(c=>({id:c.id,chance:c.chance}));
const chosen=rates.find(r=>r.id===s.wishCar);
if(chosen){const original=chosen.chance,factor=(100-2*original)/(100-original);rates=rates.map(r=>({id:r.id,chance:r.id===chosen.id?2*original:r.chance*factor}))}
return rates
}
function setWish(s,id){if(id!==''&&!cars.slice(1).some(c=>c.id===id))return false;s.wishCar=id;return true}
function validGacha(s){return (s.summonPity===undefined||s.summonPity&&['epic','legendary','mythic'].every(k=>Number.isSafeInteger(s.summonPity[k])&&s.summonPity[k]>=0&&(k==='mythic'||s.summonPity[k]<pityLimits[k])))&&(s.summonPoints===undefined||Number.isSafeInteger(s.summonPoints)&&s.summonPoints>=0)&&(s.wishCar===undefined||s.wishCar===''||cars.slice(1).some(c=>c.id===s.wishCar))&&(s.testCreditsGranted===undefined||typeof s.testCreditsGranted==='boolean')&&(s.summonHistory===undefined||Array.isArray(s.summonHistory)&&s.summonHistory.length<=10&&s.summonHistory.every(h=>h&&(cars.slice(1).some(c=>c.id===h.id)||!!heritage.get(h.id))&&typeof h.duplicate==='boolean'&&typeof h.guaranteed==='boolean'&&(h.points===undefined||Number.isSafeInteger(h.points)&&h.points>=0)))}
function summon(s,rng=Math.random){
if(s.money<summonCost)return null;
const roll=rng();if(!Number.isFinite(roll)||roll<0||roll>=1)return null;
let threshold=0;const rates=summonRates(s),hit=rates.find(r=>{threshold+=r.chance;return roll*100<threshold})||rates[rates.length-1];
let car=cars.find(c=>c.id===hit.id);
const p=pity(s);let guaranteed=false;
const floor=p.legendary>=199?4:p.epic>=9?3:0;
if(cars.indexOf(car)<floor){car=cars[floor];guaranteed=true}
const rank=cars.indexOf(car),owned=ownedCars(s).slice(),duplicate=owned.includes(car.id),earned=duplicate?duplicatePoints[car.id]:0;
s.money-=summonCost;s.summonPoints=points(s)+earned;if(!duplicate)owned.push(car.id);
s.ownedCars=owned;s.summonPity={epic:rank>=3?0:p.epic+1,legendary:rank>=4?0:p.legendary+1,mythic:rank>=5?0:Math.min(Number.MAX_SAFE_INTEGER,p.mythic+1)};
s.summonHistory=[{id:car.id,duplicate,guaranteed,points:earned},...(s.summonHistory||[])].slice(0,10);
return {car,duplicate,guaranteed,points:earned}
}
function summonMany(s,count=10,rng=Math.random){
if(![1,10].includes(count)||s.money<summonCost*count)return null;
const draft=JSON.parse(JSON.stringify(s)),results=[];
for(let i=0;i<count;i++){const result=summon(draft,rng);if(!result)return null;results.push(result)}
Object.assign(s,draft);return results
}
function shopBuy(s,id){const price=shopPrices[id];if(!price||ownedCars(s).includes(id)||points(s)<price)return false;s.summonPoints=points(s)-price;s.ownedCars=[...ownedCars(s),id];return true}
function grantTestCredits(s){if(s.testCreditsGranted)return false;s.money+=1000000;s.testCreditsGranted=true;return true}
function equipCar(s,id){if(s.running||s.championship?.running||!career.available(s,id)||!cars.some(c=>c.id===id)||!ownedCars(s).includes(id))return false;s.equippedCar=id;if(s.heritage)s.heritage.equipped='';if(s.championship)s.championship.car='';s.color=equippedCar(s).color;return true}

const farm=typeof IdleFarm!=='undefined'?IdleFarm:require('./farm-model.js');
const championship=typeof Championship!=='undefined'?Championship:require('./championship-model.js');
const baseValidate=validate;
function validSave(s){return (typeof DriverAcademy!=='undefined'?DriverAcademy:require('./academy-model.js')).valid(s)&&heritage.valid(s)&&championship.valid(s)&&farm.valid(s)&&missions.validate(s)&&career.validate(s)&&equipment.validate(s)&&baseValidate(s)&&validCollection(s)&&validGacha(s)&&(s.onboarded===undefined||typeof s.onboarded==='boolean')&&(s.team===undefined||Number.isInteger(s.team)&&s.team>=0&&s.team<teams.length)&&(s.color===undefined||/^#[0-9a-f]{6}$/i.test(s.color))&&(s.setup===undefined||s.setup&&['wing','suspension'].every(k=>Number.isInteger(s.setup[k])&&s.setup[k]>=0&&s.setup[k]<=10))}
const api={summonRates,setWish,points,duplicatePoints,shopPrices,shopBuy,grantTestCredits,pity,pityLimits,summonMany,cars,summonCost,ownedCars,equippedCar,summon,equipCar,circuits,parts,teams,setup,setupPenalty,initial,validate:validSave,duration,reward,cost,buy,advance};root.Apex=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
