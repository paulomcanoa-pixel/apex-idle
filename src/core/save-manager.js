(function(root){
const KEY='apex-idle-v2';
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=stable(value[key]);return out}return value}
function checksum(state){const copy=JSON.parse(JSON.stringify(state));if(copy.meta)delete copy.meta.checksum;const json=JSON.stringify(stable(copy));let hash=2166136261;for(let i=0;i<json.length;i++){hash^=json.charCodeAt(i);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16).padStart(8,'0')}
function verify(state){return !state.meta?.checksum||state.meta.checksum===checksum(state)}
function seal(state,now=Date.now()){state.meta={...state.meta,createdAt:state.meta?.createdAt||state.savedAt||now,savedAt:now,clockWarnings:state.meta?.clockWarnings||0};state.savedAt=now;state.meta.checksum=checksum(state);return state}
function createManager({storage,validate=()=>true,canWrite=()=>true,now=Date.now,onError=()=>{},key=KEY}){
let rotated=0;
function backupOriginal(raw){if(raw!==null&&storage.getItem(key+'.bak-v1')===null)storage.setItem(key+'.bak-v1',raw)}
function read(){const raw=storage.getItem(key);if(raw===null)return{raw:null,data:null,recovered:false};function parse(text){const state=JSON.parse(text);if(!verify(state)||!validate(state))throw Error('Save inválido ou checksum incorreto');return state}
try{return{raw,data:parse(raw),recovered:false}}catch(error){const previous=storage.getItem(key+'.prev');onError(error);if(previous!==null){try{return{raw,data:parse(previous),recovered:true,original:raw}}catch(fallbackError){onError(fallbackError)}}return{raw,data:null,error,original:raw}}
}
function saveNow(state,{reason='ação',expected}={}){if(!canWrite())return{ok:false,reason:'readonly'};if(!validate(state))throw Error('Estado inválido: '+reason);if(expected!==undefined&&storage.getItem(key)!==expected)return{ok:false,reason:'conflict'};
const instant=now(),raw=storage.getItem(key);
if(state.loot!==undefined&&raw!==null&&storage.getItem(key+'.bak-loot')===null)storage.setItem(key+'.bak-loot',raw);
backupOriginal(raw);
// Preserve the previous valid snapshot before replacing it, at most once per five minutes.
if(raw!==null&&(!rotated||instant-rotated>=300000)){try{const old=JSON.parse(raw);if(verify(old)&&validate(old)){storage.setItem(key+'.prev',raw);rotated=instant}}catch(error){onError(error)}}
seal(state,instant);const payload=JSON.stringify(state);storage.setItem(key,payload);return{ok:true,payload}}
function installAutosave(getState,{target=root,document=root.document,interval=10000,save=state=>saveNow(state,{reason:'automático'})}={}){const flush=()=>save(getState()),hidden=()=>{if(document.hidden)flush()};const timer=setInterval(flush,interval);target.addEventListener('pagehide',flush);target.addEventListener('beforeunload',flush);document.addEventListener('visibilitychange',hidden);return()=>{clearInterval(timer);target.removeEventListener('pagehide',flush);target.removeEventListener('beforeunload',flush);document.removeEventListener('visibilitychange',hidden)}}
return{read,saveNow,saveWithFallback:saveNow,installAutosave}
}
const api={KEY,checksum,verify,seal,createManager};root.ApexSave=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

