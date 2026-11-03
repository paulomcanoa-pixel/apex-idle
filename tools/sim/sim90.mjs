// Simulacao 0-90 dias, perfil casual: 3 sessoes de 10 min/dia + offline. Camadas: pista(12/cat) -> categoria(6) -> Temporada (prestigio 1) -> Legado (prestigio 2, so mede disponibilidade).
import * as B from './balance.mjs';
const P=B.P;
export const CAT=['Kart','F4','F3','F2','F1','Lendas'];
export const Q={ // parametros de camadas (fonte unica, copiar para tuning.json)
  stages:12, rScale:[1,22,480,1e4,2.3e5,5e6], cScale:[1,22,480,1e4,2.3e5,5e6], repScale:[0.2,0.3,0.45,0.65,0.9,1.2],
  titleDiv:4, titleOffset:8, titlePI:0.08, titleCR:0.25, lvlCR:0.002, lvlPI:0.003, aiTitle:0.08, aiLvl:0.003,
  xpRace:25, xpPerG:4, xpUp:5, xpMission:50, xpNextA:40, xpNextB:8,
  offlineMaxH:8, offlineRace:0.03, offlineIdle:0.1, dailyRep:10, weeklyRep:40, sessionsPerDay:3, sessionSec:600, sessionHours:[8,13,21],
  prestigeMinGain:4, prestigeMinDay:14, legacyTitles:14,
};
const sc=(c,a)=>a[c];
const dLead=(n)=>B.aiLeaderPI(n);              // forma 1,3 x 1,19^n ... (n 0..11)
const NL=n=>Math.min(24,2*n); // etapa da categoria -> posicao na escada de 24 pistas
const repOpen=(n,c)=>Math.round(B.repToOpen(NL(n))*Q.repScale[c]);
const lapR=(n,c)=>Math.floor(P.r0*P.rg**NL(n)*Q.rScale[c]);
export function sim({days=90,quiet=true}={}){
  const S={day:0,t:0,cr:150,rep:0,n:0,cat:0,titles:0,prest:0,G:0,Gbest:0,xp:0,lvl:1,lv:P.branches.map(()=>0),patL:0,units:P.gens.map(()=>0),lastRate:0,races:0};
  const out=[],events=[],gaps=[]; let lastBuyT=0, activeT=0;
  const xpNext=L=>Q.xpNextA+Q.xpNextB*L;
  const addXp=x=>{S.xp+=x;while(S.xp>=xpNext(S.lvl)){S.xp-=xpNext(S.lvl);S.lvl++}};
  const tMul=()=>({pi:(1+Q.titlePI*S.titles)*(1+Q.lvlPI*S.lvl), cr:(1+Q.titleCR*S.titles)*(1+Q.lvlCR*S.lvl)*(+(process.env.BOOST||1))});
  const idleRate=()=>P.gens.reduce((s,g,i)=>s+g.rate*P.genRateMul*Q.rScale[S.cat]*S.units[i],0)*(1+Q.titleCR*S.titles);
  const genCost=i=>P.gens[i].base*Q.cScale[S.cat]*P.genG**S.units[i];
  function shop(){let bought=0;
    for(let guard=0;guard<2000;guard++){
      let done=false;
      for(let i=P.gens.length-1;i>=0;i--){ if(S.n<P.genUnlock[i]-0)continue; const c=genCost(i); if(c<=S.cr*.35 && c/(P.gens[i].rate*P.genRateMul*Q.rScale[S.cat]*(1+Q.titleCR*S.titles))<=480){S.cr-=c;S.units[i]++;done=true;bought++;break}}
      if(done)continue;
      let best=null;
      P.branches.forEach((b,i)=>{if(S.lv[i]>=100)return;const c=B.upCost(b.base,P.g,S.lv[i])*Q.cScale[S.cat];const sco=c/b.k;if(c<=S.cr&&(!best||sco<best.sco))best={i,c,sco}});
      if(S.patL<100){const c=B.upCost(P.patro.base,P.patro.g,S.patL)*Q.cScale[S.cat],sco=c/.05;if(c<=S.cr&&(!best||sco<best.sco))best={i:-1,c,sco}}
      if(!best)break; S.cr-=best.c; if(best.i<0)S.patL++;else S.lv[best.i]++; bought++; addXp(Q.xpUp);
    } return bought}
  const G=()=>S.cat*Q.stages+S.n;
  function race(){
    const m=tMul(); const pi=B.playerPI(S.lv,0)*m.pi/((1+Q.aiTitle*S.titles)*(1+Q.aiLvl*S.lvl)), place=B.placeOf(pi,NL(S.n));
    const dur=P.laps*B.screenLap((S.n*2+S.cat*3)%24)/B.paceFactor(pi,B.aiLeaderPI(NL(S.n)))+P.overhead;
    const inc=(P.laps*lapR(S.n,S.cat)+Math.floor(lapR(S.n,S.cat)*(11-place)*P.prizeK))*B.patroMult(S.patL)*m.cr;
    const ir=idleRate()*dur; S.cr+=inc+ir; S.lastRate=(inc+ir)/dur; S.rep+=P.pts[place-1]; S.races++;
    addXp(Q.xpRace+Q.xpPerG*(S.G+1)+(11-place)*2); (S.pl??=[]).push(place); if(process.env.DBG2&&S.races%100===0)console.log("r"+S.races,"n",S.n,"pi",pi.toFixed(2),"D",B.aiLeaderPI(NL(S.n)).toFixed(2),"pl",place,"inc",Math.round(inc),"cr",Math.round(S.cr),"lv",S.lv.join("/"),"rep",S.rep,"units",S.units.join("/"),"cat",S.cat); return {dur,place};
  }
  function advance(){
    while(S.rep>=repOpen(S.n+1,S.cat)){
      if(S.n+1>=Q.stages){ // promocao de categoria
        if(S.cat>=5){ if(!S.endAt){S.endAt=S.day; events.push([S.day,'Lendas concluida: modo Desafios/Hall da Fama']);} break }
        lastBuyT=activeT;S.lastRate=0;S.cat++; S.n=0; S.rep=0; S.lv=P.branches.map(()=>0); S.patL=0; S.units=P.gens.map(()=>0); addXp(1000);
        events.push([S.day,'Categoria '+CAT[S.cat]]);
      } else { S.n++; addXp(100) }
      S.G=G(); S.Gbest=Math.max(S.Gbest,S.G+1);
    }
  }
  for(let d=1;d<=days;d++){
    S.day=d; let lastSession=null;
    // diarias/semanais
    S.rep+=Q.dailyRep; addXp(Q.xpMission*3); if(d%7===0){S.rep+=Q.weeklyRep;addXp(300)}
    for(const h of Q.sessionHours){
      const absT=(d-1)*24+h;
      if(lastSession!==null){ const away=Math.min(Q.offlineMaxH,absT-lastSession); S.cr+=away*3600*(Q.offlineIdle*idleRate()+Q.offlineRace*S.lastRate) }
      let el=0,buys=0; if(shop()){lastBuyT=activeT;buys++} advance();
      while(el<Q.sessionSec){ if(shop()){buys++;gaps.push({cat:S.cat,min:(activeT-lastBuyT)/60,d});lastBuyT=activeT}
        const r=race(); el+=r.dur; activeT+=r.dur; advance(); S.G=G();
      }
      if(process.env.DBG&&d>=45&&d<=52)console.log("d"+d,"h"+h,CAT[S.cat],S.n,"cr",S.cr.toExponential(2),"rate",S.lastRate.toExponential(2),"lv",S.lv.join("/"),"buys",buys,"rep",S.rep,"/",repOpen(S.n+1,S.cat)); lastSession=absT+Q.sessionSec/3600; S.dry=buys?0:(S.dry||0)+1; S.maxDry=Math.max(S.maxDry||0,S.dry);
      // prestigio 1
      const tNew=Math.max(0,Math.floor((S.Gbest-Q.titleOffset)/Q.titleDiv));
      if(d>=Q.prestigeMinDay && tNew-S.titles>=Q.prestigeMinGain && tNew>=S.titles*1.35){
        lastBuyT=activeT;S.lastRate=0;S.titles=tNew;S.prest++;S.cat=0;S.n=0;S.rep=0;S.cr=150;S.lv=P.branches.map(()=>0);S.patL=0;S.units=P.gens.map(()=>0);S.G=0;
        events.push([d,`Nova Temporada #${S.prest} (titulos ${S.titles})`]);
      }
      if(!S.legacyAt && S.titles>=Q.legacyTitles){S.legacyAt=d;events.push([d,'Legado disponivel'])}
    }
    S.G=G();
    out.push({day:d,lvl:S.lvl,pista:S.n+1,cat:CAT[S.cat],cats:S.cat,titles:S.titles,prest:S.prest,Gbest:S.Gbest,rate:S.lastRate});
  }
  return {out,events,gaps,S};
}
const fmt=n=>n>=1e12?(n/1e12).toFixed(1)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(1);
if(process.argv[1].endsWith('sim90.mjs')){
  const r=sim({days:90});
  console.log('dia|nivel escuderia|pista|categoria|titulos|temporadas|G max|CR/s');
  for(const d of [1,2,3,5,7,10,14,21,28,35,45,60,75,90]){const o=r.out[d-1];console.log([o.day,o.lvl,o.pista,o.cat,o.titles,o.prest,o.Gbest,fmt(o.rate)].join('|'))}
  console.log('eventos:',r.events.map(e=>`d${e[0]} ${e[1]}`).join(' ; '));
  const byCat={};r.gaps.forEach(g=>{(byCat[g.cat]??=[]).push(g.min)});
  const all=r.gaps.map(g=>g.min).sort((a,b)=>a-b),med=all[Math.floor(all.length/2)];
  console.log('lacuna entre compras (min ativos): mediana',med.toFixed(1),'max',all.at(-1).toFixed(1),'p95',all[Math.floor(all.length*.95)].toFixed(1),' >2x mediana:',all.filter(x=>x>2*med).length,'de',all.length);
  const big=r.gaps.filter(g=>g.min>20).slice(0,12).map(g=>`d${g.d}/${CAT[g.cat]}:${g.min.toFixed(0)}`);console.log('max sessoes consecutivas sem compra:',r.S.maxDry);console.log('maiores lacunas:',big.join(' '));
}
if(process.argv[1].endsWith('sim90.mjs')&&process.env.PL){const r=sim({days:90});const a=r.S.pl;console.log('corridas',a.length,'posicao media',(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),'%P1',(a.filter(x=>x===1).length/a.length*100).toFixed(0))}
