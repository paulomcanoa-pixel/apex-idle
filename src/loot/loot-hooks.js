(function(root){
'use strict';
const Loot=root.ApexLoot||(typeof require==='function'?require('./loot-model'):null);
function safe(s,action,fn){
  try{return fn()}catch(error){
    const message='Caixas: não foi possível '+action+'. O restante do jogo continua funcionando.';
    console.error(message,error);s.lootError=message;
    if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new root.CustomEvent('apex-loot-error',{detail:message}));
    return null;
  }
}
function away(s,seconds){return safe(s,'registrar o retorno',()=>Loot.creditAway(s,Math.min(28800,Math.max(0,seconds))))}
function race(s,result){return safe(s,'registrar a corrida',()=>Loot.onRace(s,result))}
function mission(s,kind){return safe(s,'registrar a missão',()=>Loot.onMission(s,kind))}
const api={safe,away,race,mission};root.ApexLootHooks=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
