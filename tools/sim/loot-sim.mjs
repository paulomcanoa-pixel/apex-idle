// Mesmo modelo, catálogo e fórmula usados pelo jogo. Peças são coleção, sem bônus de PI.
import {createRequire} from 'node:module';
import {run} from './sim.mjs';
import {sim} from './sim90.mjs';
const require=createRequire(import.meta.url),L=require('../../src/loot/loot-model'),V=require('../../src/progression-v2'),Ret=require('../../src/retention');
export function fixture(st={},titles=0){
  const s=V.initial();s.cat=st.cat||0;s.catProgress=st.cat!==undefined;s.stage=st.n||0;s.circuit=Math.min(23,st.n||0);s.season.titles=titles;s.escuderia=st.lvl||1;
  const lv=st.lv||[0,0,0,0,0];s.levels=[lv[0],lv[1],lv[2],st.patL||0,lv[3],lv[4]];s.idle.units=st.units||[0,0,0,0,0,0];return s;
}
export function rewards(seed=42){
  const s={money:0};L.init(s,0);const rng=L.createRng(seed);
  function open(kind,st,titles){let total=0;const income=Ret.income(fixture(st,titles));if(!Number.isFinite(income))throw Error('Renda inválida');if(L.status(s,kind).ready){total=L.open(s,kind,{rng,income,now:0}).credits}return total}
  return{race(st,{place,titles}){L.onRace(s,{place,ers:true,pitWindow:true});return open('online',st,titles)},away(st,seconds){L.creditAway(s,seconds);return open('afk',st,st.titles)},mission(st,weekly){for(let i=0;i<3;i++)L.onMission(s,'daily');if(weekly)L.onMission(s,'weekly');return open('online',st,st.titles)}};
}
export function report(){
  const budget=[];
  for(const n of [2,7,14,23]){
    const income=Ret.income(fixture({n})),online=L.simulate({hours:1000,racesPerHour:60,avgPlace:1,perfect:true,income,seed:42}),afk=L.simulate({hours:1,racesPerHour:0,awayHours:8000,awayStint:8,income,seed:42});
    // 60 corridas/h P1 + 1 ponto perfeito é um limite conservador acima do ritmo normal.
    budget.push({track:n+1,income,onlinePercent:online.creditSeconds/1000/36,afkSecondsPerHour:afk.creditSeconds/8000});
  }
  const baseline=run(),withLoot=run({rewards:rewards()}),progress=[4,9,23].map(n=>({track:n+1,before:baseline.reached[n],after:withLoot.reached[n],changePercent:100*(withLoot.reached[n]/baseline.reached[n]-1)}));
  const casual=sim(),casualLoot=sim({rewards:rewards()}),casualProgress=[5,10,24].map(track=>{const day=r=>r.reached[track]/86400;return{track,before:day(casual),after:day(casualLoot),changePercent:100*(day(casualLoot)/day(casual)-1)}});
  return{creditSeconds:L.CFG.creditSeconds,budget,progress,casualProgress,casualEvents:{before:casual.events,after:casualLoot.events}};
}
if(process.argv[1]?.endsWith('loot-sim.mjs'))process.stdout.write(JSON.stringify(report(),null,2)+'\n');
