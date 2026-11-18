(function(root){
const V=root.ProgressionV2||require('./progression-v2'),B=V.B,D=root.LegendsData||require('../legends-data');
let catalog=null,retiredCars=new Map();
const categories=['Kart','F4','F3','F2','F1','Lendas'],rarities=['comum','raro','epico','lendario','mitico'];
function loadCatalog(data){if(!data||!Array.isArray(data.items)||data.items.length!==167)throw Error('Catálogo deve conter 167 itens');const ids=new Set;for(const item of data.items){if(!item.id||ids.has(item.id)||!item.name||!item.category||!item.effect||item.price===undefined)throw Error('Item inválido: '+item.id);ids.add(item.id);if(typeof item.price==='number'&&(!Number.isFinite(item.price)||item.price<0))throw Error('Preço inválido: '+item.id);if(!item.unlock&&item.category!=='treino')throw Error('Desbloqueio ausente: '+item.id)}catalog=JSON.parse(JSON.stringify(data));for(const item of catalog.items)if(!item.unlock)item.unlock={category:'Kart',stage:2};
  // IDs antigos continuam legíveis para saves e carros já equipados.
  retiredCars=new Map(catalog.items.filter(item=>item.category==='carros').map(item=>[item.id,item]));
  catalog.items=catalog.items.filter(item=>item.category!=='carros');
  catalog.items.push(...D.cars.map(car=>({
    ...car,category:'carros',historical:true,rarity:rarities[car.rarity],
    currency:'pts',price:{pts:D.prices[car.rarity]},duplicate_pts:D.prices[car.rarity]/2,
    effect:{piPct:[.03,.06,.10,.15,.22][car.rarity]},unlock:{category:'Kart',stage:3},limit:'unico'
  })));
  catalog.banners[0].name="Invocação principal";
  catalog.banners[2].name="Banner exclusivo";
  return catalog;
}
function init(s){
  const c=(root.Championship||require('../championship-model')).init(s);
  // Older saves may predate any of these fields. Only add missing fields;
  // never replace an existing inventory or discard extension data.
  if(s.shop===undefined)s.shop={};
  const q=s.shop;
  if(q.inventory===undefined)q.inventory={};
  for(const key of ['components','cars','cosmetics'])if(q.inventory[key]===undefined)q.inventory[key]=[];
  if(q.inventory.staff===undefined)q.inventory.staff={};
  for(const key of ['equipped','limits','pity','boosts','staffMigrated','staffXp'])if(q[key]===undefined)q[key]={};
  for(const key of ['selectedCar','selectedPilot','selectedEngineer'])if(q[key]===undefined)q[key]='';
  if(q.history===undefined)q.history=[];
  if(q.pts===undefined){const descriptor=Object.getOwnPropertyDescriptor(s,'summonPoints');q.pts=descriptor&&!descriptor.get?descriptor.value||0:0}
  for(const key of ['featuredTickets','eventTokens'])if(q[key]===undefined)q[key]=0;
  for(const counter of Object.values(q.pity))for(const key of ['epic','legendary','mythic'])if(counter[key]===undefined)counter[key]=0;
  for(const [legacyId,shopId]of Object.entries(staffAliases)){
    const old=q.inventory.staff[shopId];if(!old)continue;
    const member=c.roster[legacyId]||(c.roster[legacyId]={stars:0,copies:0});
    if(!q.staffMigrated[shopId]){
      member.stars=Math.max(member.stars,Math.min(5,old.stars||0));
      member.copies=Math.min(100000,member.copies+Math.max(0,Math.floor(old.copies||0)));
      q.staffMigrated[shopId]=true;
    }
    old.stars=member.stars;old.copies=member.copies;
  }
  if(!Object.getOwnPropertyDescriptor(s,'summonPoints')?.get)Object.defineProperty(s,'summonPoints',{enumerable:true,configurable:true,get:()=>s.shop.pts,set:value=>{s.shop.pts=value}});
  return q;
}
function valid(s){
  const q=s?.shop;if(q===undefined)return true;
  const safeKey=key=>!['__proto__','prototype','constructor'].includes(key)&&key.length<=256;
  const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value))&&Object.keys(value).every(safeKey);
  const number=(value,max=1e99)=>Number.isFinite(value)&&value>=0&&value<=max;
  const count=value=>Number.isSafeInteger(value)&&value>=0;
  const text=value=>typeof value==='string'&&value.length<=256;
  const optional=(value,check)=>value===undefined||check(value);
  const map=(value,check)=>object(value)&&Object.entries(value).every(([key,item])=>safeKey(key)&&check(item));
  const strings=value=>Array.isArray(value)&&value.length<=10000&&value.every(text);
  const stringMap=value=>map(value,text);
  const staff=value=>object(value)&&optional(value.stars,n=>Number.isInteger(n)&&number(n,5))&&optional(value.copies,count)&&optional(value.xp,n=>number(n,1e12));
  const counters=value=>object(value)&&['epic','legendary','mythic'].every(key=>optional(value[key],count));
  const setup=value=>object(value)&&['wing','suspension'].every(key=>Number.isInteger(value[key])&&number(value[key],10));
  const plan=value=>(root.ApexRacePlan||(typeof require==='function'?require('./race-plan'):null)).valid(value);
  const preset=value=>object(value)&&optional(value.setup,setup)&&optional(value.strategy,plan)&&optional(value.equipped,stringMap)&&['car','pilot','engineer'].every(key=>optional(value[key],text));
  return object(q)&&optional(q.inventory,value=>object(value)&&['components','cars','cosmetics'].every(key=>optional(value[key],strings))&&optional(value.staff,value=>map(value,staff)))
    &&['equipped','equippedCosmetics'].every(key=>optional(q[key],stringMap))
    &&['selectedCar','selectedPilot','selectedEngineer','wish','cosmetic','eventWeek'].every(key=>optional(q[key],text))
    &&['pts','featuredTickets','eventTokens','paidGems'].every(key=>optional(q[key],count))
    &&['lastOfflineRate','returnMinHours','offlineCapHours'].every(key=>optional(q[key],number))
    &&optional(q.limits,value=>map(value,count))&&optional(q.pity,value=>map(value,counters))
    &&optional(q.boosts,value=>map(value,count))&&optional(q.staffXp,value=>map(value,n=>number(n,1e12)))
    &&optional(q.staffMigrated,value=>map(value,item=>typeof item==='boolean'))
    &&optional(q.history,value=>Array.isArray(value)&&value.length<=1000&&value.every(row=>object(row)&&text(row.id)&&optional(row.duplicate,v=>typeof v==='boolean')&&optional(row.points,count)))
    &&optional(q.training,value=>object(value)&&text(value.pilot)&&number(value.xp,1e12)&&number(value.end,Number.MAX_SAFE_INTEGER)&&value.end>0)
    &&optional(q.racePlan,plan)&&optional(q.presets,value=>map(value,preset))
    &&optional(q.dailyReroll,value=>object(value)&&text(value.day)&&count(value.count));
}
function get(id){return catalog?.items.find(x=>x.id===id)||retiredCars.get(id)}
function day(now=Date.now()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now))}
function week(now=Date.now()){const d=new Date(day(now)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)}
function hash(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){return()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296}}
function unlocked(s,item){const u=item.unlock||{};return(s.cat||0)>=Math.max(0,categories.indexOf(u.category))&&((s.cat||0)>Math.max(0,categories.indexOf(u.category))||(s.catProgress?s.stage:s.maxCircuit)>= (u.stage||0))&&(s.escuderia||1)>=(u.escuderiaLevel||1)&&(!u.tutorialDone||s.onboarding?.done)}
function priceInCR(item,s){if(typeof item==='string')item=get(item);if(!item)return Infinity;if(typeof item.price==='number')return item.price;if(item.category==='carros'&&Number.isFinite(item.price.pts))return item.price.pts;const n=s.catProgress?2*s.stage:s.maxCircuit,match=(item.price.formula||'').match(/^(\d+)\s*\*/);return Math.ceil((item.price.races||Number(match?.[1])||1)*6.3*B.lapReward(n)*V.scale(s))}
function summonPrice(s){return 40*B.lapReward(s.catProgress?2*s.stage:s.maxCircuit)*V.scale(s)}
function wallet(s,currency){const q=init(s);return currency==='cr'?s.money:currency==='gemas'?s.championship.gems:currency==='fichas'?s.championship.tickets:currency==='featured'?q.featuredTickets:currency==='pts'?q.pts:currency==='event'?q.eventTokens:0}
function pay(s,currency,amount){if(currency==='cr')s.money-=amount;else if(currency==='gemas')s.championship.gems-=amount;else if(currency==='fichas')s.championship.tickets-=amount;else if(currency==='featured')s.shop.featuredTickets-=amount;else if(currency==='pts'){s.shop.pts-=amount;s.summonPoints=s.shop.pts}else if(currency==='event')s.shop.eventTokens-=amount}
function owned(s,item){const q=init(s),key=item.id+'@'+s.cat;return item.category==='componentes'?q.inventory.components.includes(key):item.category==='cosmeticos'?q.inventory.cosmetics.includes(item.id):item.category==='carros'?(q.inventory.cars.includes(item.id)||s.garage?.owned?.includes(item.id)||s.heritage?.owned?.includes(item.id)):false}
function limitKey(item,now){return item.id+':'+(/seman/i.test(item.limit)?week(now):day(now))}
function limit(item){const m=item.limit.match(/(?:diario|semanal)\s*x(\d+)/i);return m?+m[1]:Infinity}
function canBuy(s,id,options={}){const item=get(id);if(!item)return{ok:false,reason:'Item desconhecido'};if(retiredCars.has(id)||item.exclusive)return{ok:false,reason:item.exclusive?'Exclusivo da invocação por fichas':'Carro de coleção antiga'};if(item.category==='real')return{ok:false,reason:'Em breve · pagamentos desativados'};if(!unlocked(s,item))return{ok:false,reason:'Avance na temporada para liberar'};if(owned(s,item)&&!options.duplicate)return{ok:false,reason:'Já adquirido'};const q=init(s),key=limitKey(item,options.now);if(item.category==='pilotos')return{ok:false,reason:'Conquiste pilotos na Academia: observar, provar e assinar'};if(item.category==='treino'&&!driver(s)?.owned)return{ok:false,reason:'Selecione um piloto contratado'};if(item.category==='treino'&&q.training)return{ok:false,reason:'Conclua o treino em andamento'};if(item.limit==='unico'&&q.limits['once:'+id])return{ok:false,reason:'Já adquirido'};if((q.limits[key]||0)>=limit(item))return{ok:false,reason:'Limite deste período atingido'};const currency=options.currency||(item.currency==='giro|pts'?'pts':item.currency),price=options.price??priceInCR(item,s);if(!Number.isFinite(price)||price<=0)return{ok:false,reason:'Preço inválido'};if(wallet(s,currency)<price)return{ok:false,reason:'Saldo insuficiente'};return{ok:true,item,currency,price,key}}
function apply(s,item,now=Date.now()){const q=init(s),e=item.effect,c=item.category;
if(c==='componentes'){q.inventory.components.push(item.id+'@'+s.cat);q.equipped[item.slot]=item.id}
if(c==='cosmeticos')q.inventory.cosmetics.push(item.id);
if(c==='carros')q.inventory.cars.push(item.id);
if(c==='pilotos'||c==='engenheiros'){const canonical=canonicalStaff(item.id),st=s.championship.roster[canonical]||(s.championship.roster[canonical]={copies:0,stars:0});st.copies=Math.min(100000,st.copies+1);while(st.stars<5&&st.copies>=[1,2,4,8,16][st.stars]){st.copies-=[1,2,4,8,16][st.stars];st.stars++}q.inventory.staff[item.id]={...q.inventory.staff[item.id],copies:st.copies,stars:st.stars,xp:q.staffXp?.[canonical]||q.inventory.staff[item.id]?.xp||0};q.staffMigrated[item.id]=true;if(c==='pilotos'&&!q.selectedPilot)q.selectedPilot=item.id;if(c==='engenheiros'&&!q.selectedEngineer)q.selectedEngineer=item.id}
if(c==='treino'){const pilot=driver(s);if(pilot?.owned)q.training={pilot:pilot.id,xp:e.pilotXp||0,end:now+trainingMinutes(item)*60000}}
if(c==='boosts'){if(e.crMult)q.boosts.cr=now+(e.min||30)*60000;if(e.xpMult)q.boosts.xp=now+(e.min||30)*60000;if(e.autoERS||e.autoErsMin)q.boosts.ers=now+(e.autoErsMin||e.min||60)*60000;if(e.hours||e.offlineHours){const economy=root.GameEconomy||require('../game/economy'),rate=.1*economy.production(s.idle)+.03*V.reward(s)*6.3/(V.duration(s)*5+6);s.money+=(e.hours||e.offlineHours)*3600*rate;}if(e.minOfflineHours)q.returnMinHours=e.minOfflineHours;if(e.offlineCapHours)q.offlineCapHours=e.offlineCapHours}
}
function buy(s,id,options={}){const check=canBuy(s,id,options);if(!check.ok)return check;pay(s,check.currency,check.price);apply(s,check.item,options.now);s.shop.limits[check.key]=(s.shop.limits[check.key]||0)+1;if(check.item.limit==='unico')s.shop.limits['once:'+id]=1;return{ok:true,spent:check.price}}
function componentBonus(s,options={}){const q=init(s),profile=['potencia','curvas','aderencia'].includes(options.trackProfile)?options.trackProfile:B.trackProfile(V.index(s));return Math.min(.15,Object.values(q.equipped).reduce((n,id)=>{const i=get(id);return n+(i&&q.inventory.components.includes(id+'@'+s.cat)?i.effect.piPct*(i.effect.matchType===profile?1.6:.7):0)},0))}
function carBonus(s){const i=get(init(s).selectedCar);return i?.category==='carros'&&s.shop.inventory.cars.includes(i.id)?i.effect.piPct:0}
// Academy and shop IDs represent one person, not separate characters.
const staffAliases={lia:'piloto-lia-monteiro',enzo:'piloto-enzo-vale',maya:'piloto-maya-veloz',nico:'piloto-nico-solari',ines:'piloto-ines-costa',rui:'engenheiro-rui-prado',ana:'engenheiro-ana-circuito',leo:'engenheiro-leo-ventura',iris:'engenheiro-iris-brandao',tomas:'engenheiro-tomas-luz'};
const staffProfiles={lia:'curvas',enzo:'potencia',maya:'aderencia',nico:'potencia',ines:'aderencia',rui:'aderencia',ana:'curvas',leo:'potencia',iris:'curvas',tomas:'aderencia'};
const profileLabels={potencia:'Ataque nas retas',curvas:'Precisão em curvas',aderencia:'Conservação de pneus'};
function canonicalStaff(id){if(typeof id==='string'&&/^(pil|eng)-/.test(id)&&staffAliases[id.slice(4)])return id.slice(4);return Object.keys(staffAliases).find(key=>staffAliases[key]===id)||id}
function trainingMinutes(item){return item.id==='treino-intensivo'?30:5}
function awardedTrainingXp(s,baseXp){
  const talents=root.ApexTalents||(typeof require==='function'?require('./talents'):null);
  return Math.floor(baseXp*(1+(talents?.effects(s)?.xp||0)));
}
function trainingPreview(s,id,options={}){
  const item=get(id),pilot=driver(s);
  if(!item||item.category!=='treino'||!pilot?.owned)return null;
  const xp=awardedTrainingXp(s,item.effect.pilotXp||0);
  const next=trainingProgress(Math.min(1e12,pilot.xp+xp));
  const toBonus=pilot.bonus+(next.bonus-pilot.training.bonus);
  const Vehicle=root.ApexVehicle||require('./vehicle-performance');
  const Apex=root.Apex||require('../engine');
  const context=Vehicle.performance(s,options.carId||Apex.equippedCar(s).id,options);
  const effectiveBonusBefore=context.staffBonus;
  const effectiveBonusAfter=Vehicle.effectiveStaffBonus(toBonus,context.engineer?.bonus||0,context.affinityBonus,context.wetBonus,context.specialist);
  const capped=effectiveBonusAfter>=Vehicle.staffCap;
  const contextLabel=context.trackLabel+' · '+(options.wet?'Chuva':'Pista seca');
  return{
    pilot:pilot.name,minutes:trainingMinutes(item),xp,fromLevel:pilot.level,toLevel:next.level,
    fromBonus:pilot.bonus,toBonus,nextXp:next.nextXp,
    teamBonusBefore:staffBonus(s),
    teamBonusAfter:Math.min(Vehicle.staffCap,(context.engineer?.bonus||0)+toBonus),
    effectiveBonusBefore,effectiveBonusAfter,effectiveGain:effectiveBonusAfter-effectiveBonusBefore,capped,contextLabel
  };
}
function trainingProgress(xp=0){xp=Number.isFinite(xp)?Math.max(0,xp):0;const level=Math.min(20,1+Math.floor(Math.sqrt(xp/100))),start=100*(level-1)**2,nextXp=level<20?100*level**2:null;return{level,xp,nextXp,progress:level===20?1:(xp-start)/(nextXp-start),target:nextXp,bonus:(level-1)*.002}}
function teamRoster(s){const q=init(s),C=root.Championship||require('../championship-model'),c=s.championship;return C.roster.map(person=>{const alias=staffAliases[person.id],item=get(alias),legacy=c.roster[person.id],v=q.inventory.staff[alias],owned=!!(legacy||v),stars=Math.min(5,Math.max(legacy?.stars||0,v?.stars||0)),xp=Math.max(legacy?.xp||0,v?.xp||0,q.staffXp?.[person.id]||0),training=trainingProgress(xp),base=item?.effect.piPct||[.02,.04,.07,.12][person.rarity]||.02;
const skills=person.skills||{},profile=staffProfiles[person.id]||((skills.management||0)>=(skills.qualifying||0)&&(skills.management||0)>=(skills.race||0)?'aderencia':(skills.qualifying||0)>=(skills.race||0)?'curvas':'potencia');
const requested=canonicalStaff(person.role==='driver'?q.selectedPilot:q.selectedEngineer),active=c.roster[requested]?requested:canonicalStaff(person.role==='driver'?c.driver:c.engineers[0]);
return{...person,id:person.id,academyId:person.role==='driver'?person.id:null,shopId:alias||null,owned,selected:owned&&active===person.id,stars,xp,...training,training,bonus:base*(1+.1*stars)+training.bonus,profile,specialty:person.specialty||profileLabels[profile],cars:person.cars||[]}})}
function driver(s){return teamRoster(s).find(x=>x.role==='driver'&&x.selected)||null}
function engineer(s){return teamRoster(s).find(x=>x.role==='engineer'&&x.selected)||null}
function equipStaff(s,id){const q=init(s),canonical=canonicalStaff(id),person=teamRoster(s).find(x=>x.id===canonical&&x.owned);if(!person)return false;const c=s.championship;if(c.roster[canonical]){if(person.role==='driver'){c.driver=canonical;q.selectedPilot=''}else{c.engineers=[canonical];q.selectedEngineer=''}}else q[person.role==='driver'?'selectedPilot':'selectedEngineer']=person.shopId;return true}
function staffBonus(s){return Math.min(.40,teamRoster(s).filter(x=>x.selected).reduce((sum,x)=>sum+x.bonus,0))}
function projectCost(id){const car=get(id);return car?.historical&&!car.exclusive?[90,240,600,1800,4500][rarities.indexOf(car.rarity)]:Infinity}
function buildProject(s,id){const car=get(id),cost=projectCost(id);if(!car||!Number.isFinite(cost)||((s.cat||0)===0&&(s.catProgress?s.stage:s.maxCircuit)<5)||s.materials<cost||owned(s,car))return false;s.materials-=cost;init(s).inventory.cars.push(id);return true}
// Increasing hazard calibrated to a 700-pull standard mean; no attempt forces a mythic.
function mythicChance(banner,misses=0){misses=Number.isFinite(misses)?Math.max(0,misses):0;return banner==='banner-lendas'?Math.min(.05,.01+misses*.00002):Math.min(.02,.001+misses*7.495216602400883e-7)}
function bannerCars(banner){
  return catalog.items.filter(car=>car.category==='carros'&&(banner==='banner-lendas'
    ? car.exclusive||['raro','epico'].includes(car.rarity)
    : !car.exclusive));
}
function bannerRates(banner,wish,misses=0){
  const mythic=100*mythicChance(banner,misses);
  const totals=banner==='banner-lendas'?[0,61-mythic,32,7,mythic]:banner==='banner-destaque'?[49-mythic,35,15,1,mythic]:[49.5-mythic,35,15,.5,mythic];
  const cars=bannerCars(banner);
  const counts=rarities.map(rarity=>cars.filter(car=>car.rarity===rarity).length);
  const rows=cars.map(car=>{const rank=rarities.indexOf(car.rarity);return{car,rank,chance:totals[rank]/counts[rank]}});
  const selected=banner!=='banner-lendas'&&rows.find(row=>row.car.id===wish);
  if(selected){
    const chance=selected.chance;
    for(const row of rows)row.chance=row===selected?2*chance:row.chance*(100-2*chance)/(100-chance);
  }
  return rows;
}
function legendaryLimit(banner) {
  return banner==='banner-lendas'?50:banner==='banner-destaque'?100:200;
}
function guaranteeFloor(banner,pity) {
  return pity.legendary>=legendaryLimit(banner)-1?3:pity.epic>=9?2:0;
}
function nextBannerRates(banner,wish,pity={}) {
  const rows=bannerRates(banner,wish,pity.mythic);
  const floor=guaranteeFloor(banner,pity);
  if(!floor)return rows;
  const displaced=rows.filter(row=>row.rank<floor).reduce((sum,row)=>sum+row.chance,0);
  const eligible=rows.filter(row=>row.rank===floor).reduce((sum,row)=>sum+row.chance,0);
  return rows.map(row=>({...row,chance:row.rank<floor?0:row.rank===floor&&eligible?row.chance*(1+displaced/eligible):row.chance}));
}
function bannerUnlocked(s,banner){
  const initialGate=(s.catProgress?s.stage:s.maxCircuit)>=3;
  return banner==='banner-lendas'?s.cat>=4:initialGate||s.cat>0;
}
function summon(s,banner,count=1,random=Math.random,options={}){if(!catalog||![1,10].includes(count)||!['banner-padrao','banner-destaque','banner-lendas'].includes(banner))return null;
  const q=init(s);
  if(!bannerUnlocked(s,banner))return null;
  const currency=options.currency||(banner==='banner-lendas'?'fichas':banner==='banner-destaque'?'featured':'cr'),cost=currency==='cr'?summonPrice(s):currency==='gemas'?60:1;
  if(banner==='banner-lendas'&&currency!=='fichas')return null;
  if(!['cr','gemas','fichas','featured'].includes(currency))return null;
  const available=wallet(s,currency)-(currency==='gemas'?Math.max(0,q.paidGems||0):0);
  if(!Number.isFinite(available)||available<cost*count)return null;
  const d={...q,inventory:{...q.inventory,cars:q.inventory.cars.slice()},pity:{...q.pity}};
  const p=d.pity[banner]={epic:0,legendary:0,mythic:0,...q.pity[banner]},results=[];

  for(let k=0;k<count;k++){
    const rows=bannerRates(banner,d.wish,p.mythic),total=rows.reduce((sum,row)=>sum+row.chance,0);
    if(!total)return null;
    const sample=random();
    if(!Number.isFinite(sample)||sample<0||sample>=1)return null;
    let roll=sample*total;
    let {car,rank}=rows.find(row=>(roll-=row.chance)<0)||rows.at(-1);
    const floor=guaranteeFloor(banner,p);
    const target=Math.max(rank,floor);
    const guaranteed=target!==rank;
    if(guaranteed){
      const candidates=rows.filter(row=>row.rank===target);
      const next=random();if(!Number.isFinite(next)||next<0||next>=1)return null;
      let pick=next*candidates.reduce((sum,row)=>sum+row.chance,0);
      car=(candidates.find(row=>(pick-=row.chance)<0)||candidates.at(-1))?.car;
      rank=target;
    }
  if(!car)return null;
  const duplicate=d.inventory.cars.includes(car.id)||owned(s,car),points=duplicate?car.duplicate_pts:0;
  if(duplicate)d.pts+=points;
  else d.inventory.cars.push(car.id);
  p.epic=rank>=2?0:p.epic+1;
  p.legendary=rank>=3?0:p.legendary+1;
  p.mythic=rank>=4?0:Math.min(Number.MAX_SAFE_INTEGER,p.mythic+1);
  results.push({id:car.id,car,duplicate,points,guaranteed})}pay(s,currency,cost*count);
  d.history=[...results.slice().reverse().map(x=>({id:x.id,duplicate:x.duplicate,points:x.points})),...d.history].slice(0,10);
  q.inventory.cars=d.inventory.cars;
  q.pity=d.pity;
  q.pts=d.pts;
  q.history=d.history;
  s.summonPoints=q.pts;
  return results}
