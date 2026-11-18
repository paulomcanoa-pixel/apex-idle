'use strict';
// Only an authorized export of consented game_events. Never print user IDs.
const fs=require('node:fs');
const {hash}=require('../src/shop');
const catalog=require('../src/data/shop-catalog.json');
const sessionEvents=new Set(['session_start','session_resume']);
const actions={tutorial:'tutorial_done',firstCar:'first_car_equip',firstRace:'first_race_finish',firstUpgrade:'first_upgrade_buy',firstStaff:'first_staff_equip',firstAcademy:'first_academy_contract',firstOffline:'first_offline_return'};
const currencies=['CR','Materials','Tickets','Points','Gems','FeaturedTickets','EventTokens'];
const purchaseEvents=new Set(['upgrade_buy','team_buy','item_buy','duplicate_trade','car_unlock','summon']);
const purchaseActions=new Map(Object.entries({
  upgrade:'upgrade_buy',team:'team_buy',buy:'item_buy',trade:'duplicate_trade',build:'car_unlock',
  summon:'summon',gemSummon:'summon',ticketSummon:'summon',offer:'item_buy',tradeExtra:'item_buy',eventBuy:'item_buy'
}).map(([action,event])=>[hash(action),event]));
const catalogCarHashes=new Set(catalog.items.filter(item=>item.category==='carros').map(item=>hash(item.id)));
const usefulEvents=new Set(['car_equip','staff_equip','upgrade_buy','team_buy','summon','journey_claim','academy_contract','queue_join','economy_action','car_unlock','duplicate_trade','item_buy']);
function percentile(values,p){if(!values.length)return null;const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)]}
function dimensions(data={}){return{release:typeof data.release==='string'&&/^\d{4}-\d{2}-\d{2}(?:\.\d{1,3})?$/.test(data.release)?data.release:'legacy',device:['mobile','tablet','desktop','unknown'].includes(data.device)?data.device:'unknown',source:['direct','topidle','share','search','social','other'].includes(data.source)?data.source:'other'}}
function useful(row){return usefulEvents.has(row.event)&&!(row.event==='economy_action'&&row.data.passive)}
function spent(value){return Number.isFinite(value)&&value<0}
function purchases(rows){
  const operations=rows.filter(row=>purchaseEvents.has(row.event));
  const matched=new Set();
  const observed=new Set(operations);
  for(const row of rows){
    if(row.event!=='economy_action'||row.data.passive||!currencies.some(currency=>spent(row.data['delta'+currency])))continue;
    const expected=purchaseActions.get(row.data.action);
    if(!expected&&Number.isSafeInteger(row.data.action))continue;
    if(!expected&&!spent(row.data.deltaCR))continue;
    // A typed event and its balance record are emitted synchronously by the same action.
    // Pair them once, allowing for slightly different timestamps in historical exports.
    const pair=operations.find(op=>!matched.has(op)&&(!expected?op.at===row.at:op.event===expected&&Math.abs(op.at-row.at)<=1000));
    if(pair)matched.add(pair);
    else observed.add(row);
  }
  return observed;
}
function stageOf(data){return Number.isInteger(data?.cat)&&data.cat>=0&&data.cat<6&&Number.isInteger(data?.stage)&&data.stage>=0&&data.stage<12?{key:data.cat+':'+data.stage,category:data.cat,stage:data.stage+1,index:data.cat*12+data.stage}:null}
function route(){return{events:0,newCars:0,unknownCarEvents:0,unknownCars:0,cars:{}}}
function stageRow(stage){return{category:stage.category,stage:stage.stage,players:0,advancedPlayers:0,endOfObservationPlayers:0,sessionWindows:0,withoutUsefulAction:0,censoredWindows:0,censoredWithoutUsefulAction:0,purchases:0,purchaseGaps:[],censoredPurchaseGaps:[]}}
function stageWindows(progression,session,rows,until,complete){
  const buys=purchases(rows);
  let stage=stageOf(session.data),previous=session.at,hasUsefulAction=false;
  function close(at,ended){
    if(!stage){progression.unknownStageWindows++;return}
    const target=progression.stages[stage.key];
    if(ended){target.sessionWindows++;if(!hasUsefulAction)target.withoutUsefulAction++}
    else{target.censoredWindows++;if(!hasUsefulAction)target.censoredWithoutUsefulAction++}
    // The final interval in each stage ends without an observed purchase.
    if(at>previous)target.censoredPurchaseGaps.push((at-previous)/1000);
  }
  for(const row of rows){
    const next=stageOf(row.data);
    if(next&&next.key!==stage?.key){
      if(stage||row.at>previous)close(row.at,true);
      stage=next;
      previous=row.at;
      hasUsefulAction=false;
    }
    hasUsefulAction=hasUsefulAction||useful(row);
    if(buys.has(row)&&stage){
      const target=progression.stages[stage.key];
      target.purchases++;
      target.purchaseGaps.push((row.at-previous)/1000);
      previous=row.at;
    }
  }
  close(until,complete);
}
function progression(c,observed,sessions,now){
  const seen=new Set(),advanced=new Set();let prior=null,last=null;
  for(const row of observed){const stage=stageOf(row.data);if(!stage)continue;const target=c.progression.stages[stage.key]||(c.progression.stages[stage.key]=stageRow(stage));if(!seen.has(stage.key)){target.players++;seen.add(stage.key)}if(prior&&stage.index>prior.index)advanced.add(prior.key);prior=stage;last=stage}
  for(const key of advanced)c.progression.stages[key].advancedPlayers++;
  if(last)c.progression.stages[last.key].endOfObservationPlayers++;
  let cursor=0;
  for(let i=0;i<sessions.length;i++){
    const session=sessions[i],from=session.at,stop=sessions[i+1]?.at??now,until=Math.min(stop,from+30*60000);
    const complete=now>=from+30*60000||!!sessions[i+1];
    while(cursor<observed.length&&observed[cursor].at<from)cursor++;
    const first=cursor;
    while(cursor<observed.length&&(observed[cursor].at<until||(!complete&&observed[cursor].at===until)))cursor++;
    stageWindows(c.progression,session,observed.slice(first,cursor),until,complete);
  }
}
function acquire(c,row){
  const {data,event}=row;
  const car=Number.isSafeInteger(data.car)?data.car:catalogCarHashes.has(data.item)?data.item:null;
  let name,count=1,cars=car===null?[]:[car];
  if(event==='summon'){
    name='gacha';
    count=Number.isSafeInteger(data.newCars)&&data.newCars>=0&&data.newCars<=10?data.newCars:0;
    cars=[...new Set(Array.from({length:count},(_,index)=>data['car'+index]).filter(Number.isSafeInteger))];
  }else if(event==='car_unlock')name='project';
  else if(event==='duplicate_trade')name='trade';
  else if(event==='item_buy'&&car!==null)name='direct';
  else return;
  const target=c.acquisition.routes[name];target.events++;target.newCars+=count;
  for(const id of cars)target.cars[id]=(target.cars[id]||0)+1;
  if(cars.length<count){target.unknownCarEvents++;target.unknownCars+=count-cars.length}
}
function finishProgression(value){return{...value,stages:Object.fromEntries(Object.entries(value.stages).map(([key,row])=>{const {purchaseGaps,censoredPurchaseGaps,...rest}=row;return[key,{...rest,withoutUsefulActionRate:row.sessionWindows?row.withoutUsefulAction/row.sessionWindows:null,purchaseWait:{completedIntervals:purchaseGaps.length,medianSeconds:percentile(purchaseGaps,.5),p90Seconds:percentile(purchaseGaps,.9),censoredIntervals:censoredPurchaseGaps.length,medianObservedLowerBoundSeconds:percentile(censoredPurchaseGaps,.5)}}]}))}}
function empty(cohort,segment){return{cohort,...segment,players:0,d1:{eligible:0,returned:0},d7:{eligible:0,returned:0},d30:{eligible:0,returned:0},...Object.fromEntries(Object.keys(actions).map(k=>[k,0])),timings:Object.fromEntries(Object.keys(actions).map(k=>[k,[]])),sessions:{observed:0,withoutUsefulAction:0},returnPurchases:{returns:0,seconds:[]},economy:{},cars:{},acquisition:{pulls:0,newCars:0,duplicates:0,rarities:[0,0,0,0,0],routes:{gacha:route(),project:route(),trade:route(),direct:route()}},progression:{stages:{},unknownStageWindows:0},online:{joins:0,leaves:0,finishes:0,waitSeconds:[],saveErrors:0}}}
function include(c,u,start,day,now){
  c.players++;const observed=u.events.filter(e=>e.at>=start.at);
  for(const [key,event] of Object.entries(actions)){const first=observed.find(e=>e.event===event);if(first){c[key]++;c.timings[key].push((first.at-start.at)/1000)}}
  for(const n of [1,7,30]){const metric=c['d'+n];if((day+n+1)*86400000<=now){metric.eligible++;if(u.days.has(day+n))metric.returned++}}
  const sessions=observed.filter(e=>sessionEvents.has(e.event));
  progression(c,observed,sessions,now);
  for(let i=0;i<sessions.length;i++){const from=sessions[i].at,until=Math.min(sessions[i+1]?.at||now,from+30*60000);if(now<from+30*60000&&!sessions[i+1])continue;c.sessions.observed++;if(!observed.some(e=>e.at>=from&&e.at<until&&usefulEvents.has(e.event)&&!(e.event==='economy_action'&&e.data.passive)))c.sessions.withoutUsefulAction++}
  for(const returned of observed.filter(e=>e.event==='offline_return')){c.returnPurchases.returns++;const until=Math.min(sessions.find(e=>e.at>returned.at)?.at||Infinity,now,returned.at+30*60000),buy=observed.find(e=>e.at>=returned.at&&e.at<until&&(e.event==='upgrade_buy'||e.event==='team_buy'||e.event==='economy_action'&&!e.data.passive&&e.data.deltaCR<0));if(buy)c.returnPurchases.seconds.push((buy.at-returned.at)/1000)}
  for(const row of observed){
    acquire(c,row);
    if(row.event==='car_equip'&&Number.isSafeInteger(row.data.car)){const key=String(row.data.car),circuit=Number.isInteger(row.data.circuit)&&row.data.circuit>=0&&row.data.circuit<24?String(row.data.circuit):'unknown';const used=c.cars[key]||(c.cars[key]={selections:0,circuits:{}});used.selections++;used.circuits[circuit]=(used.circuits[circuit]||0)+1}
    if(row.event==='summon'){const count=k=>Number.isSafeInteger(row.data[k])&&row.data[k]>=0&&row.data[k]<=10?row.data[k]:0;c.acquisition.pulls+=count('count');c.acquisition.newCars+=count('newCars');c.acquisition.duplicates+=count('duplicates');for(let i=0;i<5;i++)c.acquisition.rarities[i]+=count('rarity'+i)}
    if(row.event==='queue_join')c.online.joins++;if(row.event==='queue_leave')c.online.leaves++;if(row.event==='ranked_finish'){c.online.finishes++;if(Number.isFinite(row.data.queueSeconds)&&row.data.queueSeconds>=0)c.online.waitSeconds.push(row.data.queueSeconds)}if(row.event==='save_error')c.online.saveErrors++;
    if(row.event!=='economy_action')continue;const code=Number.isSafeInteger(row.data.action)?String(row.data.action):'unclassified';if(!c.economy[code])c.economy[code]={events:0,...Object.fromEntries(currencies.map(k=>[k,{sources:0,sinks:0}]))};const account=c.economy[code];account.events++;for(const key of currencies){const delta=row.data['delta'+key];if(Number.isFinite(delta)&&Math.abs(delta)<1e100)account[key][delta>=0?'sources':'sinks']+=Math.abs(delta)}}
}
function finish(c){const selections=Object.values(c.cars).reduce((n,v)=>n+v.selections,0);return{...c,progression:finishProgression(c.progression),carSelectionShare:Object.fromEntries(Object.entries(c.cars).map(([id,v])=>[id,selections?v.selections/selections:0])),online:{joins:c.online.joins,leaves:c.online.leaves,finishes:c.online.finishes,saveErrors:c.online.saveErrors,medianQueueSeconds:percentile(c.online.waitSeconds,.5),p90QueueSeconds:percentile(c.online.waitSeconds,.9)},...Object.fromEntries([1,7,30].map(n=>{const v=c['d'+n];return['d'+n,{...v,rate:v.eligible?v.returned/v.eligible:null}]})),sessions:{...c.sessions,withoutUsefulActionRate:c.sessions.observed?c.sessions.withoutUsefulAction/c.sessions.observed:null},returnPurchases:{returns:c.returnPurchases.returns,purchased:c.returnPurchases.seconds.length,notObserved:c.returnPurchases.returns-c.returnPurchases.seconds.length,medianSeconds:percentile(c.returnPurchases.seconds,.5),p90Seconds:percentile(c.returnPurchases.seconds,.9)},timings:Object.fromEntries(Object.entries(c.timings).map(([key,values])=>[key,{completed:values.length,notObserved:c.players-values.length,completionRate:c.players?values.length/c.players:null,medianSeconds:percentile(values,.5),p90Seconds:percentile(values,.9)}]))}}
function analyze(rows,now=Date.now()){
  if(!Array.isArray(rows))throw Error('Informe um array de eventos exportados.');
  if(!Number.isFinite(now))throw Error('Data de análise inválida.');
  const users=new Map();
  for(const row of rows){if(!row||typeof row!=='object')continue;const id=row.user_id,at=row.data?.at,event=row.event;if(typeof id!=='string'||!id||!Number.isFinite(at)||at<=0||at>now||typeof event!=='string'||!/^[a-z][a-z0-9_]{0,63}$/.test(event))continue;let u=users.get(id);if(!u){u={events:[],days:new Set(),seen:new Set()};users.set(id,u)}const fingerprint=JSON.stringify([event,Object.keys(row.data).sort().map(key=>[key,row.data[key]])]);if(u.seen.has(fingerprint))continue;u.seen.add(fingerprint);u.events.push({event,at,data:row.data});if(sessionEvents.has(event))u.days.add(Math.floor(at/86400000))}
  const cohorts=new Map(),segments=new Map();
  for(const u of users.values()){
    u.events.sort((a,b)=>a.at-b.at);const start=u.events.find(e=>sessionEvents.has(e.event));if(!start)continue;
    const day=Math.floor(start.at/86400000),key=new Date(day*86400000).toISOString().slice(0,10),dims=dimensions(start.data),segmentKey=JSON.stringify([key,dims.release,dims.device,dims.source]);
    if(!cohorts.has(key))cohorts.set(key,empty(key));if(!segments.has(segmentKey))segments.set(segmentKey,empty(key,dims));
    include(cohorts.get(key),u,start,day,now);include(segments.get(segmentKey),u,start,day,now);
  }
  return{method:'Primeira sessão observada por usuário; retorno com session_start/session_resume no dia UTC exato, sem contar corridas automáticas. Sem coortes imaturas. Somente usuários autenticados e consentidos; não representa todos os visitantes. Segmentos fixados na primeira sessão observada. Tempos entre eventos observados (percentil de posto mais próximo), não prova de tempo ativo; ausências permanecem não observadas. Sessões sem ação útil são proxy de abandono em janela de 30 minutos, não churn. Progressão por categoria/etapa observada: fim da exportação não significa abandono. Janelas sem ação útil são proxies; janelas incompletas e intervalos sem compra final ficam censurados. Cada janela de até 30 minutos é dividida nas mudanças observadas de categoria ou etapa. Tempos de compra medem os intervalos dentro de cada trecho. Aquisição separa gacha/projeto/troca/compra direta; eventos antigos sem carro mantêm total da rota e identidade desconhecida. Fontes/sumidouros apenas economy_action; exportação parcial subestima totais.',cohorts:[...cohorts.values()].sort((a,b)=>a.cohort.localeCompare(b.cohort)).map(finish),segments:[...segments.values()].sort((a,b)=>[a.cohort,a.release,a.device,a.source].join('/').localeCompare([b.cohort,b.release,b.device,b.source].join('/'))).map(finish)};
}
if(require.main===module){try{if(!process.argv[2])throw Error('Uso: node scripts/analyze-cohorts.cjs eventos.json');const rows=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));process.stdout.write(JSON.stringify(analyze(rows),null,2)+'\n')}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}}
module.exports={analyze,percentile};
