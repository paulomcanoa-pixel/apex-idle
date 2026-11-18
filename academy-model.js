(function(root){
const D=typeof LegendsData!=='undefined'?LegendsData:require('./legends-data.js');
const L=typeof Legends!=='undefined'?Legends:require('./legends-model.js');
const fictional=[['lia','Lia Monteiro',0,'#a9bac8'],['enzo','Enzo Vale',1,'#70caff'],['maya','Maya Veloz',2,'#c6a0ff'],['nico','Nico Solari',3,'#ffd07a'],['ines','Inês Costa',3,'#ffd07a']].map(([id,name,rarity,color])=>({id,name,rarity,color,cars:[]}));
const drivers=[...D.drivers,...fictional],get=id=>drivers.find(d=>d.id===id);
const trials={
  wet:{label:'Controle na chuva',description:'Termine entre os cinco primeiros em uma corrida com chuva.',test:({event,place})=>event==='rain'&&place<=5},
  management:{label:'Gestão de pneus',description:'Faça uma parada dentro da janela e passe no máximo 1 s com pneus gastos.',test:({trial})=>trial?.pitWindow===true&&Number.isInteger(trial.pitStops)&&trial.pitStops>=1&&Number.isFinite(trial.wornSeconds)&&trial.wornSeconds>=0&&trial.wornSeconds<=1},
  qualifying:{label:'Volta rápida',description:'Registre uma melhor volta de até 102% do tempo de referência do circuito.',test:({trial})=>Number.isFinite(trial?.bestLap)&&trial.bestLap>0&&Number.isFinite(trial.referenceLap)&&trial.referenceLap>0&&trial.bestLap<=trial.referenceLap*1.02},
  race:{label:'Ataque no pelotão',description:'Ganhe pelo menos duas posições ou vença após largar em primeiro ou segundo.',test:({trial,place})=>Number.isInteger(trial?.startPlace)&&trial.startPlace>=1&&trial.startPlace<=10&&(trial.startPlace-place>=2||trial.startPlace<=2&&place===1)}
};
const trialProfiles={lia:'qualifying',enzo:'race',maya:'management',nico:'race',ines:'management',real_mansell:'race',real_verstappen:'race'};
function trialFor(d){
  const key=trialProfiles[d.id]||Object.keys(trials).reduce((best,key)=>d.skills[key]>d.skills[best]?key:best);
  return trials[key];
}
const missions=[{id:'scout',name:'Olheiro no paddock',minutes:30,fragments:4,licence:2,desc:'Uma sessão curta para conhecer o candidato.'},{id:'sim',name:'Programa de simulador',minutes:120,fragments:10,licence:3,desc:'Telemetria e trabalho técnico com a academia.'},{id:'endurance',name:'Observação de temporada',minutes:360,fragments:22,licence:5,desc:'Preparação longa: maior rendimento por expedição.'}];
const day=now=>Math.floor((now-10800000)/86400000),int=(n,max=1e12)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
function validProject(p){
  return !!(p&&['fragments','races','podiums','wet','combos'].every(k=>int(p[k],100000))&&
    (p.trialVersion===undefined?p.trials===undefined:p.trialVersion===1&&int(p.trials,100000)));
}
function init(s,now=Date.now()){if(!s.academy)s.academy={v:1,focus:'',licence:0,day:day(now),starts:0,projects:{},assignment:null,contract:null};return s.academy}
function project(a,id){return a.projects[id]||(a.projects[id]={fragments:0,races:0,podiums:0,wet:0,combos:0})}
function calendar(a,now){if(day(now)>a.day){a.day=day(now);a.starts=0}}
function valid(s){const a=s?.academy;if(a===undefined)return true;const task=(v,contract)=>v===null||!!(v&&get(v.id)&&int(v.started,Number.MAX_SAFE_INTEGER)&&int(v.ends,Number.MAX_SAFE_INTEGER)&&v.ends>v.started&&(contract?typeof v.copy==='boolean':missions.some(m=>m.id===v.mission)));
return !!(a&&a.v===1&&(a.focus===''||get(a.focus))&&int(a.licence,40)&&int(a.day)&&int(a.starts,3)&&a.projects&&typeof a.projects==='object'&&!Array.isArray(a.projects)&&Object.keys(a.projects).length<=drivers.length&&Object.entries(a.projects).every(([id,p])=>get(id)&&validProject(p))&&task(a.assignment,false)&&task(a.contract,true)&&!(a.assignment&&a.contract)&&(!a.assignment||a.assignment.id===a.focus)&&(!a.contract||a.contract.id===a.focus))}
function choose(s,id,now=Date.now()){
  const a=init(s,now);
  if(!get(id)||a.assignment||a.contract)return false;
  const isNew=!a.projects[id];
  a.focus=id;
  const p=project(a,id);
  if(isNew&&s.version===2&&!s.championship?.roster?.[id]){
    p.trialVersion=1;
    p.trials=0;
  }
  return true;
}
function requirements(s,id){
  const d=get(id);
  if(!d)return null;
  const r=d.rarity,owned=!!s.championship?.roster?.[id];
  const trial=s.version===2&&!owned&&s.academy?.projects[id]?.trialVersion===1?trialFor(d):null;
  const requirements={copy:owned,fragments:(owned?[6,10,18,30]:[12,30,70,140])[r],licence:(owned?[0,0,0,0]:[0,10,25,40])[r],races:(owned?[0,0,0,0]:[6,24,60,120])[r],podiums:(owned?[0,0,0,0]:[0,3,10,24])[r],wet:owned||trial?0:[0,1,3,6][r],combos:(owned?[0,0,0,0]:[0,4,12,30])[r],credits:Math.floor([2500,10000,50000,150000][r]*(owned?.25:1)),minutes:(owned?[10,30,60,120]:[10,60,180,360])[r]};
  if(trial)Object.assign(requirements,{trials:[1,1,3,6][r],trialLabel:trial.label,trialDescription:trial.description});
  return requirements;
}
function ready(s,id){const a=init(s),r=requirements(s,id),p=a.projects[id];return !!(r&&p&&a.licence>=r.licence&&s.money>=r.credits&&['fragments','races','podiums','wet','combos'].every(k=>p[k]>=r[k])&&(!r.trials||p.trials>=r.trials))}
function start(s,mission,now=Date.now()){const a=init(s,now),m=missions.find(m=>m.id===mission);calendar(a,now);if(!m||!get(a.focus)||a.assignment||a.contract||a.starts>=3)return false;project(a,a.focus);a.starts++;a.assignment={id:a.focus,mission,started:now,ends:now+m.minutes*60000};return true}
function collect(s,now=Date.now()){const a=init(s,now),v=a.assignment;if(!v||now<v.ends)return false;const m=missions.find(m=>m.id===v.mission),p=project(a,v.id);p.fragments=Math.min(100000,p.fragments+m.fragments);a.licence=Math.min(40,a.licence+m.licence);a.assignment=null;return true}
function record(s,result){
  const a=s.academy,d=get(a?.focus);
  if(!d||!result||!Number.isInteger(result.place)||result.place<1||result.place>(s.version===2?10:20))return false;
  const p=project(a,d.id);
  p.races=Math.min(100000,p.races+1);
  if(result.place<=3)p.podiums=Math.min(100000,p.podiums+1);
  const wet=s.version===2?result.event==='rain':result.round%6===5;
  const affinity=s.version===2?result.affinity===true:L.affinity(s.championship?.car,s.championship?.driver);
  if(wet)p.wet=Math.min(100000,p.wet+1);
  if(affinity)p.combos=Math.min(100000,p.combos+1);
  if(s.version===2&&p.trialVersion===1&&!s.championship?.roster?.[d.id]&&trialFor(d).test(result)){
    p.trials=Math.min(100000,p.trials+1);
  }
  return true;
}
function negotiate(s,now=Date.now()){const a=init(s,now),r=requirements(s,a.focus);if(a.assignment||a.contract||!s.championship||!ready(s,a.focus))return false;project(a,a.focus).fragments-=r.fragments;s.money-=r.credits;a.contract={id:a.focus,copy:r.copy,started:now,ends:now+r.minutes*60000};return true}
function sign(s,now=Date.now()){const a=init(s,now),v=a.contract;if(!v||now<v.ends||!s.championship)return false;const c=s.championship;if(c.roster[v.id])c.roster[v.id].copies=Math.min(100000,c.roster[v.id].copies+1);else c.roster[v.id]={stars:0,copies:0};a.contract=null;if(s.version===2){const J=root.ApexJourney||(typeof require==='function'?require('./src/career-journey'):null);J?.mark(s,'academy_contract')}return v.id}
const api={drivers,get,missions,day,init,valid,choose,requirements,ready,start,collect,record,negotiate,sign};root.DriverAcademy=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