function weighted(items,weights,random){const ranks=rarities.filter(r=>items.some(x=>x.rarity===r)),total=ranks.reduce((n,r)=>n+(weights[r]||0),0);let roll=random()*total;const rank=ranks.find(r=>(roll-=weights[r]||0)<0)||ranks[0],pool=items.filter(x=>x.rarity===rank);return pool[Math.floor(random()*pool.length)]}
function slots(s,period,now=Date.now()){const q=init(s),date=period==='daily'?day(now):week(now),random=rng(hash((s.meta.playerId||'local')+date+period+(q.dailyReroll?.day===date?q.dailyReroll.count:0))),groups=period==='daily'?['componentes','boosts','treino','cosmeticos','staff','offer']:['carros','componentes','cosmeticos','chest'],out=[];for(let index=0;index<groups.length;index++){const category=groups[index],key=period+date+index;if(category==='chest'){out.push({id:'weekly-chest',name:'Baú semanal · 60 min CR + 3 fichas',currency:'pts',offerKey:key,offerPrice:150,bundle:true});continue}if(category==='offer'){const base=out.filter(x=>!x.empty);const chosen=base[Math.floor(random()*base.length)];out.push(base.length?{...chosen,offerKey:key,offerPrice:chosen.offerPrice}:{id:'empty-'+index,name:'Novas ofertas ao avançar',empty:true});const last=out.at(-1);last.offerPrice=Math.ceil(last.offerPrice*.8);continue}const choices=catalog.items.filter(x=>(category==='staff'?x.category==='engenheiros':x.category===category)&&unlocked(s,x)&&!owned(s,x)&&x.price!==0&&(category!=='carros'||!x.exclusive&&x.rarity!=='comum')&&(period!=='weekly'||category!=='componentes'||['Elite','Lenda'].includes(x.tier)));const item=category==='cosmeticos'||category==='staff'?weighted(choices,category==='cosmeticos'?{comum:60,raro:28,epico:10,lendario:2}:{comum:55,raro:30,epico:12,lendario:3},random):choices[Math.floor(random()*choices.length)];if(!item){out.push({id:'empty-'+index,name:'Novas ofertas ao avançar',empty:true});continue}const discount=period==='weekly'&&category==='componentes'?.25:category==='componentes'?.15+random()*.15:0;out.push({...item,offerKey:key,discount,currency:category==='carros'?'cr':item.currency,offerPrice:Math.ceil((category==='carros'?25*summonPrice(s):priceInCR(item,s))*(1-discount))})}return out}
function finishTraining(s,skip=false,now=Date.now()){const q=init(s),v=q.training;if(!v)return false;const pilot=teamRoster(s).find(x=>x.id===canonicalStaff(v.pilot)&&x.role==='driver'&&x.owned);if(!pilot||!Number.isFinite(v.xp)||v.xp<0||!Number.isFinite(v.end)||v.end<=0||v.end>now&&(!skip||s.championship.gems<8))return false;if(v.end>now)s.championship.gems-=8;q.staffXp=q.staffXp||{};q.staffXp[pilot.id]=Math.min(1e12,pilot.xp+awardedTrainingXp(s,v.xp));if(q.inventory.staff[pilot.shopId])q.inventory.staff[pilot.shopId].xp=q.staffXp[pilot.id];delete q.training;return true}
function tradeExtra(s,type,now=Date.now()){if(type==='staff')return false;const q=init(s),prices={featured:200,staff:600,chest:150},limits={featured:3,staff:1,chest:1},key='trade:'+week(now)+':'+type,price=prices[type];if(!price||q.pts<price||(q.limits[key]||0)>=limits[type])return false;let target;if(type==='staff'){target=catalog.items.find(x=>x.category==='pilotos'&&x.rarity==='lendario');if(!unlocked(s,target))return false}q.pts-=price;s.summonPoints=q.pts;q.limits[key]=(q.limits[key]||0)+1;if(type==='featured')q.featuredTickets++;if(type==='staff')apply(s,target,now);if(type==='chest'){s.championship.tickets+=3;s.money+=(root.ApexRetention||require('./retention')).income(s)*3600}return true}
function buyOffer(s,offer,now=Date.now()){if(!offer||offer.empty||init(s).limits[offer.offerKey])return{ok:false,reason:'Oferta já comprada'};if(offer.bundle){if(wallet(s,'pts')<offer.offerPrice)return{ok:false,reason:'Saldo insuficiente'};pay(s,'pts',offer.offerPrice);s.money+=(root.ApexRetention||require('./retention')).income(s)*3600;s.championship.tickets+=3;s.shop.limits[offer.offerKey]=1;return{ok:true}}const result=buy(s,offer.id,{currency:offer.currency,price:offer.offerPrice,now});if(result.ok)s.shop.limits[offer.offerKey]=1;return result}
function reroll(s,now=Date.now()){const q=init(s),d=day(now);if(q.dailyReroll?.day===d||wallet(s,'gemas')<10)return false;pay(s,'gemas',10);q.dailyReroll={day:d,count:1};return true}
const api={trainingPreview,trainingMinutes,valid,driver,engineer,teamRoster,equipStaff,trainingProgress,projectCost,buildProject,mythicChance,bannerCars,bannerRates,nextBannerRates,legendaryLimit,bannerUnlocked,finishTraining,tradeExtra,loadCatalog,init,get,day,week,hash,rng,unlocked,priceInCR,summonPrice,wallet,canBuy,buy,owned,componentBonus,carBonus,staffBonus,summon,dailyShop:(s,n)=>slots(s,'daily',n),weeklyShop:(s,n)=>slots(s,'weekly',n),buyOffer,reroll,get catalog(){return catalog},categories,rarities};root.ApexShop=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

