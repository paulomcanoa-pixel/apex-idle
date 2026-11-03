// Simulador do jogador "ativo": corre sem parar na pista mais alta, compra com guloseima simples.
import * as B from './balance.mjs';
const {P}=B;
export function run({titles=0, maxHours=40, p=P, quiet=false}={}) {
  const st={t:0,cr:150,rep:0,n:0,lv:p.branches.map(()=>0),patL:0,units:p.gens.map(()=>0),races:0,idleCR:0,raceCR:0,spent:0};
  const log=[], reached=[0]; const posByCircuit={};
  const idleRate=()=>p.gens.reduce((s,g,i)=>s+g.rate*p.genRateMul*st.units[i],0)*(1+0.25*titles);
  const genCost=i=>p.gens[i].base*p.genG**st.units[i];
  function shop(){
    // geradores: payback <= 480 s e <= 35% do caixa
    for(let guard=0;guard<500;guard++){
      let bought=false;
      for(let i=p.gens.length-1;i>=0;i--){ if(st.n<p.genUnlock[i])continue; const c=genCost(i); if(c<=st.cr*0.35 && c/(p.gens[i].rate*p.genRateMul*(1+0.25*titles))<=480){st.cr-=c;st.spent+=c;st.units[i]++;bought=true;break}}
      if(bought)continue;
      // melhorias: menor custo por efeito (patrocinio vale k=.05)
      let best=null;
      p.branches.forEach((b,i)=>{ if(st.lv[i]>=100)return; const c=B.upCost(b.base,p.g,st.lv[i]); const score=c/b.k; if(c<=st.cr&&(!best||score<best.score))best={i,c,score}});
      if(st.patL<100){const c=B.upCost(p.patro.base,p.patro.g,st.patL),score=c/.05; if(c<=st.cr&&(!best||score<best.score))best={i:-1,c,score}}
      if(!best)break; st.cr-=best.c; st.spent+=best.c; if(best.i<0)st.patL++; else st.lv[best.i]++;
    }
  }
  while(st.t<maxHours*3600){
    shop();
    const pi=B.playerPI(st.lv,titles,p), place=B.placeOf(pi,st.n,p), dur=B.raceSeconds(st.n,pi,p);
    const inc=B.raceIncome(st.n,place,st.patL,titles,p), ir=idleRate()*dur;
    st.t+=dur; st.cr+=inc+ir; st.raceCR+=inc; st.idleCR+=ir; st.races++; st.rep+=p.pts[place-1];
    (posByCircuit[st.n]??=[]).push(place);
    while(st.n<23 && st.rep>=B.repToOpen(st.n+1,p)){ st.n++; reached[st.n]=st.t; log.push({rate:(inc+ir)/dur,idle:ir/dur,n:st.n,name:B.NAMES[st.n],t:st.t,races:st.races,pi,place:place,lv:[...st.lv],patL:st.patL}); }
    if(st.n>=23 && st.rep>=B.repToOpen(23,p)+60)break;
  }
  return {st,reached,log,posByCircuit};
}
const fmt=s=>s<90?s.toFixed(0)+' s':s<5400?(s/60).toFixed(1)+' min':(s/3600).toFixed(2)+' h';
if (process.argv[1].endsWith('sim.mjs')) {
  const r=run({});
  console.log('pista|nome|tempo ate abrir|corridas|PI jogador|lider IA|vaga|niveis [mot aer pne pil pit]|patro');
  r.log.forEach(l=>{const pi=l.pi; console.log(`${l.n+1}|CR/s ${l.rate.toFixed(1)}|${l.name}|${fmt(l.t)}|${l.races}|${pi.toFixed(2)}|${B.aiLeaderPI(l.n-1).toFixed(2)}|P${l.place}|${l.lv.join('/')}|${l.patL}`)});
  const s=r.st; console.log('total',fmt(s.t),'corridas',s.races,'renda idle/corrida',(s.idleCR/(s.idleCR+s.raceCR)*100).toFixed(0)+'%');
  console.log('niveis finais',s.lv.join('/'),'patro',s.patL,'unidades',s.units.join('/'));
  for(const t of [1,2]){const q=run({titles:t});console.log('titulos',t,'-> pista 24 em',fmt(q.reached[23]??NaN))}
}
if (process.argv[1].endsWith('sim.mjs')) {
  const r=run({}); console.log('posicao media por pista:', Object.entries(r.posByCircuit).map(([n,a])=>(+n+1)+':P'+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)).join(' '));
}
