(function(root){
const areas=[
{id:'track',name:'Pista',sections:[]},
{id:'car',name:'Carro',sections:[['Garagem',[['lineup','F1 e piloto'],['setup','Acerto e pintura']]],['Desenvolvimento',[['carShop','Melhorias'],['parts','Peças']]],['Coleção',[['album','Álbum'],['projects','Projetos']]]]},
{id:'team',name:'Equipe',sections:[['Pessoas',[['pilots','Pilotos']]],['Operações',[['operation','Renda da equipe'],['farm','Farm idle']]],['Legado',[['ascension','Ascensão'],['cloudRanking','Ranking de Fragmentos']]]]},
{id:'champ',name:'Carreira',sections:[['Competição',[['championship','Carreira'],['pvp','PvP Ranked'],['rankings','Ranking geral'],['weekly','GP semanal']]],['Calendário',[['circuitShop','Circuitos']]],['Temporada',[['contracts','Contratos'],['idleStats','Conquistas'],['seasonShop','Nova temporada'],['stats','Progresso']]]]},
{id:'store',name:'Loja',sections:[['Invocação',[['summon','Carros e banner exclusivo']]],['Apoios',[['sponsorShop','Patrocínio']]]]}
];
function areaFor(id){if(['track','missions'].includes(id))return'track';for(const area of areas)if(area.sections.some(([,items])=>items.some(([key])=>key===id)))return area.id;return null}
const api={areas,areaFor};root.Navigation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
