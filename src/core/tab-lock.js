(function(root){
function acquireTabLock({storage=root.localStorage,locks=root.navigator?.locks,Channel=root.BroadcastChannel,now=Date.now,id=root.crypto?.randomUUID?.()||String(Math.random()),onChange=()=>{},heartbeat=true}={}){
const key='apex-idle-tab-owner';let owner=false,released=false,unlock=null,timer=null,channel=null;
function change(value){if(owner===value)return;owner=value;onChange(value)}
function lease(){const raw=storage.getItem(key);let old;try{old=raw?JSON.parse(raw):null}catch{old=null}if(old&&old.id!==id&&now()-old.at<15000)return false;storage.setItem(key,JSON.stringify({id,at:now()}));return JSON.parse(storage.getItem(key)).id===id}
function renew(){if(released||!owner)return;try{const old=JSON.parse(storage.getItem(key)||'null');if(old?.id!==id){change(false);return}storage.setItem(key,JSON.stringify({id,at:now()}));channel?.postMessage({id,at:now()})}catch{change(false)}}
const ready=locks?new Promise(resolve=>{locks.request('apex-idle',{ifAvailable:true},lock=>{if(!lock||released){resolve(false);return}try{storage.setItem(key,JSON.stringify({id,at:now()}));change(true)}catch{change(false)}resolve(owner);return owner?new Promise(done=>unlock=done):undefined}).catch(()=>{change(false);resolve(false)})}):Promise.resolve().then(()=>{try{change(lease())}catch{change(false)}return owner});
try{if(Channel){channel=new Channel('apex-idle');channel.onmessage=()=>{if(!locks)renew()}}}catch{}
if(heartbeat)timer=setInterval(renew,4000);
function release(){released=true;if(owner){try{if(JSON.parse(storage.getItem(key)||'null')?.id===id)storage.removeItem(key)}catch{}}change(false);unlock?.();clearInterval(timer);channel?.close()}
return{get isOwner(){return owner},ready,release,renew}
}
const api={acquireTabLock};root.ApexTabs=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

