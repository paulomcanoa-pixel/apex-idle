(function(root){
'use strict';
const options=[
{id:'engineering',name:'Escola de engenharia',description:'Até +4% de desempenho. Priorize o acerto e dispute posições.'},
{id:'academy',name:'Escola de pilotos',description:'Até +30% de XP da escuderia e dos treinos. Desenvolva sua equipe.'},
{id:'operation',name:'Operação eficiente',description:'Até +30% de renda offline, mantendo o limite de tempo.'}
];
function level(s){return Math.min(4,Math.max(0,Math.floor(Number(s.season?.titles)||0)))}
function selected(s){return options.some(o=>o.id===s.season?.legacyPath)?s.season.legacyPath:''}
function status(s){const n=level(s);return{unlocked:n>0,selected:selected(s),level:n,canRespec:n>0,respecCost:0}}
function effects(s){const n=level(s),id=selected(s);return{pi:id==='engineering'?.01*n:0,xp:id==='academy'?.075*n:0,offline:id==='operation'?.075*n:0}}
function select(s,id,respec=false){if(!s.season||!level(s)||!options.some(o=>o.id===id))return false;const old=selected(s);if(old===id||old&&!respec)return false;s.season.legacyPath=id;return true}
function valid(s){return s?.season?.legacyPath===undefined||s.season.legacyPath===''||options.some(o=>o.id===s.season.legacyPath)}
const api={options,nodes:options,enabled:true,status,effects,select,valid};root.ApexTalents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
