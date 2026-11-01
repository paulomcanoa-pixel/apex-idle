(function(root){
const categories=[{id:'engine',name:'Motor',stats:[7,0,1]},{id:'aero',name:'Aerodinâmica',stats:[0,8,0]},{id:'suspension',name:'Suspensão',stats:[0,3,5]},{id:'brakes',name:'Freios',stats:[1,5,2]},{id:'gearbox',name:'Câmbio',stats:[6,1,1]},{id:'tyres',name:'Pneus',stats:[0,2,6]}];
const tiers=[{name:'Club',price:250,rep:0,mult:1,color:'#a8c6d5'},{name:'Pro',price:1400,rep:25,mult:2.3,color:'#70b6ff'},{name:'Elite',price:8500,rep:100,mult:4,color:'#d7a1ff'}];
const catalog=categories.flatMap(c=>tiers.map((t,i)=>({id:c.id+'-'+i,slot:c.id,name:c.name+' '+t.name,price:t.price,rep:t.rep,color:t.color,tier:i,stats:c.stats.map(v=>Math.round(v*t.mult))})));
function inventory(s){return s.partsInventory||[]}
function installed(s,slot){return catalog.find(p=>p.id===(s.partsEquipped||{})[slot])||null}
function stats(s){return categories.reduce((sum,c)=>{const p=installed(s,c.id);return sum.map((v,i)=>v+(p?p.stats[i]:0))},[0,0,0])}
function factor(s){const p=stats(s),weights=[[.25,.4,.35],[.33,.34,.33],[.6,.2,.2]][s.circuit]||[.33,.34,.33];return 1+p.reduce((v,n,i)=>v+n*weights[i],0)*.003}
function validate(s){const inv=s.partsInventory===undefined?[]:s.partsInventory,e=s.partsEquipped===undefined?{}:s.partsEquipped;return Array.isArray(inv)&&inv.length<=catalog.length&&new Set(inv).size===inv.length&&inv.every(id=>catalog.some(p=>p.id===id))&&e!==null&&typeof e==='object'&&!Array.isArray(e)&&Object.entries(e).every(([slot,id])=>categories.some(c=>c.id===slot)&&inv.includes(id)&&catalog.some(p=>p.id===id&&p.slot===slot))}
function buy(s,id){const p=catalog.find(p=>p.id===id);if(!p||!validate(s)||inventory(s).includes(id)||s.money<p.price||s.rep<p.rep)return false;s.money-=p.price;s.partsInventory=[...inventory(s),id];return true}
function equip(s,id,locked=false){const p=catalog.find(p=>p.id===id);if(locked||s.running||s.raceInProgress||!p||!validate(s)||!inventory(s).includes(id))return false;s.partsEquipped={...(s.partsEquipped||{}),[p.slot]:id};return true}
function remove(s,slot,locked=false){if(locked||s.running||s.raceInProgress||!validate(s)||!categories.some(c=>c.id===slot))return false;const e={...(s.partsEquipped||{})};delete e[slot];s.partsEquipped=e;return true}
const api={categories,catalog,tiers,inventory,installed,stats,factor,validate,buy,equip,remove};root.PartsShop=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

