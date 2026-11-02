(function(root){
const ops=[{id:'test',name:'Pista de testes',desc:'Voltas de demonstração para clientes.',base:120,rate:24,color:'#b9ee65'},{id:'workshop',name:'Oficina técnica',desc:'Prepare monopostos para outras equipes.',base:1800,rate:90,color:'#70d5ff'},{id:'sponsor',name:'Pavilhão de marcas',desc:'Exposições e ações de patrocinadores.',base:12000,rate:300,color:'#e4adff'}];
const limit=8*3600000;
function valid(s){const f=s?.farm;return f===undefined||!!(f&&Array.isArray(f.levels)&&f.levels.length===3&&f.levels.every(n=>Number.isInteger(n)&&n>=0&&n<=30)&&Number.isFinite(f.bank)&&f.bank>=0&&f.bank<1e15&&Number.isFinite(f.at)&&f.at>0&&Number.isSafeInteger(f.total)&&f.total>=0)}
function init(s,now=Date.now()){if(!s.farm)s.farm={levels:[1,0,0],bank:0,at:now,total:0};return s.farm}
function rate(s,i){const l=init(s).levels[i];return l?ops[i].rate*l*(1+Math.floor(l/5)*.25):0}
function totalRate(s){return ops.reduce((n,o,i)=>n+rate(s,i),0)}
function settle(s,now=Date.now()){const f=init(s,now);const elapsed=Math.min(limit,Math.max(0,now-f.at));f.bank=Math.min(1e14,f.bank+totalRate(s)*elapsed/60000);f.at=Math.max(f.at,now);return elapsed}
function cost(s,i){return Math.ceil(ops[i].base*1.7**init(s).levels[i])}
function buy(s,i,now=Date.now()){if(!Number.isInteger(i)||!ops[i])return false;settle(s,now);const f=init(s),price=cost(s,i);if(f.levels[i]>=30||s.money<price)return false;s.money-=price;f.levels[i]++;return true}
function collect(s,now=Date.now()){settle(s,now);const f=init(s),amount=Math.floor(f.bank);if(amount<1)return 0;f.bank-=amount;f.total+=amount;s.money+=amount;return amount}
const api={ops,valid,init,rate,totalRate,settle,cost,buy,collect};root.IdleFarm=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
