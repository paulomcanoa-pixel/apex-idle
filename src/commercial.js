(function(root){
const V=root.ProgressionV2||require('./progression-v2'),fallback=JSON.parse(JSON.stringify(V.B.P));
function validateTuning(data){
  const policy=root.ApexTuningPolicy||require('./tuning-policy');
  return policy.validate(data,fallback);
}
function apply(values){Object.assign(V.B.P,values);V.B.branches.forEach((branch,i)=>Object.assign(branch,i===3?V.B.P.patro:V.B.P.branches[i>3?i-1:i]));root.GameEconomy?.generators.forEach((g,i)=>Object.assign(g,values.gens[i]))}
async function loadTuning(fetcher=root.fetch){try{const r=await fetcher('/tuning.json',{cache:'no-cache'});if(!r.ok)throw Error('Falha HTTP no tuning');const data=validateTuning(await r.json());apply(data.values);return{version:data.version,fallback:false}}catch(error){apply(JSON.parse(JSON.stringify(fallback)));console.warn(error.message);return{version:1,fallback:true,error:error.message}}}
function record(s,event,details={}){if(s.consent?.analytics!==true)return false;const safe={cat:s.cat,stage:s.stage,at:Date.now(),...Object.fromEntries(Object.entries(details).filter(([,v])=>typeof v==='number'||typeof v==='boolean'))};s.telemetry=s.telemetry||[];s.telemetry.push({event,data:safe});s.telemetry=s.telemetry.slice(-200);const client=root.ApexSupabase?.client;if(client)client.auth.getSession().then(({data})=>{if(s.consent?.analytics===true&&data.session)client.from('game_events').insert({user_id:data.session.user.id,event,data:safe}).then(({error})=>{if(error)console.warn('Analytics indisponível; evento mantido neste aparelho.')}).catch(()=>{})}).catch(()=>{});return true}
function funnel(s){return(s.telemetry||[]).reduce((all,e)=>(all[e.event]=(all[e.event]||0)+1,all),{})}
const api={validateTuning,loadTuning,record,funnel,ads:{available:false,show:async()=>({ok:false,reason:'Em breve · sem SDK de anúncios'})},payments:{available:false,buy:async()=>({ok:false,reason:'Em breve · nenhuma cobrança disponível'})}};root.ApexCommercial=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

