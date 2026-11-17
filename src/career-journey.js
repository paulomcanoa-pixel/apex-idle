(function(root){
'use strict';
const definitions=[
  {id:'upgrade',title:'Prepare a Aurora',description:'Compre uma melhoria e veja seu efeito na pista.',target:1,action:'upgrades',reward:{materials:5,passXp:25}},
  {id:'car',title:'Sua primeira dupla',description:'Equipe um F1 histórico na garagem.',target:1,action:'garage',reward:{tickets:1,passXp:25}},
  {id:'race',title:'Primeira bandeirada',description:'Complete uma corrida para conhecer o resultado da sua estratégia.',target:1,action:'track',reward:{materials:10,passXp:50}},
  {id:'team',title:'A equipe continua trabalhando',description:'Contrate uma unidade da Equipe para produzir CR enquanto estiver fora.',target:1,action:'income',reward:{tickets:1,passXp:50}},
  {id:'top',title:'Entre na disputa',description:'Termine uma corrida entre os cinco primeiros.',target:1,action:'garage',reward:{materials:20,passXp:75}},
  {id:'academy',title:'Conquiste um talento',description:'Conclua um contrato na Academia para desenvolver seu plantel.',target:1,action:'academy',reward:{tickets:2,passXp:100}},
  {id:'stage',title:'Amplie o calendário',description:'Alcance a sexta etapa da carreira.',target:6,action:'circuits',reward:{materials:40,passXp:100}},
  {id:'season',title:'O primeiro título da Aurora',description:'Conclua uma Nova Temporada e escolha uma escola de legado.',target:1,action:'season',reward:{tickets:3,passXp:150}}
];
const events={upgrade_buy:'upgrade',upgrade:'upgrade',car_equip:'car',equipCar:'car',race_finish:'race',team_buy:'team',team:'team',academy_contract:'academy',season_reset:'season',season:'season',offline_return:'return'};
const finite=n=>Number.isFinite(n)&&n>=0?n:0;
function init(s){if(!s.journey||typeof s.journey!=='object'||Array.isArray(s.journey))s.journey={};const j=s.journey;if(!j.marks||typeof j.marks!=='object'||Array.isArray(j.marks))j.marks={};if(!Array.isArray(j.claimed))j.claimed=[];j.claimed=[...new Set(j.claimed.filter(id=>definitions.some(g=>g.id===id)))];
  if((s.levels||[]).some(n=>n>0)||s.season?.titles>0)j.marks.upgrade=1;
  const selected=s.shop?.selectedCar||s.garage?.equipped||s.heritage?.equipped;
  const cars=(root.LegendsData||(typeof require==='function'?require('../legends-data'):{})).cars||[];
  if(cars.some(c=>c.id===selected))j.marks.car=1;
  if((s.race?.history||[]).length||s.night?.races>0)j.marks.race=1;
  if((s.idle?.units||[]).some(n=>n>0)||s.season?.titles>0)j.marks.team=1;
  if((s.race?.history||[]).some(r=>r.place<=5)||s.night?.wins>0)j.marks.top=1;
  if((s.academy?.history||[]).some(x=>x.type==='contract'||x.type==='signed')||finite(s.academy?.signed)>0||Object.keys(s.championship?.roster||{}).some(id=>(id.startsWith('real_')&&id!=='real_clark')||['enzo','maya','nico','ines'].includes(id)))j.marks.academy=1;
  j.marks.stage=Math.max(finite(j.marks.stage),finite(s.globalPeak),finite(s.stage)+1);
  j.marks.season=Math.max(finite(j.marks.season),finite(s.season?.titles));return j;
}
function mark(s,event,details={}){const j=init(s),id=Object.hasOwn(events,event)?events[event]:null;if(event==='car_equip'||event==='equipCar')j.marks.carAction=1;if(id)j.marks[id]=Math.max(1,finite(j.marks[id]));if(event==='race_finish'&&details.place>=1&&details.place<=5)j.marks.top=1;return!!id}
function goals(s){const j=init(s);return definitions.map((g,i)=>{const progress=Math.min(g.target,finite(j.marks[g.id]));return{...g,reward:{...g.reward},progress,done:progress>=g.target,claimed:j.claimed.includes(g.id),locked:i>0&&!j.claimed.includes(definitions[i-1].id)}})}
function next(s){return goals(s).find(g=>!g.claimed)||null}
const chapters=[
  {id:'debut',title:'Uma equipe na largada',text:'Rádio Aurora: começamos com um carro e uma ideia. Complete a prova; o resultado vai mostrar onde investir.'},
  {id:'contender',title:'Um lugar no grid',text:'Rádio Aurora: já conhecemos metade do calendário inicial. Agora cada escolha de pneus e dupla vale posições.'},
  {id:'legacy',title:'A equipe fica',text:'Rádio Aurora: o primeiro título entrou na história. O carro evolui, mas nosso legado, coleção e recordes ficam.'},
  {id:'international',title:'Além da primeira fronteira',text:'Rádio Aurora: os novos adversários pedem mais que potência. Vamos adaptar o conjunto a cada circuito.'},
  {id:'legends',title:'Uma história para defender',text:'Rádio Aurora: chegamos à divisão Lendas. A próxima meta é assinar recordes com diferentes carros e conquistar todos os troféus semanais.'}
];
function chapter(s){const peak=finite(s.globalPeak);return chapters[peak>=61?4:peak>=25?3:s.season?.titles>0?2:peak>=6?1:0]}
function takeRadio(s){const j=init(s),c=chapter(s);if(!Array.isArray(j.radioSeen))j.radioSeen=[];if(j.radioSeen.includes(c.id))return null;j.radioSeen.push(c.id);return c.text}
function horizons(s){
  const V=root.ProgressionV2||(typeof require==='function'?require('./progression-v2'):null),g=next(s),stage=(s.stage||0)+1,required=V&&stage<12?Math.max(0,V.openRep(s,stage)-s.rep):0;
  const feedback=s.retention?.lastInsights?.[0]?.action;
  return[
    {id:'now',label:'Agora',title:g?.title||'Refine seu conjunto',text:g?.done?'Sua meta foi alcançada. Recolha a recompensa quando quiser.':feedback||g?.description||'Compare pneus, dupla e especialidade da pista antes da próxima largada.'},
    {id:'next',label:'Em seguida',title:stage<12?'Etapa '+(stage+1)+' do calendário':'Conclua esta divisão',text:stage<12?'Faltam '+required.toLocaleString('pt-BR')+' pontos de reputação para avançar. Cada bandeirada contribui.':'Revise a próxima categoria e o ganho de títulos antes de abrir uma nova temporada.'},
    {id:'long',label:'Seu legado',title:s.season?.titles>0?'Complete a galeria de troféus':'Conquiste o primeiro título',text:s.season?.titles>0?(s.retention?.eventTrophies?.length||0)+'/6 tipos de troféu semanal. Eles e seus recordes atravessam temporadas, sem aumentar o poder dos adversários.':'Alcance a 12ª etapa e abra uma nova temporada. Você mantém carros, pilotos e recordes e escolhe uma escola de legado.'}
  ];
}
function claim(s,id){const g=goals(s).find(x=>x.id===id);if(!g||g.claimed||g.locked||!g.done)return false;
  const C=root.Championship||(typeof require==='function'?require('../championship-model'):null);if(C)C.init(s);
  if(g.reward.tickets&&!s.championship)return false;
  const r=s.retention||(s.retention={drop:{none:0,rare:0,legendary:0},claims:[],passXp:0,passClaimed:[],contracts:[],perfect:[],events:{}});
  init(s).claimed.push(id);if(g.reward.tickets)s.championship.tickets+=g.reward.tickets;s.materials=finite(s.materials)+(g.reward.materials||0);r.passXp=finite(r.passXp)+(g.reward.passXp||0);return true;
}
function valid(s){const j=s?.journey;return j===undefined||!!(j&&typeof j==='object'&&!Array.isArray(j)&&Array.isArray(j.claimed)&&j.claimed.length<=definitions.length&&new Set(j.claimed).size===j.claimed.length&&j.claimed.every(id=>definitions.some(g=>g.id===id))&&j.marks&&typeof j.marks==='object'&&!Array.isArray(j.marks)&&Object.keys(j.marks).length<=32&&Object.values(j.marks).every(n=>Number.isFinite(n)&&n>=0&&n<=1e9)&&(j.radioSeen===undefined||Array.isArray(j.radioSeen)&&j.radioSeen.length<=chapters.length&&new Set(j.radioSeen).size===j.radioSeen.length&&j.radioSeen.every(id=>chapters.some(c=>c.id===id))))}
const api={init,goals,next,mark,claim,chapter,takeRadio,horizons,valid};root.ApexJourney=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
