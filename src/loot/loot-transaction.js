(function(root){
'use strict';
const Loot=root.ApexLoot||(typeof require==='function'?require('./loot-model'):null);
function open(s,kind,options){
  const before={money:s.money,loot:s.loot,idle:s.idle&&{totalEarned:s.idle.totalEarned,cycleEarned:s.idle.cycleEarned},meta:s.meta&&{...s.meta}};
  try{
    const result=Loot.open(s,kind,options);
    if(result&&options.persist()!==true)throw Error('Não foi possível salvar a recompensa. A caixa foi preservada.');
    return result;
  }catch(error){
    s.money=before.money;s.loot=before.loot;
    if(before.idle)Object.assign(s.idle,before.idle);
    if(before.meta)s.meta=before.meta;
    throw error;
  }
}
const api={open};root.ApexLootTransaction=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
