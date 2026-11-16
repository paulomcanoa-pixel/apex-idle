(function(root){
const V=root.ProgressionV2||require('./progression-v2'),fallback=JSON.parse(JSON.stringify(V.B.P));
function validateTuning(data){
  const policy=root.ApexTuningPolicy||require('./tuning-policy');
  return policy.validate(data,fallback);
}
function apply(values){Object.assign(V.B.P,values);V.B.branches.forEach((branch,i)=>Object.assign(branch,i===3?V.B.P.patro:V.B.P.branches[i>3?i-1:i]));root.GameEconomy?.generators.forEach((g,i)=>Object.assign(g,values.gens[i]))}
async function loadTuning(fetcher=root.fetch){try{const r=await fetcher('/tuning.json',{cache:'no-cache'});if(!r.ok)throw Error('Falha HTTP no tuning');const data=validateTuning(await r.json());apply(data.values);return{version:data.version,fallback:false}}catch(error){apply(JSON.parse(JSON.stringify(fallback)));console.warn(error.message);return{version:1,fallback:true,error:error.message}}}
const firstEvents=new Set(['car_equip','staff_equip','upgrade_buy','race_finish','academy_contract','offline_return']);
const onceEvents=new Set(['tutorial_done',...Array.from(firstEvents,event=>'first_'+event)]);
function record(s,event,details={}){
  if(typeof event!=='string'||!/^[a-z][a-z0-9_]{0,63}$/.test(event))return false;
  const journey=root.ApexJourney||(typeof require==='function'?require('./career-journey'):null);journey?.mark(s,event,details);
  if(s.consent?.analytics!==true)return false;
  s.analyticsMilestones=s.analyticsMilestones||{};
  if(onceEvents.has(event)&&s.analyticsMilestones[event])return false;
  const at=Date.now();if(onceEvents.has(event))s.analyticsMilestones[event]=at;
  const safe={...Object.fromEntries(Object.entries(details).filter(([k,v])=>/^[a-z][a-zA-Z0-9_]{0,40}$/.test(k)&&(typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)))),cat:s.cat,stage:s.stage,at,version:2};
  s.telemetry=s.telemetry||[];s.telemetry.push({event,data:safe});s.telemetry=s.telemetry.slice(-200);
  const client=root.ApexSupabase?.client;if(client)client.auth.getSession().then(({data})=>{if(s.consent?.analytics===true&&data.session)client.from('game_events').insert({user_id:data.session.user.id,event,data:safe}).then(({error})=>{if(error)console.warn('Analytics indisponível; evento mantido neste aparelho.')}).catch(()=>{})}).catch(()=>{});
  if(firstEvents.has(event))record(s,'first_'+event,details);
  if(['car_equip','upgrade_buy','race_finish','team_buy'].includes(event)&&journey?.goals(s).slice(0,4).every(g=>g.done))record(s,'tutorial_done');
  return true;
}
function funnel(s){return(s.telemetry||[]).reduce((all,e)=>(all[e.event]=(all[e.event]||0)+1,all),{})}
function report(s){const events=(s.telemetry||[]).filter(x=>x&&typeof x.event==='string'&&Number.isFinite(x.data?.at));return{scope:'Este aparelho · até 200 eventos consentidos, não uma coorte global',enabled:s.consent?.analytics===true,events:events.length,counts:funnel(s),milestones:{...(s.analyticsMilestones||{})},firstEventAt:events[0]?.data.at||null,lastEventAt:events.at(-1)?.data.at||null}}
function exportEvents(s){return{format:'apex-events-v1',scope:'single-device',consented:s.consent?.analytics===true,events:s.consent?.analytics===true?(s.telemetry||[]).map(x=>({event:x.event,data:{...x.data}})):[]}}
const api={validateTuning,loadTuning,record,funnel,report,exportEvents,ads:{available:false,show:async()=>({ok:false,reason:'Em breve · sem SDK de anúncios'})},payments:{available:false,buy:async()=>({ok:false,reason:'Em breve · nenhuma cobrança disponível'})}};root.ApexCommercial=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

