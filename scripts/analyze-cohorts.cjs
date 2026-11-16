'use strict';
// Input is an authorized JSON export of game_events, not browser saves or private credentials.
const fs=require('node:fs');
const sessionEvents=new Set(['session_start','session_resume']);
function analyze(rows,now=Date.now()){
  if(!Array.isArray(rows))throw Error('Informe um array de eventos exportados.');
  const users=new Map();
  for(const row of rows){if(!row||typeof row!=='object')continue;const id=row.user_id,at=row.data?.at,event=row.event;if(typeof id!=='string'||!id||!Number.isFinite(at)||at<=0||at>now||typeof event!=='string')continue;let u=users.get(id);if(!u){u={events:[],days:new Set()};users.set(id,u)}u.events.push({event,at});if(sessionEvents.has(event))u.days.add(Math.floor(at/86400000))}
  const cohorts=new Map();
  for(const u of users.values()){u.events.sort((a,b)=>a.at-b.at);const start=u.events.find(e=>sessionEvents.has(e.event));if(!start)continue;const day=Math.floor(start.at/86400000),key=new Date(day*86400000).toISOString().slice(0,10);let c=cohorts.get(key);if(!c){c={cohort:key,players:0,d1:{eligible:0,returned:0},d7:{eligible:0,returned:0},d30:{eligible:0,returned:0},tutorial:0,firstCar:0,firstRace:0};cohorts.set(key,c)}c.players++;const observed=u.events.filter(e=>e.at>=start.at);if(observed.some(e=>e.event==='tutorial_done'))c.tutorial++;if(observed.some(e=>e.event==='first_car_equip'))c.firstCar++;if(observed.some(e=>e.event==='first_race_finish'))c.firstRace++;for(const n of [1,7,30]){const metric=c['d'+n];if((day+n+1)*86400000<=now){metric.eligible++;if(u.days.has(day+n))metric.returned++}}}
  return{method:'Primeira sessão observada por usuário; retorno com session_start/session_resume no dia UTC exato, sem contar corridas automáticas. Sem coortes imaturas. Somente usuários autenticados e consentidos; não representa todos os visitantes.',cohorts:[...cohorts.values()].sort((a,b)=>a.cohort.localeCompare(b.cohort)).map(c=>({...c,...Object.fromEntries([1,7,30].map(n=>{const v=c['d'+n];return['d'+n,{...v,rate:v.eligible?v.returned/v.eligible:null}]}))}))};
}
if(require.main===module){try{if(!process.argv[2])throw Error('Uso: node scripts/analyze-cohorts.cjs eventos.json');const rows=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));process.stdout.write(JSON.stringify(analyze(rows),null,2)+'\n')}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}}
module.exports={analyze};
