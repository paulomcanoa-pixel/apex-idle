(function(root){
let version=0;
function markDirty(){return ++version}
function createRenderer({getVersion=()=>version,render}){let previous=Symbol('initial');return function(){const next=getVersion();if(next===previous)return false;previous=next;render();return true}}
const htmlCache=new WeakMap;
function text(el,value){value=String(value);if(el.textContent!==value)el.textContent=value}
function html(el,value){value=String(value);if(htmlCache.get(el)===value)return;htmlCache.set(el,value);el.innerHTML=value}
function prop(el,key,value){if(el[key]!==value)el[key]=value}
function attr(el,key,value){value=String(value);if(el.getAttribute(key)!==value)el.setAttribute(key,value)}
function style(el,key,value){if(el.style[key]!==value)el.style[key]=value}
function toggle(el,key,value){if(el.classList.contains(key)!==!!value)el.classList.toggle(key,!!value)}
const jobs=new Map;let ticker=null;
function schedule(key,fn,interval=1000,{background=false}={}){
  jobs.set(key,{fn,interval,background,last:Date.now()});
  if(!ticker){ticker=setInterval(()=>{const now=Date.now();for(const job of jobs.values()){
    if(root.document?.hidden&&!job.background)continue;
    if(now-job.last<job.interval)continue;job.last=now;
    try{job.fn()}catch(error){console.error('Atualização periódica:',error)}
  }},250);ticker.unref?.()}
  return()=>{jobs.delete(key);if(!jobs.size&&ticker){clearInterval(ticker);ticker=null}};
}
const api={schedule,markDirty,createRenderer,text,html,prop,attr,style,toggle};root.ApexRender=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

